/**
 * Playwright Config Template — Canonical 2026
 *
 * Defaults oficiais playwright.dev:
 *  - Chromium isolado (sem channel: 'chrome')
 *  - Headless default (CI e dev)
 *  - trace on first retry, screenshot/video on failure
 *  - Isolation por context, fullyParallel
 *  - storageState via setup project
 *
 * Customizar: BASE_URL, projects (firefox/webkit se cross-browser),
 * webServer command/url, storageState paths.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    // channel: NAO setado → Chromium default (canonical)
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // Setup project para auth via storageState
    // {
    //   name: 'setup',
    //   testMatch: /global\.setup\.ts/,
    // },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // storageState: '.auth/user.json',  // descomentar se usar setup
      },
      // dependencies: ['setup'],            // descomentar se usar setup
    },
    // Adicionar firefox/webkit SO se cross-browser e requisito real
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: process.env.CI
    ? {
        // --- CUSTOMIZAR: comando para subir o app em CI ---
        command: 'npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
});
