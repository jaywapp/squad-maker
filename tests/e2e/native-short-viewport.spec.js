const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');

for (const viewport of [{ width: 360, height: 682 }, { width: 360, height: 640 }]) {
  test(`native ${viewport.width}x${viewport.height} keeps pitch and selection tools apart`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await stubExportCdn(page);
    await page.addInitScript(() => {
      window.SquadPlatform = {
        native: true,
        showTestAd: async () => ({ status: 'unsupported' }),
      };
    });
    await page.goto('/index.html');
    await page.evaluate(() => window.SquadMakerContract.ready());
    const before = await page.evaluate(() => window.SquadMakerContract.getState());
    const pitch = page.locator('#fieldWrapper');
    const field = page.locator('#field');
    const initialPitch = await pitch.boundingBox();
    const initialField = await field.boundingBox();
    expect(Math.abs(initialPitch.width - initialField.width)).toBeLessThan(1);
    await page.evaluate(() => window.SquadMakerContract.run('select-player', { id: 1 }));
    const tray = page.locator('#playerActions');
    await expect(tray).toBeVisible();
    const pitchBox = await pitch.boundingBox();
    const trayBox = await tray.boundingBox();
    expect(pitchBox.y + pitchBox.height).toBeLessThanOrEqual(trayBox.y + 1);
    const player = page.locator('#field .player[data-id="1"]');
    const playerBox = await player.boundingBox();
    expect(playerBox.y + playerBox.height).toBeLessThanOrEqual(trayBox.y + 1);
    const hit = await player.evaluate(el => {
      const style = getComputedStyle(el, '::before');
      const scale = Number(/scale\(([\d.]+)\)/.exec(document.getElementById('field').style.transform)[1]);
      return { width: parseFloat(style.width) * scale, height: parseFloat(style.height) * scale };
    });
    expect(hit.width).toBeGreaterThanOrEqual(47.9);
    expect(hit.height).toBeGreaterThanOrEqual(47.9);
    for (const button of await tray.getByRole('button').all()) {
      const bounds = await button.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(48);
      expect(bounds.height).toBeGreaterThanOrEqual(48);
    }
    const after = await page.evaluate(() => window.SquadMakerContract.getState());
    expect(after.snapshot).toEqual(before.snapshot);
    expect(after.revision).toBe(before.revision);
  });
}