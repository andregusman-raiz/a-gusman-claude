# Zeev BPM — Knowledge Base Unificada (MECE)

> Base de conhecimento MECE do Zeev (raizeducacao.zeev.it).
> Organizada por domínio de negócio. Formato híbrido (JSON + MD).

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Domínios | 6 |
| Endpoints API | 98 (OpenAPI) + 4 (API Dados) |
| Modelos de dados | 261 |
| Termos no glossário | 20 |
| Agent tool actions | 10 |
| Routes raiz-platform | 10 |
| JSONL records (raw) | 1,052 (374 KB + 580 blog + 98 specs) |

---

## Navegação por Domínio

| # | Domínio | Endpoints | Link |
|---|---------|-----------|------|
| 01 | Solicitações (Instances) | 12 | [domains/01-solicitacoes.md](domains/01-solicitacoes.md) |
| 02 | Tarefas (Assignments) | 11 | [domains/02-tarefas.md](domains/02-tarefas.md) |
| 03 | Fluxos (Flows) | 8 | [domains/03-fluxos.md](domains/03-fluxos.md) |
| 04 | Financeiro (API Dados) | custom | [domains/04-financeiro.md](domains/04-financeiro.md) |
| 05 | Admin e Relatórios | 63 | [domains/05-admin.md](domains/05-admin.md) |
| 06 | Autenticação | 4 | [domains/06-autenticacao.md](domains/06-autenticacao.md) |

---

## Source of Truth (JSON)

| Arquivo | Conteúdo |
|---------|----------|
| [apis.json](apis.json) | 98 endpoints + 261 modelos (do OpenAPI) |
| [glossary.json](glossary.json) | 20 termos técnicos → negócio |
| [domains.json](domains.json) | 6 domínios com contagem de endpoints |
| [rules.json](rules.json) | Auth, limites, gaps, API Dados |
| [integration.json](integration.json) | Estado completo da integração raiz-platform |

---

## Guides

| Guide | Conteúdo |
|-------|----------|
| [integration-patterns.md](guides/integration-patterns.md) | Impersonation, retry, cache, error classes |
| [gotchas.md](guides/gotchas.md) | 20 lições aprendidas (auth, limites, dados, deploy) |
| [agent-tool-cookbook.md](guides/agent-tool-cookbook.md) | 10 ações do zeev_bpm com exemplos de prompt |

---

## Fontes Brutas

Em `../raw/` (preservadas, não editar):

| Fonte | Conteúdo |
|-------|----------|
| `raw/docs/DOC-1` a `DOC-6` | 6 DOCs técnicos (API, schemas, limites, build-vs-buy) |
| `raw/specs/openapi.json` | Swagger 2.0 completo (15K linhas) |
| `raw/specs/endpoints.jsonl` | 98 endpoints parsed |
| `raw/kb/zeev_kb.jsonl` | 374 artigos KB |
| `raw/blog.jsonl` | 580 posts do blog |
