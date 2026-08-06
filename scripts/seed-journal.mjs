/**
 * Publishes one sample journal entry (plus its category and author) so the
 * /blog grid can be checked end to end before real content exists.
 *
 * Needs a token with Editor permissions — sanity.io/manage → API → Tokens:
 *
 *   SANITY_API_TOKEN=sk... node --env-file=.env scripts/seed-journal.mjs
 *
 * Safe to re-run: every document has a fixed id and is replaced, not duplicated.
 */
import { createReadStream } from 'node:fs';
import process from 'node:process';
import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
if (!token) throw new Error('Missing SANITY_API_TOKEN (needs the Editor role)');

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-10-01',
  token,
  useCdn: false
});

/** Portable Text needs a stable key on every block and span. */
let keySeed = 0;
const key = () => `k${(keySeed += 1)}`;

const text = (style, value) => ({
  _type: 'block',
  _key: key(),
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text: value, marks: [] }]
});

const body = [
  text('normal', 'The gate opens at half past five, and for twenty minutes the rock belongs to almost nobody. Mist is still lying in the moat. The stairs are cold underfoot. Somewhere below, a peacock is making the sound peacocks make when they would rather not be awake either.'),
  text('h2', 'Why the early start matters'),
  text('normal', 'By nine, the western staircase holds a queue that does not move. By seven, you are already on the summit, watching the Cultural Triangle come out from under the cloud — tanks, tree line, the straight red scar of the road to Dambulla. The difference is not comfort. It is whether you see the place at all.'),
  text('blockquote', 'A guide who grew up here does not point at the frescoes. He waits until you find them yourself, then tells you what the pigment was made of.'),
  text('h2', 'What we build around it'),
  text('normal', 'We pair Sigiriya with the quieter half of the same morning: Pidurangala for the view back at the rock, breakfast in the village rather than the hotel, and an unhurried afternoon that asks nothing of you. Most travellers give this place ninety minutes. It rewards a day.'),
  text('normal', 'Best between December and April, though the light after a June shower is the best light of the year.')
];

async function main() {
  console.log(`Uploading cover image to ${projectId}/${dataset}…`);
  const asset = await client.assets.upload('image', createReadStream('public/images/sigiriya.jpg'), {
    filename: 'sigiriya-first-light.jpg'
  });

  console.log('Creating category, author and entry…');
  await client
    .transaction()
    .createOrReplace({
      _id: 'category-heritage',
      _type: 'category',
      title: 'Heritage',
      slug: { _type: 'slug', current: 'heritage' },
      description: 'Ancient cities, temples and the people still keeping them.'
    })
    .createOrReplace({
      _id: 'author-reiseceylon',
      _type: 'author',
      name: 'The ReiseCeylon team',
      slug: { _type: 'slug', current: 'reiseceylon' },
      role: 'Journey planners, Colombo',
      bio: 'We route the island for a living, and write down what we learn on the way.'
    })
    .createOrReplace({
      _id: 'post-first-light-sigiriya',
      _type: 'post',
      title: 'First light over an ancient kingdom',
      slug: { _type: 'slug', current: 'first-light-over-an-ancient-kingdom' },
      excerpt:
        'Sigiriya before the buses arrive: cold stairs, mist in the moat, and twenty minutes when the rock belongs to almost nobody.',
      coverImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
        alt: 'Sigiriya rock fortress rising out of the morning mist'
      },
      category: { _type: 'reference', _ref: 'category-heritage' },
      author: { _type: 'reference', _ref: 'author-reiseceylon' },
      publishedAt: new Date().toISOString(),
      featured: true,
      body,
      seoDescription:
        'Why the first hour at Sigiriya is worth the alarm, and how we build a slower morning around it.'
    })
    .commit();

  console.log('Done — /blog/first-light-over-an-ancient-kingdom');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
