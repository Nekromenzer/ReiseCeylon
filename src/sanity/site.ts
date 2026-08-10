/**
 * Destinations, journeys and contact details, read from Sanity — in whichever
 * language the page is being rendered in.
 *
 * Every getter takes a locale and resolves each field on its own. Which fallback
 * chain a field uses depends on whether we ship a translation for it:
 *
 *   Fields with a translated default — the intro, the highlights, the
 *   good-to-know, the SEO pair, the region and the note:
 *     1. the studio document, in the requested language   (`pickExact`)
 *     2. the atlas record, for anything factual
 *     3. the translated default in `@/lib/localised`
 *   English from the studio is deliberately *not* in that chain: on a German
 *   page a German default beats an English sentence, and those English sentences
 *   were generated from the same defaults in the first place.
 *
 *   Fields with no translation to fall back on — the name, the image alt text,
 *   the stated length, the journal:
 *     1. the studio document, in the requested language
 *     2. the studio document, in English                  (`pickLocale`)
 *   Here English is better than a blank, and a place name is a proper noun that
 *   was never meant to change with the language.
 *
 * Either way a studio translation wins the moment an editor writes one, and the
 * site is completely translated before anyone has written any. Images are
 * resolved to plain url strings here so the page components stay unaware of
 * Sanity.
 */
import type { Image } from 'sanity';
import { defineQuery } from 'next-sanity';
import { art } from '@/lib/content';
import { buildRoute, formatDuration, formatKm, splitIntoDays, waypointsFor } from '@/lib/journey';
import { staticCopy, type StaticCopy } from '@/lib/localised';
import { journeyPackages, packageDurations, packageStops, parseDays } from '@/lib/packages';
import { contactDefaults, type Highlight, type Stage } from '@/lib/defaults';
import {
  atlasRecordFor,
  defaultFeaturedSlugs,
  googleMapsUrlFor,
  hasSamplePhotograph,
  imageForSlug,
  openStreetMapUrlFor,
  places,
  type Place,
  type Precision
} from '@/lib/places';
import { getClient } from './client';
import { isSanityConfigured } from './env';
import { urlForImage } from './image';
import { pickExact, pickLocale, pickLocaleOrNull, type MaybeLocalised } from './locale-field';

export type { Highlight, Stage };

export type Destination = {
  slug: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  region: string;
  note: string;
  image: string;
  imageAlt: string;
  introHeading: string;
  introCopy: string;
  highlights: Highlight[];
  goodToKnowHeading: string;
  goodToKnowCopy: string;
  /* The factual half — kept in step with public/json by the sync script. */
  categoryId: string;
  category: string;
  province: string;
  /** The province name translated, for display; `province` stays the raw key. */
  provinceLabel: string;
  district: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  precision: Precision;
  precisionNote: string;
  googleMapsUrl: string | null;
  openStreetMapUrl: string | null;
  featured: boolean;
};

export type Tour = {
  slug: string;
  title: string;
  days: string;
  /** The number behind `days` — what the duration filter on /journeys reads. */
  durationDays: number;
  route: string;
  price: string;
  image: string;
  imageAlt: string;
  note: string;
  introHeading: string;
  introCopy: string;
  itinerary: Stage[];
  includedHeading: string;
  includedCopy: string;
  /** Atlas slugs in travel order — the route drawn on the map. */
  stops: string[];
};

export type SocialLink = { label: string; url: string };

export type ContactDetails = {
  email: string;
  phone: string | null;
  whatsapp: string | null;
  location: string;
  address: string | null;
  responseTime: string;
  social: SocialLink[];
};

/**
 * Every place in the atlas, dressed with the translated default copy. This is
 * what the site renders before anything has been synced to Sanity, and what it
 * falls back to if the dataset is unreachable — so /destinations is never empty
 * in any language.
 */
