import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * A singleton — there is exactly one of these, pinned in the studio menu.
 * Holds the contact details that appear in the footer and on the contact page.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Contact details',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email address',
      type: 'string',
      description: 'Shown in the footer and used for the mailto links.',
      validation: (rule) => rule.required().email()
    }),
    defineField({
      name: 'phone',
      title: 'Phone number',
      type: 'string',
      description: 'Optional. Include the country code, e.g. +94 77 123 4567.'
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp number',
      type: 'string',
      description: 'Optional. Digits only, with country code and no spaces, e.g. 94771234567.'
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. “Colombo, Sri Lanka”.',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'address',
      title: 'Full address',
      type: 'text',
      rows: 3,
      description: 'Optional. Shown on the contact page when set.'
    }),
    defineField({
      name: 'responseTime',
      title: 'Response promise',
      type: 'string',
      description: 'e.g. “within one working day”. Used in the contact page copy.'
    }),
    defineField({
      name: 'social',
      title: 'Social links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'Instagram, Facebook, YouTube…',
              validation: (rule) => rule.required()
            }),
            defineField({
              name: 'url',
              title: 'Url',
              type: 'url',
              validation: (rule) => rule.required()
            })
          ],
          preview: { select: { title: 'label', subtitle: 'url' } }
        })
      ]
    })
  ],
  preview: {
    select: { subtitle: 'email' },
    prepare: ({ subtitle }) => ({ title: 'Contact details', subtitle })
  }
});
