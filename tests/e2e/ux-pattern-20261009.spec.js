const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const snapshot = page => page.evaluate(() => window.SquadMakerContract.getState().snapshot);
const run = (page, command, payload) => page.evaluate(([op, args]) => window.SquadMakerContract.run(op, args), [command, payload]);

async function seed(page) {
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  await run(page, 'retry-save');
  await page.evaluate(value => localStorage.setItem('squad-maker-v1', value), JSON.stringify(fixture));
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
}

test.beforeEach(async ({ page }) => {
  await stubExportCdn(page);
});

test('keyboard movement retains focus, saves logical 8/32 steps and persists the undo result', async ({ page }) => {
  await seed(page);
  const expected = await snapshot(page);
  const player = page.locator('#field .player[data-id="1"]');
  await player.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await snapshot(page)).squads.basic.pos['1']).toEqual({ x: 248, y: 240 });
  await expect(player).toBeFocused();
  await page.keyboard.press('Shift+ArrowDown');
  await expect.poll(async () => (await snapshot(page)).squads.basic.pos['1']).toEqual({ x: 248, y: 272 });
  expected.squads.basic.pos['1'] = { x: 248, y: 272 };
  expect(await snapshot(page)).toEqual(expected);
  await expect(player).toBeFocused();
  await expect(page.locator('#playerMoveStatus')).toContainText('김공격');
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('squad-maker-v1');
    return raw ? JSON.parse(raw).squads.basic.pos['1'] : null;
  })).toEqual({ x: 248, y: 272 });
  expect((await run(page, 'undo')).status).toBe('success');
  expected.squads.basic.pos['1'] = { x: 248, y: 240 };
  expect(await snapshot(page)).toEqual(expected);
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
  expect(await snapshot(page)).toEqual(expected);
  const before = await snapshot(page);
  await page.locator('#teamName').focus();
  await page.keyboard.press('ArrowLeft');
  expect(await snapshot(page)).toEqual(before);
  await player.click();
  await page.locator('#playerActions').getByRole('button', { name: '이름', exact: true }).click();
  const nameInput = player.locator('input');
  await expect(nameInput).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Shift+ArrowDown');
  expect(await snapshot(page)).toEqual(before);
});

test('a blocked boundary move does not overwrite the last real undo', async ({ page }) => {
  await seed(page);
  const player = page.locator('#field .player[data-id="1"]');
  await player.focus();
  let lastRealMoveBefore;
  for (let n = 0; n < 70; n++) {
    const before = await snapshot(page);
    await page.keyboard.press('ArrowLeft');
    if ((await snapshot(page)).squads.basic.pos['1'].x !== before.squads.basic.pos['1'].x) lastRealMoveBefore = before;
  }
  const edge = (await snapshot(page)).squads.basic.pos['1'];
  expect(edge.x).toBe(26);
  await page.keyboard.press('ArrowLeft');
  expect((await snapshot(page)).squads.basic.pos['1']).toEqual(edge);
  expect((await run(page, 'undo')).status).toBe('success');
  expect(await snapshot(page)).toEqual(lastRealMoveBefore);
});

test('canvas text and players retain display size with DPR and expose a step summary', async ({ page }) => {
  await page.addInitScript(() => {
    delete CanvasRenderingContext2D.prototype.roundRect;
    window.__canvasText = [];
    window.__canvasArcs = [];
    const originalText = CanvasRenderingContext2D.prototype.fillText;
    const originalArc = CanvasRenderingContext2D.prototype.arc;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...rest) {
      if (this.canvas.id === 'patternCanvas') {
        const px = /([\d.]+)px/.exec(this.font);
        window.__canvasText.push({ text: String(text), font: this.font,
          displaySize: px ? Number(px[1]) * this.getTransform().a * this.canvas.clientWidth / this.canvas.width : 0 });
      }
      return originalText.call(this, text, x, y, ...rest);
    };
    CanvasRenderingContext2D.prototype.arc = function (x, y, radius, ...rest) {
      if (this.canvas.id === 'patternCanvas') window.__canvasArcs.push({ x, y, radius,
        displayDiameter: radius * 2 * this.getTransform().a * this.canvas.clientWidth / this.canvas.width });
      return originalArc.call(this, x, y, radius, ...rest);
    };
  });
  await seed(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  await expect.poll(() => page.evaluate(() => window.__canvasText.some(t => t.text === '박수비'))).toBe(true);
  const measured = await page.evaluate(() => ({
    text: window.__canvasText.filter(t => t.text === '박수비').at(-1),
    player: window.__canvasArcs.filter(a => a.x === 240 && a.y === 510).at(-1),
  }));
  expect(measured.text.displaySize).toBeGreaterThanOrEqual(11.9);
  expect(measured.text.displaySize).toBeLessThanOrEqual(12.3);
  expect(measured.player.displayDiameter).toBeGreaterThanOrEqual(35.9);
  expect(measured.player.displayDiameter).toBeLessThanOrEqual(50);
  await expect(page.locator('#patternCanvas')).toHaveAttribute('aria-describedby', 'patternStepSummary');
  await expect(page.locator('#patternCanvas')).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#patternStepSummary li')).toHaveCount(2);
  await expect(page.locator('#patternStepSummary')).toContainText('김공격');
  await expect(page.locator('#patternStepSummary')).toContainText('이미드');
  await expect(page.locator('#patternStepSummary li').first()).toContainText('왼쪽 위');
  await expect(page.locator('#patternStepSummary li').last()).toContainText('오른쪽 위');
});

