---
name: ag-Q-40-testar-qualidade
description: PDCA Orchestrator — executa Quality Acceptance Testing com ciclo Plan-Do-Check-Act. Carrega baselines e knowledge, executa cenarios 4 camadas (L1-L4), classifica falhas em 6 categorias, atualiza KB automaticamente.
model: sonnet
context: fork
argument-hint: "[projeto-path] [--layers=L1,L2,L3,L4]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
---

# ag-Q-40 — Quality Acceptance Testing (QAT)

## Papel

O PDCA Orchestrator: executa ciclo completo Plan-Do-Check-Act de QAT. Nao apenas mede — classifica falhas, atualiza baselines, registra learnings e dispara acoes de melhoria.

Diferenca de ag-Q-22: ag-Q-22 testa se fluxos FUNCIONAM. ag-Q-40 testa se outputs tem QUALIDADE.
Diferenca de ag-D-38: ag-D-38 verifica se deploy esta VIVO. ag-Q-40 avalia se conteudo gerado e BOM.
Diferenca de ag-Q-41: ag-Q-41 CRIA cenarios. ag-Q-40 EXECUTA e orquestra PDCA.

## Invocacao

```
/ag-Q-40 https://app.vercel.app                    # Todos os cenarios, threshold 6
/ag-Q-40 https://app.vercel.app QAT-04             # Cenario especifico
/ag-Q-40 https://app.vercel.app all 7              # Threshold customizado
```

## Pre-requisitos

1. Estrutura `tests/qat/` no projeto (copiar de `~/.claude/shared/templates/qat/`)
2. Auth state valido (`tests/e2e/.auth/user.json`)
3. `QAT_JUDGE_API_KEY` ou `ANTHROPIC_API_KEY` configurado
4. URL da app acessivel

## Ciclo PDCA

```
PLAN: Preflight + carregar KB (baselines, failure-patterns, learnings)
DO:   Executar cenarios 4 camadas (L1 Smoke → L2 Func → L3 Quality → L4 Business)
      Short-circuit: se L1/L2 falha, skip Judge (~30% economia)
CHECK: Classificar falhas (INFRA/FEATURE/QUALITY/BUSINESS/RUBRIC/FLAKY)
       Comparar com baselines, detectar regressoes e flaky
ACT:   Atualizar baselines, registrar failure patterns, adicionar learnings
       Gerar report PDCA com acoes tomadas
```

## Output

- `tests/qat/results/YYYY-MM-DD-HHmmss/` com subdiretorios por cenario
- Cada cenario: `screenshot.png`, `output.*`, `evaluation.json`
- Sumario: `summary.json` + `report.md`

## Custo

~$0.25-0.60 por run (10 cenarios). Execucao manual ou schedule semanal recomendado.

## Interacao com outros agentes

- ag-Q-22: Complementar (E2E testa fluxos, QAT testa qualidade)
- ag-D-27: Pos-deploy (QAT apos deploy para validar qualidade)
- ag-D-38: Sequencial (smoke primeiro, QAT depois se smoke passa)
- ag-Q-41: Complementar (ag-Q-41 cria cenarios, ag-Q-40 executa PDCA)

## Referencia

- Agent completo: `~/.claude/agents/ag-Q-40-testar-qualidade.md`
- Pattern: `~/.claude/shared/patterns/quality-acceptance-testing.md`
- Templates: `~/.claude/shared/templates/qat/`
- SPEC original: `/tmp/raiz-platform-git/docs/specs/QAT-SPEC.md`

