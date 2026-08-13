/**
 * The journal, read from Sanity in the language the page is rendering in.
 *
 * Title, excerpt, body and category are localised fields; the resolution rule is
 * the one in `./locale-field` — requested language, then English, then nothing.
 * An entry written only in English therefore still appears on /de/blog, in
 * English, rather than vanishing from the grid.
 */
import type { PortableTextBlock } from '@portabletext/types';
import { defineQuery } from 'next-sanity';
import type { Image } from 'sanity';
import { getClient } from './client';
import { isSanityConfigured } from './env';
import {
  pickLocale,
  pickLocaleBlocks,
  pickLocaleOrNull,
  type MaybeLocalised
} from './locale-field';

export type SanityImage = Image & { alt?: string; caption?: string };

export type PostCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: SanityImage;
  category: string | null;
  publishedAt: string;
  /** Sanity's own last-write timestamp — `dateModified`, and the sitemap's. */
  updatedAt: string | null;
  readingTime: number | null;
  featured: boolean | null;
};

export type Post = PostCard & {
  body: PortableTextBlock[];
  seoDescription: string | null;
  author: { name: string; role: string | null; image: SanityImage | null } | null;
};

/** The raw document, before a language has been chosen out of each field. */
type RawImageField = Image & { alt?: MaybeLocalised; caption?: MaybeLocalised };

type PostCardRow = {
  _id: string;
  title: MaybeLocalised;
  slug: string;
  excerpt: MaybeLocalised;
  coverImage: RawImageField;
  category: MaybeLocalised;
  publishedAt: string;
  updatedAt: string | null;
  readingTime: number | null;
  featured: boolean | null;
};

type PostRow = PostCardRow & {
  body: PortableTextBlock[] | Record<string, PortableTextBlock[]> | null;
  seoDescription: MaybeLocalised;
  author: { name: string; role: MaybeLocalised; image: RawImageField | null } | null;
};

const cardFields = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  coverImage,
  "category": category->title,
  publishedAt,
  "updatedAt": _updatedAt,
  featured,
  // Estimated from the English body at ~180 words a minute unless the editor set it.
  "readingTime": coalesce(readingTime, round(length(pt::text(body.en)) / 5 / 180) + 1)
`;

export const postsQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)]
  | order(featured desc, publishedAt desc) {${cardFields}}
`);

export const postBySlugQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    ${cardFields},
    body,
    seoDescription,
    author->{ name, role, image }
  }
`);

export const postSlugsQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)][].slug.current
`);

/** Slug and last-write date for every entry — what the sitemap needs, no more. */
export const postIndexQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] {
    "slug": slug.current, "updatedAt": _updatedAt
  }
`);

export const relatedPostsQuery = defineQuery(`
  *[_type == "post" && slug.current != $slug && defined(slug.current)]
  | order(publishedAt desc)[0...2] {${cardFields}}
`);

function resolveImage(image: RawImageField, locale: string): SanityImage {
  return {
    ...image,
    alt: pickLocale(image?.alt, locale),
    caption: pickLocale(image?.caption, locale)
  } as SanityImage;
}

function resolveCard(row: PostCardRow, locale: string): PostCard {
  return {
    _id: row._id,
    title: pickLocale(row.title, locale),
    slug: row.slug,
    excerpt: pickLocaleOrNull(row.excerpt, locale),
    coverImage: resolveImage(row.coverImage, locale),
    category: pickLocaleOrNull(row.category, locale),
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt ?? null,
    readingTime: row.readingTime,
    featured: row.featured
  };
}

/**
 * All journal reads go through here. Responses are cached until the Sanity
 * webhook hits /api/revalidate, so published edits appear within seconds
 * without giving up static delivery. The cache is language-independent — the
 * document is fetched once and a language picked from it per render.
 */
async function fetchJournal<T>(query: string, params: Record<string, unknown>, fallback: T): Promise<T> {
  if (!isSanityConfigured) return fallback;
  try {
    return await getClient().fetch<T>(query, params, {
      next: { tags: ['post'], revalidate: 3600 }
    });
  } catch (error) {
    console.error('[sanity] journal fetch failed', error);
    return fallback;
  }
}

export async function getPosts(locale: string): Promise<PostCard[]> {
  const rows = await fetchJournal<PostCardRow[]>(postsQuery, {}, []);
  return rows.map((row) => resolveCard(row, locale)).filter((post) => post.title.length > 0);
}

export async function getPost(slug: string, locale: string): Promise<Post | null> {
  const row = await fetchJournal<PostRow | null>(postBySlugQuery, { slug }, null);
  if (!row) return null;

  return {
    ...resolveCard(row, locale),
    body: pickLocaleBlocks(row.body, locale),
    seoDescription: pickLocaleOrNull(row.seoDescription, locale),
    author: row.author
      ? {
          name: row.author.name,
          role: pickLocaleOrNull(row.author.role, locale),
          image: row.author.image ? resolveImage(row.author.image, locale) : null
        }
      : null
  };
}

export function getPostSlugs() {
  return fetchJournal<string[]>(postSlugsQuery, {}, []);
}

export function getPostIndex() {
  return fetchJournal<Array<{ slug: string; updatedAt: string | null }>>(postIndexQuery, {}, []);
}

export async function getRelatedPosts(slug: string, locale: string): Promise<PostCard[]> {
  const rows = await fetchJournal<PostCardRow[]>(relatedPostsQuery, { slug }, []);
  return rows.map((row) => resolveCard(row, locale)).filter((post) => post.title.length > 0);
}
