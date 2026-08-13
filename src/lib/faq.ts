/**
 * The questions a traveller actually types, answered from the atlas.
 *
 * Every destination page carries editorial prose — “Come for the landscape, stay
 * for its quieter stories” — which is true, evocative, and completely unciteable.
 * An answer engine asked “how far is Sigiriya from Colombo” cannot quote a mood.
 * This module writes the other half: four plain answers per place, each one
 * assembled from a number the site already holds.
 *
 * Nothing here is invented. The distances come from the same routing model the
 * planner draws, the location fields come from the atlas record, and the
 * seasonal answer comes from which of the island's two monsoons the province
 * sits under. Where a fact is missing — a place with no mapped point — the
 * question that depends on it is not asked.
 *
 * Answers are assembled from whole translated sentences rather than one
 * interpolated paragraph. A sentence survives translation into four languages;
 * a sentence stitched together from clauses does not.
 */
import { buildRoute, formatDuration, formatKm, type Waypoint } from '@/lib/journey';
import { formatCoordinate } from '@/lib/places';
import type { FaqEntry } from '@/lib/schema';
import type { Destination } from '@/sanity/site';

/**
 * Colombo, and the airport nearly every visitor lands at. Neither is an atlas
 * place — nobody's journey lists Fort as a sight — but both are what a distance
 * question is asked *from*, so they are pinned here.
 */
const COLOMBO: Waypoint = {
  slug: 'colombo',
  name: 'Colombo',
  latitude: 6.9271,
  longitude: 79.8612
};

const AIRPORT: Waypoint = {
  slug: 'cmb',
  name: 'Bandaranaike International Airport',
  latitude: 7.1808,
  longitude: 79.8841
};

type Monsoon = 'southwest' | 'northeast';

/**
 * Which monsoon governs a place.
 *
 * Sri Lanka runs two, on opposite sides of the central massif. The southwest
 * monsoon (Yala) wets the west and south coasts and the western hills from May
 * to September; the northeast monsoon (Maha) wets the north, the east and the
 * dry-zone plain from October to January. Which of the two a place sits under is
 * the single most useful thing a first-time traveller can be told about timing.
 *
 * Province answers it for seven of the nine. It gets two badly wrong, so those
 * are resolved by district first:
 *
 *   Matale, in Central Province, is the Cultural Triangle — Sigiriya, Dambulla,
 *   Pidurangala. Central Province otherwise means Kandy and Nuwara Eliya, which
 *   are southwest-monsoon hill country, but Matale sits on the dry-zone plain
 *   below them and is wettest in October and November, not in June. Reading it
 *   off the province would tell every visitor to the three most-visited places
 *   on the island the opposite of the truth.
 *
 *   Hambantota, in Southern Province, is the arid south-east — Yala, Bundala,
 *   Tissamaharama, Kataragama. The rest of Southern Province is the wet-zone
 *   coast through Galle and Matara; Hambantota is in its rain shadow and follows
 *   the dry-zone pattern instead.
 *
 * Both zones are still generalisations across a district, so the copy states a
 * pattern rather than a promise, and closes by saying that somewhere on the
 * island is always in season — which is the genuinely useful headline.
 */
const monsoonByDistrict: Record<string, Monsoon> = {
  Matale: 'northeast',
  Hambantota: 'northeast'
};

const monsoonByProvince: Record<string, Monsoon> = {
  Western: 'southwest',
  Southern: 'southwest',
  Sabaragamuwa: 'southwest',
  Central: 'southwest',
  Eastern: 'northeast',
  Northern: 'northeast',
  'North Central': 'northeast',
  'North Western': 'northeast',
  Uva: 'northeast'
};

function monsoonFor(destination: Pick<Destination, 'district' | 'province'>): Monsoon | undefined {
  return monsoonByDistrict[destination.district] ?? monsoonByProvince[destination.province];
}

/** next-intl's translator, as much of it as this module uses. */
type Translate = (key: string, values?: Record<string, string | number>) => string;

type Nearby = { name: string; km: number };

/** Straight-line road estimate and drive time from one fixed origin to a place. */
function driveFrom(origin: Waypoint, destination: Waypoint) {
  const route = buildRoute([origin, destination]);
  return { km: formatKm(route.roadKm), duration: formatDuration(route.minutes) };
}

export function destinationFaqs(
  destination: Destination,
  nearby: Nearby[],
  t: Translate
): FaqEntry[] {
  const entries: FaqEntry[] = [];
  const name = destination.name;
  const hasPoint = destination.latitude !== null && destination.longitude !== null;

  /* ---- Where is it? Always answerable; the atlas never loses a district. ---- */
  const area = [
    destination.district ? t('districtOf', { district: destination.district }) : null,
    destination.provinceLabel ? t('provinceOf', { province: destination.provinceLabel }) : null
  ]
    .filter(Boolean)
    .join(', ');

  const where = [area ? t('whereAnswerArea', { name, area }) : t('whereAnswerIsland', { name })];
  if (destination.city && destination.city !== destination.district) {
    where.push(t('whereAnswerTown', { city: destination.city }));
  }
  if (hasPoint) {
    where.push(
      t('whereAnswerPoint', {
        coordinates: `${formatCoordinate(destination.latitude!, 'lat')}, ${formatCoordinate(destination.longitude!, 'lon')}`
      })
    );
  }
  if (destination.category) where.push(t('whereAnswerCategory', { category: destination.category }));

  entries.push({ question: t('whereQuestion', { name }), answer: where.join(' ') });

  /* ---- How far from Colombo, and from the plane? ---- */
  if (hasPoint) {
    const point: Waypoint = {
      slug: destination.slug,
      name,
      latitude: destination.latitude!,
      longitude: destination.longitude!
    };
    const city = driveFrom(COLOMBO, point);
    const airport = driveFrom(AIRPORT, point);

    entries.push({
      question: t('distanceQuestion', { name }),
      answer: [
        t('distanceAnswerColombo', { name, km: city.km, duration: city.duration }),
        t('distanceAnswerAirport', { km: airport.km, duration: airport.duration }),
        t('distanceAnswerCaveat')
      ].join(' ')
    });
  }

  /* ---- When to go? ---- */
  const zone = monsoonFor(destination);
  if (zone) {
    entries.push({
      question: t('seasonQuestion', { name }),
      answer: [
        t(zone === 'southwest' ? 'seasonAnswerSouthwest' : 'seasonAnswerNortheast', { name }),
        t('seasonAnswerBoth')
      ].join(' ')
    });
  }

  /* ---- What else is close? ---- */
  if (nearby.length > 0) {
    /* Two atlas records can describe overlapping ground — Ella and Ella Gap sit
       within a few hundred metres of each other — and `formatKm` rounds that to
       “0 km”, which reads as a broken figure rather than a close one. The card
       grid on the same page already says “<1 km” instead; so does this. */
    const list = nearby
      .slice(0, 3)
      .map((place) =>
        place.km < 1
          ? t('nearbyItemClose', { name: place.name })
          : t('nearbyItem', { name: place.name, km: formatKm(place.km) })
      )
      .join(', ');

    entries.push({
      question: t('nearbyQuestion', { name }),
      answer: [t('nearbyAnswer', { name, list }), t('nearbyAnswerCaveat')].join(' ')
    });
  }

  return entries;
}