test('pattern actions are compact and viewer GIF still uses the canonical export sheet', async ({ page }) => {
  await seed(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  const visible = await page.locator('#patternUI button').evaluateAll(buttons => buttons.filter(button => button.checkVisibility()).length);
  expect(visible).toBeLessThanOrEqual(7);
  await expect(page.locator('#gifBtn')).toHaveCount(0);
  await expect(page.locator('#gifAllBtn')).toHaveCount(0);
  await page.locator('#patternMoreBtn').click();
  await expect(page.locator('#patternMoreMenu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#patternMoreMenu')).toBeHidden();
  const originalStored = await page.evaluate(() => ['squad-maker-v1', 'squad-maker-library-v1'].map(key => localStorage.getItem(key)));
  const shared = JSON.parse(JSON.stringify(fixture));
  shared.team = '다른 공유 클럽';
  shared.squads.basic.pos['1'] = { x: 270, y: 270 };
  const encoded = Buffer.from(JSON.stringify(shared), 'utf8').toString('base64url');
  await page.goto('/index.html#s=' + encoded);
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/viewer-mode/);
  const viewerSnapshot = await snapshot(page);
  expect(viewerSnapshot).toEqual(shared);
  expect(await page.evaluate(() => window.SquadMakerContract.getState().view.readOnly)).toBe(true);
  await page.locator('.app-tab[data-app="pattern"]').click();
  await page.locator('#viewerExportBtn').click();
  await expect(page.locator('#exportPanel')).toBeVisible();
  await expect(page.locator('#exportPanel .exp-backup')).toBeHidden();
  const event = page.waitForEvent('download');
  await page.locator('#exportPanel [data-ui-export="export-gif"]').first().click();
  const download = await event;
  expect(download.suggestedFilename()).toMatch(/\.gif$/);
  const stream = await download.createReadStream();
  const parts = [];
  for await (const part of stream) parts.push(part);
  expect(Buffer.concat(parts).subarray(0, 6).toString()).toBe('GIF89a');
  expect(await page.evaluate(() => ['squad-maker-v1', 'squad-maker-library-v1'].map(key => localStorage.getItem(key)))).toEqual(originalStored);
  expect(await snapshot(page)).toEqual(viewerSnapshot);
  expect(await page.evaluate(() => window.SquadMakerContract.getState().export.busy)).toBe(false);
});

test('feedback traps focus without the honeypot and Escape closes one layer at a time', async ({ page }) => {
  await seed(page);
  await page.route('**/api/feedback', route => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
  const before = await snapshot(page);
  const opener = page.locator('.topbar').getByRole('button', { name: '제보', exact: true });
  await opener.click();
  const feedback = page.locator('#feedbackModal');
  await expect(feedback).toBeVisible();
  await expect(feedback.locator('.ui-sheet-head')).toHaveCount(1);
  await expect(feedback.getByRole('button', { name: '제보 닫기', exact: true })).toHaveCount(1);
  for (let n = 0; n < 16; n++) {
    await page.keyboard.press('Tab');
    expect(await feedback.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await expect(page.locator('#feedbackWebsite')).not.toBeFocused();
  }
  await page.evaluate(() => { window.__pendingMode = window.SquadMakerContract.run('change-mode', { mode: '8v8' }); });
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByRole('alertdialog').locator('[data-r="0"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('alertdialog').locator('[data-r="1"]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('alertdialog').locator('[data-r="0"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('alertdialog')).toBeHidden();
  await expect(feedback).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(feedback).toBeHidden();
  await expect(opener).toBeFocused();
});

test('destructive pattern menu actions cancel safely and undo restores the complete pattern', async ({ page }) => {
  await seed(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  const before = await snapshot(page);
  await page.locator('#patternMoreBtn').click();
  await page.getByRole('menuitem', { name: '단계 초기화', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.locator('[data-r="0"]')).toBeFocused();
  await expect(dialog.locator('[data-r="1"]')).toHaveText('단계 초기화');
  await expect(dialog.locator('[data-r="1"]')).toHaveClass(/btn-red/);
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  expect(await snapshot(page)).toEqual(before);
  await page.locator('#patternMoreBtn').click();
  await page.getByRole('menuitem', { name: '단계 초기화', exact: true }).click();
  await dialog.locator('[data-r="1"]').click();
  await expect.poll(async () => (await snapshot(page)).pat[0].s[0].m).toEqual({});
  expect((await run(page, 'undo')).status).toBe('success');
  expect(await snapshot(page)).toEqual(before);
});
