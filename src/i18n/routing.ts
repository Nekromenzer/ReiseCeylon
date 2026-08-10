/**
 * The four languages the site speaks, and how they appear in the url.
 *
 * English is the default and carries no prefix — /destinations stays
 * /destinations, so every link already indexed by a search engine, printed in an
 * itinerary or shared by a traveller keeps working untouched. The other three
 * sit behind their own segment: /de/destinations, /fr/..., /nl/...
 *
 * `localePrefix: 'as-needed'` is what buys that: next-intl's middleware rewrites
 * an unprefixed request onto the `en` segment internally, so the route tree can
 * be a single `[locale]` folder without English paying for it.
 */
import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'de', 'fr', 'nl'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** What the language switcher shows — each language named in its own tongue. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  nl: 'Nederlands'
};

/** The short form on the switcher button. */
export const localeLabels: Record<Locale, string> = {
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  nl: 'NL'
};

/** BCP 47 tags for `<html lang>`, `hreflang` and Intl formatting. */
export const localeTags: Record<Locale, string> = {
  en: 'en',
  de: 'de',
  fr: 'fr',
  nl: 'nl'
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  /*
   * The traveller's own choice is remembered, but only after they make one.
   * Accept-Language alone is not allowed to move someone off the url they asked
   * for — a German speaker who follows a link to an English page gets that page.
   */
  localeDetection: true,
  localeCookie: {
    name: 'RC_LOCALE',
    maxAge: 60 * 60 * 24 * 365
  }
});

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
