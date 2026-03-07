# D12 — Build Tooling & DX Infrastructure

> Diagnostico cruzado entre **raiz-platform** (Next.js 14) e **rAIz-AI-Prof** (Vite 7)
> Data: 2026-03-01

---

## Sumario Executivo

Os dois projetos utilizam stacks de build fundamentalmente diferentes. O **raiz-platform** usa Next.js 14 com webpack (e turbopack opcional), otimizado para SSR/SSG com serverless functions no Vercel. O **rAIz-AI-Prof** usa Vite 7 com Rollup, otimizado para SPA com PWA e code splitting manual sofisticado. O rAIz-AI-Prof possui DX significativamente mais madura em ferramentas de analise (knip, depcheck, madge, rollup-plugin-visualizer, TypeDoc, Storybook, commitlint), enquanto o raiz-platform tem lacunas criticas nessas areas.

---

## 1. Sistema de Build — Comparacao Side-by-Side

| Dimensao | raiz-platform | rAIz-AI-Prof |
|----------|--------------|--------------|
| **Framework** | Next.js 14.2.35 | Vite 7.0.0 |
| **Bundler (prod)** | webpack (via Next.js) | Rollup (via Vite) |
| **Bundler (dev)** | webpack / turbopack (opcional) | esbuild (via Vite) |
| **Minificador** | SWC (via Next.js) | esbuild |
| **Target** | ES2022 | ES2022 |
| **TypeScript** | 5.7.2 | 5.9.3 |
| **React** | 18.2.0 | 19.2.3 |
| **Rendering** | SSR + SSG + ISR (App Router) | SPA (client-only) |
| **CSS** | Tailwind 3.4.17 + PostCSS | Tailwind 4.1.18 + PostCSS |
| **Source Maps** | Sentry (via webpack plugin) | Hidden em prod (Sentry Vite plugin) |
| **PWA** | Nao | Sim (vite-plugin-pwa + Workbox) |
| **Sentry Integration** | @sentry/nextjs (webpack wrapper) | @sentry/vite-plugin |
| **Build Command** | `next build` | `vite build` |
| **Output** | `.next/` (server + static) | `dist/` (static SPA) |
| **Deploy Target** | Vercel (gru1) — Next.js framework | Vercel (Vite framework) |

### Arquivo de Configuracao Principal

- **raiz-platform**: `D:/GitHub/raiz-platform/next.config.mjs` (226 linhas)
- **rAIz-AI-Prof**: `D:/GitHub/rAIz-AI-Prof/vite.config.ts` (371 linhas)

---

## 2. Dev Server & Performance de HMR

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Porta padrao** | 3000 | 3008 |
| **Startup** | Lento (~15-30s, webpack compilacao completa) | Rapido (~1-3s, esbuild pre-bundle) |
| **HMR Engine** | webpack HMR / Fast Refresh | Vite HMR nativo (ESM) |
| **Turbopack** | Disponivel via `npm run dev:turbo` | N/A |
| **Pre-bundling** | Nao (webpack resolve tudo) | Sim (esbuild `optimizeDeps`) |
| **Watch Ignored** | `node_modules`, `.next`, `.turbo`, `.cache`, `dist`, `build`, `.git` | Default Vite |
| **Dev Scripts** | `dev`, `dev:turbo`, `dev:clean`, `dev:warmup` | `dev` |
| **Predev Hook** | `predev` (executa `scripts/predev.js`) | Nenhum |
| **PWA em dev** | N/A | Desabilitado (evita conflitos com HMR) |

### Analise

O **rAIz-AI-Prof** tem startup de dev server significativamente mais rapido gracas ao Vite, que usa ESM nativo e esbuild para pre-bundling. O raiz-platform compensa parcialmente com a opcao turbopack (`dev:turbo`), mas o startup ainda e mais lento por natureza do Next.js (precisa compilar rotas server-side).

O raiz-platform tem scripts auxiliares mais ricos para DX do dev (`dev:clean`, `dev:warmup`, `clean:cache`, `clean:all`), indicando que problemas de cache sao recorrentes no webpack/Next.js.

---

## 3. Hot Module Replacement

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Mecanismo** | React Fast Refresh (via SWC) | React Fast Refresh (via @vitejs/plugin-react) |
| **Velocidade HMR** | ~200-500ms (webpack), ~50-100ms (turbopack) | ~50-100ms (Vite ESM nativo) |
| **Full Reload Triggers** | Mudancas em `next.config.mjs`, server components | Mudancas em `vite.config.ts` |
| **HMR Safety ESLint** | Nao configurado | `react-refresh/only-export-components` (warn) |
| **State Preservation** | Sim (React Fast Refresh) | Sim (React Fast Refresh) |

### Analise

