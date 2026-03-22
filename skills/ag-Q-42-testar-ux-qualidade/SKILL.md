---
name: ag-Q-42-testar-ux-qualidade
description: UX-QAT PDCA Orchestrator — executa Visual Quality Acceptance Testing com ciclo Plan-Do-Check-Act. Captura screenshots por breakpoint/tema, avalia com AI Judge multimodal, classifica falhas visuais, atualiza KB automaticamente.
model: sonnet
context: fork
argument-hint: "[projeto-path] [--layers=L1,L2,L3,L4] [--calibrate]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
---

# ag-Q-42 — UX-QAT Visual Quality Testing

## Papel

O PDCA Orchestrator de qualidade visual: executa ciclo completo Plan-Do-Check-Act de UX-QAT. Avalia telas em 4 camadas (L1 Renderizacao → L2 Interacao → L3 Percepcao Visual → L4 Compliance) com AI Judge multimodal.

Diferenca de ag-Q-40: ag-Q-40 avalia CONTEUDO. ag-Q-42 avalia VISUAL/UX.
Diferenca de ag-Q-22: ag-Q-22 testa FLUXOS. ag-Q-42 testa QUALIDADE VISUAL.
Diferenca de ag-Q-16: ag-Q-16 review pontual. ag-Q-42 avaliacao CONTINUA com PDCA.

## Invocacao

```
/ag-Q-42 https://app.vercel.app                          # Todas as telas, threshold 6
/ag-Q-42 https://app.vercel.app dashboard                # Tela especifica
/ag-Q-42 https://app.vercel.app all --layers=L1,L2,L4    # Sem L3 (economia)
/ag-Q-42 https://app.vercel.app all 7                    # Threshold customizado
```

## Pre-requisitos

1. Estrutura `tests/ux-qat/` no projeto (copiar de `~/.claude/shared/templates/ux-qat/`)
2. `tests/ux-qat/design-tokens.json` configurado
3. `playwright-cli` instalado
4. URL da app acessivel
5. Para L3: `ANTHROPIC_API_KEY` configurado

## Ciclo PDCA

```
PLAN: Preflight + carregar KB (baselines, failure-patterns, design tokens)
DO:   Capturar screenshots por breakpoint × tema
      Executar 4 camadas (L1 Render → L2 Interaction → L3 Perception → L4 Compliance)
      Short-circuit: se L1 falha, skip L2-L4 (~30% economia)
CHECK: Classificar falhas (RENDER/INTERACTION/PERCEPTION/COMPLIANCE/RUBRIC/FLAKY)
       Comparar com baselines, detectar regressoes visuais
ACT:   Atualizar baselines, registrar failure patterns, adicionar learnings
       Gerar report PDCA com acoes tomadas
```

## Output

- `tests/ux-qat/results/YYYY-MM-DD-HHmmss/` com screenshots e reports
- Cada capture point: `screen-bp-theme.png`, `axe.json`, `lighthouse.json`
- Sumario: `summary.json` + `report.md`

## Custo

- L1+L2+L4: ~$0.00 (programatico)
- L3 (AI Judge): ~$0.05-0.10 por screenshot, ~$2-4 por run completo (10 telas × 4 breakpoints)
- Tiered execution recomendada: L1+L2+L4 every deploy, L3 semanal/on-demand

## Interacao com outros agentes

- ag-Q-16: Complementar (ag-Q-16 pontual, ag-Q-42 continuo com PDCA)
- ag-Q-22: Complementar (E2E testa fluxos, UX-QAT testa qualidade visual)
- ag-D-27: Pos-deploy (UX-QAT apos deploy para validar visual)
- ag-D-38: Sequencial (smoke primeiro, UX-QAT depois se smoke passa)
- ag-Q-40: Paralelo (ag-Q-40 conteudo, ag-Q-42 visual — dominios separados)
- ag-Q-43: Complementar (ag-Q-43 cria cenarios, ag-Q-42 executa PDCA)

## Referencia

- Agent completo: `~/.claude/agents/ag-Q-42-testar-ux-qualidade.md`
- Patterns: `~/.claude/shared/patterns/ux-qat-*.md`
- Templates: `~/.claude/shared/templates/ux-qat/`
- SPEC: `~/Claude/docs/specs/SPEC-UX-QAT.md`

