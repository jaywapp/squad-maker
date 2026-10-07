const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const LEGACY_KEY = 'squad-maker-v1';
const LIBRARY_KEY = 'squad-maker-library-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const state = page => page.evaluate(() => window.SquadMakerContract.getState());
const ready = page => page.evaluate(() => window.SquadMakerContract.ready());
const run = (page, command, payload) => page.evaluate(
  ([operation, input]) => window.SquadMakerContract.run(operation, input), [command, payload]
);
const bytes = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), [LIBRARY_KEY, LEGACY_KEY]);

function namedSnapshot(name) {
  const value = clone(fixture);
  value.team = name;
  value.roster[0].name = 'Player ' + name[0];
  value.squads.basic.tn = name + ' instructions';
  value.squads.basic.pn['1'] = name + ' player note';
  value.squads.attack.pos['1'] = { x: 110, y: 210 };
  value.pat[0].n = 'Pattern ' + name[0];
  return value;
}

async function boot(page, options = {}) {
  await stubExportCdn(page);
  await page.addInitScript(({ legacy, legacyKey, libraryKey, limit, native }) => {
    // Seed only once so reloads verify saved data instead of replacing it.
    if (!sessionStorage.getItem('local-library-seeded')) {
      localStorage.setItem(legacyKey, JSON.stringify(legacy));
      sessionStorage.setItem('local-library-seeded', '1');
    }
    if (limit !== undefined) window.SQUAD_MAKER_PREVIEW_POLICY = { limit };
    const io = window.libraryIO = {
      writes: [], failReadKey: null, failWriteKey: null, failuresLeft: 0,
      holdNextWrite: false, held: false, releaseWrite: null,
    };
    window.SquadPlatform = {
      native: Boolean(native),
      publicShareBase: 'https://squad-maker.vercel.app/',
      showTestAd: async () => ({ status: 'unsupported' }),
      storage: {
        async getItem(key) {
          if (io.failReadKey === key) throw new DOMException('Injected read failure', 'SecurityError');
          return localStorage.getItem(key);
        },
        async setItem(key, value) {
          if (io.holdNextWrite && key === libraryKey) {
            io.holdNextWrite = false;
            io.held = true;
            await new Promise(resolve => { io.releaseWrite = resolve; });
            io.held = false;
          }
          if (io.failWriteKey === key && io.failuresLeft > 0) {
            io.failuresLeft--;
            throw new DOMException('Injected write failure', 'QuotaExceededError');
          }
          io.writes.push({ key, value });
          localStorage.setItem(key, value);
        },
        async removeItem(key) {
          io.writes.push({ key, value: null });
          localStorage.removeItem(key);
        },
      },
      async exportFile(blob, filename, mimeType, destination) {
        window.nativeExport = { text: await blob.text(), filename, mimeType, destination };
        return new Promise((resolve, reject) => {
          window.finishNativeExport = resolve;
          window.failNativeExport = reject;
        });
      },
    };
  }, { legacy: options.snapshot || fixture, legacyKey: LEGACY_KEY, libraryKey: LIBRARY_KEY,
    limit: options.limit, native: options.native });
  await page.goto('/index.html');
  const initial = await ready(page);
  expect(initial).toMatchObject({ contractVersion: 2, ready: true, storage: { status: 'saved' } });
  return initial;
}

async function editTeam(page, name) {
  return page.evaluate(value => {
    const input = document.getElementById('teamName');
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return window.SquadMakerContract.getState();
  }, name);
}

async function deletion(page, command, id, accept = true) {
  await page.evaluate(([operation, fileId]) => {
    window.pendingDeletion = window.SquadMakerContract.run(operation, { id: fileId });
  }, [command, id]);
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.locator(`.dlg [data-r="${accept ? 1 : 0}"]`).click();
  return page.evaluate(() => window.pendingDeletion);
}

function expectSuccess(result, operation) {
  expect(result).toMatchObject({ contractVersion: 2, operation, status: 'success', code: null });
}

async function createFile(page, teamId, name, snapshot) {
  expectSuccess(await run(page, 'create-file', { teamId, name, snapshot }), 'create-file');
  return (await state(page)).localLibrary.fileId;
}

