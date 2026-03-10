/**
 * QAT Cost Intelligence — ROI por cenario e otimizacao de custos
 *
 * Copie para `tests/qat/helpers/cost-intelligence.ts` no seu projeto.
 * Analisa custo/beneficio de cada cenario, sugere desativacao de cenarios
 * sem valor, e otimiza frequencia de execucao.
 *
 * Uso:
 *   import { analyzeCostROI, suggestOptimizations } from './cost-intelligence';
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ScenarioCostProfile {
  scenarioId: string;
  /** Total cost across all runs */
  totalCost: number;
  /** Number of runs */
  totalRuns: number;
  /** Average cost per run */
  avgCostPerRun: number;
  /** Number of times this scenario detected a real issue */
  detectionsCount: number;
  /** Cost per detection (lower = better ROI) */
  costPerDetection: number;
  /** Number of consecutive passes */
  consecutivePasses: number;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Was short-circuited (L1/L2 saved Judge cost) */
  shortCircuitCount: number;
  /** Estimated savings from short-circuit */
  shortCircuitSavings: number;
  /** ROI score: detections / cost (higher = better) */
  roiScore: number;
  /** Category for optimization */
  category: 'high-value' | 'moderate' | 'low-value' | 'always-passes' | 'always-fails' | 'too-expensive';
}

export interface CostOptimization {
  scenarioId: string;
  action: 'keep' | 'reduce-frequency' | 'disable' | 'simplify-rubric' | 'investigate';
  reason: string;
  estimatedSavings: number;
  currentFrequency: string;
  suggestedFrequency?: string;
}

export interface CostReport {
  timestamp: string;
  totalCost: number;
  totalRuns: number;
  avgCostPerRun: number;
  totalDetections: number;
  overallCostPerDetection: number;
  shortCircuitTotalSavings: number;
  profiles: ScenarioCostProfile[];
  optimizations: CostOptimization[];
  projectedMonthlyCost: number;
  projectedSavingsIfOptimized: number;
}

const AVG_JUDGE_COST = 0.03; // ~$0.03 per Judge call with Sonnet

/**
 * Analisa ROI de todos os cenarios baseado em historico de runs.
 */
