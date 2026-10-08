const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');
const contractFixture = require('../fixtures/ui-contract-v1.json');

const LS_KEY = 'squad-maker-v1';
const state = page => page.evaluate(() => window.SquadMakerContract.getState());
const storedRaw = page => page.evaluate(key => localStorage.getItem(key), LS_KEY);
const run = (page, operation, payload) => page.evaluate(
  ([command, input]) => window.SquadMakerContract.run(command, input),
  [operation, payload]
);

// Seed once, so navigation proves persistence instead of reinjecting the fixture.
async function seed(page) {
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.run('retry-save'));
  await page.evaluate(([key, value]) => localStorage.setItem(key, value),
    [LS_KEY, JSON.stringify(fixture)]);
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.SquadMakerContract?.version)).toBe(2);
}

function expectResult(result, operation, status, completion = null) {
  expect(result).toMatchObject({ contractVersion: 2, operation, status, completion });
  expect(result).toHaveProperty('code');
  expect(Number.isInteger(result.revision)).toBe(true);
  expect(result.revision).toBeGreaterThanOrEqual(0);
  expect(result.savedRevision === null || Number.isInteger(result.savedRevision)).toBe(true);
}

async function editTeamName(page, name) {
  return page.evaluate(value => {
    const input = document.getElementById('teamName');
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return window.SquadMakerContract.getState();
  }, name);
}

test.beforeEach(async ({ page }) => {
  await stubExportCdn(page);
  await seed(page);
});

test('getState returns independent copies of the complete runtime state', async ({ page }) => {
  const before = await state(page);
  expect(before.contractVersion).toBe(2);
  expect(before.snapshot.v).toBe(1);
  expect(before.snapshot).toMatchObject(fixture);
  await page.evaluate(() => {
    const copy = window.SquadMakerContract.getState();
    copy.snapshot.roster[0].name = 'External edit';
    copy.snapshot.squads.basic.pos['1'].x = -1000;
    copy.snapshot.squads.basic.pn['1'] = 'External note';
    copy.snapshot.pat[0].s[0].m['1'].x = -1000;
    copy.view.selectedPlayerId = 999;
    copy.storage.status = 'error';
    copy.localLibrary.items.push({ id: 'external' });
    copy.localLibrary.slots.limit = 99;
  });
  expect(await state(page)).toEqual(before);
});

test('subscribe delivers immediately, follows selection and stops after unsubscribe', async ({ page }) => {
  const before = await state(page);
  const initial = await page.evaluate(() => {
    window.__contractStates = [];
    window.__unsubscribeContract = window.SquadMakerContract.subscribe(value => {
      window.__contractStates.push(value);
    });
    return window.__contractStates;
  });
  expect(initial).toEqual([before]);
  const selected = await run(page, 'select-player', { id: fixture.roster[0].id });
  expectResult(selected, 'select-player', 'success');
  await expect.poll(() => page.evaluate(() => {
    const states = window.__contractStates;
    return states[states.length - 1].view.selectedPlayerId;
  })).toBe(fixture.roster[0].id);
  const count = await page.evaluate(() => {
    window.__unsubscribeContract();
    return window.__contractStates.length;
  });
  await run(page, 'select-player', { id: fixture.roster[1].id });
  expect(await page.evaluate(() => window.__contractStates.length)).toBe(count);
  expect((await state(page)).snapshot).toEqual(before.snapshot);
});

test('selected player identity survives rename and uses the current roster name', async ({ page }) => {
  const id = fixture.roster[0].id;
  const before = await state(page);
  await run(page, 'select-player', { id });
  expect((await state(page)).view).toMatchObject({
    selectedPlayerId: id, selectedPlayerName: fixture.roster[0].name,
  });
  expect((await state(page)).revision).toBe(before.revision);
  await page.locator('#playerActions').getByRole('button', { name: '이름', exact: true }).click();
  const nameInput = page.locator(`#field .player[data-id="${id}"] input`);
  await nameInput.fill('새 이름');
  await nameInput.press('Enter');
  await expect.poll(async () => (await state(page)).view.selectedPlayerName).toBe('새 이름');
  expect((await state(page)).view.selectedPlayerId).toBe(id);
  await expect(page.locator('#playerActionsName')).toContainText('새 이름');
  await expect(page.locator(`#field .player[data-id="${id}"] .player-name`)).toHaveText('새 이름');
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
  const edited = await state(page);
  expect(edited.snapshot.roster.find(player => player.id === id).name).toBe('새 이름');
  expect(edited.revision).toBeGreaterThan(before.revision);
  expect(edited.savedRevision).toBe(edited.revision);
  await page.reload();
  expect((await state(page)).snapshot.roster.find(player => player.id === id).name).toBe('새 이름');
});