Ambos usam React Fast Refresh, mas o Vite tem vantagem na velocidade de propagacao por operar com ESM nativo (sem bundling intermediario no dev). O rAIz-AI-Prof tem a regra ESLint `react-refresh/only-export-components` que previne exports nao-componente que quebram HMR — o raiz-platform nao tem essa protecao.

---

## 4. TypeDoc / Geracao de Docs de API

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **TypeDoc** | **NAO INSTALADO** | Sim (typedoc 0.28.15 + typedoc-plugin-markdown) |
| **Configuracao** | N/A | `typedoc.json` com entry points DDD |
| **Scripts** | N/A | `docs:api`, `docs:api:watch` |
| **Output** | N/A | `docs/api/` (formato Markdown) |
| **Entry Points** | N/A | `domain/*/v0/index.ts`, `domain/*/v2/index.ts`, `lib/*`, `hooks/*` |
| **Plugins** | N/A | typedoc-plugin-markdown 4.9.0 |

### Configuracao TypeDoc do rAIz-AI-Prof

Arquivo: `D:/GitHub/rAIz-AI-Prof/typedoc.json`

```json
{
  "entryPoints": [
    "domain/*/v0/index.ts",
    "domain/*/v2/index.ts",
    "lib/storage.ts",
    "lib/supabase/index.ts",
    "lib/i18n/index.ts",
    "lib/monitoring/index.ts",
    "lib/theme/index.ts",
    "hooks/*.ts"
  ],
  "plugin": ["typedoc-plugin-markdown"],
  "out": "docs/api",
  "sort": ["source-order"],
  "validation": { "invalidLink": true }
}
```

### Gap no raiz-platform

O raiz-platform nao tem nenhuma ferramenta de geracao de documentacao de API. Com 20+ modulos de negocio (Chat, WhatsApp, CLM, Litigation, Social Media, etc.), a ausencia de docs geradas e uma lacuna critica para onboarding e manutencao.

---

## 5. Bundle Analysis Tools

| Ferramenta | raiz-platform | rAIz-AI-Prof |
|-----------|--------------|--------------|
| **Bundle Analyzer (visual)** | @next/bundle-analyzer (devDep) | rollup-plugin-visualizer 5.14.0 |
| **Script de analise** | `build:analyze` (ANALYZE=true) | `analyze:bundle` |
| **Output** | Browser auto-open (treemap) | `dist/stats.html` (gzip + brotli) |
| **Bundle Size Check** | `build:check` (bash script, 5MB limit) | Nao (apenas `chunkSizeWarningLimit: 500`) |
| **Dead Code Analysis** | **NAO** | knip 5.45.1 (`analyze:knip`) |
| **Dependency Check** | **NAO** | depcheck 1.4.7 (`analyze:depcheck`) |
| **Circular Dependencies** | **NAO** | madge 8.0.0 (`analyze:madge`) |

### Bundle Check Script (raiz-platform)

Arquivo: `D:/GitHub/raiz-platform/scripts/check-bundle.sh`

- Budget total: 5MB (`.next/static`)
- Budget por chunk: 500KB
- Mostra top 5 chunks
- Falha o build se ultrapassar

### Code Splitting Strategy (rAIz-AI-Prof)

O rAIz-AI-Prof tem code splitting manual sofisticado no `vite.config.ts` com **16 vendor chunks** categorizados:

