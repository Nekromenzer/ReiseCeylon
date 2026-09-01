import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';
import type { SiteTag } from '@/sanity/site';

/**
 * Which cache tag each studio document type feeds.
 *
 * Every read in `@/sanity/site` and `@/sanity/queries` is tagged by document
 * type, and the tag is what a publish expires. Nothing here revalidates a *path*
 * any more, for two reasons:
 *
 *   The tags already cover every locale. The GROQ queries select whole localised
 *   objects and pick a language in TypeScript, so all four languages share a
 *   single cache entry per query — expiring one tag refreshes en, de, fr and nl
 *   together. The old per-locale `revalidatePath` fan-out was rebuilding the
 *   same page five times to achieve that.
 *
 *   And `revalidatePath('/', 'layout')` — which ran on every destination, tour
 *   and settings publish — invalidated the entire route tree beneath the root
 *   layout. That is all 782 routes: every destination in every language, the
 *   journal, the journeys, the lot, because one editor corrected one opening
 *   hour. The tag below reaches exactly the routes that render the thing that
 *   changed.
 */
const TAG_FOR_TYPE: Record<string, SiteTag | 'post'> = {
  post: 'post',
  destination: 'destination',
  tour: 'tour',
  /* The footer and the navigation read this, and they are on every page, so
     `settings` legitimately refreshes the whole site — that is the one publish
     where a site-wide rebuild is the correct answer rather than a waste. */
  siteSettings: 'settings'
};

/**
 * Sanity webhook target. Publishing in the studio drops the cached queries so
 * the change is live within seconds.
 *
 * Set up in sanity.io/manage → API → Webhooks:
 *   URL     https://reiseceylon.com/api/revalidate
 *   Trigger create, update, delete
 *   Filter  _type in ["post", "destination", "tour", "siteSettings"]
 *   Secret  the value of SANITY_REVALIDATE_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{ _type: string }>(
      request,
      process.env.SANITY_REVALIDATE_SECRET
    );

    if (!isValidSignature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }
    if (!body?._type) {
      return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    const tag = TAG_FOR_TYPE[body._type];

    /* A type the webhook filter should not have sent. Answer 200 so Sanity does
       not queue retries for a document the site does not render. */
    if (!tag) {
      return NextResponse.json({ revalidated: false, reason: `untracked type ${body._type}` });
    }

    /*
     * A webhook is expected to make newly published content visible on the very
     * next request. `max` serves stale content once while refreshing in the
     * background, so expire the tagged data immediately instead.
     */
    revalidateTag(tag, { expire: 0 });

    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
  } catch (error) {
    console.error('[sanity] revalidate failed', error);
    return NextResponse.json({ message: 'Revalidation failed' }, { status: 500 });
  }
}