test('switch-squad changes the payload revision and saves all three squads together', async ({ page }) => {
  await run(page, 'select-player', { id: fixture.roster[0].id });
  const before = await state(page);
  const result = await run(page, 'switch-squad', { squad: 'attack' });
  expectResult(result, 'switch-squad', 'success');
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
  const after = await state(page);
  expect(after.snapshot.squad).toBe('attack');
  expect(after.snapshot.mode).toBe(before.snapshot.mode);
  expect(after.view.appMode).toBe('squad');
  expect(after.view.selectedPlayerId).toBe(before.view.selectedPlayerId);
  expect(after.revision).toBeGreaterThan(before.revision);
  expect(after.savedRevision).toBe(after.revision);
  expect(after.snapshot.squads).toEqual(before.snapshot.squads);
  expect(after.snapshot.roster).toEqual(before.snapshot.roster);
  expect(after.snapshot.pat).toEqual(before.snapshot.pat);
  const saved = JSON.parse(await storedRaw(page));
  expect(saved).toEqual(after.snapshot);
  expect(saved).not.toHaveProperty('revision');
  expect(saved).not.toHaveProperty('fileId');
  await page.reload();
  expect((await state(page)).snapshot.squad).toBe('attack');
});

test('ordinary edits publish pending, saving and saved for the same revision', async ({ page }) => {
  await page.evaluate(() => {
    window.__saveStates = [];
    window.SquadMakerContract.subscribe(value => window.__saveStates.push({
      status: value.storage.status, revision: value.revision, savedRevision: value.savedRevision,
    }));
  });
  const before = await state(page);
  const pending = await editTeamName(page, 'Contract saved team');
  expect(pending.storage.status).toBe('pending');
  expect(pending.revision).toBeGreaterThan(before.revision);
  expect(pending.savedRevision).toBe(before.savedRevision);
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
  const saved = await state(page);
  expect(saved.savedRevision).toBe(saved.revision);
  expect(saved.revision).toBe(pending.revision);
  expect(JSON.parse(await storedRaw(page))).toEqual(saved.snapshot);
  const statuses = await page.evaluate(() => window.__saveStates.map(value => value.status));
  expect(statuses).toEqual(expect.arrayContaining(['pending', 'saving', 'saved']));
});

test('quota errors retain saved bytes and retry saves the current edit', async ({ page }) => {
  const before = await state(page);
  const raw = await storedRaw(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    window.__restoreStorageWrite = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function(k, value) {
      if (k === key) throw new DOMException('Injected quota failure', 'QuotaExceededError');
      return original.call(this, k, value);
    };
  }, LS_KEY);
  await editTeamName(page, 'Unsaved contract team');
  await expect.poll(async () => (await state(page)).storage.status).toBe('error');
  const failed = await state(page);
  expect(failed.storage).toMatchObject({ error: 'storage-quota', retryable: true });
  expect(failed.snapshot.team).toBe('Unsaved contract team');
  expect(failed.savedRevision).toBe(before.savedRevision);
  expect(await storedRaw(page)).toBe(raw);
  const failedRetry = await run(page, 'retry-save');
  expectResult(failedRetry, 'retry-save', 'error');
  expect(failedRetry.code).toBe('storage-quota');
  expect(await storedRaw(page)).toBe(raw);
  await page.evaluate(() => window.__restoreStorageWrite());
  const retry = await run(page, 'retry-save');
  expectResult(retry, 'retry-save', 'success');
  const saved = await state(page);
  expect(saved.storage).toMatchObject({ status: 'saved', error: null, retryable: false });
  expect(saved.revision).toBe(failed.revision);
  expect(saved.savedRevision).toBe(saved.revision);
  expect(JSON.parse(await storedRaw(page))).toEqual(saved.snapshot);
  await page.reload();
  expect((await state(page)).snapshot.team).toBe('Unsaved contract team');
});

