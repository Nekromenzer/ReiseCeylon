import type { PortableTextBlock } from '@portabletext/types';
import { defineQuery } from 'next-sanity';
import type { Image } from 'sanity';
import { getClient } from './client';
import { isSanityConfigured } from './env';

export type SanityImage = Image & { alt?: string; caption?: string };

export type PostCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: SanityImage;
  category: string | null;
  publishedAt: string;
  readingTime: number | null;
  featured: boolean | null;
};

export type Post = PostCard & {
  body: PortableTextBlock[];
  seoDescription: string | null;
  author: { name: string; role: string | null; image: SanityImage | null } | null;
};

const cardFields = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  coverImage,
  "category": category->title,
  publishedAt,
  featured,
  // Estimated from the body at ~180 words a minute unless the editor set it.
  "readingTime": coalesce(readingTime, round(length(pt::text(body)) / 5 / 180) + 1)
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

export const relatedPostsQuery = defineQuery(`
  *[_type == "post" && slug.current != $slug && defined(slug.current)]
  | order(publishedAt desc)[0...2] {${cardFields}}
`);

/**
 * All journal reads go through here. Responses are cached until the Sanity
 * webhook hits /api/revalidate, so published edits appear within seconds
 * without giving up static delivery.
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

export function getPosts() {
  return fetchJournal<PostCard[]>(postsQuery, {}, []);
}

export function getPost(slug: string) {
  return fetchJournal<Post | null>(postBySlugQuery, { slug }, null);
}

export function getPostSlugs() {
  return fetchJournal<string[]>(postSlugsQuery, {}, []);
}

export function getRelatedPosts(slug: string) {
  return fetchJournal<PostCard[]>(relatedPostsQuery, { slug }, []);
}
