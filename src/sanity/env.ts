/**
 * Sanity connection settings.
 *
 * Values come from the environment so the same code runs against a local
 * dataset, a staging dataset and production. Copy `.env.local.example` to
 * `.env.local` and fill in the project id from sanity.io/manage.
 */
/**
 * Two bundlers read this file. Next inlines `NEXT_PUBLIC_*`; the Sanity CLI
 * (`sanity build` / `sanity deploy`, used for the hosted studio) inlines only
 * `SANITY_STUDIO_*`. Both names are read so the same config works either way —
 * keep the pairs in .env in sync. None of these values are secret.
 */
function read(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === 'string' && value.length > 0);
}

export const projectId =
  read(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, process.env.SANITY_STUDIO_PROJECT_ID) ?? '';

export const dataset =
  read(process.env.NEXT_PUBLIC_SANITY_DATASET, process.env.SANITY_STUDIO_DATASET) ?? 'production';

/** Pin the API date so Sanity never changes behaviour underneath the site. */
export const apiVersion =
  read(process.env.NEXT_PUBLIC_SANITY_API_VERSION, process.env.SANITY_STUDIO_API_VERSION) ??
  '2024-10-01';

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
