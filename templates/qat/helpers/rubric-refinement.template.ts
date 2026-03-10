/**
 * QAT Rubric Refinement — Auto-refinamento de rubricas baseado em dados
 *
 * Copie para `tests/qat/helpers/rubric-refinement.ts` no seu projeto.
 * Detecta rubricas ambiguas (scores inconsistentes), falsos positivos/negativos,
 * e sugere refinamentos especificos.
 *
 * Uso:
 *   import { analyzeRubricConsistency, suggestRefinements } from './rubric-refinement';
 *
 * Trigger: 3+ runs com mesma rubrica produzem scores inconsistentes (>2 pontos variacao)
 */

import * as fs from 'fs';
import * as path from 'path';
import type { QatEvaluation, QatBaseline } from '../fixtures/schemas';

export interface RubricAnalysis {
  rubricId: string;
  scenarioId: string;
  scores: number[];
  variance: number;
  avgScore: number;
  isInconsistent: boolean;
  inconsistencyType: 'judge-variance' | 'output-variance' | 'rubric-ambiguity' | 'stable';
  /** Criteria that show highest variance across runs */
  volatileCriteria: { name: string; scores: number[]; variance: number }[];
  /** Detected false positives (golden sample scored low) */
  falsePositives: FalseDetection[];
  /** Detected false negatives (anti-pattern scored high) */
  falseNegatives: FalseDetection[];
}

interface FalseDetection {
  runId: string;
  scenarioId: string;
  type: 'golden-scored-low' | 'antipattern-scored-high';
  expectedScoreRange: [number, number];
  actualScore: number;
  details: string;
}

export interface RubricRefinement {
  rubricId: string;
  scenarioId: string;
  priority: 'P1' | 'P2' | 'P3';
  type: 'clarify-criterion' | 'adjust-weight' | 'add-penalty' | 'remove-penalty' | 'recalibrate-scale' | 'mark-flaky';
  criterion?: string;
  currentValue?: string;
  suggestedValue?: string;
  reason: string;
}

/**
 * Analisa consistencia de uma rubrica baseado em historico de scores.
 *
 * @param scenarioId - ID do cenario
 * @param evaluations - Evaluations dos ultimos N runs para este cenario
 * @param baseline - Baseline atual (se existir)
 * @param goldenSampleScore - Score esperado para golden sample (default 9.5)
 */
export function analyzeRubricConsistency(
  scenarioId: string,
  evaluations: QatEvaluation[],
  baseline?: QatBaseline,
  goldenSampleScore: number = 9.5
): RubricAnalysis {
  const scores = evaluations.map((e) => e.overallScore);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const variance = calculateVariance(scores);
  const tolerance = baseline?.tolerance ?? 2.0;

  // Analyze per-criterion volatility
  const criteriaMap = new Map<string, number[]>();
  for (const eval_ of evaluations) {
    for (const crit of eval_.criteria) {
      const existing = criteriaMap.get(crit.criterion) ?? [];
      existing.push(crit.score);
      criteriaMap.set(crit.criterion, existing);
    }
  }

  const volatileCriteria = Array.from(criteriaMap.entries())
    .map(([name, critScores]) => ({
      name,
      scores: critScores,
      variance: calculateVariance(critScores),
    }))
    .filter((c) => c.variance > 1.5)
    .sort((a, b) => b.variance - a.variance);

  // Detect false positives/negatives
  const falsePositives: FalseDetection[] = [];
  const falseNegatives: FalseDetection[] = [];

  // If golden sample was evaluated and scored low (< 8), it's a false positive of the rubric
  for (const eval_ of evaluations) {
    if (eval_.summary.toLowerCase().includes('golden') && eval_.overallScore < 8) {
      falsePositives.push({
        runId: eval_.runId ?? 'unknown',
        scenarioId,
        type: 'golden-scored-low',
        expectedScoreRange: [9, 10],
        actualScore: eval_.overallScore,
        details: `Golden sample recebeu ${eval_.overallScore}/10 (esperado >= 9). Rubrica pode ser muito exigente.`,
      });
    }
    // If anti-pattern was evaluated and scored high (> threshold), it's a false negative
    if (eval_.summary.toLowerCase().includes('anti-pattern') && eval_.overallScore > 6) {
      falseNegatives.push({
        runId: eval_.runId ?? 'unknown',
        scenarioId,
        type: 'antipattern-scored-high',
        expectedScoreRange: [1, 4],
        actualScore: eval_.overallScore,
        details: `Anti-pattern recebeu ${eval_.overallScore}/10 (esperado <= 4). Rubrica pode ser muito leniente.`,
      });
    }
  }

  // Classify inconsistency type
  let inconsistencyType: RubricAnalysis['inconsistencyType'] = 'stable';
  if (variance > tolerance) {
    if (volatileCriteria.length === 0) {
      // Overall score varies but criteria don't → output is varying (LLM non-determinism)
      inconsistencyType = 'output-variance';
    } else if (volatileCriteria.length > 2) {
      // Multiple criteria vary → rubric is ambiguous
      inconsistencyType = 'rubric-ambiguity';
    } else {
      // 1-2 criteria vary → judge is inconsistent on those specific criteria
      inconsistencyType = 'judge-variance';
    }
  }

  return {
    rubricId: evaluations[0]?.rubricId ?? 'unknown',
    scenarioId,
    scores,
    variance: Number(variance.toFixed(2)),
    avgScore: Number(avgScore.toFixed(1)),
    isInconsistent: variance > tolerance,
    inconsistencyType,
    volatileCriteria,
    falsePositives,
    falseNegatives,
  };
}