async function pauseAutosaveClock(page) {
  await page.clock.install({ time: new Date('2026-10-07T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-07T00:00:01Z'));
}

test('legacy migration, file edits and names survive switching and restart', async ({ page }) => {
  const initial = await boot(page);
  expect(initial.snapshot).toEqual(fixture);
  expect(initial.localLibrary).toMatchObject({ supported: true,
    slots: { status: 'available', limit: null, used: 1, policy: 'preview-unlimited' } });
  expect(initial.localLibrary.items).toHaveLength(1);
  expect(initial.localLibrary.items[0]).not.toHaveProperty('snapshot');
  expect(JSON.parse((await bytes(page))[1])).toEqual(fixture);
  const firstId = initial.localLibrary.fileId;

  expectSuccess(await run(page, 'create-team', { name: 'Training team' }), 'create-team');
  const secondTeam = (await state(page)).localLibrary.teams.find(team => team.name === 'Training team');
  const incoming = namedSnapshot('Second tactic');
  const secondId = await createFile(page, secondTeam.id, 'Training plan', incoming);
  expect((await state(page)).snapshot).toEqual(incoming);
  await page.fill('#teamName', 'Edited second tactic');
  await page.fill('#teamNote', 'Edited second instructions');
  const edited = (await state(page)).snapshot;
  expectSuccess(await run(page, 'rename-file', { id: secondId, name: 'Renamed training plan' }), 'rename-file');
  expectSuccess(await run(page, 'rename-team', { id: secondTeam.id, name: 'Renamed training team' }), 'rename-team');

  expectSuccess(await run(page, 'open-file', { id: firstId }), 'open-file');
  expect((await state(page)).snapshot).toEqual(fixture);
  await page.reload();
  const restored = await ready(page);
  expect(restored.localLibrary.fileId).toBe(firstId);
  expect(restored.snapshot).toEqual(fixture);
  expect(restored.localLibrary.items).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: secondId, name: 'Renamed training plan', teamId: secondTeam.id }),
  ]));
  expect(restored.localLibrary.teams).toContainEqual({ id: secondTeam.id, name: 'Renamed training team' });
  expectSuccess(await run(page, 'open-file', { id: secondId }), 'open-file');
  expect((await state(page)).snapshot).toEqual(edited);
  await page.reload();
  expect((await ready(page)).snapshot).toEqual(edited);
  expect((await state(page)).localLibrary.fileId).toBe(secondId);
});

test('autosave and rename update one file without consuming another slot', async ({ page }) => {
  const initial = await boot(page);
  await page.fill('#teamName', 'Autosaved tactic');
  await page.click('#addPlayerBtn');
  await expect.poll(async () => (await state(page)).storage.status).toBe('saved');
  const saved = await state(page);
  expect(saved.localLibrary.fileId).toBe(initial.localLibrary.fileId);
  expect(saved.localLibrary.items).toHaveLength(1);
  expect(saved.localLibrary.slots.used).toBe(1);
  expect(saved.snapshot.roster).toHaveLength(fixture.roster.length + 1);
  expectSuccess(await run(page, 'rename-file', { id: initial.localLibrary.fileId, name: 'Updated name' }), 'rename-file');
  await page.reload();
  const restored = await ready(page);
  expect(restored.snapshot).toEqual(saved.snapshot);
  expect(restored.localLibrary.slots.used).toBe(1);
  expect(restored.localLibrary.items[0].name).toBe('Updated name');
});

test('test-only full capacity cancels deletion, reuses a slot and protects new files from full undo', async ({ page }) => {
  const initial = await boot(page, { limit: 2 });
  const teamId = initial.localLibrary.teamId;
  const second = namedSnapshot('Second');
  const secondId = await createFile(page, teamId, 'Second', second);
  const full = await state(page);
  const fullBytes = await bytes(page);
  expect(full.localLibrary.slots).toEqual({ status: 'full', limit: 2, used: 2, policy: 'test-only' });
  expect(await run(page, 'create-file', { teamId, name: 'Overflow', snapshot: fixture }))
    .toMatchObject({ status: 'error', code: 'slots-full' });
  expect(await state(page)).toEqual(full);
  expect(await bytes(page)).toEqual(fullBytes);
  expect(await deletion(page, 'delete-file', secondId, false)).toMatchObject({ status: 'cancelled' });
  expect(await state(page)).toEqual(full);
  expect(await bytes(page)).toEqual(fullBytes);

  expectSuccess(await deletion(page, 'delete-file', secondId), 'delete-file');
  expect((await state(page)).localLibrary.slots).toMatchObject({ status: 'available', used: 1 });
  const replacement = namedSnapshot('Replacement');
  const replacementId = await createFile(page, teamId, 'Replacement', replacement);
  const beforeUndo = await state(page);
  const beforeUndoBytes = await bytes(page);
  expect(beforeUndo.localLibrary.undoDeleteAvailable).toBe(true);
  expect(await run(page, 'undo-delete')).toMatchObject({ status: 'error', code: 'slots-full' });
  expect(await state(page)).toEqual(beforeUndo);
  expect(await bytes(page)).toEqual(beforeUndoBytes);
  expect((await state(page)).localLibrary.fileId).toBe(replacementId);
  expect((await state(page)).snapshot).toEqual(replacement);
  await page.reload();
  const restarted = await ready(page);
  expect(restarted.localLibrary.items.map(file => file.id)).toEqual(expect.arrayContaining([initial.localLibrary.fileId, replacementId]));
  expect(restarted.localLibrary.items.some(file => file.id === secondId)).toBe(false);
  expect(restarted.snapshot).toEqual(replacement);
});

