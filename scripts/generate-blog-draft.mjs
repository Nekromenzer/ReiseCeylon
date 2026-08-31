import process from 'node:process';
import { createClient } from '@sanity/client';
import {
  AUTOMATION_AUTHOR_ID,
  blocksToPortableText,
  draftIdFor,
  loadTopics,
  publishedIdFor,
  slugify,
  validateGeneratedArticle
} from './blog-automation-lib.mjs';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_TOKEN;
const openAiKey = process.env.OPENAI_API_KEY;
const model = process.env.BLOG_AI_MODEL?.trim() || 'gpt-5-mini';
const requestedTopic = process.argv.find((argument) => argument.startsWith('--topic='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');
const locales = ['en', 'de', 'fr', 'nl'];

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID.');
if (!token) throw new Error('Missing SANITY_API_TOKEN with Editor permissions.');
if (!openAiKey) throw new Error('Missing OPENAI_API_KEY.');

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-10-01',
  token,
  useCdn: false
});

const translationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'excerpt', 'seoDescription', 'coverImageAlt', 'blocks'],
  properties: {
    title: { type: 'string', minLength: 25, maxLength: 70 },
    excerpt: { type: 'string', minLength: 80, maxLength: 240 },
    seoDescription: { type: 'string', minLength: 110, maxLength: 165 },
    coverImageAlt: { type: 'string', minLength: 20, maxLength: 180 },
    blocks: {
      type: 'array',
      minItems: 8,
      maxItems: 28,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['style', 'text'],
        properties: {
          style: { type: 'string', enum: ['normal', 'h2', 'h3', 'blockquote'] },
          text: { type: 'string', minLength: 1, maxLength: 1800 }
        }
      }
    }
  }
};

const articleSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['translations', 'readingTime', 'factCheckItems'],
  properties: {
    translations: {
      type: 'object',
      additionalProperties: false,
      required: locales,
      properties: Object.fromEntries(locales.map((locale) => [locale, translationSchema]))
    },
    readingTime: { type: 'integer', minimum: 3, maximum: 20 },
    factCheckItems: {
      type: 'array',
      minItems: 2,
      maxItems: 8,
      items: { type: 'string', minLength: 15, maxLength: 240 }
    }
  }
};

function responseText(response) {
  if (typeof response.output_text === 'string') return response.output_text;
  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  throw new Error('The AI response contained no text output.');
}

async function generateArticle(topic) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 24000,
      instructions: [
        'Write an original ReiseCeylon travel-journal draft in all four supported languages: English (en), German (de), French (fr), and Dutch (nl).',
        'First create the factual source article, then produce faithful, natural translations. Every language must communicate the same facts, cautions, structure and practical advice without adding or removing claims.',
        'Use clear, warm B1-level language appropriate to each locale. Do not leave English text inside the German, French or Dutch versions except proper names.',
        'Sound like an experienced Sri Lankan journey planner, not an advertisement or generic AI article.',
        'Satisfy the supplied searchIntent completely and use the primaryKeyword naturally, never repeatedly or awkwardly.',
        'Write a unique, descriptive title of 25-70 characters. The opening paragraph must answer the traveller’s main need directly.',
        'Create at least two useful H2 sections. Prefer concrete decisions, trade-offs and local context over generic travel advice.',
        'Each language must be a substantial 600-1,200 word guide, but do not pad the article or repeat points to reach a word count.',
        'Do not invent first-person experiences, quotations, prices, schedules, laws, statistics or historical facts.',
        'Treat weather, wildlife and transport as variable. Use careful language and flag anything that needs live verification.',
        'Use every supplied internal link in every language, naturally in Markdown form: [localized descriptive anchor](/path). Keep each supplied path exactly unchanged. Never use click here or read more.',
        'Return specific factCheckItems for the human editor, including cultural or historical claims and anything that can change.',
        'Include practical advice, cultural respect and a calm conclusion. Do not use a FAQ section.',
        'The coverImageAlt describes a suitable future photograph; it does not claim that an image already exists.'
      ].join('\n'),
      input: JSON.stringify(topic),
      text: {
        format: {
          type: 'json_schema',
          name: 'reiseceylon_blog_draft',
          strict: true,
          schema: articleSchema
        }
      }
    })
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1200);
    throw new Error(`AI request failed (${response.status}): ${detail}`);
  }

  const article = JSON.parse(responseText(await response.json()));
  const errors = validateGeneratedArticle(article, topic);
  if (errors.length > 0) throw new Error(`Generated article failed validation:\n- ${errors.join('\n- ')}`);
  return article;
}

async function documentExists(topic) {
  const [draft, published] = await Promise.all([
    client.getDocument(draftIdFor(topic)),
    client.getDocument(publishedIdFor(topic))
  ]);
  return Boolean(draft || published);
}

