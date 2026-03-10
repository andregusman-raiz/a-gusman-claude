/**
 * Auth Setup Template — Playwright
 *
 * Cria estado de autenticacao persistente para testes E2E.
 * Customizar: URL de login, credenciais, seletores.
 *
 * Uso: importar como setup project no playwright.config.ts
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

// Caminho para salvar o estado de auth (gitignored)
const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  // --- CUSTOMIZAR ABAIXO ---

  // 1. Navegar para pagina de login
  await page.goto('/login');

  // 2. Preencher credenciais
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || 'test-password');

  // 3. Submeter formulario
  await page.getByRole('button', { name: /login|entrar|sign in/i }).click();

  // 4. Aguardar redirecionamento (indica login bem-sucedido)
  await page.waitForURL('**/dashboard**', { timeout: 15000 });

  // 5. Verificar que login funcionou
  await expect(page).not.toHaveURL(/login|auth/);

  // --- FIM CUSTOMIZACAO ---

  // Salvar estado de autenticacao
  await page.context().storageState({ path: authFile });
});
