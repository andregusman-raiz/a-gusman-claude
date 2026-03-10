/**
 * QAT PDCA Engine — Orquestrador do ciclo Plan-Do-Check-Act
 *
 * Copie para `tests/qat/helpers/pdca.ts` no seu projeto.
 * Este e o motor principal que conecta todas as partes do QAT v2:
 * diagnostics, actions, baselines, failure patterns.
 *
 * Uso:
 *   import { runPDCACycle } from './pdca';
 *   const report = await runPDCACycle(evaluations, config, runId);
 *
 * Dependencias: diagnostics.ts, actions.ts, history.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import type { QatEvaluation, QatDiagnostic, QatAction } from '../fixtures/schemas';
import type { QatConfig } from '../qat.config';
import { generateDiagnostics, summarizeDiagnostics } from './diagnostics';
import { executeActions, calculateCostIntelligence } from './actions';
import { loadBaselines, updateBaseline, detectFlaky } from './history';
// Continuous Improvement modules (Sprint 5)
import { analyzeAllRubrics, generateRefinementLearning, saveRubricAnalysisReport } from './rubric-refinement';
import { analyzeCostROI, saveCostReport } from './cost-intelligence';
import { exportTrends, saveTrends } from './trends-exporter';

export interface PDCACycleReport {
  runId: string;
  cycleNumber: number;
  timestamp: string;
  phase: {
    plan: PlanPhase;
    do_: DoPhase;
    check: CheckPhase;
    act: ActPhase;
  };
  summary: {
    totalScenarios: number;
    passed: number;
    failed: number;
    skipped: number;
    averageScore: number;
    totalCost: number;
    shortCircuitSavings: number;
    issuesCreated: number;
    baselinesUpdated: number;
    alertsSent: number;
  };
}

interface PlanPhase {
  baselinesLoaded: number;
  failurePatternsLoaded: number;
  scenariosSelected: number;
  flakyDetected: string[];
}

interface DoPhase {
  scenariosExecuted: number;
  scenariosSkipped: number;
  judgeCallsMade: number;
  shortCircuited: number;
}

interface CheckPhase {
  diagnostics: QatDiagnostic[];
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  systemicCategories: string[];
  regressionsDetected: number;
  improvementsDetected: number;
}

interface ActPhase {
  actions: QatAction[];
  issuesCreated: number;
  baselinesUpdated: number;
  alertsSent: number;
}

/**
 * Executa o ciclo PDCA completo sobre os resultados de um run QAT.
 *
 * Fluxo:
 * 1. PLAN: Carrega knowledge base (baselines, failure patterns)
 * 2. DO: Recebe evaluations ja executadas (de Playwright)
 * 3. CHECK: Classifica falhas, compara baselines, detecta padroes
 * 4. ACT: Cria issues, envia alertas, atualiza baselines
 */
