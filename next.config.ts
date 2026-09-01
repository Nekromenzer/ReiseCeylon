import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** A year, in seconds — the ceiling both the CDN and the browser are given. */
const YEAR = 31536000;

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
    /*
     * Optimised derivatives are keyed by source url, width and quality, so a
     * given url always yields the same bytes and can be held for a year. Left
     * at the default the optimiser inherits the source file's cache-control —
     * `max-age=0, must-revalidate` for anything under `public/` — and every
     * photograph on the page is re-fetched on every visit.
     */
    minimumCacheTTL: YEAR,
    /*
     * Two changes to the default ladder. 3840 is gone: no source photograph is
     * wider than 2400px, so that candidate only ever resolves to the same bytes
     * as 2048 while inviting a 2x display to ask for it. 1366 is added because
     * the default has nothing between 1200 and 1920, and the commonest desktop
     * widths sit just above 1200 — a 1350px viewport asking for a full-bleed
     * image was being handed 1920 and throwing away nearly half of it.
     */
    deviceSizes: [640, 750, 828, 1080, 1200, 1366, 1920, 2048]
  },
  async headers() {
    return [
      {
        /* Brand marks and the drawn map are versioned by hand, not by content
           hash, so they get a long life with a revalidation window rather than
           `immutable`. Without this Vercel serves them `max-age=0`, which for
           the favicon means a refetch on every navigation. */
        source: '/:path(brand|images)/:file*',
        headers: [
          { key: 'Cache-Control', value: `public, max-age=${YEAR}, stale-while-revalidate=86400` }
        ]
      }
    ];
  }
};

export default withNextIntl(nextConfig);
