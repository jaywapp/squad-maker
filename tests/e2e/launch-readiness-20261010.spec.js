const fs = require('node:fs/promises');
const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const KEYS = ['squad-maker-v1', 'squad-maker-library-v1'];
const state = page => page.evaluate(() => window.SquadMakerContract.getState());
const snapshot = async page => (await state(page)).snapshot;
const ready = page => page.evaluate(() => window.SquadMakerContract.ready());
const run = (page, command, payload) => page.evaluate(([operation, input]) => window.SquadMakerContract.run(operation, input), [command, payload]);
const raw = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), KEYS);
const copy = value => JSON.parse(JSON.stringify(value));

// Reuse existing real export vendors and snapshot-v1. Seed once so reloads
// prove persistence, and never call public feedback or real native plugins.
async function boot(page, value = fixture) {
  await stubExportCdn(page);
  await page.addInitScript(seed => {
    if (!sessionStorage.getItem('launch-readiness-seeded')) {
      localStorage.setItem('squad-maker-v1', JSON.stringify(seed));
      sessionStorage.setItem('launch-readiness-seeded', '1');
    }
  }, value);
  await page.goto('/index.html');
  await ready(page);
  expect((await run(page, 'retry-save')).status).toBe('success');
}

async function touchDrag(page, id = 1) {
  const box = await page.locator(`#field .player[data-id="${id}"] .player-circle`).boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 71 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y: y + 20, id: 71 }] });
  return { session, x, y };
}

async function confirmCommand(page, command, payload, accept = true) {
  await page.evaluate(([operation, input]) => {
    window.__launchCommand = window.SquadMakerContract.run(operation, input);
  }, [command, payload]);
  await page.getByRole('alertdialog').locator(`[data-r="${accept ? 1 : 0}"]`).click();
  return page.evaluate(() => window.__launchCommand);
}

