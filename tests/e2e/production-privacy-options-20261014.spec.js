const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

// Synthetic consent/ads bridge only. No Google SDK, live ads, consent reset or external submission.
async function boot(page, options = {}) {
  await stubExportCdn(page);
  await page.route('**/index.html', async route => route.fulfill({ status: 200,
    contentType: 'text/html; charset=utf-8',
    body: await fs.readFile(path.join(__dirname, '..', '..', 'index.html'), 'utf8') }));
  await page.addInitScript(({ seed, native, required, formShowing, result, testOnly }) => {
    localStorage.setItem('squad-maker-v1', JSON.stringify(seed));
    window.SQUAD_MAKER_ANALYTICS_ID = '';
    window.__privacy = { calls: 0, banners: 0, result, state: {
      status: 'consent-denied', canRequestAds: false, consentStatus: 'required',
      privacyOptionsRequired: required, consentFormShowing: formShowing,
      adsMode: testOnly ? 'test' : 'production', testOnly,
    } };
    const io = window.__privacy;
    window.SquadPlatform = {
      native,
      publicShareBase: 'https://jaywapp.github.io/squad-maker/',
      async getAppInfo() { return { name: testOnly ? '아이엠 헤드코치 Preview' : '아이엠 헤드코치',
        id: 'com.example.synthetic', version: '1.0.0', build: '1' }; },
      async showBannerAd() { io.banners++; return { status: 'consent-denied', testOnly }; },
      async prepareExportAd() { return { status: 'skipped', reason: 'consent-unavailable', testOnly }; },
      async showExportAd() { return { status: 'skipped', reason: 'consent-unavailable', testOnly }; },
      async getAdState() { return { ...io.state }; },
      onAdState(listener) { io.listener = listener; listener(io.state); return () => { io.listener = null; }; },
      async showAdPrivacyOptions() {
        io.calls++;
        return new Promise((resolve, reject) => { io.finish = () => {
          if (io.result === 'reject') reject(new Error('private SDK diagnostic'));
          else resolve({ status: io.result });
        }; });
      },
    };
    window.__setPrivacyState = delta => { Object.assign(io.state, delta); io.listener?.(io.state); };
  }, { seed: fixture, native: options.native !== false, required: options.required !== false,
    formShowing: options.formShowing === true, result: options.result || 'shown', testOnly: options.testOnly !== false });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  await page.evaluate(() => openHelp());
  await expect(page.locator('#helpModal')).toBeVisible();
}

test('web and consent-not-required states have no interactable privacy entry', async ({ page }) => {
  await boot(page, { native: false });
  await expect(page.locator('#adPrivacySection')).toBeHidden();
  expect(await page.evaluate(() => window.__privacy.calls)).toBe(0);
  await boot(page, { required: false });
  await expect(page.locator('#adPrivacySection')).toBeHidden();
});

for (const testOnly of [true, false]) {
  test(`required privacy entry suppresses repeated requests and preserves data (${testOnly ? 'test' : 'production facade'})`, async ({ page }) => {
    await boot(page, { testOnly });
    const before = await page.evaluate(() => window.SquadMakerContract.getState().snapshot);
    await expect(page.locator('#adPrivacySection')).toBeVisible();
    await page.locator('#adPrivacyOptionsBtn').click();
    await expect(page.locator('#adPrivacyOptionsBtn')).toBeDisabled();
    await page.locator('#adPrivacyOptionsBtn').dispatchEvent('click');
    expect(await page.evaluate(() => window.__privacy.calls)).toBe(1);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => window.__privacy.finish());
    await expect(page.locator('#adPrivacyOptionsBtn')).toBeEnabled();
    await expect(page.locator('#adPrivacyStatus')).toHaveText('광고 개인정보 선택을 확인했습니다.');
    expect(await page.evaluate(() => window.SquadMakerContract.getState().snapshot)).toEqual(before);
    expect(await page.evaluate(() => window.__privacy.banners)).toBe(1);
    await page.reload();
    await page.evaluate(() => window.SquadMakerContract.ready());
    expect(await page.evaluate(() => window.SquadMakerContract.getState().snapshot)).toEqual(before);
  });
}

for (const result of ['failed', 'reject']) {
  test(`privacy ${result} is recoverable and hides private diagnostics`, async ({ page }) => {
    await boot(page, { result });
    const before = await page.evaluate(() => window.SquadMakerContract.getState().snapshot);
    await page.locator('#adPrivacyOptionsBtn').click();
    await page.evaluate(() => window.__privacy.finish());
    await expect(page.locator('#adPrivacyOptionsBtn')).toBeEnabled();
    await expect(page.locator('#adPrivacyStatus')).toHaveText('광고 개인정보 옵션을 열지 못했습니다. 잠시 후 다시 시도해 주세요.');
    expect(await page.locator('#adPrivacyStatus').textContent()).not.toContain('private');
    expect(await page.evaluate(() => window.SquadMakerContract.getState().snapshot)).toEqual(before);
    await page.locator('#adPrivacyOptionsBtn').click();
    expect(await page.evaluate(() => window.__privacy.calls)).toBe(2);
    await page.evaluate(() => window.__privacy.finish());
  });
}

test('an existing native consent form blocks another form, and an unnecessary entry restores focus', async ({ page }) => {
  await boot(page, { formShowing: true });
  await expect(page.locator('#adPrivacyOptionsBtn')).toBeDisabled();
  await page.locator('#adPrivacyOptionsBtn').dispatchEvent('click');
  expect(await page.evaluate(() => window.__privacy.calls)).toBe(0);
  await page.evaluate(() => window.__setPrivacyState({ consentFormShowing: false }));
  await expect(page.locator('#adPrivacyOptionsBtn')).toBeEnabled();
  await page.locator('#adPrivacyOptionsBtn').focus();
  await page.evaluate(() => window.__setPrivacyState({ privacyOptionsRequired: false }));
  await expect(page.locator('#adPrivacySection')).toBeHidden();
  await expect(page.locator('#helpTitle')).toBeFocused();
  expect(await page.evaluate(() => window.__privacy.calls)).toBe(0);
});
