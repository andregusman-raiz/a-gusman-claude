# Agent Tool Cookbook — zeev_bpm

> 10 ações disponíveis no agent tool `zeev_bpm` do raiz-platform.

---

## Ações do Usuário (requer impersonation)

### list_assignments
Lista tarefas pendentes do usuário logado. Retorna tabela markdown.
```
"Quais tarefas eu tenho pendentes?"
→ zeev_bpm.list_assignments
```

### list_instances
Lista solicitações do usuário. Retorna tabela markdown.
```
"Quais solicitações eu abri?"
→ zeev_bpm.list_instances
```

### get_instance
Detalhe completo de uma solicitação: formFields + histórico.
```
"Me mostra a solicitação #12345"
→ zeev_bpm.get_instance { id: 12345 }
```

### search_ticket
Busca por código, ID ou nome.
```
"Procura a solicitação do João sobre férias"
→ zeev_bpm.search_ticket { query: "João férias" }
```

### get_actions
Ações disponíveis para uma tarefa (completar, devolver, etc.).
```
"O que posso fazer com a tarefa #789?"
→ zeev_bpm.get_actions { assignmentId: 789 }
```

---

## Ações Admin (service account)

### sla_overview
Total/on-time/late com percentuais.
```
"Como está o SLA geral?"
→ zeev_bpm.sla_overview
```

### backlog_by_area
Top 15 fluxos com mais tarefas pendentes.
```
"Quais áreas têm mais backlog?"
→ zeev_bpm.backlog_by_area
```

### backlog_by_person
Top 20 pessoas com mais tarefas pendentes.
```
"Quem está mais sobrecarregado?"
→ zeev_bpm.backlog_by_person
```

### aging_report
Distribuição por idade: 0-7d, 7-30d, 30-90d, 90d+.
```
"Tem tarefas velhas paradas?"
→ zeev_bpm.aging_report
```

### flow_list
Processos ativos (filtrados sem "DESATIVADO").
```
"Quais processos estão ativos?"
→ zeev_bpm.flow_list
```

---

## Limites

- Timeout global: 12s
- Retry: 2x em 401/5xx
- SLA report: max 500 items
- Output: markdown tables formatadas em PT-BR
