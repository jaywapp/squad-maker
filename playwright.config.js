// Guest regression contract runner — see docs/2026-07-20-monetization-implementation-plan.md Task 0.1
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  // CDN smoke는 배포 차단 대상이 아니므로 기본 실행에서 제외한다 (playwright.cdn.config.js)
  testIgnore: '**/cdn-smoke.spec.js',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  // GIF 인코딩이 CPU를 점유하므로 워커 경합을 피한다
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4317',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-390',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    // npx 래퍼를 거치면 Windows에서 손자 프로세스가 남아 종료가 지연된다 — 바이너리를 직접 실행
    command: 'node node_modules/http-server/bin/http-server -p 4317 -c-1 --silent .',
    url: 'http://127.0.0.1:4317/index.html',
    // 이전 실행이 남긴 서버를 재사용하면 Playwright가 그 서버를 종료하지 못한다
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
