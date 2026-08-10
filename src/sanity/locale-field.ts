/**
 * Reading a translated field out of a Sanity document.
 *
 * A localised field is stored as an object keyed by language — `{ en, de, fr,
 * nl }` — and resolved here rather than in GROQ, because GROQ has no dynamic
 * attribute access: `note[$locale]` is not a thing you can write. Selecting the
 * whole object and picking the language in TypeScript costs a few hundred bytes
 * per document and works on every field uniformly.
 *
 * Three shapes reach this function, and all three must render:
 *
 *   { en: 'Ancient stone…', de: 'Alter Stein…' }   a translated field
 *   { en: 'Ancient stone…' }                        translated into English only
 *   'Ancient stone…'                                a plain string, written
 *                                                   before the field was
 *                                                   localised
 *
 * The last one is what keeps an un-migrated dataset rendering exactly as it did.
 * English is the fallback throughout: a German page shows the English sentence
 * an editor has written rather than an empty space, which is the right failure
 * for a page that is otherwise fully translated.
 */
import type { PortableTextBlock } from '@portabletext/types';

export type LocaleString = { en?: string } & Record<string, unknown>;

/** A localised string field, or the plain string a legacy document holds. */
export type MaybeLocalised = string | LocaleString | null | undefined;

export function pickLocale(value: MaybeLocalised, locale: string): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const entry = value as Record<string, unknown>;
    const chosen = entry[locale] ?? entry.en;
    if (typeof chosen === 'string') return chosen;
  }
  return '';
}

/**
 * The requested language only — no English fallback.
 *
 * Used for every field that has a professionally translated default behind it
 * (the intro, the highlights, the good-to-know, the SEO pair). On a German page
 * a German default beats an English sentence from the studio: it is the right
 * language, and the English one was generated rather than hand-written in the
 * first place. Anything an editor actually translates wins over both.
 *
 * A legacy plain string counts as English, so it is not returned here either —
 * which is what makes an un-migrated dataset render fully translated rather than
 * half and half.
 */
export function pickExact(value: MaybeLocalised, locale: string): string {
  if (value && typeof value === 'object') {
    const chosen = (value as Record<string, unknown>)[locale];
    if (typeof chosen === 'string') return chosen;
  }
  return '';
}

/** As above, but keeps null distinguishable from empty for optional fields. */
export function pickLocaleOrNull(value: MaybeLocalised, locale: string): string | null {
  const resolved = pickLocale(value, locale);
  return resolved.length > 0 ? resolved : null;
}

type LocalisedBlocks = Record<string, PortableTextBlock[] | undefined>;

/** The journal body — the same rule, over portable text rather than a string. */
export function pickLocaleBlocks(
  value: PortableTextBlock[] | LocalisedBlocks | null | undefined,
  locale: string
): PortableTextBlock[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const entry = value as LocalisedBlocks;
    const chosen = entry[locale] ?? entry.en;
    if (Array.isArray(chosen)) return chosen;
  }
  return [];
}
