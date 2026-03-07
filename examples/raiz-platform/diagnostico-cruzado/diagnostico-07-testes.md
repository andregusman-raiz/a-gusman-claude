# D07 — Diagnostico Cruzado: Testes e Quality Assurance

> Comparacao detalhada das estrategias de testes e qualidade entre **raiz-platform** e **rAIz-AI-Prof**.
> Data: 2026-03-01

---

## Indice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Comparacao Lado a Lado](#2-comparacao-lado-a-lado)
3. [Testes Unitarios](#3-testes-unitarios)
4. [Testes E2E (Playwright)](#4-testes-e2e-playwright)
5. [Testes de Componentes (Storybook)](#5-testes-de-componentes-storybook)
6. [Acessibilidade](#6-acessibilidade)
7. [Testes de IA/Prompts](#7-testes-de-iaprompts)
8. [Regressao Visual](#8-regressao-visual)
9. [Testes de Carga e Performance](#9-testes-de-carga-e-performance)
10. [Contagem de Arquivos de Teste](#10-contagem-de-arquivos-de-teste)
11. [Utilitarios de Teste](#11-utilitarios-de-teste)
12. [Integracao CI/CD](#12-integracao-cicd)
13. [Gaps Identificados](#13-gaps-identificados)
14. [Oportunidades Priorizadas](#14-oportunidades-priorizadas)
15. [Padroes Reutilizaveis](#15-padroes-reutilizaveis)

---

## 1. Resumo Executivo

Ambos os projetos possuem infraestrutura de testes madura, mas com filosofias e ferramentas distintas. O **raiz-platform** investe pesado em E2E por modulo (237 specs, 24 projetos Playwright) e testes de IA (promptfoo), enquanto o **rAIz-AI-Prof** tem uma abordagem mais diversificada com Storybook (19 stories), acessibilidade dedicada (pa11y + axe-core em CI), Page Object Pattern nos E2E, e testes multi-browser/mobile incluidos.

| Metrica | raiz-platform | rAIz-AI-Prof |
|---------|---------------|--------------|
| Arquivos de teste total | ~1.185 | ~424 |
| Unit tests (src/) | ~946 | ~395 (test/ + colocados) |
| E2E tests | ~237 specs | ~29 e2e tests |
| Storybook stories | 0 | 19 |
| Coverage threshold | 50-60% | 50-60% |
| Browsers em CI | Chromium only | Chromium only (config: 5 browsers) |
| Testes de IA | promptfoo (15 cenarios) | Nenhum |
| Testes de acessibilidade | jest-axe (dependencia) | pa11y + axe-core + Playwright a11y |
| Testes de seguranca | AI security review em PRs | RLS + cross-tenant tests |
| Visual regression | Nenhum | Chromatic (configurado) |

---

## 2. Comparacao Lado a Lado

### Framework de Testes Unitarios

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|---------------|--------------|
| **Framework** | Jest 30 | Vitest 4 |
| **Transformer** | @swc/jest (20-50x mais rapido) | Vite nativo (via @vitejs/plugin-react) |
| **Ambiente** | jest-environment-jsdom | jsdom (via vitest) |
| **Globals** | Nao (import explicito) | Sim (describe/it sem import) |
| **Coverage provider** | Jest built-in (Babel) | v8 |
| **Coverage reporters** | Default | text, json, html |
| **Config location** | `jest.config.js` (raiz) | `vitest.config.ts` (raiz) |
| **Setup file** | `jest.setup.js` | `test/setup.ts` |
| **Path alias** | `@/` -> `src/` | `@/` -> raiz do projeto |
| **Timeout** | 10s (global) | 10s |
| **Max workers** | 50% | Default Vitest (pool threads) |

### Thresholds de Coverage

| Metrica | raiz-platform | rAIz-AI-Prof |
|---------|---------------|--------------|
| **Lines** | 60% | 60% |
| **Functions** | 60% | 60% |
| **Branches** | 50% | 50% |
| **Statements** | 60% | 60% |

Os thresholds sao identicos entre os projetos — forte indicacao de padrao compartilhado.

### Exclusoes de Coverage

| raiz-platform | rAIz-AI-Prof |
|---------------|--------------|
| `src/**/*.d.ts` | `**/*.d.ts` |
| `src/**/index.ts` (barrels) | `**/*.config.*` |
| `src/app/api/**/*.ts` (API routes) | `**/mockData/**` |
| — | `**/*.test.{ts,tsx}` / `**/*.spec.{ts,tsx}` |

---

## 3. Testes Unitarios

### raiz-platform (Jest 30)

**Configuracao**: `D:\GitHub\raiz-platform\jest.config.js`

- Usa **@swc/jest** como transformer (compilacao 20-50x mais rapida que ts-jest)
- Transform ignore patterns para ESM: `uncrypto`, `@upstash/redis`, `nuqs`
- Mocks globais configurados em `jest.setup.js`:
  - `@testing-library/jest-dom` para matchers DOM
  - `whatwg-fetch` polyfill
  - `Response.json` polyfill
  - Mock de `uncrypto` (modulo ESM)
  - Mock de `@/lib/cache/redis` (server-only)
  - Mock de `next/navigation` (useRouter, usePathname, useSearchParams)
  - Mock de `window.matchMedia`, `IntersectionObserver`, `ResizeObserver`
- Supressao seletiva de console.error (ReactDOM.render warning)
- **946 arquivos de teste** no diretorio `src/`

**Subprojeto CLI**: `D:\GitHub\raiz-platform\packages\cli\jest.config.js`
- Usa **ts-jest** com ESM
- Ambiente Node (nao JSDOM)
- Tests em `src/__tests__/`

### rAIz-AI-Prof (Vitest 4)

**Configuracao**: `D:\GitHub\rAIz-AI-Prof\vitest.config.ts`

- Plugin React integrado via `@vitejs/plugin-react`
- Setup file: `test/setup.ts`
- Coverage via **v8** provider
- Exclusoes explicitas: `test/e2e/**`, `test/supabase/**`
- Reporters: default
- **~395 arquivos de teste** (58 em `test/` + ~337 colocados no codigo-fonte)

**Organizacao de testes em `test/`**:
- `test/components/` — testes de componentes (presentation, questoes, schoolPlanning)
- `test/domain/` — testes por dominio DDD (auth, bncc, export, games, lessonPlan, organizations, pei, plugins, presentation, questoes, schoolPlanning, settings)
- `test/hooks/` — testes de hooks customizados
- `test/integration/` — 7 testes de integracao (exam-generation, generator_plugins, lesson-plan, llm-service, omr-processing, pei-workflow, question-creation)
- `test/taxonomy/` — testes de taxonomia
- `test/mathroots/` — testes matematicos
- `test/plugins/` — testes de plugins

---

## 4. Testes E2E (Playwright)

### raiz-platform

**Configuracao**: `D:\GitHub\raiz-platform\playwright.config.ts`

| Aspecto | Valor |
|---------|-------|
| **Versao** | Playwright 1.57 |
| **Test dir** | `./tests/e2e` |
| **Projetos** | 24 projetos especializados por modulo |
| **Browser** | Chromium only (mobile comentado) |
| **Parallel** | Sim (local), CI: 1 worker |
| **Retries** | CI: 2, local: 0 |
| **Global timeout** | 90s |
| **Expect timeout** | 5s |
| **Reporters** | HTML + list + github (CI) |
| **Traces** | on-first-retry |
| **Screenshots** | only-on-failure |
| **Video** | on-first-retry |
| **WebServer** | `npm run dev` (skip se URL remota) |
| **Auth** | Supabase magic link/OTP via admin API |
| **Auth fallback** | Cookie `e2e-bypass` |
| **Specs totais** | ~237 arquivos |

**Projetos Playwright (24)**:
1. `setup` — autenticacao
2. `chromium` — browser principal
3. `content-studio-e2e` (timeout 180s)
4. `raiztalks-e2e` (timeout 90s)
5. `raiztalks-real-e2e` (timeout 120s, sequential, APIs reais)
6. `totvs-sql-e2e` (timeout 120s)
7. `reports-e2e` + `reports-real-e2e`
8. `social-media-e2e`
9. `contencioso-e2e`
10. `analises-e2e`
11. `dpos-e2e`
12. `hubspot-e2e`
13. `automations-e2e`
14. `vibecoding-e2e`
15. `inbox-e2e`
16. `google-e2e`
17. `rag-e2e`
18. `admin-e2e`
19. `clm-e2e`
20. `settings-e2e`
21. `auth-e2e` (sem storageState pre-existente)
22. `agents-e2e`
23. `chat-e2e` (timeout 120s)
24. `bi-e2e` (timeout 180s)
25. `registry-e2e`

**Diretorio shared**: `tests/e2e/shared/`
- `api-mocks.ts` — mocks de API
- `auth-mocks.ts` — mocks de autenticacao
- `dual-context.ts` — contexto dual
- `error-mocks.ts` — mocks de erro
- `test-utils.ts` — utilitarios compartilhados

### rAIz-AI-Prof

**Configuracao**: `D:\GitHub\rAIz-AI-Prof\playwright.config.ts`

| Aspecto | Valor |
|---------|-------|
| **Versao** | Playwright 1.57 |
| **Test dir** | `./test/e2e` |
| **Pattern** | `**/*.e2e.test.ts` |
| **Projetos** | 6 (setup + 3 browsers + 2 mobile) |
| **Browsers** | Chromium, Firefox, WebKit |
| **Mobile** | Pixel 5, iPhone 12 |
| **Parallel** | Sim (local), CI: 1 worker |
| **Retries** | CI: 2, local: 0 |
| **Global timeout** | 60s |
| **Navigation timeout** | 30s |
| **Reporters** | HTML + list |
| **Traces** | on-first-retry |
| **Screenshots** | only-on-failure |
| **Video** | on-first-retry |
| **WebServer** | `npm run dev` (porta 3008) |
| **Auth** | SignInWithPassword + signUp fallback |
| **E2E tests** | ~29 arquivos |

**Projetos Playwright (6)**:
1. `setup` — auth-setup via signInWithPassword
2. `chromium`
3. `firefox` (retry: 1)
4. `webkit` (retry: 1)
5. `Mobile Chrome` (Pixel 5)
6. `Mobile Safari` (iPhone 12)

**Page Object Pattern**: `test/e2e/page-objects/` (21 page objects)
- `LoginPage`, `QuestoesPage`, `LessonPlanPage`, `GameHubPage`, `ExportPage`, etc.

**Fixtures customizados**: `test/e2e/fixtures/`
- `auth-setup.ts`, `auth.ts`, `base.ts`, `database.ts`, `database.seed.ts`, `export.ts`, `questoes.ts`, `setup-test-users.ts`, `index.ts`

**Testes E2E por feature** (29 arquivos):
- `accessibility.e2e.test.ts` — a11y dedicado
- `app.e2e.test.ts`, `auth.e2e.test.ts`, `navigation.e2e.test.ts`
- `questoes.e2e.test.ts`, `lesson-plan.e2e.test.ts`, `presentations.e2e.test.ts`
- `games.e2e.test.ts`, `olimpiadas.e2e.test.ts`, `mind-maps.e2e.test.ts`
- `essay-correction.e2e.test.ts`, `essay-prompt.e2e.test.ts`
- `exam-adaptation.e2e.test.ts`, `export.e2e.test.ts`, `omr.e2e.test.ts`
- `pei.e2e.test.ts`, `pei-full.e2e.test.ts`, `school-planning.e2e.test.ts`
- `esl.e2e.test.ts`, `session-assessment.e2e.test.ts`, `settings.e2e.test.ts`
- `specialists-chat.e2e.test.ts`, `student-home.e2e.test.ts`, `support.e2e.test.ts`
- `wizard-flows.e2e.test.ts`, `llm-generation.e2e.test.ts`
- `mobile-responsive.e2e.test.ts`, `performance.e2e.test.ts`, `resilience.e2e.test.ts`

### Comparacao de Auth E2E

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|---------------|--------------|
| **Metodo** | Admin API magic link + OTP | signInWithPassword + signUp |
| **Service role key** | Sim (admin) | Nao (anon key) |
| **Fallback** | Cookie `e2e-bypass` | Empty storage state |
| **Cookie chunking** | Sim (>3500 bytes split) | Via helper `injectAuthSession` |
| **Post-setup verify** | Navega para /reports | Navega para / + verifica nao /login |
| **Locale setup** | Nao | Sim (pt-BR + dismiss tours) |

---

## 5. Testes de Componentes (Storybook)

### raiz-platform

**Status**: Nao possui Storybook configurado.

Nenhum arquivo `.stories.tsx` encontrado. Componentes sao testados apenas via Jest (unit) e Playwright (E2E). Nao ha catalogo visual de componentes.

### rAIz-AI-Prof

**Status**: Storybook 10 configurado com Chromatic.

**Configuracao**: `D:\GitHub\rAIz-AI-Prof\.storybook\main.ts`
- Framework: `@storybook/react-vite`
- Addons: `@storybook/addon-onboarding`, `@storybook/addon-docs`, `@chromatic-com/storybook`, `@storybook/addon-a11y`
- Stories em: `stories/` e `components/`
- Autodocs: `"tag"`

**Preview** (`D:\GitHub\rAIz-AI-Prof\.storybook\preview.tsx`):
- Decorators: WithTheme (dark mode), WithI18n (react-i18next), WithToast
- Toolbar controls: Theme (light/dark), Locale (pt-BR + linguas suportadas)
- Viewports: Mobile (375px), Tablet (768px), Laptop (1366px), Desktop (1920px)
- Tailwind CSS importado

**19 Stories**:
- Form controls: AccessibleInput, AccessibleSelect, AccessibleTextarea, Checkbox, Switch
- Feedback: Alert, Badge, Toast, Tooltip
- Layout: Card, PageContainer, PageHeader, SelectionCard
- Actions: Button, ConfirmModal, StepFooter
- Loading: GenerationSkeleton, SkeletonLoader, EmptyState

---

## 6. Acessibilidade

### raiz-platform

| Aspecto | Status |
|---------|--------|
| **jest-axe** | Instalado (`@types/jest-axe` + `jest-axe` v10) |
| **pa11y** | Nao configurado |
| **axe-core Playwright** | Nao configurado |
| **CI workflow dedicado** | Nao |
| **WCAG standard** | N/A |

A dependencia `jest-axe` esta instalada mas nao foi encontrado uso sistematico nos testes unitarios. Nao ha workflow de CI dedicado a acessibilidade.

### rAIz-AI-Prof

| Aspecto | Status |
|---------|--------|
| **@axe-core/playwright** | v4.11 — usado em `accessibility.e2e.test.ts` |
| **@axe-core/cli** | v4.8 — usado em CI (lighthouse.yml) |
| **pa11y** | v9.0.1 — configurado com `.pa11yci.json` |
| **jest-axe** | Nao (usa axe-core diretamente) |
| **CI workflows** | 2: `a11y.yml` (pa11y-ci + axe-playwright) + `lighthouse.yml` (axe-core/cli) |
| **Storybook addon** | `@storybook/addon-a11y` |
| **WCAG standard** | WCAG 2.1 AA |

**Configuracao pa11y** (`D:\GitHub\rAIz-AI-Prof\.pa11yci.json`):
- Standard: WCAG2AA
- Runners: axe + htmlcs
- 8 URLs cobertas: home, questoes/criar, questoes/banco, pei, apresentacoes, plano-aula, escola, dashboard
- Screen captures para cada URL

**E2E a11y tests** (`test/e2e/accessibility.e2e.test.ts`):
- Login page WCAG 2.1 AA (contexto nao autenticado)
- Home page critical/serious violations com AxeBuilder
- Heading structure validation
- Form label validation (label[for], aria-label, aria-labelledby)
- Keyboard navigation (20 tabs com verificacao de visibilidade)
- Alt text em imagens
- Color contrast (excludes tech debt conhecida)

**CI a11y workflow** (`a11y.yml`):
- Job 1: pa11y-ci com config `.pa11yci.json`
- Job 2: axe-core via Playwright com tag `@a11y`
- Comentario automatico no PR com resultados
- Artifacts: `a11y-reports/` + `playwright-a11y-report/`

---

## 7. Testes de IA/Prompts

### raiz-platform

**Status**: promptfoo configurado com 15 cenarios de teste.

**Configuracao**: `D:\GitHub\raiz-platform\promptfoo\promptfooconfig.yaml`
- Provider: `openai:gpt-4o-mini` (temperature: 0)
- Prompts: `jarvis-chat.txt`, `whatsapp.txt`
- **npm script**: `npm run test:prompts`

**Categorias de testes (15 cenarios)**:
1. **Safety (3)**: recusa API keys, recusa SQL injection, recusa PII
2. **Persona (2)**: responde em portugues, tom profissional
3. **Capabilities (2)**: conhece funcionalidades, admite limitacoes
4. **Quality (2)**: respostas concisas, lida com ambiguidade
5. **LGPD (2)**: direito ao esquecimento, transparencia de dados
6. **Injection (3)**: ignora instrucoes injetadas, recusa role override, recusa exfiltracao de system prompt

**Assertions usadas**: `llm-rubric`, `not-contains`, `type-contains`

### rAIz-AI-Prof

**Status**: Nenhum teste de IA/prompts configurado.

O projeto usa Multi-LLM (Gemini, GPT, Claude) via `domain/llm_providers/`, mas nao ha testes automatizados para validar outputs, safety ou qualidade dos prompts.

---

## 8. Regressao Visual

### raiz-platform

**Status**: Nao possui ferramenta de regressao visual.

### rAIz-AI-Prof

**Status**: Chromatic configurado via addon do Storybook.

- Dependencia: `@chromatic-com/storybook` v4.1.3
- Integrado como addon do Storybook em `.storybook/main.ts`
- Nota: Nao foi encontrado workflow CI dedicado ao Chromatic (provavelmente executa localmente ou via Chromatic Cloud manual)

---

## 9. Testes de Carga e Performance

### raiz-platform

| Aspecto | Status |
|---------|--------|
| **Diretorio** | `tests/performance/` |
| **Arquivos** | 2: `presentation.perf.ts`, `rag-search.benchmark.ts` |
| **npm script** | `test:stress` (Jest --runInBand) |
| **Load testing tool** | Nenhum (K6, Artillery, etc.) |

### rAIz-AI-Prof

| Aspecto | Status |
|---------|--------|
| **Diretorio** | `test/load/` (existe mas vazio, apenas `reports/`) |
| **E2E performance** | `test/e2e/performance.e2e.test.ts` |
| **E2E resilience** | `test/e2e/resilience.e2e.test.ts` |
| **Lighthouse CI** | Sim — `lighthouse.yml` (performance >= 80, a11y >= 90) |
| **Load testing tool** | Nenhum |

O rAIz-AI-Prof tem uma abordagem mais madura com Lighthouse CI validando performance (>= 80), acessibilidade (>= 90), best practices (>= 80) e SEO (>= 80) em cada PR.

---

## 10. Contagem de Arquivos de Teste

### raiz-platform

| Categoria | Quantidade | Local |
|-----------|-----------|-------|
| Unit tests (src/) | ~946 | Colocados em `src/` (pattern `*.test.ts(x)`) |
| E2E tests | ~237 | `tests/e2e/` (24 subdiretorios por modulo) |
| Integration tests | 1 | `tests/integration/rag/` |
| Performance tests | 2 | `tests/performance/` |
| Promptfoo scenarios | 15 | `promptfoo/promptfooconfig.yaml` |
| **Total** | **~1.201** | |

### rAIz-AI-Prof

| Categoria | Quantidade | Local |
|-----------|-----------|-------|
| Unit/Component tests (colocados) | ~337 | Junto ao codigo-fonte |
| Unit/Component tests (test/) | ~58 | `test/{components,domain,hooks,taxonomy,mathroots,plugins}/` |
| E2E tests | 29 | `test/e2e/` |
| Integration tests | 7 | `test/integration/` |
| Security tests | 2 | `test/security/` |
| A11y tests | 1 | `test/a11y.test.tsx` |
| Storybook stories | 19 | `stories/` |
| Page objects | 21 | `test/e2e/page-objects/` |
| **Total** | **~474** | |

### Ratio teste/codigo

| Metrica | raiz-platform | rAIz-AI-Prof |
|---------|---------------|--------------|
| Arquivos de teste | ~1.201 | ~474 |
| Predominancia | E2E heavy (237 specs) | Unit heavy (395 unit tests) |

---

## 11. Utilitarios de Teste

### raiz-platform

| Utilitario | Arquivo |
|-----------|---------|
| Setup global Jest | `jest.setup.js` |
| Style mock | `src/__mocks__/styleMock.js` |
| File mock | `src/__mocks__/fileMock.js` |
| RAG fixtures | `tests/fixtures/rag.fixtures.ts` |
| RAG external mocks | `tests/mocks/rag-external.mocks.ts` |
| E2E API mocks | `tests/e2e/shared/api-mocks.ts` |
| E2E auth mocks | `tests/e2e/shared/auth-mocks.ts` |
| E2E error mocks | `tests/e2e/shared/error-mocks.ts` |
| E2E dual context | `tests/e2e/shared/dual-context.ts` |
| E2E test utils | `tests/e2e/shared/test-utils.ts` |
| E2E auth setup | `tests/e2e/auth.setup.ts` |

### rAIz-AI-Prof

| Utilitario | Arquivo |
|-----------|---------|
| Setup global Vitest | `test/setup.ts` |
| MSW browser mock | `test/mocks/browser.ts` |
| MSW server mock | `test/mocks/server.ts` |
| MSW handlers | `test/mocks/handlers.ts` |
| LLM mock | `test/mocks/llm.mock.ts` |
| Supabase mock | `test/mocks/supabase.mock.ts` |
| Fixtures index | `test/fixtures/index.ts` |
| E2E fixtures | `test/e2e/fixtures/` (8 arquivos: auth, database, export, questoes, etc.) |
| E2E page objects | `test/e2e/page-objects/` (21 classes) |
| E2E config | `test/e2e/config.ts` |
| Test utils | `test/utils.ts` |

**Destaque**: O rAIz-AI-Prof usa **MSW (Mock Service Worker)** para mocks de API (browser + server), o que permite interceptar requests tanto em testes de componente quanto em testes de integracao. O raiz-platform usa mocks mais tradicionais (jest.mock).

---

## 12. Integracao CI/CD

### raiz-platform — `ci.yml`

| Job | Descricao | Bloqueante |
|-----|-----------|-----------|
| `lint` | ESLint | Sim |
| `build` | Build + bundle size check (5MB limit) | Sim |
| `security-audit` | npm audit --audit-level=high | Nao (continue-on-error) |
| `test` | Jest CI (coverage + Codecov upload) | Sim |
| `typecheck` | `tsc --noEmit` | Sim |
| `test-e2e` | Playwright (Chromium only) | Sim |
| `error-budget-check` | Grafana error budget (placeholder) | Nao |

**Workflows adicionais**:
- `security-review.yml` — Claude Haiku 4.5 analisa diff de PR por OWASP Top 10, auth, data exposure, injection, secrets
- `ai-code-review.yml` — Claude Haiku 4.5 analisa logica, performance, type safety, error handling
- `typecheck.yml` — TypeScript check dedicado
- `dora-metrics.yml` — DORA metrics
- `observability-triage.yml` — Triage de observabilidade

### rAIz-AI-Prof — `ci.yml`

| Job | Descricao | Bloqueante |
|-----|-----------|-----------|
| `install` | Cache de dependencias | Sim |
| `typecheck` | Typecheck relaxado | Sim (continue-on-error) |
| `lint` | ESLint | Sim |
| `validate-exports` | Barrel file exports | Sim |
| `test` | Vitest (coverage + Codecov) | Sim |
| `build` | Build + bundle size (10MB limit) | Sim |
| `dependency-check` | npm audit --audit-level=high | Nao |
| `security-scan` | OWASP ZAP + security-audit.js | Nao |
| `e2e` | Playwright (Chromium only) | Sim |
| `i18n-check` | Validacao i18n (strict) | Sim |
| `all-checks` | Gate final | Sim |

**Workflows adicionais**:
- `quality-gates.yml` — TS error budget (max 1200), ESLint error budget (max 9000), file size (max 2000 linhas), npm audit
- `a11y.yml` — pa11y-ci + axe-playwright + comentario no PR
- `lighthouse.yml` — Lighthouse CI (perf >= 80, a11y >= 90) + axe-core/cli deep check
- `pr-checks.yml` — Semantic PR title, PR size check, auto-labeling
- `typescript-debt.yml` — Analise semanal de TS debt + criacao automatica de issue se progresso estagnou
- `codeql.yml` — CodeQL analysis
- `autofix-pr.yml` — Autofix em PRs
- `deploy.yml` + `preview-deploy.yml` — Deploy

### Comparacao CI

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|---------------|--------------|
| **Coverage upload** | Codecov | Codecov |
| **Coverage artifacts** | Nao | Sim (coverage/ dir) |
| **E2E artifacts** | HTML report + test-results | Playwright report |
| **Bundle size gate** | 5MB (hard fail) | 10MB (warning) |
| **Security** | AI review (Claude) + npm audit | OWASP ZAP + npm audit + CodeQL |
| **A11y CI** | Nao | Sim (pa11y + axe + Lighthouse) |
| **Performance CI** | Nao | Sim (Lighthouse CI) |
| **i18n CI** | Nao | Sim (validacao strict) |
| **TS debt tracking** | Nao | Sim (semanal, auto-issue) |
| **PR quality** | AI code review | Semantic title + size check + auto-label |
| **AI review** | Sim (security + code review) | Nao |
| **Error budget** | Placeholder (Grafana) | Nao |
| **Dependency cache** | npm cache | npm cache + node_modules cache |

---

## 13. Gaps Identificados

### Gaps no raiz-platform

| # | Gap | Impacto | Referencia rAIz |
|---|-----|---------|-----------------|
| G1 | Sem Storybook/catalogo visual | Dificil documentar e testar componentes isoladamente | Storybook 10 + 19 stories |
| G2 | Sem CI de acessibilidade | Regressoes de a11y nao detectadas | `a11y.yml` + `lighthouse.yml` |
| G3 | Sem Lighthouse CI | Sem gates de performance em PRs | Lighthouse CI com thresholds |
| G4 | Sem testes multi-browser | Nao testa Firefox/WebKit/mobile | 5 projetos Playwright |
| G5 | Sem Page Object Pattern nos E2E | Duplicacao de seletores entre specs | 21 page objects |
| G6 | Sem regressao visual | Mudancas de CSS nao detectadas | Chromatic |
| G7 | Sem validacao i18n em CI | Strings hardcoded nao detectadas | `i18n-check` job |
| G8 | Sem tracking de TS debt | Nao monitora evolucao | `typescript-debt.yml` semanal |
| G9 | Sem OWASP ZAP scan | Vulnerabilidades web nao testadas | Security scan com ZAP |
| G10 | Sem testes de integracao substantivos | 1 arquivo em `tests/integration/` | 7 testes de integracao |
| G11 | Sem MSW para mocking | Mocks mais frageis com jest.mock | MSW browser + server |
| G12 | Sem CodeQL | Analise estatica de seguranca limitada | `codeql.yml` |
| G13 | Sem testes de seguranca dedicados | Sem RLS/cross-tenant tests | 2 security tests |
| G14 | Sem PR quality gates | Sem semantic title, size check | `pr-checks.yml` |

### Gaps no rAIz-AI-Prof

| # | Gap | Impacto | Referencia raiz |
|---|-----|---------|-----------------|
| G15 | Sem testes de IA/prompts | Qualidade de LLM nao validada | promptfoo (15 cenarios) |
| G16 | Sem AI code review em PRs | Sem revisao automatica por IA | `security-review.yml` + `ai-code-review.yml` |
| G17 | Sem testes de carga | `test/load/` existe mas vazio | `tests/performance/` (2 benchmarks) |
| G18 | Sem workflow Chromatic em CI | Regressao visual nao automatizada | N/A |
| G19 | Typecheck em CI e continue-on-error | Nao bloqueia com erros de tipo | Hard fail em raiz |
| G20 | ESLint max-warnings=500 (vs 0) | Tolera 500 warnings | max-warnings=0 |
| G21 | Sem error budget/observability | Sem DORA metrics ou error budget | `dora-metrics.yml` |
| G22 | E2E com menos cobertura de modulos | 29 tests vs 237 specs | Cobertura E2E extensiva |
| G23 | Sem testes de stress | Nao testa limites do sistema | `test:stress` script |

---

## 14. Oportunidades Priorizadas

### P0 — Critico (implementar imediato)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| O1 | Adicionar promptfoo ao rAIz-AI-Prof | rAIz | M (4-8h) | Alto — LLM outputs sem validacao |
| O2 | Adicionar CI de acessibilidade ao raiz-platform | raiz | S (2-4h) | Alto — plataforma enterprise sem a11y gates |
| O3 | Tornar typecheck bloqueante no rAIz CI | rAIz | S (<1h) | Alto — erros de tipo passam despercebidos |

### P1 — Importante (proximo sprint)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| O4 | Page Object Pattern para E2E do raiz-platform | raiz | L (16h+) | Alto — manutenibilidade dos 237 specs |
| O5 | Adicionar testes multi-browser ao raiz-platform | raiz | S (2h) | Medio — detectar bugs browser-specific |
| O6 | Adicionar Lighthouse CI ao raiz-platform | raiz | S (2-4h) | Medio — performance gates em PRs |
| O7 | Adicionar AI code review ao rAIz-AI-Prof | rAIz | S (2h) | Medio — copiar workflow do raiz |
| O8 | Configurar Chromatic CI no rAIz-AI-Prof | rAIz | S (2h) | Medio — regressao visual automatizada |
| O9 | Adicionar testes de seguranca (RLS) ao raiz-platform | raiz | M (4-8h) | Alto — copiar padrao do rAIz |
| O10 | ESLint max-warnings=0 no rAIz-AI-Prof | rAIz | L (depende do debt) | Medio — qualidade de codigo |

### P2 — Desejavel (backlog)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| O11 | Storybook no raiz-platform | raiz | L (40h+) | Medio — documentacao de componentes |
| O12 | MSW no raiz-platform | raiz | M (8-16h) | Medio — mocks mais robustos |
| O13 | Tracking de TS debt no raiz-platform | raiz | S (2h) | Baixo — raiz ja tem 0 erros |
| O14 | Testes de integracao adicionais no raiz-platform | raiz | M (8h) | Medio — gap entre unit e E2E |
| O15 | OWASP ZAP no raiz-platform CI | raiz | M (4h) | Medio — seguranca web |
| O16 | PR quality gates no raiz-platform | raiz | S (1-2h) | Baixo — copiar `pr-checks.yml` |
| O17 | Error budget/DORA no rAIz-AI-Prof | rAIz | M (4-8h) | Baixo — observabilidade |

### P3 — Nice to Have (futuro)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| O18 | Load testing (K6/Artillery) em ambos | Ambos | L (16h) | Baixo — ainda sem necessidade |
| O19 | Regressao visual no raiz-platform | raiz | L (20h+) | Baixo — sem Storybook base |
| O20 | Mobile E2E no raiz-platform | raiz | S (2h) | Baixo — Pixel 5 + iPhone 12 |
| O21 | CodeQL no raiz-platform | raiz | S (1h) | Baixo — ja tem AI security review |
| O22 | Validacao i18n no raiz-platform CI | raiz | S (2h) | Baixo — depende de setup i18n |

---

## 15. Padroes Reutilizaveis

### 15.1 Auth Setup Pattern (bidirecional)

O raiz-platform tem um auth setup mais robusto (admin API + OTP + cookie chunking + e2e-bypass fallback) que pode beneficiar o rAIz-AI-Prof. Por outro lado, o rAIz-AI-Prof faz setup de locale + dismiss de tours que o raiz-platform nao faz.

**Padrao recomendado (merge de ambos)**:
```typescript
// 1. Auth: admin API com magic link (raiz) OU signInWithPassword (rAIz)
// 2. Cookie chunking para payloads grandes (raiz)
// 3. Locale setup + dismiss tours (rAIz)
// 4. Fallback graceful (ambos)
// 5. Post-setup verification (ambos)
```

### 15.2 Page Object Pattern (rAIz -> raiz)

O padrao de Page Objects do rAIz-AI-Prof pode ser replicado no raiz-platform para melhorar manutenibilidade dos 237 specs.

**Arquivos de referencia**:
- `D:\GitHub\rAIz-AI-Prof\test\e2e\page-objects\` (21 classes)
- Exemplo: `QuestoesPage.ts`, `LoginPage.ts`, `GameHubPage.ts`

### 15.3 MSW Mocking Pattern (rAIz -> raiz)

O rAIz-AI-Prof usa MSW para mocking consistente:
- `test/mocks/handlers.ts` — handlers centralizados
- `test/mocks/server.ts` — server para testes unitarios
- `test/mocks/browser.ts` — worker para testes no browser

Pode substituir os mocks manuais do raiz-platform (`jest.mock`) com interceptacao mais realista.

### 15.4 Promptfoo Pattern (raiz -> rAIz)

O padrao de teste de prompts do raiz-platform pode ser replicado:
- `promptfoo/promptfooconfig.yaml` como template
- Categorias: Safety, Persona, Capabilities, Quality, LGPD, Injection
- Provider: `openai:gpt-4o-mini` (barato para testes)
- Assertions: `llm-rubric` + `not-contains`

### 15.5 CI A11y Pattern (rAIz -> raiz)

Workflow de acessibilidade do rAIz-AI-Prof pode ser adaptado:
- Pa11y-ci com config JSON (URLs a testar)
- Axe-core via Playwright com tag `@a11y`
- Lighthouse CI com thresholds
- Comentario automatico no PR com resultados

### 15.6 Coverage Thresholds (compartilhado)

Ambos os projetos usam os mesmos thresholds (50-60%), confirmando um padrao organizacional. Manter consistencia entre projetos.

### 15.7 Security Review Pattern (raiz -> rAIz)

O workflow de security review do raiz-platform (`security-review.yml`) com Claude Haiku analisa:
- OWASP Top 10
- Auth issues
- Data exposure
- Injection
- Secrets

Pode ser copiado diretamente para o rAIz-AI-Prof (requer apenas `ANTHROPIC_API_KEY` secret).

### 15.8 E2E Test por Modulo (raiz -> rAIz)

O raiz-platform organiza E2E por modulo com projetos Playwright dedicados. Permite:
- Executar testes de um modulo especifico: `npx playwright test --project=chat-e2e`
- Timeouts customizados por modulo (90s-180s)
- Independencia de execucao

O rAIz-AI-Prof pode adotar este padrao conforme cresce.

---

## Anexo A — Arquivos de Configuracao Relevantes

### raiz-platform

| Arquivo | Caminho |
|---------|---------|
| Jest config | `D:\GitHub\raiz-platform\jest.config.js` |
| Jest setup | `D:\GitHub\raiz-platform\jest.setup.js` |
| Playwright config | `D:\GitHub\raiz-platform\playwright.config.ts` |
| Promptfoo config | `D:\GitHub\raiz-platform\promptfoo\promptfooconfig.yaml` |
| CI workflow | `D:\GitHub\raiz-platform\.github\workflows\ci.yml` |
| Security review | `D:\GitHub\raiz-platform\.github\workflows\security-review.yml` |
| AI code review | `D:\GitHub\raiz-platform\.github\workflows\ai-code-review.yml` |
| E2E auth setup | `D:\GitHub\raiz-platform\tests\e2e\auth.setup.ts` |
| E2E shared utils | `D:\GitHub\raiz-platform\tests\e2e\shared\` |

### rAIz-AI-Prof

| Arquivo | Caminho |
|---------|---------|
| Vitest config | `D:\GitHub\rAIz-AI-Prof\vitest.config.ts` |
| Playwright config | `D:\GitHub\rAIz-AI-Prof\playwright.config.ts` |
| Storybook main | `D:\GitHub\rAIz-AI-Prof\.storybook\main.ts` |
| Storybook preview | `D:\GitHub\rAIz-AI-Prof\.storybook\preview.tsx` |
| Pa11y config | `D:\GitHub\rAIz-AI-Prof\.pa11yci.json` |
| CI workflow | `D:\GitHub\rAIz-AI-Prof\.github\workflows\ci.yml` |
| A11y workflow | `D:\GitHub\rAIz-AI-Prof\.github\workflows\a11y.yml` |
| Lighthouse workflow | `D:\GitHub\rAIz-AI-Prof\.github\workflows\lighthouse.yml` |
| Quality gates | `D:\GitHub\rAIz-AI-Prof\.github\workflows\quality-gates.yml` |
| PR checks | `D:\GitHub\rAIz-AI-Prof\.github\workflows\pr-checks.yml` |
| TS debt tracking | `D:\GitHub\rAIz-AI-Prof\.github\workflows\typescript-debt.yml` |
| E2E auth setup | `D:\GitHub\rAIz-AI-Prof\test\e2e\fixtures\auth-setup.ts` |
| E2E page objects | `D:\GitHub\rAIz-AI-Prof\test\e2e\page-objects\` |
| MSW mocks | `D:\GitHub\rAIz-AI-Prof\test\mocks\` |
| A11y unit test | `D:\GitHub\rAIz-AI-Prof\test\a11y.test.tsx` |
| A11y E2E test | `D:\GitHub\rAIz-AI-Prof\test\e2e\accessibility.e2e.test.ts` |
| Security tests | `D:\GitHub\rAIz-AI-Prof\test\security\` |

---

## Anexo B — Diagrama de Maturidade

```
                      raiz-platform    rAIz-AI-Prof
                      ─────────────    ────────────
Unit Testing          ████████████░    ████████████░
                      (946 files)      (395 files)

E2E Testing           █████████████    ████████░░░░░
                      (237 specs)      (29 tests)

Component Testing     ░░░░░░░░░░░░░    ████████░░░░░
                      (nenhum)         (19 stories)

Accessibility         ██░░░░░░░░░░░    █████████████
                      (jest-axe only)  (pa11y+axe+CI)

AI/Prompt Testing     █████████████    ░░░░░░░░░░░░░
                      (promptfoo)      (nenhum)

Visual Regression     ░░░░░░░░░░░░░    ████████░░░░░
                      (nenhum)         (Chromatic)

Performance CI        ░░░░░░░░░░░░░    ██████████░░░
                      (nenhum)         (Lighthouse)

Security Testing      ████████░░░░░    ████████████░
                      (AI review)      (ZAP+CodeQL+RLS)

CI Sophistication     ████████░░░░░    █████████████
                      (6 jobs)         (10 jobs + 6 workflows)

Integration Tests     ██░░░░░░░░░░░    ████████░░░░░
                      (1 file)         (7 files)
```

---

*Documento gerado em 2026-03-01 via analise cruzada dos repositorios.*
