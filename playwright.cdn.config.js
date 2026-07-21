// 외부 CDN smoke 전용 설정 — 기본 `npm test`에 포함되지 않는다.
// 여기서의 실패는 앱 회귀가 아니라 공급자·네트워크 문제를 뜻한다.
const { defineConfig, devices } = require('@playwright/test');
const base = require('./playwright.config');

module.exports = defineConfig({
  ...base,
  testIgnore: undefined,
  testMatch: '**/cdn-smoke.spec.js',
  projects: [
    { name: 'cdn-smoke', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
});
