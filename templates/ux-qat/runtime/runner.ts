/**
 * UX-QAT Runner — Orchestrator
 *
 * Executes L1 -> L2 -> L3 -> L4 with short-circuit logic:
 * - L1 fails (P0) -> skip L2/L3/L4 for that screen
 * - L2 critical fails -> skip L3/L4 for that screen
 * - L3 evaluates via AI Judge (multimodal) when layer is active
 *
 * Usage:
 *   import { runUxQat } from './runner';
 *   const summary = await runUxQat({ configPath: '.ux-qat/config/ux-qat.config.ts' });
 */

import * as path from 'path';
import type {
  UxQatConfig,
  ScreenConfig,
  Finding,
  CapturePoint,
  RunSummary,
  L2Interaction,
} from '../types/ux-qat.types';
import {
  createSession,
  closeSession,
  navigateTo,
  setViewport,
  generateRunId,
  resolveUxQatDir,
  log,
  logPass,
  logFail,
  logSkip,
  writeJsonFile,
} from './utils';
import { captureScreen, type CaptureOptions } from './capture';
import { runL1, type L1Result } from './l1-render';
import { runL2, type L2Result } from './l2-interaction';
import { runL4, type L4Result } from './l4-compliance';
import { generateReport } from './report';
import { runL3, type L3Options, type L3Result } from './l3-judge';
import { averageScore } from './scoring';

// ============================================================
// Types
// ============================================================

export type LayerSet = ('L1' | 'L2' | 'L3' | 'L4')[];

export interface RunOptions {
  config: UxQatConfig;
  projectRoot: string;
  layers?: LayerSet;
  trigger?: 'deploy' | 'weekly' | 'manual' | 'pr';
  screens?: string[]; // Filter to specific screens
  breakpoints?: number[]; // Override breakpoints
  themes?: string[]; // Override themes
  skipLighthouse?: boolean;
  l3Model?: 'sonnet' | 'opus';
}

export interface ScreenResult {
  screen: string;
  l1Results: L1Result[];
  l2Results: L2Result[];
  l3Results: L3Result[];
  l4Results: L4Result[];
  findings: Finding[];
  shortCircuited: boolean;
  shortCircuitReason?: string;
}

// ============================================================
// Layer Selection
// ============================================================

function selectLayers(trigger: string): LayerSet {
  switch (trigger) {
    case 'deploy':
      return ['L1', 'L2', 'L4'];
    case 'weekly':
    case 'manual':
      return ['L1', 'L2', 'L3', 'L4'];
    case 'pr':
      return ['L1', 'L2', 'L3'];
    default:
      return ['L1', 'L2', 'L4'];
  }
}

// ============================================================
// Main Runner
// ============================================================