function destinationFromPlace(place: Place, copy: StaticCopy): Destination {
  return {
    slug: place.slug,
    name: place.name,
    seoTitle: copy.seoTitle(place.name),
    seoDescription: copy.seoDescription(place.name, place.district),
    region: copy.region(place.province),
    note: copy.note(place),
    image: place.image,
    imageAlt: `${place.name}, ${place.district}`,
    introHeading: copy.destination.introHeading,
    introCopy: copy.destination.introCopy(place.name),
    highlights: copy.highlights,
    goodToKnowHeading: copy.destination.goodToKnowHeading,
    goodToKnowCopy: copy.destination.goodToKnowCopy,
    categoryId: place.categoryId,
    category: copy.categoryName(place.categoryId) || place.category,
    province: place.province,
    provinceLabel: copy.province(place.province),
    district: place.district,
    city: place.city,
    latitude: place.latitude,
    longitude: place.longitude,
    precision: place.precision,
    precisionNote: copy.precision(place.precision),
    googleMapsUrl: place.googleMapsUrl,
    openStreetMapUrl: place.openStreetMapUrl,
    featured: defaultFeaturedSlugs.includes(place.slug)
  };
}

/**
 * A day trip has no business showing the twelve-day timeline in the default
 * stages, so a package that has never been written up in the studio describes
 * itself from its own stops instead: the route split across its days, with the
 * real driving figure for each one. Honest, specific to the journey, and stated
 * in the reader's language.
 */
function itineraryFromStops(slugs: string[], days: number, copy: StaticCopy): Stage[] {
  const stops = waypointsFor(slugs, places);
  if (stops.length === 0) return copy.stages;

  return splitIntoDays(stops, days).map((group, index, all) => {
    const leadIn = index > 0 ? all[index - 1][all[index - 1].length - 1] : null;
    const driving = buildRoute(leadIn ? [leadIn, ...group] : group);

    return {
      period: all.length === 1 ? copy.stage.oneDay : copy.stage.day(index + 1),
      title: group.map((stop) => stop.name).join(' · '),
      copy:
        driving.legs.length > 0
          ? copy.stage.roadAndDriving(formatKm(driving.roadKm), formatDuration(driving.minutes))
          : copy.stage.fullDayAt(group[0].name)
    };
  });
}

function fallbackToursFor(copy: StaticCopy): Tour[] {
  return journeyPackages.map((journey) => {
    const translated = copy.packageCopy(journey.slug);
    return {
      ...journey,
      title: translated?.title || journey.title,
      /* “3 days” is prose, not a number — it is stated in the reader's language
         rather than carried over from the English package definition. */
      days: copy.days(journey.durationDays),
      route: translated?.route || journey.route,
      note: translated?.note || journey.note,
      imageAlt: translated?.title || journey.title,
      itinerary: itineraryFromStops(journey.stops, journey.durationDays, copy),
      introHeading: copy.tour.introHeading,
      introCopy: copy.tour.introCopy,
      includedHeading: copy.tour.includedHeading,
      includedCopy: copy.tour.includedCopy
    };
  });
}

/**
 * Localised fields are selected whole and resolved in TypeScript — GROQ has no
 * dynamic attribute access, so `note[$locale]` cannot be written. See
 * `./locale-field`.
 */
const destinationFields = /* groq */ `
  "slug": slug.current, name, seoTitle, seoDescription, region, note, image,
  introHeading, introCopy,
  "highlights": coalesce(highlights[]{title, copy}, []),
  goodToKnowHeading, goodToKnowCopy,
  categoryId, province, district, city, precision,
  "status": coalesce(status, "published"),
  "featured": coalesce(featured, false),
  "latitude": location.lat, "longitude": location.lng
`;

/* Hidden documents are read too — see getDestinations, which needs to know a slug
   was deliberately taken down before it offers the atlas record in its place. */
const destinationsQuery = defineQuery(`
  *[_type == "destination" && defined(slug.current)] | order(name asc) {${destinationFields}}
`);

const featuredDestinationsQuery = defineQuery(`
  *[_type == "destination" && defined(slug.current) && coalesce(status, "published") == "published" && featured == true]
  | order(order asc, name asc)[0...5] {${destinationFields}}
`);

