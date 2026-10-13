const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const KEYS = ['squad-maker-v1', 'squad-maker-library-v1'];
const clone = value => JSON.parse(JSON.stringify(value));
const encode = value => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
const state = page => page.evaluate(() => window.SquadMakerContract.getState());
const snapshot = async page => (await state(page)).snapshot;
const stored = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), KEYS);
const run = (page, operation, payload) => page.evaluate(([op, args]) => window.SquadMakerContract.run(op, args), [operation, payload]);
const patternPositions = page => page.evaluate(() => [0, 1, 2].map(step => positionsAfter(currentPattern(), step)));
const playback = page => page.evaluate(() => ({ playing: isPlaying, paused: isPaused,
  elapsed: animElapsed, step: animStep, progress: animProgress }));

async function boot(page, seed = fixture) {
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  await run(page, 'retry-save');
  await page.evaluate(({ seed, keys }) => {
    localStorage.removeItem(keys[1]);
    localStorage.setItem(keys[0], JSON.stringify(seed));
  }, { seed, keys: KEYS });
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
}

async function openShared(page, hash) {
  await page.goto('/index.html#s=' + hash);
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
}

async function readDownload(download) {
  const stream = await download.createReadStream();
  const parts = [];
  for await (const part of stream) parts.push(part);
  return Buffer.concat(parts).toString('utf8');
}

test.beforeEach(async ({ page }) => {
  await stubExportCdn(page);
});

test('official manual, clipboard and text download preserve coach instructions and exclude automatic suggestions', async ({ page }) => {
  await boot(page);
  const teamNote = '공을 빼앗으면 즉시 오른쪽 윙으로 길게 연결\n후방에서 점유를 위해 옆으로 돌리지 않는다';
  const playerNote = '상대 풀백을 따라 내려가지 말고 오른쪽 터치라인에서 대기';
  const matchNote = '상대 왼쪽 풀백 뒤의 공간을 공략';
  await page.fill('#teamNote', teamNote);
  await page.locator('#playerNotesCard').evaluate(element => { element.open = true; });
  await page.fill('#pnote_1', playerNote);
  await page.locator('.app-tab[data-app="strategy"]').click();
  await page.fill('#opponent', 'FC 상대');
  await page.fill('#matchNotes', matchNote);
  await page.getByRole('button', { name: '전술 지침서 생성', exact: true }).click();
  const official = page.locator('#manualOutput');
  await expect(official).toContainText(teamNote.split('\n')[0]);
  await expect(official).toContainText(playerNote);
  await expect(official).toContainText(matchNote);
  await expect(official).toContainText('오버랩');
  await expect(official).not.toContainText('안전한 패스로 점유를 유지한다');
  await expect(official).not.toContainText('공 소유 시 안전한 옆패스 또는 GK에게 리셋한다');
  const suggestions = page.locator('#manualSuggestions');
  await expect(suggestions).toHaveCount(1);
  expect(await suggestions.evaluate(element => element.contains(document.getElementById('manualOutput')))).toBe(false);
  const plain = await page.evaluate(() => lastManualText);
  for (const text of [teamNote, playerNote, matchNote, '오버랩']) expect(plain).toContain(text);
  expect(plain).not.toMatch(/안전한 패스로 점유를 유지한다|안전한 옆패스 또는 GK에게 리셋한다/);
  await page.evaluate(() => {
    window.__manualClipboard = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => { window.__manualClipboard.push(text); },
    } });
  });
  await page.locator('#manualCard').getByRole('button', { name: '클립보드 복사', exact: true }).click();
  expect(await page.evaluate(() => window.__manualClipboard)).toEqual([plain]);
  const event = page.waitForEvent('download');
  await page.locator('#manualCard').getByRole('button', { name: '텍스트 저장', exact: true }).click();
  expect(await readDownload(await event)).toBe(plain);
});

