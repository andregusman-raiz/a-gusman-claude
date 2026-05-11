# Layers Education — Payments API (Complete Reference)

> **Base URL**: `https://api.layers.digital/v1/payments`
> **Authentication**: Bearer Token (`Authorization: Bearer <TOKEN_DE_APLICACAO>`)
> **Required Header**: `Community-id: <NOME_DA_COMUNIDADE>` (string)
> **Content-Type**: `application/json`
> **Updated**: 2026-03-30

---

## 1. Sales (Vendas)

### GET /sales/{id} — Obter Venda Especifica

**Path Parameters:** `id` (string, required) — Sale ID (UUID token)

**Response (200):**
```json
{
  "token": "uuid",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "currency": "BRL",
  "items": [{
    "id": "string",
    "kind": "string",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601",
    "name": "string",
    "published": true,
    "content": { "kind": "markdown", "markdown": "string" },
    "caption": "string",
    "currency": "BRL",
    "defaultPrice": { "currency": "BRL", "amount": 10000 },
    "shippable": false,
    "package": { "width": 5, "depth": 5, "height": 0.2, "weight": 0.2 },
    "skus": [{
      "_id": "string",
      "alias": "string",
      "price": { "currency": "BRL", "amount": 10000 },
      "priceFrom": { "currency": "BRL", "amount": 12000 },
      "attributes": [{ "key": "string", "value": "string" }],
      "gallery": [{ "url": "string" }],
      "caption": "string",
      "plan": {
        "interval": "monthly",
        "cycles": 12,
        "trialDays": 0,
        "startDate": "ISO 8601",
        "endDate": "ISO 8601"
      },
      "inventoryId": "string",
      "reference": {}
    }],
    "options": [{ "key": "string", "name": "string" }],
    "gallery": [{ "name": "string", "path": "string", "url": "string", "thumb": "string", "size": 0, "mime": "string", "width": 0, "height": 0, "orientation": "string" }],
    "tags": ["string"],
    "formId": "string",
    "variants": [{ "alias": "string", "attributes": [], "gallery": [], "id": "string", "price": {} }]
  }],
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "birth": "string",
    "address": {
      "title": "string",
      "code": "string",
      "address": "string",
      "address2": "string",
      "number": "string",
      "district": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "default": true
    },
    "document": { "kind": "cpf", "value": "string" }
  },
  "payment": {
    "status": "string",
    "statusChangedAt": "ISO 8601",
    "tags": ["string"],
    "method": {
      "key": "string",
      "sourceId": "string",
      "method": "string",
      "strategy": "string",
      "installments": 1,
      "discount": { "kind": "string", "percent": 0, "fixed": 0 }
    }
  },
  "shipping": {
    "required": true,
    "method": { "hash": "string", "service": "string", "description": "string", "currency": "BRL", "price": 0 },
    "address": { "title": "string", "code": "string", "address": "string", "address2": "string", "number": "string", "district": "string", "city": "string", "state": "string", "country": "string", "default": true }
  },
  "discounts": [{ "name": "string", "location": "string", "discount": {}, "value": 0 }],
  "owned": { "items": 0, "discounts": 0, "shipping": 0, "taxes": 0, "total": 0 }
}
```

### PUT /sales/{id} — Atualizar Venda

**Path Parameters:** `id` (string, required)
**Request Body:** Campos da venda a serem atualizados (partial update).

### PUT /sales/{id}/cancel — Cancelar Venda

**Request Body:**
```json
{ "comment": "Motivo do cancelamento" }
```

**Response (200):**
```json
{
  "id": "string",
  "status": "canceled",
  "canceledAt": "ISO 8601",
  "cancelReason": "string"
}
```

### GET /sales/{id}/uncancel — Descancelar Venda

Restaura uma venda previamente cancelada.

### GET /sales/{id}/payables — Parcelas de uma Venda

Retorna as parcelas (installments) associadas a venda.

### POST /sales/search — Buscar Vendas

**Request Body:** Ver secao "Search API" abaixo.
**Response (200):** Paginacao cursor-based + array de objetos venda.

### POST /sales/{id}/events/emit — Integrar Venda (Emitir Evento)

