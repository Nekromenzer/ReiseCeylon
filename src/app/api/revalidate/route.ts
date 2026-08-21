import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';
import { locales } from '@/i18n/routing';

function revalidateLocalizedPath(path: string) {
  // Revalidate both the public default-locale URL and every internal locale
  // route used by next-intl. This keeps the webhook correct regardless of
  // whether the request reached Next.js as /blog or /en/blog.
  revalidatePath(path);
  for (const locale of locales) revalidatePath(`/${locale}${path}`);
}

function revalidateLocalizedLayouts() {
  revalidatePath('/', 'layout');
  for (const locale of locales) revalidatePath(`/${locale}`, 'layout');
}

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
    const { isValidSignature, body } = await parseBody<{ _type: string; slug?: { current?: string } }>(
      request,
      process.env.SANITY_REVALIDATE_SECRET
    );

    if (!isValidSignature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }
    if (!body?._type) {
      return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    const slug = body.slug?.current;

    if (body._type === 'post') {
      // A webhook is expected to make newly published content visible on the
      // very next request. `max` serves stale content once while refreshing in
      // the background, so expire the tagged data immediately instead.
      revalidateTag('post', { expire: 0 });
      revalidateLocalizedPath('/blog');
      if (slug) revalidateLocalizedPath(`/blog/${slug}`);
    } else {
      /* Destinations, journeys and contact details all feed the 'site' tag. */
      revalidateTag('site', { expire: 0 });
      revalidateLocalizedLayouts();
      if (body._type === 'siteSettings') revalidateLocalizedPath('/contact');
      if (body._type === 'destination' && slug) revalidateLocalizedPath(`/destinations/${slug}`);
      if (body._type === 'tour' && slug) revalidateLocalizedPath(`/tours/${slug}`);
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error('[sanity] revalidate failed', error);
    return NextResponse.json({ message: 'Revalidation failed' }, { status: 500 });
  }
}
