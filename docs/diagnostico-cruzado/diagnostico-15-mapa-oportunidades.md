# D15 — Mapa Consolidado de Oportunidades

> **Data**: 2026-03-01
> **Fonte**: 14 diagnosticos cruzados (D01-D14)
> **Projetos**: raiz-platform (Next.js 14) vs rAIz-AI-Prof (Vite 7 + React 19)

---

## 1. Resumo Executivo

### Maturidade por Dimensao (escala 1-10)

| Dimensao | raiz-platform | rAIz-AI-Prof | Delta |
|----------|:---:|:---:|:---:|
| D01 Arquitetura | 7.0 | 6.0 | +1.0 raiz |
| D02 Database | 8.0 | 5.5 | +2.5 raiz |
| D03 APIs | 6.5 | 4.0 | +2.5 raiz |
| D04 Config | 8.0 | 3.0 | +5.0 raiz |
| D05 Auth | 8.5 | 4.5 | +4.0 raiz |
| D06 Seguranca | 8.2 | 7.0 | +1.2 raiz |
| D07 Testes | 7.5 | 7.0 | +0.5 raiz |
| D08 Code Quality | 6.0 | 7.0 | +1.0 rAIz |
| D09 Observability | 9.0 | 5.0 | +4.0 raiz |
| D10 CI/CD | 5.1 | 6.9 | +1.8 rAIz |
| D11 Performance | 6.5 | 7.5 | +1.0 rAIz |
| D12 Build Tooling | 5.3 | 7.2 | +1.9 rAIz |
| D13 Documentacao | 5.2 | 7.4 | +2.2 rAIz |
| D14 A11y & i18n | 4.0 | 7.5 | +3.5 rAIz |
| **Media** | **6.7** | **6.0** | **+0.7 raiz** |

**Conclusao**: raiz-platform lidera em backend/infra (DB, Auth, Config, Observability). rAIz-AI-Prof lidera em DX/frontend (Build, CI/CD, A11y, i18n, Docs, Performance client-side). Ambos tem score medio ~6.5, com gaps complementares.

### Top 5 Melhorias Criticas por Projeto

**raiz-platform:**
1. Criar README.md (D13 — inexistente)
2. Remover `ignoreBuildErrors: true` (D01 — erros de tipo nao bloqueiam deploy)
3. Adicionar quality gate antes de deploy (D10 — Vercel auto-deploys sem CI)
4. Instalar knip/madge/depcheck (D01/D12 — zero analise de dead code)
5. Adicionar regras jsx-a11y explicitas (D14 — apenas 5 regras implicitas)

**rAIz-AI-Prof:**
1. Adicionar auth nos endpoints API (D03/D05 — zero autenticacao)
2. Migrar `getSession()` para `getUser()` (D05 — token nao validado server-side)
3. Criar schema Zod de env (D04 — zero validacao, fail-silent)
4. Gerar `database.types.ts` automaticamente (D02 — 2162 linhas manuais)
5. Corrigir `unsafe-eval` no CSP (D06 — XSS via eval)

---

## 2. Catalogo Completo de Oportunidades

### P0 — Critico (impacto direto em seguranca/estabilidade)

