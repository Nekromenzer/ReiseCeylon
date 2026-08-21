import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTopics,
  blocksToPortableText,
  draftIdFor,
  isPublishableDraft,
  slugify,
  validateGeneratedArticle
} from './blog-automation-lib.mjs';

test('slugify creates stable URL-safe values', () => {
  assert.equal(slugify('A Thoughtful Day in Gālle!'), 'a-thoughtful-day-in-galle');
  assert.equal(draftIdFor({ key: 'Galle Fort Guide' }), 'drafts.blog-auto-galle-fort-guide');
});

test('Portable Text conversion keeps safe internal links', () => {
  const [block] = blocksToPortableText([
    { style: 'normal', text: 'Continue to [Ella](/destinations/ella) after breakfast.' }
  ]);
  assert.equal(block.children.map((child) => child.text).join(''), 'Continue to Ella after breakfast.');
  assert.equal(block.markDefs[0].href, '/destinations/ella');
  assert.deepEqual(block.children.find((child) => child.text === 'Ella').marks, [block.markDefs[0]._key]);
});

test('generated article validation rejects thin drafts', () => {
  assert.ok(validateGeneratedArticle({ title: 'Too short' }).length > 0);
});

test('topic validation rejects duplicate keys', () => {
  const topic = {
    key: 'same',
    title: 'Title',
    searchIntent: 'Intent',
    category: 'Coast',
    brief: 'Brief',
    internalLinks: ['/destinations']
  };
  assert.throws(() => assertTopics([topic, topic]), /Duplicate topic key/);
});

test('publisher requires approval, due date, owned image and complete English content', () => {
  const complete = {
    _id: 'drafts.blog-auto-example',
    _type: 'post',
    title: { en: 'Example title' },
    slug: { current: 'example-title' },
    excerpt: { en: 'Example excerpt' },
    seoDescription: { en: 'Example SEO description' },
    coverImage: { asset: { _ref: 'image-1' }, alt: { en: 'A descriptive alternative' } },
    category: { _ref: 'category-heritage' },
    body: { en: [{ _type: 'block' }] },
    automation: {
      generated: true,
      status: 'approved',
      scheduledFor: '2026-01-01T00:00:00.000Z'
    }
  };
  assert.deepEqual(isPublishableDraft(complete, new Date('2026-01-02T00:00:00.000Z')), {
    ok: true,
    missing: []
  });
  const incomplete = structuredClone(complete);
  delete incomplete.coverImage.asset;
  incomplete.automation.status = 'needs-review';
  const result = isPublishableDraft(incomplete, new Date('2026-01-02T00:00:00.000Z'));
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('approval'));
  assert.ok(result.missing.includes('owned cover image'));
});
