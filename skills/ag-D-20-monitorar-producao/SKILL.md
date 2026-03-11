---
name: ag-D-20-monitorar-producao
description: "Monitora saude pos-deploy, detecta degradacao e aciona rollback. Use after each deploy and when there are problem reports. SRE monitoring."
model: sonnet
argument-hint: "[URL de producao]"
disable-model-invocation: true
---

# ag-D-20 — Monitorar Producao

Spawn the `ag-D-20-monitorar-producao` agent to monitor post-deploy production health, detect degradation, and trigger rollback if needed.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-D-20-monitorar-producao`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD]
URL: [URL de producao]
Deploy timestamp: [timestamp do ultimo deploy, se conhecido]

$ARGUMENTS

## Output
- Health monitoring report: error rate, latency P95, CPU/memory, 5xx count
- Recomendacao de rollback se degradacao detectada
- Alertas enviados via N8N/Sentry se thresholds ultrapassados

Monitore a saude do sistema em producao. Verifique error rate, latencia P95, CPU, memoria e 5xx responses.
Fontes: Vercel logs, Sentry, Grafana. Reporte alertas e recomende rollback se necessario.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Runs in background — user will be notified when monitoring completes
- After spawning, confirm to the user
