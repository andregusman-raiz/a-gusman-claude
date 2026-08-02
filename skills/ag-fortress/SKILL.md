---
name: ag-fortress
description: "Orquestrador supremo. Roda MERIDIAN+SENTINEL+ARCHITECT+CONDUCTOR+LIGHTHOUSE em sequencia. Modo --include-harness adiciona dimensao HARNESS (HCS) auditando o proprio Claude Code. Fortress Score (FS) = laudo completo."
model: sonnet
disable-model-invocation: true
visibility: internal
context: fork
argument-hint: "[URL ou path] [--skip machine] [--threshold N] [--include-harness | --harness-only]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage, Skill
metadata:
  filePattern: "fortress-*.json,fortress-*.md,harness-audit-*.md"
  bashPattern: "fortress"
  priority: 99
---

# FORTRESS — Laudo Completo de Software

```
/fortress ~/Claude/GitHub/raiz-platform              # Completo (5 maquinas)
/fortress https://app.example.com                     # Parcial (MERIDIAN + SENTINEL)
/fortress ~/Claude/GitHub/salarios-platform --skip sentinel  # Pular maquina
/fortress ~/Claude/GitHub/raiz-platform --include-harness    # 6 maquinas (FS6)
/fortress --harness-only                              # So auditoria do harness local
```

## Modo 5D (default)
Roda em sequencia: MERIDIAN → SENTINEL → ARCHITECT → CONDUCTOR → LIGHTHOUSE.
Consolida Fortress Score (FS) = MQS*0.25 + SSS*0.25 + AQS*0.20 + DXS*0.15 + OBS*0.15.

## Modo 6D (--include-harness)
Adiciona dimensao HARNESS apos as 5 originais — invoca `ag-auditar-harness`.
FS6 = MQS*0.22 + SSS*0.22 + AQS*0.18 + DXS*0.13 + OBS*0.13 + HCS*0.12.

Quando usar 6D:
- Trimestral (audit de saude do proprio sistema)
- Apos adicao de >3 skills/hooks novos
- Sob suspeita de drift, redundancia, prompt injection
- Pre-merge de PR que toca `.claude/` (R9 de `harness-coverage.md`)

## Modo --harness-only
Pula 5 maquinas tradicionais — so roda HARNESS. Util para audit pontual do
proprio Claude Code sem precisar de app/path target.

```
Skill({ skill: "ag-auditar-harness", args: "$ARGUMENTS" })
```

Produz Fortress Report unificado com radar chart e top findings cross-machine.
Se HARNESS rodou: anexa `docs/diagnosticos/harness-audit-YYYY-MM-DD.md`.
