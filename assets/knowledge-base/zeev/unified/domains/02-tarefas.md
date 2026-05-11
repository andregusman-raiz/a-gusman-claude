# Tarefas (Assignments)

> Atividades pendentes atribuídas a usuários. Cada tarefa é uma etapa de um processo que requer ação humana.

---

## Conceitos-Chave

- Assignment = tarefa atribuída. Tem prazo (SLA), fluxo de origem, ações disponíveis
- Ações: completar, devolver, encaminhar (depende da configuração do fluxo)
- Visibilidade: cada usuário vê apenas suas próprias tarefas (via impersonation)
- Relatório SLA: /assignments/report retorna max 500 items (limitação da API)

---

## Endpoints (11)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/2/assignments` | Listar as atribuições de atividades pendentes da pessoa relacionada ao token de  |
| POST | `/api/2/assignments/forward` | Encaminhar tarefas pendentes de um usuário para outro usuário (Auth) |
| PUT | `/api/2/assignments/instance/{instanceid}/{code}` | Finalizar tarefa atribuída a pessoa por código da instância e código original/in |
| GET | `/api/2/assignments/user/{userid}` | Listar as atividades atribuidas a uma pessoa por código (Auth) |
| GET | `/api/2/assignments/user/{username}` | Listar as atividades atribuidas a uma pessoa por username (Auth) |
| GET | `/api/2/assignments/user/{username}/count` | Contar as atividades atribuidas a uma pessoa por username (Auth) |
| GET | `/api/2/assignments/{assignmentid}` | Obter uma atribuição de atividade especifica (Auth) |
| PUT | `/api/2/assignments/{assignmentid}` | Finalizar tarefa atribuída a uma pessoa por código identificador da atribuição d |
| GET | `/api/2/assignments/{assignmentid}/actions` | Listar as ações de conclusão possíveis de uma atribuição de atividade específica |
| POST | `/api/2/files/instance-task` | Adicionar um anexo de no máximo 50mb a uma instância de tarefa por código identi |
| POST | `/api/2/messages/instance-task` | Adicionar mensagem a uma instância de tarefa por código identificador da instânc |

---

## Integração raiz-platform

Implementado: GET /assignments, GET /assignments/{id}/actions, PUT (complete). Agent tool: list_assignments, get_actions.

Ver `unified/integration.json` para routes, env vars e agent tool actions.
