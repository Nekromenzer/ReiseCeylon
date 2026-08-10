/**
 * Syncs public/json/sri-lanka-tourist-places-map.json into Sanity, one
 * `destination` document per place.
 *
 *   SANITY_API_TOKEN=sk... npm run sync:destinations
 *
 * Safe to re-run, and designed to be. A destination has two halves:
 *
 *   Location — category, province, district, town, coordinates, precision.
 *              Overwritten on every run, so the atlas stays the source of truth.
 *   Story    — the note, intro copy, highlights, good-to-know.
 *              Written once, when the document is created, then never touched.
 *              Editors keep whatever they wrote in the studio.
 *
 * Flags:
 *   --with-content  refresh SEO fields and editorial copy for every atlas place.
 *                   Existing photographs are never changed.
 *   --with-images   also upload public/images/destination/<slug>.jpg as the
 *                   document photograph (slow: 174 uploads). Skipped for
 *                   documents that already carry an image.
 *   --dry-run       print what would change, write nothing.
 */
import { createReadStream } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { getCliClient } from 'sanity/cli';
import { buildDestinationContent } from './destination-content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const withImages = process.argv.includes('--with-images');
const withContent = process.argv.includes('--with-content');
const dryRun = process.argv.includes('--dry-run');

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
const clientConfig = {
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-10-01',
  token,
  useCdn: false,
  // A write token otherwise defaults to the raw perspective and can mistake an
  // unpublished draft for a live document. The atlas sync only updates what the
  // website can actually read.
  perspective: 'published'
};

const client = token
  ? createClient({ ...clientConfig, token })
  : getCliClient(clientConfig);

/** The five that lead the homepage rail — mirrors defaultFeaturedSlugs in src/lib/places.ts. */
const featuredSlugs = [
  'sigiriya-rock-fortress',
  'ella',
  'hikkaduwa-marine-sanctuary',
  'yala-national-park',
  'kandy'
];

/** Documents from before the atlas, and the atlas record that replaces each. */
const legacyAliases = {
  sigiriya: 'sigiriya-rock-fortress',
  hikkaduwa: 'hikkaduwa-marine-sanctuary',
  yala: 'yala-national-park'
};

/**
 * Localised fields are objects keyed by language. The generated content is
 * English, so it is written as the English translation; the site falls back to
 * its own translated defaults in the other three languages until an editor fills
 * them in from the studio.
 */
const en = (value) => (value === undefined || value === null || value === '' ? undefined : { en: value });

/* New documents start complete; --with-content deliberately refreshes existing ones too. */
const story = (place) => {
  const content = buildDestinationContent(place);
  return {
    seoTitle: en(content.seoTitle),
    seoDescription: en(content.seoDescription),
    region: en(content.region),
    note: en(content.note),
    introHeading: en(content.introHeading),
    introCopy: en(content.introCopy),
    goodToKnowHeading: en(content.goodToKnowHeading),
    goodToKnowCopy: en(content.goodToKnowCopy),
    highlights: content.highlights?.map((highlight, index) => ({
      ...highlight,
      _key: highlight._key ?? `${index}`,
      title: en(highlight.title),
      copy: en(highlight.copy)
    }))
  };
};

/* Overwritten on every run — the atlas owns these. */
const location = (place, index) => ({
  name: en(place.name),
  slug: { _type: 'slug', current: place.slug },
  atlasId: place.id,
  categoryId: place.categoryId,
  province: place.province,
  district: place.district,
  city: place.city,
  precision: place.location.precision,
  status: place.status === 'published' ? 'published' : 'hidden',
  location: {
    _type: 'geopoint',
    lat: place.location.latitude,
    lng: place.location.longitude
  },
  featured: featuredSlugs.includes(place.slug),
  order: featuredSlugs.includes(place.slug) ? (featuredSlugs.indexOf(place.slug) + 1) * 10 : 100 + index
});

const exists = (file) =>
  access(file).then(
    () => true,
    () => false
  );

async function uploadPhotograph(slug, name) {
  const file = path.join(root, 'public/images/destination', `${slug}.jpg`);
  if (!(await exists(file))) return null;
  const asset = await client.assets.upload('image', createReadStream(file), { filename: `${slug}.jpg` });
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: en(name) };
}

