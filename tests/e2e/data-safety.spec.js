const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const LS_KEY = 'squad-maker-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const snap = page => page.evaluate(() => JSON.parse(JSON.stringify(buildStateSnap())));
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), LS_KEY);

async function seed(page, state = fixture) {
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract?.run('retry-save'));
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [LS_KEY, JSON.stringify(state)]);
  await page.reload();
}

async function confirm(page, accept = true) {
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.locator(`.dlg [data-r="${accept ? 1 : 0}"]`).click();
}

async function upload(page, state) {
  await page.setInputFiles('#sqFileInput', {
    name: 'import.sq', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(state)),
  });
}

test.beforeEach(async ({ page }) => {
  await stubExportCdn(page);
  await seed(page);
});

for (const only of ['names', 'colors', 'positions', 'patterns']) {
  test(`mode change protects ${only} without notes`, async ({ page }) => {
    await page.evaluate(key => { flushSave(); localStorage.removeItem(key); }, LS_KEY);
    await page.reload();
    const state = await snap(page);
    if (only === 'names') state.roster[0].name = '이름만 변경';
    if (only === 'colors') state.roster[0].color = '#E53935';
    if (only === 'positions') state.squads.attack.pos['1'] = { x: 90, y: 190 };
    if (only === 'patterns') state.pat[0].s[0].m['1'] = { x: 140, y: 180 };
    await seed(page, state);
    const before = await snap(page);
    await page.locator('.mode-pill').filter({ hasText: '5vs5' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('이름');
    await expect(page.getByRole('alertdialog')).toContainText('패턴');
    await confirm(page, false);
    expect(await snap(page)).toEqual(before);
    await page.reload();
    expect(await snap(page)).toEqual(before);
  });
}

test('mode change and undo persist every squad, note and pattern', async ({ page }) => {
  const before = await snap(page);
  await page.locator('.mode-pill').filter({ hasText: '5vs5' }).click();
  await confirm(page);
  await expect.poll(() => stored(page)).toMatchObject({ mode: '5v5' });
  await page.getByRole('button', { name: '되돌리기', exact: true }).click();
  await expect.poll(() => stored(page)).toEqual(before);
  await page.reload();
  expect(await snap(page)).toEqual(before);
});

for (const squad of ['basic', 'attack', 'defense']) {
  test(`reset ${squad} confirms scope, cancels and undoes`, async ({ page }) => {
    await page.locator(`.squad-tab[data-squad="${squad}"]`).click();
    const before = await snap(page);
    await page.getByRole('button', { name: '포메이션 초기화', exact: true }).click();
    await confirm(page, false);
    expect(await snap(page)).toEqual(before);
    await page.getByRole('button', { name: '포메이션 초기화', exact: true }).click();
    await confirm(page);
    const after = await snap(page);
    expect(after.squads[squad].pos).not.toEqual(before.squads[squad].pos);
    for (const other of ['basic', 'attack', 'defense'].filter(k => k !== squad)) {
      expect(after.squads[other]).toEqual(before.squads[other]);
    }
    expect(after.roster).toEqual(before.roster);
    expect(after.pat).toEqual(before.pat);
    expect(after.squads[squad].tn).toEqual(before.squads[squad].tn);
    expect(after.squads[squad].pn).toEqual(before.squads[squad].pn);
    await expect.poll(() => stored(page)).toEqual(after);
    await page.getByRole('button', { name: '되돌리기', exact: true }).click();
    await expect.poll(() => stored(page)).toEqual(before);
    await page.reload();
    expect(await snap(page)).toEqual(before);
  });
}

test('.sq import is immediately saved and survives reload', async ({ page }) => {
  const incoming = { ...clone(fixture), team: '새로 복원한 팀', squad: 'attack' };
  await upload(page, incoming);
  await confirm(page);
  await expect(page.locator('#teamName')).toHaveValue(incoming.team);
  const imported = await snap(page);
  await expect.poll(() => stored(page), { timeout: 1800 }).toEqual(imported);
  await page.reload();
  expect(await snap(page)).toEqual(imported);
});

test('storage quota failure rolls back protected mutation and retains saved bytes', async ({ page }) => {
  const before = await snap(page);
  const raw = await page.evaluate(key => localStorage.getItem(key), LS_KEY);
  await page.evaluate(key => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v) {
      if (k === key) throw new DOMException('Injected quota failure', 'QuotaExceededError');
      return write.call(this, k, v);
    };
  }, LS_KEY);
  await page.locator('.mode-pill').filter({ hasText: '5vs5' }).click();
  await confirm(page);
  await expect(page.locator('#saveStatus')).toContainText('저장 실패');
  expect(await snap(page)).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), LS_KEY)).toBe(raw);
});

