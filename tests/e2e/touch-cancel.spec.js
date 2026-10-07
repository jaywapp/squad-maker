const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
test.use({ hasTouch: true });

test.beforeEach(async ({ page }) => {
  await stubExportCdn(page);
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
});

async function startTouch(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#field .player');
    const r = el.getBoundingClientRect();
    const touch = new Touch({ identifier: 11, target: el, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 });
    window.cancelledPlayerTouch = touch;
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [touch], changedTouches: [touch] }));
    return window.SquadMakerContract.getState();
  });
}

test('cancelled player touch cannot open a delayed long-press menu', async ({ page }) => {
  const before = await page.evaluate(() => window.SquadMakerContract.getState());
  await page.clock.install();
  await startTouch(page);
  await page.evaluate(() => document.dispatchEvent(new TouchEvent('touchcancel', {
    bubbles: true, changedTouches: [window.cancelledPlayerTouch], touches: [],
  })));
  await page.clock.fastForward(600);
  await expect(page.locator('#ctxMenu')).toBeHidden();
  await expect(page.locator('#field .player.dragging')).toHaveCount(0);
  const after = await page.evaluate(() => window.SquadMakerContract.getState());
  expect(after.snapshot).toEqual(before.snapshot);
  expect(after.view).toEqual(before.view);
  expect(after.revision).toBe(before.revision);
});

test('cancelled touch and unrelated finger endings cannot drag or select a player', async ({ page }) => {
  const before = await page.evaluate(() => window.SquadMakerContract.getState());
  await startTouch(page);
  await page.evaluate(() => {
    const first = window.cancelledPlayerTouch;
    const other = new Touch({ identifier: 22, target: document.body, clientX: first.clientX + 80, clientY: first.clientY + 90 });
    document.body.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [first, other], changedTouches: [other] }));
    document.body.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [first], changedTouches: [other] }));
  });
  await expect(page.locator('#field .player.dragging')).toHaveCount(1);
  await page.evaluate(() => {
    const first = window.cancelledPlayerTouch;
    document.dispatchEvent(new TouchEvent('touchcancel', { bubbles: true, touches: [], changedTouches: [first] }));
    const other = new Touch({ identifier: 33, target: document.body, clientX: first.clientX + 80, clientY: first.clientY + 90 });
    document.body.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [other], changedTouches: [other] }));
    document.body.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [other] }));
  });
  await expect(page.locator('#field .player.dragging')).toHaveCount(0);
  const after = await page.evaluate(() => window.SquadMakerContract.getState());
  expect(after.snapshot).toEqual(before.snapshot);
  expect(after.view).toEqual(before.view);
  expect(after.revision).toBe(before.revision);
});
