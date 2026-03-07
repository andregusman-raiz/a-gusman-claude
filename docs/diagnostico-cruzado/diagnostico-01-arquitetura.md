# D01 - Diagnostico Cruzado: Arquitetura & Estrutura de Projeto

> **Data**: 2026-03-01
> **Projetos**: raiz-platform (Next.js 14) vs rAIz-AI-Prof (Vite 7 + React 19)
> **Escopo**: Estrutura de projeto, DDD, modularidade, acoplamento, componentes, roteamento, fronteira server/client

---

## 1. Visao Geral Comparativa

| Dimensao | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Framework** | Next.js 14.2 (App Router, SSR) | Vite 7 + React 19 (SPA) |
| **React** | 18.2 | 19.2 |
| **TypeScript** | 5.7 (strict, config unico) | 5.9 (dual config: strict IDE + relaxed CI) |
| **Rendering** | SSR + SSG + ISR + CSR | CSR puro (SPA) |
| **State Management** | React Context (15+ contexts) + SWR/TanStack Query | Zustand (5 stores) + createModuleState (40+ state files) + TanStack Query |
| **Roteamento** | File-based (App Router) | Programatico (React Router DOM 7) |
| **API** | 794 route handlers em `src/app/api/` | 24 serverless functions em `api/` (Vercel) |
| **Design System** | QI (Quiet Intelligence) - 30 componentes `Qi*` | Radix UI primitives wrapeados em `components/UI/` |
| **Deploy** | Vercel (SSR/serverless) | Vercel (SPA + serverless functions) |
| **Banco** | Supabase + MSSQL (TOTVS) | Supabase + IndexedDB (offline-first) |
| **Testes** | Jest 30 + Playwright 1.57 (946 arquivos) | Vitest 4 + Playwright 1.57 (422 arquivos) |
| **Monitoramento** | Sentry + OpenTelemetry + PostHog | Sentry + Web Vitals |
| **i18n** | Nao implementado | react-i18next (completo) |
| **PWA** | Nao | Sim (vite-plugin-pwa + Workbox) |
| **Arquivos TS/TSX** | ~3.959 | ~5.897 |
| **Migrations Supabase** | 256 | 66 |

---

## 2. Estrutura de Diretorios

### 2.1 raiz-platform (Next.js App Router)

```
raiz-platform/
  src/
    app/                    # 31 route groups (file-based routing)
      api/                  # 84 subdiretorios, 794 route handlers
      admin/                # Layouts aninhados (layout.tsx, loading.tsx, page.tsx)
      chat/
      clm/
      ...
    components/             # 37 subdiretorios (por feature/modulo)
      core/                 # Button, Input, Modal, Skeleton (DEPRECATED -> qi/)
      qi/                   # 30 componentes QI (design system ativo)
      shared/               # Logo, CommandPalette, etc
      chat/, admin/, bi/... # Componentes por feature
    lib/                    # 50+ subdiretorios (camada de servicos)
      services/             # 167 arquivos de servico (*.service.ts)
      db/
        schemas/            # 30+ Zod schemas
        repositories/       # 30+ repositorios (padrao repository)
      agent/                # IA multi-agent system
      ai/                   # LLM providers, router, cost tracking
      di/                   # Container de injecao de dependencia
      auth/                 # Autenticacao Supabase SSR
      cache/                # Redis (Upstash)
      ...
    hooks/                  # 44 custom hooks (por feature em subdiretorios)
    context/                # 15+ React Contexts (state management)
    providers/              # Composicao de providers
    types/                  # Tipos globais
    config/                 # Navegacao
  packages/
    cli/                    # CLI independente (tsup, jest proprio)
  supabase/                 # 256 migrations
```

**Pontos fortes:**
- Separacao clara `app/` (routing) vs `lib/` (logica) vs `components/` (UI)
- Padrao repository + service consistente em `lib/db/`
- Design system QI bem encapsulado em `components/qi/`
- DI container (ainda em fase 1, opt-in)
- Next.js layouts aninhados com loading states nativos

**Pontos fracos:**
- `lib/` com 50+ subdiretorios sem agrupamento por dominio
- 167 services em diretorio flat (sem subpastas por modulo)
- 15+ React Contexts criando prop drilling complexo
- Componentes `core/` deprecated mas ainda em uso
- Sem ferramentas de analise de dependencias (sem knip, madge, depcheck)

### 2.2 rAIz-AI-Prof (Vite SPA com DDD)

