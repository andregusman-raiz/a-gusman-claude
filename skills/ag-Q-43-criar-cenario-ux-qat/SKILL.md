---
name: ag-Q-43-criar-cenario-ux-qat
description: Cria cenarios UX-QAT de alta qualidade. Mapeia telas, seleciona rubrics visuais, define interacoes criticas, captura golden screenshots e documenta anti-patterns visuais.
model: sonnet
argument-hint: "[nome-da-tela]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
---

# ag-Q-43 — Criar Cenario UX-QAT

## Papel

O Scenario Designer de qualidade visual: transforma telas em cenarios UX-QAT com rubrics visuais, interacoes mapeadas, golden screenshots e anti-patterns documentados.

Diferenca de ag-Q-42: ag-Q-42 EXECUTA cenarios. ag-Q-43 CRIA cenarios novos.
Diferenca de ag-Q-41: ag-Q-41 cria cenarios de CONTEUDO. ag-Q-43 cria cenarios VISUAIS.
Diferenca de ag-Q-16: ag-Q-16 review pontual. ag-Q-43 cenario permanente e sistematico.

## Invocacao

```
/ag-Q-43 screen="/dashboard" type="dashboard"
/ag-Q-43 screen="/login" type="auth-flow" interacoes="password-toggle,oauth-click"
/ag-Q-43 setup                                    # Setup UX-QAT no projeto
/ag-Q-43 scan                                     # Detectar telas e sugerir cenarios
```

## Pre-requisitos

1. Estrutura `tests/ux-qat/` no projeto (copiar de `~/.shared/templates/ux-qat/`)
2. `tests/ux-qat/design-tokens.json` configurado
3. `tests/ux-qat/rubrics/` com rubrics disponiveis

## Ciclo de Criacao

```
Phase 0: Preflight (estrutura UX-QAT, contexto do projeto, tipo de tela)
Phase 1: Selecionar/criar rubric visual
Phase 2: Definir interacoes L2 (click, hover, focus, scroll)
Phase 3: Capturar golden screenshots (ou marcar PENDING)
Phase 4: Documentar anti-patterns visuais (3-5 tipos)
Phase 5: Criar arquivos (context.md, interactions.ts, journey.spec.ts)
Phase 6: Registrar em ux-qat.config.ts
Phase 7: Validacao (completude, report)
```

## Output

- `tests/ux-qat/scenarios/[screen]/context.md` (contexto e design intent)
- `tests/ux-qat/scenarios/[screen]/interactions.ts` (interacoes L2)
- `tests/ux-qat/scenarios/[screen]/journey.spec.ts` (config da tela)
- `tests/ux-qat/knowledge/golden-screenshots/[screen]/` (screenshots ref)
- `tests/ux-qat/knowledge/anti-patterns/[screen].md` (contra-exemplos visuais)
- `tests/ux-qat/rubrics/[type].rubric.ts` (se criada/copiada)
- `tests/ux-qat/ux-qat.config.ts` atualizado

## Interacao com outros agentes

- ag-Q-42: Complementar — ag-Q-43 cria, ag-Q-42 executa
- ag-B-08: Pos-build — quando ag-B-08 constroi tela nova, ag-Q-43 cria cenario UX-QAT
- ag-Q-14: Code review — ag-Q-14 verifica se PR com tela nova inclui cenario UX-QAT
- ag-Q-16: Complementar — ag-Q-16 review pontual, ag-Q-43 cenario permanente
- ag-B-52-design-ui-ux: Knowledge source para guidelines e rubric design

## Referencia

- Agent completo: `~/.claude/agents/ag-Q-43-criar-cenario-ux-qat.md`
- Patterns: `~/.shared/patterns/ux-qat-*.md`
- Templates: `~/.shared/templates/ux-qat/`
- SPEC: `~/Claude/docs/specs/SPEC-UX-QAT.md`

