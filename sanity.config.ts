'use client';

/**
 * Studio configuration — mounted inside the app at /studio.
 * The Sanity CLI also reads this file, so schema changes are picked up by both.
 */
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { dataset, projectId } from './src/sanity/env';
import { schemaTypes } from './src/sanity/schemas';

const visibleDocumentTypes = new Set(['destination', 'post', 'author', 'category']);

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
    /* Keep the Studio focused on content editors can manage here. */
    newDocumentOptions: (previous) =>
      previous.filter((item) => visibleDocumentTypes.has(item.templateId))
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
            S.documentTypeListItem('author').title('Authors')
          ])
    })
  ]
});
