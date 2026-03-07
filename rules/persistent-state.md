---
description: "Regras de persistencia de estado em disco durante trabalho"
paths:
  - "**/*"
---

# Protocolo de Estado Persistente

## Principio Manus
Context Window = RAM (volatil). Filesystem = Disco (persistente).
Tudo importante vai pro disco DURANTE o trabalho, nao no final.

## Regra dos 20 Actions
A cada 20 tool calls, PARE e:
1. Atualize docs/ai-state/session-state.json com progresso atual
2. Se encontrou erro critico → atualize docs/ai-state/errors-log.md

## Regra de Re-Leitura
A cada 30 tool calls, PARE e:
1. Re-leia o plano (task_plan.md ou SPEC.md)
2. Se desviou → corrija o curso

## Formato session-state.json
{
  "last_updated": "ISO-8601",
  "agent_active": "builder|debugger|etc",
  "task_description": "O que esta sendo feito",
  "progress": {
    "completed": ["item 1"],
    "in_progress": "item atual",
    "remaining": ["item 3"]
  },
  "files_modified": ["path/to/file1.ts"],
  "notes": "Contexto para proxima sessao"
}

## Recuperacao de Sessao
Quando detectar sessao anterior:
1. Ler session-state.json
2. Ler errors-log.md
3. git log --oneline -10
4. Oferecer: "Encontrei sessao anterior. Retomar?"

## Context Reset Protocol
Quando contexto atingir ~60k tokens:
1. Salvar estado em session-state.json
2. Sugerir /clear
3. Apos clear, ler estado e continuar
