---
name: ag-criar-cenario-ux-qat
description: "[INTERNAL — invocada via ag-4-teste-final] Cria cenarios UX-QAT de alta qualidade. Mapeia telas, seleciona rubrics visuais, define interacoes criticas, captura golden screenshots e documenta anti-patterns visuais."
model: sonnet
argument-hint: "[nome-da-tela]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
visibility: internal
---

# ag-criar-cenario-ux-qat — Criar Cenario UX-QAT (INTERNAL)

> **Internal skill** — invocada automaticamente por `ag-4-teste-final ux-qat` via Agent tool. Não use diretamente via `/`. Para criar cenário UX-QAT use `/ag-4-teste-final ux-qat [url]`.

## Papel

O Scenario Designer de qualidade visual: transforma telas em cenarios UX-QAT com rubrics visuais, interacoes mapeadas, golden screenshots e anti-patterns documentados.

Diferenca de ag-testar-ux-qualidade: ag-testar-ux-qualidade EXECUTA cenarios. ag-criar-cenario-ux-qat CRIA cenarios novos.
Diferenca de ag-criar-cenario-qat: ag-criar-cenario-qat cria cenarios de CONTEUDO. ag-criar-cenario-ux-qat cria cenarios VISUAIS.
Diferenca de ag-revisar-ux: ag-revisar-ux review pontual. ag-criar-cenario-ux-qat cenario permanente e sistematico.

## Invocacao

```
/ag-criar-cenario-ux-qat screen="/dashboard" type="dashboard"
/ag-criar-cenario-ux-qat screen="/login" type="auth-flow" interacoes="password-toggle,oauth-click"
/ag-criar-cenario-ux-qat setup                                    # Setup UX-QAT no projeto
/ag-criar-cenario-ux-qat scan                                     # Detectar telas e sugerir cenarios
```

## Pre-requisitos

1. Estrutura `tests/ux-qat/` no projeto (copiar de `~/.claude/shared/templates/ux-qat/`)
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

- ag-testar-ux-qualidade: Complementar — ag-criar-cenario-ux-qat cria, ag-testar-ux-qualidade executa
- ag-implementar-codigo: Pos-build — quando ag-implementar-codigo constroi tela nova, ag-criar-cenario-ux-qat cria cenario UX-QAT
- ag-revisar-codigo: Code review — ag-revisar-codigo verifica se PR com tela nova inclui cenario UX-QAT
- ag-revisar-ux: Complementar — ag-revisar-ux review pontual, ag-criar-cenario-ux-qat cenario permanente
- ag-11-ux-ui: Knowledge source para guidelines e rubric design

## Referencia

- Agent completo: `~/.claude/agents/ag-criar-cenario-ux-qat.md`
- Patterns: `~/.claude/shared/patterns/ux-qat-*.md`
- Templates: `~/.claude/shared/templates/ux-qat/`
- SPEC: `~/Claude/docs/specs/SPEC-UX-QAT.md`

