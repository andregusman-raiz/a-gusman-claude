# Data & Admin

> Configuração: propriedades, schemas, objetos customizados, associações, imports/exports, rate limits.

---

## Specs OpenAPI (10 specs, 68 endpoints)

| Spec | Endpoints | Tamanho | Descrição |
|------|-----------|---------|-----------|
| properties | 13 | 202KB | Properties |
| custom_objects | 12 | 286KB | Custom Objects |
| associations_schema | 9 | 206KB | CRM Associations Schema |
| limits_tracking | 9 | 179KB | Limits Tracking |
| schemas | 8 | 56KB | Schemas |
| imports | 5 | 39KB | CRM Imports |
| property_validations | 4 | 93KB | CRM Property Validations |
| associations | 3 | 80KB | Associations |
| exports | 3 | 24KB | CRM Exports |
| object_library | 2 | 49KB | CRM Object Library |

---

## Regras e Padrões

- Properties definem campos dos objetos (tipo, grupo, opções)
- Custom objects criam entidades sob medida com schema próprio
- Associations definem relações entre objetos (types configuráveis)
- Imports/exports para migração bulk de dados (CSV)
- Rate limits: 100 req/10s (OAuth), 500K/dia (private apps)

---

## Integração raiz-platform

Ver `unified/integration.json` para routes, types, env vars e OAuth scopes configurados.

*Specs OpenAPI completos em `raw/specs/` — usar para implementação detalhada de endpoints.*
