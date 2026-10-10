const fs = require('node:fs/promises');
const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const state = page => page.evaluate(() => window.SquadMakerContract.getState());
const snapshot = async page => (await state(page)).snapshot;
const run = (page, op, payload) => page.evaluate(([command, args]) => window.SquadMakerContract.run(command, args), [op, payload]);
const rawKeys = page => page.evaluate(() => ['squad-maker-v1', 'squad-maker-library-v1'].map(key => localStorage.getItem(key)));

async function seed(page) {
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  await run(page, 'retry-save');
  await page.evaluate(value => localStorage.setItem('squad-maker-v1', value), JSON.stringify(fixture));
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
}

async function landscape(page) {
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.locator('#fieldWrapper').evaluate(el => {
    const box = el.getBoundingClientRect();
    return box.width > box.height;
  })).toBe(true);
  await expect.poll(() => page.locator('#field').evaluate(el => {
    const box = el.getBoundingClientRect();
    return Math.abs(box.width / box.height - 660 / 480) < 0.001;
  })).toBe(true);
}

async function recordMouse(page) {
  await page.evaluate(() => {
    window.__deskMouse = [];
    for (const type of ['mousedown', 'mousemove']) document.addEventListener(type, event => {
      window.__deskMouse.push({ type, x: event.clientX, y: event.clientY });
    }, { capture: true });
  });
}

async function recordPngScene(page) {
  await page.evaluate(() => {
    const capture = window.html2canvas;
    window.html2canvas = (scene, options) => {
      const header = scene.querySelector('#exportSceneHeader');
      const pitch = scene.querySelector('#exportPitch');
      const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
      window.__deskPngScene = { text: header?.textContent, header: header && rect(header), pitch: pitch && rect(pitch) };
      return capture(scene, options);
    };
  });
}

async function imagePixels(page, bytes, mime, pitchY) {
  return page.evaluate(async ({ encoded, type, y }) => {
    const image = new Image();
    const ready = new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
    image.src = 'data:' + type + ';base64,' + encoded;
    await ready;
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const rows = Math.round(image.width / 480 * 72);
    const data = ctx.getImageData(0, 0, image.width, rows).data;
    let brightPixels = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] > 180 && data[i + 1] > 180 && data[i + 2] > 180 && data[i + 3] === 255) brightPixels++;
    const pitchData = ctx.getImageData(0, rows, image.width, image.height - rows).data;
    let redPlayerPixels = 0;
    for (let i = 0; i < pitchData.length; i += 4) if (pitchData[i] > 170 && pitchData[i + 1] < 100 && pitchData[i + 2] < 100 && pitchData[i + 3] === 255) redPlayerPixels++;
    return { header: [...ctx.getImageData(8, 8, 1, 1).data], pitch: [...ctx.getImageData(8, y, 1, 1).data], brightPixels, redPlayerPixels };
  }, { encoded: bytes.toString('base64'), type: mime, y: pitchY });
}

async function playerPixelCenters(page, bytes, players) {
  return page.evaluate(async ({ encoded, targets }) => {
    const image = new Image();
    const ready = new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
    image.src = 'data:image/png;base64,' + encoded;
    await ready;
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return targets.map(player => {
      const rgb = [1, 3, 5].map(start => parseInt(player.color.slice(start, start + 2), 16));
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, count = 0;
      for (let y = 180; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        if (rgb.every((value, channel) => Math.abs(pixels[offset + channel] - value) <= 2) && pixels[offset + 3] === 255) {
          minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); count++;
        }
      }
      return { id: player.id, x: (minX + maxX) / 2, y: (minY + maxY) / 2, count };
    });
  }, { encoded: bytes.toString('base64'), targets: players });
}

test.beforeEach(async ({ page }) => {
  await stubExportCdn(page);
});

