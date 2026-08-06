import type { SchemaTypeDefinition } from 'sanity';
import { author } from './author';
import { category } from './category';
import { destination } from './destination';
import { post } from './post';
import { siteSettings } from './siteSettings';
import { tour } from './tour';

export const schemaTypes: SchemaTypeDefinition[] = [
  post,
  category,
  author,
  destination,
  tour,
  siteSettings
];
