const { test, expect } = require('@playwright/test');
const fs = require('fs/promises');
const { stubExportCdn } = require('../helpers/stub-cdn');
const { withPinnedPatternStarts } = require('../helpers/pattern-start');
const fixture = require('../fixtures/snapshot-v1.json');

const KEYS = ['squad-maker-v1', 'squad-maker-library-v1'];
const state = page => page.evaluate(() => window.SquadMakerContract.getState());
const ready = page => page.evaluate(() => window.SquadMakerContract.ready());
const run = (page, operation, payload) => page.evaluate(
  ([command, input]) => window.SquadMakerContract.run(command, input), [operation, payload]
);
const bytes = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), KEYS);
const success = result => expect(result.status).toBe('success');

function tactic(team, name, offset) {
  const snapshot = JSON.parse(JSON.stringify(fixture));
  snapshot.team = team + ' / ' + name;
  snapshot.roster[0].name = team + ' captain';
  snapshot.squad = offset % 2 ? 'attack' : 'defense';
  for (const [index, squad] of Object.values(snapshot.squads).entries()) {
    squad.tn = name + ' instructions ' + index;
    squad.pn['2'] = team + ' player instruction ' + index;
    squad.pos['1'] = { x: 130 + offset + index * 15, y: 220 + index * 25 };
  }
  snapshot.pat[0].n = name + ' movement';
  snapshot.pat[0].s[0].m['1'] = { x: 170 + offset, y: 210 };
  snapshot.pat.push({ n: name + ' recovery', bs: { x: 250, y: 330 },
    s: [{ m: { '3': { x: 320, y: 470 } }, b: { x: 280, y: 390 } }] });
  return withPinnedPatternStarts(snapshot);
}

async function boot(page) {
  await stubExportCdn(page);
  await page.goto('/index.html');
  expect((await ready(page)).ready).toBe(true);
}

async function importBackup(page, file, accept = true) {
  await page.setInputFiles('#sqFileInput', file);
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.locator(`.dlg [data-r="${accept ? 1 : 0}"]`).click();
  await expect(page.getByRole('alertdialog')).toBeHidden();
  await expect.poll(async () => (await state(page)).busy.mutation).toBe(false);
}

test('each Preview tactic transfers through an external SQ file into independent storage and remains editable after restart', async ({ page, browser, baseURL }, testInfo) => {
  await boot(page);
  const initial = await state(page);
  const firstTeam = initial.localLibrary.teamId;
  success(await run(page, 'rename-team', { id: firstTeam, name: 'Weekend club' }));
  success(await run(page, 'rename-file', { id: initial.localLibrary.fileId, name: 'Pressing' }));
  const first = tactic('Weekend club', 'Pressing', 1);
  await importBackup(page, { name: 'seed.sq', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(first)) });
  success(await run(page, 'create-file', { teamId: firstTeam, name: 'Counterattack', snapshot: tactic('Weekend club', 'Counterattack', 2) }));
  success(await run(page, 'create-team', { name: 'Training club' }));
  const trainingTeam = (await state(page)).localLibrary.teams.find(team => team.name === 'Training club');
  success(await run(page, 'create-file', { teamId: trainingTeam.id, name: 'Build up', snapshot: tactic('Training club', 'Build up', 3) }));

  // SQ contains one board; this external manifest records names that SQ does not carry.
  const source = await state(page);
  const backups = [];
  for (const [index, item] of source.localLibrary.items.entries()) {
    success(await run(page, 'open-file', { id: item.id }));
    const expected = (await state(page)).snapshot;
    const downloadPromise = page.waitForEvent('download');
    success(await run(page, 'export-sq'));
    const download = await downloadPromise;
    expect(await download.failure()).toBeNull();
    const path = testInfo.outputPath(`preview-tactic-${index}.sq`);
    await download.saveAs(path);
    const downloaded = JSON.parse(await fs.readFile(path, 'utf8'));
    expect(downloaded).toEqual(expected);
    expect(Object.keys(downloaded).sort()).toEqual(['mode', 'pat', 'roster', 'squad', 'squads', 'team', 'v']);
    backups.push({ path, teamName: source.localLibrary.teams.find(team => team.id === item.teamId).name,
      fileName: item.name, sourceId: item.id, snapshot: expected });
  }
  expect(backups).toHaveLength(3);
  await fs.writeFile(testInfo.outputPath('backup-index.json'), JSON.stringify(backups.map(({ path, teamName, fileName }) => ({ path, teamName, fileName })), null, 2));
  const previewBytes = await bytes(page);

  // Separate browser contexts simulate separate package storage, not Android packages.
  const productionContext = await browser.newContext({ baseURL, viewport: page.viewportSize(),
    isMobile: Boolean(testInfo.project.use.isMobile), hasTouch: Boolean(testInfo.project.use.hasTouch) });
  try {
    const production = await productionContext.newPage();
    await stubExportCdn(production);
    await production.addInitScript(keys => {
      window.storageBeforeBoot = keys.map(key => localStorage.getItem(key));
    }, KEYS);
    await production.goto('/index.html');
    expect(await production.evaluate(() => window.storageBeforeBoot)).toEqual([null, null]);
    await ready(production);
    const restored = [];
    for (const backup of backups) {
      let group = (await state(production)).localLibrary.teams.find(team => team.name === backup.teamName);
      if (!group) {
        success(await run(production, 'create-team', { name: backup.teamName }));
        group = (await state(production)).localLibrary.teams.find(team => team.name === backup.teamName);
      }
      success(await run(production, 'create-file', { teamId: group.id, name: backup.fileName }));
      const fileId = (await state(production)).localLibrary.fileId;
      await importBackup(production, backup.path);
      expect((await state(production)).snapshot).toEqual(backup.snapshot);
      expect(fileId).not.toBe(backup.sourceId);
      await production.fill('#teamName', backup.snapshot.team + ' edited');
      await production.fill('#teamNote', 'Production instruction ' + backup.fileName);
      success(await run(production, 'retry-save'));
      const edited = (await state(production)).snapshot;
      await production.reload();
      const restarted = await ready(production);
      expect(restarted.snapshot).toEqual(edited);
      expect(restarted.localLibrary.fileId).toBe(fileId);
      expect(restarted.localLibrary.items).toContainEqual(expect.objectContaining({ id: fileId, teamId: group.id, name: backup.fileName }));
      expect(restarted.localLibrary.teams).toContainEqual({ id: group.id, name: backup.teamName });
      restored.push({ fileId, edited });
    }
    for (const file of restored) {
      success(await run(production, 'open-file', { id: file.fileId }));
      expect((await state(production)).snapshot).toEqual(file.edited);
    }
    expect(await bytes(page)).toEqual(previewBytes);
    await page.reload();
    expect((await ready(page)).snapshot).toEqual(backups[backups.length - 1].snapshot);
  } finally { await productionContext.close(); }
});