test('.sq cancellation and undo preserve selection and restart data', async ({ page }) => {
  await page.evaluate(() => selectPlayerForEdit(2));
  const before = await snap(page), incoming = { ...clone(fixture), team: '가져온 팀', squad: 'defense' };
  await upload(page, incoming);
  await confirm(page, false);
  expect(await snap(page)).toEqual(before);
  expect((await page.evaluate(() => SquadMakerContract.getState())).view.selectedPlayerId).toBe(2);
  await upload(page, incoming);
  await confirm(page);
  await expect(page.locator('#teamName')).toHaveValue(incoming.team);
  await page.getByRole('button', { name: '되돌리기', exact: true }).click();
  expect((await page.evaluate(() => SquadMakerContract.getState())).view.selectedPlayerId).toBe(2);
  expect(await stored(page)).toEqual(before);
  await page.reload();
  expect(await snap(page)).toEqual(before);
});

test('import with pending edits stores the accepted file, not the earlier timer', async ({ page }) => {
  await page.fill('#teamName', '대기 중인 편집');
  await upload(page, { ...clone(fixture), team: '최종 복원본' });
  await confirm(page);
  await expect(page.locator('#teamName')).toHaveValue('최종 복원본');
  await page.waitForTimeout(750);
  expect((await stored(page)).team).toBe('최종 복원본');
  await page.reload();
  await expect(page.locator('#teamName')).toHaveValue('최종 복원본');
});

for (const invalid of ['json', 'version', 'roster', 'duplicate-id', 'missing-squad', 'coordinate', 'note', 'patterns']) {
  test(`invalid ${invalid} file cannot partially mutate memory or storage`, async ({ page }) => {
    const incoming = { ...clone(fixture), team: '절대 적용되면 안 되는 팀', mode: '5v5' };
    if (invalid === 'version') incoming.v = 2;
    if (invalid === 'roster') incoming.roster = {};
    if (invalid === 'duplicate-id') incoming.roster[1].id = incoming.roster[0].id;
    if (invalid === 'missing-squad') delete incoming.squads.attack;
    if (invalid === 'coordinate') incoming.squads.basic.pos['1'].x = 'bad';
    if (invalid === 'note') incoming.squads.basic.tn = {};
    if (invalid === 'patterns') incoming.pat = {};
    await page.evaluate(() => selectPlayerForEdit(2));
    const before = await snap(page), raw = await page.evaluate(key => localStorage.getItem(key), LS_KEY);
    await page.setInputFiles('#sqFileInput', {
      name: 'invalid.sq', mimeType: 'application/json',
      buffer: Buffer.from(invalid === 'json' ? '{broken' : JSON.stringify(incoming)),
    });
    await expect(page.locator('#_toast')).toContainText('기존 전술은 유지');
    expect(await snap(page)).toEqual(before);
    expect(await page.evaluate(key => localStorage.getItem(key), LS_KEY)).toBe(raw);
    expect((await page.evaluate(() => SquadMakerContract.getState())).view.selectedPlayerId).toBe(2);
    expect(await page.getByRole('alertdialog').count()).toBe(0);
  });
}

for (const raw of ['{broken', JSON.stringify({ v: 2, team: 'future' })]) {
  test(`unreadable startup bytes stay protected: ${raw.slice(0, 10)}`, async ({ page }) => {
    await page.evaluate(value => localStorage.setItem('squad-maker-v1', value), raw);
    await page.reload();
    await expect(page.locator('#saveStatus')).toContainText('원본을 보호');
    await page.fill('#teamName', '저장 차단 상태의 편집');
    await page.waitForTimeout(750);
    const result = await page.evaluate(() => SquadMakerContract.run('retry-save'));
    expect(result.code).toBe('storage-read-blocked');
    expect(await page.evaluate(key => localStorage.getItem(key), LS_KEY)).toBe(raw);
    await upload(page, fixture);
    await confirm(page);
    await page.reload();
    await expect(page.locator('#teamName')).toHaveValue(fixture.team);
  });
}

test('legacy single-step pattern imports and persists as v:1 steps', async ({ page }) => {
  const incoming = clone(fixture);
  incoming.pat = [{ n: '구형 패턴', m: { '1': { x: 150, y: 250 } } }];
  await upload(page, incoming);
  await confirm(page);
  const imported = await snap(page);
  expect(imported.pat[0].s).toEqual([{ m: { '1': { x: 150, y: 250 } }, b: null }]);
  await page.reload();
  expect(await snap(page)).toEqual(imported);
});

