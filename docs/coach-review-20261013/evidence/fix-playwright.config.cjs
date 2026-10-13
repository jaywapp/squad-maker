const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '../../../tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: './fix-playwright-results',
  use: { baseURL: 'http://127.0.0.1:4397', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-390', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } },
  ],
});