```
rAIz-AI-Prof/
  domain/                   # 55 dominios (DDD-style)
    questoes/               # Exemplo: dominio com versionamento
      v0/                   # Versao 0
      v2/                   # Versao 2 (schema, state, storage, generator, validators)
      omr/                  # Sub-dominio
      resolver/             # Sub-dominio
    auth/v0/
    llm_providers/v0/
    hangman/v0/
    ...
  components/               # 92 itens (subdiretorios + loose files)
    UI/                     # Design system (Radix primitives + wrappers)
      primitives/           # Checkbox, Dialog, DropdownMenu, Select, Switch, Tabs, Tooltip
    common/                 # ErrorBoundary, GlobalSearch, LiveRegion
    adaptacao_prova/        # Componentes por feature
    questoes/, questoes-v2/ # Feature-specific
    ...
  pages/                    # 27 paginas/subdiretorios (mapeiam para rotas)
  routes/                   # Router config + guards + lazy loading
    modules/                # 14 route modules
    guards/                 # UnifiedRouteGuard
  lib/                      # 40+ subdiretorios (infra compartilhada)
    state/                  # createModuleState factory
    storage/                # IndexedDB, sync-queue, migrations
    lazy-loaders/           # Lazy imports (plotly, mathjs, jspdf, docx)
    i18n/                   # Internacionalizacao
    theme/                  # ThemeProvider + Zustand store
    context/                # Pedagogical context (Zustand)
    monitoring/             # Sentry, analytics, web-vitals
    ...
  hooks/                    # 42 custom hooks
  layouts/                  # DashboardLayout (unico)
  api/                      # 24 serverless functions (Vercel)
  styles/                   # CSS global + print styles
  config/                   # Design tokens, environment, color scheme
```

**Pontos fortes:**
- DDD explicito com 55 dominios em `domain/`
- Versionamento explicito por dominio (v0, v1, v2)
- Factory `createModuleState` padroniza gestao de estado por modulo
- Ferramentas de analise: knip (dead code), madge (circular deps), depcheck
- Barrel exports com documentacao (evita `export *` para prevenir conflitos)
- Code splitting sofisticado (14 vendor chunks categorizados)
- Offline-first com IndexedDB + sync queue

**Pontos fracos:**
- 55 dominios e excessivo (muitos sao features simples, nao dominios DDD verdadeiros)
- Sem `src/` wrapper — codigo fonte espalhado na raiz do projeto
- `components/` com 92 itens misturando loose files + diretorios
- Duplicacao pages/ vs components/ (muitos componentes em ambos)
- Componentes RouteGuard espalhados (6 em components/ + 6 em routes/)
- Estado misto: Zustand (5 stores) + createModuleState (40+) + TanStack Query

---

## 3. Avaliacao DDD - rAIz-AI-Prof (57 Dominios)

### 3.1 Classificacao dos 55 Dominios

| Categoria | Dominios | Qtd | Observacao |
|---|---|---|---|
| **Dominios Core** | auth, organizations, settings, llm_providers, core, menu | 6 | Verdadeiros dominios de negocio |
| **Dominios de Conteudo** | questoes, textual, lessonPlan, schoolPlanning, presentation, mindmap, bncc, taxonomy, pei, esl | 10 | Dominios pedagogicos legitimos |
| **Dominios de IA** | prompts, specialists, classification, complete_reasoning, feedback, continuous_improvement, improvement | 7 | Funcionalidades de IA |
| **Jogos Educacionais** | hangman, crossword, sudoku, memory, wordsearch, tictactoe, checkers, einstein, domino, game24, hanoi, spellingbee, sequence, cloze, match_columns, truefalse, findError, olimpiadas, quiz | 19 | **Problema: cada jogo e um "dominio"** |
| **Infraestrutura** | assets, common, host_context, collaboration, plugins, lti, omr_reading, games, jogos, adaptacao_prova, aluno, support | 12 | Mistura de infra + features |

### 3.2 Analise de Qualidade DDD

**Dominios bem estruturados (exemplo: `questoes/v2/`):**
- 31 arquivos com naming convention clara: `question_v2.schema.ts`, `questions_v2.state.ts`, `questions_v2.storage.ts`, etc.
- Separacao: schema -> state -> storage -> generator -> validators -> hooks -> supabase
- Versionamento explicito (v0 -> v2)

