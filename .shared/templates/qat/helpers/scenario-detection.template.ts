/**
 * QAT Scenario Detection — Auto-deteccao de cenarios necessarios
 *
 * Copie para `tests/qat/helpers/scenario-detection.ts` no seu projeto.
 * Analisa bugs reportados (Sentry, GitHub Issues) e verifica se cenario QAT
 * existe para a feature afetada. Sugere criacao via ag-41 se nao existir.
 *
 * Uso:
 *   import { analyzeBugForQAT, checkQATCoverage } from './scenario-detection';
 *
 * Pipeline: Sentry Alert → N8N Webhook → analyzeBugForQAT → ag-41
 */

import * as fs from 'fs';
import * as path from 'path';
import type { QatConfig } from '../qat.config';

export interface BugReport {
  source: 'sentry' | 'github' | 'manual';
  id: string;
  title: string;
  description: string;
  /** URL/route where bug was detected */
  affectedRoute?: string;
  /** Component/feature name */
  affectedFeature?: string;
  /** Error type (e.g., 'TypeError', 'NetworkError') */
  errorType?: string;
  /** Severity from source */
  severity?: 'critical' | 'error' | 'warning' | 'info';
  /** Tags/labels from source */
  tags?: string[];
  /** Timestamp of first occurrence */
  firstSeen?: string;
  /** Number of occurrences */
  count?: number;
}

export interface QATCoverageResult {
  bug: BugReport;
  /** Does a QAT scenario exist for this feature/route? */
  hasCoverage: boolean;
  /** Matching scenario IDs */
  matchingScenarios: string[];
  /** Was the bug detected by existing QAT? */
  detectedByQAT: boolean;
  /** Recommended action */
  action: QATAction;
}

export type QATAction =
  | { type: 'none'; reason: string }
  | { type: 'create-regression'; feature: string; persona: string; suggestedInput: string }
  | { type: 'refine-rubric'; scenarioId: string; reason: string }
  | { type: 'increase-frequency'; scenarioId: string; reason: string };

/**
 * Analisa um bug report e verifica cobertura QAT.
 */
export function analyzeBugForQAT(
  bug: BugReport,
  configPath: string
): QATCoverageResult {
  // Load QAT config
  const config = loadQATConfig(configPath);
  if (!config) {
    return {
      bug,
      hasCoverage: false,
      matchingScenarios: [],
      detectedByQAT: false,
      action: { type: 'none', reason: 'QAT config not found' },
    };
  }

  // Find matching scenarios
  const matchingScenarios = findMatchingScenarios(bug, config);

  if (matchingScenarios.length === 0) {
    // No QAT coverage → suggest creating regression scenario
    const feature = bug.affectedFeature ?? inferFeatureFromRoute(bug.affectedRoute) ?? bug.title;
    const persona = inferPersonaFromBug(bug);
    const suggestedInput = inferInputFromBug(bug);

    return {
      bug,
      hasCoverage: false,
      matchingScenarios: [],
      detectedByQAT: false,
      action: {
        type: 'create-regression',
        feature,
        persona,
        suggestedInput,
      },
    };
  }

  // Has coverage — check if QAT detected this bug
  const recentResults = loadRecentResults(config);
  const detectedByQAT = checkIfDetectedByQAT(matchingScenarios, recentResults);

  if (!detectedByQAT) {
    // QAT exists but didn't catch the bug → rubric needs refinement
    return {
      bug,
      hasCoverage: true,
      matchingScenarios,
      detectedByQAT: false,
      action: {
        type: 'refine-rubric',
        scenarioId: matchingScenarios[0],
        reason: `Bug "${bug.title}" not detected by existing QAT scenario. Rubric may need additional criteria or lower threshold.`,
      },
    };
  }

  return {
    bug,
    hasCoverage: true,
    matchingScenarios,
    detectedByQAT: true,
    action: { type: 'none', reason: 'Bug already detected by QAT' },
  };
}

/**
 * Verifica cobertura QAT de todas as features do projeto.
 * Retorna features sem cenario QAT.
 */
export function checkQATCoverage(
  configPath: string,
  knownFeatures: string[]
): { feature: string; hasCoverage: boolean; scenarioId?: string }[] {
  const config = loadQATConfig(configPath);
  if (!config) return knownFeatures.map((f) => ({ feature: f, hasCoverage: false }));

  return knownFeatures.map((feature) => {
    const featureLower = feature.toLowerCase();
    const match = config.scenarios.find(
      (s: any) =>
        s.name.toLowerCase().includes(featureLower) ||
        s.context?.toLowerCase().includes(featureLower) ||
        s.userInput?.toLowerCase().includes(featureLower)
    );

    return {
      feature,
      hasCoverage: !!match,
      scenarioId: match?.id,
    };
  });
}

/**
 * Gera comando ag-41 para criar cenario de regressao.
 */
export function generateAg41Command(action: Extract<QATAction, { type: 'create-regression' }>): string {
  return `/ag41 feature="${action.feature}" persona="${action.persona}" tipo=regression input="${action.suggestedInput}"`;
}

