const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const KEYS = ['squad-maker-v1', 'squad-maker-library-v1'];
const state = page => page.evaluate(() => window.SquadMakerContract.getState());
const ready = page => page.evaluate(() => window.SquadMakerContract.ready());
const run = (page, command, payload) => page.evaluate(([operation, input]) => window.SquadMakerContract.run(operation, input), [command, payload]);
const bytes = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), KEYS);
const calls = page => page.evaluate(() => window.__updates.completeCalls);

// These facades exercise the real UI/controller/save contract, not Google Play or
// Android AtomicFile. Seed once so reloads observe persisted edits instead of a reset.
async function boot(page, options = {}) {
  await stubExportCdn(page);
  await page.addInitScript(({ seed, native, id, initialStatus }) => {
    if (!sessionStorage.getItem('updates-e2e-seeded')) {
      localStorage.setItem('squad-maker-v1', JSON.stringify(seed));
      sessionStorage.setItem('updates-e2e-seeded', '1');
    }
    window.SQUAD_MAKER_ANALYTICS_ID = '';
    const io = window.__updates = {
      calls: [], completeCalls: [], exportCalls: [], writes: 0, pendingWrite: false,
      holdNextWrite: false, held: false, releaseWrite: null, failWrites: false,
      receiptMissing: false, receiptChanged: false, versionChanged: false,
      holdGate: false, gateHeld: false, releaseGate: null,
      gateError: false,
      startOutcome: 'downloading', afterGate: false,
      checkError: false,
      current: { supported: true, status: initialStatus, availableVersionCode: 2,
        bytesDownloaded: 0, totalBytes: 100, reason: null, shouldNotify: true },
    };
    const publish = delta => { Object.assign(io.current, delta); io.listener?.({ ...io.current }); };
    window.__setUpdateState = publish;
    const storage = {
      async getItem(key) { return localStorage.getItem(key); },
      async setItem(key, value) { localStorage.setItem(key, value); io.writes++; },
      async removeItem(key) { localStorage.removeItem(key); io.writes++; },
      async commitBatch(values, expected) {
        io.pendingWrite = true;
        try {
          if (io.holdNextWrite) {
            io.holdNextWrite = false; io.held = true;
            await new Promise(resolve => { io.releaseWrite = resolve; }); io.held = false;
          }
          if (io.failWrites) throw Object.assign(new Error('Injected write failure'), { code: 'storage-quota' });
          for (const [key, value] of Object.entries(expected)) {
            if (localStorage.getItem(key) !== value) throw Object.assign(new Error('Injected conflict'), { code: 'storage-conflict' });
          }
          for (const [key, value] of Object.entries(values)) {
            if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
          }
          io.writes++; return { status: 'success' };
        } finally { io.pendingWrite = false; }
      },
    };
    window.SquadPlatform = {
      native, storage, publicShareBase: 'https://jaywapp.github.io/squad-maker/',
      getAppInfo: async () => ({ id, name: id.endsWith('.preview') ? 'Synthetic Preview' : 'Synthetic production', version: '1.0.0', build: '1' }),
      showBannerAd: async () => ({ status: 'consent-denied', testOnly: true }),
      prepareExportAd: async () => ({ status: 'skipped', testOnly: true }),
      showExportAd: async () => ({ status: 'skipped', testOnly: true }),
      getAdState: async () => ({ privacyOptionsRequired: false, canRequestAds: false, testOnly: true }),
      onAdState: callback => { callback({ privacyOptionsRequired: false }); return () => {}; },
      async exportFile(blob) {
        io.exportCalls.push(await blob.text());
        return new Promise(resolve => { io.finishExport = resolve; });
      },
      async getUpdateState() {
        io.calls.push('state');
        return { ...io.current, availableVersionCode: io.versionChanged && io.afterGate ? 3 : io.current.availableVersionCode };
      },
      async checkForUpdate({ manual } = {}) {
        io.calls.push(manual ? 'manual-check' : 'check');
        if (io.checkError) throw new Error('Synthetic offline');
        if (manual && ['cancelled', 'failed'].includes(io.current.status)) publish({ status: 'available', shouldNotify: true });
        return { ...io.current };
      },
      async startFlexibleUpdate() { io.calls.push('start'); publish({ status: io.startOutcome }); return { ...io.current }; },
      async dismissUpdate() { io.calls.push('dismiss'); publish({ shouldNotify: false }); return { ...io.current }; },
      async beginUpdateCompletion() {
        io.calls.push('gate');
        if (io.holdGate) {
          io.gateHeld = true; await new Promise(resolve => { io.releaseGate = resolve; }); io.gateHeld = false;
        }
        if (io.gateError) throw new Error('Synthetic completion gate failure');
        io.afterGate = true; return { ...io.current, challenge: 'synthetic-single-use-challenge' };
      },
      async getStorageReceipt() {
        io.calls.push('receipt');
        if (io.receiptMissing || io.pendingWrite) return null;
        return 'verified-receipt-' + io.writes + (io.receiptChanged && io.afterGate ? '-changed' : '');
      },
      async completeUpdate(input) {
        io.completeCalls.push({ input, state: window.SquadMakerContract.getState(),
          stored: ['squad-maker-v1', 'squad-maker-library-v1'].map(key => localStorage.getItem(key)) });
        publish({ status: 'installing', shouldNotify: false }); return { ...io.current };
      },
      onUpdateState(callback) { io.listener = callback; callback({ ...io.current }); return () => { io.listener = null; }; },
    };
  }, { seed: fixture, native: options.native !== false,
    id: options.id || 'com.jaywapp.iamheadcoach', initialStatus: options.status || 'downloaded' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html' + (options.hash || ''));
  await ready(page);
}

async function help(page) {
  await page.evaluate(() => openHelp());
  await expect(page.locator('#helpModal')).toBeVisible();
  await expect(page.locator('#appUpdateStatus')).toBeVisible();
}

async function edited(page, name) {
  await page.evaluate(value => {
    const input = document.getElementById('teamName'); input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, name);
  return (await state(page)).snapshot;
}

async function expectEditorLock(page, locked) {
  await expect.poll(() => page.locator('main').evaluate(element => element.inert)).toBe(locked);
  if (locked) {
    const focusBlocked = await page.evaluate(() => {
      const input = document.getElementById('teamName'); input.focus();
      return document.activeElement !== input;
    });
    expect(focusBlocked).toBe(true);
  }
}

test('an explicit restart saves the edited tactic and metadata before native completion and reload preserves it', async ({ page }) => {
  await boot(page);
  const before = await state(page);
  expect((await run(page, 'rename-file', { id: before.localLibrary.fileId, name: 'Stored update tactic' })).status).toBe('success');
  const expected = await edited(page, 'Latest edit before update');
  await page.evaluate(() => { window.__updates.holdGate = true; });
  await help(page);
  expect(await calls(page)).toEqual([]);
  await page.locator('#appUpdateRestart').click();
  await expect.poll(() => page.evaluate(() => window.__updates.gateHeld)).toBe(true);
  await page.locator('#appUpdateRestart').dispatchEvent('click');
  await page.evaluate(() => window.__updates.releaseGate());
  await expect.poll(async () => (await calls(page)).length).toBe(1);
  const completed = (await calls(page))[0];
  expect(completed.state.revision).toBe(completed.state.savedRevision);
  expect(completed.state.storage.status).toBe('saved');
  expect(completed.input).toMatchObject({ challenge: 'synthetic-single-use-challenge', receipt: expect.any(String) });
  expect(JSON.parse(completed.stored[0])).toEqual(expected);
  const library = JSON.parse(completed.stored[1]);
  expect(library.activeFileId).toBe(before.localLibrary.fileId);
  expect(library.files.find(file => file.id === library.activeFileId)).toMatchObject({ name: 'Stored update tactic', snapshot: expected });
  await page.keyboard.press('Escape');
  await expect(page.locator('#helpModal')).toBeHidden();
  await expectEditorLock(page, true);
  expect((await run(page, 'select-player', { id: 1 })).status).toBe('busy');
  await page.reload();
  expect((await ready(page)).snapshot).toEqual(expected);
});

for (const profile of [{ label: 'Preview', id: 'com.jaywapp.squadmaker.preview' }, { label: 'web', native: false }]) {
  test(profile.label + ' shows information without any Play facade requests', async ({ page }) => {
    await boot(page, profile); const original = await bytes(page);
    await help(page);
    await expect(page.locator('#appUpdateCheck')).toBeHidden();
    await expect(page.locator('#appUpdateDownload')).toBeHidden();
    await expect(page.locator('#appUpdateRestart')).toBeHidden();
    expect(await page.evaluate(() => window.__updates.calls)).toEqual([]);
    expect(await calls(page)).toEqual([]); expect(await bytes(page)).toEqual(original);
  });
}

test('cancelled download preserves data and a manual check permits an explicit retry without automatic restart', async ({ page }) => {
  await boot(page, { status: 'available' }); const original = await bytes(page);
  await page.evaluate(() => { window.__updates.startOutcome = 'cancelled'; });
  await help(page); await page.locator('#appUpdateDownload').click();
  await expect.poll(() => page.evaluate(() => window.__updates.current.status)).toBe('cancelled');
  expect(await calls(page)).toEqual([]); expect(await bytes(page)).toEqual(original);
  await page.locator('#appUpdateCheck').click();
  await expect(page.locator('#appUpdateDownload')).toBeVisible();
  await page.evaluate(() => { window.__updates.startOutcome = 'downloading'; });
  await page.locator('#appUpdateDownload').click();
  await expect.poll(() => page.evaluate(() => window.__updates.current.status)).toBe('downloading');
  await page.evaluate(() => window.__setUpdateState({ status: 'downloaded', bytesDownloaded: 100 }));
  await expect(page.locator('#appUpdateRestart')).toBeVisible();
  expect(await calls(page)).toEqual([]); expect(await bytes(page)).toEqual(original);
  await page.locator('#appUpdateLater').click(); expect(await calls(page)).toEqual([]);
});

test('an offline manual check preserves the tactic and never starts or completes an update', async ({ page }) => {
  await boot(page); const before = await state(page), original = await bytes(page);
  await help(page);
  await page.evaluate(() => { window.__updates.checkError = true; });
  await page.locator('#appUpdateCheck').click();
  await expect(page.locator('#appUpdateStatus')).toContainText('네트워크');
  expect(await calls(page)).toEqual([]);
  expect((await state(page)).snapshot).toEqual(before.snapshot);
  expect(await bytes(page)).toEqual(original);
  expect(await page.evaluate(() => window.__updates.calls.includes('start'))).toBe(false);
});

test('a restart waits for the earlier write and then saves the latest revision instead of its captured older snapshot', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { window.__updates.holdNextWrite = true; });
  await edited(page, 'Earlier pending save');
  await page.evaluate(() => { window.__oldUpdateSave = window.SquadMakerContract.run('retry-save'); });
  await expect.poll(() => page.evaluate(() => window.__updates.held)).toBe(true);
  const expected = await edited(page, 'Newer edit while old write is held');
  await help(page); await page.locator('#appUpdateRestart').click();
  await expect.poll(async () => (await state(page)).busy.updateRestart).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#helpModal')).toBeHidden();
  await expectEditorLock(page, true);
  expect((await run(page, 'select-player', { id: 1 })).status).toBe('busy');
  expect(await calls(page)).toEqual([]);
  await page.evaluate(() => window.__updates.releaseWrite());
  await expect.poll(async () => (await calls(page)).length).toBe(1);
  const complete = (await calls(page))[0];
  expect(JSON.parse(complete.stored[0])).toEqual(expected);
  expect(complete.state.savedRevision).toBe(complete.state.revision);
  await page.reload(); expect((await ready(page)).snapshot).toEqual(expected);
});

for (const fault of ['write-failure', 'missing-receipt', 'changed-receipt', 'changed-version']) {
  test(fault + ' blocks restart and does not export private backup automatically', async ({ page }) => {
    await boot(page); const original = await bytes(page);
    const expected = fault === 'write-failure' ? await edited(page, 'Unsaved edit retained') : (await state(page)).snapshot;
    await page.evaluate(kind => {
      const io = window.__updates;
      io.failWrites = kind === 'write-failure'; io.receiptMissing = kind === 'missing-receipt';
      io.receiptChanged = kind === 'changed-receipt'; io.versionChanged = kind === 'changed-version';
    }, fault);
    await help(page); await page.locator('#appUpdateRestart').click();
    await expect(page.locator('#appUpdateStatus')).toContainText('안전한 저장');
    await expect(page.locator('#appUpdateRestart')).toBeEnabled();
    expect(await calls(page)).toEqual([]);
    expect((await state(page)).snapshot).toEqual(expected);
    expect(await page.evaluate(() => window.__updates.exportCalls)).toEqual([]);
    if (fault === 'write-failure') expect(await bytes(page)).toEqual(original);
  });
}

test('a timed-out save barrier leaves the held write intact and never completes when it eventually resolves', async ({ page }) => {
  await boot(page); const original = await bytes(page);
  await page.clock.install({ time: new Date('2026-10-14T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-14T00:00:01Z'));
  await page.evaluate(() => { window.__updates.holdNextWrite = true; });
  const expected = await edited(page, 'Persist after timeout without restarting');
  await page.evaluate(() => { window.__timedOutWrite = window.SquadMakerContract.run('retry-save'); });
  await expect.poll(() => page.evaluate(() => window.__updates.held)).toBe(true);
  await help(page); await page.locator('#appUpdateRestart').click();
  await expect.poll(async () => (await state(page)).busy.updateRestart).toBe(true);
  await page.clock.fastForward(8001);
  await expect(page.locator('#appUpdateStatus')).toContainText('안전한 저장');
  expect((await state(page)).busy.updateRestart).toBe(false);
  expect(await page.evaluate(() => window.__updates.held)).toBe(true);
  expect(await calls(page)).toEqual([]);
  expect(await bytes(page)).toEqual(original);
  await page.keyboard.press('Escape'); await expectEditorLock(page, false);
  await page.evaluate(() => window.__updates.releaseWrite());
  expect((await page.evaluate(() => window.__timedOutWrite)).status).toBe('success');
  expect(JSON.parse((await bytes(page))[0])).toEqual(expected);
  expect((await state(page)).snapshot).toEqual(expected);
  expect(await calls(page)).toEqual([]);
  expect(await page.evaluate(() => window.__updates.calls.includes('gate'))).toBe(false);
  await page.reload(); expect((await ready(page)).snapshot).toEqual(expected);
});

test('no active file and read-only shared data fail the restart barrier without changing originals', async ({ page }) => {
  await boot(page);
  const shared = await run(page, 'share-url');
  expect(shared.status).toBe('success');
  const id = (await state(page)).localLibrary.fileId;
  await page.evaluate(fileId => { window.__deleteUpdateFile = window.SquadMakerContract.run('delete-file', { id: fileId }); }, id);
  await page.getByRole('alertdialog').locator('[data-r="1"]').click();
  expect((await page.evaluate(() => window.__deleteUpdateFile)).status).toBe('success');
  const empty = await bytes(page);
  const blocked = await page.evaluate(() => window.SquadMakerContract.prepareForUpdateRestart());
  expect(blocked).toMatchObject({ ok: false, reason: 'no-active-file' });
  await page.evaluate(() => window.SquadMakerContract.releaseUpdateRestart());
  expect(await calls(page)).toEqual([]); expect(await bytes(page)).toEqual(empty);
  await help(page); await page.locator('#appUpdateRestart').click();
  await expect(page.locator('#appUpdateStatus')).toContainText('안전한 저장');
  expect(await calls(page)).toEqual([]); expect(await bytes(page)).toEqual(empty);
  await page.goto('/index.html' + new URL(shared.url).hash);
  // Hash-only navigation does not execute the viewer initialization again.
  await page.reload(); await ready(page);
  expect((await state(page)).view.readOnly).toBe(true);
  const original = await bytes(page);
  const readOnly = await page.evaluate(() => window.SquadMakerContract.prepareForUpdateRestart());
  expect(readOnly).toMatchObject({ ok: false, reason: 'read-only' });
  await page.evaluate(() => window.SquadMakerContract.releaseUpdateRestart());
  expect(await calls(page)).toEqual([]); expect(await bytes(page)).toEqual(original);
});

test('Later during an outstanding completion challenge suppresses its stale callback', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { window.__updates.holdGate = true; });
  await help(page); await page.locator('#appUpdateRestart').click();
  await expect.poll(() => page.evaluate(() => window.__updates.gateHeld)).toBe(true);
  await page.locator('#appUpdateLater').click();
  await expect.poll(() => page.evaluate(() => window.__updates.calls.includes('dismiss'))).toBe(true);
  await page.evaluate(() => window.__updates.releaseGate());
  await expect(page.locator('#appUpdateRestart')).toBeEnabled();
  expect(await calls(page)).toEqual([]);
  await page.evaluate(() => closeHelp());
  await expectEditorLock(page, false);
});

