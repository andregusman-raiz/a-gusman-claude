---
name: ag-11-ux-ui
description: "Maquina de design UI/UX. 67 estilos, 96 paletas, 57 font pairings, 13 stacks. Design system, componentes, landing pages, dashboards. Integra com shadcn, Figma, v0."
model: sonnet
context: fork
argument-hint: "[action] [element/project]"
---

## Pre-Load: rAIz Design Library (OBRIGATORIO)

ANTES de gerar qualquer design system ou componente, consultar:

1. **Design System Oficial**: `~/Claude/assets/UI_UX/raiz-educacao-design-system.md` — tokens, cores, tipografia, spacing (para projetos rAIz)
2. **Catalogo de Solucoes**: `~/Claude/assets/design-library/catalog.md` — 24 solucoes curadas
3. **Solution Specs**: `~/Claude/assets/design-library/solutions/NN-id/spec.md` — props, layout, CSS, deps
4. **Componentes Base**: `~/Claude/assets/design-library/catalog/src/components/ui/` — 13 shadcn customizados

Se o projeto e rAIz Educacao → usar tokens do design system oficial como base.
Se existe solucao catalogada → adaptar em vez de criar do zero.
Se criou componente novo reutilizavel → propor adicao ao catalogo como nova solution spec.

---

## Stack Detection
- **Framework**: !`cat package.json 2>/dev/null | grep -o '"next"\|"react"\|"vue"\|"svelte"' | head -1 || echo "unknown"`

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 67 styles, 96 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types across 13 technology stacks. Searchable database with priority-based recommendations.

## When to Apply

Reference these guidelines when:
- Designing new UI components or pages
- Choosing color palettes and typography
- Analisando apps nativos via ag-capturar-tela (captura tela desktop para design review)
- Reviewing code for UX issues
- Building landing pages or dashboards
- Implementing accessibility requirements

## Rule Categories by Priority

| Priority | Category | Impact | Domain |
|----------|----------|--------|--------|
| 1 | Accessibility | CRITICAL | `ux` |
| 2 | Touch & Interaction | CRITICAL | `ux` |
| 3 | Performance | HIGH | `ux` |
| 4 | Layout & Responsive | HIGH | `ux` |
| 5 | Typography & Color | MEDIUM | `typography`, `color` |
| 6 | Animation | MEDIUM | `ux` |
| 7 | Style Selection | MEDIUM | `style`, `product` |
| 8 | Charts & Data | LOW | `chart` |

## Quick Reference

### 1. Accessibility (CRITICAL)

- `color-contrast` - Minimum 4.5:1 ratio for normal text
- `focus-states` - Visible focus rings on interactive elements
- `alt-text` - Descriptive alt text for meaningful images
- `aria-labels` - aria-label for icon-only buttons
- `keyboard-nav` - Tab order matches visual order
- `form-labels` - Use label with for attribute

### 2. Touch & Interaction (CRITICAL)

- `touch-target-size` - Minimum 44x44px touch targets
- `hover-vs-tap` - Use click/tap for primary interactions
- `loading-buttons` - Disable button during async operations
- `error-feedback` - Clear error messages near problem
- `cursor-pointer` - Add cursor-pointer to clickable elements

### 3. Performance (HIGH)

- `image-optimization` - Use WebP, srcset, lazy loading
- `reduced-motion` - Check prefers-reduced-motion
- `content-jumping` - Reserve space for async content

### 4. Layout & Responsive (HIGH)

- `viewport-meta` - width=device-width initial-scale=1
- `readable-font-size` - Minimum 16px body text on mobile
- `horizontal-scroll` - Ensure content fits viewport width
- `z-index-management` - Define z-index scale (10, 20, 30, 50)

### 5. Typography & Color (MEDIUM)

- `line-height` - Use 1.5-1.75 for body text
- `line-length` - Limit to 65-75 characters per line
- `font-pairing` - Match heading/body font personalities

### 6. Animation (MEDIUM)

- `duration-timing` - Use 150-300ms for micro-interactions
- `transform-performance` - Use transform/opacity, not width/height
- `loading-states` - Skeleton screens or spinners

### 7. Style Selection (MEDIUM)

- `style-match` - Match style to product type
- `consistency` - Use same style across all pages
- `no-emoji-icons` - Use SVG icons, not emojis

### 8. Charts & Data (LOW)

- `chart-type` - Match chart type to data type
- `color-guidance` - Use accessible color palettes
- `data-table` - Provide table alternative for accessibility

## How to Use

Search specific domains using the CLI tool below.

---


## Prerequisites

Check if Python is installed:

```bash
python3 --version || python --version
```

