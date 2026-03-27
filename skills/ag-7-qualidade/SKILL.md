---
name: ag-7-qualidade
description: "Maquina autonoma de qualidade (wrapper MERIDIAN). Descobre app, testa 5 dimensoes (ALIVE/REAL/WORKS/LOOKS/FEELS), corrige, re-testa ate convergencia MQS >= 85. Quality Certificate."
model: opus
context: fork
argument-hint: "[URL ou path] [--threshold N] [--audit-only] [--resume] [--scope rotas]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "meridian-state.json,meridian-*.md"
  bashPattern: "qualidade|meridian|quality"
  priority: 95
---

# QUALIDADE — Maquina Autonoma de Qualidade (MERIDIAN)

## Invocacao

```
/qualidade https://app.example.com
/qualidade ~/Claude/GitHub/raiz-platform
/qualidade https://app.example.com --threshold 90
/qualidade --audit-only https://app.example.com
/qualidade --resume
```

## O que faz

Delega para **ag-meridian (MERIDIAN)** — a maquina autonoma de QA com 5 fases:

1. **PRE-FLIGHT**: Detecta modo (URL vs local), verifica recursos
2. **SCOUT**: Descobre app, mapeia rotas, detecta auth
3. **SIEGE**: Testa 5 dimensoes (ALIVE, REAL, WORKS, LOOKS, FEELS)
4. **FORGE**: Corrige bugs encontrados (ciclo convergente)
5. **DELIVER**: Quality Certificate, baselines, Fix PR

Convergencia: MQS >= threshold (default 85). Max 5 ciclos.

## Implementacao

Este skill delega diretamente para ag-meridian:

```
Agent({
  subagent_type: "ag-meridian",
  prompt: "[input completo do usuario]",
  model: "opus",
  run_in_background: true
})
```

Toda a logica, state management e convergencia estao em ag-meridian.
