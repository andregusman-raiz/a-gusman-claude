---
name: ag-monitorar-producao
description: "Monitora saude pos-deploy, detecta degradacao e aciona rollback. Use after each deploy and when there are problem reports. SRE monitoring."
model: sonnet
argument-hint: "[URL de producao]"
disable-model-invocation: true
---

# ag-monitorar-producao — Monitorar Producao

Spawn the `ag-monitorar-producao` agent to monitor post-deploy production health, detect degradation, and trigger rollback if needed.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-monitorar-producao`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD]
URL: [URL de producao]
Deploy timestamp: [timestamp do ultimo deploy, se conhecido]


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

## Health Endpoints Checklist

| Check | Comando | Threshold |
|-------|---------|-----------|
| Homepage | `curl -s -o /dev/null -w "%{http_code}" URL` | 200 |
| API health | `curl -s URL/api/health` | 200 + JSON |
| Response time | `curl -s -o /dev/null -w "%{time_total}" URL` | < 3s |
| SSL cert | `curl -vI URL 2>&1 \| grep "expire"` | > 30 days |

## SLA Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99.5% |
| Response P95 | < 2s | > 5s |
| Error rate | < 1% | > 5% |
| 5xx count | 0/hour | > 10/hour |

## Decision Tree: Rollback

```
Degradacao detectada?
├── Error rate > 10% por 5min → ROLLBACK IMEDIATO (com aprovacao)
├── P95 latency > 10s por 10min → ROLLBACK (com aprovacao)
├── 5xx > 50/hour → ROLLBACK (com aprovacao)
├── Error rate 5-10% → ALERTAR usuario, monitorar 10min
├── P95 2-5s → WARNING, nao rollback
└── Metricas normais → PASS
```

## Integracoes

- **Sentry**: `sentry-cli issues list --project [project]` — erros recentes
- **Grafana**: Dashboard em `https://iaraizedu.grafana.net/` — traces e metricas
- **Vercel**: `vercel logs --follow` — logs em tempo real

## Anti-Patterns
- NUNCA fazer rollback sem aprovacao do usuario
- NUNCA ignorar error rate crescente — tendencia e mais importante que valor absoluto
- NUNCA declarar "producao estavel" sem verificar pelo menos 15min de metricas

## Escalacao: Issue para Incidentes

Se degradacao detectada (error rate > 5% ou P95 > 5s por > 10min):

```
Agent({
  subagent_type: "ag-registrar-issue",
  name: "issue-registrar",
  model: "haiku",
  run_in_background: true,
  prompt: "Repo: [detectar]\nOrigem: ag-monitorar-producao\nSeveridade: P0-critical\nTitulo: [INCIDENT] descricao da degradacao\nContexto: [metricas coletadas, thresholds violados, timestamp inicio, acoes tomadas (rollback?)]\nArquivos: []\nLabels: incident, production"
})
```

- Error rate > 10% ou rollback executado → P0, SEMPRE criar issue
- Error rate 5-10% sustentado → P1, criar issue como warning
- Metricas normais → nenhuma issue

## Quality Gate
- [ ] Todos os endpoints de saude verificados?
- [ ] Metricas de SLA coletadas (response time, error rate)?
- [ ] Decisao de rollback documentada (se aplicavel)?
- [ ] Alertas enviados via webhook (se threshold ultrapassado)?
- [ ] Incidentes registrados como GitHub Issues via ag-registrar-issue?
