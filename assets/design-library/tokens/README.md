# Tokens

> **Source of truth machine-readable** dos design tokens rAIz Educação. Cada JSON aqui é canônico para seu domínio (cores, tipografia, spacing, radii, layout).

## Arquivos

| Arquivo | Conteúdo |
|---------|----------|
| `colors.json` | Brand (orange/teal), semantic (bg/fg/border), status (success/warning/danger/info) |
| `typography.json` | Escala de texto, fonts (IBM Plex Sans/Mono), weights, line-heights |
| `spacing.json` | Escala 4px (Tailwind tokens) |
| `radii.json` | 5 níveis de border-radius (--radius-sm → --radius-2xl) |
| `layout.json` | Dimensões fixas (topbar, sidebar, container max) |

## Três camadas da mesma verdade

| Camada | Arquivo | Para quem |
|--------|---------|-----------|
| Prose canonical | `../UI_UX/raiz-educacao-design-system.md` | Designers, devs (leitura humana, rationale) |
| Machine-readable | `tokens/*.json` (esta pasta) | Tooling, scripts, AI agents, geração |
| Runtime CSS | `../catalog/src/app/globals.css` | Browser (CSS variables Tailwind v4) |

Alterações começam aqui (JSON), propagam para o MD (prose) e para o globals.css (runtime). Os 3 devem estar sincronizados.

## Como consumir

### Scripts / build tools
```ts
import colors from "~/Claude/assets/design-library/tokens/colors.json";
const raizOrange = colors.brand.orange.base.hex; // "#F7941D"
```

### AI agents / Claude Code
Carregar skill `/ag-referencia-design-presentation` — inclui referência aos tokens. Ou ler direto: `assets/design-library/tokens/colors.json`.

### Página interativa (humanos)
Rodar o catalog app:
```bash
cd ~/Claude/assets/design-library/catalog && npm run dev -- -p 3011
# http://localhost:3011/tokens
```

Deploy Vercel (production): `https://catalog-*.vercel.app/tokens`

## TODO — débito conhecido

- `catalog/src/app/tokens/page.tsx` hardcoda os tokens inline. Refatorar para importar dos JSONs desta pasta (elimina drift).
- `globals.css` está desacoplado dos JSONs. Criar script `scripts/generate-tokens-css.ts` que gera `globals.css` a partir dos JSONs.
- Adicionar `elevation.json` (sombras) e `motion.json` (timing/easing) — ver seções 5 e 9 do design-system.md.
