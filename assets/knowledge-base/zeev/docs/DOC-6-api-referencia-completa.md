# DOC-6: Zeev API v2 — Referência Completa

> Referência detalhada de TODOS os 98 endpoints da API REST v2 do Zeev,
> extraída do OpenAPI spec oficial (raizeducacao.zeev.it).
> Inclui parâmetros, tipos, modelos de dados e status codes.
> Data: 2026-03-24

---

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **Base URL** | `https://raizeducacao.zeev.it` |
| **Versão** | 2.0 |
| **Protocolo** | HTTPS |
| **Autenticação** | Bearer token via header `Authorization` |
| **Formato** | JSON |
| **OData** | Suporta filtros OData (`$filter`, `$orderby`, `$top`, `$skip`) |
| **Rate Limiting** | Sim (HTTP 429 em excesso) |

### Status Codes Comuns

| Code | Significado |
|------|-------------|
| 200 | Sucesso |
| 400 | Dados inválidos |
| 401 | Não autorizado (token inválido/expirado) |
| 403 | Sem permissão |
| 404 | Registro não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno |

### Paginação

Endpoints que retornam listas suportam:
- `pageNumber` (int): Número da página
- `recordsPerPage` (int): Registros por página

### Filtros OData

Endpoints com suporte a OData aceitam query params:
- `$filter`: Filtro de registros (ex: `$filter=active eq true`)
- `$orderby`: Ordenação (ex: `$orderby=startDateTime desc`)
- `$top`: Limitar resultados
- `$skip`: Pular registros
- `$select`: Selecionar campos
- `$expand`: Expandir relacionamentos

---

## ASSIGNMENTS

