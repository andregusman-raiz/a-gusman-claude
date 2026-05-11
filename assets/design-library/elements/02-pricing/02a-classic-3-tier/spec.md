# 02a — Classic 3-Tier Pricing

## Quando usar
SaaS padrão com Free/Pro/Enterprise. Padrão familiar; usuários entendem rapidamente a proposta de valor entre planos.

## Quando NÃO usar
Produtos single-plan, pricing complexo (multi-eixo), ou AI/API com consumo variável — preferir 02d ou 02e.

## Props principais
- `tiers?: Tier[]` — array de planos (name, price, period, description, features, cta, highlighted)
- `title?: string` — título da seção
- `subtitle?: string` — subtítulo
- `onSelect?: (tier: string) => void` — handler de seleção

## Dependências
- react, lucide-react (Check), tailwindcss
- shadcn/ui components: Card, Button, Badge (usamos inline)

## Variações
- Tier destacado: scale-up em desktop (`md:scale-105`), badge "Popular"
- Dark mode: highlighted inverte (bg slate-50 em dark), outros slate-950
- Responsive: 3 colunas md+, stack vertical mobile

## Anti-patterns
- Não destacar >1 tier ao mesmo tempo
- Evitar features em demasia (>7) — preferir comparison-table (02b)
- Não omitir preço do Enterprise — se for "sob consulta", usar 02g
