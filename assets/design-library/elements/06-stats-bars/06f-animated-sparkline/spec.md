# 06f — Stats com Sparkline

## Quando usar
- Mostrar evolução temporal (receita, usuários, uptime)
- Produto que tem dado histórico real
- Dashboard preview em landing
- Relatório executivo condensado

## Quando NÃO usar
- Dados sem trend temporal (ex: % conversão único)
- Stats estáticos (NPS pontual)
- Sparklines com dados fake (usuário detecta)

## Props principais
- `stats`: `[{ value, label, data: number[], trend? }]`

## Dependências
- `lucide-react` (TrendingUp)
- SVG inline (sem lib externa)

## Variações (responsive, dark)
- Mobile: 1 coluna
- Desktop: 3 colunas
- Sparkline usa `currentColor` → herda da cor do parent

## Anti-patterns
- Sparkline com <5 pontos → ruidoso
- Y-axis sem min/max adequados → achata variação
- Gradient que polui (usar stopOpacity baixo)
- Sparkline com `aria-hidden=false` mas sem label descritivo
