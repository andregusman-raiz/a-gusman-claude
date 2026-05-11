# Guia: Padrões de Integração TOTVS RM

> Consolidação de DOC-1 (API REST), DOC-9 (lições aprendidas), DOC-10 (solicitações TI).

---

## 3 Formas de Acessar Dados

| Método | Quando Usar | Latência | Limitações |
|--------|------------|----------|------------|
| **REST API** | Dados educacionais simples, cadastros | ~200ms | Apenas 7/55 endpoints funcionam; paginação max 250 |
| **SOAP DataServer** | Dados complexos, múltiplas tabelas, escrita | ~500ms | Requer VPN ou whitelist IP; JWT expira em 5min |
| **SQL Direto** | Analytics, relatórios, bulk | ~50ms | Requer VPN; read-only recomendado; firewall pode bloquear |

---

## REST API

### Autenticação
```
Authorization: Basic base64(username:password)
```
Ou JWT Bearer (300s TTL, auto-refresh 30s antes de expirar).

### Dois padrões de URL REST

**1. REST API moderna** (endpoints dedicados, poucos funcionando):
```
GET /api/{modulo}/v1/{recurso}
```

**2. REST DataServer** (acesso direto a qualquer DataServer):
```
GET    /RMSRestDataServer/rest/{DataServer}?limit=50&start=0&filter=CAMPO=VALOR
GET    /RMSRestDataServer/rest/{DataServer}/{id}
POST   /RMSRestDataServer/rest/{DataServer}
PUT    /RMSRestDataServer/rest/{DataServer}/{id}
DELETE /RMSRestDataServer/rest/{DataServer}/{id}
```
IDs compostos: `CODCOLIGADA$_$CAMPO2$_$CAMPO3` (ex: `1$_$00278`)

> Ver [api-dictionary.md](api-dictionary.md) para lista completa de DataServers por módulo.

### Endpoints API moderna que funcionam (7/55)
- `GET /api/educational/v1/StudentContexts`
- `GET /api/educational/v1/ProfessorContexts`
- `GET /api/educational/v1/Professors/{id}/disciplineclasses`
- `GET /api/educational/v1/Professors/{id}/timetable`
- `GET /api/educational/v1/Academics/terms`
- `GET /api/educational/v1/Professors/{id}/disciplineclasses/{id}/students`

### Paginação
Max 250 items/page. Respostas: `{ hasNext, total, items }`.

---

## SOAP DataServer

### Operações
- `ReadRecord` — 1 registro por PK
- `ReadRecords` — Paginada com filtro SQL
- `SaveRecord` — Criação/atualização
- `DeleteRecord` — Exclusão

### Gotchas Críticos (DOC-9)
1. **VPN obrigatória** — SOAP não funciona fora da rede TOTVS Cloud
2. **JWT expira em 5min** — implementar refresh 30s antes
3. **Dual-token**: JWT Bearer para REST, Basic para SOAP
4. **`internalId` encoding**: IDs compostos separados por `;`
5. **Concorrência**: max 15 chamadas SOAP simultâneas (licença)
6. **CODCOLIGADA obrigatório** em toda query

---

## SQL Direto

### Regras de Segurança (DOC-16/17)
- **Read-only SEMPRE** — nunca INSERT/UPDATE/DELETE
- Risk scoring 0-100 — queries complexas são limitadas
- PII detection e mascaramento automático
- Scoping CODCOLIGADA automático
- Timeout max 3min, reduzido para alto risco

### Performance
- `NOLOCK` em SELECT (evita lock contention)
- Evitar `SELECT *` (PFunc tem 524 campos)
- `TOP N` automático

---

## Padrões de Código

- Retry: 2 tentativas, backoff exponencial (1s → 3s)
- Concorrência SOAP: semáforo max 15
- Delta sync: MD5 hash para evitar writes desnecessários
- Paginação: 50 items/page (SOAP), 250 items/page (REST)
