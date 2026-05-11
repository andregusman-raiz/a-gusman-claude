# 06c — Card-Based Stats

## Quando usar
- Dashboard landing page (preview)
- Apresentação de KPIs com trend
- Quando stats têm contexto (ícone, variação)
- Produto de analytics ou finance

## Quando NÃO usar
- Stats muito simples (preferir 06a — mais direto)
- Quando não há trend/variação
- Landing super-minimalista

## Props principais
- `title` / `subtitle`
- `stats`: `[{ icon, value, label, trend: { direction, value } }]`

## Dependências
- `lucide-react` (TrendingUp, TrendingDown, Users, DollarSign, Activity, Zap)

## Variações (responsive, dark)
- Mobile: 1 coluna
- Tablet: 2 colunas (`sm:grid-cols-2`)
- Desktop: 4 colunas (`lg:grid-cols-4`)
- Trend badge muda cor (up verde / down rosa)

## Anti-patterns
- Trend down vermelho quando é positivo (ex: latência menor = bom)
- Ícones inconsistentes visualmente (diferentes estilos)
- Muitas cores (polui)
- Valor sem contexto (`12.4k` sem unidade)