test('undo restores deleted team files while retaining a tactic created after deletion', async ({ page }) => {
  const initial = await boot(page);
  const firstId = initial.localLibrary.fileId;
  const second = namedSnapshot('Same team second');
  const secondId = await createFile(page, initial.localLibrary.teamId, 'Second', second);
  expectSuccess(await run(page, 'create-team', { name: 'Unrelated team' }), 'create-team');
  const otherTeam = (await state(page)).localLibrary.teams.find(team => team.name === 'Unrelated team');
  const other = namedSnapshot('Unrelated tactic');
  const otherId = await createFile(page, otherTeam.id, 'Other', other);
  const beforeCancel = await state(page);
  const beforeCancelBytes = await bytes(page);
  expect(await deletion(page, 'delete-team', initial.localLibrary.teamId, false)).toMatchObject({ status: 'cancelled' });
  expect(await state(page)).toEqual(beforeCancel);
  expect(await bytes(page)).toEqual(beforeCancelBytes);
  expectSuccess(await deletion(page, 'delete-team', initial.localLibrary.teamId), 'delete-team');
  expect((await state(page)).localLibrary.items.map(file => file.id)).toEqual([otherId]);
  const later = namedSnapshot('Later tactic');
  const laterId = await createFile(page, otherTeam.id, 'Later', later);
  expectSuccess(await run(page, 'undo-delete'), 'undo-delete');
  const undone = await state(page);
  expect(undone.localLibrary.items).toHaveLength(4);
  expect(undone.localLibrary.fileId).toBe(laterId);
  expect(undone.localLibrary.undoDeleteAvailable).toBe(false);
  expect(undone.snapshot).toEqual(later);
  for (const [id, snapshot] of [[firstId, fixture], [secondId, second], [otherId, other], [laterId, later]]) {
    expectSuccess(await run(page, 'open-file', { id }), 'open-file');
    expect((await state(page)).snapshot).toEqual(snapshot);
  }
  await page.reload();
  expect((await ready(page)).localLibrary.items).toHaveLength(4);
  expect((await state(page)).snapshot).toEqual(later);
});

test('deleting the last tactic remains empty after restart and subsequent autosave', async ({ page }) => {
  const initial = await boot(page);
  expectSuccess(await deletion(page, 'delete-file', initial.localLibrary.fileId), 'delete-file');
  const emptyBytes = await bytes(page);
  expect(emptyBytes[1]).toBeNull();
  expect((await state(page)).localLibrary).toMatchObject({ fileId: null, items: [], slots: { used: 0 } });
  await page.reload();
  expect((await ready(page)).storage.status).toBe('no-file');
  expect((await state(page)).localLibrary.items).toEqual([]);
  await page.fill('#teamName', 'Unfiled edit');
  await page.fill('#teamNote', 'Unfiled instructions');
  await page.waitForTimeout(800);
  expect((await state(page)).snapshot.team).toBe('Unfiled edit');
  expect((await state(page)).storage.status).toBe('no-file');
  expect(await run(page, 'retry-save')).toMatchObject({ status: 'error', code: 'no-active-file' });
  expect(await bytes(page)).toEqual(emptyBytes);
  expect(await page.evaluate(() => window.libraryIO.writes)).toEqual([]);
  await page.reload();
  expect((await ready(page)).localLibrary).toMatchObject({ fileId: null, items: [], slots: { used: 0 } });
});

