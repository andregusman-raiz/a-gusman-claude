/**
 * QAT History — Leitura de runs anteriores para comparacao temporal
 *
 * Copie para `tests/qat/helpers/history.ts` no seu projeto.
 * Funcoes para buscar e comparar resultados de runs anteriores.
 */

import * as fs from 'fs';
import * as path from 'path';
import { qatSummarySchema, type QatSummary, type QatComparison } from '../fixtures/schemas';

/**
 * Busca o run mais recente antes do run atual.
 *
 * @param resultsDir - Diretorio raiz de resultados (tests/qat/results/)
 * @param currentRunId - ID do run atual (para excluir da busca)
 * @returns Summary do run anterior, ou null se nao encontrado
 */
export function findPreviousRun(
  resultsDir: string,
  currentRunId: string
): QatSummary | null {
  if (!fs.existsSync(resultsDir)) return null;

  const entries = fs
    .readdirSync(resultsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== currentRunId)
    .map((entry) => entry.name)
    .sort()
    .reverse(); // Mais recente primeiro (formato YYYY-MM-DD-HHmmss ordena corretamente)

  for (const runDir of entries) {
    const summaryPath = path.join(resultsDir, runDir, 'summary.json');
    if (fs.existsSync(summaryPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
        return qatSummarySchema.parse(raw);
      } catch (error) {
        console.warn(`[QAT] Summary invalido em ${summaryPath}, pulando...`);
        continue;
      }
    }
  }

  return null;
}

/**
 * Compara o run atual com o anterior e retorna deltas.
 *
 * @param currentAverageScore - Score medio do run atual
 * @param resultsDir - Diretorio raiz de resultados
 * @param currentRunId - ID do run atual
 * @returns Objeto de comparacao com previousRunId e scoreDelta
 */
export function compareWithPrevious(
  currentAverageScore: number,
  resultsDir: string,
  currentRunId: string
): QatComparison {
  const previous = findPreviousRun(resultsDir, currentRunId);

  if (!previous) {
    return {
      previousRunId: null,
      scoreDelta: null,
    };
  }

  return {
    previousRunId: previous.runId,
    scoreDelta: Number((currentAverageScore - previous.averageScore).toFixed(2)),
  };
}

/**
 * Retorna historico de scores medios de todos os runs.
 * Util para gerar graficos de tendencia.
 *
 * @param resultsDir - Diretorio raiz de resultados
 * @returns Array de { runId, date, averageScore, passRate } ordenado por data
 */
export function getScoreHistory(
  resultsDir: string
): Array<{ runId: string; date: string; averageScore: number; passRate: number }> {
  if (!fs.existsSync(resultsDir)) return [];

  const entries = fs
    .readdirSync(resultsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const history: Array<{
    runId: string;
    date: string;
    averageScore: number;
    passRate: number;
  }> = [];

  for (const runDir of entries) {
    const summaryPath = path.join(resultsDir, runDir, 'summary.json');
    if (fs.existsSync(summaryPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
        const summary = qatSummarySchema.parse(raw);

        const passRate =
          summary.totalScenarios > 0
            ? (summary.passed / summary.totalScenarios) * 100
            : 0;

        history.push({
          runId: summary.runId,
          date: summary.startedAt.split('T')[0],
          averageScore: summary.averageScore,
          passRate: Number(passRate.toFixed(1)),
        });
      } catch {
        // Skip invalid summaries
      }
    }
  }

  return history;
}

/**
 * Lista todos os run IDs disponiveis.
 *
 * @param resultsDir - Diretorio raiz de resultados
 * @returns Array de run IDs ordenados por data (mais recente ultimo)
 */
export function listRuns(resultsDir: string): string[] {
  if (!fs.existsSync(resultsDir)) return [];

  return fs
    .readdirSync(resultsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '.gitkeep')
    .map((entry) => entry.name)
    .sort();
}

// --- V2: Baseline management ---

import { type QatBaseline, qatBaselineSchema } from '../fixtures/schemas';

/**
 * Carrega baselines do knowledge base.
 * @param baselinePath - Path para baselines.json
 * @returns Map de scenarioId -> baseline
 */
export function loadBaselines(baselinePath: string): Map<string, QatBaseline> {
  const map = new Map<string, QatBaseline>();
  if (!fs.existsSync(baselinePath)) return map;

  try {
    const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    const baselines = raw.scenarios ?? raw;
    if (Array.isArray(baselines)) {
      for (const b of baselines) {
        const parsed = qatBaselineSchema.safeParse(b);
        if (parsed.success) {
          map.set(parsed.data.scenarioId, parsed.data);
        }
      }
    } else if (typeof baselines === 'object') {
      for (const [id, b] of Object.entries(baselines)) {
        const parsed = qatBaselineSchema.safeParse({ scenarioId: id, ...(b as object) });
        if (parsed.success) {
          map.set(id, parsed.data);
        }
      }
    }
  } catch (error) {
    console.warn(`[QAT] Erro ao carregar baselines de ${baselinePath}:`, error);
  }

  return map;
}

/**
 * Atualiza baseline de um cenario (somente se score subiu).
 * @param baselinePath - Path para baselines.json
 * @param scenarioId - ID do cenario
 * @param newScore - Score do run atual
 * @param runId - ID do run atual
 * @returns true se baseline foi atualizado
 */
export function updateBaseline(
  baselinePath: string,
  scenarioId: string,
  newScore: number,
  runId: string
): boolean {
  const baselines = loadBaselines(baselinePath);
  const existing = baselines.get(scenarioId);

  if (existing && newScore <= existing.baselineScore) {
    // Apenas adicionar ao historico, nao atualizar baseline
    existing.history.push({ runId, score: newScore, date: new Date().toISOString().split('T')[0] });
    saveBaselines(baselinePath, baselines);
    return false;
  }

  // Novo baseline ou score melhor
  const updated: QatBaseline = {
    scenarioId,
    baselineScore: newScore,
    threshold: existing?.threshold ?? 6,
    tolerance: existing?.tolerance ?? 1.0,
    category: existing?.category ?? 'unknown',
    updatedAt: new Date().toISOString(),
    history: [
      ...(existing?.history ?? []),
      { runId, score: newScore, date: new Date().toISOString().split('T')[0] },
    ],
  };

  baselines.set(scenarioId, updated);
  saveBaselines(baselinePath, baselines);
  return true;
}

/**
 * Detecta cenarios flaky (delta > tolerance entre runs consecutivos).
 */
export function detectFlaky(
  baselinePath: string,
  tolerance: number = 2.0
): string[] {
  const baselines = loadBaselines(baselinePath);
  const flaky: string[] = [];

  for (const [id, baseline] of baselines) {
    if (baseline.history.length < 3) continue;
    const recent = baseline.history.slice(-3);
    const scores = recent.map((h) => h.score);
    const maxDelta = Math.max(...scores) - Math.min(...scores);
    if (maxDelta > tolerance) {
      flaky.push(id);
    }
  }

  return flaky;
}

/**
 * Salva baselines no arquivo JSON.
 */
function saveBaselines(baselinePath: string, baselines: Map<string, QatBaseline>): void {
  const dir = path.dirname(baselinePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const data = {
    updatedAt: new Date().toISOString(),
    scenarios: Object.fromEntries(baselines),
  };

  fs.writeFileSync(baselinePath, JSON.stringify(data, null, 2), 'utf-8');
}
