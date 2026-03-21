# rAIz Educação — Design System Oficial

> Referência canônica para todos os projetos rAIz. Derivado da análise do frontend TOTVS Educacional + logo vetorial oficial.
> Versão 1.0 — 2026-03-21

---

## Índice

1. [Identidade Visual](#1-identidade-visual)
2. [Paleta de Cores](#2-paleta-de-cores)
3. [Tipografia](#3-tipografia)
4. [Spacing e Grid](#4-spacing-e-grid)
5. [Border Radius e Sombras](#5-border-radius-e-sombras)
6. [Componentes Base](#6-componentes-base)
7. [Layout Patterns](#7-layout-patterns)
8. [Dark Mode](#8-dark-mode)
9. [Motion e Animação](#9-motion-e-animação)
10. [Charts e Data Viz](#10-charts-e-data-viz)
11. [Acessibilidade](#11-acessibilidade)
12. [Tokens CSS (implementação)](#12-tokens-css-implementação)
13. [Checklist de Entrega](#13-checklist-de-entrega)

---

## 1. Identidade Visual

### Logo

O logo rAIz Educação tem três elementos visuais distintos com cores específicas:

| Elemento | Cor logo original | Cor sidebar (dark) | Uso |
|---|---|---|---|
| Folhas (2 elipses) | `#77c6be` | `#5BB5A2` | Símbolo da marca |
| "RAIZ" (texto bold) | `#f0870b` | `#F7941D` | Nome principal |
| "educação" (texto light) | `#70c3bb` | `rgba(255,255,255,0.7)` em dark | Complemento |

**Regras de uso do logo:**
- Sobre fundo claro: usar variante com teal/orange conforme logo original
- Sobre fundo escuro (sidebar): "educação" em branco 70% — nunca em teal sobre escuro (contraste insuficiente)
- Versão colapsada (sidebar fechada): badge quadrado `bg-[#F7941D]` com letra "R" branca bold
- Nunca distorcer proporções do SVG
- Nunca usar como `<img>` — sempre SVG inline para suporte a `aria-label`

### Fonte do Logo

**IBM Plex Sans** — fonte do sistema inteiro, compatível com o logotipo:
- "RAIZ": weight 900, letter-spacing -0.5
- "educação": weight 400, letter-spacing 1.5-1.8

---

## 2. Paleta de Cores

### Cores de Marca

```
Raiz Orange       #F7941D   — CTA principal, active state, badges, accents
Raiz Orange Dark  #D97B10   — hover state do orange, pressed
Raiz Orange Light #FDE8C8   — background tint para alerts e highlights
Raiz Orange XLight #FEF3E2  — surface muito suave (alert cards)

Raiz Teal         #5BB5A2   — accent secundário, teal-colored elements
Raiz Teal Dark    #3D9A87   — hover state do teal
Raiz Teal Light   #D4EFE9   — background tint teal
Raiz Teal XLight  #EAF6F3   — surface muito suave (info cards)
```

### Cores Semânticas de UI

```
Background App    #F8F9FA   — fundo geral da aplicação
Surface (cards)   #FFFFFF   — cards, popovers, modais
Foreground        #1A202C   — texto principal (AAA sobre branco)
Text Secondary    #4A5568   — subtítulos, labels secundários
Text Muted        #718096   — placeholders, metadados

Border            #E2E8F0   — bordas de cards, separadores
Input             #E2E8F0   — borda de inputs
Muted bg          #F0F4F8   — tags, chips, backgrounds desativados
Secondary bg      #F0F4F8   — botões secondary

Sidebar bg        #1E2433   — painel lateral escuro
Sidebar accent    #2D3548   — hover state dos itens do nav
```

### Cores de Status/Feedback

```
Success           #2D9E6B   — confirmações, status ativo, frequência ok
Warning           #E8A820   — alertas médios, turmas quase cheias
Danger            #DC3545   — erros, exclusões, inadimplência crítica

Blue (dados)      #3B82F6   — métricas neutras (total alunos)
Emerald (positivo)#059669   — métricas positivas (turmas ativas, recebido)
Amber (atenção)   #D97706   — próximo ao limite (≥95% de ocupação)
Red (negativo)    #DC2626   — valores negativos, vencimentos
```

### Cores de Gráficos

```
chart-1  #3B82F6   — azul (série primária)
chart-2  #64748B   — cinza-slate (série secundária)
chart-3  #059669   — emerald (série positiva)
chart-4  #D97706   — amber (série atenção)
chart-5  #DC2626   — vermelho (série crítica)
```

### Regras de Contraste (WCAG AA obrigatório)

| Combinação | Ratio | Status |
|---|---|---|
| `#1A202C` sobre `#FFFFFF` | 15.3:1 | AAA |
| `#4A5568` sobre `#FFFFFF` | 7.0:1 | AA |
| `#718096` sobre `#FFFFFF` | 4.6:1 | AA mínimo |
| `#FFFFFF` sobre `#F7941D` | 3.1:1 | Somente large text |
| `#FFFFFF` sobre `#1E2433` | 13.8:1 | AAA |
| `#F7941D` sobre `#1E2433` | 4.4:1 | AA para large text |

**Atenção:** Branco sobre orange (`#F7941D`) NÃO atinge AA para texto normal. Usar apenas em badges grandes, botões bold 14px+, ou texto 18px+.

---

## 3. Tipografia

### Fontes

```
Font Family Principal: IBM Plex Sans
Font Monospace:        IBM Plex Mono (dados, tabelas numéricas)
```

**Google Fonts import:**
```css
@import url('https://fonts.google.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap');
```

**Variáveis CSS:**
```css
--font-sans: var(--font-ibm-plex-sans, "IBM Plex Sans"), ui-sans-serif, system-ui, sans-serif;
--font-mono: var(--font-ibm-plex-mono, "IBM Plex Mono"), ui-monospace, monospace;
```

### Escala Tipográfica

| Token | Size | Weight | Line-height | Uso |
|---|---|---|---|---|
| `text-xs` | 10px | 400-600 | 1.4 | Labels de seção (uppercase tracking), micro-copy |
| `text-xs` | 11px | 400 | 1.5 | Subtexto, metadados secundários |
| `text-sm` | 13px | 400-500 | 1.5 | Itens de navegação sidebar, body compact |
| `text-sm` | 14px | 400-600 | 1.5 | Body padrão, células de tabela |
| `text-base` | 16px | 400-500 | 1.6 | Body legível, form labels |
| `text-xl` | 20px | 600 | 1.3 | Page titles (h1 de dashboards) |
| `text-2xl` | 24px | 700 | 1.2 | Títulos de seção com ícone |
| `text-[30px]` | 30px | 700 | 1.0 | KPI values grandes |

### Regras de Tipografia

1. **Nunca abaixo de 13px** para texto interativo — sidebar usa `text-[13px]` como mínimo
2. **Inputs mobile**: mínimo `font-size: 16px` (evita auto-zoom no iOS) — aplicar `max(16px, 1em)` via media query
3. **Tabular numbers**: classes `.tabular-nums` ou `font-variant-numeric: tabular-nums` em todas as colunas numéricas
4. **Letter-spacing em labels de seção**: `tracking-[0.12em]` uppercase para cabeçalhos de seção da sidebar
5. **Line-height para parágrafos**: mínimo 1.5 para body, 1.6 para texto de apoio
6. **Line-length**: não ultrapassar 75 chars em colunas de texto corrido

### Hierarquia por Contexto

**Dashboard page header:**
```
h1: text-xl font-semibold tracking-tight text-foreground
p:  text-sm text-muted-foreground mt-1
```

**Card title:**
```
h2/CardTitle: text-sm font-semibold text-foreground
```

**KPI value:**
```
text-[30px] font-bold leading-none text-foreground tabular-nums
```

**Sidebar section label:**
```
text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30
```

---

## 4. Spacing e Grid

### Escala de Spacing (base 4px)

```
0.5 = 2px   — gap mínimo entre ícone e texto inline
1   = 4px   — gap entre elementos muito compactos
1.5 = 6px   — padding de itens de lista compactos
2   = 8px   — padding interno de chips, badges
3   = 12px  — padding interno de nav items
4   = 16px  — padding padrão de cards (CardContent pt-4 pb-4)
5   = 20px  — padding de headers de card
6   = 24px  — gap entre seções de página
8   = 32px  — gap entre blocos maiores
```

### Content Padding por Breakpoint

```
mobile  (< 768px):  p-3   (12px)
tablet  (768-1024): p-4   (16px)
desktop (≥ 1024px): p-6   (24px)
```

**Implementação no app-shell:**
```tsx
<div className="mx-auto max-w-[1440px] p-3 sm:p-4 lg:p-6">
```

### Grid System

| Contexto | Colunagem | Breakpoints |
|---|---|---|
| KPI cards dashboard | `grid-cols-2 lg:grid-cols-4` | Mobile 2, Desktop 4 |
| KPI cards 2 métricas | `grid-cols-1 sm:grid-cols-2` | 1→2 |
| Layout dashboard c/ aside | `grid lg:grid-cols-[1fr_272px]` | Stack→Split |
| Quick links / ações | `grid grid-cols-2 sm:grid-cols-4` | 2→4 |
| Module cards homepage | `grid grid-cols-1 sm:grid-cols-2 max-w-2xl` | 1→2 |

### Container Max-Width

```
Aplicação:    max-w-[1440px]   — container principal da aplicação
Conteúdo lp: max-w-2xl         — layouts de formulário/detalhe
```

---

## 5. Border Radius e Sombras

### Border Radius

```css
--radius: 0.5rem;   /* 8px — base */

--radius-sm:  calc(var(--radius) * 0.6);   /* 4.8px  — chips, badges, inputs */
--radius-md:  calc(var(--radius) * 0.8);   /* 6.4px  — botões pequenos */
--radius-lg:  var(--radius);               /* 8px    — cards padrão */
--radius-xl:  calc(var(--radius) * 1.4);   /* 11.2px — cards de destaque */
--radius-2xl: calc(var(--radius) * 1.8);   /* 14.4px — modais */
```

**Uso de border-radius por componente:**
- Cards: `rounded-lg` (8px) — padrão
- Botões: `rounded-md` (6.4px) — padrão shadcn
- Badges/chips: `rounded-full` — tags de status, categorias
- Avatar: `rounded-full` — sempre circular
- Inputs: `rounded-md` — padrão
- Progress bars: `rounded-sm` — barras de dados
- Nav items: `rounded-lg` — consistente com cards

### Sombras

O sistema usa sombras sutis, nunca pesadas:

```
shadow-sm    — cards padrão (border-0 shadow-sm)
shadow-md    — cards em hover
shadow-[0_1px_3px_rgba(0,0,0,0.08)]  — topbar (barely visible)
shadow-[0_1px_2px_rgba(0,0,0,0.04)]  — breadcrumb bar
shadow-[0_1px_6px_rgba(247,148,29,0.25)]  — active nav item (orange glow)
```

**Regra:** Cards de dados usam `border-0 shadow-sm` — nunca border + shadow juntos (double-boundary antipattern).

---

## 6. Componentes Base

### Card

**Padrão para métricas e data:**
```tsx
<Card className="border-0 shadow-sm">
  <CardContent className="pt-4 pb-4">
    {/* conteúdo */}
  </CardContent>
</Card>
```

**Padrão com accent bar (KPI colorido):**
```tsx
<Card className="overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md">
  <div className="h-0.5 w-full" style={{ backgroundColor: accentColor }} />
  <CardContent className="pt-4 pb-4">
    {/* conteúdo */}
  </CardContent>
</Card>
```

**Padrão com border-left (módulos):**
```tsx
<Card className="border-l-4 rounded-l-none transition-all duration-200 hover:shadow-md hover:ring-1"
  style={{ borderLeftColor: color }}>
```

### KPI Card

Estrutura canônica para métricas:
```tsx
<div className="flex items-start justify-between">
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground">{título}</p>
    <p className="text-xl font-semibold text-foreground tabular-nums">{valor}</p>
    {subtítulo && <p className="text-xs text-muted-foreground">{subtítulo}</p>}
  </div>
  <div className={`rounded-lg p-2 ${bgColor}`}>
    <Icon className={`size-5 ${iconColor}`} strokeWidth={1.75} />
  </div>
</div>
```

**Cores de KPI por tipo:**
| Tipo | Icon bg | Icon color | Accent bar |
|---|---|---|---|
| Volume/Total | `bg-blue-50` | `text-blue-600` | `#3B82F6` |
| Positivo/Recebido | `bg-emerald-50` | `text-emerald-600` | `#059669` |
| Negativo/Vencido | `bg-red-50` | `text-red-600` | `#DC2626` |
| Atenção/Pendente | `bg-amber-50` | `text-amber-600` | `#E8A820` |
| Marca/Principal | `bg-[#FDE8C8]` | `text-[#F7941D]` | `#F7941D` |
| Info/Teal | `bg-[#EAF6F3]` | `text-[#5BB5A2]` | `#5BB5A2` |

### Alert Cards

Estrutura canônica para alerts inline:
```tsx
{/* Alerta laranja (warning Raiz) */}
<div className="flex items-start gap-2.5 rounded-lg border border-[#F7941D]/25 bg-[#FEF3E2] p-3">
  <AlertTriangle className="size-4 shrink-0 text-[#F7941D] mt-0.5" />
  <div>
    <div className="text-xs font-semibold text-[#B8610C]">{título}</div>
    <div className="text-xs text-[#C87A24] mt-0.5">{descrição}</div>
  </div>
</div>

{/* Alerta teal (info Raiz) */}
<div className="flex items-start gap-2.5 rounded-lg border border-[#5BB5A2]/25 bg-[#EAF6F3] p-3">
  <Info className="size-4 shrink-0 text-[#5BB5A2] mt-0.5" />
  <div>
    <div className="text-xs font-semibold text-[#2D7A6B]">{título}</div>
    <div className="text-xs text-[#3D9A87] mt-0.5">{descrição}</div>
  </div>
</div>

{/* Alerta vermelho (crítico) */}
<div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
  <AlertCircle className="size-4 shrink-0 text-red-500 mt-0.5" />
  <div>
    <div className="text-xs font-semibold text-red-800">{título}</div>
    <div className="text-xs text-red-600 mt-0.5">{descrição}</div>
  </div>
</div>
```

### Botões

**Primário (orange Raiz):**
```tsx
<Button style={{ backgroundColor: "#F7941D", borderColor: "#F7941D" }}>
  <Icon className="size-4 shrink-0" />
  Label
</Button>
```

**Secundário com hover teal:**
```tsx
<Button variant="outline"
  className="hover:border-[#5BB5A2] hover:text-[#5BB5A2] transition-colors">
  <Icon className="size-4 shrink-0" />
  Label
</Button>
```

**Regras de botões:**
- Mínimo `min-h-[44px]` para touch targets em mobile
- SEMPRE `cursor-pointer` em elementos clicáveis que não são `<button>` native
- Nunca desabilitar sem feedback visual claro (`opacity-50 cursor-not-allowed`)
- Botão em loading: desabilitar + spinner inline

### Inputs / Selects

```tsx
<Select>
  <SelectTrigger className="focus:ring-[#F7941D] focus:border-[#F7941D]" />
</Select>
```

- Focus ring sempre em `#F7941D` (orange) — consistência com `--ring` token
- Labels com `for` attribute obrigatório — nunca input sem label
- `inputmode="numeric"` em campos numéricos
- Mínimo 16px font-size em mobile (previne auto-zoom iOS)

### Tabelas

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b">
        <th className="pb-2 text-left font-medium text-muted-foreground">{header}</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b last:border-0">
        <td className="py-2 text-foreground">{valor}</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Regras de tabelas:**
- SEMPRE envolver em `overflow-x-auto` para mobile
- Colunas numéricas: `text-right tabular-nums`
- Header: `text-muted-foreground font-medium` — nunca bold demais
- Zebra striping opcional: `.table-zebra tbody tr:nth-child(even)`
- Valores de status: usar classes `.status-*` para consistência

### Badges de Status

```tsx
{/* Ativo */}
<span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
  Ativo
</span>

{/* Pendente */}
<span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
  Pendente
</span>

{/* Inativo */}
<span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
  Inativo
</span>

{/* Crítico */}
<span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
  Vencido
</span>
```

### Ícones

- Biblioteca: **Lucide React** — exclusiva, não misturar com outras
- Size padrão: `size-[18px]` em nav, `size-5` em ações, `size-4` em inline
- strokeWidth: `1.75` — padrão do sistema (mais leve que default 2)
- Cor em contexto escuro (sidebar): `text-white/60`, ativo: `text-white`
- Cor em contexto claro: `text-muted-foreground` para neutro, cor semântica para indicativo
- NUNCA emojis como ícones — sempre SVG Lucide
- Ícones de módulo com ícone de marca: `text-[#F7941D]` para Explorar, consistência com sidebar active

### Avatars

```tsx
<Avatar className="size-9 cursor-pointer">
  <AvatarFallback className="text-xs font-bold text-white"
    style={{ backgroundColor: "#F7941D" }}>
    AS
  </AvatarFallback>
</Avatar>
```

- Fallback sempre em `#F7941D` com texto branco
- Nunca usar initials em lowercase

### Tooltips

- Usar `Tooltip` (Radix via shadcn) para nav items colapsados
- `side="right"` para sidebar colapsada
- Não usar tooltip em elementos com texto visível

---

## 7. Layout Patterns

### App Shell

**Breakpoints:**
```
mobile  : < 768px    — sidebar oculta, abre como drawer com overlay
tablet  : 768–1279px — sidebar colapsada (ícones only, w-16)
desktop : ≥ 1280px   — sidebar expandida (w-60)
```

**Hierarquia de z-index:**
```
z-10  — elementos de página (dropdowns, cards)
z-30  — topbar fixo, backdrop overlay mobile
z-40  — sidebar (acima do topbar em mobile drawer)
z-100 — skip links (acessibilidade)
```

**Dimensões fixas:**
```
Topbar height:      h-14 (56px)
Sidebar expandida:  w-60 (240px)
Sidebar colapsada:  w-16 (64px)
Content top offset: pt-14 (para compensar topbar fixo)
```

### Topbar

Estrutura:
```
[hamburger mobile] [logo mobile] | [separator] [unit selector] ─── [notifications] [avatar]
```

- `h-14` fixo, `bg-white/95 backdrop-blur-sm`
- `shadow-[0_1px_3px_rgba(0,0,0,0.08)]` — sombra mínima
- Separador vertical `h-5 w-px bg-border` entre áreas
- Focus ring orange em `SchoolSelector`
- Badge de notificação: `bg-[#F7941D]` — cor da marca

### Sidebar

Estrutura:
```
[logo / R badge]
─────────────────
[nav section label]
[nav items ...]
[separator]
[nav section label]
...
─────────────────
[collapse toggle]
```

- Fundo: `bg-sidebar` (`#1E2433`)
- Item ativo: `bg-[#F7941D]/90 text-white shadow-[0_1px_6px_rgba(247,148,29,0.25)]`
- Item hover: `hover:bg-white/8 hover:text-white/90 hover:translate-x-0.5`
- Section labels: `text-[10px] uppercase tracking-[0.12em] text-white/30`
- Separadores: `bg-white/10`
- Scrollbar customizado: thin, `rgba(255,255,255,0.15)`
- Scroll behavior: `overscroll-contain` para prevenir scroll chain

### Breadcrumb Bar

```
[Home icon] > [Módulo] > [Subpágina atual]
```

- `h-10`, `border-b border-border bg-white`
- `shadow-[0_1px_2px_rgba(0,0,0,0.04)]`
- Overflow horizontal com `overflow-x-auto [&::-webkit-scrollbar]:hidden`
- Item atual: `font-medium text-foreground aria-current="page"`
- Links anteriores: `text-muted-foreground hover:text-foreground`
- Separador: `ChevronRight size-3.5`

### Page Header (padrão)

```tsx
<div>
  <h1 className="text-xl font-semibold tracking-tight text-foreground">
    {título}
  </h1>
  <p className="text-sm text-muted-foreground mt-1">
    {subtítulo/contexto}
  </p>
</div>
```

Variante com ícone de módulo:
```tsx
<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
  <ModuleIcon className="size-6 text-[#F7941D]" />
  {título}
</h1>
```

### Section Layout

Espaçamento canônico entre seções de uma página:
```tsx
<div className="flex flex-col gap-6">
  {/* Header */}
  {/* KPI Grid */}
  {/* Main Content */}
  {/* Secondary Content */}
</div>
```

Gap entre seções: `gap-6` (24px) padrão, `gap-8` para separações maiores.

---

## 8. Dark Mode

O design system atual **não tem dark mode implementado** para a aplicação principal — a sidebar usa tema escuro fixo (`#1E2433`), mas o restante da UI é light mode only.

### Diretrizes para quando dark mode for implementado

```css
/* Light mode (atual) */
:root {
  --background: #F8F9FA;
  --foreground: #1A202C;
  --card: #FFFFFF;
  --sidebar: #1E2433;
}

/* Dark mode (futuro) */
.dark {
  --background: #0F172A;       /* slate-900 */
  --foreground: #F1F5F9;       /* slate-100 */
  --card: #1E293B;             /* slate-800 */
  --border: #334155;           /* slate-700 */
  --muted: #1E293B;
  --muted-foreground: #94A3B8; /* slate-400 — mínimo para AA */

  /* Manter cores da marca inalteradas */
  --primary: #F7941D;
  --accent: #5BB5A2;
  --sidebar: #0F172A;          /* mais escuro em dark mode */
}
```

**Regras para dark mode:**
- Glass cards: usar `bg-white/80` mínimo no light (nunca `bg-white/10`)
- Texto muted em dark: mínimo `#94A3B8` (slate-400) para AA
- Bordas visíveis: usar `border-slate-700` em dark, não `border-white/10`
- Botões primary (`#F7941D`): manter mesmo tom — contraste suficiente sobre ambos os backgrounds
- Tabelas zebra: alternar entre `#1E293B` e `#0F172A` em dark

---

## 9. Motion e Animação

### Princípios

1. **Utilitária, nunca decorativa** — animação serve à UX, não ao design
2. **Rápida** — máximo 300ms para micro-interações
3. **Respeitosa** — sempre verificar `prefers-reduced-motion`

### Durações

```
Micro (hover, focus):      150ms — color, opacity, border changes
Padrão (expansão, slide):  200ms — sidebar collapse, drawer slide
Feedback (tooltip, toast):  250ms — aparecimento de elementos de UI
Máximo (modal, sheet):     300ms — abertura de dialogs grandes
```

### Propriedades Seguras (GPU-aceleradas)

```css
/* Usar */
transform: translateX(), translateY(), scale()
opacity: 0 → 1

/* Nunca animar */
width, height, top, left, padding, margin
(causam reflow — performance ruim)
```

### Padrões de Animação

**Nav item hover:**
```tsx
className="transition-all duration-150 hover:translate-x-0.5"
```

**Card hover:**
```tsx
className="transition-shadow hover:shadow-md"
```

**Sidebar collapse:**
```css
.sidebar-transition {
  transition: width 200ms ease-in-out, margin-left 200ms ease-in-out;
}
```

**Mobile drawer:**
```tsx
className="transition-transform duration-300 ease-in-out"
```

**Botões e links:**
```tsx
className="transition-colors duration-150"
```

### Prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Loading States

- Dados assíncronos: `<Skeleton>` (shadcn animate-pulse) — nunca tela em branco
- Botão em loading: `disabled` + spinner `animate-spin` inline
- Navegação entre páginas: manter layout estável — sem layout shift
- Reservar espaço para async content via min-height ou skeleton

---

## 10. Charts e Data Viz

### Biblioteca Recomendada

**Recharts** — compatível com React/Next.js, boa acessibilidade, usado no projeto.

### Tipos de Chart por Dado

| Dado | Chart primário | Chart secundário |
|---|---|---|
| Comparar categorias | Bar horizontal | Column chart |
| Tendência temporal | Line chart | Area chart |
| Parte do todo (≤5 itens) | Donut chart | Stacked bar |
| Performance vs meta | Bullet/gauge | Thermometer |
| Distribuição aging | Horizontal bar | Table com sparkline |
| KPI único | Big number + delta | Gauge simplificado |
| Ocupação por série | Bar horizontal c/ % | Progress bar in-line |

### Paleta de Charts

Usar tokens `chart-1` a `chart-5` para consistência:
```
Série 1 (primária):   #3B82F6 (azul)
Série 2 (secundária): #64748B (slate)
Série 3 (positiva):   #059669 (emerald)
Série 4 (atenção):    #D97706 (amber)
Série 5 (crítica):    #DC2626 (vermelho)
```

**Cor de marca em destaque:** `#F7941D` para elemento principal único (ex: ícone de seção, barra de destaque).

### Padrão de Bar Chart Inline (sem biblioteca)

Para comparações simples (ex: matrículas por série):
```tsx
<div className="flex flex-col gap-2">
  {data.map((item) => (
    <div key={item.label} className="flex items-center gap-3">
      <span className="w-[88px] shrink-0 text-xs text-muted-foreground text-right tabular-nums">
        {item.label}
      </span>
      <div className="flex-1 h-[18px] bg-muted rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: isNearFull ? "#D97706" : "#64748B",
          }}
        />
      </div>
      <span className="w-[72px] shrink-0 text-xs tabular-nums text-muted-foreground">
        <span className="font-medium text-foreground">{item.value}</span>/{item.total}
      </span>
    </div>
  ))}
</div>
```

### Padrão de Aging Chart (horizontal bars com values)

Para distribuição financeira:
```tsx
<div className="flex items-center gap-4">
  <span className="w-36 shrink-0 text-sm text-muted-foreground">{faixa}</span>
  <div className="flex-1">
    <div className="h-6 overflow-hidden rounded bg-muted relative">
      <div
        className="flex h-full items-center rounded bg-red-100 px-2 text-xs text-red-700 transition-all"
        style={{ width: `${Math.max(percentual, 8)}%` }}
      >
        {/* value inline se barra larga */}
      </div>
    </div>
  </div>
  <span className="w-16 shrink-0 text-right text-sm font-medium text-foreground">{qtd}</span>
</div>
```

### Acessibilidade em Charts

- Sempre `role="img"` + `aria-label` descritivo no container
- Para tabelas de dados: fornecer `<table>` alternativa (visível ou sr-only)
- Não depender apenas de cor para distinguir séries — usar padrões ou labels
- Paleta com distinção suficiente para daltonismo (azul/vermelho/slate — seguro)

---

## 11. Acessibilidade

### Requisitos Mínimos (WCAG AA)

**Contraste:**
- Texto normal: mínimo 4.5:1
- Texto large (18px+ ou 14px bold): mínimo 3:1
- UI components e borders: mínimo 3:1
- Texto muted (`#718096` sobre `#FFFFFF`): 4.6:1 — no limite, não descer abaixo

**Teclado:**
- `Tab` segue ordem visual da página
- Skip link "Pular para o conteúdo principal" obrigatório em apps com nav
- Focus rings visíveis: `focus-visible:ring-2 focus-visible:ring-ring` (orange `#F7941D`)
- Nunca `outline: none` sem substituto equivalente

**Semântica:**
- `<main id="main-content">` — target do skip link
- `<nav aria-label="...">` — toda navegação precisa de label acessível
- `<aside>` para sidebar
- `<header>` para topbar
- `aria-label` em icon-only buttons (Bell, X, Menu, collapse)
- `aria-expanded` em elementos de disclosure (menu mobile, dropdown)
- `aria-controls` apontando para o elemento controlado
- `aria-current="page"` no breadcrumb item atual

**Formulários:**
- Todo input com `<label for="...">` ou `aria-label`
- Erros de validação: próximos ao campo, não apenas no topo
- Mensagens de erro com `role="alert"` ou `aria-live="polite"`

**Imagens:**
- `alt` descritivo em imagens de conteúdo
- `alt=""` em imagens decorativas
- SVGs inline: `role="img"` + `aria-label`

**Mobile:**
- Touch targets mínimo 44×44px — implementado em sidebar collapse button (`min-h-[44px]`) e topbar buttons (`size-11`)
- `touch-action: manipulation` para eliminar delay de 300ms
- Não depender apenas de hover para interatividade

### Implementações Já Presentes (preservar)

```tsx
// Skip link
<a href="#main-content" className="sr-only focus:not-sr-only ...">
  Pular para o conteúdo principal
</a>

// Sidebar aria
<aside id="sidebar-nav" aria-hidden={mobile && !open}>

// Mobile button
<button aria-label="Abrir menu" aria-expanded={open} aria-controls="sidebar-nav">

// Breadcrumb
<nav aria-label="Caminho de navegação">
  <span aria-current="page">{current}</span>
</nav>

// Chart
<div role="img" aria-label="Gráfico de ...">
```

---

## 12. Tokens CSS (implementação)

### globals.css — Seção de Brand Tokens

```css
@theme inline {
  /* === RAIZ EDUCAÇÃO BRAND === */
  --color-raiz-orange:       #F7941D;
  --color-raiz-orange-dark:  #D97B10;
  --color-raiz-orange-light: #FDE8C8;
  --color-raiz-teal:         #5BB5A2;
  --color-raiz-teal-dark:    #3D9A87;
  --color-raiz-teal-light:   #D4EFE9;

  /* === SEMANTIC TOKENS === */
  --color-edu-primary:        #F7941D;
  --color-edu-primary-hover:  #D97B10;
  --color-edu-secondary:      #5BB5A2;
  --color-edu-success:        #2D9E6B;
  --color-edu-warning:        #E8A820;
  --color-edu-danger:         #DC3545;
  --color-edu-bg:             #F8F9FA;
  --color-edu-surface:        #FFFFFF;
  --color-edu-border:         #E2E8F0;
  --color-edu-text:           #1A202C;
  --color-edu-text-secondary: #4A5568;
  --color-edu-text-muted:     #718096;
}

:root {
  /* shadcn theme tokens */
  --background:    #F8F9FA;
  --foreground:    #1A202C;
  --card:          #FFFFFF;
  --primary:       #F7941D;    /* orange */
  --accent:        #5BB5A2;    /* teal */
  --ring:          #F7941D;    /* focus rings */
  --radius:        0.5rem;

  /* Sidebar dark theme */
  --sidebar:       #1E2433;
  --sidebar-primary: #F7941D;
  --sidebar-accent: #2D3548;
}
```

### Tailwind Classes de Atalho

Usar diretamente nos componentes (não criar utilitários desnecessários):

```
bg-[#F7941D]           → primary orange
text-[#F7941D]         → orange text
border-[#F7941D]       → orange border
bg-[#F7941D]/90        → orange 90% (active nav item)
border-[#F7941D]/25    → orange border sutil (alert card)
bg-[#FEF3E2]           → orange surface muito suave

bg-[#5BB5A2]           → teal
text-[#5BB5A2]         → teal text
bg-[#EAF6F3]           → teal surface muito suave

bg-sidebar             → #1E2433 (sidebar dark)
bg-white/8             → nav item hover
text-white/60          → nav text inactive
text-white/30          → nav section label
text-white/70          → mobile close button
```

### Status Classes Utilitárias

```css
.status-aprovado  { color: #1E8449; }
.status-reprovado { color: #C0392B; }
.status-pendente  { color: #D4AC0D; }
.status-ativo     { color: #1E8449; }
.status-inativo   { color: #808B96; }
.tabular-nums     { font-variant-numeric: tabular-nums; }
.table-zebra tbody tr:nth-child(even) { background-color: #F8F9FA; }
```

---

## 13. Checklist de Entrega

Antes de entregar qualquer componente ou página nova:

### Visual
- [ ] Cores da marca usadas corretamente (orange `#F7941D`, teal `#5BB5A2`)
- [ ] Nenhum emoji como ícone — somente SVG Lucide
- [ ] Ícones com `strokeWidth={1.75}` — padrão do sistema
- [ ] Cards com `border-0 shadow-sm` — sem double-boundary
- [ ] Hover states fornecem feedback visual claro

### Interação
- [ ] Todos elementos clicáveis com `cursor-pointer`
- [ ] Touch targets mínimo 44×44px em ações principais
- [ ] Transições em `150-300ms` com `transition-colors` ou `transition-all`
- [ ] Botões async: `disabled` durante loading com feedback visual
- [ ] Focus rings visíveis (`focus-visible:ring-2 focus-visible:ring-ring`)

### Typography & Contraste
- [ ] Texto normal mínimo 4.5:1 contraste sobre o fundo
- [ ] `text-muted-foreground` (`#718096`) nunca em fundo cinza (< 4.5:1)
- [ ] Colunas numéricas com `.tabular-nums`
- [ ] Inputs mobile com `font-size: max(16px, 1em)` (iOS anti-zoom)
- [ ] Hierarquia clara: h1 > card title > body > muted

### Layout
- [ ] Tabelas com `overflow-x-auto` para mobile
- [ ] Conteúdo responsivo em 375px, 768px, 1024px, 1440px
- [ ] Sem scroll horizontal em mobile
- [ ] Espaçamento canônico: `gap-6` entre seções, `p-3 sm:p-4 lg:p-6` no container

### Acessibilidade
- [ ] `aria-label` em icon-only buttons
- [ ] `alt` em todas as imagens
- [ ] `aria-label` ou `<label>` em todos inputs de formulário
- [ ] Skip link presente em páginas com nav pesada
- [ ] Ordem de tabulação segue fluxo visual

### Performance
- [ ] Apenas `transform`/`opacity` animados (sem width/height)
- [ ] `prefers-reduced-motion` respeitado
- [ ] Skeleton screens para dados assíncronos (não tela em branco)
- [ ] Imagens com `loading="lazy"` abaixo do fold

---

## Apêndice: Cores de Referência Rápida

```
── MARCA ─────────────────────────────────────────
#F7941D   Raiz Orange        (primary, CTAs, active)
#D97B10   Raiz Orange Dark   (hover)
#FDE8C8   Raiz Orange Light  (tint)
#FEF3E2   Raiz Orange XLight (alert surface)

#5BB5A2   Raiz Teal          (accent, secondary)
#3D9A87   Raiz Teal Dark     (hover)
#D4EFE9   Raiz Teal Light    (tint)
#EAF6F3   Raiz Teal XLight   (info surface)

── UI ────────────────────────────────────────────
#F8F9FA   Background App
#FFFFFF   Surface / Card
#1E2433   Sidebar Dark

── TEXTO ─────────────────────────────────────────
#1A202C   Foreground (principal)
#4A5568   Secondary
#718096   Muted

── BORDA ─────────────────────────────────────────
#E2E8F0   Border padrão

── STATUS ────────────────────────────────────────
#2D9E6B   Success / Ativo
#E8A820   Warning / Atenção
#DC3545   Danger / Erro
#3B82F6   Info / Volume
#D97706   Amber / Near-limit

── SIDEBAR ───────────────────────────────────────
rgba(255,255,255,0.60)  Nav item inactive text
rgba(255,255,255,0.30)  Section label text
rgba(255,255,255,0.10)  Separator / border
rgba(255,255,255,0.08)  Nav item hover bg
rgba(247,148,29,0.90)   Nav item active bg
```

---

*Documento mantido em `/Users/andregusmandeoliveira/Claude/docs/specs/raiz-educacao-design-system.md`*
*Fonte primária: análise do frontend TOTVS Educacional + logo vetorial oficial rAIz Educação*
*Complementado com: ag-B-52-design-ui-ux best practices (WCAG, UX guidelines, chart recommendations)*
