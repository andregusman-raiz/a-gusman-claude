/**
 * QAT Judge — Avaliacao de output via Claude API
 *
 * Copie para `tests/qat/helpers/judge.ts` no seu projeto.
 * Chama Claude API com output + rubrica, retorna evaluation validada por Zod.
 *
 * Dependencia: npm install @anthropic-ai/sdk
 */

import Anthropic from '@anthropic-ai/sdk';
import { getRubric } from '../fixtures/rubrics';
import { qatEvaluationSchema, type QatEvaluation, PASS_THRESHOLD } from '../fixtures/schemas';
import type { QatConfig, QatScenario } from '../qat.config';
import * as fs from 'fs';

interface JudgeInput {
  /** Cenario sendo avaliado */
  scenario: QatScenario;
  /** Descricao textual do output (texto extraido, descricao da imagem, etc.) */
  outputDescription: string;
  /** Path para arquivo de output (opcional — para contexto adicional) */
  outputFilePath?: string;
  /** Configuracao QAT */
  config: QatConfig;
  // --- V2 fields ---
  /** Conteudo do golden sample para calibracao do Judge */
  goldenSample?: string;
  /** Conteudo dos anti-patterns para calibracao do Judge */
  antiPatterns?: string;
  /** Prompt customizado da rubrica v2 (sobrescreve rubrica generica) */
  customRubricPrompt?: string;
}

/**
 * Estima custo de uma chamada ao Judge baseado no modelo e tamanho do prompt.
 * Valores aproximados para Claude Sonnet.
 */
function estimateCost(inputTokens: number, outputTokens: number): number {
  // Precos aproximados para claude-sonnet-4 (USD por 1M tokens)
  const inputPricePerMillion = 3.0;
  const outputPricePerMillion = 15.0;
  return (
    (inputTokens / 1_000_000) * inputPricePerMillion +
    (outputTokens / 1_000_000) * outputPricePerMillion
  );
}

/**
 * Envia output + rubrica para Claude API e retorna evaluation estruturada.
 *
 * Retry: 1x em caso de falha (API error ou JSON invalido).
 * Se falhar 2x, retorna evaluation com status skipped.
 */
export async function judgeOutput(input: JudgeInput): Promise<QatEvaluation> {
  const { scenario, outputDescription, outputFilePath, config } = input;

  // Output vazio → score 1, sem chamar API (economia de custo)
  if (!outputDescription || outputDescription.trim().length === 0) {
    return createEmptyEvaluation(scenario, 'Nenhum output produzido');
  }

  const rubric = getRubric(scenario.type);
  const rubricPrompt = input.customRubricPrompt ?? rubric.prompt;
  const prompt = buildJudgePrompt(rubricPrompt, scenario, outputDescription, outputFilePath, input.goldenSample, input.antiPatterns);

  const client = new Anthropic({ apiKey: config.judgeApiKey });

  // Tentativa 1
  let evaluation = await callJudgeApi(client, config.judgeModel, prompt, scenario, config);
  if (evaluation) return evaluation;

  // Retry (tentativa 2)
  console.warn(`[QAT] Judge retry para ${scenario.id}...`);
  evaluation = await callJudgeApi(client, config.judgeModel, prompt, scenario, config);
  if (evaluation) return evaluation;

  // Falha apos retry — skip
  console.error(`[QAT] Judge falhou 2x para ${scenario.id}, marcando como skipped`);
  return createSkippedEvaluation(scenario, 'Judge API falhou apos 2 tentativas');
}

/**
 * Chama Claude API e parseia resposta.
 * Retorna null se falhar (para permitir retry).
 */
