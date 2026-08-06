/**
 * The ready-made journeys — every package a traveller can pick off the shelf.
 *
 * This is the fallback set. Anything in the studio wins: `@/sanity/site` reads
 * the `tour` documents first and only falls back here when the dataset has none,
 * exactly as it does for destinations. Keeping the full definition here means
 * /journeys is never an empty page.
 *
 * The three long journeys are not redefined here. They are read from
 * `@/lib/content`, which `scripts/seed-site.mjs` also seeds the studio from, and
 * only extended with the two fields the planner needs. Everything shorter — the
 * day trips and long weekends — is defined below, since nothing else describes
 * them yet.
 *
 * Journeys do not list an origin: every one is driven airport to airport, and
 * the CMB bookends are added by the planner's transfer option rather than baked
 * into the stop list, so turning that option off leaves only the sights.
 *
 * `stops` is the part the planner cares about. Each entry is an atlas slug from
 * `public/json/sri-lanka-tourist-places-map.json`, in travel order — that list is
 * what draws the route on the map and what every distance and drive time is
 * calculated from. A slug the atlas does not know is dropped silently rather
 * than breaking the route, so a typo costs a pin, not the page.
 */
import { journeyNotes, tours as classicTours } from './content';
import { imageForSlug } from './places';

export type JourneyPackage = {
  slug: string;
  title: string;
  /** Shown as written — the studio field is free text, so this one is too. */
  days: string;
  /** The number behind `days`, for the duration filter. */
  durationDays: number;
  route: string;
  price: string;
  image: string;
  note: string;
  /** Atlas slugs in travel order. Drives the map, the distances and the times. */
  stops: string[];
};

const shortPackages: JourneyPackage[] = [
  {
    slug: 'sigiriya-day-out',
    title: 'Sigiriya in a Day',
    days: '1 day',
    durationDays: 1,
    route: 'CMB airport → Dambulla → Sigiriya → CMB',
    price: 'From $180',
    image: imageForSlug('sigiriya-rock-fortress'),
    note: 'Leave the city before five, climb the rock before the heat, and be back by dark.',
    stops: ['dambulla-cave-temple', 'pidurangala-rock', 'sigiriya-rock-fortress']
  },
  {
    slug: 'kandy-day-out',
    title: 'Kandy & the Temple Road',
    days: '1 day',
    durationDays: 1,
    route: 'CMB airport → Peradeniya → Kandy → CMB',
    price: 'From $150',
    image: imageForSlug('temple-of-the-sacred-tooth-relic'),
    note: 'The old capital, its gardens, and the evening drums at the Temple of the Tooth.',
    stops: ['royal-botanical-gardens-peradeniya', 'temple-of-the-sacred-tooth-relic', 'kandy']
  },
  {
    slug: 'southern-shore-day',
    title: 'The Southern Shore',
    days: '1 day',
    durationDays: 1,
    route: 'CMB airport → Bentota → Hikkaduwa → Unawatuna',
    price: 'From $140',
    image: imageForSlug('unawatuna-beach'),
    note: 'Turtles at Kosgoda, reef at Hikkaduwa and a long lunch above Unawatuna bay.',
    stops: [
      'bentota-beach',
      'kosgoda-turtle-conservation-centre',
      'hikkaduwa-marine-sanctuary',
      'unawatuna-beach'
    ]
  },
  {
    slug: 'cultural-triangle-short',
    title: 'The Cultural Triangle',
    days: '3 days',
    durationDays: 3,
    route: 'CMB airport → Dambulla → Sigiriya → Polonnaruwa',
    price: 'From $520',
    image: imageForSlug('polonnaruwa-ancient-city'),
    note: 'Three days among rock temples, ruined capitals and the elephants of Minneriya.',
    stops: [
      'dambulla-cave-temple',
      'sigiriya-rock-fortress',
      'minneriya-national-park',
      'polonnaruwa-ancient-city'
    ]
  },
  {
    slug: 'hill-country-short',
    title: 'Into the Hill Country',
    days: '3 days',
    durationDays: 3,
    route: 'Kandy → Nuwara Eliya → Ella',
    price: 'From $480',
    image: imageForSlug('nine-arches-bridge-viewpoint'),
    note: 'The blue train, tea above the cloud line and two mornings in the Ella gap.',
    stops: [
      'kandy',
      'ramboda-falls',
      'gregory-lake',
      'horton-plains-national-park',
      'nine-arches-bridge-viewpoint',
      'little-adams-peak',
      'ella'
    ]
  },
  {
    slug: 'wild-south-short',
    title: 'The Wild South',
    days: '4 days',
    durationDays: 4,
    route: 'Udawalawe → Yala → Tangalle',
    price: 'From $690',
    image: imageForSlug('yala-national-park'),
    note: 'Two parks, one leopard if the light is kind, and the coast to recover on.',
    stops: [
      'udawalawe-national-park',
      'yala-national-park',
      'kataragama-temple',
      'tangalle-beach',
      'hiriketiya-beach'
    ]
  }
];

/**
 * What the three journeys in `@/lib/content` are missing: how long they run as a
 * number, and the stops they actually call at.
 */
const classicRoutes: Record<string, { durationDays: number; stops: string[] }> = {
  'wild-ceylon': {
    durationDays: 8,
    stops: [
      'sigiriya-rock-fortress',
      'minneriya-national-park',
      'gal-oya-national-park',
      'arugam-bay',
      'kumana-national-park',
      'yala-national-park',
      'bundala-national-park'
    ]
  },
  'heritage-and-horizon': {
    durationDays: 10,
    stops: [
      'temple-of-the-sacred-tooth-relic',
      'kandy',
      'royal-botanical-gardens-peradeniya',
      'adams-peak',
      'sinharaja-forest-reserve',
      'hikkaduwa-marine-sanctuary',
      'unawatuna-beach',
      'weligama-beach',
      'mirissa-beach'
    ]
  },
  'island-in-slow-motion': {
    durationDays: 12,
    stops: [
      'anuradhapura-ancient-city',
      'sigiriya-rock-fortress',
      'dambulla-cave-temple',
      'kandy',
      'gregory-lake',
      'horton-plains-national-park',
      'ella',
      'yala-national-park',
      'tangalle-beach',
      'mirissa-beach',
      'unawatuna-beach'
    ]
  }
};

/**
 * The number an editor already typed into a free-text length — “12 days” is a
 * 12. Null rather than NaN when there is no number in there at all, so callers
 * can keep falling back with `??`.
 */
export function parseDays(days: string): number | null {
  const parsed = Number.parseInt(days, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Falls back to the number in “12 days” if a journey has no entry above. */
function durationOf(slug: string, days: string) {
  return classicRoutes[slug]?.durationDays ?? parseDays(days) ?? 1;
}

export const journeyPackages: JourneyPackage[] = [
  ...shortPackages,
  ...classicTours.map((journey) => ({
    ...journey,
    note: journeyNotes[journey.slug] ?? '',
    durationDays: durationOf(journey.slug, journey.days),
    stops: classicRoutes[journey.slug]?.stops ?? []
  }))
].sort((a, b) => a.durationDays - b.durationDays);

/**
 * Stops and durations by slug, so a studio document that has neither still draws
 * a map and still answers the duration filter.
 */
export const packageStops: Record<string, string[]> = Object.fromEntries(
  journeyPackages.map((journey) => [journey.slug, journey.stops])
);

export const packageDurations: Record<string, number> = Object.fromEntries(
  journeyPackages.map((journey) => [journey.slug, journey.durationDays])
);
