// 분석 이벤트 계약 검증 — docs/analytics-event-dictionary.md
// localhost(dev)에서는 전송 대신 console.debug('[analytics]', name, props)가 출력된다.
const { test, expect } = require('@playwright/test');
const fixture = require('../fixtures/snapshot-v1.json');

function encodeSnap(snap) {
  return Buffer.from(JSON.stringify(snap), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// console.debug('[analytics]', ...) 호출을 {name, props} 배열로 수집
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

test.describe('분석 이벤트 계약', () => {

  test('squad_started는 여러 번 편집해도 세션당 1회만 발생한다', async ({ page }) => {
    const events = collectAnalytics(page);
    await page.goto('/index.html');
    await page.fill('#teamName', '분석');
    await page.fill('#teamName', '분석FC');
    await page.fill('#teamName', '분석FC2');
    await expect
      .poll(() => events.filter(e => e.name === 'squad_started').length, { timeout: 5_000 })
      .toBe(1);
    const started = events.find(e => e.name === 'squad_started');
    expect(started.props).toEqual({ mode: '9v9' });
  });

  test('페이지 로드·복원만으로는 squad_started가 발생하지 않는다', async ({ page }) => {
    const events = collectAnalytics(page);
    await page.goto('/index.html');
    await page.waitForTimeout(1200); // 초기화 autoSave 디바운스 경과 대기
    expect(events.filter(e => e.name === 'squad_started')).toHaveLength(0);
  });

  test('공유 생성 시 share_link_created는 매번, squad_completed는 1회만 발생한다', async ({ page }) => {
    const events = collectAnalytics(page);
    await page.goto('/index.html');
    await page.click('button:has-text("단톡방 공유 텍스트 생성")');
    await page.click('.share-actions button:has-text("✕ 닫기")');
    await page.click('button:has-text("단톡방 공유 텍스트 생성")');
    await expect
      .poll(() => events.filter(e => e.name === 'share_link_created').length, { timeout: 5_000 })
      .toBe(2);
    expect(events.filter(e => e.name === 'squad_completed')).toHaveLength(1);
    const completed = events.find(e => e.name === 'squad_completed');
    expect(Object.keys(completed.props).sort()).toEqual(['mode', 'patterns_used']);
  });

  test('#s= 뷰어 진입 시 share_link_opened가 1회 발생한다', async ({ page }) => {
    const events = collectAnalytics(page);
    await page.goto('/index.html#s=' + encodeSnap(fixture));
    await expect(page.locator('body')).toHaveClass(/viewer-mode/);
    await expect
      .poll(() => events.filter(e => e.name === 'share_link_opened').length, { timeout: 5_000 })
      .toBe(1);
    expect(events.find(e => e.name === 'share_link_opened').props).toEqual({ kind: 'public' });
  });

  test('화이트리스트 밖 속성과 미등록 이벤트는 폐기된다', async ({ page }) => {
    const events = collectAnalytics(page);
    await page.goto('/index.html');
    await page.evaluate(() => {
      // 이름·URL 등 금지 값이 실수로 넘어와도 전송 페이로드에서 제거되어야 한다
      track('image_exported', { kind: 'png', ok: true, name: '김선수', url: '#s=abc', note: '지침' });
      track('unregistered_event', { foo: 1 });
    });
    await expect
      .poll(() => events.filter(e => e.name === 'image_exported').length, { timeout: 5_000 })
      .toBe(1);
    expect(events.find(e => e.name === 'image_exported').props).toEqual({ kind: 'png', ok: 'true' });
    expect(events.filter(e => e.name === 'unregistered_event')).toHaveLength(0);
  });

  test('websiteId가 비어 있으면 분석 네트워크 요청이 없다', async ({ page }) => {
    const analyticsRequests = [];
    page.on('request', req => {
      if (/umami|plausible|analytics/i.test(req.url())) analyticsRequests.push(req.url());
    });
    await page.goto('/index.html');
    await page.fill('#teamName', '무전송');
    await page.waitForTimeout(1000);
    expect(analyticsRequests).toEqual([]);
    // 분석이 비활성이어도 앱은 정상 동작한다
    await expect(page.locator('#field .player')).toHaveCount(9);
  });

});
