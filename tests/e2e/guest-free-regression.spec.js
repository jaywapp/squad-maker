// Guest 무료 기능 회귀 계약 — 수익화 작업이 기존 무료 경험을 깨지 않는지 고정한다.
// 계약 문서: docs/2026-07-20-monetization-implementation-plan.md §2.1, §7.1 Task 0.1
// 주의: PNG/GIF 내보내기는 CDN(html2canvas, gif.js)을 사용하므로 네트워크가 필요하다.
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const fixture = require('../fixtures/snapshot-v1.json');

const LS_KEY = 'squad-maker-v1';

// index.html encodeState()와 동일한 URL-safe base64 (UTF-8 bytes)
function encodeSnap(snap) {
  return Buffer.from(JSON.stringify(snap), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function seedLocalStorage(page, snap) {
  return page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [LS_KEY, JSON.stringify(snap)]
  );
}

test.describe('Guest 무료 회귀 계약', () => {

  test('앱이 편집 모드로 로드되고 페이지 오류가 없다', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/index.html');
    await expect(page.locator('h1.wordmark')).toBeVisible();
    await expect(page.locator('#addPlayerBtn')).toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(/viewer-mode/);
    expect(errors).toEqual([]);
  });

  test('LocalStorage v:1 스냅샷이 그대로 복원된다', async ({ page }) => {
    await seedLocalStorage(page, fixture);
    await page.goto('/index.html');
    await expect(page.locator('#teamName')).toHaveValue('FC 회귀');
    await expect(page.locator('#field .player')).toHaveCount(3);
    // 지침도 복원되어야 한다
    await expect(page.locator('#teamNote')).toHaveValue('라인 간격을 유지한다');
  });

  test('편집(선수 추가·팀명)이 v:1로 자동 저장된다', async ({ page }) => {
    await seedLocalStorage(page, fixture);
    await page.goto('/index.html');
    await page.fill('#teamName', '자동저장FC');
    await page.click('#addPlayerBtn');
    await expect(page.locator('#field .player')).toHaveCount(4);
    await expect
      .poll(async () => {
        const raw = await page.evaluate(k => localStorage.getItem(k), LS_KEY);
        if (!raw) return null;
        const snap = JSON.parse(raw);
        return { v: snap.v, team: snap.team, rosterLen: snap.roster.length };
      }, { timeout: 5_000 })
      .toEqual({ v: 1, team: '자동저장FC', rosterLen: 4 });
  });

  test('PNG 이미지 내보내기가 동작한다', async ({ page }) => {
    await seedLocalStorage(page, fixture);
    await page.goto('/index.html');
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.click('button:has-text("이미지 저장")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test('패턴 추가와 단일 패턴 GIF 내보내기가 동작한다', async ({ page }) => {
    await seedLocalStorage(page, fixture);
    await page.goto('/index.html');
    await page.click('.app-tab[data-app="pattern"]');
    await page.click('#patternUI button:has-text("+ 추가")');
    await expect(page.locator('#patternCounter')).toHaveText('2 / 2');
    const downloadPromise = page.waitForEvent('download', { timeout: 90_000 });
    await page.click('#gifBtn');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.gif$/);
    // 진행 오버레이가 닫혀야 한다
    await expect(page.locator('#gifProgress')).not.toHaveClass(/visible/);
  });

  test('전체 패턴 GIF 내보내기가 동작한다', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', '인코딩 시간 절약 — 데스크톱에서만 검증');
    await seedLocalStorage(page, fixture);
    await page.goto('/index.html');
    await page.click('.app-tab[data-app="pattern"]');
    const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
    await page.click('#gifAllBtn');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('전체패턴.gif');
  });

  test('#s= 공유 URL이 뷰어 모드로 열린다', async ({ page }) => {
    await page.goto('/index.html#s=' + encodeSnap(fixture));
    await expect(page.locator('body')).toHaveClass(/viewer-mode/);
    await expect(page.locator('#viewerBar')).toBeVisible();
    await expect(page.locator('#vbTitle')).toContainText('FC 회귀');
    // 편집 UI는 숨겨진다
    await expect(page.locator('#addPlayerBtn')).toBeHidden();
    await expect(page.locator('#teamName')).toBeHidden();
    await expect(page.locator('#field .player')).toHaveCount(3);
  });

  test('뷰어에서 선수 시점 보기가 동작한다', async ({ page }) => {
    await page.goto('/index.html#s=' + encodeSnap(fixture));
    await page.click('.controls.viewer-only button:has-text("선수 시점 보기")');
    await expect(page.locator('#playerViewModal')).toBeVisible();
    await expect(page.locator('#pvCards .pv-squad-card')).toHaveCount(3);
  });

  test('공유 링크 열람이 기존 LocalStorage를 변경하지 않는다', async ({ page }) => {
    const mine = { ...fixture, team: '내로컬팀' };
    const raw = JSON.stringify(mine);
    await seedLocalStorage(page, mine);
    await page.goto('/index.html#s=' + encodeSnap(fixture));
    await expect(page.locator('body')).toHaveClass(/viewer-mode/);
    // autoSave 디바운스(600ms)보다 충분히 길게 기다린 뒤 원본 보존 확인
    await page.waitForTimeout(1500);
    const after = await page.evaluate(k => localStorage.getItem(k), LS_KEY);
    expect(after).toBe(raw);
  });

  test('.sq 파일 저장·불러오기 왕복이 데이터를 보존한다', async ({ page }) => {
    await seedLocalStorage(page, fixture);
    await page.goto('/index.html');
    const downloadPromise = page.waitForEvent('download');
    await page.click('[aria-label="공유 및 파일"] button:has-text("파일 저장")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.sq$/);
    const savedPath = await download.path();
    const saved = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
    expect(saved.v).toBe(1);
    expect(saved.team).toBe('FC 회귀');
    expect(saved.roster).toHaveLength(3);
    expect(saved.pat[0].n).toBe('오버랩');
    expect(saved.pat[0].s).toHaveLength(2);

    // 상태를 바꾼 뒤 같은 파일을 다시 불러오면 원본이 복원된다
    await page.fill('#teamName', '변경된팀');
    await page.click('#addPlayerBtn');
    await expect(page.locator('#field .player')).toHaveCount(4);
    await page.setInputFiles('#sqFileInput', savedPath);
    await expect(page.locator('#teamName')).toHaveValue('FC 회귀');
    await expect(page.locator('#field .player')).toHaveCount(3);
  });

});