test('wide desk opens actual saved files and synchronizes selection without duplicating storage', async ({ page }) => {
  await seed(page);
  const first = await state(page);
  const firstFile = first.localLibrary.items.find(item => item.id === first.localLibrary.fileId);
  const other = structuredClone(first.snapshot);
  other.team = '다른 실제 팀';
  other.roster[0].name = '다른선수';
  expect((await run(page, 'create-file', { teamId: first.localLibrary.teamId, name: '두 번째 전술', snapshot: other })).status).toBe('success');
  const fileCount = (await state(page)).localLibrary.items.length;
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(page.locator('#editingLibrary')).toBeVisible();
  expect((await page.locator('.pane-side').boundingBox()).width).toBeGreaterThanOrEqual(340);
  await page.locator('#editingFiles').getByRole('button', { name: firstFile.name, exact: false }).first().click();
  await expect.poll(async () => (await state(page)).localLibrary.fileId).toBe(first.localLibrary.fileId);
  await expect(page.locator('#editingFiles').getByRole('button', { name: firstFile.name, exact: false }).first()).toBeFocused();
  expect(await snapshot(page)).toEqual(first.snapshot);
  const lineupPlayer = page.locator('#editingLineup').getByRole('button', { name: /^2\s*이미드$/ });
  await expect(lineupPlayer).toHaveCount(1);
  await lineupPlayer.click();
  await expect.poll(async () => (await state(page)).view.selectedPlayerId).toBe(2);
  await expect(page.locator('#field .player[data-id="2"]')).toHaveClass(/selected/);
  await expect(page.locator('#playerActionsName')).toContainText('이미드');
  expect((await state(page)).localLibrary.items.length).toBe(fileCount);
  await page.locator('#editingLibraryOpenBtn').click();
  await expect(page.locator('#librarySheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#librarySheet')).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('#editingLibrary')).toBeHidden();
  expect((await page.locator('.pane-side').boundingBox()).width).toBeGreaterThanOrEqual(340);
  await page.locator('#fileTitleBtn').click();
  await expect(page.locator('#librarySheet')).toBeVisible();
});

test('rotation preserves all saved bytes and keyboard movement follows the visible axes with undo', async ({ page }) => {
  await seed(page);
  const before = await state(page);
  const raw = await rawKeys(page);
  await landscape(page);
  const rotated = await state(page);
  expect(rotated.snapshot).toEqual(before.snapshot);
  expect(rotated.revision).toBe(before.revision);
  expect(rotated.savedRevision).toBe(before.savedRevision);
  expect(await rawKeys(page)).toEqual(raw);
  const player = page.locator('#field .player[data-id="1"]');
  await player.focus();
  await page.keyboard.press('ArrowRight');
  const moved = structuredClone(before.snapshot);
  moved.squads.basic.pos['1'] = { x: 240, y: 232 };
  expect(await snapshot(page)).toEqual(moved);
  await expect(player).toBeFocused();
  await page.keyboard.press('Shift+ArrowDown');
  moved.squads.basic.pos['1'] = { x: 272, y: 232 };
  expect(await snapshot(page)).toEqual(moved);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('squad-maker-v1')).squads.basic.pos['1'])).toEqual(moved.squads.basic.pos['1']);
  expect((await run(page, 'undo')).status).toBe('success');
  moved.squads.basic.pos['1'] = { x: 240, y: 232 };
  expect(await snapshot(page)).toEqual(moved);
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
  expect(await snapshot(page)).toEqual(moved);
  const saved = await rawKeys(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('#fieldWrapper').evaluate(el => el.clientHeight > el.clientWidth)).toBe(true);
  expect(await snapshot(page)).toEqual(moved);
  expect(await rawKeys(page)).toEqual(saved);
});