**Dominios sobre-fragmentados (jogos):**
- 19 dominios para jogos educacionais que seguem o mesmo pattern
- Cada um: schema -> state -> storage -> generator (template identico)
- Melhor abordagem: um dominio `games/` com sub-modulos por jogo

**Inconsistencias:**
- `jogos/` e `games/` coexistem (duplicacao semantica)
- `improvement/` e `continuous_improvement/` sao similares
- `aluno/` contém sub-dominio `estudo_socratico/` com aninhamento excessivo
- Naming misto: snake_case (`funcoes_matematicas`), camelCase (`schoolPlanning`), lowercase (`hangman`)

### 3.3 Nota DDD: 6/10

| Criterio | Nota | Comentario |
|---|---|---|
| Bounded contexts | 5/10 | Sobre-fragmentacao (19 jogos como dominios separados) |
| Ubiquitous language | 7/10 | Naming consistente dentro de cada dominio, mas misto entre dominios |
| Encapsulamento | 8/10 | Cada dominio encapsula schema+state+storage+logic |
| Versionamento | 9/10 | Excelente — v0/v1/v2 explicito |
| Coesao interna | 7/10 | Boa dentro de cada dominio, mas factory homogenea demais |
| Acoplamento entre dominios | 6/10 | Barrel exports grandes; imports cruzados via @/ alias |

---

## 4. Acoplamento & Coesao

### 4.1 Padroes de Import

**raiz-platform:**
```
@/lib/services/chat.service     <- Importa servico direto por arquivo
@/lib/db/schemas/chat.schema    <- Import de schema individual
@/components/qi/QiButton        <- Design system via barrel ou direto
@/context/ChatContext            <- Context individual
```
- **197 arquivos `index.ts`** (barrel exports extensivos)
- Path alias `@/` aponta para `./src/*`
- Servicos importados diretamente (sem barrel `services/index.ts`)
- Repositorios com barrel export organizado

**rAIz-AI-Prof:**
```
@/domain/questoes/v2            <- Import de dominio versionado
@/lib/state                     <- Factory de state
@/components/UI                 <- Barrel de design system
@/domain/auth/v0                <- Auth via dominio
```
- **47 arquivos `index.ts`** nos dominios (mais seletivo)
- Path alias `@/` aponta para raiz do projeto (nao `src/`)
- 144 `export *` em dominios (risco de re-exports massivos)
- Barrel export da `components/UI/index.ts` bem documentado, evitando `export *`

### 4.2 Deteccao de Dependencias Circulares

| Ferramenta | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **madge** | Nao instalado | Instalado (`analyze:madge`) |
| **knip** | Nao instalado | Instalado (`analyze:knip`) |
| **depcheck** | Nao instalado | Instalado (`analyze:depcheck`) |
| **Bundle analyzer** | `@next/bundle-analyzer` | `rollup-plugin-visualizer` |

**Gap critico**: raiz-platform nao possui NENHUMA ferramenta de analise de dependencias circulares ou dead code.

### 4.3 Riscos de Acoplamento

**raiz-platform:**
- 15+ React Contexts com cascata no provider tree (alto acoplamento vertical)
- `lib/services/` com 167 arquivos flat — sem limites de dominio
- Qualquer componente pode importar qualquer servico via `@/lib/services/*`
- Sem enforcement de boundaries (qualquer `page.tsx` acessa qualquer `service`)

**rAIz-AI-Prof:**
- Dominios com barrel exports grandes (ex: `schoolPlanning/v0/index.ts` com 68 re-exports)
- `components/` pode importar de qualquer `domain/` — sem boundary enforcement
- Mistura de state patterns (Zustand + createModuleState + TanStack Query) cria confusao de onde fica o estado canonico
- Duplicacao pages/ <-> components/ em varios modulos

---

## 5. Modularidade

### 5.1 Comparacao de Modularidade

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Encapsulamento de feature** | Medio — split entre app/, components/, lib/, context/ | Alto — domain/ encapsula tudo, mas components/ dispersa |
| **Independencia de modulo** | Baixa — services importaveis de qualquer lugar | Media — dominios sao auto-contidos mas sem enforcement |
| **Reutilizacao** | QI design system bem isolado | UI primitives bem isolados, mas muitos one-off components |
| **Testabilidade** | DI container (fase 1) facilita mock | createModuleState facilita teste de state |
| **Code splitting** | Automatico (Next.js per-route) | Manual sofisticado (14 vendor chunks) |
| **Lazy loading** | Automatico (React.lazy via Next.js) | Explicito em `lib/lazy-loaders/` + `routes/lazyPages.tsx` |

