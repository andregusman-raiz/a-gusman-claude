---
description: "Regras de gestao de contexto para eficiencia de sessao"
paths:
  - "**/*"
---

# Context Management

## /clear — Obrigatorio
Entre tarefas NAO relacionadas, SEMPRE executar `/clear`.
Contexto acumulado de tarefa anterior polui a proxima.

## /compact — Proativo
A 60% do context window (quando respostas comecam a ficar mais curtas ou genericas):
1. Executar `/compact` com foco no trabalho atual
2. Incluir: "Preserve: lista de arquivos modificados, task atual, comandos de teste"

## Subagents para Exploracao
Investigacao de codebase (buscar arquivos, entender estrutura) SEMPRE em subagent.
Motivo: cada subagent recebe 200K de context separado, nao polui o principal.

## Sinais de Context Pressure
- Respostas ficam mais curtas/genericas
- Claude "esquece" instrucoes dadas anteriormente
- Repeticao de perguntas ja respondidas
- Acao: /compact imediatamente, ou /clear + retomar de session-state.json
