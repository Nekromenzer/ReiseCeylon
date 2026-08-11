import { readFileSync } from 'node:fs';

const editorial = JSON.parse(
  readFileSync(new URL('./destination-editorial.json', import.meta.url), 'utf8')
);

const regionNames = {
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

const profiles = {
  beaches: {
    label: 'beach',
    search: 'a Sri Lankan beach for sea views, warm shallows and time on the coast',
    note: 'Salt air, open sand and an easy coastal rhythm',
    heading: (p) => `Meet ${p.name} at the water's edge.`,
    highlights: [
      ['The shoreline', (p) => `Walk ${p.name} before the beach grows busy, when the sand is cool and the coast feels most spacious.`],
      ['The blue hour', (p) => `Leave room for an unhurried sea view; light and water conditions around ${p.city} change the mood by the hour.`],
      ['Beyond the sand', (p) => `Pair the beach with a local meal or a short coastal stop in ${p.district} rather than treating it as a quick photo call.`]
    ],
    know: 'Sea conditions and seasonal weather matter. We check local advice before timing swims, boat trips and transfers.'
  },
  'ancient-cities-and-ruins': {
    label: 'heritage site',
    search: 'an ancient Sri Lankan site shaped by architecture, archaeology and living history',
    note: 'Old stone, layered history and stories held in the landscape',
    heading: (p) => `Read the island's history at ${p.name}.`,
    highlights: [
      ['The first approach', (p) => `Arrive at ${p.name} early enough to notice how the monument, ruins and surrounding landscape fit together.`],
      ['The human story', (p) => `A knowledgeable local guide can turn carved details and weathered stone into a clearer story of ${p.region}.`],
      ['Time to look closely', (p) => `Keep the visit spacious, with time for the quieter corners and nearby heritage of ${p.district}.`]
    ],
    know: 'Modest clothing, sun protection and an early start make heritage visits more comfortable. Access rules can change around sacred areas.'
  },
  temples: {
    label: 'temple',
    search: 'a Sri Lankan temple where architecture, ritual and local devotion meet',
    note: 'Sacred architecture, quiet courtyards and living ritual',
    heading: (p) => `Enter ${p.name} with time and respect.`,
    highlights: [
      ['The sacred setting', (p) => `Pause on the approach to ${p.name}; its courtyards, thresholds and surrounding landscape are part of the experience.`],
      ['Living tradition', (p) => `Visit with a local host who can explain the customs and continuing place of worship within ${p.region}.`],
      ['Details worth seeing', (p) => `Look beyond the main shrine to the craftsmanship, offerings and smaller architectural details around the complex.`]
    ],
    know: 'Cover shoulders and knees, remove footwear where requested and avoid interrupting worship. Festival days may change access and timings.'
  },
  waterfalls: {
    label: 'waterfall',
    search: 'a Sri Lankan waterfall surrounded by highland scenery and forest',
    note: 'Falling water, green slopes and cool highland air',
    heading: (p) => `Follow the landscape to ${p.name}.`,
    highlights: [
      ['The full view', (p) => `See ${p.name} from a safe established viewpoint before moving closer; scale is easiest to read from a little distance.`],
      ['The walk in', (p) => `Let the route from ${p.city} be part of the visit, with time for changing vegetation, valley views and village life.`],
      ['After the rain', (p) => `Water volume can transform the falls, so we balance the most dramatic conditions with safe paths and clear local advice.`]
    ],
    know: 'Rocks and paths can become slippery without warning. We check rainfall, road access and local safety guidance before every visit.'
  },
  'natural-pools': {
    label: 'natural pool',
    search: 'a river-fed natural pool in Sri Lanka for a scenic stop in the hills',
    note: 'Clear river water, smooth rock and a quiet forest pause',
    heading: (p) => `Slow down beside ${p.name}.`,
    highlights: [
      ["The water's edge", (p) => `Take in ${p.name} from firm ground first and notice the current, depth and changing colour of the water.`],
      ['The way there', (p) => `The approach through ${p.city} adds forest, river and village detail to what might otherwise be a brief stop.`],
      ['A careful pause', (p) => `Stay only where local conditions allow; the best experience is quiet, low-impact and respectful of people downstream.`]
    ],
    know: 'Natural pools are not supervised. Rain upstream can change currents quickly, so swimming should follow current local guidance only.'
  },
  'national-parks-and-wildlife': {
    label: 'wildlife destination',
    search: 'a Sri Lankan wildlife destination for patient, responsible encounters in nature',
    note: 'Wild country, patient observation and room for nature to lead',
    heading: (p) => `Let the wild set the pace at ${p.name}.`,
    highlights: [
      ['The early hours', (p) => `Begin at ${p.name} when temperatures are gentler and wildlife activity can be easier to read.`],
      ["A naturalist's eye", (p) => `Travel with a responsible guide who notices tracks, calls and habitat—not only the largest animals.`],
      ['Space for wildlife', (p) => `Choose a patient route through ${p.region}, keeping distance and never pressing an encounter for a photograph.`]
    ],
    know: 'Sightings are never guaranteed. Park access, routes and opening times can change, and responsible viewing always takes priority.'
  },
  'mountains-and-hiking': {
    label: 'hike',
    search: 'a Sri Lankan mountain walk with highland views, changing weather and rewarding trails',
    note: 'High paths, wide views and the quiet rhythm of a climb',
    heading: (p) => `Take the longer view from ${p.name}.`,
    highlights: [
      ['The trail', (p) => `Give ${p.name} enough time for a steady pace, rest stops and the smaller details that disappear when a walk is rushed.`],
      ['The changing view', (p) => `Cloud and light move quickly across ${p.region}; pauses along the route can be as rewarding as the summit.`],
      ['A grounded finish', (p) => `Return through ${p.city} for a simple meal and an easy end to the day rather than packing in another long transfer.`]
    ],
    know: 'Trail conditions and visibility change quickly in the hills. Carry water and rain protection, and use a local guide where routes are unclear.'
  },
  'lakes-and-reservoirs': {
    label: 'lake',
    search: 'a Sri Lankan lake or reservoir for waterside scenery, birdlife and calm evening light',
    note: 'Still water, broad skies and an unhurried horizon',
    heading: (p) => `Find a quieter horizon at ${p.name}.`,
    highlights: [
      ['Along the water', (p) => `Trace the edge of ${p.name} slowly and look for the viewpoints where water, hills and settlement meet.`],
      ['Evening light', (p) => `Later hours often soften the landscape around ${p.city}, creating a calm stop between busier days.`],
      ['The wider story', (p) => `Ask how the water shapes farming, wildlife and daily life across ${p.district}; the view is only one part of the place.`]
    ],
    know: 'Water levels, access roads and boat availability vary. We confirm current conditions locally and avoid unsupervised swimming.'
  },
  'scenic-viewpoints': {
    label: 'viewpoint',
    search: 'a Sri Lankan viewpoint with expansive scenery across hills, valleys and tea country',
    note: "Long views, shifting cloud and a sense of the island's scale",
    heading: (p) => `Watch the island unfold from ${p.name}.`,
    highlights: [
      ['The clearest light', (p) => `Reach ${p.name} early when possible; cloud often builds as the day warms across ${p.region}.`],
      ['Look beyond the edge', (p) => `Take time to read the ridges, roads and settlements below instead of treating the viewpoint as a single photograph.`],
      ['The road there', (p) => `The route through ${p.city} can carry tea slopes, forest and village stops that make the journey as memorable as the view.`]
    ],
    know: 'Visibility changes fast in the highlands. We keep timing flexible and check road, trail and weather conditions on the day.'
  },
  'scenic-train-destinations': {
    label: 'rail destination',
    search: 'a stop on Sri Lanka’s scenic hill-country railway with mountain views and local character',
    note: 'Blue trains, misted hills and the pleasure of arriving slowly',
    heading: (p) => `Arrive slowly in ${p.name}.`,
    highlights: [
      ['The rail journey', (p) => `Let the approach to ${p.name} be part of the day, with time to watch tea slopes, forest and small stations pass.`],
      ['Step beyond the platform', (p) => `Continue into ${p.district} rather than turning straight around; the station is a doorway, not the whole destination.`],
      ['A flexible seat', (p) => `Build in time around the timetable so delays or changing weather do not turn a beautiful rail day into a rushed one.`]
    ],
    know: 'Train times, carriage classes and seat availability can change. We verify the latest schedule and keep road alternatives in the plan.'
  },
  islands: {
    label: 'island',
    search: 'a Sri Lankan island with coastal landscapes, local communities and a slower pace',
    note: 'A short crossing, open horizons and life shaped by the sea',
    heading: (p) => `Cross the water to ${p.name}.`,
    highlights: [
      ['The crossing', (p) => `Approach ${p.name} without hurrying; the change in water, wind and horizon begins before arrival.`],
      ['Island rhythm', (p) => `Spend time beyond the landing point and notice how daily life in ${p.district} is shaped by distance and the sea.`],
      ['A lighter footprint', (p) => `Carry what you need, support small local businesses and leave beaches and paths exactly as you found them.`]
    ],
    know: 'Ferries and sea conditions are weather-dependent. Confirm return options, carry water and respect local transport and community guidance.'
  },
  'botanical-gardens-and-parks': {
    label: 'garden',
    search: 'a Sri Lankan garden or city park for tropical plants, shaded walks and a slower hour',
    note: 'Leafy paths, tropical planting and welcome shade',
    heading: (p) => `Walk the greener side of ${p.city} at ${p.name}.`,
    highlights: [
      ['The shaded route', (p) => `Give ${p.name} more than a quick circuit, following quieter paths as well as the best-known avenues.`],
      ['Tropical detail', (p) => `Look closely at form, texture and seasonal colour; the smallest plantings often reward the most attention.`],
      ['A breathing space', (p) => `Use the garden as an unhurried pause within ${p.district}, especially between denser city or heritage visits.`]
    ],
    know: 'Opening times and flowering seasons vary. Early or late visits are usually cooler, with comfortable shoes useful after rain.'
  },
  'marine-and-coastal-attractions': {
    label: 'coastal experience',
    search: 'a Sri Lankan coastal experience focused on marine life, conservation and the Indian Ocean',
    note: 'Ocean life, coastal knowledge and the sea seen responsibly',
    heading: (p) => `See the coast differently at ${p.name}.`,
    highlights: [
      ['The marine setting', (p) => `Understand ${p.name} as part of a wider coastal ecosystem, not an isolated attraction.`],
      ['Responsible encounters', (p) => `Choose operators around ${p.city} who put distance, animal welfare and local rules before speed or spectacle.`],
      ['The coast on land', (p) => `Leave time for the communities and shoreline of ${p.district}; the ocean story continues beyond the activity itself.`]
    ],
    know: 'Wildlife, visibility and sea conditions are never guaranteed. Ethical operators and current local guidance determine whether an outing should run.'
  }
};

function shorten(value, max) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,:;—-]+$/, '');
  return `${cut}.`;
}

