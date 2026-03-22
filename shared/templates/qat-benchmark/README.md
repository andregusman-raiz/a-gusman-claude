# QAT-Benchmark Templates

Templates replicaveis para benchmark de qualidade AI vs baseline de mercado.

## Quick Start

```bash
# 1. Copiar templates para o projeto
cp -r ~/.shared/templates/qat-benchmark/ tests/qat-benchmark/

# 2. Configurar
# Editar tests/qat-benchmark/qat-benchmark.config.ts
# - baseUrl: URL da aplicacao
# - appAdapter: seletores da interface de chat
# - baselineAdapter: modelo Claude para baseline
# - jury: modelos do Judge Jury
# - scenarios: cenarios do projeto

# 3. Env vars
export QAT_BENCHMARK_BASE_URL=https://app.exemplo.com
export QAT_BENCHMARK_ANTHROPIC_KEY=sk-...
export QAT_BENCHMARK_OPENAI_KEY=sk-...     # opcional (full jury)
export QAT_BENCHMARK_GOOGLE_KEY=...         # opcional (full jury)

# 4. Executar via agente
# /ag44 [URL] [scope] [mode]
```

## Estrutura

```
qat-benchmark/
  qat-benchmark.config.template.ts   # Config principal
  adapters/
    raiz-chat.adapter.template.ts    # Adapter para app (Playwright)
    claude-api.adapter.template.ts   # Adapter baseline (Claude API)
  scorers/
    rule-based.scorer.template.ts    # L1-L2 checks deterministicos
    llm-judge.scorer.template.ts     # L3 Judge Jury multi-modelo
  dimensions/
    dimensions.template.ts           # 8 dimensoes com criterios
  scenarios/
    fixed/                           # 30% cenarios fixos (baseline tracking)
    rotatable/                       # 70% pool rotavel (anti-contaminacao)
  knowledge/
    baselines.template.json          # Historico de scores
    failure-patterns.template.json   # Falhas conhecidas
    learnings.template.md            # Licoes aprendidas
  reports/
    report.template.md               # Template de relatorio
```

## Conceitos-Chave

- **Dual-Run**: Mesmo cenario executado na app E no baseline (Claude API)
- **Judge Jury**: 3 modelos x 2 posicoes para eliminar bias
- **Parity Index**: score_app / score_baseline (1.0 = paridade)
- **8 Dimensoes**: D1-D8 (accuracy, teaching, agentic, calibration, safety, efficiency, robustness, UX)
- **Anti-Contaminacao**: 30% fixos + 70% rotaveis
- **PDCA**: Plan-Do-Check-Act continuo

## Modos de Execucao

| Modo | Cenarios | Jury | Custo/run |
|------|----------|------|-----------|
| Completo | 40 | 3x2 | ~$6-12 |
| Standard | 40 | 1x2 | ~$2-4 |
| Rapido | 12 (fixed) | 1x2 | ~$0.60-1.20 |
| Smoke | 5 | 1x1 | ~$0.12-0.25 |

## Agentes

- **ag-44** (`/ag44`): Executa benchmark PDCA completo
- **ag-45** (`/ag45`): Cria novos cenarios de benchmark

## Patterns Relacionados

- `~/.shared/patterns/qat-benchmark.md` — Metodologia completa
- `~/.shared/patterns/qat-benchmark-scoring.md` — Triple-scorer
- `~/.shared/patterns/qat-benchmark-parity.md` — Parity Index
- `~/.shared/patterns/quality-acceptance-testing.md` — QAT (base)