test('landscape mouse and real Chromium touch gestures save canonical coordinates', async ({ page }) => {
  await seed(page);
  await landscape(page);
  const before = await snapshot(page);
  const circle = page.locator('#field .player[data-id="1"] .player-circle');
  const box = await circle.boundingBox();
  const pitch = await page.locator('#field').boundingBox();
  const scale = pitch.width / 660;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  expect(await page.evaluate(({ x, y }) => Number(document.elementFromPoint(x, y)?.closest('.player')?.dataset.id), { x, y })).toBe(1);
  await recordMouse(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y + 16, { steps: 4 });
  await page.mouse.up();
  const changed = await snapshot(page);
  const events = await page.evaluate(() => window.__deskMouse);
  const start = events.find(event => event.type === 'mousedown');
  const end = events.filter(event => event.type === 'mousemove').at(-1);
  expect(changed.squads.basic.pos['1'].x).toBe(Math.round(240 + (end.y - start.y) / scale));
  expect(changed.squads.basic.pos['1'].y).toBe(Math.round(240 - (end.x - start.x) / scale));
  const expected = structuredClone(before);
  expected.squads.basic.pos['1'] = changed.squads.basic.pos['1'];
  expect(changed).toEqual(expected);
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
  expect((await run(page, 'undo')).status).toBe('success');
  expect(await snapshot(page)).toEqual(before);
  const touchBox = await circle.boundingBox();
  const touchX = touchBox.x + touchBox.width / 2;
  const touchY = touchBox.y + touchBox.height / 2;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchX, y: touchY, id: 11 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchX + 48, y: touchY, id: 11 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally { await session.detach(); }
  const touched = await snapshot(page);
  expect(touched.squads.basic.pos['1'].x).toBe(240);
  expect(touched.squads.basic.pos['1'].y).toBe(Math.round(240 - 48 / scale));
  expected.squads.basic.pos['1'] = touched.squads.basic.pos['1'];
  expect(touched).toEqual(expected);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('squad-maker-v1')).squads.basic.pos['1'])).toEqual(touched.squads.basic.pos['1']);
});

test('rotating during unfinished touch cancels the gesture and cannot commit a stale delta', async ({ page }) => {
  await seed(page);
  await landscape(page);
  const original = await snapshot(page);
  await page.locator('#field .player[data-id="1"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
  const before = await state(page);
  const raw = await rawKeys(page);
  const circle = await page.locator('#field .player[data-id="1"] .player-circle').boundingBox();
  const x = circle.x + circle.width / 2;
  const y = circle.y + circle.height / 2;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 12 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y, id: 12 }] });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator('#fieldWrapper').evaluate(el => el.clientHeight > el.clientWidth)).toBe(true);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally { await session.detach(); }
  const after = await state(page);
  expect(after.snapshot).toEqual(before.snapshot);
  expect(after.revision).toBe(before.revision);
  expect(after.savedRevision).toBe(before.savedRevision);
  expect(after.view.selectedPlayerId).toBe(before.view.selectedPlayerId);
  expect(after.undoAvailable).toBe(before.undoAvailable);
  expect(after.storage.status).toBe('saved');
  expect(await rawKeys(page)).toEqual(raw);
  expect((await run(page, 'undo')).status).toBe('success');
  expect(await snapshot(page)).toEqual(original);
});

test('a pending completed edit cannot save an unfinished drag before rotation cancellation', async ({ page }) => {
  await seed(page);
  await landscape(page);
  const original = await snapshot(page);
  await page.locator('#field .player[data-id="1"]').focus();
  await page.keyboard.press('ArrowRight');
  const completed = await state(page);
  expect(completed.storage.status).toBe('pending');
  const raw = await rawKeys(page);
  const circle = await page.locator('#field .player[data-id="1"] .player-circle').boundingBox();
  const x = circle.x + circle.width / 2;
  const y = circle.y + circle.height / 2;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 14 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y, id: 14 }] });
    // Hold beyond the real 600ms autosave debounce while the gesture is unfinished.
    await page.waitForTimeout(750);
    expect(await rawKeys(page)).toEqual(raw);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator('#field').evaluate(el => Math.abs(el.getBoundingClientRect().width / el.getBoundingClientRect().height - 480 / 660) < 0.001)).toBe(true);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally { await session.detach(); }
  expect((await run(page, 'retry-save')).status).toBe('success');
  expect(await snapshot(page)).toEqual(completed.snapshot);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('squad-maker-v1')))).toEqual(completed.snapshot);
  const reader = await page.context().newPage();
  try {
    await reader.goto('/index.html');
    await reader.evaluate(() => window.SquadMakerContract.ready());
    expect(await snapshot(reader)).toEqual(completed.snapshot);
  } finally { await reader.close(); }
  expect((await run(page, 'undo')).status).toBe('success');
  expect(await snapshot(page)).toEqual(original);
  expect((await run(page, 'retry-save')).status).toBe('success');
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
  expect(await snapshot(page)).toEqual(original);
});

