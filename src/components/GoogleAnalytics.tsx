'use client';

import Script from 'next/script';

/**
 * Google Analytics, held back until the page has settled.
 *
 * `@next/third-parties` hard-codes `afterInteractive` for both halves of the
 * tag, which puts a preload for gtag.js — 189 KB, fetched at high priority —
 * on the wire beside the hero photograph and ahead of the largest contentful
 * paint. Only the tiny inline half needs to run early: it defines `dataLayer`
 * and queues the two opening calls. The library itself arrives on `lazyOnload`
 * and drains that queue when it lands, so nothing is lost but the contention.
 */
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
      <Script
        id="ga-lib"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
    </>
  );
}
