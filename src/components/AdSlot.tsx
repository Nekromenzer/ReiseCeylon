'use client';

import { useEffect, useRef, useState } from 'react';
import { adFrameDocument, adUnitFor, advertisementLabel, type AdFormat } from '@/lib/advertising';

/** Load only a visible, fitting unit. Removing its iframe on navigation also
 * removes the provider's document, listeners and timers. No global scripts.
 */
export function AdSlot({ format = 'banner', locale }: { format?: AdFormat; locale: string }) {
  const container = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const label = advertisementLabel(locale);
  const unit = adUnitFor(format, width);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    const intersection = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    resize.observe(element);
    intersection.observe(element);
    return () => {
      resize.disconnect();
      intersection.disconnect();
    };
  }, []);

  // Once loaded, retain the document while scrolling; never refresh impressions
  // on visibility changes. A format change replaces the document at its new size.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  useEffect(() => {
    if (visible && unit) setLoadedKey(unit.key);
  }, [visible, unit]);

  return (
    <aside ref={container} className={`ad-slot ad-slot--${format}`} aria-label={label}>
      <span className="ad-slot-label">{label}</span>
      <div className="ad-slot-space">
        {unit && loadedKey === unit.key ? (
          <iframe
            key={unit.key}
            title={`${label} (${unit.width} × ${unit.height})`}
            width={unit.width}
            height={unit.height}
            srcDoc={adFrameDocument(unit)}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : null}
      </div>
    </aside>
  );
}
