/**
 * QAT Playwright Fixture
 *
 * Copie para `tests/qat/fixtures/qat-fixture.ts` no seu projeto.
 * Estende o test fixture do Playwright com helpers de captura e avaliacao.
 *
 * Uso nos cenarios:
 *   import { test, expect } from '../fixtures/qat-fixture';
 */

import { test as base, expect, type Page } from '@playwright/test';
import { qatConfig, type QatScenario } from '../qat.config';
import { judgeOutput } from '../helpers/judge';
import {
  captureScreenshot,
  captureDownload,
  captureText,
} from '../helpers/capture';
import { type QatEvaluation } from './schemas';
import * as fs from 'fs';
import * as path from 'path';

/** Run ID gerado no inicio da execucao (YYYY-MM-DD-HHmmss) */
const RUN_ID =
  process.env.QAT_RUN_ID ??
  new Date().toISOString().replace(/[T:]/g, '-').slice(0, 19);

export interface QatFixtures {
  /** Diretorio de resultados para o cenario atual */
  scenarioDir: string;
  /** Captura screenshot da pagina e salva no diretorio do cenario */
  captureScreenshotToDir: (page: Page, filename?: string) => Promise<string>;
  /** Captura download e salva no diretorio do cenario */
  captureDownloadToDir: (
    page: Page,
    triggerAction: () => Promise<void>
  ) => Promise<string>;
  /** Captura texto de um seletor e salva como output.txt */
  captureTextToDir: (page: Page, selector: string) => Promise<string>;
  /** Avalia output com AI-as-Judge e salva evaluation.json */
  evaluateOutput: (
    scenario: QatScenario,
    outputDescription: string,
    outputFilePath?: string
  ) => Promise<QatEvaluation>;
}

export const test = base.extend<QatFixtures>({
  /**
   * Cria diretorio de resultados para o cenario.
   * Disponivel automaticamente em todos os cenarios QAT.
   */
  scenarioDir: async ({}, use, testInfo) => {
    const scenarioId =
      testInfo.title.match(/QAT-\d+/)?.[0] ?? testInfo.titlePath[0] ?? 'unknown';
    const dir = path.join(qatConfig.resultsDir, RUN_ID, scenarioId);
    fs.mkdirSync(dir, { recursive: true });
    await use(dir);
  },

  captureScreenshotToDir: async ({ scenarioDir }, use) => {
    await use(async (page: Page, filename = 'screenshot.png') => {
      const filePath = path.join(scenarioDir, filename);
      await captureScreenshot(page, filePath);
      return filePath;
    });
  },

  captureDownloadToDir: async ({ scenarioDir }, use) => {
    await use(async (page: Page, triggerAction: () => Promise<void>) => {
      const filePath = await captureDownload(page, scenarioDir, triggerAction);
      return filePath;
    });
  },

  captureTextToDir: async ({ scenarioDir }, use) => {
    await use(async (page: Page, selector: string) => {
      const text = await captureText(page, selector);
      const filePath = path.join(scenarioDir, 'output.txt');
      fs.writeFileSync(filePath, text, 'utf-8');
      return text;
    });
  },

  evaluateOutput: async ({ scenarioDir }, use) => {
    await use(
      async (
        scenario: QatScenario,
        outputDescription: string,
        outputFilePath?: string
      ) => {
        const startTime = Date.now();

        const evaluation = await judgeOutput({
          scenario,
          outputDescription,
          outputFilePath,
          config: qatConfig,
        });

        evaluation.durationMs = Date.now() - startTime;
        evaluation.evaluatedAt = new Date().toISOString();

        // Salvar evaluation.json
        const evalPath = path.join(scenarioDir, 'evaluation.json');
        fs.writeFileSync(evalPath, JSON.stringify(evaluation, null, 2), 'utf-8');

        return evaluation;
      }
    );
  },
});

export { expect };
