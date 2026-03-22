# QAT Continuous Improvement — Auto-refinamento, deteccao e otimizacao

> Pattern para melhoria continua autonoma do QAT via 4 modulos integrados ao ciclo PDCA.

## Visao Geral

O QAT v2 nao e apenas medicao — e melhoria continua. Apos cada ciclo PDCA, 4 modulos analisam dados acumulados e sugerem acoes:

```
Ciclo PDCA (ag-40)
    ↓ ACT Phase
    ├── Rubric Refinement   → Rubricas mais precisas
    ├── Scenario Detection   → Cobertura ampliada
    ├── Cost Intelligence    → ROI otimizado
    └── Trends Export        → Visibilidade em dashboards
```

## Modulo 1: Auto-Refinamento de Rubricas

**Arquivo**: `helpers/rubric-refinement.ts`

### Trigger
3+ runs com mesma rubrica produzem scores inconsistentes (variancia > tolerance).

### Classificacao de Inconsistencia

| Tipo | Condicao | Acao |
|------|----------|------|
| `judge-variance` | 1-2 criterios volateis | Clarificar criterios especificos com exemplos de escala |
| `output-variance` | Score geral varia mas criterios nao | LLM nao-determinismo — aumentar tolerance ou fixar seed |
| `rubric-ambiguity` | 3+ criterios volateis | Rubrica precisa rewrite com criterios mais objetivos |
| `stable` | Variancia < tolerance | Nenhuma acao necessaria |

### Deteccao de False Positives/Negatives

- **False Positive**: Golden sample recebe score < 8 → rubrica muito exigente
- **False Negative**: Anti-pattern recebe score > 6 → rubrica muito leniente

### Prioridades de Refinamento

| Prioridade | Tipo | Impacto |
|-----------|------|---------|
| P1 | `recalibrate-scale` (false positive/negative) | Judge da resultados errados |
| P1 | `add-penalty` (false negative) | Falhas nao detectadas |
| P1-P2 | `clarify-criterion` (criterio volatil) | Scores inconsistentes |
| P3 | `mark-flaky` (output variance) | Informacional |

### Integracao com PDCA

```typescript
// No ACT phase do pdca.ts:
import { analyzeAllRubrics, suggestRefinements } from './rubric-refinement';

// Apos executar ciclo:
const { analyses, refinements } = analyzeAllRubrics(scenarioEvaluations, baselines);
// P1 refinements → salvar em learnings.md + notificar
// P2-P3 → salvar para review manual
```

## Modulo 2: Auto-Deteccao de Cenarios

**Arquivo**: `helpers/scenario-detection.ts`

### Pipeline

```
Bug Report (Sentry / GitHub / Manual)
    ↓ parseSentryWebhook() / parseGitHubIssue()
    ↓ BugReport normalizado
    ↓ analyzeBugForQAT(bug, configPath)
    ↓
    ├── Sem cobertura QAT
    │   → action: create-regression
    │   → generateAg41Command() → /ag41 feature="..." persona="..." tipo=regression
    │
    ├── Com cobertura, mas QAT nao detectou
    │   → action: refine-rubric
    │   → Rubrica precisa criterio adicional
    │
    └── Com cobertura, QAT ja detectou
        → action: none (sistema funcionou)
```

### Integracao com N8N

O workflow Quality4 (Sentry Alert) pode chamar `analyzeBugForQAT()` para verificar cobertura automaticamente:

1. Sentry → N8N webhook
2. N8N Code Node → `parseSentryWebhook(payload)`
3. N8N HTTP Node → POST para endpoint interno com BugReport
4. Resposta inclui `action.type` e `suggestedInput`

### Coverage Check

```typescript
// Verificar cobertura de features conhecidas:
const coverage = checkQATCoverage(configPath, ['chat', 'export', 'plano-de-aula']);
// → [{ feature: 'chat', hasCoverage: true, scenarioId: 'QAT-01' },
//    { feature: 'export', hasCoverage: false }]
```

## Modulo 3: Cost Intelligence

**Arquivo**: `helpers/cost-intelligence.ts`

### Categorias de Cenario

| Categoria | Condicao | Acao Sugerida |
|-----------|----------|---------------|
| `high-value` | ROI > 10 | Manter — detecta problemas reais |
| `moderate` | ROI 3-10 | Manter |
| `low-value` | ROI < 3, 5+ runs, 0 deteccoes | Investigar — cenario pode ser inutil |
| `always-passes` | 10+ passes consecutivos | Reduzir frequencia (weekly → monthly) |
| `always-fails` | 5+ falhas consecutivas | Desativar — feature nao implementada |
| `too-expensive` | Avg > $0.10/run | Simplificar rubrica ou reduzir output avaliado |

