---
name: ag-referencia-design-presentation
description: Taxonomia de 86 layouts de apresentação/marketing (hero, pricing, auth, nav, CTA, testimonials, footer, FAQ, onboarding, blog, contact, stats, bento, states) adaptada do VibeUI. Consultar ANTES de construir landing pages, onboarding flows, auth screens, ou qualquer UI de camada de apresentação. Complementa o design-library/solutions (que cobre módulos verticais de produto).
metadata:
  filePattern:
    - "**/app/(marketing)/**"
    - "**/app/(auth)/**"
    - "**/app/landing/**"
    - "**/components/landing/**"
    - "**/components/marketing/**"
    - "**/components/auth/**"
  priority: 85
---

# Design Presentation — Taxonomia de Layouts

> 86 padrões de layouts de apresentação, agrupados em 14 categorias.
> Base: VibeUI (vibeui.online) curado + integração com design-library/solutions.
> Uso: ag-11-ux-ui, ag-1-construir ui, ag-6-iniciar projeto (landing), ag-6-iniciar projeto (auth).

---

## Como usar

1. **Antes de implementar** uma seção de apresentação (landing, auth, onboarding):
   - Identificar categoria (Hero? Pricing? Nav?)
   - Escolher 1-2 variantes da lista
   - Consultar `~/Claude/assets/design-library/elements/<NN>-<categoria>/<variante>/` para código (se existir)
   - Se variante não tem código ainda → gerar via shadcn + commitar no library

2. **Regra de combinação** (landing page típica):
   ```
   Nav (1) → Hero (1) → Stats (1) → Features/Bento (1) → Pricing (1) → Testimonials (1) → FAQ (1) → CTA (1) → Footer (1)
   ```

3. **Fallback**: se nenhuma variante se adequa → usar prompt textual direto no ag-11-ux-ui.

---

## Categorias (14) + 86 variantes

### 01 — Auth Forms (6)
Login/signup, recuperação de senha, multi-step.

- `01a-split-screen` — Form à esquerda, imagem/brand à direita
- `01b-centered-card` — Card único centralizado com sombra
- `01c-full-bleed-image` — Background full-image, form em card flutuante
- `01d-multi-step-wizard` — Signup em 2-4 etapas com progress indicator
- `01e-magic-link-only` — Email-only, sem senha (Supabase Auth default)
- `01f-social-first` — Botões SSO (Google, GitHub) primários, email secundário

**Stack default**: `@supabase/ssr` + Server Actions + react-hook-form + Zod.

### 02 — Pricing (8)
Tier cards, comparação, sliders, billing toggle.

- `02a-classic-3-tier` — Free/Pro/Enterprise cards lado a lado, tier popular destacado
- `02b-comparison-table` — Tabela vertical com check/cross, sticky header
- `02c-single-tier-hero` — Um plano só, foco em CTA gigante (SaaS simples)
- `02d-usage-slider` — Slider de seats/volume recalcula preço em tempo real
- `02e-credit-pack-grid` — Grid de pacotes de créditos (AI/API products)
- `02f-monthly-annual-toggle` — Switch com savings badge no annual
- `02g-enterprise-contact-card` — Tier custom sem preço, CTA "Fale conosco"
- `02h-stacked-mobile-first` — Cards empilhados otimizados mobile

### 03 — Features / Bento (8)
Grids assimétricos, alternating rows, accordions.

- `03a-icon-grid-3x3` — 9 features em grid uniforme, ícone + título + descrição
- `03b-bento-asymmetric` — Tiles de tamanhos diferentes, mix de texto/imagem/stats
- `03c-alternating-rows` — Feature-imagem alternando lado, 3-5 rows
- `03d-accordion-list` — Features como accordion expansível (long-form)
- `03e-tab-switcher` — Tabs categorizam features (Por Perfil, Por Uso)
- `03f-comparison-vs` — "Antes / Depois" ou "Nós / Concorrente"
- `03g-video-showcase` — Vídeo central + features ao redor
- `03h-interactive-preview` — Hover em feature troca preview screenshot

### 04 — Hero Sections (8)
Primeira dobra, acima do fold.

