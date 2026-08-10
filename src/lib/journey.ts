/**
 * The routing model — how far apart two places are by road, and how long the
 * drive between them actually takes.
 *
 * There is no routing service behind this. Every figure is derived from the
 * atlas coordinates in `places.ts`, which means the planner recalculates the
 * whole itinerary on every drag with no network call, no API key and no rate
 * limit. The trade-off is that the numbers are estimates, and the interface
 * says so wherever it prints one.
 *
 * The model has two parts:
 *
 *   1. A detour factor. Road distance is always longer than the straight line;
 *      how much longer depends on the terrain. Sri Lankan coastal and dry-zone
 *      A-roads run fairly true (≈1.12×), while a hill-country road climbing
 *      switchbacks between two ridges can be nearly double the direct line.
 *
 *   2. An average speed. Not a limit — an all-in average for a private vehicle
 *      including towns, level crossings and the general pace of the road.
 *      42 km/h across the lowlands, 24 km/h through the highlands.
 *
 * Both are interpolated on `highlandFraction` — the share of the leg that falls
 * inside the central massif — so a leg that starts on the coast and ends in the
 * hills is priced somewhere between the two, rather than jumping at a border.
 *
 * Calibration, against published road distances and typical driving times:
 *
 *   | Leg               | model        | real                    |
 *   | Colombo–Sigiriya  | 171 km, 4h05 | ~175 km, 4–4½h          |
 *   | Colombo–Kandy     | 122 km, 3h10 | ~115 km, 3½–4h          |
 *   | Sigiriya–Kandy    |  94 km, 2h30 | ~90 km, 2½h             |
 *   | Kandy–Ella        | 119 km, 5h00 | ~120 km, 4½–5h          |
 *   | Colombo–Galle     | 125 km, 3h00 | 125 km, 1½h expressway  |
 *
 * The Colombo–Galle row is the known weak spot: the model does not know about
 * the Southern Expressway, so it quotes the coastal road. It errs slow, which
 * is the safer direction for a journey a traveller is planning around.
 *
 * This module imports nothing, on purpose. The planner recalculates in the
 * browser, and `places.ts` pulls the whole 143KB atlas in with it — so the atlas
 * is passed in as a catalogue where it is needed rather than imported here, and
 * `distanceKm` lives here and is re-exported by `places.ts` rather than the
 * other way round.
 */

/** A stop is any point with a name and a position — an atlas place or a custom pin. */
export type Waypoint = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Found by the traveller in OpenStreetMap rather than picked off the atlas. */
  custom?: boolean;
  /** An airport bookend, added by the transfer option rather than chosen. */
  transfer?: boolean;
};

/**
 * A stop the traveller found themselves rather than picked off the atlas — a
 * town, a hotel, a turn-off with no entry of its own. The slug carries the
 * coordinates so the same point always produces the same key, which is what
 * stops a place being added to one route twice.
 */
export const CUSTOM_PREFIX = 'custom:';

export function customWaypoint(name: string, latitude: number, longitude: number): Waypoint {
  return {
    slug: `${CUSTOM_PREFIX}${latitude.toFixed(5)},${longitude.toFixed(5)}`,
    name,
    latitude,
    longitude,
    custom: true
  };
}

/** Custom stops have no destination page to link to, and no atlas record behind them. */
export function isCustomStop(slug: string) {
  return slug.startsWith(CUSTOM_PREFIX);
}

/**
 * Bandaranaike International — the airport nearly every journey to Sri Lanka
 * begins and ends at. It is not an atlas place: nobody visits it, and it has no
 * destination page. It is here because a route that ignores the transfer from
 * the airport understates the first and last day of the trip by two hours.
 */
export const COLOMBO_AIRPORT: Waypoint = {
  slug: 'airport-cmb',
  name: 'Bandaranaike International Airport (CMB)',
  latitude: 7.1808,
  longitude: 79.8841,
  transfer: true
};

/**
 * The route as it will actually be driven — the airport at each end when the
 * traveller is being collected and dropped off.
 *
 * The bookends are added here rather than pushed into the stop list itself, so
 * they cannot be dragged out of position or deleted by accident, and so turning
 * the option off restores exactly the route the traveller built.
 */