export function analyzeCostROI(
  resultsDir: string,
  knowledgePath: string
): CostReport {
  const runDirs = getRunDirs(resultsDir);
  const scenarioData = new Map<string, {
    costs: number[];
    passed: boolean[];
    shortCircuited: number;
    detections: number;
  }>();

  // Collect data from all runs
  for (const runDir of runDirs) {
    const summaryPath = path.join(runDir, 'summary.json');
    if (!fs.existsSync(summaryPath)) continue;

    try {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      const evaluations = summary.evaluations ?? [];

      for (const eval_ of evaluations) {
        const data = scenarioData.get(eval_.scenario) ?? {
          costs: [],
          passed: [],
          shortCircuited: 0,
          detections: 0,
        };

        data.costs.push(eval_.costEstimateUsd ?? AVG_JUDGE_COST);
        data.passed.push(eval_.pass);
        if (!eval_.pass && eval_.overallScore > 0) {
          data.detections++;
        }

        scenarioData.set(eval_.scenario, data);
      }

      // Count short-circuits from diagnostics
      const diagPath = path.join(runDir, 'diagnostics.json');
      if (fs.existsSync(diagPath)) {
        const diag = JSON.parse(fs.readFileSync(diagPath, 'utf-8'));
        for (const d of diag.diagnostics ?? []) {
          if (d.category === 'INFRA' || d.category === 'FEATURE') {
            const data = scenarioData.get(d.scenarioId);
            if (data) data.shortCircuited++;
          }
        }
      }
    } catch { /* skip malformed */ }
  }

  // Build profiles
  const profiles: ScenarioCostProfile[] = [];
  let totalCost = 0;
  let totalDetections = 0;
  let totalShortCircuitSavings = 0;

  for (const [scenarioId, data] of scenarioData) {
    const totalScenarioCost = data.costs.reduce((a, b) => a + b, 0);
    const avgCost = data.costs.length > 0 ? totalScenarioCost / data.costs.length : 0;
    const costPerDetection = data.detections > 0 ? totalScenarioCost / data.detections : Infinity;
    const shortCircuitSavings = data.shortCircuited * AVG_JUDGE_COST;

    // Count consecutive passes/failures from end
    let consecutivePasses = 0;
    let consecutiveFailures = 0;
    for (let i = data.passed.length - 1; i >= 0; i--) {
      if (data.passed[i]) consecutivePasses++;
      else break;
    }
    for (let i = data.passed.length - 1; i >= 0; i--) {
      if (!data.passed[i]) consecutiveFailures++;
      else break;
    }

    const roiScore = totalScenarioCost > 0 ? data.detections / totalScenarioCost : 0;

    // Categorize
    let category: ScenarioCostProfile['category'];
    if (consecutivePasses >= 10) category = 'always-passes';
    else if (consecutiveFailures >= 5 && data.detections === data.passed.filter((p) => !p).length) category = 'always-fails';
    else if (avgCost > 0.10) category = 'too-expensive';
    else if (roiScore > 10) category = 'high-value';
    else if (roiScore > 3) category = 'moderate';
    else category = 'low-value';

    const profile: ScenarioCostProfile = {
      scenarioId,
      totalCost: Number(totalScenarioCost.toFixed(4)),
      totalRuns: data.costs.length,
      avgCostPerRun: Number(avgCost.toFixed(4)),
      detectionsCount: data.detections,
      costPerDetection: costPerDetection === Infinity ? -1 : Number(costPerDetection.toFixed(4)),
      consecutivePasses,
      consecutiveFailures,
      shortCircuitCount: data.shortCircuited,
      shortCircuitSavings: Number(shortCircuitSavings.toFixed(4)),
      roiScore: Number(roiScore.toFixed(2)),
      category,
    };

    profiles.push(profile);
    totalCost += totalScenarioCost;
    totalDetections += data.detections;
    totalShortCircuitSavings += shortCircuitSavings;
  }

  // Sort by ROI (lowest first — candidates for optimization)
  profiles.sort((a, b) => a.roiScore - b.roiScore);

  // Generate optimizations
  const optimizations = suggestOptimizations(profiles);

  // Project monthly cost (assume weekly runs)
  const avgRunCost = runDirs.length > 0 ? totalCost / runDirs.length : 0;
  const projectedMonthlyCost = avgRunCost * 4; // 4 runs/month
  const projectedSavings = optimizations.reduce((sum, o) => sum + o.estimatedSavings, 0) * 4;

  return {
    timestamp: new Date().toISOString(),
    totalCost: Number(totalCost.toFixed(4)),
    totalRuns: runDirs.length,
    avgCostPerRun: runDirs.length > 0 ? Number((totalCost / runDirs.length).toFixed(4)) : 0,
    totalDetections,
    overallCostPerDetection: totalDetections > 0 ? Number((totalCost / totalDetections).toFixed(4)) : -1,
    shortCircuitTotalSavings: Number(totalShortCircuitSavings.toFixed(4)),
    profiles,
    optimizations,
    projectedMonthlyCost: Number(projectedMonthlyCost.toFixed(2)),
    projectedSavingsIfOptimized: Number(projectedSavings.toFixed(2)),
  };
}

/**
 * Sugere otimizacoes baseadas nos profiles.
 */
