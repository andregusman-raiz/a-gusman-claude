# CRM Core

> Objetos fundamentais: contatos, empresas, negócios, proprietários, leads, notas, timeline. Base de todo o CRM.

---

## Specs OpenAPI (9 specs, 109 endpoints)

| Spec | Endpoints | Tamanho | Descrição |
|------|-----------|---------|-----------|
| notes | 17 | 138KB | Notes |
| users | 17 | 136KB | CRM Users |
| deals | 15 | 131KB | Deals |
| contacts | 13 | 68KB | Contacts |
| companies | 12 | 66KB | Companies |
| leads | 11 | 63KB | Leads |
| objects | 11 | 265KB | CRM Objects |
| timeline | 11 | 59KB | Timeline |
| crm_owners | 2 | 14KB | Crm Owners |

---

## Regras e Padrões

- Contact é identificado por email — dedup automático
- Company associado a contatos via associations (N:N)
- Deal progride por stages em pipelines configuráveis
- Owner = usuário HubSpot responsável por registros
- Custom objects permitem modelar entidades específicas do negócio

---

## Integração raiz-platform

Ver `unified/integration.json` para routes, types, env vars e OAuth scopes configurados.

*Specs OpenAPI completos em `raw/specs/` — usar para implementação detalhada de endpoints.*
