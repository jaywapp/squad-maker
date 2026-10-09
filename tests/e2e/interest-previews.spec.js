// 출시 전 기능 미리보기(수요 측정 UI) 검증 — 계획서 Task 0.3
// 무료 기능 불변(§2.1)은 guest-free-regression.spec.js가 보증한다.
const { test, expect } = require('@playwright/test');
const fixture = require('../fixtures/snapshot-v1.json');

function encodeSnap(snap) {
  return Buffer.from(JSON.stringify(snap), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function collectAnalytics(page) {
  const events = [];
  page.on('console', async msg => {
    if (msg.type() !== 'debug') return;
    try {
      const args = msg.args();
      if (!args.length || (await args[0].jsonValue()) !== '[analytics]') return;
      events.push({
        name: await args[1].jsonValue(),
        props: args[2] ? await args[2].jsonValue() : {},
      });
    } catch {}
  });
  return events;
}

async function expectUndecidedOffer(modal) {
  await expect(modal).toContainText('제공 범위와 가격은 아직 정해지지 않았습니다.');
  await expect(modal).not.toContainText(/\d[\d,]*\s*원|월\s*\d|팀\s*1개|문서\s*5개|Pro/);
}

test.describe('출시 전 기능 미리보기', () => {

  test('세 진입점이 편집 모드에 표시되고 클릭 시 정직한 안내 모달이 열린다', async ({ page }) => {
    const events = collectAnalytics(page);
    await page.goto('/index.html');
    const section = page.locator('.interest-section');
    await expect(section).toBeVisible();
    await expect(section.locator('.interest-chip')).toHaveCount(3);

    await section.locator('button:has-text("클라우드에 팀 저장")').click();
    const modal = page.locator('#interestModal');
    await expect(modal).toBeVisible();
    // Disclose the preview, undecided offer, and unchanged privacy boundary.
    await expect(modal).toContainText('아직 출시 전인 기능입니다');
    await expect(modal).toContainText('무료 기능은 그대로 무료');
    await expectUndecidedOffer(modal);
    await expect(modal).toContainText('개인정보는 수집하지 않습니다');
    await expect
      .poll(() => events.filter(e => e.name === 'cloud_save_interest_clicked').length)
      .toBe(1);
    expect(events.find(e => e.name === 'cloud_save_interest_clicked').props)
      .toEqual({ source: 'share_toolbar' });

    await modal.locator('button:has-text("닫기")').click();
    await expect(modal).toBeHidden();
  });

  test('기능별 클릭이 서로 다른 이벤트·진입 위치로 구분된다', async ({ page }) => {
    const events = collectAnalytics(page);
    await page.goto('/index.html');
    await page.click('.interest-section button:has-text("고급 영상 내보내기")');
    await expectUndecidedOffer(page.locator('#interestModal'));
    await page.click('#interestModal button:has-text("닫기")');
    await page.click('.interest-section button:has-text("선수별 브리핑")');
    await expectUndecidedOffer(page.locator('#interestModal'));
    await page.click('#interestModal button:has-text("닫기")');
    // 패턴 모드의 진입점은 pattern_controls로 구분된다
    await page.click('.app-tab[data-app="pattern"]');
    await expect(page.locator('.interest-section .interest-chip')).toHaveCount(3);
    await expect(page.locator('.interest-section')).toBeHidden();
    await expect(page.locator('.pattern-release-group')).toBeVisible();
    await expect(page.locator('.pattern-release-group .interest-chip')).toHaveCount(1);
    await page.click('.pattern-release-group button:has-text("고급 영상 (준비 중)")');
    await expect
      .poll(() => events.filter(e => e.name === 'advanced_export_previewed').length)
      .toBe(2);
    const sources = events
      .filter(e => e.name === 'advanced_export_previewed')
      .map(e => e.props.source)
      .sort();
    expect(sources).toEqual(['pattern_controls', 'share_toolbar']);
    expect(events.filter(e => e.name === 'player_briefing_previewed')).toHaveLength(1);
  });

  test('뷰어 모드에서는 수요 측정 진입점이 노출되지 않는다', async ({ page }) => {
    await page.goto('/index.html#s=' + encodeSnap(fixture));
    await expect(page.locator('body')).toHaveClass(/viewer-mode/);
    await expect(page.locator('.interest-section')).toBeHidden();
    await expect(page.locator('.pattern-release-group')).toBeHidden();
  });

  test('인터뷰 참여 링크는 mailto이며 이메일을 분석 이벤트로 보내지 않는다', async ({ page }) => {
    const events = collectAnalytics(page);
    await page.goto('/index.html');
    await page.click('.interest-section button:has-text("선수별 브리핑")');
    await expectUndecidedOffer(page.locator('#interestModal'));
    const href = await page.locator('#interestMail').getAttribute('href');
    expect(href).toMatch(/^mailto:/);
    await expect
      .poll(() => events.filter(e => e.name === 'player_briefing_previewed').length)
      .toBe(1);
    // 이벤트 속성에는 source만 존재 — 이메일·연락처 계열 키 없음
    expect(events.find(e => e.name === 'player_briefing_previewed').props)
      .toEqual({ source: 'share_toolbar' });
  });

});
