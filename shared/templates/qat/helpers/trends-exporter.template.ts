/**
 * QAT Trends Exporter — Export metricas para dashboards (Grafana, etc.)
 *
 * Copie para `tests/qat/helpers/trends-exporter.ts` no seu projeto.
 * Consolida historico de scores em time series, exporta em formatos
 * consumiveis por Grafana (JSON, Prometheus exposition), e gera
 * trends com deteccao de tendencia.
 *
 * Uso:
 *   import { exportTrends, generatePrometheusMetrics } from './trends-exporter';
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TrendDataPoint {
  timestamp: string;
  runId: string;
  scenarioId: string;
  score: number;
  passed: boolean;
  category?: string;
  costUsd: number;
}

export interface ScenarioTrend {
  scenarioId: string;
  dataPoints: TrendDataPoint[];
  currentScore: number;
  previousScore: number;
  delta: number;
  trend: 'improving' | 'degrading' | 'stable' | 'volatile';
  /** Moving average (last 5 runs) */
  movingAverage: number;
  /** Standard deviation of scores */
  stdDev: number;
}

export interface TrendsReport {
  timestamp: string;
  totalDataPoints: number;
  dateRange: { from: string; to: string };
  scenarios: ScenarioTrend[];
  aggregated: {
    avgScore: number;
    passRate: number;
    totalCost: number;
    scoreByDate: { date: string; avgScore: number; passRate: number; runCount: number }[];
  };
}

/**
 * Consolida todos os runs em time series por cenario.
 */
export function exportTrends(resultsDir: string): TrendsReport {
  const dataPoints: TrendDataPoint[] = [];
  const runDirs = getRunDirs(resultsDir);

  for (const runDir of runDirs) {
    const summaryPath = path.join(runDir, 'summary.json');
    if (!fs.existsSync(summaryPath)) continue;

    try {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      const runId = path.basename(runDir);
      const timestamp = summary.timestamp ?? runId;

      for (const eval_ of summary.evaluations ?? []) {
        dataPoints.push({
          timestamp,
          runId,
          scenarioId: eval_.scenario,
          score: eval_.overallScore,
          passed: eval_.pass,
          category: eval_.type,
          costUsd: eval_.costEstimateUsd ?? 0,
        });
      }
    } catch { /* skip */ }
  }

  // Group by scenario
  const scenarioMap = new Map<string, TrendDataPoint[]>();
  for (const dp of dataPoints) {
    const existing = scenarioMap.get(dp.scenarioId) ?? [];
    existing.push(dp);
    scenarioMap.set(dp.scenarioId, existing);
  }

  // Build trends per scenario
  const scenarios: ScenarioTrend[] = [];
  for (const [scenarioId, points] of scenarioMap) {
    const sorted = points.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const scores = sorted.map((p) => p.score);
    const current = scores[scores.length - 1] ?? 0;
    const previous = scores.length > 1 ? scores[scores.length - 2] : current;
    const delta = Number((current - previous).toFixed(1));

    // Moving average (last 5)
    const last5 = scores.slice(-5);
    const movingAvg = last5.length > 0 ? last5.reduce((a, b) => a + b, 0) / last5.length : 0;

    // Standard deviation
    const stdDev = calculateStdDev(scores);

    // Detect trend
    let trend: ScenarioTrend['trend'];
    if (stdDev > 2.0) {
      trend = 'volatile';
    } else if (scores.length >= 3) {
      const recent3 = scores.slice(-3);
      const allIncreasing = recent3.every((s, i) => i === 0 || s >= recent3[i - 1] - 0.5);
      const allDecreasing = recent3.every((s, i) => i === 0 || s <= recent3[i - 1] + 0.5);
      if (allIncreasing && delta > 0.5) trend = 'improving';
      else if (allDecreasing && delta < -0.5) trend = 'degrading';
      else trend = 'stable';
    } else {
      trend = 'stable';
    }

    scenarios.push({
      scenarioId,
      dataPoints: sorted,
      currentScore: current,
      previousScore: previous,
      delta,
      trend,
      movingAverage: Number(movingAvg.toFixed(1)),
      stdDev: Number(stdDev.toFixed(2)),
    });
  }

  // Aggregated stats by date
  const dateMap = new Map<string, { scores: number[]; passed: number; total: number }>();
  for (const dp of dataPoints) {
    const date = dp.timestamp.split('T')[0].substring(0, 10);
    const existing = dateMap.get(date) ?? { scores: [], passed: 0, total: 0 };
    existing.scores.push(dp.score);
    if (dp.passed) existing.passed++;
    existing.total++;
    dateMap.set(date, existing);
  }

  const scoreByDate = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      avgScore: Number((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)),
      passRate: Number(((data.passed / data.total) * 100).toFixed(0)),
      runCount: data.total,
    }));

  const allScores = dataPoints.map((dp) => dp.score).filter((s) => s > 0);
  const totalPassed = dataPoints.filter((dp) => dp.passed).length;

  const timestamps = dataPoints.map((dp) => dp.timestamp).sort();

  return {
    timestamp: new Date().toISOString(),
    totalDataPoints: dataPoints.length,
    dateRange: {
      from: timestamps[0] ?? '',
      to: timestamps[timestamps.length - 1] ?? '',
    },
    scenarios: scenarios.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId)),
    aggregated: {
      avgScore: allScores.length > 0 ? Number((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)) : 0,
      passRate: dataPoints.length > 0 ? Number(((totalPassed / dataPoints.length) * 100).toFixed(0)) : 0,
      totalCost: Number(dataPoints.reduce((sum, dp) => sum + dp.costUsd, 0).toFixed(4)),
      scoreByDate,
    },
  };
}