test('failed open preserves both saved originals, active selection and board', async ({ page }) => {
  const initial = await boot(page);
  const otherId = await createFile(page, initial.localLibrary.teamId, 'Other', namedSnapshot('Other'));
  expectSuccess(await run(page, 'open-file', { id: initial.localLibrary.fileId }), 'open-file');
  await run(page, 'select-player', { id: fixture.roster[0].id });
  const before = await state(page);
  const originalBytes = await bytes(page);
  await page.evaluate(key => { window.libraryIO.failReadKey = key; }, LIBRARY_KEY);
  expect(await run(page, 'open-file', { id: otherId })).toMatchObject({ status: 'error', code: 'storage-unavailable' });
  const failed = await state(page);
  expect(failed.snapshot).toEqual(before.snapshot);
  expect(failed.view).toEqual(before.view);
  expect(failed.localLibrary).toEqual(before.localLibrary);
  expect(failed.revision).toBe(before.revision);
  expect(await bytes(page)).toEqual(originalBytes);
  await page.evaluate(() => { window.libraryIO.failReadKey = null; });
  expectSuccess(await run(page, 'open-file', { id: otherId }), 'open-file');
  expect((await state(page)).snapshot).toEqual(namedSnapshot('Other'));
});

test('partial save failure rolls back both keys and retains current edits for retry', async ({ page }) => {
  const initial = await boot(page);
  await run(page, 'select-player', { id: fixture.roster[0].id });
  const originalBytes = await bytes(page);
  await pauseAutosaveClock(page);
  const edited = await editTeam(page, 'Unsaved edit');
  await page.evaluate(key => {
    window.libraryIO.failWriteKey = key;
    window.libraryIO.failuresLeft = 1;
  }, LEGACY_KEY);
  expect(await run(page, 'retry-save')).toMatchObject({ status: 'error', code: 'storage-quota' });
  const failed = await state(page);
  expect(failed.snapshot).toEqual(edited.snapshot);
  expect(failed.view).toEqual(edited.view);
  expect(failed.localLibrary).toEqual(initial.localLibrary);
  expect(failed.savedRevision).toBe(initial.savedRevision);
  expect(failed.storage).toMatchObject({ status: 'error', retryable: true });
  expect(await bytes(page)).toEqual(originalBytes);
  expectSuccess(await run(page, 'retry-save'), 'retry-save');
  const saved = await state(page);
  expect(saved.savedRevision).toBe(saved.revision);
  expect(saved.snapshot).toEqual(edited.snapshot);
  expect(JSON.parse((await bytes(page))[1])).toEqual(edited.snapshot);
  await page.reload();
  expect((await ready(page)).snapshot).toEqual(edited.snapshot);
});

test('shared read-only navigation and library commands perform zero writes to either key', async ({ page }) => {
  await boot(page);
  const originalBytes = await bytes(page);
  const shared = namedSnapshot('Shared read-only');
  const encoded = Buffer.from(JSON.stringify(shared)).toString('base64url');
  await page.goto('/index.html#s=' + encoded);
  await page.reload();
  const before = await ready(page);
  expect(before.view.readOnly).toBe(true);
  expect(before.snapshot).toEqual(shared);
  for (const [operation, payload] of [
    ['create-team', { name: 'Denied' }], ['rename-team', { id: before.localLibrary.teamId, name: 'Denied' }],
    ['create-file', { teamId: before.localLibrary.teamId, name: 'Denied', snapshot: fixture }],
    ['rename-file', { id: before.localLibrary.fileId, name: 'Denied' }],
    ['open-file', { id: before.localLibrary.fileId }], ['delete-file', { id: before.localLibrary.fileId }],
    ['delete-team', { id: before.localLibrary.teamId }], ['undo-delete'], ['retry-save'],
  ]) expect(await run(page, operation, payload)).toMatchObject({ status: 'error', code: 'read-only' });
  await page.waitForTimeout(800);
  expect(await state(page)).toEqual(before);
  expect(await page.evaluate(() => window.libraryIO.writes)).toEqual([]);
  expect(await bytes(page)).toEqual(originalBytes);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.goto('/index.html');
  expect((await ready(page)).snapshot).toEqual(fixture);
  expect(await bytes(page)).toEqual(originalBytes);
});

