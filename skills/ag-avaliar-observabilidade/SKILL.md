---
name: ag-avaliar-observabilidade
description: "Maquina autonoma de observabilidade. 5D (ERRORS/LOGS/METRICS/ALERTS/TRACES), Sentry, logging, Web Vitals, alertas, OTEL. OBS >= 75."
model: opus
context: fork
argument-hint: "[URL ou path] [--threshold N] [--resume]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList
metadata:
  filePattern: "lighthouse-*.json,lighthouse-*.md"
  bashPattern: "lighthouse"
  priority: 90
---

# LIGHTHOUSE — Observabilidade

```
/lighthouse ~/Claude/GitHub/raiz-platform
/lighthouse https://raiz.app
```

5 dimensoes: ERRORS (Sentry), LOGS (structured), METRICS (Web Vitals), ALERTS (health+uptime), TRACES (OTEL).
Local + URL. Produz Observability Certificate + Lighthouse Scores + Fix PR.
