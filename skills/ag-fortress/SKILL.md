---
name: ag-fortress
description: "Orquestrador supremo. Roda MERIDIAN+SENTINEL+ARCHITECT+CONDUCTOR+LIGHTHOUSE em sequencia. Fortress Score (FS) = laudo completo do software."
model: opus
context: fork
argument-hint: "[URL ou path] [--skip machine] [--threshold N]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "fortress-*.json,fortress-*.md"
  bashPattern: "fortress"
  priority: 99
---

# FORTRESS — Laudo Completo de Software

```
/fortress ~/Claude/GitHub/raiz-platform              # Completo (5 maquinas)
/fortress https://app.example.com                     # Parcial (MERIDIAN + SENTINEL)
/fortress ~/Claude/GitHub/salarios-platform --skip sentinel  # Pular maquina
```

Roda em sequencia: MERIDIAN → SENTINEL → ARCHITECT → CONDUCTOR → LIGHTHOUSE.
Consolida Fortress Score (FS) = MQS*0.25 + SSS*0.25 + AQS*0.20 + DXS*0.15 + OBS*0.15.
Produz Fortress Report unificado com radar chart e top findings cross-machine.
