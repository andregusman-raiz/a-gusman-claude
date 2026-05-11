# 03b — Bento Asymmetric

## Quando usar
Páginas marketing onde cada tile tem conteúdo diferente (estatística, imagem, texto, demo). Estilo Apple/Linear/Vercel.

## Quando NÃO usar
Features uniformes (preferir 03a). Apps/dashboards internos onde grid regular é mais legível.

## Props principais
- `title?: string`, `subtitle?: string` — headline
- (layout e tiles hardcoded — designer-friendly, customizar direto no TSX)

## Dependências
- react, lucide-react (Zap, Shield, BarChart3, Users, Globe, Sparkles)
- shadcn/ui components: nenhum

## Variações
- Hero tile: col-span-2 row-span-2 com gradient
- Stat tile: número grande + delta
- Image-like tile: icon gigante com opacity-10 como textura
- Grid: 4 colunas desktop, 1 coluna mobile (stack automático)

## Anti-patterns
- Não fazer todos os tiles iguais — perde o "asymmetric"
- Evitar colunas/rows demais — max 4×2 para manter escaneabilidade
- Não colocar conteúdo crítico no tile de imagem grande — é decorativo
