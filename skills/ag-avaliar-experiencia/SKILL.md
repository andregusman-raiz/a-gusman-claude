---
name: ag-avaliar-experiencia
description: "Maquina autonoma de Developer Experience. 5D (SETUP/DOCS/TYPES/TESTS/CI), onboarding em 10min, docs, TypeScript DX, testes, CI. DXS >= 80."
model: opus
context: fork
argument-hint: "[path do projeto] [--threshold N] [--resume]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList
metadata:
  filePattern: "conductor-*.json,conductor-*.md"
  bashPattern: "conductor"
  priority: 90
---

# CONDUCTOR — Developer Experience

```
/conductor ~/Claude/GitHub/raiz-platform
/conductor ~/Claude/GitHub/salarios-platform --threshold 85
```

5 dimensoes: SETUP (onboarding time), DOCS (README/CLAUDE.md), TYPES (TS strict), TESTS (passam, rapidos), CI (pipeline).
So modo local. Produz DX Certificate + Onboarding Time + Fix PR.
