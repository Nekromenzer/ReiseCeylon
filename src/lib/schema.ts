/**
 * The structured data — the machine-readable half of every page.
 *
 * A reader gets prose; a search engine, an answer engine and a language model
 * get this. It is the difference between a page that *mentions* Sigiriya and a
 * page that *declares* Sigiriya to be a tourist attraction at 7.9570°N,
 * 80.7603°E inside Matale District, published by a travel agency in Colombo that
 * speaks four languages. Only the second can be cited with confidence.
 *
 * Everything here is derived from data the site already holds — the atlas
 * coordinates, the Sanity documents, the contact singleton. Nothing is asserted
 * that the page does not also show a human, which is both the honest position
 * and the one Google's structured-data policy requires.
 *
 * Two conventions worth knowing before editing:
 *
 *   `@id` — every node gets a stable, absolute one. The organisation is
 *   `${SITE_URL}/#organisation` on every page in every language, so the nodes
 *   scattered across 700-odd pages resolve to a single entity rather than 700
 *   unrelated companies with the same name.
 *
 *   Nulls — a field with nothing behind it is dropped, never emitted empty.
 *   `prune` at the bottom does that; a schema with `"telephone": null` in it is
 *   worse than one without the key.
 */
import type { PortableTextBlock } from '@portabletext/types';
import { localeTags, locales, type Locale } from '@/i18n/routing';
import { SITE_URL, absoluteImage, urlFor } from '@/lib/seo';
import type { ContactDetails, Destination, Tour } from '@/sanity/site';
import type { Post } from '@/sanity/queries';

export type JsonLdNode = Record<string, unknown>;

const ORGANISATION_ID = `${SITE_URL}/#organisation`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Every language the agency answers in — the same list the switcher offers. */
const spokenLanguages = locales.map((locale) => localeTags[locale]);

/**
 * The closest schema.org type to each of the atlas's thirteen landscapes.
 *
 * `TouristAttraction` is always the primary type; this narrows it where a real
 * type exists. Four landscapes are deliberately unmapped — schema.org has no
 * Island, no Viewpoint and no railway-destination type, and inventing one by
 * reaching for a loose relative would say something untrue about the place.
 */
const additionalTypes: Record<string, string> = {
  beaches: 'https://schema.org/Beach',
  'ancient-cities-and-ruins': 'https://schema.org/LandmarksOrHistoricalBuildings',
  temples: 'https://schema.org/PlaceOfWorship',
  waterfalls: 'https://schema.org/BodyOfWater',
  'natural-pools': 'https://schema.org/BodyOfWater',
  'national-parks-and-wildlife': 'https://schema.org/Park',
  'mountains-and-hiking': 'https://schema.org/Mountain',
  'lakes-and-reservoirs': 'https://schema.org/LakeBodyOfWater',
  'botanical-gardens-and-parks': 'https://schema.org/Park'
};

/**
 * The agency itself, and the site it publishes. Rendered once per page from the
 * root layout, so every url carries the entity.
 *
 * No `SearchAction` is declared. The atlas filters in the browser and has no
 * query url to hand a search engine, and a sitelinks searchbox pointing at a url
 * that does not exist is a broken promise rather than a feature.
 */
export function siteGraph({
  locale,
  contact,
  name,
  description
}: {
  locale: string;
  contact: ContactDetails;
  name: string;
  description: string;
}): JsonLdNode {
  const organisation = prune({
    '@type': ['TravelAgency', 'Organization'],
    '@id': ORGANISATION_ID,
    name: 'ReiseCeylon',
    alternateName: name,
    url: SITE_URL,
    description,
    logo: {
      '@type': 'ImageObject',
      url: absoluteImage('/brand/logo-512.png'),
      caption: 'ReiseCeylon'
    },
    image: absoluteImage('/images/sigiriya.jpg'),
    email: contact.email,
    telephone: contact.phone,
    address: prune({
      '@type': 'PostalAddress',
      streetAddress: contact.address,
      addressLocality: contact.location,
      addressCountry: 'LK'
    }),
    areaServed: { '@type': 'Country', name: 'Sri Lanka' },
    knowsLanguage: spokenLanguages,
    sameAs: contact.social.map((link) => link.url),
    contactPoint: prune({
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: contact.email,
      telephone: contact.phone,
      areaServed: 'LK',
      availableLanguage: spokenLanguages
    })
  });

  const website = prune({
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name,
    description,
    inLanguage: spokenLanguages,
    publisher: { '@id': ORGANISATION_ID }
  });

  return { '@context': 'https://schema.org', '@graph': [organisation, website] };
}