- `04a-centered-text` — H1 + subtítulo + CTAs centralizados, background limpo
- `04b-split-text-image` — 50/50 texto à esquerda, screenshot/video à direita
- `04c-animated-gradient` — Background com gradient mesh animado (framer-motion)
- `04d-typography-giant` — Texto mega-grande ocupa dobra inteira
- `04e-product-screenshot-below` — Texto acima, screenshot dashboard abaixo com sombra
- `04f-social-proof-inline` — Hero + logos de clientes abaixo do CTA
- `04g-video-autoplay-bg` — Vídeo mudo em loop como background
- `04h-3d-hero-interactive` — Three.js/Spline canvas como centerpiece

### 05 — CTA Banners (7)
Conversão final em landing ou banners intermediários.

- `05a-full-bleed-gradient` — Banner largura total com gradient + CTA único
- `05b-sticky-bottom-bar` — Barra fixa no bottom (não invasiva)
- `05c-email-capture-inline` — Input email + botão no mesmo banner
- `05d-split-cta-image` — CTA à esquerda, visual à direita
- `05e-centered-quote-cta` — Quote de cliente + CTA juntos
- `05f-countdown-urgency` — Timer + CTA (lançamentos, promos)
- `05g-multi-step-cta` — 3 caminhos diferentes (Trial / Demo / Contact)

### 06 — Stats Bars (7)
Números sociais e métricas.

- `06a-horizontal-row` — 3-5 stats em row, separados por vertical bars
- `06b-animated-counter` — Números animam de 0 ao valor final on scroll
- `06c-card-based` — Cada stat em card com ícone + label + trend
- `06d-logo-wall` — Logos de clientes em grayscale, hover colorido
- `06e-vs-comparison` — Stats "nós vs média do mercado"
- `06f-animated-sparkline` — Stat principal + sparkline pequena embaixo
- `06g-impact-paragraph` — Stats embedded em parágrafo narrativo

### 07 — Nav Bars (8)
Navegação top-level.

- `07a-logo-links-cta` — Logo à esquerda, links centro, CTA à direita (clássico)
- `07b-mega-menu` — Dropdown grande com categorias e sub-items
- `07c-sidebar-fixed` — Sidebar lateral permanente (app shell, não landing)
- `07d-floating-pill` — Nav flutuante arredondada, não colada no topo
- `07e-command-palette` — Sem links visíveis, atalho Cmd+K abre tudo (já temos em catalog/src/components/command-palette.tsx)
- `07f-mobile-bottom-tabs` — Tab bar inferior em mobile (PWA-like)
- `07g-transparent-hover-solid` — Transparent até scroll, solid depois
- `07h-breadcrumb-nav` — Navegação com hierarquia visível (dashboards)

### 08 — Testimonials (8)
Social proof.

- `08a-quote-card-grid` — Cards com quote + avatar + nome + empresa
- `08b-marquee-scroll` — Scroll horizontal infinito automático
- `08c-masonry-grid` — Pinterest-style, alturas variadas
- `08d-video-grid` — Vídeos curtos (45s) em grid
- `08e-tweet-wall` — Screenshots de tweets reais embedded
- `08f-single-featured-hero` — 1 case de sucesso gigante + métricas
- `08g-logo-wall-plus-quote` — Logo wall + 1 quote destacado embaixo
- `08h-carousel-pagination` — Carousel manual com dots

### 09 — Footer (5)
Rodapé.

- `09a-multi-column-sitemap` — 4-6 colunas (Produto, Empresa, Legal, Social)
- `09b-newsletter-first` — Newsletter form grande, sitemap pequeno abaixo
- `09c-status-indicator` — Inclui status page "All systems operational"
- `09d-minimal-copyright` — 1 linha, copyright + links essenciais
- `09e-big-logo-brand` — Logo grande + tagline + social icons, mini-sitemap

### 10 — FAQ (5)
Perguntas frequentes.

- `10a-accordion-vertical` — Accordion empilhado vertical (padrão)
- `10b-chat-bubble` — Perguntas/respostas como chat (mais casual)
- `10c-searchable` — Input de busca em cima, filtra em tempo real
- `10d-categorized-tabs` — Tabs por categoria (Billing, Product, Support)
- `10e-two-column-static` — 2 colunas com Q/A visíveis sem clique

### 11 — Onboarding (4)
Primeiro uso, ativação.

