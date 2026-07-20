// 외부 CDN 요청을 고정 버전 로컬 자산으로 대체한다 (tests/vendor/README.md 참고).
// 스텁이 아니라 실제 라이브러리를 주입하므로 PNG·GIF 내보내기 경로가 진짜로 실행된다.
const fs = require('fs');
const path = require('path');

const VENDOR = path.join(__dirname, '..', 'vendor');
const read = f => fs.readFileSync(path.join(VENDOR, f));

const ROUTES = [
  ['**/html2canvas.min.js', 'html2canvas.min.js'],
  ['**/gif.js/0.2.0/gif.js', 'gif.js'],
  ['**/gif.js/0.2.0/gif.worker.js', 'gif.worker.js'],
];

const isLocal = url => /^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url);

/**
 * PNG·GIF 라이브러리를 로컬 고정 자산으로 제공하고, 그 외 모든 외부 요청을 차단한다.
 * 외부 네트워크가 완전히 끊긴 상태에서도 테스트가 통과해야 배포 차단 테스트로 쓸 수 있다.
 * (구글 폰트 등 비필수 리소스는 차단되며, 앱은 폴백 폰트로 정상 동작한다.)
 */
async function stubExportCdn(page) {
  // 먼저 등록한 catch-all보다 나중에 등록한 구체적 route가 우선한다
  await page.route('**/*', route =>
    isLocal(route.request().url()) ? route.continue() : route.abort('blockedbyclient')
  );
  for (const [pattern, file] of ROUTES) {
    await page.route(pattern, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript; charset=utf-8',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: read(file),
      })
    );
  }
}

/**
 * 분석을 활성 상태로 만들고 Umami로 나가는 최종 전송 본문을 수집한다.
 * 반환된 배열에는 실제 요청 payload가 그대로 담긴다.
 * @param {import('@playwright/test').Page} page
 * @param {{delayScriptMs?: number, failScript?: boolean}} opts
 */
async function captureAnalyticsPayloads(page, opts = {}) {
  const payloads = [];
  await page.addInitScript(() => { window.SQUAD_MAKER_ANALYTICS_ID = 'test-website-id'; });

  await page.route('**/cloud.umami.is/script.js', async route => {
    if (opts.failScript) return route.abort('failed');
    if (opts.delayScriptMs) await new Promise(r => setTimeout(r, opts.delayScriptMs));
    route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: read('umami-script.js'),
    });
  });

  await page.route('**/api/send', route => {
    try { payloads.push(JSON.parse(route.request().postData() || '{}')); } catch {}
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  return payloads;
}

module.exports = { stubExportCdn, captureAnalyticsPayloads };
