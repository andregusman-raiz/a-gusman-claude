# Design Library — rAIz Educação

> Library completa de UI/UX: **86 elements** (layouts de apresentação) + **24 solutions** (módulos verticais de produto) + **design tokens** + **design system canônico** + **app de browse interativo com deploy Vercel**.

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `catalog/` | App Next.js 16 + shadcn — browser interativo de toda a library. Deploy Vercel ativo. |
| `elements/` | 14 categorias × ~6 variantes = 86 layouts de apresentação (auth, hero, pricing, nav, CTA, testimonials, footer, FAQ, onboarding, blog, contact, stats, bento, states). Base taxonômica: VibeUI. Cada variante: `component.tsx` (shadcn pronto) + `spec.md`. |
| `solutions/` | 24 módulos verticais extraídos de projetos em produção (dashboards, workflow, RAG, CLM, AI tools). Cada um: `spec.md` com o que resolve, código de referência, props, layout, dependências. |
| `tokens/` | Source of truth machine-readable dos design tokens (colors, typography, spacing, radii, layout) em JSON. Ver [tokens/README.md](tokens/README.md). |
| `UI_UX/` | `raiz-educacao-design-system.md` — design system canônico em prose (1045 linhas). Referência para identidade visual, paleta, tipografia, componentes base. |

## Como consumir

### 1. Browser interativo (humano)

```bash
cd ~/Claude/assets/design-library/catalog
npm run dev -- -p 3011
# http://localhost:3011              → catálogo
# http://localhost:3011/presentation → 86 elements
# http://localhost:3011/solutions    → 24 solutions
# http://localhost:3011/tokens       → tokens visualizados
```

### 2. Deploy Vercel (production)

Repo: [`Raiz-Educacao-SA/design-library`](https://github.com/Raiz-Educacao-SA/design-library)
Project: `catalog` em team `andregusman-raizs-projects`

URL production: gerada por deploy (ver `vercel ls` no `catalog/`). TODO: configurar custom domain `design.raiz.com.br`.

### 3. Copy-paste em projeto Next.js (dev)

```bash
cp ~/Claude/assets/design-library/elements/04-hero/04a-centered-text/component.tsx \
   ~/Claude/GitHub/<seu-projeto>/src/components/hero/centered-text.tsx
```

Dependências esperadas: `react` 19+, `lucide-react`, `tailwindcss` (v3 ou v4), `@/lib/utils` com export `cn` (shadcn default).

### 4. Claude Code (AI-assisted)

Skills relacionadas:
- `/ag-11-ux-ui` — machine UI/UX completa (build, design, componentes)
- `/ag-referencia-design-library` — carrega taxonomia solutions + elements
- `/ag-referencia-design-presentation` — 86 layouts VibeUI (elements)
- `/ag-referencia-redesign-workflow` — screenshot/URL → categoria + variante + prompt
- `/ag-referencia-prompt-guide` — estrutura 6-blocos para prompt de UI

Ver também [catalog.md](catalog.md) — índice geral com regras de roteamento entre `solutions/` e `elements/`.

## TODO conhecido

- Custom domain Vercel (`design.raiz.com.br`)
- Versionar `elements/`, `solutions/`, `tokens/`, `UI_UX/` no repo (hoje só `catalog/` está versionado)
- `catalog/src/app/tokens/page.tsx` deve importar dos JSONs em `tokens/` em vez de hardcode