/** Reference to the organisation node the root layout already emitted. */
const publishedBy = { '@id': ORGANISATION_ID };

export type Crumb = { name: string; path: string };

/**
 * The trail as a machine reads it. The visible breadcrumb on a destination page
 * is decorative markup; this is the one an engine builds its result line from.
 */
export function breadcrumbSchema(crumbs: Crumb[], locale: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: urlFor(crumb.path, locale)
    }))
  };
}

/**
 * A place on the island, with the facts the page already prints in its record
 * table restated where a machine will look for them.
 *
 * `publicAccess` is asserted, `isAccessibleForFree` is not: every place in the
 * atlas can be reached by the public, but a good many charge at the gate and the
 * site does not hold the ticket price.
 */
export function attractionSchema(
  destination: Destination,
  locale: string,
  { regionName, touristType }: { regionName?: string; touristType?: string } = {}
): JsonLdNode {
  const path = `/destinations/${destination.slug}`;
  const url = urlFor(path, locale);
  const hasPoint = destination.latitude !== null && destination.longitude !== null;
  /* `provinceLabel` is the bare name — “Central” — because that is what reads
     well in a table cell under the heading “Province”. A machine reading
     addressRegion has no such heading, so it gets the full name. */
  const region = regionName || destination.provinceLabel || destination.province;

  return prune({
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    '@id': `${url}#attraction`,
    additionalType: additionalTypes[destination.categoryId],
    name: destination.name,
    description: destination.seoDescription,
    url,
    inLanguage: localeTags[locale as Locale],
    image: [absoluteImage(destination.image)],
    address: prune({
      '@type': 'PostalAddress',
      addressLocality: destination.city || destination.district,
      addressRegion: region,
      addressCountry: 'LK'
    }),
    geo: hasPoint
      ? {
          '@type': 'GeoCoordinates',
          latitude: destination.latitude,
          longitude: destination.longitude
        }
      : null,
    containedInPlace: destination.province
      ? {
          '@type': 'AdministrativeArea',
          name: region,
          address: { '@type': 'PostalAddress', addressCountry: 'LK' }
        }
      : null,
    hasMap: destination.googleMapsUrl,
    publicAccess: true,
    touristType,
    isPartOf: { '@id': WEBSITE_ID },
    subjectOf: publishedBy
  });
}

/**
 * A ready-made journey. `itinerary` carries the route in travel order, which is
 * the part that makes a trip citable — “a 12-day Sri Lanka itinerary covering
 * Sigiriya, Kandy, Ella and Yala” is answerable from this node alone.
 */
export function tripSchema(
  tour: Tour,
  locale: string,
  stops: Array<{ slug: string; name: string; isAtlasPlace: boolean }>
): JsonLdNode {
  const path = `/tours/${tour.slug}`;
  const url = urlFor(path, locale);

  return prune({
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${url}#trip`,
    name: tour.title,
    description: tour.note,
    url,
    inLanguage: localeTags[locale as Locale],
    image: [absoluteImage(tour.image)],
    provider: publishedBy,
    /* ISO 8601 — “P12D” is a twelve-day trip in any language. */
    duration: tour.durationDays > 0 ? `P${tour.durationDays}D` : null,
    arrivalCountry: { '@type': 'Country', name: 'Sri Lanka' },
    itinerary:
      stops.length > 0
        ? {
            '@type': 'ItemList',
            numberOfItems: stops.length,
            itemListOrder: 'https://schema.org/ItemListOrderAscending',
            itemListElement: stops.map((stop, index) =>
              prune({
                '@type': 'ListItem',
                position: index + 1,
                item: prune({
                  '@type': 'TouristAttraction',
                  name: stop.name,
                  url: stop.isAtlasPlace ? urlFor(`/destinations/${stop.slug}`, locale) : null
                })
              })
            )
          }
        : null,
    offers: offerFrom(tour.price)
  });
}

