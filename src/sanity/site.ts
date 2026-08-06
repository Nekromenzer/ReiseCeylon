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
import {
  art,
  journeyNotes as staticJourneyNotes,
  tours as staticTours
} from '@/lib/content';
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

const fallbackTours: Tour[] = staticTours.map((journey) => ({
  ...journey,
  imageAlt: journey.title,
  note: staticJourneyNotes[journey.slug] ?? '',
  itinerary: defaultStages,
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
    "slug": slug.current, title, days, route, price, image, note,
    introHeading, introCopy,
    "itinerary": coalesce(itinerary[]{period, title, copy}, []),
    includedHeading, includedCopy
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
 * Studio documents carry only what an editor typed. Everything else — the display
 * copy, the category name, the map links, the photograph — is resolved here, so
 * a half-filled document still renders a complete page.
 */
function resolveDestination(row: DestinationRow): Destination {
  const hasAsset = Boolean(row.image?.asset);
  const image = hasAsset
    ? urlForImage(row.image as RawImage, 1600, 1100)
    : hasSamplePhotograph(row.slug)
      ? imageForSlug(row.slug)
      : art.fortress;
  const hasPoint = typeof row.latitude === 'number' && typeof row.longitude === 'number';

  return {
    ...row,
    image,
    imageAlt: row.image?.alt ?? row.name,
    categoryId: row.categoryId ?? '',
    category: categoryFor(row.categoryId)?.name ?? '',
    province: row.province ?? '',
    district: row.district ?? '',
    city: row.city ?? '',
    region: row.region || regionFor(row.province ?? ''),
    note: row.note || noteFor({ categoryId: row.categoryId, city: row.city, district: row.district }),
    introHeading: row.introHeading || destinationDefaults.introHeading,
    introCopy: row.introCopy || destinationDefaults.introCopy(row.name),
    highlights: row.highlights.length > 0 ? row.highlights : defaultHighlights,
    goodToKnowHeading: row.goodToKnowHeading || destinationDefaults.goodToKnowHeading,
    goodToKnowCopy: row.goodToKnowCopy || destinationDefaults.goodToKnowCopy,
    precision: row.precision ?? 'exact',
    googleMapsUrl: hasPoint ? googleMapsUrlFor(row.latitude!, row.longitude!) : null,
    openStreetMapUrl: hasPoint ? openStreetMapUrlFor(row.latitude!, row.longitude!) : null
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

export async function getTours(): Promise<Tour[]> {
  const rows = await fetchSite<Array<Omit<Tour, 'image' | 'imageAlt'> & { image: RawImage }>>(
    toursQuery,
    []
  );
  if (rows.length === 0) return fallbackTours;
  return rows.map((row) => ({
    ...row,
    image: urlForImage(row.image, 1600, 1100),
    imageAlt: row.image.alt ?? row.title
  }));
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
