/**
 * One-off migration: plain fields → localised fields.
 *
 * Before the site spoke four languages, `note` held a string. It now holds an
 * object keyed by language. The website reads both shapes — see
 * `src/sanity/locale-field.ts` — so nothing is broken while a dataset is still
 * on the old shape, but the studio cannot *edit* a string sitting in an object
 * field. This script does the conversion:
 *
 *     "Ancient stone, jungle horizons"   →   { en: "Ancient stone, jungle horizons" }
 *
 * Existing English copy becomes the English translation; the other three
 * languages are left empty for an editor to fill in, and fall back to English on
 * the site until they do.
 *
 * Run a dry run first — it prints every document it would touch and writes
 * nothing:
 *
 *     node --env-file=.env scripts/migrate-locale-fields.mjs
 *     node --env-file=.env scripts/migrate-locale-fields.mjs --apply
 *
 * It is safe to run twice: a field already in the object shape is skipped.
 */
import { createClient } from '@sanity/client';

const apply = process.argv.includes('--apply');

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? process.env.SANITY_STUDIO_DATASET ?? 'production';
const token = process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_WRITE_TOKEN;

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID. Add it to .env.');
  process.exit(1);
}
if (apply && !token) {
  console.error('Missing SANITY_API_WRITE_TOKEN — needed to write. Create one at sanity.io/manage.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-10-01',
  token,
  useCdn: false
});

/** Which fields on which document type are localised, and how deep they sit. */
const PLAN = {
  destination: {
    fields: ['name', 'region', 'note', 'introHeading', 'introCopy', 'goodToKnowHeading', 'goodToKnowCopy', 'seoTitle', 'seoDescription'],
    imageFields: [['image', ['alt']]],
    arrays: [['highlights', ['title', 'copy']]]
  },
  tour: {
    fields: ['title', 'days', 'route', 'price', 'note', 'introHeading', 'introCopy', 'includedHeading', 'includedCopy'],
    imageFields: [['image', ['alt']]],
    arrays: [['itinerary', ['period', 'title', 'copy']]]
  },
  post: {
    fields: ['title', 'excerpt', 'seoDescription'],
    imageFields: [['coverImage', ['alt']]],
    arrays: [],
    /* Portable text: an array becomes { en: [...] }. */
    blockFields: ['body']
  },
  category: { fields: ['title', 'description'], imageFields: [], arrays: [] },
  author: { fields: ['role', 'bio'], imageFields: [], arrays: [] },
  siteSettings: {
    fields: ['location', 'address', 'responseTime'],
    imageFields: [],
    arrays: [['social', ['label']]]
  }
};

const isPlainString = (value) => typeof value === 'string' && value.length > 0;
const isLocalised = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Returns a patch object for one document, or null when nothing needs doing. */
function patchFor(doc, plan) {
  const set = {};

  for (const field of plan.fields ?? []) {
    if (isPlainString(doc[field])) set[field] = { en: doc[field] };
  }

  for (const [imageField, subFields] of plan.imageFields ?? []) {
    const image = doc[imageField];
    if (!isLocalised(image)) continue;
    for (const sub of subFields) {
      if (isPlainString(image[sub])) set[`${imageField}.${sub}`] = { en: image[sub] };
    }
  }

  for (const [arrayField, subFields] of plan.arrays ?? []) {
    const rows = doc[arrayField];
    if (!Array.isArray(rows)) continue;
    rows.forEach((row, index) => {
      if (!isLocalised(row)) return;
      for (const sub of subFields) {
        if (isPlainString(row[sub])) set[`${arrayField}[${index}].${sub}`] = { en: row[sub] };
      }
    });
  }

  for (const field of plan.blockFields ?? []) {
    if (Array.isArray(doc[field])) set[field] = { en: doc[field] };
  }

  return Object.keys(set).length > 0 ? set : null;
}

async function run() {
  console.log(`${apply ? 'Migrating' : 'Dry run —'} ${projectId}/${dataset}\n`);

  let touched = 0;
  let fields = 0;
  const transaction = client.transaction();

  for (const [type, plan] of Object.entries(PLAN)) {
    const docs = await client.fetch(`*[_type == $type && !(_id in path("drafts.**"))]`, { type });
    for (const doc of docs) {
      const set = patchFor(doc, plan);
      if (!set) continue;

      touched += 1;
      fields += Object.keys(set).length;
      console.log(`  ${type}  ${doc._id}`);
      for (const key of Object.keys(set)) console.log(`      ${key}`);

      if (apply) transaction.patch(doc._id, { set });
    }
  }

  if (touched === 0) {
    console.log('Nothing to migrate — every localised field is already an object.');
    return;
  }

  console.log(`\n${touched} document(s), ${fields} field(s).`);

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to write these changes.');
    return;
  }

  await transaction.commit();
  console.log('Done. Drafts are untouched — republish anything held in draft.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
