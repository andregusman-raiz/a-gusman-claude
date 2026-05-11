# Marketing Hub

> Campanhas de email, formulários de captura, listas de segmentação, eventos de marketing.

---

## Specs OpenAPI (9 specs, 149 endpoints)

| Spec | Endpoints | Tamanho | Descrição |
|------|-----------|---------|-----------|
| marketing_events | 36 | 136KB | Marketing Marketing Events |
| lists | 29 | 254KB | CRM Lists |
| campaigns_public_api | 24 | 85KB | Marketing Campaigns Public Api |
| marketing_emails | 19 | 187KB | Marketing Emails |
| emails | 17 | 137KB | CRM Emails |
| postal_mail | 11 | 61KB | CRM Postal Mail |
| forms | 6 | 75KB | Forms |
| transactional_single_send | 6 | 24KB | Transactional Single Send |
| single_send | 1 | 13KB | Single-send |

---

## Regras e Padrões

- Forms criam/atualizam contatos automaticamente no CRM
- Lists podem ser estáticas (manual) ou dinâmicas (filtros)
- Email campaigns com A/B testing e tracking
- Single send para emails transacionais (confirmação, reset)
- Marketing events para rastreamento de participação

---

## Integração raiz-platform

Ver `unified/integration.json` para routes, types, env vars e OAuth scopes configurados.

*Specs OpenAPI completos em `raw/specs/` — usar para implementação detalhada de endpoints.*