test('invalid and cancelled file restores preserve both saved keys, selection and restart data', async ({ page }) => {
  await boot(page);
  await importBackup(page, { name: 'valid.sq', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(tactic('Existing club', 'Keep', 4))) });
  success(await run(page, 'select-player', { id: 2 }));
  success(await run(page, 'retry-save'));
  const before = await state(page), original = await bytes(page);
  for (const text of ['{broken', JSON.stringify({ ...before.snapshot, v: 2 })]) {
    await page.setInputFiles('#sqFileInput', { name: 'invalid.sq', mimeType: 'application/json', buffer: Buffer.from(text) });
    await expect(page.locator('#_toast')).toContainText('기존 전술은 유지');
    expect((await state(page)).snapshot).toEqual(before.snapshot);
    expect(await bytes(page)).toEqual(original);
  }
  await importBackup(page, { name: 'cancel.sq', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(tactic('Incoming club', 'Cancel', 5))) }, false);
  const cancelled = await state(page);
  expect(cancelled.snapshot).toEqual(before.snapshot);
  expect(cancelled.view.selectedPlayerId).toBe(before.view.selectedPlayerId);
  expect(cancelled.localLibrary.fileId).toBe(before.localLibrary.fileId);
  expect(await bytes(page)).toEqual(original);
  await page.reload();
  expect((await ready(page)).snapshot).toEqual(before.snapshot);
});

test('simulated native export cancellation preserves saved data and permits the next export', async ({ page }) => {
  await page.addInitScript(() => {
    window.SquadPlatform = {
      native: true,
      storage: { getItem: async key => localStorage.getItem(key),
        setItem: async (key, value) => localStorage.setItem(key, value),
        removeItem: async key => localStorage.removeItem(key) },
      showExportAd: async () => ({ status: 'failed', reason: 'simulated-offline' }),
      exportFile: async blob => {
        window.simulatedExportText = await blob.text();
        return { status: 'cancelled', code: null, completion: null };
      },
    };
  });
  await boot(page);
  await importBackup(page, { name: 'native-seed.sq', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(tactic('Native facade', 'Keep', 6))) });
  const before = await state(page), original = await bytes(page);
  for (let attempt = 0; attempt < 2; attempt++) {
    expect(await run(page, 'export-sq')).toMatchObject({ status: 'cancelled', completion: null });
    expect(JSON.parse(await page.evaluate(() => window.simulatedExportText))).toEqual(before.snapshot);
    const after = await state(page);
    expect(after.export.busy).toBe(false);
    expect(after.snapshot).toEqual(before.snapshot);
    expect(after.localLibrary.fileId).toBe(before.localLibrary.fileId);
    expect(await bytes(page)).toEqual(original);
  }
  await page.reload();
  expect((await ready(page)).snapshot).toEqual(before.snapshot);
});
