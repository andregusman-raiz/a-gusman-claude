# D11 -- Performance & Otimizacao

> Diagnostico cruzado entre **raiz-platform** (Next.js 14 / SSR) e **rAIz-AI-Prof** (Vite 7 / SPA).
> Data: 2026-03-01

---

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Tabela Comparativa](#2-tabela-comparativa)
3. [Bundle Strategy](#3-bundle-strategy)
4. [Lazy Loading & Code Splitting](#4-lazy-loading--code-splitting)
5. [Caching](#5-caching)
6. [PWA & Offline-First](#6-pwa--offline-first)
7. [Otimizacao de Imagens](#7-otimizacao-de-imagens)
8. [Performance Budgets](#8-performance-budgets)
9. [Fontes](#9-fontes)
10. [Prefetching & Preloading](#10-prefetching--preloading)
11. [SSR vs CSR -- Tradeoffs Praticos](#11-ssr-vs-csr--tradeoffs-praticos)
12. [Monitoramento de Performance (Web Vitals)](#12-monitoramento-de-performance-web-vitals)
13. [Gaps Identificados](#13-gaps-identificados)
14. [Oportunidades Priorizadas](#14-oportunidades-priorizadas)
15. [Padroes Reutilizaveis](#15-padroes-reutilizaveis)

---

## 1. Visao Geral

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Framework** | Next.js 14.2 (App Router) | Vite 7 + React 19 |
| **Renderizacao** | SSR / ISR / SSG (server-first) | CSR / SPA (client-first) |
| **Bundler** | Webpack 5 (via Next.js) | Rollup (via Vite) |
| **Cache server** | Upstash Redis + LRU in-memory | N/A (sem server proprio) |
| **Cache client** | Navegador + `unstable_cache` | Workbox SW + IndexedDB (Dexie) |
| **PWA** | Nao | Sim (vite-plugin-pwa / Workbox) |
| **Offline** | Nao | Sim (offline-queue, sync-queue) |
| **Deploy** | Vercel (serverless / edge) | Vercel (static + serverless) |

---

## 2. Tabela Comparativa

| Dimensao | raiz-platform | rAIz-AI-Prof | Veredito |
|----------|--------------|--------------|----------|
| **Bundle analyzer** | `@next/bundle-analyzer` (ANALYZE=true) | `rollup-plugin-visualizer` (ANALYZE_BUNDLE=true) | Ambos adequados |
| **Manual chunks** | Nao (webpack automatico) | Sim (17 chunks manuais detalhados) | rAIz superior |
| **Tree-shaking config** | `optimizePackageImports` (19 pacotes) | `sideEffects` em package.json + `dedupe` | Complementares |
| **Lazy loading** | `next/dynamic` (~40 usos) | `React.lazy` (~80+ usos) + `lazyWithFallback` | rAIz mais profundo |
| **Lazy loaders libs** | Nao (imports diretos) | 5 libs pesadas via `lib/lazy-loaders/` | rAIz superior |
| **Cache L1** | LRU in-memory (6 caches especializados) | N/A no server | raiz superior |
| **Cache L2** | Upstash Redis (distributed) | N/A | raiz superior |
| **Cache chain** | L1 memory -> L2 Redis (CacheChain) | N/A | raiz superior |
| **Cache metrics** | Tracked proxies (hit/miss/eviction) | N/A | raiz superior |
| **Cache client** | Navegador padrao | Workbox (5 estrategias runtime) | rAIz superior |
| **Offline data** | N/A | IndexedDB (Dexie) - 9 tabelas | rAIz exclusivo |
| **Sync queue** | N/A | 2 filas (offline-queue + sync-queue) | rAIz exclusivo |
| **PWA** | Nao | Sim (manifest, SW, runtime caching) | rAIz exclusivo |
| **Image opt** | `next/image` (AVIF/WebP, device sizes) | `OptimizedImage` + `BlurHashImage` | Complementares |
| **Font opt** | Next.js font optimization (auto) | `preconnect` manual p/ Google Fonts | raiz melhor |
| **Prefetch** | Next.js Link prefetch (auto) | `usePrefetch` hook (manual, vazio) | raiz melhor |
| **Bundle budget** | 5MB total / 500KB chunk | 500KB chunk warning | Ambos definidos |
| **Web Vitals** | `@vercel/speed-insights` + PostHog | `web-vitals` lib + Sentry + analytics | rAIz mais completo |
| **Perf service** | Basico (reportWebVitals) | Completo (component render, resource timing, reports) | rAIz superior |
| **Console removal** | removeConsole prod (log/debug/trace) | Nao | raiz melhor |
| **Source maps** | `hidden` (Sentry upload) | `hidden` (Sentry upload) | Iguais |
| **Minificacao** | Webpack/SWC (padrao Next.js) | esbuild (mais rapido que terser) | rAIz mais rapido |
| **CSS code split** | Sim (padrao Next.js) | Sim (`cssCodeSplit: true`) | Iguais |
| **Server externals** | 20+ pacotes pesados externalizados | N/A (sem server bundle) | raiz exclusivo |
| **Build target** | ES2022 (via Next.js) | ES2022 (`target: 'es2022'`) | Iguais |
| **Rate limiting** | Redis (3 tiers: basic/standard/expensive) | N/A | raiz exclusivo |

---

## 3. Bundle Strategy

### 3.1 raiz-platform (Webpack)

**Arquivo**: `D:/GitHub/raiz-platform/next.config.mjs`

Estrategia baseada no webpack automatico do Next.js com otimizacoes adicionais:

- **`optimizePackageImports`**: 19 pacotes com tree-shaking forcado (LLM SDKs: ~355KB economia; UI libs: Radix, Recharts, Lucide)
- **`serverComponentsExternalPackages`**: 20+ pacotes pesados externalizados do bundle serverless (OTel ~51MB, Sentry, Sharp, Tesseract, etc.)
- **`outputFileTracingExcludes`**: Exclusao agressiva de ~540MB de arquivos nao necessarios em runtime
- **`removeConsole`**: Remove `console.log/debug/trace` em producao (~30KB economia)
- **Bundle analyzer**: `@next/bundle-analyzer` ativado via `ANALYZE=true`
- **Bundle check script**: `scripts/check-bundle.sh` com limites 5MB total / 500KB por chunk

```javascript
// next.config.mjs - Externalizacao de pacotes pesados
serverComponentsExternalPackages: [
  '@opentelemetry/auto-instrumentations-node', // ~51MB
  'sharp', 'tesseract.js', 'mssql', 'firebase-admin',
  'pdfmake', 'exceljs', 'docx', 'pptxgenjs',
  // ... 20+ pacotes
]
```

**Pontos fortes**: Externalizacao server-side agressiva; tree-shaking granular por pacote; budget de 5MB com script de verificacao automatizada.

**Gaps**: Nao ha manual chunks -- depende totalmente do webpack automatico. Nao ha chunk splitting por categoria de vendor.

### 3.2 rAIz-AI-Prof (Rollup)

**Arquivo**: `D:/GitHub/rAIz-AI-Prof/vite.config.ts`

Estrategia com manual chunks extremamente granulares:

- **17 vendor chunks categorizados**: `vendor-react`, `vendor-ui`, `vendor-state`, `vendor-supabase`, `vendor-heavy`, `vendor-animation`, `vendor-charts`, `vendor-lottie`, `vendor-database`, `vendor-validation`, `vendor-icons`, `vendor-utils`, `vendor-i18n`, `vendor-monitoring`, `vendor-misc`
- **`sideEffects`** declarado em package.json para tree-shaking correto
- **`resolve.dedupe`**: Previne duplicacao de `scheduler`, `react`, `react-dom`, `react-is`
- **`resolve.alias`**: Forca scheduler para uma unica copia (corrige bug de duplicacao)
- **`optimizeDeps.include`**: Pre-empacota 9 dependencias criticas
- **`optimizeDeps.exclude`**: Sentry excluido (lazy loaded)
- **Chunk warning**: 500KB limite
- **Minificacao**: esbuild (mais rapido que terser)
- **Bundle analyzer**: `rollup-plugin-visualizer` com gzip/brotli sizes

```javascript
// vite.config.ts - Manual chunks categorizados
manualChunks: (id) => {
  if (id.includes('node_modules/react/')) return 'vendor-react';
  if (id.includes('node_modules/@radix-ui/')) return 'vendor-ui';
  if (id.includes('node_modules/plotly.js') || id.includes('node_modules/mathjs/'))
    return 'vendor-heavy';
  // ... 17 categorias
}
```

**Pontos fortes**: Controle granular sobre chunks permite cache invalidation cirurgico. Chunks pesados (`vendor-heavy` com plotly+mathjs ~6MB) sao excluidos do precache do SW. Resolver alias para evitar duplicacao.

**Gaps**: Nao ha budget total do bundle (apenas por chunk). `reportCompressedSize: false` desabilita calculo de tamanho comprimido.

---

## 4. Lazy Loading & Code Splitting

### 4.1 raiz-platform

**Padrao**: `next/dynamic` com `ssr: false` para componentes client-only.

**Arquivo**: Multiplos (40+ usos identificados)

Exemplos encontrados:
- `D:/GitHub/raiz-platform/src/app/page.tsx` - 6 componentes dynamicos (ChatView, AutomationPanel, JarvisOrb, etc.)
- `D:/GitHub/raiz-platform/src/components/chat/ChatViewPanels.tsx` - 9 paineis dinamicos
- `D:/GitHub/raiz-platform/src/components/bi/GraphicWalkerExplorer.tsx` - GraphicWalker
- `D:/GitHub/raiz-platform/src/components/content-studio/*.tsx` - ImageCreator, ChartCreator, VideoCreator

```typescript
// Padrao tipico em raiz-platform
const ChartPanel = dynamic(
  () => import('./ChartPanel').then(m => ({ default: m.ChartPanel })),
  { ssr: false }
);
```

**Profundidade**: Route-level e component-level. Nao ha lazy loading de bibliotecas pesadas (imports diretos de echarts, recharts, mermaid, etc.).

### 4.2 rAIz-AI-Prof

**Padrao**: `React.lazy` com `lazyWithFallback` (error handling integrado) + lazy loaders para libs.

**Arquivos**:
- `D:/GitHub/rAIz-AI-Prof/routes/lazyPages.tsx` - 80+ paginas lazy com error fallback
- `D:/GitHub/rAIz-AI-Prof/components/LazyComponents.tsx` - Componentes pesados lazy
- `D:/GitHub/rAIz-AI-Prof/lib/lazy-loaders/` - 5 bibliotecas pesadas com lazy loading

```typescript
// routes/lazyPages.tsx - Lazy com fallback de erro
function lazyWithFallback<T>(importFn: () => Promise<{ default: T }>, moduleName: string) {
  return lazy(() =>
    importFn().catch((err) => {
      console.error(`[LazyLoad] Falha ao carregar ${moduleName}:`, err);
      return { default: LazyLoadError as unknown as T };
    })
  );
}
```

**Lazy loaders para bibliotecas pesadas**:

| Biblioteca | Arquivo | Tamanho Estimado |
|-----------|---------|-----------------|
| jsPDF | `lib/lazy-loaders/pdfExporter.ts` | ~500KB |
| PptxGenJS | `lib/lazy-loaders/pptxGenerator.ts` | ~300KB |
| html2canvas | `lib/lazy-loaders/html2canvas.ts` | ~200KB |
| docx | `lib/lazy-loaders/docx.lazy.ts` | ~250KB |
| mathjs | `lib/lazy-loaders/mathjs.lazy.ts` | ~600KB |

```typescript
// lib/lazy-loaders/index.ts - Pre-carregamento seletivo
export async function preloadHeavyLibraries(): Promise<void> {
  await Promise.all([
    loadJsPDF(), loadPptxGenJS(), loadHtml2Canvas(), loadDocx()
    // MathJS NAO e pre-carregado (usado apenas em funcoes matematicas)
  ]);
}
```

**Profundidade**: 3 niveis de lazy loading: (1) rotas, (2) componentes, (3) bibliotecas. Sistema mais profundo e robusto que raiz-platform.

---

## 5. Caching

### 5.1 raiz-platform -- Redis + LRU (Server-Side)

**Arquivos**:
- `D:/GitHub/raiz-platform/src/lib/cache/redis.ts` -- Redis + fallback LRU
- `D:/GitHub/raiz-platform/src/lib/cache/memory.ts` -- 6 caches LRU especializados com metricas
- `D:/GitHub/raiz-platform/src/lib/cache/provider.ts` -- Cache chain interface (L1 -> L2)
- `D:/GitHub/raiz-platform/src/lib/cache/index.ts` -- Barrel exports

**Arquitetura de cache em 3 camadas**:

```
L0: Next.js unstable_cache (server cache tags)
    |
L1: LRU in-memory (6 caches especializados, sobrevive HMR via globalThis)
    |
L2: Upstash Redis (distributed, fallback para L1 se indisponivel)
```

**Caches LRU especializados**:

| Cache | Max Items | TTL | Max Size |
|-------|----------|-----|----------|
| `queryEmbeddingCache` | 1.000 | 1h | 50MB |
| `configCache` | 1.000 | 5min | -- |
| `documentMetaCache` | 1.000 | 30min | -- |
| `embeddingProviderCache` | 50 | 10min | -- |
| `ragFolderCache` | 500 | 15min | -- |
| `workspaceCache` | 500 | 10min | -- |

**Cache chain pattern** (`CacheProvider` interface):
```typescript
// provider.ts - Tiered cache
class CacheChain implements CacheProvider {
  async get<T>(key: string): Promise<T | null> {
    for (let i = 0; i < this.providers.length; i++) {
      const value = await this.providers[i].get<T>(key);
      if (value !== null) {
        // Back-fill camadas mais rapidas (fire-and-forget)
        for (let j = 0; j < i; j++) {
          this.providers[j].set(key, value).catch(() => undefined);
        }
        return value;
      }
    }
    return null;
  }
}
```

**Caches funcionais adicionais**:
- User role cache (TTL 5min, Redis)
- Module access cache (TTL 5min, Redis)
- Registry cache (tools, mcps, apis, modes -- TTL 5min, Redis)
- Session cache (TTL 15min, Redis)

**Monitoramento**: Tracked proxies via `Proxy` que contam hits, misses, evictions e sets para cada cache. Endpoint `/api/cache/stats` expoe metricas.

**Rate limiting**: 3 tiers via `@upstash/ratelimit`:
- `basic`: 100 req/min (GET)
- `standard`: 30 req/min (POST/PATCH/DELETE)
- `expensive`: 10 req/min (operacoes AI)

### 5.2 rAIz-AI-Prof -- Workbox + IndexedDB (Client-Side)

**Arquivos**:
- `D:/GitHub/rAIz-AI-Prof/vite.config.ts` -- Workbox config
- `D:/GitHub/rAIz-AI-Prof/dev-dist/sw.js` -- Service worker gerado
- `D:/GitHub/rAIz-AI-Prof/lib/storage/indexeddb.ts` -- Dexie wrapper (9 tabelas)
- `D:/GitHub/rAIz-AI-Prof/lib/offline/offline-queue.ts` -- Fila offline com sync
- `D:/GitHub/rAIz-AI-Prof/lib/storage/sync-queue.ts` -- Fila de sincronizacao

**Workbox runtime caching strategies**:

| Pattern | Estrategia | Cache Name | TTL | Max Entries |
|---------|-----------|------------|-----|-------------|
| `fonts.googleapis.com` | CacheFirst | `google-fonts-cache` | 1 ano | 10 |
| `fonts.gstatic.com` | CacheFirst | `gstatic-fonts-cache` | 1 ano | 10 |
| `*.png/jpg/svg/webp` | CacheFirst | `images-cache` | 30 dias | 100 |
| `*.supabase.co/storage` | CacheFirst | `supabase-storage-cache` | 7 dias | 50 |
| `/api/mathroots/*` | NetworkFirst | `mathroots-api-cache` | 1 dia | 100 |

**Workbox precache**:
- Arquivos estaticos (js, css, html, ico, png, svg, woff, woff2)
- Limite por arquivo: 2MB
- **Excluidos**: `vendor-heavy-*.js` (~6MB), `vendor-misc-*.js` (~3MB), `vendor-monitoring-*.js`

**IndexedDB (Dexie)**:

9 tabelas com indices completos:

| Tabela | Indices | Uso |
|--------|---------|-----|
| `questions` | id, subject, grade, bnccCode, tags | Banco de questoes |
| `lessonPlans` | id, subject, grade, title | Planos de aula |
| `peis` | id, studentId, studentName | Documentos PEI |
| `games` | id, type, shareId | Jogos educacionais |
| `presentations` | id, title | Apresentacoes |
| `mindmaps` | id, title | Mapas mentais |
| `logs` | id, timestamp, level, category, synced | Logs estruturados |
| `syncQueue` | id, table, operation, retries | Fila de sync |
| `keyValue` | key | Armazenamento generico |

**Offline queue**: 2 sistemas paralelos:
1. `OfflineQueue` (`lib/offline/offline-queue.ts`) -- operacoes com prioridade e auto-sync on reconnect
2. `SyncQueue` (`lib/storage/sync-queue.ts`) -- sync com retry, batch processing, listeners online/offline

---

## 6. PWA & Offline-First

### 6.1 raiz-platform

**Status**: Nao implementado. Nao ha service worker, manifest, nem offline support.

**Justificativa**: Aplicacao SSR empresarial (40+ escolas) que depende de dados frescos do servidor. Usuarios tipicamente conectados. Cache server-side via Redis resolve latencia.

### 6.2 rAIz-AI-Prof

**Status**: Implementado com `vite-plugin-pwa` + Workbox.

**Arquivos**:
- `D:/GitHub/rAIz-AI-Prof/vite.config.ts` (linhas 29-132) -- Config completa
- `D:/GitHub/rAIz-AI-Prof/index.html` -- PWA meta tags
- `D:/GitHub/rAIz-AI-Prof/dev-dist/sw.js` -- Service worker gerado

**Caracteristicas**:
- **Register type**: `autoUpdate` -- SW atualiza automaticamente sem prompt
- **Display mode**: `browser` (nao solicita instalacao)
- **Precache**: Arquivos estaticos com hash, excluindo chunks pesados
- **Runtime cache**: 5 estrategias (fonts, imagens, storage, API)
- **Navigation route**: SPA fallback para `index.html`
- **Dev mode**: PWA desabilitado para nao conflitar com HMR

**Meta tags PWA** (`index.html`):
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">
<link rel="manifest" href="/manifest.json">
```

**Icones**: 192x192 e 512x512 com purpose `any maskable`.

**Offline queue + auto-sync**: Quando conexao cai, operacoes sao enfileiradas em IndexedDB. Quando volta online, `window.addEventListener('online', ...)` dispara processamento automatico da fila.

---

## 7. Otimizacao de Imagens

### 7.1 raiz-platform -- next/image

**Arquivo**: `D:/GitHub/raiz-platform/next.config.mjs` (linhas 188-206)

```javascript
images: {
  formats: ['image/avif', 'image/webp'], // AVIF prioritario, WebP fallback
  deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Breakpoints responsivos
  imageSizes: [16, 32, 48, 64, 96, 128, 256], // Tamanhos de icones
  remotePatterns: [
    { hostname: 'lh3.googleusercontent.com' },
    { hostname: '*.googleusercontent.com' },
    { hostname: 'drive.google.com' },
  ],
}
```

**Pontos fortes**: AVIF automatico (~50% menor que WebP); responsive srcset automatico; otimizacao on-demand via Sharp; blur placeholder nativo.

**Uso no codigo**: 7 arquivos usando `next/image` (componentes Google Drive, Contacts, etc.).

**Gap**: Poucos usos de `next/image` para um projeto deste tamanho. Muitas imagens provavelmente usam `<img>` sem otimizacao.

### 7.2 rAIz-AI-Prof -- OptimizedImage + BlurHash

**Arquivos**:
- `D:/GitHub/rAIz-AI-Prof/components/common/OptimizedImage.tsx`
- `D:/GitHub/rAIz-AI-Prof/components/animation/blurhash/BlurHashImage.tsx`

**OptimizedImage** -- componente leve:
- `loading="lazy"` por padrao
- `decoding="async"` para decode nao-bloqueante
- Skeleton placeholder com animacao pulse
- Transicao fade-in suave
- Error state com icone broken
- Dark mode support

**BlurHashImage** -- componente avancado:
- Placeholder BlurHash gerado server-side
- Decode via canvas (32x32px, memoizado)
- `loading="lazy"` por padrao
- Transicao suave (300ms)
- Aspect ratio support
- Fallback colorido se nao tiver hash

```typescript
// BlurHashImage.tsx - Decode eficiente do blur placeholder
const placeholderUrl = useMemo(() => {
  if (!blurHash) return '';
  return blurHashToDataURL(blurHash, 32, 32, punch);
}, [blurHash, punch]);
```

**Pontos fortes**: BlurHash elimina CLS; decode async evita jank; componentes reutilizaveis com API ergonomica.

**Gap**: Sem conversao AVIF/WebP automatica (nao tem processamento server-side de imagens). Sem responsive srcset.

---

## 8. Performance Budgets

### 8.1 raiz-platform

**Arquivo**: `D:/GitHub/raiz-platform/scripts/check-bundle.sh`

| Budget | Valor | Verificacao |
|--------|-------|-------------|
| Total bundle | 5.000 KB (5MB) | `du -sk .next/static` |
| Maior chunk | 500 KB | `ls -lS .next/static/chunks/*.js` |

Script automatizado com output colorido, top 5 chunks, e sugestoes se falhar. Executado via `npm run build:check`.

### 8.2 rAIz-AI-Prof

**Arquivo**: `D:/GitHub/rAIz-AI-Prof/vite.config.ts`

| Budget | Valor | Verificacao |
|--------|-------|-------------|
| Chunk warning | 500 KB | `chunkSizeWarningLimit: 500` |
| Precache max | 2 MB | `maximumFileSizeToCacheInBytes` |
| Total bundle | N/A (nao definido) | -- |

**Gap**: Nao ha budget total do bundle nem script automatizado. Apenas warning por chunk.

---

## 9. Fontes

### 9.1 raiz-platform

- Otimizacao automatica via Next.js font system
- Nenhum `<link>` externo no `layout.tsx` (font inlined ou subsetted automaticamente)
- Font-face gerado pelo Next.js com `font-display: swap` implicito
- CSS class `font-sans` no `<body>`

### 9.2 rAIz-AI-Prof

**Arquivo**: `D:/GitHub/rAIz-AI-Prof/index.html`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- `preconnect` para DNS/TLS antecipado (correto)
- Google Fonts via CSS externo (nao otimizado pelo Vite)
- `display=swap` para evitar FOIT
- Workbox caching CacheFirst (1 ano TTL) para fonts

**Gap**: Nao usa font subsetting (carrega 5 pesos). Nao tem font inlining. Poderia usar `@fontsource/inter` para self-hosting e evitar request externo.

---

## 10. Prefetching & Preloading

### 10.1 raiz-platform

- **Next.js Link prefetch**: Automatico para todos os `<Link>` visiveis no viewport
- **Syntax highlighter preload**: `import('shiki')` com prefetch em `syntax-highlighter.service.ts`
- **Sem resource hints manuais**: Nenhum `<link rel="preload">` ou `dns-prefetch` encontrado

### 10.2 rAIz-AI-Prof

**Arquivo**: `D:/GitHub/rAIz-AI-Prof/hooks/usePrefetch.ts`

```typescript
// Hook para prefetch on hover
export function usePrefetch(moduleKey: string) {
  const handlePrefetch = useCallback(() => {
    prefetchModule(moduleKey); // Usa requestIdleCallback
  }, [moduleKey]);
  return { onMouseEnter: handlePrefetch, onFocus: handlePrefetch };
}
```

**Status**: Hook implementado mas `MODULE_MAP` esta **vazio** -- nenhum modulo registrado para prefetch.

**`useAutoPrefetch`**: Implementado mas corpo vazio (`// No modules currently registered`).

**`preloadHeavyLibraries()`**: Funcional em `lib/lazy-loaders/index.ts` -- pre-carrega jsPDF, PptxGenJS, html2canvas, docx.

**Resource hints no HTML**:
- `preconnect` para Google Fonts (2 hints)
- Nenhum `dns-prefetch` para Supabase, Sentry, etc.

---

## 11. SSR vs CSR -- Tradeoffs Praticos

| Aspecto | raiz-platform (SSR) | rAIz-AI-Prof (CSR/SPA) |
|---------|--------------------|-----------------------|
| **First paint** | Rapido (HTML do servidor) | Lento (JS precisa carregar primeiro) |
| **TTI** | Pode ser lento (hydration) | Mais previsivel (sem hydration) |
| **SEO** | Excelente (HTML completo) | Requer pre-rendering (robots: noindex) |
| **Waterfall** | Server fetch + HTML | HTML -> JS -> API calls |
| **Cache** | Redis + ISR (revalidate) | Service Worker + IndexedDB |
| **Cold start** | Serverless cold start (Vercel) | Sem cold start (static) |
| **Offline** | Impossivel (depende do server) | Possivel (PWA + IndexedDB) |
| **Bundle** | Server + Client bundles separados | Bundle unico (tudo no cliente) |
| **Data freshness** | Imediata (server fetch) | Depende de revalidacao |
| **Server cost** | Maior (compute por request) | Menor (static hosting + serverless APIs) |

**Implicacoes praticas**:

1. **raiz-platform** se beneficia de SSR porque: dados sensiveis (RLS), SEO nao relevante (app interno), cache server-side eficiente, streaming responses para LLM.

2. **rAIz-AI-Prof** se beneficia de CSR porque: professores em escolas com internet instavel (offline-first), conteudo gerado localmente (questoes, planos), PWA para mobile, custo de servidor reduzido.

---

## 12. Monitoramento de Performance (Web Vitals)

### 12.1 raiz-platform

**Arquivos**:
- `D:/GitHub/raiz-platform/src/lib/monitoring/web-vitals.ts`
- `D:/GitHub/raiz-platform/src/app/layout.tsx` (SpeedInsights)

**Implementacao**:
- `reportWebVitals()` via Next.js `NextWebVitalsMetric`
- Rating (good/needs-improvement/poor) com thresholds Google
- Envio para PostHog via `trackEvent('web_vitals', ...)`
- `@vercel/speed-insights` no layout (RUM automatico)
- Log colorido em dev (warn para poor, info para needs-improvement)

### 12.2 rAIz-AI-Prof

**Arquivos**:
- `D:/GitHub/rAIz-AI-Prof/lib/monitoring/web-vitals.ts`
- `D:/GitHub/rAIz-AI-Prof/lib/performance/performance.service.ts`

**Web Vitals** (`web-vitals.ts`):
- Lazy load da lib `web-vitals` (nao impacta bundle inicial)
- 5 metricas: LCP, INP, CLS, FCP, TTFB
- Report para Sentry (import dinamico)
- Eventos analytics para metricas "poor"
- API publica: `getReportedMetrics()`, `areVitalsHealthy()`, `getVitalsSummary()`

**Performance Service** (`performance.service.ts`):
- PerformanceObserver nativo para LCP, FID, CLS
- Navigation Timing para FCP, TTFB
- **Component render tracking**: `recordComponentRender()` -- conta renders, tempo medio, razoes de re-render
- **Resource timing**: `collectResourceTimings()` -- transfer size, cached status
- **Page performance**: load time, DOM interactive, resource count, JS heap size
- **Performance reports**: `generateReport()` com p50/p75/p95, top slow pages, top errors
- **Error tracking**: global error + unhandled rejection listeners
- **Metrics flush**: envio periodico para endpoint configurado

**Conclusao**: rAIz-AI-Prof tem sistema de monitoramento significativamente mais completo, incluindo component-level profiling e resource timing.

---

## 13. Gaps Identificados

### raiz-platform

| # | Gap | Impacto | Severidade |
|---|-----|---------|------------|
| R1 | Nao tem manual chunks -- webpack decide tudo automaticamente | Cache invalidation subotimo | Media |
| R2 | Nao tem lazy loading de bibliotecas pesadas (echarts, mermaid, recharts importados diretamente) | Bundle inicial pesado | Alta |
| R3 | Poucos usos de `next/image` (7 arquivos) para projeto com muitas imagens | CLS, LCP degradados | Media |
| R4 | Nao tem PWA nem offline support | Indisponivel sem internet | Baixa (app interno) |
| R5 | Nao tem component-level performance profiling | Dificulta otimizacao de renders | Baixa |
| R6 | Nao tem resource timing collection | Nao identifica recursos lentos | Baixa |
| R7 | Sem `dns-prefetch` para servicos externos (Supabase, Sentry, APIs Google) | TTFB de requests externas | Baixa |
| R8 | `unstable_cache` sem versionamento de tags | Cache stale apos deploy | Media |
| R9 | LRU caches sem persistencia (perdem estado no restart) | Cache miss storm pos-deploy | Media |
| R10 | Console removal nao remove `console.info` (mantido para logger) | ~10KB extra desnecessarios em producao | Baixa |

### rAIz-AI-Prof

| # | Gap | Impacto | Severidade |
|---|-----|---------|------------|
| A1 | Sem budget total do bundle (apenas por chunk) | Regressao de tamanho nao detectada | Media |
| A2 | `usePrefetch` hook implementado mas `MODULE_MAP` vazio | Prefetch nao funciona | Media |
| A3 | `useAutoPrefetch` implementado mas corpo vazio | Auto-prefetch nao funciona | Media |
| A4 | Google Fonts via CSS externo (nao self-hosted) | Request adicional, FOUT | Media |
| A5 | Sem AVIF/WebP automatico para imagens | Imagens maiores que necessario | Media |
| A6 | 2 sistemas de offline queue paralelos (OfflineQueue + SyncQueue) | Complexidade desnecessaria, possivel conflito | Alta |
| A7 | `reportCompressedSize: false` -- nao calcula tamanho comprimido | Nao sabe o tamanho real servido | Baixa |
| A8 | Sem `dns-prefetch` para Supabase, Sentry | TTFB de requests externas | Baixa |
| A9 | Console removal nao configurado | Logs em producao | Baixa |
| A10 | Performance service nao integrado com React Profiler API | Perda de granularidade em profiling | Baixa |

---

## 14. Oportunidades Priorizadas

### P0 -- Criticas (fazer agora)

| ID | Projeto | Oportunidade | Beneficio Estimado | Arquivos |
|----|---------|-------------|-------------------|----------|
| P0-1 | raiz-platform | Lazy loading de echarts, recharts, mermaid, reactflow | -500KB a -1MB do bundle inicial | `next.config.mjs`, componentes que importam essas libs |
| P0-2 | rAIz-AI-Prof | Unificar OfflineQueue + SyncQueue em um unico sistema | Elimina complexidade e bugs de estado duplicado | `lib/offline/offline-queue.ts`, `lib/storage/sync-queue.ts` |

### P1 -- Importantes (proxima sprint)

| ID | Projeto | Oportunidade | Beneficio Estimado | Arquivos |
|----|---------|-------------|-------------------|----------|
| P1-1 | raiz-platform | Implementar lazy loaders para libs pesadas (padrao rAIz) | -800KB+ do bundle | Criar `src/lib/lazy-loaders/` |
| P1-2 | rAIz-AI-Prof | Implementar budget total do bundle com script automatizado | Previne regressoes | Criar `scripts/check-bundle.sh` |
| P1-3 | rAIz-AI-Prof | Popular `MODULE_MAP` no usePrefetch com rotas frequentes | Reducao de latencia percebida | `hooks/usePrefetch.ts`, `routes/lazyPages.tsx` |
| P1-4 | rAIz-AI-Prof | Self-host Inter via `@fontsource/inter` | -100ms TTFB de fonts, funciona offline | `index.html`, `package.json` |
| P1-5 | raiz-platform | Expandir uso de `next/image` em componentes existentes | Melhora LCP e CLS | Componentes com `<img>` |
| P1-6 | ambos | Adicionar `dns-prefetch` para servicos externos | -50ms por primeiro request | `layout.tsx`, `index.html` |

### P2 -- Melhorias (backlog)

| ID | Projeto | Oportunidade | Beneficio Estimado | Arquivos |
|----|---------|-------------|-------------------|----------|
| P2-1 | raiz-platform | Manual chunks no webpack config para vendor splitting | Cache granular por categoria | `next.config.mjs` webpack config |
| P2-2 | raiz-platform | Component-level performance profiling (portar padrao rAIz) | Identifica renders lentos | Criar `src/lib/monitoring/performance.service.ts` |
| P2-3 | rAIz-AI-Prof | Implementar image processing pipeline (sharp em serverless) | AVIF/WebP automatico | `api/` serverless functions |
| P2-4 | rAIz-AI-Prof | Integrar React Profiler API no performance service | Profiling mais granular | `lib/performance/performance.service.ts` |
| P2-5 | raiz-platform | Adicionar resource timing collection | Identifica recursos lentos | `src/lib/monitoring/` |
| P2-6 | ambos | Console removal em producao (rAIz nao tem) | -10-30KB | `vite.config.ts` (esbuild.drop) |

### P3 -- Nice-to-Have (futuro)

| ID | Projeto | Oportunidade | Beneficio Estimado | Arquivos |
|----|---------|-------------|-------------------|----------|
| P3-1 | raiz-platform | PWA lite (apenas cache de assets, sem offline full) | Reduz requests repetidos | Criar SW minimal |
| P3-2 | raiz-platform | LRU cache persistencia (serialize para Redis periodicamente) | Elimina cache miss storm | `src/lib/cache/memory.ts` |
| P3-3 | rAIz-AI-Prof | Background sync API (em vez de listener manual) | Sync mais confiavel | `lib/offline/`, `lib/storage/` |
| P3-4 | ambos | Lighthouse CI no pipeline de PR | Budget enforcement automatico | `.github/workflows/` |
| P3-5 | rAIz-AI-Prof | Streaming rendering com React 19 Suspense boundaries | Melhor percecao de velocidade | Routes, layouts |
| P3-6 | raiz-platform | Edge caching com stale-while-revalidate headers | Reduz latencia para endpoints frequentes | `middleware.ts` |

---

## 15. Padroes Reutilizaveis

### 15.1 Lazy Loader Pattern (rAIz -> raiz)

O padrao de `lib/lazy-loaders/` do rAIz-AI-Prof e transferivel para raiz-platform:

```typescript
// Padrao generico para lazy loading de bibliotecas pesadas
let cached: ModuleType | null = null;

export async function loadHeavyLib(): Promise<ModuleType> {
  if (cached) return cached;
  const mod = await import('heavy-lib');
  cached = mod;
  return mod;
}

export function isLoaded(): boolean { return cached !== null; }
export function clearCache(): void { cached = null; }
```

**Candidatos em raiz-platform**: echarts (~1MB), recharts (~300KB), mermaid (~500KB), reactflow (~200KB), konva (~300KB), shiki (~400KB).

### 15.2 Cache Chain Pattern (raiz -> rAIz)

O padrao `CacheProvider` + `CacheChain` do raiz-platform e transferivel como pattern client-side:

```typescript
// L1: Memory Map -> L2: IndexedDB -> L3: Network
const clientChain = new CacheChain([
  new MemoryMapProvider(), // Cache em Map() para dados da sessao
  new IndexedDBProvider(), // Cache persistente local
]);
```

### 15.3 lazyWithFallback Pattern (rAIz -> raiz)

O padrao de `lazyWithFallback` com error handling e transferivel para `next/dynamic`:

```typescript
// Padrao para Next.js dynamic com error handling
const DynamicComponent = dynamic(
  () => import('./Component').catch(err => {
    console.error('[DynamicLoad] Failed:', err);
    return { default: ErrorFallback };
  }),
  { ssr: false, loading: () => <Skeleton /> }
);
```

### 15.4 Tracked Cache Pattern (raiz -> rAIz)

O padrao de Proxy para metricas de cache do raiz-platform e transferivel:

```typescript
// Proxy que intercepta get/set para contar metricas
function tracked<K, V>(name: string, cache: Map<K, V>): Map<K, V> {
  return new Proxy(cache, {
    get(target, prop) {
      if (prop === 'get') return (key: K) => { /* count hit/miss */ };
      if (prop === 'set') return (key: K, val: V) => { /* count sets */ };
      return Reflect.get(target, prop);
    }
  });
}
```

### 15.5 Performance Service Pattern (rAIz -> raiz)

O `performance.service.ts` completo do rAIz-AI-Prof (component render tracking, resource timing, reports) seria valioso no raiz-platform para identificar bottlenecks de rendering e recursos pesados no server-rendered app.

---

## Resumo Executivo

| Dimensao | Vencedor | Motivo |
|----------|----------|--------|
| **Bundle strategy** | rAIz-AI-Prof | 17 manual chunks categorizados vs webpack automatico |
| **Lazy loading** | rAIz-AI-Prof | 3 niveis (rotas + componentes + libs) com error fallback |
| **Server caching** | raiz-platform | Redis + LRU chain com metricas e rate limiting |
| **Client caching** | rAIz-AI-Prof | Workbox + IndexedDB com sync queue offline |
| **PWA/Offline** | rAIz-AI-Prof | Unico com suporte offline completo |
| **Image optimization** | raiz-platform | AVIF/WebP automatico via next/image |
| **BlurHash** | rAIz-AI-Prof | Componente BlurHash dedicado |
| **Font optimization** | raiz-platform | Font inlining automatico do Next.js |
| **Prefetching** | raiz-platform | Link prefetch automatico (mas rAIz tem hook pronto, so nao populado) |
| **Performance budgets** | raiz-platform | Script automatizado com budget total + por chunk |
| **Performance monitoring** | rAIz-AI-Prof | Service completo com component profiling e reports |
| **Tree-shaking** | Empate | Abordagens complementares ambas eficazes |

**Conclusao**: Os projetos sao fortemente complementares em suas estrategias de performance. raiz-platform excele em caching server-side e otimizacoes de build/deploy (SSR, image opt, font opt), enquanto rAIz-AI-Prof excele em otimizacoes client-side (code splitting granular, lazy loading profundo, offline-first, PWA, performance profiling). A transferencia de padroes entre projetos (5 padroes identificados) pode beneficiar ambos significativamente.
