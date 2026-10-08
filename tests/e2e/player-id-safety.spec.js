const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const LS_KEY = 'squad-maker-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const snap = page => page.evaluate(() => JSON.parse(JSON.stringify(buildStateSnap())));
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), LS_KEY);

function withPlayers(ids) {
  const state = clone(fixture);
  state.roster = ids.map((id, i) => ({
    id, name: '기존 선수' + (i + 1), color: i % 2 ? '#00C853' : '#E53935',
  }));
  for (const [type, sq] of Object.entries(state.squads)) {
    sq.tn = type + ' 팀 지침';
    sq.pos = Object.fromEntries(ids.map((id, i) => [id, { x: 80 + i * 90, y: 140 + i * 110 }]));
    sq.pn = Object.fromEntries(ids.map(id => [id, type + ' 선수 ' + id + ' 지침']));
  }
  state.pat = [{
    n: '보존할 다단계 패턴', bs: { x: 180, y: 310 },
    s: [
      { m: Object.fromEntries(ids.map((id, i) => [id, { x: 70 + i * 80, y: 180 + i * 90 }])), b: { x: 110, y: 210 } },
      { m: Object.fromEntries(ids.map((id, i) => [id, { x: 90 + i * 70, y: 230 + i * 80 }])), b: { x: 150, y: 280 } },
    ],
  }];
  return state;
}

async function importFile(page, state) {
  await page.setInputFiles('#sqFileInput', {
    name: 'player-ids.sq', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(state)),
  });
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.locator('.dlg [data-r="1"]').click();
  await expect.poll(async () => (await stored(page)).roster.map(r => r.id))
    .toEqual(state.roster.map(r => r.id));
}

function expectUniqueSafeIds(state) {
  const ids = state.roster.map(r => r.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every(id => Number.isSafeInteger(id) && id > 0)).toBe(true);
}

function expectExistingPreserved(before, after) {
  expectUniqueSafeIds(after);
  const ids = new Set(before.roster.map(r => r.id));
  expect(after.roster.filter(r => ids.has(r.id))).toEqual(before.roster);
  expect(after.team).toBe(before.team);
  expect(after.mode).toBe(before.mode);
  expect(after.squad).toBe(before.squad);
  for (const type of ['basic', 'attack', 'defense']) {
    expect(after.squads[type].f).toBe(before.squads[type].f);
    expect(after.squads[type].tn).toBe(before.squads[type].tn);
    expect(after.squads[type].pn).toEqual(before.squads[type].pn);
    for (const { id } of before.roster) {
      expect(after.squads[type].pos[id]).toEqual(before.squads[type].pos[id]);
    }
  }
  expect(after.pat).toEqual(before.pat);
}

async function addTwiceAndReload(page, before) {
  await page.click('#addPlayerBtn');
  await page.click('#addPlayerBtn');
  const after = await snap(page);
  expect(after.roster).toHaveLength(before.roster.length + 2);
  expectExistingPreserved(before, after);
  await expect.poll(() => stored(page)).toEqual(after);
  const normalized = await page.evaluate(value => normalizeSnapshot(value), after);
  expect(normalized).toEqual(after);
  await page.reload();
  expect(await snap(page)).toEqual(after);
  await expect(page.locator('#field .player')).toHaveCount(after.roster.length);
  expect((await page.evaluate(() => SquadMakerContract.getState())).storage.status).toBe('saved');
  return after;
}

test.beforeEach(async ({ page }) => {
  await stubExportCdn(page);
  await page.goto('/index.html');
});

test('sparse restored player IDs stay unique across consecutive additions and reload', async ({ page }) => {
  await importFile(page, withPlayers([1, 3]));
  const before = await snap(page);
  await addTwiceAndReload(page, before);
});

test('deleted ID is clean when reused after reload and consecutive additions', async ({ page }) => {
  await importFile(page, withPlayers([1, 2, 3]));
  await page.evaluate(() => { selectPlayerForEdit(2); ctxRemove(); });
  const removed = await snap(page);
  expect(removed.roster.map(r => r.id)).toEqual([1, 3]);
  for (const sq of Object.values(removed.squads)) {
    expect(sq.pos).not.toHaveProperty('2');
    expect(sq.pn).not.toHaveProperty('2');
  }
  for (const pt of removed.pat) for (const step of pt.s) {
    expect(step.m).not.toHaveProperty('2');
  }
  await expect.poll(() => stored(page)).toEqual(removed);
  await page.reload();
  expect(await snap(page)).toEqual(removed);
  const after = await addTwiceAndReload(page, removed);
  for (const sq of Object.values(after.squads)) expect(sq.pn).not.toHaveProperty('2');
  for (const pt of after.pat) for (const step of pt.s) expect(step.m).not.toHaveProperty('2');
});

test('empty restored roster supports consecutive additions and restart', async ({ page }) => {
  await importFile(page, withPlayers([]));
  await addTwiceAndReload(page, await snap(page));
});

test('near maximum safe IDs preserve their references during consecutive additions', async ({ page }) => {
  await importFile(page, withPlayers([1, Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER]));
  await addTwiceAndReload(page, await snap(page));
});

test('ID allocation respects the restored mode capacity without changing saved data', async ({ page }) => {
  await importFile(page, withPlayers([1, 3, 5, 7, 9, 11, 13]));
  const after = await addTwiceAndReload(page, await snap(page));
  await expect(page.locator('#addPlayerBtn')).toBeDisabled();
  await page.evaluate(() => addPlayer());
  expect(await snap(page)).toEqual(after);
  expect(await stored(page)).toEqual(after);
});
