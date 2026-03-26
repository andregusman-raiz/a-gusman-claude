---
name: ag-9-auditar
description: "Auditoria completa de software (wrapper FORTRESS). Roda MERIDIAN + SENTINEL + ARCHITECT + CONDUCTOR + LIGHTHOUSE em sequencia. Fortress Score = laudo completo."
model: opus
context: fork
argument-hint: "[URL ou path] [--resume]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "fortress-state.json,fortress-*.md"
  bashPattern: "auditar|fortress|audit"
  priority: 93
---

# AUDITAR — Laudo Completo de Software (FORTRESS)

## Invocacao

```
/auditar https://app.example.com
/auditar ~/Claude/GitHub/raiz-platform
/auditar --resume
```

## O que faz

Delega para **ag-fortress (FORTRESS)** — roda 5 maquinas em sequencia:

1. **MERIDIAN** (qualidade, MQS)
2. **SENTINEL** (seguranca, SSS)
3. **ARCHITECT** (arquitetura, AQS)
4. **CONDUCTOR** (developer experience, DXS)
5. **LIGHTHOUSE** (observabilidade, OBS)

Fortress Score = MQS*0.25 + SSS*0.25 + AQS*0.20 + DXS*0.15 + OBS*0.15

Produz: Laudo completo, scores por dimensao, action items.

## Implementacao

```
Agent({
  subagent_type: "ag-fortress",
  prompt: "[input completo do usuario]",
  model: "opus",
  run_in_background: true
})
```
