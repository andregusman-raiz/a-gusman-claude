# 02c — Single Tier Hero

## Quando usar
SaaS com um único plano (ex: Basecamp flat fee, apps indie). Mensagem clara, conversion-focused, remove paradoxo da escolha.

## Quando NÃO usar
Produtos com tiers reais de valor (Free/Pro/Enterprise) — esconder tiers é perda de receita. Produtos com pricing usage-based.

## Props principais
- `title?: string` — headline do hero
- `subtitle?: string` — descrição sob headline
- `price?: string`, `period?: string` — preço e periodicidade
- `features?: string[]` — benefícios listados abaixo
- `cta?: string`, `onSelect?: () => void` — botão principal
- `badge?: string` — tag opcional no topo (ex: "Oferta de lançamento")

## Dependências
- react, lucide-react (Check, Sparkles)
- shadcn/ui components: Button, Badge (usamos inline)

## Variações
- Preço gigante (7xl) domina a página
- Features em grid 2 colunas desktop, 1 coluna mobile
- Badge opcional no topo (remover se não houver promo)

## Anti-patterns
- Não incluir tiers escondidos em fine print
- Evitar features genéricas ("suporte") — ser específico ("24/7 com resposta em 2h")
- Não usar fonte serifada no preço — menos impacto visual
