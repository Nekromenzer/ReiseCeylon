'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isAdvertisingPath, pageAdScripts } from '@/lib/advertising';

/** These provider-controlled formats need the top-level document. Removing a
 * script tag cannot undo its listeners, timers or injected overlays, so leaving
 * the advertising routes deliberately starts a fresh document.
 */
export function PageAdvertising() {
  const pathname = usePathname();
  const activated = useRef(false);

  useEffect(() => {
    if (!isAdvertisingPath(pathname)) {
      if (activated.current) window.location.reload();
      return;
    }
    if (activated.current) return;
    activated.current = true;
    for (const src of pageAdScripts) {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.cfasync = 'false';
      script.dataset.reisePageAd = 'true';
      document.body.appendChild(script);
    }
  }, [pathname]);

  return null;
}