function titleFor(name) {
  const candidates = [
    `${name}, Sri Lanka | Travel Guide`,
    `Visit ${name} | Sri Lanka Guide`,
    `${name} | Sri Lanka`
  ];
  return candidates.find((title) => title.length <= 60) ?? shorten(name, 60);
}

function portableHighlights(profile, place) {
  return profile.highlights.map(([title, copy], index) => ({
    _type: 'highlight',
    _key: `seo-${index + 1}`,
    title,
    copy: copy(place)
  }));
}

export function buildDestinationContent(place) {
  const profile = profiles[place.categoryId];
  if (!profile) throw new Error(`No destination content profile for ${place.categoryId}`);

  const region = regionNames[place.province] ?? place.province;
  const area = place.city && place.city !== place.name ? place.city : place.district;
  const context = { ...place, region, area };
  const detailedSeoDescription = `Explore ${place.name} in ${area}, Sri Lanka: ${profile.search}. Find highlights and practical details for your visit.`;
  const conciseSeoDescription = `Visit ${place.name} in ${area}, Sri Lanka. See key highlights, nearby places and practical planning details for a thoughtful trip.`;
  const seoDescription =
    detailedSeoDescription.length <= 160 ? detailedSeoDescription : conciseSeoDescription;

  const placeEditorial = editorial[place.slug];
  if (!placeEditorial) throw new Error(`No destination editorial for ${place.slug}`);

  return {
    seoTitle: titleFor(place.name),
    seoDescription: placeEditorial.seoDescription ?? seoDescription,
    region,
    note: placeEditorial.note ?? profile.note,
    introHeading: placeEditorial.introHeading ?? profile.heading(context),
    introCopy: placeEditorial.introCopy,
    highlights: placeEditorial.highlights ?? portableHighlights(profile, context),
    goodToKnowHeading:
      placeEditorial.goodToKnowHeading ?? `Plan ${place.name} around the conditions, not the clock.`,
    goodToKnowCopy: placeEditorial.goodToKnowCopy ?? profile.know
  };
}

