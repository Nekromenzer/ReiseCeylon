'use client';

/**
 * Studio configuration — mounted inside the app at /studio.
 * The Sanity CLI also reads this file, so schema changes are picked up by both.
 */
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { dataset, projectId } from './src/sanity/env';
import { schemaTypes } from './src/sanity/schemas';

const creatableDocumentTypes = new Set(['destination', 'post', 'author', 'category']);

export default defineConfig({
  name: 'reiseceylon',
  title: 'ReiseCeylon Content',
  basePath: '/studio',
  projectId,
  dataset,
  tasks: { enabled: false },
  releases: { enabled: false },
  scheduledDrafts: { enabled: false },
  scheduledPublishing: { enabled: false },
  schema: { types: schemaTypes },
  document: {
    /* The contact document is a pinned singleton, never a generic new document. */
    newDocumentOptions: (previous) =>
      previous.filter((item) => creatableDocumentTypes.has(item.templateId)),
    actions: (previous, context) =>
      context.schemaType === 'siteSettings'
        ? previous.filter((item) => !['delete', 'duplicate', 'unpublish'].includes(item.action ?? ''))
        : previous
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('destination').title('Destinations'),
            S.divider(),
            S.documentTypeListItem('post').title('Blog posts'),
            S.documentTypeListItem('category').title('Blog categories'),
            S.documentTypeListItem('author').title('Authors'),
            S.divider(),
            S.listItem()
              .id('siteSettings')
              .title('Contact details')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Contact details'))
          ])
    })
  ]
});
