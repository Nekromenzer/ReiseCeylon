import test from 'node:test';
import assert from 'node:assert/strict';
import { adFrameDocument, adUnitFor, adUnits, advertisementLabel, isAdvertisingPath } from './advertising.ts';

test('banners fit their container without scaling or requesting both formats', () => {
  assert.equal(adUnitFor('banner', 319), null);
  assert.equal(adUnitFor('banner', 320), adUnits.mobile);
  assert.equal(adUnitFor('banner', 467), adUnits.mobile);
  assert.equal(adUnitFor('banner', 468), adUnits.leaderboard);
  assert.equal(adUnitFor('sidebar', 159), null);
  assert.equal(adUnitFor('sidebar', 160), adUnits.sidebar);
  assert.equal(adUnitFor('rectangle', 299), null);
  assert.equal(adUnitFor('rectangle', 300), adUnits.rectangle);
});

test('ad documents configure their own unit before the provider script', () => {
  for (const unit of Object.values(adUnits)) {
    const html = adFrameDocument(unit);
    assert.ok(html.indexOf('window.atOptions=') < html.indexOf('src="https://bauval.org/22/'));
    assert.ok(html.includes(`"key":"${unit.key}"`));
    assert.ok(html.includes(`"width":${unit.width}`));
    assert.ok(html.includes(`"height":${unit.height}`));
    assert.ok(html.includes(`https://bauval.org/22/${unit.key}`));
    assert.equal((html.match(/src="https:/g) ?? []).length, 1);
  }
});

test('only blog and destination paths enable page-level advertising', () => {
  for (const prefix of ['', '/en', '/de', '/fr', '/nl']) {
    for (const route of ['/blog', '/blog/a-guide', '/destinations', '/destinations/ella']) {
      assert.ok(isAdvertisingPath(`${prefix}${route}`));
    }
    for (const route of ['/', '/journeys', '/contact', '/tours/one', '/studio', '/blogger', '/destinations-other']) {
      assert.equal(isAdvertisingPath(`${prefix}${route}`), false);
    }
  }
});

test('advertising labels follow the page language', () => {
  assert.deepEqual(['en', 'de', 'fr', 'nl'].map(advertisementLabel),
    ['Advertisement', 'Werbung', 'Publicité', 'Advertentie']);
  assert.equal(advertisementLabel('unknown'), 'Advertisement');
});