/**
 * Sugere refinamentos de rubrica baseado na analise.
 */
export function suggestRefinements(analysis: RubricAnalysis): RubricRefinement[] {
  const refinements: RubricRefinement[] = [];

  // 1. Volatile criteria → clarify or adjust weight
  for (const vc of analysis.volatileCriteria) {
    refinements.push({
      rubricId: analysis.rubricId,
      scenarioId: analysis.scenarioId,
      priority: vc.variance > 3 ? 'P1' : 'P2',
      type: 'clarify-criterion',
      criterion: vc.name,
      currentValue: `variance=${vc.variance.toFixed(1)}`,
      suggestedValue: 'Adicionar exemplos concretos de score 3, 5, 7, 9 na escala deste criterio',
      reason: `Criterio "${vc.name}" tem variancia alta (${vc.variance.toFixed(1)}) entre runs. Judge interpreta de forma inconsistente.`,
    });
  }

  // 2. False positives → rubric too strict
  for (const fp of analysis.falsePositives) {
    refinements.push({
      rubricId: analysis.rubricId,
      scenarioId: analysis.scenarioId,
      priority: 'P1',
      type: 'recalibrate-scale',
      criterion: 'overall',
      currentValue: `golden sample scored ${fp.actualScore}`,
      suggestedValue: 'Relaxar criterios ou adicionar calibracao "este output e score 9-10" no prompt do Judge',
      reason: fp.details,
    });
  }

  // 3. False negatives → rubric too lenient
  for (const fn of analysis.falseNegatives) {
    refinements.push({
      rubricId: analysis.rubricId,
      scenarioId: analysis.scenarioId,
      priority: 'P1',
      type: 'add-penalty',
      suggestedValue: 'Adicionar penalidade especifica para o tipo de falha do anti-pattern',
      reason: fn.details,
    });
  }

  // 4. Output variance → mark as flaky range
  if (analysis.inconsistencyType === 'output-variance') {
    refinements.push({
      rubricId: analysis.rubricId,
      scenarioId: analysis.scenarioId,
      priority: 'P3',
      type: 'mark-flaky',
      currentValue: `variance=${analysis.variance}`,
      suggestedValue: `Aumentar tolerancia para ${Math.ceil(analysis.variance + 0.5)} ou fixar seed/temperature no cenario`,
      reason: 'Score varia por nao-determinismo do output (LLM), nao por ambiguidade da rubrica.',
    });
  }

  return refinements;
}

/**
 * Executa analise de refinamento para todos os cenarios com historico suficiente.
 */
export function analyzeAllRubrics(
  scenarioEvaluations: Map<string, QatEvaluation[]>,
  baselines: Map<string, QatBaseline>,
  minRuns: number = 3
): { analyses: RubricAnalysis[]; refinements: RubricRefinement[] } {
  const analyses: RubricAnalysis[] = [];
  const refinements: RubricRefinement[] = [];

  for (const [scenarioId, evaluations] of scenarioEvaluations) {
    if (evaluations.length < minRuns) continue;

    const baseline = baselines.get(scenarioId);
    const analysis = analyzeRubricConsistency(scenarioId, evaluations, baseline);
    analyses.push(analysis);

    if (analysis.isInconsistent || analysis.falsePositives.length > 0 || analysis.falseNegatives.length > 0) {
      refinements.push(...suggestRefinements(analysis));
    }
  }

  return {
    analyses: analyses.sort((a, b) => b.variance - a.variance),
    refinements: refinements.sort((a, b) => {
      const prio = { P1: 0, P2: 1, P3: 2 };
      return (prio[a.priority] ?? 3) - (prio[b.priority] ?? 3);
    }),
  };
}

/**
 * Gera learnings entry para rubric refinement.
 */
export function generateRefinementLearning(
  refinement: RubricRefinement,
  cycleNumber: number
): string {
  return [
    `### RUBRIC-${refinement.scenarioId}-C${cycleNumber}`,
    `- **Cycle**: ${cycleNumber}`,
    `- **Date**: ${new Date().toISOString().split('T')[0]}`,
    `- **Category**: RUBRIC`,
    `- **Finding**: ${refinement.reason}`,
    `- **Action**: ${refinement.type} — ${refinement.suggestedValue ?? 'manual review needed'}`,
    `- **Impact**: Pending (apply refinement and re-run)`,
    `- **Status**: open`,
    '',
  ].join('\n');
}

/**
 * Salva report de analise de rubricas.
 */
export function saveRubricAnalysisReport(
  analyses: RubricAnalysis[],
  refinements: RubricRefinement[],
  outputPath: string
): void {
  const report = {
    timestamp: new Date().toISOString(),
    totalScenarios: analyses.length,
    inconsistentScenarios: analyses.filter((a) => a.isInconsistent).length,
    totalRefinements: refinements.length,
    byPriority: {
      P1: refinements.filter((r) => r.priority === 'P1').length,
      P2: refinements.filter((r) => r.priority === 'P2').length,
      P3: refinements.filter((r) => r.priority === 'P3').length,
    },
    analyses,
    refinements,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}

// --- Utilities ---

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sumSqDiff = values.reduce((sum, v) => sum + (v - mean) ** 2, 0);
  return Math.sqrt(sumSqDiff / (values.length - 1));
}
