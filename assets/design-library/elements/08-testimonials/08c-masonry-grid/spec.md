# 08c — Masonry Grid (Pinterest-style)

## Quando usar
- Quando quotes têm tamanhos variados (curtos + longos)
- Dar sensação orgânica de quantidade
- Mostrar mix: ratings + depoimentos + cases

## Quando NÃO usar
- Quando quotes são todos do mesmo tamanho → `08a` (grid uniforme)
- Mobile puro (colapsa em 1 coluna, perde o efeito)
- Quando ordem de leitura importa (colunas CSS reordenam visualmente)

## Props principais
- Array com `rating?` opcional (mostra estrelas)
- Layout: `columns-1 md:columns-2 lg:columns-3`
- `break-inside-avoid` crítico nos cards

## Dependências
- lucide-react (Star)
- Tailwind (suporte a columns via plugin/config padrão)

## Variações
- 4 colunas em XL
- Todos com rating
- Misturar com logo da empresa em alguns cards

## Anti-patterns
- Esquecer `break-inside-avoid` (cards cortados)
- Misturar com vídeo (difere muito de altura)
- Sem limite de altura (quote gigante quebra balanço)