**Request Body:**
```json
{
  "eventName": "integration.attempt",
  "eventComment": "Venda 123 integrada com sucesso.",
  "integration": {
    "status": "integrated",
    "reason": "Cliente encontrado",
    "payload": {},
    "metadata": {}
  }
}
```

**Response (200):**
```json
{
  "comment": "event.comment.sale.integration.success",
  "commentTranslation": "Venda 123 integrada com sucesso.",
  "payload": {
    "integration": {
      "status": "integrated",
      "assignee": "ERP",
      "statusChangedAt": "ISO 8601"
    }
  }
}
```

**Para erro de integracao:**
```json
{
  "eventName": "integration.error",
  "eventComment": "Erro ao integrar a venda [code]",
  "integration": { "status": "error", "metadata": {}, "reason": "string" }
}
```

**Errors:** 400 (Bad Request), 403 (Forbidden)

---

## 2. Payables (Parcelas / Cobrancas)

### GET /payables/{id} — Obter Parcela Especifica

**Response (200):**
```json
{
  "id": "string",
  "saleId": "string",
  "installment": 1,
  "totalInstallments": 12,
  "status": "open",
  "dueAt": "ISO 8601",
  "originalDueAt": "ISO 8601",
  "statusChangedAt": "ISO 8601",
  "paidWith": "bank_slip",
  "nsu": "string",
  "externalTransactionAlias": "string",
  "hasManualUpdate": false,
  "url": "string",
  "canBeCanceled": true,
  "canBeRefunded": false,
  "price": {
    "amount": 500,
    "currency": "BRL",
    "decimal": 5.00,
    "display": "R$ 5,00"
  },
  "integration": { "status": "string" },
  "recipients": [{
    "sourceId": "string",
    "discounts": { "amount": 0, "currency": "BRL" },
    "items": { "amount": 500, "currency": "BRL" },
    "shipping": { "amount": 0, "currency": "BRL" },
    "taxes": { "amount": 0, "currency": "BRL" },
    "total": { "amount": 500, "currency": "BRL" }
  }],
  "statusTransitions": {},
  "transactions": [{ "alias": "string" }]
}
```

### POST /payables/search — Buscar Parcelas

**Request Body:** Ver secao "Search API" abaixo.
**Response (200):** Array de parcelas (schema acima, sem `recipients` detalhado).

### POST /payables/{id}/events/emit — Integrar Parcela (Emitir Evento)

Mesmo schema que `/sales/{id}/events/emit`.

**Errors:** 400, 403

---

## 3. Items (Itens)

### POST /items — Criar Item

**Request Body:**
```json
{
  "id": "string (optional, auto-generated)",
  "kind": "product",
  "name": "Nome do Item",
  "published": true,
  "content": { "kind": "markdown", "markdown": "descricao" },
  "caption": "Resumo",
  "currency": "BRL",
  "defaultPrice": { "currency": "BRL", "amount": 10000 },
  "shippable": false,
  "package": { "width": 10, "depth": 10, "height": 10, "weight": 500 },
  "skus": [{
    "_id": "string",
    "alias": "string",
    "price": { "currency": "BRL", "amount": 10000 },
    "priceFrom": { "currency": "BRL", "amount": 12000 },
    "attributes": [{ "key": "cor", "value": "azul" }],
    "gallery": [{ "url": "string" }],
    "plan": { "interval": "monthly", "cycles": 12, "trialDays": 0 },
    "inventoryId": "string",
    "reference": {}
  }],
  "options": [{ "name": "Cor", "values": ["Azul", "Vermelho"] }],
  "gallery": [{ "url": "string", "thumbnail": "string" }],
  "tags": ["categoria"],
  "formId": "string",
  "variants": []
}
```

**Response (200):** Array contendo o item criado (+ `createdAt`, `updatedAt`).

### GET /items/{id} — Obter Item Especifico
### POST /items/search — Buscar Itens
### GET /items/{id}/channels — Listar Canais Vinculados
### POST /items/{id}/channels — Vincular Item a Canal

---

## 4. Kits

### POST /kits — Criar Kit (bundle de itens)
### GET /kits/{id} — Obter Kit Especifico
### POST /kits/search — Buscar Kits
### GET /kits/{id}/channels — Listar Canais Vinculados
### POST /kits/{id}/channels — Vincular Kit a Canal

---

## 5. Packages (Entregas)

### POST /packages — Criar Entrega