test('preview library is unlimited while purchases and generic native commands stay unsupported', async ({ page }) => {
  const before = await state(page);
  const raw = await storedRaw(page);
  expect(before.localLibrary).toMatchObject({
    supported: true, slots: { status: 'available', limit: null, used: 1, policy: 'preview-unlimited' },
  });
  expect(before.localLibrary.teams).toHaveLength(1);
  expect(before.localLibrary.items).toHaveLength(1);
  expect(before.localLibrary.fileId).toBe(before.localLibrary.items[0].id);
  for (const operation of ['restore-purchase', 'share-native']) {
    const result = await run(page, operation);
    expectResult(result, operation, 'unsupported');
    expect(result.code).toBe('unsupported-operation');
  }
  expect(await state(page)).toEqual(before);
  expect(await storedRaw(page)).toBe(raw);
  const full = contractFixture.cases.find(value => value.name === 'slots-full');
  expect(full).toMatchObject({ illustrative: true, supported: false });
  expect(full.policy).toContain('Test example only');
});

test('read-only views deny editing commands and retain the local saved document', async ({ page }) => {
  const originalSnapshot = (await state(page)).snapshot;
  const raw = await storedRaw(page);
  const shared = { ...fixture, team: 'Shared contract team' };
  const encoded = Buffer.from(JSON.stringify(shared), 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  await page.goto('/index.html#s=' + encoded);
  await page.reload();
  const before = await state(page);
  expect(before.view.readOnly).toBe(true);
  expect(before.storage.status).toBe('read-only');
  for (const [operation, payload] of [
    ['change-mode', { mode: '5v5' }], ['reset-layout'], ['undo'],
    ['import-snapshot', { snapshot: fixture }], ['retry-save'],
  ]) {
    const result = await run(page, operation, payload);
    expectResult(result, operation, 'error');
    expect(result.code).toBe('read-only');
  }
  expect(await state(page)).toEqual(before);
  expect(await storedRaw(page)).toBe(raw);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.goto('/index.html');
  expect((await state(page)).snapshot).toEqual(originalSnapshot);
  expect(await storedRaw(page)).toBe(raw);
});

test('PNG failure releases busy state and preserves snapshot and selection', async ({ page }) => {
  await run(page, 'select-player', { id: fixture.roster[0].id });
  const before = await state(page);
  const raw = await storedRaw(page);
  await page.evaluate(() => {
    window.html2canvas = () => new Promise((resolve, reject) => {
      window.__rejectContractPng = reject;
    });
    window.__contractPng = window.SquadMakerContract.run('export-png');
  });
  await expect.poll(async () => (await state(page)).export.busy).toBe(true);
  const denied = await run(page, 'select-player', { id: fixture.roster[1].id });
  expectResult(denied, 'select-player', 'busy');
  expect(denied.code).toBe('busy');
  const result = await page.evaluate(async () => {
    window.__rejectContractPng(new Error('Injected PNG failure'));
    return window.__contractPng;
  });
  expectResult(result, 'export-png', 'error');
  expect(result.code).toBe('export-failed');
  const after = await state(page);
  expect(after.export.busy).toBe(false);
  expect(after.snapshot).toEqual(before.snapshot);
  expect(after.view).toEqual(before.view);
  expect(after.revision).toBe(before.revision);
  expect(await storedRaw(page)).toBe(raw);
  const resumed = await run(page, 'select-player', { id: fixture.roster[1].id });
  expectResult(resumed, 'select-player', 'success');
});

test('share-url reports URL creation without claiming clipboard or OS delivery', async ({ page }) => {
  await run(page, 'select-player', { id: fixture.roster[0].id });
  const before = await state(page);
  const raw = await storedRaw(page);
  const result = await run(page, 'share-url');
  expectResult(result, 'share-url', 'success', 'url-created');
  expect(result.revision).toBe(before.revision);
  expect(result.savedRevision).toBe(before.savedRevision);
  const encoded = result.url.split('#s=')[1];
  expect(JSON.parse(Buffer.from(encoded, 'base64url').toString())).toEqual(before.snapshot);
  expect(await state(page)).toEqual(before);
  expect(await storedRaw(page)).toBe(raw);
});

test('every event observes changed content before reporting its revision and save state', async ({ page }) => {
  await run(page, 'select-player', { id: fixture.roster[0].id });
  await page.evaluate(() => {
    const seen = new Map();
    window.contractInconsistencies = [];
    window.SquadMakerContract.subscribe(value => {
      const json = JSON.stringify(value.snapshot);
      if (seen.has(value.revision) && seen.get(value.revision) !== json) window.contractInconsistencies.push('changed-content-with-same-revision');
      if (value.storage.status === 'saved' && value.savedRevision !== value.revision) window.contractInconsistencies.push('unsaved-content-reported-saved');
      seen.set(value.revision, json);
    });
  });
  await run(page, 'switch-squad', { squad: 'attack' });
  await page.locator('#playerActions').getByRole('button', { name: '이름', exact: true }).click();
  await page.locator('#field .player input').fill('이벤트 새 이름');
  await page.locator('#field .player input').press('Enter');
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
  expect(await page.evaluate(() => window.contractInconsistencies)).toEqual([]);
});

test('PNG timeout unlocks the original selection and all editing controls', async ({ page }) => {
  await run(page, 'select-player', { id: fixture.roster[0].id });
  const before = await state(page);
  await page.clock.install();
  await page.evaluate(() => {
    window.html2canvas = () => new Promise(() => {});
    window.timedPng = window.SquadMakerContract.run('export-png');
  });
  await expect.poll(async () => (await state(page)).export.busy).toBe(true);
  expect(await page.locator('.topbar').evaluate(element => element.inert)).toBe(true);
  await page.clock.fastForward(30001);
  expectResult(await page.evaluate(() => window.timedPng), 'export-png', 'error');
  const after = await state(page);
  expect(after.export.busy).toBe(false);
  expect(after.snapshot).toEqual(before.snapshot);
  expect(after.view).toEqual(before.view);
  expect(await page.locator('main').evaluate(element => element.inert)).toBe(false);
  expect(await page.locator('.topbar').evaluate(element => element.inert)).toBe(false);
});

test('pattern and step navigation publish view changes without consuming revisions', async ({ page }) => {
  await page.click('.app-tab[data-app="pattern"]');
  const before = await state(page);
  await page.evaluate(() => {
    window.contractViewEvents = [];
    window.SquadMakerContract.subscribe(value => window.contractViewEvents.push(value.view));
  });
  await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  const events = await page.evaluate(() => window.contractViewEvents);
  expect(events[events.length - 1].stepIndex).toBe(1);
  expect((await state(page)).revision).toBe(before.revision);
  expect((await state(page)).snapshot).toEqual(before.snapshot);
});

test('save failure stays visible while the team input is scrolled into view', async ({ page }) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = function() { throw new DOMException('Injected quota', 'QuotaExceededError'); };
  });
  await page.fill('#teamName', '오류 안내 확인');
  await expect(page.locator('#saveStatus')).toContainText('저장 실패');
  await expect(page.locator('#saveStatus')).toBeInViewport();
  await expect(page.locator('#retrySaveBtn')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('startup storage read failure exposes a safe string reason and retains bytes', async ({ page }) => {
  const raw = await storedRaw(page);
  await page.addInitScript(key => {
    const read = Storage.prototype.getItem;
    window.restoreBlockedRead = () => { Storage.prototype.getItem = read; };
    Storage.prototype.getItem = function(k) {
      if (k === key) throw new DOMException('Injected storage read failure', 'SecurityError');
      return read.call(this, k);
    };
  }, LS_KEY);
  await page.reload();
  expect((await state(page)).storage).toEqual({ status: 'blocked', error: 'storage-unavailable', retryable: false });
  await expect(page.locator('#saveStatus')).toContainText('백업 파일 복원도 실패할 수 있습니다.');
  await expect(page.locator('#saveStatus')).not.toContainText('유효한 .sq 파일을 가져와 복원해 주세요.');
  await page.evaluate(() => window.restoreBlockedRead());
  expect(await storedRaw(page)).toBe(raw);
  expect((await run(page, 'retry-save')).code).toBe('storage-read-blocked');
  expect(await storedRaw(page)).toBe(raw);
});

test('URL encoding failure reports an error and preserves the original snapshot', async ({ page }) => {
  const before = await state(page);
  await page.evaluate(() => { window.btoa = () => { throw new Error('Injected encoder failure'); }; });
  const result = await run(page, 'share-url');
  expectResult(result, 'share-url', 'error');
  expect(result.code).toBe('export-failed');
  expect(await state(page)).toEqual(before);
});
