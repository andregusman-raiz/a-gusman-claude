/**
 * UX-QAT PDCA Orchestrator
 *
 * Full Plan → Do → Check → Act cycle:
 *
 * PLAN: Load KB (baselines, patterns, learnings), load design tokens, configure layers
 * DO:   Navigate, capture, evaluate (L1→L2→L3→L4 via runner)
 * CHECK: Classify findings (6 categories), detect regressions, detect flaky, prioritize
 * ACT:  Update baselines, register patterns, trigger improvement modules, export trends
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  UxQatConfig,
  RunSummary,
  Finding,
  Baseline,
  FailurePattern,
} from '../types/ux-qat.types';
import { log, logPass, logFail, writeJsonFile, resolveUxQatDir } from './utils';
import { runUxQat, type RunOptions } from './runner';
import {
  initializeKB,
  loadAllBaselines,
  loadAllPatterns,
  saveBaseline,
  shouldUpdateBaseline,
  loadBaseline,
  createPatternFromFindings,
  savePattern,
  saveLearning,
} from './kb';
import {
  classifyFindings,
  detectRegressions,
  detectFlaky,
  prioritize,
  type PrioritySummary,
} from './classifier';
import {
  analyzeJudgeVariance,
  detectScenarioGaps,
  calculateCostMetrics,
  exportTrends,
} from './improvement';

// ============================================================
// Types
// ============================================================

export interface PDCAOptions {
  config: UxQatConfig;
  projectRoot: string;
  trigger?: 'deploy' | 'weekly' | 'manual' | 'pr';
  previousRunPath?: string; // For flaky detection
  l3Model?: 'sonnet' | 'opus';
  skipImprovement?: boolean; // Skip ACT phase improvement modules
}

export interface PDCAResult {
  runSummary: RunSummary;
  priority: PrioritySummary;
  baselineUpdates: Array<{ screen: string; oldScore: number | null; newScore: number }>;
  newPatterns: FailurePattern[];
  regressions: Array<{ screen: string; delta: number }>;
  flakyFindings: Finding[];
  verdict: 'PASS' | 'WARN' | 'FAIL';
}

// ============================================================
// PLAN Phase
// ============================================================

interface PlanContext {
  uxqatDir: string;
  baselines: Map<string, Baseline>;
  patterns: FailurePattern[];
}

function plan(config: UxQatConfig, projectRoot: string): PlanContext {
  log('info', 'PDCA', '=== PLAN ===');

  const uxqatDir = resolveUxQatDir(projectRoot);

  // Initialize KB if it doesn't exist
  initializeKB(uxqatDir);

  // Load baselines
  const baselines = loadAllBaselines(uxqatDir);
  log('info', 'PDCA', `Loaded ${baselines.size} baselines`);

  // Load known failure patterns
  const patterns = loadAllPatterns(uxqatDir);
  log('info', 'PDCA', `Loaded ${patterns.length} known failure patterns`);

  return { uxqatDir, baselines, patterns };
}

// ============================================================
// DO Phase
// ============================================================

function execute(
  config: UxQatConfig,
  projectRoot: string,
  trigger: string,
  l3Model?: 'sonnet' | 'opus'
): RunSummary {
  log('info', 'PDCA', '=== DO ===');

  const options: RunOptions = {
    config,
    projectRoot,
    trigger: trigger as RunOptions['trigger'],
    l3Model,
  };

  return runUxQat(options);
}

// ============================================================
// CHECK Phase
// ============================================================

interface CheckResult {
  classifiedFindings: Finding[];
  priority: PrioritySummary;
  regressions: Array<{ screen: string; delta: number }>;
  flakyFindings: Finding[];
}

function check(
  summary: RunSummary,
  context: PlanContext,
  previousRunPath?: string
): CheckResult {
  log('info', 'PDCA', '=== CHECK ===');

  // Classify findings
  const classifiedFindings = classifyFindings(summary.findings);
  log('info', 'PDCA', `Classified ${classifiedFindings.length} findings`);

  // Detect regressions
  const regressionThreshold = -1.5;
  const { regressions: regResults, updatedFindings } = detectRegressions(
    classifiedFindings,
    context.baselines,
    regressionThreshold
  );

  const regressions = regResults
    .filter(r => r.isRegression)
    .map(r => ({ screen: r.screen, delta: r.delta }));

  if (regressions.length > 0) {
    logFail('PDCA', `${regressions.length} regressions detected`);
  }

  // Detect flaky results
  let flakyFindings: Finding[] = [];
  if (previousRunPath && fs.existsSync(previousRunPath)) {
    try {
      const previousSummary = JSON.parse(fs.readFileSync(previousRunPath, 'utf-8')) as RunSummary;
      flakyFindings = detectFlaky(updatedFindings, previousSummary.findings);
      if (flakyFindings.length > 0) {
        log('warn', 'PDCA', `${flakyFindings.length} flaky results detected`);
      }
    } catch {
      log('warn', 'PDCA', 'Could not load previous run for flaky detection');
    }
  }

  // Combine all findings
  const allFindings = [...updatedFindings, ...flakyFindings];

  // Prioritize
  const priority = prioritize(allFindings);

  log('info', 'PDCA', `Priority: P0=${priority.p0.length}, P1=${priority.p1.length}, P2=${priority.p2.length}, P3=${priority.p3.length}`);

  return {
    classifiedFindings: allFindings,
    priority,
    regressions,
    flakyFindings,
  };
}

// ============================================================
// ACT Phase
// ============================================================

interface ActResult {
  baselineUpdates: Array<{ screen: string; oldScore: number | null; newScore: number }>;
  newPatterns: FailurePattern[];
}

function act(
  summary: RunSummary,
  checkResult: CheckResult,
  context: PlanContext,
  config: UxQatConfig,
  skipImprovement: boolean
): ActResult {
  log('info', 'PDCA', '=== ACT ===');

  const baselineUpdates: Array<{ screen: string; oldScore: number | null; newScore: number }> = [];
  const newPatterns: FailurePattern[] = [];

  // A.1 — Update baselines for improvements
  if (summary.averageScore > 0) {
    for (const screen of config.screens) {
      const existing = loadBaseline(context.uxqatDir, screen.name, 0, 'all');
      if (shouldUpdateBaseline(summary.averageScore, existing)) {
        const result = saveBaseline(context.uxqatDir, screen.name, 0, 'all', summary.averageScore);
        baselineUpdates.push({ screen: screen.name, ...result });
      }
    }
  }

  // A.2 — Register new failure patterns
  const p0p1 = [...checkResult.priority.p0, ...checkResult.priority.p1];
  if (p0p1.length > 0) {
    // Group by category
    const byCategory = new Map<string, Finding[]>();
    for (const f of p0p1) {
      const arr = byCategory.get(f.category) || [];
      arr.push(f);
      byCategory.set(f.category, arr);
    }

    for (const [category, findings] of byCategory) {
      // Check if pattern already exists
      const existingPattern = context.patterns.find(
        p => p.category === category && p.status !== 'resolved'
      );

      if (!existingPattern) {
        const pattern = createPatternFromFindings(
          findings,
          findings[0].category,
          findings[0].severity
        );
        savePattern(context.uxqatDir, pattern);
        newPatterns.push(pattern);
        log('info', 'PDCA', `New failure pattern: ${pattern.id}`);
      }
    }
  }

  // A.3-A.6 — Improvement modules (skip if requested)
  if (!skipImprovement) {
    // A.6 — Export trends (always run)
    try {
      exportTrends(context.uxqatDir, [summary]);
    } catch (err) {
      log('warn', 'PDCA', `Trends export failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // A.4/A.5 — Log learning about this run
    if (checkResult.regressions.length > 0 || newPatterns.length > 0) {
      const learningContent = [
        `# PDCA Run Learning`,
        ``,
        `**Run**: ${summary.runId}`,
        `**Date**: ${summary.timestamp}`,
        `**Trigger**: ${summary.trigger}`,
        ``,
        `## Findings`,
        `- Total: ${summary.findings.length}`,
        `- P0: ${checkResult.priority.p0.length}`,
        `- P1: ${checkResult.priority.p1.length}`,
        `- Regressions: ${checkResult.regressions.length}`,
        `- New patterns: ${newPatterns.length}`,
        ``,
        `## Details`,
        ...checkResult.regressions.map(r => `- Regression: ${r.screen} (delta: ${r.delta.toFixed(1)})`),
        ...newPatterns.map(p => `- Pattern: ${p.id} (${p.category}, ${p.severity})`),
      ].join('\n');

      saveLearning(context.uxqatDir, 'pdca-run', learningContent);
    }
  }

  return { baselineUpdates, newPatterns };
}

// ============================================================
// Full PDCA Cycle
// ============================================================

export function runPDCA(options: PDCAOptions): PDCAResult {
  const {
    config,
    projectRoot,
    trigger = 'manual',
    previousRunPath,
    l3Model,
    skipImprovement = false,
  } = options;

  log('info', 'PDCA', '========================================');
  log('info', 'PDCA', `  UX-QAT PDCA Cycle — ${config.projectName}`);
  log('info', 'PDCA', `  Trigger: ${trigger}`);
  log('info', 'PDCA', '========================================');

  // PLAN
  const context = plan(config, projectRoot);

  // DO
  const runSummary = execute(config, projectRoot, trigger, l3Model);

  // CHECK
  const checkResult = check(runSummary, context, previousRunPath);

  // ACT
  const actResult = act(runSummary, checkResult, context, config, skipImprovement);

  // Update summary with PDCA results
  runSummary.baselineUpdates = actResult.baselineUpdates.map(u => ({
    screen: u.screen,
    oldScore: u.oldScore ?? 0,
    newScore: u.newScore,
  }));
  runSummary.newPatterns = actResult.newPatterns.map(p => p.id);

  // Determine verdict
  let verdict: 'PASS' | 'WARN' | 'FAIL';
  if (checkResult.priority.blocking) {
    verdict = 'FAIL';
    logFail('PDCA', `VERDICT: FAIL — ${checkResult.priority.p0.length} P0 findings`);
  } else if (checkResult.priority.p1.length > 0) {
    verdict = 'WARN';
    log('warn', 'PDCA', `VERDICT: WARN — ${checkResult.priority.p1.length} P1 findings`);
  } else {
    verdict = 'PASS';
    logPass('PDCA', 'VERDICT: PASS');
  }

  log('info', 'PDCA', '========================================');
  log('info', 'PDCA', '  PDCA Cycle Complete');
  log('info', 'PDCA', `  Baseline updates: ${actResult.baselineUpdates.length}`);
  log('info', 'PDCA', `  New patterns: ${actResult.newPatterns.length}`);
  log('info', 'PDCA', `  Cost: ~$${runSummary.estimatedCost.toFixed(2)}`);
  log('info', 'PDCA', '========================================');

  return {
    runSummary,
    priority: checkResult.priority,
    baselineUpdates: actResult.baselineUpdates,
    newPatterns: actResult.newPatterns,
    regressions: checkResult.regressions,
    flakyFindings: checkResult.flakyFindings,
    verdict,
  };
}
