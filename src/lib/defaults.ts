/**
 * The copy each page used before it became editable.
 *
 * Two consumers: `@/sanity/site` uses it as the fallback when the dataset is
 * empty, and `scripts/seed-site.mjs` uses it to fill the initial documents, so
 * the studio opens with exactly what the site already shows.
 */
export type Highlight = { title: string; copy: string };
export type Stage = { period: string; title: string; copy: string };

export const defaultHighlights: Highlight[] = [
  { title: 'The essential view', copy: 'Arrive before the day gathers pace and see the landscape in its softest light.' },
  { title: 'A local table', copy: 'Share seasonal food and conversation in a setting selected for character, not spectacle.' },
  { title: 'Room to wander', copy: 'A generous afternoon with a thoughtful route and no obligation to hurry.' }
];

export const defaultStages: Stage[] = [
  { period: 'Days 1–3', title: 'Begin in the old kingdoms', copy: 'Arrive gently, settle into the island and follow ancient paths through forest and stone.' },
  { period: 'Days 4–7', title: 'Move with the hills', copy: 'Take the slow train into tea country, walk the estates and dine by the fire as mist gathers.' },
  { period: 'Days 8–10', title: 'Follow the road south', copy: 'Trade mountain air for the coast, stopping at makers, markets and a secluded stay by the sea.' },
  { period: 'Days 11–12', title: 'End without hurrying', copy: 'Leave the final days open for saltwater, long lunches and one last Sri Lankan sunset.' }
];

export const destinationDefaults = {
  introHeading: 'Come for the landscape.\nStay for its quieter stories.',
  introCopy: (name: string) =>
    `${name} is more than a point on a map. We pair its essential landmarks with time to wander, meet people and notice the details that make a place memorable.`,
  goodToKnowHeading: 'Best from December to April, beautiful in every season.',
  goodToKnowCopy:
    'We plan around weather, local festivals and your preferred pace. Private transfers, handpicked stays, trusted guides and 24/7 in-country support can all be woven into your journey.'
};

export const tourDefaults = {
  introHeading: 'A route with direction,\nnever a rigid schedule.',
  introCopy:
    'Every stay, transfer and encounter is handled. The rhythm remains spacious, and every detail can be changed around your interests.',
  includedHeading: 'Private by design.\nSupported throughout.',
  includedCopy:
    'Handpicked accommodation, daily breakfast, private transport, specialist hosts, selected experiences and 24/7 local assistance are included. International flights and travel insurance are excluded.'
};

export const contactDefaults = {
  email: 'reiseceylon@gmail.com',
  phone: '+94 77 050 2482',
  location: 'Colombo, Sri Lanka',
  responseTime: 'within one working day'
};
