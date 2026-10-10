const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const NAME = '아이엠 헤드코치';
const KEYS = ['squad-maker-v1', 'squad-maker-library-v1'];
const snapshot = page => page.evaluate(() => window.SquadMakerContract.getState().snapshot);
const saved = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), KEYS);

// Browser layout checks use the real app and approved outlined vectors. They
// do not prove Android font scaling, launcher labels or device rotation behavior.
// Existing launch-brand-feedback tests cover native intro readiness/tap/reduced
// motion/warm events and installed version metadata; do not duplicate that facade.
async function boot(page) {
  await stubExportCdn(page);
  await page.addInitScript(seed => {
    window.SQUAD_MAKER_ANALYTICS_ID = '';
    if (!sessionStorage.getItem('korean-branding-seeded')) {
      localStorage.setItem('squad-maker-v1', JSON.stringify(seed));
      sessionStorage.setItem('korean-branding-seeded', '1');
    }
  }, fixture);
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  expect((await page.evaluate(() => window.SquadMakerContract.run('retry-save'))).status).toBe('success');
}

async function headerGeometry(page) {
  const logo = page.locator('h1.wordmark > svg.wordmark-logo');
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('aria-label', NAME);
  await expect(page.locator('h1.wordmark')).toHaveCount(1);
  await expect(page.locator('h1.wordmark .wm-sub, h1.wordmark text, h1.wordmark image')).toHaveCount(0);
  const geometry = await logo.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const content = element.getBBox();
    const view = element.viewBox.baseVal;
    const heading = element.parentElement.getBoundingClientRect();
    const toolbar = document.querySelector('.topbar').getBoundingClientRect();
    return {
      x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom,
      width: rect.width, height: rect.height,
      heading: { x: heading.x, right: heading.right, y: heading.y, bottom: heading.bottom },
      toolbar: { x: toolbar.x, right: toolbar.right, y: toolbar.y, bottom: toolbar.bottom },
      content: { x: content.x, y: content.y, right: content.x + content.width, bottom: content.y + content.height },
      view: { x: view.x, y: view.y, right: view.x + view.width, bottom: view.y + view.height },
      viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
    };
  });
  expect(geometry.width / geometry.height).toBeCloseTo(4.154, 2);
  expect(geometry.x).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  // A wrapped toolbar is fine; intersecting the logo or clipping its SVG is not.
  const overlapX = Math.min(geometry.right, geometry.toolbar.right) - Math.max(geometry.x, geometry.toolbar.x);
  const overlapY = Math.min(geometry.bottom, geometry.toolbar.bottom) - Math.max(geometry.y, geometry.toolbar.y);
  expect(overlapX <= 1 || overlapY <= 1).toBe(true);
  expect(geometry.x).toBeGreaterThanOrEqual(geometry.heading.x - 1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.heading.right + 1);
  expect(geometry.y).toBeGreaterThanOrEqual(geometry.heading.y - 1);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.heading.bottom + 1);
  expect(geometry.content.x).toBeGreaterThanOrEqual(geometry.view.x - 1);
  expect(geometry.content.y).toBeGreaterThanOrEqual(geometry.view.y - 1);
  expect(geometry.content.right).toBeLessThanOrEqual(geometry.view.right + 1);
  expect(geometry.content.bottom).toBeLessThanOrEqual(geometry.view.bottom + 1);
  return geometry;
}

for (const width of [320, 360, 390, 1280]) {
  test(`approved Korean header fits naturally at ${width}px without a subtitle`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width >= 1024 ? 800 : 844 });
    await boot(page);
    const geometry = await headerGeometry(page);
    expect(geometry.height).toBeCloseTo(width >= 1024 ? 32 : 28, 1);
    // This screenshot supports visual inspection of path clarity; geometric
    // assertions alone cannot certify subjective sharpness on an Android panel.
    await page.locator('h1.wordmark').screenshot({ path: testInfo.outputPath(`header-${width}.png`) });
  });
}

