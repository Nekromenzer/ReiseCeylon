export const adUnits = {
  leaderboard: { key: 'be32b82e754cd6078e24606cb4c59771', width: 468, height: 60 },
  mobile: { key: 'dd38f8aa29f6882df24ca0d66e698325', width: 320, height: 50 },
  sidebar: { key: '4cfbc7e83fc95a969d71ae21a6945b4a', width: 160, height: 300 },
  rectangle: { key: '980ea18ecab9a680d3bec4e7e2984146', width: 300, height: 250 }
} as const;

export type AdFormat = 'banner' | 'sidebar' | 'rectangle';

export function adUnitFor(format: AdFormat, availableWidth: number) {
  if (format === 'banner') {
    if (availableWidth >= adUnits.leaderboard.width) return adUnits.leaderboard;
    if (availableWidth >= adUnits.mobile.width) return adUnits.mobile;
    return null;
  }
  const unit = adUnits[format];
  return availableWidth >= unit.width ? unit : null;
}

const labels: Record<string, string> = {
  en: 'Advertisement', de: 'Werbung', fr: 'Publicité', nl: 'Advertentie'
};

export function advertisementLabel(locale: string) {
  return labels[locale] ?? labels.en;
}

/** A separate opaque origin prevents shared atOptions and parent DOM access.
 * Keep the provider's parser-inserted script order: it may use document.write.
 */
export function adFrameDocument(unit: (typeof adUnits)[keyof typeof adUnits]) {
  const options = JSON.stringify({ ...unit, format: 'iframe', params: {} });
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}iframe{border:0}</style></head><body><script>window.atOptions=${options};</script><script data-cfasync="false" src="https://bauval.org/22/${unit.key}"></script></body></html>`;
}

export const pageAdScripts = [
  'https://abscloud.org/1/dfca00ecc21aabd5a99e01dcd5839759',
  'https://bauval.org/14/314ab331fb2ea7ae56e6bb89acc08dd9'
] as const;

export function isAdvertisingPath(pathname: string) {
  return /^\/(?:en\/|de\/|fr\/|nl\/)?(?:blog|destinations)(?:\/|$)/.test(pathname);
}
