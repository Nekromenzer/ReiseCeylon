import process from 'node:process';
import { createClient } from '@sanity/client';
import { canonicalBlogHref } from './blog-automation-lib.mjs';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_TOKEN;
const write = process.argv.includes('--write');

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

const posts = await client.fetch(
  '*[_type == "post" && defined(body.en)]{_id, body}',
  {},
  { perspective: 'raw' }
);

let changedDocuments = 0;
let changedLinks = 0;

for (const post of posts) {
  let postChanged = false;
  const englishBody = (post.body?.en ?? []).map((block) => ({
    ...block,
    markDefs: (block.markDefs ?? []).map((mark) => {
      const href = canonicalBlogHref(mark.href);
      if (mark._type !== 'link' || !href || href === mark.href) return mark;
      postChanged = true;
      changedLinks += 1;
      return { ...mark, href };
    })
  }));

  if (!postChanged) continue;
  changedDocuments += 1;
  if (write) await client.patch(post._id).set({ 'body.en': englishBody }).commit();
  console.log(`${write ? 'Updated' : 'Would update'} ${post._id}.`);
}

console.log(
  `${write ? 'Updated' : 'Found'} ${changedLinks} relative link(s) in ${changedDocuments} post(s).`
);
