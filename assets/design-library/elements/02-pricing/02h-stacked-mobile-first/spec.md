# 02h — Stacked Mobile-First Pricing

## Quando usar
Apps B2C mobile-first (fintech, fitness, creator tools). Users predominantemente em mobile precisam scroll vertical fluido.

## Quando NÃO usar
B2B desktop-heavy com decisão de compra em viewport large. Tiers com muitas features (>5) — lista fica longa demais.

## Props principais
- `tiers?: Tier[]` — 2-4 tiers
- `title?: string` — título da seção
- `onSelect?: (tier) => void` — handler

## Dependências
- react, lucide-react (Check, Star)
- shadcn/ui components: Card, Button (inline)

## Variações
- max-w-md + space-y-4: cards empilhados, sem grid
- Popular badge usa Star icon + amber accent
- Preço e título lado a lado (flex) — economiza altura

## Anti-patterns
- Não aplicar grid responsivo aqui — layout é intencionalmente stack
- Evitar features demais por tier — mobile = scroll
- Não esconder highlighted badge em dark — manter contraste