test('old v1 and single-step patterns migrate from the saved selected squad without losing moves', async ({ page }) => {
  const seed = clone(fixture);
  seed.squad = 'attack';
  seed.pat.push({ n: '구형 단일 단계', m: { '3': { x: 400, y: 180 } } });
  await boot(page, seed);
  const migrated = await snapshot(page);
  for (const pattern of migrated.pat) expect(pattern.start).toEqual({ squad: 'attack', pos: seed.squads.attack.pos });
  expect(migrated.pat[0].s).toEqual(seed.pat[0].s);
  expect(migrated.pat[1].s).toEqual([{ m: seed.pat[1].m, b: null }]);
  expect(migrated.v).toBe(1);
  expect((await run(page, 'retry-save')).status).toBe('success');
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
  expect(await snapshot(page)).toEqual(migrated);
});

test('blank patterns pin the first used squad and retain their departure positions after layout changes', async ({ page }) => {
  const seed = clone(fixture);
  seed.pat = [{ n: '처음 사용할 패턴', start: null, bs: { x: 240, y: 330 }, s: [{ m: {}, b: null }] }];
  await boot(page, seed);
  expect((await snapshot(page)).pat[0].start).toBeNull();
  await page.locator('.squad-tab[data-squad="attack"]').click();
  await page.locator('.app-tab[data-app="pattern"]').click();
  const pinned = (await snapshot(page)).pat[0].start;
  expect(pinned).toEqual({ squad: 'attack', pos: seed.squads.attack.pos });
  await expect(page.locator('#patternStartLabel')).toContainText('공격');
  await page.locator('.app-tab[data-app="squad"]').click();
  await page.locator('.squad-tab[data-squad="defense"]').click();
  await page.selectOption('#formationSelect', '3-3-2');
  await page.getByRole('alertdialog').locator('[data-r="1"]').click();
  await page.locator('.app-tab[data-app="pattern"]').click();
  expect((await snapshot(page)).pat[0].start).toEqual(pinned);
  expect((await patternPositions(page))[0]).toEqual(pinned.pos);
  expect((await run(page, 'retry-save')).status).toBe('success');
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
  expect((await snapshot(page)).pat[0].start).toEqual(pinned);
});

test('authored movement origins survive squad, formation, orientation, backup and share round trips', async ({ page }) => {
  await boot(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  const before = await patternPositions(page);
  expect(before[0]).toEqual(fixture.squads.basic.pos);
  expect(before[1]['1']).toEqual(fixture.pat[0].s[0].m['1']);
  expect(before[2]['2']).toEqual(fixture.pat[0].s[1].m['2']);
  await page.locator('.app-tab[data-app="squad"]').click();
  await page.locator('.squad-tab[data-squad="defense"]').click();
  await page.selectOption('#formationSelect', '3-3-2');
  await page.getByRole('alertdialog').locator('[data-r="1"]').click();
  await page.locator('.app-tab[data-app="pattern"]').click();
  expect(await patternPositions(page)).toEqual(before);
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('body')).toHaveClass(/pitch-horizontal/);
  expect(await patternPositions(page)).toEqual(before);
  await page.setViewportSize(viewport);
  const expected = await snapshot(page);
  const downloadEvent = page.waitForEvent('download');
  expect((await run(page, 'export-sq')).status).toBe('success');
  const backup = JSON.parse(await readDownload(await downloadEvent));
  expect(backup).toEqual(expected);
  expect(backup).not.toHaveProperty('view');
  expect((await run(page, 'retry-save')).status).toBe('success');
  const original = await stored(page);
  const result = await run(page, 'share-url');
  expect(result.status).toBe('success');
  await openShared(page, result.url.split('#s=')[1]);
  expect(await snapshot(page)).toEqual(expected);
  expect(await patternPositions(page)).toEqual(before);
  expect(await stored(page)).toEqual(original);
  await expect(page.locator('body')).toHaveClass(/viewer-mode/);
});

