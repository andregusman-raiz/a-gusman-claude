# 06e — VS Comparison Stats

## Quando usar
- Produto disputando mercado com concorrentes claros
- Quando você tem vantagens mensuráveis
- Páginas de "por que escolher X"
- Anchor page em SEO competitivo

## Quando NÃO usar
- Concorrente direto nomeado (caminho de litígio)
- Quando suas métricas não são consistentemente melhores
- Early-stage sem dados sólidos

## Props principais
- `title` / `subtitle`
- `marketLabel` / `usLabel`
- `stats`: `[{ label, market, us }]`

## Dependências
- `lucide-react` (Check, Minus)

## Variações (responsive, dark)
- Mobile: grid 3-col denso, labels wrap
- Desktop: tabela mais espaçada
- Coluna "us" em verde destacado

## Anti-patterns
- Comparação enviesada (market com piores cases)
- Sem fonte/timestamp dos dados
- Todos os stats com vantagem massiva (perde credibilidade)
- Copy marketing em vez de números objetivos
