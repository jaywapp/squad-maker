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

  test('진단 정보에는 팀명·선수명·지침이 포함되지 않는다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    // 민감한 값이 들어 있는 스냅샷을 URL로 복원한 뒤 진단 정보를 생성한다
    const snap = JSON.parse(JSON.stringify(fixture));
    await page.goto('/index.html#s=' + encodeSnap(snap));
    const diag = await page.evaluate(() => window.buildDiagnostics());

    // 스냅샷에 실제로 존재하는 민감 값들을 수집해 진단 문자열에 없는지 확인
    const forbidden = [];
    if (snap.team) forbidden.push(snap.team);
    (snap.roster || []).forEach(r => r.name && forbidden.push(r.name));
    Object.values(snap.squads || {}).forEach(sq => {
      if (sq.tn) forbidden.push(sq.tn);           // teamNote (직렬화 축약 키)
      Object.values(sq.pn || {}).forEach(n => n && forbidden.push(n)); // playerNotes
    });
    expect(forbidden.length).toBeGreaterThan(0); // 픽스처에 민감 값이 실제로 있어야 의미 있음
    for (const value of forbidden) {
      expect(diag).not.toContain(value);
    }
    // 대신 환경 정보는 담고 있어야 한다
    expect(diag).toContain('버전:');
    expect(diag).toContain('스쿼드 메이커 진단 정보');
  });

  test('뷰어 모드에서도 도움말·의견 버튼을 쓸 수 있다', async ({ page }) => {
    await page.goto('/index.html#s=' + encodeSnap(fixture));
    await expect(page.locator('body.viewer-mode')).toBeVisible();
    await expect(page.locator('.topbar button:has-text("도움말")')).toBeVisible();
    await page.click('.topbar button:has-text("도움말")');
    await expect(page.locator('#helpModal')).toBeVisible();
  });

});
