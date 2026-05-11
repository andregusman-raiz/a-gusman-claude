# Zeev BPM — Knowledge Base

> Plataforma BPM de processos — raizeducacao.zeev.it
> Integrada com raiz-platform (2 services, 10 agent actions, 10 routes)

---

## Estrutura

```
zeev/
├── unified/          ← COMECE AQUI — KB MECE por domínio
│   ├── index.md      ← Ponto de entrada principal
│   ├── apis.json     ← 98 endpoints + 261 modelos
│   ├── integration.json  ← Estado da integração raiz-platform
│   ├── domains/      ← 6 domínios de negócio
│   └── guides/       ← Integração, gotchas, agent cookbook
│
└── raw/              ← Fontes brutas (preservadas)
    ├── docs/         ← 6 DOCs técnicos (DOC-1 a DOC-6)
    ├── specs/        ← OpenAPI Swagger 2.0 + endpoints JSONL
    ├── kb/           ← 374 artigos KB (JSONL)
    └── blog.jsonl    ← 580 posts do blog (JSONL)
```

---

## Camada Unificada — COMECE AQUI

**[→ unified/index.md](unified/index.md)**

| Recurso | Arquivo | O que contém |
|---------|---------|-------------|
| APIs | `unified/apis.json` | 98 endpoints + 261 modelos |
| Glossário | `unified/glossary.json` | 20 termos Zeev → negócio |
| Domínios | `unified/domains/` | 6 docs por domínio |
| Regras | `unified/rules.json` | Auth, limites, gaps |
| Integração | `unified/integration.json` | Routes, agent tool, env vars |
| Guides | `unified/guides/` | Padrões, gotchas, cookbook |

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Endpoints API | 98 (Nativa) + 4 (Dados) |
| Modelos de dados | 261 |
| DOCs técnicos | 6 |
| KB articles (JSONL) | 374 |
| Blog posts (JSONL) | 580 |
| Agent tool actions | 10 |
| Routes raiz-platform | 10 |
| Última atualização | 2026-03-26 |

---

## Guia Rápido

| Preciso saber... | Consultar |
|-----------------|-----------|
| Endpoints disponíveis | `unified/apis.json` (ou domínio MD) |
| Como autenticar | `unified/domains/06-autenticacao.md` |
| O que o agent tool faz | `unified/guides/agent-tool-cookbook.md` |
| Limites e gaps da API | `unified/rules.json` > gaps |
| Padrões de código | `unified/guides/integration-patterns.md` |
| Armadilhas | `unified/guides/gotchas.md` |
| Env vars necessárias | `unified/integration.json` > envVars |
| DOCs detalhados | `raw/docs/DOC-1` a `DOC-6` |
