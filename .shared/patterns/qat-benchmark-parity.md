# QAT-Benchmark Parity Index — Dual-Run + Competitive Analysis Pattern

## Visao Geral

O Parity Index e a metrica central do QAT-Benchmark. Mede a relacao entre a qualidade do output da aplicacao vs o baseline de mercado (Claude API direto), por dimensao e no agregado.

## Formula

```
Parity_dimension = score_app_dimension / score_baseline_dimension
Parity_overall = weighted_avg(Parity_D1..D8, weights)
```

## Escala de Interpretacao

| Parity | Status | Significado | Acao |
|--------|--------|-------------|------|
| >= 1.10 | SUPERIOR | App supera baseline nesta dimensao | Documentar vantagem competitiva |
| 0.95 - 1.10 | AT_PARITY | Diferenca dentro da margem | Manter (objetivo alcancado) |
| 0.80 - 0.95 | MINOR_GAP | Gap mensuravel mas nao critico | Planejar melhoria no proximo ciclo |
| 0.60 - 0.80 | MAJOR_GAP | Gap significativo, usuarios percebem | P1 — investigar e corrigir |
| < 0.60 | CRITICAL_GAP | Experiencia muito inferior ao mercado | P0 — acao imediata |

## Dual-Run Engine

### Principio

Mesmo cenario, mesmas condicoes, dois sistemas:

```
Cenario: "Explique fotossintese para aluno de 8 anos"
  |
  +---> App Adapter -----> [raiz-platform /dashboard] ---> output_app
  |     (Playwright)       - Navega, envia prompt
  |                        - Captura resposta completa
  |                        - Registra latencia, tokens
  |
  +---> Baseline Adapter -> [Claude API] ----------------> output_baseline
        (API call)         - Mesmo prompt
                           - Mesmo system prompt (quando possivel)
                           - Registra latencia, tokens, custo
```

### Adapter Interface

```typescript
interface BenchmarkAdapter {
  /** Nome do adapter para reports */
  name: string;

  /** Tipo: app (interface web) ou api (chamada direta) */
  type: 'app' | 'api';

  /** Inicializar (auth, browser, etc.) */
  initialize(): Promise<void>;

  /** Enviar cenario e capturar output */
  send(scenario: BenchmarkScenario): Promise<BenchmarkOutput>;

  /** Limpar recursos */
  cleanup(): Promise<void>;
}

interface BenchmarkOutput {
  text: string;           // Texto completo da resposta
  latencyMs: number;      // Tempo ate resposta completa
  tokensUsed?: number;    // Tokens consumidos (se disponivel)
  costUsd?: number;       // Custo estimado
  metadata: Record<string, unknown>;
  capturedAt: string;     // ISO timestamp
  error?: string;         // Se falhou
}

interface BenchmarkScenario {
  id: string;             // BM-01, BM-R042
  name: string;
  category: 'fixed' | 'rotatable';
  prompt: string;
  systemPrompt?: string;
  context?: string;       // Documentos, historico
  dimensions: DimensionWeight[];
  expectedFormat?: string;
  expectedLanguage?: string;
  timeoutMs: number;
  tags: string[];
}
```

### Sequencia de Execucao

```
1. Selecionar cenarios (30% fixed + sample de rotatable)
2. Para cada cenario:
   a. Executar App Adapter → output_app
   b. Executar Baseline Adapter → output_baseline
   c. Se algum falhou → classificar como INFRA, continuar
   d. Triple-score ambos outputs
   e. Calcular parity por dimensao
3. Agregar resultados
4. Gerar parity report
```

**Ordem importa**: App primeiro, baseline segundo. Isso porque:
- App pode ter state (login, sessao) que precisa ser mantido
- Baseline e stateless (API call), ordem nao importa
- Se app timeout, nao desperdicamos baseline call

## Anti-Contaminacao

### Problema
Se sempre usamos os mesmos cenarios, a app pode ser otimizada para eles (overfitting). O benchmark perde valor preditivo.

### Solucao: Split 30/70

```
Pool Total: 100+ cenarios
  |
  +---> Fixed (30%): 12 cenarios core
  |     - IDs: BM-01 a BM-12
  |     - NUNCA mudam
  |     - Servem como baseline temporal (tracking de tendencia)
  |     - Cobrem as 8 dimensoes uniformemente
  |
  +---> Rotatable (70%): pool de 28+ cenarios selecionados aleatoriamente
        - IDs: BM-R001 a BM-R999
        - Selecionados por sampling a cada run
        - Pool cresce com o tempo (novos cenarios adicionados)
        - Rotacao garante cobertura ampla sem previsibilidade
```

