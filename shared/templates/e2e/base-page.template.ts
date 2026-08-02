/**
 * Base Page Object Template — Playwright
 *
 * Classe base com error capture, navegacao, e espera.
 * Padroes extraidos de rAIz-AI-Prof (14 page objects em producao).
 *
 * Uso: extender em page objects especificos do projeto.
 */
import { Page, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  /** Navegar para path com waitForLoadState */
  async goto(
    path: string,
    waitFor: 'networkidle' | 'domcontentloaded' = 'networkidle'
  ): Promise<void> {
    await this.page.goto(path, { timeout: 30000 });
    await this.page.waitForLoadState(waitFor);
  }

  /** Verificar URL atual */
  async expectUrl(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern, { timeout: 15000 });
  }

  /** Verificar heading visivel */
  async expectHeadingVisible(text?: string): Promise<void> {
    const heading = this.page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
    if (text) {
      await expect(heading).toContainText(text);
    }
  }

  /** Aguardar app pronto (spinners desaparecem, conteudo aparece) */
  async waitForReady(timeout = 30000): Promise<void> {
    const spinner = this.page
      .locator('[aria-busy="true"], .loading, .spinner')
      .first();
    const isLoading = await spinner.isVisible().catch(() => false);

    if (isLoading) {
      await spinner.waitFor({ state: 'hidden', timeout });
    }

    await Promise.race([
      this.page.getByRole('heading').first().waitFor({ state: 'visible', timeout }),
      this.page.getByRole('button').first().waitFor({ state: 'visible', timeout }),
    ]).catch(() => {
      // Page might not have heading/button
    });
  }

  /** Verificar titulo da pagina */
  async expectTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  /** Verificar que elemento esta visivel */
  async expectVisible(selector: string, timeout = 10000): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  /** Tirar screenshot com nome descritivo */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}

/**
 * Exemplo de page object especifico:
 *
 * export class LoginPage extends BasePage {
 *   getLoginButton() {
 *     return this.page.getByRole('button', { name: /login|entrar/i }).first();
 *   }
 *
 *   async expectLoaded(): Promise<void> {
 *     await this.expectUrl(/\/login/);
 *     await expect(this.getLoginButton()).toBeVisible({ timeout: 10000 });
 *   }
 * }
 */
