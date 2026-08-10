/**
 * Translatable field types.
 *
 * A localised field is one object holding the same sentence in each language.
 * English is required and leads, the other three sit under it and may be left
 * empty — an untranslated field falls back to English on the site rather than
 * rendering blank, so a half-translated dataset is a working dataset.
 *
 * Storing the languages inside one field, rather than as `noteDe` / `noteFr`
 * siblings, keeps the document readable and lets a new language be added by
 * editing this file alone.
 */
import { defineField, defineType, type FieldDefinition } from 'sanity';
import { localeNames, locales, defaultLocale } from '../../i18n/routing';

type Options = { rows?: number; max?: number; requireDefault?: boolean };

function languageFields(type: 'string' | 'text', options: Options = {}): FieldDefinition[] {
  return locales.map((locale) =>
    defineField({
      name: locale,
      title: localeNames[locale],
      type,
      ...(type === 'text' && options.rows ? { rows: options.rows } : {}),
      validation: (rule) => {
        const bounded = options.max ? rule.max(options.max) : rule;
        return locale === defaultLocale && options.requireDefault !== false
          ? bounded.required()
          : bounded;
      }
    })
  ) as FieldDefinition[];
}

/**
 * The editor sees English expanded and the translations collapsed beneath it,
 * so a document that has never been translated still reads as a simple form.
 */
const translationGroups = [
  { name: 'translations', title: 'Translations' }
] as const;

export const localeString = defineType({
  name: 'localeString',
  title: 'Localised text',
  type: 'object',
  fieldsets: [{ name: 'translations', title: 'Translations', options: { collapsible: true, collapsed: true } }],
  fields: languageFields('string').map((field) =>
    field.name === defaultLocale ? field : { ...field, fieldset: 'translations' }
  ) as FieldDefinition[],
  preview: {
    select: { title: defaultLocale },
    prepare: ({ title }: { title?: string }) => ({ title: title || '—' })
  }
});

export const localeText = defineType({
  name: 'localeText',
  title: 'Localised copy',
  type: 'object',
  fieldsets: [{ name: 'translations', title: 'Translations', options: { collapsible: true, collapsed: true } }],
  fields: languageFields('text', { rows: 4 }).map((field) =>
    field.name === defaultLocale ? field : { ...field, fieldset: 'translations' }
  ) as FieldDefinition[],
  preview: {
    select: { title: defaultLocale },
    prepare: ({ title }: { title?: string }) => ({ title: title || '—' })
  }
});

/** Optional variants — nothing is required, used where the field itself is optional. */
export const localeStringOptional = defineType({
  name: 'localeStringOptional',
  title: 'Localised text (optional)',
  type: 'object',
  fieldsets: [{ name: 'translations', title: 'Translations', options: { collapsible: true, collapsed: true } }],
  fields: languageFields('string', { requireDefault: false }).map((field) =>
    field.name === defaultLocale ? field : { ...field, fieldset: 'translations' }
  ) as FieldDefinition[],
  preview: {
    select: { title: defaultLocale },
    prepare: ({ title }: { title?: string }) => ({ title: title || '—' })
  }
});

export const localeTextOptional = defineType({
  name: 'localeTextOptional',
  title: 'Localised copy (optional)',
  type: 'object',
  fieldsets: [{ name: 'translations', title: 'Translations', options: { collapsible: true, collapsed: true } }],
  fields: languageFields('text', { rows: 4, requireDefault: false }).map((field) =>
    field.name === defaultLocale ? field : { ...field, fieldset: 'translations' }
  ) as FieldDefinition[],
  preview: {
    select: { title: defaultLocale },
    prepare: ({ title }: { title?: string }) => ({ title: title || '—' })
  }
});

export const localeFieldTypes = [
  localeString,
  localeText,
  localeStringOptional,
  localeTextOptional
];

export { translationGroups };
