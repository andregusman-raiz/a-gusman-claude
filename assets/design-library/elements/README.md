# Design Library — Elements (Camada de Apresentação)

> 14 categorias × ~6 variantes = 86 elementos de UI de apresentação (auth, hero, pricing, nav, CTA, testimonials, footer, FAQ, onboarding, blog, contact, stats, bento, states).
> Complementa `../solutions/` (módulos verticais de produto).
> Base taxonômica: VibeUI (vibeui.online) + integração com design-system rAIz.

---

## Estrutura

```
elements/
├── 01-auth/              # Login, signup, magic link, SSO
├── 02-pricing/           # Tiers, comparison, credit packs
├── 03-features-bento/    # Grids, alternating, bento
├── 04-hero/              # Above-the-fold variants
├── 05-cta-banners/       # Full-bleed, sticky, email capture
├── 06-stats-bars/        # Social proof, counters, logo walls
├── 07-nav-bars/          # Top nav, sidebar, mega menu, command palette
├── 08-testimonials/      # Quote grids, marquee, masonry, video
├── 09-footer/            # Sitemap, newsletter-first, status
├── 10-faq/               # Accordion, searchable, tabs
├── 11-onboarding/        # Checklists, tours, empty states
├── 12-blog-content/      # Magazine, reading, knowledge base
├── 13-contact/           # Form+details, channels, map
└── 14-states/            # 404, loading, empty, cookie, error
```

Cada variante tem:
```
<NN>-<categoria>/<variante>/
├── spec.md        # O que é, quando usar, props, dependências
├── component.tsx  # Código shadcn/ui pronto para copiar
└── preview.png    # Screenshot (opcional)
```

## Como consumir

### 1. Browser interativo (humano)

```bash
cd ~/Claude/assets/design-library/catalog
npm run dev -- -p 3011
# http://localhost:3011/presentation
```

Fluxo no app:
- Index em `/presentation` lista as 14 categorias
- Detalhe em `/presentation/<categoria>/<id>` mostra preview ao vivo + código + spec + dropdown de preset (Raiz / Minimalist / Brutalist / Glass) + botão "Copy as AI prompt" (Claude / Cursor / v0)
- Compare em `/presentation/<categoria>/compare` mostra todas as variantes da categoria lado a lado

### 2. Copy-paste em projeto Next.js (dev)

Cada `component.tsx` é **self-contained**:

```bash
# Copiar o arquivo para o projeto alvo
cp ~/Claude/assets/design-library/elements/04-hero/04a-centered-text/component.tsx \
   ~/Claude/GitHub/<seu-projeto>/src/components/hero/centered-text.tsx
```

Dependências esperadas no projeto alvo:
- `react` (19+)
- `lucide-react` (qualquer 0.x recente)
- `tailwindcss` (v3 ou v4)
- `@/lib/utils` com export `cn` (shadcn default) — OU o componente já tem `cn` mockado inline

Ajustes comuns pós-copy:
- Substituir placeholder text PT-BR por copy real
- Injetar tokens de cor do seu design-system (se diferente do Raiz)
- Wire handlers reais (`onSubmit`, `onClick`) — hoje são `() => {}` placeholder

### 3. Claude Code (AI-assisted)

```
/ag-referencia-design-presentation     # carrega taxonomia dos 86 + combos recomendados
/ag-11-ux-ui element: 04b-split-text-image   # machine de UI constrói variação custom
```

No detail page do catalog, clicar **"Copy as AI prompt"** gera prompt estruturado (contexto + layout base + tokens rAIz + constraints) pronto para colar em Cursor/Lovable/v0.

## Política de implementação

- **On-demand**: só implementar novas variantes quando um projeto real precisar
- **Extrair primeiro**: se um projeto já implementou bem, refatorar para aqui
- **Tokens rAIz**: todo elemento usa tokens do `../tokens/` (cores, spacing, typography)
- **shadcn/ui base**: preferir componentes shadcn. Compositions customizadas OK.
- **Zero business logic**: elementos são pura UI. Lógica fica em `../solutions/`.
- **Presets estéticos**: aplicam só no catalog app (CSS cascade via wrapper class). Em projetos consumidores, os 86 components renderizam no estilo Raiz Default — adapte via tokens próprios se precisar.

## Prioridade sugerida

| Ordem | Categoria | Razão |
|---|---|---|
| 1 | 01 Auth | Todo projeto Supabase precisa |
| 2 | 04 Hero | Toda landing começa aqui |
| 3 | 11 Onboarding | Ativação de feature nova |
| 4 | 14 States | Empty/loading/error cobrem toda app |
| 5 | 02 Pricing | SaaS/sample-saas |
| 6 | 10 FAQ | Landing completa |
| 7 | 09 Footer | Landing completa |
| 8 | 07 Nav | App shell + landing |

Demais categorias: sob demanda.
