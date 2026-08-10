/** Shared formatting for the journal. */
import { localeTags } from '@/i18n/routing';

/** “11 August 2026”, in the reader's own conventions. */
export function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(localeTags[locale as keyof typeof localeTags] ?? 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * “Coast · 6 min read”. The reading-time phrase is translated by the caller and
 * passed in, since this runs on both sides of the client boundary.
 */
export function cardMeta(category: string | null, readingLabel: string | null) {
  return [category, readingLabel].filter(Boolean).join(' · ');
}
