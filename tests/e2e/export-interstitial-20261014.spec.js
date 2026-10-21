const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const KEYS = ['squad-maker-v1', 'squad-maker-library-v1'];
const GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const state = page => page.evaluate(() => window.SquadMakerContract.getState());
const run = (page, operation, payload) => page.evaluate(
  ([command, input]) => window.SquadMakerContract.run(command, input), [operation, payload]);
const observed = page => page.evaluate(() => ({ ads: window.__exportIO.ads,
  files: window.__exportIO.files, events: window.__exportIO.events }));
const stored = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), KEYS);

// This facade tests production export ordering and data preservation. SDK display,
// lifecycle and the persistent ten-minute policy have separate Android coverage.
async function boot(page, options = {}) {
  await stubExportCdn(page);
  await page.route('**/index.html', async route => route.fulfill({ status: 200,
    contentType: 'text/html; charset=utf-8',
    body: await fs.readFile(path.join(__dirname, '..', '..', 'index.html'), 'utf8') }));
  await page.route('**/gif.js/0.2.0/gif.js', route => route.fulfill({ status: 200,
    contentType: 'application/javascript', body: `
      window.GIF = class {
        constructor() { this.handlers = {}; this.frames = 0; }
        on(event, callback) { this.handlers[event] = callback; }
        addFrame() { this.frames++; }
        render() {
          window.__exportIO.events.push('gif-encoding');
          window.__exportIO.gifFrames = this.frames;
          window.__finishGif = () => {
            const bytes = Uint8Array.from(atob('${GIF_BASE64}'), value => value.charCodeAt(0));
            window.__exportIO.events.push('gif-ready');
            this.handlers.finished(new Blob([bytes], { type: 'image/gif' }));
          };
          if (window.__exportIO.gifMode === 'fail') this.handlers.abort();
          else if (window.__exportIO.gifMode !== 'hold') window.__finishGif();
        }
        abort() { if (this.handlers.abort) this.handlers.abort(); }
      };
    ` }));
  await page.addInitScript(({ seed, native, adMode, gifMode, shareMode, cancelMode }) => {
    if (!sessionStorage.getItem('export-interstitial-seeded')) {
      localStorage.setItem('squad-maker-v1', JSON.stringify(seed));
      sessionStorage.setItem('export-interstitial-seeded', '1');
    }
    window.SQUAD_MAKER_ANALYTICS_ID = '';
    const io = window.__exportIO = { ads: [], files: [], events: [], clipboard: [], gifMode };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async value => { io.clipboard.push(value); },
    } });
    if (native) window.Capacitor = { isNativePlatform: () => true };
    window.SquadPlatform = {
      native, publicShareBase: 'https://jaywapp.github.io/squad-maker/',
      storage: {
        async getItem(key) { return localStorage.getItem(key); },
        async setItem(key, value) { localStorage.setItem(key, value); },
        async removeItem(key) { localStorage.removeItem(key); },
        async commitBatch(values, expected) {
          for (const [key, value] of Object.entries(expected)) {
            if (localStorage.getItem(key) !== value) throw Object.assign(new Error('Conflict'), { code: 'storage-conflict' });
          }
          for (const [key, value] of Object.entries(values)) {
            if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
          }
        },
      },
      async getAppInfo() { return { name: 'Synthetic app', id: 'com.example.exporttest', version: '1.0', build: '1' }; },
      async showTestAd() { return { status: 'unsupported' }; },
      async getAdState() { return { status: 'unsupported' }; },
      cancelExportAd() {
        io.cancellations = (io.cancellations || 0) + 1;
        if (cancelMode === 'pending') return new Promise(() => {});
        if (cancelMode === 'reject') return Promise.reject(new Error('Injected cancel failure'));
        return Promise.resolve({ status: 'skipped', reason: 'opportunity-cancelled' });
      },
      async showExportAd(...args) {
        io.ads.push(args);
        io.events.push('ad:' + args[0]);
        if (adMode === 'reject') throw new Error('Injected ad failure');
        if (adMode === 'pending') return new Promise(resolve => { window.__closeExportAd = resolve; });
        return { status: adMode, reason: 'synthetic-result', testOnly: true };
      },
      async exportFile(blob, filename, mimeType, destination) {
        io.events.push('file:' + destination);
        io.files.push({ bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
          filename, mimeType, destination, blobType: blob.type });
        if (destination === 'share') {
          if (shareMode === 'pending') return new Promise(resolve => { window.__finishShare = resolve; });
          if (shareMode === 'cancelled') return { status: 'cancelled', code: null, completion: null };
          if (shareMode === 'failed') return { status: 'error', code: 'export-failed', completion: null };
        }
        return { status: 'success', code: null, completion: destination === 'share' ? 'share-sheet-finished' : 'saved' };
      },
    };
    if (adMode === 'missing') delete window.SquadPlatform.showExportAd;
  }, { seed: options.snapshot || fixture, native: options.native !== false,
    adMode: options.adMode || 'pending', gifMode: options.gifMode || 'auto',
    shareMode: options.shareMode, cancelMode: options.cancelMode });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  await expect(page.locator('#brandIntro')).toHaveCount(0);
  return state(page);
}

