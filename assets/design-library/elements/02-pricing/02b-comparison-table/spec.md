# 02b — Comparison Table

## Quando usar
Muitas features (8+) entre tiers. Ajuda comprador B2B a justificar upgrade com detalhes granulares.

## Quando NÃO usar
Landing page mobile-first (tabela sofre em viewports < 640px). Produtos com <4 features diferenciadoras — preferir 02a.

## Props principais
- `tiers?: { name, price, cta, highlighted }[]` — colunas da tabela
- `features?: { name, values }[]` — values podem ser boolean ou string (ex: "50GB")
- `title?: string` — título acima da tabela
- `onSelect?: (tier: string) => void` — handler do CTA

## Dependências
- react, lucide-react (Check, X)
- shadcn/ui components: Table (usamos HTML nativo)

## Variações
- Sticky header ao fazer scroll vertical (adicionar `sticky top-0` se precisar)
- Highlighted column tem bg diferenciado + sticky CTA no topo
- Rows zebradas para leitura

## Anti-patterns
- Não usar >12 linhas — paralisia de análise
- Não misturar boolean e long strings muito diferentes (confunde alinhamento)
- Evitar preço sem período — sempre `/mês` ou `/ano` explícito
