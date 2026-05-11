# 02e — Credit Pack Grid

## Quando usar
Produtos AI/API com pricing por consumo (OpenAI, Anthropic, Runway, Replicate). Usuário compra lotes pré-pagos com descontos escalonados.

## Quando NÃO usar
SaaS tradicional com assinatura mensal — criar créditos adiciona fricção. Produtos sem consumo mensurável.

## Props principais
- `packs?: Pack[]` — array de pacotes (credits, price, popular, bonus)
- `title?: string`, `subtitle?: string` — headline
- `onSelect?: (credits, price) => void` — handler de compra

## Dependências
- react, lucide-react (Zap, Check)
- shadcn/ui components: Card, Badge (usamos inline)

## Variações
- Grid 2×3 desktop, 2 colunas em mobile
- Pack popular com bg invertido + badge
- Bonus tag (discount %) em cada pack maior

## Anti-patterns
- Não esconder o "por crédito" — comprador quer comparar unit economics
- Evitar mais de 6 packs — paradoxo da escolha
- Não dar desconto linear — progressão deve incentivar upgrade
