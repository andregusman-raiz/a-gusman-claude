# HubSpot — Knowledge Base Unificada (MECE)

> CRM, Marketing, Sales, Service, Commerce, Automation.
> 71 OpenAPI specs, 862 endpoints, organizado por domínio.

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Domínios | 8 |
| OpenAPI specs | 71 |
| Total endpoints | 862 |
| Termos no glossário | 25 |
| KB articles (raw) | 300 |
| Developer guides (raw) | 85 |
| Routes raiz-platform | 7 |
| OAuth scopes | 10 |

---

## Navegação por Domínio

| # | Domínio | Specs | Endpoints | Link |
|---|---------|-------|-----------|------|
| 01 | CRM Core | 9 | 109 | [domains/01-crm-core.md](domains/01-crm-core.md) |
| 02 | Sales Hub | 11 | 129 | [domains/02-sales.md](domains/02-sales.md) |
| 03 | Marketing Hub | 9 | 149 | [domains/03-marketing.md](domains/03-marketing.md) |
| 04 | Service Hub | 8 | 109 | [domains/04-service.md](domains/04-service.md) |
| 05 | Commerce Hub | 11 | 160 | [domains/05-commerce.md](domains/05-commerce.md) |
| 06 | Automation | 2 | 26 | [domains/06-automation.md](domains/06-automation.md) |
| 07 | Data & Admin | 10 | 68 | [domains/07-data-admin.md](domains/07-data-admin.md) |
| 08 | Extensions | 11 | 112 | [domains/08-extensions.md](domains/08-extensions.md) |

---

## Source of Truth (JSON)

| Arquivo | Conteúdo |
|---------|----------|
| [apis.json](apis.json) | 71 specs catalogados por domínio + endpoint counts |
| [glossary.json](glossary.json) | 25 termos HubSpot → negócio PT-BR |
| [domains.json](domains.json) | 8 domínios MECE |
| [rules.json](rules.json) | OAuth, rate limits, pagination, webhooks |
| [integration.json](integration.json) | Estado raiz-platform (routes, types, env vars) |

---

## Guides

| Guide | Conteúdo |
|-------|----------|
| [integration-patterns.md](guides/integration-patterns.md) | OAuth flow, rate limiting, pagination, batch, webhooks |
| [gotchas.md](guides/gotchas.md) | 23 lições aprendidas |

---

## Fontes Brutas

Em `../raw/` (preservadas):

| Fonte | Conteúdo |
|-------|----------|
| `raw/specs/` | 71 OpenAPI JSON (8.2MB) + index JSONL |
| `raw/kb/` | 300 artigos KB (3.3MB) |
| `raw/guides/` | 85 developer guides (1.3MB) |
