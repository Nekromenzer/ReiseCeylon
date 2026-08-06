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
  alt
});

const withKeys = (items) =>
  items.map((item, index) => ({ ...item, _key: `${index}` }));

async function main() {
  console.log(`Seeding ${projectId}/${dataset}`);
  console.log('Images:');

  const tourDocs = await Promise.all(
    tours.map(async (journey, index) => ({
      _id: `tour-${journey.slug}`,
      _type: 'tour',
      title: journey.title,
      slug: { _type: 'slug', current: journey.slug },
      days: journey.days,
      route: journey.route,
      price: journey.price,
      image: await imageField(journey.image, journey.title),
      order: (index + 1) * 10,
      note: journeyNotes[journey.slug] ?? '',
      itinerary: withKeys(defaultStages.map((item) => ({ _type: 'stage', ...item }))),
      ...tourDefaults
    }))
  );

  const settings = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    email: contactDefaults.email,
    location: contactDefaults.location,
    responseTime: contactDefaults.responseTime
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