| # | Oportunidade | Projeto | Dimensao | Esforco | Descricao |
|---|-------------|---------|----------|---------|-----------|
| P0-01 | Adicionar auth nos endpoints API | rAIz | D03/D05 | M (8h) | Endpoints LLM acessiveis sem autenticacao |
| P0-02 | Migrar getSession() para getUser() | rAIz | D05 | S (2h) | Token nao validado com servidor Supabase |
| P0-03 | Mover permissoes de nivel para DB | rAIz | D05 | M (8h) | Niveis em localStorage (manipulavel) |
| P0-04 | Corrigir canDeleteItem permissivo | rAIz | D05 | S (1h) | Retorna true para qualquer user |
| P0-05 | Criar schema Zod de env | rAIz | D04 | M (6h) | Zero validacao, fail-silent com placeholders |
| P0-06 | Remover API key de app.config.json | raiz | D04 | S (30m) | Google API key hardcoded no repositorio |
| P0-07 | Gerar database.types.ts automaticamente | rAIz | D02 | S (2h) | 2162 linhas manuais vs 29617 geradas |
| P0-08 | Unificar filas de sync | rAIz | D02 | S (4h) | 3 mecanismos concorrentes de sync |
| P0-09 | Corrigir geracao de IDs no DataService | rAIz | D02 | S (1h) | IDs nao-UUID conflitam com Supabase |
| P0-10 | Implementar CSRF no raiz-platform | raiz | D03 | S (4h) | Sem CSRF (confia apenas em SameSite) |
| P0-11 | Corrigir leak de stack traces | rAIz | D03 | S (1h) | Error messages expoe stack traces |
| P0-12 | Remover unsafe-eval do CSP | rAIz | D06 | S (2h) | XSS via eval possivel |
| P0-13 | Eliminar ignoreBuildErrors: true | raiz | D01 | L (40h+) | Erros de tipo nao bloqueiam deploy |
| P0-14 | Habilitar strict no CI do rAIz | rAIz | D01 | L (80h+) | 677+ erros de tipo ignorados no CI |
| P0-15 | Quality gate antes de production deploy | raiz | D10 | M (4h) | Vercel auto-deploys sem checar CI |
| P0-16 | Adicionar promptfoo ao rAIz | rAIz | D07 | M (8h) | LLM outputs sem validacao |
| P0-17 | Corrigir Session Replay PII | rAIz | D09 | S (1h) | maskAllText: false expoe dados |
| P0-18 | Remover Prettier duplicado | rAIz | D08 | S (30m) | .prettierrc e .prettierrc.json conflitam |
| P0-19 | Adicionar typecheck script ao raiz | raiz | D12 | S (5m) | Nao existe script typecheck no package.json |
| P0-20 | Criar README.md no raiz-platform | raiz | D13 | S (2h) | Inexistente — ponto de entrada para devs |

**Total P0**: 20 oportunidades (12 rAIz, 8 raiz)

### P1 — Importante (melhoria significativa)

| # | Oportunidade | Projeto | Dimensao | Esforco |
|---|-------------|---------|----------|---------|
| P1-01 | Agrupar services por dominio | raiz | D01 | M (16h) |
| P1-02 | Consolidar 19 dominios de jogos | rAIz | D01 | M (8h) |
| P1-03 | Unificar RouteGuards | rAIz | D01 | S (4h) |
| P1-04 | Padronizar naming dominios (snake_case) | rAIz | D01 | M (8h) |
| P1-05 | eslint-plugin-boundaries em ambos | ambos | D01 | M (8h) |
| P1-06 | Adotar create_standard_policies() | raiz | D02 | S (3h) |
| P1-07 | Adicionar Zod schemas (tabelas criticas) | rAIz | D02 | M (8h) |
| P1-08 | Query interceptor no rAIz | rAIz | D02 | S (3h) |
| P1-09 | Limpar migrations .bak | rAIz | D02 | S (1h) |
| P1-10 | Unificar error handling (createRouteHandler) | raiz | D03 | L (20h) |
| P1-11 | Criar handler factory no rAIz | rAIz | D03 | M (8h) |
| P1-12 | Zod validation nos endpoints rAIz | rAIz | D03 | M (8h) |
| P1-13 | Padronizar formato resposta | ambos | D03 | M (8h) |
| P1-14 | Request ID no rAIz | rAIz | D03 | S (2h) |
| P1-15 | Feature flags DB-backed no rAIz | rAIz | D04 | L (12h) |
| P1-16 | Centralizar config do rAIz | rAIz | D04 | M (6h) |
| P1-17 | Unificar .env.example do rAIz | rAIz | D04 | S (1h) |
| P1-18 | Audit trail de auth | rAIz | D05 | M (4h) |
| P1-19 | Migrar domain allowlist para DB | rAIz | D05 | M (4h) |
| P1-20 | Ativar step-up auth | raiz | D05 | L (20h) |
| P1-21 | Rate limiting no rAIz | rAIz | D05 | M (4h) |
| P1-22 | Adicionar middleware auth Vercel functions | rAIz | D05 | M (8h) |
| P1-23 | Adicionar CodeQL/SAST ao raiz | raiz | D06 | M (4h) |
| P1-24 | Prompt injection middleware no rAIz | rAIz | D06 | M (8h) |
| P1-25 | A11y CI no raiz-platform | raiz | D07 | M (6h) |
| P1-26 | Typecheck bloqueante no CI rAIz | rAIz | D07 | S (1h) |
| P1-27 | Ativar eslint-config-prettier no rAIz | rAIz | D08 | S (30m) |
| P1-28 | Reduzir max-warnings ESLint | rAIz | D08 | M (8h) |
| P1-29 | OTel distribuido no rAIz | rAIz | D09 | L (16h) |
| P1-30 | Secret redaction melhorada | ambos | D09 | M (4h) |
| P1-31 | All-checks agregador no raiz | raiz | D10 | S (2h) |
| P1-32 | Node.js version consistency rAIz CI | rAIz | D10 | S (1h) |
| P1-33 | Lazy loading libs pesadas no raiz | raiz | D11 | M (8h) |
| P1-34 | Unificar sync queues duplicadas | rAIz | D11 | M (6h) |
| P1-35 | Instalar knip no raiz | raiz | D12 | S (30m) |
| P1-36 | Migrar ESLint 8 para 9 flat config | raiz | D12 | M (4h) |
| P1-37 | Commitlint no raiz | raiz | D12 | S (30m) |
| P1-38 | CONTRIBUTING.md no raiz | raiz | D13 | S (2h) |
| P1-39 | Rodar TypeDoc no rAIz | rAIz | D13 | S (1h) |
| P1-40 | 22 regras jsx-a11y no raiz | raiz | D14 | S (2h) |
| P1-41 | E2E accessibility tests no raiz | raiz | D14 | M (6h) |
| P1-42 | Habilitar i18next/no-literal-string | rAIz | D14 | S (1h) |

