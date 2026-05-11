# 06a — Horizontal Row Stats

## Quando usar
- Stats simples sem precisar de animação
- Credibilidade rápida após o hero
- Breaker entre seções
- Landing com 3-4 números de impacto

## Quando NÃO usar
- Stats que pedem comparação (preferir 06e)
- Quando você tem trend/delta (preferir 06c)
- 1-2 stats — ficam perdidos

## Props principais
- `stats`: `[{ value, label, hint? }, ...]`

## Dependências
- Nenhuma além de Tailwind

## Variações (responsive, dark)
- Mobile: 2 colunas (`grid-cols-2`)
- Desktop: 4 colunas com divider vertical (`md:divide-x`)
- Dark mode automático

## Anti-patterns
- Stats sem rounding (ex: "98.47%" parece fake e poluído)
- 5+ stats em uma linha (fica apertado)
- Labels longos (>40 chars) quebrando layout
- Divider em mobile (vira visualmente sujo)
