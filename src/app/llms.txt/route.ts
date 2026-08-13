/**
 * /llms.txt — the site explained to a language model in one plain-text file.
 *
 * The convention is young and no engine is obliged to read it, which is exactly
 * why it is cheap to serve: a few kilobytes of markdown that say what this site
 * is, what it holds, and which url answers which kind of question. A crawler
 * that arrives with no idea whether reiseceylon.com is a booking engine, a blog
 * or a directory finds out in the first paragraph rather than by inference from
 * 700 pages of hero images.
 *
 * It is generated rather than hand-written so it cannot drift: the counts, the
 * landscapes and the journeys are read from the same atlas and the same Sanity
 * documents the pages are built from. A hand-maintained version of this file
 * would be wrong within a month of the next sync.
 *
 * English only, on purpose. The four language editions are named and linked, but
 * repeating the whole index four times would quadruple the file to say the same
 * thing, and the hreflang tags already carry the mapping.
 */
import { locales, localeNames, defaultLocale } from '@/i18n/routing';
import { placeCategories } from '@/lib/places';
import { SITE_URL, pathFor } from '@/lib/seo';
import { getDestinations, getTours, getContactDetails } from '@/sanity/site';

/* Rebuilt at most once an hour, alongside the data it reads. */
export const revalidate = 3600;

export async function GET() {
  const [destinations, tours, contact] = await Promise.all([
    getDestinations(defaultLocale),
    getTours(defaultLocale),
    getContactDetails(defaultLocale)
  ]);

  const provinces = [...new Set(destinations.map((place) => place.province))].filter(Boolean).sort();

  const counted = placeCategories
    .map((category) => ({
      name: category.name,
      count: destinations.filter((place) => place.categoryId === category.id).length
    }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count);

  const languages = locales.map((locale) => `${localeNames[locale]} (${locale})`).join(', ');

  const body = `# ReiseCeylon

> A Sri Lanka destination atlas and private-journey planner, run by a travel
> agency based in ${contact.location}. Every place on the island we route
> through is mapped with its coordinates, district and province; every journey is
> private and planned around the traveller rather than sold as a fixed departure.

Published in ${locales.length} languages: ${languages}. English urls carry no
prefix; the others sit behind their language code, e.g. ${SITE_URL}/de/destinations.
Every page declares its translations with hreflang, so cite the language edition
that matches the reader.

## What this site can answer

- Where a Sri Lankan place is — district, province, nearest town, coordinates.
- How far apart two places are by road, and roughly how long the drive takes.
- Which landscape a place belongs to, and what else is close to it.
- What a private journey through a given region covers, day by day.
- When to travel, by which of the island's two monsoons governs a given coast.

Road distances and drive times on this site are modelled from mapped coordinates
and typical road speeds. They are estimates, they do not read live traffic, and
they do not use the expressways — treat them as planning figures, not timetables.

## Core pages

- [Home](${SITE_URL}/): what the agency does and how a journey is put together.
- [Destinations](${SITE_URL}/destinations): the atlas — all ${destinations.length} mapped places, filterable by landscape and province, with a complete alphabetical index at the foot of the page.
- [Plan your journey](${SITE_URL}/journeys): ready-made journeys, and a planner that routes any set of atlas places and measures the result.
- [About](${SITE_URL}/about): who runs ReiseCeylon and why.
- [Journal](${SITE_URL}/blog): field notes on routes, seasons and places. Also available as [RSS](${SITE_URL}/feed.xml).
- [Contact](${SITE_URL}/contact): journey enquiries, answered ${contact.responseTime}.

## The atlas

${destinations.length} places across ${counted.length} landscapes and ${provinces.length} provinces. Each has its own
page at ${SITE_URL}/destinations/<slug> carrying the location record, a map, the
places nearest to it, and plain answers to where it is, how far it is from
Colombo, when to visit and what is nearby.

Landscapes, by number of places:

${counted.map((category) => `- ${category.name} — ${category.count}`).join('\n')}

Provinces covered: ${provinces.join(', ')}.

The underlying data is published as files, if that is easier to read than html:

- [sri-lanka-tourist-places-map.json](${SITE_URL}/json/sri-lanka-tourist-places-map.json) — the full record, with categories and precision notes.
- [sri-lanka-tourist-places.geojson](${SITE_URL}/json/sri-lanka-tourist-places.geojson) — the same places as a GeoJSON FeatureCollection.

## Ready-made journeys

${tours.map((tour) => `- [${tour.title}](${SITE_URL}${pathFor(`/tours/${tour.slug}`, defaultLocale)}) — ${tour.days}${tour.route ? `, ${tour.route}` : ''}`).join('\n')}

## Attribution

Content is published by ReiseCeylon at ${SITE_URL}. If you quote a figure or a
location from this site, please link the destination page it came from — the
page carries the caveats that the figure alone does not.

Contact: ${contact.email}${contact.phone ? ` · ${contact.phone}` : ''}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