export function runUxQat(options: RunOptions): RunSummary {
  const {
    config,
    projectRoot,
    trigger = 'manual',
    skipLighthouse = false,
  } = options;

  const layers = options.layers || selectLayers(trigger);
  const uxqatDir = resolveUxQatDir(projectRoot);
  const runId = generateRunId();

  log('info', 'Runner', `=== UX-QAT Run: ${runId} ===`);
  log('info', 'Runner', `Project: ${config.projectName} | Trigger: ${trigger}`);
  log('info', 'Runner', `Layers: ${layers.join(', ')}`);

  // Filter screens if specified
  let screens = config.screens;
  if (options.screens && options.screens.length > 0) {
    screens = screens.filter(s => options.screens!.includes(s.name));
  }

  const breakpoints = options.breakpoints || config.breakpoints;
  const themes = options.themes || config.themes;

  log('info', 'Runner', `Screens: ${screens.length} | Breakpoints: ${breakpoints.join(',')} | Themes: ${themes.join(',')}`);

  // Create browser session
  const session = createSession(config.baseUrl);
  const allFindings: Finding[] = [];
  const screenResults: ScreenResult[] = [];

  let totalCaptures = 0;
  let passedCaptures = 0;
  let failedCaptures = 0;
  let skippedCaptures = 0;
  let shortCircuitedCount = 0;
  let totalL3Cost = 0;

  try {
    for (const screen of screens) {
      log('info', 'Runner', `\n--- Screen: ${screen.name} (${screen.path}) ---`);

      const captureOpts: CaptureOptions = {
        breakpoints,
        themes,
        runId,
        uxqatDir,
      };

      // Capture screenshots
      const captureResult = captureScreen(session, screen, captureOpts);

      if (captureResult.capturePoints.length === 0) {
        log('error', 'Runner', `No capture points for ${screen.name} — skipping`);
        skippedCaptures++;
        continue;
      }

      const screenFindingsAll: Finding[] = [];
      const l1Results: L1Result[] = [];
      const l2Results: L2Result[] = [];
      const l3Results: L3Result[] = [];
      const l4Results: L4Result[] = [];
      let screenShortCircuited = false;
      let shortCircuitReason: string | undefined;

      for (const cp of captureResult.capturePoints) {
        totalCaptures++;

        // ---- L1: Render Checks ----
        if (layers.includes('L1')) {
          // Navigate back to the screen for this breakpoint
          navigateTo(session, screen.path);
          setViewport(session, cp.breakpoint);

          const l1 = runL1(session, cp, screen.l1Overrides || undefined);
          l1Results.push(l1);
          screenFindingsAll.push(...l1.findings);

          if (!l1.passed) {
            // SHORT-CIRCUIT: L1 failed -> skip L2/L3/L4
            screenShortCircuited = true;
            shortCircuitReason = `L1 render failed at ${cp.breakpoint}x${cp.theme}`;
            shortCircuitedCount++;
            failedCaptures++;

            // Mark findings as short-circuited
            for (const f of l1.findings) {
              f.shortCircuited = true;
            }

            logSkip('Runner', `Short-circuit: skipping L2/L3/L4 for ${screen.name}@${cp.breakpoint}`);
            continue;
          }
        }

        // ---- L2: Interaction Checks ----
        if (layers.includes('L2') && !screenShortCircuited) {
          const interactions = resolveInteractions(screen, uxqatDir);

          if (interactions.length > 0) {
            const l2 = runL2(session, cp, interactions, { runId, uxqatDir });
            l2Results.push(l2);
            screenFindingsAll.push(...l2.findings);

            if (l2.criticalFailed) {
              // SHORT-CIRCUIT: Critical L2 failed -> skip L3/L4
              screenShortCircuited = true;
              shortCircuitReason = `L2 critical interaction failed at ${cp.breakpoint}x${cp.theme}`;
              shortCircuitedCount++;
              failedCaptures++;
              logSkip('Runner', `Short-circuit: skipping L3/L4 for ${screen.name} (critical interaction failed)`);
              continue;
            }
          }
        }

        // ---- L3: Visual Judge ----
        if (layers.includes('L3') && !screenShortCircuited) {
          const rubricKey = screen.rubricType || screen.rubric;
          const rubric = config.rubrics?.[rubricKey];
          if (rubric) {
            const designTokensPath = config.designTokens?.source
              ? path.resolve(projectRoot, config.designTokens.source)
              : path.join(uxqatDir, 'config', 'design-tokens.json');

            const l3Opts: L3Options = {
              rubric,
              designTokensPath,
              projectType: config.projectType || 'web-app',
              platform: config.platform || 'web',
              targetAudience: config.targetAudience,
              goldenSamplePath: screen.goldenSamplePath
                ? path.resolve(projectRoot, screen.goldenSamplePath)
                : undefined,
              antiPatternsPath: screen.antiPatternsPath
                ? path.resolve(projectRoot, screen.antiPatternsPath)
                : undefined,
              model: options.l3Model || 'sonnet',
            };

            const l3 = runL3(cp, l3Opts);
            l3Results.push(l3);
            screenFindingsAll.push(...l3.findings);
            totalL3Cost += l3.cost;
          } else {
            log('warn', 'Runner', `No rubric found for type "${rubricKey}" — skipping L3 for ${screen.name}`);
          }
        }

        // ---- L4: Compliance ----
        if (layers.includes('L4') && !screenShortCircuited) {
          const designTokensPath = config.designTokens?.source
            ? path.resolve(projectRoot, config.designTokens.source)
            : undefined;

          const l4 = runL4(session, cp, {
            baseUrl: config.baseUrl,
            screenPath: screen.path,
            thresholds: screen.l4Thresholds || undefined,
            designTokensPath,
            skipLighthouse: skipLighthouse || cp.breakpoint < 1024,
          });
          l4Results.push(l4);
          screenFindingsAll.push(...l4.findings);

          if (!l4.passed) {
            failedCaptures++;
          } else {
            passedCaptures++;
          }
        } else if (!screenShortCircuited) {
          passedCaptures++;
        }
      }

      // Add capture errors as findings
      for (const err of captureResult.errors) {
        screenFindingsAll.push({
          screen: screen.name,
          layer: 'L1',
          category: 'RENDER',
          severity: 'P1',
          shortCircuited: false,
          description: err,
        });
      }

      allFindings.push(...screenFindingsAll);

      screenResults.push({
        screen: screen.name,
        l1Results,
        l2Results,
        l3Results,
        l4Results,
        findings: screenFindingsAll,
        shortCircuited: screenShortCircuited,
        shortCircuitReason,
      });
    }
  } finally {
    closeSession(session);
  }

  // ---- Build Summary ----
  const p0Count = allFindings.filter(f => f.severity === 'P0').length;
  const p1Count = allFindings.filter(f => f.severity === 'P1').length;

  const summary: RunSummary = {
    runId,
    timestamp: new Date().toISOString(),
    baseUrl: config.baseUrl,
    layers,
    trigger,
    total: totalCaptures,
    passed: passedCaptures,
    failed: failedCaptures,
    skipped: skippedCaptures,
    shortCircuited: shortCircuitedCount,
    averageScore: computeAverageL3Score(screenResults),
    passRate: totalCaptures > 0 ? Math.round((passedCaptures / totalCaptures) * 100) : 0,
    estimatedCost: totalL3Cost,
    findings: allFindings,
    baselineUpdates: [],
    newPatterns: [],
  };

  // Save summary
  const summaryPath = path.join(uxqatDir, 'results', runId, 'summary.json');
  writeJsonFile(summaryPath, summary);

  // Generate human-readable report
  const reportPath = path.join(uxqatDir, 'results', runId, 'report.md');
  generateReport(summary, screenResults, reportPath);

  // Also save as latest
  const latestSummaryPath = path.join(uxqatDir, 'reports', 'latest-summary.json');
  writeJsonFile(latestSummaryPath, summary);

  // ---- Final Log ----
  log('info', 'Runner', '\n=== UX-QAT Run Complete ===');
  log('info', 'Runner', `Total: ${totalCaptures} | Passed: ${passedCaptures} | Failed: ${failedCaptures} | Skipped: ${skippedCaptures}`);
  log('info', 'Runner', `Findings: ${allFindings.length} (P0: ${p0Count}, P1: ${p1Count})`);
  if (totalL3Cost > 0) {
    log('info', 'Runner', `L3 Cost: ~$${totalL3Cost.toFixed(2)} | Avg Score: ${summary.averageScore}`);
  }
  log('info', 'Runner', `Report: ${reportPath}`);

  if (p0Count > 0) {
    logFail('Runner', `${p0Count} P0 findings — BLOCKING`);
  } else if (p1Count > 0) {
    logPass('Runner', `No P0 findings. ${p1Count} P1 findings — WARNING`);
  } else {
    logPass('Runner', 'All checks passed');
  }

  return summary;
}