test('share recipients open the chosen pattern step while local saves omit the presentation scene', async ({ page }) => {
  const seed = clone(fixture);
  seed.pat.push({ ...clone(seed.pat[0]), n: '역습 두 번째 패턴' });
  await boot(page, seed);
  await page.locator('.app-tab[data-app="pattern"]').click();
  await page.getByRole('button', { name: '다음 패턴', exact: true }).click();
  await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  const expected = await snapshot(page);
  const share = await run(page, 'share-url');
  const shared = JSON.parse(Buffer.from(share.url.split('#s=')[1], 'base64url').toString('utf8'));
  expect(shared.view).toEqual({ mode: 'pattern', pattern: 1, step: 1 });
  const { view, ...sharedSnapshot } = shared;
  expect(sharedSnapshot).toEqual(expected);
  expect((await run(page, 'retry-save')).status).toBe('success');
  const original = await stored(page);
  expect(JSON.parse(original[0])).not.toHaveProperty('view');
  await openShared(page, encode(shared));
  expect((await state(page)).view).toMatchObject({ appMode: 'pattern', patternIndex: 1, stepIndex: 1, readOnly: true });
  await expect(page.locator('#patternNameView')).toHaveText('역습 두 번째 패턴');
  await expect(page.locator('#stepCounter')).toHaveText('단계 2 / 2');
  expect(await snapshot(page)).toEqual(expected);
  expect(await stored(page)).toEqual(original);
});

test('legacy and out-of-range share scenes open a usable bounded scene', async ({ page }) => {
  await boot(page);
  const original = await stored(page);
  for (const [view, appMode, stepIndex] of [[undefined, 'squad', 0],
    [{ mode: 'unknown', pattern: -5, step: 9999 }, 'squad', 1],
    [{ mode: 'pattern', pattern: 9999, step: 9999 }, 'pattern', 1]]) {
    const shared = clone(fixture);
    if (view) shared.view = view;
    await openShared(page, encode(shared));
    const current = await state(page);
    expect(current.view).toMatchObject({ appMode, patternIndex: 0, stepIndex, readOnly: true });
    await expect(page.locator(appMode === 'squad' ? '#field' : '#patternCanvas')).toBeVisible();
    expect(await stored(page)).toEqual(original);
  }
});

for (const [name, hash] of [
  ['empty', ''], ['malformed', '%not-base64%'], ['unsupported', encode({ ...fixture, v: 999 })],
  ['invalid snapshot', encode({ v: 1, team: '잘못된 공유', roster: [] })],
]) {
  test(name + ' share opens an error screen and preserves the original local tactic', async ({ page }) => {
    await boot(page);
    const local = await snapshot(page), original = await stored(page);
    await openShared(page, hash);
    await expect(page.locator('body')).toHaveClass(/share-error/);
    await expect(page.locator('#shareErrorPanel')).toBeVisible();
    await expect(page.locator('#field')).toBeHidden();
    await expect(page.locator('#teamNote')).toBeHidden();
    expect((await state(page)).view.readOnly).toBe(true);
    for (const [operation, payload] of [['retry-save'], ['import-snapshot', { snapshot: fixture }],
      ['export-sq'], ['export-png'], ['export-gif'], ['share-url']]) {
      expect((await run(page, operation, payload)).status).toBe('error');
    }
    expect(await stored(page)).toEqual(original);
    await page.locator('#shareErrorPanel').getByRole('button', { name: /내 전술/ }).click();
    await expect(page.locator('#shareErrorPanel')).toBeHidden();
    await page.evaluate(() => window.SquadMakerContract.ready());
    expect((await state(page)).view.readOnly).toBe(false);
    expect(await snapshot(page)).toEqual(local);
    expect(await stored(page)).toEqual(original);
  });
}