test('closing help during the saved challenge keeps editing locked until a gate failure releases it', async ({ page }) => {
  await boot(page);
  const expected = await edited(page, 'Protected during native gate');
  await page.evaluate(() => { window.__updates.holdGate = true; window.__updates.gateError = true; });
  await help(page); await page.locator('#appUpdateRestart').click();
  await expect.poll(() => page.evaluate(() => window.__updates.gateHeld)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#helpModal')).toBeHidden();
  await expectEditorLock(page, true);
  expect((await run(page, 'select-player', { id: 1 })).status).toBe('busy');
  expect((await state(page)).snapshot).toEqual(expected);
  await page.evaluate(() => window.__updates.releaseGate());
  await expectEditorLock(page, false);
  expect(await calls(page)).toEqual([]);
  expect((await state(page)).snapshot).toEqual(expected);
  await page.reload(); expect((await ready(page)).snapshot).toEqual(expected);
});

test('a programmatic revision change while the native challenge is held invalidates the restart receipt', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { window.__updates.holdGate = true; });
  await help(page); await page.locator('#appUpdateRestart').click();
  await expect.poll(() => page.evaluate(() => window.__updates.gateHeld)).toBe(true);
  const expected = await edited(page, 'Changed after the save receipt was obtained');
  await page.evaluate(() => window.__updates.releaseGate());
  await expect(page.locator('#appUpdateStatus')).toContainText('안전한 저장');
  expect(await calls(page)).toEqual([]);
  expect((await state(page)).snapshot).toEqual(expected);
  await page.evaluate(() => closeHelp());
  await expectEditorLock(page, false);
  expect((await run(page, 'retry-save')).status).toBe('success');
  await page.reload(); expect((await ready(page)).snapshot).toEqual(expected);
});

