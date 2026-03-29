# Solicitações (Instances)

> Processos abertos pelos usuários no Zeev. Cada solicitação é uma execução (instance) de um fluxo BPMN.

---

## Conceitos-Chave

- Instance = execução de um fluxo. Tem número, status, formulário preenchido, histórico
- Cada instance pertence a um usuário (criador) e pode ter responsáveis em cada etapa
- Status: Em andamento, Concluída, Cancelada
- formFields contém os dados preenchidos — estrutura varia por fluxo

---

## Endpoints (12)

| Método | Path | Descrição |
|--------|------|-----------|
| PATCH | `/api/2/formvalues/{frominstanceid}/copy-to/{toinstanceid}` | Copia os valores de campos de formulário entre instâncias (Auth) |
| PATCH | `/api/2/formvalues/{instanceid}` | Atualizar campos de formulário da instância (Auth) |
| PATCH | `/api/2/formvalues/{instanceid}/history/clear` | Apaga o histórico do preenchimento dos campos do formulário em todas as tarefas  |
| GET | `/api/2/instances` | Listar todas instâncias de solicitações em que a pessoa relacionada ao token é o |
| POST | `/api/2/instances` | Criar uma nova instância de solicitação |
| GET | `/api/2/instances/{instanceid}` | Obter dados da instância específica por código identificador da instância da sol |
| PATCH | `/api/2/instances/{instanceid}/cancel` | Cancelar uma instância de solicitação por código da solicitação |
| PATCH | `/api/2/instances/{instanceid}/cancel/undo` | Reverter cancelamento de uma instância de solicitação por código da solicitação |
| GET | `/api/2/messages/instance/{instanceid}` | Listar mensagems de uma instância de solicitação |
| GET | `/api/2/requests` | Listar aplicativos e serviços que podem ser iniciados pela pessoa autenticada |
| GET | `/api/2/requests/services` | Listar serviços que podem ser iniciados pela pessoa autenticada |
| POST | `/api/2/users/{userid}/password/request-reset` | Enviar e-mail para pessoa definir nova senha (Auth) |

---

## Integração raiz-platform

Implementado: GET /instances, GET /instances/{id} via zeev-proxy.service.ts. Agent tool: list_instances, get_instance, search_ticket.

Ver `unified/integration.json` para routes, env vars e agent tool actions.
