# DOC-1: Zeev — Integracao via API Nativa v2

> Referencia tecnica para integracao com Zeev BPM via API REST nativa.
> Data: 2026-03-24

## Visao Geral

O Zeev expoe duas APIs distintas:

| API | Base URL | Auth | Uso |
|-----|----------|------|-----|
| **API Dados** (metabase) | `https://{tenant}.{host}/api-dados` | `X-API-Key` header | Consulta de dados extraidos (financeiro, etc.) |
| **API Nativa v2** | `https://{tenant}.zeev.it/api/2/` | `Bearer {token}` | CRUD de instancias, tarefas, fluxos, impersonacao |

## API Nativa v2 — Endpoints

### Autenticacao

```
GET /api/2/tokens
→ { userId, username } (verifica token)
```

### Impersonacao (service account → usuario)

```
GET /api/2/tokens/impersonate/{email}
Authorization: Bearer {SERVICE_TOKEN}
→ {
    current: { id, name, username, temporaryToken },
    impersonate: { id, name, username, temporaryToken }
  }
```

- Token temporario dura ~10min
- Cache recomendado: 8min TTL
- Permite que o backend aja em nome do usuario sem saber a senha dele
- Cada usuario so ve dados que tem permissao no Zeev

### Assignments (Tarefas Pendentes)

```
GET /api/2/assignments              → ZeevAssignment[]
GET /api/2/assignments/user/{email}/count → { count: number }
GET /api/2/assignments/{id}/actions  → acoes disponiveis
PUT /api/2/assignments/{id}          → finalizar tarefa (body: { actionId? })
POST /api/2/assignments/forward      → encaminhar (body: { assignmentId, userId })
```

### Instances (Solicitacoes/Processos)

```
GET /api/2/instances                → ZeevInstance[]
GET /api/2/instances/{id}           → ZeevInstance
```

### Admin (service account direto)

```
POST /api/2/assignments/report/count → { total, onTime, late } (SLA overview)
POST /api/2/assignments/report       → ZeevAssignment[] (body: { page, itemsPerPage })
GET  /api/2/flows/edit               → Flow[] (fluxos ativos)
GET  /api/2/groups                   → ZeevGroup[]
```

### Health

```
GET /api-dados/health → { status, api: { name, version }, database: { connected, dialect, host } }
```

## API Dados — Endpoints Financeiros

```
GET /api-dados/financeiro                  → lista paginada (limit, offset, status, data_inicio, data_fim)
GET /api-dados/financeiro/{id}             → instancia por numero_solicitacao
GET /api-dados/financeiro/stats/resumo     → estatisticas agregadas
```

**Resposta paginada:**
```json
{
  "success": true,
  "total": 1234,
  "limit": 100,
  "offset": 0,
  "count": 100,
  "data": [...]
}
```

## Env Vars

| Variavel | Descricao |
|----------|-----------|
| `ZEEV_API_BASE_URL` | URL da API de dados (default: `https://metabases.{org}/api-dados`) |
| `ZEEV_API_KEY` | Chave de API para API de dados |
| `ZEEV_NATIVE_API_URL` | URL da API nativa v2 (default: `https://{org}.zeev.it`) |
| `ZEEV_SERVICE_TOKEN` | Token de service account para impersonacao |

## Modelo de Dados

### Instancia Financeira (API Dados)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `numero_solicitacao` | int | ID unico |
| `tipo_solicitacao` | string | Tipo do processo |
| `versao` | int? | Versao do fluxo |
| `simulacao` | string? | "Sim" / "Nao" |
| `data_solicitacao` | string? | Data de abertura |
| `data_conclusao` | string? | Data de fechamento |
| `status_solicitacao` | string | Status atual |
| `resultado_solicitacao` | string? | Resultado final |
| `solicitante_id` | int? | ID do solicitante |
| `solicitante_nome` | string? | Nome |
| `solicitante_email_notif` | string? | Email de notificacao |
| `solicitante_email_usuario` | string? | Email do usuario |
| `time_solicitante` | string? | Time/departamento |
| `lead_time_dias` | number? | Lead time em dias |
| `classificacao_chamados` | string? | Classificacao |
| `task_name` | string? | Tarefa atual |
| `task_start` | string? | Inicio da tarefa |
| `task_expected_end` | string? | Fim esperado |
| `responsavel_tarefa` | string? | Responsavel |

### Assignment (Tarefa — API Nativa)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | number | ID da tarefa |
| `taskName` | string | Nome da tarefa |
| `requestName` | string? | Nome da solicitacao |
| `late` | boolean | Atrasada? |
| `active` | boolean | Ativa? |
| `startDateTime` | string? | Inicio |
| `expirationDateTime` | string? | Vencimento |
| `assignee` | Person? | Responsavel (id, name, email) |
| `flow` | Flow? | Fluxo (id, name, flowCode) |
| `instance` | { id, uid }? | Instancia pai |
| `service` | { id, name, code }? | Servico |

### Instance (Solicitacao — API Nativa)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | number | ID |
| `requestName` | string | Nome |
| `confirmationCode` | string? | Codigo de confirmacao |
| `simulation` | boolean | Simulacao? |
| `active` | boolean | Ativa? |
| `flowResult` | string? | Resultado |
| `startDateTime` | string? | Inicio |
| `endDateTime` | string? | Fim |
| `leadTimeInDays` | number? | Lead time |
| `flow` | Flow? | Fluxo |
| `formFields` | FormField[]? | Campos do formulario |
| `requester` | Person? | Solicitante |
| `instanceTasks` | Task[]? | Tarefas da instancia |

## Patterns de Integracao

### Impersonacao (recomendado para multi-usuario)
1. Backend autentica com service account (`ZEEV_SERVICE_TOKEN`)
2. Para cada request de usuario: impersona via `/api/2/tokens/impersonate/{email}`
3. Cache do token temporario (8min TTL)
4. Todas as chamadas retornam dados scoped ao usuario impersonado

### Cache
- **Token cache**: 8min TTL (tokens duram ~10min)
- **Response cache**: 2min TTL (dados mudam com frequencia)
- **API Dados cache**: 5min TTL (dados extraidos, menos volateis)

### Retry + Timeout
- Timeout hard: 10s por request (wall-clock, nao socket idle)
- Retry: max 2 tentativas em 401 (token expirado) e 5xx (server error)
- Nao retry em 404 (usuario nao encontrado)
- Exponential backoff: 1s, 2s, 4s

### Gotchas
- API Nativa retorna arrays ou `{ data: [...] }` — handler deve aceitar ambos
- Fluxos inativos: prefixo `DESATIVADO` no nome — filtrar no client
- Node `fetch` mangles `%` em headers — usar `https.get` nativo para API nativa
- Token de service account expira — health check via `GET /api/2/tokens`
