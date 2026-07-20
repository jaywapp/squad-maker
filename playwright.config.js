// Guest regression contract runner — see docs/2026-07-20-monetization-implementation-plan.md Task 0.1
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
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
    command: 'npx http-server -p 4317 -c-1 --silent .',
    url: 'http://127.0.0.1:4317/index.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
