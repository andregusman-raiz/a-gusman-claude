# DOC-3: Zeev — Schemas e Modelos de Dados

> Todos os schemas Zod definidos no projeto, com campos, tipos e descrições.
> Data: 2026-03-24

---

## 1. API Nativa v2 — Schemas (zeev-native.schema.ts)

### 1.1 ZeevPerson

Representa uma pessoa no Zeev (solicitante, responsável, etc.)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | Sim | ID do usuário |
| `name` | string | Sim | Nome completo |
| `email` | string | Não | Email |
| `username` | string | Não | Login/username |

### 1.2 ZeevFlow

Fluxo/processo do Zeev.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | Sim | ID do fluxo |
| `version` | number | Não | Versão do fluxo |
| `name` | string | Não | Nome do fluxo |
| `flowCode` | string | Não | Código identificador |

### 1.3 ZeevService (ZeevServiceInfo)

Serviço vinculado ao fluxo.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | Não | ID do serviço |
| `name` | string | Não | Nome |
| `code` | string | Não | Código |

### 1.4 ZeevAssignment

Tarefa pendente (assignment) de um usuário.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | Sim | ID da tarefa |
| `taskLink` | string | Não | Link para a tarefa no Zeev |
| `taskName` | string | Sim | Nome da etapa/tarefa |
| `requestName` | string | Não | Nome da solicitação pai |
| `late` | boolean | Sim | Se está atrasada |
| `active` | boolean | Sim | Se está ativa |
| `startDateTime` | string \| null | Sim | Data/hora de início |
| `expirationDateTime` | string \| null | Sim | Data/hora de vencimento (SLA) |
| `assignee` | ZeevPerson | Não | Responsável pela tarefa |
| `flow` | ZeevFlow | Não | Fluxo ao qual pertence |
| `instance` | `{ id: number, uid?: string }` | Não | Instância (solicitação) pai |
| `service` | ZeevServiceInfo | Não | Serviço vinculado |

### 1.5 ZeevFormField

Campo de formulário preenchido em uma instância.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | Não | ID do campo |
| `name` | string | Não | Nome/label do campo |
| `value` | unknown | — | Valor preenchido (string, number, array, etc.) |
| `fieldId` | string | Não | Identificador técnico do campo |

### 1.6 ZeevInstanceTask

Tarefa dentro de uma instância (histórico de etapas).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | Não | ID da tarefa |
| `taskName` | string | Não | Nome da etapa |
| `active` | boolean | Não | Se está ativa |
| `startDateTime` | string \| null | Não | Início |
| `endDateTime` | string \| null | Não | Fim |
| `assignee` | ZeevPerson | Não | Responsável |

### 1.7 ZeevInstance

Instância de processo (solicitação).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | Sim | ID da instância |
| `masterInstanceId` | number \| null | Não | ID da instância pai (subprocessos) |
| `starterInstanceId` | number \| null | Não | ID da instância que iniciou esta |
| `requestName` | string | Sim | Nome da solicitação |
| `reportLink` | string | Não | Link para relatório/auditoria no Zeev |
| `confirmationCode` | string | Não | Código de confirmação (ticket) |
| `uid` | string | Não | UID único |
| `simulation` | boolean | Sim | Se é simulação |
| `active` | boolean | Sim | Se está ativa |
| `flowResult` | string \| null | Não | Resultado do fluxo (ex: "Aprovado", "Reprovado") |
| `flowResultId` | number \| null | Não | ID do resultado |
| `startDateTime` | string \| null | Sim | Data/hora de início |
| `endDateTime` | string \| null | Sim | Data/hora de conclusão |
| `lastFinishedTaskDateTime` | string \| null | Não | Data da última tarefa finalizada |
| `leadTimeInDays` | number \| null | Não | Lead time em dias |
| `flow` | ZeevFlow | Não | Fluxo ao qual pertence |
| `service` | ZeevServiceInfo | Não | Serviço vinculado |
| `formFields` | ZeevFormField[] | Não | Campos do formulário preenchidos |
| `requester` | ZeevPerson | Não | Solicitante |
| `instanceTasks` | ZeevInstanceTask[] | Não | Tarefas/etapas da instância |

### 1.8 ZeevGroup

Grupo organizacional.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | Sim | ID do grupo |
| `name` | string | Sim | Nome |
| `code` | string | Não | Código |

### 1.9 ZeevImpersonateResponse

Resposta da impersonação.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `current.id` | number | ID da conta de serviço |
| `current.name` | string | Nome da conta de serviço |
| `current.username` | string | Username da conta de serviço |
| `current.temporaryToken` | string | Token temporário da conta de serviço |
| `impersonate.id` | number | ID do usuário impersonado |
| `impersonate.name` | string | Nome do usuário impersonado |
| `impersonate.username` | string | Username do usuário impersonado |
| `impersonate.temporaryToken` | string | Token temporário para agir como o usuário |