**Total P1**: 42 oportunidades

### P2 — Desejavel

| # | Oportunidade | Projeto | Dimensao | Esforco |
|---|-------------|---------|----------|---------|
| P2-01 | Storybook no raiz-platform | raiz | D01 | M (8h) |
| P2-02 | src/ wrapper no rAIz | rAIz | D01 | L (24h) |
| P2-03 | Consolidar state management rAIz | rAIz | D01 | M (16h) |
| P2-04 | Repository layer rAIz (quando SSR) | rAIz | D02 | L (16h) |
| P2-05 | Injetar client no BaseRepository | raiz | D02 | M (4h) |
| P2-06 | Realtime subscriptions no raiz | raiz | D02 | M (8h) |
| P2-07 | OpenAPI spec automatica | ambos | D03 | L (20h) |
| P2-08 | Gerar .env.example automaticamente | raiz | D04 | S (1h) |
| P2-09 | Unificar modelo RBAC | ambos | D05 | M (8h) |
| P2-10 | Completar migracao core/ -> qi/ | raiz | D01 | S (4h) |
| P2-11 | CORS configuravel no middleware raiz | raiz | D03 | S (4h) |
| P2-12 | Migrar React Context para Zustand | raiz | D01 | L (40h) |
| P2-13 | i18n no raiz-platform | raiz | D14 | L (40h+) |
| P2-14 | PostHog no rAIz (ou Plausible full) | rAIz | D09 | M (8h) |
| P2-15 | Grafana/dashboard no rAIz | rAIz | D09 | L (16h) |
| P2-16 | AI code review no rAIz CI | rAIz | D10 | M (8h) |
| P2-17 | DORA metrics no rAIz | rAIz | D10 | M (4h) |
| P2-18 | Performance service no raiz | raiz | D11 | M (8h) |
| P2-19 | Monorepo assessment | ambos | D12 | L (40h) |
| P2-20 | ADR template no raiz | raiz | D13 | S (1h) |

**Total P2**: 20 oportunidades

### P3 — Nice-to-Have

| # | Oportunidade | Projeto | Dimensao | Esforco |
|---|-------------|---------|----------|---------|
| P3-01 | PWA no raiz-platform | raiz | D01/D11 | L (24h) |
| P3-02 | Typed routes no rAIz | rAIz | D01 | M (8h) |
| P3-03 | pgvector no rAIz para RAG | rAIz | D02 | L (16h) |
| P3-04 | API versioning strategy | ambos | D03 | M (8h) |
| P3-05 | MFA/2FA | ambos | D05 | L (20h) |
| P3-06 | Invite flow no rAIz | rAIz | D05 | M (8h) |
| P3-07 | CLI auth no rAIz | rAIz | D05 | L (20h) |
| P3-08 | OWASP ZAP no raiz CI | raiz | D06 | M (4h) |
| P3-09 | Visual regression (Chromatic) no raiz | raiz | D07 | M (8h) |
| P3-10 | RTL support completo no rAIz | rAIz | D14 | L (16h) |

**Total P3**: 10 oportunidades

---

## 3. Contagem Total

