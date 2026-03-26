# MERIDIAN Quality Certificate

## Resumo
- **Projeto**: {{project_name}}
- **Data**: {{date}}
- **MQS Final**: {{mqs}}/100
- **Status**: {{status}} (CONVERGED | FORCE_STOP | AUDIT_ONLY)
- **Ciclos executados**: {{cycles}}
- **Issues encontradas**: {{total_issues}}
- **Issues corrigidas**: {{fixed_issues}}
- **Issues pendentes**: {{remaining_issues}}

---

## Scores por Dimensao

| Dimensao | Score | Status | Descricao |
|----------|-------|--------|-----------|
| D1-ALIVE | {{d1_score}} | {{d1_status}} | Paginas carregam sem erros |
| D2-REAL  | {{d2_score}} | {{d2_status}} | Dados sao reais (nao mock) |
| D3-WORKS | {{d3_score}} | {{d3_status}} | Features funcionam corretamente |
| D4-LOOKS | {{d4_score}} | {{d4_status}} | Visual correto em 4 viewports |
| D5-FEELS | {{d5_score}} | {{d5_status}} | Perspectiva do cliente |

---

## Convergencia

```
{{convergence_graph}}
```

---

## Client Judge (D5-FEELS)

> {{client_narrative}}

---

## Rotas Testadas

| Rota | Prioridade | D1 | D2 | D3 | D4 | D5 |
|------|-----------|----|----|----|----|------|
{{routes_table}}

---

## Issues Corrigidas

{{fixed_issues_list}}

---

## Issues Pendentes (requer intervencao humana)

{{pending_issues_list}}

---

## Screenshots Finais

{{screenshots}}

---

*Gerado por MERIDIAN (ag-M-60) em {{timestamp}}*
