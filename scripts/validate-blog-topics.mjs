import { readFile } from 'node:fs/promises';
import { BLOG_SITE_ORIGIN, loadTopics } from './blog-automation-lib.mjs';

const topics = await loadTopics();
const atlas = JSON.parse(
  await readFile(new URL('../public/json/sri-lanka-tourist-places-map.json', import.meta.url), 'utf8')
);
const destinationSlugs = new Set(atlas.places.map((place) => place.slug));

for (const topic of topics) {
  for (const link of topic.internalLinks) {
    const url = new URL(link, BLOG_SITE_ORIGIN);
    if (url.origin !== BLOG_SITE_ORIGIN) throw new Error(`${topic.key} contains an external internal link: ${link}`);
    const destination = url.pathname.match(/^\/destinations\/([^/]+)$/)?.[1];
    if (destination && !destinationSlugs.has(destination)) {
      throw new Error(`${topic.key} links to an unknown destination: ${destination}`);
    }
    if (!/^\/(blog|destinations|journeys|tours)(\/|$)/.test(url.pathname)) {
      throw new Error(`${topic.key} contains an unsupported internal route: ${url.pathname}`);
    }
  }
}

console.log(`Validated ${topics.length} blog topics and their internal destination links.`);