- `11a-checklist-progress` — Lista de tarefas com check + % completa (cerca de 5 itens)
- `11b-guided-tour-tooltip` — Tooltips sequenciais em elementos reais da UI (Shepherd.js / Driver.js)
- `11c-video-modal-intro` — Modal de 45s com vídeo ao entrar
- `11d-empty-state-cta` — Empty state proativo com CTA para ação inicial

### 12 — Blog / Content (4)
Listas de conteúdo, leitura.

- `12a-magazine-grid` — Hero post grande + 6-8 cards abaixo
- `12b-reading-layout` — Post único, max-width 680px, TOC sticky
- `12c-filtered-cards` — Grid de cards com chips de filtro em cima
- `12d-search-first` — Busca em destaque, cards abaixo (knowledge base)

### 13 — Contact (3)
Formulários de contato.

- `13a-form-plus-details` — Form à esquerda, email/telefone/endereço à direita
- `13b-channel-cards` — Cards (Support, Sales, Press) direcionam para canal
- `13c-map-embedded` — Mapa Google/Mapbox + form ao lado

### 14 — States (bonus, 5)
Estados vazios, erros, loading, cookies.

- `14a-404-with-search` — 404 + input de busca + links úteis
- `14b-loading-skeleton` — Skeleton UI por feature (evitar spinner genérico)
- `14c-empty-state-illustration` — SVG ilustrativo + CTA + descrição
- `14d-cookie-banner-gdpr` — Banner minimal bottom, Accept/Customize
- `14e-error-boundary-card` — Card centralizado com retry + report

---

## Combos recomendados (templates)

### Landing SaaS (B2B)
```
07a Nav → 04b Hero split → 06d Logo wall → 03c Alternating → 02a 3-tier → 08a Testimonial grid → 10a FAQ → 05a CTA gradient → 09a Footer sitemap
```

### Landing AI Product
```
07d Floating pill → 04c Animated gradient hero → 03b Bento asymmetric → 06b Animated counter → 08b Tweet wall → 02e Credit pack → 05c Email capture → 09b Newsletter footer
```

### App Auth Flow (Supabase)
```
01a Split screen login ⇄ 01d Multi-step signup → Email verify → 11a Onboarding checklist → 14b Loading skeleton (app shell)
```

### Internal Tool (raiz-platform, salarios-platform estilo)
```
07c Sidebar fixed → 14c Empty state on first view → dashboard-kpi (solutions/#01) → table-filters-export (solutions/#02)
```

---

## Integração com design-library/solutions

As 24 `solutions/` cobrem módulos **produtivos/internos**. Os 86 `elements/` cobrem camada **de apresentação**.

Regra de decisão:
- **É página de marketing/landing/auth/onboarding?** → `elements/`
- **É funcionalidade interna com lógica de negócio?** → `solutions/`
- **Dashboard híbrido (app interno + marketing)?** → combinar os dois

---

## Status de implementação em código

`~/Claude/assets/design-library/elements/<NN>-<categoria>/` contém código shadcn quando já implementado.
Hoje: scaffold vazio. Implementar **on-demand** — cada vez que um projeto precisar, implementar lá e commitar.

Prioridade sugerida (cobre 80% dos projetos novos):
1. 01a, 01d, 01e (Auth) — todo projeto precisa
2. 04a, 04b, 04c (Hero) — toda landing
3. 02a, 02b (Pricing) — SaaS
4. 11a, 11d, 14b, 14c (Onboarding + States) — ativação
5. 09a, 10a, 05a (Footer/FAQ/CTA) — completar landing

---

## Anti-patterns

- **Copiar prompt textual do VibeUI cegamente** → adaptar a tokens do design-system (cores rAIz, fontes)
- **Implementar todas 86 antes de precisar** → over-engineering, implementar sob demanda
- **Ignorar solutions/ e reimplementar módulo que já existe** → sempre checar solutions/ primeiro
- **Usar elements/ para feature complexa** → se tem lógica de negócio, é solution/

---

## Referências

- Fonte original: vibeui.online (86 prompts curados)
- Design library local: `~/Claude/assets/design-library/`
- Raiz Design System: `~/Claude/assets/design-library/UI_UX/raiz-educacao-design-system.md`
- Skill complementar (módulos internos): design-library/solutions + `~/Claude/assets/design-library/catalog.md`
- Machine wrapper: `/ag-11-ux-ui` (consulta esta skill antes de gerar layout)
