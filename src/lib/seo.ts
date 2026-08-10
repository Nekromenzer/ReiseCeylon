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

/** `/destinations` in `de` is `/de/destinations`; in `en` it stays as it is. */
export function pathFor(path: string, locale: string) {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return clean === '' ? '/' : clean;
  return `/${locale}${clean}`;
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