/**
 * Gera metricas no formato Prometheus exposition.
 * Pode ser consumido por Grafana via Prometheus pushgateway ou node-exporter textfile collector.
 */
export function generatePrometheusMetrics(trends: TrendsReport): string {
  const lines: string[] = [
    '# HELP qat_scenario_score Current QAT scenario score',
    '# TYPE qat_scenario_score gauge',
  ];

  for (const s of trends.scenarios) {
    lines.push(`qat_scenario_score{scenario="${s.scenarioId}",trend="${s.trend}"} ${s.currentScore}`);
  }

  lines.push('');
  lines.push('# HELP qat_scenario_moving_avg Moving average score (last 5 runs)');
  lines.push('# TYPE qat_scenario_moving_avg gauge');
  for (const s of trends.scenarios) {
    lines.push(`qat_scenario_moving_avg{scenario="${s.scenarioId}"} ${s.movingAverage}`);
  }

  lines.push('');
  lines.push('# HELP qat_pass_rate Overall QAT pass rate percentage');
  lines.push('# TYPE qat_pass_rate gauge');
  lines.push(`qat_pass_rate ${trends.aggregated.passRate}`);

  lines.push('');
  lines.push('# HELP qat_avg_score Overall average QAT score');
  lines.push('# TYPE qat_avg_score gauge');
  lines.push(`qat_avg_score ${trends.aggregated.avgScore}`);

  lines.push('');
  lines.push('# HELP qat_total_cost_usd Total QAT cost in USD');
  lines.push('# TYPE qat_total_cost_usd counter');
  lines.push(`qat_total_cost_usd ${trends.aggregated.totalCost}`);

  lines.push('');
  lines.push('# HELP qat_total_scenarios Total number of QAT scenarios tracked');
  lines.push('# TYPE qat_total_scenarios gauge');
  lines.push(`qat_total_scenarios ${trends.scenarios.length}`);

  lines.push('');
  lines.push('# HELP qat_degrading_scenarios Number of scenarios with degrading trend');
  lines.push('# TYPE qat_degrading_scenarios gauge');
  lines.push(`qat_degrading_scenarios ${trends.scenarios.filter((s) => s.trend === 'degrading').length}`);

  lines.push('');
  lines.push('# HELP qat_volatile_scenarios Number of scenarios with volatile scores');
  lines.push('# TYPE qat_volatile_scenarios gauge');
  lines.push(`qat_volatile_scenarios ${trends.scenarios.filter((s) => s.trend === 'volatile').length}`);

  return lines.join('\n') + '\n';
}

