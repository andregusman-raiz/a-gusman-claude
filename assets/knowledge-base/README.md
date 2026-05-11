# Knowledge Base — Raíz Educação

> Base de conhecimento centralizada para todos os sistemas, processos e ferramentas da Raíz Educação.
> Compartilhada entre projetos. Qualquer sessão Claude Code pode ler daqui.

---

## Visão Geral

| Métrica | Valor |
|---------|-------|
| Sistemas documentados | 14 |
| Arquivos totais | 365+ |
| Tamanho | ~30 MB |
| Records indexados (catalog.json) | 2,417+ |
| Última atualização | 2026-03-26 |

---

## Sistemas

### Sistemas Corporativos (ERP / BPM / CRM)

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **TOTVS RM** | `totvs/` | 93 | ERP educacional — **camada unificada MECE** (`unified/`) com schema.json (69 tabelas, 1992 campos), glossário (1211 termos), 8 domínios, 28 queries, regras de negócio + fontes brutas (18 docs, 29 DataServers SOAP, 55 REST, enums reais). Ver [totvs/README.md](totvs/README.md) |
| **SophiA** | `sophia/` | 19 | Concorrente TOTVS — **camada unificada MECE** (`unified/`) com 258 endpoints, 153 modelos, 5 domínios, cross-reference TOTVS RM, 19 gotchas + fontes brutas (5 DOCs, Swagger 304KB). Ver [sophia/README.md](sophia/README.md) |
| **Zeev** | `zeev/` | 23 | BPM de processos — **camada unificada MECE** (`unified/`) com 98 endpoints, 261 modelos, 6 domínios, integration.json (raiz-platform), 20 gotchas + fontes brutas (6 DOCs, 1052 JSONL records). Ver [zeev/README.md](zeev/README.md) |
| **HubSpot** | `hubspot/` | 88 | CRM Marketing/Sales — **camada unificada MECE** (`unified/`) com 71 specs catalogados (862 endpoints), 8 domínios, integration.json (raiz-platform OAuth), 23 gotchas + fontes brutas (300 KB articles, 85 guides). Ver [hubspot/README.md](hubspot/README.md) |
| **Finnet** | `finnet/` | 10 | Gestão financeira — API Universal, CNAB, EDI, Open Finance, technical reference, integration checklist |

### Plataformas de Gestão de Pessoas

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Gupy / Pulses** | `gupy-pulses/` | 9 | RH — Recrutamento, Admissão, Clima/Engajamento, Treinamento, conector TOTVS RM, webhooks, autenticação |
| **Gupy** (legacy) | `gupy/` | 5 | Pesquisa original Gupy — API reference, integrações, índice |

### Plataforma Educacional

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Layers Education** | `layers/` | 44 | Ecossistema educacional — Portal API/SSO (6), Super Cantina (26), Community Data API, Payments API, Auth API, Data Sync, Webhooks, Permissions, Notifications |

### Comunicação e Automação

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Z-API** | `z-api/` | 10 | WhatsApp REST API — mensagens (19 endpoints), grupos, instância, webhooks, segurança, contatos, business |
| **n8n** | `n8n/` | 7 | Automação de workflows — API reference, webhooks, core nodes, integrações, hosting |

### Ferramentas de Desenvolvimento

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Claude Code** | `claude-code/` | 10 | CLI & agent system — hooks, memory, MCP, sub-agents, settings, CLI reference, security |

### Trabalhista / Fiscal

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **FGTS** | `fgts/` | 5 | Guias de pagamento FGTS (mensal, rescisória), FGTS Digital, débitos pré-03/2024, integração TOTVS RM |
| **InfoSimples** | `infosimples/` | 5 | API de consultas governamentais — OpenAPI spec (868 endpoints), docs FGTS detalhado, catálogo completo, preços |

### Conhecimento Institucional

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Raíz Processos** | `raiz-processos/` | 98 | 88 soluções de melhoria em 13 áreas operacionais + metodologia PRISM-Lite (7 fases) |

---

## Estrutura de Diretórios

