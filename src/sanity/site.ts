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
  destinations as staticDestinations,
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

const fallbackDestinations: Destination[] = staticDestinations.map((place) => ({
  ...place,
  imageAlt: place.name,
  introHeading: destinationDefaults.introHeading,
  introCopy: destinationDefaults.introCopy(place.name),
  highlights: defaultHighlights,
  goodToKnowHeading: destinationDefaults.goodToKnowHeading,
  goodToKnowCopy: destinationDefaults.goodToKnowCopy
}));

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

const destinationsQuery = defineQuery(`
  *[_type == "destination" && defined(slug.current)] | order(order asc, name asc) {
    "slug": slug.current, name, region, note, image,
    introHeading, introCopy,
    "highlights": coalesce(highlights[]{title, copy}, []),
    goodToKnowHeading, goodToKnowCopy
  }
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

export async function getDestinations(): Promise<Destination[]> {
  const rows = await fetchSite<Array<Omit<Destination, 'image' | 'imageAlt'> & { image: RawImage }>>(
    destinationsQuery,
    []
  );
  if (rows.length === 0) return fallbackDestinations;
  return rows.map((row) => ({
    ...row,
    image: urlForImage(row.image, 1600, 1100),
    imageAlt: row.image.alt ?? row.name
  }));
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
