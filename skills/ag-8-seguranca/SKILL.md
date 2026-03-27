---
name: ag-8-seguranca
description: "Maquina autonoma de seguranca (wrapper SENTINEL). Security + load testing + LGPD compliance. 6 dimensoes, modo hybrid, convergencia SSS >= 80. Security Certificate."
model: opus
context: fork
argument-hint: "[URL ou path] [--threshold N] [--audit-only] [--resume]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "sentinel-state.json,sentinel-*.md"
  bashPattern: "seguranca|sentinel|security"
  priority: 94
---

# SEGURANCA — Maquina Autonoma de Seguranca (SENTINEL)

## Invocacao

```
/seguranca https://app.example.com
/seguranca ~/Claude/GitHub/raiz-platform
/seguranca --audit-only ~/Claude/GitHub/raiz-platform
/seguranca --resume
```

## O que faz

Delega para **ag-sentinel (SENTINEL)** — seguranca, load testing e LGPD:

6 dimensoes: SHIELD, GATES, WALLS, VAULT, STRESS, GUARD
Modo hybrid (defensive + offensive)
Convergencia: SSS >= 80

Produz: Security Certificate, Load Report, Fix PR.

## Implementacao

```
Agent({
  subagent_type: "ag-sentinel",
  prompt: "[input completo do usuario]",
  model: "opus",
  run_in_background: true
})
```
