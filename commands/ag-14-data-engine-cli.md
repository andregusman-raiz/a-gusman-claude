# ag-14-data-engine-cli

Use este comando quando uma plataforma, app, agente ou automacao precisar pedir acesso governado a dados/APIs do Data Engine.

## Fase -1: Resolver CLI

Antes de concluir que o CLI `data-engine` nao existe, verifique:

```bash
data-engine --help
```

Se nao estiver no PATH, use o repo local:

```bash
cd /Users/andregusmandeoliveira/Claude/GitHub/raiz-data-engine
uv run data-engine --help
```

Se a branch local nao tiver `raiz_data_engine/cli/main.py`, verifique `origin/main`:

```bash
git fetch origin main --prune
git show origin/main:pyproject.toml | rg "data-engine ="
git ls-tree -r --name-only origin/main | rg "^raiz_data_engine/cli/main.py$"
```

Nunca diga "CLI nao existe" apenas porque o comando nao esta instalado globalmente. Diferencie:

- CLI nao implementado no codigo;
- CLI implementado, checkout antigo;
- CLI implementado, nao instalado no PATH.

## Fase 0: Knowledge Gateway obrigatorio

Antes de responder, mapear, sugerir escopo ou abrir pedido, consulte:

```text
GET /v1/knowledge/llm-context
GET /v1/knowledge/index
GET /v1/agent/contract
```

Para detalhes:

```text
GET /v1/knowledge/resources/{resource_type}/{resource_id}
```

Tipos validos:

```text
kpi
provider
contract
panel
endpoint
dbt_model
agent_contract
```

A fonte canonica e o Knowledge Gateway, compilado de OpenAPI, manifests, registries, contracts, providers, dbt e Alembic.

Trate:

- `known_gaps` como gaps do discovery plane;
- `known_limitations` como limitacoes declaradas dos recursos.

## Ordem preferida

1. `/v1/knowledge/llm-context`
2. `/v1/knowledge/index`
3. `/v1/agent/contract`
4. `/v1/kpis/search` ou `/v1/kpis/catalog`
5. `/v1/agg/canonical/{panel_id}/{metric_id}`
6. `/openapi.json` apenas para confirmar contrato tecnico

Raw SQL so como fallback, com `source="neon"`, quando rotas canonicas nao resolverem e o motivo estiver documentado.

## Fluxo

1. Entenda `$ARGUMENTS`.
2. Resolva o runtime do CLI.
3. Consulte Knowledge Gateway.
4. Prefira rotas canonicas.
5. Busque operacao com `uv run data-engine catalog search`.
6. Gere manifesto com `uv run data-engine access draft`.
   - Para LLM, use `--allow-llm`, scope especifico como `read:llm`, provider/modelo/budget quando disponiveis.
7. Valide com `uv run data-engine access validate`.
8. Faca preview com `uv run data-engine access preview`.
9. Abra pedido com `uv run data-engine access request`.
10. Informe request id, status e pendencia de aprovacao.

## Contratos reais do CLI (nao inventar sintaxe)

- `access draft` exige `--need` e `--expires`; operacoes via `--operation "<op_id>=<scope>"` (repetivel).
- `access validate|preview|request|drift` usam `--file <path>` (NAO argumento posicional).
- `access status|cancel|renew` usam `--request-id <id>` (alias `--id`); `renew` tambem `--expires-at <iso>`.
- `access descriptor` usa `--connection-id <id>`.
- `catalog search "<termo>"` e `catalog operation "<operation_id>"` recebem argumento posicional.
- `access request` retorna `approval_required: true` + `approval_url`. Nunca aprovar.
- Flags globais: `--json --quiet --no-color --timeout --base-url --api-key --repo-ref --git-sha`.

## Variaveis

Use sem imprimir valores:

```bash
DATA_ENGINE_BASE_URL
DATA_ENGINE_ACCESS_BROKER_TOKEN
DATA_ENGINE_CONSUMER_ID
DATA_ENGINE_ENVIRONMENT
RDE_BASE_URL
RDE_ACCESS_BROKER_KEY
DATA_ENGINE_API_KEY
```

## Proibicoes

- Nao aprovar acesso.
- Nao revelar segredo.
- Nao imprimir token.
- Nao criar wildcard.
- Nao usar raw SQL como primeira opcao.
- Nao contornar o Access Broker.

## LLM

LLM e permitido neste comando quando declarado explicitamente.

Use:

```bash
uv run data-engine access draft \
  --consumer <consumer> \
  --environment <environment> \
  --need "<necessidade LLM>" \
  --operation "POST /v1/llm/chat=read:llm" \
  --allow-llm \
  --llm-provider data_engine_router \
  --llm-model gpt-5.2 \
  --llm-budget-usd 25 \
  --expires 2026-12-31T23:59:59Z \
  --output data-engine.access.yaml
```

Mesmo com LLM, a IA nao aprova nem provisiona. O pedido fica pendente no Control Plane.

## Output

Retorne:

- consumer;
- environment;
- recursos solicitados;
- validacao;
- preview;
- request id;
- status;
- proximo passo no Control Plane.

$ARGUMENTS
