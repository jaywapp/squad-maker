const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: path.resolve(__dirname, '../../../tests/e2e'),
  outputDir: path.resolve(__dirname, 'playwright-results'),
  timeout: 120000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: path.resolve(__dirname, 'playwright-results.json') }]],
  use: { baseURL: 'http://127.0.0.1:4397', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile-390-review', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } }],
});
