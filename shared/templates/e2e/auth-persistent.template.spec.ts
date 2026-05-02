/**
 * Auth Persistent Context Template — Playwright (Canonical 2026)
 *
 * QAT MANUAL com login repetido. NUNCA usar em CI.
 *
 * Use case: explorar app autenticado sem precisar relogar a cada run.
 * Profile fica em ~/.cache/playwright-claude/<projeto>/
 *
 * NAO usar para testes E2E reproduziveis — usar storageState (ver
 * access-control.template.spec.ts) com isolation por context.
 */
import { chromium } from '@playwright/test';
import { homedir } from 'os';
import { join } from 'path';

const PROJECT_NAME = 'CUSTOMIZAR-NOME-PROJETO';
const PROFILE_DIR = join(homedir(), '.cache', 'playwright-claude', PROJECT_NAME);

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chromium',
    headless: false, // headed para login interativo na primeira vez
    viewport: { width: 1440, height: 900 },
  });

  const page = ctx.pages()[0] ?? (await ctx.newPage());

  // Primeira run: usuario faz login manual no browser aberto.
  // Cookies/sessao persistem em PROFILE_DIR para runs subsequentes.
  await page.goto(process.env.BASE_URL ?? 'http://localhost:3000');

  // --- CUSTOMIZAR: o que fazer apos navegar ---
  // Exemplo: aguardar usuario logar manualmente na primeira run
  await page.waitForURL('**/dashboard', { timeout: 5 * 60_000 });

  console.log('Sessao autenticada. Profile salvo em:', PROFILE_DIR);
  console.log('Proximas runs reusarao a sessao automaticamente.');

  // --- Aqui rodar QAT exploratorio ---

  // Manter aberto para inspecao
  await new Promise(() => {});
})();

/*
 * USO:
 *
 *   1. Customizar PROJECT_NAME acima
 *   2. Rodar: npx tsx tests/e2e/auth-persistent.spec.ts
 *   3. Primeira run: fazer login manual no browser
 *   4. Runs subsequentes: ja entra logado
 *
 * LIMPAR sessao:
 *   rm -rf ~/.cache/playwright-claude/<projeto>/
 *
 * AVISOS:
 *   - Profile contem cookies/tokens — adicionar em .gitignore se commitar
 *   - NUNCA commitar PROFILE_DIR no repo
 *   - NAO usar em CI — perde isolation, falsos positivos garantidos
 */
