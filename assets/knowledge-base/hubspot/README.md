# HubSpot — Knowledge Base

> CRM completo — Marketing, Sales, Service, Commerce, Automation.
> Integrado com raiz-platform (OAuth, 7 routes, webhooks, types).

---

## Estrutura

```
hubspot/
├── unified/          ← COMECE AQUI — KB MECE por domínio
│   ├── index.md      ← Ponto de entrada
│   ├── apis.json     ← 71 specs, 862 endpoints catalogados
│   ├── integration.json  ← Estado raiz-platform
│   ├── domains/      ← 8 domínios de negócio
│   └── guides/       ← Integração, gotchas
│
└── raw/              ← Fontes brutas (preservadas)
    ├── specs/        ← 71 OpenAPI JSON (8.2MB) + index
    ├── kb/           ← 300 artigos KB (JSONL)
    └── guides/       ← 85 developer guides (JSONL)
```

---

## Camada Unificada — COMECE AQUI

**[→ unified/index.md](unified/index.md)**

| Recurso | O que contém |
|---------|-------------|
| `unified/apis.json` | 71 specs, 862 endpoints por domínio |
| `unified/glossary.json` | 25 termos CRM → negócio PT-BR |
| `unified/domains/` | 8 docs por domínio |
| `unified/rules.json` | OAuth, rate limits, webhooks |
| `unified/integration.json` | Routes, types, env vars, scopes |
| `unified/guides/` | Padrões, 23 gotchas |

---

## Métricas

| Métrica | Valor |
|---------|-------|
| OpenAPI specs | 71 (8.2MB) |
| Total endpoints | 862 |
| KB articles | 300 |
| Developer guides | 85 |
| Routes raiz-platform | 7 |
| Última atualização | 2026-03-26 |
