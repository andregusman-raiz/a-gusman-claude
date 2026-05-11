# DOC-2: Zeev — Mapa Completo de Acesso via raiz-platform

> Inventário detalhado de todos os recursos Zeev acessíveis via APIs na raiz-platform.
> Data: 2026-03-24

---

## 1. Visão Geral das APIs

A raiz-platform acessa o Zeev por **duas APIs independentes** + **uma tool de agent**:

| # | API | Base URL | Auth | Escopo |
|---|-----|----------|------|--------|
| 1 | **API Nativa v2** (Proxy) | `https://raizeducacao.zeev.it/api/2/` | Bearer `ZEEV_SERVICE_TOKEN` + impersonação | Tarefas, solicitações, fluxos, grupos, SLA |
| 2 | **API Dados** (Metabases) | `https://metabases.raizeducacao.com.br/api-dados` | Header `X-API-Key` (`ZEEV_API_KEY`) | Dados financeiros extraídos |
| 3 | **Agent Tool** (`zeev_bpm`) | Interna (via agent service) | Impersonação do usuário logado | Interface conversacional para as APIs acima |

---

## 2. API Nativa v2 — Endpoints por Contexto

### 2.1 Autenticação e Impersonação

| Endpoint | Método | Auth | Retorno |
|----------|--------|------|---------|
| `/api/2/tokens` | GET | Bearer service token | `{ userId, username }` — health check do token |
| `/api/2/tokens/impersonate/{email}` | GET | Bearer service token | `{ current: { id, name, username, temporaryToken }, impersonate: { id, name, username, temporaryToken } }` |

**Mecânica de impersonação:**
- Service token é de conta admin, permanente (mas pode expirar)
- Token temporário do usuário impersonado dura ~10min
- Cache no backend: 8min TTL
- Todas as consultas subsequentes usam o token temporário
- Dados retornados são scoped às permissões do usuário no Zeev

### 2.2 Assignments (Tarefas Pendentes) — Contexto do Usuário

| Endpoint | Método | Auth | Retorno | Descrição |
|----------|--------|------|---------|-----------|
| `/api/2/assignments` | GET | Bearer token impersonado | `ZeevAssignment[]` | Tarefas pendentes do usuário |
| `/api/2/assignments/user/{email}/count` | GET | Bearer token impersonado | `{ count: number }` | Contagem de tarefas |
| `/api/2/assignments/{id}/actions` | GET | Bearer token impersonado | `unknown[]` | Ações possíveis para finalizar |
| `/api/2/assignments/{id}` | PUT | Bearer token impersonado | `unknown` | Finalizar tarefa (body: `{ actionId? }`) |
| `/api/2/assignments/forward` | POST | Bearer token impersonado | `unknown` | Encaminhar (body: `{ assignmentId, userId }`) |

### 2.3 Instances (Solicitações/Processos) — Contexto do Usuário

| Endpoint | Método | Auth | Retorno | Descrição |
|----------|--------|------|---------|-----------|
| `/api/2/instances` | GET | Bearer token impersonado | `ZeevInstance[]` | Solicitações do usuário |
| `/api/2/instances/{id}` | GET | Bearer token impersonado | `ZeevInstance` | Detalhe com formFields e tasks |

### 2.4 Admin (Service Account Direto)

| Endpoint | Método | Auth | Retorno | Descrição |
|----------|--------|------|---------|-----------|
| `/api/2/assignments/report/count` | POST | Bearer service token | `{ total, onTime, late }` | SLA overview global |
| `/api/2/assignments/report` | POST | Bearer service token | `ZeevAssignment[]` | Relatório paginado (body: `{ page, itemsPerPage }`) |
| `/api/2/flows/edit` | GET | Bearer service token | `Flow[]` | Lista de fluxos (filtra prefixo "DESATIVADO") |
| `/api/2/groups` | GET | Bearer service token | `ZeevGroup[]` | Grupos organizacionais |

### 2.5 Dados Derivados (calculados no backend a partir do report)

| Dado | Fonte | Cálculo |
|------|-------|---------|
| Backlog por fluxo | `assignments/report` (500 items) | Agrupa por `flow.name`, conta total + late |
| Backlog por pessoa | `assignments/report` (500 items) | Agrupa por `assignee.email`, conta total + late, top N |
| Aging distribution | `assignments/report` (500 items) | Buckets: 0-7d, 7-30d, 30-90d, 90d+ baseado em `startDateTime` |
| Tarefa mais antiga | `assignments/report` (500 items) | Max days desde `startDateTime` |

---

## 3. API Dados (Metabases) — Endpoints Financeiros

| Endpoint | Método | Auth | Retorno | Descrição |
|----------|--------|------|---------|-----------|
| `/financeiro` | GET | X-API-Key | `ZeevListResponse` (paginado) | Lista de instâncias financeiras |
| `/financeiro/{id}` | GET | X-API-Key | `ZeevFinanceiroInstance` | Instância por `numero_solicitacao` |
| `/financeiro/stats/resumo` | GET | X-API-Key | `ZeevStatsResponse` | Estatísticas agregadas |
| `/health` | GET | Nenhuma | `ZeevHealthResponse` | Status da API intermediária |

