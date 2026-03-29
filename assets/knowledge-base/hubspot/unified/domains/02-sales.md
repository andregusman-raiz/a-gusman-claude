# Sales Hub

> Pipeline de vendas: negócios, cotações, previsões, agendamentos, tarefas, metas, split de deals.

---

## Specs OpenAPI (11 specs, 129 endpoints)

| Spec | Endpoints | Tamanho | Descrição |
|------|-----------|---------|-----------|
| appointments | 17 | 390KB | CRM Appointments |
| forecasts | 17 | 388KB | CRM Forecasts |
| goal_targets | 17 | 137KB | Goal Targets |
| quotes | 17 | 138KB | Quotes |
| tasks | 17 | 136KB | CRM Tasks |
| pipelines | 14 | 221KB | Pipelines |
| calls | 11 | 63KB | Calls |
| meetings | 11 | 62KB | Meetings |
| sequences | 4 | 29KB | Sequences |
| deal_splits | 2 | 20KB | CRM Deal Splits |
| forecast_types | 2 | 10KB | CRM Forecast Types |

---

## Regras e Padrões

- Pipeline de vendas com stages configuráveis (probabilidade por stage)
- Forecasts por período e categoria (commit, pipeline, best case)
- Quotes geram documentos de proposta vinculados ao deal
- Tasks e meetings são atividades rastreáveis no timeline
- Sequences: cadeia automatizada de emails para prospecção

---

## Integração raiz-platform

Ver `unified/integration.json` para routes, types, env vars e OAuth scopes configurados.

*Specs OpenAPI completos em `raw/specs/` — usar para implementação detalhada de endpoints.*
