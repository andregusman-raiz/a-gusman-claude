/**
 * UX-QAT Failure Classifier
 *
 * Classifies findings into 6 categories with severity P0-P3.
 * Detects regressions by comparing against baselines.
 * Detects flaky results by comparing consecutive runs.
 *
 * Categories:
 *   RENDER      — L1 failures (broken page, overflow, missing images)
 *   INTERACTION — L2 failures (button not responding, form not validating)
 *   PERCEPTION  — L3 score below threshold (design quality issues)
 *   COMPLIANCE  — L4 violations (WCAG, Lighthouse, touch targets)
 *   REGRESSION  — Score dropped > delta vs baseline
 *   FLAKY       — Inconsistent results between consecutive runs
 */

import type {
  Finding,
  FailureCategory,
  Severity,
  Baseline,
  RunSummary,
} from '../types/ux-qat.types';

// ============================================================
// Classification Rules
// ============================================================

interface ClassificationRule {
  category: FailureCategory;
  severity: Severity;
  match: (finding: Finding) => boolean;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // P0 — BLOCKING
  {
    category: 'RENDER',
    severity: 'P0',
    match: (f) => f.layer === 'L1' && f.shortCircuited,
  },
  {
    category: 'COMPLIANCE',
    severity: 'P0',
    match: (f) => f.layer === 'L4' && f.description.includes('critical'),
  },

  // P1 — HIGH
  {
    category: 'INTERACTION',
    severity: 'P1',
    match: (f) => f.layer === 'L2' && (f.description.includes('critical') || f.shortCircuited),
  },
  {
    category: 'REGRESSION',
    severity: 'P1',
    match: (f) => f.category === 'REGRESSION' && (f.baselineDelta ?? 0) < -2.0,
  },

  // P2 — MEDIUM
  {
    category: 'PERCEPTION',
    severity: 'P2',
    match: (f) => f.layer === 'L3' && (f.score ?? 10) < 6.0,
  },
  {
    category: 'COMPLIANCE',
    severity: 'P2',
    match: (f) => f.layer === 'L4' && f.description.includes('serious'),
  },
  {
    category: 'INTERACTION',
    severity: 'P2',
    match: (f) => f.layer === 'L2' && !f.shortCircuited,
  },

  // P3 — LOW
  {
    category: 'PERCEPTION',
    severity: 'P3',
    match: (f) => f.layer === 'L3' && (f.score ?? 10) >= 6.0 && (f.score ?? 10) < 8.0,
  },
  {
    category: 'COMPLIANCE',
    severity: 'P3',
    match: (f) => f.layer === 'L4' && !f.description.includes('critical') && !f.description.includes('serious'),
  },
];

// ============================================================
// Classifier
// ============================================================

export function classifyFinding(finding: Finding): Finding {
  // Already classified by layer runners — refine if needed
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.match(finding)) {
      return {
        ...finding,
        category: rule.category,
        severity: rule.severity,
      };
    }
  }

  // Default: keep existing classification
  return finding;
}

export function classifyFindings(findings: Finding[]): Finding[] {
  return findings.map(classifyFinding);
}

// ============================================================
// Regression Detection
// ============================================================

export interface RegressionResult {
  screen: string;
  breakpoint: number;
  theme: string;
  currentScore: number;
  baselineScore: number;
  delta: number;
  isRegression: boolean;
}

export function detectRegressions(
  findings: Finding[],
  baselines: Map<string, Baseline>,
  regressionThreshold: number = -1.5
): { regressions: RegressionResult[]; updatedFindings: Finding[] } {
  const regressions: RegressionResult[] = [];
  const updatedFindings = [...findings];

  // Group L3 findings by screen to get scores
  const l3Scores = new Map<string, { screen: string; breakpoint: number; theme: string; score: number }>();
  for (const f of findings) {
    if (f.layer === 'L3' && f.score !== undefined) {
      const key = `${f.screen}`;
      if (!l3Scores.has(key) || (f.score < (l3Scores.get(key)?.score ?? 10))) {
        l3Scores.set(key, {
          screen: f.screen,
          breakpoint: 0, // aggregated
          theme: 'all',
          score: f.score,
        });
      }
    }
  }

  // Compare against baselines
  for (const [key, baseline] of baselines) {
    const l3 = l3Scores.get(baseline.screen);
    if (!l3) continue;

    const delta = l3.score - baseline.score;
    const isReg = delta < regressionThreshold;

    regressions.push({
      screen: baseline.screen,
      breakpoint: baseline.breakpoint,
      theme: baseline.theme,
      currentScore: l3.score,
      baselineScore: baseline.score,
      delta,
      isRegression: isReg,
    });

    if (isReg) {
      updatedFindings.push({
        screen: baseline.screen,
        layer: 'L3',
        category: 'REGRESSION',
        severity: delta < -3.0 ? 'P1' : 'P2',
        score: l3.score,
        baselineDelta: delta,
        shortCircuited: false,
        description: `Regression detected: ${l3.score} vs baseline ${baseline.score} (delta: ${delta.toFixed(1)})`,
        evidence: `Baseline from ${baseline.lastUpdated}`,
      });
    }
  }

  return { regressions, updatedFindings };
}

// ============================================================
// Flaky Detection
// ============================================================

export function detectFlaky(
  currentFindings: Finding[],
  previousFindings: Finding[],
  flakyThreshold: number = 2.0
): Finding[] {
  const flakyFindings: Finding[] = [];

  // Compare L3 scores between runs for same screen
  const currentScores = new Map<string, number>();
  const previousScores = new Map<string, number>();

  for (const f of currentFindings) {
    if (f.layer === 'L3' && f.score !== undefined) {
      currentScores.set(f.screen, f.score);
    }
  }

  for (const f of previousFindings) {
    if (f.layer === 'L3' && f.score !== undefined) {
      previousScores.set(f.screen, f.score);
    }
  }

  for (const [screen, current] of currentScores) {
    const previous = previousScores.get(screen);
    if (previous === undefined) continue;

    const variance = Math.abs(current - previous);
    if (variance > flakyThreshold) {
      flakyFindings.push({
        screen,
        layer: 'L3',
        category: 'FLAKY',
        severity: 'P3',
        score: current,
        shortCircuited: false,
        description: `Flaky result: score varies ${variance.toFixed(1)} between runs (${previous} → ${current})`,
        evidence: `Previous: ${previous}, Current: ${current}`,
      });
    }
  }

  return flakyFindings;
}

// ============================================================
// Priority Summary
// ============================================================

export interface PrioritySummary {
  p0: Finding[];
  p1: Finding[];
  p2: Finding[];
  p3: Finding[];
  total: number;
  blocking: boolean;
}

export function prioritize(findings: Finding[]): PrioritySummary {
  const classified = classifyFindings(findings);

  const p0 = classified.filter(f => f.severity === 'P0');
  const p1 = classified.filter(f => f.severity === 'P1');
  const p2 = classified.filter(f => f.severity === 'P2');
  const p3 = classified.filter(f => f.severity === 'P3');

  return {
    p0,
    p1,
    p2,
    p3,
    total: classified.length,
    blocking: p0.length > 0,
  };
}
