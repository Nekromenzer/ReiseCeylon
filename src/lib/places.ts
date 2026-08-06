/**
 * The atlas — every mapped place on the island.
 *
 * `public/json/sri-lanka-tourist-places-map.json` is the source of truth for the
 * factual half of a destination: where it is, which province and district it sits
 * in, and how precisely the point is placed. Editorial copy lives in Sanity; this
 * file only ever describes geography.
 *
 * The same data is served three ways:
 *   - as the fallback destination list when Sanity is empty or unconfigured,
 *   - as the input to `scripts/seed-destinations.mjs`, which syncs it to Sanity,
 *   - as the source for nearby-place lookups on a destination page.
 */
import atlas from '../../public/json/sri-lanka-tourist-places-map.json';
import { distanceKm } from './journey';

/**
 * Re-exported rather than defined here. `journey.ts` owns it because the planner
 * needs it in the browser, and importing this file would pull the whole atlas
 * into the client bundle with it.
 */
export { distanceKm };

export type Precision = 'exact' | 'representative' | 'area-centroid';

export type PlaceCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  placeCount: number;
};

export type Place = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category: string;
  province: string;
  district: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  precision: Precision;
  googleMapsUrl: string;
  openStreetMapUrl: string;
  featured: boolean;
  /** Sample photography, one file per slug — see scripts/generate-destination-images.mjs. */
  image: string;
};

type RawPlace = (typeof atlas)['places'][number];

/** Regions read better than bare province names in headings and on cards. */
const regionNames: Record<string, string> = {
  Central: 'Central Highlands',
  Eastern: 'East Coast',
  Northern: 'Northern Province',
  'North Central': 'Cultural Triangle',
  'North Western': 'North West Coast',
  Sabaragamuwa: 'Sabaragamuwa',
  Southern: 'Southern Coast',
  Uva: 'Uva Highlands',
  Western: 'Western Province'
};

/** One line under the name on a card, written from the facts we actually have. */
const categoryNotes: Record<string, string> = {
  beaches: 'Warm water, long sand and unhurried mornings',
  'ancient-cities-and-ruins': 'Stone, inscription and the weight of centuries',
  temples: 'Drums at dusk and a rhythm kept for generations',
  waterfalls: 'Cold spray, deep green and the sound of falling water',
  'natural-pools': 'River-fed water worn smooth into rock',
  'national-parks-and-wildlife': 'Where the wild still sets the pace',
  'mountains-and-hiking': 'Long climbs that end above the cloud line',
  'lakes-and-reservoirs': 'Still water, old engineering and evening light',
  'scenic-viewpoints': 'A long look across the island',
  'scenic-train-destinations': 'Blue trains, open doors and slow country',
  islands: 'A short crossing to somewhere quieter',
  'botanical-gardens-and-parks': 'Planted avenues and a century of shade',
  'marine-and-coastal-attractions': 'The coast read from the water side'
};

export const precisionNotes: Record<Precision, string> = atlas.precisionGuide;

export const country = atlas.country;

export const placeCategories: PlaceCategory[] = atlas.categories;

function toPlace(raw: RawPlace): Place {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    categoryId: raw.categoryId,
    category: raw.category,
    province: raw.province,
    district: raw.district,
    city: raw.city,
    country: raw.country,
    latitude: raw.location.latitude,
    longitude: raw.location.longitude,
    precision: raw.location.precision as Precision,
    googleMapsUrl: raw.googleMapsUrl,
    openStreetMapUrl: raw.openStreetMapUrl,
    featured: raw.featured,
    image: imageForSlug(raw.slug)
  };
}

export const places: Place[] = atlas.places
  .filter((raw) => raw.status === 'published')
  .map(toPlace)
  .sort((a, b) => a.name.localeCompare(b.name));

const bySlug = new Map(places.map((place) => [place.slug, place]));

export function getPlace(slug: string): Place | undefined {
  return bySlug.get(slug);
}

export function imageForSlug(slug: string) {
  return `/images/destination/${slug}.jpg`;
}

export function hasSamplePhotograph(slug: string) {
  return bySlug.has(slug);
}

export function googleMapsUrlFor(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function directionsUrlFor(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function openStreetMapUrlFor(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
}

export function categoryFor(categoryId: string) {
  return placeCategories.find((entry) => entry.id === categoryId);
}

/**
 * The five destinations that led the site before the atlas existed. Their
 * documents are merged into the atlas records these slugs point at, so old links
 * keep working — see the redirect in /destinations/[slug].
 */
export const legacySlugAliases: Record<string, string> = {
  sigiriya: 'sigiriya-rock-fortress',
  hikkaduwa: 'hikkaduwa-marine-sanctuary',
  yala: 'yala-national-park'
};

/**
 * The atlas record behind a slug, following a legacy alias if that is all we have.
 * Used to fill the location fields of a studio document that has none.
 */
export function atlasRecordFor(slug: string): Place | undefined {
  return bySlug.get(slug) ?? bySlug.get(legacySlugAliases[slug] ?? '');
}

/**
 * Every slug that describes the same physical place — a legacy slug and the atlas
 * record it points at. Two of them must never appear as “nearby” to each other.
 */
export function aliasGroupFor(slug: string): string[] {
  const target = legacySlugAliases[slug];
  const group = new Set([slug, ...(target ? [target] : [])]);
  for (const [legacy, atlasSlug] of Object.entries(legacySlugAliases)) {
    if (group.has(atlasSlug) || legacy === slug) group.add(legacy).add(atlasSlug);
  }
  return [...group];
}

/** What the homepage rail shows when nothing in Sanity is marked featured. */
export const defaultFeaturedSlugs = [
  'sigiriya-rock-fortress',
  'ella',
  'hikkaduwa-marine-sanctuary',
  'yala-national-park',
  'kandy'
];

export function regionFor(province: string) {
  return regionNames[province] ?? province;
}

export function noteFor(place: Pick<Place, 'categoryId' | 'city' | 'district'>) {
  return categoryNotes[place.categoryId] ?? `${place.city || place.district}, Sri Lanka`;
}

export const provinces: string[] = [...new Set(places.map((place) => place.province))].sort();

export function nearbyPlaces(origin: { latitude: number; longitude: number; slug?: string }, limit = 4) {
  return places
    .filter((place) => place.slug !== origin.slug)
    .map((place) => ({ place, km: distanceKm(origin, place) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

/** Decimal degrees as 6°52′00″N, 81°02′48″E — the form a field journal would use. */
export function formatCoordinate(value: number, axis: 'lat' | 'lon') {
  const hemisphere = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutesFull = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = Math.round((minutesFull - minutes) * 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${degrees}°${pad(minutes)}′${pad(seconds)}″${hemisphere}`;
}

/** OpenStreetMap's keyless embed — a real map without a billing account. */
export function mapEmbedUrl(latitude: number, longitude: number, span = 0.06) {
  const bbox = [longitude - span, latitude - span / 2, longitude + span, latitude + span / 2]
    .map((value) => value.toFixed(4))
    .join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
}
