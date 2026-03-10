/**
 * Access Control Tests Template — Playwright
 *
 * Verifica que rotas protegidas respeitam permissoes.
 * OBRIGATORIO para toda rota protegida (>= 2 roles).
 *
 * Customizar: roles, rotas, seletores.
 */
import { test, expect } from '@playwright/test';

// --- CUSTOMIZAR: definir rotas e permissoes ---
const PROTECTED_ROUTES = [
  { path: '/dashboard', allowedRoles: ['admin', 'user'], deniedRoles: ['guest'] },
  { path: '/admin', allowedRoles: ['admin'], deniedRoles: ['user', 'guest'] },
  // Adicionar rotas do projeto...
];

test.describe('Access Control', () => {
  // Teste sem autenticacao
  test.describe('Unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    for (const route of PROTECTED_ROUTES) {
      test(`${route.path} redirects to login`, async ({ page }) => {
        await page.goto(route.path);
        await expect(page).toHaveURL(/login|auth|signin/);
      });
    }
  });

  // --- CUSTOMIZAR: testes por role ---
  // Para cada role, criar storageState separado via setup project

  // test.describe('Role: admin', () => {
  //   test.use({ storageState: '.auth/admin.json' });
  //
  //   test('can access /admin', async ({ page }) => {
  //     await page.goto('/admin');
  //     await expect(page).not.toHaveURL(/login|auth|403/);
  //     expect(await page.title()).not.toContain('Forbidden');
  //   });
  // });

  // test.describe('Role: user', () => {
  //   test.use({ storageState: '.auth/user.json' });
  //
  //   test('cannot access /admin', async ({ page }) => {
  //     await page.goto('/admin');
  //     // Deve redirecionar ou mostrar 403
  //     const url = page.url();
  //     const is403 = url.includes('403') || url.includes('forbidden');
  //     const isRedirected = url.includes('login') || url.includes('dashboard');
  //     expect(is403 || isRedirected).toBe(true);
  //   });
  // });
});