If Python is not installed, install it based on user's OS:

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install python3
```

**Windows:**
```powershell
winget install Python.Python.3.12
```

---

## How to Use This Skill

When user requests UI/UX work (design, build, create, implement, review, fix, improve), follow this workflow:

### Step 1: Analyze User Requirements

Extract key information from user request:
- **Product type**: SaaS, e-commerce, portfolio, dashboard, landing page, etc.
- **Style keywords**: minimal, playful, professional, elegant, dark mode, etc.
- **Industry**: healthcare, fintech, gaming, education, etc.
- **Stack**: React, Vue, Next.js, or default to `html-tailwind`

### Step 2: Generate Design System (REQUIRED)

**Always start with `--design-system`** to get comprehensive recommendations with reasoning:

```bash
python3 skills/ag-11-ux-ui/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This command:
1. Searches 5 domains in parallel (product, style, color, landing, typography)
2. Applies reasoning rules from `ui-reasoning.csv` to select best matches
3. Returns complete design system: pattern, style, colors, typography, effects
4. Includes anti-patterns to avoid

**Example:**
```bash
python3 skills/ag-11-ux-ui/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Step 2b: Persist Design System (Master + Overrides Pattern)

To save the design system for hierarchical retrieval across sessions, add `--persist`:

```bash
python3 skills/ag-11-ux-ui/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

This creates:
- `design-system/MASTER.md` — Global Source of Truth with all design rules
- `design-system/pages/` — Folder for page-specific overrides

**With page-specific override:**
```bash
python3 skills/ag-11-ux-ui/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

This also creates:
- `design-system/pages/dashboard.md` — Page-specific deviations from Master

**How hierarchical retrieval works:**
1. When building a specific page (e.g., "Checkout"), first check `design-system/pages/checkout.md`
2. If the page file exists, its rules **override** the Master file
3. If not, use `design-system/MASTER.md` exclusively

### Step 3: Supplement with Detailed Searches (as needed)

After getting the design system, use domain searches to get additional details:

```bash
python3 skills/ag-11-ux-ui/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

**When to use detailed searches:**

| Need | Domain | Example |
|------|--------|---------|
| More style options | `style` | `--domain style "glassmorphism dark"` |
| Chart recommendations | `chart` | `--domain chart "real-time dashboard"` |
| UX best practices | `ux` | `--domain ux "animation accessibility"` |
| Alternative fonts | `typography` | `--domain typography "elegant luxury"` |
| Landing structure | `landing` | `--domain landing "hero social-proof"` |

### Step 4: Stack Guidelines (Default: html-tailwind)

Get implementation-specific best practices. If user doesn't specify a stack, **default to `html-tailwind`**.

```bash
python3 skills/ag-11-ux-ui/scripts/search.py "<keyword>" --stack html-tailwind
```

Available stacks: `html-tailwind`, `react`, `nextjs`, `vue`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

---

## Search Reference

### Available Domains

| Domain | Use For | Example Keywords |
|--------|---------|------------------|
| `product` | Product type recommendations | SaaS, e-commerce, portfolio, healthcare, beauty, service |
| `style` | UI styles, colors, effects | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | Font pairings, Google Fonts | elegant, playful, professional, modern |
| `color` | Color palettes by product type | saas, ecommerce, healthcare, beauty, fintech, service |
| `landing` | Page structure, CTA strategies | hero, hero-centric, testimonial, pricing, social-proof |
| `chart` | Chart types, library recommendations | trend, comparison, timeline, funnel, pie |
| `ux` | Best practices, anti-patterns | animation, accessibility, z-index, loading |
| `react` | React/Next.js performance | waterfall, bundle, suspense, memo, rerender, cache |
| `web` | Web interface guidelines | aria, focus, keyboard, semantic, virtualize |
| `prompt` | AI prompts, CSS keywords | (style name) |

### Available Stacks

| Stack | Focus |
|-------|-------|
| `html-tailwind` | Tailwind utilities, responsive, a11y (DEFAULT) |
| `react` | State, hooks, performance, patterns |
| `nextjs` | SSR, routing, images, API routes |
| `vue` | Composition API, Pinia, Vue Router |
| `svelte` | Runes, stores, SvelteKit |
| `swiftui` | Views, State, Navigation, Animation |
| `react-native` | Components, Navigation, Lists |
| `flutter` | Widgets, State, Layout, Theming |
| `shadcn` | shadcn/ui components, theming, forms, patterns |
| `jetpack-compose` | Composables, Modifiers, State Hoisting, Recomposition |

---

## Example Workflow

**User request:** "Làm landing page cho dịch vụ chăm sóc da chuyên nghiệp"

### Step 1: Analyze Requirements
- Product type: Beauty/Spa service
- Style keywords: elegant, professional, soft
- Industry: Beauty/Wellness
- Stack: html-tailwind (default)

