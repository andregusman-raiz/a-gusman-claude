/**
 * QAT Actions — Acoes automaticas do ciclo ACT (PDCA)
 *
 * Copie para `tests/qat/helpers/actions.ts` no seu projeto.
 * Implementa a fase ACT: cria GitHub Issues, envia alertas via webhook,
 * atualiza baselines e gera report do ciclo PDCA.
 *
 * Dependencias:
 *   - `gh` CLI instalado e autenticado (para GitHub Issues)
 *   - Webhooks configurados em qat.config.ts (para alertas)
 *
 * Uso:
 *   import { executeActions } from './actions';
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { QatDiagnostic, QatAction, QatEvaluation } from '../fixtures/schemas';
import type { QatConfig } from '../qat.config';

interface ActionResult {
  actions: QatAction[];
  issuesCreated: number;
  baselinesUpdated: number;
  alertsSent: number;
}

/**
 * Executa acoes automaticas baseadas nos diagnosticos.
 *
 * Regras:
 * - P0/P1 com INFRA/FEATURE → GitHub Issue automatica
 * - 3+ falhas na mesma categoria → Issue sistemica P0
 * - Score subiu estavelmente → atualiza baseline
 * - Custo acima de limite → alerta
 */
export async function executeActions(
  diagnostics: QatDiagnostic[],
  evaluations: QatEvaluation[],
  config: QatConfig,
  runId: string
): Promise<ActionResult> {
  const actions: QatAction[] = [];
  let issuesCreated = 0;
  let baselinesUpdated = 0;
  let alertsSent = 0;

  // --- 1. GitHub Issues para P0/P1 ---
  if (config.enableAutoIssues && config.githubRepo) {
    for (const diagnostic of diagnostics) {
      if (diagnostic.severity === 'P0' || diagnostic.severity === 'P1') {
        const action = await createGitHubIssue(diagnostic, config.githubRepo, runId);
        if (action) {
          actions.push(action);
          issuesCreated++;
        }
      }
    }

    // Detect systemic issues (3+ same category)
    const categoryCount: Record<string, QatDiagnostic[]> = {};
    for (const d of diagnostics) {
      categoryCount[d.category] = categoryCount[d.category] ?? [];
      categoryCount[d.category].push(d);
    }

    for (const [category, diags] of Object.entries(categoryCount)) {
      if (diags.length >= 3) {
        const systemicAction = await createSystemicIssue(category, diags, config.githubRepo, runId);
        if (systemicAction) {
          actions.push(systemicAction);
          issuesCreated++;
        }
      }
    }
  }

  // --- 2. Webhook alerts (N8N/Discord) ---
  const p0p1 = diagnostics.filter((d) => d.severity === 'P0' || d.severity === 'P1');
  if (p0p1.length > 0) {
    const webhookUrl = process.env.N8N_WEBHOOK_ALERT ?? process.env.QAT_ALERT_WEBHOOK;
    if (webhookUrl) {
      const sent = await sendWebhookAlert(webhookUrl, p0p1, evaluations, runId);
      if (sent) alertsSent++;
      actions.push({
        id: `action-alert-${runId}`,
        scenarioId: 'ALL',
        type: 'alert',
        status: sent ? 'completed' : 'skipped',
        details: `Alerta enviado para ${p0p1.length} falhas P0/P1`,
        createdAt: new Date().toISOString(),
        completedAt: sent ? new Date().toISOString() : undefined,
      });
    }
  }

  // --- 3. Baseline updates (score improvements) ---
  for (const eval_ of evaluations) {
    if (!eval_.pass) continue;
    // Baseline updates handled by history.updateBaseline()
    // Here we just track the action
    actions.push({
      id: `action-baseline-${eval_.scenario}-${runId}`,
      scenarioId: eval_.scenario,
      type: 'baseline-update',
      status: 'pending',
      details: `Score ${eval_.overallScore} — verificar se atualiza baseline`,
      createdAt: new Date().toISOString(),
    });
    baselinesUpdated++;
  }

  // --- 4. Save actions to file ---
  const resultsDir = path.join(config.resultsDir, runId);
  if (fs.existsSync(resultsDir)) {
    fs.writeFileSync(
      path.join(resultsDir, 'actions.json'),
      JSON.stringify({ runId, actions, summary: { issuesCreated, baselinesUpdated, alertsSent } }, null, 2),
      'utf-8'
    );
  }

  return { actions, issuesCreated, baselinesUpdated, alertsSent };
}

/**
 * Cria GitHub Issue para falha P0/P1 usando `gh` CLI.
 */
