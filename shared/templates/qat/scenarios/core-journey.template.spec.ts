/**
 * QAT v2 Core Journey Template — Cenario com 4 Camadas de Validacao
 *
 * Este template implementa a metodologia User Story → QAT Scenario:
 * - Persona com contexto real
 * - Input realista (nao generico)
 * - 4 camadas: L1 Smoke → L2 Functional → L3 Quality → L4 Business
 * - Short-circuit: se L1 falha, nao roda L2-L4 (economia de custo)
 * - Rubrica especifica (nao generica)
 * - Golden sample como referencia para o judge
 *
 * Copie para `tests/qat/scenarios/qat-XX-nome.spec.ts`
 */

import { test, expect } from '../fixtures/qat-fixture';
import { qatConfig } from '../qat.config';
import { waitForOutputStable } from '../helpers/capture';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// CUSTOMIZE: Defina o cenario
// ============================================================

const SCENARIO_ID = 'QAT-XX';
const SCENARIO = qatConfig.scenarios.find((s) => s.id === SCENARIO_ID);

/**
 * PERSONA
 *
 * Quem: [Cargo/funcao]
 * Contexto: [Tipo de organizacao, tamanho]
 * Objetivo: [O que quer alcanzar]
 * Dados no sistema: [Documentos carregados, config, historico]
 */

/**
 * USER STORY
 *
 * DADO: [contexto do usuario: quem, o que ja fez, que dados tem]
 * QUANDO: [acao especifica que o usuario quer realizar]
 * ENTAO: [resultado que o produto deve entregar]
 * E: [criterios de qualidade especificos]
 */

// ============================================================
// CONFIGURACAO DO CENARIO
// ============================================================

/** URL da feature a testar */
const FEATURE_URL = '/dashboard';

/** Seletor do elemento de output */
const OUTPUT_SELECTOR = '.qi-message-assistant, [data-role="assistant"]';

/** Input do usuario (REALISTA, nao generico) */
const USER_INPUT =
  'CUSTOMIZE: Substitua por input realista que o usuario faria';

/** Criterios de negocio L4 (verificacoes programaticas) */
const BUSINESS_CHECKS = {
  /** Padroes que o output DEVE conter */
  mustContain: [/CUSTOMIZE/i],
  /** Tamanho minimo do output (caracteres) */
  minLength: 200,
  /** Tamanho maximo do output (caracteres, 0 = sem limite) */
  maxLength: 0,
};

// ============================================================
// CENARIO
// ============================================================