export function withAirportTransfers(stops: Waypoint[], enabled: boolean): Waypoint[] {
  if (!enabled || stops.length === 0) return stops;

  const first = stops[0].slug === COLOMBO_AIRPORT.slug ? [] : [COLOMBO_AIRPORT];
  const last = stops[stops.length - 1].slug === COLOMBO_AIRPORT.slug ? [] : [COLOMBO_AIRPORT];
  return [...first, ...stops, ...last];
}

/** The minimum a place needs to be routed to. The atlas `Place` satisfies it. */
export type Positioned = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
};

/**
 * What the planner needs to show a place in the picker and route to it. A slim
 * projection of the atlas `Place` — it crosses to the browser as props, so it
 * carries no editorial copy or image paths it will not use.
 */
export type PlannerPlace = Positioned & {
  categoryId: string;
  category: string;
  province: string;
  district: string;
  city: string;
};

/** Great-circle distance in kilometres. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export type Leg = {
  from: Waypoint;
  to: Waypoint;
  directKm: number;
  roadKm: number;
  minutes: number;
  /** 0 = entirely lowland, 1 = entirely highland. Drives both figures above. */
  highlandFraction: number;
};

export type RouteTotals = {
  legs: Leg[];
  roadKm: number;
  minutes: number;
  /** Longest single drive, which is what makes or breaks a day. */
  longestLeg: Leg | null;
  /** Days needed if nobody should sit in a vehicle more than `HOURS_PER_DAY`. */
  suggestedDays: number;
};

/*
 * The central highlands, as two circles in degrees. Anything inside is treated
 * as mountain road. The main massif covers Kandy, Nuwara Eliya, Horton Plains,
 * Adam's Peak, Haputale and Ella; the second covers the Knuckles range, whose
 * roads are as slow as anything on the island but which sits too far north-east
 * of the first circle to be caught by it.
 *
 * Deliberately excluded: Sigiriya and Dambulla. Both are Central Province but
 * sit on the flat dry-zone plain, and a province-based test would wrongly slow
 * every drive to them by a third.
 *
 * The Knuckles circle is kept tight for the same reason. Drawn any wider it
 * reaches the Dambulla–Matale–Kandy corridor, and the straight line from
 * Sigiriya to Kandy clips it — which priced that leg 26% long, over a road that
 * in fact runs well to the west of the range.
 */
const highlandZones = [
  { latitude: 6.9, longitude: 80.75, radius: 0.42 },
  { latitude: 7.46, longitude: 80.85, radius: 0.14 }
];

const ROAD_DETOUR_LOWLAND = 1.12;
const ROAD_DETOUR_HIGHLAND = 1.82;
const SPEED_LOWLAND_KMH = 42;
const SPEED_HIGHLAND_KMH = 24;

/** Samples taken along a leg to work out how much of it is in the hills. */
const TERRAIN_SAMPLES = 9;

/**
 * Short hops are slower per kilometre than the average suggests — they are all
 * town, junction and market. Below this distance the speed is scaled down.
 */
const TOWN_TRAFFIC_KM = 25;
const TOWN_TRAFFIC_FLOOR = 0.62;

/** A comfortable day at the wheel. Beyond this the planner suggests another day. */
export const HOURS_PER_DAY = 4;

function isHighland(latitude: number, longitude: number) {
  return highlandZones.some((zone) => {
    const dLat = latitude - zone.latitude;
    const dLon = longitude - zone.longitude;
    return Math.sqrt(dLat * dLat + dLon * dLon) <= zone.radius;
  });
}

/** The share of a straight line between two points that runs through the hills. */
function highlandFraction(a: Waypoint, b: Waypoint) {
  let inside = 0;
  for (let i = 0; i < TERRAIN_SAMPLES; i += 1) {
    const t = i / (TERRAIN_SAMPLES - 1);
    if (isHighland(a.latitude + (b.latitude - a.latitude) * t, a.longitude + (b.longitude - a.longitude) * t)) {
      inside += 1;
    }
  }
  return inside / TERRAIN_SAMPLES;
}

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

