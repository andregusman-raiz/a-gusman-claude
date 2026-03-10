# QAT PDCA Cycle — Ciclo de Melhoria Continua

## O que e PDCA no contexto QAT

PDCA (Plan-Do-Check-Act) transforma o QAT de uma medicao passiva em um **ciclo de melhoria**.
Cada execucao alimenta a proxima. Resultados passados informam decisoes futuras.

Sem PDCA, QAT e apenas um gasto recorrente sem retorno.

---

## O Ciclo

```
     ┌─────────────────────────────────────────┐
     │              PLAN                         │
     │  - Selecionar cenarios (scope, prioridade)│
     │  - Carregar baselines e golden samples    │
     │  - Revisar failure patterns conhecidos    │
     │  - Definir meta do ciclo                  │
     └──────────────┬────────────────────────────┘
                    ▼
     ┌─────────────────────────────────────────┐
     │              DO                           │
     │  - Executar cenarios (4 camadas: L1→L4)  │
     │  - Short-circuit em L1/L2 (economia)     │
     │  - Capturar outputs reais                 │
     │  - Avaliar com Judge calibrado            │
     └──────────────┬────────────────────────────┘
                    ▼
     ┌─────────────────────────────────────────┐
     │              CHECK                        │
     │  - Comparar vs baselines (delta tracking) │
     │  - Classificar falhas por categoria       │
     │  - Detectar padroes conhecidos            │
     │  - Calcular metricas do ciclo             │
     └──────────────┬────────────────────────────┘
                    ▼
     ┌─────────────────────────────────────────┐
     │              ACT                          │
     │  - Criar tickets para falhas novas        │
     │  - Atualizar baselines (se melhoria)      │
     │  - Refinar rubricas com learnings         │
     │  - Catalogar novos failure patterns       │
     │  - Alertar stakeholders                   │
     └──────────────┬────────────────────────────┘
                    │
                    └──────────► volta ao PLAN
```

---

## PLAN: Preparacao

### O que fazer
1. **Carregar knowledge base**: baselines.json, failure-patterns.json, learnings.md
2. **Selecionar cenarios**: por scope (all, category, specific ID)
3. **Priorizar**: Core Journeys primeiro, Edge Cases depois
4. **Definir meta**: "Melhorar chat score de 7.2 para 8.0" ou "Investigar regressao em QAT-78"
5. **Preparar golden samples**: Garantir que cenarios prioritarios tem referencia

### Artifacts de entrada
- `tests/qat/knowledge/baselines.json`
- `tests/qat/knowledge/failure-patterns.json`
- `tests/qat/knowledge/learnings.md`
- Golden samples dos cenarios selecionados

---

## DO: Execucao

### 4 Camadas (obrigatorio)

```
L1: Smoke     → Pagina carrega? Elementos existem?
L2: Functional → Output existe? Tipo correto? Nao vazio?
L3: Quality   → Score >= threshold? (AI-as-Judge)
L4: Business  → Atende objetivo do usuario? (criterios especificos)
```

### Short-circuit
- L1 falha → classificar INFRA, custo $0, nao chamar Judge
- L2 falha → classificar FEATURE, custo $0, nao chamar Judge
- **Economia**: Se 30% dos cenarios falham em L1/L2, economiza ~30% do custo de Judge

### Judge calibrado
- Enviar golden sample como referencia (quando disponivel)
- Enviar anti-patterns como contra-exemplos
- Usar rubrica especifica (nao generica)

### Timeout handling
- Cenario excede timeout → capturar estado atual
- Registrar como timeout (nao como falha de qualidade)
- Continuar com proximo cenario

---

## CHECK: Analise

### Classificacao de falhas

| Categoria | Criterio | Acao padrao |
|-----------|----------|-------------|
| **INFRA** | L1 falhou (pagina nao carrega, timeout de rede) | Ticket DevOps. Nao conta como falha de qualidade |
| **FEATURE** | L2 falhou (output vazio, tipo errado, feature ausente) | Ticket dev team. Feature quebrada ou nao implementada |
| **QUALITY** | L3 falhou (score < threshold) | Ticket product/AI. Qualidade precisa melhorar |
| **BUSINESS** | L4 falhou (nao atende objetivo do usuario) | Review com product owner. Spec pode estar errada |
| **RUBRIC** | Score inconsistente entre runs (>2 pontos variacao) | Refinar rubrica. Problema de avaliacao, nao de produto |
| **FLAKY** | Alterna pass/fail sem mudanca de codigo | Investigar nao-determinismo. Marcar como flaky |

