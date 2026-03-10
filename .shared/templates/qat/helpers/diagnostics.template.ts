/**
 * QAT Diagnostics — Classificacao de falhas e analise de resultados
 *
 * Copie para `tests/qat/helpers/diagnostics.ts` no seu projeto.
 * Implementa a fase CHECK do ciclo PDCA: classifica falhas, compara baselines,
 * detecta padroes conhecidos e gera diagnostico estruturado.
 *
 * Uso:
 *   import { classifyFailure, generateDiagnostics } from './diagnostics';
 */

import * as fs from 'fs';
import type {
  QatEvaluation,
  QatDiagnostic,
  FailureCategory,
  QatLayerResult,
  QatBaseline,
} from '../fixtures/schemas';

interface FailurePattern {
  id: string;
  name: string;
  description: string;
  category: FailureCategory;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  indicators: string[];
  root_cause: string;
  fix_suggestion: string;
  status: 'open' | 'fixed' | 'wontfix';
}

/**
 * Classifica uma falha de cenario em uma das 6 categorias.
 *
 * Logica de classificacao:
 * - L1 falhou → INFRA
 * - L2 falhou → FEATURE
 * - L3 falhou (score < threshold) → QUALITY
 * - L4 falhou → BUSINESS
 * - Score varia > tolerance entre runs → FLAKY
 * - Golden sample recebe nota baixa → RUBRIC
 */
export function classifyFailure(
  scenarioId: string,
  evaluation: QatEvaluation,
  layers?: QatLayerResult[],
  baseline?: QatBaseline,
  previousScores?: number[]
): QatDiagnostic {
  // Check layers (L1 → L4) in order
  if (layers) {
    const l1 = layers.find((l) => l.layer === 'L1_SMOKE');
    if (l1 && !l1.passed) {
      return {
        scenarioId,
        category: 'INFRA',
        severity: 'P0',
        description: `Smoke test falhou: ${l1.details ?? 'pagina nao carregou ou elementos ausentes'}`,
        evidence: l1.details,
        suggestedAction: 'Verificar infra: servidor up? URL correta? Deploy concluido?',
        autoFixable: false,
      };
    }

    const l2 = layers.find((l) => l.layer === 'L2_FUNCTIONAL');
    if (l2 && !l2.passed) {
      return {
        scenarioId,
        category: 'FEATURE',
        severity: 'P1',
        description: `Output funcional falhou: ${l2.details ?? 'output vazio, stub ou erro'}`,
        evidence: l2.details,
        suggestedAction: 'Feature quebrada. Verificar logs do servidor e fluxo de geracao.',
        autoFixable: false,
      };
    }

    const l4 = layers.find((l) => l.layer === 'L4_BUSINESS');
    if (l4 && !l4.passed) {
      return {
        scenarioId,
        category: 'BUSINESS',
        severity: 'P1',
        description: `Criterios de negocio nao atendidos: ${l4.details ?? 'output nao atende objetivo do usuario'}`,
        evidence: l4.details,
        suggestedAction: 'Revisar com product owner: spec correta? Criterios realistas?',
        autoFixable: false,
      };
    }
  }

  // Check flaky (variance > tolerance across recent scores)
  if (previousScores && previousScores.length >= 3) {
    const tolerance = baseline?.tolerance ?? 2.0;
    const recentScores = previousScores.slice(-3);
    const maxDelta = Math.max(...recentScores) - Math.min(...recentScores);
    if (maxDelta > tolerance) {
      return {
        scenarioId,
        category: 'FLAKY',
        severity: 'P2',
        description: `Score instavel: variacao de ${maxDelta.toFixed(1)} pontos nos ultimos 3 runs (tolerancia: ${tolerance})`,
        evidence: `Scores recentes: ${recentScores.join(', ')}`,
        suggestedAction: 'Investigar nao-determinismo: LLM variance? Timing? Dados mutaveis?',
        autoFixable: false,
      };
    }
  }

  // Check baseline regression
  if (baseline && evaluation.overallScore < baseline.baselineScore - (baseline.tolerance ?? 1.0)) {
    return {
      scenarioId,
      category: 'QUALITY',
      severity: 'P1',
      description: `Regressao de qualidade: score ${evaluation.overallScore} vs baseline ${baseline.baselineScore} (delta: ${(evaluation.overallScore - baseline.baselineScore).toFixed(1)})`,
      evidence: evaluation.summary,
      suggestedAction: 'Investigar causa da queda: mudanca no modelo? Prompt? Dados?',
      autoFixable: false,
    };
  }

  // Default: QUALITY failure
  return {
    scenarioId,
    category: 'QUALITY',
    severity: 'P2',
    description: `Score abaixo do threshold: ${evaluation.overallScore}`,
    evidence: evaluation.summary,
    suggestedAction: 'Revisar output e criterios da rubrica.',
    autoFixable: false,
  };
}

