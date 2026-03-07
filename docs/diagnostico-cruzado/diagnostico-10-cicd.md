# Diagnostico 10 — CI/CD & Deploy

> Analise cruzada de pipelines CI/CD, deployment e automacao entre raiz-platform e rAIz-AI-Prof.

**Data**: 2026-03-01
**Arquivos analisados**: 17 workflows, 2 vercel.json, 2 package.json, hooks, configs

---

## 1. Inventario Completo de GitHub Actions

### raiz-platform (7 workflows)

| Workflow | Arquivo | Trigger | Jobs |
|----------|---------|---------|------|
| CI | `ci.yml` | push (main/develop/feature/*), PR (main/develop) | lint, build, security-audit, test, typecheck, test-e2e, error-budget-check |
| CLI Release | `cli-release.yml` | tag `cli-v*`, workflow_dispatch | build (4 plataformas), release, cleanup |
| Claude Security Review | `security-review.yml` | PR (main/develop) | security-review (Claude Haiku) |
| AI Code Review | `ai-code-review.yml` | PR (main/develop) | ai-review (Claude Haiku) |
| TypeScript Type Check | `typecheck.yml` | PR (main/develop) | typecheck (com report no PR) |
| DORA Metrics | `dora-metrics.yml` | schedule (seg 9h UTC), workflow_dispatch | collect-metrics |
| Observability Triage | `observability-triage.yml` | schedule (6h), workflow_dispatch | triage (Sentry + Grafana) |

### rAIz-AI-Prof (10 workflows)

| Workflow | Arquivo | Trigger | Jobs |
|----------|---------|---------|------|
| CI | `ci.yml` | push (main/master/develop), PR (main/master/develop) | install, typecheck, lint, validate-exports, test, build, dependency-check, security-scan (OWASP ZAP), e2e, i18n-check, all-checks |
| Deploy to Production | `deploy.yml` | push (main/master), workflow_dispatch | build-and-test, deploy-vercel, sentry-release, notify |
| PR Checks | `pr-checks.yml` | PR (opened/synchronize/reopened) | pr-title-check, pr-size-check, auto-label |
| Quality Gates | `quality-gates.yml` | PR (main/master/develop), push (main/master/develop) | typescript-budget, eslint-budget, file-size-check, npm-audit, quality-summary |
| CodeQL | `codeql.yml` | push (main/master), PR (main/master), schedule (seg 0h) | analyze (GitHub CodeQL) |
| Lighthouse | `lighthouse.yml` | PR (main/master/develop), push (main/master/develop) | lighthouse, accessibility-audit |
| Autofix PR | `autofix-pr.yml` | workflow_dispatch | autofix (TransformEngine), notify-failure |
| TypeScript Debt | `typescript-debt.yml` | schedule (seg 0h), workflow_dispatch | analyze (com tracking de progresso) |
| Accessibility Audit | `a11y.yml` | push (main/develop), PR (main/develop) | pa11y-ci, axe-playwright, a11y-summary |
| Vercel Preview | `preview-deploy.yml` | PR (main/master/develop) | quality-check, build, deploy-preview |

---

## 2. Comparacao Side-by-Side

### 2.1 Pipeline CI Principal

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Framework** | Next.js 14 (App Router) | Vite 7 (SPA + PWA) |
| **Node.js** | v20 | v20 (CI) / v18 (deploy) |
| **Gerenciador** | npm ci | npm ci (com cache de node_modules) |
| **Cache estrategia** | `actions/setup-node` cache npm | `actions/cache` explicity para node_modules + setup-node |
| **Job de instalacao compartilhado** | Nao (cada job instala) | Sim (job `install` com cache reutilizado) |
| **Lint** | `npm run lint` (next lint) | `npm run lint` (ESLint max-warnings=500) |
| **TypeCheck** | `npx tsc --noEmit` | `npm run typecheck` (config relaxado) |
| **Testes unitarios** | Jest (`npm run test:ci`) | Vitest (`npm run test:coverage`) |
| **Coverage upload** | Codecov | Codecov |
| **E2E** | Playwright (Chromium) | Playwright (Chromium) |
| **Build** | `next build` | `vite build` |
| **Security audit** | `npm audit --audit-level=high` | `npm audit` + OWASP ZAP baseline |
| **Bundle check** | Sim (5MB limit, chunk check) | Sim (10MB limit, warning only) |
| **Job agregador** | Nao | Sim (`all-checks` required) |

### 2.2 Quality Gates em PR

| Check | raiz-platform | rAIz-AI-Prof |
|-------|--------------|--------------|
| **Lint obrigatorio** | Sim (via CI) | Sim (via CI) |
| **TypeCheck obrigatorio** | Sim (via CI) | Sim (via CI + Quality Gates) |
| **Testes obrigatorios** | Sim (via CI) | Sim (via CI) |
| **E2E obrigatorio** | Sim (via CI) | Sim (via CI) |
| **Error budget (TS)** | Nao (report informativo, tracking 3795 erros) | Sim (max 1200 erros, bloqueante) |
| **Error budget (ESLint)** | Nao | Sim (max 9000 erros, bloqueante) |
| **File size check** | Nao | Sim (max 2000 linhas, warning) |
| **Bundle size gate** | Sim (5MB hard fail) | Sim (10MB warning) |
| **PR title convention** | Nao | Sim (semantic-pull-request) |
| **PR size check** | Nao | Sim (warning >1000 linhas) |
| **Auto-label** | Nao | Sim (actions/labeler) |
| **Validate barrel exports** | Nao | Sim (npm run validate:exports) |
| **i18n validation** | Nao | Sim (i18n:validate --strict) |
| **Accessibility check** | Nao | Sim (pa11y-ci + axe-core) |
| **Lighthouse** | Nao | Sim (performance/a11y/SEO) |

### 2.3 AI-Powered Code Review

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Code review por IA** | Sim (Claude Haiku 4.5) | Nao |
| **Security review por IA** | Sim (Claude Haiku 4.5) | Nao |
| **Modelo usado** | claude-haiku-4-5 / claude-haiku-4-5-20251001 | N/A |
| **Diff truncation** | 40KB (security), 3000 lines (review) | N/A |
| **Comment update** | Sim (atualiza existente) | N/A |
| **Concurrency control** | Sim (cancel-in-progress) | N/A |
| **Draft PR skip** | Sim (ai-code-review) | N/A |

### 2.4 Security Analysis

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **npm audit** | Sim (high level, continue-on-error) | Sim (JSON parsing, high/critical fail) |
| **OWASP ZAP** | Nao | Sim (baseline scan) |
| **CodeQL (SAST)** | Nao | Sim (schedule semanal + PR) |
| **Claude Security Review** | Sim (OWASP Top 10 focus) | Nao |
| **Custom security audit** | Nao | Sim (`scripts/security-audit.js`) |

### 2.5 Deployment

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Plataforma** | Vercel | Vercel |
| **Framework detectado** | nextjs | vite |
| **Deploy producao** | Automatico via Vercel Git Integration | GitHub Actions (`deploy.yml`) com `amondnet/vercel-action` |
| **Preview deploys** | Automatico via Vercel Git Integration | GitHub Actions (`preview-deploy.yml`) com Vercel CLI |
| **Deploy workflow explicito** | Nao (Vercel auto-deploy) | Sim (`deploy.yml` com build+test antes) |
| **Sentry release** | Nao (tem SDK, sem release workflow) | Sim (`getsentry/action-release`) |
| **Deploy notification** | Nao | Sim (GITHUB_STEP_SUMMARY) |
| **Quality gate pre-deploy** | Nao (Vercel deploya independente de CI) | Sim (build-and-test must pass) |
| **Region** | gru1 (Sao Paulo) | Default (sem config) |

### 2.6 Vercel Configuration

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Build command** | `npm run build` | `npm run build` |
| **Output** | `.next/` (implicit) | `dist/` |
| **Install command** | `npm install --include=optional` | `npm install` |
| **Git deploy config** | Nao especificado | `main` e `master` habilitados |
| **Functions max duration** | 60s (default), 120s (chat), 300s (streaming/cron) | 60s (todas) |
| **Functions runtime** | Implicit (Next.js) | `@vercel/node@5.5.24` explicito |
| **includeFiles** | Nao (Next.js gerencia) | Sim (`lib/**/*.ts`) |
| **Rewrites** | Nao (Next.js routing) | Sim (SPA fallback + API) |
| **Security headers** | Minimo (Cache-Control no-store para API) | Completo (CSP, HSTS, X-Frame-Options, etc.) |
| **Static asset caching** | Nao configurado | Sim (`public, max-age=31536000, immutable`) |
| **Env vars no vercel.json** | Nao | Sim (`VITE_APP_NAME`, `VITE_APP_VERSION`, `CACHE_BUSTER`) |
| **Build env** | Nao | Sim (`NODE_VERSION: "20"`) |

### 2.7 Cron Jobs

#### raiz-platform — 16 cron jobs no vercel.json

| Cron | Path | Schedule | Frequencia |
|------|------|----------|------------|
| RAG Queue | `/api/rag/queue` | `*/5 * * * *` | Cada 5 min |
| Ads Sync | `/api/cron/ads-sync` | `0 * * * *` | Cada hora |
| CLM Daily | `/api/cron/clm` | `0 9 * * *` | Diario 9h |
| CLM Signatures | `/api/cron/clm?job=signatures` | `*/30 * * * *` | Cada 30 min |
| CLM Risk | `/api/cron/clm?job=risk` | `0 10 * * 0` | Semanal dom 10h |
| Social Reports | `/api/cron/social-media/reports` | `*/15 * * * *` | Cada 15 min |
| Social Publish | `/api/cron/social-media/publish` | `*/5 * * * *` | Cada 5 min |
| Media Monitoring | `/api/cron/social-media/media-monitoring` | `*/30 * * * *` | Cada 30 min |
| Daily Metrics | `/api/cron/social-media/daily-metrics` | `5 0 * * *` | Diario 0h05 |
| CLI Cleanup | `/api/cron/cli-cleanup` | `0 */6 * * *` | Cada 6h |
| Files Cleanup | `/api/cron/generated-files-cleanup` | `0 3 * * *` | Diario 3h |
| Warmup | `/api/cron/warmup` | `*/5 * * * *` | Cada 5 min |
| Usage Views | `/api/cron/refresh-usage-views` | `0 * * * *` | Cada hora |
| Background Jobs | `/api/cron/background-jobs` | `* * * * *` | Cada minuto |
| Litigation | `/api/cron/litigation` | `0 6 * * *` | Diario 6h |
| Observability | `/api/cron/observability-triage` | `0 * * * *` | Cada hora |

**Nota**: Existem tambem diretórios como `gchat-sync`, `lit-watches`, `whatsapp-outbound`, `whatsapp-worker` no filesystem que nao estao listados no vercel.json como crons (podem ser chamados on-demand ou via background-jobs).

#### rAIz-AI-Prof — 1 cron job

| Cron | Path | Schedule | Frequencia |
|------|------|----------|------------|
| Reports Cron | `/api/reports/cron` | `0 * * * *` | Cada hora |

### 2.8 Build Caching & Performance

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **npm cache** | Via `actions/setup-node` (package-lock) | Via `actions/cache` (node_modules inteiro) |
| **Turbopack dev** | Sim (`npm run dev:turbo`) | N/A (Vite nativo) |
| **Build analyzer** | `@next/bundle-analyzer` | `rollup-plugin-visualizer` |
| **CI cache strategy** | Cada job instala independente | Job `install` compartilhado via cache |
| **Concurrency control** | Em typecheck e ai-review | Em a11y e preview-deploy |
| **Jobs paralelos** | Todos independentes | Todos dependem do `install` |

### 2.9 Git Hooks (Pre-commit)

| Hook | raiz-platform | rAIz-AI-Prof |
|------|--------------|--------------|
| **Husky** | Sim (v9) | Sim (v9) |
| **pre-commit** | lint-staged | lint-staged |
| **commit-msg** | Nao | commitlint (conventional) |
| **pre-push** | Nao | validate:exports + typecheck |
| **lint-staged (TS)** | ESLint --fix --max-warnings=0 + Prettier | ESLint --fix --max-warnings=1000 + Prettier |
| **lint-staged (JSON/CSS/MD)** | Prettier (JSON/CSS/MD) | Prettier (JSON/CSS/MD) |
| **Barrel validation** | Nao | Sim (index.ts -> validate-exports) |
| **Commitlint** | Nao | Sim (conventional commits enforced) |

### 2.10 DORA Metrics

| Metrica | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Deployment Frequency** | Medido via git log (semanal) | Nao medido |
| **Lead Time for Changes** | Parcial (ultimos 10 merges) | Nao medido |
| **Change Failure Rate** | Placeholder (Sentry pendente) | Nao medido |
| **Time to Restore** | Placeholder (Grafana pendente) | Nao medido |
| **Workflow** | `dora-metrics.yml` (schedule semanal) | Nenhum |
| **Error Budget** | Placeholder em CI (Grafana) | Nao tem |

---

## 3. Gaps Identificados

### 3.1 Gaps em raiz-platform

| ID | Gap | Severidade | Referencia rAIz-AI-Prof |
|----|-----|-----------|------------------------|
| RP-01 | Sem job agregador `all-checks` para branch protection | Alta | `ci.yml` job `all-checks` |
| RP-02 | Sem error budget formal (TS/ESLint) como gate | Media | `quality-gates.yml` |
| RP-03 | Sem PR title validation (conventional commits) | Media | `pr-checks.yml` |
| RP-04 | Sem PR size check | Baixa | `pr-checks.yml` |
| RP-05 | Sem auto-labeling de PRs | Baixa | `pr-checks.yml` |
| RP-06 | Sem CodeQL/SAST analysis | Alta | `codeql.yml` |
| RP-07 | Sem Lighthouse CI | Media | `lighthouse.yml` |
| RP-08 | Sem accessibility audit em CI | Media | `a11y.yml` |
| RP-09 | Sem i18n validation | Baixa | N/A (raiz-platform nao e i18n) |
| RP-10 | Sem barrel exports validation | Baixa | `ci.yml` job `validate-exports` |
| RP-11 | Sem preview deploy workflow explicito (depende de Vercel auto) | Media | `preview-deploy.yml` |
| RP-12 | Sem Sentry release tracking em deploy | Media | `deploy.yml` job `sentry-release` |
| RP-13 | Sem quality gate pre-deploy (Vercel deploya mesmo se CI falha) | Alta | `deploy.yml` needs `build-and-test` |
| RP-14 | Security headers minimos no vercel.json | Alta | Headers completos no rAIz-AI-Prof |
| RP-15 | Sem static asset caching headers | Media | `vercel.json` headers para /assets/ |
| RP-16 | Sem commitlint hook | Baixa | `.husky/commit-msg` |
| RP-17 | Sem pre-push validation hook | Media | `.husky/pre-push` |
| RP-18 | Sem OWASP ZAP scanning | Media | `ci.yml` job `security-scan` |
| RP-19 | Sem TypeScript debt tracking automatizado | Media | `typescript-debt.yml` |
| RP-20 | Sem autofix workflow | Baixa | `autofix-pr.yml` |
| RP-21 | Node version inconsistente (deploy workflow nao tem, CI usa 20) | Baixa | Deploy.yml usa Node 18 |
| RP-22 | Cache strategy subotima (cada job instala do zero) | Media | Job `install` compartilhado |

### 3.2 Gaps em rAIz-AI-Prof

| ID | Gap | Severidade | Referencia raiz-platform |
|----|-----|-----------|-------------------------|
| AI-01 | Sem AI-powered code review | Media | `ai-code-review.yml` |
| AI-02 | Sem AI-powered security review | Media | `security-review.yml` |
| AI-03 | Sem DORA metrics tracking | Media | `dora-metrics.yml` |
| AI-04 | Sem observability triage automatizado | Media | `observability-triage.yml` |
| AI-05 | Sem CLI release workflow | Baixa | `cli-release.yml` (N/A para SPA) |
| AI-06 | Sem region configurada no Vercel | Baixa | `regions: ["gru1"]` |
| AI-07 | Sem error budget check em CI (separado do quality-gates) | Baixa | `ci.yml` job `error-budget-check` |
| AI-08 | Sem cron jobs significativos (apenas 1 vs 16) | Informativo | Complexidade de dominio diferente |
| AI-09 | Node version divergente entre CI (20) e deploy (18) | Media | Deve ser consistente |
| AI-10 | Sem function duration diferenciada por endpoint | Baixa | `vercel.json` com duracoes especificas |
| AI-11 | Deploy depende de amondnet/vercel-action (terceiro) | Baixa | Vercel Git Integration nativo |
| AI-12 | lint-staged com max-warnings=1000 (muito permissivo) | Media | max-warnings=0 em raiz-platform |

---

## 4. Oportunidades Priorizadas

### P0 — Critico (implementar imediatamente)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| 1 | **Quality gate pre-deploy para raiz-platform**: Vercel auto-deploy ignora resultado do CI. Se o CI falha mas o push foi para main, Vercel deploya mesmo assim. Configurar branch protection ou usar workflow deploy explicito. | raiz-platform | M | Previne deploy de codigo quebrado |
| 2 | **Security headers no vercel.json de raiz-platform**: Atualmente so tem `Cache-Control: no-store` para API. Faltam CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. | raiz-platform | S | Vulnerabilidade direta em producao |
| 3 | **Job agregador all-checks em raiz-platform**: Sem job agregador, branch protection nao pode exigir "todos os checks passaram". | raiz-platform | S | Habilita branch protection efetiva |
| 4 | **Corrigir Node version divergente em rAIz-AI-Prof**: `deploy.yml` usa Node 18 enquanto CI usa Node 20. Pode causar bugs de runtime. | rAIz-AI-Prof | S | Previne inconsistencias de build |

### P1 — Alto (implementar no proximo sprint)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| 5 | **CodeQL/SAST para raiz-platform**: Plataforma enterprise sem SAST automatizado e risco significativo. Copiar `codeql.yml` do rAIz-AI-Prof. | raiz-platform | S | Deteccao de vulnerabilidades |
| 6 | **Error budget formal (TS) para raiz-platform**: Tracking 3795 erros sem budget enforcement. Definir budget e bloquear PRs que aumentem. | raiz-platform | M | Previne regressao de qualidade |
| 7 | **Sentry release tracking para raiz-platform**: Plataforma usa Sentry (SDK instalado) mas nao cria releases em deploys. Sourcemaps nao sao associados. | raiz-platform | M | Debugging em producao |
| 8 | **AI code review para rAIz-AI-Prof**: Copiar `ai-code-review.yml` do raiz-platform. Requer secret `ANTHROPIC_API_KEY`. | rAIz-AI-Prof | S | Review automatizado em PRs |
| 9 | **Preview deploy controlado para raiz-platform**: Criar workflow similar ao `preview-deploy.yml` do rAIz-AI-Prof com quality gates antes do deploy. | raiz-platform | M | Controle de qualidade em previews |
| 10 | **Cache strategy otimizada para raiz-platform**: Adotar pattern de job `install` compartilhado com cache de node_modules. | raiz-platform | M | Reducao de tempo de CI |

### P2 — Medio (implementar no proximo mes)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| 11 | **PR checks para raiz-platform**: PR title validation, size check, auto-labeling. Copiar `pr-checks.yml` do rAIz-AI-Prof. | raiz-platform | S | Qualidade de PRs |
| 12 | **Commitlint para raiz-platform**: Adicionar commitlint hook + config. | raiz-platform | S | Historico git consistente |
| 13 | **Pre-push hook para raiz-platform**: Adicionar typecheck no pre-push. | raiz-platform | S | Catch early antes do CI |
| 14 | **TypeScript debt tracking automatizado para raiz-platform**: Copiar `typescript-debt.yml` do rAIz-AI-Prof. | raiz-platform | S | Tracking de progresso |
| 15 | **DORA metrics para rAIz-AI-Prof**: Copiar `dora-metrics.yml` do raiz-platform. | rAIz-AI-Prof | S | Visibilidade de engenharia |
| 16 | **Observability triage para rAIz-AI-Prof**: Copiar `observability-triage.yml` (simplificado, sem modulos). | rAIz-AI-Prof | M | Deteccao automatica de erros |
| 17 | **Lighthouse CI para raiz-platform**: Adaptar `lighthouse.yml` do rAIz-AI-Prof para Next.js. | raiz-platform | M | Performance monitoring |
| 18 | **OWASP ZAP para raiz-platform**: Adicionar scan OWASP ZAP na CI, similar ao rAIz-AI-Prof. | raiz-platform | M | Seguranca proativa |
| 19 | **Static asset caching para raiz-platform**: Adicionar headers de cache para `/_next/static/` no vercel.json. | raiz-platform | S | Performance de carregamento |
| 20 | **lint-staged strictness em rAIz-AI-Prof**: Reduzir max-warnings de 1000 para 500, depois 100. | rAIz-AI-Prof | S | Qualidade de codigo |

### P3 — Baixo (backlog)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| 21 | **Vercel region para rAIz-AI-Prof**: Adicionar `regions: ["gru1"]` no vercel.json. | rAIz-AI-Prof | S | Latencia para usuarios brasileiros |
| 22 | **Autofix workflow para raiz-platform**: Copiar conceito do `autofix-pr.yml` com TransformEngine. | raiz-platform | L | Automacao de correcoes em massa |
| 23 | **Function duration diferenciada em rAIz-AI-Prof**: Se algum endpoint LLM demorar, configurar maxDuration especifico. | rAIz-AI-Prof | S | Previne timeouts |
| 24 | **Accessibility audit para raiz-platform**: Adaptar `a11y.yml` do rAIz-AI-Prof. | raiz-platform | M | Acessibilidade |
| 25 | **Barrel exports validation para raiz-platform**: Adicionar script + CI job similar ao rAIz-AI-Prof. | raiz-platform | M | Previne erros de import |

---

## 5. Analise Detalhada por Dimensao

### 5.1 GitHub Actions — Arquitetura de Pipeline

**raiz-platform**: Pipeline flat — todos os jobs rodam em paralelo sem dependencias (exceto E2E que depende de build). Isso e rapido mas nao permite branch protection com job agregador.

```
push/PR
  ├── lint
  ├── build & performance
  ├── security-audit
  ├── test
  ├── typecheck
  ├── test-e2e (needs: build)
  └── error-budget-check (only master push)
```

**rAIz-AI-Prof**: Pipeline com dependencias — job `install` compartilhado, jobs de verificacao dependem dele, jobs finais (security-scan, e2e) dependem de build. Job agregador `all-checks` no final.

```
push/PR
  └── install
       ├── typecheck
       ├── lint
       ├── validate-exports
       ├── test
       ├── build
       │    ├── security-scan (OWASP)
       │    └── e2e
       ├── dependency-check
       └── i18n-check
            └── all-checks (needs: todos)
```

**Veredicto**: rAIz-AI-Prof tem arquitetura melhor com cache compartilhado e gate final. raiz-platform precisa adotar esse pattern.

### 5.2 Quality Gates — Profundidade

**raiz-platform** tem quality gates implicitos: se lint, build, test ou typecheck falharem no CI, o desenvolvedor ve o check vermelho. Mas nao ha enforcement via branch protection (nao ha job agregador).

**rAIz-AI-Prof** tem quality gates explicitos em 3 camadas:
1. **Pre-commit**: lint-staged + validate-exports
2. **Pre-push**: validate-exports + typecheck
3. **CI**: 10 jobs com gate final (`all-checks`)

Alem disso, rAIz-AI-Prof tem workflow dedicado `quality-gates.yml` com:
- TypeScript error budget (max 1200, meta: 500 -> 100 -> 0)
- ESLint error budget (max 9000, meta: 5000 -> 1000 -> 0)
- File size check (max 2000 linhas)
- npm audit (high/critical = fail)

**Veredicto**: rAIz-AI-Prof significativamente mais robusto. raiz-platform precisa de quality gates formais.

### 5.3 Vercel Deployment — Controle

**raiz-platform** depende do Vercel Git Integration para deploys automaticos. Isso significa:
- Qualquer push para main = deploy imediato para producao
- Nao ha gate entre CI e deploy
- Se CI falha mas push ja foi feito, Vercel deploya mesmo assim
- Preview deploys sao automaticos para PRs (sem quality gate)

**rAIz-AI-Prof** tem controle explicito:
- Deploy de producao via GitHub Actions (`deploy.yml`): build-and-test deve passar
- Preview deploy via GitHub Actions (`preview-deploy.yml`): quality-check (typecheck + lint + test) deve passar
- Sentry release criado em cada deploy
- Notification de deploy

**Veredicto**: rAIz-AI-Prof tem deployment pipeline muito mais controlado. raiz-platform tem risco real de deploy de codigo quebrado.

### 5.4 Cron Jobs — Complexidade

**raiz-platform** tem 16 cron jobs cobrindo:
- **Processamento de dados**: RAG queue (5min), background-jobs (1min), warmup (5min)
- **Integracao externa**: ads-sync, social-media (4 crons), whatsapp
- **Negocios**: CLM (3 crons), litigation
- **Manutencao**: cleanup (2 crons), refresh-usage-views, observability-triage

Custo estimado de invocacoes Vercel: ~26.000/mes (muitos crons de alta frequencia).

**rAIz-AI-Prof** tem 1 cron job:
- `reports/cron` (horario): Geracao de relatorios

A diferenca e justificada pela natureza dos projetos: raiz-platform e uma plataforma enterprise com muitas integracoes, enquanto rAIz-AI-Prof e uma aplicacao frontend com backend leve.

### 5.5 Security Headers — Comparacao Direta

| Header | raiz-platform | rAIz-AI-Prof |
|--------|--------------|--------------|
| `Cache-Control` (API) | `no-store, max-age=0` | `no-store, no-cache, must-revalidate` |
| `X-Frame-Options` | **AUSENTE** | `DENY` |
| `X-Content-Type-Options` | **AUSENTE** | `nosniff` |
| `Referrer-Policy` | **AUSENTE** | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | **AUSENTE** | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Content-Security-Policy` | **AUSENTE** | Completo (default-src, script-src, etc.) |
| `Strict-Transport-Security` | **AUSENTE** | `max-age=31536000; includeSubDomains; preload` |
| `X-XSS-Protection` | **AUSENTE** | `1; mode=block` |
| Static asset caching | **AUSENTE** | `public, max-age=31536000, immutable` |

**CRITICO**: raiz-platform (plataforma enterprise com dados sensiveis) tem ZERO security headers alem de cache-control. Isso e uma vulnerabilidade severa.

### 5.6 DORA Metrics

**raiz-platform** tem inicio de tracking com `dora-metrics.yml`:
- Deployment Frequency: medido via git log (merges em master/semana)
- Lead Time: parcial (lista ultimos 10 merges)
- Change Failure Rate: placeholder (depende de Sentry)
- Time to Restore: placeholder (depende de Grafana)

**rAIz-AI-Prof** nao tem nenhum tracking DORA.

Ambos os projetos estao longe de um tracking DORA maduro. Seria necessario:
1. Integrar com Sentry para correlacionar deploys e erros
2. Integrar com Grafana para medir uptime
3. Calcular lead time real (primeiro commit -> merge -> deploy)

### 5.7 Build Caching

**raiz-platform**:
- `actions/setup-node` com cache: npm (package-lock based)
- Cada job faz `npm ci` independente
- Build nao e cacheado entre jobs
- E2E instala Playwright browsers em cada run

**rAIz-AI-Prof**:
- Job `install` com `actions/cache` para node_modules inteiro
- Cache key inclui Node version + package-lock hash
- Jobs subsequentes restauram cache via `actions/cache` + fallback `npm ci --prefer-offline`
- Build artifact compartilhado via `upload-artifact` / `download-artifact`

**Veredicto**: rAIz-AI-Prof economiza ~2-3 minutos de CI por run com cache strategy melhor.

---

## 6. Padroes Reutilizaveis

### 6.1 De rAIz-AI-Prof para raiz-platform

1. **Job `install` compartilhado**: Cache de node_modules inteiro com key baseada em Node version + package-lock hash
2. **Job `all-checks` agregador**: Pattern if-always com verificacao explicita de cada job
3. **Quality Gates workflow**: Error budget para TS/ESLint com threshold decrescente
4. **PR Checks workflow**: Semantic PR title + size check + auto-labeling
5. **Preview deploy controlado**: Quality gate antes de deploy preview
6. **Security headers completos**: Copiar bloco de headers do vercel.json
7. **Commitlint + pre-push hooks**: Conventional commits + typecheck pre-push
8. **TypeScript debt tracking**: Workflow semanal com progress tracking

### 6.2 De raiz-platform para rAIz-AI-Prof

1. **AI code review**: Workflow com Claude Haiku para review automatizado de PRs
2. **AI security review**: Review de seguranca com foco em OWASP Top 10
3. **DORA metrics**: Workflow semanal para medir deployment frequency
4. **Observability triage**: Coleta automatica de sinais Sentry/Grafana
5. **Vercel region**: Especificar `gru1` para latencia brasileira

### 6.3 Template Compartilhado — CI Ideal

```yaml
# Estrutura ideal para ambos projetos
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  install:          # Cache compartilhado
  typecheck:        # needs: install
  lint:             # needs: install
  test:             # needs: install
  build:            # needs: install
  security-scan:    # needs: build
  e2e:              # needs: build
  lighthouse:       # needs: build (se web)
  a11y:             # needs: build (se web)
  ai-review:        # independente
  all-checks:       # needs: todos (gate final)
```

---

## 7. Recomendacoes Concretas com Caminhos

### 7.1 Acao Imediata: Security Headers para raiz-platform

**Arquivo**: `D:/GitHub/raiz-platform/vercel.json`

Adicionar bloco de headers similar ao rAIz-AI-Prof (`D:/GitHub/rAIz-AI-Prof/vercel.json` linhas 39-111), adaptado para Next.js:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, max-age=0" }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 7.2 Acao Imediata: Job all-checks para raiz-platform

**Arquivo**: `D:/GitHub/raiz-platform/.github/workflows/ci.yml`

Adicionar job no final:

```yaml
all-checks:
  name: All Checks Passed
  runs-on: ubuntu-latest
  needs: [lint, build, security-audit, test, typecheck, test-e2e]
  if: always()
  steps:
    - name: Verify all checks
      run: |
        for job in lint build security-audit test typecheck test-e2e; do
          STATUS="${{ needs[job].result }}"
          if [[ "$STATUS" != "success" ]]; then
            echo "::error::Job $job failed with status: $STATUS"
            exit 1
          fi
        done
        echo "All CI checks passed!"
```

### 7.3 Acao Imediata: Fix Node version em rAIz-AI-Prof deploy

**Arquivo**: `D:/GitHub/rAIz-AI-Prof/.github/workflows/deploy.yml` (linha 10)

Alterar de `NODE_VERSION: '18'` para `NODE_VERSION: '20'`.

### 7.4 CodeQL para raiz-platform

**Novo arquivo**: `D:/GitHub/raiz-platform/.github/workflows/codeql.yml`

Copiar de `D:/GitHub/rAIz-AI-Prof/.github/workflows/codeql.yml` sem alteracoes (workflow generico para JavaScript/TypeScript).

### 7.5 AI Code Review para rAIz-AI-Prof

**Novo arquivo**: `D:/GitHub/rAIz-AI-Prof/.github/workflows/ai-code-review.yml`

Copiar de `D:/GitHub/raiz-platform/.github/workflows/ai-code-review.yml`, ajustando a descricao do projeto no prompt de "Next.js 14" para "Vite 7 React 19".

---

## 8. Matriz de Maturidade CI/CD

| Dimensao | raiz-platform | rAIz-AI-Prof | Ideal |
|----------|:---:|:---:|:---:|
| **Lint em CI** | 8/10 | 9/10 | 10/10 |
| **TypeCheck em CI** | 7/10 | 9/10 | 10/10 |
| **Testes em CI** | 8/10 | 9/10 | 10/10 |
| **E2E em CI** | 7/10 | 8/10 | 10/10 |
| **Security (SAST)** | 3/10 | 8/10 | 10/10 |
| **Security headers** | 2/10 | 9/10 | 10/10 |
| **AI code review** | 8/10 | 0/10 | 10/10 |
| **Quality gates formais** | 3/10 | 8/10 | 10/10 |
| **Deploy pipeline** | 4/10 | 8/10 | 10/10 |
| **Preview deploys** | 5/10 | 9/10 | 10/10 |
| **DORA metrics** | 3/10 | 0/10 | 10/10 |
| **Observability** | 7/10 | 2/10 | 10/10 |
| **Cron jobs** | 8/10 | 5/10 | 10/10 |
| **Build caching** | 5/10 | 8/10 | 10/10 |
| **Git hooks** | 5/10 | 9/10 | 10/10 |
| **Accessibility CI** | 0/10 | 8/10 | 10/10 |
| **Performance CI** | 6/10 | 8/10 | 10/10 |
| **Branch protection** | 3/10 | 7/10 | 10/10 |
| **MEDIA** | **5.1/10** | **6.9/10** | **10/10** |

---

## 9. Riscos Atuais

| Risco | Projeto | Probabilidade | Impacto | Mitigacao |
|-------|---------|:---:|:---:|-----------|
| Deploy de codigo quebrado para producao | raiz-platform | Alta | Critico | P0-1: Quality gate pre-deploy |
| XSS/Clickjacking por falta de headers | raiz-platform | Media | Alto | P0-2: Security headers |
| Regressao de qualidade TS sem deteccao | raiz-platform | Alta | Medio | P1-6: Error budget |
| Deploy com sourcemaps nao associados | raiz-platform | Certa | Medio | P1-7: Sentry release |
| Runtime inconsistency (Node 18 vs 20) | rAIz-AI-Prof | Media | Medio | P0-4: Fix Node version |
| Vulnerabilidades nao detectadas | raiz-platform | Media | Alto | P1-5: CodeQL |
| CI lento por cache subotimo | raiz-platform | Certa | Baixo | P1-10: Cache strategy |

---

## 10. Conclusao

Os dois projetos tem perfis CI/CD complementares:

- **raiz-platform** se destaca em: AI-powered reviews (unico no mercado), observability triage, DORA metrics (inicial), cron jobs robustos para operacoes de negocio.

- **rAIz-AI-Prof** se destaca em: Quality gates formais (error budget TS/ESLint), security scanning (CodeQL + OWASP ZAP), deploy pipeline controlado (quality gates pre-deploy), accessibility CI (pa11y + axe), build caching otimizado, git hooks completos (commitlint + pre-push).

A lacuna mais critica e a ausencia de security headers e quality gate pre-deploy em raiz-platform, uma plataforma enterprise que lida com dados sensiveis. Estas devem ser endereçadas imediatamente (P0).

A oportunidade de maior valor e a convergencia: copiar AI code review para rAIz-AI-Prof e copiar quality gates formais + CodeQL + security headers para raiz-platform criaria duas pipelines de classe enterprise.

**Score geral de maturidade CI/CD**:
- raiz-platform: **5.1/10** (bom em areas especializadas, fraco em fundamentals)
- rAIz-AI-Prof: **6.9/10** (solido em fundamentals, falta especializacao)
- Target: **8.5/10** (atingivel com P0+P1 implementados em ambos)