| Prioridade | raiz-platform | rAIz-AI-Prof | Ambos | Total |
|-----------|:---:|:---:|:---:|:---:|
| **P0** | 8 | 12 | 0 | **20** |
| **P1** | 17 | 21 | 4 | **42** |
| **P2** | 10 | 6 | 4 | **20** |
| **P3** | 3 | 5 | 2 | **10** |
| **Total** | **38** | **44** | **10** | **92** |

---

## 4. Agrupamento por Esforco

### Quick Wins (< 2h) — 28 itens

| # | Oportunidade | Projeto | Prioridade |
|---|-------------|---------|-----------|
| P0-06 | Remover API key de app.config.json | raiz | P0 |
| P0-09 | Corrigir geracao de IDs DataService | rAIz | P0 |
| P0-11 | Corrigir leak de stack traces | rAIz | P0 |
| P0-17 | Corrigir Session Replay PII | rAIz | P0 |
| P0-18 | Remover Prettier duplicado | rAIz | P0 |
| P0-19 | Adicionar typecheck script | raiz | P0 |
| P0-02 | Migrar getSession para getUser | rAIz | P0 |
| P0-04 | Corrigir canDeleteItem | rAIz | P0 |
| P0-12 | Remover unsafe-eval do CSP | rAIz | P0 |
| P0-20 | Criar README.md no raiz | raiz | P0 |
| P1-09 | Limpar migrations .bak | rAIz | P1 |
| P1-14 | Request ID no rAIz | rAIz | P1 |
| P1-17 | Unificar .env.example | rAIz | P1 |
| P1-26 | Typecheck bloqueante no CI | rAIz | P1 |
| P1-27 | Ativar eslint-config-prettier | rAIz | P1 |
| P1-31 | All-checks agregador | raiz | P1 |
| P1-32 | Node.js version consistency | rAIz | P1 |
| P1-35 | Instalar knip | raiz | P1 |
| P1-37 | Commitlint no raiz | raiz | P1 |
| P1-39 | Rodar TypeDoc | rAIz | P1 |
| P1-42 | Habilitar no-literal-string | rAIz | P1 |
| P1-03 | Unificar RouteGuards | rAIz | P1 |
| P1-06 | create_standard_policies() | raiz | P1 |
| P1-08 | Query interceptor | rAIz | P1 |
| P1-38 | CONTRIBUTING.md | raiz | P1 |
| P1-40 | 22 regras jsx-a11y | raiz | P1 |
| P2-08 | Gerar .env.example auto | raiz | P2 |
| P2-20 | ADR template no raiz | raiz | P2 |

### Medium (2-8h) — 36 itens

Inclui: P0-01/03/05/07/08/10/16, P1-02/04/05/07/11/12/13/15/16/18/19/21/22/23/24/25/28/30/33/34/36/41, P2-01/05/06/09/11/14/17/18, e outros.

### Large (1-3 dias) — 20 itens

Inclui: P0-13/14, P1-10/15/20/29/33/36, P2-02/03/04/07/12/15/19, e outros.

### XL (1+ semana) — 8 itens

| # | Oportunidade | Projeto | Esforco Estimado |
|---|-------------|---------|-----------------|
| P0-13 | Eliminar ignoreBuildErrors | raiz | 40h+ |
| P0-14 | Habilitar TS strict no CI | rAIz | 80h+ |
| P2-12 | Migrar React Context para Zustand | raiz | 40h+ |
| P2-13 | i18n no raiz-platform | raiz | 40h+ |
| P2-19 | Monorepo assessment | ambos | 40h+ |
| P3-01 | PWA no raiz-platform | raiz | 24h |
| P3-05 | MFA/2FA | ambos | 20h+ |
| P3-07 | CLI auth no rAIz | rAIz | 20h+ |

---

## 5. Dependencias Entre Melhorias

```
P0-05 (Zod env schema rAIz)
  └── P1-16 (Centralizar config rAIz)
       └── P1-15 (Feature flags DB-backed)

P0-01 (Auth nos endpoints)
  ├── P1-22 (Middleware auth Vercel)
  ├── P1-21 (Rate limiting)
  └── P1-18 (Audit trail)

P0-07 (database.types.ts gerado)
  └── P1-07 (Zod schemas tabelas criticas)

P1-35 (Instalar knip)
  └── P2-10 (Completar migracao core/ -> qi/)

P1-36 (ESLint 9 flat config)
  └── P1-05 (eslint-plugin-boundaries)
       └── P1-01 (Agrupar services por dominio)

P1-40 (22 regras jsx-a11y)
  └── P1-41 (E2E a11y tests)
       └── P1-25 (A11y CI)

P0-15 (Quality gate deploy)
  └── P1-31 (All-checks agregador)

P1-02 (Consolidar dominios jogos)
  └── P1-04 (Padronizar naming)

P0-20 (README.md raiz)
  └── P1-38 (CONTRIBUTING.md)
```

