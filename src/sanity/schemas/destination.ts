import { defineArrayMember, defineField, defineType } from 'sanity';

export const destination = defineType({
  name: 'destination',
  title: 'Destination',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The url: /destinations/your-slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      description: 'Cultural Triangle, Hill Country, Southern Coast…',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'note',
      title: 'Short note',
      type: 'string',
      description: 'One line under the name on the homepage, e.g. “Ancient stone, jungle horizons”.',
      validation: (rule) => rule.required().max(90)
    }),
    defineField({
      name: 'image',
      title: 'Photograph',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alternative text', type: 'string' })],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lowest first, on the homepage and everywhere else.',
      initialValue: 100
    }),
    defineField({
      name: 'introHeading',
      title: 'Intro heading',
      type: 'text',
      rows: 2,
      description: 'The large quote near the top of the destination page. Line breaks are kept.',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'introCopy',
      title: 'Intro copy',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      description: 'The numbered cards. Three works best with the layout.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'highlight',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'copy', title: 'Copy', type: 'text', rows: 3, validation: (rule) => rule.required() })
          ],
          preview: { select: { title: 'title', subtitle: 'copy' } }
        })
      ],
      validation: (rule) => rule.max(6)
    }),
    defineField({
      name: 'goodToKnowHeading',
      title: 'Good to know — heading',
      type: 'text',
      rows: 2,
      description: 'e.g. “Best from December to April, beautiful in every season.”'
    }),
    defineField({
      name: 'goodToKnowCopy',
      title: 'Good to know — copy',
      type: 'text',
      rows: 4
    })
  ],
  orderings: [{ title: 'Display order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'region', media: 'image' } }
});
