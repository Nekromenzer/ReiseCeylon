/**
 * Copies the site's existing hardcoded content into Sanity, so the studio opens
 * pre-filled with exactly what the site already shows instead of a blank slate.
 *
 *   SANITY_API_TOKEN=sk... node --experimental-strip-types --env-file=.env scripts/seed-site.mjs
 *
 * Journeys and contact details only — destinations come from the atlas in
 * public/json and are owned by `npm run sync:destinations`.
 *
 * Safe to re-run: document ids are derived from the slugs and replaced, not
 * duplicated. Re-running DOES overwrite studio edits with the original copy —
 * run it once, at migration time.
 */
import { createReadStream } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@sanity/client';
import { journeyNotes, tours } from '../src/lib/content.ts';
import { contactDefaults, defaultStages, tourDefaults } from '../src/lib/defaults.ts';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
if (!token) throw new Error('Missing SANITY_API_TOKEN (needs write access)');

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-10-01',
  token,
  useCdn: false
});

/** Each local photograph is uploaded once, however many documents reference it. */
const uploads = new Map();
async function uploadOnce(localPath) {
  if (!uploads.has(localPath)) {
    const filename = path.basename(localPath);
    console.log(`  uploading ${filename}`);
    uploads.set(
      localPath,
      client.assets
        .upload('image', createReadStream(`public${localPath}`), { filename })
        .then((asset) => asset._id)
    );
  }
  return uploads.get(localPath);
}

const imageField = async (localPath, alt) => ({
  _type: 'image',
  asset: { _type: 'reference', _ref: await uploadOnce(localPath) },
  alt: en(alt)
});

const withKeys = (items) =>
  items.map((item, index) => ({ ...item, _key: `${index}` }));

/**
 * Localised fields are objects keyed by language. The seed writes English only —
 * it is seeding from the English defaults — and the site falls back to its own
 * translated defaults for the other three until an editor fills them in.
 */
const en = (value) => (value ? { en: value } : undefined);

/** The same, over every string field of an object. */
const enFields = (object, fields) =>
  Object.fromEntries(fields.map((field) => [field, en(object[field])]));

async function main() {
  console.log(`Seeding ${projectId}/${dataset}`);
  console.log('Images:');

  const tourDocs = await Promise.all(
    tours.map(async (journey, index) => ({
      _id: `tour-${journey.slug}`,
      _type: 'tour',
      title: en(journey.title),
      slug: { _type: 'slug', current: journey.slug },
      days: en(journey.days),
      route: en(journey.route),
      price: en(journey.price),
      image: await imageField(journey.image, journey.title),
      order: (index + 1) * 10,
      note: en(journeyNotes[journey.slug] ?? ''),
      itinerary: withKeys(
        defaultStages.map((item) => ({
          _type: 'stage',
          period: en(item.period),
          title: en(item.title),
          copy: en(item.copy)
        }))
      ),
      ...enFields(tourDefaults, [
        'introHeading',
        'introCopy',
        'includedHeading',
        'includedCopy'
      ])
    }))
  );

  const settings = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    email: contactDefaults.email,
    phone: contactDefaults.phone,
    location: en(contactDefaults.location),
    responseTime: en(contactDefaults.responseTime)
  };

  console.log('Documents:');
  const transaction = client.transaction();
  for (const doc of [...tourDocs, settings]) {
    console.log(`  ${doc._id}`);
    transaction.createOrReplace(doc);
  }
  await transaction.commit();

  console.log(`Done — ${tourDocs.length} journeys, contact details.`);
  console.log('Destinations: run `npm run sync:destinations` to load the atlas.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
