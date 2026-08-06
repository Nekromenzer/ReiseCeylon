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
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('post').title('Journal entries'),
            S.documentTypeListItem('category').title('Categories'),
            S.documentTypeListItem('author').title('Authors')
          ])
    }),
    visionTool({ defaultApiVersion: apiVersion })
  ]
});
