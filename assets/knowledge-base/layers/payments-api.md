# Layers Education — Payments API

> Base URL: `https://api.layers.digital`
> Authentication: Bearer Token (HTTP)
> Required Header: `Community-id` (string)

---

## Visao Geral

O servico de Pagamentos da Layers gerencia transacoes financeiras, vendas, itens, kits, inventario, entregas, cobrancas e parcelas. Suporta operacoes de e-commerce e marketplace integrado.

---

## Sales (Vendas)

### GET /sales/{id} — Retorna Venda Especifica

**Path Parameters:**
- `id` (string, required) — ID da venda

**Response (200):**
```json
{
  "token": "uuid",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "currency": "BRL",
  "items": [
    {
      "sku": "string",
      "name": "string",
      "price": { "currency": "BRL", "amount": 100 },
      "gallery": [{ "url": "string" }]
    }
  ],
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": {},
    "document": "string"
  },
  "payment": {
    "status": "string",
    "method": "string",
    "installments": 1,
    "discount": {}
  },
  "shipping": {
    "required": true,
    "method": {},
    "address": {}
  },
  "discounts": [],
  "owned": {}
}
```

### PUT /sales/{id} — Atualizar Venda

**Path Parameters:**
- `id` (string, required)

**Request Body:** Campos da venda a serem atualizados.

### PUT /sales/{id}/cancel — Cancelar Venda

**Path Parameters:**
- `id` (string, required)

**Request Body:**
```json
{
  "comment": "Cliente comprou errado"
}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "canceled",
  "canceledAt": "2023-11-21T10:30:00.000Z",
  "cancelReason": "Cliente comprou errado"
}
```

### GET /sales/{id}/uncancel — Descancelar Venda

**Path Parameters:**
- `id` (string, required)

Restaura uma venda previamente cancelada.

### GET /sales/{id}/payables — Parcelas de uma Venda

**Path Parameters:**
- `id` (string, required)

Retorna as parcelas (installments) associadas a venda.

### POST /sales/search — Buscar Vendas

**Request Body:**
```json
{
  "filter": {
    "filters": [
      {
        "path": "string",
        "value": "string",
        "comparison": "string"
      }
    ]
  }
}
```

**Response (200):** Array de objetos venda com mesma estrutura do GET /sales/{id}.

### POST /sales/{id}/emit — Atualizar Integracao da Venda

Atualiza status de integracao de uma venda especifica.

---

## Payables (Parcelas)

### GET /payables/{id} — Obter Parcela Especifica

Retorna detalhes de uma parcela individual.

### POST /payables/search — Buscar Parcelas

Busca parcelas de vendas com filtros.

### POST /payables/{id}/integration — Atualizar Integracao da Parcela

Modifica dados de integracao de uma parcela.

---

## Items (Itens)

### POST /items — Criar Item

**Request Body:**
```json
{
  "id": "string",
  "kind": "product",
  "name": "Nome do Item",
  "published": true,
  "caption": "Descricao do item",
  "currency": "BRL",
  "shippable": false,
  "defaultPrice": {
    "currency": "BRL",
    "amount": 5000
  },
  "package": {
    "width": 10,
    "depth": 10,
    "height": 10,
    "weight": 500
  },
  "skus": [
    {
      "_id": "string",
      "alias": "string",
      "price": { "currency": "BRL", "amount": 5000 },
      "priceFrom": { "currency": "BRL", "amount": 6000 },
      "attributes": [{ "key": "cor", "value": "azul" }],
      "gallery": [{ "url": "string", "thumbnail": "string" }],
      "plan": {
        "interval": "monthly",
        "cycles": 12,
        "trialDays": 0,
        "startDate": "string",
        "endDate": "string"
      },
      "inventoryId": "string",
      "reference": {}
    }
  ],
  "options": [
    {
      "name": "Cor",
      "values": ["Azul", "Vermelho"]
    }
  ],
  "gallery": [{ "url": "string", "thumbnail": "string" }],
  "tags": ["categoria1"],
  "formId": "string",
  "variants": []
}
```

**Response (200):** Array contendo o item criado.

### GET /items/{id} — Obter Item Especifico

### POST /items/search — Buscar Itens

### GET /items/{id}/channels — Listar Canais Vinculados ao Item

### POST /items/{id}/channels — Criar Vinculo Item-Canal

---

## Kits

### POST /kits — Criar Kit

Cria um novo bundle/kit de itens.

### GET /kits/{id} — Obter Kit Especifico

### POST /kits/search — Buscar Kits

### GET /kits/{id}/channels — Listar Canais Vinculados ao Kit

### POST /kits/{id}/channels — Criar Vinculo Kit-Canal

---

## Charges (Cobrancas)

### GET /charges/{id} — Obter Cobranca Especifica

### POST /charges/search — Buscar Cobrancas

### POST /charges/{id}/integration — Integrar Cobranca

---

## Packages (Pacotes)

### POST /packages — Criar Pacote

### GET /packages/{id} — Obter Pacote Especifico

### PUT /packages/{id} — Atualizar Pacote

### POST /packages/search — Buscar Pacotes

---

## Deliveries (Entregas)

### POST /deliveries — Criar Entrega

### GET /deliveries/{id} — Obter Entrega Especifica

### POST /deliveries/search — Buscar Entregas

---

## Inventory (Inventario)

### POST /inventory — Criar Inventario Virtual

### PUT /inventory/{id}/adjust — Ajustar Estoque

Ajusta a quantidade de estoque de um inventario.

### POST /inventory/search — Buscar Inventarios

---

## Marketplace Integrado

O sistema de pagamentos inclui funcionalidades de marketplace:
- Provisao de cotacoes de frete
- Gerenciamento de itens na aba da loja
- Configuracao de storefront

---

## Notas Gerais

- Todos os endpoints requerem Bearer Token + header `Community-id`
- Moeda padrao: BRL (Real Brasileiro)
- Respostas de erro retornam status 400 com detalhes
- Para webhooks de pagamento, consulte `webhooks.md`