/**
 * Gera JSON para Grafana Infinity datasource (direct JSON).
 */
export function generateGrafanaJSON(trends: TrendsReport): {
  scoreTimeSeries: { time: string; scenario: string; score: number }[];
  scenarioSummary: { scenario: string; score: number; trend: string; movingAvg: number; stdDev: number }[];
  passRateTimeSeries: { date: string; passRate: number; avgScore: number }[];
} {
  // Score time series (all data points)
  const scoreTimeSeries = trends.scenarios.flatMap((s) =>
    s.dataPoints.map((dp) => ({
      time: dp.timestamp,
      scenario: dp.scenarioId,
      score: dp.score,
    }))
  );

  // Scenario summary table
  const scenarioSummary = trends.scenarios.map((s) => ({
    scenario: s.scenarioId,
    score: s.currentScore,
    trend: s.trend,
    movingAvg: s.movingAverage,
    stdDev: s.stdDev,
  }));

  // Pass rate over time
  const passRateTimeSeries = trends.aggregated.scoreByDate.map((d) => ({
    date: d.date,
    passRate: d.passRate,
    avgScore: d.avgScore,
  }));

  return { scoreTimeSeries, scenarioSummary, passRateTimeSeries };
}

/**
 * Salva trends em todos os formatos.
 */
export function saveTrends(trends: TrendsReport, outputDir: string): void {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Full trends JSON
  fs.writeFileSync(
    path.join(outputDir, 'trends.json'),
    JSON.stringify(trends, null, 2),
    'utf-8'
  );

  // Prometheus metrics
  fs.writeFileSync(
    path.join(outputDir, 'qat-metrics.prom'),
    generatePrometheusMetrics(trends),
    'utf-8'
  );

  // Grafana-friendly JSON
  fs.writeFileSync(
    path.join(outputDir, 'grafana-data.json'),
    JSON.stringify(generateGrafanaJSON(trends), null, 2),
    'utf-8'
  );

  // Markdown summary
  let md = `# QAT Trends Report\n\n`;
  md += `**Period**: ${trends.dateRange.from} to ${trends.dateRange.to}\n`;
  md += `**Data Points**: ${trends.totalDataPoints}\n\n`;

  md += `## Overview\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Avg Score | ${trends.aggregated.avgScore}/10 |\n`;
  md += `| Pass Rate | ${trends.aggregated.passRate}% |\n`;
  md += `| Total Cost | $${trends.aggregated.totalCost.toFixed(2)} |\n\n`;

  md += `## Scenario Trends\n\n`;
  md += `| Scenario | Score | Delta | MA(5) | Trend | StdDev |\n`;
  md += `|----------|-------|-------|-------|-------|--------|\n`;
  for (const s of trends.scenarios) {
    const icon = s.trend === 'improving' ? '+' : s.trend === 'degrading' ? '-' : s.trend === 'volatile' ? '~' : '=';
    md += `| ${s.scenarioId} | ${s.currentScore} | ${s.delta > 0 ? '+' : ''}${s.delta} | ${s.movingAverage} | ${icon} ${s.trend} | ${s.stdDev} |\n`;
  }

  fs.writeFileSync(path.join(outputDir, 'trends.md'), md, 'utf-8');
}

// --- Utilities ---

function getRunDirs(resultsDir: string): string[] {
  if (!fs.existsSync(resultsDir)) return [];
  return fs.readdirSync(resultsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== '.gitkeep')
    .map((e) => path.join(resultsDir, e.name))
    .sort();
}

function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sumSqDiff = values.reduce((sum, v) => sum + (v - mean) ** 2, 0);
  return Math.sqrt(sumSqDiff / (values.length - 1));
}
