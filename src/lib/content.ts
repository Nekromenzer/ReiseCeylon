/**
 * PHOTOGRAPHY — placeholder stock, needs replacing.
 *
 * Only sigiriya.jpg and mirissa.jpg actually show Sri Lanka. The other files in
 * /public/images are stock from elsewhere: yala.jpg is the Taj Mahal, galle.jpg
 * is a wall of German books, tea.jpg is a North American conifer forest and
 * kandy.jpg is Lago di Braies in the Dolomites. ella.jpg and forest.jpg are
 * generic but pass as hill country and jungle.
 *
 * Every surface reads its photograph from `art` below, so dropping in real
 * ReiseCeylon photography is a one-file change — no component edits needed.
 */
export const art = {
  fortress: '/images/sigiriya.jpg',
  coast: '/images/mirissa.jpg',
  highland: '/images/ella.jpg',
  jungle: '/images/forest.jpg'
};

export const destinations = [
  { slug: 'sigiriya', name: 'Sigiriya', region: 'Cultural Triangle', image: art.fortress, note: 'Ancient stone, jungle horizons' },
  { slug: 'ella', name: 'Ella', region: 'Hill Country', image: art.highland, note: 'Cloud forests, rails and tea' },
  { slug: 'mirissa', name: 'Mirissa', region: 'Southern Coast', image: art.coast, note: 'Slow mornings by the Indian Ocean' },
  { slug: 'yala', name: 'Yala', region: 'Wild South East', image: art.jungle, note: 'Where the wild still leads' },
  { slug: 'kandy', name: 'Kandy', region: 'Central Province', image: art.highland, note: 'Sacred rhythm and lake light' }
];

export const experiences = [
  { name: 'Wild encounters', image: art.jungle, copy: 'Dawn safaris guided by naturalists who know each track.' },
  { name: 'Tea country', image: art.highland, copy: 'Walk emerald slopes, meet makers and share a slow cup.' },
  { name: 'Ocean rituals', image: art.coast, copy: 'Private coves, coastal tables and unhurried blue hours.' },
  { name: 'Living heritage', image: art.fortress, copy: 'Stories of kings, craftspeople, temples and ancient cities.' }
];

export const tours = [
  { slug: 'island-in-slow-motion', title: 'The Island in Slow Motion', days: '12 days', route: 'Colombo → Tea Country → South Coast', price: 'From $2,480', image: art.highland },
  { slug: 'wild-ceylon', title: 'Wild Ceylon', days: '8 days', route: 'Sigiriya → Gal Oya → Yala', price: 'From $1,960', image: art.jungle },
  { slug: 'heritage-and-horizon', title: 'Heritage & Horizon', days: '10 days', route: 'Kandy → Galle → Mirissa', price: 'From $2,190', image: art.fortress }
];

/* Landing page content — the field-journal narrative */

export const heroPlates = [
  { image: art.coast, place: 'Mirissa', region: 'Southern Coast', meta: '05° 56′ N — Indian Ocean', rotate: '-4deg' },
  { image: art.highland, place: 'Nuwara Eliya', region: 'Hill Country', meta: '1,868 m above the sea', rotate: '3deg' },
  { image: art.fortress, place: 'Sigiriya', region: 'Cultural Triangle', meta: 'Built in the 5th century', rotate: '-2deg' }
];

export const ticker = [
  'Tea country', 'Leopard territory', 'Old Dutch ports', 'Cloud forest', 'Whale coast',
  'Rock fortresses', 'Toddy tappers', 'Blue trains', 'Monsoon rice', 'Temple drums'
];

export const manifestoStats = [
  { value: '11', label: 'Years of routing the island' },
  { value: '24', label: 'Private journeys in the collection' },
  { value: '1:1', label: 'One planner from first note to last night' }
];

export const experienceDetail = [
  { hours: 'From 05:20', title: 'Wild encounters', copy: 'Leave before the park gates open. Our naturalists read the tracks, the alarm calls and the light — then wait, quietly, in the right place.', image: art.jungle },
  { hours: 'From 07:00', title: 'Tea country', copy: 'Walk an estate with the people who pick it, watch the withering lofts fill, and drink the first flush before it ever reaches a crate.', image: art.highland },
  { hours: 'From 16:30', title: 'Ocean rituals', copy: 'A cove with no name, a table set in the sand, and the long blue hour the south coast keeps to itself.', image: art.coast },
  { hours: 'From 06:10', title: 'Living heritage', copy: 'Ancient cities before the buses arrive, temple drums at dusk, and workshops where crafts have not changed hands in generations.', image: art.fortress }
];

/* Island artwork, viewBox 0 0 520 760 — a teardrop: rounded north, widest south of centre, tapering tip */
export const island =
  'M256 66C306 74 342 118 360 176C386 250 416 312 421 396C426 486 396 566 344 636C314 676 282 708 256 714C230 708 200 676 170 636C118 566 88 486 93 396C98 312 128 250 154 176C172 118 206 74 256 66Z';

export const routeLine =
  'M262 195C285 250 240 285 248 330C256 375 300 385 300 425C300 480 331 500 325 545C318 585 250 592 205 618';

export const waypoints = [
  { name: 'Sigiriya', day: 'Day 02', x: 262, y: 195 },
  { name: 'Kandy', day: 'Day 04', x: 248, y: 330 },
  { name: 'Ella', day: 'Day 06', x: 300, y: 425 },
  { name: 'Yala', day: 'Day 08', x: 325, y: 545 },
  { name: 'Galle', day: 'Day 11', x: 205, y: 618 }
];

export const journeyNotes: Record<string, string> = {
  'island-in-slow-motion': 'Tea trails, quiet estates and mornings above the cloud line.',
  'wild-ceylon': 'Wild landscapes shaped around patient, respectful encounters.',
  'heritage-and-horizon': 'Old cities, southern ramparts and long evenings beside the sea.'
};

export const voices = [
  {
    quote: 'They did not hand us an itinerary. They asked what we liked, then quietly rebuilt three days of it while we slept through a monsoon.',
    name: 'Marte & Idris',
    trip: 'The Island in Slow Motion — 12 days'
  },
  {
    quote: 'Our guide grew up two valleys from the estate we walked. That is the whole difference, and you feel it by the second morning.',
    name: 'Hannah Weiss',
    trip: 'Heritage & Horizon — 10 days'
  },
  {
    quote: 'We sat with a tracker for forty minutes in complete silence before the leopard came down. Nobody rushed us. Nobody ever did.',
    name: 'The Okonkwo family',
    trip: 'Wild Ceylon — 8 days'
  }
];