**Parâmetros de query (GET /financeiro):**

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| `limit` | int (1-1000) | 100 | Itens por página |
| `offset` | int (≥0) | 0 | Offset de paginação |
| `status` | string | — | Filtro por `status_solicitacao` |
| `data_inicio` | string (YYYY-MM-DD) | — | Data início |
| `data_fim` | string (YYYY-MM-DD) | — | Data fim |

---

## 4. Agent Tool (`zeev_bpm`)

O agente de IA da plataforma expõe uma tool unificada `zeev_bpm` com 10 ações:

### 4.1 Ações do Usuário (requerem impersonação)

| Action | Parâmetros | O que faz |
|--------|-----------|-----------|
| `list_assignments` | — | Lista tarefas pendentes em tabela markdown |
| `list_instances` | — | Lista solicitações em tabela markdown |
| `get_instance` | `instanceId: number` | Detalhe completo de uma instância |
| `search_ticket` | `query: string` | Busca por confirmationCode, ID numérico ou nome |
| `get_actions` | `assignmentId: number` | Lista ações disponíveis para finalizar tarefa |

### 4.2 Ações Admin (service account direto)

| Action | Parâmetros | O que faz |
|--------|-----------|-----------|
| `sla_overview` | — | Total, no prazo, atrasadas com percentuais |
| `backlog_by_area` | — | Backlog agrupado por fluxo (processo) |
| `backlog_by_person` | — | Top 20 pessoas com mais tarefas pendentes |
| `aging_report` | — | Distribuição de envelhecimento (0-7d, 7-30d, etc.) |
| `flow_list` | — | Lista de processos/fluxos ativos |

### 4.3 Comportamentos de Segurança

- Timeout global: 12s por invocação da tool
- Retry interno: 2 tentativas em 401 (token expirado) e 5xx
- Timeout por request: 10s (wall-clock)
- Ações de usuário requerem email autenticado (impersonação)
- Ações admin usam service token direto
- Mensagens de erro user-friendly em PT-BR

---

## 5. Rotas da API raiz-platform (Next.js)

### 5.1 API Dados (financeiro)

| Rota | Método | Auth | Descrição |
|------|--------|------|-----------|
| `GET /api/zeev` | GET | withAuth (sessão) | Lista instâncias financeiras com filtros |
| `GET /api/zeev/{id}` | GET | withAuth (sessão) | Instância financeira por ID |
| `GET /api/zeev/stats` | GET | withAuth (sessão) | Estatísticas resumidas |

### 5.2 Proxy (API Nativa)

| Rota | Método | Auth | Descrição |
|------|--------|------|-----------|
| `GET /api/zeev/proxy/health` | GET | Nenhuma | Health check do service token |
| `GET /api/zeev/proxy/assignments` | GET | createRouteHandler + getAuthUser | Tarefas do usuário logado |
| `GET /api/zeev/proxy/instances` | GET | createRouteHandler + getAuthUser | Solicitações do usuário logado |
| `GET /api/zeev/proxy/instances/{id}` | GET | createRouteHandler + getAuthUser | Instância específica |
| `GET /api/zeev/proxy/assignments/{id}/actions` | GET | createRouteHandler + getAuthUser | Ações de uma tarefa |
| `PUT /api/zeev/proxy/assignments/{id}/actions` | PUT | createRouteHandler + getAuthUser | Finalizar tarefa |

### 5.3 Admin / Setup

| Rota | Método | Auth | Descrição |
|------|--------|------|-----------|
| `GET /api/zeev/diagnostic` | GET | withAuth (sessão) | Diagnóstico completo da integração |
| `GET /api/zeev/setup-dashboard` | GET | requireSuperAdmin | Info de configuração do dashboard Metabase |
| `POST /api/zeev/setup-dashboard` | POST | requireSuperAdmin | Criar dashboard Metabase via n8n |
| `PUT /api/zeev/setup-dashboard` | PUT | requireSuperAdmin | Registrar dashboard existente |

### 5.4 UI

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/admin/zeev-indicators` | Page (React) | Dashboard de indicadores Zeev (admin) |

---

## 6. Integrações Adjacentes

### 6.1 Metabase (BI)

- Dashboard de indicadores criado via n8n → Metabase API
- 20 cards distribuídos em 4 abas: Volume, Lead Time, Performance, Trends
- Env vars: `METABASE_SITE_URL`, `METABASE_SECRET_KEY`, `N8N_ZEEV_DASHBOARD_WORKFLOW_ID`
- Tabela de registro: `bi_dashboards` (Supabase)

### 6.2 N8N (Automação)

- Workflow de setup do dashboard Metabase
- Workflow ID configurado em `N8N_ZEEV_DASHBOARD_WORKFLOW_ID`
- Execução via `getN8nService().executeWorkflow()`

### 6.3 Litigation (Contencioso)

- `case-ingestion.service.ts` referencia Zeev como fonte de dados
- Adapter Jusbrasil menciona integração com fluxos Zeev
