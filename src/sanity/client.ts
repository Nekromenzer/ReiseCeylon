import { createClient, type SanityClient } from 'next-sanity';
import { apiVersion, assertSanityConfigured, dataset, projectId } from './env';

let client: SanityClient | null = null;

/**
 * Created on first use rather than at module scope, so building the site
 * before the Sanity credentials exist doesn't fail.
 */
export function getClient() {
  if (!client) {
    assertSanityConfigured();
    client = createClient({
      projectId,
      dataset,
      apiVersion,
      // Next.js owns the server-side cache and invalidates it from the signed
      // webhook. Read the origin API when that cache refreshes so a second CDN
      // layer cannot return an older post after publication.
      useCdn: false,
      perspective: 'published'
    });
  }
  return client;
}
