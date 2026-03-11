/**
 * UX-QAT Scoring Engine
 *
 * Calculates weighted scores from Judge results, applies penalties,
 * and produces final scores per capture point.
 */

import type {
  UxQatRubricV2,
  UxJudgeResult,
  UxJudgeCriterionResult,
  UxJudgePenaltyResult,
  UxPenalty,
} from '../types/ux-qat.types';

// ============================================================
// Weighted Score Calculation
// ============================================================

export function calculateWeightedScore(criteria: UxJudgeCriterionResult[]): number {
  if (criteria.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const c of criteria) {
    weightedSum += c.score * c.weight;
    totalWeight += c.weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

// ============================================================
// Penalty Application
// ============================================================

export function applyPenalties(
  weightedScore: number,
  penaltyResults: UxJudgePenaltyResult[]
): number {
  let totalDeduction = 0;

  for (const p of penaltyResults) {
    totalDeduction += Math.abs(p.deduction);
  }

  // finalScore = weightedScore - penalties, min 1.0
  const finalScore = Math.max(1.0, weightedScore - totalDeduction);
  return Math.round(finalScore * 100) / 100;
}

// ============================================================
// Check Penalties Against Rubric
// ============================================================

export function evaluatePenalties(
  rubric: UxQatRubricV2,
  judgeResponse: { penalties?: Array<{ name: string; applied: boolean; deduction: number; evidence: string }> }
): UxJudgePenaltyResult[] {
  const results: UxJudgePenaltyResult[] = [];

  if (!judgeResponse.penalties) return results;

  for (const jp of judgeResponse.penalties) {
    if (!jp.applied) continue;

    // Find matching penalty in rubric
    const rubricPenalty = rubric.penalties.find(p => p.name === jp.name);
    if (rubricPenalty) {
      results.push({
        name: jp.name,
        deduction: rubricPenalty.deduction, // Use rubric-defined deduction, not judge's
        evidence: jp.evidence,
      });
    } else {
      // Judge reported a penalty not in rubric — use judge's deduction but cap at -3
      results.push({
        name: jp.name,
        deduction: Math.max(-3, jp.deduction),
        evidence: jp.evidence,
      });
    }
  }

  return results;
}

// ============================================================
// Full Score Assembly
// ============================================================

export function assembleJudgeResult(
  screen: string,
  breakpoint: number,
  theme: string,
  criteria: UxJudgeCriterionResult[],
  penalties: UxJudgePenaltyResult[]
): UxJudgeResult {
  const overallScore = calculateWeightedScore(criteria);
  const finalScore = applyPenalties(overallScore, penalties);

  return {
    screen,
    breakpoint,
    theme,
    overallScore,
    criteria,
    penalties,
    finalScore,
  };
}

// ============================================================
// Score Comparison
// ============================================================

export function isRegression(
  currentScore: number,
  baselineScore: number,
  threshold: number = -1.5
): boolean {
  return (currentScore - baselineScore) < threshold;
}

export function isImprovement(
  currentScore: number,
  baselineScore: number,
  threshold: number = 1.0
): boolean {
  return (currentScore - baselineScore) > threshold;
}

// ============================================================
// Aggregate Scores
// ============================================================

export function averageScore(results: UxJudgeResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.finalScore, 0);
  return Math.round((sum / results.length) * 100) / 100;
}

export function lowestScore(results: UxJudgeResult[]): UxJudgeResult | null {
  if (results.length === 0) return null;
  return results.reduce((min, r) => r.finalScore < min.finalScore ? r : min);
}

export function scoresByScreen(results: UxJudgeResult[]): Map<string, number> {
  const byScreen = new Map<string, number[]>();
  for (const r of results) {
    const arr = byScreen.get(r.screen) || [];
    arr.push(r.finalScore);
    byScreen.set(r.screen, arr);
  }

  const averages = new Map<string, number>();
  for (const [screen, scores] of byScreen) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    averages.set(screen, Math.round(avg * 100) / 100);
  }
  return averages;
}
