import { defineField, defineType } from 'sanity';

export const author = defineType({
  name: 'author',
  title: 'Author',
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
      options: { source: 'name', maxLength: 96 }
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'localeStringOptional',
      description: 'Shown under the byline, e.g. “Journey planner, Colombo”.'
    }),
    defineField({
      name: 'image',
      title: 'Portrait',
      type: 'image',
      options: { hotspot: true }
    }),
    defineField({
      name: 'bio',
      title: 'Short bio',
      type: 'localeTextOptional'
    })
  ],
  preview: { select: { title: 'name', subtitle: 'role.en', media: 'image' } }
});