async function callJudgeApi(
  client: Anthropic,
  model: string,
  prompt: string,
  scenario: QatScenario,
  config: QatConfig
): Promise<QatEvaluation | null> {
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Extrair JSON da resposta (pode vir com markdown code block)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[QAT] Judge nao retornou JSON para ${scenario.id}`);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Construir evaluation completa
    const evaluation: QatEvaluation = {
      scenario: scenario.id,
      type: scenario.type as QatEvaluation['type'],
      criteria: parsed.criteria ?? [],
      overallScore: parsed.overallScore ?? 0,
      pass: (parsed.overallScore ?? 0) >= config.passThreshold,
      summary: parsed.summary ?? '',
      evaluatedAt: new Date().toISOString(),
      durationMs: 0, // Preenchido pelo fixture
      costEstimateUsd: estimateCost(
        response.usage?.input_tokens ?? 0,
        response.usage?.output_tokens ?? 0
      ),
    };

    // Validar com Zod
    return qatEvaluationSchema.parse(evaluation);
  } catch (error) {
    console.error(`[QAT] Erro ao chamar Judge para ${scenario.id}:`, error);
    return null;
  }
}

/**
 * Monta o prompt completo para o Judge.
 * V2: Inclui golden sample e anti-patterns para calibracao.
 */
function buildJudgePrompt(
  rubricPrompt: string,
  scenario: QatScenario,
  outputDescription: string,
  outputFilePath?: string,
  goldenSample?: string,
  antiPatterns?: string
): string {
  let prompt = `## Contexto do Cenario\n\n`;
  prompt += `- **ID**: ${scenario.id}\n`;
  prompt += `- **Nome**: ${scenario.name}\n`;
  prompt += `- **Tipo**: ${scenario.type}\n`;
  if (scenario.persona) prompt += `- **Persona**: ${scenario.persona}\n`;
  if (scenario.userInput) prompt += `- **Input do usuario**: ${scenario.userInput}\n`;
  if (scenario.context) prompt += `- **Contexto**: ${scenario.context}\n`;
  prompt += `\n`;

  prompt += `## Output a Avaliar\n\n`;
  prompt += `${outputDescription}\n\n`;

  if (outputFilePath && fs.existsSync(outputFilePath)) {
    const stats = fs.statSync(outputFilePath);
    prompt += `Arquivo: ${outputFilePath} (${(stats.size / 1024).toFixed(1)} KB)\n\n`;
  }

  prompt += `## Rubrica de Avaliacao\n\n`;
  prompt += rubricPrompt;

  // V2: Golden sample para calibracao
  if (goldenSample) {
    prompt += `\n\n## Referencia de Qualidade (Golden Sample)\n\n`;
    prompt += `O output abaixo e um EXEMPLO de resposta excelente (score 9-10) para este cenario. `;
    prompt += `Use-o como referencia de calibracao — NAO como gabarito rigido.\n\n`;
    prompt += goldenSample;
  }

  // V2: Anti-patterns para calibracao negativa
  if (antiPatterns) {
    prompt += `\n\n## Anti-Patterns (Outputs que DEVEM receber nota baixa)\n\n`;
    prompt += `Os exemplos abaixo representam outputs RUINS. Se o output avaliado se parecer `;
    prompt += `com algum destes anti-patterns, a nota DEVE ser baixa (1-4).\n\n`;
    prompt += antiPatterns;
  }

  return prompt;
}

/**
 * Cria evaluation para output vazio (score 1, sem chamar API).
 */
function createEmptyEvaluation(scenario: QatScenario, reason: string): QatEvaluation {
  return {
    scenario: scenario.id,
    type: scenario.type as QatEvaluation['type'],
    criteria: scenario.criteria.map((name) => ({
      name,
      score: 1,
      feedback: reason,
    })),
    overallScore: 1,
    pass: false,
    summary: reason,
    evaluatedAt: new Date().toISOString(),
    durationMs: 0,
    costEstimateUsd: 0,
  };
}

/**
 * Cria evaluation para cenario skipped (Judge falhou).
 */
function createSkippedEvaluation(scenario: QatScenario, reason: string): QatEvaluation {
  return {
    scenario: scenario.id,
    type: scenario.type as QatEvaluation['type'],
    criteria: [],
    overallScore: 0,
    pass: false,
    summary: `SKIPPED: ${reason}`,
    evaluatedAt: new Date().toISOString(),
    durationMs: 0,
    costEstimateUsd: 0,
  };
}
