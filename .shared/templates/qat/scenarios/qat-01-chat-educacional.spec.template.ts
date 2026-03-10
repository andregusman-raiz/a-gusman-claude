/**
 * QAT-01: Chat Educacional Simples
 *
 * PROOF OF CONCEPT — Nova metodologia QAT v2 com 4 camadas de validacao.
 *
 * User Story:
 *   COMO professor de ensino fundamental em escola publica
 *   QUERO perguntar sobre vantagens da IA na educacao com exemplos praticos
 *   PARA aplicar na minha escola na segunda-feira
 *
 * Persona: Professor de ensino fundamental, escola publica, pouco contato com IA
 * Input realista: "Quais sao as principais vantagens da IA na educacao?
 *                  Dê exemplos praticos que eu possa aplicar na minha escola"
 *
 * 4 Camadas:
 *   L1 SMOKE     — Pagina carrega, chat input visivel, submit funciona
 *   L2 FUNCTIONAL — Output gerado, nao e stub/erro, tem conteudo real
 *   L3 QUALITY    — AI-as-Judge com rubrica especifica + golden sample
 *   L4 BUSINESS   — Criterios programaticos (contem exemplos, portugues, etc.)
 *
 * Golden Sample: knowledge/golden-samples/QAT-01.md
 * Anti-Patterns: knowledge/anti-patterns/QAT-01.md
 *
 * Copie para: tests/qat/scenarios/qat-01-chat-educacional.spec.ts
 */

import { test, expect } from '../fixtures/qat-fixture';
import { judgeOutput } from '../helpers/judge';
import { qatConfig } from '../qat.config';
import * as fs from 'fs';
import * as path from 'path';

// --- Scenario config ---
const SCENARIO_ID = 'QAT-01';
const SCENARIO = qatConfig.scenarios.find((s) => s.id === SCENARIO_ID);
const USER_INPUT =
  'Quais sao as principais vantagens da IA na educacao? Dê exemplos praticos que eu possa aplicar na minha escola';
const TIMEOUT_MS = SCENARIO?.timeoutMs ?? 60_000;

// --- Knowledge base paths (adjust for your project) ---
const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
const GOLDEN_SAMPLE_PATH = path.join(KNOWLEDGE_DIR, 'golden-samples', 'QAT-01.md');
const ANTI_PATTERNS_PATH = path.join(KNOWLEDGE_DIR, 'anti-patterns', 'QAT-01.md');

// --- Helpers ---
function loadFileIfExists(filePath: string): string | undefined {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  console.warn(`[QAT-01] Arquivo nao encontrado: ${filePath}`);
  return undefined;
}

