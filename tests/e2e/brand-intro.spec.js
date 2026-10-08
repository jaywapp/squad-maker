const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { stubExportCdn } = require('../helpers/stub-cdn');

const pageErrors = new WeakMap();
test.beforeEach(({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(({ page }) => expect(pageErrors.get(page)).toEqual([]));

async function prepare(page, { native = false, holdReady = false } = {}) {
  await stubExportCdn(page);
  await page.addInitScript(({ native, holdReady }) => {
    if (native) window.Capacitor = { isNativePlatform: () => true };
    const probe = window.brandProbe = { shownAt: null, leavingAt: null, removedAt: null, readyAt: null, animationName: null };
    new MutationObserver(() => {
      const intro = document.getElementById('brandIntro');
      if (intro && !intro.hidden && probe.shownAt === null) {
        probe.shownAt = performance.now();
        probe.animationName = getComputedStyle(intro.querySelector('.bi-mark')).animationName;
      }
      if (intro?.classList.contains('is-leaving') && probe.leavingAt === null) probe.leavingAt = performance.now();
      if (!intro && probe.shownAt !== null && probe.removedAt === null) probe.removedAt = performance.now();
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    if (holdReady) {
      const gate = new Promise(resolve => {
        window.releaseBrandReady = () => { probe.readyAt = performance.now(); resolve(); };
      });
      Object.defineProperty(window, 'SquadMakerContract', {
        configurable: true,
        set(value) {
          Object.defineProperty(window, 'SquadMakerContract', {
            configurable: true,
            value: Object.freeze({ ...value, ready: () => gate.then(() => value.ready()) }),
          });
        },
      });
    }
  }, { native, holdReady });
}

const probe = page => page.evaluate(() => window.brandProbe);

test('web skips the intro and keeps an accessible, aligned header at 360/390/1280px', async ({ page }, testInfo) => {
  await prepare(page);
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.SquadMakerContract.ready());
  await expect(page.locator('#brandIntro')).toHaveCount(0);
  expect((await probe(page)).shownAt).toBeNull();
  const header = page.locator('h1.wordmark');
  await expect(header).toBeVisible();
  await expect(header.locator('svg.wordmark-logo')).toHaveAttribute('aria-label', '스쿼드 메이커');
  await expect(header.locator('svg text')).toHaveCount(0);
  await expect(page.locator('.wm-sub')).toHaveCount(0);
  expect(await page.locator('link[rel="icon"]').getAttribute('href')).not.toContain('⚽');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(0);
  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.SquadMakerContract.ready());
    const geometry = await page.evaluate(() => {
      const heading = document.querySelector('h1.wordmark').getBoundingClientRect();
      const logo = document.querySelector('.wordmark-logo').getBoundingClientRect();
      const overlappingButtons = [...document.querySelectorAll('button')].filter(button => {
        const rect = button.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.left < heading.right && rect.right > heading.left
          && rect.top < heading.bottom && rect.bottom > heading.top;
      }).length;
      return { height: logo.height, right: logo.right, scrollWidth: document.documentElement.scrollWidth, overlappingButtons };
    });
    expect(geometry.height).toBe(width >= 1024 ? 32 : 28);
    expect(geometry.right).toBeLessThanOrEqual(width);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(width + 1);
    expect(geometry.overlappingButtons).toBe(0);
  }
  await page.setViewportSize(testInfo.project.use.viewport);
  await header.screenshot({ path: path.join('.work', 'branding', `header-${testInfo.project.name}.png`) });
});

test('native intro waits for its minimum motion duration and closes within three seconds', async ({ page }) => {
  await prepare(page, { native: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#brandIntro')).toBeVisible();
  await expect(page.locator('#brandIntro')).toHaveAttribute('aria-label', '스쿼드 메이커');
  await expect(page.locator('#brandIntro')).toHaveCount(0, { timeout: 3000 });
  const timing = await probe(page);
  expect(timing.leavingAt - timing.shownAt).toBeGreaterThanOrEqual(1350);
  expect(timing.removedAt - timing.shownAt).toBeLessThan(3000);
  await expect(page.locator('h1.wordmark')).toBeVisible();
});

test('finished motion still waits for delayed storage readiness', async ({ page }) => {
  await prepare(page, { native: true, holdReady: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => performance.now() - window.brandProbe.shownAt)).toBeGreaterThan(1550);
  await expect(page.locator('#brandIntro')).toBeVisible();
  expect((await probe(page)).leavingAt).toBeNull();
  await page.evaluate(() => window.releaseBrandReady());
  await expect(page.locator('#brandIntro')).toHaveCount(0, { timeout: 700 });
  const timing = await probe(page);
  expect(timing.leavingAt).toBeGreaterThanOrEqual(timing.readyAt);
});

test('tap finishes the logo motion but waits for readiness before closing', async ({ page }, testInfo) => {
  await prepare(page, { native: true, holdReady: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#brandIntro').click({ position: { x: 10, y: 10 } });
  expect(await page.locator('.bi-word').evaluate(node => getComputedStyle(node).opacity)).toBe('1');
  await page.screenshot({ path: path.join('.work', 'branding', `intro-finished-${testInfo.project.name}.png`) });
  await page.waitForTimeout(450);
  await expect(page.locator('#brandIntro')).toBeVisible();
  expect((await probe(page)).leavingAt).toBeNull();
  await page.evaluate(() => window.releaseBrandReady());
  await expect(page.locator('#brandIntro')).toHaveCount(0, { timeout: 700 });
  const timing = await probe(page);
  expect(timing.leavingAt).toBeGreaterThanOrEqual(timing.readyAt);
});

test('reduced motion shows a static logo and closes within one second', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await prepare(page, { native: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#brandIntro')).toHaveCount(0, { timeout: 1000 });
  const timing = await probe(page);
  expect(timing.shownAt).not.toBeNull();
  expect(timing.animationName).toBe('none');
  expect(timing.leavingAt - timing.shownAt).toBeGreaterThanOrEqual(350);
  expect(timing.removedAt - timing.shownAt).toBeLessThan(1000);
});

test('six-second safety deadline closes even when readiness never settles', async ({ page }) => {
  await prepare(page, { native: true, holdReady: true });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#brandIntro')).toBeVisible();
  await expect(page.locator('#brandIntro')).toHaveCount(0, { timeout: 7500 });
  const timing = await probe(page);
  expect(timing.readyAt).toBeNull();
  expect(timing.leavingAt - timing.shownAt).toBeGreaterThanOrEqual(5900);
  expect(timing.removedAt - timing.shownAt).toBeLessThan(7000);
  await expect(page.locator('h1.wordmark')).toBeVisible();
});

test('Android bundle injects the native adapter outside comments before the original app', async ({ page }) => {
  await prepare(page);
  await page.goto('/.work/android-web/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  const scripts = await page.evaluate(() => [...document.scripts].map(script => ({
    intro: script.hasAttribute('data-brand-intro'), src: script.getAttribute('src'), text: script.textContent,
  })));
  const introIndex = scripts.findIndex(script => script.intro);
  const nativeIndex = scripts.findIndex(script => script.src === 'app/platform-native.js');
  expect(introIndex).toBeGreaterThanOrEqual(0);
  expect(nativeIndex).toBeGreaterThan(introIndex);
  expect(scripts.filter(script => script.src === 'app/platform-native.js')).toHaveLength(1);
  expect(scripts[nativeIndex + 1].text).toBe('window.SQUAD_MAKER_ANALYTICS_ID = "";');
  expect(scripts[nativeIndex + 2].text).toContain('window.SquadMakerContract');
  expect(await page.evaluate(() => window.SquadMakerContract.getState().ready)).toBe(true);
  await expect(page.locator('h1.wordmark')).toBeVisible();
});
