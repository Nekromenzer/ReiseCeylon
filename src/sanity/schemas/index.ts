import type { SchemaTypeDefinition } from 'sanity';
import { author } from './author';
import { blockContent, localeBlockContent } from './blockContent';
import { category } from './category';
import { destination } from './destination';
import { localeFieldTypes } from './locale';
import { post } from './post';
import { siteSettings } from './siteSettings';
import { tour } from './tour';

export const schemaTypes: SchemaTypeDefinition[] = [
  /* Field types first — the documents below refer to them by name. */
  ...(localeFieldTypes as SchemaTypeDefinition[]),
  blockContent as SchemaTypeDefinition,
  localeBlockContent as SchemaTypeDefinition,
  post,
  category,
  author,
  destination,
  tour,
  siteSettings
];