async function startExport(page, operation, destination = 'save') {
  await page.evaluate(([command, target]) => {
    window.__pendingExport = window.SquadMakerContract.run(command, { destination: target });
  }, [operation, destination]);
}

async function closeAd(page) {
  await page.evaluate(() => window.__closeExportAd({ status: 'dismissed', testOnly: true }));
}

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

for (const destination of ['save']) {
  test(`native SQ ${destination} waits for the ad, blocks duplicate edits and preserves exact backup bytes`, async ({ page }) => {
    const before = await boot(page);
    const saved = await stored(page);
    const expected = Buffer.from(JSON.stringify(before.snapshot, null, 2), 'utf8');
    await startExport(page, 'export-sq', destination);
    await expect.poll(async () => (await observed(page)).ads).toEqual([['sq']]);
    expect((await observed(page)).files).toEqual([]);
    expect((await state(page)).export.busy).toBe(true);
    expect(await page.locator('main').evaluate(element => element.inert)).toBe(true);
    for (const [operation, payload] of [['export-sq', { destination }], ['export-gif', {}],
      ['switch-squad', { squad: 'attack' }], ['import-snapshot', { snapshot: fixture }]]) {
      expect(await run(page, operation, payload)).toMatchObject({ status: 'busy', code: 'busy' });
    }
    await page.evaluate(() => openShare());
    await expect(page.locator('#shareModal')).toBeHidden();
    expect((await observed(page)).ads).toEqual([['sq']]);
    expect((await state(page)).snapshot).toEqual(before.snapshot);
    await closeAd(page);
    expect(await page.evaluate(() => window.__pendingExport)).toMatchObject({ operation: 'export-sq',
      status: 'success', completion: destination === 'share' ? 'shared' : 'saved' });
    const outcome = await observed(page);
    expect(outcome.events).toEqual(['ad:sq', 'file:' + destination]);
    expect(outcome.files).toHaveLength(1);
    expect(outcome.files[0]).toMatchObject({ filename: before.snapshot.team + '.sq',
      destination, mimeType: 'application/json', blobType: 'application/json' });
    expect(Buffer.from(outcome.files[0].bytes)).toEqual(expected);
    expect((await state(page)).export.busy).toBe(false);
    expect((await state(page)).snapshot).toEqual(before.snapshot);
    expect(await stored(page)).toEqual(saved);
  });

  test(`native GIF ${destination} finishes encoding before the ad and hands off the finished GIF once`, async ({ page }) => {
    const before = await boot(page, { gifMode: 'hold' });
    const saved = await stored(page);
    await startExport(page, 'export-gif', destination);
    await expect.poll(() => page.evaluate(() => window.__exportIO.gifFrames || 0)).toBeGreaterThan(0);
    expect(await observed(page)).toEqual({ ads: [], files: [], events: ['gif-encoding'] });
    expect(await run(page, 'export-gif', { destination })).toMatchObject({ status: 'busy' });
    await page.evaluate(() => window.__finishGif());
    await expect.poll(async () => (await observed(page)).ads).toEqual([['gif']]);
    expect((await observed(page)).events).toEqual(['gif-encoding', 'gif-ready', 'ad:gif']);
    expect((await observed(page)).files).toEqual([]);
    expect((await state(page)).export.busy).toBe(true);
    await closeAd(page);
    expect(await page.evaluate(() => window.__pendingExport)).toMatchObject({ status: 'success' });
    const outcome = await observed(page);
    expect(outcome.files).toHaveLength(1);
    expect(outcome.files[0]).toMatchObject({ filename: fixture.pat[0].n + '.gif', mimeType: 'image/gif', destination });
    expect(Buffer.from(outcome.files[0].bytes)).toEqual(Buffer.from(GIF_BASE64, 'base64'));
    expect(outcome.events).toEqual(['gif-encoding', 'gif-ready', 'ad:gif', 'file:' + destination]);
    await expect(page.locator('#gifProgress')).toBeHidden();
    expect((await state(page)).snapshot).toEqual(before.snapshot);
    expect((await state(page)).export.busy).toBe(false);
    expect(await stored(page)).toEqual(saved);
  });
}

