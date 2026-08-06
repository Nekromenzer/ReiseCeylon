/**
 * Destinations, journeys and contact details, read from Sanity.
 *
 * Every getter falls back to the static content in `@/lib/content` when the
 * dataset has nothing of that type yet, so the site renders exactly as it did
 * before any of it was migrated. Images are resolved to plain url strings here
 * so the page components stay unaware of Sanity.
 */
import type { Image } from 'sanity';
import { defineQuery } from 'next-sanity';
import { art } from '@/lib/content';
import { buildRoute, formatDuration, formatKm, splitIntoDays, waypointsFor } from '@/lib/journey';
import { journeyPackages, packageDurations, packageStops, parseDays } from '@/lib/packages';
import {
  contactDefaults,
  defaultHighlights,
  defaultStages,
  destinationDefaults,
  tourDefaults,
  type Highlight,
  type Stage
} from '@/lib/defaults';
import {
  atlasRecordFor,
  categoryFor,
  defaultFeaturedSlugs,
  googleMapsUrlFor,
  hasSamplePhotograph,
  imageForSlug,
  noteFor,
  openStreetMapUrlFor,
  places,
  regionFor,
  type Place,
  type Precision
} from '@/lib/places';
import { getClient } from './client';
import { isSanityConfigured } from './env';
import { urlForImage } from './image';

export type { Highlight, Stage };

