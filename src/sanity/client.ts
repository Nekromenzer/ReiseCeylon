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
      // Served from Sanity's CDN; published documents only, which is what the site wants.
      useCdn: true,
      perspective: 'published'
    });
  }
  return client;
}
