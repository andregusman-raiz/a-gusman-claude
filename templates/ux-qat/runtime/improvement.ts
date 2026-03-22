/**
 * UX-QAT Continuous Improvement — 4 Modules
 *
 * Module 1: Rubric Refinement — detect judge variance, refine criteria
 * Module 2: Scenario Detection — detect uncovered screens, suggest new scenarios
 * Module 3: Cost Intelligence — ROI per scenario, optimize L3 usage
 * Module 4: Trends Export — JSON + Markdown for quality digest
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  Finding,
  Baseline,
  RunSummary,
  CostMetrics,
  ScenarioROI,
} from '../types/ux-qat.types';
import { log, writeJsonFile, ensureDir } from './utils';
import { loadAllBaselines } from './kb';

// ============================================================
// Module 1: Rubric Refinement
// ============================================================

export type VarianceClassification =
  | 'judge-variance'   // Same screenshot, scores diverge > 2.0 between runs
  | 'output-variance'  // Judge produces different structure
  | 'rubric-ambiguity' // Criterion description too vague
  | 'stable';          // No issues

export interface RubricRefinementResult {
  rubricType: string;
  classification: VarianceClassification;
  highVarianceCriteria: string[];
  recommendation: string;
}

export function analyzeJudgeVariance(
  runHistories: Array<{ runId: string; screen: string; criterionScores: Map<string, number> }>,
  varianceThreshold: number = 2.0
): RubricRefinementResult[] {
  const results: RubricRefinementResult[] = [];

  // Group by screen
  const byScreen = new Map<string, Array<{ runId: string; scores: Map<string, number> }>>();
  for (const run of runHistories) {
    const arr = byScreen.get(run.screen) || [];
    arr.push({ runId: run.runId, scores: run.criterionScores });
    byScreen.set(run.screen, arr);
  }

  for (const [screen, runs] of byScreen) {
    if (runs.length < 2) continue;

    // Collect all criteria names
    const allCriteria = new Set<string>();
    for (const run of runs) {
      for (const key of run.scores.keys()) {
        allCriteria.add(key);
      }
    }

    const highVariance: string[] = [];
    for (const criterion of allCriteria) {
      const scores = runs
        .map(r => r.scores.get(criterion))
        .filter((s): s is number => s !== undefined);

      if (scores.length < 2) continue;

      const min = Math.min(...scores);
      const max = Math.max(...scores);
      if (max - min > varianceThreshold) {
        highVariance.push(criterion);
      }
    }

    if (highVariance.length > 0) {
      results.push({
        rubricType: screen,
        classification: highVariance.length > 2 ? 'rubric-ambiguity' : 'judge-variance',
        highVarianceCriteria: highVariance,
        recommendation: highVariance.length > 2
          ? `Rubric for "${screen}" has ${highVariance.length} ambiguous criteria. Refine descriptions and add golden sample examples.`
          : `Criteria [${highVariance.join(', ')}] in "${screen}" show high variance. Add specific visual examples.`,
      });
    } else {
      results.push({
        rubricType: screen,
        classification: 'stable',
        highVarianceCriteria: [],
        recommendation: 'No issues detected.',
      });
    }
  }

  return results;
}

// ============================================================
// Module 2: Scenario Detection
// ============================================================

export interface ScenarioGap {
  screen: string;
  reason: string;
  suggestedRubricType: string;
  priority: 'high' | 'medium' | 'low';
}

export function detectScenarioGaps(
  configuredScreens: string[],
  findingsWithNewScreens: Finding[],
  existingScenarios: string[]
): ScenarioGap[] {
  const gaps: ScenarioGap[] = [];

  // Screens in config but without scenarios
  for (const screen of configuredScreens) {
    if (!existingScenarios.includes(screen)) {
      gaps.push({
        screen,
        reason: 'Screen configured but no scenario exists',
        suggestedRubricType: 'custom',
        priority: 'high',
      });
    }
  }

  // Screens with findings that don't have scenarios
  const screensWithFindings = [...new Set(findingsWithNewScreens.map(f => f.screen))];
  for (const screen of screensWithFindings) {
    if (!existingScenarios.includes(screen) && !configuredScreens.includes(screen)) {
      gaps.push({
        screen,
        reason: 'Screen has findings from external source but no scenario',
        suggestedRubricType: 'custom',
        priority: 'medium',
      });
    }
  }

  return gaps;
}

// ============================================================
// Module 3: Cost Intelligence
// ============================================================

export function calculateCostMetrics(
  scenarioId: string,
  runHistories: Array<{ runId: string; cost: number; findings: Finding[] }>
): CostMetrics {
  const totalRuns = runHistories.length;
  const totalCost = runHistories.reduce((sum, r) => sum + r.cost, 0);
  const issuesDetected = runHistories.reduce(
    (sum, r) => sum + r.findings.filter(f => f.severity === 'P0' || f.severity === 'P1').length,
    0
  );

  // Average severity: P0=4, P1=3, P2=2, P3=1
  const severityMap: Record<string, number> = { P0: 4, P1: 3, P2: 2, P3: 1 };
  let totalSeverity = 0;
  let totalFindings = 0;
  for (const run of runHistories) {
    for (const f of run.findings) {
      totalSeverity += severityMap[f.severity] || 1;
      totalFindings++;
    }
  }
  const averageSeverity = totalFindings > 0 ? totalSeverity / totalFindings : 0;

  // Classify ROI
  let roi: ScenarioROI;
  let recommendation: string;

  if (totalCost > 1.0 && issuesDetected === 0) {
    roi = 'too-expensive';
    recommendation = 'Reduce breakpoints/themes or move to L1+L2 only';
  } else if (totalRuns >= 5 && issuesDetected === 0) {
    roi = 'always-passes';
    recommendation = 'Skip L3 for this scenario (keep L1+L2+L4)';
  } else if (totalRuns >= 3 && runHistories.every(r => r.findings.some(f => f.severity === 'P0' || f.severity === 'P1'))) {
    roi = 'always-fails';
    recommendation = 'Investigate if this is a real bug or rubric issue';
  } else if (issuesDetected > 0 && totalCost < 0.5) {
    roi = 'high-value';
    recommendation = 'Keep running — good cost/value ratio';
  } else if (issuesDetected > 0) {
    roi = 'moderate';
    recommendation = 'Acceptable cost/value ratio';
  } else {
    roi = 'low-value';
    recommendation = 'Consider reducing frequency';
  }

  return {
    scenarioId,
    totalRuns,
    totalCost: Math.round(totalCost * 100) / 100,
    issuesDetected,
    averageSeverity: Math.round(averageSeverity * 100) / 100,
    roi,
    recommendation,
  };
}

// ============================================================
// Module 4: Trends Export
// ============================================================

export interface TrendData {
  generatedAt: string;
  period: { from: string; to: string };
  scoresByScreen: Record<string, number[]>;
  scoresByRubricType: Record<string, number[]>;
  regressionsCount: number;
  topFailurePatterns: Array<{ pattern: string; count: number }>;
  cumulativeL3Cost: number;
  complianceRate: number; // % of screens passing L4
}

export function exportTrends(
  uxqatDir: string,
  summaries: RunSummary[],
  outputDir?: string
): TrendData {
  const targetDir = outputDir || path.join(uxqatDir, 'reports');
  ensureDir(targetDir);

  const now = new Date().toISOString();
  const timestamps = summaries.map(s => s.timestamp).sort();

  // Scores by screen (from L3 findings)
  const scoresByScreen: Record<string, number[]> = {};
  const scoresByRubricType: Record<string, number[]> = {};
  let regressionsCount = 0;
  let totalL3Cost = 0;
  let l4PassCount = 0;
  let l4TotalCount = 0;

  // Pattern frequency
  const patternCounts = new Map<string, number>();

  for (const summary of summaries) {
    totalL3Cost += summary.estimatedCost;

    for (const finding of summary.findings) {
      // Count patterns by description
      const desc = finding.description.slice(0, 50);
      patternCounts.set(desc, (patternCounts.get(desc) || 0) + 1);

      if (finding.category === 'REGRESSION') {
        regressionsCount++;
      }

      // Track L3 scores
      if (finding.layer === 'L3' && finding.score !== undefined) {
        const arr = scoresByScreen[finding.screen] || [];
        arr.push(finding.score);
        scoresByScreen[finding.screen] = arr;
      }
    }

    // Track L4 pass rate
    const l4Findings = summary.findings.filter(f => f.layer === 'L4');
    const l4Screens = new Set(l4Findings.map(f => f.screen));
    l4TotalCount += l4Screens.size || summary.total;
    const l4FailScreens = new Set(
      l4Findings.filter(f => f.severity === 'P0' || f.severity === 'P1').map(f => f.screen)
    );
    l4PassCount += (l4Screens.size || summary.total) - l4FailScreens.size;
  }

  // Top failure patterns
  const topPatterns = [...patternCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => ({ pattern, count }));

  const trendData: TrendData = {
    generatedAt: now,
    period: {
      from: timestamps[0] || now,
      to: timestamps[timestamps.length - 1] || now,
    },
    scoresByScreen,
    scoresByRubricType,
    regressionsCount,
    topFailurePatterns: topPatterns,
    cumulativeL3Cost: Math.round(totalL3Cost * 100) / 100,
    complianceRate: l4TotalCount > 0
      ? Math.round((l4PassCount / l4TotalCount) * 100)
      : 100,
  };

  // Save JSON
  writeJsonFile(path.join(targetDir, 'trends.json'), trendData);

  // Save Markdown digest
  const markdown = generateTrendMarkdown(trendData);
  fs.writeFileSync(path.join(targetDir, 'trends.md'), markdown, 'utf-8');

  log('info', 'Improvement', `Trends exported to ${targetDir}`);
  return trendData;
}

function generateTrendMarkdown(data: TrendData): string {
  const lines: string[] = [
    `# UX-QAT Quality Trends`,
    ``,
    `> Generated: ${data.generatedAt}`,
    `> Period: ${data.period.from.slice(0, 10)} to ${data.period.to.slice(0, 10)}`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Regressions | ${data.regressionsCount} |`,
    `| L3 Cost | $${data.cumulativeL3Cost.toFixed(2)} |`,
    `| L4 Compliance | ${data.complianceRate}% |`,
    ``,
    `## Top Failure Patterns`,
    ``,
  ];

  if (data.topFailurePatterns.length === 0) {
    lines.push('No failure patterns detected.');
  } else {
    lines.push(`| Pattern | Count |`);
    lines.push(`|---------|-------|`);
    for (const p of data.topFailurePatterns) {
      lines.push(`| ${p.pattern} | ${p.count} |`);
    }
  }

  lines.push('');
  lines.push('## Scores by Screen');
  lines.push('');

  for (const [screen, scores] of Object.entries(data.scoresByScreen)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = scores.length >= 2
      ? scores[scores.length - 1] > scores[0] ? 'improving' : 'declining'
      : 'insufficient data';
    lines.push(`- **${screen}**: avg=${avg.toFixed(1)}, runs=${scores.length}, trend=${trend}`);
  }

  return lines.join('\n');
}