test('pause holds an in-flight frame, resume continues it, and restart explicitly returns to the first frame', async ({ page }) => {
  await boot(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  await page.clock.install({ time: new Date('2026-10-13T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-13T00:00:01Z'));
  await expect(page.getByRole('button', { name: '처음부터 재생', exact: true })).toBeVisible();
  await page.locator('#playBtn').click();
  await page.clock.runFor(640);
  const playing = await playback(page);
  expect(playing.progress).toBeGreaterThan(0.25);
  expect(playing.progress).toBeLessThan(0.5);
  await page.locator('#playBtn').click();
  const paused = await playback(page);
  expect(paused).toMatchObject({ playing: false, paused: true, step: 0 });
  await expect(page.locator('#playBtn')).toHaveText('이어서 재생');
  await page.clock.runFor(6000);
  expect(await playback(page)).toEqual(paused);
  await page.locator('#playBtn').click();
  await page.clock.runFor(320);
  const resumed = await playback(page);
  expect(resumed.step).toBe(0);
  expect(resumed.elapsed).toBeGreaterThan(paused.elapsed + 250);
  expect(resumed.elapsed).toBeLessThan(paused.elapsed + 350);
  expect(resumed.progress).toBeGreaterThan(paused.progress);
  await page.getByRole('button', { name: '처음부터 재생', exact: true }).click();
  await page.clock.runFor(32);
  expect(await playback(page)).toMatchObject({ playing: true, paused: false, step: 0 });
  expect((await playback(page)).elapsed).toBeLessThan(50);
});

test('pause during a step hold resumes the remaining hold and navigation leaves no stale playback', async ({ page }) => {
  await boot(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  await page.clock.install({ time: new Date('2026-10-13T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-13T00:00:01Z'));
  await page.locator('#playBtn').click();
  await page.clock.runFor(2000);
  await page.locator('#playBtn').click();
  const held = await playback(page);
  expect(held).toMatchObject({ playing: false, paused: true, step: 0, progress: 1 });
  await page.clock.runFor(6000);
  expect(await playback(page)).toEqual(held);
  await page.locator('#playBtn').click();
  await page.clock.runFor(320);
  expect((await playback(page)).step).toBe(1);
  await page.locator('#playBtn').click();
  await page.getByRole('button', { name: '이전 단계', exact: true }).click();
  await expect(page.locator('#playBtn')).toHaveText('미리보기');
  expect(await playback(page)).toMatchObject({ playing: false, paused: false, elapsed: 0, progress: 0 });
  await page.locator('#playBtn').click();
  await page.clock.runFor(300);
  await page.locator('.app-tab[data-app="squad"]').click();
  const stopped = await playback(page);
  await page.clock.runFor(12000);
  expect(await playback(page)).toEqual(stopped);
  expect(stopped).toMatchObject({ playing: false, paused: false, elapsed: 0 });
});

for (const clipboard of ['denied', 'missing']) {
  test('share URL copy fallback selects exactly the URL when clipboard is ' + clipboard, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await boot(page);
    const before = await snapshot(page), original = await stored(page);
    await page.evaluate(mode => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'missing' ? undefined : {
        writeText: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); },
      } });
      openShare();
    }, clipboard);
    const box = page.locator('#shareUrlBox');
    await expect(box).toHaveJSProperty('tagName', 'TEXTAREA');
    await expect(box).toHaveAttribute('readonly', '');
    const url = await box.inputValue();
    expect(url).toContain('#s=');
    await box.click();
    await page.locator('#shareModal').getByRole('button', { name: '링크 복사', exact: true }).click();
    await expect(box).toBeFocused();
    expect(await box.evaluate(element => element.value.slice(element.selectionStart, element.selectionEnd))).toBe(url);
    expect(await page.evaluate(() => window.getSelection().toString())).not.toContain('전술 공유');
    await expect(page.locator('.toast')).toContainText(/Ctrl\+C|길게 누르/);
    expect(errors).toEqual([]);
    expect(await snapshot(page)).toEqual(before);
    expect(await stored(page)).toEqual(original);
  });
}