async function selectTopic() {
  const topics = await loadTopics();
  if (requestedTopic) {
    const match = topics.find((topic) => topic.key === requestedTopic);
    if (!match) throw new Error(`Unknown topic key: ${requestedTopic}`);
    if (await documentExists(match)) throw new Error(`A draft or post already exists for ${requestedTopic}.`);
    return match;
  }
  for (const topic of topics) {
    if (!(await documentExists(topic))) return topic;
  }
  return null;
}

async function ensureReferences(topic) {
  const categorySlug = slugify(topic.category);
  const existingCategoryId = await client.fetch(
    '*[_type == "category" && slug.current == $slug][0]._id',
    { slug: categorySlug },
    { perspective: 'raw' }
  );
  const categoryId = existingCategoryId ?? `category-${categorySlug}`;
  const transaction = client.transaction();
  if (!existingCategoryId) {
    transaction.createIfNotExists({
      _id: categoryId,
      _type: 'category',
      title: { _type: 'localeString', en: topic.category },
      slug: { _type: 'slug', current: categorySlug }
    });
  }
  await transaction
    .createIfNotExists({
      _id: AUTOMATION_AUTHOR_ID,
      _type: 'author',
      name: 'The ReiseCeylon team',
      slug: { _type: 'slug', current: 'reiseceylon' },
      role: { _type: 'localeStringOptional', en: 'Journey planners, Colombo' },
      bio: {
        _type: 'localeTextOptional',
        en: 'We route the island for a living and write down what we learn along the way.'
      }
    })
    .commit();
  return { categoryId, authorId: AUTOMATION_AUTHOR_ID };
}

async function main() {
  const topic = await selectTopic();
  if (!topic) {
    console.log('No unused topics remain. Add reviewed topics to scripts/blog-topics.json.');
    return;
  }

  console.log(`Generating draft for: ${topic.title}`);
  const article = await generateArticle(topic);
  const slug = slugify(article.translations.en.title);
  const conflictingPost = await client.fetch(
    '*[_type == "post" && slug.current == $slug && !(_id in [$draftId, $publishedId])][0]._id',
    {
      slug,
      draftId: draftIdFor(topic),
      publishedId: publishedIdFor(topic)
    },
    { perspective: 'raw' }
  );
  if (conflictingPost) {
    throw new Error(`Generated slug "${slug}" is already used by ${conflictingPost}. Revise the topic or existing post.`);
  }
  const draft = {
    _id: draftIdFor(topic),
    _type: 'post',
    title: {
      _type: 'localeString',
      ...Object.fromEntries(locales.map((locale) => [locale, article.translations[locale].title.trim()]))
    },
    slug: { _type: 'slug', current: slug },
    excerpt: {
      _type: 'localeTextOptional',
      ...Object.fromEntries(locales.map((locale) => [locale, article.translations[locale].excerpt.trim()]))
    },
    coverImage: {
      _type: 'image',
      alt: {
        _type: 'localeStringOptional',
        ...Object.fromEntries(locales.map((locale) => [locale, article.translations[locale].coverImageAlt.trim()]))
      }
    },
    publishedAt: new Date().toISOString(),
    readingTime: article.readingTime,
    featured: false,
    body: {
      _type: 'localeBlockContent',
      ...Object.fromEntries(
        locales.map((locale) => [locale, blocksToPortableText(article.translations[locale].blocks)])
      )
    },
    seoDescription: {
      _type: 'localeTextOptional',
      ...Object.fromEntries(locales.map((locale) => [locale, article.translations[locale].seoDescription.trim()]))
    },
    automation: {
      _type: 'automation',
      generated: true,
      status: 'needs-review',
      topicKey: topic.key,
      reviewNotes: [
        `Search intent: ${topic.searchIntent}`,
        `Primary phrase: ${topic.primaryKeyword}`,
        'Generated languages: English, German, French and Dutch.',
        'Before approval: review all four translations, add an owned cover image, review every link and verify these claims:',
        ...article.factCheckItems.map((item) => `- ${item}`)
      ].join('\n')
    }
  };

  if (dryRun) {
    console.log(JSON.stringify(draft, null, 2));
    return;
  }

  const references = await ensureReferences(topic);
  draft.category = { _type: 'reference', _ref: references.categoryId };
  draft.author = { _type: 'reference', _ref: references.authorId };
  await client.createIfNotExists(draft);
  console.log(`Draft created in English, German, French and Dutch: ${article.translations.en.title}`);
  console.log('Next: open Blog posts in Sanity Studio, review all translations, add an owned cover image, fact-check, schedule and approve.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
