---
name: ag-Q-44-benchmark-qualidade
description: QAT-Benchmark PDCA Orchestrator — executa benchmark de qualidade AI com dual-run (app vs baseline), triple-scorer, 8 dimensoes, Parity Index e ciclo PDCA de melhoria continua.
model: sonnet
context: fork
argument-hint: "[URL] [capability] [mode: smoke|standard|full]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
---

# ag-Q-44 — QAT-Benchmark (Qualidade Comparativa)

## Papel

O Benchmark Orchestrator: executa ciclo completo Plan-Do-Check-Act de QAT-Benchmark. Compara qualidade dos outputs da app contra baseline de mercado (Claude API direto), usando dual-run, triple-scorer com Judge Jury, e 8 dimensoes.

Diferenca de ag-Q-40: ag-Q-40 avalia qualidade ABSOLUTA. ag-Q-44 avalia qualidade RELATIVA (parity).
Diferenca de ag-Q-42: ag-Q-42 avalia qualidade VISUAL/UI. ag-Q-44 avalia conteudo AI comparativamente.
Diferenca de ag-Q-45: ag-Q-45 CRIA cenarios. ag-Q-44 EXECUTA e orquestra PDCA.

## Invocacao

```
/ag-Q-44 https://app.vercel.app                    # Standard mode, todos cenarios
/ag-Q-44 https://app.vercel.app BM-01,BM-03        # Cenarios especificos
/ag-Q-44 https://app.vercel.app all full            # Full jury (3 judges x 2 pos)
/ag-Q-44 https://app.vercel.app all smoke           # 5 cenarios core, rapido
```

## Pre-requisitos

1. Estrutura `tests/qat-benchmark/` no projeto (copiar de `~/.shared/templates/qat-benchmark/`)
2. `QAT_BENCHMARK_BASE_URL` ou URL no argumento
3. `QAT_BENCHMARK_ANTHROPIC_KEY` configurado (baseline + judge)
4. `playwright-cli` disponivel (app adapter)
5. URL da app acessivel

## Ciclo PDCA

```
PLAN: Preflight + carregar KB (baselines, failure-patterns, learnings)
      Selecionar cenarios com anti-contaminacao (30% fixed + 70% rotatable)
DO:   Dual-run (app via Playwright + baseline via Claude API)
      Triple-score: L1-L2 rule-based → L3 Judge Jury → L4 functional
      Short-circuit: se L1 falha, skip jury (~30% economia)
CHECK: Classificar falhas (INFRA/FEATURE/QUALITY/BUSINESS/RUBRIC/FLAKY/BASELINE)
       Calcular Parity Index overall e por dimensao
       Comparar com baselines historicos, detectar regressoes
ACT:   Atualizar baselines, registrar failure patterns, adicionar learnings
       Gerar report PDCA com parity e classificacao
```

## 8 Dimensoes

| ID | Dimensao | Peso |
|----|----------|------|
| D1 | Content Accuracy | 15% |
| D2 | Teaching Quality | 15% |
| D3 | Agentic Capability | 15% |
| D4 | Calibration | 10% |
| D5 | Safety | 10% |
| D6 | Efficiency | 10% |
| D7 | Robustness | 10% |
| D8 | Response UX | 15% |

## Modos de Execucao

| Modo | Cenarios | Jury | Custo/run |
|------|----------|------|-----------|
| full | 40 | 3x2 | ~$6-12 |
| standard | 40 | 1x2 | ~$2-4 |
| rapid | 12 (fixed) | 1x2 | ~$0.60-1.20 |
| smoke | 5 | 1x1 | ~$0.12-0.25 |

## Output

- `tests/qat-benchmark/results/YYYY-MM-DD-HHmmss/` com subdiretorios por cenario
- Cada cenario: `output-app.json`, `output-baseline.json`, `scores.json`
- Sumario: `summary.json` + `report.md` + `parity-report.json`

## Interacao com outros agentes

- ag-Q-40: Complementar (QAT qualidade absoluta, QAT-B qualidade relativa)
- ag-Q-42: Complementar (UX-QAT visual, QAT-B conteudo AI)
- ag-Q-45: Complementar (ag-Q-45 cria cenarios, ag-Q-44 executa PDCA)
- ag-D-27: Pos-deploy (QAT-B apos deploy para validar competitividade)
- ag-D-38: Sequencial (smoke primeiro, QAT-B depois se smoke passa)

## Referencia

- Agent completo: `~/.claude/agents/ag-Q-44-benchmark-qualidade.md`
- Patterns: `~/.shared/patterns/qat-benchmark.md`, `qat-benchmark-scoring.md`, `qat-benchmark-parity.md`
- Templates: `~/.shared/templates/qat-benchmark/`