### Step 2: Generate Design System (REQUIRED)

```bash
python3 skills/ag-11-ux-ui/scripts/search.py "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
```

**Output:** Complete design system with pattern, style, colors, typography, effects, and anti-patterns.

### Step 3: Supplement with Detailed Searches (as needed)

```bash
# Get UX guidelines for animation and accessibility
python3 skills/ag-11-ux-ui/scripts/search.py "animation accessibility" --domain ux

# Get alternative typography options if needed
python3 skills/ag-11-ux-ui/scripts/search.py "elegant luxury serif" --domain typography
```

### Step 4: Stack Guidelines

```bash
python3 skills/ag-11-ux-ui/scripts/search.py "layout responsive form" --stack html-tailwind
```

**Then:** Synthesize design system + detailed searches and implement the design.

### Step 5: Creative Execution (Anti-AI-Slop)

After generating the design system (Steps 2-4), apply these creative execution principles during implementation. A correct design system executed generically still looks like AI output.

**Design Thinking — commit to a BOLD direction:**
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick a clear extreme — brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian. Execute with precision.
- **Differentiation**: What's the one thing someone will remember about this UI?

**Typography — distinctive, never generic:**
- Choose fonts that are beautiful, unique, and characterful
- NEVER default to Inter, Roboto, Arial, or system fonts — these scream "AI generated"
- Pair a distinctive display font with a refined body font
- NEVER converge on the same "safe" font (e.g., Space Grotesk) across designs

**Color & Theme — dominant, not distributed:**
- Dominant colors with sharp accents outperform timid, evenly-distributed palettes
- Use CSS variables for consistency
- NEVER use cliched purple gradients on white backgrounds

**Motion — orchestrated, not scattered:**
- One well-orchestrated page load with staggered reveals (`animation-delay`) creates more delight than scattered micro-interactions
- Prioritize CSS-only solutions for HTML; Motion library for React
- Use scroll-triggering and hover states that surprise

**Spatial Composition — break the grid intentionally:**
- Asymmetry, overlap, diagonal flow, grid-breaking elements
- Generous negative space OR controlled density — both work, timid middle doesn't
- Unexpected layouts create memorability

**Backgrounds & Visual Details — create atmosphere:**
- NEVER default to solid white/gray backgrounds
- Apply contextual effects: gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, grain overlays
- Match texture to the aesthetic direction from Step 2

**Match complexity to vision:**
- Maximalist designs need elaborate code with extensive animations and effects
- Minimalist designs need restraint, precision, and careful spacing/typography
- Elegance comes from executing the vision well, not from adding more

---

## Output Formats

The `--design-system` flag supports two output formats:

```bash
# ASCII box (default) - best for terminal display
python3 skills/ag-11-ux-ui/scripts/search.py "fintech crypto" --design-system

# Markdown - best for documentation
python3 skills/ag-11-ux-ui/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Tips for Better Results

1. **Be specific with keywords** - "healthcare SaaS dashboard" > "app"
2. **Search multiple times** - Different keywords reveal different insights
3. **Combine domains** - Style + Typography + Color = Complete design system
4. **Always check UX** - Search "animation", "z-index", "accessibility" for common issues
5. **Use stack flag** - Get implementation-specific best practices
6. **Iterate** - If first search doesn't match, try different keywords

---

## Common Rules for Professional UI

These are frequently overlooked issues that make UI look unprofessional:

### Icons & Visual Elements

| Rule | Do | Don't |
|------|----|----- |
| **No emoji icons** | Use SVG icons (Heroicons, Lucide, Simple Icons) | Use emojis like 🎨 🚀 ⚙️ as UI icons |
| **Stable hover states** | Use color/opacity transitions on hover | Use scale transforms that shift layout |
| **Correct brand logos** | Research official SVG from Simple Icons | Guess or use incorrect logo paths |
| **Consistent icon sizing** | Use fixed viewBox (24x24) with w-6 h-6 | Mix different icon sizes randomly |

### Interaction & Cursor

| Rule | Do | Don't |
|------|----|----- |
| **Cursor pointer** | Add `cursor-pointer` to all clickable/hoverable cards | Leave default cursor on interactive elements |
| **Hover feedback** | Provide visual feedback (color, shadow, border) | No indication element is interactive |
| **Smooth transitions** | Use `transition-colors duration-200` | Instant state changes or too slow (>500ms) |

### Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|----- |
| **Glass card light mode** | Use `bg-white/80` or higher opacity | Use `bg-white/10` (too transparent) |
| **Text contrast light** | Use `#0F172A` (slate-900) for text | Use `#94A3B8` (slate-400) for body text |
| **Muted text light** | Use `#475569` (slate-600) minimum | Use gray-400 or lighter |
| **Border visibility** | Use `border-gray-200` in light mode | Use `border-white/10` (invisible) |

