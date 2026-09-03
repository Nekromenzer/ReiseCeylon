import { readFile } from 'node:fs/promises';

export const AUTOMATION_AUTHOR_ID = 'author-reiseceylon';
export const BLOG_SITE_ORIGIN = 'https://www.reiseceylon.com';
export const BLOG_LOCALES = ['en', 'de', 'fr', 'nl'];

const localeNames = {
  en: 'English',
  de: 'German',
  fr: 'French',
  nl: 'Dutch'
};

const internalLinkCopy = {
  en: {
    destinations: 'Sri Lanka destination guides',
    journeys: 'Sri Lanka journey ideas',
    destination: (name) => `${name} destination guide`
  },
  de: {
    destinations: 'Reiseführer für Sri Lankas Reiseziele',
    journeys: 'Ideen für Sri-Lanka-Rundreisen',
    destination: (name) => `Reiseführer für ${name}`
  },
  fr: {
    destinations: 'guides des destinations au Sri Lanka',
    journeys: 'idées de circuits au Sri Lanka',
    destination: (name) => `guide de ${name}`
  },
  nl: {
    destinations: 'gidsen voor bestemmingen in Sri Lanka',
    journeys: 'ideeën voor rondreizen door Sri Lanka',
    destination: (name) => `reisgids voor ${name}`
  }
};

const internalLinkIntroductions = {
  en: 'Continue planning with',
  de: 'Planen Sie Ihre Reise weiter mit',
  fr: 'Poursuivez la préparation avec',
  nl: 'Plan uw reis verder met'
};

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

