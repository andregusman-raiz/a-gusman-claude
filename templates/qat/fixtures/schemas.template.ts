/**
 * QAT Zod Schemas
 *
 * Copie para `tests/qat/fixtures/schemas.ts` no seu projeto.
 * Schemas para validacao de evaluations e summaries do QAT.
 *
 * Uso:
 *   import { qatEvaluationSchema, qatSummarySchema } from './schemas';
 *   const evaluation = qatEvaluationSchema.parse(rawJson);
 */

import { z } from 'zod';

/**
 * Schema para um criterio individual de avaliacao.
 * Ex: { name: 'completude', score: 8, feedback: 'Cobre todos os pontos' }
 */
export const qatCriterionSchema = z.object({
  name: z.string(),
  score: z.number().int().min(1).max(10),
  feedback: z.string(),
});

export type QatCriterion = z.infer<typeof qatCriterionSchema>;

/**
 * Schema para a avaliacao completa de um cenario.
 * Inclui tipo, criterios, score geral, e metadata de execucao.
 */
export const qatEvaluationSchema = z.object({
  scenario: z.string(),
  type: z.enum([
    'chat',
    'image',
    'image-edit',
    'presentation',
    'video',
    'chart',
    'infographic',
    'automation',
    'plus-menu',
    'cli',
  ]),
  criteria: z.array(qatCriterionSchema),
  overallScore: z.number().min(1).max(10),
  pass: z.boolean(),
  summary: z.string(),
  evaluatedAt: z.string().datetime(),
  durationMs: z.number().int(),
  costEstimateUsd: z.number(),
});

export type QatEvaluation = z.infer<typeof qatEvaluationSchema>;

/**
 * Schema para comparacao com run anterior.
 */
export const qatComparisonSchema = z.object({
  previousRunId: z.string().nullable(),
  scoreDelta: z.number().nullable(),
});

export type QatComparison = z.infer<typeof qatComparisonSchema>;

// --- V2: Diagnostics & PDCA schemas ---

/**
 * Categorias de falha para classificacao no ciclo PDCA.
 */
export const failureCategoryEnum = z.enum([
  'INFRA',     // Pagina nao carregou, timeout, 500
  'FEATURE',   // Feature quebrada, botao nao funciona, output stub
  'QUALITY',   // Output gerado mas qualidade baixa (score < threshold)
  'BUSINESS',  // Output nao atende criterios de negocio (sem BNCC, sem citacao, etc.)
  'RUBRIC',    // Rubrica mal calibrada (golden sample recebe nota baixa)
  'FLAKY',     // Resultado inconsistente entre runs (delta > 2.0)
]);

export type FailureCategory = z.infer<typeof failureCategoryEnum>;

/**
 * Schema para diagnostico de falha individual.
 */
export const qatDiagnosticSchema = z.object({
  scenarioId: z.string(),
  category: failureCategoryEnum,
  severity: z.enum(['P0', 'P1', 'P2', 'P3']),
  description: z.string(),
  evidence: z.string().optional(),
  suggestedAction: z.string(),
  autoFixable: z.boolean(),
});

export type QatDiagnostic = z.infer<typeof qatDiagnosticSchema>;

/**
 * Schema para acao do ciclo ACT (PDCA).
 */
export const qatActionSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  type: z.enum(['github-issue', 'baseline-update', 'rubric-refinement', 'alert', 'skip']),
  status: z.enum(['pending', 'created', 'completed', 'skipped']),
  details: z.string(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export type QatAction = z.infer<typeof qatActionSchema>;

/**
 * Schema para resultado de validacao por camada (4-layer).
 */
export const qatLayerResultSchema = z.object({
  layer: z.enum(['L1_SMOKE', 'L2_FUNCTIONAL', 'L3_QUALITY', 'L4_BUSINESS']),
  passed: z.boolean(),
  durationMs: z.number().int(),
  details: z.string().optional(),
  shortCircuited: z.boolean().default(false),
});

export type QatLayerResult = z.infer<typeof qatLayerResultSchema>;

/**
 * Schema v2 para evaluation com camadas e diagnostico.
 */
export const qatEvaluationV2Schema = qatEvaluationSchema.extend({
  layers: z.array(qatLayerResultSchema).optional(),
  diagnostic: qatDiagnosticSchema.optional(),
  baselineDelta: z.number().optional(),
  goldenSampleUsed: z.boolean().default(false),
  rubricVersion: z.string().optional(),
});

export type QatEvaluationV2 = z.infer<typeof qatEvaluationV2Schema>;

/**
 * Schema para baseline de um cenario.
 */
export const qatBaselineSchema = z.object({
  scenarioId: z.string(),
  baselineScore: z.number().min(1).max(10),
  threshold: z.number().min(1).max(10),
  tolerance: z.number().default(1.0),
  category: z.string(),
  updatedAt: z.string().datetime(),
  history: z.array(z.object({
    runId: z.string(),
    score: z.number(),
    date: z.string(),
  })),
});

export type QatBaseline = z.infer<typeof qatBaselineSchema>;

// --- End V2 schemas ---

/**
 * Schema para o sumario consolidado de um run QAT completo.
 * Agrega todas as evaluations + metadata do run + comparacao temporal.
 */
export const qatSummarySchema = z.object({
  runId: z.string(),
  baseUrl: z.string().url(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  totalScenarios: z.number().int(),
  passed: z.number().int(),
  failed: z.number().int(),
  skipped: z.number().int(),
  averageScore: z.number(),
  evaluations: z.array(qatEvaluationSchema),
  comparedToPrevious: qatComparisonSchema,
  // V2 fields (optional for backwards compatibility)
  diagnostics: z.array(qatDiagnosticSchema).optional(),
  actions: z.array(qatActionSchema).optional(),
  costTotal: z.number().optional(),
  shortCircuitSavings: z.number().optional(),
});

export type QatSummary = z.infer<typeof qatSummarySchema>;

/**
 * Threshold padrao de pass (score >= PASS_THRESHOLD = pass).
 * Pode ser sobrescrito via qat.config.ts ou env var.
 */
export const PASS_THRESHOLD = 6;