### Comparacao com baseline

```
Para cada cenario:
  current_score = score do run atual
  baseline_score = media dos ultimos 3 runs estaveis
  delta = current_score - baseline_score

  SE delta < -1.5 → REGRESSAO (alerta imediato)
  SE delta > +1.0 estavel por 3 runs → MELHORIA (atualizar baseline)
  SE |delta| < 0.5 → ESTAVEL (sem acao)
  SE variancia > 2.0 entre runs → FLAKY (investigar)
```

### Metricas do ciclo

```json
{
  "cycleId": "PDCA-005",
  "runId": "2026-03-10-143025",
  "totalScenarios": 30,
  "results": {
    "L1_infra_failures": 2,
    "L2_feature_failures": 5,
    "L3_quality_failures": 8,
    "L4_business_failures": 3,
    "passed": 12,
    "flaky": 2,
    "skipped": 0
  },
  "cost": {
    "totalUsd": 0.28,
    "judgeCallsSaved": 7,
    "savingsUsd": 0.07
  },
  "comparison": {
    "regressions": ["QAT-04", "QAT-78"],
    "improvements": ["QAT-01", "QAT-130"],
    "newFailures": ["QAT-155"],
    "resolvedFailures": ["QAT-59"]
  }
}
```

---

## ACT: Acoes

### Acoes automaticas (por categoria)

| Trigger | Acao |
|---------|------|
| Regressao (delta < -1.5) | `gh issue create` com label `qat-regression`, alerta Discord |
| Falha sistemica (3+ cenarios na mesma categoria) | Issue P0 com label `qat-systemic`, @mention team |
| Melhoria estavel (+1.0 por 3 runs) | Atualizar baseline em baselines.json |
| Novo failure pattern | Adicionar em failure-patterns.json |
| Rubrica inconsistente | Criar issue para refinar rubrica |
| Custo > $1.00/run | Alertar, sugerir desativar cenarios low-value |

### Atualizacao de baselines

```
Regras:
1. Baseline = media dos ultimos 3 runs estaveis (sem flaky)
2. So atualizar para CIMA (melhoria confirmada)
3. NUNCA baixar baseline (regressao = problema, nao novo normal)
4. Threshold (6.0) e fixo — so muda via decisao explicita
```

### Learnings

Apos cada ciclo, registrar em `knowledge/learnings.md`:
- O que melhorou e por que
- O que piorou e hipotese de causa
- Rubricas que precisam refinamento
- Cenarios que devem ser adicionados/removidos

---

## Frequencia do PDCA

| Contexto | Frequencia PDCA |
|----------|-----------------|
| Desenvolvimento ativo | Semanal (pre-deploy) |
| Manutencao | Quinzenal |
| Pos-deploy major | Imediato |
| Pos-mudanca de modelo AI | Imediato |
| Investigacao de bug | On-demand (cenarios especificos) |

---

## Estrutura de armazenamento

```
tests/qat/
├── knowledge/                    # Knowledge Base (persistente)
│   ├── baselines.json           # Score esperado por cenario
│   ├── failure-patterns.json    # Padroes de falha catalogados
│   ├── learnings.md             # Licoes aprendidas por ciclo
│   ├── golden-samples/          # Outputs ideais por cenario
│   └── anti-patterns/           # Outputs que devem falhar
│
├── results/                      # Resultados por run (gitignored)
│   └── YYYY-MM-DD-HHmmss/
│       ├── summary.json         # + pdcaCycle, baselineComparison
│       ├── diagnostics.json     # Classificacao de falhas
│       └── actions.json         # Acoes tomadas pelo ACT
│
└── reports/                      # Reports consolidados
    └── pdca-cycles/
        └── PDCA-005.md          # Report do ciclo
```

---

## Metricas de sucesso do PDCA

| Metrica | Como medir | Meta |
|---------|-----------|------|
| Custo por insight | total_cost / acoes_acionaveis | < $0.50/insight |
| Taxa de regressao | regressoes_detectadas / total_runs | > 80% detectadas |
| Tempo de remediacao | dias entre deteccao e fix | < 5 dias uteis |
| Baseline drift | cenarios com baseline atualizado | > 80% |
| False positives | falhas que nao eram reais | < 10% |

---

## Referencia

- Scenario Design: `~/.shared/patterns/qat-scenario-design.md`
- Rubric Design: `~/.shared/patterns/qat-rubric-design.md`
- Templates: `~/.shared/templates/qat/`
- QAT Pattern: `~/.shared/patterns/quality-acceptance-testing.md`