**Request Body:**
```json
{
  "saleId": "string",
  "items": [],
  "carrierKind": "custom",
  "carrierId": "string",
  "status": "ready_to_pack",
  "notifyEmail": true,
  "reversed": false,
  "trackingCode": "string",
  "trackingUrl": "string",
  "expectedDeliveryDate": "ISO 8601",
  "statusNote": "string",
  "statusDate": "ISO 8601",
  "statusTransitions": [],
  "pickUp": false,
  "pickUpLocation": {}
}
```

### GET /packages/{id} — Obter Entrega
### PUT /packages/{id} — Atualizar Entrega
### POST /packages/search — Buscar Entregas

---

## 6. Inventory (Inventario)

### POST /inventory — Criar Inventario Virtual
### PUT /inventory/{id}/adjust — Ajustar Estoque
### POST /inventory/search — Buscar Inventarios

---

## 7. Forms (Formularios)

### POST /forms — Criar Formulario
### GET /forms — Listar Formularios
### GET /forms/{id} — Obter Formulario Especifico
### PUT /forms/{id} — Atualizar Formulario
### DELETE /forms/{id} — Excluir Formulario

---

## 8. Marketplace Integrado

### Prover Tabs de uma Loja
### Prover Itens da Tab de uma Loja
### Prover Cotacao de Frete

---

## 9. Search API (Padrao para todos os endpoints /search)

### Request Body
```json
{
  "filter": {
    "filters": [
      {
        "path": "campo.a.filtrar",
        "value": "valor",
        "comparison": "operador"
      }
    ]
  },
  "cursor": "string (para paginacao)"
}
```

### Operadores de Comparacao

**Datas:**
| Operador | Descricao |
|----------|-----------|
| `relative_past_gte` | Data relativa no passado >= |
| `relative_past_lt` | Data relativa no passado < |
| `relative_past_eq` | Data relativa no passado = |
| `relative_future_gte` | Data relativa no futuro >= |
| `relative_future_lt` | Data relativa no futuro < |
| `relative_future_eq` | Data relativa no futuro = |
| `absolute_eq` | Data absoluta = |
| `absolute_gte` | Data absoluta >= |
| `absolute_lt` | Data absoluta < |

**Numeros:**
| Operador | Descricao |
|----------|-----------|
| `eq` | Igual |
| `neq` | Diferente |
| `gt` | Maior que |
| `gte` | Maior ou igual |
| `lt` | Menor que |
| `lte` | Menor ou igual |

**Strings:**
| Operador | Descricao |
|----------|-----------|
| `contains` | Contem substring |
| `starts_with` | Comeca com |
| `ends_with` | Termina com |
| `eq` | Exatamente igual |
| `neq` | Diferente |
| `in` | Em lista de valores |

**Sales-only:**
| Operador | Descricao |
|----------|-----------|
| `in` | Verifica existencia de documentos dentro de venda |

### Paginacao (Cursor-based)

**Response:**
```json
{
  "total": 150,
  "hits": [/* objetos da pagina atual */],
  "previous": "cursor_anterior_ou_null",
  "next": "cursor_proxima_pagina_ou_null"
}
```

- `next: null` = ultima pagina
- Para proxima pagina: reenviar request com `"cursor": response.next`

---

## 10. Webhooks

### Eventos Disponiveis

**Sales:**
| Evento | Dispara quando |
|--------|----------------|
| `sale.created` | Nova venda criada |
| `sale.confirmed` | Venda confirmada |
| `sale.approved` | Venda aprovada |
| `sale.paid` | Venda totalmente paga |
| `sale.viewed` | Fatura visualizada |
| `sale.failed` | Transacao falhou |
| `sale.comment` | Comentario registrado na venda |
| `sale.email` | Email enviado ao cliente |
| `sale.refund_request` | Pedido de reembolso criado |
| `sale.refund_success` | Reembolso concluido |
| `sale.cancel_request` | Pedido de cancelamento (vendas recorrentes) |
| `sale.cancel_success` | Cancelamento aprovado |
| `sale.payment_status_updated` | Status do pagamento mudou |
| `sale.voucher_approved` | Venda com voucher aprovada |

**Transactions:**
| Evento | Dispara quando |
|--------|----------------|
| `transaction.created` | Transacao criada |

