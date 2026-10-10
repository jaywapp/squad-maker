const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const KEYS = ['squad-maker-v1', 'squad-maker-library-v1'];
const PUBLIC_ENDPOINT = 'https://squad-maker.vercel.app/api/feedback';
const APP_INFO = { name: 'Synthetic installed app', id: 'com.jaywapp.squadmaker.preview',
  version: '0.1.0.main.150.27a34ca9', build: '1152' };
const VERSION_LABEL = APP_INFO.version + ' (빌드 ' + APP_INFO.build + ')';
const ready = page => page.evaluate(() => window.SquadMakerContract.ready());
const savedValues = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), KEYS);
const board = page => page.evaluate(() => window.SquadMakerContract.getState().snapshot);

// These tests execute the current production HTML and real export vendors.
// The native facade is synthetic: installed Capacitor App.getInfo() has separate
// unit coverage. Neither this facade nor Chromium proves Android device behavior.
// Every feedback and CAPTCHA request is intercepted; no issue or real token is created.
const preparedPages = new WeakSet();
async function preparePage(page) {
  if (preparedPages.has(page)) return;
  await stubExportCdn(page);
  preparedPages.add(page);
}

async function boot(page, options = {}) {
  await preparePage(page);
  await page.route('**/index.html', async route => route.fulfill({ status: 200,
    contentType: 'text/html; charset=utf-8',
    body: await fs.readFile(path.join(__dirname, '..', '..', 'index.html'), 'utf8') }));
  await page.addInitScript(({ seed, native, holdStorage, holdInfo, info }) => {
    localStorage.setItem('squad-maker-v1', JSON.stringify(seed));
    window.SQUAD_MAKER_ANALYTICS_ID = '';
    if (!native) return;
    window.Capacitor = { isNativePlatform: () => true };
    const gate = holdStorage ? new Promise(resolve => { window.__brandReleaseStorage = resolve; }) : Promise.resolve();
    window.__brandAppInfoReads = 0;
    window.SquadPlatform = {
      native: true, publicShareBase: 'https://jaywapp.github.io/squad-maker/',
      storage: {
        async getItem(key) { await gate; return localStorage.getItem(key); },
        async setItem(key, value) { await gate; localStorage.setItem(key, value); },
        async removeItem(key) { await gate; localStorage.removeItem(key); },
        async commitBatch(values, expected) {
          await gate;
          for (const [key, value] of Object.entries(expected)) {
            if (localStorage.getItem(key) !== value) throw Object.assign(new Error('Conflict'), { code: 'storage-conflict' });
          }
          for (const [key, value] of Object.entries(values)) {
            if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
          }
        },
      },
      async getAppInfo() {
        window.__brandAppInfoReads++;
        if (holdInfo) return new Promise(resolve => { window.__brandReleaseInfo = () => resolve(info); });
        return info;
      },
      async showTestAd() { return { status: 'unsupported' }; },
      async getAdState() { return { status: 'unsupported' }; },
    };
  }, { seed: fixture, native: Boolean(options.native), holdStorage: Boolean(options.holdStorage),
    holdInfo: Boolean(options.holdInfo), info: APP_INFO });
  await page.clock.install({ time: new Date('2026-10-10T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-10T00:00:01Z'));
  await page.goto('/index.html');
  if (options.waitReady !== false) {
    await ready(page);
    if (options.native && !options.keepIntro) {
      await page.clock.runFor(1800);
      await expect(page.locator('#brandIntro')).toHaveCount(0);
    }
  }
}

function captchaFixture() {
  window.__brandCaptcha = { renders: 0, resets: 0, removals: 0, callback: null };
  window.turnstile = {
    render(container, options) {
      window.__brandCaptcha.renders++;
      window.__brandCaptcha.callback = options.callback;
      options.callback('synthetic-initial-token');
      return 1;
    },
    reset() { window.__brandCaptcha.resets++; },
    remove() { window.__brandCaptcha.removals++; },
  };
  window.__brandSolveCaptcha = () => window.__brandCaptcha.callback('synthetic-renewed-token');
}

async function interceptFeedback(page, options = {}) {
  await preparePage(page);
  const calls = [];
  await page.route('**/api/feedback', async route => {
    const request = route.request();
    const method = request.method();
    const origin = request.headers().origin || new URL(request.url()).origin;
    const headers = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const call = { url: request.url(), method, body: method === 'POST' ? request.postDataJSON() : null };
    calls.push(call);
    const result = method === 'POST' && options.onPost ? await options.onPost(call)
      : method === 'GET' && options.onGet ? await options.onGet(call)
        : method === 'GET' ? { status: 200, body: { turnstileSiteKey: 'synthetic-public-key' } }
          : { status: 201, body: { issueNumber: 42 } };
    await route.fulfill({ status: result.status, headers,
      contentType: result.html ? 'text/html' : 'application/json',
      body: result.html || JSON.stringify(result.body) });
  });
  if (!options.scriptOnly) await page.addInitScript(captchaFixture);
  return calls;
}

async function openFeedback(page, expectReady = true) {
  await page.locator('.topbar').getByRole('button', { name: '제보', exact: true }).click();
  await expect(page.locator('#feedbackModal')).toBeVisible();
  if (expectReady) await expect(page.locator('#feedbackSubmit')).toBeEnabled();
}

async function fillFeedback(page, title = 'Synthetic report title', description = 'Synthetic report description') {
  await page.locator('#feedbackSubject').fill(title);
  await page.locator('#feedbackDescription').fill(description);
  await page.locator('#feedbackContact').fill('synthetic-contact@example.test');
}

async function submitFeedback(page) {
  // The real API requires at least 1.5 seconds of composing time.
  await page.clock.runFor(1600);
  await page.locator('#feedbackSubmit').click();
}

test('web shows one approved accessible SVG wordmark, no snippet instructions and the development version', async ({ page }) => {
  await boot(page);
  await expect(page.locator('h1.wordmark')).toHaveCount(1);
  const logo = page.locator('h1.wordmark > svg.wordmark-logo');
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('role', 'img');
  await expect(logo).toHaveAttribute('aria-label', '스쿼드 메이커');
  await expect(logo).toHaveAttribute('viewBox', '0 0 384 100');
  await expect(logo.locator('path[d="M48 62C78 58 38 36 76 25"]')).toHaveCount(1);
  const text = await page.locator('body').innerText();
  for (const instruction of ['을 아래로 교체', '회귀 테스트', '표시 높이:', 'h1.wordmark 요소']) expect(text).not.toContain(instruction);
  await expect(page.locator('#appVersion')).toHaveText('웹 개발본');
  await expect(page.locator('#brandIntro')).toHaveCount(0);
  await page.locator('.topbar').getByRole('button', { name: '도움말', exact: true }).click();
  await expect(page.locator('#helpAppVersion')).toHaveText('웹 개발본');
});

test('native APK metadata updates version, build and identity without changing the board or either save key', async ({ page }) => {
  await boot(page, { native: true, holdInfo: true });
  const before = await board(page), saved = await savedValues(page);
  await expect(page.locator('#appVersion')).toContainText('버전 확인 중');
  await page.evaluate(() => window.__brandReleaseInfo());
  await expect(page.locator('#appVersion')).toHaveText(VERSION_LABEL);
  await expect(page.locator('#appVersion')).toHaveAttribute('title', VERSION_LABEL);
  await page.locator('.topbar').getByRole('button', { name: '도움말', exact: true }).click();
  await expect(page.locator('#helpAppVersion')).toContainText(APP_INFO.version);
  await expect(page.locator('#helpAppVersion')).toContainText('빌드 ' + APP_INFO.build);
  await expect(page.locator('#helpAppVersion')).toContainText(APP_INFO.id);
  expect(await page.evaluate(() => window.__brandAppInfoReads)).toBe(1);
  expect(await board(page)).toEqual(before);
  expect(await savedValues(page)).toEqual(saved);
});

test('a native intro tap finishes motion but cannot dismiss the overlay before storage is ready', async ({ page }) => {
  await boot(page, { native: true, holdStorage: true, waitReady: false });
  const intro = page.locator('#brandIntro');
  await expect(intro).toBeVisible();
  await intro.dispatchEvent('pointerdown');
  await page.clock.runFor(1800);
  expect(await page.evaluate(() => window.SquadMakerContract.getState().ready)).toBe(false);
  await expect(intro).toBeVisible();
  expect(await intro.evaluate(element => element.classList.contains('is-leaving'))).toBe(false);
  await page.evaluate(() => window.__brandReleaseStorage());
  await ready(page);
  await page.clock.runFor(300);
  await expect(intro).toHaveCount(0);
  expect((await board(page)).team).toBe(fixture.team);
});

test('reduced-motion native intro is static, closes after readiness and remains absent in the same document', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, { native: true, keepIntro: true });
  const intro = page.locator('#brandIntro');
  await expect(intro).toBeVisible();
  expect(await intro.locator('.bi-mark').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await page.clock.runFor(399);
  await expect(intro).toBeVisible();
  await page.clock.runFor(5);
  await expect(intro).toHaveCount(0);
  const saved = await savedValues(page);
  await page.evaluate(() => {
    window.dispatchEvent(new Event('pageshow'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(2000);
  await expect(intro).toHaveCount(0);
  expect(await savedValues(page)).toEqual(saved);
});

test('the six-second intro bound gives way to the boot lock without allowing premature edits', async ({ page }) => {
  await boot(page, { native: true, holdStorage: true, waitReady: false });
  await page.clock.runFor(5999);
  await expect(page.locator('#brandIntro')).toBeVisible();
  expect(await page.locator('main').evaluate(element => element.inert)).toBe(true);
  await page.clock.runFor(301);
  await expect(page.locator('#brandIntro')).toHaveCount(0);
  expect(await page.evaluate(() => window.SquadMakerContract.getState().ready)).toBe(false);
  expect(await page.locator('main').evaluate(element => element.inert)).toBe(true);
  await page.evaluate(() => window.__brandReleaseStorage());
  await ready(page);
  expect(await page.locator('main').evaluate(element => element.inert)).toBe(false);
  expect((await board(page)).team).toBe(fixture.team);
});

test('native feedback uses the public HTTPS endpoint and installed APK version with an acknowledged Android issue', async ({ page }) => {
  const calls = await interceptFeedback(page);
  await boot(page, { native: true });
  const before = await board(page), saved = await savedValues(page);
  await openFeedback(page);
  await expect(page.locator('#feedbackMeta')).toContainText(VERSION_LABEL);
  await expect(page.locator('#feedbackMeta')).toContainText('android');
  await fillFeedback(page);
  await submitFeedback(page);
  await expect(page.locator('#feedbackStatus')).toContainText('Issue #42');
  expect(calls.filter(call => call.method === 'GET').map(call => call.url)).toEqual([PUBLIC_ENDPOINT]);
  const posts = calls.filter(call => call.method === 'POST');
  expect(posts).toHaveLength(1);
  expect(posts[0].url).toBe(PUBLIC_ENDPOINT);
  expect(posts[0].body).toMatchObject({ repository: 'jaywapp/squad-maker', platform: 'android',
    appVersion: VERSION_LABEL, title: 'Synthetic report title', description: 'Synthetic report description' });
  await expect(page.locator('#feedbackSubject')).toHaveValue('');
  await expect(page.locator('#feedbackDescription')).toHaveValue('');
  expect(await page.evaluate(() => window.__brandCaptcha.resets)).toBe(1);
  await expect(page.locator('#feedbackSubmit')).toBeDisabled();
  expect(await board(page)).toEqual(before);
  expect(await savedValues(page)).toEqual(saved);
});

test('a static GET 404 keeps all draft inputs and can recover through the retry control', async ({ page }) => {
  let unavailable = true;
  const calls = await interceptFeedback(page, { onGet: () => unavailable
    ? { status: 404, html: '<html><body>Static deployment 404</body></html>' }
    : { status: 200, body: { turnstileSiteKey: 'synthetic-public-key' } } });
  await boot(page);
  await openFeedback(page, false);
  await fillFeedback(page);
  await expect(page.locator('#feedbackStatus')).toContainText('제보 서버가 아직 연결되지 않았습니다');
  await expect(page.locator('#feedbackSubmit')).toBeDisabled();
  await expect(page.locator('#feedbackRetryBtn')).toBeVisible();
  unavailable = false;
  await page.locator('#feedbackRetryBtn').click();
  await expect(page.locator('#feedbackSubmit')).toBeEnabled();
  await expect(page.locator('#feedbackSubject')).toHaveValue('Synthetic report title');
  await expect(page.locator('#feedbackDescription')).toHaveValue('Synthetic report description');
  await expect(page.locator('#feedbackContact')).toHaveValue('synthetic-contact@example.test');
  expect(calls.filter(call => call.method === 'GET')).toHaveLength(2);
  expect(calls.filter(call => call.method === 'POST')).toHaveLength(0);
});

test('a failed POST retains inputs and resets CAPTCHA once before a new token permits retry', async ({ page }) => {
  let failed = true;
  const calls = await interceptFeedback(page, { onPost: () => failed
    ? { status: 502, body: { error: '제보를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.' } }
    : { status: 201, body: { issueNumber: 43 } } });
  await boot(page);
  await openFeedback(page);
  await fillFeedback(page);
  await submitFeedback(page);
  await expect(page.locator('#feedbackStatus')).toContainText('등록하지 못했습니다');
  await expect(page.locator('#feedbackSubject')).toHaveValue('Synthetic report title');
  await expect(page.locator('#feedbackDescription')).toHaveValue('Synthetic report description');
  await expect(page.locator('#feedbackContact')).toHaveValue('synthetic-contact@example.test');
  await expect(page.locator('#feedbackSubmit')).toBeDisabled();
  expect(await page.evaluate(() => window.__brandCaptcha.resets)).toBe(1);
  failed = false;
  await page.evaluate(() => window.__brandSolveCaptcha());
  await expect(page.locator('#feedbackSubmit')).toBeEnabled();
  await submitFeedback(page);
  await expect(page.locator('#feedbackStatus')).toContainText('Issue #43');
  const posts = calls.filter(call => call.method === 'POST');
  expect(posts).toHaveLength(2);
  expect(posts[0].body.turnstileToken).toBe('synthetic-initial-token');
  expect(posts[1].body.turnstileToken).toBe('synthetic-renewed-token');
  expect(await page.evaluate(() => window.__brandCaptcha.resets)).toBe(2);
});

test('a successful earlier POST preserves a new draft typed while that request is pending', async ({ page }) => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const calls = await interceptFeedback(page, { onPost: () => pending });
  await boot(page);
  await openFeedback(page);
  await fillFeedback(page);
  await submitFeedback(page);
  await expect.poll(() => calls.filter(call => call.method === 'POST').length).toBe(1);
  await expect(page.locator('#feedbackStatus')).toContainText('보내는 중');
  await page.locator('#feedbackDescription').fill('New unsent draft');
  await page.locator('#feedbackContact').fill('new-draft@example.test');
  await page.locator('#feedbackDiagnostics').check();
  finish({ status: 201, body: { issueNumber: 44 } });
  await expect(page.locator('#feedbackStatus')).toContainText('새로 수정한 입력 내용은 유지했습니다');
  await expect(page.locator('#feedbackDescription')).toHaveValue('New unsent draft');
  await expect(page.locator('#feedbackContact')).toHaveValue('new-draft@example.test');
  await expect(page.locator('#feedbackDiagnostics')).toBeChecked();
  expect(calls[0].method).toBe('GET');
  expect(calls.find(call => call.method === 'POST').body.description).toBe('Synthetic report description');
  expect(await page.evaluate(() => window.__brandCaptcha.resets)).toBe(1);
});

test('a stalled CAPTCHA script fails after ten seconds, preserves the draft and allows a fresh preparation', async ({ page }) => {
  await interceptFeedback(page, { scriptOnly: true });
  let scriptCalls = 0, releaseStall;
  const stalled = new Promise(resolve => { releaseStall = resolve; });
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async route => {
    scriptCalls++;
    if (scriptCalls === 1) {
      await stalled;
      await route.abort('timedout').catch(() => {});
    } else await route.fulfill({ status: 200, contentType: 'application/javascript',
      body: '(' + captchaFixture.toString() + ')();' });
  });
  try {
    await boot(page);
    await openFeedback(page, false);
    await fillFeedback(page);
    await expect.poll(() => scriptCalls).toBe(1);
    await expect(page.locator('#feedbackSubmit')).toBeDisabled();
    await page.clock.runFor(9999);
    await expect(page.locator('#feedbackRetryBtn')).toBeHidden();
    await page.clock.runFor(2);
    await expect(page.locator('#feedbackStatus')).toContainText('스팸 방지 확인 연결이 지연되었습니다');
    await expect(page.locator('#feedbackRetryBtn')).toBeVisible();
    await expect(page.locator('script[data-feedback-turnstile]')).toHaveCount(0);
    await expect(page.locator('#feedbackSubject')).toHaveValue('Synthetic report title');
    await expect(page.locator('#feedbackDescription')).toHaveValue('Synthetic report description');
    releaseStall();
    await page.locator('#feedbackRetryBtn').click();
    await expect(page.locator('#feedbackSubmit')).toBeEnabled();
    expect(scriptCalls).toBe(2);
    await expect(page.locator('#feedbackDescription')).toHaveValue('Synthetic report description');
  } finally { releaseStall(); }
});
