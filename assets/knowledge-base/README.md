# Knowledge Base — Raíz Educação

> Base de conhecimento centralizada para todos os sistemas, processos e ferramentas da Raíz Educação.
> Compartilhada entre projetos. Qualquer sessão Claude Code pode ler daqui.

---

## Visão Geral

| Métrica | Valor |
|---------|-------|
| Sistemas documentados | 10 |
| Arquivos totais | 264 |
| Tamanho | 24 MB |
| Records indexados | 2,417+ |
| Última atualização | 2026-03-21 |

---

## Sistemas

### Sistemas Corporativos (ERP / BPM / CRM)

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **TOTVS RM** | `totvs/` | 14 | ERP educacional — API specs (263r), TDN docs (187r), Central Suporte (300r), guias de integração, schema MSSQL, regras de negócio |
| **Zeev** | `zeev/` | 4 | BPM de processos — KB (374r), API Swagger/endpoints (98r), blog (580r) |
| **HubSpot** | `hubspot/` | 74 | CRM Marketing/Sales — 71 API specs OpenAPI, KB (300r), dev guides (85r) |
| **Finnet** | `finnet/` | 5 | Gestão financeira — API Universal, CNAB, EDI, Open Finance |

### Plataformas de Gestão de Pessoas

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Gupy / Pulses** | `gupy-pulses/` | 7 | RH — Recrutamento, Admissão, Clima/Engajamento, Treinamento, conector TOTVS RM |

### Plataforma Educacional

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Layers Education** | `layers/` | 36 | Ecossistema educacional — Portal API/SSO (6), Super Cantina (26), Community Data API, Payments API, Data Sync |

### Comunicação e Automação

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Z-API** | `z-api/` | 10 | WhatsApp REST API — mensagens (19 endpoints), grupos, instância, webhooks, segurança, contatos, business |
| **n8n** | `n8n/` | 6 | Automação de workflows — API reference, webhooks, core nodes, integrações, hosting |

### Ferramentas de Desenvolvimento

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Claude Code** | `claude-code/` | 10 | CLI & agent system — hooks, memory, MCP, sub-agents, settings, CLI reference, security |

### Conhecimento Institucional

| Sistema | Path | Files | Descrição |
|---------|------|-------|-----------|
| **Raíz Processos** | `raiz-processos/` | 97 | 88 soluções de melhoria em 13 áreas operacionais + metodologia PRISM-Lite (7 fases) |

---

## Estrutura de Diretórios

```
knowledge-base/
├── README.md              ← Este arquivo
├── catalog.json           ← Índice geral (1,679 records, categorias, date ranges)
│
├── hubspot/               ← CRM (Marketing, Sales, Data Hub, Service)
│   ├── guides/            │  hubspot_guides.jsonl (85 dev guides)
│   ├── kb/                │  hubspot_kb.jsonl (300 KB articles)
│   └── specs/             │  71 API specs OpenAPI (.json) + índice (.jsonl)
│
├── totvs/                 ← ERP Educacional (RM v12.1.2502)
│   ├── docs/              │  11 docs técnicos (API ref, schema MSSQL, regras negócio, BFF, permissões, rollout, integração)
│   ├── specs/             │  totvs_rm_specs.jsonl (263 API specs)
│   ├── suporte/           │  totvs_central.jsonl (300 artigos Central Suporte)
│   └── tdn/               │  totvs_tdn.jsonl (187 docs TDN)
│
├── zeev/                  ← BPM de Processos (raizeducacao.zeev.it)
│   ├── kb/                │  zeev_kb.jsonl (374 KB articles)
│   ├── specs/             │  endpoints.jsonl (98) + openapi.json
│   └── blog.jsonl         │  580 blog posts
│
├── layers/                ← Plataforma Educacional
│   ├── portal-docs/       │  6 docs (visão geral, config, API ref, SSO, exemplos, serviços)
│   ├── super-cantina-docs/│  26 docs (arquitetura, backend, frontend, PDV, DB, segurança, DevOps)
│   ├── api-reference.md   │  Public APIs overview
│   ├── community-data-api.md │  /open-api/data endpoints
│   ├── auth-api.md        │  SSO, OAuth2, session
│   ├── payments-api.md    │  Sales, items, kits, inventory
│   └── ...                │  + sync, hub, webhooks, permissions, viz apps
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
│   ├── webhooks.md        │  Eventos e payloads
│   ├── authentication.md  │  JWT, SAML, Admin Global
│   └── admin.md           │  Positions, collaborators
│
├── finnet/                ← Gestão Financeira
│   ├── README.md          │  Overview
│   ├── api-universal.md   │  API Universal multibanco
│   ├── cnab.md            │  CNAB, conversão API↔CNAB
│   ├── open-finance.md    │  Open Finance 2025-2026
│   └── solutions.md       │  Soluções por categoria
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

# Consultar specs TOTVS RM
cat ~/Claude/assets/knowledge-base/totvs/specs/totvs_rm_specs.jsonl | head -5
```

### Via Claude Code
Qualquer sessão pode ler diretamente:
```
"Consulte a KB de HubSpot sobre o endpoint de contacts"
"Quais soluções existem para o processo de frota?"
"Como funciona a autenticação do Z-API?"
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
- **Sync para GitHub**: push para `andregusman-raiz/a-gusman-claude` (PR #3)
