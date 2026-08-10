import { defineArrayMember, defineField, defineType } from 'sanity';
import { placeCategories, provinces } from '../../lib/places';

/**
 * A destination is one place on the island — a beach, a ruin, a waterfall, a hill
 * station. The document has two halves:
 *
 *   Story    — what an editor writes: the note, the intro, the highlights.
 *   Location — the factual record, kept in step with public/json by
 *              `npm run sync:destinations`. Editors can correct it, but a re-sync
 *              will restore whatever the atlas says.
 */
export const destination = defineType({
  name: 'destination',
  title: 'Destination',
  type: 'document',
  groups: [
    { name: 'story', title: 'Story', default: true },
    { name: 'seo', title: 'SEO' },
    { name: 'location', title: 'Location' }
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'localeString',
      group: 'story',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The url: /destinations/your-slug',
      options: { source: 'name.en', maxLength: 96 },
      group: 'story',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'localeStringOptional',
      description: 'Cultural Triangle, Hill Country, Southern Coast… Falls back to the province.',
      group: 'story'
    }),
    defineField({
      name: 'note',
      title: 'Short note',
      type: 'localeStringOptional',
      description: 'One line under the name on a card, e.g. “Ancient stone, jungle horizons”.',
      group: 'story'
    }),
    defineField({
      name: 'image',
      title: 'Photograph',
      type: 'image',
      description: 'Leave empty to use the sample plate at /images/destination/<slug>.jpg.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alternative text', type: 'localeStringOptional' })],
      group: 'story'
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Featured destinations lead the homepage and the top of /destinations.',
      initialValue: false,
      group: 'story'
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lowest first, among featured destinations.',
      initialValue: 100,
      group: 'story'
    }),
    defineField({
      name: 'introHeading',
      title: 'Intro heading',
      type: 'localeTextOptional',
      description: 'The large quote near the top of the destination page. Line breaks are kept.',
      group: 'story'
    }),
    defineField({
      name: 'introCopy',
      title: 'Intro copy',
      type: 'localeTextOptional',
      group: 'story'
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      description: 'The numbered cards. Three works best with the layout.',
      group: 'story',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'highlight',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'localeString', validation: (rule) => rule.required() }),
            defineField({ name: 'copy', title: 'Copy', type: 'localeText', validation: (rule) => rule.required() })
          ],
          preview: { select: { title: 'title.en', subtitle: 'copy.en' } }
        })
      ],
      validation: (rule) => rule.max(6)
    }),
    defineField({
      name: 'goodToKnowHeading',
      title: 'Good to know — heading',
      type: 'localeTextOptional',
      description: 'e.g. “Best from December to April, beautiful in every season.”',
      group: 'story'
    }),
    defineField({
      name: 'goodToKnowCopy',
      title: 'Good to know — copy',
      type: 'localeTextOptional',
      group: 'story'
    }),

    /* --------------------------------------------------------------------- SEO */

    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'localeStringOptional',
      description: 'Search-result title. Keep it specific and at or below 60 characters, in every language.',
      group: 'seo'
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'localeTextOptional',
      description: 'Search-result summary. Aim for 120–160 characters in every language, and describe this place honestly.',
      group: 'seo'
    }),

    /* ---------------------------------------------------------------- location */

    defineField({
      name: 'categoryId',
      title: 'Category',
      type: 'string',
      group: 'location',
      options: {
        list: placeCategories.map(({ id, name }) => ({ title: name, value: id }))
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'province',
      title: 'Province',
      type: 'string',
      group: 'location',
      options: { list: provinces },
      validation: (rule) => rule.required()
    }),
    defineField({ name: 'district', title: 'District', type: 'string', group: 'location' }),
    defineField({ name: 'city', title: 'Nearest town', type: 'string', group: 'location' }),
    defineField({
      name: 'location',
      title: 'Coordinates',
      type: 'geopoint',
      description: 'WGS84. Drives the map, the distance list and the directions links.',
      group: 'location'
    }),
    defineField({
      name: 'precision',
      title: 'Point precision',
      type: 'string',
      group: 'location',
      initialValue: 'exact',
      options: {
        list: [
          { title: 'Exact — a mapped entrance or landmark', value: 'exact' },
          { title: 'Representative — the usual meeting point', value: 'representative' },
          { title: 'Area centroid — the middle of a large area', value: 'area-centroid' }
        ]
      }
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'location',
      initialValue: 'published',
      options: {
        list: [
          { title: 'Published', value: 'published' },
          { title: 'Hidden', value: 'hidden' }
        ],
        layout: 'radio'
      }
    }),
    defineField({
      name: 'atlasId',
      title: 'Atlas id',
      type: 'string',
      description: 'Set by the sync script. Identifies the record in public/json.',
      group: 'location',
      readOnly: true
    })
  ],
  orderings: [
    { title: 'Display order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Name', name: 'nameAsc', by: [{ field: 'name.en', direction: 'asc' }] },
    {
      title: 'Province',
      name: 'provinceAsc',
      by: [
        { field: 'province', direction: 'asc' },
        { field: 'name.en', direction: 'asc' }
      ]
    }
  ],
  preview: {
    select: { title: 'name.en', province: 'province', categoryId: 'categoryId', media: 'image' },
    prepare: ({ title, province, categoryId, media }) => ({
      title,
      subtitle: [placeCategories.find((entry) => entry.id === categoryId)?.name, province]
        .filter(Boolean)
        .join(' · '),
      media
    })
  }
});