test.describe(`${SCENARIO_ID}: CUSTOMIZE: Descricao do cenario`, () => {
  test.skip(!SCENARIO || !SCENARIO.enabled, `${SCENARIO_ID} nao habilitado`);
  test.use({ storageState: qatConfig.authStorageState });

  test(`${SCENARIO_ID}: evaluate quality`, async ({
    page,
    scenarioDir,
    captureScreenshotToDir,
    captureTextToDir,
    evaluateOutput,
  }) => {
    test.setTimeout(SCENARIO!.timeoutMs || qatConfig.defaultTimeoutMs);

    // ========================================
    // L1: SMOKE — Infraestrutura funciona?
    // ========================================
    // Se esta camada falha, nao gasta dinheiro com Judge.
    // Classificacao: INFRA failure.

    await page.goto(`${qatConfig.baseUrl}${FEATURE_URL}`);
    await page.waitForLoadState('networkidle');

    // Verificar que elementos essenciais existem
    const inputElement = page.getByRole('textbox').first();
    await expect(inputElement).toBeVisible({ timeout: 15_000 });

    // CUSTOMIZE: Adicione verificacoes de elementos essenciais
    // await expect(page.getByRole('button', { name: /enviar/i })).toBeVisible();

    // ========================================
    // L2: FUNCTIONAL — Feature produz resultado?
    // ========================================
    // Se esta camada falha, feature esta quebrada.
    // Classificacao: FEATURE failure.

    // Executar acao do usuario
    await inputElement.fill(USER_INPUT);
    await inputElement.press('Enter');

    // Aguardar output completo (com timeout)
    const isStable = await waitForOutputStable(
      page,
      OUTPUT_SELECTOR,
      SCENARIO!.timeoutMs || qatConfig.defaultTimeoutMs
    );

    if (!isStable) {
      // Capturar estado atual para diagnostico
      await captureScreenshotToDir(page, 'timeout-state.png');
      // Fail com mensagem clara — NAO chamar Judge (economia)
      expect(isStable, `TIMEOUT: Output nao estabilizou em ${SCENARIO!.timeoutMs}ms`).toBe(true);
      return;
    }

    // Capturar output
    const outputText = await captureTextToDir(page, OUTPUT_SELECTOR);
    await captureScreenshotToDir(page);

    // Verificacoes funcionais basicas
    expect(outputText, 'Output esta vazio — feature possivelmente quebrada').toBeTruthy();
    expect(
      outputText.length,
      `Output muito curto (${outputText.length} chars) — possivelmente stub`
    ).toBeGreaterThan(50);

    // ========================================
    // L3: QUALITY — Output e BOM? (AI-as-Judge)
    // ========================================
    // Se esta camada falha, qualidade degradou.
    // Classificacao: QUALITY failure.

    // CUSTOMIZE: Carregar golden sample se disponivel
    let goldenSample: string | undefined;
    const goldenPath = path.join(
      qatConfig.resultsDir,
      '..',
      'knowledge',
      'golden-samples',
      `${SCENARIO_ID}.md`
    );
    if (fs.existsSync(goldenPath)) {
      goldenSample = fs.readFileSync(goldenPath, 'utf-8');
    }

    // Montar descricao para o Judge com contexto
    const judgeInput = [
      `## Contexto da Avaliacao`,
      `- Persona: CUSTOMIZE`,
      `- Objetivo: CUSTOMIZE`,
      ``,
      `## Input do Usuario`,
      USER_INPUT,
      ``,
      `## Output Produzido`,
      outputText,
      goldenSample ? `\n## Referencia de Qualidade (Golden Sample)\n${goldenSample}` : '',
    ].join('\n');

    const evaluation = await evaluateOutput(SCENARIO!, judgeInput);

    // Log detalhado para diagnostico
    console.log(`[${SCENARIO_ID}] Score: ${evaluation.overallScore}/10 | Pass: ${evaluation.pass}`);
    for (const c of evaluation.criteria) {
      console.log(`  ${c.name}: ${c.score}/10 — ${c.feedback}`);
    }

    expect(
      evaluation.pass,
      `L3 QUALITY: Score ${evaluation.overallScore} < threshold ${qatConfig.passThreshold}. ${evaluation.summary}`
    ).toBe(true);

    // ========================================
    // L4: BUSINESS — Atende objetivo do usuario?
    // ========================================
    // Verificacoes programaticas que o Judge nao consegue fazer.
    // Classificacao: BUSINESS failure.

    // Verificar tamanho minimo
    if (BUSINESS_CHECKS.minLength > 0) {
      expect(
        outputText.length,
        `L4 BUSINESS: Output muito curto (${outputText.length} < ${BUSINESS_CHECKS.minLength})`
      ).toBeGreaterThanOrEqual(BUSINESS_CHECKS.minLength);
    }

    // Verificar tamanho maximo
    if (BUSINESS_CHECKS.maxLength > 0) {
      expect(
        outputText.length,
        `L4 BUSINESS: Output muito longo (${outputText.length} > ${BUSINESS_CHECKS.maxLength})`
      ).toBeLessThanOrEqual(BUSINESS_CHECKS.maxLength);
    }

    // Verificar padroes obrigatorios
    for (const pattern of BUSINESS_CHECKS.mustContain) {
      expect(
        pattern.test(outputText),
        `L4 BUSINESS: Output nao contem padrao esperado: ${pattern}`
      ).toBe(true);
    }

    // CUSTOMIZE: Adicione verificacoes de negocio especificas
    // Exemplos:
    // - Numero minimo de itens/secoes na resposta
    // - Referencia a dados do usuario (contexto)
    // - Formato correto (markdown, lista, tabela)
    // - Ausencia de conteudo proibido
  });
});
