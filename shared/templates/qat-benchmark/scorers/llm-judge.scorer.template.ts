/**
 * LLM Judge Scorer — L3 Judge Jury (multi-model, dual-position)
 *
 * Each judge evaluates in both positions to eliminate position bias.
 * Median aggregation across judges removes outliers.
 *
 * CUSTOMIZE: Implement API calls for your providers.
 */

// --- Types ---

export interface DimensionEval {
  score: number; // 1-10
  rationale: string;
}

export interface JudgeResponse {
  response_a: Record<string, DimensionEval> & { overall: number };
  response_b: Record<string, DimensionEval> & { overall: number };
  comparison: 'A melhor' | 'B melhor' | 'Empate';
  confidence: 'high' | 'medium' | 'low';
}

export interface JuryResult {
  scores_app: Record<string, number>;
  scores_baseline: Record<string, number>;
  overall_app: number;
  overall_baseline: number;
  parity: number;
  confidence: 'high' | 'medium' | 'low';
  judgesUsed: number;
  mode: 'full' | 'dual-position' | 'single';
}

interface DimensionDef {
  id: string;
  name: string;
  weight: number;
  criteria: string[];
}

// --- Judge Prompt Builder ---

export function buildJudgePrompt(
  outputA: string,
  outputB: string,
  prompt: string,
  context: string | undefined,
  dimensions: DimensionDef[]
): string {
  const dimCriteria = dimensions
    .map(d => `### ${d.id} — ${d.name} (${(d.weight * 100).toFixed(0)}%)\nCriteria: ${d.criteria.join(', ')}`)
    .join('\n\n');

  return `You are a quality evaluator for AI-generated responses.

## Task
Evaluate the two responses below. Score each 1-10 on each dimension.
Be objective. Do NOT favor longer responses.

## Original Prompt
${prompt}
${context ? `\n## Context\n${context}` : ''}

## Response A
${outputA}

## Response B
${outputB}

## Dimensions
${dimCriteria}

## Scoring: 1-2 unusable, 3-4 weak, 5 below acceptable, 6 acceptable, 7-8 good, 9-10 excellent

Respond ONLY with valid JSON matching the schema.`;
}

// --- Aggregation ---

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function aggregateJudgments(
  appScoresPerDim: Record<string, number[]>,
  baseScoresPerDim: Record<string, number[]>,
  overallAppScores: number[],
  overallBaseScores: number[],
  judgesUsed: number,
  mode: 'full' | 'dual-position' | 'single'
): JuryResult {
  const scores_app: Record<string, number> = {};
  const scores_baseline: Record<string, number> = {};

  for (const [dim, scores] of Object.entries(appScoresPerDim)) {
    scores_app[dim] = median(scores);
  }
  for (const [dim, scores] of Object.entries(baseScoresPerDim)) {
    scores_baseline[dim] = median(scores);
  }

  const overall_app = median(overallAppScores);
  const overall_baseline = median(overallBaseScores);

  return {
    scores_app,
    scores_baseline,
    overall_app,
    overall_baseline,
    parity: overall_baseline > 0 ? overall_app / overall_baseline : 0,
    confidence: judgesUsed >= 3 ? 'high' : judgesUsed >= 2 ? 'medium' : 'low',
    judgesUsed,
    mode,
  };
}
