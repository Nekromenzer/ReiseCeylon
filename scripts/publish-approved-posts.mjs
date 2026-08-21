import process from 'node:process';
import { createClient } from '@sanity/client';
import { isPublishableDraft, stripSystemFields } from './blog-automation-lib.mjs';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_TOKEN;
const dryRun = process.argv.includes('--dry-run');

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID.');
if (!token) throw new Error('Missing SANITY_API_TOKEN with Editor permissions.');

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-10-01',
  token,
  useCdn: false,
  perspective: 'raw'
});

async function main() {
  const drafts = await client.fetch(
    `*[
      _type == "post" &&
      _id in path("drafts.**") &&
      automation.generated == true &&
      automation.status == "approved"
    ] | order(automation.scheduledFor asc)`,
    {},
    { perspective: 'raw' }
  );

  if (drafts.length === 0) {
    console.log('No approved generated drafts are waiting.');
    return;
  }

  let published = 0;
  for (const draft of drafts) {
    const check = isPublishableDraft(draft);
    if (!check.ok) {
      console.log(`Skipped ${draft._id}: ${check.missing.join(', ')}.`);
      continue;
    }

    const publishedId = draft._id.replace(/^drafts\./, '');
    const conflictingPost = await client.fetch(
      '*[_type == "post" && slug.current == $slug && !(_id in [$draftId, $publishedId])][0]._id',
      { slug: draft.slug.current, draftId: draft._id, publishedId },
      { perspective: 'raw' }
    );
    if (conflictingPost) {
      console.log(`Skipped ${draft._id}: slug is already used by ${conflictingPost}.`);
      continue;
    }
    const content = stripSystemFields(draft);
    content._id = publishedId;
    content.publishedAt = draft.automation.scheduledFor;
    content.automation = { ...draft.automation, status: 'published' };

    if (dryRun) {
      console.log(`Would publish ${draft._id} as ${publishedId}.`);
      continue;
    }

    await client.transaction().createOrReplace(content).delete(draft._id).commit();
    published += 1;
    console.log(`Published ${publishedId}.`);
  }

  console.log(dryRun ? 'Dry run complete; no documents changed.' : `Published ${published} post(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