test('native share text opens without waiting for any ad and preserves coach instructions, copy and download', async ({ page }) => {
  const before = await boot(page);
  const saved = await stored(page);
  await page.evaluate(() => { window.__pendingShare = openShare(); });
  await expect(page.locator('#shareModal')).toBeVisible();
  expect((await state(page)).export.busy).toBe(false);
  await page.evaluate(() => openShare());
  expect(await page.locator('main').evaluate(element => element.inert)).toBe(true);
  expect((await observed(page)).ads).toEqual([]);
  await page.evaluate(() => window.__pendingShare);
  await expect(page.locator('#shareModal')).toBeVisible();
  expect((await state(page)).export.busy).toBe(false);
  const text = await page.locator('#shareText').innerText();
  for (const note of [fixture.team, fixture.squads.basic.tn, fixture.squads.basic.pn['1'], fixture.roster[0].name]) {
    expect(text).toContain(note);
  }
  expect(text).not.toMatch(/안전한 패스로 점유를 유지한다|안전한 옆패스 또는 GK에게 리셋한다/);
  const url = await page.locator('#shareUrlBox').inputValue();
  expect(url).toMatch(/^https:\/\/jaywapp\.github\.io\/squad-maker\/#s=/);
  expect(JSON.parse(Buffer.from(url.split('#s=')[1], 'base64url').toString('utf8'))).toMatchObject(before.snapshot);
  await page.locator('#shareModal').getByRole('button', { name: '텍스트 복사', exact: true }).click();
  expect(await page.evaluate(() => window.__exportIO.clipboard)).toEqual([text]);
  const downloaded = page.waitForEvent('download');
  await page.locator('#shareModal').getByRole('button', { name: '텍스트 파일로 받기', exact: true }).click();
  expect((await readDownload(await downloaded)).toString('utf8')).toBe(text);
  expect((await observed(page)).ads).toEqual([]);
  expect((await observed(page)).files).toEqual([]);
  expect((await state(page)).snapshot).toEqual(before.snapshot);
  expect(await stored(page)).toEqual(saved);
});

for (const adMode of ['ready', 'loading', 'pending', 'failed', 'missing']) {
  test(`native ${adMode} ads never block PNG, GIF, SQ or text sharing`, async ({ page }) => {
    const before = await boot(page, { adMode, cancelMode: 'pending' });
    const saved = await stored(page);
    for (const operation of ['export-png', 'export-gif', 'export-sq']) {
      expect(await run(page, operation, { destination: 'share' })).toMatchObject({
        status: 'success', completion: 'share-sheet-finished',
      });
    }
    await page.evaluate(() => openShare());
    await expect(page.locator('#shareModal')).toBeVisible();
    const outcome = await observed(page);
    expect(outcome.ads).toEqual([]);
    expect(outcome.files.map(file => file.mimeType)).toEqual(['image/png', 'image/gif', 'application/json']);
    expect(outcome.files.every(file => file.destination === 'share')).toBe(true);
    expect(Buffer.from(outcome.files[0].bytes).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(Buffer.from(outcome.files[1].bytes)).toEqual(Buffer.from(GIF_BASE64, 'base64'));
    expect(JSON.parse(Buffer.from(outcome.files[2].bytes).toString('utf8'))).toEqual(before.snapshot);
    expect((await state(page)).export.busy).toBe(false);
    expect((await state(page)).snapshot).toEqual(before.snapshot);
    expect(await stored(page)).toEqual(saved);
  });
}

for (const shareMode of ['cancelled', 'failed']) {
  test(`native ${shareMode} sharing preserves input and never retries an ad after return`, async ({ page }) => {
    const before = await boot(page, { shareMode, cancelMode: 'reject' });
    const saved = await stored(page);
    expect(await run(page, 'export-sq', { destination: 'share' })).toMatchObject({
      status: shareMode === 'cancelled' ? 'cancelled' : 'error', completion: null,
    });
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('pageshow'));
    });
    await page.evaluate(() => openShare());
    await expect(page.locator('#shareModal')).toBeVisible();
    expect((await observed(page)).ads).toEqual([]);
    expect((await observed(page)).files).toHaveLength(1);
    expect((await state(page)).export.busy).toBe(false);
    expect((await state(page)).snapshot).toEqual(before.snapshot);
    expect(await stored(page)).toEqual(saved);
  });
}