async function exported(page, command, payload) {
  const pending = page.waitForEvent('download');
  expect((await run(page, command, payload)).status).toBe('success');
  const download = await pending;
  expect(await download.failure()).toBeNull();
  return { download, bytes: await fs.readFile(await download.path()) };
}

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`real moved touch cancellation restores saved state at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await boot(page);
    const before = await state(page), saved = await raw(page);
    const { session } = await touchDrag(page);
    try {
      const livePosition = await page.locator('#field .player[data-id="1"]').evaluate(element => ({ x: parseFloat(element.style.left), y: parseFloat(element.style.top) }));
      expect(livePosition).not.toEqual(before.snapshot.squads.basic.pos['1']);
      // Polling the public contract must not publish an unfinished gesture as
      // a completed revision or a pending save. The live DOM may still move.
      const during = await state(page);
      expect(during.snapshot).toEqual(before.snapshot);
      expect(during.revision).toBe(before.revision);
      expect(during.savedRevision).toBe(before.savedRevision);
      expect(during.storage).toEqual(before.storage);
      await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      await page.waitForTimeout(750);
      const after = await state(page);
      expect(after.snapshot).toEqual(before.snapshot);
      expect(after.revision).toBe(before.revision);
      expect(after.savedRevision).toBe(before.savedRevision);
      expect(after.undoAvailable).toBe(before.undoAvailable);
      expect(await raw(page)).toEqual(saved);
      await expect(page.locator('#field .player.dragging')).toHaveCount(0);
      await expect(page.locator('#ctxMenu')).toBeHidden();
      await page.reload();
      expect((await ready(page)).snapshot).toEqual(before.snapshot);
    } finally { await session.detach(); }
  });
}

test('touch cancellation preserves other completed metadata and the last real move undo', async ({ page }) => {
  await boot(page);
  const original = await snapshot(page), saved = await raw(page);
  await page.locator('#field .player[data-id="1"]').focus();
  await page.keyboard.press('ArrowRight');
  const moved = await state(page);
  expect(moved.undoAvailable).toBe(true);
  const { session } = await touchDrag(page);
  try {
    // Complete an independent metadata edit while an unfinished position is
    // moving. Observation must retain this edit while projecting the position
    // back to the last completed move; it must not freeze the entire snapshot.
    await page.evaluate(() => {
      const input = document.getElementById('teamName');
      input.value = '드래그 중 완료한 팀명';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const completed = await state(page);
    const expected = copy(moved.snapshot);
    expected.team = '드래그 중 완료한 팀명';
    expect(completed.snapshot).toEqual(expected);
    expect(completed.revision).toBeGreaterThan(moved.revision);
    expect(completed.storage.status).toBe('pending');
    await page.waitForTimeout(750);
    expect(await raw(page)).toEqual(saved);
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    expect((await run(page, 'retry-save')).status).toBe('success');
    expect(await snapshot(page)).toEqual(expected);
    expect((await state(page)).revision).toBe(completed.revision);
    expect((await state(page)).undoAvailable).toBe(true);
    expect((await run(page, 'undo')).status).toBe('success');
    expect(await snapshot(page)).toEqual(original);
    await page.reload();
    expect((await ready(page)).snapshot).toEqual(original);
  } finally { await session.detach(); }
});
test('a second finger interrupts a moved drag without saving an unfinished position', async ({ page }) => {
  await boot(page);
  const before = await state(page), saved = await raw(page);
  const { session, x, y } = await touchDrag(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
      { x: x + 40, y: y + 20, id: 71 }, { x: x + 90, y: y + 30, id: 72 },
    ] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(750);
    expect(await snapshot(page)).toEqual(before.snapshot);
    expect((await state(page)).revision).toBe(before.revision);
    expect((await state(page)).undoAvailable).toBe(before.undoAvailable);
    expect(await raw(page)).toEqual(saved);
    await expect(page.locator('#field .player.dragging')).toHaveCount(0);
  } finally { await session.detach(); }
});
async function editedJourney(page) {
  await boot(page);
  const initial = await state(page);
  await page.locator('#fileTitleBtn').click();
  await page.locator('#libTeams').getByRole('button', { name: '+ 새 팀', exact: true }).click();
  await page.locator('#libFormInput').fill('출시 확인 팀');
  await page.locator('#libFormSubmit').click();
  await expect.poll(async () => (await state(page)).localLibrary.teams.some(team => team.name === '출시 확인 팀')).toBe(true);
  await page.locator('#librarySheet [data-lib="create-file"]').click();
  await page.locator('#libFormInput').fill('출시 확인 전술');
  await page.locator('#libFormSubmit').click();
  await expect.poll(async () => (await state(page)).localLibrary.fileId).not.toBe(initial.localLibrary.fileId);
  const fileId = (await state(page)).localLibrary.fileId;
  await page.locator('#libraryCloseBtn').click();
  await page.fill('#teamName', '저장 왕복 FC');
  await page.fill('#teamNote', '전방 압박과 전환 후 간격 유지');
  await run(page, 'select-player', { id: 1 });
  await page.locator('#playerActions').getByRole('button', { name: '이름', exact: true }).click();
  const player = page.locator('#field .player[data-id="1"]');
  await player.locator('input').fill('출시 확인 공격수');
  await player.locator('input').press('Enter');
  await page.locator('#playerActions').getByRole('button', { name: '색상·더보기', exact: true }).click();
  const yellow = await page.locator('#colorPalette button').evaluateAll(buttons => buttons.findIndex(button => getComputedStyle(button).backgroundColor === 'rgb(255, 214, 0)'));
  expect(yellow).toBeGreaterThanOrEqual(0);
  await page.locator('#colorPalette button').nth(yellow).click();
  await run(page, 'select-player', { id: 1 });
  await page.locator('#playerActions').getByRole('button', { name: '지침', exact: true }).click();
  await page.locator('#pnote_1').fill('공을 잃으면 즉시 압박');
  await player.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowDown');
  await page.click('#addPlayerBtn');
  expect((await run(page, 'retry-save')).status).toBe('success');
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
  const edited = await snapshot(page);
  expect(edited.team).toBe('저장 왕복 FC');
  expect(edited.roster).toHaveLength(4);
  expect(edited.roster[0].name).toBe('출시 확인 공격수');
  expect(edited.squads.basic.tn).toBe('전방 압박과 전환 후 간격 유지');
  expect(edited.squads.basic.pn['1']).toBe('공을 잃으면 즉시 압박');
  expect(edited.squads.basic.pos['1']).not.toEqual(fixture.squads.basic.pos['1']);
  return { initial, fileId, edited };
}

test('new team and tactic edits survive explicit save, restart and opening another file', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const { initial, fileId, edited } = await editedJourney(page);
  const saved = await raw(page);
  await page.reload();
  const restarted = await ready(page);
  expect(restarted.snapshot).toEqual(edited);
  expect(restarted.localLibrary.fileId).toBe(fileId);
  expect(await raw(page)).toEqual(saved);
  expect((await run(page, 'open-file', { id: initial.localLibrary.fileId })).status).toBe('success');
  expect(await snapshot(page)).toEqual(initial.snapshot);
  expect((await run(page, 'open-file', { id: fileId })).status).toBe('success');
  expect(await snapshot(page)).toEqual(edited);
  expect((await state(page)).localLibrary.items).toHaveLength(2);
  expect(errors).toEqual([]);
});

test('actual sq backup restores the complete edited document and survives restart', async ({ page }, testInfo) => {
  const { edited } = await editedJourney(page);
  const { bytes } = await exported(page, 'export-sq');
  await fs.writeFile(testInfo.outputPath('launch-roundtrip.sq'), bytes);
  expect(JSON.parse(bytes.toString('utf8'))).toEqual(edited);
  await page.fill('#teamName', '임시 변경');
  await page.click('#addPlayerBtn');
  await page.setInputFiles('#sqFileInput', { name: 'launch-roundtrip.sq', mimeType: 'application/json', buffer: bytes });
  await page.getByRole('alertdialog').locator('[data-r="0"]').click();
  expect((await snapshot(page)).team).toBe('임시 변경');
  await page.setInputFiles('#sqFileInput', { name: 'launch-roundtrip.sq', mimeType: 'application/json', buffer: bytes });
  await page.getByRole('alertdialog').locator('[data-r="1"]').click();
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
  expect(await snapshot(page)).toEqual(edited);
  await page.reload();
  expect((await ready(page)).snapshot).toEqual(edited);
});

test('edited portrait coordinates produce a real PNG after landscape rotation', async ({ page }, testInfo) => {
  const { edited } = await editedJourney(page);
  await page.setViewportSize({ width: 844, height: 390 });
  const before = await state(page), saved = await raw(page);
  const { bytes } = await exported(page, 'export-png');
  await fs.writeFile(testInfo.outputPath('journey-landscape.png'), bytes);
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1200, 1830]);
  const image = await page.evaluate(async ({ encoded, color }) => {
    const image = new Image();
    const loading = new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
    image.src = 'data:image/png;base64,' + encoded;
    await loading;
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    const rgb = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16));
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, count = 0;
    for (let y = 180; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const offset = (y * image.width + x) * 4;
      if (rgb.every((channel, i) => Math.abs(pixels[offset + i] - channel) <= 2) && pixels[offset + 3] === 255) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); count++;
      }
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, count };
  }, { encoded: bytes.toString('base64'), color: edited.roster[0].color });
  expect(image.count).toBeGreaterThan(500);
  expect(Math.abs(image.x - edited.squads.basic.pos['1'].x * 2.5)).toBeLessThanOrEqual(1.5);
  expect(Math.abs(image.y - (edited.squads.basic.pos['1'].y + 72) * 2.5)).toBeLessThanOrEqual(1.5);
  expect(await snapshot(page)).toEqual(before.snapshot);
  expect((await state(page)).view).toEqual(before.view);
  expect(await raw(page)).toEqual(saved);
});

function gifFrames(bytes) {
  expect(bytes.subarray(0, 6).toString()).toMatch(/^GIF8[79]a$/);
  let offset = 13 + ((bytes[10] & 128) ? 3 * (1 << ((bytes[10] & 7) + 1)) : 0);
  const frames = [], delays = [];
  const skipBlocks = () => { while (bytes[offset]) { offset += bytes[offset] + 1; expect(offset).toBeLessThan(bytes.length); } offset++; };
  while (offset < bytes.length) {
    const marker = bytes[offset++];
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = bytes[offset++];
      if (label === 0xf9) delays.push(bytes.readUInt16LE(offset + 2) * 10);
      skipBlocks();
    } else {
      expect(marker).toBe(0x2c);
      const packed = bytes[offset + 8];
      frames.push({ width: bytes.readUInt16LE(offset + 4), height: bytes.readUInt16LE(offset + 6) });
      offset += 9 + ((packed & 128) ? 3 * (1 << ((packed & 7) + 1)) : 0);
      offset++;
      skipBlocks();
    }
  }
  return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8), frames, delays };
}

test('real single and complete GIFs preserve every step and the saved source', async ({ page }, testInfo) => {
  const sample = copy(fixture);
  sample.pat.push({ n: '역습', bs: { x: 240, y: 330 }, s: [{ m: { '3': { x: 300, y: 440 } }, b: { x: 200, y: 400 } }] });
  await boot(page, sample);
  await page.setViewportSize({ width: 640, height: 360 });
  await page.locator('.app-tab[data-app="pattern"]').click();
  const before = await state(page), saved = await raw(page);
  for (const allPatterns of [false, true]) {
    const { bytes } = await exported(page, 'export-gif', { allPatterns });
    await fs.writeFile(testInfo.outputPath(allPatterns ? 'all-patterns.gif' : 'single-pattern.gif'), bytes);
    const decoded = gifFrames(bytes);
    const steps = allPatterns ? 3 : 2;
    expect([decoded.width, decoded.height]).toEqual([480, 732]);
    expect(decoded.frames).toHaveLength(steps * 39);
    expect(decoded.delays).toEqual(Array.from({ length: steps }, () => [...Array(31).fill(60), ...Array(8).fill(120)]).flat());
    expect(decoded.frames.every(frame => frame.width > 0 && frame.height > 0)).toBe(true);
    expect(await snapshot(page)).toEqual(before.snapshot);
    expect((await state(page)).view).toEqual(before.view);
    expect((await state(page)).export.busy).toBe(false);
    expect(await raw(page)).toEqual(saved);
  }
});

test('the edited share URL opens a read-only viewer and protects both local originals', async ({ page }) => {
  const { edited } = await editedJourney(page);
  const saved = await raw(page);
  const shared = await run(page, 'share-url');
  expect(shared).toMatchObject({ status: 'success', completion: 'url-created' });
  const viewer = await page.context().newPage();
  try {
    await stubExportCdn(viewer);
    await viewer.setViewportSize({ width: 640, height: 360 });
    await viewer.goto('/index.html' + new URL(shared.url).hash);
    const opened = await ready(viewer);
    expect(opened.view.readOnly).toBe(true);
    expect(opened.snapshot).toEqual(edited);
    await expect(viewer.locator('#viewerBar')).toBeVisible();
    await expect(viewer.locator('#addPlayerBtn')).toBeHidden();
    expect((await run(viewer, 'create-team', { name: 'Forbidden' })).code).toBe('read-only');
    expect((await run(viewer, 'select-player', { id: 1 })).code).toBe('read-only');
    await exported(viewer, 'export-png');
    await viewer.reload();
    expect((await ready(viewer)).snapshot).toEqual(edited);
    expect(await raw(viewer)).toEqual(saved);
    expect(await raw(page)).toEqual(saved);
  } finally { await viewer.close(); }
});

function denseSnapshot() {
  const sample = copy(fixture);
  sample.mode = '11v11';
  sample.roster = Array.from({ length: 11 }, (_, index) => ({ id: index + 1, name: '긴선수이름확인가나다라마바사' + (index + 1), color: ['#85b8e4', '#E53935', '#FFD600', '#ffffff', '#000000'][index % 5] }));
  const positions = [[240, 622], [90, 510], [190, 510], [290, 510], [390, 510], [120, 385], [240, 385], [360, 385], [90, 260], [240, 220], [390, 260]];
  for (const squad of Object.values(sample.squads)) {
    squad.f = '4-3-3';
    squad.pos = Object.fromEntries(positions.map(([x, y], index) => [index + 1, { x, y }]));
  }
  return sample;
}

async function layoutEvidence(page) {
  return page.evaluate(() => {
    const field = document.getElementById('field').getBoundingClientRect();
    const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const players = [...document.querySelectorAll('#field .player')];
    const names = players.map(player => {
      const name = player.querySelector('.player-name'), circle = player.querySelector('.player-circle');
      const n = name.getBoundingClientRect(), c = circle.getBoundingClientRect();
      const visible = getComputedStyle(name).visibility !== 'hidden' && Number(getComputedStyle(name).opacity) > 0 && n.width > 0 && n.height > 0;
      const overlaps = visible ? players.filter(other => other !== player).filter(other => {
        const r = other.querySelector('.player-circle').getBoundingClientRect();
        return Math.min(n.right, r.right) - Math.max(n.left, r.left) > 1 && Math.min(n.bottom, r.bottom) - Math.max(n.top, r.top) > 1;
      }).map(other => Number(other.dataset.id)) : [];
      return { id: Number(player.dataset.id), text: name.textContent, visible, overlaps,
        clipped: visible && (n.left < field.left - 1 || n.right > field.right + 1 || n.top < field.top - 1 || n.bottom > field.bottom + 1),
        centerHit: Number(document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2)?.closest('.player')?.dataset.id) };
    });
    return { overflow: document.documentElement.scrollWidth > innerWidth, field: rect(document.getElementById('field')), wrapper: rect(document.getElementById('fieldWrapper')), tools: rect(document.getElementById('playerActions')), names };
  });
}

test('small portrait supports player counts five through eleven without losing pitch or saved edits', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await boot(page, denseSnapshot());
  for (const count of [5, 6, 7, 8, 9, 10, 11]) {
    if ((await snapshot(page)).mode !== `${count}v${count}`) {
      expect((await confirmCommand(page, 'change-mode', { mode: `${count}v${count}` })).status).toBe('success');
    }
    while ((await snapshot(page)).roster.length < count) await page.click('#addPlayerBtn');
    const id = (await snapshot(page)).roster[0].id;
    await run(page, 'select-player', { id });
    const layout = await layoutEvidence(page);
    expect(layout.overflow).toBe(false);
    expect(layout.field.x).toBeGreaterThanOrEqual(-1);
    expect(layout.field.right).toBeLessThanOrEqual(361);
    expect(Math.abs(layout.field.width - layout.wrapper.width)).toBeLessThan(1);
    for (const player of (await snapshot(page)).roster) {
      await page.locator(`#field .player[data-id="${player.id}"] .player-circle`).click();
      await expect.poll(async () => (await state(page)).view.selectedPlayerId).toBe(player.id);
    }
    expect((await run(page, 'retry-save')).status).toBe('success');
    const saved = await snapshot(page);
    await page.reload();
    expect((await ready(page)).snapshot).toEqual(saved);
  }
  await page.screenshot({ path: testInfo.outputPath('small-portrait.png'), fullPage: true });
});

