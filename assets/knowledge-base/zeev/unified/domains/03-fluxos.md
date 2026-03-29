# Fluxos (Flows/Processes)

> Templates de processos BPMN. Define as etapas, formulários, condições de routing e responsáveis.

---

## Conceitos-Chave

- Flow = template. Instance = execução desse template
- Cada flow tem etapas (nodes), transições, formulários e regras
- API limita: sem acesso à definição BPMN, formulários ou condições de routing
- Apenas listagem de fluxos ativos via /flows/edit (admin)

---

## Endpoints (8)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/2/flows/edit` | Lista de aplicativos que posso editar (Auth) |
| POST | `/api/2/flows/import` | Importar um aplicativo a partir de formato intercambiável (Auth) |
| GET | `/api/2/flows/{flowid}/design/elements` | Lista os elementos que compoem o design do aplicativo (Auth) |
| GET | `/api/2/flows/{flowid}/design/form` | Lista os campos de formularios associados ao aplicativo (Auth) |
| GET | `/api/2/flows/{flowid}/design/users` | Lista as pessoas que compõem o design do aplicativo (Auth) |
| GET | `/api/2/flows/{flowid}/export` | Exportar um aplicativo para formato intercambiável (Auth) |
| POST | `/api/2/instances/subprocess` | Criar um novo subprocesso a partir de uma solicitação. |
| GET | `/api/2/requests/flows` | Listar aplicativos que podem ser iniciados pela pessoa autenticada |

---

## Integração raiz-platform

Implementado: flow_list (agent tool). Limitado: sem modelagem, sem form schema.

Ver `unified/integration.json` para routes, env vars e agent tool actions.