```
knowledge-base/
├── README.md              ← Este arquivo
├── catalog.json           ← Índice geral (2,417+ records, categorias, date ranges)
│
├── hubspot/               ← CRM (Marketing, Sales, Service, Commerce)
│   ├── README.md          │  Índice — aponta para unified/
│   ├── unified/           │  **KB MECE** — COMECE AQUI
│   │   ├── index.md       │  Ponto de entrada
│   │   ├── apis.json      │  71 specs, 862 endpoints por domínio
│   │   ├── integration.json │  raiz-platform (OAuth, routes, types)
│   │   ├── domains/       │  8 docs por domínio
│   │   └── guides/        │  Integração, gotchas
│   │
│   └── raw/               │  Fontes brutas (preservadas)
│       ├── specs/         │  71 OpenAPI JSON (8.2MB) + index
│       ├── kb/            │  300 artigos KB (JSONL)
│       └── guides/        │  85 dev guides (JSONL)
│
├── totvs/                 ← ERP Educacional (RM v12.1.2502)
│   ├── README.md          │  Índice — aponta para unified/
│   ├── unified/           │  **KB MECE** — COMECE AQUI
│   │   ├── index.md       │  Ponto de entrada principal
│   │   ├── schema.json    │  69 tabelas, 1992 campos, FKs, PII
│   │   ├── glossary.json  │  1,211 termos técnico → negócio
│   │   ├── domains/       │  8 docs por domínio de negócio
│   │   ├── guides/        │  Integração, segurança, gotchas, cookbook
│   │   ├── queries.json   │  28 queries catalogadas
│   │   ├── apis.json      │  55 REST + 29 SOAP unificados
│   │   ├── rules.json     │  Regras de negócio codificadas
│   │   ├── enums.json     │  Valores de lookup reais
│   │   └── domains.json   │  Mapeamento tabela → domínio
│   │
│   └── raw/               │  Fontes brutas (preservadas)
│       ├── docs/          │  18 DOCs técnicos (DOC-1 a DOC-17)
│       ├── generated/     │  TypeScript types, all-fields-flat.json
│       ├── soap/          │  29 DataServer schemas
│       ├── rest-api/      │  55 endpoints probados
│       ├── sql-metadata/  │  9950 tabelas, enums reais
│       ├── specs/         │  263 API specs (JSONL)
│       ├── suporte/       │  300 tickets Central (JSONL)
│       ├── tdn/           │  187 docs TDN (JSONL)
│       └── validation/    │  Data samples
│
├── sophia/                ← Concorrente TOTVS (Primasoft/Soluções Sophia)
│   ├── README.md          │  Índice — aponta para unified/
│   ├── unified/           │  **KB MECE** — COMECE AQUI
│   │   ├── index.md       │  Ponto de entrada
│   │   ├── apis.json      │  258 endpoints + 153 modelos
│   │   ├── domains/       │  5 domínios (Acadêmico, Pessoas, Financeiro, Captação, Admin)
│   │   └── guides/        │  Gotchas (19 lições)
│   │
│   └── raw/               │  Fontes brutas (preservadas)
│       ├── swagger-sophia-v1.json │  Swagger completo (304KB)
│       └── DOC-1 a DOC-4  │  5 DOCs técnicos
│
├── zeev/                  ← BPM de Processos (raizeducacao.zeev.it)
│   ├── README.md          │  Índice — aponta para unified/
│   ├── unified/           │  **KB MECE** — COMECE AQUI
│   │   ├── index.md       │  Ponto de entrada
│   │   ├── apis.json      │  98 endpoints + 261 modelos
│   │   ├── integration.json │  Estado da integração raiz-platform
│   │   ├── domains/       │  6 docs por domínio
│   │   └── guides/        │  Integração, gotchas, agent cookbook
│   │
│   └── raw/               │  Fontes brutas (preservadas)
│       ├── docs/          │  6 DOCs técnicos
│       ├── specs/         │  OpenAPI + endpoints JSONL
│       ├── kb/            │  374 artigos KB (JSONL)
│       └── blog.jsonl     │  580 blog posts
│
├── layers/                ← Plataforma Educacional
│   ├── portal-docs/       │  6 docs (visão geral, config, API ref, SSO, exemplos, serviços)
│   ├── super-cantina-docs/│  26 docs (arquitetura, backend, frontend, PDV, DB, segurança, DevOps)
│   ├── api-reference.md   │  Public APIs overview
│   ├── community-data-api.md │  /open-api/data endpoints
│   ├── auth-api.md        │  SSO, OAuth2, session
│   ├── payments-api.md    │  Sales, items, kits, inventory
│   ├── data-sync.md       │  Sincronização de dados
│   ├── webhooks.md        │  Webhooks e eventos
│   ├── notifications-api.md │  Notificações
│   ├── permissions.md     │  Permissões e roles
│   ├── api-hub.md         │  Hub de APIs
│   ├── visualization-apps.md │  Apps de visualização
│   └── README.md          │  Overview
│
├── z-api/                 ← WhatsApp REST API
│   ├── README.md          │  Overview e quick reference
│   ├── messages.md        │  19 endpoints (text, image, doc, audio, video, sticker, etc.)
│   ├── groups.md          │  10 endpoints (create, participants, invite, etc.)
│   ├── instance.md        │  6 endpoints (QR, status, restart, disconnect)
│   ├── webhooks.md        │  6 tipos de webhook com payloads
│   ├── security.md        │  Autenticação (ID/Token, Client-Token, IP, 2FA)
│   ├── contacts.md        │  7 endpoints
│   ├── business.md        │  ~30 endpoints (products, collections, labels)
│   ├── chats.md           │  Chats + Queue
│   └── index.md           │  Sitemap completo (~200 páginas)
│
├── n8n/                   ← Automação de Workflows
│   ├── README.md          │  Overview e API reference
│   ├── api-reference.md   │  REST API endpoints
│   ├── webhooks.md        │  Webhook node config
│   ├── core-nodes.md      │  HTTP Request, Code, Function
│   ├── integrations.md    │  Built-in integrations list
│   └── hosting.md         │  Self-hosting, env vars
│
├── gupy-pulses/           ← Gestão de Pessoas (RH)
│   ├── README.md          │  Overview com todos os módulos
│   ├── recruitment.md     │  Jobs, applications, candidates
│   ├── admission.md       │  Admissão + conector TOTVS RM
│   ├── engagement.md      │  Clima, scores, feedbacks
│   ├── training.md        │  Treinamento e capacitação
│   ├── totvs-connector.md │  Integração direta com TOTVS RM
│   ├── webhooks.md        │  Eventos e payloads
│   ├── authentication.md  │  JWT, SAML, Admin Global
│   └── admin.md           │  Positions, collaborators
│
├── gupy/                  ← Gupy (pesquisa legacy)
│   ├── GUPY-API-REFERENCE.md      │  API reference completo
│   ├── GUPY-COMPLETE-RESEARCH.md  │  Pesquisa abrangente
│   ├── GUPY-INTEGRATIONS-DETAILED.md │  Integrações detalhadas
│   ├── INDEX.md           │  Índice
│   └── README.txt         │  Overview
│
├── finnet/                ← Gestão Financeira
│   ├── README.md          │  Overview
│   ├── api-universal.md   │  API Universal multibanco
│   ├── cnab.md            │  CNAB, conversão API↔CNAB
│   ├── edi.md             │  EDI (intercâmbio eletrônico de dados)
│   ├── open-finance.md    │  Open Finance 2025-2026
│   ├── solutions.md       │  Soluções por categoria
│   ├── FINNET-API-TECHNICAL-REFERENCE.md │  Referência técnica da API
│   ├── FINNET-INTEGRATION-CHECKLIST.md   │  Checklist de integração
│   ├── FINNET-RESEARCH-COMPREHENSIVE.md  │  Pesquisa abrangente
│   └── INDEX.md           │  Índice
│
├── fgts/                  ← FGTS (Trabalhista / Fiscal)
│   ├── README.md          │  Visão geral (alíquotas, sistemas, lote vs individual, penalidades)
│   ├── guia-mensal.md     │  Passo a passo GFD mensal
│   ├── guia-rescisoria.md │  Passo a passo GFD rescisória
│   ├── historico-pre-digital.md │ Débitos pré-03/2024
│   └── totvs-integracao.md │  Configuração TOTVS RM FOP → eSocial → FGTS Digital
│
├── infosimples/           ← API de Consultas Governamentais
│   ├── DOC-1-infosimples-api-geral.md    │  Visão geral da API
│   ├── DOC-2-apis-fgts-detalhado.md      │  APIs FGTS detalhadas
│   ├── DOC-3-catalogo-completo-apis.md   │  Catálogo completo (868 endpoints)
│   ├── DOC-4-precos-e-apis-complementares.md │  Preços e APIs complementares
│   └── openapi-infosimples-v2.json       │  Spec OpenAPI v2
│
├── claude-code/           ← CLI & Agent System
│   ├── README.md          │  Overview do sistema
│   ├── hooks.md           │  Eventos, matchers, responses
│   ├── memory.md          │  Memory system, MEMORY.md
│   ├── settings.md        │  Permissions, env, config
│   ├── mcp.md             │  MCP server configuration
│   ├── sub-agents.md      │  Sub-agents e Agent Teams
│   ├── github.md          │  GitHub integration
│   ├── cli-reference.md   │  Comandos e flags
│   ├── security.md        │  Security model
│   └── tutorials.md       │  Getting started
│
└── raiz-processos/        ← Conhecimento Institucional
    ├── solucoes/           │  88 soluções de melhoria
    │   ├── almoxarifado/   │  7 soluções
    │   ├── assistencia_tecnica/ │ 5 soluções
    │   ├── cantinas/       │  6 soluções
    │   ├── enxoval/        │  4 soluções
    │   ├── frota/          │  5 soluções
    │   ├── impressoras/    │  7 soluções
    │   ├── logistica_interna/ │ 6 soluções
    │   ├── real_estate/    │  8 soluções
    │   ├── seguranca_acesso/ │ 12 soluções
    │   ├── servicos_recorrentes/ │ 6 soluções
    │   ├── suprimentos/    │  9 soluções
    │   ├── telefonia/      │  7 soluções
    │   └── viagens/        │  6 soluções
    └── metodologia/        │  PRISM-Lite (7 fases + guia + métricas)
```