test('hiding or leaving the app cancels unfinished touch and releases a waiting completed save', async ({ page }) => {
  for (const lifecycle of ['blur', 'hidden', 'pagehide']) {
    await seed(page);
    await landscape(page);
    await page.locator('#field .player[data-id="1"]').focus();
    await page.keyboard.press('ArrowRight');
    const completed = await snapshot(page);
    const circle = await page.locator('#field .player[data-id="1"] .player-circle').boundingBox();
    const x = circle.x + circle.width / 2;
    const y = circle.y + circle.height / 2;
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 15 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y, id: 15 }] });
      await page.evaluate(() => { window.__deskWaitingSave = window.SquadMakerContract.run('retry-save'); });
      await page.evaluate(kind => {
        if (kind === 'hidden') {
          Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
          document.dispatchEvent(new Event('visibilitychange'));
          delete document.visibilityState;
        } else window.dispatchEvent(kind === 'pagehide' ? new PageTransitionEvent('pagehide', { persisted: true }) : new Event('blur'));
      }, lifecycle);
      expect((await page.evaluate(() => window.__deskWaitingSave)).status).toBe('success');
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally { await session.detach(); }
    expect(await snapshot(page)).toEqual(completed);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('squad-maker-v1')))).toEqual(completed);
    await page.reload();
    await page.evaluate(() => window.SquadMakerContract.ready());
    expect(await snapshot(page)).toEqual(completed);
  }
});

test('changing player count keeps the full horizontal pitch and selected tools inside the viewport', async ({ page }) => {
  await seed(page);
  await landscape(page);
  for (const mode of ['11v11', '9v9']) {
    await page.evaluate(value => { window.__deskMode = window.SquadMakerContract.run('change-mode', { mode: value }); }, mode);
    await page.getByRole('alertdialog').locator('[data-r="1"]').click();
    expect((await page.evaluate(() => window.__deskMode)).status).toBe('success');
    while ((await snapshot(page)).roster.length < Number(mode.split('v')[0])) expect((await run(page, 'add-player')).status).toBe('success');
    await run(page, 'select-player', { id: (await snapshot(page)).roster[4].id });
    await expect.poll(() => page.evaluate(() => {
      const pitch = document.querySelector('#fieldWrapper').getBoundingClientRect();
      const field = document.querySelector('#field').getBoundingClientRect();
      const tools = document.querySelector('#playerActions').getBoundingClientRect();
      return Math.abs(field.width - pitch.width) < 1 && Math.abs(field.height - pitch.height) < 1
        && field.top >= 0 && field.bottom <= innerHeight && tools.top >= 0 && tools.bottom <= innerHeight;
    })).toBe(true);
  }
});

