/**
 * Sanity connection settings.
 *
 * Values come from the environment so the same code runs against a local
 * dataset, a staging dataset and production. Copy `.env.local.example` to
 * `.env.local` and fill in the project id from sanity.io/manage.
 */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';

/** Pin the API date so Sanity never changes behaviour underneath the site. */
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-10-01';

/**
 * The journal falls back to curated placeholder cards until a project id is
 * present, so the site never breaks while Sanity is still being set up.
 */
export const isSanityConfigured = projectId.length > 0;

export function assertSanityConfigured() {
  if (!isSanityConfigured) {
    throw new Error(
      'Missing NEXT_PUBLIC_SANITY_PROJECT_ID. Add it to .env.local — see .env.local.example.'
    );
  }
}