function titleFromLink(link) {
  const segment = link.split('/').filter(Boolean).at(-1) ?? '';
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function localizedLinkAnchor(locale, link) {
  const copy = internalLinkCopy[locale] ?? internalLinkCopy.en;
  if (link === '/destinations') return copy.destinations;
  if (link === '/journeys') return copy.journeys;
  return copy.destination(titleFromLink(link));
}

/**
 * Structured output guarantees the article shape, but models can still omit a
 * requested link. Add only missing links so one recoverable omission does not
 * discard an otherwise reviewable four-language draft.
 */
export function ensureRequiredInternalLinks(article, topic) {
  if (!article || typeof article !== 'object' || !Array.isArray(topic?.internalLinks)) return article;

  const repaired = structuredClone(article);
  for (const locale of BLOG_LOCALES) {
    const blocks = repaired.translations?.[locale]?.blocks;
    if (!Array.isArray(blocks)) continue;

    const articleText = blocks.map((block) => block?.text ?? '').join('\n');
    const missingLinks = topic.internalLinks.filter((link) => !articleText.includes(`](${link})`));
    if (missingLinks.length === 0) continue;

    const links = missingLinks.map((link) => `[${localizedLinkAnchor(locale, link)}](${link})`);
    const text = `${internalLinkIntroductions[locale] ?? internalLinkIntroductions.en} ${links.join(', ')}.`;
    blocks.push({ style: 'normal', text });
  }
  return repaired;
}

function blockText(block) {
  if (typeof block?.text === 'string') return block.text;
  if (!Array.isArray(block?.children)) return '';
  return block.children.map((child) => child?.text ?? '').join('');
}

export function postWordCount(blocks) {
  return (blocks ?? [])
    .map(blockText)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function auditPostSeo(document, locale = 'en') {
  const issues = [];
  const language = localeNames[locale] ?? locale;
  const title = document?.title?.[locale]?.trim() ?? '';
  const description = document?.seoDescription?.[locale]?.trim() ?? '';
  const blocks = document?.body?.[locale] ?? [];
  const wordCount = postWordCount(blocks);
  const headings = blocks.filter((block) => block?.style === 'h2');
  const links = blocks.flatMap((block) => block?.markDefs ?? []).filter((mark) => mark?._type === 'link');
  const internalLinks = links.filter((mark) =>
    /^https:\/\/www\.reiseceylon\.com\/(blog|destinations|journeys|tours)(\/|$)/.test(mark.href ?? '')
  );

  if (title.length < 25 || title.length > 70) issues.push('descriptive title between 25 and 70 characters');
  if (description.length < 110 || description.length > 165) {
    issues.push('SEO description between 110 and 165 characters');
  }
  // Google has no preferred word count. This threshold only catches incomplete or thin automation output.
  if (wordCount < 500) issues.push(`substantial ${language} article with at least 500 words`);
  if (headings.length < 2) issues.push('at least two descriptive H2 sections');
  if (internalLinks.length < 2) issues.push('at least two canonical internal links');

  const genericAnchors = blocks
    .flatMap((block) => {
      const markedKeys = new Set((block?.markDefs ?? []).filter((mark) => mark?._type === 'link').map((mark) => mark._key));
      return (block?.children ?? []).filter((child) => child?.marks?.some((mark) => markedKeys.has(mark)));
    })
    .map((child) => child.text?.trim().toLowerCase())
    .filter((text) => ['click here', 'read more', 'learn more', 'here'].includes(text));
  if (genericAnchors.length > 0) issues.push('descriptive link text instead of generic anchors');

  return { ok: issues.length === 0, issues, wordCount };
}

export function validateGeneratedArticle(article, topic) {
  const errors = [];
  if (!article || typeof article !== 'object') return ['The AI response is not an object.'];
  if (!Number.isInteger(article.readingTime) || article.readingTime < 3 || article.readingTime > 20) {
    errors.push('Reading time must be a whole number from 3 to 20.');
  }
  if (!Array.isArray(article.factCheckItems) || article.factCheckItems.length < 2) {
    errors.push('The article needs at least two specific fact-check items for its human editor.');
  }
  for (const locale of BLOG_LOCALES) {
    const language = localeNames[locale];
    const translation = article.translations?.[locale];
    if (!translation || typeof translation !== 'object') {
      errors.push(`The article is missing its ${language} translation.`);
      continue;
    }
    if (
      typeof translation.title !== 'string' ||
      translation.title.trim().length < 25 ||
      translation.title.length > 70
    ) {
      errors.push(`${language} title must contain between 25 and 70 characters.`);
    }
    if (
      typeof translation.excerpt !== 'string' ||
      translation.excerpt.trim().length < 80 ||
      translation.excerpt.length > 240
    ) {
      errors.push(`${language} excerpt must be between 80 and 240 characters.`);
    }
    if (
      typeof translation.seoDescription !== 'string' ||
      translation.seoDescription.trim().length < 110 ||
      translation.seoDescription.length > 165
    ) {
      errors.push(`${language} SEO description must be between 110 and 165 characters.`);
    }
    if (typeof translation.coverImageAlt !== 'string' || translation.coverImageAlt.trim().length < 20) {
      errors.push(`${language} cover-image alternative text must contain at least 20 characters.`);
    }
    if (!Array.isArray(translation.blocks) || translation.blocks.length < 8) {
      errors.push(`The ${language} article must contain at least eight content blocks.`);
      continue;
    }
    const styles = new Set(['normal', 'h2', 'h3', 'blockquote']);
    translation.blocks.forEach((block, index) => {
      if (!block || !styles.has(block.style) || typeof block.text !== 'string' || !block.text.trim()) {
        errors.push(`${language} content block ${index + 1} is invalid.`);
      }
    });
    if (translation.blocks.filter((block) => block.style === 'h2').length < 2) {
      errors.push(`The ${language} article needs at least two section headings.`);
    }
    if (postWordCount(translation.blocks) < 500) {
      errors.push(`The ${language} article must contain at least 500 words.`);
    }
    if (topic?.internalLinks) {
      const articleText = translation.blocks.map((block) => block.text).join('\n');
      for (const link of topic.internalLinks) {
        if (!articleText.includes(`](${link})`)) {
          errors.push(`The ${language} article is missing required internal link: ${link}`);
        }
      }
      if (/\[(click here|read more|learn more|here)]\(/i.test(articleText)) {
        errors.push(`${language} internal links must use descriptive anchor text.`);
      }
    }
  }
  return errors;
}

export function assertTopics(topics) {
  if (!Array.isArray(topics) || topics.length === 0) throw new Error('The topic plan is empty.');
  const keys = new Set();
  for (const [index, topic] of topics.entries()) {
    for (const field of ['key', 'title', 'primaryKeyword', 'searchIntent', 'category', 'brief']) {
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
  if (!document?.slug?.current) missing.push('slug');
  if (!document?.coverImage?.asset?._ref) missing.push('owned cover image');
  if (!document?.category?._ref) missing.push('category');
  for (const locale of BLOG_LOCALES) {
    const language = localeNames[locale];
    if (!document?.title?.[locale]) missing.push(`${language} title`);
    if (!document?.excerpt?.[locale]) missing.push(`${language} excerpt`);
    if (!document?.seoDescription?.[locale]) missing.push(`${language} SEO description`);
    if (!document?.coverImage?.alt?.[locale]) missing.push(`${language} cover-image alternative text`);
    if (!Array.isArray(document?.body?.[locale]) || document.body[locale].length === 0) {
      missing.push(`${language} body`);
      continue;
    }
    const seoAudit = auditPostSeo(document, locale);
    missing.push(...seoAudit.issues.map((issue) => `${language} SEO: ${issue}`));
  }
  return { ok: missing.length === 0, missing };
}
