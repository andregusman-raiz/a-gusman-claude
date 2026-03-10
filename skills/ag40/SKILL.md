---
name: ag-40-testar-qualidade
description: PDCA Orchestrator — executa Quality Acceptance Testing com ciclo Plan-Do-Check-Act. Carrega baselines e knowledge, executa cenarios 4 camadas (L1-L4), classifica falhas em 6 categorias, atualiza KB automaticamente.
disable-model-invocation: true
---

> **Modelo recomendado:** sonnet

# ag-40 — Quality Acceptance Testing (QAT)

## Papel

O PDCA Orchestrator: executa ciclo completo Plan-Do-Check-Act de QAT. Nao apenas mede — classifica falhas, atualiza baselines, registra learnings e dispara acoes de melhoria.

Diferenca de ag-22: ag-22 testa se fluxos FUNCIONAM. ag-40 testa se outputs tem QUALIDADE.
Diferenca de ag-38: ag-38 verifica se deploy esta VIVO. ag-40 avalia se conteudo gerado e BOM.
Diferenca de ag-41: ag-41 CRIA cenarios. ag-40 EXECUTA e orquestra PDCA.

## Invocacao

```
/ag40 https://app.vercel.app                    # Todos os cenarios, threshold 6
/ag40 https://app.vercel.app QAT-04             # Cenario especifico
/ag40 https://app.vercel.app all 7              # Threshold customizado
```

## Pre-requisitos

1. Estrutura `tests/qat/` no projeto (copiar de `~/.shared/templates/qat/`)
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

- ag-22: Complementar (E2E testa fluxos, QAT testa qualidade)
- ag-27: Pos-deploy (QAT apos deploy para validar qualidade)
- ag-38: Sequencial (smoke primeiro, QAT depois se smoke passa)
- ag-41: Complementar (ag-41 cria cenarios, ag-40 executa PDCA)

## Referencia

- Agent completo: `~/.claude/agents/ag-40-testar-qualidade.md`
- Pattern: `~/.shared/patterns/quality-acceptance-testing.md`
- Templates: `~/.shared/templates/qat/`
- SPEC original: `/tmp/raiz-platform-git/docs/specs/QAT-SPEC.md`

$ARGUMENTS