export function suggestOptimizations(profiles: ScenarioCostProfile[]): CostOptimization[] {
  const optimizations: CostOptimization[] = [];

  for (const p of profiles) {
    switch (p.category) {
      case 'always-passes':
        optimizations.push({
          scenarioId: p.scenarioId,
          action: 'reduce-frequency',
          reason: `${p.consecutivePasses} passes consecutivos. Cenario estavel — reduzir frequencia.`,
          estimatedSavings: p.avgCostPerRun * 0.75, // 75% savings by running monthly instead of weekly
          currentFrequency: 'weekly',
          suggestedFrequency: 'monthly',
        });
        break;

      case 'always-fails':
        optimizations.push({
          scenarioId: p.scenarioId,
          action: 'disable',
          reason: `${p.consecutiveFailures} falhas consecutivas. Feature nao implementada ou permanentemente quebrada.`,
          estimatedSavings: p.avgCostPerRun,
          currentFrequency: 'weekly',
          suggestedFrequency: 'disabled',
        });
        break;

      case 'too-expensive':
        optimizations.push({
          scenarioId: p.scenarioId,
          action: 'simplify-rubric',
          reason: `Custo medio $${p.avgCostPerRun.toFixed(3)}/run acima do limite ($0.10). Simplificar rubrica ou reduzir output avaliado.`,
          estimatedSavings: p.avgCostPerRun * 0.5,
          currentFrequency: 'weekly',
        });
        break;

      case 'low-value':
        if (p.totalRuns >= 5 && p.detectionsCount === 0) {
          optimizations.push({
            scenarioId: p.scenarioId,
            action: 'investigate',
            reason: `${p.totalRuns} runs, 0 deteccoes. Cenario pode nao estar testando nada util ou threshold muito baixo.`,
            estimatedSavings: 0,
            currentFrequency: 'weekly',
          });
        }
        break;

      case 'high-value':
      case 'moderate':
        optimizations.push({
          scenarioId: p.scenarioId,
          action: 'keep',
          reason: `ROI score ${p.roiScore} — cenario detecta problemas reais. Manter.`,
          estimatedSavings: 0,
          currentFrequency: 'weekly',
        });
        break;
    }
  }

  return optimizations;
}

/**
 * Salva cost report como JSON e Markdown.
 */
export function saveCostReport(report: CostReport, outputDir: string): void {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // JSON
  fs.writeFileSync(
    path.join(outputDir, 'cost-intelligence.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );

  // Markdown
  let md = `# QAT Cost Intelligence Report\n\n`;
  md += `**Date**: ${report.timestamp.split('T')[0]}\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Total Runs | ${report.totalRuns} |\n`;
  md += `| Total Cost | $${report.totalCost.toFixed(2)} |\n`;
  md += `| Avg Cost/Run | $${report.avgCostPerRun.toFixed(3)} |\n`;
  md += `| Total Detections | ${report.totalDetections} |\n`;
  md += `| Cost/Detection | $${report.overallCostPerDetection > 0 ? report.overallCostPerDetection.toFixed(3) : 'N/A'} |\n`;
  md += `| Short-circuit Savings | $${report.shortCircuitTotalSavings.toFixed(2)} |\n`;
  md += `| Projected Monthly | $${report.projectedMonthlyCost.toFixed(2)} |\n`;
  md += `| Projected Savings | $${report.projectedSavingsIfOptimized.toFixed(2)}/month |\n\n`;

  md += `## Scenario Profiles\n\n`;
  md += `| Scenario | Runs | Cost | Detections | ROI | Category |\n`;
  md += `|----------|------|------|------------|-----|----------|\n`;
  for (const p of report.profiles) {
    md += `| ${p.scenarioId} | ${p.totalRuns} | $${p.totalCost.toFixed(3)} | ${p.detectionsCount} | ${p.roiScore} | ${p.category} |\n`;
  }

  md += `\n## Optimizations\n\n`;
  for (const o of report.optimizations) {
    const icon = o.action === 'keep' ? 'OK' : o.action === 'disable' ? 'DISABLE' : o.action.toUpperCase();
    md += `- **[${icon}] ${o.scenarioId}**: ${o.reason}`;
    if (o.estimatedSavings > 0) md += ` (saves ~$${o.estimatedSavings.toFixed(3)}/run)`;
    if (o.suggestedFrequency) md += ` → ${o.suggestedFrequency}`;
    md += `\n`;
  }

  fs.writeFileSync(path.join(outputDir, 'cost-intelligence.md'), md, 'utf-8');
}

// --- Utilities ---

function getRunDirs(resultsDir: string): string[] {
  if (!fs.existsSync(resultsDir)) return [];
  return fs.readdirSync(resultsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== '.gitkeep')
    .map((e) => path.join(resultsDir, e.name))
    .sort();
}
