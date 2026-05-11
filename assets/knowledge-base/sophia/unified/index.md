# SophiA — Knowledge Base Unificada (MECE)

> Gestão Escolar SophiA (Primasoft/Volaris). Concorrente TOTVS RM Educacional.
> 258 endpoints, 153 modelos, organizado por domínio.

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Domínios | 5 |
| Endpoints | 258 |
| Modelos | 153 |
| Tags API | 56 |
| Termos glossário | 16 |
| DOCs técnicos (raw) | 5 |
| Frontend (sophia-educacional-frontend) | 208 files, 70 pages |

---

## Navegação por Domínio

| # | Domínio | Endpoints | Link |
|---|---------|-----------|------|
| 01 | Acadêmico | 114 | [domains/01-academico.md](domains/01-academico.md) |
| 02 | Pessoas e Cadastro | 68 | [domains/02-pessoas.md](domains/02-pessoas.md) |
| 03 | Financeiro | 32 | [domains/03-financeiro.md](domains/03-financeiro.md) |
| 04 | Captação / Processo Seletivo | 14 | [domains/04-captacao.md](domains/04-captacao.md) |
| 05 | Administração | 30 | [domains/05-admin.md](domains/05-admin.md) |

---

## Source of Truth (JSON)

| Arquivo | Conteúdo |
|---------|----------|
| [apis.json](apis.json) | 258 endpoints + 153 modelos por domínio |
| [glossary.json](glossary.json) | 16 termos SophiA → negócio PT-BR |
| [domains.json](domains.json) | 5 domínios MECE |
| [rules.json](rules.json) | Auth (token 20min, IP-bound), cross-reference TOTVS |
| [integration.json](integration.json) | Frontend, env vars, Swagger URL |

---

## Guides

| Guide | Conteúdo |
|-------|----------|
| [gotchas.md](guides/gotchas.md) | 19 lições (auth, API, dados, cross-ref TOTVS, frontend) |

---

## Fontes Brutas

Em `../raw/`:

| Fonte | Conteúdo |
|-------|----------|
| `raw/swagger-sophia-v1.json` | Swagger v1 completo (304KB) |
| `raw/DOC-1` | Pesquisa completa (empresa, produtos, API, cross-ref TOTVS) |
| `raw/DOC-2` | Integrações Layers/TOTVS |
| `raw/DOC-3` | API Real Swagger (111 endpoints documentados) |
| `raw/DOC-4` (2 versões) | API Web Integração |
