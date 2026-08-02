---
name: ag-criar-cenario-benchmark
description: "[INTERNAL — invocada via ag-4-teste-final benchmark] QAT-Benchmark Scenario Designer — cria cenarios de benchmark com dual-run, 8 dimensoes, anti-contaminacao e criterios L1-L4 por dimensao."
model: sonnet
argument-hint: "[capability]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
visibility: internal
---

# ag-criar-cenario-benchmark — QAT-Benchmark Scenario Designer (INTERNAL)

> **Internal skill** — invocada automaticamente por `ag-4-teste-final benchmark` via Agent tool. Não use diretamente via `/`. Para criar cenário benchmark use `/ag-4-teste-final benchmark [url]`.

## Papel

O designer de cenarios de benchmark: cria cenarios de alta qualidade para o QAT-Benchmark (ag-benchmark-qualidade), seguindo metodologia de 8 dimensoes, anti-contaminacao e criterios por camada (L1-L4).

Diferenca de ag-criar-cenario-qat: ag-criar-cenario-qat cria cenarios de qualidade ABSOLUTA (QAT). ag-criar-cenario-benchmark cria cenarios de benchmark COMPARATIVO (app vs baseline).
Diferenca de ag-criar-cenario-ux-qat: ag-criar-cenario-ux-qat cria cenarios visuais/UI. ag-criar-cenario-benchmark cria cenarios de conteudo/AI.
Diferenca de ag-benchmark-qualidade: ag-benchmark-qualidade EXECUTA cenarios. ag-criar-cenario-benchmark CRIA cenarios para ag-benchmark-qualidade executar.

## Invocacao

```
/ag-criar-cenario-benchmark capability="tool use"                          # 5 rotatable scenarios
/ag-criar-cenario-benchmark capability="reasoning" count=10                # 10 scenarios
/ag-criar-cenario-benchmark capability="teaching" category=fixed           # Fixed scenarios
/ag-criar-cenario-benchmark capability="safety" domain="matematica 8o ano" # Domain-specific
```

## Pre-requisitos

1. Estrutura `tests/qat-benchmark/scenarios/` no projeto
2. Cenarios existentes para analise de cobertura

## Output

- Arquivos TypeScript em `scenarios/fixed/` ou `scenarios/rotatable/`
- Cada cenario com: ID, prompt, dimensoes-alvo, criterios L1-L4, functionalChecks
- Fixed: BM-XX (sequencial, baseline tracking)
- Rotatable: BM-RXXX (pool grande, anti-contaminacao)

## Anti-contaminacao

- Fixed (30%): pool pequeno (12-15), NUNCA modificar existentes
- Rotatable (70%): pool grande (50+), variar complexidade/dominio/formato

## Interacao com outros agentes

- ag-benchmark-qualidade: Complementar (ag-criar-cenario-benchmark cria, ag-benchmark-qualidade executa)
- ag-criar-cenario-qat: Paralelo (ag-criar-cenario-qat cria QAT, ag-criar-cenario-benchmark cria benchmark)

## Referencia

- Agent completo: `~/.claude/agents/ag-criar-cenario-benchmark.md`
- Patterns: `~/.claude/shared/patterns/qat-benchmark.md`
- Templates: `~/.claude/shared/templates/qat-benchmark/scenarios/`

