---
name: ag-avaliar-observabilidade
description: "Maquina autonoma de observabilidade. 5D (ERRORS/LOGS/METRICS/ALERTS/TRACES), Sentry, logging, Web Vitals, alertas, OTEL. OBS >= 75."
model: sonnet
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

**METRICS (Web Vitals) — fonte canonica = `chrome-devtools-mcp`** (nao estimar): rodar `chrome-devtools-mcp:debug-optimize-lcp` na URL viva para LCP/CLS/INP reais + long tasks; `chrome-devtools-mcp:memory-leak-debugging` quando a suspeita for crescimento de heap. So cair em `bunx lighthouse` se nao houver browser MCP disponivel. Gatilhos e fronteira vs Playwright: `.claude/rules/chrome-devtools-proativo.md`.
