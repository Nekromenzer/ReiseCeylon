import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

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
      revalidateTag('post', 'max');
      revalidatePath('/blog');
      if (slug) revalidatePath(`/blog/${slug}`);
    } else {
      /* Destinations, journeys and contact details all feed the 'site' tag. */
      revalidateTag('site', 'max');
      revalidatePath('/', 'layout');
      if (body._type === 'destination' && slug) revalidatePath(`/destinations/${slug}`);
      if (body._type === 'tour' && slug) revalidatePath(`/tours/${slug}`);
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error('[sanity] revalidate failed', error);
    return NextResponse.json({ message: 'Revalidation failed' }, { status: 500 });
  }
}
