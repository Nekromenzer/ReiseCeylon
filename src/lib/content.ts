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

export const routeLine =
  'M294 314C302 360 263 378 258 416C252 455 303 470 306 510C310 552 353 566 352 612C351 655 274 675 208 690';

export const waypoints = [
  { name: 'Sigiriya', day: 'Day 02', x: 294, y: 314 },
  { name: 'Kandy', day: 'Day 04', x: 258, y: 416 },
  { name: 'Ella', day: 'Day 06', x: 306, y: 510 },
  { name: 'Yala', day: 'Day 08', x: 352, y: 612 },
  { name: 'Galle', day: 'Day 11', x: 208, y: 690 }
];

export type AttractionCategory = 'Heritage' | 'Wildlife' | 'Coast' | 'Hill country' | 'Nature' | 'City';

export const attractionCategories: Array<'All' | AttractionCategory> = [
  'All', 'Heritage', 'Wildlife', 'Coast', 'Hill country', 'Nature', 'City'
];

/* Coordinates are projected into the atlas SVG in HomePage. */
export const touristAttractions: Array<{
  name: string;
  region: string;
  category: AttractionCategory;
  lat: number;
  lon: number;
}> = [
  { name: 'Jaffna Fort', region: 'Jaffna', category: 'Heritage', lat: 9.662, lon: 80.009 },
  { name: 'Nallur Kandaswamy Kovil', region: 'Jaffna', category: 'Heritage', lat: 9.674, lon: 80.03 },
  { name: 'Nagadeepa Purana Vihara', region: 'Nainativu', category: 'Heritage', lat: 9.603, lon: 79.768 },
  { name: 'Delft Island', region: 'Northern Islands', category: 'Nature', lat: 9.507, lon: 79.696 },
  { name: 'Casuarina Beach', region: 'Karainagar', category: 'Coast', lat: 9.754, lon: 79.881 },
  { name: 'Elephant Pass', region: 'Kilinochchi', category: 'Nature', lat: 9.547, lon: 80.405 },
  { name: 'Mannar Fort', region: 'Mannar', category: 'Heritage', lat: 8.978, lon: 79.918 },
  { name: 'Adam’s Bridge', region: 'Mannar', category: 'Nature', lat: 9.083, lon: 79.522 },
  { name: 'Thiruketheeswaram Kovil', region: 'Mannar', category: 'Heritage', lat: 8.951, lon: 80.002 },
  { name: 'Anuradhapura Sacred City', region: 'North Central', category: 'Heritage', lat: 8.345, lon: 80.397 },
  { name: 'Mihintale', region: 'North Central', category: 'Heritage', lat: 8.35, lon: 80.514 },
  { name: 'Aukana Buddha Statue', region: 'North Central', category: 'Heritage', lat: 8.01, lon: 80.512 },
  { name: 'Ritigala Monastery', region: 'North Central', category: 'Heritage', lat: 8.12, lon: 80.653 },
  { name: 'Wilpattu National Park', region: 'North West', category: 'Wildlife', lat: 8.45, lon: 80.033 },
  { name: 'Kalpitiya Lagoon', region: 'North West', category: 'Coast', lat: 8.23, lon: 79.767 },
  { name: 'Sigiriya Rock Fortress', region: 'Cultural Triangle', category: 'Heritage', lat: 7.957, lon: 80.76 },
  { name: 'Pidurangala Rock', region: 'Cultural Triangle', category: 'Nature', lat: 7.966, lon: 80.761 },
  { name: 'Dambulla Cave Temple', region: 'Cultural Triangle', category: 'Heritage', lat: 7.856, lon: 80.649 },
  { name: 'Polonnaruwa Ancient City', region: 'North Central', category: 'Heritage', lat: 7.94, lon: 81.0 },
  { name: 'Minneriya National Park', region: 'North Central', category: 'Wildlife', lat: 8.039, lon: 80.897 },
  { name: 'Kaudulla National Park', region: 'North Central', category: 'Wildlife', lat: 8.161, lon: 80.905 },
  { name: 'Wasgamuwa National Park', region: 'Central East', category: 'Wildlife', lat: 7.72, lon: 80.94 },
  { name: 'Somawathiya National Park', region: 'North East', category: 'Wildlife', lat: 8.125, lon: 81.19 },
  { name: 'Trincomalee Fort Frederick', region: 'East Coast', category: 'Heritage', lat: 8.58, lon: 81.243 },
  { name: 'Koneswaram Temple', region: 'Trincomalee', category: 'Heritage', lat: 8.583, lon: 81.245 },
  { name: 'Nilaveli Beach', region: 'East Coast', category: 'Coast', lat: 8.683, lon: 81.199 },
  { name: 'Pigeon Island National Park', region: 'East Coast', category: 'Wildlife', lat: 8.722, lon: 81.205 },
  { name: 'Kanniya Hot Springs', region: 'Trincomalee', category: 'Nature', lat: 8.605, lon: 81.172 },
  { name: 'Pasikuda Beach', region: 'East Coast', category: 'Coast', lat: 7.929, lon: 81.561 },
  { name: 'Batticaloa Fort', region: 'East Coast', category: 'Heritage', lat: 7.714, lon: 81.703 },
  { name: 'Kandy Temple of the Tooth', region: 'Central Province', category: 'Heritage', lat: 7.294, lon: 80.642 },
  { name: 'Royal Botanical Gardens', region: 'Peradeniya', category: 'Nature', lat: 7.273, lon: 80.596 },
  { name: 'Udawattakele Sanctuary', region: 'Kandy', category: 'Nature', lat: 7.3, lon: 80.643 },
  { name: 'Ambuluwawa Tower', region: 'Gampola', category: 'Nature', lat: 7.161, lon: 80.548 },
  { name: 'Knuckles Mountain Range', region: 'Central Highlands', category: 'Hill country', lat: 7.457, lon: 80.8 },
  { name: 'Matale Aluvihare Temple', region: 'Matale', category: 'Heritage', lat: 7.494, lon: 80.623 },
  { name: 'Nuwara Eliya', region: 'Central Highlands', category: 'Hill country', lat: 6.97, lon: 80.77 },
  { name: 'Gregory Lake', region: 'Nuwara Eliya', category: 'Nature', lat: 6.956, lon: 80.779 },
  { name: 'Hakgala Botanical Garden', region: 'Nuwara Eliya', category: 'Nature', lat: 6.926, lon: 80.822 },
  { name: 'Horton Plains & World’s End', region: 'Central Highlands', category: 'Hill country', lat: 6.802, lon: 80.807 },
  { name: 'Adam’s Peak', region: 'Sabaragamuwa', category: 'Hill country', lat: 6.809, lon: 80.499 },
  { name: 'Bambarakanda Falls', region: 'Badulla', category: 'Nature', lat: 6.773, lon: 80.831 },
  { name: 'Ella Rock', region: 'Badulla', category: 'Hill country', lat: 6.856, lon: 81.057 },
  { name: 'Nine Arch Bridge', region: 'Ella', category: 'Hill country', lat: 6.877, lon: 81.061 },
  { name: 'Little Adam’s Peak', region: 'Ella', category: 'Hill country', lat: 6.866, lon: 81.063 },
  { name: 'Ravana Falls', region: 'Ella', category: 'Nature', lat: 6.841, lon: 81.054 },
  { name: 'Lipton’s Seat', region: 'Haputale', category: 'Hill country', lat: 6.778, lon: 81.016 },
  { name: 'Diyaluma Falls', region: 'Koslanda', category: 'Nature', lat: 6.733, lon: 81.032 },
  { name: 'Gal Oya National Park', region: 'Eastern Province', category: 'Wildlife', lat: 7.22, lon: 81.37 },
  { name: 'Maduru Oya National Park', region: 'Eastern Province', category: 'Wildlife', lat: 7.65, lon: 81.2 },
  { name: 'Arugam Bay', region: 'East Coast', category: 'Coast', lat: 6.84, lon: 81.836 },
  { name: 'Kumana National Park', region: 'South East', category: 'Wildlife', lat: 6.58, lon: 81.67 },
  { name: 'Yala National Park', region: 'South East', category: 'Wildlife', lat: 6.37, lon: 81.52 },
  { name: 'Kataragama Sacred City', region: 'Uva', category: 'Heritage', lat: 6.414, lon: 81.332 },
  { name: 'Buduruwagala Temple', region: 'Monaragala', category: 'Heritage', lat: 6.69, lon: 81.08 },
  { name: 'Udawalawe National Park', region: 'Sabaragamuwa', category: 'Wildlife', lat: 6.438, lon: 80.889 },
  { name: 'Bundala National Park', region: 'Southern Province', category: 'Wildlife', lat: 6.195, lon: 81.22 },
  { name: 'Sinharaja Rainforest', region: 'South West', category: 'Nature', lat: 6.404, lon: 80.47 },
  { name: 'Galle Fort', region: 'Southern Coast', category: 'Heritage', lat: 6.026, lon: 80.217 },
  { name: 'Unawatuna Beach', region: 'Southern Coast', category: 'Coast', lat: 6.01, lon: 80.249 },
  { name: 'Koggala Lake', region: 'Southern Coast', category: 'Nature', lat: 5.984, lon: 80.326 },
  { name: 'Mirissa Beach', region: 'Southern Coast', category: 'Coast', lat: 5.948, lon: 80.471 },
  { name: 'Dondra Head', region: 'Southern Coast', category: 'Coast', lat: 5.921, lon: 80.591 },
  { name: 'Hiriketiya Beach', region: 'Southern Coast', category: 'Coast', lat: 5.963, lon: 80.706 },
  { name: 'Tangalle Beach', region: 'Southern Coast', category: 'Coast', lat: 6.024, lon: 80.795 },
  { name: 'Hikkaduwa Marine Park', region: 'Southern Coast', category: 'Coast', lat: 6.14, lon: 80.101 },
  { name: 'Bentota Beach', region: 'West Coast', category: 'Coast', lat: 6.421, lon: 80.0 },
  { name: 'Brief Garden', region: 'Bentota', category: 'Nature', lat: 6.43, lon: 80.069 },
  { name: 'Colombo National Museum', region: 'Colombo', category: 'City', lat: 6.91, lon: 79.861 },
  { name: 'Gangaramaya Temple', region: 'Colombo', category: 'Heritage', lat: 6.916, lon: 79.856 },
  { name: 'Galle Face Green', region: 'Colombo', category: 'City', lat: 6.927, lon: 79.844 },
  { name: 'Pettah Market', region: 'Colombo', category: 'City', lat: 6.936, lon: 79.85 },
  { name: 'Kelaniya Raja Maha Vihara', region: 'Western Province', category: 'Heritage', lat: 6.956, lon: 79.922 },
  { name: 'Negombo Lagoon', region: 'West Coast', category: 'Coast', lat: 7.208, lon: 79.84 },
  { name: 'Pinnawala Elephant Orphanage', region: 'Sabaragamuwa', category: 'Wildlife', lat: 7.301, lon: 80.388 },
  { name: 'Yapahuwa Rock Fortress', region: 'North West', category: 'Heritage', lat: 7.817, lon: 80.311 }
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
