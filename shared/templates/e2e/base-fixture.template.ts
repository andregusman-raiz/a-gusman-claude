/**
 * Base Test Fixture Template — Playwright
 *
 * Extende test com error capture automatico.
 * Padrao extraido de rAIz-AI-Prof (producao real).
 *
 * Uso no projeto:
 * ```
 * import { test, expect, assertNoErrors } from './fixtures/base';
 * ```
 */
import { test as baseTest, expect } from '@playwright/test';

export interface CapturedErrors {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  httpErrors: string[];
}

// --- CUSTOMIZAR: adicionar erros benignos do projeto ---
const KNOWN_ERROR_PATTERNS = [
  'WebSocket',
  'DevTools',
  'service-worker',
  'favicon',
  'ResizeObserver',
  'HMR',
];

function matchesPattern(text: string): boolean {
  return KNOWN_ERROR_PATTERNS.some((p) => text.includes(p));
}

export const test = baseTest.extend<{ capturedErrors: CapturedErrors }>({
  capturedErrors: [
    async ({ page }, use) => {
      const errors: CapturedErrors = {
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        httpErrors: [],
      };

      page.on('console', (msg) => {
        if (msg.type() === 'error' && !matchesPattern(msg.text())) {
          errors.consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        if (!matchesPattern(err.message)) {
          errors.pageErrors.push(err.message);
        }
      });

      page.on('requestfailed', (req) => {
        if (!matchesPattern(req.url())) {
          errors.failedRequests.push(`${req.method()} ${req.url()}`);
        }
      });

      page.on('response', (res) => {
        if (res.status() >= 500 && !matchesPattern(res.url())) {
          errors.httpErrors.push(`HTTP ${res.status()}: ${res.url()}`);
        }
      });

      await use(errors);
    },
    { auto: true },
  ],
});

export { expect };

/** Falha se QUALQUER erro capturado (strict) */
export function assertNoErrors(errors: CapturedErrors): void {
  const all = [
    ...errors.pageErrors.map((e) => `[PageError] ${e}`),
    ...errors.failedRequests.map((e) => `[NetworkFail] ${e}`),
    ...errors.httpErrors.map((e) => `[HTTP5xx] ${e}`),
  ];
  if (all.length > 0) {
    throw new Error(`Captured errors:\n${all.join('\n')}`);
  }
}

/** Falha apenas em erros criticos (page errors + 5xx) */
export function assertNoCriticalErrors(errors: CapturedErrors): void {
  const critical = [
    ...errors.pageErrors.map((e) => `[PageError] ${e}`),
    ...errors.httpErrors.map((e) => `[HTTP5xx] ${e}`),
  ];
  if (critical.length > 0) {
    throw new Error(`Critical errors:\n${critical.join('\n')}`);
  }
}
