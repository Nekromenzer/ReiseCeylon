import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOG_LOCALES,
  assertTopics,
  auditPostSeo,
  blocksToPortableText,
  canonicalBlogHref,
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
  assert.equal(block.markDefs[0].href, 'https://www.reiseceylon.com/destinations/ella');
  assert.deepEqual(block.children.find((child) => child.text === 'Ella').marks, [block.markDefs[0]._key]);
});

test('blog links use the public www origin and preserve safe external links', () => {
  assert.equal(
    canonicalBlogHref('/destinations/sigiriya-rock-fortress'),
    'https://www.reiseceylon.com/destinations/sigiriya-rock-fortress'
  );
  assert.equal(canonicalBlogHref('https://example.com/guide'), 'https://example.com/guide');
  assert.equal(canonicalBlogHref('javascript:alert(1)'), null);
});

test('generated article validation rejects thin drafts', () => {
  assert.ok(validateGeneratedArticle({ title: 'Too short' }).length > 0);
});

test('SEO audit catches thin content and generic link anchors', () => {
  const audit = auditPostSeo({
    title: { en: 'A useful but incomplete travel guide' },
    seoDescription: { en: 'This description is intentionally long enough to pass its individual metadata length check for testing.' },
    body: {
      en: [
        {
          style: 'normal',
          markDefs: [{ _type: 'link', _key: 'link', href: 'https://www.reiseceylon.com/journeys' }],
          children: [{ text: 'click here', marks: ['link'] }]
        }
      ]
    }
  });
  assert.equal(audit.ok, false);
  assert.ok(audit.issues.includes('substantial English article with at least 500 words'));
  assert.ok(audit.issues.includes('descriptive link text instead of generic anchors'));
});

test('topic validation rejects duplicate keys', () => {
  const topic = {
    key: 'same',
    title: 'Title',
    primaryKeyword: 'Sri Lanka travel',
    searchIntent: 'Intent',
    category: 'Coast',
    brief: 'Brief',
    internalLinks: ['/destinations']
  };
  assert.throws(() => assertTopics([topic, topic]), /Duplicate topic key/);
});

test('publisher requires approval, due date, owned image and complete content in all four languages', () => {
  const paragraph = Array.from({ length: 260 }, (_, index) => `word${index}`).join(' ');
  const linkedBlock = (key, href, text) => ({
    _type: 'block',
    style: 'normal',
    markDefs: [{ _type: 'link', _key: key, href }],
    children: [
      { _type: 'span', text: paragraph, marks: [] },
      { _type: 'span', text, marks: [key] }
    ]
  });
  const localizedText = Object.fromEntries(BLOG_LOCALES.map((locale) => [locale, `Example ${locale} excerpt`]));
  const localizedSeo = Object.fromEntries(
    BLOG_LOCALES.map((locale) => [
      locale,
      `Plan a thoughtful ${locale} visit to Sigiriya with practical advice on pacing, preparation, cultural respect and nearby stops.`
    ])
  );
  const localizedAlt = Object.fromEntries(
    BLOG_LOCALES.map((locale) => [locale, `A descriptive ${locale} alternative text for the cover photograph`])
  );
  const localizedTitle = Object.fromEntries(
    BLOG_LOCALES.map((locale) => [locale, `A practical first-time guide to Sigiriya ${locale}`])
  );
  const localizedBody = Object.fromEntries(
    BLOG_LOCALES.map((locale) => [
      locale,
      [
        { _type: 'block', style: 'h2', markDefs: [], children: [{ text: 'Plan the morning', marks: [] }] },
        linkedBlock('destination-link', 'https://www.reiseceylon.com/destinations/sigiriya-rock-fortress', 'Sigiriya guide'),
        { _type: 'block', style: 'h2', markDefs: [], children: [{ text: 'Continue the journey', marks: [] }] },
        linkedBlock('journey-link', 'https://www.reiseceylon.com/journeys', 'Sri Lanka journey planner')
      ]
    ])
  );
  const complete = {
    _id: 'drafts.blog-auto-example',
    _type: 'post',
    title: localizedTitle,
    slug: { current: 'example-title' },
    excerpt: localizedText,
    seoDescription: localizedSeo,
    coverImage: { asset: { _ref: 'image-1' }, alt: localizedAlt },
    category: { _ref: 'category-heritage' },
    body: localizedBody,
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

test('publisher rejects a generated post when any translation is missing', () => {
  const result = isPublishableDraft({
    _id: 'drafts.blog-auto-example',
    _type: 'post',
    title: { en: 'English title is present and long enough' },
    slug: { current: 'example-title' },
    automation: {
      generated: true,
      status: 'approved',
      scheduledFor: '2026-01-01T00:00:00.000Z'
    }
  }, new Date('2026-01-02T00:00:00.000Z'));

  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('German title'));
  assert.ok(result.missing.includes('French body'));
  assert.ok(result.missing.includes('Dutch SEO description'));
});