| Chunk | Conteudo |
|-------|----------|
| `vendor-react` | react, react-dom, react-router-dom, scheduler |
| `vendor-ui` | @radix-ui/* |
| `vendor-state` | zustand, @tanstack/react-query |
| `vendor-supabase` | @supabase/* |
| `vendor-heavy` | plotly.js, mathjs, docx, jspdf, pptxgenjs |
| `vendor-animation` | framer-motion, motion, motion-utils, motion-dom |
| `vendor-charts` | recharts |
| `vendor-lottie` | lottie-react, lottie-web |
| `vendor-database` | dexie |
| `vendor-validation` | zod |
| `vendor-icons` | lucide-react |
| `vendor-utils` | dompurify, qrcode, jsqr, blurhash, file-saver, driver.js |
| `vendor-i18n` | i18next, react-i18next |
| `vendor-monitoring` | react-query-devtools, web-vitals |
| `vendor-misc` | demais node_modules |

### Lazy Loading (rAIz-AI-Prof)

Arquivo: `D:/GitHub/rAIz-AI-Prof/lib/lazy-loaders/index.ts`

5 bibliotecas pesadas com lazy loading dedicado:
- `jspdf` (PDF)
- `docx` (DOCX)
- `pptxgenjs` (PowerPoint)
- `html2canvas` (Screenshot)
- `mathjs` (Matematica)

Cada loader inclui: `load*()`, `is*Loaded()`, `clear*Cache()`, `preloadHeavyLibraries()`.

### Code Splitting (raiz-platform)

O raiz-platform usa a estrategia do Next.js (automatica) com otimizacoes manuais:

```javascript
// next.config.mjs
experimental: {
  serverComponentsExternalPackages: [...], // 16 packages externalizados
  optimizePackageImports: [...], // 14 packages com tree-shaking
  outputFileTracingExcludes: { '/*': [...] }, // ~540MB excluidos
}
```

---

## 6. Potencial Monorepo — Codigo Compartilhavel

### Dependencias em Comum

| Dependencia | raiz-platform | rAIz-AI-Prof | Compartilhavel? |
|-------------|--------------|--------------|-----------------|
| `@supabase/supabase-js` | ^2.91.0 | ^2.90.0 | Sim |
| `@tanstack/react-query` | ^5.90.19 | ^5.90.16 | Sim |
| `@tanstack/react-query-devtools` | ^5.91.2 | ^5.91.2 | Sim |
| `@tanstack/react-virtual` | ^3.13.18 | ^3.13.18 | Sim |
| `recharts` | ^3.6.0 | ^3.6.0 | Sim |
| `lucide-react` | ^0.468.0 | ^0.562.0 | Parcial (versoes divergentes) |
| `zod` | ^3.23.8 | ^4.3.5 | Nao (major version diferente) |
| `docx` | ^9.5.1 | ^9.5.1 | Sim |
| `dompurify` | ^3.3.1 | ^3.2.0 | Sim |
| `pptxgenjs` | ^4.0.1 | ^3.12.0 | Nao (major version diferente) |
| `undici` | ^7.18.2 | ^7.18.2 | Sim |
| `@sentry/*` | nextjs ^10.38.0 | react ^8.55.0 | Nao (SDKs diferentes) |

### Tipos e Utilitarios Potencialmente Compartilhaveis

| Area | Candidatos |
|------|-----------|
| **Supabase** | Client factory, tipos de tabelas (se DB compartilhado), helpers RLS |
| **Validacao** | Schemas Zod compartilhados (incompativel: Zod 3 vs 4) |
| **UI Components** | Lucide icons, Radix UI patterns (incompativel: versoes divergentes) |
| **Exportacao** | Lazy loaders para docx, pptxgenjs (padrao reusavel) |
| **Auth** | Logica de auth Supabase (se SSO compartilhado) |
| **Tipos** | User, Organization, Permission types |

### Viabilidade Monorepo

| Criterio | Avaliacao |
|----------|-----------|
| **Build Systems** | Incompativeis (Next.js vs Vite) — monorepo requer workspaces |
| **React Versions** | Incompativeis (React 18 vs 19) |
| **Zod Versions** | Incompativeis (v3 vs v4 — breaking changes) |
| **Deploy Targets** | Ambos Vercel, mas frameworks diferentes |
| **Recomendacao** | Monorepo com packages compartilhados (types, utils) via Turborepo/pnpm workspaces. NAO unificar builds. |

---

## 7. Build Scripts — Comparacao Completa

### Scripts de Build e Dev

| Categoria | raiz-platform | rAIz-AI-Prof |
|-----------|--------------|--------------|
| **Dev** | `dev`, `dev:turbo`, `dev:clean`, `dev:warmup` | `dev` |
| **Build** | `build`, `build:analyze`, `build:check` | `build` |
| **Preview** | `start` (produção local) | `preview` |
| **Clean** | `clean:cache`, `clean:all` | Nenhum |
| **Pre-dev** | `predev` (hook npm) | Nenhum |

### Scripts de Qualidade

| Categoria | raiz-platform | rAIz-AI-Prof |
|-----------|--------------|--------------|
| **TypeCheck** | Nenhum script dedicado (usa `tsc --noEmit` manual) | `typecheck`, `typecheck:full`, `typecheck:incremental`, `typecheck:analyze`, `typecheck:categorize`, `typecheck:fix`, `typecheck:auto-fix` |
| **Lint** | `lint` (next lint) | `lint`, `lint:i18n` |
| **Format** | `format` (prettier) | Nenhum script (`prettier` via lint-staged) |
| **Analise** | `build:analyze`, `build:check` | `analyze:knip`, `analyze:depcheck`, `analyze:madge`, `analyze:bundle` |

### Scripts de Teste

| Categoria | raiz-platform | rAIz-AI-Prof |
|-----------|--------------|--------------|
| **Unit** | `test`, `test:fast`, `test:watch`, `test:coverage`, `test:ci` | `test`, `test:watch`, `test:coverage` |
| **E2E** | `test:e2e`, `test:e2e:ui`, `test:e2e:debug`, `test:e2e:report`, `test:e2e:agent` | `test:e2e`, `test:e2e:ui` |
| **Integration** | `test:integration` | `test:integration` |
| **Security** | `test:security` | Nenhum |
| **Stress** | `test:stress` | Nenhum |
| **Prompts** | `test:prompts`, `test:prompts:view` (promptfoo) | Nenhum |
| **A11y** | Nenhum | `test:a11y`, `a11y:audit`, `a11y:language`, `a11y:full` |
| **UX** | Nenhum | `ux:audit:cognitive`, `ux:audit:consistency`, `ux:audit:mobile`, `ux:audit:all` |

### Scripts de Auditoria

| Categoria | raiz-platform | rAIz-AI-Prof |
|-----------|--------------|--------------|
| **Audit Geral** | `audit`, `audit:report`, `audit:dry-run` | `audit:full`, `audit:flow`, `audit:coherence`, `audit:product` |
| **Security** | Nenhum script dedicado | `audit:security` |
| **Database** | Nenhum | `audit:database` |
| **Performance** | `build:check` | `audit:performance` |
| **Fix** | Nenhum | `fix:audit`, `fix:audit:scalable`, `fix:audit:dry-run`, `fix:audit:keyboard` |
| **Exports** | Nenhum | `validate:exports`, `validate:exports:fix` |

### Scripts de Infra

| Categoria | raiz-platform | rAIz-AI-Prof |
|-----------|--------------|--------------|
| **Migration** | `migrate`, `migrate:status`, `migrate:rollback` | Nenhum |
| **Seed** | `seed:verify` | Nenhum |
| **Setup** | `setup:resend` | `setup:supabase` |
| **Deploy** | Nenhum (via Vercel CLI) | `deploy:clean` |
| **Storybook** | Nenhum | `storybook`, `build-storybook` |
| **Docs** | Nenhum | `docs:api`, `docs:api:watch` |
| **i18n** | Nenhum | `i18n:validate`, `i18n:audit`, `i18n:migration`, `i18n:migration:apply` |
| **Git Hooks** | `prepare` (husky) | `prepare` (husky) |

### Contagem Total

| Projeto | Scripts npm | Scripts Unicos (sem overlap) |
|---------|------------|------------------------------|
| **raiz-platform** | 35 | ~15 |
| **rAIz-AI-Prof** | 55 | ~40 |

---

## 8. Build Output e Chunk Strategy

### raiz-platform (Next.js)

| Aspecto | Valor |
|---------|-------|
| **Output Dir** | `.next/` |
| **Static Assets** | `.next/static/` |
| **Bundle Budget** | 5MB total, 500KB por chunk |
| **Server Bundle** | `.next/server/` (serverless functions) |
| **Externalizacao** | 16 packages externalizados do serverless |
| **Tracing Excludes** | ~540MB excluidos do file tracing |
| **Tree-Shaking** | `optimizePackageImports` para 14 packages |
| **Console Removal** | Produzao remove `console.log`, `console.debug`, `console.trace` |
| **Image Optimization** | Next.js Image com AVIF + WebP |
| **TypeScript em Build** | `ignoreBuildErrors: true` (validacao via CI) |
| **ESLint em Build** | `ignoreDuringBuilds: true` (validacao via `npm run lint`) |

### rAIz-AI-Prof (Vite/Rollup)

| Aspecto | Valor |
|---------|-------|
| **Output Dir** | `dist/` |
| **Chunk Warning** | 500KB |
| **Source Maps** | `hidden` em prod (para Sentry) |
| **Minificador** | esbuild |
| **CSS Code Split** | Sim |
| **Compressed Size** | Report desabilitado (`reportCompressedSize: false`) |
| **Manual Chunks** | 16 categorias vendor |
| **Lazy Loaders** | 5 libs pesadas com lazy loading dedicado |
| **sideEffects** | Declarado no package.json (`*.css`, `*.scss`, `./index.tsx`) |
| **Dedupe** | `scheduler`, `react`, `react-dom`, `react-is` |

---

## 9. Dev Dependencies Management

### Ferramentas de Qualidade

| Ferramenta | raiz-platform | rAIz-AI-Prof | Gap |
|-----------|--------------|--------------|-----|
| **TypeScript** | 5.7.2 | 5.9.3 | raiz-platform atrasado 2 minors |
| **ESLint** | 8.57.1 (legacy `.eslintrc.json`) | 9.21.0 (flat config `eslint.config.mjs`) | raiz-platform usa config legado |
| **Prettier** | 3.4.2 | 3.5.3 | Minor |
| **Husky** | 9.1.7 | 9.1.7 | Identico |
| **lint-staged** | 16.2.7 | 16.2.7 | Identico |
| **commitlint** | **NAO INSTALADO** | 20.3.1 | **GAP CRITICO** |

### Ferramentas de Teste

| Ferramenta | raiz-platform | rAIz-AI-Prof |
|-----------|--------------|--------------|
| **Unit Test Runner** | Jest 30.2.0 | Vitest 4.0.16 |
| **Test Transform** | @swc/jest (20-50x mais rapido) | Vitest (nativo Vite) |
| **Coverage** | Jest coverage | @vitest/coverage-v8 |
| **E2E** | Playwright 1.57.0 | Playwright 1.57.0 |
| **DOM Testing** | @testing-library/react 16.3.2 | @testing-library/react 16.3.1 |
| **Mocking** | msw 2.12.7 | msw 2.12.7 |
| **A11y Testing** | jest-axe 10.0.0 | @axe-core/cli, @axe-core/playwright, pa11y |
| **Visual Testing** | Nenhum | @chromatic-com/storybook |

### Ferramentas de Build

| Ferramenta | raiz-platform | rAIz-AI-Prof |
|-----------|--------------|--------------|
| **SWC** | @swc/core 1.15.10 | Nao (usa esbuild via Vite) |
| **esbuild** | 0.27.2 (dependency) | 0.25.0 (override) |
| **Bundle Analyzer** | @next/bundle-analyzer 16.1.4 | rollup-plugin-visualizer 5.14.0 |
| **PostCSS** | postcss 8.4.49 | postcss 8.5.6 |
| **Autoprefixer** | 10.4.20 | 10.4.23 |

### Ferramentas de Analise (Exclusivas rAIz-AI-Prof)

| Ferramenta | Versao | Uso |
|-----------|--------|-----|
| **knip** | 5.45.1 | Dead code analysis |
| **depcheck** | 1.4.7 | Unused dependencies |
| **madge** | 8.0.0 | Circular dependencies |
| **TypeDoc** | 0.28.15 | API documentation |
| **Storybook** | 10.1.11 | Component development |
| **organize-imports-cli** | 0.10.0 | Import organization |
| **commitlint** | 20.3.1 | Commit validation |

### Ferramentas Exclusivas do raiz-platform

| Ferramenta | Versao | Uso |
|-----------|--------|-----|
| **eslint-plugin-raiz** | file:eslint-rules | Custom ESLint rules (no-hardcoded-colors, prefer-qi-components) |
| **promptfoo** | 0.90.0 (npx) | LLM prompt testing |
| **mammoth** | 1.11.0 | DOCX parsing |
| **tsx** | 4.19.2 | TypeScript execution |

---

## 10. Build Caching

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **TS Incremental** | `incremental: true` no tsconfig.json | `tsconfig.incremental.json` dedicado |
| **TS Build Info** | `.next/types/` (gerenciado pelo Next.js) | `.tsbuildinfo` |
| **Build Cache** | `.next/cache/webpack/` | `node_modules/.vite/` |
| **Turbopack Cache** | `.turbo/` (quando usa `dev:turbo`) | N/A |
| **Dep Pre-bundle Cache** | N/A | `node_modules/.vite/deps/` |
| **Clean Scripts** | `clean:cache` (webpack + coverage), `clean:all` (+node_modules) | Nenhum |
| **Vercel Cache** | Next.js automatic (`.next/cache/`) | Vite automatic |

### Analise

O raiz-platform precisa de scripts de limpeza de cache porque o webpack/Next.js tem problemas conhecidos de cache stale. O Vite raramente precisa de limpeza manual.

O rAIz-AI-Prof tem 3 configs de TypeScript com granularidade de caching:
- `tsconfig.json` (strict, para IDE)
- `tsconfig.typecheck.json` (relaxado, para CI)
- `tsconfig.incremental.json` (incremental, para velocidade)

O raiz-platform usa apenas 1 tsconfig.json (strict) para tudo.

---

## 11. ESLint — Comparacao de Configuracao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **ESLint Version** | 8.57.1 | 9.21.0 |
| **Config Format** | `.eslintrc.json` (legado) | `eslint.config.mjs` (flat config) |
| **Base** | next/core-web-vitals + @typescript-eslint | @eslint/js + typescript-eslint |
| **max-warnings** | 0 (zero tolerance) | 500 (debt acumulado) |
| **Custom Plugin** | eslint-plugin-raiz (2 regras) | Nenhum |
| **a11y** | Nenhum | eslint-plugin-jsx-a11y (17 regras warn) |
| **Import Sort** | Nenhum | eslint-plugin-simple-import-sort |
| **i18n** | Nenhum | eslint-plugin-i18next (off por default) |
| **HMR Safety** | Nenhum | react-refresh/only-export-components |
| **Console Control** | `no-console` warn (allow warn, error) | `no-console` warn (allow warn, error) |
| **Overrides** | 3 (packages/cli, chat, settings) | 2 (logging system, test files) |

---

## 12. Testes E2E — Playwright Config

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Test Dir** | `./tests/e2e` | `./test/e2e` |
| **File Pattern** | `*.spec.ts` | `*.e2e.test.ts` |
| **Projects** | **23 projetos** (module-specific) | **6 projetos** (browser + mobile) |
| **Browsers** | Chromium only | Chromium, Firefox, WebKit |
| **Mobile** | Comentado (nao ativo) | Pixel 5, iPhone 12 |
| **Auth Setup** | Sim (setup project) | Sim (setup project) |
| **Timeout Global** | 90s | 60s |
| **Module Timeouts** | 90s-180s (por modulo) | 60s (uniforme) |
| **CI Config** | 1 worker, 2 retries | 1 worker, 2 retries |
| **Web Server** | Condicional (skip se remoto) | Sempre local |

O raiz-platform tem cobertura E2E extensiva (23 projetos por modulo) mas so testa em Chromium. O rAIz-AI-Prof testa em 3 browsers + 2 mobile viewports mas com menos projetos.

---

## 13. Vercel Deploy Config

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Framework** | nextjs | vite |
| **Region** | gru1 | Default |
| **Crons** | 16 jobs | 1 job |
| **Functions** | 8 configuracoes (60-300s) | 1 configuracao (60s) |
| **Headers** | Cache-Control em API | CSP completo + HSTS + security headers |
| **Rewrites** | N/A (Next.js routing) | SPA fallback + API rewrite |
| **Install** | `npm install --include=optional` | `npm install` |
| **Node Version** | .nvmrc (20.19.0) | build.env (20) |

### Gap de Seguranca

O rAIz-AI-Prof tem security headers muito mais completos no vercel.json (CSP, HSTS, X-Frame-Options, Permissions-Policy, X-XSS-Protection). O raiz-platform so tem `Cache-Control: no-store` nas APIs — os demais headers estao no middleware.ts.

---

## 14. Gaps Identificados

### Gaps Criticos no raiz-platform

| # | Gap | Impacto | Presente em rAIz-AI-Prof? |
|---|-----|---------|--------------------------|
| G1 | Sem dead code analysis (knip) | Codigo morto acumula, bundle cresce | Sim |
| G2 | Sem dependency check (depcheck) | Dependencies fantasma no package.json | Sim |
| G3 | Sem circular dependency detection (madge) | Bugs sutis, build lento | Sim |
| G4 | Sem TypeDoc/API docs generation | Onboarding lento, docs desatualizadas | Sim |
| G5 | Sem commitlint | Commits inconsistentes | Sim |
| G6 | ESLint 8 com config legado (.eslintrc) | Falta suporte a flat config, EOL | Sim (ESLint 9) |
| G7 | Sem script `typecheck` no package.json | Typecheck manual (inconsistente) | Sim (7 variantes) |
| G8 | Sem testes de a11y dedicados | Acessibilidade nao verificada | Sim |
| G9 | Sem Storybook | Desenvolvimento de componentes sem isolamento | Sim |

### Gaps no rAIz-AI-Prof

| # | Gap | Impacto | Presente em raiz-platform? |
|---|-----|---------|--------------------------|
| G10 | Sem scripts de clean cache | Cache stale pode causar bugs de dev | Sim |
| G11 | Sem bundle budget enforced | Chunks podem crescer sem controle | Sim (5MB/500KB) |
| G12 | Sem custom ESLint plugin | Nao pode enforcar padroes de UI | Sim (eslint-plugin-raiz) |
| G13 | Sem prompt testing | LLM prompts nao testados | Sim (promptfoo) |
| G14 | Sem scripts de migration | Migrations manuais | Sim |
| G15 | Sem pre-dev hook | Nao valida ambiente antes de iniciar | Sim |
| G16 | max-warnings=500 no ESLint | Permite acumulo de warnings | raiz-platform tem 0 |

---

## 15. Oportunidades Priorizadas

### P0 — Critico (impacto imediato na qualidade)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|----|-------------|---------|---------|---------|
| O1 | Adicionar script `typecheck` ao raiz-platform | raiz-platform | 5 min | Alto — CI gate |
| O2 | Instalar knip no raiz-platform | raiz-platform | 30 min | Alto — dead code |
| O3 | Migrar ESLint 8 -> 9 (flat config) no raiz-platform | raiz-platform | 2-4h | Alto — futureproof |
| O4 | Adicionar commitlint ao raiz-platform | raiz-platform | 30 min | Alto — padrao commits |

### P1 — Alto (melhoria significativa de DX)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|----|-------------|---------|---------|---------|
| O5 | Instalar depcheck no raiz-platform | raiz-platform | 15 min | Medio — cleanup deps |
| O6 | Instalar madge no raiz-platform | raiz-platform | 15 min | Medio — circular deps |
| O7 | Configurar TypeDoc no raiz-platform | raiz-platform | 1-2h | Alto — docs API |
| O8 | Implementar bundle budget no rAIz-AI-Prof | rAIz-AI-Prof | 30 min | Medio — controle size |
| O9 | Adicionar TSConfig multi-profile no raiz-platform | raiz-platform | 1h | Medio — CI speed |
| O10 | Reduzir ESLint max-warnings de 500 para 100 (rAIz-AI-Prof) | rAIz-AI-Prof | 2-4h | Medio — debt reducao |

### P2 — Medio (melhoria incremental)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|----|-------------|---------|---------|---------|
| O11 | Configurar Storybook no raiz-platform | raiz-platform | 4-8h | Medio — componentes |
| O12 | Adicionar testes a11y ao raiz-platform | raiz-platform | 2-4h | Medio — acessibilidade |
| O13 | Adicionar scripts clean ao rAIz-AI-Prof | rAIz-AI-Prof | 15 min | Baixo — DX |
| O14 | Cross-browser E2E no raiz-platform | raiz-platform | 1h | Medio — cobertura |
| O15 | Custom ESLint plugin no rAIz-AI-Prof | rAIz-AI-Prof | 4-8h | Medio — padroes |
| O16 | Atualizar TypeScript 5.7 -> 5.9 no raiz-platform | raiz-platform | 1-2h | Baixo — features novas |

### P3 — Baixo (nice-to-have / futuro)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|----|-------------|---------|---------|---------|
| O17 | Monorepo com packages compartilhados | Ambos | 1-2 semanas | Alto a longo prazo |
| O18 | Padronizar lazy-loaders no raiz-platform | raiz-platform | 4-8h | Medio — bundle |
| O19 | Pre-dev hook no rAIz-AI-Prof | rAIz-AI-Prof | 30 min | Baixo — DX |
| O20 | Prompt testing (promptfoo) no rAIz-AI-Prof | rAIz-AI-Prof | 2-4h | Medio — LLM quality |

---

## 16. Padroes Reusaveis

### Padrao 1: Lazy Loading de Libs Pesadas (rAIz-AI-Prof -> raiz-platform)

O padrao de `lib/lazy-loaders/` do rAIz-AI-Prof pode ser replicado no raiz-platform para libs como `echarts`, `mermaid`, `tesseract.js`, `remotion`, `pdfmake`:

```typescript
// Padrao: lazy loader com cache e status
let cachedModule: typeof import('echarts') | null = null;

export async function loadEcharts() {
  if (!cachedModule) {
    cachedModule = await import('echarts');
  }
  return cachedModule;
}

export function isEchartsLoaded(): boolean {
  return cachedModule !== null;
}

export function clearEchartsCache(): void {
  cachedModule = null;
}
```

### Padrao 2: TypeDoc Config (rAIz-AI-Prof -> raiz-platform)

```json
// typedoc.json para raiz-platform
{
  "entryPoints": [
    "src/lib/services/*.service.ts",
    "src/lib/db/repositories/*.repository.ts",
    "src/lib/agent/**/*.ts",
    "src/lib/mcp/**/*.ts"
  ],
  "entryPointStrategy": "expand",
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "excludePrivate": true,
  "excludeInternal": true,
  "name": "rAIz Platform - API Reference"
}
```

### Padrao 3: TSConfig Multi-Profile (rAIz-AI-Prof -> raiz-platform)

```json
// tsconfig.typecheck.json (para CI — rapido, sem strict penalizacao)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}