const toursQuery = defineQuery(`
  *[_type == "tour" && defined(slug.current)] | order(order asc, title asc) {
    "slug": slug.current, title, days, durationDays, route, price, image, note,
    introHeading, introCopy,
    "itinerary": coalesce(itinerary[]{period, title, copy}, []),
    includedHeading, includedCopy,
    "stops": coalesce(stops, [])
  }
`);

const contactQuery = defineQuery(`
  *[_type == "siteSettings"][0] {
    email, phone, whatsapp, location, address, responseTime,
    "social": coalesce(social[]{label, url}, [])
  }
`);

type RawImage = Image & { alt?: MaybeLocalised };

async function fetchSite<T>(query: string, fallback: T): Promise<T> {
  if (!isSanityConfigured) return fallback;
  try {
    return await getClient().fetch<T>(query, {}, { next: { tags: ['site'], revalidate: 3600 } });
  } catch (error) {
    console.error('[sanity] site fetch failed', error);
    return fallback;
  }
}

type LocalisedHighlight = { title: MaybeLocalised; copy: MaybeLocalised };

type DestinationRow = {
  slug: string;
  name: MaybeLocalised;
  seoTitle: MaybeLocalised;
  seoDescription: MaybeLocalised;
  region: MaybeLocalised;
  note: MaybeLocalised;
  introHeading: MaybeLocalised;
  introCopy: MaybeLocalised;
  highlights: LocalisedHighlight[];
  goodToKnowHeading: MaybeLocalised;
  goodToKnowCopy: MaybeLocalised;
  categoryId: string;
  province: string;
  district: string;
  city: string;
  precision: Precision;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
  image: RawImage | null;
  status?: 'published' | 'hidden';
};

/**
 * Studio documents carry only what an editor typed. Everything else is resolved
 * here, field by field: the studio wins wherever it holds a value in the reader's
 * language, English fills in for a field nobody has translated yet, the atlas
 * fills any location field left empty, and the translated defaults fill the rest.
 *
 * The merge is per field rather than per document on purpose. A destination
 * created or edited by hand in the studio — before `npm run sync:destinations`
 * has ever run, or with the location group left untouched — still gets its
 * category, province, coordinates, map and nearby rail from the atlas.
 */
function resolveDestination(row: DestinationRow, copy: StaticCopy): Destination {
  const atlas = atlasRecordFor(row.slug);
  const { locale } = copy;

  const name = pickLocale(row.name, locale) || atlas?.name || row.slug;
  const categoryId = row.categoryId || atlas?.categoryId || '';
  const province = row.province || atlas?.province || '';
  const district = row.district || atlas?.district || '';
  const city = row.city || atlas?.city || '';
  const latitude = typeof row.latitude === 'number' ? row.latitude : (atlas?.latitude ?? null);
  const longitude = typeof row.longitude === 'number' ? row.longitude : (atlas?.longitude ?? null);
  const hasPoint = latitude !== null && longitude !== null;
  const precision = row.precision ?? atlas?.precision ?? 'exact';

  const image = row.image?.asset
    ? urlForImage(row.image as Image, 1600, 1100)
    : hasSamplePhotograph(row.slug)
      ? imageForSlug(row.slug)
      : (atlas?.image ?? art.fortress);

  /* All or nothing: a half-translated highlight list reads worse than the
     translated defaults, so a set with any untranslated entry is discarded. */
  const translatedHighlights = row.highlights.map((highlight) => ({
    title: pickExact(highlight.title, locale),
    copy: pickExact(highlight.copy, locale)
  }));
  const highlights = translatedHighlights.every((highlight) => highlight.title.length > 0)
    ? translatedHighlights
    : [];

  return {
    slug: row.slug,
    name,
    image,
    imageAlt: pickLocale(row.image?.alt, locale) || name,
    seoTitle: pickExact(row.seoTitle, locale) || copy.seoTitle(name),
    seoDescription:
      pickExact(row.seoDescription, locale) || copy.seoDescription(name, district || province),
    categoryId,
    category: copy.categoryName(categoryId) || atlas?.category || '',
    province,
    provinceLabel: copy.province(province),
    district,
    city,
    latitude,
    longitude,
    region: pickExact(row.region, locale) || copy.region(province),
    note: pickExact(row.note, locale) || copy.note({ categoryId, city, district }),
    introHeading: pickExact(row.introHeading, locale) || copy.destination.introHeading,
    introCopy: pickExact(row.introCopy, locale) || copy.destination.introCopy(name),
    highlights: highlights.length > 0 ? highlights : copy.highlights,
    goodToKnowHeading:
      pickExact(row.goodToKnowHeading, locale) || copy.destination.goodToKnowHeading,
    goodToKnowCopy: pickExact(row.goodToKnowCopy, locale) || copy.destination.goodToKnowCopy,
    precision,
    precisionNote: copy.precision(precision),
    featured: row.featured,
    googleMapsUrl: hasPoint ? googleMapsUrlFor(latitude, longitude) : null,
    openStreetMapUrl: hasPoint ? openStreetMapUrlFor(latitude, longitude) : null
  };
}

