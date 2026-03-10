/**
 * Smoke Tests Template — Playwright
 *
 * Verificacoes minimas pos-deploy. Padroes extraidos de
 * raiz-platform e rAIz-AI-Prof (producao real).
 *
 * Customizar: KNOWN_BENIGN_ERRORS, URLs, seletores.
 */
import { test, expect } from '@playwright/test';

// --- CUSTOMIZAR: erros conhecidos e benignos do projeto ---
const KNOWN_BENIGN_ERRORS = [
  'WebSocket',
  'DevTools',
  'service-worker',
  'favicon',
  'ResizeObserver',
  'HMR',
];

function isBenign(text: string): boolean {
  return KNOWN_BENIGN_ERRORS.some((p) => text.includes(p));
}

test.describe('Smoke: Health', () => {
  test('homepage loads without critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (!isBenign(err.message)) errors.push(err.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isBenign(msg.text())) {
        errors.push(msg.text());
      }
    });

    const response = await page.goto('/', { timeout: 30000 });
    expect(response?.status()).toBeLessThan(400);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Allow async errors to surface
    expect(errors).toHaveLength(0);
  });

  test('CSS and JS assets load successfully', async ({ page }) => {
    const failedAssets: string[] = [];
    page.on('requestfailed', (req) => {
      if (['stylesheet', 'script'].includes(req.resourceType())) {
        failedAssets.push(`${req.resourceType()}: ${req.url()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(failedAssets).toHaveLength(0);
  });

  test('page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - start).toBeLessThan(5000);
  });
});

test.describe('Smoke: Navigation', () => {
  test('login page is accessible', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBeLessThan(400);
    // --- CUSTOMIZAR: seletor do botao de login ---
    const button = page.getByRole('button', { name: /login|sign in|entrar/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated user redirected to login', async ({ page }) => {
    // --- CUSTOMIZAR: pagina protegida ---
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login|auth|signin/);
  });
});

test.describe('Smoke: Stability', () => {
  test('no 5xx errors during page load', async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 500) {
        serverErrors.push(`HTTP ${res.status()}: ${res.url()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(serverErrors).toHaveLength(0);
  });

  test('no broken images on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const broken = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter((img) => img.naturalWidth === 0 && img.src && !img.src.includes('data:'))
        .map((img) => img.src);
    });

    expect(broken).toHaveLength(0);
  });

  // --- OPCIONAL: health endpoint ---
  // test('health endpoint responds', async ({ request }) => {
  //   const response = await request.get('/api/health');
  //   expect(response.status()).toBe(200);
  // });
});