**Payables:**
| Evento | Dispara quando |
|--------|----------------|
| `payable.created` | Cobranca/parcela criada |
| `payable.updated` | Status da cobranca atualizado |

**Cart:**
| Evento | Dispara quando |
|--------|----------------|
| `checkout.abandoned` | Carrinho abandonado (30min sem atualizacao) |

### Corpo do Webhook (POST para sua URL)

```json
{
  "community": "nome_da_comunidade",
  "hook": {
    "id": "string",
    "url": "https://seu-endpoint.com/webhook",
    "secret": "chave_secreta_para_validacao"
  },
  "event": {
    "sale": { /* objeto completo da venda */ },
    "createdAt": "ISO 8601",
    "name": "sale.approved",
    "kind": "sale | payable | transaction",
    "entity": "ID da entidade principal (sale_id, payable_id, etc)",
    "author": { /* dados do autor da acao, pode ser vazio */ },
    "reason": "codigo_interno_do_trigger",
    "message": "Descricao do evento"
  }
}
```

### Entity ID por Tipo de Evento

| kind | entity = |
|------|----------|
| `sale.*` | Sale ID |
| `transaction.*` | Transaction ID |
| `payable.*` | Payable (Charge) ID |
| `checkout.*` | Cart ID |

### Politica de Retentativas

| Tentativa | Intervalo aprox. |
|-----------|-----------------|
| 1 | Imediata |
| 2 | ~2 min |
| 3 | ~10 min |
| 4 | ~30 min |
| 5 | ~1 hora |
| 6 | ~3 horas |
| 7 | ~4 horas |
| 8 | ~6 horas |
| 9 | ~10 horas |

- **Max retries**: 9 tentativas
- **Jitter**: fator aleatorio em cada intervalo
- **Cap**: maximo 24h entre tentativas
- **Timeout**: 30 segundos por tentativa
- **Falha final**: apos 9 tentativas, marcado como `failed` — reenvio manual disponivel
- **Condicoes de retry**: HTTP 4xx/5xx, servidor indisponivel, sem resposta, timeout

---

## 11. Fluxo de Integracao (Best Practice)

### Passo 1: Configurar Webhook
Criar webhook no painel, vinculado ao evento `sale.approved`.

### Passo 2: Ao receber webhook, buscar dados frescos
```
GET /sales/{sale_id_do_webhook}
Headers: Authorization: Bearer TOKEN, Community-id: COMUNIDADE
```
**IMPORTANTE**: Sempre buscar dados atualizados, nao confiar apenas no payload do webhook.

### Passo 3: Processar logica de negocio

### Passo 4: Reportar resultado

**Sucesso:**
```
POST /sales/{id}/events/emit
{ "eventName": "integration.attempt", "integration": { "status": "integrated", ... } }
```
Status visivel: "integrado_com_sucesso" na aba de pedidos.

**Erro:**
```
POST /sales/{id}/events/emit
{ "eventName": "integration.error", "integration": { "status": "error", "reason": "...", ... } }
```
Erro visivel no dashboard de qualidade de dados em "Integracoes".

---

## 12. Notas para Data Engine

### Endpoints relevantes para BI/ETL
1. **POST /sales/search** — Extrair todas as vendas (cursor pagination)
2. **POST /payables/search** — Extrair parcelas/cobrancas
3. **GET /sales/{id}** — Detalhes completos de venda individual
4. **GET /payables/{id}** — Detalhes completos de parcela

### Campos uteis para BI
- `payment.status` — Status do pagamento
- `payment.method` — Metodo e parcelamento
- `customer.document` — CPF/CNPJ (para cruzamento com TOTVS)
- `items[].defaultPrice.amount` — Valor em centavos (dividir por 100)
- `owned.total` — Total da venda
- `payable.price.amount` — Valor da parcela em centavos
- `payable.status` — open, paid, canceled, refunded
- `payable.dueAt` — Vencimento

### Paginacao para ETL
```python
cursor = None
while True:
    body = {"filter": {"filters": [...]}}
    if cursor:
        body["cursor"] = cursor
    resp = client.post("/sales/search", json=body)
    data = resp.json()
    process(data["hits"])
    cursor = data.get("next")
    if not cursor:
        break
```

### Prerequisito
Integracao precisa ser ativada pelo suporte Layers por comunidade.