test('an open system share sheet blocks duplicate output and edits through rotation and return without an ad', async ({ page }) => {
  const before = await boot(page, { shareMode: 'pending' });
  const saved = await stored(page);
  await startExport(page, 'export-sq', 'share');
  await expect.poll(async () => (await observed(page)).files.length).toBe(1);
  expect((await state(page)).export.busy).toBe(true);
  for (const [operation, payload] of [['export-sq', { destination: 'share' }],
    ['export-png', {}], ['switch-squad', { squad: 'attack' }]])
    expect(await run(page, operation, payload)).toMatchObject({ status: 'busy' });
  await page.evaluate(() => openShare());
  await expect(page.locator('#shareModal')).toBeHidden();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
    window.__finishShare({ status: 'success', code: null, completion: 'share-sheet-finished' });
  });
  expect(await page.evaluate(() => window.__pendingExport)).toMatchObject({ completion: 'share-sheet-finished' });
  expect((await observed(page)).ads).toEqual([]);
  expect((await observed(page)).files).toHaveLength(1);
  expect((await state(page)).export.busy).toBe(false);
  expect((await state(page)).snapshot).toEqual(before.snapshot);
  expect(await stored(page)).toEqual(saved);
});

for (const adMode of ['failed', 'reject', 'missing', 'skipped']) {
  test(`native ${adMode} ad does not prevent SQ delivery or displaying share text`, async ({ page }) => {
    const before = await boot(page, { adMode });
    expect(await run(page, 'export-sq')).toMatchObject({ status: 'success', completion: 'saved' });
    await page.evaluate(() => openShare());
    await expect(page.locator('#shareModal')).toBeVisible();
    await expect(page.locator('#shareText')).toContainText(fixture.squads.basic.tn);
    const outcome = await observed(page);
    expect(outcome.ads).toEqual(adMode === 'missing' ? [] : [['sq']]);
    expect(outcome.files).toHaveLength(1);
    expect(JSON.parse(Buffer.from(outcome.files[0].bytes).toString('utf8'))).toEqual(before.snapshot);
    expect((await state(page)).export.busy).toBe(false);
    expect((await state(page)).snapshot).toEqual(before.snapshot);
  });
}

