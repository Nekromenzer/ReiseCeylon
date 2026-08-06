import { defineArrayMember, defineField, defineType } from 'sanity';
import { places } from '../../lib/places';

/**
 * Every mapped place, as a picker. The value stored is the atlas slug, not a
 * reference — the atlas is the source of truth for coordinates, and a journey
 * can call at a place that has no destination document written for it yet.
 */
const placeOptions = places.map((place) => ({
  title: `${place.name} — ${place.city || place.district}`,
  value: place.slug
}));

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
      name: 'durationDays',
      title: 'Length in days',
      type: 'number',
      description:
        'The number behind “Length”, used by the day-trip / 2–4 days / 10 days+ filter on /journeys. Use 1 for a day trip.',
      validation: (rule) => rule.min(1).max(60)
    }),
    defineField({
      name: 'route',
      title: 'Route',
      type: 'string',
      description: 'e.g. “Colombo → Tea Country → South Coast”.',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'stops',
      title: 'Stops on the map',
      type: 'array',
      description:
        'The places this journey calls at, in travel order. This is what draws the route on the Sri Lanka map and what every distance and drive time on /journeys is calculated from. Drag to reorder.',
      of: [
        defineArrayMember({
          type: 'string',
          options: { list: placeOptions }
        })
      ],
      options: { layout: 'tags' }
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'string',
      description:
        'Not shown on the site — journeys are quoted per enquiry. Kept for internal reference only.',
      initialValue: ''
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
