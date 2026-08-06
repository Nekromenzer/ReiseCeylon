import { defineArrayMember, defineField, defineType } from 'sanity';

export const tour = defineType({
  name: 'tour',
  title: 'Journey',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The url: /tours/your-slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'days',
      title: 'Length',
      type: 'string',
      description: 'Shown as written, e.g. “12 days”.',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'route',
      title: 'Route',
      type: 'string',
      description: 'e.g. “Colombo → Tea Country → South Coast”.',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'string',
      description: 'Shown as written, e.g. “From $2,480”.',
      validation: (rule) => rule.required()
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
      description: 'Lowest first.',
      initialValue: 100
    }),
    defineField({
      name: 'note',
      title: 'Short note',
      type: 'text',
      rows: 2,
      description: 'One line beneath the journey on the homepage.',
      validation: (rule) => rule.required().max(140)
    }),
    defineField({
      name: 'introHeading',
      title: 'Intro heading',
      type: 'text',
      rows: 2,
      description: 'Large quote near the top of the journey page. Line breaks are kept.',
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
      name: 'itinerary',
      title: 'Tour plan',
      type: 'array',
      description: 'The day-by-day timeline. Add one entry per stage of the journey.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stage',
          fields: [
            defineField({
              name: 'period',
              title: 'Days',
              type: 'string',
              description: 'e.g. “Days 1–3”.',
              validation: (rule) => rule.required()
            }),
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'copy', title: 'Copy', type: 'text', rows: 3, validation: (rule) => rule.required() })
          ],
          preview: { select: { title: 'title', subtitle: 'period' } }
        })
      ],
      validation: (rule) => rule.required().min(1)
    }),
    defineField({
      name: 'includedHeading',
      title: 'Included — heading',
      type: 'text',
      rows: 2,
      description: 'e.g. “Private by design. Supported throughout.”'
    }),
    defineField({
      name: 'includedCopy',
      title: 'Included — copy',
      type: 'text',
      rows: 4,
      description: 'What the price covers, and what it does not.'
    })
  ],
  orderings: [{ title: 'Display order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'route', media: 'image' } }
});