---

## 6. Roadmap Sugerido de Implementacao

### Sprint 1 — Semana 1: Quick Wins P0 (1-2 dias por projeto)

**raiz-platform (8 itens, ~8h):**
- P0-06: Remover API key de app.config.json (30m)
- P0-19: Adicionar typecheck script (5m)
- P0-20: Criar README.md (2h)
- P0-10: Implementar CSRF (portar do rAIz) (4h)
- P1-35: Instalar knip (30m)
- P1-37: Commitlint (30m)
- P1-31: All-checks agregador no CI (2h)

**rAIz-AI-Prof (12 itens, ~12h):**
- P0-02: Migrar getSession -> getUser (2h)
- P0-04: Corrigir canDeleteItem (1h)
- P0-09: Corrigir IDs DataService (1h)
- P0-11: Sanitizar stack traces (1h)
- P0-12: Remover unsafe-eval do CSP (2h)
- P0-17: Corrigir Session Replay PII (1h)
- P0-18: Remover Prettier duplicado (30m)
- P1-09: Limpar migrations .bak (1h)
- P1-17: Unificar .env.example (1h)
- P1-26: Typecheck bloqueante no CI (1h)
- P1-27: Ativar eslint-config-prettier (30m)
- P1-32: Node.js version consistency (1h)

### Sprint 2 — Semana 2: P0 Medium Efforts

**raiz-platform (2 itens, ~8h):**
- P0-15: Quality gate antes de deploy (4h)
- P1-23: CodeQL/SAST no CI (4h)

**rAIz-AI-Prof (5 itens, ~28h):**
- P0-01: Auth nos endpoints API (8h)
- P0-05: Schema Zod de env (6h)
- P0-07: Gerar database.types.ts automaticamente (2h)
- P0-08: Unificar filas de sync (4h)
- P0-03: Permissoes de nivel para DB (8h)

### Sprint 3-4 — Semanas 3-4: P1 Improvements

**raiz-platform (~60h):**
- P1-01: Agrupar services por dominio (16h)
- P1-25: A11y CI (6h)
- P1-36: ESLint 9 flat config (4h)
- P1-40: 22 regras jsx-a11y (2h)
- P1-41: E2E a11y tests (6h)
- P1-33: Lazy loading libs pesadas (8h)
- P1-06: create_standard_policies() (3h)
- P1-38: CONTRIBUTING.md (2h)
- P1-10: Unificar error handling (20h)

**rAIz-AI-Prof (~60h):**
- P1-02: Consolidar dominios jogos (8h)
- P1-04: Padronizar naming (8h)
- P1-11: Handler factory (8h)
- P1-12: Zod validation endpoints (8h)
- P1-22: Middleware auth Vercel functions (8h)
- P1-15: Feature flags DB-backed (12h)
- P1-16: Centralizar config (6h)
- P1-24: Prompt injection middleware (8h)
- P0-16: Promptfoo setup (8h)

### Sprint 5-8 — Mes 2: P2 Improvements

**Priorizados:**
- P2-10: Completar migracao core/ -> qi/ (raiz, 4h)
- P2-01: Storybook no raiz (8h)
- P2-06: Realtime subscriptions no raiz (8h)
- P2-05: Injetar client no BaseRepository (4h)
- P2-14: Analytics melhorado no rAIz (8h)
- P2-17: DORA metrics no rAIz (4h)
- P1-29: OTel distribuido no rAIz (16h)
- P1-05: eslint-plugin-boundaries (8h)

### Backlog — P3

- PWA no raiz-platform
- MFA/2FA em ambos
- Monorepo assessment
- CLI auth no rAIz
- pgvector no rAIz

---

## 7. Metricas de Sucesso por Dimensao