---

## Como Usar

### Leitura direta
```bash
# Buscar endpoint específico
grep -r "send-text" ~/Claude/assets/knowledge-base/z-api/

# Listar todas as soluções de suprimentos
ls ~/Claude/assets/knowledge-base/raiz-processos/solucoes/suprimentos/

# Consultar campo TOTVS RM por nome
grep -i "CODCOLIGADA" ~/Claude/assets/knowledge-base/totvs/generated/all-fields-flat.json

# Buscar endpoint SophiA
grep -i "aluno" ~/Claude/assets/knowledge-base/sophia/swagger-sophia-v1.json | head -10
```

### Via Claude Code
Qualquer sessão pode ler diretamente:
```
"Consulte a KB de HubSpot sobre o endpoint de contacts"
"Quais soluções existem para o processo de frota?"
"Como funciona a autenticação do Z-API?"
"Qual DataServer expõe a tabela SALUNO?"
```

### Indexador (maquina-melhoria-processos)
```bash
cd ~/Claude/projetos/maquina-melhoria-processos
python scripts/index_kb.py --config config/knowledge-config.json
```

---

## Hierarquia de Soluções (para projetos de melhoria de processos)

```
N1: Config nativa (TOTVS FV, Zeev gateway/SLA, HubSpot workflow) → PRIMEIRO
N2: Integração nativa entre sistemas (API REST)
N3: Orquestração via n8n (middleware)
N4: RPA ou solução de mercado → ÚLTIMO RECURSO
```

---

## Manutenção

- **Adicionar sistema**: criar pasta `knowledge-base/<sistema>/`, adicionar README.md + docs
- **Atualizar**: editar arquivos existentes, manter catalog.json sincronizado
- **Não duplicar**: cada sistema tem UMA cópia aqui — projetos referenciam, não copiam
- **Sync para GitHub**: push para `andregusman-raiz/a-gusman-claude`
