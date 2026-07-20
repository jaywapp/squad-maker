// 분석 '활성 상태'의 최종 전송 본문 계약 — 리뷰 P1-1 / P1-2 회귀 방지.
// 어댑터의 safe 객체가 아니라 Umami가 실제로 /api/send로 보내는 payload를 검증한다.
// 실제 Umami 스크립트(tests/vendor/umami-script.js)를 주입하므로 자동 추가 필드까지 재현된다.
const { test, expect } = require('@playwright/test');
const { captureAnalyticsPayloads } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

function encodeSnap(snap) {
  return Buffer.from(JSON.stringify(snap), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// 절대 전송되어서는 안 되는 값들 (docs/analytics-event-dictionary.md 금지 목록)
const FORBIDDEN = ['FC 회귀', '김공격', '이미드', '박수비', '라인 간격을 유지한다', '전방 압박 우선'];

function assertNoLeak(payloads, encoded) {
  const dump = JSON.stringify(payloads);
  expect(dump).not.toContain('s=');            // 공유 해시 파라미터
  expect(dump).not.toContain(encoded.slice(0, 40)); // 스냅샷 본문 일부
  FORBIDDEN.forEach(v => expect(dump).not.toContain(v));
}

test.describe('분석 활성 상태 payload 계약', () => {

  test('#s= 뷰어에서도 전송 url에 해시·스냅샷이 없다', async ({ page }) => {
    const payloads = await captureAnalyticsPayloads(page);
    const encoded = encodeSnap(fixture);
    await page.goto('/index.html#s=' + encoded);
    await expect(page.locator('body')).toHaveClass(/viewer-mode/);
    await expect.poll(() => payloads.length, { timeout: 10_000 }).toBeGreaterThan(0);

    assertNoLeak(payloads, encoded);
    // url은 경로만 남는다
    payloads.forEach(p => {
      expect(p.payload.url).toBe('/index.html');
    });
  });

  test('편집·내보내기·공유 이벤트의 payload에도 콘텐츠가 없다', async ({ page }) => {
    const payloads = await captureAnalyticsPayloads(page);
    await page.addInitScript(
      ([k, v]) => localStorage.setItem(k, v),
      ['squad-maker-v1', JSON.stringify(fixture)]
    );
    await page.goto('/index.html');
    await page.fill('#teamName', 'FC 회귀');
    await page.click('button:has-text("단톡방 공유 텍스트 생성")');
    await page.click('.share-actions button:has-text("✕ 닫기")');
    await page.click('.interest-section button:has-text("선수별 브리핑")');
    await page.click('#interestModal button:has-text("닫기")');

    await expect
      .poll(() => payloads.filter(p => p.type === 'event').length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    assertNoLeak(payloads, encodeSnap(fixture));

    // 이벤트 이름은 사전에 등록된 것만 나간다
    const names = payloads.filter(p => p.payload.name).map(p => p.payload.name);
    expect(names).toContain('player_briefing_previewed');
    names.forEach(n => expect([
      'squad_started', 'squad_completed', 'image_exported', 'gif_exported',
      'share_link_created', 'share_link_opened',
      'cloud_save_interest_clicked', 'advanced_export_previewed', 'player_briefing_previewed',
    ]).toContain(n));
  });

  test('스크립트 로드가 지연돼도 초기 share_link_opened가 정확히 1회 전달된다', async ({ page }) => {
    // 앱 초기화보다 늦게 스크립트가 도착하는 상황 — 큐가 없으면 이벤트가 통째로 유실된다
    const payloads = await captureAnalyticsPayloads(page, { delayScriptMs: 1500 });
    await page.goto('/index.html#s=' + encodeSnap(fixture));
    await expect(page.locator('body')).toHaveClass(/viewer-mode/);

    await expect
      .poll(() => payloads.filter(p => p.payload.name === 'share_link_opened').length,
            { timeout: 15_000 })
      .toBe(1);
  });

  test('로드 전 같은 once 이벤트가 반복돼도 큐에는 1건만 남는다', async ({ page }) => {
    const payloads = await captureAnalyticsPayloads(page, { delayScriptMs: 1500 });
    await page.goto('/index.html');
    // 스크립트 도착 전에 여러 번 호출
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) track('share_link_opened', { kind: 'public' }, { once: true });
    });
    await expect
      .poll(() => payloads.filter(p => p.payload.name === 'share_link_opened').length,
            { timeout: 15_000 })
      .toBe(1);
  });

  test('로드 전 일반 이벤트는 발생 순서대로 전달된다', async ({ page }) => {
    const payloads = await captureAnalyticsPayloads(page, { delayScriptMs: 1500 });
    await page.goto('/index.html');
    await page.evaluate(() => {
      track('cloud_save_interest_clicked', { source: 'share_toolbar' });
      track('advanced_export_previewed', { source: 'share_toolbar' });
      track('player_briefing_previewed', { source: 'share_toolbar' });
    });
    await expect
      .poll(() => payloads.filter(p => p.payload.name?.endsWith('_previewed')
                                    || p.payload.name?.endsWith('_clicked')).length,
            { timeout: 15_000 })
      .toBe(3);
    const order = payloads.map(p => p.payload.name).filter(Boolean);
    expect(order).toEqual([
      'cloud_save_interest_clicked',
      'advanced_export_previewed',
      'player_briefing_previewed',
    ]);
  });

  test('분석 스크립트 로드 실패가 앱을 망가뜨리지 않는다', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await captureAnalyticsPayloads(page, { failScript: true });
    await page.goto('/index.html');
    await page.fill('#teamName', '차단환경');
    // 9v9 기본 명단은 이미 최대치(9명)이므로 추가 대신 편집·저장 경로로 확인한다
    await expect(page.locator('#field .player')).toHaveCount(9);
    await expect
      .poll(async () => {
        const raw = await page.evaluate(() => localStorage.getItem('squad-maker-v1'));
        return raw ? JSON.parse(raw).team : null;
      }, { timeout: 5_000 })
      .toBe('차단환경');
    expect(errors).toEqual([]);
  });

});