test('edits during async save report the committed revision before the next flush saves the latest', async ({ page }) => {
  await boot(page);
  await pauseAutosaveClock(page);
  const first = await editTeam(page, 'First pending edit');
  await page.evaluate(() => {
    window.libraryIO.holdNextWrite = true;
    window.firstFlush = window.SquadMakerContract.run('retry-save').then(result => ({
      result, state: window.SquadMakerContract.getState(),
    }));
  });
  await expect.poll(() => page.evaluate(() => window.libraryIO.held)).toBe(true);
  expect((await state(page)).storage.status).toBe('saving');
  const latest = await editTeam(page, 'Latest edit during save');
  expect(latest.revision).toBeGreaterThan(first.revision);
  const committed = await page.evaluate(async () => {
    window.libraryIO.releaseWrite();
    return window.firstFlush;
  });
  expectSuccess(committed.result, 'retry-save');
  expect(committed.state.savedRevision).toBe(first.revision);
  expect(committed.state.revision).toBe(latest.revision);
  expect(committed.state.storage.status).toBe('pending');
  expect(committed.state.snapshot).toEqual(latest.snapshot);
  expect(JSON.parse((await bytes(page))[1])).toEqual(first.snapshot);
  expectSuccess(await run(page, 'retry-save'), 'retry-save');
  const saved = await state(page);
  expect(saved.savedRevision).toBe(latest.revision);
  expect(saved.storage.status).toBe('saved');
  expect(JSON.parse((await bytes(page))[1])).toEqual(latest.snapshot);
  await page.reload();
  expect((await ready(page)).snapshot).toEqual(latest.snapshot);
});

for (const outcome of ['cancelled', 'error']) {
  test(`fake native ${outcome} export releases busy state and preserves the selected tactic`, async ({ page }) => {
    await boot(page, { native: true });
    await run(page, 'select-player', { id: fixture.roster[0].id });
    const before = await state(page);
    const originalBytes = await bytes(page);
    await page.evaluate(() => { window.pendingExport = window.SquadMakerContract.run('export-sq', { destination: 'save' }); });
    await expect.poll(async () => (await state(page)).export.busy).toBe(true);
    await expect.poll(() => page.evaluate(() => Boolean(window.finishNativeExport))).toBe(true);
    expect(await run(page, 'select-player', { id: fixture.roster[1].id })).toMatchObject({ status: 'busy' });
    const delivery = await page.evaluate(() => window.nativeExport);
    expect(JSON.parse(delivery.text)).toEqual(before.snapshot);
    expect(delivery).toMatchObject({ mimeType: 'application/json', destination: 'save' });
    const result = await page.evaluate(async status => {
      if (status === 'error') window.failNativeExport(new Error('Injected native delivery error'));
      else window.finishNativeExport({ status: 'cancelled', code: null, completion: null });
      return window.pendingExport;
    }, outcome);
    expect(result).toMatchObject({ operation: 'export-sq', status: outcome, completion: null });
    if (outcome === 'error') expect(result.code).toBe('export-failed');
    expect(await state(page)).toEqual(before);
    expect(await bytes(page)).toEqual(originalBytes);
    expectSuccess(await run(page, 'select-player', { id: fixture.roster[1].id }), 'select-player');
    const shared = await run(page, 'share-url');
    expectSuccess(shared, 'share-url');
    expect(shared.completion).toBe('url-created');
    expect(new URL(shared.url).origin).toBe('https://squad-maker.vercel.app');
    expect(JSON.parse(Buffer.from(shared.url.split('#s=')[1], 'base64url').toString())).toEqual(before.snapshot);
  });
}

test('deleting an unrelated file and undoing it preserve current selection, view and snapshot', async ({ page }) => {
  await boot(page);
  const original = await state(page);
  const teamId = original.localLibrary.teamId;
  const created = await run(page, 'create-file', { teamId, name: 'Other', snapshot: namedSnapshot('Other') });
  const otherId = created.fileId;
  await run(page, 'open-file', { id: original.localLibrary.fileId });
  await run(page, 'select-player', { id: fixture.roster[0].id });
  const before = await state(page);
  await page.evaluate(id => { window.pendingLibraryDelete = window.SquadMakerContract.run('delete-file', { id }); }, otherId);
  await page.locator('.dlg [data-r="1"]').click();
  expect((await page.evaluate(() => window.pendingLibraryDelete)).status).toBe('success');
  expect((await state(page)).snapshot).toEqual(before.snapshot);
  expect((await state(page)).view).toEqual(before.view);
  expect((await run(page, 'undo-delete')).status).toBe('success');
  expect((await state(page)).snapshot).toEqual(before.snapshot);
  expect((await state(page)).view).toEqual(before.view);
  expect((await state(page)).localLibrary.items).toHaveLength(2);
});