---

## 2. API Dados — Schemas (zeev.schema.ts)

### 2.1 ZeevFinanceiroInstance

Instância financeira extraída pela API de dados.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `numero_solicitacao` | int | Sim | ID único da solicitação |
| `tipo_solicitacao` | string | Sim | Tipo do processo/fluxo |
| `versao` | int | Não | Versão do fluxo |
| `simulacao` | string | Não | "Sim" ou "Não" |
| `data_solicitacao` | string \| null | — | Data de abertura (YYYY-MM-DD) |
| `data_conclusao` | string \| null | — | Data de fechamento |
| `horario_solicitacao` | string \| null | — | Horário de abertura |
| `horario_finalizacao` | string \| null | — | Horário de finalização |
| `status_solicitacao` | string | Sim | Status atual do processo |
| `resultado_solicitacao` | string \| null | — | Resultado final |
| `solicitante_id` | int \| null | — | ID do solicitante |
| `solicitante_nome` | string \| null | — | Nome do solicitante |
| `solicitante_email_notif` | string \| null | — | Email de notificação |
| `solicitante_email_usuario` | string \| null | — | Email do usuário |
| `time_solicitante` | string \| null | — | Time/departamento |
| `lead_time_dias` | number \| null | — | Lead time em dias |
| `classificacao_chamados` | string \| null | — | Classificação do chamado |
| `responsavel_cancelamento_id` | int \| null | — | ID de quem cancelou |
| `responsavel_cancelamento_nome` | string \| null | — | Nome de quem cancelou |
| `report_link` | string \| null | — | Link para relatório |
| `task_name` | string \| null | — | Nome da tarefa atual |
| `task_start` | string \| null | — | Início da tarefa atual |
| `task_expected_end` | string \| null | — | Fim esperado da tarefa |
| `responsavel_tarefa` | string \| null | — | Responsável pela tarefa atual |

### 2.2 ZeevListResponse

Resposta paginada da API de dados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | boolean | Se a requisição foi bem-sucedida |
| `total` | int | Total de registros |
| `limit` | int | Limite por página |
| `offset` | int | Offset atual |
| `count` | int | Quantidade retornada nesta página |
| `data` | ZeevFinanceiroInstance[] | Instâncias |

### 2.3 ZeevStatsResponse

Estatísticas agregadas (schema flexível).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | boolean | Se a requisição foi bem-sucedida |
| `stats` | Record<string, unknown> | Estatísticas (schema aberto — passthrough) |

### 2.4 ZeevHealthResponse

Health check da API intermediária.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `status` | string | "healthy" ou outro |
| `api.name` | string | Nome da API |
| `api.version` | string | Versão |
| `database.connected` | boolean | Se DB está conectado |
| `database.dialect` | string | Tipo de DB |
| `database.host` | string | Host do DB |
| `database.port` | number | Porta |
| `database.database` | string | Nome do banco |

### 2.5 ZeevQueryParams

Parâmetros de consulta para listar instâncias financeiras.

| Campo | Tipo | Default | Validação |
|-------|------|---------|-----------|
| `limit` | int | 100 | 1-1000 |
| `offset` | int | 0 | ≥ 0 |
| `status` | string | — | Livre |
| `data_inicio` | string | — | Regex YYYY-MM-DD |
| `data_fim` | string | — | Regex YYYY-MM-DD |

### 2.6 ZeevErrorResponse

Resposta de erro da API.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | false | Sempre false |
| `error` | string | Mensagem de erro |

---

## 3. Env Vars Completas

| Variável | Tipo | Usada por | Descrição |
|----------|------|-----------|-----------|
| `ZEEV_NATIVE_API_URL` | URL | zeev-proxy.service.ts | Base URL da API nativa v2 |
| `ZEEV_SERVICE_TOKEN` | string | zeev-proxy.service.ts | Token de service account para impersonação |
| `ZEEV_API_BASE_URL` | URL | zeev.service.ts | Base URL da API de dados (metabases) |
| `ZEEV_API_KEY` | string | zeev.service.ts | Chave de API para dados financeiros |
| `N8N_ZEEV_DASHBOARD_WORKFLOW_ID` | string | zeev-metabase-setup.service.ts | ID do workflow n8n para setup Metabase |
| `METABASE_SITE_URL` | URL | zeev-metabase-setup.service.ts | URL do Metabase |
| `METABASE_SECRET_KEY` | string | zeev-metabase-setup.service.ts | Chave secreta do Metabase |
| `NEXT_PUBLIC_ZEEV_DASHBOARD_ID` | string | client-side | ID do dashboard Metabase (público) |