test('native PNG, URL creation, local saves, backup restore and reload do not request export ads', async ({ page }) => {
  await boot(page);
  expect(await run(page, 'export-png')).toMatchObject({ status: 'success', completion: 'saved' });
  const png = (await observed(page)).files[0];
  expect(png.mimeType).toBe('image/png');
  expect(Buffer.from(png.bytes).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(await run(page, 'share-url')).toMatchObject({ status: 'success', completion: 'url-created' });
  await page.fill('#teamName', 'Autosaved without an ad');
  expect(await run(page, 'retry-save')).toMatchObject({ status: 'success' });
  const teamId = (await state(page)).localLibrary.teamId;
  expect(await run(page, 'create-file', { teamId, name: 'Local backup' })).toMatchObject({ status: 'success' });
  const restored = JSON.parse(JSON.stringify(fixture));
  restored.team = 'Restored without an ad';
  await page.evaluate(snapshot => {
    window.__pendingRestore = window.SquadMakerContract.run('import-snapshot', { snapshot });
  }, restored);
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.locator('.dlg [data-r="1"]').click();
  expect(await page.evaluate(() => window.__pendingRestore)).toMatchObject({ status: 'success' });
  expect((await state(page)).snapshot.team).toBe(restored.team);
  expect((await observed(page)).ads).toEqual([]);
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
  expect((await state(page)).snapshot.team).toBe(restored.team);
  expect((await observed(page)).ads).toEqual([]);
});

test('invalid destinations and failed GIF or share generation do not request ads or deliver partial output', async ({ page }) => {
  const before = await boot(page, { gifMode: 'fail' });
  const saved = await stored(page);
  expect(await run(page, 'export-sq', { destination: 'invalid' })).toMatchObject({ status: 'error', code: 'invalid-input' });
  expect(await run(page, 'export-gif')).toMatchObject({ status: 'error', code: 'export-failed' });
  await page.evaluate(() => {
    window.__originalBtoa = window.btoa;
    window.btoa = () => { throw new DOMException('Injected encoding failure', 'InvalidCharacterError'); };
  });
  await page.evaluate(() => openShare());
  await expect(page.locator('#shareModal')).toBeHidden();
  await page.evaluate(() => {
    window.btoa = window.__originalBtoa;
    window.buildShareText = () => { throw new Error('Injected share text generation failure'); };
  });
  await page.evaluate(() => openShare());
  await expect(page.locator('#shareModal')).toBeHidden();
  expect((await observed(page)).ads).toEqual([]);
  expect((await observed(page)).files).toEqual([]);
  expect((await state(page)).export.busy).toBe(false);
  expect((await state(page)).snapshot).toEqual(before.snapshot);
  expect(await stored(page)).toEqual(saved);
});

test('web SQ and GIF downloads and share text never request the native export ad', async ({ page }) => {
  const before = await boot(page, { native: false });
  for (const [operation, mimeType] of [['export-sq', 'application/json'], ['export-gif', 'image/gif']]) {
    const downloaded = page.waitForEvent('download');
    expect(await run(page, operation)).toMatchObject({ status: 'success', completion: 'download-requested' });
    const bytes = await readDownload(await downloaded);
    if (mimeType === 'application/json') expect(JSON.parse(bytes.toString('utf8'))).toEqual(before.snapshot);
    else expect(bytes).toEqual(Buffer.from(GIF_BASE64, 'base64'));
  }
  await page.evaluate(() => openShare());
  await expect(page.locator('#shareModal')).toBeVisible();
  await expect(page.locator('#shareText')).toContainText(fixture.squads.basic.pn['1']);
  expect((await observed(page)).ads).toEqual([]);
  expect((await observed(page)).files).toEqual([]);
  expect((await state(page)).snapshot).toEqual(before.snapshot);
});

test('native export notice stays readable inside the export panel at either viewport', async ({ page }, testInfo) => {
  await boot(page);
  await page.locator('#exportOpenBtn').click();
  const notice = page.locator('.export-ad-note');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('광고를 닫으면 계속 진행');
  await expect(notice).toContainText('10분');
  await expect(notice).toContainText('파일·텍스트 공유에는 전면 광고가 표시되지 않습니다');
  const bounds = await notice.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  const directory = path.join(__dirname, '..', '..', '.work', 'export-interstitial-20261014');
  await fs.mkdir(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, 'native-export-notice-' + testInfo.project.name + '.png') });
  expect((await observed(page)).ads).toEqual([]);
});
