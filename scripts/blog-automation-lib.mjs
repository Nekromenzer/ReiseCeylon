import { readFile } from 'node:fs/promises';

export const AUTOMATION_AUTHOR_ID = 'author-reiseceylon';
export const BLOG_SITE_ORIGIN = 'https://www.reiseceylon.com';

export function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function portableTextKey(seed) {
  return `auto-${String(seed).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

export function canonicalBlogHref(href) {
  if (typeof href !== 'string') return null;
  if (/^\/(blog|destinations|journeys|tours)(\/|$)/.test(href)) return `${BLOG_SITE_ORIGIN}${href}`;
  if (/^https:\/\//.test(href)) return href;
  return null;
}

/** Convert lightweight Markdown links into Sanity Portable Text spans. */
export function textToChildren(value, blockKey) {
  const children = [];
  const markDefs = [];
  const pattern = /\[([^\]]+)]\(([^)]+)\)/g;
  let cursor = 0;
  let match;
  let childIndex = 0;

  const addSpan = (text, marks = []) => {
    if (!text) return;
    children.push({
      _type: 'span',
      _key: portableTextKey(`${blockKey}-span-${childIndex++}`),
      text,
      marks
    });
  };

  while ((match = pattern.exec(value)) !== null) {
    addSpan(value.slice(cursor, match.index));
    const href = canonicalBlogHref(match[2]);
    if (href) {
      const markKey = portableTextKey(`${blockKey}-link-${markDefs.length}`);
      markDefs.push({ _type: 'link', _key: markKey, href });
      addSpan(match[1], [markKey]);
    } else {
      addSpan(match[0]);
    }
    cursor = match.index + match[0].length;
  }

  addSpan(value.slice(cursor));
  if (children.length === 0) addSpan(value);
  return { children, markDefs };
}

export function blocksToPortableText(blocks) {
  return blocks.map((block, index) => {
    const blockKey = portableTextKey(index + 1);
    const { children, markDefs } = textToChildren(block.text.trim(), blockKey);
    return {
      _type: 'block',
      _key: blockKey,
      style: block.style,
      markDefs,
      children
    };
  });
}

export function validateGeneratedArticle(article) {
  const errors = [];
  if (!article || typeof article !== 'object') return ['The AI response is not an object.'];
  if (typeof article.title !== 'string' || article.title.trim().length < 20) {
    errors.push('Title must contain at least 20 characters.');
  }
  if (typeof article.excerpt !== 'string' || article.excerpt.trim().length < 80 || article.excerpt.length > 240) {
    errors.push('Excerpt must be between 80 and 240 characters.');
  }
  if (
    typeof article.seoDescription !== 'string' ||
    article.seoDescription.trim().length < 100 ||
    article.seoDescription.length > 165
  ) {
    errors.push('SEO description must be between 100 and 165 characters.');
  }
  if (typeof article.coverImageAlt !== 'string' || article.coverImageAlt.trim().length < 20) {
    errors.push('Cover-image alternative text must contain at least 20 characters.');
  }
  if (!Number.isInteger(article.readingTime) || article.readingTime < 3 || article.readingTime > 20) {
    errors.push('Reading time must be a whole number from 3 to 20.');
  }
  if (!Array.isArray(article.blocks) || article.blocks.length < 8) {
    errors.push('The article must contain at least eight content blocks.');
  } else {
    const styles = new Set(['normal', 'h2', 'h3', 'blockquote']);
    article.blocks.forEach((block, index) => {
      if (!block || !styles.has(block.style) || typeof block.text !== 'string' || !block.text.trim()) {
        errors.push(`Content block ${index + 1} is invalid.`);
      }
    });
    if (!article.blocks.some((block) => block.style === 'h2')) {
      errors.push('The article needs at least one section heading.');
    }
  }
  return errors;
}

export function assertTopics(topics) {
  if (!Array.isArray(topics) || topics.length === 0) throw new Error('The topic plan is empty.');
  const keys = new Set();
  for (const [index, topic] of topics.entries()) {
    for (const field of ['key', 'title', 'searchIntent', 'category', 'brief']) {
      if (typeof topic?.[field] !== 'string' || !topic[field].trim()) {
        throw new Error(`Topic ${index + 1} is missing ${field}.`);
      }
    }
    if (!Array.isArray(topic.internalLinks) || topic.internalLinks.length < 1) {
      throw new Error(`Topic ${topic.key} needs at least one internal link.`);
    }
    if (keys.has(topic.key)) throw new Error(`Duplicate topic key: ${topic.key}`);
    keys.add(topic.key);
  }
  return topics;
}

export async function loadTopics(url = new URL('./blog-topics.json', import.meta.url)) {
  return assertTopics(JSON.parse(await readFile(url, 'utf8')));
}

export function draftIdFor(topic) {
  return `drafts.blog-auto-${slugify(topic.key)}`;
}

export function publishedIdFor(topic) {
  return draftIdFor(topic).replace(/^drafts\./, '');
}

export function stripSystemFields(document) {
  const { _rev, _createdAt, _updatedAt, ...content } = document;
  return content;
}

export function isPublishableDraft(document, now = new Date()) {
  const missing = [];
  if (!document?._id?.startsWith('drafts.')) missing.push('draft id');
  if (document?._type !== 'post') missing.push('post type');
  if (document?.automation?.generated !== true) missing.push('generated marker');
  if (document?.automation?.status !== 'approved') missing.push('approval');
  if (!document?.automation?.scheduledFor) {
    missing.push('publishing date');
  } else if (Number.isNaN(Date.parse(document.automation.scheduledFor))) {
    missing.push('valid publishing date');
  } else if (new Date(document.automation.scheduledFor) > now) {
    missing.push('due publishing date');
  }
  if (!document?.title?.en) missing.push('English title');
  if (!document?.slug?.current) missing.push('slug');
  if (!document?.excerpt?.en) missing.push('English excerpt');
  if (!document?.seoDescription?.en) missing.push('English SEO description');
  if (!document?.coverImage?.asset?._ref) missing.push('owned cover image');
  if (!document?.coverImage?.alt?.en) missing.push('cover-image alternative text');
  if (!document?.category?._ref) missing.push('category');
  if (!Array.isArray(document?.body?.en) || document.body.en.length === 0) missing.push('English body');
  return { ok: missing.length === 0, missing };
}
