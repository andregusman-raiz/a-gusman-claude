# Service Hub

> Atendimento ao cliente: tickets, conversas, feedback, chamadas, transcrições.

---

## Specs OpenAPI (8 specs, 109 endpoints)

| Spec | Endpoints | Tamanho | Descrição |
|------|-----------|---------|-----------|
| communications | 17 | 137KB | CRM Communications |
| feedback_submissions | 17 | 301KB | Feedback Submissions |
| services | 17 | 137KB | Services |
| conversations | 16 | 95KB | Conversations Inbox & Messages |
| calling_extensions | 13 | 41KB | CRM Calling Extensions |
| custom_channels | 13 | 78KB | Conversations Custom Channels |
| tickets | 12 | 64KB | Tickets |
| transcriptions | 4 | 19KB | Transcriptions |

---

## Regras e Padrões

- Tickets progridem por pipeline de service (similar a deals)
- Conversations: inbox unificado (email, chat, Facebook, etc.)
- Feedback submissions para NPS e surveys
- Calling extensions integram VoIP com HubSpot
- Custom channels para canais de atendimento personalizados

---

## Integração raiz-platform

Ver `unified/integration.json` para routes, types, env vars e OAuth scopes configurados.

*Specs OpenAPI completos em `raw/specs/` — usar para implementação detalhada de endpoints.*