test.describe(`QAT-01: Chat Educacional Simples`, () => {
  // Skip se cenario desabilitado
  test.skip(!SCENARIO?.enabled, `Cenario ${SCENARIO_ID} desabilitado`);

  // ============================================================
  // L1: SMOKE — Pagina carrega e elementos basicos existem
  // ============================================================
  test('L1: Smoke — pagina carrega e chat input esta visivel', async ({ page }) => {
    // CUSTOMIZE: Ajustar URL e seletores para seu projeto
    await page.goto(qatConfig.baseUrl);

    // Pagina carregou sem erro
    const status = page.url();
    expect(status).not.toContain('error');
    expect(status).not.toContain('404');

    // Chat input esta visivel
    // CUSTOMIZE: Seletor do input de chat do seu projeto
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="mensagem"], textarea[placeholder*="pergunte"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 10_000 });

    // Botao de enviar existe
    const submitBtn = page.locator('[data-testid="chat-submit"], button[type="submit"], button:has-text("Enviar")');
    await expect(submitBtn.first()).toBeVisible({ timeout: 5_000 });
  });

  // ============================================================
  // L2: FUNCTIONAL — Output e gerado e tem conteudo real
  // ============================================================
  test('L2: Functional — output e gerado e nao e stub', async ({ page }) => {
    await page.goto(qatConfig.baseUrl);

    // Preencher e enviar
    // CUSTOMIZE: Seletores do seu projeto
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="mensagem"], textarea[placeholder*="pergunte"]');
    await chatInput.first().fill(USER_INPUT);

    const submitBtn = page.locator('[data-testid="chat-submit"], button[type="submit"], button:has-text("Enviar")');
    await submitBtn.first().click();

    // Aguardar resposta (output container)
    // CUSTOMIZE: Seletor do container de resposta
    const outputContainer = page.locator('[data-testid="chat-response"], .assistant-message, .ai-response, [role="assistant"]');
    await expect(outputContainer.first()).toBeVisible({ timeout: TIMEOUT_MS });

    // Output tem conteudo real (nao e stub)
    const outputText = await outputContainer.first().textContent();
    expect(outputText).toBeTruthy();
    expect(outputText!.length).toBeGreaterThan(100); // Resposta significativa

    // NAO e resposta de erro ou stub
    const lowerText = outputText!.toLowerCase();
    expect(lowerText).not.toContain('feature not supported');
    expect(lowerText).not.toContain('erro interno');
    expect(lowerText).not.toContain('something went wrong');
    expect(lowerText).not.toContain('nao foi possivel');
    expect(lowerText).not.toContain('try again later');
  });

  // ============================================================
  // L3: QUALITY — AI-as-Judge com golden sample + anti-patterns
  // ============================================================
  test('L3: Quality — AI-as-Judge avalia output com rubrica especifica', async ({
    page,
    captureTextToDir,
    evaluateOutput,
  }) => {
    await page.goto(qatConfig.baseUrl);

    // Executar acao (mesmo fluxo do L2)
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="mensagem"], textarea[placeholder*="pergunte"]');
    await chatInput.first().fill(USER_INPUT);

    const submitBtn = page.locator('[data-testid="chat-submit"], button[type="submit"], button:has-text("Enviar")');
    await submitBtn.first().click();

    const outputContainer = page.locator('[data-testid="chat-response"], .assistant-message, .ai-response, [role="assistant"]');
    await expect(outputContainer.first()).toBeVisible({ timeout: TIMEOUT_MS });

    // Capturar output como texto
    const outputText = await outputContainer.first().textContent() ?? '';
    await captureTextToDir(outputText, 'output.txt');

    // Carregar golden sample e anti-patterns
    const goldenSample = loadFileIfExists(GOLDEN_SAMPLE_PATH);
    const antiPatterns = loadFileIfExists(ANTI_PATTERNS_PATH);

    // Chamar Judge com calibracao
    if (!SCENARIO) throw new Error(`Cenario ${SCENARIO_ID} nao encontrado na config`);

    const evaluation = await judgeOutput({
      scenario: SCENARIO,
      outputDescription: outputText,
      config: qatConfig,
      goldenSample,
      antiPatterns,
    });

    // Assert score minimo
    expect(evaluation.overallScore).toBeGreaterThanOrEqual(qatConfig.passThreshold);
    expect(evaluation.pass).toBe(true);

    // Log detalhado para analise
    console.log(`[QAT-01] Score: ${evaluation.overallScore}/10`);
    console.log(`[QAT-01] Summary: ${evaluation.summary}`);
    for (const criterion of evaluation.criteria) {
      console.log(`  - ${criterion.name}: ${criterion.score}/10 — ${criterion.feedback}`);
    }
  });

  // ============================================================
  // L4: BUSINESS — Criterios programaticos (sem API call)
  // ============================================================
  test('L4: Business — output atende criterios educacionais', async ({ page }) => {
    await page.goto(qatConfig.baseUrl);

    // Executar acao
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="mensagem"], textarea[placeholder*="pergunte"]');
    await chatInput.first().fill(USER_INPUT);

    const submitBtn = page.locator('[data-testid="chat-submit"], button[type="submit"], button:has-text("Enviar")');
    await submitBtn.first().click();

    const outputContainer = page.locator('[data-testid="chat-response"], .assistant-message, .ai-response, [role="assistant"]');
    await expect(outputContainer.first()).toBeVisible({ timeout: TIMEOUT_MS });

    const outputText = (await outputContainer.first().textContent() ?? '').toLowerCase();

    // --- Criterios de negocio programaticos ---

    // B1: Resposta em portugues (nao em ingles)
    expect(outputText).not.toMatch(/\b(sure|here are|advantages of|personalized learning)\b/i);

    // B2: Contem pelo menos 2 exemplos praticos (ferramenta ou acao concreta)
    const practicalIndicators = [
      'exemplo', 'pratico', 'ferramenta', 'plataforma', 'aplicar',
      'usar', 'implementar', 'classroom', 'khan', 'grammarly',
    ];
    const practicalCount = practicalIndicators.filter((w) => outputText.includes(w)).length;
    expect(practicalCount).toBeGreaterThanOrEqual(2);

    // B3: Menciona contexto escolar (nao e resposta generica de tecnologia)
    const educationalIndicators = [
      'aluno', 'professor', 'escola', 'aprendizagem', 'ensino',
      'educacao', 'aula', 'turma', 'pedagogic',
    ];
    const educationalCount = educationalIndicators.filter((w) => outputText.includes(w)).length;
    expect(educationalCount).toBeGreaterThanOrEqual(3);

    // B4: Resposta tem tamanho adequado (nao superficial, nao excessiva)
    expect(outputText.length).toBeGreaterThan(300); // Minimo: resposta substancial
    expect(outputText.length).toBeLessThan(10_000); // Maximo: nao verborreia

    // B5: Estruturada (tem marcadores ou secoes)
    const hasStructure =
      outputText.includes('1.') ||
      outputText.includes('•') ||
      outputText.includes('-') ||
      outputText.includes('###');
    expect(hasStructure).toBe(true);
  });
});
