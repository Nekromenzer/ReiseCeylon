/**
 * The sitemap, with every page declared once per language.
 *
 * Each entry carries `alternates.languages`, which is the sitemap equivalent of
 * the hreflang tags in the page head: it tells a search engine that /destinations
 * and /de/destinations are the same page in two languages rather than two pages
 * competing for the same query. Only the English url is listed as the entry
 * itself — the alternates carry the rest, which is the shape Google expects.
 */
import type { MetadataRoute } from 'next';
import { defaultLocale, localeTags, locales } from '@/i18n/routing';
import { pathFor } from '@/lib/seo';
import { getPostSlugs } from '@/sanity/queries';
import { getDestinations, getTours } from '@/sanity/site';

const SITE = 'https://reiseceylon.com';

/** How often each kind of page is worth recrawling, and how much it matters. */
const WEIGHTS = {
  home: { changeFrequency: 'weekly', priority: 1 },
  landing: { changeFrequency: 'weekly', priority: 0.9 },
  detail: { changeFrequency: 'monthly', priority: 0.7 },
  article: { changeFrequency: 'monthly', priority: 0.6 }
} as const;

function entry(path: string, weight: (typeof WEIGHTS)[keyof typeof WEIGHTS]): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[localeTags[locale]] = `${SITE}${pathFor(path, locale)}`;
  languages['x-default'] = `${SITE}${pathFor(path, defaultLocale)}`;

  return {
    url: `${SITE}${pathFor(path, defaultLocale)}`,
    lastModified: new Date(),
    changeFrequency: weight.changeFrequency,
    priority: weight.priority,
    alternates: { languages }
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Read in the default language — only the slugs are needed, and they are the
     same in all four. */
  const [destinations, tours, postSlugs] = await Promise.all([
    getDestinations(defaultLocale),
    getTours(defaultLocale),
    getPostSlugs()
  ]);

  return [
    entry('/', WEIGHTS.home),
    ...['/destinations', '/journeys', '/about', '/blog', '/contact'].map((path) =>
      entry(path, WEIGHTS.landing)
    ),
    ...destinations.map((place) => entry(`/destinations/${place.slug}`, WEIGHTS.detail)),
    ...tours.map((tour) => entry(`/tours/${tour.slug}`, WEIGHTS.detail)),
    ...postSlugs.map((slug) => entry(`/blog/${slug}`, WEIGHTS.article))
  ];
}
