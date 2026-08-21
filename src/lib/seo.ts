/**
 * Canonical and hreflang urls.
 *
 * Every page declares the same content in all four languages, so a search engine
 * serves a German reader the German page rather than picking one and treating the
 * rest as duplicates. English carries no prefix — `localePrefix: 'as-needed'` —
 * so it is also the honest x-default.
 */
import type { Metadata } from 'next';
import { defaultLocale, localeTags, locales } from '@/i18n/routing';

/**
 * The one place the production origin is written down. `metadataBase`, the
 * sitemap, robots.txt, llms.txt, the feed and every `@id` in the structured data
 * read it from here — a JSON-LD graph whose nodes disagree about the origin is
 * a graph of unrelated nodes.
 */
export const SITE_URL = 'https://www.reiseceylon.com';

/** `/destinations` in `de` is `/de/destinations`; in `en` it stays as it is. */
export function pathFor(path: string, locale: string) {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return clean === '' ? '/' : clean;
  return `/${locale}${clean}`;
}

/** The same path as an absolute url. Structured data may not use relative ones. */
export function urlFor(path: string, locale: string = defaultLocale) {
  return `${SITE_URL}${pathFor(path, locale)}`;
}

/** A site-relative image path made absolute; an already-absolute one passes through. */
export function absoluteImage(src: string) {
  return src.startsWith('http') ? src : `${SITE_URL}${src.startsWith('/') ? src : `/${src}`}`;
}

export function alternatesFor(path: string, locale: string): Metadata['alternates'] {
  const languages: Record<string, string> = {};
  for (const entry of locales) languages[localeTags[entry]] = pathFor(path, entry);
  languages['x-default'] = pathFor(path, defaultLocale);

  return {
    canonical: pathFor(path, locale),
    languages
  };
}