/**
 * Sanity first, atlas second. Anything the studio holds wins; every atlas place
 * the studio has never heard of is added alongside it, so /destinations is
 * complete whether or not `npm run sync:destinations` has been run yet.
 * A destination set to Hidden in the studio stays hidden — the atlas record does
 * not creep back in behind it.
 */
export async function getDestinations(locale: string): Promise<Destination[]> {
  const copy = await staticCopy(locale);
  const rows = await fetchSite<DestinationRow[]>(destinationsQuery, []);
  const fallback = places.map((place) => destinationFromPlace(place, copy));
  if (rows.length === 0) return fallback;

  const known = new Set(rows.map((row) => row.slug));
  return [
    ...rows.filter((row) => row.status !== 'hidden').map((row) => resolveDestination(row, copy)),
    ...fallback.filter((place) => !known.has(place.slug))
  ].sort((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * The five that lead the homepage rail. The rail is built for exactly five, so if
 * the studio marks fewer, the rest are topped up from the atlas defaults and then
 * from the list itself — it is never short.
 */
export async function getFeaturedDestinations(locale: string): Promise<Destination[]> {
  const copy = await staticCopy(locale);
  const marked = await fetchSite<DestinationRow[]>(featuredDestinationsQuery, []);
  const destinations = await getDestinations(locale);
  const chosen: Destination[] = marked.map((row) => resolveDestination(row, copy));
  const taken = new Set(chosen.map((place) => place.slug));

  const topUp = (candidates: Destination[]) => {
    for (const place of candidates) {
      if (chosen.length === 5) return;
      if (taken.has(place.slug)) continue;
      chosen.push(place);
      taken.add(place.slug);
    }
  };

  topUp(destinations.filter((place) => place.featured));
  topUp(defaultFeaturedSlugs.flatMap((slug) => destinations.filter((place) => place.slug === slug)));
  topUp(destinations);

  return chosen;
}

/**
 * Reads from the same cached list as /destinations rather than its own query, so
 * a destination hidden in the studio disappears from the direct url too.
 */
export async function getDestination(slug: string, locale: string): Promise<Destination | null> {
  const destinations = await getDestinations(locale);
  return destinations.find((place) => place.slug === slug) ?? null;
}

/**
 * A journey written before the studio had a stops field still needs a route to
 * draw, and a length the duration filter can read. Both fall back to the
 * package definition of the same slug, and the length falls back once more to
 * the number an editor already typed into “Length” — “12 days” is a 12.
 */
type TourRow = {
  slug: string;
  title: MaybeLocalised;
  days: MaybeLocalised;
  route: MaybeLocalised;
  price: MaybeLocalised;
  note: MaybeLocalised;
  introHeading: MaybeLocalised;
  introCopy: MaybeLocalised;
  includedHeading: MaybeLocalised;
  includedCopy: MaybeLocalised;
  itinerary: Array<{ period: MaybeLocalised; title: MaybeLocalised; copy: MaybeLocalised }>;
  image: RawImage;
  durationDays: number | null;
  stops: string[] | null;
};

function resolveTour(row: TourRow, copy: StaticCopy): Tour {
  const { locale } = copy;
  const packaged = copy.packageCopy(row.slug);
  /* Translated studio copy, then the translated package copy for a slug we ship,
     then whatever English the studio holds — never nothing. */
  const title =
    pickExact(row.title, locale) || packaged?.title || pickLocale(row.title, locale) || row.slug;
  const days = pickExact(row.days, locale) || copy.days(row.durationDays ?? packageDurations[row.slug] ?? 1);

  const translatedStages = row.itinerary.map((stage) => ({
    period: pickExact(stage.period, locale),
    title: pickExact(stage.title, locale),
    copy: pickExact(stage.copy, locale)
  }));
  const itinerary = translatedStages.every((stage) => stage.title.length > 0)
    ? translatedStages
    : [];

  const durationDays = row.durationDays ?? packageDurations[row.slug] ?? parseDays(days) ?? 1;
  const stops = row.stops?.length ? row.stops : (packageStops[row.slug] ?? []);

  return {
    slug: row.slug,
    title,
    days,
    durationDays,
    route: pickExact(row.route, locale) || packaged?.route || pickLocale(row.route, locale) || '',
    price: pickLocale(row.price, locale),
    image: urlForImage(row.image as Image, 1600, 1100),
    imageAlt: pickLocale(row.image?.alt, locale) || title,
    note: pickExact(row.note, locale) || packaged?.note || pickLocale(row.note, locale) || '',
    introHeading: pickExact(row.introHeading, locale) || copy.tour.introHeading,
    introCopy: pickExact(row.introCopy, locale) || copy.tour.introCopy,
    itinerary: itinerary.length > 0 ? itinerary : itineraryFromStops(stops, durationDays, copy),
    includedHeading: pickExact(row.includedHeading, locale) || copy.tour.includedHeading,
    includedCopy: pickExact(row.includedCopy, locale) || copy.tour.includedCopy,
    stops
  };
}

/**
 * Studio first, packages second — the same merge `getDestinations` does. A
 * journey written in the studio wins outright; every package the studio has
 * never heard of is offered alongside it, so the shelf on /journeys still holds
 * the day trips and long weekends whether or not anyone has recreated them as
 * documents yet. Sorted by length, since that is what the filter above them
 * sorts by.
 */
export async function getTours(locale: string): Promise<Tour[]> {
  const copy = await staticCopy(locale);
  const rows = await fetchSite<TourRow[]>(toursQuery, []);
  const fallback = fallbackToursFor(copy);
  if (rows.length === 0) return fallback;

  const known = new Set(rows.map((row) => row.slug));
  return [
    ...rows.map((row) => resolveTour(row, copy)),
    ...fallback.filter((journey) => !known.has(journey.slug))
  ].sort((a, b) => a.durationDays - b.durationDays);
}

type ContactRow = {
  email: string;
  phone: string | null;
  whatsapp: string | null;
  location: MaybeLocalised;
  address: MaybeLocalised;
  responseTime: MaybeLocalised;
  social: Array<{ label: MaybeLocalised; url: string }> | null;
};

export async function getContactDetails(locale: string): Promise<ContactDetails> {
  const copy = await staticCopy(locale);
  const row = await fetchSite<ContactRow | null>(contactQuery, null);

  const fallback: ContactDetails = {
    email: contactDefaults.email,
    phone: null,
    whatsapp: null,
    location: copy.contact.location,
    address: null,
    responseTime: copy.contact.responseTime,
    social: []
  };

  if (!row?.email) return fallback;

  return {
    email: row.email,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    location: pickExact(row.location, locale) || fallback.location,
    address: pickLocaleOrNull(row.address, locale),
    /* Reads inside a sentence, so an untranslated one would break the grammar. */
    responseTime: pickExact(row.responseTime, locale) || fallback.responseTime,
    social: (row.social ?? [])
      .map((link) => ({ label: pickLocale(link.label, locale), url: link.url }))
      .filter((link) => link.label.length > 0 && Boolean(link.url))
  };
}