### Sampling Strategy

```typescript
function selectScenarios(
  fixed: BenchmarkScenario[],
  rotatable: BenchmarkScenario[],
  targetTotal: number
): BenchmarkScenario[] {
  const fixedCount = fixed.length; // sempre todos
  const rotatableCount = targetTotal - fixedCount;

  // Weighted random: priorizar cenarios menos executados
  const weighted = rotatable.map(s => ({
    scenario: s,
    weight: 1 / (s.runCount + 1) // menos executado = mais peso
  }));

  return [...fixed, ...weightedSample(weighted, rotatableCount)];
}
```

### Rotacao Trimestral

A cada trimestre:
1. Revisar cenarios fixos — algum ficou obsoleto?
2. Mover cenarios rotaveis frequentes para fixo (se se tornaram core)
3. Adicionar novos cenarios ao pool rotavel
4. Documentar mudancas no changelog

## Parity Dashboard (Report)

### Radar Chart por Dimensao

```
           D1 Accuracy
              |
    D8 UX ----+---- D2 Teaching
         /    |    \
   D7 Robust-+--D3 Agentic
         \    |    /
    D6 Effic--+---- D4 Calibration
              |
           D5 Safety

--- App (azul)
--- Baseline (cinza)
```

### Trend Chart

```
Parity Index ao longo do tempo:

1.2 |                              *
1.1 |              *    *    *
1.0 |----*----*---------*---------*---  (linha de paridade)
0.9 |
0.8 |    *
0.7 |
    +----+----+----+----+----+----+---> runs
     R1   R2   R3   R4   R5   R6   R7
```

### Gap Analysis Table

```
| Dimensao | App | Baseline | Parity | Trend | Status |
|----------|-----|----------|--------|-------|--------|
| D1 Accuracy | 7.8 | 8.2 | 0.95 | -> | AT_PARITY |
| D2 Teaching | 8.1 | 7.5 | 1.08 | ↑ | SUPERIOR |
| D3 Agentic | 5.2 | 7.8 | 0.67 | ↓ | MAJOR_GAP |
| ...
| Overall | 7.1 | 7.6 | 0.93 | -> | AT_PARITY |
```

## Alertas Automaticos

| Condicao | Severidade | Acao |
|----------|-----------|------|
| Parity < 0.60 qualquer dimensao | P0 | Issue GitHub + email |
| Parity caiu > 0.15 vs ultimo run | P1 | Issue GitHub |
| 3+ dimensoes com gap > 0.10 | P1 | Review meeting |
| Parity overall < 0.80 | P0 | Acao imediata |
| Baseline model atualizado | INFO | Re-run para recalibrar |

## Baseline Management

### Atualizacao do Modelo Baseline

Quando Claude lanca novo modelo:
1. Re-rodar cenarios fixos com novo modelo
2. Comparar scores (novo vs antigo)
3. Se delta > 0.5 → atualizar baseline e flag "recalibrated"
4. Documentar no changelog

### Historico

Manter historico dos ultimos 20 runs por cenario fixo:
```json
{
  "BM-01": {
    "runs": [
      { "date": "2026-03-10", "app": 7.2, "baseline": 7.8, "parity": 0.92, "baselineModel": "claude-opus-4-6" },
      { "date": "2026-02-24", "app": 6.8, "baseline": 7.5, "parity": 0.91, "baselineModel": "claude-opus-4-5-20250520" }
    ]
  }
}
```

## Anti-patterns

1. **NAO comparar modelos diferentes** como se fossem o mesmo baseline (track model version)
2. **NAO ignorar latencia** na comparacao — app com UI tem overhead natural vs API direta
3. **NAO otimizar para cenarios fixos** — isso derrota o proposito do benchmark
4. **NAO rodar sem cenarios rotaveis** — so fixos = overfitting garantido
5. **NAO apresentar parity sem confianca** — mostrar intervalo (p25-p75) alem da mediana

## Referencia

- Pattern pai: `qat-benchmark.md`
- Pattern scoring: `qat-benchmark-scoring.md`
- Template: `~/.shared/templates/qat-benchmark/`