### 5.2 Onde Cada Projeto e Mais Modular

**raiz-platform e mais modular em:**
- API routes (cada rota em `app/api/` e independente por design)
- Layouts aninhados (Next.js layout.tsx isola UI por segmento)
- Database layer (schemas + repositories padronizados)
- DI container (mesmo em fase 1, permite desacoplamento)

**rAIz-AI-Prof e mais modular em:**
- Dominios de negocio (DDD explicito com versionamento)
- State management (createModuleState factory padronizada)
- Design system (Radix primitives wrapeados com documentacao)
- Ferramentas de analise (knip, madge, depcheck detectam problemas)
- Offline capabilities (IndexedDB + sync queue encapsulados em `lib/storage/`)
- Internacionalizacao (i18n como camada transversal)

---

## 6. Arquitetura de Componentes

### 6.1 Design System

**raiz-platform (QI - Quiet Intelligence):**
```
components/qi/          # 30 componentes padronizados
  QiButton.tsx          # Variantes: primary, secondary, ghost, danger
  QiInput.tsx
  QiModal.tsx           # Padrao documentado em MODAL_PATTERN.md
  QiCard.tsx
  QiTable.tsx
  QiToast.tsx
  ...
  index.ts              # Barrel export unico
```
- Naming convention: `Qi` prefix em todos
- Componentes `core/` deprecated (Button, Input) com mapeamento para QI
- 1 camada: QI -> Tailwind CSS (sem Radix UI por baixo)

**rAIz-AI-Prof (Radix + Custom):**
```
components/UI/
  primitives/           # 9 Radix UI wrappers
    Dialog.tsx
    DropdownMenu.tsx
    Select.tsx
    Tabs.tsx
    ...
  ConfirmModal.tsx      # Composicoes
  StatCard.tsx
  MultiSelect.tsx
  index.ts              # Barrel documentado (79 linhas com explicacoes)
```
- 2 camadas: Custom wrappers -> Radix UI -> Tailwind CSS
- Barrel export bem documentado com notas sobre conflitos
- Radix primitives re-exportados com naming explicito

### 6.2 Organizacao de Componentes

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Total componentes** | ~37 diretorios em components/ | ~92 itens em components/ |
| **Componentes loose** | Poucos (organizado em subdirs) | ~25 arquivos soltos na raiz |
| **Feature components** | Em subdiretorios (chat/, admin/, bi/) | Em subdiretorios + duplicacao com pages/ |
| **Componentes compartilhados** | `shared/` (5 componentes) + `qi/` (30) | `UI/` (19 componentes) + `common/` (~10) |
| **Storybook** | Nao configurado | Configurado (Storybook 10.1) |

---

## 7. Padroes de Roteamento

### 7.1 raiz-platform — File-Based (Next.js App Router)

```
src/app/
  page.tsx                          # / (home)
  layout.tsx                        # Root layout
  chat/
    page.tsx                        # /chat
    layout.tsx                      # Chat layout
    [roomId]/page.tsx               # /chat/:roomId
  api/
    chat/route.ts                   # POST /api/chat
    auth/callback/route.ts          # GET /api/auth/callback
```

**Caracteristicas:**
- 179 pages (`page.tsx`)
- 10 layouts aninhados (`layout.tsx`)
- Loading states nativos (`loading.tsx`)
- Error boundaries nativos (`error.tsx`)
- 794 API route handlers em `api/`
- Middleware centralizado (`src/middleware.ts`) com access control por rota
- Route-to-module mapping para permissoes

### 7.2 rAIz-AI-Prof — Programatico (React Router DOM 7)

```
routes/
  AppRoutes.tsx                     # Router principal
  lazyPages.tsx                     # Lazy loading de pages
  modules/                          # 14 route modules
    settingsRoutes.tsx
    questoesRoutes.tsx
    gamesRoutes.tsx
    ...
  guards/
    UnifiedRouteGuard.tsx           # Guard unificado
```

**Caracteristicas:**
- Router central em `AppRoutes.tsx`
- 14 modules de rotas (composicao modular)
- Lazy loading explicito via `lazyPages.tsx`
- Guards: 1 unificado em `routes/guards/` + 6 espalhados em `components/`
- Rotas publicas (login, callback) vs protegidas (AuthGuard + DashboardLayout)
- Sem loading/error states built-in (manual via Suspense)

