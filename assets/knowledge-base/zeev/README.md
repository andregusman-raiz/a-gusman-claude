# Zeev — Knowledge Base

> BPM de processos — raizeducacao.zeev.it
> Orquestração de workflows, formulários, automações.

---

## Visão Geral

| Métrica | Valor |
|---------|-------|
| Arquivos | 10 |
| Docs técnicos | 6 (DOC-1 a DOC-6) |
| KB articles | 374 records (JSONL) |
| API endpoints | 98 records (JSONL) |
| Blog posts | 580 records (JSONL) |
| Última atualização | 2026-03-24 |

## Estrutura

```
zeev/
├── docs/
│   ├── DOC-1-integracao-api-nativa.md  # Referência técnica: endpoints, auth, impersonação, patterns
│   ├── DOC-2-mapa-acesso-completo.md   # Inventário completo: tudo que acessamos via raiz-platform
│   ├── DOC-3-schemas-dados.md          # Schemas Zod detalhados: campos, tipos, validações
│   └── DOC-4-limites-e-lacunas.md      # O que NÃO temos acesso e caminhos para expandir
├── kb/
│   └── zeev_kb.jsonl       # 374 artigos de knowledge base
├── specs/
│   ├── endpoints.jsonl     # 98 endpoints documentados
│   └── openapi.json        # Spec OpenAPI completa
└── blog.jsonl              # 580 blog posts (conteúdo educativo)
```

## Documentos

| Doc | Arquivo | Conteúdo |
|-----|---------|----------|
| DOC-1 | `docs/DOC-1-integracao-api-nativa.md` | API Nativa v2 + API Dados — endpoints, auth, impersonação, schemas, patterns de cache/retry/timeout, gotchas |
| DOC-2 | `docs/DOC-2-mapa-acesso-completo.md` | Mapa completo: 2 APIs + agent tool + rotas Next.js + integrações (Metabase, n8n, Litigation) |
| DOC-3 | `docs/DOC-3-schemas-dados.md` | Todos os schemas Zod: ZeevAssignment, ZeevInstance, ZeevFinanceiroInstance, ZeevImpersonateResponse, etc. |
| DOC-4 | `docs/DOC-4-limites-e-lacunas.md` | O que NÃO temos (definição de fluxos, schemas de formulário, integrações, permissões) e como expandir |
| DOC-5 | `docs/DOC-5-bpms-proprio-analise-completa.md` | Análise completa: feature map do Zeev (60+ features), 83 endpoints não implementados, stack técnica, schema de banco, faseamento 5-7 meses, comparativo Build vs. Buy |
| DOC-6 | `docs/DOC-6-api-referencia-completa.md` | Referência completa: 98 endpoints com params/tipos + 160+ modelos de dados (3751 linhas). Extraído do OpenAPI spec oficial |

## Guia Rápido

| Preciso saber... | Consultar |
|-----------------|-----------|
| Todos os endpoints disponíveis | DOC-2 seções 2-5 |
| Schema detalhado de cada tipo | DOC-3 |
| O que posso e não posso fazer | DOC-4 seção 1 |
| Endpoints da API nativa (v2) | DOC-1 |
| Impersonação de usuários | DOC-1 seção Impersonação |
| Endpoints financeiros (API Dados) | DOC-1 seção API Dados |
| Env vars necessárias | DOC-3 seção 3 |
| Patterns de cache e retry | DOC-1 seção Patterns |
| Rotas Next.js da raiz-platform | DOC-2 seção 5 |
| Agent tool (zeev_bpm) — ações | DOC-2 seção 4 |
| Limitações e lacunas | DOC-4 |
| Construir BPMS próprio? | DOC-5 |
| Feature map completo do Zeev | DOC-5 seção 1 |
| Endpoints não implementados | DOC-5 seção 2 |
| Stack técnica proposta | DOC-5 seção 3.2 |
| Schema de banco proposto | DOC-5 seção 3.2 Fase 1 |
| Comparativo Build vs. Buy | DOC-5 seção 5 |
| Referência completa da API (98 endpoints) | DOC-6 |
| Modelos de dados OpenAPI (160+ types) | DOC-6 Parte 2 |
| Params de cada endpoint | DOC-6 (tabelas por endpoint) |
| Funcionalidades do Zeev (KB) | `kb/zeev_kb.jsonl` |
| Spec OpenAPI completa | `specs/openapi.json` |
| Conceitos BPM e cases | `blog.jsonl` |

## Uso

- **DOC-1**: referência técnica rápida (endpoints, auth, patterns)
- **DOC-2**: mapa completo de acesso (APIs + rotas + tool + integrações)
- **DOC-3**: schemas detalhados para desenvolvimento
- **DOC-4**: limites, lacunas e caminhos de expansão
- **KB**: consultar funcionalidades, configurações e troubleshooting
- **Specs**: spec OpenAPI completa + endpoints documentados
- **Blog**: conceitos de BPM, cases, boas práticas