// tsconfig.incremental.json (para dev — incremental)
{
  "extends": "./tsconfig.typecheck.json",
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### Padrao 4: Bundle Budget Enforced (raiz-platform -> rAIz-AI-Prof)

O script `check-bundle.sh` do raiz-platform pode ser adaptado para Vite:

```bash
#!/bin/bash
MAX_BUNDLE_SIZE_KB=3000  # 3MB (SPA e menor)
MAX_CHUNK_SIZE_KB=500

BUNDLE_SIZE=$(du -sk dist/assets | cut -f1)
# ... mesma logica do raiz-platform
```

### Padrao 5: Commitlint Config (rAIz-AI-Prof -> raiz-platform)

O raiz-platform ja usa conventional commits por convencao mas nao enforca. Basta copiar:

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
# Copiar commitlint.config.cjs do rAIz-AI-Prof
# Adicionar hook no husky: npx commitlint --edit "$1"
```

---

## 17. Resumo de Maturidade DX

| Dimensao | raiz-platform | rAIz-AI-Prof | Vantagem |
|----------|:---:|:---:|:---:|
| Build System Config | 7/10 | 9/10 | rAIz-AI-Prof |
| Dev Server Speed | 5/10 | 9/10 | rAIz-AI-Prof |
| HMR | 7/10 | 9/10 | rAIz-AI-Prof |
| Bundle Analysis | 6/10 | 9/10 | rAIz-AI-Prof |
| Code Splitting | 6/10 | 9/10 | rAIz-AI-Prof |
| Dead Code Detection | 0/10 | 8/10 | rAIz-AI-Prof |
| API Docs Generation | 0/10 | 8/10 | rAIz-AI-Prof |
| Component Dev (Storybook) | 0/10 | 7/10 | rAIz-AI-Prof |
| Commit Enforcement | 0/10 | 9/10 | rAIz-AI-Prof |
| TypeCheck Profiles | 3/10 | 9/10 | rAIz-AI-Prof |
| ESLint Config | 5/10 | 8/10 | rAIz-AI-Prof |
| Bundle Budget | 8/10 | 4/10 | raiz-platform |
| E2E Coverage (modulos) | 9/10 | 6/10 | raiz-platform |
| Custom ESLint Rules | 7/10 | 0/10 | raiz-platform |
| Server-Side Build | 8/10 | N/A | raiz-platform |
| Prompt Testing | 7/10 | 0/10 | raiz-platform |
| Deploy Scripts | 6/10 | 7/10 | Empate |
| Security Headers | 5/10 | 9/10 | rAIz-AI-Prof |
| Clean/Cache Scripts | 7/10 | 2/10 | raiz-platform |
| **Media Geral** | **5.3/10** | **7.2/10** | **rAIz-AI-Prof** |

---

## 18. Arquivos-Chave Referenciados

### raiz-platform

| Arquivo | Descricao |
|---------|-----------|
| `D:/GitHub/raiz-platform/next.config.mjs` | Config principal Next.js + webpack + Sentry |
| `D:/GitHub/raiz-platform/package.json` | 35 scripts, 109 deps, 28 devDeps |
| `D:/GitHub/raiz-platform/tsconfig.json` | Unico profile (strict) |
| `D:/GitHub/raiz-platform/.eslintrc.json` | ESLint 8 legado + plugin custom |
| `D:/GitHub/raiz-platform/jest.config.js` | Jest + @swc/jest |
| `D:/GitHub/raiz-platform/playwright.config.ts` | 23 projetos E2E por modulo |
| `D:/GitHub/raiz-platform/vercel.json` | 16 crons, 8 functions config |
| `D:/GitHub/raiz-platform/scripts/check-bundle.sh` | Bundle size check (5MB/500KB) |
| `D:/GitHub/raiz-platform/postcss.config.js` | Tailwind 3 + Autoprefixer |
| `D:/GitHub/raiz-platform/.nvmrc` | Node 20.19.0 |

### rAIz-AI-Prof

| Arquivo | Descricao |
|---------|-----------|
| `D:/GitHub/rAIz-AI-Prof/vite.config.ts` | Config Vite 7 + Rollup + 16 manual chunks |
| `D:/GitHub/rAIz-AI-Prof/package.json` | 55 scripts, 43 deps, 37 devDeps |
| `D:/GitHub/rAIz-AI-Prof/tsconfig.json` | Strict (IDE) |
| `D:/GitHub/rAIz-AI-Prof/tsconfig.typecheck.json` | Relaxado (CI) |
| `D:/GitHub/rAIz-AI-Prof/tsconfig.incremental.json` | Incremental (dev speed) |
| `D:/GitHub/rAIz-AI-Prof/eslint.config.mjs` | ESLint 9 flat config + 6 plugins |
| `D:/GitHub/rAIz-AI-Prof/typedoc.json` | Config TypeDoc (DDD entry points) |
| `D:/GitHub/rAIz-AI-Prof/knip.json` | Dead code analysis config |
| `D:/GitHub/rAIz-AI-Prof/commitlint.config.cjs` | Conventional commits enforcement |
| `D:/GitHub/rAIz-AI-Prof/playwright.config.ts` | 6 projetos (3 browsers + 2 mobile) |
| `D:/GitHub/rAIz-AI-Prof/vercel.json` | SPA deploy + security headers completos |
| `D:/GitHub/rAIz-AI-Prof/lib/lazy-loaders/index.ts` | 5 lazy loaders centralizados |
| `D:/GitHub/rAIz-AI-Prof/postcss.config.cjs` | Tailwind 4 + Autoprefixer |
| `D:/GitHub/rAIz-AI-Prof/vite-serverless-plugin.ts` | Plugin custom para simular Vercel em dev |