### Metricas Chave

- **ROI Score**: `detections / totalCost` (maior = melhor)
- **Cost per Detection**: `totalCost / detections` (menor = melhor)
- **Short-circuit Savings**: Economia de L1/L2 falharem antes de chamar Judge
- **Projected Monthly Cost**: `avgCostPerRun * 4` (weekly runs)

### Otimizacoes Automaticas

```typescript
const report = analyzeCostROI(resultsDir, knowledgePath);

// report.optimizations contém acoes sugeridas:
// - keep: cenario valioso, nao mexer
// - reduce-frequency: estavel, rodar menos
// - disable: sempre falha, sem valor
// - simplify-rubric: muito caro
// - investigate: sem deteccoes, pode ser inutil
```

## Modulo 4: Trends Export

**Arquivo**: `helpers/trends-exporter.ts`

### Formatos de Export

| Formato | Destino | Uso |
|---------|---------|-----|
| `trends.json` | Analise programatica | Full data para scripts |
| `qat-metrics.prom` | Prometheus/Grafana | Metricas como gauges/counters |
| `grafana-data.json` | Grafana Infinity | Time series + tabelas |
| `trends.md` | Humanos | Resumo legivel |

### Deteccao de Tendencia

Para cada cenario, analisa os ultimos runs:

| Trend | Condicao | Significado |
|-------|----------|-------------|
| `improving` | 3 ultimos scores crescentes, delta > 0.5 | Qualidade melhorando |
| `degrading` | 3 ultimos scores decrescentes, delta < -0.5 | Regressao em andamento |
| `stable` | Variacao < 0.5 | Sem mudanca significativa |
| `volatile` | StdDev > 2.0 | Scores inconsistentes (flaky ou rubrica ambigua) |

### Metricas Prometheus

```
qat_scenario_score{scenario="QAT-01",trend="stable"} 8.5
qat_scenario_moving_avg{scenario="QAT-01"} 8.3
qat_pass_rate 75
qat_avg_score 7.8
qat_total_cost_usd 1.23
qat_degrading_scenarios 1
qat_volatile_scenarios 0
```

### Integracao com Grafana

Dashboard "QAT Quality" pode consumir:
- `grafana-data.json` via Infinity datasource (JSON)
- `qat-metrics.prom` via Prometheus pushgateway ou node-exporter textfile collector

## Integracao Completa no PDCA

### ACT Phase Expandida

```typescript
// pdca.ts — ACT Phase
async function actPhase(evaluations, config, runId) {
  // 1. Acoes existentes (baselines, patterns, issues, alerts)
  const actionResult = await executeActions(diagnostics, config);

  // 2. Rubric Refinement (se 3+ runs)
  const { analyses, refinements } = analyzeAllRubrics(scenarioEvals, baselines);
  for (const r of refinements.filter(r => r.priority === 'P1')) {
    appendToLearnings(generateRefinementLearning(r, cycleNumber));
  }

  // 3. Cost Intelligence
  const costReport = analyzeCostROI(config.resultsDir, config.knowledgePath);
  saveCostReport(costReport, path.join(config.resultsDir, runId));

  // 4. Trends Export
  const trends = exportTrends(config.resultsDir);
  saveTrends(trends, path.join(config.resultsDir, runId));
}
```

### Ciclo de Feedback

```
Run N → PDCA → ACT:
  ├── Rubric refinements salvos em learnings.md
  ├── Cost report salvo em cost-intelligence.json
  ├── Trends exportados para Grafana
  └── Scenario gaps detectados

Run N+1 → PLAN:
  ├── Le learnings.md → aplica refinements
  ├── Le cost report → ajusta frequencia
  └── Le trends → foca em cenarios degrading
```

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `helpers/rubric-refinement.ts` | Analise de consistencia + sugestoes de refinamento |
| `helpers/scenario-detection.ts` | Auto-deteccao de cenarios faltantes via bug reports |
| `helpers/cost-intelligence.ts` | ROI por cenario + otimizacao de custos |
| `helpers/trends-exporter.ts` | Export para Prometheus, Grafana, JSON, Markdown |
| `helpers/pdca.ts` | PDCA Engine (integra todos os modulos no ACT phase) |

## Referencia

- Agent: `~/.claude/agents/ag-Q-40-testar-qualidade.md` (PDCA Orchestrator)
- Agent: `~/.claude/agents/ag-Q-41-criar-cenario-qat.md` (Scenario Designer)
- Pattern: `~/.shared/patterns/qat-pdca-cycle.md`
- Pattern: `~/.shared/patterns/qat-knowledge-base.md`
- Templates: `~/.shared/templates/qat/helpers/`