### 7.3 Comparacao

| Aspecto | raiz-platform (File-Based) | rAIz-AI-Prof (Programatico) |
|---|---|---|
| **Discoverability** | Alta — estrutura de pasta = URL | Media — precisa ler AppRoutes.tsx |
| **Code splitting** | Automatico por rota | Manual (lazyPages.tsx) |
| **Nested layouts** | Nativo (layout.tsx) | Manual (DashboardLayout unico) |
| **Loading states** | Nativo (loading.tsx) | Manual (LoadingFallback) |
| **Error handling** | Nativo (error.tsx) | Manual (ErrorBoundary) |
| **Middleware** | Nativo (middleware.ts) | Guards por rota |
| **Flexibilidade** | Menor (convencao do framework) | Maior (composicao livre) |
| **Type safety rotas** | `typedRoutes` experimental | Nenhuma |

---

## 8. Fronteira Server/Client

### 8.1 raiz-platform — SSR com Boundaries

```
Server Components (default):
  - Layouts, Pages (data fetching server-side)
  - API Routes (Node.js runtime)
  - Middleware (edge ou Node.js)

Client Components ('use client'):
  - Componentes interativos
  - Hooks (useState, useEffect)
  - Contexts, Providers

Boundary:
  - src/middleware.ts -> Node.js runtime (auth + access control)
  - Server Components fetcham dados diretamente
  - Client Components usam hooks (SWR/TanStack Query)
```

**Tradeoffs em pratica:**
- Supabase SSR (`@supabase/ssr`) para auth server-side
- Redis cache server-side para rate limiting e access control
- OpenTelemetry instrumentacao server-side
- serverComponentsExternalPackages: 15+ pacotes pesados externalizados
- `ignoreBuildErrors: true` no Next.js (tsc leva 10+ min no Vercel)

### 8.2 rAIz-AI-Prof — SPA com Serverless

```
Client (SPA):
  - TODO o React roda no browser
  - State management: Zustand + createModuleState + localStorage + IndexedDB
  - Supabase client-side (supabase-js)
  - LLM calls via client -> API -> provider

Server (Vercel Serverless):
  - api/ (24 functions)
  - vite-serverless-plugin (emula Vercel localmente em dev)
  - Sem Node.js runtime no client

Boundary:
  - Nao tem server components
  - Dados sensiveis (API keys LLM) processados em serverless
  - Offline-first: IndexedDB como cache local + sync queue
```

**Tradeoffs em pratica:**
- Sem SEO server-side (SPA puro)
- PWA com service worker para cache + offline
- Bundle maior no client (mitigado com code splitting extensivo)
- API keys de LLM encriptadas e processadas server-side
- Vite serverless plugin customizado para DX local

### 8.3 Comparacao de Boundaries

| Aspecto | raiz-platform (SSR) | rAIz-AI-Prof (SPA) |
|---|---|---|
| **SEO** | Nativo (server rendering) | Nao (SPA) |
| **First Paint** | Rapido (HTML server-rendered) | Mais lento (JS bundle necessario) |
| **API Surface** | 794 routes (colocadas com UI) | 24 serverless (separadas) |
| **Data Fetching** | Server-side + client-side | Client-side apenas |
| **Caching** | Redis (Upstash) + Next.js cache | IndexedDB + service worker |
| **Offline** | Nao suportado | PWA com sync queue |
| **Bundle Size** | Menor no client (server renderiza) | Maior (14 vendor chunks) |
| **Complexidade** | Alta (server/client boundaries) | Media (tudo client, API simples) |

---

## 9. Gaps Identificados

### 9.1 Gaps do raiz-platform

| # | Gap | Severidade | Detalhe |
|---|---|---|---|
| G1 | Sem analise de dependencias circulares | Alta | Sem madge, knip ou depcheck |
| G2 | 167 services flat sem agrupamento | Alta | `lib/services/` sem subdiretorios por dominio |
| G3 | 15+ React Contexts acoplados | Alta | Provider tree complexo, dificil de testar |
| G4 | Componentes `core/` deprecated em uso | Media | Migracao incompleta para QI |
| G5 | Sem i18n | Media | Plataforma multi-escola sem internacionalizacao |
| G6 | Sem Storybook | Media | Design system QI sem documentacao visual |
| G7 | Sem offline support | Baixa | Dependencia de conectividade |
| G8 | `ignoreBuildErrors: true` no Next.js | Alta | Erros de tipo nao bloqueiam deploy |
| G9 | Sem dead code detection | Media | Potencial de codigo nao utilizado |
| G10 | DI container em fase 1 | Baixa | Apenas opt-in, maioria dos services nao registrados |

