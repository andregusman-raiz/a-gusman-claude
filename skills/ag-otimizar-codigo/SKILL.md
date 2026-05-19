---
name: ag-otimizar-codigo
description: "Otimizacao de performance e legibilidade. Mede antes e depois. Nao otimiza sem medir. Use when optimizing code performance."
model: sonnet
argument-hint: "[modulo ou area a otimizar]"
disable-model-invocation: true
---

# ag-otimizar-codigo — Otimizar Codigo

Spawn the `ag-otimizar-codigo` agent to optimize code performance with before/after measurements.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-otimizar-codigo`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Area: [module or area to optimize from $ARGUMENTS]
Benchmark: [specific metric if provided, otherwise "auto-detect"]


## Output
- Metricas antes/depois: bundle size, render time, API latency, Lighthouse scores
- Relatorio de delta com melhorias documentadas
- Codigo otimizado com commits por otimizacao

Regra de ouro: "Otimizar sem medir e adivinhar."
1. Medir ANTES (bundle size, render time, API latency, Lighthouse, etc.)
2. Identificar gargalo
3. Otimizar
4. Medir DEPOIS
5. Comparar e reportar delta

Prioridade: executar medicoes via CLI (lighthouse, bundle-analyzer, curl).
Worktree isolation ativo.
```

## Checklist explicito de otimizacao React/Next.js

Para projetos com React/Next, o agente DEVE verificar TODOS estes pontos antes de declarar otimizacao completa:

### Re-renders desnecessarios
- [ ] Componentes que rerenderizam frequentemente sem mudanca de props → candidato a `React.memo`
- [ ] Funcoes inline em props (`onClick={() => ...}`) → candidato a `useCallback`
- [ ] Objetos/arrays inline em props (`style={{...}}`, `data={[...]}`) → candidato a `useMemo` ou constante
- [ ] Calculos custosos no render body → candidato a `useMemo`

### Listas e dados grandes
- [ ] Listas com > 200 itens sem virtualizacao → adicionar `react-window` ou `@tanstack/react-virtual`
- [ ] Tabelas grandes sem pagination + virtualization → considerar `@tanstack/react-table` + virtual
- [ ] `.map()` aninhado em arrays grandes (O(n*m)) → indexar via Map/Object lookup
- [ ] Filtros/sorts no render (nao memoizados) → mover para `useMemo`

### Imagens e media
- [ ] `<img>` nativo em projeto Next.js → migrar para `next/image` (auto lazy + responsive + format)
- [ ] Imagens sem `width`/`height` explicitos → CLS (layout shift)
- [ ] Imagens > 200KB sem compressao → otimizar via sharp ou Next.js Image Optimization
- [ ] Imagens above-the-fold sem `priority` → LCP ruim
- [ ] Background images sem lazy → carregar tarde
- [ ] SVGs grandes nao otimizados → SVGO + considerar React component inline

### Bundle e code-splitting
- [ ] Import sincrono de libs grandes (charts, editor, video player) → `dynamic(() => import(...))`
- [ ] Tree-shaking quebrado por named import errado → verificar `import { x } from 'lodash'` vs `import x from 'lodash/x'`
- [ ] Polyfills duplicados → audit do bundle
- [ ] Fonts via `<link>` em vez de `next/font` → bloqueio de render

### Rendering strategy (Next.js)
- [ ] Server Component poderia substituir Client Component (sem interatividade) → mover
- [ ] Static page renderizando como SSR → adicionar `generateStaticParams` ou `revalidate`
- [ ] PPR / streaming nao usados em pages com partes lentas → considerar Suspense boundary
- [ ] Cache opportunities perdidas → adicionar `unstable_cache` ou Cache Components

### Medicao obrigatoria (antes/depois)
- Bundle size: `bun run build` + `du -sh .next/static` (Next) ou `dist/`
- Lighthouse: `bunx lighthouse <url> --output json --only-categories performance`
- Render perf: Chrome DevTools `performance_start_trace` (via plugin chrome-devtools-mcp)
- LCP especificamente: skill canonical `chrome-devtools-mcp:debug-optimize-lcp`

NUNCA aplicar otimizacao sem medir antes E depois. Se delta < 5%, reverter (over-engineering).
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the optimization agent is running
- NEVER optimizes without measuring first
- Uses worktree isolation
- Reports before/after metrics for every optimization