test('readback failure restores saved bytes and protected runtime', async ({ page }) => {
  const before = await snap(page), raw = await page.evaluate(key => localStorage.getItem(key), LS_KEY);
  await page.evaluate(key => {
    const read = Storage.prototype.getItem, write = Storage.prototype.setItem;
    let failNextRead = false, injected = false;
    Storage.prototype.setItem = function(k, v) {
      write.call(this, k, v);
      if (k === key && !injected) { failNextRead = true; injected = true; }
    };
    Storage.prototype.getItem = function(k) {
      if (k === key && failNextRead) { failNextRead = false; throw new DOMException('Injected read failure', 'SecurityError'); }
      return read.call(this, k);
    };
    window.restoreStorageRead = () => { Storage.prototype.getItem = read; Storage.prototype.setItem = write; };
  }, LS_KEY);
  await upload(page, { ...clone(fixture), team: '저장 실패 복원본' });
  await confirm(page);
  await expect(page.locator('#saveStatus')).toContainText('저장 실패');
  await page.evaluate(() => window.restoreStorageRead());
  expect(await snap(page)).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), LS_KEY)).toBe(raw);
  await page.reload();
  expect(await snap(page)).toEqual(before);
});

test('undo save failure retains new data and the retryable recovery point', async ({ page }) => {
  await page.locator('.mode-pill').filter({ hasText: '5vs5' }).click();
  await confirm(page);
  const changed = await snap(page);
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function() { throw new DOMException('Injected quota failure', 'QuotaExceededError'); };
    window.restoreStorageWrite = () => { Storage.prototype.setItem = write; };
  });
  const failure = await page.evaluate(() => SquadMakerContract.run('undo'));
  expect(failure.status).toBe('error');
  expect(await snap(page)).toEqual(changed);
  expect((await page.evaluate(() => SquadMakerContract.getState())).undoAvailable).toBe(true);
  await page.evaluate(() => window.restoreStorageWrite());
  expect((await page.evaluate(() => SquadMakerContract.run('undo'))).status).toBe('success');
  await page.reload();
  await expect(page.locator('#teamName')).toHaveValue(fixture.team);
  expect((await snap(page)).mode).toBe(fixture.mode);
});

test('rollback verification failure blocks all further implicit writes', async ({ page }) => {
  const before = await snap(page);
  await page.evaluate(key => {
    const read = Storage.prototype.getItem, write = Storage.prototype.setItem;
    let writes = 0;
    Storage.prototype.setItem = function(k, value) {
      if (k !== key) return write.call(this, k, value);
      writes++;
      if (writes > 1) throw new DOMException('Injected rollback quota failure', 'QuotaExceededError');
      write.call(this, k, value);
    };
    Storage.prototype.getItem = function(k) {
      if (k === key && writes === 1) throw new DOMException('Injected read failure', 'SecurityError');
      return read.call(this, k);
    };
    window.safetyWriteCount = () => writes;
  }, LS_KEY);
  await page.locator('.mode-pill').filter({ hasText: '5vs5' }).click();
  await confirm(page);
  await expect(page.locator('#saveStatus')).toContainText('자동저장을 중단');
  const state = await page.evaluate(() => SquadMakerContract.getState());
  expect(state.storage).toEqual({ status: 'blocked', error: 'storage-rollback-failed', retryable: false });
  expect(await snap(page)).toEqual(before);
  const writes = await page.evaluate(() => window.safetyWriteCount());
  await page.fill('#teamName', '잠긴 저장소 편집');
  expect((await page.evaluate(() => SquadMakerContract.run('retry-save'))).code).toBe('storage-read-blocked');
  expect(await page.evaluate(() => window.safetyWriteCount())).toBe(writes);
});

test('read-only explicit import requires storage verification before navigation', async ({ page }) => {
  const raw = await page.evaluate(key => localStorage.getItem(key), LS_KEY);
  const shared = { ...clone(fixture), team: '공유에서 가져올 팀' };
  const encoded = Buffer.from(JSON.stringify(shared)).toString('base64url');
  await page.goto('/index.html#s=' + encoded);
  await page.reload();
  await page.evaluate(key => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, value) { if (k !== key) write.call(this, k, value); };
  }, LS_KEY);
  await page.locator('#viewerBar button').filter({ hasText: '내 스쿼드로 가져오기' }).click();
  await confirm(page);
  await expect(page.locator('#_toast')).toContainText('저장 실패');
  await expect(page).toHaveURL(/#s=/);
  await expect(page.locator('body')).toHaveClass(/viewer-mode/);
  expect(await page.evaluate(key => localStorage.getItem(key), LS_KEY)).toBe(raw);
});

test('large valid player IDs remain safe after adding and restarting', async ({ page }) => {
  const incoming = clone(fixture), id = Number.MAX_SAFE_INTEGER;
  incoming.roster = [{ id, name: '기존 고유 ID', color: '#1E88E5' }];
  for (const sq of Object.values(incoming.squads)) { sq.pos = { [id]: { x: 240, y: 330 } }; sq.pn = {}; }
  await upload(page, incoming);
  await confirm(page);
  await page.click('#addPlayerBtn');
  await expect.poll(async () => (await stored(page)).roster.length).toBe(2);
  expect((await snap(page)).roster.every(r => Number.isSafeInteger(r.id))).toBe(true);
  await page.reload();
  await expect(page.locator('#field .player')).toHaveCount(2);
  expect((await page.evaluate(() => SquadMakerContract.getState())).storage.status).toBe('saved');
});