### Layout & Spacing

| Rule | Do | Don't |
|------|----|----- |
| **Floating navbar** | Add `top-4 left-4 right-4` spacing | Stick navbar to `top-0 left-0 right-0` |
| **Content padding** | Account for fixed navbar height | Let content hide behind fixed elements |
| **Consistent max-width** | Use same `max-w-6xl` or `max-w-7xl` | Mix different container widths |

---

## Extended Component Libraries

Beyond shadcn/ui (base), reference these libraries for specialized needs:

### AI Elements (elements.ai-sdk.dev) — MANDATORY for AI text
- **Install**: `npx ai-elements@latest`
- **Chat (19)**: Message, Conversation, PromptInput, Reasoning, Chain of Thought, Tool, Sources, Suggestion, Confirmation, etc.
- **Code (13)**: CodeBlock, Terminal, FileTree, StackTrace, TestResults, Sandbox, JSXPreview, etc.
- **Voice (6)**: AudioPlayer, SpeechInput, Transcription, VoiceSelector, etc.
- **Workflow (7)**: Canvas, Node, Edge, Connection, Controls, Panel, Toolbar
- **When**: Any AI-generated text, chat UI, tool call rendering, workflow visualization

### Cult UI (cult-ui.com) — Animated Components
- **Install**: Registry-based (copy-paste like shadcn)
- **67+ components** drop-in for shadcn/ui projects
- **AI-specific**: AI Instructions, Prompt Library
- **Effects**: Hero Dithering, Liquid Metal, Fractal Grid, Shader Lens Blur, LightBoard
- **Interactions**: Dynamic Island, Expandable Card/Screen, Direction Aware Tabs, Family Drawer
- **Marketing**: Logo Carousel, Tweet Grid, Gradient Heading, 3D Carousel
- **Animation**: Text Animate, Typewriter, Animated Number, Terminal Animation
- **When**: Landing pages, marketing UI, micro-animations, AI instruction panels, premium visual effects

### Tool UI (tool-ui.com) — AI Tool Call Rendering
- **Install**: `npm install tool-ui` (MIT, assistant-ui org)
- **25+ components** with Zod schemas + preset data
- **Decision/Confirmation**: Approval cards, order summaries, message drafts, option lists
- **Input/Config**: Parameter sliders, preference panels, question flows
- **Display/Artifacts**: Tables, charts, code blocks, terminals, citations
- **Media**: Image galleries, video players, social media previews
- **Progress**: Plan trackers, progress widgets, weather displays
- **When**: Chat interfaces with tool calling — renders tool payloads as interactive UI instead of raw JSON

### HextaUI (hextaui.com) — Extended Blocks for shadcn/ui
- **Install**: Registry-based
- **Pre-composed blocks**: Complex form sections, dashboard panels, landing blocks
- **6 themes**: Default, Retro Blue, Purple, Night Wind, Orbiter, Soft Orange (OKLCH)
- **When**: Rapid prototyping of composed layouts, alternative themes

### Inference.sh UI (ui.inference.sh) — Agent Runtime Components
- **Agent component**: Full runtime with tools, streaming, approvals, widgets
- **Tool UI**: Lifecycle management (pending → progress → approval → results)
- **Widgets**: Declarative UI from JSON (forms, buttons, cards)
- **Markdown renderer**: Syntax highlighting + embeds
- **When**: Agent interfaces that need durable execution, human-in-the-loop approval flows

### Decision Matrix — Which Library When

| Need | Library | Why |
|------|---------|-----|
| Any AI text rendering | AI Elements (mandatory) | Handles streaming, markdown, parts |
| Chat with tool calls | AI Elements + Tool UI | Tool UI renders payloads beautifully |
| Animated landing page | Cult UI | 67+ effects, drop-in shadcn |
| AI instruction panel | Cult UI (AI Instructions) | Purpose-built component |
| Dashboard blocks | HextaUI | Pre-composed, themed |
| Agent with approval flow | Inference.sh UI | Runtime + approval UI built-in |
| Workflow visualization | AI Elements (Workflow) | Canvas + Node + Edge |
| Offline AI features | WebLLM + custom UI | Browser-side LLM, zero API cost |

---

## Pre-Delivery Checklist

Before delivering UI code, verify these items:

### Visual Quality
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] Brand logos are correct (verified from Simple Icons)
- [ ] Hover states don't cause layout shift
- [ ] Use theme colors directly (bg-primary) not var() wrapper

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation

### Light/Dark Mode
- [ ] Light mode text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Test both modes before delivery

### Layout
- [ ] Floating elements have proper spacing from edges
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

### Accessibility
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected
