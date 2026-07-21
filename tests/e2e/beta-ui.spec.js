// 베타 운영 UI(도움말·의견 보내기·버전·진단) 계약 — docs/2026-07-21-beta-readiness.md
// 기존 무료 기능 불변(§2.1)은 guest-free-regression.spec.js가 보증한다.
const { test, expect } = require('@playwright/test');
const fixture = require('../fixtures/snapshot-v1.json');

function encodeSnap(snap) {
  return Buffer.from(JSON.stringify(snap), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

test.describe('베타 운영 UI', () => {

  test('버전이 상단에 표시된다', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#appVersion')).toHaveText(/beta/);
  });

  test('도움말 모달이 열리고 닫힌다', async ({ page }) => {
    await page.goto('/index.html');
    const modal = page.locator('#helpModal');
    await expect(modal).toBeHidden();
    await page.click('.topbar button:has-text("도움말")');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('스쿼드 짜기');
    await expect(modal).toContainText('공유하기');
    await modal.locator('button:has-text("닫기")').click();
    await expect(modal).toBeHidden();
  });

  test('의견 폼 URL이 없으면 새 탭을 열지 않고 안내만 한다', async ({ page, context }) => {
    await page.goto('/index.html');
    let opened = false;
    context.on('page', () => { opened = true; });
    await page.click('.topbar button:has-text("의견 보내기")');
    await expect(page.locator('#_toast')).toContainText('준비 중');
    // 짧게 대기해도 새 탭이 열리지 않아야 한다
    await page.waitForTimeout(300);
    expect(opened).toBe(false);
  });

  test('의견 폼 URL이 설정되면 새 탭으로 폼을 연다', async ({ page, context }) => {
    await page.addInitScript(() => {
      window.SQUAD_MAKER_FEEDBACK_URL = 'https://example.com/beta-form';
    });
    await page.goto('/index.html');
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('.topbar button:has-text("의견 보내기")'),
    ]);
    expect(popup.url()).toContain('example.com/beta-form');
    await popup.close();
  });

  // 반환값이 아니라 실제로 클립보드에 쓰이는 값을 검사한다.
  // 각 민감 필드에 12자 이하(정규화 시 잘리지 않는) 고유 canary를 심어,
  // 어느 경로로든 그 값이 새어 나가면 실패하게 한다.
  test('진단 복사·의견 전송이 클립보드에 개인정보를 쓰지 않는다', async ({ page }) => {
    const CANARY = {
      team: 'ZZTEAMQ',
      name: 'ZZPLYRQ',
      teamNote: 'ZZTNOTEQ',
      playerNote: 'ZZPNOTEQ',
      pattern: 'ZZPATQ',
    };
    await page.addInitScript(() => {
      // 클립보드 스파이 + 폼 URL 주입 (openFeedback이 실제 쓰기 경로를 타게 함)
      window.__clip = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: t => { window.__clip.push(String(t)); return Promise.resolve(); } },
      });
      window.SQUAD_MAKER_FEEDBACK_URL = 'https://example.com/beta-form';
    });

    const snap = JSON.parse(JSON.stringify(fixture));
    snap.team = CANARY.team;
    snap.roster[0].name = CANARY.name;
    snap.squads.basic.tn = CANARY.teamNote;
    snap.squads.basic.pn = { '1': CANARY.playerNote };
    snap.pat[0].n = CANARY.pattern;
    await page.goto('/index.html#s=' + encodeSnap(snap));

    // 두 복사 경로를 실제로 실행
    await page.evaluate(() => window.copyDiagnostics());
    await page.evaluate(() => window.openFeedback());

    const writes = await page.evaluate(() => window.__clip);
    expect(writes.length).toBeGreaterThanOrEqual(2); // copyDiagnostics + openFeedback
    const all = writes.join('\n');
    for (const value of Object.values(CANARY)) {
      expect(all).not.toContain(value);
    }
    // 쓰인 값은 허용된 진단 정보여야 한다
    expect(writes[0]).toContain('스쿼드 메이커 진단 정보');
    expect(writes[0]).toContain('버전:');
  });

  test('도움말 모달은 Escape와 배경 클릭으로 닫힌다', async ({ page }) => {
    await page.goto('/index.html');
    const modal = page.locator('#helpModal');

    await page.click('.topbar button:has-text("도움말")');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    // 닫은 뒤 트리거 버튼으로 포커스가 복원된다
    await expect(page.locator('.topbar button:has-text("도움말")')).toBeFocused();

    await page.click('.topbar button:has-text("도움말")');
    await expect(modal).toBeVisible();
    await modal.click({ position: { x: 5, y: 5 } }); // 배경(백드롭) 클릭
    await expect(modal).toBeHidden();
  });

  test('뷰어 모드에서도 도움말·의견 버튼을 쓸 수 있다', async ({ page }) => {
    await page.goto('/index.html#s=' + encodeSnap(fixture));
    await expect(page.locator('body.viewer-mode')).toBeVisible();
    await expect(page.locator('.topbar button:has-text("도움말")')).toBeVisible();
    await page.click('.topbar button:has-text("도움말")');
    await expect(page.locator('#helpModal')).toBeVisible();
  });

});