### 9.2 Gaps do rAIz-AI-Prof

| # | Gap | Severidade | Detalhe |
|---|---|---|---|
| G11 | 55 dominios excessivos | Alta | 19 jogos como dominios individuais (sobre-fragmentacao DDD) |
| G12 | TypeScript strict desabilitado no CI | Alta | `tsconfig.typecheck.json` com strict=false, 677+ erros |
| G13 | Sem `src/` wrapper | Media | Codigo fonte espalhado na raiz |
| G14 | RouteGuards espalhados | Media | 6 em components/ + 1 unificado em routes/guards/ |
| G15 | Duplicacao pages/ <-> components/ | Media | Feature logic em ambos os lugares |
| G16 | State management fragmentado | Media | Zustand + createModuleState + TanStack Query |
| G17 | Naming inconsistente nos dominios | Media | snake_case vs camelCase vs lowercase |
| G18 | Barrel exports excessivos | Media | 68 re-exports em schoolPlanning/v0/index.ts |
| G19 | `jogos/` e `games/` coexistem | Baixa | Duplicacao semantica |
| G20 | ESLint com max-warnings=500 | Media | Tolerancia alta a warnings |

---

## 10. Oportunidades Priorizadas

### P0 - Criticas (impacto direto em qualidade/estabilidade)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|---|---|---|---|---|
| **O1** | Instalar madge + knip no raiz-platform | raiz | S (2h) | Detectar circular deps e dead code |
| **O2** | Eliminar `ignoreBuildErrors: true` no next.config | raiz | L (40h+) | Garantir type safety no deploy |
| **O3** | Habilitar strict mode no CI do rAIz-AI-Prof | raiz-ai | L (80h+) | Eliminar 677 erros de tipo |
| **O4** | Consolidar 19 dominios de jogos em `domain/games/` | raiz-ai | M (8h) | Reduzir complexidade DDD de 55 para ~40 dominios |

### P1 - Importantes (melhoria significativa de manutenibilidade)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|---|---|---|---|---|
| **O5** | Agrupar `lib/services/` por dominio no raiz-platform | raiz | M (16h) | Coesao e discoverability |
| **O6** | Migrar React Context para Zustand/Jotai no raiz-platform | raiz | L (40h) | Reduzir acoplamento, facilitar testes |
| **O7** | Unificar RouteGuards no rAIz-AI-Prof | raiz-ai | S (4h) | Eliminar 6 guards espalhados |
| **O8** | Padronizar naming de dominios (tudo snake_case) | raiz-ai | M (8h) | Consistencia |
| **O9** | Criar boundaries de import (eslint-plugin-boundaries) | ambos | M (8h) | Enforcement de arquitetura |
| **O10** | Completar migracao core/ -> qi/ no raiz-platform | raiz | S (4h) | Eliminar componentes deprecated |

### P2 - Desejaveis (melhoria de DX e consistencia)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|---|---|---|---|---|
| **O11** | Configurar Storybook no raiz-platform | raiz | M (8h) | Documentacao visual do QI |
| **O12** | Adicionar `src/` wrapper no rAIz-AI-Prof | raiz-ai | L (24h) | Organizacao de diretorio |
| **O13** | Consolidar state management no rAIz-AI-Prof | raiz-ai | M (16h) | Zustand OU createModuleState (nao ambos) |
| **O14** | Reduzir barrel exports no schoolPlanning (68 re-exports) | raiz-ai | S (2h) | Melhor tree-shaking |
| **O15** | Adicionar i18n ao raiz-platform | raiz | L (40h+) | Suporte multi-idioma |
| **O16** | Migrar DI container para registracoes completas | raiz | L (40h) | Testabilidade plena |

### P3 - Nice-to-Have

| ID | Oportunidade | Projeto | Esforco | Impacto |
|---|---|---|---|---|
| **O17** | PWA no raiz-platform | raiz | L (24h) | Offline para modulos-chave |
| **O18** | Typed routes no rAIz-AI-Prof | raiz-ai | M (8h) | Type safety nas rotas |
| **O19** | Eliminar duplicacao `jogos/` vs `games/` | raiz-ai | S (2h) | Limpeza semantica |
| **O20** | Adicionar ESLint max-warnings=0 no rAIz-AI-Prof | raiz-ai | L (40h+) | Zero tolerance |

