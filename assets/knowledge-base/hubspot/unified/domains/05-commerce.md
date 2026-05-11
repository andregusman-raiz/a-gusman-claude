# Commerce Hub

> E-commerce: produtos, pedidos, faturas, assinaturas, descontos, impostos, carrinhos.

---

## Specs OpenAPI (11 specs, 160 endpoints)

| Spec | Endpoints | Tamanho | Descrição |
|------|-----------|---------|-----------|
| carts | 17 | 138KB | Carts |
| commerce_subscriptions | 17 | 298KB | CRM Commerce Subscriptions |
| discounts | 17 | 137KB | Discounts |
| fees | 17 | 137KB | CRM Fees |
| invoices | 17 | 138KB | Invoices |
| line_items | 17 | 137KB | CRM Line Items |
| products | 17 | 139KB | Products |
| taxes | 17 | 136KB | CRM Taxes |
| orders | 11 | 62KB | Orders |
| subscriptions | 10 | 61KB | Communication Preferences Subscriptions |
| subscription_lifecycle | 3 | 10KB | CRM Subscription Lifecycle |

---

## Regras e Padrões

- Products: catálogo de produtos/serviços com pricing
- Subscriptions: cobranças recorrentes com lifecycle management
- Orders e invoices para fluxo completo de compra
- Line items vinculam products a deals/quotes/orders
- Discounts e taxes aplicáveis a line items

---

## Integração raiz-platform

Ver `unified/integration.json` para routes, types, env vars e OAuth scopes configurados.

*Specs OpenAPI completos em `raw/specs/` — usar para implementação detalhada de endpoints.*