test('OS light and dark preferences keep the approved night UI palette', async ({ page }) => {
  await boot(page);
  const before = await snapshot(page), bytes = await saved(page);
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    const palette = await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      foreground: getComputedStyle(document.body).color,
      scheme: getComputedStyle(document.documentElement).colorScheme,
    }));
    expect(palette).toEqual({ background: 'rgb(20, 26, 22)', foreground: 'rgb(232, 237, 232)', scheme: 'dark' });
  }
  expect(await snapshot(page)).toEqual(before);
  expect(await saved(page)).toEqual(bytes);
});

test('portrait to landscape and back preserves the board and both canonical save values', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  const before = await snapshot(page), bytes = await saved(page);
  expect(bytes.every(value => value !== null)).toBe(true);
  await headerGeometry(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('body')).toHaveClass(/pitch-horizontal/);
  await expect(page.locator('#fieldWrapper')).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  expect(await saved(page)).toEqual(bytes);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('body')).not.toHaveClass(/pitch-horizontal/);
  await headerGeometry(page);
  expect(await snapshot(page)).toEqual(before);
  expect(await saved(page)).toEqual(bytes);
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
  expect(await snapshot(page)).toEqual(before);
  expect(await saved(page)).toEqual(bytes);
});

test('simulated 200 percent CSS text sizing keeps the header and help actions apart', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  const before = await snapshot(page), bytes = await saved(page);
  // Root rem enlargement exercises web reflow only. It is not Android's OS
  // font scale, browser zoom, display scaling or a real-device accessibility pass.
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await headerGeometry(page);
    const buttons = page.locator('.topbar button');
    for (const button of await buttons.all()) {
      await expect(button).toBeVisible();
      const measured = await button.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, viewport: innerWidth,
          clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
          clientHeight: element.clientHeight, scrollHeight: element.scrollHeight };
      });
      expect(measured.left).toBeGreaterThanOrEqual(-1);
      expect(measured.right).toBeLessThanOrEqual(measured.viewport + 1);
      expect(measured.scrollWidth).toBeLessThanOrEqual(measured.clientWidth + 1);
      expect(measured.scrollHeight).toBeLessThanOrEqual(measured.clientHeight + 1);
    }
    await page.screenshot({ path: testInfo.outputPath(`css-text-200-${width}.png`) });
  }
  await page.locator('.topbar').getByRole('button', { name: '도움말', exact: true }).click();
  await expect(page.locator('#helpModal')).toBeVisible();
  await page.getByRole('button', { name: '도움말 닫기', exact: true }).click();
  expect(await snapshot(page)).toEqual(before);
  expect(await saved(page)).toEqual(bytes);
});

test('supplied light-background vectors render dark lettering and the retained lime symbol', async ({ page }, testInfo) => {
  const assetDir = path.join(__dirname, '..', '..', 'assets', 'branding', 'iam-headcoach');
  const names = ['iam-headcoach-header-on-light.svg', 'iam-headcoach-horizontal-on-light.svg', 'iam-headcoach-wordmark-on-light.svg'];
  const sources = await Promise.all(names.map(name => fs.readFile(path.join(assetDir, name), 'utf8')));
  await stubExportCdn(page);
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  const rendered = await page.evaluate(async sources => {
    const gallery = document.createElement('aside');
    gallery.id = 'light-asset-smoke';
    gallery.style.cssText = 'position:fixed;z-index:99999;inset:12px auto auto 12px;padding:20px;background:white;display:grid;gap:16px;';
    document.body.append(gallery);
    const result = [];
    for (const source of sources) {
      const image = new Image();
      image.style.cssText = 'height:64px;width:auto;display:block;';
      const loaded = new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
      gallery.append(image);
      await loaded;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let night = 0, lime = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (pixels[offset + 3] < 200) continue;
        if (pixels[offset] === 20 && pixels[offset + 1] === 26 && pixels[offset + 2] === 22) night++;
        if (pixels[offset] === 184 && pixels[offset + 1] === 233 && pixels[offset + 2] === 134) lime++;
      }
      result.push({ night, lime });
    }
    return result;
  }, sources);
  for (const item of rendered) expect(item.night).toBeGreaterThan(100);
  expect(rendered[0].lime).toBeGreaterThan(10);
  expect(rendered[1].lime).toBeGreaterThan(10);
  expect(rendered[2].lime).toBe(0);
  await page.locator('#light-asset-smoke').screenshot({ path: testInfo.outputPath('light-vector-smoke.png') });
});
