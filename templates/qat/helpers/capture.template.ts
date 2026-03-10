/**
 * QAT Capture Helpers — Funcoes de captura de outputs
 *
 * Copie para `tests/qat/helpers/capture.ts` no seu projeto.
 * Funcoes utilitarias para capturar screenshots, downloads, e texto de paginas.
 */

import { type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Captura screenshot da pagina e salva no path especificado.
 *
 * @param page - Pagina do Playwright
 * @param filePath - Path completo para salvar o screenshot
 * @returns Path do arquivo salvo
 */
export async function captureScreenshot(page: Page, filePath: string): Promise<string> {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  await page.screenshot({
    path: filePath,
    fullPage: false, // Apenas viewport visivel (mais relevante para QAT)
  });

  return filePath;
}

/**
 * Captura download de arquivo disparado por uma acao.
 *
 * Uso:
 *   const filePath = await captureDownload(page, scenarioDir, async () => {
 *     await page.getByRole('button', { name: 'Download' }).click();
 *   });
 *
 * @param page - Pagina do Playwright
 * @param outputDir - Diretorio onde salvar o arquivo
 * @param triggerAction - Funcao que dispara o download (ex: clicar botao)
 * @returns Path do arquivo salvo
 */
export async function captureDownload(
  page: Page,
  outputDir: string,
  triggerAction: () => Promise<void>
): Promise<string> {
  fs.mkdirSync(outputDir, { recursive: true });

  // Aguardar evento de download enquanto executa acao
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    triggerAction(),
  ]);

  // Determinar nome do arquivo
  const suggestedName = download.suggestedFilename() || 'output.bin';
  const filePath = path.join(outputDir, suggestedName);

  // Salvar arquivo
  await download.saveAs(filePath);

  // Verificar que arquivo nao esta vazio
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    console.warn(`[QAT] Arquivo baixado esta vazio: ${filePath}`);
  }

  return filePath;
}

/**
 * Extrai texto de um elemento da pagina.
 *
 * @param page - Pagina do Playwright
 * @param selector - Seletor CSS ou role do elemento
 * @returns Texto extraido (string vazia se elemento nao encontrado)
 */
export async function captureText(page: Page, selector: string): Promise<string> {
  try {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: 30_000 });
    const text = await element.textContent();
    return text?.trim() ?? '';
  } catch (error) {
    console.warn(`[QAT] Elemento nao encontrado para captura de texto: ${selector}`);
    return '';
  }
}

/**
 * Captura multiplos screenshots de uma pagina com scroll.
 * Util para outputs longos que nao cabem em um viewport.
 *
 * @param page - Pagina do Playwright
 * @param outputDir - Diretorio onde salvar os screenshots
 * @param prefix - Prefixo dos nomes de arquivo
 * @returns Array de paths dos arquivos salvos
 */
export async function captureScrollingScreenshots(
  page: Page,
  outputDir: string,
  prefix = 'scroll'
): Promise<string[]> {
  fs.mkdirSync(outputDir, { recursive: true });

  const paths: string[] = [];
  const viewportHeight = page.viewportSize()?.height ?? 720;
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const scrollSteps = Math.ceil(totalHeight / viewportHeight);

  for (let i = 0; i < Math.min(scrollSteps, 5); i++) {
    // Max 5 screenshots
    await page.evaluate((y) => window.scrollTo(0, y), i * viewportHeight);
    await page.waitForTimeout(300); // Aguardar render apos scroll

    const filePath = path.join(outputDir, `${prefix}-${i + 1}.png`);
    await page.screenshot({ path: filePath });
    paths.push(filePath);
  }

  // Voltar ao topo
  await page.evaluate(() => window.scrollTo(0, 0));

  return paths;
}

/**
 * Aguarda que o output da aplicacao esteja completo.
 * Detecta fim de streaming/geracao verificando estabilidade do DOM.
 *
 * @param page - Pagina do Playwright
 * @param selector - Seletor do elemento de output
 * @param timeoutMs - Timeout maximo em ms
 * @returns true se output estabilizou, false se timeout
 */
export async function waitForOutputStable(
  page: Page,
  selector: string,
  timeoutMs: number
): Promise<boolean> {
  const startTime = Date.now();
  let previousText = '';
  let stableCount = 0;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const currentText = (await page.locator(selector).textContent()) ?? '';

      if (currentText === previousText && currentText.length > 0) {
        stableCount++;
        // 3 checks consecutivos iguais = estavel
        if (stableCount >= 3) return true;
      } else {
        stableCount = 0;
        previousText = currentText;
      }
    } catch {
      // Elemento pode nao existir ainda
    }

    await page.waitForTimeout(1000); // Check a cada 1s
  }

  return false; // Timeout
}
