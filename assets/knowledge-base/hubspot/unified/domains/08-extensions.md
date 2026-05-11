# Extensions & Apps

> Extensões: apps, video conferencing, visitor ID, parceiros, CRM cards.

---

## Specs OpenAPI (11 specs, 112 endpoints)

| Spec | Endpoints | Tamanho | Descrição |
|------|-----------|---------|-----------|
| contracts | 17 | 135KB | Contracts |
| listings | 17 | 137KB | Listings |
| partner_clients | 17 | 134KB | CRM Partner Clients |
| partner_services | 17 | 137KB | CRM Partner Services |
| commerce_payments | 11 | 63KB | Commerce Payments |
| courses | 11 | 62KB | Courses |
| public_app_feature_flags_v3 | 10 | 26KB | CRM Public App Feature Flags V3 |
| public_app_crm_cards | 7 | 45KB | Public App Crm Cards |
| video_conferencing_extension | 3 | 9KB | Video Conferencing Extension |
| app_uninstalls | 1 | 6KB | CRM App Uninstalls |
| visitor_identification | 1 | 8KB | Conversations Visitor Identification |

---

## Regras e Padrões

- Public apps: OAuth-based, para marketplace HubSpot
- CRM cards: UI customizada dentro do HubSpot
- Visitor identification para tracking anônimo → contato
- Video conferencing: integração de calls (Zoom, etc.)
- Partner programs: gestão de parceiros e clientes

---

## Integração raiz-platform

Ver `unified/integration.json` para routes, types, env vars e OAuth scopes configurados.

*Specs OpenAPI completos em `raw/specs/` — usar para implementação detalhada de endpoints.*