export function auditDestinationContent(atlas) {
  const rows = atlas.places.map((place) => ({ place, content: buildDestinationContent(place) }));
  const issues = [];
  const titles = new Map();
  const descriptions = new Map();
  const introCopies = new Map();
  const highlightCopies = new Map();

  for (const { place, content } of rows) {
    if (content.seoTitle.length > 60) issues.push(`${place.slug}: SEO title is ${content.seoTitle.length} characters`);
    if (content.seoDescription.length > 160) issues.push(`${place.slug}: SEO description is ${content.seoDescription.length} characters`);
    if (content.seoDescription.length < 110) issues.push(`${place.slug}: SEO description is only ${content.seoDescription.length} characters`);
    if (content.highlights.length !== 3) issues.push(`${place.slug}: expected 3 highlights`);
    const introWords = content.introCopy.trim().split(/\s+/).length;
    if (introWords < 70 || introWords > 125) issues.push(`${place.slug}: intro copy is ${introWords} words`);
    if (introCopies.has(content.introCopy)) issues.push(`${place.slug}: duplicate intro copy with ${introCopies.get(content.introCopy)}`);
    introCopies.set(content.introCopy, place.slug);
    for (const highlight of content.highlights) {
      if (highlightCopies.has(highlight.copy)) issues.push(`${place.slug}: duplicate highlight copy with ${highlightCopies.get(highlight.copy)}`);
      highlightCopies.set(highlight.copy, place.slug);
    }
    const editorialText = JSON.stringify(content).toLowerCase();
    for (const banned of ['without rushing', 'we shape', 'thoughtful trip', 'key highlights']) {
      if (editorialText.includes(banned)) issues.push(`${place.slug}: contains banned phrase “${banned}”`);
    }
    if (titles.has(content.seoTitle)) issues.push(`${place.slug}: duplicate SEO title with ${titles.get(content.seoTitle)}`);
    if (descriptions.has(content.seoDescription)) issues.push(`${place.slug}: duplicate SEO description with ${descriptions.get(content.seoDescription)}`);
    titles.set(content.seoTitle, place.slug);
    descriptions.set(content.seoDescription, place.slug);
  }

  return { rows, issues };
}