| Dimensao | Metrica | Baseline | Target |
|----------|---------|---------|--------|
| D01 Arquitetura | Dominios DDD no rAIz | 55 | ~40 (consolidar jogos) |
| D02 Database | Linhas manuais database.types.ts rAIz | 2162 | 0 (auto-gerado) |
| D03 APIs | Endpoints rAIz sem auth | 15 (100%) | 0 (0%) |
| D04 Config | Arquivos com import.meta.env direto | 22 | 1 (centralizado) |
| D05 Auth | Gaps P0 seguranca rAIz | 5 | 0 |
| D06 Seguranca | unsafe-eval no CSP | 1 | 0 |
| D07 Testes | LLM tests no rAIz (promptfoo) | 0 | 15+ cenarios |
| D08 Code Quality | max-warnings ESLint rAIz | 1000 | 100 |
| D09 Observability | Score maturidade rAIz | 2.5/5 | 3.5/5 |
| D10 CI/CD | Deploys sem quality gate (raiz) | 100% | 0% |
| D11 Performance | Libs pesadas lazy-loaded raiz | 0 | 5+ |
| D12 Build Tooling | DX score raiz | 5.3/10 | 7.0/10 |
| D13 Documentacao | README.md raiz | inexistente | completo |
| D14 A11y | Regras jsx-a11y raiz | 5 implicitas | 22 explicitas |

---

## 8. Maiores Oportunidades de Cross-Pollination

### Do raiz-platform para rAIz-AI-Prof (14 patterns)

| Pattern | Impacto |
|---------|---------|
| Zod env schema validation | Elimina fail-silent |
| Repository pattern + BaseRepository | Camada de dados estruturada |
| Middleware centralizado (auth + headers) | Seguranca server-side |
| Prompt injection detector (26 regras) | Seguranca LLM |
| Feature flags DB-backed + Redis | Toggle sem deploy |
| withObservability() API wrapper | Instrumentacao automatica |
| Idempotency service | Resiliencia de APIs |
| OTel + Sentry tri-runtime | Observabilidade enterprise |
| PostHog product analytics | Analytics completo |
| Access levels server-side (migration 062) | Permissoes seguras |
| Zod schemas (124+ arquivos) | Validacao runtime |
| Query interceptor (slow query detection) | Performance DB |
| LLM Router com circuit breaker | Resiliencia LLM |
| CSRF Double Submit Cookie (adaptar do rAIz) | Seguranca |

### Do rAIz-AI-Prof para raiz-platform (12 patterns)

| Pattern | Impacto |
|---------|---------|
| knip + madge + depcheck | Dead code e circular deps |
| ESLint flat config (9.x) | Modernizacao |
| 22 regras jsx-a11y | Acessibilidade |
| commitlint | Commits semanticos |
| pa11y + axe-core + Storybook a11y | Pipeline a11y |
| CodeQL + OWASP ZAP | Security scanning |
| Page Object Pattern E2E | Testes mantiveis |
| MSW mocking | Testes isolados |
| Error budgets CI (TS/ESLint) | Quality gates |
| create_standard_policies() | RLS DRY |
| Performance service completo | Web Vitals tracking |
| Workbox PWA + offline sync | Offline capabilities |

### Pacotes Compartilhados Propostos

| Pacote | Conteudo |
|--------|---------|
| `@raiz/shared-schemas` | Zod schemas de usuario/org |
| `@raiz/design-tokens` | Cores, espacamento, tipografia |
| `@raiz/llm-sdk` | Abstracoes multi-LLM |
| `@raiz/error-handling` | Circuit breakers, retry patterns |
| `@raiz/supabase-auth` | Auth helpers compartilhados |

---

## 9. Esforco Total Estimado

| Fase | raiz-platform | rAIz-AI-Prof | Total |
|------|:---:|:---:|:---:|
| Sprint 1 (Quick Wins P0) | ~8h | ~12h | **~20h** |
| Sprint 2 (P0 Medium) | ~8h | ~28h | **~36h** |
| Sprints 3-4 (P1) | ~60h | ~60h | **~120h** |
| Sprints 5-8 (P2) | ~40h | ~40h | **~80h** |
| Backlog (P3) | ~70h | ~70h | **~140h** |
| **Total** | **~186h** | **~210h** | **~396h** |

**Nota**: Sprints 1-2 (~56h) cobrem todas as vulnerabilidades de seguranca e gaps criticos. O ROI mais alto esta nessa fase inicial.

---

*Documento consolidado a partir de 14 diagnosticos cruzados. Gerado em 2026-03-01.*