export type Destination = {
  slug: string;
  name: string;
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
  district: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  precision: Precision;
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
 * Every place in the atlas, dressed with the default copy. This is what the site
 * renders before anything has been synced to Sanity, and what it falls back to if
 * the dataset is unreachable — so /destinations is never empty.
 */
function destinationFromPlace(place: Place): Destination {
  return {
    slug: place.slug,
    name: place.name,
    region: regionFor(place.province),
    note: noteFor(place),
    image: place.image,
    imageAlt: `${place.name}, ${place.district}`,
    introHeading: destinationDefaults.introHeading,
    introCopy: destinationDefaults.introCopy(place.name),
    highlights: defaultHighlights,
    goodToKnowHeading: destinationDefaults.goodToKnowHeading,
    goodToKnowCopy: destinationDefaults.goodToKnowCopy,
    categoryId: place.categoryId,
    category: place.category,
    province: place.province,
    district: place.district,
    city: place.city,
    latitude: place.latitude,
    longitude: place.longitude,
    precision: place.precision,
    googleMapsUrl: place.googleMapsUrl,
    openStreetMapUrl: place.openStreetMapUrl,
    featured: defaultFeaturedSlugs.includes(place.slug)
  };
}

const fallbackDestinations: Destination[] = places.map(destinationFromPlace);

/**
 * A day trip has no business showing the twelve-day timeline in `defaultStages`,
 * so a package that has never been written up in the studio describes itself
 * from its own stops instead: the route split across its days, with the real
 * driving figure for each one. Honest, and specific to the journey.
 */
function itineraryFromStops(slugs: string[], days: number): Stage[] {
  const stops = waypointsFor(slugs, places);
  if (stops.length === 0) return defaultStages;

  return splitIntoDays(stops, days).map((group, index, all) => {
    const leadIn = index > 0 ? all[index - 1][all[index - 1].length - 1] : null;
    const driving = buildRoute(leadIn ? [leadIn, ...group] : group);

    return {
      period: all.length === 1 ? 'One day' : `Day ${index + 1}`,
      title: group.map((stop) => stop.name).join(' · '),
      copy:
        driving.legs.length > 0
          ? `${formatKm(driving.roadKm)} on the road, around ${formatDuration(driving.minutes)} of it driving.`
          : `A full day at ${group[0].name}, at your own pace.`
    };
  });
}

const fallbackTours: Tour[] = journeyPackages.map((journey) => ({
  ...journey,
  imageAlt: journey.title,
  itinerary: itineraryFromStops(journey.stops, journey.durationDays),
  ...tourDefaults
}));

const fallbackContact: ContactDetails = {
  ...contactDefaults,
  phone: null,
  whatsapp: null,
  address: null,
  social: []
};

const destinationFields = /* groq */ `
  "slug": slug.current, name, region, note, image,
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

type RawImage = Image & { alt?: string };

async function fetchSite<T>(query: string, fallback: T): Promise<T> {
  if (!isSanityConfigured) return fallback;
  try {
    return await getClient().fetch<T>(query, {}, { next: { tags: ['site'], revalidate: 3600 } });
  } catch (error) {
    console.error('[sanity] site fetch failed', error);
    return fallback;
  }
}

type DestinationRow = Omit<
  Destination,
  'image' | 'imageAlt' | 'category' | 'googleMapsUrl' | 'openStreetMapUrl'
> & { image: RawImage | null; status?: 'published' | 'hidden' };

/**
 * Studio documents carry only what an editor typed. Everything else is resolved
 * here, field by field: the studio wins wherever it holds a value, the atlas fills
 * any location field left empty, and the default copy fills the rest.
 *
 * The merge is per field rather than per document on purpose. A destination
 * created or edited by hand in the studio — before `npm run sync:destinations`
 * has ever run, or with the location group left untouched — still gets its
 * category, province, coordinates, map and nearby rail from the atlas.
 */
function resolveDestination(row: DestinationRow): Destination {
  const atlas = atlasRecordFor(row.slug);

  const categoryId = row.categoryId || atlas?.categoryId || '';
  const province = row.province || atlas?.province || '';
  const district = row.district || atlas?.district || '';
  const city = row.city || atlas?.city || '';
  const latitude = typeof row.latitude === 'number' ? row.latitude : (atlas?.latitude ?? null);
  const longitude = typeof row.longitude === 'number' ? row.longitude : (atlas?.longitude ?? null);
  const hasPoint = latitude !== null && longitude !== null;

  const image = row.image?.asset
    ? urlForImage(row.image as RawImage, 1600, 1100)
    : hasSamplePhotograph(row.slug)
      ? imageForSlug(row.slug)
      : (atlas?.image ?? art.fortress);

  return {
    ...row,
    image,
    imageAlt: row.image?.alt ?? row.name,
    categoryId,
    category: categoryFor(categoryId)?.name ?? '',
    province,
    district,
    city,
    latitude,
    longitude,
    region: row.region || regionFor(province),
    note: row.note || noteFor({ categoryId, city, district }),
    introHeading: row.introHeading || destinationDefaults.introHeading,
    introCopy: row.introCopy || destinationDefaults.introCopy(row.name),
    highlights: row.highlights.length > 0 ? row.highlights : defaultHighlights,
    goodToKnowHeading: row.goodToKnowHeading || destinationDefaults.goodToKnowHeading,
    goodToKnowCopy: row.goodToKnowCopy || destinationDefaults.goodToKnowCopy,
    precision: row.precision ?? atlas?.precision ?? 'exact',
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
export async function getDestinations(): Promise<Destination[]> {
  const rows = await fetchSite<DestinationRow[]>(destinationsQuery, []);
  if (rows.length === 0) return fallbackDestinations;

  const known = new Set(rows.map((row) => row.slug));
  return [
    ...rows.filter((row) => row.status !== 'hidden').map(resolveDestination),
    ...fallbackDestinations.filter((place) => !known.has(place.slug))
  ].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The five that lead the homepage rail. The rail is built for exactly five, so if
 * the studio marks fewer, the rest are topped up from the atlas defaults and then
 * from the list itself — it is never short.
 */
export async function getFeaturedDestinations(): Promise<Destination[]> {
  const marked = await fetchSite<DestinationRow[]>(featuredDestinationsQuery, []);
  const destinations = await getDestinations();
  const chosen: Destination[] = marked.map(resolveDestination);
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
export async function getDestination(slug: string): Promise<Destination | null> {
  const destinations = await getDestinations();
  return destinations.find((place) => place.slug === slug) ?? null;
}

/**
 * A journey written before the studio had a stops field still needs a route to
 * draw, and a length the duration filter can read. Both fall back to the
 * package definition of the same slug, and the length falls back once more to
 * the number an editor already typed into “Length” — “12 days” is a 12.
 */
type TourRow = Omit<Tour, 'image' | 'imageAlt' | 'durationDays' | 'stops'> & {
  image: RawImage;
  durationDays: number | null;
  stops: string[] | null;
};

function resolveTour(row: TourRow): Tour {
  return {
    ...row,
    image: urlForImage(row.image, 1600, 1100),
    imageAlt: row.image.alt ?? row.title,
    durationDays: row.durationDays ?? packageDurations[row.slug] ?? parseDays(row.days) ?? 1,
    stops: row.stops?.length ? row.stops : (packageStops[row.slug] ?? [])
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
export async function getTours(): Promise<Tour[]> {
  const rows = await fetchSite<TourRow[]>(toursQuery, []);
  if (rows.length === 0) return fallbackTours;

  const known = new Set(rows.map((row) => row.slug));
  return [...rows.map(resolveTour), ...fallbackTours.filter((journey) => !known.has(journey.slug))].sort(
    (a, b) => a.durationDays - b.durationDays
  );
}

export async function getContactDetails(): Promise<ContactDetails> {
  const row = await fetchSite<ContactDetails | null>(contactQuery, null);
  if (!row?.email) return fallbackContact;
  return {
    ...fallbackContact,
    ...row,
    responseTime: row.responseTime ?? fallbackContact.responseTime,
    social: row.social ?? []
  };
}
