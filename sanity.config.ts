'use client';

/**
 * Studio configuration — mounted inside the app at /studio.
 * The Sanity CLI also reads this file, so schema changes are picked up by both.
 */
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { dataset, projectId } from './src/sanity/env';
import { schemaTypes } from './src/sanity/schemas';

export default defineConfig({
  name: 'reiseceylon',
  title: 'ReiseCeylon Destinations',
  basePath: '/studio',
  projectId,
  dataset,
  tasks: { enabled: false },
  releases: { enabled: false },
  scheduledDrafts: { enabled: false },
  scheduledPublishing: { enabled: false },
  schema: { types: schemaTypes },
  document: {
    /* Only destination documents are exposed through this Studio workspace. */
    newDocumentOptions: (previous) =>
      previous.filter((item) => item.templateId === 'destination')
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('destination').title('Destinations')
          ])
    })
  ]
});
