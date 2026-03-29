# Financeiro (API Dados)

> API customizada da Raíz (não é Zeev nativo). Fornece dados financeiros agregados de solicitações Zeev via metabases.

---

## Conceitos-Chave

- API separada: metabases.raizeducacao.com.br/api-dados (não é raizeducacao.zeev.it)
- Autenticação: X-API-Key (diferente do Bearer da API nativa)
- Endpoints: GET /financeiro (list), GET /financeiro/{id}, GET /financeiro/stats/resumo
- Paginação: limit + offset (diferente da API nativa)
- Cache: in-memory, 500 max entries, 5min TTL

---

## Endpoints (0)

| Método | Path | Descrição |
|--------|------|-----------|
| — | — | API customizada (não no OpenAPI Zeev) — ver integration.json |

---

## Integração raiz-platform

Implementado: zeev.service.ts (completo). Routes: /api/zeev, /api/zeev/{id}, /api/zeev/stats.

Ver `unified/integration.json` para routes, env vars e agent tool actions.