test('small landscape keeps every full name accessible through actual player taps and restores portrait labels', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await boot(page, denseSnapshot());
  const before = await state(page), saved = await raw(page);
  await run(page, 'select-player', { id: 1 });
  await expect.poll(() => page.locator('#field').evaluate(element => element.getBoundingClientRect().width > element.getBoundingClientRect().height)).toBe(true);
  const layout = await layoutEvidence(page);
  expect(layout.overflow).toBe(false);
  expect(layout.field.x).toBeGreaterThanOrEqual(-1);
  expect(layout.field.right).toBeLessThanOrEqual(641);
  expect(layout.field.bottom).toBeLessThanOrEqual(361);
  expect(layout.names.map(name => name.centerHit)).toEqual(layout.names.map(name => name.id));
  expect(layout.names.filter(name => name.clipped || name.overlaps.length)).toEqual([]);
  const session = await page.context().newCDPSession(page);
  const selectedNames = [];
  try {
    for (const [index, player] of before.snapshot.roster.entries()) {
      const element = page.locator(`#field .player[data-id="${player.id}"]`);
      await expect(element).toHaveAttribute('role', 'button');
      await expect(element).toHaveAccessibleName(`${index + 1} ${player.name}, 선수 편집`);
      await expect(element.locator('.player-compact-name')).toHaveText(player.name);
      await expect(element.locator('.player-name')).toBeHidden();
      const circle = await element.locator('.player-circle').boundingBox();
      expect(circle.x).toBeGreaterThanOrEqual(-1);
      expect(circle.y).toBeGreaterThanOrEqual(-1);
      expect(circle.x + circle.width).toBeLessThanOrEqual(641);
      expect(circle.y + circle.height).toBeLessThanOrEqual(361);
      const x = circle.x + circle.width / 2, y = circle.y + circle.height / 2;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 91 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(async () => (await state(page)).view.selectedPlayerId).toBe(player.id);
      const fullName = page.locator('#playerActionsName');
      await expect(fullName).toHaveText(`${index + 1}. ${player.name}`);
      const display = await fullName.evaluate(element => {
        const r = element.getBoundingClientRect(), style = getComputedStyle(element);
        return { whiteSpace: style.whiteSpace, overflow: style.overflow, textOverflow: style.textOverflow,
          clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
          clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
          x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      });
      if (index === 0) {
        await page.screenshot({ path: testInfo.outputPath('first-selected-full-name.png'), fullPage: true });
        await fs.writeFile(testInfo.outputPath('first-selected-name-layout.json'), JSON.stringify({ player, display }, null, 2));
      }
      expect(display.whiteSpace).toBe('normal');
      expect(display.scrollWidth).toBeLessThanOrEqual(display.clientWidth + 1);
      expect(display.scrollHeight).toBeLessThanOrEqual(display.clientHeight + 1);
      expect(display.textOverflow).not.toBe('ellipsis');
      expect(display.x).toBeGreaterThanOrEqual(-1);
      expect(display.right).toBeLessThanOrEqual(641);
      expect(display.bottom).toBeLessThanOrEqual(361);
      selectedNames.push({ id: player.id, name: player.name, display });
    }
  } finally { await session.detach(); }
  const selected = await state(page);
  expect(selected.snapshot).toEqual(before.snapshot);
  expect(selected.revision).toBe(before.revision);
  expect(selected.savedRevision).toBe(before.savedRevision);
  expect(selected.undoAvailable).toBe(before.undoAvailable);
  expect(await raw(page)).toEqual(saved);
  await page.screenshot({ path: testInfo.outputPath('small-landscape-full-name-selection.png'), fullPage: true });
  await fs.writeFile(testInfo.outputPath('small-landscape-layout.json'), JSON.stringify({ layout, selectedNames }, null, 2));
  await page.setViewportSize({ width: 360, height: 640 });
  await expect.poll(async () => (await layoutEvidence(page)).names.every(name => name.visible)).toBe(true);
  await expect(page.locator('#field .player-name')).toHaveText(before.snapshot.roster.map(player => player.name));
  await expect.poll(async () => {
    const portrait = await layoutEvidence(page);
    return portrait.field.bottom <= portrait.tools.y + 1;
  }).toBe(true);
  const portraitSession = await page.context().newCDPSession(page);
  const portraitSelections = [];
  try {
    for (const [index, player] of before.snapshot.roster.entries()) {
      const element = page.locator(`#field .player[data-id="${player.id}"]`);
      await expect(element).toHaveAccessibleName(`${index + 1} ${player.name}, 선수 편집`);
      await element.locator('.player-circle').scrollIntoViewIfNeeded();
      const circle = await element.locator('.player-circle').boundingBox();
      const x = circle.x + circle.width / 2, y = circle.y + circle.height / 2;
      expect(circle.x).toBeGreaterThanOrEqual(-1);
      expect(circle.y).toBeGreaterThanOrEqual(-1);
      expect(circle.x + circle.width).toBeLessThanOrEqual(361);
      expect(circle.y + circle.height).toBeLessThanOrEqual(641);
      const hitId = await page.evaluate(({ x, y }) => Number(document.elementFromPoint(x, y)?.closest('.player')?.dataset.id), { x, y });
      expect(hitId).toBe(player.id);
      await portraitSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 92 }] });
      await portraitSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(async () => (await state(page)).view.selectedPlayerId).toBe(player.id);
      const fullName = page.locator('#playerActionsName');
      await expect(fullName).toHaveText(`${index + 1}. ${player.name}`);
      await fullName.scrollIntoViewIfNeeded();
      const display = await fullName.evaluate(element => {
        const r = element.getBoundingClientRect();
        return { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
          clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
          x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      });
      if (index === 0) {
        await page.screenshot({ path: testInfo.outputPath('first-portrait-full-name.png'), fullPage: true });
        await fs.writeFile(testInfo.outputPath('first-portrait-name-layout.json'), JSON.stringify({ player, display }, null, 2));
      }
      expect(display.scrollWidth).toBeLessThanOrEqual(display.clientWidth + 1);
      expect(display.scrollHeight).toBeLessThanOrEqual(display.clientHeight + 1);
      expect(display.x).toBeGreaterThanOrEqual(-1);
      expect(display.y).toBeGreaterThanOrEqual(-1);
      expect(display.right).toBeLessThanOrEqual(361);
      expect(display.bottom).toBeLessThanOrEqual(641);
      const portrait = await layoutEvidence(page);
      expect(portrait.field.bottom).toBeLessThanOrEqual(portrait.tools.y + 1);
      portraitSelections.push({ id: player.id, name: player.name, hitId, circle, display });
    }
  } finally { await portraitSession.detach(); }
  const restored = await state(page);
  expect(restored.snapshot).toEqual(before.snapshot);
  expect(restored.revision).toBe(before.revision);
  expect(restored.savedRevision).toBe(before.savedRevision);
  expect(restored.undoAvailable).toBe(before.undoAvailable);
  expect(restored.storage).toEqual(before.storage);
  expect(await raw(page)).toEqual(saved);
  await fs.writeFile(testInfo.outputPath('portrait-label-layout.json'), JSON.stringify({ layout: await layoutEvidence(page), portraitSelections }, null, 2));
  await page.screenshot({ path: testInfo.outputPath('portrait-labels-restored.png'), fullPage: true });
});
test('cancelled pattern player and ball gestures leave steps and both saved originals intact', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await boot(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  const before = await state(page), saved = await raw(page);
  const box = await page.locator('#patternCanvas').boundingBox();
  const scale = box.width / 660;
  for (const point of [{ x: 240, y: 240 }, { x: 240, y: 330 }]) {
    const x = box.x + (660 - point.y) * scale, y = box.y + point.x * scale;
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 81 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y: y + 10, id: 81 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    } finally { await session.detach(); }
    expect(await snapshot(page)).toEqual(before.snapshot);
    expect((await state(page)).revision).toBe(before.revision);
    expect(await raw(page)).toEqual(saved);
  }
});