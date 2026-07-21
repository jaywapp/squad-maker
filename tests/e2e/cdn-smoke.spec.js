// CDN 연결 smoke 테스트 — 배포 차단 대상이 **아니다**.
// 앱이 런타임에 의존하는 외부 CDN이 실제로 응답하는지만 확인한다.
// 실패는 앱 회귀가 아니라 공급자 장애·네트워크 제한을 뜻하므로 별도 config로 분리했다.
//   실행: npm run test:cdn
const { test, expect } = require('@playwright/test');

const CDN_ASSETS = [
  ['html2canvas', 'https://html2canvas.hertzen.com/dist/html2canvas.min.js'],
  ['gif.js', 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js'],
  ['gif.js worker', 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'],
];

test.describe('외부 CDN 가용성 (공급자 상태 확인)', () => {

  for (const [name, url] of CDN_ASSETS) {
    test(`${name} 응답 확인`, async ({ request }) => {
      const res = await request.get(url, { timeout: 20_000 });
      expect(res.status(), `${name} CDN 응답 실패 — 앱 회귀가 아니라 공급자·네트워크 문제`).toBe(200);
      expect((await res.body()).length).toBeGreaterThan(1000);
    });
  }

  test('실제 CDN으로 PNG 내보내기가 동작한다', async ({ page }) => {
    await page.goto('/index.html');
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.click('button:has-text("이미지 저장")');
    expect((await downloadPromise).suggestedFilename()).toMatch(/\.png$/);
  });

});
