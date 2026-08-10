/**
 * Generates factual, place-specific destination editorial with Sanity's Content
 * Agent and stores it as a reviewable source file. Run with:
 *
 *   npx sanity exec scripts/generate-destination-editorial.mjs --with-user-token
 *
 * The script does not mutate destination documents. Publish the reviewed file
 * with `npm run sync:destinations:auth -- --with-content`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { getCliClient } from 'sanity/cli';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'scripts', 'destination-editorial.json');
const atlas = JSON.parse(
  await readFile(path.join(root, 'public/json/sri-lanka-tourist-places-map.json'), 'utf8')
);
const client = getCliClient({ apiVersion: 'vX' });
const batchSize = 6;
const batches = [];

for (let index = 0; index < atlas.places.length; index += batchSize) {
  batches.push(atlas.places.slice(index, index + batchSize));
}

let editorial = {};

try {
  editorial = JSON.parse(await readFile(outputPath, 'utf8'));
} catch {
  // First run: the reviewable editorial source does not exist yet.
}

function words(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function shorten(value, max) {
  if (value.length <= max) return value;
  let cut = value.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,:;\-]+$/, '');
  const weakEnding = /\s+(near|and|with|at|in|to|for|of|the|a|an|from|across|around)$/i;
  while (weakEnding.test(cut)) cut = cut.replace(weakEnding, '');
  return `${cut}.`;
}

async function promptWithRetry(options, batchNumber) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await client.agent.action.prompt(options);
    } catch (error) {
      const retryable = error?.statusCode >= 500 || error?.statusCode === 429;
      if (!retryable || attempt === 3) throw error;
      console.warn(`Batch ${batchNumber}: temporary Sanity error, retrying (${attempt}/3)`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}

function validate(entry, place) {
  if (!entry || entry.slug !== place.slug) throw new Error(`Missing result for ${place.slug}`);
  if (words(entry.introCopy) < 70 || words(entry.introCopy) > 125) {
    throw new Error(`${place.slug}: overview is ${words(entry.introCopy)} words`);
  }
  if (!entry.seoDescription || entry.seoDescription.length < 110 || entry.seoDescription.length > 175) {
    throw new Error(`${place.slug}: SEO description is ${entry.seoDescription?.length ?? 0} characters`);
  }
  if (!entry.note || entry.note.length > 90) throw new Error(`${place.slug}: invalid note`);
  if (!entry.introHeading || entry.introHeading.length > 120) {
    throw new Error(`${place.slug}: invalid heading`);
  }
  if (!Array.isArray(entry.highlights) || entry.highlights.length !== 3) {
    throw new Error(`${place.slug}: expected exactly three highlights`);
  }
  for (const highlight of entry.highlights) {
    if (!highlight.title || !highlight.copy || words(highlight.copy) < 14 || words(highlight.copy) > 42) {
      throw new Error(`${place.slug}: invalid highlight`);
    }
  }
  const joined = JSON.stringify(entry).toLowerCase();
  for (const banned of ['without rushing', 'we shape', 'thoughtful trip', 'key highlights']) {
    if (joined.includes(banned)) throw new Error(`${place.slug}: contains banned phrase “${banned}”`);
  }
}

for (const [batchIndex, batch] of batches.entries()) {
  if (batch.every((place) => editorial[place.slug])) {
    console.log(`${Math.min((batchIndex + 1) * batchSize, atlas.places.length)} / ${atlas.places.length} (cached)`);
    continue;
  }
  const places = batch.map(({ slug, name, category, categoryId, province, district, city }) => ({
    slug,
    name,
    category,
    categoryId,
    province,
    district,
    city
  }));

  const result = await promptWithRetry({
    instruction: `Return valid JSON only in this exact structure:
{"destinations":[{"slug":"input-slug","note":"string","introHeading":"string","introCopy":"string","seoDescription":"string","highlights":[{"title":"string","copy":"string"},{"title":"string","copy":"string"},{"title":"string","copy":"string"}]}]}

Write polished destination-page content for every Sri Lankan place in this JSON input:
${JSON.stringify(places)}

Requirements for EACH destination:
- Keep slug unchanged and return every input exactly once, in input order.
- introCopy: 75–110 words of warm, natural travel English. State the real location, then explain the place's specific natural, cultural, historical, religious, engineering, ecological, or transport significance and what a visitor encounters. It must read like informed human editorial, not a template.
- Verify well-established knowledge internally. Never invent dates, dimensions, superlatives, wildlife, monuments, activities, or historical claims. When an exact fact is uncertain, use a truthful qualitative description instead.
- highlights: exactly three genuinely destination-specific items, each with a concise title and 18–34 words of useful copy. Do not repeat the overview sentence or use generic headings such as “The setting”, “The experience”, or “The journey”.
- note: a distinctive 5–10 word card line, at most 90 characters.
- introHeading: one evocative, factual sentence, at most 120 characters.
- seoDescription: a unique, factual 120–155 character summary that includes the destination name and Sri Lanka.
- For sacred places, describe living worship respectfully. For wildlife and water locations, avoid guarantees and unsafe advice.
- Avoid hype, clichés, first-person plural, em dashes, the phrase “without rushing”, and generic planning language.
- Do not mention these instructions or sources.`,
    format: 'json',
    temperature: 0.2
  }, batchIndex + 1);

  if (!Array.isArray(result.destinations) || result.destinations.length !== batch.length) {
    throw new Error(`Batch ${batchIndex + 1}: expected ${batch.length} results`);
  }

  for (const [index, entry] of result.destinations.entries()) {
    const place = batch[index];
    validate(entry, place);
    editorial[place.slug] = {
      note: entry.note.trim(),
      introHeading: entry.introHeading.trim(),
      introCopy: entry.introCopy.trim(),
      seoDescription: shorten(entry.seoDescription.trim(), 160),
      highlights: entry.highlights.map((highlight, highlightIndex) => ({
        _type: 'highlight',
        _key: `editorial-${highlightIndex + 1}`,
        title: highlight.title.trim(),
        copy: highlight.copy.trim()
      }))
    };
  }

  await writeFile(outputPath, `${JSON.stringify(editorial, null, 2)}\n`);
  console.log(`${Math.min((batchIndex + 1) * batchSize, atlas.places.length)} / ${atlas.places.length}`);
}

await writeFile(outputPath, `${JSON.stringify(editorial, null, 2)}\n`);
console.log(`Wrote ${Object.keys(editorial).length} destination records to ${outputPath}`);