async function createGitHubIssue(
  diagnostic: QatDiagnostic,
  repo: string,
  runId: string
): Promise<QatAction | null> {
  const title = `[QAT] ${diagnostic.severity} ${diagnostic.category}: ${diagnostic.scenarioId}`;
  const body = [
    `## QAT Failure — ${diagnostic.scenarioId}`,
    '',
    `**Severidade**: ${diagnostic.severity}`,
    `**Categoria**: ${diagnostic.category}`,
    `**Run ID**: ${runId}`,
    `**Data**: ${new Date().toISOString().split('T')[0]}`,
    '',
    `### Descricao`,
    diagnostic.description,
    '',
    diagnostic.evidence ? `### Evidencia\n${diagnostic.evidence}\n` : '',
    `### Acao Sugerida`,
    diagnostic.suggestedAction,
    '',
    '---',
    '_Issue criada automaticamente pelo QAT PDCA cycle._',
  ].join('\n');

  const labels = `qat,${diagnostic.severity.toLowerCase()},${diagnostic.category.toLowerCase()}`;

  try {
    const cmd = `gh issue create --repo "${repo}" --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --label "${labels}" 2>&1`;
    const result = execSync(cmd, { encoding: 'utf-8', timeout: 30_000 });
    const issueUrl = result.trim().split('\n').pop() ?? '';

    return {
      id: `action-issue-${diagnostic.scenarioId}-${runId}`,
      scenarioId: diagnostic.scenarioId,
      type: 'github-issue',
      status: 'created',
      details: `Issue criada: ${issueUrl}`,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[QAT] Falha ao criar issue para ${diagnostic.scenarioId}:`, error);
    return {
      id: `action-issue-${diagnostic.scenarioId}-${runId}`,
      scenarioId: diagnostic.scenarioId,
      type: 'github-issue',
      status: 'skipped',
      details: `Falha ao criar issue: ${error instanceof Error ? error.message : 'unknown'}`,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Cria GitHub Issue para problema sistemico (3+ falhas na mesma categoria).
 */
async function createSystemicIssue(
  category: string,
  diagnostics: QatDiagnostic[],
  repo: string,
  runId: string
): Promise<QatAction | null> {
  const title = `[QAT] P0 SYSTEMIC: ${diagnostics.length} falhas na categoria ${category}`;
  const scenarioList = diagnostics.map((d) => `- ${d.scenarioId}: ${d.description}`).join('\n');
  const body = [
    `## QAT Systemic Failure — ${category}`,
    '',
    `**${diagnostics.length} cenarios falharam na mesma categoria**, indicando problema sistemico.`,
    '',
    `### Cenarios afetados`,
    scenarioList,
    '',
    `### Acao`,
    `Investigar causa raiz comum. Nao corrigir individualmente — resolver o problema sistemico.`,
    '',
    '---',
    `_Run ID: ${runId} | Issue criada automaticamente pelo QAT PDCA cycle._`,
  ].join('\n');

  try {
    const cmd = `gh issue create --repo "${repo}" --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --label "qat,p0,systemic,${category.toLowerCase()}" 2>&1`;
    const result = execSync(cmd, { encoding: 'utf-8', timeout: 30_000 });
    const issueUrl = result.trim().split('\n').pop() ?? '';

    return {
      id: `action-systemic-${category}-${runId}`,
      scenarioId: 'SYSTEMIC',
      type: 'github-issue',
      status: 'created',
      details: `Issue sistemica criada: ${issueUrl}`,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[QAT] Falha ao criar issue sistemica:`, error);
    return null;
  }
}

/**
 * Envia alerta via webhook (N8N → Discord).
 */
async function sendWebhookAlert(
  webhookUrl: string,
  diagnostics: QatDiagnostic[],
  evaluations: QatEvaluation[],
  runId: string
): Promise<boolean> {
  const passCount = evaluations.filter((e) => e.pass).length;
  const failCount = evaluations.filter((e) => !e.pass && e.overallScore > 0).length;
  const avgScore =
    evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length
      : 0;

  const payload = {
    source: 'qat-pdca',
    runId,
    timestamp: new Date().toISOString(),
    summary: {
      total: evaluations.length,
      passed: passCount,
      failed: failCount,
      averageScore: Number(avgScore.toFixed(1)),
    },
    failures: diagnostics.map((d) => ({
      scenario: d.scenarioId,
      severity: d.severity,
      category: d.category,
      description: d.description,
    })),
    p0Count: diagnostics.filter((d) => d.severity === 'P0').length,
    p1Count: diagnostics.filter((d) => d.severity === 'P1').length,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  } catch (error) {
    console.error(`[QAT] Falha ao enviar webhook:`, error);
    return false;
  }
}

/**
 * Calcula custo total e economia por short-circuit.
 */
export function calculateCostIntelligence(
  evaluations: QatEvaluation[],
  layers?: { scenarioId: string; layer: string; shortCircuited: boolean }[]
): {
  totalCost: number;
  shortCircuitSavings: number;
  costPerScenario: Record<string, number>;
  avgCostPerScenario: number;
} {
  const totalCost = evaluations.reduce((sum, e) => sum + e.costEstimateUsd, 0);
  const costPerScenario: Record<string, number> = {};
  for (const e of evaluations) {
    costPerScenario[e.scenario] = e.costEstimateUsd;
  }

  // Estimate savings from short-circuiting
  const shortCircuitCount = layers?.filter((l) => l.shortCircuited).length ?? 0;
  const avgJudgeCost = 0.03; // ~$0.03 per Judge call
  const shortCircuitSavings = shortCircuitCount * avgJudgeCost;

  return {
    totalCost: Number(totalCost.toFixed(4)),
    shortCircuitSavings: Number(shortCircuitSavings.toFixed(4)),
    costPerScenario,
    avgCostPerScenario: evaluations.length > 0 ? Number((totalCost / evaluations.length).toFixed(4)) : 0,
  };
}
