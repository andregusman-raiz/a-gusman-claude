/**
 * Playwright Base Config Template
 *
 * Config base reutilizavel. Importar no playwright.config.ts do projeto
 * e customizar projects, baseURL, etc.
 *
 * Uso no projeto:
 * ```
 * import { baseConfig } from './tests/e2e/shared/playwright.base.config';
 * export default defineConfig({ ...baseConfig, projects: [...] });
 * ```
 */
import { defineConfig, devices } from '@playwright/test';

export const baseConfig = defineConfig({
  // Diretorio de testes (customizar no projeto)
  testDir: './tests/e2e',

  // Timeouts
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Paralelismo
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  // Retries
  retries: process.env.CI ? 2 : 0,

  // Reporter
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }]],

  // Artefatos
  use: {
    // Base URL (customizar no projeto)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Traces e screenshots
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    // Viewport padrao
    viewport: { width: 1280, height: 720 },
  },

  // Projetos padrao — CUSTOMIZAR no projeto
  projects: [
    // Setup de auth (roda primeiro)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Chromium (principal)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Smoke tests (sem auth, rapido)
    {
      name: 'smoke',
      testMatch: /.*smoke.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
      timeout: 30_000,
    },
  ],
});