test('an unfinished real touch drag blocks restart and its cancellation preserves saved data', async ({ page }) => {
  await boot(page); const before = await state(page), original = await bytes(page);
  const box = await page.locator('#field .player[data-id="1"] .player-circle').boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 77 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y: y + 20, id: 77 }] });
    await expect(page.locator('#field .player.dragging')).toHaveCount(1);
    const result = await page.evaluate(() => window.SquadMakerContract.prepareForUpdateRestart());
    expect(result).toMatchObject({ ok: false, reason: 'gesture-busy' });
    await page.evaluate(() => window.SquadMakerContract.releaseUpdateRestart());
    expect(await calls(page)).toEqual([]);
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    expect((await state(page)).snapshot).toEqual(before.snapshot);
    expect(await bytes(page)).toEqual(original);
  } finally { await session.detach(); }
});

test('a pending SQ export prevents restart and export cancellation preserves the selected tactic', async ({ page }) => {
  await boot(page); const before = await state(page), original = await bytes(page);
  await page.evaluate(() => { window.__pendingUpdateExport = window.SquadMakerContract.run('export-sq'); });
  await expect.poll(async () => (await state(page)).export.busy).toBe(true);
  const result = await page.evaluate(() => window.SquadMakerContract.prepareForUpdateRestart());
  expect(result).toMatchObject({ ok: false, reason: 'editor-busy' });
  await page.evaluate(() => window.SquadMakerContract.releaseUpdateRestart());
  expect(await calls(page)).toEqual([]);
  await page.evaluate(() => window.__updates.finishExport({ status: 'cancelled', code: null, completion: null }));
  expect((await page.evaluate(() => window.__pendingUpdateExport)).status).toBe('cancelled');
  expect((await state(page)).snapshot).toEqual(before.snapshot);
  expect((await state(page)).localLibrary.fileId).toBe(before.localLibrary.fileId);
  expect(await bytes(page)).toEqual(original);
});