async function main() {
  const atlas = JSON.parse(
    await readFile(path.join(root, 'public/json/sri-lanka-tourist-places-map.json'), 'utf8')
  );

  console.log(`${dryRun ? 'Dry run against' : 'Syncing to'} ${projectId}/${dataset}`);
  console.log(`${atlas.places.length} places in the atlas\n`);

  /* One read tells us which documents already exist and which carry an image. */
  const existing = await client.fetch(
    '*[_type == "destination"]{ _id, "slug": slug.current, "hasImage": defined(image.asset) }'
  );
  const known = new Map(existing.map((row) => [row.slug, row]));

  const drafts = await client
    .withConfig({ perspective: 'raw' })
    .fetch('*[_type == "destination" && _id in path("drafts.**")]{ _id, "slug": slug.current }');
  if (drafts.length > 0) {
    throw new Error(
      `Destination drafts must be published or discarded before syncing, so editor work is not bypassed: ${drafts
        .map((row) => row.slug)
        .join(', ')}`
    );
  }

  let created = 0;
  let updated = 0;
  let images = 0;

  for (const [index, place] of atlas.places.entries()) {
    const knownRecord = known.get(place.slug);
    /* Reuse whatever id the document already has, so a re-slugged doc is updated, not cloned. */
    const id = knownRecord?._id ?? `destination-${place.slug}`;

    if (dryRun) {
      console.log(`  ${knownRecord ? 'update' : 'create'}  ${id}`);
      if (knownRecord) updated += 1;
      else created += 1;
      continue;
    }

    const facts = location(place, index);

    if (!knownRecord) {
      await client.createIfNotExists({ _id: id, _type: 'destination', ...story(place), ...facts });
      created += 1;
    } else {
      await client.patch(id).set({ ...facts, ...(withContent ? story(place) : {}) }).commit();
      updated += 1;
    }

    if (withImages && !knownRecord?.hasImage) {
      const image = await uploadPhotograph(place.slug, place.name);
      if (image) {
        await client.patch(id).set({ image }).commit();
        images += 1;
      }
    }

    if ((index + 1) % 25 === 0) console.log(`  ${index + 1} / ${atlas.places.length}`);
  }

  /* Fold the pre-atlas documents into the records that replaced them. */
  const merged = [];
  for (const [legacy, target] of Object.entries(legacyAliases)) {
    if (!known.has(legacy) || dryRun) continue;
    const source = await client.fetch('*[_type == "destination" && slug.current == $slug][0]', {
      slug: legacy
    });
    if (!source) continue;

    const legacyStory = withContent
      ? { ...(source.image ? { image: source.image } : {}) }
      : {
          introHeading: source.introHeading,
          introCopy: source.introCopy,
          goodToKnowHeading: source.goodToKnowHeading,
          goodToKnowCopy: source.goodToKnowCopy,
          ...(source.highlights?.length ? { highlights: source.highlights } : {}),
          ...(source.note ? { note: source.note } : {}),
          ...(source.region ? { region: source.region } : {}),
          ...(source.image ? { image: source.image } : {})
        };

    if (Object.keys(legacyStory).length > 0) {
      await client.patch(known.get(target)?._id ?? `destination-${target}`).set(legacyStory).commit();
    }

    /* Hidden rather than deleted — nothing an editor wrote is thrown away. */
    await client.patch(source._id).set({ status: 'hidden', featured: false }).commit();
    merged.push(`${legacy} → ${target}`);
  }

  const tense = dryRun ? 'would be' : '';
  console.log(
    `\n${created} ${tense} created, ${updated} ${tense} updated${withImages && !dryRun ? `, ${images} photographs uploaded` : ''}.`
  );

  const pending = Object.entries(legacyAliases).filter(([legacy]) => known.has(legacy));
  if (dryRun && pending.length > 0) {
    console.log(
      `Pre-atlas documents that would be merged and hidden: ${pending
        .map(([legacy, target]) => `${legacy} → ${target}`)
        .join(', ')}.`
    );
  }
  if (merged.length > 0) {
    console.log(`Merged and hid the pre-atlas documents: ${merged.join(', ')}.`);
  }
  if (!withImages) {
    console.log('Photographs were not changed.');
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