---

## 11. Padroes Reutilizaveis Entre Projetos

### 11.1 Do rAIz-AI-Prof para raiz-platform

| Padrao | Descricao | Arquivos de Referencia |
|---|---|---|
| **createModuleState factory** | Factory padronizada para state management por modulo | `D:/GitHub/rAIz-AI-Prof/lib/state/createModuleState.ts` |
| **Versionamento de dominio** | v0 -> v1 -> v2 dentro de cada bounded context | `D:/GitHub/rAIz-AI-Prof/domain/questoes/v2/` |
| **Ferramentas de analise** | knip + madge + depcheck como scripts npm | `D:/GitHub/rAIz-AI-Prof/package.json` (linhas 62-64) |
| **Barrel export documentado** | Evitar `export *`, documentar razoes no barrel | `D:/GitHub/rAIz-AI-Prof/components/UI/index.ts` |
| **Lazy loaders centralizados** | Pattern para libs pesadas (plotly, mathjs, etc) | `D:/GitHub/rAIz-AI-Prof/lib/lazy-loaders/` |
| **Offline-first storage** | IndexedDB + sync queue para resiliencia | `D:/GitHub/rAIz-AI-Prof/lib/storage/` |
| **Storybook setup** | Documentacao visual de componentes | `D:/GitHub/rAIz-AI-Prof/.storybook/` |

### 11.2 Do raiz-platform para rAIz-AI-Prof

| Padrao | Descricao | Arquivos de Referencia |
|---|---|---|
| **Repository pattern** | Camada de acesso a dados padronizada | `D:/GitHub/raiz-platform/src/lib/db/repositories/base.repository.ts` |
| **DI Container** | Injecao de dependencia para testabilidade | `D:/GitHub/raiz-platform/src/lib/di/container.ts` |
| **QI Design System** | Design system coeso com naming convention | `D:/GitHub/raiz-platform/src/components/qi/` |
| **Middleware centralizado** | Access control por rota em um unico ponto | `D:/GitHub/raiz-platform/src/middleware.ts` |
| **Zod schemas centralizados** | Schemas de DB separados de logic de negocio | `D:/GitHub/raiz-platform/src/lib/db/schemas/` |
| **LLM Router** | Roteamento entre providers com circuit breaker | `D:/GitHub/raiz-platform/src/lib/ai/llm-router.ts` |
| **Observability stack** | OpenTelemetry + Sentry + PostHog completo | `D:/GitHub/raiz-platform/src/lib/observability/` |

### 11.3 Padroes Compartilhaveis (Extrair para Package)

| Padrao | Candidato a Pacote | Justificativa |
|---|---|---|
| **Supabase auth helpers** | `@raiz/supabase-auth` | Ambos usam Supabase com patterns similares |
| **Zod schemas de usuario/org** | `@raiz/shared-schemas` | Schemas de usuario/organizacao comuns |
| **Design tokens** | `@raiz/design-tokens` | Cores, espacamento, tipografia compartilhaveis |
| **LLM provider abstraction** | `@raiz/llm-sdk` | Ambos usam multi-LLM com patterns distintos |
| **Error handling patterns** | `@raiz/error-handling` | Circuit breakers, retry, error boundaries |

---

## 12. Diagrama de Arquitetura Comparativo

```
raiz-platform (Next.js SSR)             rAIz-AI-Prof (Vite SPA)
========================               ========================

[Browser]                              [Browser]
    |                                      |
    v                                      v
[Next.js Middleware]                   [React Router + Guards]
    |                                      |
    v                                      v
[Server Components]                    [Client Components]
    |        |                             |        |
    v        v                             v        v
[API Routes] [Client Components]      [Serverless API]  [Zustand/State]
 (794)        (Context+Hooks)           (24 funcs)       (40+ modules)
    |                                      |
    v                                      v
[Services (167)] [Repositories]       [Domain Services (17)]
    |                  |                   |
    v                  v                   v
[Supabase]     [Redis Cache]          [Supabase]  [IndexedDB]
[MSSQL/TOTVS]                                     [Sync Queue]
```

---

## 13. Recomendacoes Consolidadas

### Para raiz-platform (Top 5)

1. **Instalar ferramentas de analise** (O1) — madge, knip, depcheck. Custo: 2h. Retorno imediato na deteccao de problemas.

