import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Journal entry',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The url this entry lives at: /blog/your-slug',
      options: { source: 'title.en', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'localeTextOptional',
      description: 'One or two sentences. Used on the journal index and for search results.'
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'localeStringOptional',
          description: 'Describe the photograph for screen readers.'
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }]
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'readingTime',
      title: 'Reading time (minutes)',
      type: 'number',
      description: 'Leave empty and it is estimated from the body.',
      validation: (rule) => rule.min(1).max(120)
    }),
    defineField({
      name: 'featured',
      title: 'Feature at the top of the journal',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'localeBlockContent',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'localeTextOptional',
      description: 'Falls back to the excerpt when empty.'
    }),
    defineField({
      name: 'automation',
      title: 'Publishing workflow',
      type: 'object',
      description: 'AI-created entries stay as drafts until a person approves and schedules them.',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'generated',
          title: 'Generated draft',
          type: 'boolean',
          readOnly: true,
          initialValue: false
        }),
        defineField({
          name: 'status',
          title: 'Review status',
          type: 'string',
          initialValue: 'needs-review',
          options: {
            layout: 'radio',
            list: [
              { title: 'Needs review', value: 'needs-review' },
              { title: 'Approved for scheduled publishing', value: 'approved' },
              { title: 'Published by automation', value: 'published' }
            ]
          }
        }),
        defineField({
          name: 'scheduledFor',
          title: 'Publish at',
          type: 'datetime',
          description: 'Used only after the review status is changed to Approved.'
        }),
        defineField({
          name: 'topicKey',
          title: 'Content-plan key',
          type: 'string',
          readOnly: true
        }),
        defineField({
          name: 'reviewNotes',
          title: 'Review notes',
          type: 'text',
          rows: 3,
          description: 'Record fact checks, image rights, translation status or requested edits.'
        })
      ],
      validation: (rule) =>
        rule.custom((value) => {
          if (value?.status === 'approved' && !value.scheduledFor) {
            return 'Choose a publishing date and time before approving this entry.';
          }
          return true;
        })
    })
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }]
    }
  ],
  preview: {
    select: { title: 'title.en', subtitle: 'category.title.en', media: 'coverImage' }
  }
});