export async function runPDCACycle(
  evaluations: QatEvaluation[],
  config: QatConfig,
  runId: string
): Promise<PDCACycleReport> {
  const timestamp = new Date().toISOString();

  // --- PLAN ---
  const baselinePath = config.baselinePath ?? path.join(config.resultsDir, '..', 'knowledge', 'baselines.json');
  const failurePatternsPath = config.knowledgePath
    ? path.join(config.knowledgePath, 'failure-patterns.json')
    : path.join(config.resultsDir, '..', 'knowledge', 'failure-patterns.json');

  const baselines = loadBaselines(baselinePath);
  const flakyScenarios = detectFlaky(baselinePath);
  const cycleNumber = getCycleNumber(config.resultsDir);

  const plan: PlanPhase = {
    baselinesLoaded: baselines.size,
    failurePatternsLoaded: countFailurePatterns(failurePatternsPath),
    scenariosSelected: evaluations.length,
    flakyDetected: flakyScenarios,
  };

  // --- DO (already executed by Playwright, we just count) ---
  const executed = evaluations.filter((e) => e.overallScore > 0);
  const skipped = evaluations.filter((e) => e.overallScore === 0);
  const judgeCallsMade = evaluations.filter((e) => e.costEstimateUsd > 0).length;

  const do_: DoPhase = {
    scenariosExecuted: executed.length,
    scenariosSkipped: skipped.length,
    judgeCallsMade,
    shortCircuited: evaluations.length - judgeCallsMade - skipped.length,
  };

  // --- CHECK ---
  const diagnostics = generateDiagnostics(evaluations, baselines, failurePatternsPath, config.passThreshold);
  const diagnosticSummary = summarizeDiagnostics(diagnostics);

  // Count regressions and improvements vs baselines
  let regressionsDetected = 0;
  let improvementsDetected = 0;

  for (const eval_ of executed) {
    const baseline = baselines.get(eval_.scenario);
    if (!baseline) continue;
    const delta = eval_.overallScore - baseline.baselineScore;
    if (delta < -(baseline.tolerance ?? 1.0)) regressionsDetected++;
    if (delta > 1.0) improvementsDetected++;
  }

  const check: CheckPhase = {
    diagnostics,
    byCategory: diagnosticSummary.byCategory,
    bySeverity: diagnosticSummary.bySeverity,
    systemicCategories: diagnosticSummary.systemicCategories,
    regressionsDetected,
    improvementsDetected,
  };

  // --- ACT ---
  const actionResult = await executeActions(diagnostics, evaluations, config, runId);

  // Update baselines for passing scenarios
  let actualBaselinesUpdated = 0;
  for (const eval_ of executed) {
    if (eval_.pass && eval_.overallScore >= config.passThreshold) {
      const updated = updateBaseline(baselinePath, eval_.scenario, eval_.overallScore, runId);
      if (updated) actualBaselinesUpdated++;
    }
  }

  const act: ActPhase = {
    actions: actionResult.actions,
    issuesCreated: actionResult.issuesCreated,
    baselinesUpdated: actualBaselinesUpdated,
    alertsSent: actionResult.alertsSent,
  };

  // --- Cost Intelligence ---
  const costInfo = calculateCostIntelligence(evaluations);

  // --- Assemble report ---
  const passed = evaluations.filter((e) => e.pass).length;
  const failed = evaluations.filter((e) => !e.pass && e.overallScore > 0).length;
  const avgScore =
    executed.length > 0
      ? Number((executed.reduce((sum, e) => sum + e.overallScore, 0) / executed.length).toFixed(1))
      : 0;

  const report: PDCACycleReport = {
    runId,
    cycleNumber,
    timestamp,
    phase: { plan, do_, check, act },
    summary: {
      totalScenarios: evaluations.length,
      passed,
      failed,
      skipped: skipped.length,
      averageScore: avgScore,
      totalCost: costInfo.totalCost,
      shortCircuitSavings: costInfo.shortCircuitSavings,
      issuesCreated: actionResult.issuesCreated,
      baselinesUpdated: actualBaselinesUpdated,
      alertsSent: actionResult.alertsSent,
    },
  };

  // Save report
  saveReport(report, config.resultsDir, runId);

  // --- Continuous Improvement (Sprint 5) ---
  const runDir = path.join(config.resultsDir, runId);

  // Rubric Refinement: analyze consistency across runs
  try {
    const scenarioEvals = new Map<string, QatEvaluation[]>();
    for (const e of executed) {
      const existing = scenarioEvals.get(e.scenario) ?? [];
      existing.push(e);
      scenarioEvals.set(e.scenario, existing);
    }
    const { analyses, refinements } = analyzeAllRubrics(scenarioEvals, baselines);
    if (refinements.length > 0) {
      saveRubricAnalysisReport(analyses, refinements, path.join(runDir, 'rubric-analysis.json'));
      // Append P1 refinements to learnings
      const learningsPath = path.join(path.dirname(baselinePath), 'learnings.md');
      const p1Refinements = refinements.filter((r) => r.priority === 'P1');
      if (p1Refinements.length > 0 && fs.existsSync(learningsPath)) {
        const entries = p1Refinements.map((r) => generateRefinementLearning(r, cycleNumber));
        fs.appendFileSync(learningsPath, '\n' + entries.join('\n'), 'utf-8');
      }
    }
  } catch { /* non-critical — don't fail PDCA cycle */ }

  // Cost Intelligence: ROI analysis
  try {
    const costReport = analyzeCostROI(config.resultsDir, baselinePath);
    saveCostReport(costReport, runDir);
  } catch { /* non-critical */ }

  // Trends Export: time series + Prometheus + Grafana
  try {
    const trends = exportTrends(config.resultsDir);
    saveTrends(trends, runDir);
  } catch { /* non-critical */ }

  return report;
}

/**
 * Salva report do ciclo PDCA no diretorio de resultados.
 */