/**
 * Processa webhook do Sentry (formato N8N).
 * Retorna BugReport normalizado.
 */
export function parseSentryWebhook(payload: Record<string, any>): BugReport {
  const event = payload.event ?? payload.data?.event ?? payload;

  return {
    source: 'sentry',
    id: event.event_id ?? event.id ?? 'unknown',
    title: event.title ?? event.message ?? 'Unknown error',
    description: event.culprit ?? event.metadata?.value ?? '',
    affectedRoute: extractRouteFromSentry(event),
    affectedFeature: event.tags?.find((t: any) => t.key === 'feature')?.value,
    errorType: event.type ?? event.exception?.values?.[0]?.type,
    severity: mapSentrySeverity(event.level),
    tags: event.tags?.map((t: any) => `${t.key}:${t.value}`) ?? [],
    firstSeen: event.first_seen ?? event.dateCreated,
    count: event.count ?? 1,
  };
}

/**
 * Processa GitHub Issue (formato webhook).
 */
export function parseGitHubIssue(payload: Record<string, any>): BugReport {
  const issue = payload.issue ?? payload;

  return {
    source: 'github',
    id: String(issue.number ?? issue.id ?? 'unknown'),
    title: issue.title ?? 'Unknown issue',
    description: issue.body ?? '',
    affectedFeature: issue.labels?.find((l: any) => l.name?.startsWith('feature:'))?.name?.replace('feature:', ''),
    severity: issue.labels?.some((l: any) => l.name === 'P0' || l.name === 'critical') ? 'critical' : 'error',
    tags: issue.labels?.map((l: any) => l.name) ?? [],
    firstSeen: issue.created_at,
  };
}

// --- Internal helpers ---

function loadQATConfig(configPath: string): any {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    // Simple extraction — in real implementation, use ts-node or esbuild
    return JSON.parse(raw);
  } catch {
    // Try loading as TS module reference
    const jsonPath = configPath.replace('.ts', '.json');
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }
    return null;
  }
}

function findMatchingScenarios(bug: BugReport, config: any): string[] {
  const scenarios: any[] = config.scenarios ?? [];
  const matches: string[] = [];

  const bugText = `${bug.title} ${bug.description} ${bug.affectedRoute ?? ''} ${bug.affectedFeature ?? ''}`.toLowerCase();

  for (const s of scenarios) {
    const scenarioText = `${s.name} ${s.context ?? ''} ${s.userInput ?? ''} ${s.persona ?? ''}`.toLowerCase();

    // Check for keyword overlap
    const bugWords = bugText.split(/\s+/).filter((w) => w.length > 3);
    const matchCount = bugWords.filter((w) => scenarioText.includes(w)).length;

    if (matchCount >= 2 || (bug.affectedRoute && scenarioText.includes(bug.affectedRoute))) {
      matches.push(s.id);
    }
  }

  return matches;
}

function loadRecentResults(config: any): any[] {
  const resultsDir = config.resultsDir ?? 'tests/qat/results';
  if (!fs.existsSync(resultsDir)) return [];

  const entries = fs.readdirSync(resultsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .sort((a, b) => b.name.localeCompare(a.name))
    .slice(0, 3); // Last 3 runs

  const results: any[] = [];
  for (const entry of entries) {
    const summaryPath = path.join(resultsDir, entry.name, 'summary.json');
    if (fs.existsSync(summaryPath)) {
      try {
        results.push(JSON.parse(fs.readFileSync(summaryPath, 'utf-8')));
      } catch { /* skip */ }
    }
  }
  return results;
}

function checkIfDetectedByQAT(scenarioIds: string[], recentResults: any[]): boolean {
  for (const result of recentResults) {
    const evaluations = result.evaluations ?? [];
    for (const eval_ of evaluations) {
      if (scenarioIds.includes(eval_.scenario) && !eval_.pass) {
        return true; // QAT detected a failure for this scenario
      }
    }
  }
  return false;
}

function inferFeatureFromRoute(route?: string): string | undefined {
  if (!route) return undefined;
  // /app/chat → chat, /api/generate → generate
  const parts = route.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

function inferPersonaFromBug(bug: BugReport): string {
  // Infer from tags or default
  const roleTag = bug.tags?.find((t) => t.startsWith('role:'));
  if (roleTag) return roleTag.replace('role:', '');
  return 'Usuario padrao';
}

function inferInputFromBug(bug: BugReport): string {
  // Generate a realistic input that would trigger the bug
  if (bug.affectedFeature) {
    return `Usar ${bug.affectedFeature} em cenario que reproduz: ${bug.title}`;
  }
  return `Reproduzir cenario: ${bug.title}`;
}

function extractRouteFromSentry(event: any): string | undefined {
  return event.request?.url ?? event.tags?.find((t: any) => t.key === 'url')?.value;
}

function mapSentrySeverity(level?: string): BugReport['severity'] {
  switch (level) {
    case 'fatal': return 'critical';
    case 'error': return 'error';
    case 'warning': return 'warning';
    default: return 'info';
  }
}
