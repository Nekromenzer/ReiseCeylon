'use client';

/**
 * Studio configuration — mounted inside the app at /studio.
 * The Sanity CLI also reads this file, so schema changes are picked up by both.
 */
import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { apiVersion, dataset, projectId } from './src/sanity/env';
import { schemaTypes } from './src/sanity/schemas';

export default defineConfig({
  name: 'reiseceylon',
  title: 'ReiseCeylon Journal',
  basePath: '/studio',
  projectId,
  dataset,
  schema: { types: schemaTypes },
  document: {
    /* Contact details is a singleton — it must not be created or deleted from the studio. */
    newDocumentOptions: (previous) =>
      previous.filter((item) => item.templateId !== 'siteSettings'),
    actions: (previous, { schemaType }) =>
      schemaType === 'siteSettings'
        ? previous.filter(({ action }) => action !== 'delete' && action !== 'duplicate' && action !== 'unpublish')
        : previous
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('destination').title('Destinations'),
            S.documentTypeListItem('tour').title('Journeys & tour plans'),
            S.divider(),
            S.documentTypeListItem('post').title('Journal entries'),
            S.documentTypeListItem('category').title('Categories'),
            S.documentTypeListItem('author').title('Authors'),
            S.divider(),
            /* Singleton: one fixed document, opened directly rather than as a list. */
            S.listItem()
              .title('Contact details')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings'))
          ])
    }),
    visionTool({ defaultApiVersion: apiVersion })
  ]
});
