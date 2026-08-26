/**
 * The per-request i18n configuration next-intl asks for on every server render.
 *
 * Messages are loaded one language at a time — a French reader never downloads
 * the German catalogue. Server Components read this catalogue directly; each
 * client island receives only the namespaces it uses through `ClientMessages`.
 */
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, localeTags, routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    /* Dates and numbers follow the language, but the island keeps its own clock. */
    timeZone: 'Asia/Colombo',
    formats: {
      dateTime: {
        long: { day: 'numeric', month: 'long', year: 'numeric' }
      }
    },
    onError(error) {
      /* A missing key must never take a page down — it logs and renders the key. */
      if (process.env.NODE_ENV !== 'production') console.error(error);
    },
    getMessageFallback({ key, namespace }) {
      return [namespace, key].filter(Boolean).join('.');
    },
    /* Exposed so server helpers can format with the right BCP 47 tag. */
    now: new Date(),
    defaultTranslationValues: {
      locale: localeTags[locale]
    }
  };
});
