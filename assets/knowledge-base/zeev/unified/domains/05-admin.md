# Administração e Relatórios

> Endpoints de gestão: SLA, grupos organizacionais, relatórios, backlog, aging. Requer service account (não impersonation).

---

## Conceitos-Chave

- SLA overview: total/on-time/late com percentuais
- Backlog by area: top 15 fluxos com mais tarefas pendentes
- Backlog by person: top 20 pessoas mais carregadas
- Aging report: distribuição por idade (0-7d, 7-30d, 30-90d, 90d+)
- Grupos: estrutura organizacional hierárquica
- Limite: /assignments/report max 500 items

---

## Endpoints (63)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/api/2/assignments/report` | Listar todas atribuições de atividades pendentes do sistema de acordo com filtro |
| POST | `/api/2/assignments/report/count` | Contar todas as atribuições de atividades pendentes do sistema de acordo com fil |
| POST | `/api/2/files/createfile` | Gerar um documento PDF ou DOCX populando-o com informações e variáveis da instân |
| GET | `/api/2/geo/countries` | Lista todos os países cadastrados, com a opção de filtrar por palavra chave com  |
| GET | `/api/2/geo/countries/{countryid}/states` | Lista todos os estados de um país com a opção de filtrar por palavra chave com s |
| GET | `/api/2/geo/states/{stateid}/cities` | Lista todas as cidades de um estado com a opção de filtrar por palavra chave com |
| GET | `/api/2/groups` | Listar todos os grupos de manutenção do sistema (Auth) |
| GET | `/api/2/groups/code/{groupcode}` | Obter grupo de manutenção pelo código original / integração (Auth) |
| GET | `/api/2/groups/code/{groupcode}/users` | Listar as pessoas vinculadas ao grupo por código de original / integração (Auth) |
| GET | `/api/2/groups/{groupid}` | Obter grupo de manutenção pelo código identificador (Auth) |
| GET | `/api/2/groups/{groupid}/permissions` | Listar as permissões associadas ao grupo (Auth) |
| GET | `/api/2/groups/{groupid}/users` | Listar as pessoas vinculadas ao grupo (Auth) |
| GET | `/api/2/instances/report` | Listar todas instâncias de solicitações que a pessoa relacionada ao token possui |
| POST | `/api/2/instances/report` | Listar todas instâncias de solicitações que a pessoa relacionada ao token possui |
| POST | `/api/2/instances/report/count` | Contar as instâncias de solicitações que a pessoa relacionada ao token possui pe |
| GET | `/api/2/integrations/{integrationuid}/execute` | Executar uma integração a partir do UID, retornando os valores transformados da  |
| POST | `/api/2/integrations/{integrationuid}/execute` | Executar uma integração a partir do UID, retornando os valores transformados da  |
| POST | `/api/2/messages` | Adicionar mensagem a uma instância de solicitação por código identificador da in |
| GET | `/api/2/positions` | Listar funções que a pessoa relacionada ao token tem permissão de visualizar (Au |
| POST | `/api/2/positions` | Criar uma função (Auth) |
| GET | `/api/2/positions/code/{positioncode}` | Obter função pelo código original / integração (Auth) |
| GET | `/api/2/positions/code/{positioncode}/users` | Listar as pessoas associadas a essa função (Auth) |
| GET | `/api/2/positions/{positionid}` | Obter função específica pelo código (Auth) |
| PATCH | `/api/2/positions/{positionid}/activate` | Ativar uma função pelo identificador (Auth) |
| PATCH | `/api/2/positions/{positionid}/deactivate` | Desativar uma função pelo identificador (Auth) |
| POST | `/api/2/services/import` | Importar um novo serviço (Auth) |
| GET | `/api/2/services/{serviceid}` | Retorna o JSON de exportação do serviço informado (Auth) |
| GET | `/api/2/teams` | Listar times que a pessoa relacionada ao token tem permissão de visualizar (Auth |
| POST | `/api/2/teams` | Criar um time (Auth) |
| GET | `/api/2/teams/code/{teamcode}` | Obter time pelo código original / integração (Auth) |
| GET | `/api/2/teams/code/{teamcode}/users` | Listar as pessoas associadas a esse time (Auth) |
| GET | `/api/2/teams/code/{teamcode}/{positioncode}/users` | Listar as pessoas associadas a esse time com a posição definida (Auth) |
| GET | `/api/2/teams/{teamid}` | Obter time pelo código identificador (Auth) |
| PATCH | `/api/2/teams/{teamid}/activate` | Ativar um time pelo identificador (Auth) |
| PATCH | `/api/2/teams/{teamid}/deactivate` | Desativar um time pelo identificador (Auth) |
| GET | `/api/2/teams/{teamid}/positions` | Listar as funções relacionadas ao time (Auth) |
| GET | `/api/2/users` | Listar as pessoas do sistema (Auth) |
| POST | `/api/2/users` | Cadastrar uma pessoa, com grupos de manutenção, times e funções relacionados (Au |
| GET | `/api/2/users/temp` | Listar todas as pessoas da área de transferência (Auth) |
| POST | `/api/2/users/temp` | Sincronizar e inserir as pessoas da área de transferência selecionados (Auth) |
| POST | `/api/2/users/temp/import` | Transformar pessoas temporárias em pessoas finais (Auth) |
| GET | `/api/2/users/username/{username}` | Obter pessoa por username (Auth) |
| GET | `/api/2/users/{userid}` | Obter pessoa por código (Auth) |
| DELETE | `/api/2/users/{userid}` | Excluir uma pessoa por código (Auth) |
| PATCH | `/api/2/users/{userid}/absent/enter` | Definir pessoa como em ausência temporária por código (Auth) |
| PATCH | `/api/2/users/{userid}/absent/leave` | Tirar uma pessoa de ausência temporária por código (Auth) |
| PATCH | `/api/2/users/{userid}/account/activate` | Ativar uma pessoa por código (Auth) |
| PATCH | `/api/2/users/{userid}/account/deactivate` | Desativar uma pessoa por código (Auth) |
| PATCH | `/api/2/users/{userid}/account/lock` | Bloquear o acesso de uma pessoa ao sistema por código (Auth) |
| PATCH | `/api/2/users/{userid}/account/unlock` | Desbloquear o acesso de uma pessoa ao sistema por código (Auth) |
| GET | `/api/2/users/{userid}/groups` | Listar grupos de manutenção por código da pessoa (Auth) |
| POST | `/api/2/users/{userid}/groups/copy/{newuserid}` | Copia todos os grupos de manutenção de uma pessoa para outra (Auth) |
| POST | `/api/2/users/{userid}/groups/{groupid}` | Adicionar um grupo de manutenção a uma pessoa (Auth) |
| DELETE | `/api/2/users/{userid}/groups/{groupid}` | Excluir um grupo de manutenção de uma pessoa (Auth) |
| GET | `/api/2/users/{userid}/password/change-link` | Pegar link e chave de alteração de senha (Auth) |
| PATCH | `/api/2/users/{userid}/password/force-change` | Forçar pessoa a alterar sua senha no próximo login (Auth) |
| GET | `/api/2/users/{userid}/positions` | Listar posições e times por código da pessoa (Auth) |
| POST | `/api/2/users/{userid}/positions/copy/{newuserid}` | Copia todos os times e funções de uma pessoa para outra (Auth) |
| POST | `/api/2/users/{userid}/positions/{positionid}/{teamid}` | Adicionar um time e função a uma pessoa (Auth) |
| DELETE | `/api/2/users/{userid}/positions/{positionid}/{teamid}` | Excluir um time e função de uma pessoa (Auth) |
| POST | `/api/2/users/{userid}/transfer/{newuserid}` | Transferir a propriedade de dados de uma pessoa para outra (Auth) |
| POST | `/api/2/users/{userid}/welcome` | Enviar instruções de boas vindas à pessoa (Auth) |
| GET | `/api/2/users/{username}` | Obter pessoa por username (Auth) |

---

## Integração raiz-platform

Implementado: 5 agent actions (sla_overview, backlog_by_area, backlog_by_person, aging_report, flow_list).

Ver `unified/integration.json` para routes, env vars e agent tool actions.
