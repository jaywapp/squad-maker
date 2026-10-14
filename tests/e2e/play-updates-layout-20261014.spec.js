const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');

// UI-only facade; never contacts Play, ads, or the feedback endpoint.
for (const [label, viewport, font] of [
  ['desktop', { width: 1280, height: 800 }, 100],
  ['phone', { width: 390, height: 844 }, 100],
  ['small-large-text', { width: 320, height: 568 }, 200],
  ['landscape', { width: 844, height: 390 }, 100],
]) test('update help remains readable at ' + label, async ({ page }, testInfo) => {
  await stubExportCdn(page);
  await page.addInitScript(() => {
    window.SQUAD_MAKER_ANALYTICS_ID = '';
    const value = { supported: true, status: 'downloaded', shouldNotify: false, availableVersionCode: 2 };
    window.SquadPlatform = {
      native: true,
      getAppInfo: async () => ({ name: '아이엠 헤드코치', id: 'com.jaywapp.iamheadcoach', version: '1.0.0', build: '1' }),
      getUpdateState: async () => value, checkForUpdate: async () => value,
      onUpdateState: callback => { callback(value); return () => {}; },
      getAdState: async () => ({ privacyOptionsRequired: false }),
    };
  });
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await page.request.get('/index.html')).status()).toBe(200);
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  await page.evaluate(size => { document.documentElement.style.fontSize = size + '%'; openHelp(); }, font);
  const section = page.locator('#appUpdateSection');
  await expect(page.locator('#appUpdateRestart')).toBeVisible();
  await expect(page.locator('#appUpdateRestart')).toHaveText('저장 확인 후 재시작');
  await section.scrollIntoViewIfNeeded();
  const dimensions = await section.evaluate(element => {
    const box = element.getBoundingClientRect();
    return { width: box.width, scrollWidth: element.scrollWidth, viewport: document.documentElement.clientWidth,
      actions: [...element.querySelectorAll('button:not([hidden])')].map(button => {
        const bounds = button.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right };
      }) };
  });
  const close = await page.locator('#helpCloseBtn').boundingBox();
  expect(close.x).toBeGreaterThanOrEqual(0);
  const geometry = await page.evaluate(() => {
    const head = document.querySelector('#helpModal .ui-sheet-head');
    const title = document.getElementById('helpTitle');
    return { innerWidth, clientWidth: document.documentElement.clientWidth,
      visualWidth: visualViewport.width, modalWidth: document.getElementById('helpModal').getBoundingClientRect().width,
      headWidth: head.getBoundingClientRect().width, titleWidth: title.getBoundingClientRect().width,
      titleMin: getComputedStyle(title).minWidth, titleFlex: getComputedStyle(title).flex };
  });
  expect(close.x + close.width, JSON.stringify(geometry)).toBeLessThanOrEqual(viewport.width + 1);
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(Math.ceil(dimensions.width) + 1);
  for (const action of dimensions.actions) {
    expect(action.left).toBeGreaterThanOrEqual(0);
    expect(action.right).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
  const restart = page.locator('#appUpdateRestart');
  await restart.scrollIntoViewIfNeeded();
  const button = await restart.boundingBox();
  const body = await page.locator('#helpModal .ui-sheet-body').boundingBox();
  expect(button.y).toBeGreaterThanOrEqual(body.y - 1);
  expect(button.y + button.height).toBeLessThanOrEqual(body.y + body.height + 1);
  await page.screenshot({ path: path.resolve('.work/updates-feedback-20261014', `layout-${testInfo.project.name}-${label}.png`) });
});
