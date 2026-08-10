/**
 * The journal body, defined once and reused per language.
 *
 * `blockContent` is the editor itself; `localeBlockContent` is four of them, one
 * per language. Pulling the array definition out of `post` is what makes the
 * localised version possible without repeating the whole marks-and-styles
 * configuration four times.
 */
import { defineArrayMember, defineField, defineType, type FieldDefinition } from 'sanity';
import { defaultLocale, localeNames, locales } from '../../i18n/routing';

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
        { title: 'Quote', value: 'blockquote' }
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' }
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' }
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'Url',
                type: 'url',
                validation: (rule) =>
                  rule.required().uri({ scheme: ['http', 'https', 'mailto', 'tel'] })
              })
            ]
          })
        ]
      }
    }),
    defineArrayMember({
      name: 'inlineImage',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alternative text', type: 'localeStringOptional' }),
        defineField({ name: 'caption', title: 'Caption', type: 'localeStringOptional' })
      ]
    })
  ]
});

export const localeBlockContent = defineType({
  name: 'localeBlockContent',
  title: 'Localised body',
  type: 'object',
  fieldsets: [
    { name: 'translations', title: 'Translations', options: { collapsible: true, collapsed: true } }
  ],
  fields: locales.map((locale) =>
    defineField({
      name: locale,
      title: localeNames[locale],
      type: 'blockContent',
      ...(locale === defaultLocale ? {} : { fieldset: 'translations' }),
      validation: (rule) => (locale === defaultLocale ? rule.required() : rule)
    })
  ) as FieldDefinition[]
});