function saveReport(report: PDCACycleReport, resultsDir: string, runId: string): void {
  const runDir = path.join(resultsDir, runId);
  if (!fs.existsSync(runDir)) {
    fs.mkdirSync(runDir, { recursive: true });
  }

  // JSON completo
  fs.writeFileSync(
    path.join(runDir, 'pdca-report.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );

  // Markdown summary (human-readable)
  const md = generateMarkdownReport(report);
  fs.writeFileSync(path.join(runDir, 'pdca-report.md'), md, 'utf-8');

  // Diagnostics separado (para ferramentas que consomem JSON)
  fs.writeFileSync(
    path.join(runDir, 'diagnostics.json'),
    JSON.stringify({ runId, diagnostics: report.phase.check.diagnostics }, null, 2),
    'utf-8'
  );
}

/**
 * Gera report Markdown legivel do ciclo PDCA.
 */
function generateMarkdownReport(report: PDCACycleReport): string {
  const { summary, phase } = report;
  const passRate = summary.totalScenarios > 0
    ? ((summary.passed / summary.totalScenarios) * 100).toFixed(0)
    : '0';

  let md = `# QAT PDCA Report — Cycle #${report.cycleNumber}\n\n`;
  md += `**Run**: ${report.runId} | **Date**: ${report.timestamp.split('T')[0]}\n\n`;

  // Summary table
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Scenarios | ${summary.totalScenarios} |\n`;
  md += `| Passed | ${summary.passed} (${passRate}%) |\n`;
  md += `| Failed | ${summary.failed} |\n`;
  md += `| Skipped | ${summary.skipped} |\n`;
  md += `| Average Score | ${summary.averageScore}/10 |\n`;
  md += `| Total Cost | $${summary.totalCost.toFixed(2)} |\n`;
  md += `| Short-circuit Savings | $${summary.shortCircuitSavings.toFixed(2)} |\n`;
  md += `| Issues Created | ${summary.issuesCreated} |\n`;
  md += `| Baselines Updated | ${summary.baselinesUpdated} |\n`;
  md += `| Alerts Sent | ${summary.alertsSent} |\n\n`;

  // PLAN
  md += `## PLAN Phase\n\n`;
  md += `- Baselines loaded: ${phase.plan.baselinesLoaded}\n`;
  md += `- Failure patterns loaded: ${phase.plan.failurePatternsLoaded}\n`;
  md += `- Flaky scenarios: ${phase.plan.flakyDetected.length > 0 ? phase.plan.flakyDetected.join(', ') : 'none'}\n\n`;

  // CHECK
  md += `## CHECK Phase\n\n`;
  if (phase.check.diagnostics.length === 0) {
    md += `All scenarios passed. No diagnostics needed.\n\n`;
  } else {
    md += `### Failures by Category\n\n`;
    for (const [cat, count] of Object.entries(phase.check.byCategory)) {
      md += `- **${cat}**: ${count}\n`;
    }
    md += `\n### Failures by Severity\n\n`;
    for (const [sev, count] of Object.entries(phase.check.bySeverity)) {
      md += `- **${sev}**: ${count}\n`;
    }
    if (phase.check.systemicCategories.length > 0) {
      md += `\n**SYSTEMIC ISSUES**: ${phase.check.systemicCategories.join(', ')}\n`;
    }
    md += `\n### Diagnostics Detail\n\n`;
    for (const d of phase.check.diagnostics) {
      md += `- **${d.scenarioId}** [${d.severity}/${d.category}]: ${d.description}\n`;
      md += `  - Action: ${d.suggestedAction}\n`;
    }
    md += `\n`;
  }

  // ACT
  md += `## ACT Phase\n\n`;
  md += `- Regressions detected: ${phase.check.regressionsDetected}\n`;
  md += `- Improvements detected: ${phase.check.improvementsDetected}\n`;
  md += `- GitHub Issues created: ${phase.act.issuesCreated}\n`;
  md += `- Baselines updated: ${phase.act.baselinesUpdated}\n`;
  md += `- Alerts sent: ${phase.act.alertsSent}\n\n`;

  if (phase.act.actions.length > 0) {
    md += `### Actions Taken\n\n`;
    for (const a of phase.act.actions) {
      md += `- [${a.status}] ${a.type}: ${a.details}\n`;
    }
  }

  return md;
}

/**
 * Conta failure patterns no arquivo JSON.
 */
function countFailurePatterns(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return (raw.patterns ?? []).length;
  } catch {
    return 0;
  }
}

/**
 * Determina o numero do ciclo PDCA baseado em reports anteriores.
 */
function getCycleNumber(resultsDir: string): number {
  if (!fs.existsSync(resultsDir)) return 1;

  let maxCycle = 0;
  const entries = fs.readdirSync(resultsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const reportPath = path.join(resultsDir, entry.name, 'pdca-report.json');
    if (fs.existsSync(reportPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        if (raw.cycleNumber > maxCycle) maxCycle = raw.cycleNumber;
      } catch {
        // Skip invalid reports
      }
    }
  }

  return maxCycle + 1;
}