test('horizontal pattern drawing inversely projects its pointer and keeps squad positions intact', async ({ page }) => {
  await seed(page);
  await landscape(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  const before = await snapshot(page);
  const box = await page.locator('#patternCanvas').boundingBox();
  const scale = box.width / 660;
  const x = box.x + (660 - 240) * scale;
  const y = box.y + 240 * scale;
  await recordMouse(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 48, y + 16, { steps: 4 });
  await page.mouse.up();
  const changed = await snapshot(page);
  const move = changed.pat[0].s[0].m['1'];
  const endpoint = await page.evaluate(() => window.__deskMouse.filter(event => event.type === 'mousemove').at(-1));
  expect(move.x).toBe(Math.round((endpoint.y - box.y) / scale));
  expect(move.y).toBe(Math.round(660 - (endpoint.x - box.x) / scale));
  const expected = structuredClone(before);
  expected.pat[0].s[0].m['1'] = move;
  expect(changed).toEqual(expected);
  expect((await run(page, 'undo')).status).toBe('success');
  expect(await snapshot(page)).toEqual(before);
});

test('real landscape PNG has a separate team header and leaves the live field untouched', async ({ page }) => {
  await seed(page);
  await landscape(page);
  await run(page, 'select-player', { id: 2 });
  const before = await state(page);
  const geometry = await page.locator('#field').boundingBox();
  await recordPngScene(page);
  const event = page.waitForEvent('download');
  const result = await run(page, 'export-png');
  const download = await event;
  expect(result.status).toBe('success');
  expect(download.suggestedFilename()).toBe('FC 회귀_기본 스쿼드_3-3-2.png');
  const bytes = await fs.readFile(await download.path());
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(1830);
  const scene = await page.evaluate(() => window.__deskPngScene);
  expect(scene.text).toContain('FC 회귀');
  expect(scene.text).toContain('3-3-2');
  expect(scene.header.bottom).toBeLessThanOrEqual(scene.pitch.y);
  const colors = await imagePixels(page, bytes, 'image/png', 210);
  expect(colors.header[3]).toBe(255);
  expect(colors.brightPixels).toBeGreaterThan(100);
  expect(colors.pitch[1]).toBeGreaterThan(colors.header[1] + 20);
  expect(colors.redPlayerPixels).toBeGreaterThan(1000);
  expect((await state(page)).snapshot).toEqual(before.snapshot);
  expect((await state(page)).view.selectedPlayerId).toBe(2);
  await expect(page.locator('#exportScene')).toHaveCount(0);
  expect(await page.locator('#field').boundingBox()).toEqual(geometry);
  expect((await state(page)).export.busy).toBe(false);
});

test('decoded PNG player centers match canonical positions for long names and a near-goal keeper', async ({ page }) => {
  await seed(page);
  const sample = await snapshot(page);
  sample.roster[0].name = '선수이름열두글자좌표검사';
  sample.roster[1].name = '골키퍼좌표';
  sample.roster[1].color = '#85b8e4';
  sample.squads.basic.pos['1'] = { x: 130, y: 385 };
  sample.squads.basic.pos['2'] = { x: 240, y: 622 };
  await page.evaluate(value => { window.__deskImport = window.SquadMakerContract.run('import-snapshot', { snapshot: value }); }, sample);
  await page.getByRole('alertdialog').locator('[data-r="1"]').click();
  expect((await page.evaluate(() => window.__deskImport)).status).toBe('success');
  const before = await snapshot(page);
  for (const horizontal of [true, false]) {
    if (horizontal) await landscape(page);
    else await page.setViewportSize({ width: 390, height: 844 });
    const event = page.waitForEvent('download');
    expect((await run(page, 'export-png')).status).toBe('success');
    const bytes = await fs.readFile(await (await event).path());
    for (const center of await playerPixelCenters(page, bytes, before.roster)) {
      const position = before.squads.basic.pos[String(center.id)];
      expect(center.count).toBeGreaterThan(1000);
      expect(Math.abs(center.x - position.x * 2.5)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(center.y - (position.y + 72) * 2.5)).toBeLessThanOrEqual(1.5);
    }
    expect(await snapshot(page)).toEqual(before);
  }
});

test('real PNG exports include player pixels when the live field is hidden in other modes', async ({ page }) => {
  await seed(page);
  await landscape(page);
  await recordPngScene(page);
  const before = await snapshot(page);
  for (const mode of ['pattern', 'strategy']) {
    await page.locator(`.app-tab[data-app="${mode}"]`).click();
    await expect(page.locator('#field')).toBeHidden();
    const event = page.waitForEvent('download');
    expect((await run(page, 'export-png')).status).toBe('success');
    const bytes = await fs.readFile(await (await event).path());
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(1830);
    const colors = await imagePixels(page, bytes, 'image/png', 210);
    expect(colors.redPlayerPixels).toBeGreaterThan(1000);
    expect(colors.brightPixels).toBeGreaterThan(100);
    expect(await snapshot(page)).toEqual(before);
    await expect(page.locator('#field')).toBeHidden();
    await expect(page.locator('#exportScene')).toHaveCount(0);
  }
});

test('PNG failures and busy operations clean the export scene without changing the board', async ({ page }) => {
  await seed(page);
  await landscape(page);
  await run(page, 'select-player', { id: 2 });
  const before = await state(page);
  const geometry = await page.locator('#field').boundingBox();
  await page.evaluate(() => {
    window.html2canvas = () => new Promise((resolve, reject) => { window.__rejectDeskCapture = reject; });
    window.__deskExport = window.SquadMakerContract.run('export-png');
  });
  await expect.poll(async () => (await state(page)).export.busy).toBe(true);
  expect((await run(page, 'export-sq')).status).toBe('busy');
  await expect.poll(() => page.evaluate(() => typeof window.__rejectDeskCapture)).toBe('function');
  expect(await page.locator('#field').boundingBox()).toEqual(geometry);
  const during = await state(page);
  expect(during.snapshot).toEqual(before.snapshot);
  expect(during.view.selectedPlayerId).toBe(before.view.selectedPlayerId);
  await page.evaluate(() => window.__rejectDeskCapture(new Error('Fixture capture failure')));
  expect((await page.evaluate(() => window.__deskExport)).status).toBe('error');
  await expect(page.locator('#exportScene')).toHaveCount(0);
  expect((await state(page)).snapshot).toEqual(before.snapshot);
  expect((await state(page)).export.busy).toBe(false);
  expect(await page.locator('#field').boundingBox()).toEqual(geometry);
});

test('single and all real GIF exports render team and per-pattern labels outside the pitch', async ({ page }) => {
  await page.addInitScript(() => {
    window.__deskText = [];
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...rest) {
      if (!this.canvas.isConnected && this.canvas.width === 480) {
        const m = this.getTransform();
        window.__deskText.push({ text: String(text), x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
      }
      return fillText.call(this, text, x, y, ...rest);
    };
  });
  await seed(page);
  const sample = await snapshot(page);
  sample.pat = [
    { n: '패턴 가', bs: { x: 240, y: 330 }, s: [{ m: { '1': { x: 200, y: 200 } }, b: null }] },
    { n: '패턴 나', bs: { x: 240, y: 330 }, s: [{ m: { '2': { x: 280, y: 300 } }, b: null }] },
  ];
  await page.evaluate(value => { window.__deskImport = window.SquadMakerContract.run('import-snapshot', { snapshot: value }); }, sample);
  await page.getByRole('alertdialog').locator('[data-r="1"]').click();
  expect((await page.evaluate(() => window.__deskImport)).status).toBe('success');
  await landscape(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  const before = await snapshot(page);
  for (const allPatterns of [false, true]) {
    await page.evaluate(() => { window.__deskText = []; });
    const event = page.waitForEvent('download');
    expect((await run(page, 'export-gif', { allPatterns })).status).toBe('success');
    const bytes = await fs.readFile(await (await event).path());
    expect(bytes.subarray(0, 6).toString()).toMatch(/^GIF8[79]a$/);
    expect(bytes.readUInt16LE(6)).toBe(480);
    expect(bytes.readUInt16LE(8)).toBe(732);
    const draws = await page.evaluate(() => window.__deskText);
    const headerDraws = draws.filter(draw => draw.x >= 0 && draw.x < 480 && draw.y >= 0 && draw.y < 72);
    expect(headerDraws.some(draw => draw.text === 'FC 회귀')).toBe(true);
    expect(headerDraws.some(draw => draw.text.includes('패턴 가'))).toBe(true);
    expect(headerDraws.some(draw => draw.text.includes('패턴 나'))).toBe(allPatterns);
    const colors = await imagePixels(page, bytes, 'image/gif', 90);
    expect(colors.header[3]).toBe(255);
    expect(colors.pitch[1]).toBeGreaterThan(colors.header[1] + 20);
    expect(colors.brightPixels).toBeGreaterThan(100);
    expect(await snapshot(page)).toEqual(before);
    expect((await state(page)).export.busy).toBe(false);
  }
});

test('wide and horizontal viewers keep both local keys private while allowing the new PNG output', async ({ page }) => {
  await seed(page);
  const raw = await rawKeys(page);
  const shared = structuredClone(fixture);
  shared.team = '공유 전용 팀';
  shared.roster[0].name = '공유공격';
  const encoded = Buffer.from(JSON.stringify(shared)).toString('base64url');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/index.html#s=' + encoded);
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
  await expect(page.locator('#editingLibrary')).toBeHidden();
  await expect(page.locator('#playerActions')).toBeHidden();
  expect(await rawKeys(page)).toEqual(raw);
  await landscape(page);
  await recordPngScene(page);
  const event = page.waitForEvent('download');
  expect((await run(page, 'export-png')).status).toBe('success');
  const bytes = await fs.readFile(await (await event).path());
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(1830);
  const scene = await page.evaluate(() => window.__deskPngScene);
  expect(scene.text).toContain('공유 전용 팀');
  expect(scene.text).not.toContain('FC 회귀');
  expect(scene.header.bottom).toBeLessThanOrEqual(scene.pitch.y);
  expect(await rawKeys(page)).toEqual(raw);
  expect((await snapshot(page)).roster).toEqual(shared.roster);
  expect((await state(page)).view.readOnly).toBe(true);
});
