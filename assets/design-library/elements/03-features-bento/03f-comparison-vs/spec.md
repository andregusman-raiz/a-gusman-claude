# 03f — Comparison vs Competitor

## Quando usar
Produto posicionado contra incumbent ou alternative. Páginas "Why us" / "Switch from X" convertem muito.

## Quando NÃO usar
Produtos sem competidor claro ou quando comparação é contenciosa legalmente. Evitar se concorrente tem mais features.

## Props principais
- `items?: ComparisonItem[]` — (label, us, them) — bool ou string
- `ourLabel?: string`, `theirLabel?: string` — nomes das colunas
- `title?: string`, `subtitle?: string` — headline

## Dependências
- react, lucide-react (Check, X)
- shadcn/ui components: Table (usamos grid-cols custom)

## Variações
- Grid 3 cols (label, us, them) com coluna "us" destacada (bg sutil)
- Valor pode ser boolean ou string (ex: "Só enterprise", "Limitada")
- Rows zebradas para leitura

## Anti-patterns
- Não mentir/distorcer sobre competidor — legal + credibilidade
- Evitar >10 linhas — perde impacto
- Não usar copy agressivo ("X é horrível") — manter factual