export function legBetween(from: Waypoint, to: Waypoint): Leg {
  const fraction = highlandFraction(from, to);
  const directKm = distanceKm(from, to);
  const roadKm = directKm * lerp(ROAD_DETOUR_LOWLAND, ROAD_DETOUR_HIGHLAND, fraction);

  const cruising = lerp(SPEED_LOWLAND_KMH, SPEED_HIGHLAND_KMH, fraction);
  const townPenalty = lerp(TOWN_TRAFFIC_FLOOR, 1, Math.min(roadKm, TOWN_TRAFFIC_KM) / TOWN_TRAFFIC_KM);
  const minutes = roadKm > 0 ? (roadKm / (cruising * townPenalty)) * 60 : 0;

  return { from, to, directKm, roadKm, minutes, highlandFraction: fraction };
}

/** Every leg of an ordered route, plus the totals the planner prints. */
export function buildRoute(stops: Waypoint[]): RouteTotals {
  const legs: Leg[] = [];
  for (let i = 0; i < stops.length - 1; i += 1) legs.push(legBetween(stops[i], stops[i + 1]));

  const roadKm = legs.reduce((sum, leg) => sum + leg.roadKm, 0);
  const minutes = legs.reduce((sum, leg) => sum + leg.minutes, 0);
  const longestLeg = legs.reduce<Leg | null>(
    (longest, leg) => (longest === null || leg.minutes > longest.minutes ? leg : longest),
    null
  );

  return {
    legs,
    roadKm,
    minutes,
    longestLeg,
    suggestedDays: suggestedDays(stops.length, minutes)
  };
}

/**
 * A route needs enough days to drive it without living in the vehicle, and
 * enough days to be worth stopping at each place once you arrive. Whichever
 * of those two is larger wins.
 */
function suggestedDays(stopCount: number, minutes: number) {
  if (stopCount === 0) return 0;
  if (stopCount === 1) return 1;
  const drivingDays = Math.ceil(minutes / 60 / HOURS_PER_DAY);
  const stoppingDays = Math.ceil(stopCount / 2);
  return Math.max(1, drivingDays, stoppingDays);
}

/**
 * The length filter on /journeys. It lives here rather than with the packages
 * because both sides of the boundary need it — the server renders the buttons,
 * the browser does the filtering — and a function cannot be serialised into a
 * client component as a prop.
 */
export const durationBands: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Any length' },
  { id: 'day', label: 'Day trips' },
  { id: 'short', label: '2–4 days' },
  { id: 'week', label: '5–9 days' },
  { id: 'long', label: '10 days +' }
];

export function matchesDurationBand(days: number, band: string) {
  if (band === 'day') return days <= 1;
  if (band === 'short') return days >= 2 && days <= 4;
  if (band === 'week') return days >= 5 && days <= 9;
  if (band === 'long') return days >= 10;
  return true;
}