2. **Agrupar services por dominio** (O5) — Reorganizar `lib/services/` em `lib/services/chat/`, `lib/services/clm/`, etc. Custo: 16h. Melhora discoverability.

3. **Reduzir React Contexts** (O6) — Migrar pelo menos os 5 contexts mais simples (Theme, Sidebar, Toast, Brand, Settings) para Zustand. Custo: 20h por contexto.

4. **Completar migracao core/ -> qi/** (O10) — Apenas 5 usos de `@/components/qi` encontrados. Completar e remover `core/`. Custo: 4h.

5. **Resolver `ignoreBuildErrors`** (O2) — Criar CI step separado para typecheck (como rAIz-AI-Prof faz com `tsconfig.typecheck.json`), removendo a flag do next.config. Custo: escalonado.

### Para rAIz-AI-Prof (Top 5)

1. **Consolidar dominios de jogos** (O4) — Mover 19 jogos para `domain/games/{hangman,crossword,...}/v0/`. Custo: 8h. Reduz complexidade significativamente.

2. **Unificar RouteGuards** (O7) — Migrar 6 guards de `components/` para usar `routes/guards/UnifiedRouteGuard.tsx`. Custo: 4h.

3. **Padronizar naming** (O8) — Definir convencao (sugestao: snake_case para dominios) e renomear `schoolPlanning` -> `school_planning`, `lessonPlan` -> `lesson_plan`, etc. Custo: 8h.

4. **Reduzir TS debt** (O3) — Plano incremental: ativar strict options uma por uma (comecando por `strictNullChecks`). Custo: escalonado, 677+ erros.

5. **Consolidar state management** (O13) — Definir: Zustand para state global, createModuleState para state de modulo, TanStack Query para server state. Documentar boundary de cada um. Custo: 16h.

### Cross-Project (Top 3)

1. **eslint-plugin-boundaries** (O9) — Instalar em ambos para enforcar architectural boundaries via lint. Previne imports proibidos entre camadas.

2. **Pacote compartilhado de schemas** — Extrair tipos de usuario/organizacao para `@raiz/shared-schemas`. Ambos projetos usam Supabase com tabelas similares.

3. **Design tokens compartilhados** — Extrair tokens (cores, espacamento, tipografia) para pacote consumido por ambos os design systems (QI e Radix wrappers).

---

## Anexo A: Metricas Quantitativas

| Metrica | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| Arquivos TS/TSX | 3.959 | 5.897 |
| Arquivos de teste | 946 | 422 |
| Ratio teste/codigo | 24% | 7.2% |
| Servicos | 167 | 17 |
| Schemas | 30+ | 90 |
| Dominios/modulos | ~20 (app routes) | 55 (DDD domains) |
| Custom hooks | 44 | 42 |
| API routes/functions | 794 | 24 |
| React Contexts | 15+ | ~3 |
| Zustand stores | 0 | 5 + 40 module states |
| Barrel exports (index.ts) | 197 | 47 |
| Supabase migrations | 256 | 66 |
| Design system components | 30 (QI) | 19 (UI primitives) |
| Vendor chunks | Automatico (Next.js) | 14 (manual) |
| `export * from` ocorrencias | ~19 | ~144 |

## Anexo B: Mapa de Correspondencia de Funcionalidades

| Funcionalidade | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Autenticacao** | `src/lib/auth/` + Supabase SSR | `domain/auth/v0/` + Supabase client |
| **LLM/AI** | `src/lib/ai/` + `src/lib/agent/` (multi-agent) | `domain/llm_providers/v0/` (multi-provider) |
| **Chat** | `src/app/chat/` + `src/lib/services/chat*` | `components/chat/` (simples) |
| **Questoes** | N/A | `domain/questoes/v0/` + `domain/questoes/v2/` |
| **Dashboard** | `src/app/admin/` + `src/components/dashboard/` | `pages/DashboardPage.tsx` + `components/dashboard/` |
| **Settings** | `src/app/settings/` + `context/SettingsContext` | `domain/settings/v0/` + `pages/settings/` |
| **Organizations** | `src/lib/db/schemas/organization.schema.ts` | `domain/organizations/v0/` |
| **Temas** | `context/ThemeContext.tsx` | `lib/theme/` (Zustand) |
| **Monitoring** | Sentry + OTel + PostHog | Sentry + Web Vitals |
| **Database** | Supabase + MSSQL | Supabase + IndexedDB |
