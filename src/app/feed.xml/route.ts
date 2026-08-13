/**
 * /feed.xml — the journal as RSS.
 *
 * A feed is the cheapest way to tell anything that watches for new writing that
 * new writing exists: readers, aggregators, and the crawlers that would rather
 * poll one small file than re-fetch an index page. It is linked from the head of
 * every page through `alternates.types`.
 *
 * English, and only the entries that are actually published — the placeholder
 * cards on /blog exist so the page is never empty, and they are not articles.
 */
import { defaultLocale } from '@/i18n/routing';
import { SITE_URL, pathFor } from '@/lib/seo';
import { getPosts } from '@/sanity/queries';

export const revalidate = 3600;

/** `&`, `<` and `>` are the three that matter inside an XML text node. */
function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  const posts = await getPosts(defaultLocale);
  const self = `${SITE_URL}/feed.xml`;

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${pathFor(`/blog/${post.slug}`, defaultLocale)}`;
      const description = post.excerpt ?? '';

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
${description ? `      <description>${escapeXml(description)}</description>\n` : ''}${post.category ? `      <category>${escapeXml(post.category)}</category>\n` : ''}    </item>`;
    })
    .join('\n');

  /* The newest entry dates the channel; an empty journal dates it now. */
  const updated = posts.length > 0 ? new Date(posts[0].publishedAt) : new Date();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ReiseCeylon — Field Notes</title>
    <link>${SITE_URL}/blog</link>
    <description>Field notes from Sri Lanka — the routes, the seasons, the trains and the places we keep going back to.</description>
    <language>en</language>
    <lastBuildDate>${updated.toUTCString()}</lastBuildDate>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