/**
 * “From $520” → an AggregateOffer with a low price. Anything that does not parse
 * cleanly — a translated phrase, a range, a blank — produces no offer at all,
 * because a wrong price in structured data is a manual action waiting to happen.
 */
function offerFrom(price: string | null | undefined): JsonLdNode | null {
  if (!price) return null;
  const match = price.match(/([$€£])\s?([\d.,]+)/);
  if (!match) return null;

  const amount = Number(match[2].replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const currency = { $: 'USD', '€': 'EUR', '£': 'GBP' }[match[1]];
  return {
    '@type': 'AggregateOffer',
    lowPrice: amount,
    priceCurrency: currency,
    availability: 'https://schema.org/InStock'
  };
}

/** A journal entry, with the authorship and dates an engine weighs for trust. */
export function articleSchema(
  post: Post,
  locale: string,
  { image, body }: { image: string; body: PortableTextBlock[] }
): JsonLdNode {
  const path = `/blog/${post.slug}`;
  const url = urlFor(path, locale);

  return prune({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.seoDescription ?? post.excerpt,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: localeTags[locale as Locale],
    image: [absoluteImage(image)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    wordCount: countWords(body) || null,
    articleSection: post.category,
    author: post.author
      ? prune({
          '@type': 'Person',
          name: post.author.name,
          jobTitle: post.author.role,
          worksFor: publishedBy
        })
      : publishedBy,
    publisher: publishedBy,
    isPartOf: { '@id': WEBSITE_ID }
  });
}

/** Portable Text carries no plain string, so the count is assembled from spans. */
function countWords(body: PortableTextBlock[]): number {
  const text = body
    .flatMap((block) =>
      Array.isArray(block.children)
        ? block.children.map((child) => (child as { text?: string }).text ?? '')
        : []
    )
    .join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}

export type FaqEntry = { question: string; answer: string };

/**
 * The question-and-answer block, declared as such.
 *
 * Everything in `entries` is also rendered on the page as an open `<details>`
 * list — Google's FAQ policy requires the answer be visible to the reader, and
 * an answer engine will not quote what it cannot see.
 */
export function faqSchema(entries: FaqEntry[], url: string): JsonLdNode | null {
  if (entries.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer }
    }))
  };
}

/**
 * An ordered list of pages — the atlas index and the journey shelf. What makes a
 * hub page legible as a hub rather than as 174 loose links.
 */
export function itemListSchema({
  name,
  description,
  url,
  items
}: {
  name: string;
  description?: string;
  url: string;
  items: Array<{ name: string; url: string }>;
}): JsonLdNode {
  return prune({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${url}#list`,
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url
    }))
  });
}

/** A plain page — about, contact — tied back to the site and the organisation. */
export function pageSchema({
  type,
  name,
  description,
  path,
  locale
}: {
  type: 'AboutPage' | 'ContactPage' | 'CollectionPage';
  name: string;
  description?: string;
  path: string;
  locale: string;
}): JsonLdNode {
  const url = urlFor(path, locale);
  return prune({
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#page`,
    name,
    description,
    url,
    inLanguage: localeTags[locale as Locale],
    isPartOf: { '@id': WEBSITE_ID },
    about: publishedBy
  });
}

/**
 * Drop every key with nothing behind it, recursively.
 *
 * `false` and `0` survive — `publicAccess: false` is a fact — but null,
 * undefined, the empty string and the empty array are all absence, and absence
 * is expressed by leaving the key out.
 */
function prune<T extends JsonLdNode>(node: T): T {
  const output: JsonLdNode = {};

  for (const [key, value] of Object.entries(node)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      output[key] = value;
      continue;
    }
    if (typeof value === 'object') {
      const nested = prune(value as JsonLdNode);
      /* An object left with only its @type is an empty object wearing a label. */
      if (Object.keys(nested).filter((key) => key !== '@type').length === 0) continue;
      output[key] = nested;
      continue;
    }
    output[key] = value;
  }

  return output as T;
}
