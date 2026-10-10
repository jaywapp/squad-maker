const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const KEYS = ['squad-maker-v1', 'squad-maker-library-v1'];
const VERIFIED_SHARE_BASE = 'https://jaywapp.github.io/squad-maker/';
const state = page => page.evaluate(() => window.SquadMakerContract.getState());
const stored = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), KEYS);
const runShare = page => page.evaluate(() => window.SquadMakerContract.run('share-url'));

// The native facade receives the current production sharing constant. The real
// facade value has separate unit coverage; these browser mocks cannot prove that
// an installed Android app or an external hosting service successfully delivers.
// Clipboard and external requests are intercepted; no external share is sent.
async function boot(page, native) {
  await stubExportCdn(page);
  await page.route('**/index.html', async route => route.fulfill({ status: 200,
    contentType: 'text/html; charset=utf-8',
    body: await fs.readFile(path.join(__dirname, '..', '..', 'index.html'), 'utf8') }));
  const source = await fs.readFile(path.join(__dirname, '..', '..', 'app/platform-native.js'), 'utf8');
  const matches = [...source.matchAll(/publicShareBase:\s*(['"])([^'"]+)\1/g)];
  if (matches.length !== 1) throw new Error('Expected one production native sharing base for the synthetic facade');
  await page.addInitScript(({ seed, native, shareBase }) => {
    localStorage.setItem('squad-maker-v1', JSON.stringify(seed));
    window.SQUAD_MAKER_ANALYTICS_ID = '';
    window.__shareClipboardWrites = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async value => { window.__shareClipboardWrites.push(String(value)); },
    } });
    if (!native) return;
    window.Capacitor = { isNativePlatform: () => true };
    window.SquadPlatform = {
      native: true, publicShareBase: shareBase,
      storage: {
        async getItem(key) { return localStorage.getItem(key); },
        async setItem(key, value) { localStorage.setItem(key, value); },
        async removeItem(key) { localStorage.removeItem(key); },
        async commitBatch(values, expected) {
          for (const [key, value] of Object.entries(expected)) {
            if (localStorage.getItem(key) !== value) throw Object.assign(new Error('Conflict'), { code: 'storage-conflict' });
          }
          for (const [key, value] of Object.entries(values)) {
            if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
          }
        },
      },
      async getAppInfo() { return { name: 'Synthetic installed app', id: 'com.jaywapp.squadmaker.preview',
        version: '0.1.0.main.150.27a34ca9', build: '1152' }; },
      async showTestAd() { return { status: 'unsupported' }; },
      async getAdState() { return { status: 'unsupported' }; },
    };
  }, { seed: fixture, native, shareBase: matches[0][2] });
  await page.clock.install({ time: new Date('2026-10-10T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-10T00:00:01Z'));
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  if (native) {
    await page.clock.runFor(1800);
    await expect(page.locator('#brandIntro')).toHaveCount(0);
  }
  await page.evaluate(() => {
    window.__shareToasts = [];
    window.__shareCreatedEvents = [];
    const originalToast = window.showToast;
    const originalTrack = window.track;
    window.showToast = (...args) => { window.__shareToasts.push(String(args[0])); return originalToast(...args); };
    window.track = (...args) => {
      if (args[0] === 'share_link_created') window.__shareCreatedEvents.push(args);
      return originalTrack(...args);
    };
  });
}

async function failEncoding(page) {
  await page.evaluate(() => {
    window.btoa = () => { throw new DOMException('Synthetic encoder failure', 'InvalidCharacterError'); };
    window.__shareToasts.length = 0;
    window.__shareCreatedEvents.length = 0;
    window.__shareClipboardWrites.length = 0;
  });
}

async function expectPreserved(page, before, saved) {
  expect(await state(page)).toEqual(before);
  expect(await stored(page)).toEqual(saved);
}

async function expectNoFalseSuccess(page) {
  const outcomes = await page.evaluate(() => ({ clipboard: window.__shareClipboardWrites,
    toasts: window.__shareToasts, created: window.__shareCreatedEvents }));
  expect(outcomes.clipboard).toEqual([]);
  expect(outcomes.created).toEqual([]);
  for (const text of outcomes.toasts) {
    expect(text).not.toMatch(/복사했습니다|링크를 만들었습니다|링크가 생성되었습니다/);
  }
}

for (const native of [false, true]) {
  const mode = native ? 'native' : 'web';

  test(mode + ' creates a canonical share URL without claiming clipboard or external delivery', async ({ page }) => {
    await boot(page, native);
    const before = await state(page), saved = await stored(page);
    const result = await runShare(page);
    expect(result.status).toBe('success');
    expect(result.completion).toBe('url-created');
    const expectedBase = native ? VERIFIED_SHARE_BASE : new URL(page.url()).origin + new URL(page.url()).pathname;
    expect(result.url.startsWith(expectedBase + '#s=')).toBe(true);
    const encoded = result.url.split('#s=')[1];
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))).toEqual(before.snapshot);
    expect(await page.evaluate(() => generateShareURL())).toBe(result.url);
    if (native) expect(result.url).not.toContain('localhost');
    expect(await page.evaluate(() => window.__shareClipboardWrites)).toEqual([]);
    expect(await page.evaluate(() => window.__shareToasts)).toEqual([]);
    await expectPreserved(page, before, saved);
  });

  test(mode + ' encoding failure returns export-failed and no fallback URL while preserving canonical data', async ({ page }) => {
    await boot(page, native);
    const before = await state(page), saved = await stored(page);
    await failEncoding(page);
    expect(await page.evaluate(() => encodeState())).toBe('');
    expect(await page.evaluate(() => generateShareURL())).toBe('');
    const result = await runShare(page);
    expect(result.status).toBe('error');
    expect(result.code).toBe('export-failed');
    expect(result.completion).toBeNull();
    expect(result.url).toBeUndefined();
    await expectNoFalseSuccess(page);
    await expectPreserved(page, before, saved);
  });

  test(mode + ' cannot open a sharing modal or claim success after URL encoding fails', async ({ page }) => {
    await boot(page, native);
    const before = await state(page), saved = await stored(page);
    await failEncoding(page);
    await page.evaluate(() => openShare());
    await expect(page.locator('#shareModal')).toBeHidden();
    expect(await page.locator('#shareModal').evaluate(element => element.classList.contains('visible'))).toBe(false);
    await expect(page.locator('.toast')).toContainText(/(?:링크|공유).*(?:못|실패)/);
    await expectNoFalseSuccess(page);
    await expectPreserved(page, before, saved);
  });

  test(mode + ' copy from an already opened share modal cannot copy a fallback URL or show a success toast', async ({ page }) => {
    await boot(page, native);
    await page.evaluate(() => openShare());
    await page.clock.runFor(300);
    await expect(page.locator('#shareModal')).toBeVisible();
    const initialUrl = await page.locator('#shareUrlBox').innerText();
    const expectedBase = native ? VERIFIED_SHARE_BASE : new URL(page.url()).origin + new URL(page.url()).pathname;
    expect(initialUrl.startsWith(expectedBase + '#s=')).toBe(true);
    const before = await state(page), saved = await stored(page);
    await failEncoding(page);
    await page.locator('#shareModal').getByRole('button', { name: '링크 복사', exact: true }).click();
    await expect(page.locator('.toast')).toContainText(/(?:링크|공유).*(?:못|실패)/);
    await expectNoFalseSuccess(page);
    await expectPreserved(page, before, saved);
  });
}
