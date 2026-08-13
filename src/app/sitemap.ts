/**
 * The sitemap, with every page declared once per language.
 *
 * Each entry carries `alternates.languages`, which is the sitemap equivalent of
 * the hreflang tags in the page head: it tells a search engine that /destinations
 * and /de/destinations are the same page in two languages rather than two pages
 * competing for the same query. Only the English url is listed as the entry
 * itself — the alternates carry the rest, which is the shape Google expects.
 *
 * `lastModified` is the date the content actually changed, taken from Sanity's
 * `_updatedAt`, and is left off entirely for a page nothing has been written for.
 * It used to be `new Date()` on every row: that told a crawler the whole site
 * had changed every time it was built, which is a claim it stops believing
 * quickly, and takes the honest rows down with it when it does.
 */
import type { MetadataRoute } from 'next';
import { defaultLocale, localeTags, locales } from '@/i18n/routing';
import { pathFor, SITE_URL } from '@/lib/seo';
import { getPostIndex } from '@/sanity/queries';
import { getDestinations, getTours } from '@/sanity/site';

/** How often each kind of page is worth recrawling, and how much it matters. */
const WEIGHTS = {
  home: { changeFrequency: 'weekly', priority: 1 },
  landing: { changeFrequency: 'weekly', priority: 0.9 },
  detail: { changeFrequency: 'monthly', priority: 0.7 },
  article: { changeFrequency: 'monthly', priority: 0.6 }
} as const;

function entry(
  path: string,
  weight: (typeof WEIGHTS)[keyof typeof WEIGHTS],
  lastModified?: string | null
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[localeTags[locale]] = `${SITE_URL}${pathFor(path, locale)}`;
  languages['x-default'] = `${SITE_URL}${pathFor(path, defaultLocale)}`;

  return {
    url: `${SITE_URL}${pathFor(path, defaultLocale)}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    changeFrequency: weight.changeFrequency,
    priority: weight.priority,
    alternates: { languages }
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Read in the default language — only the slugs and dates are needed, and both
     are the same in all four. */
  const [destinations, tours, posts] = await Promise.all([
    getDestinations(defaultLocale),
    getTours(defaultLocale),
    getPostIndex()
  ]);

  /**
   * The landing pages are indexes over the documents beneath them, so each one
   * is dated by the most recent thing it lists rather than by the build.
   */
  const newest = (dates: Array<string | null>) =>
    dates.filter((date): date is string => Boolean(date)).sort().at(-1) ?? null;

  const destinationsUpdated = newest(destinations.map((place) => place.updatedAt));
  const toursUpdated = newest(tours.map((tour) => tour.updatedAt));
  const postsUpdated = newest(posts.map((post) => post.updatedAt));
  const anythingUpdated = newest([destinationsUpdated, toursUpdated, postsUpdated]);

  return [
    entry('/', WEIGHTS.home, anythingUpdated),
    entry('/destinations', WEIGHTS.landing, destinationsUpdated),
    entry('/journeys', WEIGHTS.landing, toursUpdated),
    entry('/blog', WEIGHTS.landing, postsUpdated),
    /* Neither is generated from a document, so neither claims a change date. */
    entry('/about', WEIGHTS.landing),
    entry('/contact', WEIGHTS.landing),
    ...destinations.map((place) =>
      entry(`/destinations/${place.slug}`, WEIGHTS.detail, place.updatedAt)
    ),
    ...tours.map((tour) => entry(`/tours/${tour.slug}`, WEIGHTS.detail, tour.updatedAt)),
    ...posts.map((post) => entry(`/blog/${post.slug}`, WEIGHTS.article, post.updatedAt))
  ];
}