// ============================================================
// Helpers
// ============================================================

function resolveInteractions(screen: ScreenConfig, uxqatDir?: string): L2Interaction[] {
  // Use interactions from screen config first
  if (screen.interactions && screen.interactions.length > 0) {
    return screen.interactions;
  }

  // Try to load from scenario file using tsx
  if (uxqatDir) {
    const scenarioPath = path.join(uxqatDir, 'scenarios', screen.name, 'interactions.ts');
    try {
      const fs = require('fs');
      if (!fs.existsSync(scenarioPath)) {
        log('debug', 'Runner', `No scenario file at ${scenarioPath}`);
        return [];
      }
      // Use npx tsx to evaluate the interactions file and output JSON
      const { execSync } = require('child_process');
      const script = `import { interactions } from '${scenarioPath}'; console.log(JSON.stringify(interactions));`;
      const result = execSync(`npx tsx -e "${script.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
        timeout: 10_000,
        cwd: uxqatDir,
      });
      const parsed = JSON.parse(result.trim());
      if (Array.isArray(parsed)) {
        log('info', 'Runner', `Loaded ${parsed.length} interactions from ${scenarioPath}`);
        return parsed as L2Interaction[];
      }
    } catch (err) {
      log('warn', 'Runner', `Failed to load interactions for ${screen.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return [];
}

function computeAverageL3Score(screenResults: ScreenResult[]): number {
  const l3Scores: number[] = [];
  for (const sr of screenResults) {
    for (const l3 of sr.l3Results) {
      if (l3.judgeResult) {
        l3Scores.push(l3.judgeResult.finalScore);
      }
    }
  }
  if (l3Scores.length === 0) return 0;
  const sum = l3Scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / l3Scores.length) * 100) / 100;
}
