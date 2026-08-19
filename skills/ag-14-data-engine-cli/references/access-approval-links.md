# Referencia — links governados de aprovacao (handoff humano via SSO)

> Carregada sob demanda pela skill `ag-14-data-engine-cli`.
> Fonte canonica no repo raiz-data-engine: `docs/runbooks/access-broker-approval-links.md`,
> `raiz_data_engine/api/v1/access_broker_approval_links.py`,
> `raiz_data_engine/access_broker/approval_links.py`.

Regra que governa tudo nesta pagina: **a IA gera o link; somente o humano autenticado
decide e aprova.**

## Endpoint

```text
POST /v1/access-broker/approval-links
```

Payload:

```json
{"request_id": "REQ-...", "expires_in_seconds": 900}
```

- `expires_in_seconds`: minimo `300`, maximo `1800` (5 a 30 minutos). Default `900`.
- O CLI expoe isso como `--expires-in 15m` e converte minutos para segundos.

Scope obrigatorio e exato na credencial geradora:

```text
approval_link:create
```

Nao serve `*`, `admin`, `write:access-broker` nem qualquer scope de aprovacao. A rota exige
autenticacao de maquina: sessao SSO/OAuth de humano e recusada com
`APPROVAL_LINK_MACHINE_AUTH_REQUIRED`.

## Resposta (201)

```json
{
  "ok": true,
  "request_id": "REQ-...",
  "approval_url": "https://<origem-canonica>/admin/access-approval/<token>",
  "expires_at": "2026-08-19T18:15:00Z"
}
```

Entregue `approval_url` apenas ao usuario solicitante. Nunca em log, issue, PR, commit ou
canal publico.

## Comportamentos esperados

| Situacao | Resultado | Leitura |
|---|---|---|
| `GET` da `approval_url` sem sessao | `307` | Esperado — redirecionamento para o SSO. Nao e erro. |
| Feature flag desligada | `503 APPROVAL_LINKS_DISABLED` | `RDE_APPROVAL_LINKS_ENABLED` esta `false`. Fail-closed proposital. |
| Credencial sem o scope exato | `403 APPROVAL_LINK_SCOPE_REQUIRED` | Falta `approval_link:create`. Nao contornar pedindo scope maior. |
| Chave com `coligadas=[]` | `403 COLIGADA_NOT_ALLOWED` | A rota de controle precisa de credencial governada **sem restricao de coligada**, mantendo somente `approval_link:create`. |
| Link expirado ou revogado | `410` (`APPROVAL_LINK_GONE`) | Gerar um link novo; nao reutilizar. |
| Drift ou pedido nao acionavel | `409` (`APPROVAL_LINK_STALE` / `APPROVAL_LINK_REQUEST_NOT_ACTIONABLE`) | O plano do pedido mudou ou o pedido nao esta em estado aprovavel. Reavaliar antes de regerar. |
| Requester tentando aprovar | `403 APPROVAL_LINK_FOUR_EYES` | Em producao o aprovador deve ser ator diferente do requester. |
| Origem publica ausente/invalida | `503 APPROVAL_LINK_ORIGIN_NOT_CONFIGURED` / `APPROVAL_LINK_ORIGIN_INVALID` | `RDE_PUBLIC_ORIGIN` precisa ser HTTPS canonico. |
| Excesso de geracao | `429 APPROVAL_LINK_RATE_LIMITED` | Respeitar `Retry-After`; nao entrar em loop. |

## Criacao de chaves via API interna

Ao criar a chave geradora pela API interna, `consumer_id` DEVE ser um UUID valido existente
em `api_consumers`. Slug textual (ex.: `raiz-platform`) nao e aceito e produz vinculo
invalido. Resolver o UUID antes de criar a chave.

## Falha parcial de provisionamento

Se a aprovacao persistir e o provisionamento falhar, a pagina retorna `202` e oferece apenas
**Tentar provisionamento novamente**. O retry repete SOMENTE o provisionamento — nunca
reaplica a aprovacao. Nao gerar novo link para "forcar" a aprovacao de novo.

Reabrir um link ja concluido mostra "Operacao ja concluida" e nao cria credencial nova.

## Revogacao

O mesmo principal que gerou o link pode revoga-lo enquanto estiver `pending`:

```text
POST /v1/access-broker/approval-links/<link_id>/revoke
```

## Higiene obrigatoria de output

- Nunca imprimir API key, token bruto ou valor de `DATA_ENGINE_ACCESS_BROKER_TOKEN`.
- Nunca persistir a `approval_url` em arquivo versionado.
- Nunca colar o `<token>` da URL em texto de diagnostico.
- Ao reportar erro, citar apenas o `code` e o `correlation_id` retornados.