/**
 * Tenta identificar failure patterns conhecidos no output/evaluation.
 */
export function matchFailurePatterns(
  evaluation: QatEvaluation,
  patternsPath: string
): FailurePattern | null {
  if (!fs.existsSync(patternsPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
    const patterns: FailurePattern[] = raw.patterns ?? [];

    const summaryLower = evaluation.summary.toLowerCase();
    const criteriaFeedback = evaluation.criteria
      .map((c) => c.feedback.toLowerCase())
      .join(' ');
    const searchText = `${summaryLower} ${criteriaFeedback}`;

    for (const pattern of patterns) {
      if (pattern.status === 'fixed') continue;
      const matchCount = pattern.indicators.filter((ind) =>
        searchText.includes(ind.toLowerCase())
      ).length;
      // Match if at least half the indicators are present
      if (matchCount >= Math.ceil(pattern.indicators.length / 2)) {
        return pattern;
      }
    }
  } catch {
    // Skip if pattern file is malformed
  }

  return null;
}

/**
 * Gera diagnosticos para todos os cenarios falhos de um run.
 */
export function generateDiagnostics(
  evaluations: QatEvaluation[],
  baselines: Map<string, QatBaseline>,
  failurePatternsPath?: string,
  threshold: number = 6
): QatDiagnostic[] {
  const diagnostics: QatDiagnostic[] = [];

  for (const eval_ of evaluations) {
    if (eval_.pass) continue; // Cenario passou, nao precisa diagnostico
    if (eval_.overallScore === 0) continue; // Skipped

    const baseline = baselines.get(eval_.scenario);
    const previousScores = baseline?.history.map((h) => h.score);

    const diagnostic = classifyFailure(
      eval_.scenario,
      eval_,
      undefined, // layers not available in v1 evaluations
      baseline,
      previousScores
    );

    // Try to match known failure pattern
    if (failurePatternsPath) {
      const pattern = matchFailurePatterns(eval_, failurePatternsPath);
      if (pattern) {
        diagnostic.description += ` [Padrao conhecido: ${pattern.name}]`;
        diagnostic.suggestedAction = pattern.fix_suggestion;
      }
    }

    diagnostics.push(diagnostic);
  }

  return diagnostics;
}

/**
 * Gera resumo de diagnosticos por categoria e severidade.
 */
export function summarizeDiagnostics(diagnostics: QatDiagnostic[]): {
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  p0Count: number;
  p1Count: number;
  totalFailures: number;
  systemicCategories: string[];
} {
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const d of diagnostics) {
    byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;
    bySeverity[d.severity] = (bySeverity[d.severity] ?? 0) + 1;
  }

  // Detect systemic issues (3+ failures in same category)
  const systemicCategories = Object.entries(byCategory)
    .filter(([, count]) => count >= 3)
    .map(([cat]) => cat);

  return {
    byCategory,
    bySeverity,
    p0Count: bySeverity['P0'] ?? 0,
    p1Count: bySeverity['P1'] ?? 0,
    totalFailures: diagnostics.length,
    systemicCategories,
  };
}