### GET `/api/2/assignments`
**Listar as atribuições de atividades pendentes da pessoa relacionada ao token de autenticação (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `pageNumber` | query | integer | Não | Indicação do número da página para paginação de registros |
| `recordsPerPage` | query | integer | Não | Indicação do número de registros a serem retornados |
| `flowId` | query | integer | Não | Código identificador do processo a ser filtrado |
| `serviceId` | query | integer | Não | Código identificador dao serviço a ser filtrado |
| `appCode` | query | string | Não | Código identificador do aplicativo de processos a ser filtrado |
| `mobileEnabledOnly` | query | boolean | Não | Indicativo se devem ser listadas somente as atividades que podem ser concluidas via mobile |

---

### GET `/api/2/assignments/{assignmentid}`
**Obter uma atribuição de atividade especifica (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `assignmentId` | path | integer | Sim | Identificador da atribuição de atividade |

---

### PUT `/api/2/assignments/{assignmentid}`
**Finalizar tarefa atribuída a uma pessoa por código identificador da atribuição de atividade (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `assignmentId` | path | integer | Sim | Identificador da atribuição de atividade |
| `instanceTaskEnvelope` | body | FinalizeInstanceTaskModel | Sim | - |

---

### GET `/api/2/assignments/{assignmentid}/actions`
**Listar as ações de conclusão possíveis de uma atribuição de atividade específica (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `assignmentId` | path | integer | Sim | Identificador da atribuição de atividade |

---

### POST `/api/2/assignments/forward`
**Encaminhar tarefas pendentes de um usuário para outro usuário (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `model` | body | ForwardTasksModel | Sim | - |

---

### PUT `/api/2/assignments/instance/{instanceid}/{code}`
**Finalizar tarefa atribuída a pessoa por código da instância e código original/integração ou apelido do elemento da tarefa pendente (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instanceId` | path | integer | Sim | Identificador instância |
| `code` | path | string | Sim | Código original / integração (apelido) do elemento pendente |
| `instanceTaskEnvelope` | body | FinalizeInstanceTaskModel | Sim | - |

---

### POST `/api/2/assignments/report`
**Listar todas atribuições de atividades pendentes do sistema de acordo com filtros (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `assignmentFilter` | body | GetAssignmentsModel | Sim | Documento com filtros e configurações solicitados para a consulta |

---

### POST `/api/2/assignments/report/count`
**Contar todas as atribuições de atividades pendentes do sistema de acordo com filtros (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `assignmentFilter` | body | CountAssignmentsModel | Sim | Documento com filtros e configurações solicitados para a consulta |

---

### GET `/api/2/assignments/user/{userid}`
**Listar as atividades atribuidas a uma pessoa por código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Indicação do código da pessoa cujas atribuições serão listadas |
| `pageNumber` | query | integer | Não | Indicação do número da página para paginação de registros |
| `recordsPerPage` | query | integer | Não | Indicação do número de registros a serem retornados |
| `flowId` | query | integer | Não | Código identificador do processo a ser filtrado |
| `serviceId` | query | integer | Não | Código identificador dao serviço a ser filtrado |
| `appCode` | query | string | Não | Código identificador do aplicativo de processos a ser filtrado |
| `mobileEnabledOnly` | query | boolean | Não | Indicativo se devem ser listadas somente as atividades que podem ser concluidas via mobile |

---

### GET `/api/2/assignments/user/{username}`
**Listar as atividades atribuidas a uma pessoa por username (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `username` | path | string | Sim | Indicação do username da pessoa cujas atribuições serão listadas |
| `pageNumber` | query | integer | Não | Indicação do número da página para paginação de registros |
| `recordsPerPage` | query | integer | Não | Indicação do número de registros a serem retornados |
| `flowId` | query | integer | Não | Código identificador do processo a ser filtrado |
| `serviceId` | query | integer | Não | Código identificador dao serviço a ser filtrado |
| `appCode` | query | string | Não | Código identificador do aplicativo de processos a ser filtrado |
| `mobileEnabledOnly` | query | boolean | Não | Indicativo se devem ser listadas somente as atribuições que podem ser concluidas via mobile |

---

### GET `/api/2/assignments/user/{username}/count`
**Contar as atividades atribuidas a uma pessoa por username (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `username` | path | string | Sim | Indicação do username da pessoa cujas atribuições serão listadas |
| `flowId` | query | integer | Não | Código identificador do processo a ser filtrado |
| `serviceId` | query | integer | Não | Código identificador dao serviço a ser filtrado |
| `appCode` | query | string | Não | Código identificador do aplicativo de processos a ser filtrado |
| `mobileEnabledOnly` | query | boolean | Não | Indicativo se devem ser listadas somente as atividades que podem ser concluidas via mobile |

---

## FILES

### POST `/api/2/files/createfile`
**Gerar um documento PDF ou DOCX populando-o com informações e variáveis da instância da solicitação**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `fileModel` | body | CreateFileModel | Sim | - |

---

### POST `/api/2/files/instance-task`
**Adicionar um anexo de no máximo 50mb a uma instância de tarefa por código identificador da instância da tarefa**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `file` | body | AddFileToInstanceTaskModel | Sim | Documento com arquivo a ser anexado |

---

## FLOWS

### GET `/api/2/flows/{flowid}/design/elements`
**Lista os elementos que compoem o design do aplicativo (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `flowId` | path | integer | Sim | Código identificador do aplicativo |

---

### GET `/api/2/flows/{flowid}/design/form`
**Lista os campos de formularios associados ao aplicativo (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `flowId` | path | integer | Sim | Código identificador do aplicativo |

---

### GET `/api/2/flows/{flowid}/design/users`
**Lista as pessoas que compõem o design do aplicativo (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `flowId` | path | integer | Sim | Código identificador do aplicativo |

---

### GET `/api/2/flows/{flowid}/export`
**Exportar um aplicativo para formato intercambiável (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `flowId` | path | integer | Sim | Código identificador do aplicativo |

---

### GET `/api/2/flows/edit`
**Lista de aplicativos que posso editar (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `flowId` | query | integer | Não | Código identificador do aplicativo |
| `flowName` | query | string | Não | Nome do aplicativo |
| `flowVersion` | query | integer | Não | Versão do aplicativo |
| `deploy` | query | boolean | Não | True para retornar aplicativos publicados ou False para não publicados |
| `categoryId` | query | integer | Não | Código identificador da categoria do aplicativo |

---

### POST `/api/2/flows/import`
**Importar um aplicativo a partir de formato intercambiável (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `model` | body | ImportFlowModel | Sim | - |

---

## FORMVALUES

### PATCH `/api/2/formvalues/{frominstanceid}/copy-to/{toinstanceid}`
**Copia os valores de campos de formulário entre instâncias (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `fromInstanceId` | path | integer | Sim | Código identificador da instância original |
| `toInstanceId` | path | integer | Sim | Código identificador da instância de destino |

---

### PATCH `/api/2/formvalues/{instanceid}`
**Atualizar campos de formulário da instância (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instanceId` | path | integer | Sim | Código identificador da instância da solicitação |
| `formValuesEnvelope` | body | UpdateFormValuesModel | Sim | Valores de campos do formulário |

---

### PATCH `/api/2/formvalues/{instanceid}/history/clear`
**Apaga o histórico do preenchimento dos campos do formulário em todas as tarefas concluídas, se o campo estiver em tabela todas as linhas serão apagadas (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instanceId` | path | integer | Sim | Código identificador da instância da solicitação |
| `formFieldsEnvelope` | body | ClearFormHistoryValuesModel | Sim | Nomes dos campos do formulário |

---

## GEO

### GET `/api/2/geo/countries`
**Lista todos os países cadastrados, com a opção de filtrar por palavra chave com similaridade pelo nome**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `name` | query | string | Não | Nome do país |

---

### GET `/api/2/geo/countries/{countryid}/states`
**Lista todos os estados de um país com a opção de filtrar por palavra chave com similaridade pelo nome do estado**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `countryId` | path | integer | Sim | Código do país |
| `name` | query | string | Não | Nome do estado |

---

### GET `/api/2/geo/states/{stateid}/cities`
**Lista todas as cidades de um estado com a opção de filtrar por palavra chave com similaridade pelo nome da cidade**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `stateId` | path | integer | Sim | Código do estado |
| `name` | query | string | Não | Nome da cidade |

---

## GROUPS

### GET `/api/2/groups`
**Listar todos os grupos de manutenção do sistema (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `name` | query | string | Não | Nome do grupo para filtro |

---

### GET `/api/2/groups/{groupid}`
**Obter grupo de manutenção pelo código identificador (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `groupId` | path | integer | Sim | Identificador do grupo |

---

### GET `/api/2/groups/{groupid}/permissions`
**Listar as permissões associadas ao grupo (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `groupId` | path | integer | Sim | Identificador do grupo |

---

### GET `/api/2/groups/{groupid}/users`
**Listar as pessoas vinculadas ao grupo (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `groupId` | path | integer | Sim | Identificador do grupo |

---

### GET `/api/2/groups/code/{groupcode}`
**Obter grupo de manutenção pelo código original / integração (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `groupCode` | path | string | Sim | Código original / integração do grupo |

---

### GET `/api/2/groups/code/{groupcode}/users`
**Listar as pessoas vinculadas ao grupo por código de original / integração (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `groupCode` | path | string | Sim | Código de original / integração do grupo |

---

## INSTANCES

### GET `/api/2/instances`
**Listar todas instâncias de solicitações em que a pessoa relacionada ao token é o requisitante**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instanceId` | query | integer | Não | Código identificador da instância da solicitação |
| `formFieldNames` | query | array | Não | Campos do formulário que devem ser retornados na consulta. Para mais de um, repita o parâmetro para cada campo a ser retornado. |
| `startDateBegin` | query | string | Não | Data inicial de intervalo de data de solicitação |
| `startDateEnd` | query | string | Não | Data final de intervalo de data de solicitação |
| `isActive` | query | boolean | Não | Indicação se a solicitação está em andamento ou não (já foi finalizada) |
| `showPendingInstanceTasks` | query | boolean | Não | Indicação se devem ser listadas as tarefas pendentes da solicitação nesse momento |
| `showFinishedInstanceTasks` | query | boolean | Não | Indicação se devem ser listadas as tarefas finalizadas da solicitação nesse momento |
| `showPendingAssignees` | query | boolean | Não | Indicação se devem ser listados os responsáveis pelas tarefas pendentes da solicitação nesse momento |
| `recordsPerPage` | query | integer | Não | Indicação do número de registros a serem retornados |
| `pageNumber` | query | integer | Não | Indicação do número da página para paginação de registros |
| `useCache` | query | boolean | Não | Indicação se a consulta pode vir do cache |

---

### POST `/api/2/instances`
**Criar uma nova instância de solicitação**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instancesEnvelope` | body | CreateInstancesModel | Sim | Dados para criar a solicitação |

---

### GET `/api/2/instances/{instanceid}`
**Obter dados da instância específica por código identificador da instância da solicitação**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instanceId` | path | integer | Sim | Código identificador da instância da solicitação |
| `formFieldNames` | query | array | Não | Campos do formulário que devem ser retornados na consulta. Para mais de um, repita o parâmetro para cada campo a ser retornado. |
| `showPendingInstanceTasks` | query | boolean | Não | Indicação se devem ser listadas as tarefas pendentes da solicitação nesse momento |
| `showFinishedInstanceTasks` | query | boolean | Não | Indicação se devem ser listadas as tarefas finalizadas da solicitação nesse momento |
| `showPendingAssignees` | query | boolean | Não | Indicação se devem ser listados os responsáveis pelas tarefas pendentes da solicitação nesse momento |
| `useCache` | query | boolean | Não | Indicação se a consulta pode vir do cache |

---

### PATCH `/api/2/instances/{instanceid}/cancel`
**Cancelar uma instância de solicitação por código da solicitação**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instanceId` | path | integer | Sim | Código da solicitação |
| `cancelEnvelope` | body | CancelInstanceModel | Sim | Informações adicionais do cancelamento |

---

### PATCH `/api/2/instances/{instanceid}/cancel/undo`
**Reverter cancelamento de uma instância de solicitação por código da solicitação**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instanceId` | path | integer | Sim | Código da solicitação |

---

### GET `/api/2/instances/report`
**Listar todas instâncias de solicitações que a pessoa relacionada ao token possui permissão de consultar de acordo com filtros**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `startDateIntervalBegin` | query | string | Não | Data de início do intervalo de solicitação |
| `startDateIntervalEnd` | query | string | Não | Data de fim do intervalo de solicitação |
| `endDateIntervalBegin` | query | string | Não | Data de início do intervalo de fim da solicitação |
| `endDateIntervalEnd` | query | string | Não | Data de fim do intervalo de fim da solicitação |
| `lastTaskEndDateIntervalBegin` | query | string | Não | Data de início do intervalo de última tarefa finalizada |
| `lastTaskEndDateIntervalEnd` | query | string | Não | Data de fim do intervalo de última tarefa finalizada |
| `simulation` | query | boolean | Não | Indicador se devem ser pesquisadas simulações |
| `active` | query | boolean | Não | Indicador se devem ser pesquisas somente instâncias em andamento |
| `instanceId` | query | integer | Não | Número identificador da instância de solicitação |
| `flowId` | query | integer | Não | Número identificador do processo |
| `flowUid` | query | string | Não | Código padrão GUID único do processo |
| `serviceId` | query | integer | Não | Número identificador do serviço |
| `serviceUid` | query | string | Não | Código padrão GUID único do serviço |
| `allowOpenUrlsForFilesInForm` | query | boolean | Não | Indicador se deve ser listado a URL aberta dos arquivos no(s) formulário(s) |
| `requesterUsername` | query | string | Não | Username da pessoa solicitante |
| `formFieldNames` | query | array | Não | Lista de identificadores de campos do formulário que devem ser retornados na consulta |
| `showPendingInstanceTasks` | query | boolean | Não | Indicador se devem ser listadas as tarefas pendentes |
| `showFinishedInstanceTasks` | query | boolean | Não | Indicador se devem ser listadas as tarefas concluídas |
| `showPendingAssignees` | query | boolean | Não | Indicador se devem ser listadas os responsáveis por tarefas pendentes |
| `recordsPerPage` | query | integer | Não | Número máximo de registros por página |
| `pageNumber` | query | integer | Não | Número da página de registros |
| `useCache` | query | boolean | Não | Indicador se deve ser utilizado cache |
| `taskId` | query | integer | Não | Código de tarefa que será pesquisado |
| `requesterTeamId` | query | integer | Não | Código do time do requisitante |
| `currentRequesterTeamId` | query | integer | Não | Código do time do responsável atual |
| `responsibleAppTeamId` | query | integer | Não | Código do time do responsável pelo aplicativo |
| `taskStatus` | query | string | Não | Filtro para tarefa configurada, podem ser utilizados: <br/> - 'Current' = Em andamento nesta tarefa;<br/> - 'Passed' = Solicitação já passou alguma vez pela tarefa;<br/> - 'Unavailable' = Solicitação não passou nenhuma vez pela tarefa. |

---

### POST `/api/2/instances/report`
**Listar todas instâncias de solicitações que a pessoa relacionada ao token possui permissão de consultar de acordo com filtros**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instancesFilter` | body | PostReportInstancesModel | Sim | Documento com filtros e configurações solicitados para a consulta |

---

### POST `/api/2/instances/report/count`
**Contar as instâncias de solicitações que a pessoa relacionada ao token possui permissão de consultar de acordo com filtros**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instancesFilter` | body | CountInstancesModel | Sim | Documento com filtros e configurações solicitados para a consulta |

---

### POST `/api/2/instances/subprocess`
**Criar um novo subprocesso a partir de uma solicitação.**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instancesEnvelope` | body | CreateInstancesSubprocessModel | Sim | Dados para criar um subprocesso |

---

## INTEGRATIONS

### GET `/api/2/integrations/{integrationuid}/execute`
**Executar uma integração a partir do UID, retornando os valores transformados da mesma.**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `integrationUID` | path | string | Sim | Código UID que identifica a integração. |
| `instanceId` | query | integer | Não | - |
| `serviceId` | query | integer | Não | - |
| `flowId` | query | integer | Não | - |
| `fieldId` | query | integer | Não | - |
| `filter` | query | string | Não | - |

---

### POST `/api/2/integrations/{integrationuid}/execute`
**Executar uma integração a partir do UID, retornando os valores transformados da mesma.**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `integrationUID` | path | string | Sim | Código UID que identifica a integração. |
| `executeIntegrationModel.instanceId` | query | integer | Não | - |
| `executeIntegrationModel.serviceId` | query | integer | Não | - |
| `executeIntegrationModel.flowId` | query | integer | Não | - |
| `executeIntegrationModel.fieldId` | query | integer | Não | - |
| `executeIntegrationModel.filter` | query | string | Não | - |

---

## MESSAGES

### POST `/api/2/messages`
**Adicionar mensagem a uma instância de solicitação por código identificador da instância da solicitação.**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `message` | body | AddMessageToInstanceModel | Sim | Documento com mensagem ser adicionada |

---

### GET `/api/2/messages/instance/{instanceid}`
**Listar mensagems de uma instância de solicitação**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `instanceId` | path | integer | Sim | Código identificador da instância da solicitação |
| `useCache` | query | boolean | Não | Indicação se a consulta pode vir do cache |

---

### POST `/api/2/messages/instance-task`
**Adicionar mensagem a uma instância de tarefa por código identificador da instância da tarefa**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `message` | body | AddMessageToInstanceTaskModel | Sim | Documento com mensagem ser adicionada |

---

## POSITIONS

### GET `/api/2/positions`
**Listar funções que a pessoa relacionada ao token tem permissão de visualizar (Auth)**

---

### POST `/api/2/positions`
**Criar uma função (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `positionEnvelope` | body | AddPositionModel | Sim | Dados da função |

---

### GET `/api/2/positions/{positionid}`
**Obter função específica pelo código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `positionId` | path | integer | Sim | Identificador da função / posição |

---

### PATCH `/api/2/positions/{positionid}/activate`
**Ativar uma função pelo identificador (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `positionId` | path | integer | Sim | Identificador da função / posição |

---

### PATCH `/api/2/positions/{positionid}/deactivate`
**Desativar uma função pelo identificador (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `positionId` | path | integer | Sim | Identificador da função / posição |

---

### GET `/api/2/positions/code/{positioncode}`
**Obter função pelo código original / integração (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `positionCode` | path | string | Sim | Código original / integração da posição |

---

### GET `/api/2/positions/code/{positioncode}/users`
**Listar as pessoas associadas a essa função (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `positionCode` | path | string | Sim | Código original / integração da função |

---

## REQUESTS

### GET `/api/2/requests`
**Listar aplicativos e serviços que podem ser iniciados pela pessoa autenticada**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamId` | query | integer | Não | Código identificador do time associado ao aplicativo / serviço |
| `keywords` | query | string | Não | Palavra-chave a ser pesquisada na descrição do aplicativo / serviço |
| `appCode` | query | string | Não | Código criptografado identificador do aplicativo |
| `mobileEnabledOnly` | query | boolean | Não | Indicador se devem ser listados somente os aplicativos / serviços habilitados para mobile |

---

### GET `/api/2/requests/flows`
**Listar aplicativos que podem ser iniciados pela pessoa autenticada**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamId` | query | integer | Não | Código identificador do time associado ao aplicativo |
| `keywords` | query | string | Não | Palavra-chave a ser pesquisada na descrição do aplicativo |
| `appCode` | query | string | Não | Código criptografado identificador do aplicativo |
| `mobileEnabledOnly` | query | boolean | Não | Indicador se devem ser listados somente os aplicativos habilitados para mobile |

---

### GET `/api/2/requests/services`
**Listar serviços que podem ser iniciados pela pessoa autenticada**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamId` | query | integer | Não | Código identificador do time associado ao  serviço |
| `keywords` | query | string | Não | Palavra-chave a ser pesquisada na descrição do  serviço |
| `appCode` | query | string | Não | Código criptografado identificador do aplicativo |
| `mobileEnabledOnly` | query | boolean | Não | Indicador se devem ser listados somente os serviços habilitados para mobile |

---

## SERVICES

### GET `/api/2/services/{serviceid}`
**Retorna o JSON de exportação do serviço informado (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `serviceId` | path | integer | Sim | ID do serviço que será exportado |
| `flowContents` | query | boolean | Não | true para retornar o XML de exportação do processo usado pelo serviço |
| `tutorialContents` | query | boolean | Não | true para retornar os dados do tutorial configurado para o serviço selecionado |

---

### POST `/api/2/services/import`
**Importar um novo serviço (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `model` | body | ServiceImportModel | Sim | - |

---

## TEAMS

### GET `/api/2/teams`
**Listar times que a pessoa relacionada ao token tem permissão de visualizar (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `name` | query | string | Não | Nome do time para pesquisa |

---

### POST `/api/2/teams`
**Criar um time (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamEnvelope` | body | AddTeamModel | Sim | Dados do time |

---

### GET `/api/2/teams/{teamid}`
**Obter time pelo código identificador (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamId` | path | integer | Sim | Código identificador do time |

---

### PATCH `/api/2/teams/{teamid}/activate`
**Ativar um time pelo identificador (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamId` | path | integer | Sim | Identificador do time |

---

### PATCH `/api/2/teams/{teamid}/deactivate`
**Desativar um time pelo identificador (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamId` | path | integer | Sim | Identificador do time |

---

### GET `/api/2/teams/{teamid}/positions`
**Listar as funções relacionadas ao time (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamId` | path | integer | Sim | Identificador do time |

---

### GET `/api/2/teams/code/{teamcode}`
**Obter time pelo código original / integração (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamCode` | path | string | Sim | Código original / integração do time |

---

### GET `/api/2/teams/code/{teamcode}/{positioncode}/users`
**Listar as pessoas associadas a esse time com a posição definida (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamCode` | path | string | Sim | Código original / integração do time |
| `positionCode` | path | string | Sim | Código original / integração da posição |

---

### GET `/api/2/teams/code/{teamcode}/users`
**Listar as pessoas associadas a esse time (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `teamCode` | path | string | Sim | Código original / integração do time |

---

## TOKENS

### GET `/api/2/tokens`
**Obter o dados e token temporário da pessoa autenticada atualmente**

---

### POST `/api/2/tokens`
**Obter token temporário a partir de usuário e senha**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userCredentials` | body | GetTokenByCredentialsModel | Sim | Credenciais da pessoa |

---

### GET `/api/2/tokens/impersonate/{userid}`
**Personificar e obter o token temporário de outra pessoa a partir de seu código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código da pessoa a ser personificada |

---

### GET `/api/2/tokens/impersonate/{username}`
**Personificar e obter o token temporário de outra pessoa a partir de seu username (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `username` | path | string | Sim | Username da pessoa a ser personificada |

---

## USERS

### GET `/api/2/users`
**Listar as pessoas do sistema (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `pageNumber` | query | integer | Não | Número da página de registros |
| `isActive` | query | boolean | Não | Indicador true ou false se pessoa ativa |

---

### POST `/api/2/users`
**Cadastrar uma pessoa, com grupos de manutenção, times e funções relacionados (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userModel` | body | AddUserModel | Sim | Modelo de dados da pessoa |

---

### GET `/api/2/users/{userid}`
**Obter pessoa por código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### DELETE `/api/2/users/{userid}`
**Excluir uma pessoa por código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### PATCH `/api/2/users/{userid}/absent/enter`
**Definir pessoa como em ausência temporária por código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |
| `absenceModel` | body | EnterAbsenceModelExternal | Sim | - |

---

### PATCH `/api/2/users/{userid}/absent/leave`
**Tirar uma pessoa de ausência temporária por código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### PATCH `/api/2/users/{userid}/account/activate`
**Ativar uma pessoa por código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### PATCH `/api/2/users/{userid}/account/deactivate`
**Desativar uma pessoa por código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### PATCH `/api/2/users/{userid}/account/lock`
**Bloquear o acesso de uma pessoa ao sistema por código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### PATCH `/api/2/users/{userid}/account/unlock`
**Desbloquear o acesso de uma pessoa ao sistema por código (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### GET `/api/2/users/{userid}/groups`
**Listar grupos de manutenção por código da pessoa (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### POST `/api/2/users/{userid}/groups/{groupid}`
**Adicionar um grupo de manutenção a uma pessoa (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |
| `groupId` | path | integer | Sim | Código identificador do grupo |

---

### DELETE `/api/2/users/{userid}/groups/{groupid}`
**Excluir um grupo de manutenção de uma pessoa (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |
| `groupId` | path | integer | Sim | Código identificador do grupo |

---

### POST `/api/2/users/{userid}/groups/copy/{newuserid}`
**Copia todos os grupos de manutenção de uma pessoa para outra (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa de origem |
| `newUserId` | path | integer | Sim | Código identificador da pessoa de destino |

---

### GET `/api/2/users/{userid}/password/change-link`
**Pegar link e chave de alteração de senha (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### PATCH `/api/2/users/{userid}/password/force-change`
**Forçar pessoa a alterar sua senha no próximo login (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### POST `/api/2/users/{userid}/password/request-reset`
**Enviar e-mail para pessoa definir nova senha (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### GET `/api/2/users/{userid}/positions`
**Listar posições e times por código da pessoa (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### POST `/api/2/users/{userid}/positions/{positionid}/{teamid}`
**Adicionar um time e função a uma pessoa (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |
| `positionId` | path | integer | Sim | Código identificador da função |
| `teamId` | path | integer | Sim | Código identificador do time |

---

### DELETE `/api/2/users/{userid}/positions/{positionid}/{teamid}`
**Excluir um time e função de uma pessoa (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |
| `positionId` | path | integer | Sim | Código identificador da função |
| `teamId` | path | integer | Sim | Código identificador do time |

---

### POST `/api/2/users/{userid}/positions/copy/{newuserid}`
**Copia todos os times e funções de uma pessoa para outra (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa de origem |
| `newUserId` | path | integer | Sim | Código identificador da pessoa de destino |

---

### POST `/api/2/users/{userid}/transfer/{newuserid}`
**Transferir a propriedade de dados de uma pessoa para outra (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa de origem |
| `newUserId` | path | integer | Sim | Código identificador da pessoa de destino |

---

### POST `/api/2/users/{userid}/welcome`
**Enviar instruções de boas vindas à pessoa (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userId` | path | integer | Sim | Código identificador da pessoa |

---

### GET `/api/2/users/{username}`
**Obter pessoa por username (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `username` | path | string | Sim | Descrição do username da pessoa |

---

### GET `/api/2/users/temp`
**Listar todas as pessoas da área de transferência (Auth)**

---

### POST `/api/2/users/temp`
**Sincronizar e inserir as pessoas da área de transferência selecionados (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userModel` | body | PostInsertTempUserModel | Sim | Dados da pessoa |

---

### POST `/api/2/users/temp/import`
**Transformar pessoas temporárias em pessoas finais (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `userNamesModel` | body | PostTempUsersToRealUserModel | Sim | Pessoas temporárias que se deseja transformar em pessoas reais |

---

### GET `/api/2/users/username/{username}`
**Obter pessoa por username (Auth)**

| Param | In | Type | Required | Description |
|-------|----|------|----------|-------------|
| `username` | path | string | Sim | Descrição do username da pessoa |

---


---

# Parte 2: Modelos de Dados (OpenAPI Definitions)

> Todos os modelos de request/response definidos no OpenAPI spec.
> Nomes seguem o namespace .NET do Zeev (Orquestra.Models).

---

### GetAssignmentsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetAssignmentsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Identificador da atribuição de atividade |
| `taskLink` | string | - | Link de execução da atividade |
| `taskName` | string | - | Título da atividade |
| `requestName` | string | - | Nome do requisitante da solicitação |
| `late` | boolean | - | Indica se a atividade está com SLA vencido |
| `active` | boolean | - | Indica se a atividade está disponível para execução |
| `startDateTime` | string (date-time) | - | Data em que a atividade foi criada |
| `expirationDateTime` | string (date-time) | - | Data de vencimento do SLA da atividade |
| `assignee` | GetTasks_Responsibles | - | Ator da atribuição de atividade |
| `flow` | GetTasks_Flows | - | Dados do aplicativo da atividade |
| `instance` | GetTasks_Instances | - | Dados da instância de solicitação da atividade |
| `service` | GetTasks_Services | - | Dados do serviço da atividade |

---

### GetTasks_Responsibles
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetTasks_Responsibles_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código de usuário da pessoa atribuída à atividade |
| `name` | string | - | Nome da pessoa atribuída à atividade |
| `email` | string | - | Endereço de e-mail da pessoa atribuída à atividade |
| `username` | string | - | Login de usuário da pessoa atribuída à atividade |

---

### GetTasks_Flows
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetTasks_Flows_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do aplicativo da atividade |
| `version` | integer (int32) | - | Versão do aplicativo da atividade |
| `uid` | string (uuid) | - | Identificador GUID do aplicativo |
| `name` | string | - | Nome do aplicativo |

---

### GetTasks_Instances
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetTasks_Instances_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da instância de solicitação |
| `uid` | string (uuid) | - | Identificador GUID da instância de solicitação |
| `masterInstanceId` | integer (int32) | - | Identificador da primeira instância em uma cadeia de subprocessos |
| `starterInstanceId` | integer (int32) | - | Identificador da solicitação que deu inicio a esta |
| `instanceTask` | GetTasks_InstanceTask | - | - |

---

### GetTasks_Services
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetTasks_Services_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Id do serviço da solicitação |
| `name` | string | - | Nome do serviço da solicitação |
| `uid` | string (uuid) | - | Identificador GUID do serviço |

---

### GetTasks_InstanceTask
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetTasks_InstanceTask_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da instância de execução da atividade |
| `startDateTime` | string (date-time) | - | Data de criação da instância de execução da atividade |
| `task` | GetTasks_Tasks | - | Dados da atividade |

---

### GetTasks_Tasks
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetTasks_Tasks_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código de cadastro da atividade no desenhador de processos |
| `name` | string | - | Título da atividade |
| `type` | string | - | Tipo da atividade (Aprovação\Instrução) |
| `description` | string | - | Descrição breve sobre a atividade |
| `element` | GetTasks_Tasks_Elements | - | Dados de configurção de elemento da atividade |

---

### GetTasks_Tasks_Elements
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetTasks_Tasks_Elements_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Id do elemento |
| `alias` | string | - | Código original / Integração |

---

### ErrorResponse
_Orquestra.Models.Base.ApiModels.Suport.ErrorResponse_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `error` | Error | - | - |

---

### Error
_Orquestra.Models.Base.ApiModels.Suport.Error_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `code` | string | - | - |
| `key` | string | - | - |
| `message` | string | - | - |
| `vars` | array | - | - |
| `details` | array | - | - |

---

### FinalizeInstanceTaskModel
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.FinalizeInstanceTaskModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `result` | string | - | Identificador ou descritivo da ação de um dos botões de ação da tarefa, que finaliza a tarefa atual |
| `reason` | string | - | Justificativa opcional da ação selecionada |
| `logInMinutes` | integer (int32) | - | Tempo em minutos necessário para executar a atividade |
| `formFields` | array | - | Lista de campos e valores do formulário eletrônico |
| `messages` | array | - | Lista de mensagens |
| `files` | array | - | Lista de anexos |

---

### FinalizeInstanceTaskModel+FinalizeInstanceTaskModel_FormFields
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.FinalizeInstanceTaskModel+FinalizeInstanceTaskModel_FormFields_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador de código do campo do formulário |
| `name` | string | - | Identificador do nome do campo do formulário |
| `value` | string | - | Valor do campo do formulário |
| `row` | integer (int32) | - | Indicador de agrupamento de linha para tabelas multivaloradas |

---

### FinalizeInstanceTaskModel+FinalizeInstanceTaskModel_Messages
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.FinalizeInstanceTaskModel+FinalizeInstanceTaskModel_Messages_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `messageBody` | string | - | Mensagem a ser inserida na instância |
| `requesterCanSee` | boolean | - | Indicador se a pessoa solicitante pode ver essa mensagem |

---

### FinalizeInstanceTaskModel+FinalizeInstanceTaskModel_Files
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.FinalizeInstanceTaskModel+FinalizeInstanceTaskModel_Files_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `filename` | string | - | Nome do anexo a ser inserido |
| `resume` | string | - | Texto descritivo resumo do anexo |
| `requesterCanSee` | boolean | - | Indicador se a pessoa solicitante pode ver essa mensagem |
| `docType` | string | - | Descritivo do tipo de anexo |
| `base64Content` | string | - | Conteúdo em base64 do anexo |

---

### FinalizeInstanceTaskModelExample
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.FinalizeInstanceTaskModelExample_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|


---

### GetAssignmentsActionsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetAssignmentsActionsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `label` | string | - | Descrição (O nome do botão exibido na execução da atividade) |
| `result` | string | - | Ação (Valor utilizado para executar atividades via API e para validação em condicionais) |
| `validate` | boolean | - | Indica se esta ação deve validar se os campos obrigatórios foram preenchidos na execução da atividade |
| `reasonRequired` | boolean | - | Indica se ao executar esta ação, é obrigatório incluir uma justificativa |
| `textColor` | string | - | Cor do texto no botão exibido durante a execução da atividade |
| `bgColor` | string | - | Cor de fundo do botão exibido durante a execução da atividade |

---

### CountAssignmentsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.CountAssignmentsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `total` | integer (int32) | - | Quantidade total de atividades |
| `onTime` | integer (int32) | - | Quantidade de atividades dentro do prazo |
| `late` | integer (int32) | - | Quantidade de atividades atrasadas |

---

### GetAssignmentsModel
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.GetAssignmentsModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `pageNumber` | integer (int32) | - | Número da página de registros |
| `recordsPerPage` | integer (int32) | - | Número máximo de registros por página |
| `instanceId` | integer (int32) | - | Número identificador da instância de solicitação |
| `flowId` | integer (int32) | - | Número identificador do processo |
| `serviceId` | integer (int32) | - | Número identificador do serviço |
| `mobileEnabledOnly` | boolean | - | Indicador se devem ser listados somente processos habilitados para mobile |
| `assigneeUserId` | integer (int32) | - | Indicador da pessoa responsável pela tarefa |
| `startDateIntervalBegin` | string (date-time) | - | Data inicial do intervalo a partir da qual a tarefa iniciou no formato yyyy-mm-dd HH:mm:ss |
| `startDateIntervalEnd` | string (date-time) | - | Data de final do intervalo a partir da qual a tarefa iniciou no formato yyyy-mm-dd HH:mm:ss |
| `useCache` | boolean | - | Indicador se deve ser utilizado cache |

---

### ForwardTasksModel
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.ForwardTasksModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `newUserId` | integer (int32) | - | Identificador do usuário que receberá as atividades |
| `assignmentsIds` | array | - | Identificadores de atribuição de responsabilidade a serem encaminhados |
| `message` | string | - | Mensagem a ser adicionada na instância sobre o encaminhamento |

---

### ForwardTasksModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.ForwardTasksModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `numberOfForwardedTasks` | integer (int32) | - | Número de atividades encaminhadas |
| `warnings` | array | - | Alertas sobre potenciais problemas |

---

### ForwardTasksModelResult+ForwardTasksWarningsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.ForwardTasksModelResult+ForwardTasksWarningsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `message` | string | - | Mensagem de aviso sobre encaminhamento de atividades |
| `vars` | string | - | Indica a qual das atividades encaminhadas a mensagem se refere |

---

### CountAssignmentsModel
_Orquestra.Models.Workflow.ApiModels.External._20.Assignments.CountAssignmentsModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `flowId` | integer (int32) | - | Número identificador do processo |
| `serviceId` | integer (int32) | - | Número identificador do serviço |
| `appCode` | string | - | Código criptografado identificador do aplicativo de processos |
| `mobileEnabledOnly` | boolean | - | Indicador se devem ser listados somente processos habilitados para mobile |
| `assigneeUserId` | integer (int32) | - | Indicador da pessoa responsável pela tarefa |
| `startDateIntervalBegin` | string (date-time) | - | Data inicial do intervalo a partir da qual a tarefa iniciou no formato yyyy-mm-dd HH:mm:ss |
| `startDateIntervalEnd` | string (date-time) | - | Data de final do intervalo a partir da qual a tarefa iniciou no formato yyyy-mm-dd HH:mm:ss |
| `useCache` | boolean | - | Indicador se deve ser utilizado cache |

---

### EnterAbsenceModelExternal
_Orquestra.Models.Workflow.ApiModels.External._20.Users.Absence.EnterAbsenceModelExternal_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `absenceStartDate` | string (date-time) | - | Data de início da ausencia temporária |
| `absenceEndDate` | string (date-time) | - | Data de término da ausencia temporária |

---

### EnterAbsenceUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.EnterAbsenceUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |
| `userId` | integer (int32) | - | Identificador da pessoa |
| `username` | string | - | Login da pessoa |
| `isAbsent` | boolean | - | Indica se a pessoa está com ausência temporária ativa |

---

### LeaveAbsenceUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.LeaveAbsenceUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |
| `userId` | integer (int32) | - | Identificador da pessoa |
| `username` | string | - | Login da pessoa |
| `isAbsent` | boolean | - | Indica se pessoa está com ausência temporária ativa |

---

### CreateFileModel
_Orquestra.Models.Workflow.ApiModels.External._20.Files.CreateFileModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `instanceId` | integer (int32) | - | Identificador da instância |
| `xmlProcess` | string | - | Xml de valores do formulário |
| `templatePath` | string | - | Endereço absoluto/relativo do arquivo de template docx |
| `htmlTemplateUid` | string | - | UID do arquivo de template html |
| `generatedFilename` | string | - | Nome do arquivo a ser gerado, sem extensão |
| `outputFileFormat` | integer (int32) | - | Formato do arquivo de saída (Pdf/Docx) |
| `showInfoAboutDocument` | boolean | - | Mostrar informações básicas sobre o documento |
| `shouldSign` | boolean | - | Assinar o documento digitalmente |
| `shouldTrackQrcode` | boolean | - | Incluir QRCODE e dados para consulta de autenticidade |
| `shouldWatermark` | boolean | - | Incluir marca d'água no documento |

---

### CreateFileModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Files.CreateFileModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `result` | string | - | Path do arquivo gerado |

---

### AddFileToInstanceTaskModel
_Orquestra.Models.Workflow.ApiModels.External._20.Files.AddFileToInstanceTaskModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `instanceTaskId` | integer (int32) | - | Número identificador da instância de tarefa |
| `fileName` | string | - | Nome do anexo a ser inserido |
| `resume` | string | - | Texto descritivo resumo do anexo |
| `requesterCanSee` | boolean | - | Indicador se a pessoa solicitante pode ver esse anexo |
| `docType` | string | - | Descritivo do tipo de anexo |
| `base64Content` | string | - | Conteúdo em base64 do anexo |

---

### AddFileToInstanceTaskModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Files.AddFileToInstanceTaskModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Id do arquivo adicionado |
| `fileName` | string | - | Nome do arquivo |

---

### GetFlowExportModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Flows.GetFlowExportModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `url` | string | - | Endereço relativo do arquivo de exportação gerado |
| `contents` | string | - | Conteúdo exportado |

---

### ResumeFormModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Flows.Design.ResumeFormModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `flowId` | integer (int32) | - | Código identificador do aplicativo |
| `fieldId` | integer (int32) | - | Código identificador do campo |
| `groupName` | string | - | Grupo à que o campo pertence |
| `name` | string | - | Identificador do campo |
| `label` | string | - | Nome do campo conforme apresentado no formulário |
| `typeName` | string | - | Tipo de campo |
| `required` | boolean | - | Indica se o preenchimento do campo é obrigatório nas atividades em que está habilitado |
| `validationName` | string | - | Validação especial |
| `minLength` | string | - | Mínimo de caracteres do campo |
| `maxLength` | string | - | Máximo de caracteres do campo |
| `integrationId` | integer (int32) | - | Id da integração associada ao campo |
| `integrationName` | string | - | Nome da integração associada ao campo |
| `attributes` | array | - | Opções disponíveis para seleção |
| `tasks` | array | - | Relação de atividades em que o campo está habilitado para uso |
| `actionScript` | string | - | Scripts criados diretamente no campo |
| `groupOrder` | integer (int32) | - | Ordenação do grupo do campo |
| `rowOrder` | integer (int32) | - | Ordenação do campo dentro do agrupamento |
| `columnOrder` | integer (int32) | - | Ordenação da coluna do campo |
| `order` | integer (int32) | - | Ordenação geral do campo |

---

### ResumeFlowUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Flows.Design.ResumeFlowUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `flowId` | integer (int32) | - | Código do aplicativo |
| `userId` | integer (int32) | - | Id do usuário |
| `username` | string | - | Login do usuário |
| `name` | string | - | Nome do usuário |
| `email` | string | - | Endereço de e-mail do usuário |
| `document` | string | - | CPF/CNPJ do usuário |
| `identification` | string | - | Matrícula do usuário |
| `teamName` | string | - | Time |
| `positionName` | string | - | Função |

---

### ListDesignElementsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Flows.Design.ListDesignElementsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `tasks` | array | - | Relação dos elementos que compõem o aplicativo |

---

### IModelResult
_Orquestra.Models.Base.ApiModels.Suport.IModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|


---

### FlowCanEditModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Flows.FlowCanEditModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `flowId` | integer (int32) | - | Código identificador do aplicativo |
| `flowUid` | string | - | GUID identificador do aplicativo |
| `flowName` | string | - | Nome do aplicativo |
| `flowDescription` | string | - | Descrição do aplicativo |
| `flowVersion` | integer (int32) | - | Versão do aplicativo |
| `teamName` | string | - | Nome do time configurado como responsável pelo aplicativo |
| `deploy` | boolean | - | Indica se o aplicativo está publicado |
| `categoryId` | integer (int32) | - | ID da categoria de aplicativos |
| `categoryName` | string | - | Nome da categoria do aplicativo |
| `parentId` | integer (int32) | - | Código do aplicativo a partir do qual foi gerado esta versão |
| `lastDeploy` | string (date-time) | - | Data de publicação |
| `executionMode` | string | - | Modo de execução |
| `active` | boolean | - | Indica se o aplicativo está ativo |
| `userOwner` | string | - | Código do usuário que criou o aplicativo |
| `inbox` | string | - | Texto apresentado como prévia no monitoramento de solicitações |
| `tasks` | string | - | Endpoint para obter as tarefas do aplicativo |
| `form` | string | - | Endpoint para obter o formulário do aplicativo |
| `users` | string | - | Endpoint para obter a lista de pessoas que atuam neste aplicativo |

---

### ImportFlowModel
_Orquestra.Models.Workflow.ApiModels.Internal.BPMS._10.Flows.ImportFlowModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `contents` | string | - | - |

---

### ImportFlowModelResult
_Orquestra.Models.Workflow.ApiModels.Internal.BPMS._10.Flows.ImportFlowModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `cnf` | integer (int32) | - | Código do aplicativo criado |
| `cnfr` | integer (int32) | - | Código do formulário do aplicativo |
| `nbfv` | integer (int32) | - | Versão do aplicativo |
| `dsdlk` | string | - | Link para acesso ao modelador do aplicativo |

---

### UpdateFormValuesModel
_Orquestra.Models.Workflow.ApiModels.External._20.FormValues.UpdateFormValuesModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `formValues` | array | - | Lista de campos e valores do formulário |
| `updateClosedInstance` | boolean | - | Atualiza a solicitação mesmo que já esteja finalizada. |

---

### UpdateFormValuesModel+UpdateFormValuesModel_FormValues
_Orquestra.Models.Workflow.ApiModels.External._20.FormValues.UpdateFormValuesModel+UpdateFormValuesModel_FormValues_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `name` | string | - | Identificador do nome do campo do formulário |
| `value` | string | - | Valor do campo do formulário |
| `row` | integer (int32) | - | Indicador de agrupamento de linha para tabelas multivaloradas |

---

### UpdateFormValuesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.FormValues.UpdateFormValuesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação |

---

### ClearFormHistoryValuesModel
_Orquestra.Models.Workflow.ApiModels.External._20.FormValues.ClearFormHistoryValuesModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `fieldList` | array | - | Lista de campos |
| `deleteEvenIfThereIsASignature` | boolean | - | Apagar histórico mesmo que haja assinatura eletrônica na instância. |
| `deleteFormValueData` | boolean | - | Apagar dados correntes presentes no formulário. |

---

### CopyFormValuesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.FormValues.CopyFormValuesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação |

---

### GetGroupsDetailModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Groups.GetGroupsDetailModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do grupo |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome do grupo |

---

### GetGroupsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Groups.GetGroupsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do grupo |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome do grupo |

---

### GetGroupUsersModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Groups.GetGroupUsersModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da pessoa cadastrada no Zeev |
| `name` | string | - | Nome da pessoa |
| `username` | string | - | Login da pessoa |
| `email` | string | - | Email da pessoa |
| `isActive` | boolean | - | Pessoa ativa no cadastro |
| `licenseType` | string | - | Tipo de licença |

---

### GetGroupPermissionsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Groups.GetGroupPermissionsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `module` | string | - | Módulo |
| `canCreate` | boolean | - | Permissão para adicionar |
| `canRead` | boolean | - | Permissão para visualizar |
| `canUpdate` | boolean | - | Permissão para atualizar |
| `canDelete` | boolean | - | Permissão para excluir |

---

### GetReportInstancesModel
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `startDateIntervalBegin` | string (date-time) | - | Data de início do intervalo de solicitação |
| `startDateIntervalEnd` | string (date-time) | - | Data de fim do intervalo de solicitação |
| `endDateIntervalBegin` | string (date-time) | - | Data de início do intervalo de fim da solicitação |
| `endDateIntervalEnd` | string (date-time) | - | Data de fim do intervalo de fim da solicitação |
| `lastTaskEndDateIntervalBegin` | string (date-time) | - | Data de início do intervalo de última tarefa finalizada |
| `lastTaskEndDateIntervalEnd` | string (date-time) | - | Data de fim do intervalo de última tarefa finalizada |
| `simulation` | boolean | - | Indicador se devem ser pesquisadas simulações |
| `active` | boolean | - | Indicador se devem ser pesquisas somente instâncias em andamento |
| `instanceId` | integer (int32) | - | Número identificador da instância de solicitação |
| `flowId` | integer (int32) | - | Número identificador do processo |
| `flowUid` | string (uuid) | - | Código padrão GUID único do processo |
| `serviceId` | integer (int32) | - | Número identificador do serviço |
| `serviceUid` | string (uuid) | - | Código padrão GUID único do serviço |
| `allowOpenUrlsForFilesInForm` | boolean | - | Indicador se deve ser listado a URL aberta dos arquivos no(s) formulário(s) |
| `requesterUsername` | string | - | Username da pessoa solicitante |
| `formFieldNames` | array | - | Lista de identificadores de campos do formulário que devem ser retornados na consulta |
| `showPendingInstanceTasks` | boolean | - | Indicador se devem ser listadas as tarefas pendentes |
| `showFinishedInstanceTasks` | boolean | - | Indicador se devem ser listadas as tarefas concluídas |
| `showPendingAssignees` | boolean | - | Indicador se devem ser listadas os responsáveis por tarefas pendentes |
| `recordsPerPage` | integer (int32) | - | Número máximo de registros por página |
| `pageNumber` | integer (int32) | - | Número da página de registros |
| `useCache` | boolean | - | Indicador se deve ser utilizado cache |
| `taskId` | integer (int32) | - | Código de tarefa que será pesquisado |
| `requesterTeamId` | integer (int32) | - | Código do time do requisitante |
| `currentRequesterTeamId` | integer (int32) | - | Código do time do responsável atual |
| `responsibleAppTeamId` | integer (int32) | - | Código do time do responsável pelo aplicativo |
| `taskStatus` | string | - | Filtro para tarefa configurada, podem ser utilizados: <br/> - 'Current' = Em andamento nesta tarefa;<br/> - 'Passed' = Solicitação já passou alguma vez pela tarefa;<br/> - 'Unavailable' = Solicitação não passou nenhuma vez pela tarefa. |

---

### FormFieldsFilterEntity
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.FormFieldsFilterEntity_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | O ID do campo do formulário. Pode ser utilizado em alternativa ao nome.  |
| `name` | string | - | O nome identificador do campo do formulário. Pode ser utilizado em alternativa ao ID.  |
| `operator` | string | - | O operador de filtro a ser utilizado: =, <>, not like, >, < ou like  |
| `value` | string | - | O valor do campo do formulário a ser filtrado |

---

### GetReportInstancesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da instância de solicitação |
| `masterInstanceId` | integer (int32) | - | Identificador da primeira instância em uma cadeia de subprocessos |
| `starterInstanceId` | integer (int32) | - | Identificador da solicitação que deu inicio a esta |
| `requestName` | string | - | Nome e versão do aplicativo |
| `reportLink` | string | - | Endereço para visualizar a instância no monitoramento de solicitações |
| `confirmationCode` | string | - | Código de verificação para acesso ao relatório da solicitação |
| `uid` | string (uuid) | - | Identificador GUID da instância de solicitação |
| `simulation` | boolean | - | Indica se a instância é um teste |
| `active` | boolean | - | Indica se a solicitação está ativa |
| `flowResult` | string | - | Descrição do resultado da solicitação |
| `flowResultId` | integer (int32) | - | Identificador do resultado da solicitação |
| `startDateTime` | string (date-time) | - | Data de início da solicitação |
| `endDateTime` | string (date-time) | - | Data de conclusão da solicitação |
| `cancelUserId` | integer (int32) | - | Se a instância estiver cancelada, indica o código a pessoa que cancelou |
| `lastFinishedTaskDateTime` | string (date-time) | - | Data em que a ultima atividade foi executada |
| `leadTimeInDays` | number (double) | - | Tempo para conclusão da solicitação em dias |
| `flow` | GetReportInstancesModelResult+GetReportInstancesModelResult_Flows | - | Dados do aplicativo |
| `service` | GetReportInstancesModelResult+GetReportInstancesModelResult_Services | - | Dados do serviço |
| `formFields` | array | - | Dados de campos da instância de solicitação |
| `requester` | GetReportInstancesModelResult+GetReportInstancesModelResult_Requesters | - | Dados da pessoa que realizou a solicitação |
| `instanceTasks` | array | - | Atividades desta instância de solicitação |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_Flows
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_Flows_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Idenfiticado do aplicativo |
| `uid` | string (uuid) | - | Identificador GUID do aplicativo |
| `name` | string | - | Nome do aplicativo |
| `version` | integer (int32) | - | Versão do aplicativo |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_Services
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_Services_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do serviço |
| `uid` | string (uuid) | - | Identificador GUID do serviço |
| `name` | string | - | Nome do serviço |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_FormFieldValues
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_FormFieldValues_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Código identificador do campo |
| `name` | string | - | Texto identificador do campo |
| `value` | string | - | Valor atribuído ao campo nesta instância |
| `openUrl` | string | - | URL aberta atribuída ao campo nesta instância |
| `row` | integer (int32) | - | Se o campo está em uma tabela este valor corresponde a linha em que ele se encontra |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_Requesters
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_Requesters_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código identificador da pessoa |
| `name` | string | - | Nome da pessoa |
| `email` | string | - | Endereço de e-mail da pessoa |
| `username` | string | - | Login da pessoa |
| `team` | GetReportInstancesModelResult+GetReportInstancesModelResult_Requesters+GetReportInstancesModelResult_RequesterTeams | - | Time da pessoa requisitante da instância de solicitação |
| `position` | GetReportInstancesModelResult+GetReportInstancesModelResult_Requesters+GetReportInstancesModelResult_RequesterPositions | - | Função da pessoa requisitante da solicitação |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTasks
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTasks_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da atividade |
| `subprocessId` | integer (int32) | - | Identificador da atividade de subprocesso |
| `startDateTime` | string (date-time) | - | Data de início da atividade |
| `endDateTime` | string (date-time) | - | Data em que a atividade foi concluída |
| `expectedEndDateTime` | string (date-time) | - | Data de vencimento do SLA da atividade |
| `leadTimeInDays` | number (double) | - | Tempo para conclusão da atividade em dias |
| `onTime` | boolean | - | Indica se a atividade está dentro do prazo de SLA definido |
| `active` | boolean | - | Indica se a atividade está disponível para execução |
| `result` | string | - | Resultado da execução da atividade |
| `alias` | string | - | Código original / Integração |
| `task` | GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTasks+GetReportInstancesModelResult_Tasks | - | Dados do cadastro da atividade no modelador |
| `executor` | GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskExecutor | - | Dados do executor da atividade |
| `assignees` | array | - | Dados de atribuição da atividade |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_Requesters+GetReportInstancesModelResult_RequesterTeams
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_Requesters+GetReportInstancesModelResult_RequesterTeams_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `name` | string | - | Nome do time |
| `code` | string | - | Código original / Integração |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_Requesters+GetReportInstancesModelResult_RequesterPositions
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_Requesters+GetReportInstancesModelResult_RequesterPositions_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da função |
| `name` | string | - | Nome da função |
| `code` | string | - | Código original / Integração |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTasks+GetReportInstancesModelResult_Tasks
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTasks+GetReportInstancesModelResult_Tasks_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Idenficador da atividade criada na modelagem do aplicativo |
| `name` | string | - | Nome da atividade |
| `type` | string | - | Tipo de atividade (taskapproval = Aprovação | taskinstruction = Instrução |
| `businessHours` | boolean | - | Indica se o calculo de SLA da atividade leva em consideração hóras uteis |
| `timeout` | number (double) | - | Tempo definido para SLA em horas |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskExecutor
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskExecutor_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `userId` | integer (int32) | - | Identificador da pessoa que executou a atividade |
| `name` | string | - | Nome da pessoa que executou a atividade |
| `email` | string | - | Endereço de e-mail da pessoa que executou a atividadade |
| `username` | string | - | Login da pessoa que executou a atividade |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskAssignees
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskAssignees_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Código identificador da atribuição de atividade |
| `userId` | integer (int32) | - | Código identificador da pessoa a quem a atividade foi atribuida |
| `name` | string | - | Nome da pessoa atribuída à atividade |
| `email` | string | - | Endereço de e-mail da pessoa atribuída à atividade |
| `username` | string | - | Login do usuário atribuído à atividade |
| `team` | GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskAssignees+GetReportInstancesModelResult_InstanceTaskAssignees_Team | - | Time da pessoa atribuída à atividade |
| `position` | GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskAssignees+GetReportInstancesModelResult_InstanceTaskAssignees_Position | - | Função da pessoa atribuída à atividade |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskAssignees+GetReportInstancesModelResult_InstanceTaskAssignees_Team
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskAssignees+GetReportInstancesModelResult_InstanceTaskAssignees_Team_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Identificador do time |
| `name` | string | - | Nome do time |
| `code` | string | - | Código original / Integração |

---

### GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskAssignees+GetReportInstancesModelResult_InstanceTaskAssignees_Position
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetReportInstancesModelResult+GetReportInstancesModelResult_InstanceTaskAssignees+GetReportInstancesModelResult_InstanceTaskAssignees_Position_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Código identificador da função |
| `name` | string | - | Nome da função |
| `code` | string | - | Código original / Integração |

---

### PostReportInstancesModel
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `startDateIntervalBegin` | string (date-time) | - | Data de início do intervalo de solicitação |
| `startDateIntervalEnd` | string (date-time) | - | Data de fim do intervalo de solicitação |
| `endDateIntervalBegin` | string (date-time) | - | Data de início do intervalo de fim da solicitação |
| `endDateIntervalEnd` | string (date-time) | - | Data de fim do intervalo de fim da solicitação |
| `lastTaskEndDateIntervalBegin` | string (date-time) | - | Data de início do intervalo de última tarefa finalizada |
| `lastTaskEndDateIntervalEnd` | string (date-time) | - | Data de fim do intervalo de última tarefa finalizada |
| `simulation` | boolean | - | Indicador se devem ser pesquisadas simulações |
| `active` | boolean | - | Indicador se devem ser pesquisas somente instâncias em andamento |
| `instanceId` | integer (int32) | - | Número identificador da instância de solicitação |
| `flowId` | integer (int32) | - | Número identificador do processo |
| `flowUid` | string (uuid) | - | Código padrão GUID único do processo |
| `serviceId` | integer (int32) | - | Número identificador do serviço |
| `serviceUid` | string (uuid) | - | Código padrão GUID único do serviço |
| `mobileEnabledOnly` | boolean | - | Indicador se devem ser listados somente processos habilitados para mobile |
| `allowOpenUrlsForFilesInForm` | boolean | - | Indicador se deve ser listado a URL aberta dos arquivos no(s) formulário(s) |
| `requesterUsername` | string | - | Username da pessoa solicitante |
| `formFieldNames` | array | - | Lista de identificadores de campos do formulário que devem ser retornados na consulta |
| `formFieldsFilter` | array | - | Lista de filtros baseados nos identificadores de campos do formulário para filtrar a consulta |
| `showPendingInstanceTasks` | boolean | - | Indicador se devem ser listadas as tarefas pendentes |
| `showFinishedInstanceTasks` | boolean | - | Indicador se devem ser listadas as tarefas concluídas |
| `showPendingAssignees` | boolean | - | Indicador se devem ser listadas os responsáveis por tarefas pendentes |
| `recordsPerPage` | integer (int32) | - | Número máximo de registros por página |
| `pageNumber` | integer (int32) | - | Número da página de registros |
| `useCache` | boolean | - | Indicador se deve ser utilizado cache |
| `taskId` | integer (int32) | - | Código de tarefa que será pesquisado |
| `requesterTeamId` | integer (int32) | - | Código do time do requisitante |
| `currentRequesterTeamId` | integer (int32) | - | Código do time do responsável atual |
| `responsibleAppTeamId` | integer (int32) | - | Código do time do responsável pelo aplicativo |
| `taskStatus` | string | - | Filtro para tarefa configurada, podem ser utilizados: <br/> - 'Current' = Em andamento nesta tarefa;<br/> - 'Passed' = Solicitação já passou alguma vez pela tarefa;<br/> - 'Unavailable' = Solicitação não passou nenhuma vez pela tarefa. |

---

### PostReportInstancesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da solicitação |
| `masterInstanceId` | integer (int32) | - | Identificador da primeira instância em uma cadeia de subprocessos |
| `starterInstanceId` | integer (int32) | - | Intentificador da solicitação que deu inicio a esta |
| `requestName` | string | - | Nome e versão do aplicativo |
| `reportLink` | string | - | Link para acesso à instância no monitoramento de solicitações |
| `confirmationCode` | string | - | Código de verificação para acesso ao relatório da solicitação |
| `uid` | string (uuid) | - | Identificador GUID da instância de solicitação |
| `simulation` | boolean | - | Indica se a instância é um teste |
| `active` | boolean | - | Indica se a solicitação está ativa |
| `flowResult` | string | - | Descrição do resultado da solicitação |
| `flowResultId` | integer (int32) | - | Identificador do resultado da solicitação |
| `startDateTime` | string (date-time) | - | Data de início da solicitação |
| `endDateTime` | string (date-time) | - | Data de conclusão da solicitação  |
| `cancelUserId` | integer (int32) | - | Se a instância estiver cancelada, indica o código a pessoa que cancelou |
| `lastFinishedTaskDateTime` | string (date-time) | - | Data em que a ultima atividade foi executada |
| `leadTimeInDays` | number (double) | - | Tempo para conclusão da solicitação em dias |
| `flow` | PostReportInstancesModelResult+PostReportInstancesModelResult_Flows | - | Dados do aplicativo |
| `service` | PostReportInstancesModelResult+PostReportInstancesModelResult_Services | - | Dados do serviço |
| `formFields` | array | - | Dados de campos da instância de solicitação |
| `requester` | PostReportInstancesModelResult+PostReportInstancesModelResult_Requesters | - | Dados da pessoa que realizou a solicitação |
| `instanceTasks` | array | - | Atividades desta instância de solicitação |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_Flows
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_Flows_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Idenfiticador do aplicativo |
| `uid` | string (uuid) | - | Identificador GUID do aplicativo |
| `name` | string | - | Nome do aplicativo |
| `version` | integer (int32) | - | Versão do aplicativo |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_Services
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_Services_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do serviço |
| `uid` | string (uuid) | - | Identificador GUID do serviço |
| `name` | string | - | Nome do serviço |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_FormFieldValues
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_FormFieldValues_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Código identificador do campo |
| `name` | string | - | Texto identificador do campo |
| `value` | string | - | Valor atribuído ao campo nesta instância |
| `openUrl` | string | - | URL aberta atribuída ao campo nesta instância |
| `row` | integer (int32) | - | Se o campo está em uma tabela este valor corresponde a linha em que ele se encontra |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_Requesters
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_Requesters_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código identificador da pessoa |
| `name` | string | - | Nome da pessoa |
| `email` | string | - | Endereço de e-mail da pessoa |
| `username` | string | - | Login da pessoa |
| `team` | PostReportInstancesModelResult+PostReportInstancesModelResult_Requesters+PostReportInstancesModelResult_RequesterTeams | - | Time da pessoa requisitante da instância de solicitação |
| `position` | PostReportInstancesModelResult+PostReportInstancesModelResult_Requesters+PostReportInstancesModelResult_RequesterPositions | - | Função da pessoa requisitante da solicitação |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTasks
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTasks_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da atividade |
| `subprocessId` | integer (int32) | - | Identificador da atividade de subprocesso |
| `startDateTime` | string (date-time) | - | Data de início da atividade |
| `endDateTime` | string (date-time) | - | Data em que a atividade foi concluída |
| `expectedEndDateTime` | string (date-time) | - | Data de vencimento do SLA da atividade |
| `leadTimeInDays` | number (double) | - | Tempo para conclusão da atividade em dias |
| `onTime` | boolean | - | Indica se a atividade está dentro do prazo de SLA definido |
| `active` | boolean | - | Indica se a atividade está disponível para execução |
| `result` | string | - | Resultado da execução da atividade |
| `alias` | string | - | Código original / Integração |
| `task` | PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTasks+PostReportInstancesModelResult_Tasks | - | Dados do cadastro da atividade no modelador |
| `executor` | PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskExecutor | - | Dados do executor da atividade |
| `assignees` | array | - | Dados de atribuição da atividade |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_Requesters+PostReportInstancesModelResult_RequesterTeams
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_Requesters+PostReportInstancesModelResult_RequesterTeams_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `name` | string | - | Nome do time |
| `code` | string | - | Código original / Integração |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_Requesters+PostReportInstancesModelResult_RequesterPositions
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_Requesters+PostReportInstancesModelResult_RequesterPositions_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da função |
| `name` | string | - | Nome da função |
| `code` | string | - | Código original / Integração |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTasks+PostReportInstancesModelResult_Tasks
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTasks+PostReportInstancesModelResult_Tasks_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Idenficador da atividade criada na modelagem do aplicativo |
| `name` | string | - | Nome da atividade |
| `type` | string | - | Tipo de tarega (taskapproval = Aprovação | taskinstruction = Instrução |
| `businessHours` | boolean | - | Indica se o calculo de SLA da atividade leva em consideração hóras uteis |
| `timeout` | number (double) | - | Tempo definido para SLA em horas |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskExecutor
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskExecutor_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `userId` | integer (int32) | - | Identificador da pessoa que executou a atividade |
| `name` | string | - | Nome da pessoa que executou a atividade |
| `email` | string | - | Endereço de e-mail da pessoa que executou a atividadade |
| `username` | string | - | Login da pessoa que executou a atividade |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskAssignees
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskAssignees_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Código identificador da atribuição de atividade |
| `userId` | integer (int32) | - | Código identificador da pessoa a quem a atividade foi atribuida à atividade |
| `name` | string | - | Nome da pessoa atribuída à atividade |
| `email` | string | - | Endereço de e-mail da pessoa atribuída à atividade |
| `username` | string | - | Login do usuário atribuído à atividade |
| `team` | PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskAssignees+PostReportInstancesModelResult_InstanceTaskAssignees_Team | - | Time da pessoa atribuída à atividade |
| `position` | PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskAssignees+PostReportInstancesModelResult_InstanceTaskAssignees_Position | - | Função da pessoa atribuída à atividade |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskAssignees+PostReportInstancesModelResult_InstanceTaskAssignees_Team
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskAssignees+PostReportInstancesModelResult_InstanceTaskAssignees_Team_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Identificador do time |
| `name` | string | - | Nome do time |
| `code` | string | - | Código original / Integração |

---

### PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskAssignees+PostReportInstancesModelResult_InstanceTaskAssignees_Position
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.PostReportInstancesModelResult+PostReportInstancesModelResult_InstanceTaskAssignees+PostReportInstancesModelResult_InstanceTaskAssignees_Position_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Código identificador da função |
| `name` | string | - | Nome da função |
| `code` | string | - | Código original / Integração |

---

### GetInstancesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da instância de solicitação |
| `masterInstanceId` | integer (int32) | - | Identificador da primeira instância em uma cadeia de subprocessos |
| `starterInstanceId` | integer (int32) | - | Identificador da solicitação que deu início a esta |
| `requestName` | string | - | Nome e versão do aplicativo |
| `reportLink` | string | - | Endereço para visualizar a instância no monitoramento de solicitações |
| `confirmationCode` | string | - | Código de verificação para acesso ao relatório da solicitação |
| `uid` | string (uuid) | - | Identificador GUID da instância de solicitação |
| `simulation` | boolean | - | Indica se a instância é um teste |
| `active` | boolean | - | Indica se a solicitação está ativa |
| `flowResult` | string | - | Descrição do resultado da solicitação |
| `flowResultId` | integer (int32) | - | Identificador do resultado da solicitação |
| `startDateTime` | string (date-time) | - | Data de início da solicitação |
| `endDateTime` | string (date-time) | - | Data de conclusão da solicitação |
| `lastFinishedTaskDateTime` | string (date-time) | - | Data em que a ultima atividade foi executada |
| `leadTimeInDays` | number (double) | - | Tempo para conclusão da solicitação em dias |
| `flow` | GetInstancesModelResult+GetInstancesModelResult_Flows | - | Dados do aplicativo |
| `service` | GetInstancesModelResult+GetInstancesModelResult_Services | - | Dados do serviço |
| `formFields` | array | - | Dados de campos da instância de solicitação |
| `requester` | GetInstancesModelResult+GetInstancesModelResult_Requesters | - | Dados da pessoa que realizou a solicitação |
| `instanceTasks` | array | - | Atividades desta instância de solicitação |

---

### GetInstancesModelResult+GetInstancesModelResult_Flows
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_Flows_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Idenfiticado do aplicativo |
| `uid` | string (uuid) | - | Identificador GUID do aplicativo |
| `name` | string | - | Nome do aplicativo |
| `version` | integer (int32) | - | Versão do aplicativo |

---

### GetInstancesModelResult+GetInstancesModelResult_Services
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_Services_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do serviço |
| `uid` | string (uuid) | - | Identificador GUID do serviço |
| `name` | string | - | Nome do serviço |

---

### GetInstancesModelResult+GetInstancesModelResult_FormFieldValues
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_FormFieldValues_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Código identificador do campo |
| `name` | string | - | Texto identificador do campo |
| `value` | string | - | Valor atribuido ao campo nesta instância |
| `row` | integer (int32) | - | Se o campo está em uma tabela este valor corresponde a linha em que ele se encontra |

---

### GetInstancesModelResult+GetInstancesModelResult_Requesters
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_Requesters_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código identificador da pessoa |
| `name` | string | - | Nome da pessoa |
| `email` | string | - | Endereço de e-mail da pessoa |
| `username` | string | - | Login da pessoa |
| `team` | GetInstancesModelResult+GetInstancesModelResult_Requesters+GetInstancesModelResult_RequesterTeams | - | Time da pessoa requisitante da instância de solicitação |
| `position` | GetInstancesModelResult+GetInstancesModelResult_Requesters+GetInstancesModelResult_RequesterPositions | - | Função da pessoa requisitante da solicitação |

---

### GetInstancesModelResult+GetInstancesModelResult_InstanceTasks
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_InstanceTasks_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da atividade |
| `subprocessId` | integer (int32) | - | Identificador da atividade de subprocesso |
| `startDateTime` | string (date-time) | - | Data de início da atividade |
| `endDateTime` | string (date-time) | - | Data em que a atividade foi concluída |
| `expectedEndDateTime` | string (date-time) | - | Data de vencimento do SLA da atividade |
| `leadTimeInDays` | number (double) | - | Tempo para conclusão da atividade em dias |
| `onTime` | boolean | - | Indica se a atividade está dentro do prazo de SLA definido |
| `active` | boolean | - | Indica se a atividade está disponível para execução |
| `result` | string | - | Resultado da execução da atividade |
| `alias` | string | - | Código original / Integração |
| `task` | GetInstancesModelResult+GetInstancesModelResult_InstanceTasks+GetInstancesModelResult_Tasks | - | Dados do cadastro da atividade no modelador |
| `executor` | GetInstancesModelResult+GetInstancesModelResult_InstanceTaskExecutor | - | Dados do executor da atividade |
| `assignees` | array | - | Dados de atribuição da atividade |

---

### GetInstancesModelResult+GetInstancesModelResult_Requesters+GetInstancesModelResult_RequesterTeams
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_Requesters+GetInstancesModelResult_RequesterTeams_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `name` | string | - | Nome do time |
| `code` | string | - | Código original / Integração |

---

### GetInstancesModelResult+GetInstancesModelResult_Requesters+GetInstancesModelResult_RequesterPositions
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_Requesters+GetInstancesModelResult_RequesterPositions_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da função |
| `name` | string | - | Nome da função |
| `code` | string | - | Código original / Integração |

---

### GetInstancesModelResult+GetInstancesModelResult_InstanceTasks+GetInstancesModelResult_Tasks
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_InstanceTasks+GetInstancesModelResult_Tasks_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Idenficador da atividade criada na modelagem do aplicativo |
| `name` | string | - | Nome da atividade |
| `type` | string | - | Tipo de atividade (taskapproval = Aprovação | taskinstruction = Instrução |
| `businessHours` | boolean | - | Indica se o calculo de SLA da atividade leva em consideração hóras uteis |
| `timeout` | number (double) | - | Tempo definido para SLA em horas |

---

### GetInstancesModelResult+GetInstancesModelResult_InstanceTaskExecutor
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_InstanceTaskExecutor_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `userId` | integer (int32) | - | Identificador da pessoa que executou a atividade |
| `name` | string | - | Nome da pessoa que executou a atividade |
| `email` | string | - | Endereço de e-mail da pessoa que executou a atividadade |
| `username` | string | - | Login da pessoa que executou a atividade |

---

### GetInstancesModelResult+GetInstancesModelResult_InstanceTaskAssignees
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_InstanceTaskAssignees_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Código identificador da atribuição de atividade |
| `userId` | integer (int32) | - | Código identificador da pessoa a quem a atividade foi atribuida à atividade |
| `name` | string | - | Nome da pessoa atribuída à atividade |
| `email` | string | - | Endereço de e-mail da pessoa atribuída à atividade |
| `username` | string | - | Login do usuário atribuído à atividade |
| `team` | GetInstancesModelResult+GetInstancesModelResult_InstanceTaskAssignees+GetInstancesModelResult_InstanceTaskAssignees_Team | - | Time da pessoa atribuída à atividade |
| `position` | GetInstancesModelResult+GetInstancesModelResult_InstanceTaskAssignees+GetInstancesModelResult_InstanceTaskAssignees_Position | - | Função da pessoa atribuída à atividade |

---

### GetInstancesModelResult+GetInstancesModelResult_InstanceTaskAssignees+GetInstancesModelResult_InstanceTaskAssignees_Team
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_InstanceTaskAssignees+GetInstancesModelResult_InstanceTaskAssignees_Team_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Identificador do time |
| `name` | string | - | Nome do time |
| `code` | string | - | Código original / Integração |

---

### GetInstancesModelResult+GetInstancesModelResult_InstanceTaskAssignees+GetInstancesModelResult_InstanceTaskAssignees_Position
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.GetInstancesModelResult+GetInstancesModelResult_InstanceTaskAssignees+GetInstancesModelResult_InstanceTaskAssignees_Position_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int64) | - | Código identificador da função |
| `name` | string | - | Nome da função |
| `code` | string | - | Código original / Integração |

---

### CreateInstancesModel
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CreateInstancesModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `flowId` | integer (int32) | - | Identificador do processo a ser iniciado |
| `serviceId` | integer (int32) | - | Identificador do serviço a ser iniciado |
| `isSimulation` | boolean | - | Indicador se é uma simulação |
| `teamId` | integer (int32) | - | Identificador do time/área do solicitante |
| `positionId` | integer (int32) | - | Identificador da função/posição do solicitante |
| `result` | string | - | Indicador ou descritivo da ação / resultado selecionado |
| `formFields` | array | - | Lista de campos e valores do formulário eletrônico |
| `messages` | array | - | Lista de mensagens |
| `files` | array | - | Lista de anexos |

---

### CreateInstancesModel+CreateInstancesModel_FormFields
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CreateInstancesModel+CreateInstancesModel_FormFields_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador de código do campo do formulário |
| `name` | string | - | Identificador do nome do campo do formulário |
| `value` | string | - | Valor do campo do formulário |
| `row` | integer (int32) | - | Indicador de agrupamento de linha para tabelas multivaloradas |

---

### CreateInstancesModel+CreateInstancesModel_Messages
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CreateInstancesModel+CreateInstancesModel_Messages_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `messageBody` | string | - | Mensagem a ser inserida na instância |
| `requesterCanSee` | boolean | - | Indicador se a pessoa solicitante pode ver essa mensagem |

---

### CreateInstancesModel+CreateInstancesModel_Files
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CreateInstancesModel+CreateInstancesModel_Files_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `filename` | string | - | Nome do anexo a ser inserido |
| `resume` | string | - | Texto descritivo resumo do anexo |
| `requesterCanSee` | boolean | - | Indicador se a pessoa solicitante pode ver essa mensagem |
| `docType` | string | - | Descritivo do tipo de anexo |
| `base64Content` | string | - | Conteúdo em base64 do anexo |

---

### CreateInstancesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CreateInstancesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código da instância de solicitação criada |

---

### CreateInstancesSubprocessModel
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CreateInstancesSubprocessModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `parentInstanceId` | integer (int32) | - | Identificador da solicitação do processo-pai |
| `parentElementCode` | string | - | Código original / Integração da atividade de origem do processo-pai |
| `formFields` | array | - | Lista de campos e valores do formulário eletrônico |

---

### CreateInstancesSubprocessModel+CreateInstancesSubprocessModel_FormFields
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CreateInstancesSubprocessModel+CreateInstancesSubprocessModel_FormFields_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador de código do campo do formulário |
| `name` | string | - | Identificador do nome do campo do formulário |
| `value` | string | - | Valor do campo do formulário |
| `row` | integer (int32) | - | Indicador de agrupamento de linha para tabelas multivaloradas |

---

### CreateInstancesSubprocessModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CreateInstancesSubprocessModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código da instância do subprocesso criada |

---

### CountInstancesModel
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CountInstancesModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `appCode` | string | - | Código criptografado identificador do aplicativo de processos |
| `startDateIntervalBegin` | string (date-time) | - | Data de início do intervalo de solicitação |
| `startDateIntervalEnd` | string (date-time) | - | Data de fim do intervalo de solicitação |
| `endDateIntervalBegin` | string (date-time) | - | Data de início do intervalo de fim da solicitação |
| `endDateIntervalEnd` | string (date-time) | - | Data de fim do intervalo de fim da solicitação |
| `lastTaskEndDateIntervalBegin` | string (date-time) | - | Data de início do intervalo de última tarefa finalizada |
| `lastTaskEndDateIntervalEnd` | string (date-time) | - | Data de fim do intervalo de última tarefa finalizada |
| `simulation` | boolean | - | Indicador se devem ser pesquisadas simulações |
| `active` | boolean | - | Indicador se devem ser pesquisas somente instâncias em andamento |
| `flowsId` | array | - | Números identificadores dos processos |
| `servicesId` | array | - | Números identificadores dos serviços |
| `mobileEnabledOnly` | boolean | - | Indicador se devem ser listados somente processos habilitados para mobile |
| `requesterUsername` | string | - | Username da pessoa solicitante |
| `useCache` | boolean | - | Define se será utilizado cache |
| `formFieldsFilter` | array | - | Lista de filtros de campos do formulário |

---

### CountInstancesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CountInstancesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `count` | integer (int32) | - | Quantidade de instâncias |

---

### CancelInstanceModel
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CancelInstanceModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `reason` | string | - | Motivo do cancelamento |

---

### CancelInstanceModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.CancelInstanceModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação de cancelamento |

---

### UndoCancelInstanceModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Instances.UndoCancelInstanceModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso ao reverter o cancelamento |

---

### ExecuteIntegrationModel
_Orquestra.Models.Workflow.ApiModels.External._20.Integrations.ExecuteIntegrationModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `instanceId` | integer (int32) | - | - |
| `serviceId` | integer (int32) | - | - |
| `flowId` | integer (int32) | - | - |
| `fieldId` | integer (int32) | - | - |
| `filter` | string | - | - |

---

### IntegrationExecutionTransformedModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Integrations.IntegrationExecutionTransformedModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | array | - | Lista de atributos retornados pela integração, transformados de acordo com os valores informados no mapeamento da integração. |
| `cache` | boolean | - | Indica se o valor da integração foi obtido do cache |
| `datasource` | integer (int64) | - | Código identificador da integração |

---

### IntegrationExecutionAttributeModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Integrations.IntegrationExecutionAttributeModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `cod` | string | - | Código do atributo, obtido a partir do processamento do caminho do valor informado no mapeamento da integração |
| `txt` | string | - | Texto do atributo, obtido a partir do processamento do caminho do texto informado no mapeamento da integração |
| `fields` | object | - | Lista de campos, obtida a partir do processamento dos campos acessários informados no mapeamento da integração |

---

### 0, Culture=neutral, PublicKeyToken=null]]
_Orquestra.Shared.Base.Models.Models.ErrorWrapper`1[[Orquestra.Models.Workflow.ApiModels.External._20.Integrations.IntegrationExecutionErrorInfoModelResult, Orquestra.Models.Workflow, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null]]_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `error` | IntegrationExecutionErrorInfoModelResult | - | Objeto de erro |

---

### IntegrationExecutionErrorInfoModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Integrations.IntegrationExecutionErrorInfoModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `errorMsg` | string | - | Mensagem que explica o motivo do erro ocorrido |
| `logCode` | string | - | Identificador do erro no log de erros do sistema |
| `friendlyMessage` | string | - | Mensagem de erro amigável obtida a partir do processamento do caminho da mensagem de erro informado no mapeamento da integração |

---

### GetMessagesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Messages.GetMessagesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da Mensagem |
| `body` | string | - | Conteúdo da mensagem |
| `requesterCanSee` | boolean | - | Indica se o requisitante da solicitação pode ver a imagem |
| `dateTime` | string (date-time) | - | Data em que a mensagem foi incluída na instância |
| `instance` | GetMessagesModelResult+GetMessagesModelResult_Instances | - | Dados da Instância |
| `author` | GetMessagesModelResult+GetMessagesModelResult_Users | - | Autor da mensagem |

---

### GetMessagesModelResult+GetMessagesModelResult_Instances
_Orquestra.Models.Workflow.ApiModels.External._20.Messages.GetMessagesModelResult+GetMessagesModelResult_Instances_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Id da instância de solicitação |
| `name` | string | - | Nome e versão do aplicativo |
| `instanceTask` | GetMessagesModelResult+GetMessagesModelResult_TaskInstances | - | Dados da atividade |

---

### GetMessagesModelResult+GetMessagesModelResult_Users
_Orquestra.Models.Workflow.ApiModels.External._20.Messages.GetMessagesModelResult+GetMessagesModelResult_Users_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da pessoa que incluiu a mensagem na instância |
| `name` | string | - | Nome da pessoa que incluiu a mensagem na instância |
| `email` | string | - | Endereço de e-mail da pessoa que incluiu a mensagem na instância |
| `username` | string | - | Login da pessoa que incluiu a mensagem na instância |
| `original` | GetMessagesModelResult+GetMessagesModelResult_Users_Original | - | - |

---

### GetMessagesModelResult+GetMessagesModelResult_TaskInstances
_Orquestra.Models.Workflow.ApiModels.External._20.Messages.GetMessagesModelResult+GetMessagesModelResult_TaskInstances_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da atividade |
| `task` | GetMessagesModelResult+GetMessagesModelResult_Tasks | - | Dados de cadastro da atividade no modelador |

---

### GetMessagesModelResult+GetMessagesModelResult_Users_Original
_Orquestra.Models.Workflow.ApiModels.External._20.Messages.GetMessagesModelResult+GetMessagesModelResult_Users_Original_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | - |
| `name` | string | - | - |

---

### GetMessagesModelResult+GetMessagesModelResult_Tasks
_Orquestra.Models.Workflow.ApiModels.External._20.Messages.GetMessagesModelResult+GetMessagesModelResult_Tasks_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da atividade cadastrada no modelador |
| `name` | string | - | Nome da atividade |

---

### AddMessageToInstanceModel
_Orquestra.Models.Workflow.ApiModels.External._20.Messages.AddMessageToInstanceModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `instanceId` | integer (int32) | - | Número identificador da instância de solicitação |
| `messageBody` | string | - | Mensagem a ser inserida na instância |
| `requesterCanSee` | boolean | - | Indicador se a pessoa solicitante pode ver essa mensagem |

---

### AddMessageModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Messages.AddMessageModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da mensagem adicionada |

---

### AddMessageToInstanceTaskModel
_Orquestra.Models.Workflow.ApiModels.External._20.Messages.AddMessageToInstanceTaskModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `instanceTaskId` | integer (int32) | - | Número identificador da instância de tarefa |
| `messageBody` | string | - | Mensagem a ser inserida na instância |
| `requesterCanSee` | boolean | - | Indicador se a pessoa solicitante pode ver essa mensagem |

---

### GetCountriesModelResult
_Orquestra.Models.Base.ApiModels.External._20.Geo.GetCountriesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do país |
| `name` | string | - | Nome do país |

---

### GetCitiesModelResult
_Orquestra.Models.Base.ApiModels.External._20.Geo.GetCitiesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da cidade |
| `name` | string | - | Cidade |
| `stateId` | integer (int32) | - | Identificador do estado |
| `state` | string | - | Estado |
| `countryId` | integer (int32) | - | Identificador do país |
| `country` | string | - | País |

---

### GetStatesModelResult
_Orquestra.Models.Base.ApiModels.External._20.Geo.GetStatesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do estado |
| `name` | string | - | Estado |
| `sign` | string | - | UF |
| `countryId` | integer (int32) | - | Identificador do país |
| `country` | string | - | País |

---

### GetUserTempModelResult
_Orquestra.Models.Base.ApiModels.External._20.Users.GetUserTempModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `userTempId` | integer (int32) | - | - |
| `username` | string | - | - |
| `name` | string | - | - |
| `email` | string | - | - |
| `document` | string | - | - |
| `identification` | string | - | - |

---

### PostInsertTempUserModel
_Orquestra.Models.Workflow.ApiModels.External._20.Users.PostInsertTempUserModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `username` | string | - | - |
| `name` | string | - | - |
| `email` | string | - | - |
| `cpf` | string | - | - |
| `identification` | string | - | - |

---

### PostInsertTempUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.PostInsertTempUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `result` | integer (int32) | - | - |
| `username` | string | - | - |
| `name` | string | - | - |
| `email` | string | - | - |
| `cpf` | string | - | - |
| `identification` | string | - | - |

---

### GetUsersDetailedModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersDetailedModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código identificador da pessoa |
| `name` | string | - | Nome da pessoa |
| `email` | string | - | Endereço de e-mail para notificações |
| `username` | string | - | Username da pessoa |
| `document` | string | - | Documento de CPF ou CNPJ |
| `identification` | string | - | Matrícula ou número interno da pessoa |
| `isActive` | boolean | - | Indicador se a pessoa está ativa |
| `isSuperAdmin` | boolean | - | Indicador se a pessoa é superadministradora |
| `isLocked` | boolean | - | Indicador se a pessoa está bloqueada |
| `isAbsent` | boolean | - | Indicador se a pessoa está em ausência |
| `authenticationType` | string | - | Tipo de autenticação da pessoa |
| `licenseType` | string | - | Tipo de licença da pessoa |
| `createDate` | string (date-time) | - | Data de criação da pessoa |
| `lastLoginDate` | string (date-time) | - | Data de último login da pessoa |
| `lastPasswordChange` | string (date-time) | - | Data da última troca de senha da pessoa |
| `isPasswordExpired` | boolean | - | - |
| `isPasswordRequired` | boolean | - | - |
| `isAnonymous` | boolean | - | - |
| `isSubstituteNow` | boolean | - | - |
| `businessShiftId` | integer (int32) | - | Código identificador do turno de trabalho |
| `isSubstituteFor` | array | - | Lista de outras pessoas para os quais essa pessoa é substituta |
| `substitute` | GetUsersDetailedModelResult+GetUsersDetailedModelResult_Substitute | - | Informações da pessoa substituta deste |
| `groups` | array | - | - |
| `positions` | array | - | - |
| `leadership` | GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions+GetUsersDetailedModelResult_Leadership | - | Informações do gestor imediato desta pessoa |

---

### GetUsersDetailedModelResult+GetUsersDetailedModelResult_Substituting
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersDetailedModelResult+GetUsersDetailedModelResult_Substituting_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código identificador da pessoa que está sendo substituída |
| `name` | string | - | Nome da pessoa que está sendo substituída |
| `username` | string | - | Username da pessoa que está sendo substituída |
| `email` | string | - | Endereço de e-mail da pessoa que está sendo substituída |
| `isActive` | boolean | - | Indicador se a pessoa que está sendo substituída está ativa |
| `isAbsent` | boolean | - | Indicador se a pessoa que está sendo substituída está ausente |

---

### GetUsersDetailedModelResult+GetUsersDetailedModelResult_Substitute
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersDetailedModelResult+GetUsersDetailedModelResult_Substitute_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código identificador da pessoa substituta |
| `name` | string | - | Nome da pessoa substituta |
| `username` | string | - | Username da pessoa substituta |
| `email` | string | - | Endereço de e-mail da pessoa substituta |
| `isActive` | boolean | - | Indicador se a pessoa substituta está ativa |
| `isAbsent` | boolean | - | Indicador se a pessoa substituta está ausente |

---

### GetUsersDetailedModelResult+GetUsersDetailedModelResult_Groups
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersDetailedModelResult+GetUsersDetailedModelResult_Groups_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | - |
| `name` | string | - | - |
| `default` | string | - | - |

---

### GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | - |
| `position` | GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions+GetUsersDetailedModelResult_UserPositions_Positions | - | - |
| `team` | GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions+GetUsersDetailedModelResult_UserPositions_Areas | - | - |

---

### GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions+GetUsersDetailedModelResult_Leadership
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions+GetUsersDetailedModelResult_Leadership_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código identificador do gestor imediato |
| `name` | string | - | Nome do gestor imediato |
| `username` | string | - | Username do gestor imediato |
| `email` | string | - | Endereço de e-mail do gestor imediato |

---

### GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions+GetUsersDetailedModelResult_UserPositions_Positions
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions+GetUsersDetailedModelResult_UserPositions_Positions_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | - |
| `code` | string | - | - |
| `name` | string | - | - |
| `level` | string | - | - |

---

### GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions+GetUsersDetailedModelResult_UserPositions_Areas
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersDetailedModelResult+GetUsersDetailedModelResult_UserPositions+GetUsersDetailedModelResult_UserPositions_Areas_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | - |
| `code` | string | - | - |
| `name` | string | - | - |
| `sign` | string | - | - |
| `level` | string | - | - |

---

### GetUserGroupsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUserGroupsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do grupo |
| `title` | string | - | Título do grupo |

---

### GetUserPositionsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUserPositionsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da atribuição de time e função |
| `position` | GetUserPositionsModelResult+GetUserPositionsModelResult_Positions | - | Dados da função |
| `team` | GetUserPositionsModelResult+GetUserPositionsModelResult_Areas | - | Dados da função |

---

### GetUserPositionsModelResult+GetUserPositionsModelResult_Positions
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUserPositionsModelResult+GetUserPositionsModelResult_Positions_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da função |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome da função |
| `level` | string | - | Relação de níveis hierárquivos |

---

### GetUserPositionsModelResult+GetUserPositionsModelResult_Areas
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUserPositionsModelResult+GetUserPositionsModelResult_Areas_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome do time |
| `sign` | string | - | Sigla |
| `level` | string | - | Relação de níveis hierárquicos |

---

### GetLinkAndKeyChangePasswordModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetLinkAndKeyChangePasswordModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `link` | string | - | Link para troca de senha |
| `key` | string | - | Chave |

---

### GetUsersModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da pessoa |
| `name` | string | - | Nome da pessoa |
| `email` | string | - | Endereço de e-mail da pessoa |
| `username` | string | - | Login da pessoa |
| `document` | string | - | CPF/CNPJ |
| `identification` | string | - | Matrícula |
| `isActive` | boolean | - | Indica se o cadastro da pessoa está ativo |
| `isSuperAdmin` | boolean | - | Indica se é super administrador |
| `isLocked` | boolean | - | Indica se o acesso da pessoa está bloqueado por tentativas de login inválido |
| `isAbsent` | boolean | - | Indica se a pessoa está em período de ausência temporária |
| `authenticationType` | string | - | Tipo de autenticação |
| `licenseType` | string | - | - |
| `createDate` | string (date-time) | - | Data em que a pessoa foi cadastrada |
| `lastLoginDate` | string (date-time) | - | Data o último login da pessoa |
| `lastPasswordChange` | string (date-time) | - | Data em que a senha foi alterada pela ultima vez |
| `businessShiftId` | integer (int32) | - | Código identificador do turno de trabalho |
| `leadership` | GetUsersModelResult+GetUsersModelResult_Leadership | - | Informações do gestor imediato desta pessoa |

---

### GetUsersModelResult+GetUsersModelResult_Leadership
_Orquestra.Models.Workflow.ApiModels.External._20.Users.GetUsersModelResult+GetUsersModelResult_Leadership_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Código identificador do gestor imediato |
| `name` | string | - | Nome do gestor imediato |
| `username` | string | - | Username do gestor imediato |
| `email` | string | - | Endereço de e-mail do gestor imediato |

---

### AddUserModel
_Orquestra.Models.Base.ApiModels.External._20.Users.AddUserModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `ifExists` | string | - | Indicativo da operação a realizar se o login já existe |
| `username` | string | - | Login ou e-mail de autenticação da pessoa |
| `name` | string | - | Nome da pessoa |
| `email` | string | - | E-mail para recebimento de notificações |
| `identification` | string | - | Número de documento ou identificação |
| `document` | string | - | Número de CPF (11 dígitos numéricos) ou CNPJ (14 caracteres: 12 alfanuméricos + 2 numéricos) |
| `isActive` | boolean | - | Indicador se a pessoa está ativa |
| `authenticationType` | string | - | Indicador do tipo de autenticação da pessoa |
| `licenseType` | string | - | Indicador do tipo de licenciamento a ser usado para a pessoa |
| `timeZone` | integer (int32) | - | Fuso horário do cliente |
| `positions` | AddUserModel+AddUserModel_TeamsAndPositions | - | Lista de times e funções da pessoa |
| `groups` | AddUserModel+AddUserModel_Groups | - | Lista de grupos de manutenção associadas à pessoa |
| `welcomeMessage` | AddUserModel+AddUserModel_WelcomeMessage | - | Mensagem de e-mail de instruções e boas vindas a ser enviadas |
| `businessShiftId` | integer (int32) | - | Turno de trabalho da pessoa |
| `leadershipId` | integer (int32) | - | Identificador único do gestor imediato da pessoa |

---

### AddUserModel+AddUserModel_TeamsAndPositions
_Orquestra.Models.Base.ApiModels.External._20.Users.AddUserModel+AddUserModel_TeamsAndPositions_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `ifExistsUser` | string | - | Indicativo da operação a realizar para os times e funções se o login já existe previamente |
| `items` | array | - | - |

---

### AddUserModel+AddUserModel_Groups
_Orquestra.Models.Base.ApiModels.External._20.Users.AddUserModel+AddUserModel_Groups_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `ifExistsUser` | string | - | Indicativo da operação a realizar para grupos se o login já existe previamente |
| `items` | array | - | - |

---

### AddUserModel+AddUserModel_WelcomeMessage
_Orquestra.Models.Base.ApiModels.External._20.Users.AddUserModel+AddUserModel_WelcomeMessage_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `send` | boolean | - | - |

---

### AddUserModel+AddUserModel_TeamsAndPositions+AddUserModel_TeamsAndPositions_Items
_Orquestra.Models.Base.ApiModels.External._20.Users.AddUserModel+AddUserModel_TeamsAndPositions+AddUserModel_TeamsAndPositions_Items_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `teamId` | integer (int32) | - | Identificador único do time |
| `teamCode` | string | - | Identificador do código original do time |
| `positionId` | integer (int32) | - | Identificador único da função |
| `positionCode` | string | - | Identificador do código original da função |

---

### AddUserModel+AddUserModel_Groups+AddUserModel_Groups_Items
_Orquestra.Models.Base.ApiModels.External._20.Users.AddUserModel+AddUserModel_Groups+AddUserModel_Groups_Items_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `groupId` | integer (int32) | - | Identificador único do grupo |
| `groupCode` | string | - | Identificador do código original do grupo |

---

### AddUserModelResult
_Orquestra.Models.Base.ApiModels.External._20.Users.AddUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `action` | string | - | Resultado da operação: Retrieved = Cadastro da pessoa já existia e o ID foi retornado | Update = Cadastro da pessoa já existia e foi atualizado | Created = Cadastro da pessoa foi criado | Error = A operação falhou |
| `id` | integer (int32) | - | Identificador da pessoa |
| `username` | string | - | Login da pessoa |
| `name` | string | - | Nome da pessoa |
| `email` | string | - | Email da pessoa |
| `identification` | string | - | Matrícula da pessoa |
| `document` | string | - | CPF / CNPJ |
| `isActive` | boolean | - | Indica se o cadastro da pessoa está ativo |
| `authenticationType` | string | - | Tipo de autenticação |
| `licenseType` | string | - | Tipo de licença |
| `businessShiftId` | integer (int32) | - | Código identificador do turno de trabalho  |
| `leadershipId` | integer (int32) | - | Informações do gestor imediato desta pessoa |

---

### PostTempUsersToRealUserModel
_Orquestra.Models.Workflow.ApiModels.External._20.Users.PostTempUsersToRealUserModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `userNames` | array | - | - |

---

### PostTempUsersToRealUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.PostTempUsersToRealUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | - |

---

### SendWelcomeModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.SendWelcomeModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |

---

### AddGroupToUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.AddGroupToUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |
| `userId` | integer (int32) | - | Identificador da pessoa |
| `groupId` | integer (int32) | - | Identificador do grupo |

---

### TransferOwnershipModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.TransferOwnershipModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação |
| `from` | integer (int32) | - | Código da pessoa de origem |
| `to` | integer (int32) | - | Código da pessoa de destino |

---

### ResetPasswordModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.ResetPasswordModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação |
| `email` | string | - | Endereço de e-mail da pessoa |

---

### CopyGroupsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.CopyGroupsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |
| `from` | integer (int32) | - | Código da pessoa de quem os grupos foram copiados |
| `to` | integer (int32) | - | Código da pessoa para quem os grupos foram copiados |

---

### CopyPositionsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.CopyPositionsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação |
| `from` | integer (int32) | - | Código da pessoa de quem as funções foram copiadas |
| `to` | integer (int32) | - | Código da pessoa para quem as funções foram copiadas |

---

### AddUserPositionToUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.AddUserPositionToUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |
| `userId` | integer (int32) | - | Identificador do usuário |
| `positionId` | integer (int32) | - | Identificador da função |
| `teamId` | integer (int32) | - | Identificador do time |

---

### LockUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.LockUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação |
| `userId` | integer (int32) | - | Identificador da pessoa |
| `username` | string | - | Login da pessoa |

---

### UnLockUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.UnLockUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação |
| `userId` | integer (int32) | - | Identificador da pessoa |
| `username` | string | - | Login da pessoa |

---

### ActivateUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.ActivateUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |

---

### DeactivateUserModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.DeactivateUserModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação |

---

### ForcePasswordChangeModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Users.ForcePasswordChangeModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso na operação |
| `userId` | integer (int32) | - | Identificador da pessoa |
| `username` | string | - | Login da pessoa |

---

### GetPositionsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Positions.GetPositionsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da função |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome da função |
| `level` | string | - | Relação de níveis hierarquicos |
| `parentId` | integer (int32) | - | Identificador da função de nível hierarquico superior |
| `description` | string | - | Descrição da função |
| `active` | boolean | - | Indica se a função está ativa |

---

### AddPositionModel
_Orquestra.Models.Workflow.ApiModels.External._20.Positions.AddPositionModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `active` | boolean | - | Indica se a função está ativa ou não para ser utilizada. Padrão: true |
| `code` | string | - | Identificador da função utilizado em APIs, integrações e customizações |
| `description` | string | - | Descrição da função |
| `name` | string | - | Nome da função |
| `parentId` | integer (int32) | - | Identificador da função superior |
| `teamId` | integer (int32) | - | Identificador do time para associar com a função |
| `type` | integer (int32) | - | Identificador do tipo da função |

---

### AddPositionModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Positions.AddPositionModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da função criada |

---

### GetPositionsDetailModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Positions.GetPositionsDetailModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da função |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome da função |
| `level` | string | - | Relação de níveis hierarquicos |
| `parentId` | integer (int32) | - | Identificador da função de nível hierarquico superior |
| `description` | string | - | Descrição da função |
| `active` | boolean | - | Indica se a função está ativa |

---

### GetPositionUsersModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Positions.GetPositionUsersModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da pessoa |
| `name` | string | - | Nome da pessoa |
| `username` | string | - | Login da pessoa |
| `email` | string | - | Endereço de e-mail da pessoa |
| `isActive` | boolean | - | Indica se o cadastro da pessoa está ativo |
| `licenseType` | string | - | Tipo de licença da pessoa |
| `position` | GetPositionUsersModelResult+GetPositionUsersModelResult_Position | - | Dados da função da pessoa |
| `team` | GetPositionUsersModelResult+GetPositionUsersModelResult_Team | - | Dados do time da pessoa |

---

### GetPositionUsersModelResult+GetPositionUsersModelResult_Position
_Orquestra.Models.Workflow.ApiModels.External._20.Positions.GetPositionUsersModelResult+GetPositionUsersModelResult_Position_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador  da função |
| `name` | string | - | Nome da função |
| `code` | string | - | Código original / Integração |

---

### GetPositionUsersModelResult+GetPositionUsersModelResult_Team
_Orquestra.Models.Workflow.ApiModels.External._20.Positions.GetPositionUsersModelResult+GetPositionUsersModelResult_Team_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `name` | string | - | Nome do time |
| `code` | string | - | Código original / Integração |

---

### ActivatePositionModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Positions.ActivatePositionModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |

---

### DeactivatePositionModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Positions.DeactivatePositionModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |

---

### GetRequestsModelResult
_Orquestra.Models.Workflow.ApiModels.Ecternal._20.Requests.GetRequestsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | string | - | - |
| `name` | string | - | Nome do tipo de aplicativo/serviço |
| `version` | integer (int32) | - | Versão do aplicativo/serviço, caso aplicável |
| `description` | string | - | Descrição do aplicativo/serviço, caso aplicável |
| `keywords` | array | - | Palavras-chave de identificação do aplicativo/serviço, caso aplicável |
| `link` | string | - | Link de abertura para requisição do aplicativo/serviço |
| `action` | string | - | Identificador ação dessa solicitação  |
| `lastDeploy` | string (date-time) | - | Data do deploy dessa solicitação  |
| `favorite` | boolean | - | Indicação se esse aplicativo/serviço é favorito da pessoa relacionada ao token |
| `new` | boolean | - | Indicação se esse aplicativo/serviço foi recentemente publicado |
| `deploy` | boolean | - | Indicação se esse aplicativo/serviço está publicado |
| `deployMobile` | boolean | - | Indicação se esse aplicativo/serviço está publicado para uso em mobile |
| `deployBeforeLoginStart` | boolean | - | Indicação se esse aplicativo/serviço está publicado antes do login |
| `deployAnonymousStart` | boolean | - | Indicação se esse aplicativo/serviço está publicado para solicitação por pessoa anônima |
| `deployAnonymousDocs` | boolean | - | Indicação se a documentação desse aplicativo/serviço está publicada para utilização por pessoa anônima |
| `deployAnonymousReport` | boolean | - | Indicação se os relatórios de acompanhamento desse aplicativo/serviço estão publicados para visualização por pessoa anônima, com o uso de código verificador |
| `externalApp` | boolean | - | Indicação se esse aplicativo/serviço leva a pessoa a uma aplicação externa |
| `flow` | GetRequestsModelResult+GetRequestsModelResult_Flows | - | Indicação do aplicativo relacionado |
| `service` | GetRequestsModelResult+GetRequestsModelResult_Services | - | Indicação do serviço relacionado |
| `teams` | array | - | Lista dos times relacionados a esse aplicativo/serviço |

---

### GetRequestsModelResult+GetRequestsModelResult_Flows
_Orquestra.Models.Workflow.ApiModels.Ecternal._20.Requests.GetRequestsModelResult+GetRequestsModelResult_Flows_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do aplicativo |
| `uid` | string (uuid) | - | Identificador GUID do aplicativo |

---

### GetRequestsModelResult+GetRequestsModelResult_Services
_Orquestra.Models.Workflow.ApiModels.Ecternal._20.Requests.GetRequestsModelResult+GetRequestsModelResult_Services_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do serviço |
| `uid` | string (uuid) | - | Identificador GUID do serviço |

---

### GetRequestsModelResult+GetRequestsModelResult_Teams
_Orquestra.Models.Workflow.ApiModels.Ecternal._20.Requests.GetRequestsModelResult+GetRequestsModelResult_Teams_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `name` | string | - | Nome do time |

---

### GetFlowsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Requests.GetFlowsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do aplicativo |
| `uid` | string (uuid) | - | Identificador GUID do aplicativo |
| `name` | string | - | Nome do aplicativo |
| `description` | string | - | Descrição do aplictivo |
| `version` | integer (int32) | - | Versão do aplicativo |
| `link` | string | - | Link de abertura para requisição do aplicativo |
| `lastDeploy` | string (date-time) | - | Data de publicação |
| `favorite` | boolean | - | Indica se o aplicativo está marcado como favorito para a pessoa autenticada |
| `deploy` | boolean | - | Indica se o aplicativo está publicado |
| `deployMobile` | boolean | - | Indica se o aplicativo está publicado para dispositivos móveis |
| `deployBeforeLoginStart` | boolean | - | Indica se o aplicativo está publicado para usuários autenticados |
| `deployAnonymousStart` | boolean | - | Indica se o aplicativo está publicado para usuários anônimos |
| `teams` | array | - | Lista dos times relacionados a esse aplicativo |

---

### GetFlowsModelResult+GetFlowsModelResult_Teams
_Orquestra.Models.Workflow.ApiModels.External._20.Requests.GetFlowsModelResult+GetFlowsModelResult_Teams_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `name` | string | - | Nome do time |

---

### GetServicesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Requests.GetServicesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do serviço |
| `uid` | string (uuid) | - | Identificador GUID do serviço |
| `name` | string | - | Nome do serviço |
| `description` | string | - | Descrição do serviço |
| `url` | string | - | URL do serviço externo, se aplicável |
| `keywords` | array | - | Palavras-chave de identificação do serviço, caso aplicável |
| `lastDeploy` | string (date-time) | - | Data da publicação |
| `link` | string | - | Link de abertura para requisição do serviço |
| `favorite` | boolean | - | Indicação se esse serviço é favorito da pessoa relacionada ao token |
| `deploy` | boolean | - | Indicação se esse serviço está publicado |
| `deployMobile` | boolean | - | Indicação se esse serviço está publicado para uso em mobile |
| `deployBeforeLoginStart` | boolean | - | Indicação se esse serviço está publicado antes do login |
| `deployAnonymousStart` | boolean | - | Indicação se esse serviço está publicado para solicitação por pessoa anônima |
| `flow` | GetServicesModelResult+GetServicesModelResult_Flows | - | Indicação do aplicativo relacionado |
| `teams` | array | - | Lista dos times relacionados a esse serviço |

---

### GetServicesModelResult+GetServicesModelResult_Flows
_Orquestra.Models.Workflow.ApiModels.External._20.Requests.GetServicesModelResult+GetServicesModelResult_Flows_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do aplicativo |
| `name` | string | - | Nome do aplicativo |
| `version` | integer (int32) | - | Versão do aplicativo |

---

### GetServicesModelResult+GetServicesModelResult_Teams
_Orquestra.Models.Workflow.ApiModels.External._20.Requests.GetServicesModelResult+GetServicesModelResult_Teams_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `name` | string | - | Nome do time |

---

### GetServicesModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Services.GetServicesModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do serviço |
| `code` | string (uuid) | - | Identificador GUID do serviço |
| `createdDate` | string (date-time) | - | Data de criação |
| `createdBy` | string | - | Pessoa que criou o serviço |
| `type` | string | - | Tipo de serviço (link = serviço externo | process = aplicativo |
| `name` | string | - | Nome do serviço |
| `description` | string | - | Descrição do serviço |
| `keywords` | array | - | Lista de palavras chave, quando aplicável |
| `deploy` | boolean | - | Indica se o serviço está publicado |
| `lastDeploy` | string (date-time) | - | Data de publicação |
| `teams` | array | - | Indicador dos times relacionados ao serviço |
| `flow` | GetServicesModelResult+GetServicesModelResultFlows | - | Indicador dos aplicativos relacionados ao serviço |
| `url` | string | - | Url do serviço externo,se aplicável |
| `sendParametersToUrl` | boolean | - | Indica se o serviço envia os parâmetros incluidos na URL |
| `tutorial` | GetServicesModelResult+GetServiceModelResultTutorial | - | Gestão de conhecimento |
| `authorization` | GetServicesModelResult+GetServiceModelResultAuthorization | - | Permissões de acesso ao serviço |

---

### GetServicesModelResult+GetServicesModelResultTeams
_Orquestra.Models.Workflow.ApiModels.External._20.Services.GetServicesModelResult+GetServicesModelResultTeams_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome do time |

---

### GetServicesModelResult+GetServicesModelResultFlows
_Orquestra.Models.Workflow.ApiModels.External._20.Services.GetServicesModelResult+GetServicesModelResultFlows_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do aplicativo |
| `uid` | string (uuid) | - | Identificador GUID do aplicativo |
| `name` | string | - | Nome do aplicativo |
| `version` | integer (int32) | - | Versão do aplicativo |
| `contents` | string | - | Conteúdo do aplicativo, se aplicável |
| `form` | array | - | - |

---

### GetServicesModelResult+GetServiceModelResultTutorial
_Orquestra.Models.Workflow.ApiModels.External._20.Services.GetServicesModelResult+GetServiceModelResultTutorial_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | - |
| `name` | string | - | Título da gestão de conhecimento |
| `version` | integer (int32) | - | Versão |
| `createdDate` | string (date-time) | - | Data de criação |
| `contents` | string | - | Conteúdo |
| `active` | boolean | - | Indica se está ativa a gestão de conhecimento |

---

### GetServicesModelResult+GetServiceModelResultAuthorization
_Orquestra.Models.Workflow.ApiModels.External._20.Services.GetServicesModelResult+GetServiceModelResultAuthorization_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `request` | GetServicesModelResult+GetServiceModelResultRequest | - | Indica quem pode iniciar uma instância de solicitação do serviço |
| `edit` | GetServicesModelResult+GetServiceModelResultEdit | - | Indica quem pode editar o serviço |
| `report` | GetServicesModelResult+GetServiceModelResultReport | - | Indica quem pode acessar em relatórios instâncias do serviço |

---

### GetServicesModelResult+GetServiceModelResultForm
_Orquestra.Models.Workflow.ApiModels.External._20.Services.GetServicesModelResult+GetServiceModelResultForm_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `name` | string | - | - |
| `value` | string | - | - |
| `order` | integer (int32) | - | - |

---

### GetServicesModelResult+GetServiceModelResultRequest
_Orquestra.Models.Workflow.ApiModels.External._20.Services.GetServicesModelResult+GetServiceModelResultRequest_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `content` | array | - | - |

---

### GetServicesModelResult+GetServiceModelResultEdit
_Orquestra.Models.Workflow.ApiModels.External._20.Services.GetServicesModelResult+GetServiceModelResultEdit_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `content` | array | - | - |

---

### GetServicesModelResult+GetServiceModelResultReport
_Orquestra.Models.Workflow.ApiModels.External._20.Services.GetServicesModelResult+GetServiceModelResultReport_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `content` | array | - | - |

---

### ServiceImportModel
_Orquestra.Models.Workflow.ApiModels.External._20.Services.ServiceImportModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `type` | string | - | Tipo |
| `name` | string | - | Nome |
| `description` | string | - | Descrição |
| `keywords` | array | - | Palavras-chave |
| `teams` | array | - | Times |
| `flow` | ServiceFlowImportModel | - | Processo associado |
| `url` | string | - | Url do serviço |
| `sendParametersToUrl` | boolean | - | Enviar parametros para a Url do serviço |
| `tutorial` | ServiceTutorialImportModel | - | Gestão do conhecimento |
| `validations` | array | - | - |

---

### ServiceTeamImportModel
_Orquestra.Models.Workflow.ApiModels.External._20.Services.ServiceTeamImportModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `code` | string | - | Código do time |

---

### ServiceFlowImportModel
_Orquestra.Models.Workflow.ApiModels.External._20.Services.ServiceFlowImportModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `uid` | string | - | Código do processo associado |
| `contents` | string | - | XML do processo exportado |
| `form` | array | - | - |

---

### ServiceTutorialImportModel
_Orquestra.Models.Workflow.ApiModels.External._20.Services.ServiceTutorialImportModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `name` | string | - | Nome do tutorial |
| `version` | integer (int32) | - | Versão |
| `contents` | string | - | Conteúdo do tutorial |
| `required` | boolean | - | - |
| `active` | boolean | - | - |

---

### ServiceFlowFormImportModel
_Orquestra.Models.Workflow.ApiModels.External._20.Services.ServiceFlowFormImportModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `name` | string | - | Nome do campo |
| `value` | string | - | Valor padrão |

---

### ServiceImportModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Services.ServiceImportModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Id do serviço importado |

---

### GetTeamsDetailModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.GetTeamsDetailModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome do time |
| `parentId` | integer (int32) | - | Identificador do time hierarquicamente superior |
| `level` | string | - | Relação de níveis hierarquicos |
| `sign` | string | - | Sigla |
| `alwaysVisible` | boolean | - | - |
| `active` | boolean | - | Indica se o time está ativo |
| `description` | string | - | Descrição do time |
| `type` | string | - | Tipo de time |
| `state` | string | - | Estado associado ao time |
| `city` | string | - | Cidade associada ao time |
| `parent` | GetTeamsDetailModelResult+GetTeamsDetailModelResult_Parent | - | Time hierarquicamente superior |

---

### GetTeamsDetailModelResult+GetTeamsDetailModelResult_Parent
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.GetTeamsDetailModelResult+GetTeamsDetailModelResult_Parent_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome do time |

---

### GetTeamsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.GetTeamsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | - |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome do time |
| `level` | string | - | Relação de nível hierárquicos |
| `sign` | string | - | Sigla do time |
| `parentId` | integer (int32) | - | Identificador do time superior hierarquicamente |
| `alwaysVisible` | boolean | - | - |
| `active` | boolean | - | Indica se o time está ativo |
| `description` | string | - | Descrição do time |
| `type` | string | - | Tipo do time |
| `state` | string | - | Estado relacionado ao time |
| `city` | string | - | Cidade relacionada ao time |
| `parent` | GetTeamsModelResult+GetTeamsModelResult_Parent | - | Time hierarquicamente superior |

---

### GetTeamsModelResult+GetTeamsModelResult_Parent
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.GetTeamsModelResult+GetTeamsModelResult_Parent_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `default` | string | - | - |
| `name` | string | - | Nome do time |

---

### AddTeamModel
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.AddTeamModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `active` | boolean | - | Indica se o time está ativo ou não para ser utilizado. Padrão: true |
| `alwaysVisible` | boolean | - | Indica se o time é apresentado mesmo quando não há aplicativo ou serviço vinculados a ele. Padrão: false |
| `cityId` | integer (int32) | - | Identificador da cidade |
| `code` | string | - | Identificador do time utilizado em APIs, integrações e customizações |
| `description` | string | - | Descrição do time |
| `name` | string | - | Nome do time |
| `parentId` | integer (int32) | - | Identificador do time superior |
| `sign` | string | - | Sigla do time |
| `type` | integer (int32) | - | Identificador do tipo do time |

---

### AddTeamModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.AddTeamModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time criado |

---

### GetTeamPositionsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.GetTeamPositionsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da função |
| `code` | string | - | Código original / Integração |
| `name` | string | - | Nome da função |
| `level` | string | - | Relação de níveis hierarquicos |
| `active` | boolean | - | Indica se a função está ativa |

---

### GetTeamUsersModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.GetTeamUsersModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da pessoa |
| `name` | string | - | Nome da pessoa |
| `username` | string | - | Login da pessoa |
| `email` | string | - | Endereço de email da pessoa |
| `isActive` | boolean | - | Indica se a pessoa está ativa |
| `licenseType` | string | - | Tipo de licença |
| `position` | GetTeamUsersModelResult+GetTeamUsersModelResult_Position | - | Função atribuída à pessoa |
| `team` | GetTeamUsersModelResult+GetTeamUsersModelResult_Team | - | Time atribuído à pessoa |

---

### GetTeamUsersModelResult+GetTeamUsersModelResult_Position
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.GetTeamUsersModelResult+GetTeamUsersModelResult_Position_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da função |
| `name` | string | - | Nome da função |
| `code` | string | - | Código original / Integração |

---

### GetTeamUsersModelResult+GetTeamUsersModelResult_Team
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.GetTeamUsersModelResult+GetTeamUsersModelResult_Team_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador do time |
| `name` | string | - | Título do time |
| `code` | string | - | Código original / Integração |

---

### ActivateTeamModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.ActivateTeamModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |

---

### DeactivateTeamModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Teams.DeactivateTeamModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `success` | boolean | - | Indica se houve sucesso |

---

### GetActualTokenModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Tokens.GetActualTokenModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `userId` | integer (int32) | - | Identificador da pessoa |
| `username` | string | - | Nome da pessoa |
| `temporaryToken` | string | - | Token temporário que representa a pessoa autenticada |

---

### GetTokenByCredentialsModel
_Orquestra.Models.Workflow.ApiModels.External._20.Tokens.GetTokenByCredentialsModel_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `login` | string | - | - |
| `password` | string | - | - |

---

### GetTokenByCredentialsModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Tokens.GetTokenByCredentialsModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `userId` | integer (int32) | - | Identificador da pessoa |
| `name` | string | - | Nome da pessoa |
| `username` | string | - | Login da pessoa |
| `temporaryToken` | string | - | Token temporário que representa a pessoa autenticada |

---

### GetImpersonateTokenModelResult
_Orquestra.Models.Workflow.ApiModels.External._20.Tokens.GetImpersonateTokenModelResult_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `current` | GetImpersonateTokenModelResult+GetImpersonateUser_Details | - | Dados da pessoa que personifica |
| `impersonate` | GetImpersonateTokenModelResult+GetImpersonateUser_Details | - | Dados da pessoa personificada |

---

### GetImpersonateTokenModelResult+GetImpersonateUser_Details
_Orquestra.Models.Workflow.ApiModels.External._20.Tokens.GetImpersonateTokenModelResult+GetImpersonateUser_Details_

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | integer (int32) | - | Identificador da pessoa |
| `name` | string | - | Nome da pessoa |
| `username` | string | - | Login da pessoa |
| `temporaryToken` | string | - | Token temporário que representa a pessoa autenticada |

---