/** “4h 20m”, “45m”, “—”. */
export function formatDuration(minutes: number) {
  const total = Math.round(minutes);
  if (total <= 0) return '—';
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** Rounded the way a road sign would round it, not to a false decimal place. */
export function formatKm(km: number) {
  if (km <= 0) return '0 km';
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * The one-line reading of a leg's terrain, as a message key in the `journey`
 * namespace rather than a sentence — this module is shared by the server and the
 * browser and must not carry English of its own.
 */
export function terrainNote(fraction: number) {
  if (fraction >= 0.8) return 'terrainMountain';
  if (fraction >= 0.45) return 'terrainClimbs';
  if (fraction >= 0.15) return 'terrainLowlandClimb';
  return 'terrainLowland';
}

/** A waypoint from any positioned record — the atlas `Place` fits without a cast. */
export function toWaypoint(place: Positioned): Waypoint {
  return { slug: place.slug, name: place.name, latitude: place.latitude, longitude: place.longitude };
}

/** Waypoints for a list of slugs, silently dropping any the catalogue has lost. */
export function waypointsFor<T extends Positioned>(slugs: string[], catalogue: T[]): Waypoint[] {
  const bySlug = new Map(catalogue.map((place) => [place.slug, place]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((place): place is T => place !== undefined)
    .map(toWaypoint);
}

/**
 * Places the route already passes close to — “what else is covered”. Measured
 * as the shortest straight-line distance to any leg of the route, not to the
 * stops, so a place halfway between two stops counts as being on the way.
 */
export function placesAlongRoute<T extends Positioned>(
  stops: Waypoint[],
  catalogue: T[],
  withinKm = 18,
  limit = 12
): Array<{ place: T; km: number }> {
  if (stops.length === 0) return [];
  const chosen = new Set(stops.map((stop) => stop.slug));

  return catalogue
    .filter((place) => !chosen.has(place.slug))
    .map((place) => ({ place, km: distanceToRoute(place, stops) }))
    .filter((entry) => entry.km <= withinKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

/** Shortest distance from a point to the polyline through every stop. */
function distanceToRoute(point: { latitude: number; longitude: number }, stops: Waypoint[]) {
  if (stops.length === 1) return distanceKm(point, stops[0]);

  let shortest = Infinity;
  for (let i = 0; i < stops.length - 1; i += 1) {
    shortest = Math.min(shortest, distanceToSegment(point, stops[i], stops[i + 1]));
  }
  return shortest;
}

/**
 * Point-to-segment distance, projecting degrees onto a local flat plane first.
 * Over the length of one leg of a Sri Lankan road trip the error is metres, and
 * the alternative — spherical cross-track distance — is far more arithmetic for
 * a figure that is only ever used to sort a suggestion list.
 */
function distanceToSegment(
  point: { latitude: number; longitude: number },
  a: Waypoint,
  b: Waypoint
) {
  const scale = Math.cos((a.latitude * Math.PI) / 180);
  const toXY = (p: { latitude: number; longitude: number }) => ({ x: p.longitude * scale, y: p.latitude });

  const p = toXY(point);
  const start = toXY(a);
  const end = toXY(b);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return distanceKm(point, a);

  const t = Math.max(0, Math.min(1, ((p.x - start.x) * dx + (p.y - start.y) * dy) / lengthSquared));
  const nearest = {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t
  };
  return distanceKm(point, nearest);
}

/**
 * Reorder stops into the shortest route that keeps the first stop first —
 * nearest-neighbour, then repeated 2-opt passes to undo the crossings that
 * nearest-neighbour always leaves behind. Both are cheap enough to run inline
 * on the largest itinerary anyone builds by hand.
 */
export function optimiseOrder(stops: Waypoint[]): Waypoint[] {
  if (stops.length < 4) return stops;

  const remaining = stops.slice(1);
  const ordered = [stops[0]];
  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let best = 0;
    let bestMinutes = Infinity;
    remaining.forEach((candidate, index) => {
      const minutes = legBetween(last, candidate).minutes;
      if (minutes < bestMinutes) {
        bestMinutes = minutes;
        best = index;
      }
    });
    ordered.push(remaining.splice(best, 1)[0]);
  }

  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < ordered.length - 1; i += 1) {
      for (let k = i + 1; k < ordered.length; k += 1) {
        const candidate = [...ordered.slice(0, i), ...ordered.slice(i, k + 1).reverse(), ...ordered.slice(k + 1)];
        if (totalMinutes(candidate) < totalMinutes(ordered) - 0.5) {
          ordered.splice(0, ordered.length, ...candidate);
          improved = true;
        }
      }
    }
  }

  return ordered;
}

function totalMinutes(stops: Waypoint[]) {
  let minutes = 0;
  for (let i = 0; i < stops.length - 1; i += 1) minutes += legBetween(stops[i], stops[i + 1]).minutes;
  return minutes;
}

/**
 * Split an ordered route across days, filling each day until it reaches the
 * driving budget. Used for the day-by-day view of a journey nobody has written
 * an itinerary for — a custom one.
 */
export function splitIntoDays(stops: Waypoint[], days: number): Waypoint[][] {
  if (stops.length === 0 || days <= 0) return [];
  if (days === 1) return [stops];

  const perDay = Math.ceil(stops.length / days);
  const plan: Waypoint[][] = [];
  for (let i = 0; i < stops.length; i += perDay) plan.push(stops.slice(i, i + perDay));
  return plan;
}
