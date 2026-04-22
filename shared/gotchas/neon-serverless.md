# Gotchas: Neon Serverless (PostgreSQL)

## P0 Incident: Large Query Timeout (2026-04-05)

SELECT em 41K-row result set sem LIMIT via Railway → timeout silencioso, bloqueou sync HubSpot por 15+ min.
Nenhum progresso impresso — falhou silenciosamente na fase de fetch.

## Regras

### Nunca single-shot em tabelas grandes

Tabelas que EXIGEM paginação (>10K rows):

| Tabela | Rows (aprox.) |
|--------|--------------|
| hubspot_contact | 518K |
| hubspot_deal | 335K |
| hubspot_lead_raiz | 57K |
| hubspot_totvs_match | 41K |
| pbi_painel_matriculas | 32K |

### Pagination pattern obrigatório

```python
OFFSET = 0
BATCH = 1000  # max 5000, default 1000
while True:
    rows = query(
        f"SELECT ... ORDER BY id LIMIT {BATCH} OFFSET {OFFSET}"
    )
    if not rows:
        break
    process(rows)
    OFFSET += BATCH
    print(f"Processed {OFFSET} rows...")  # progress obrigatório
```

### Quando usar psql direto vs Railway API

| Cenário | Usar |
|---------|------|
| Queries rotineiras, sync, reports | Railway API (`/query/execute`) — mas SEMPRE paginar |
| Admin ops (UPDATE, DELETE, DDL) | psql direto |
| Queries < 1000 rows | Qualquer um |
| Railway sobrecarregado/lento | psql direto |

### Cold start awareness

Neon serverless tem cold start de 2-5s na primeira query da sessão.
NÃO interpretar cold start como timeout — aguardar resposta antes de assumir falha.

### Gotcha: OFFSET em tabelas grandes

Para tabelas com 100K+ rows, OFFSET alto (>50K) degrada performance.
Alternativa: cursor-based pagination com `WHERE id > last_seen_id ORDER BY id LIMIT 1000`.
