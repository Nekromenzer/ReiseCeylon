import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

/**
 * Sanity webhook target. Publishing or unpublishing an entry in the studio
 * drops the cached journal queries so the change is live within seconds.
 *
 * Set up in sanity.io/manage → API → Webhooks:
 *   URL     https://reiseceylon.com/api/revalidate
 *   Trigger create, update, delete on _type == "post"
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

    revalidateTag('post', 'max');
    revalidatePath('/blog');
    if (body.slug?.current) revalidatePath(`/blog/${body.slug.current}`);

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error('[sanity] revalidate failed', error);
    return NextResponse.json({ message: 'Revalidation failed' }, { status: 500 });
  }
}
