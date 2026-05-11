# 12a — Grid Tipo Revista com Hero Post

## Quando usar
- Landing de blog com destaque editorial (1 post principal + complementos).
- Publicacoes com curadoria (1 post semanal merece destaque).
- Home de newsletter com issue mais recente em destaque.

## Quando NAO usar
- Blogs com volume alto (use grid homogeneo + paginacao).
- Sem imagens fortes — o layout depende visualmente do thumb grande.
- Conteudo efemero (news ticker).

## Props principais
- `posts`: `Post[]` — `{ id, title, excerpt, date, category, thumb }`. Primeiro e hero.

## Dependencias
- `react`.
- Tailwind (usa `grid`, `md:col-span-2`, `md:row-span-2` e `aspect-*`).
- Sem deps externas (imagens simuladas por gradient).

## Variacoes
- Substituir gradient por `<Image>` do Next.js.
- Hero com video em vez de imagem.
- Filtros por categoria acima do grid (combinar com `12c`).

## Anti-patterns
- Hero sem diferenca visual clara do resto (perde hierarquia).
- Cards com alturas desiguais causando grid irregular sem `row-span`.
- Excerpt longo sem `line-clamp` — quebra o layout em mobile.
