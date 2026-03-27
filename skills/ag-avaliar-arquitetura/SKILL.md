---
name: ag-avaliar-arquitetura
description: "Maquina autonoma de saude arquitetural. 5D (STRUCTURE/COUPLING/DEBT/PATTERNS/SCALE), imports circulares, tech debt, consistencia. AQS >= 80."
model: opus
context: fork
argument-hint: "[path do projeto] [--threshold N] [--audit-only] [--resume]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList
metadata:
  filePattern: "architect-*.json,architect-*.md"
  bashPattern: "architect"
  priority: 90
---

# ARCHITECT — Saude Arquitetural

```
/architect ~/Claude/GitHub/raiz-platform
/architect ~/Claude/GitHub/salarios-platform --threshold 90
```

5 dimensoes: STRUCTURE (camadas), COUPLING (dependencias), DEBT (tech debt), PATTERNS (consistencia), SCALE (performance).
So modo local. Produz Architecture Certificate + Tech Debt Register + Fix PR.
