# 12c — Cards Filtrados por Categoria

## Quando usar
- Blogs com 3-6 categorias bem definidas.
- Release notes filtraveis por tipo (feature/fix/breaking).
- Centro de ajuda com cards por tema.

## Quando NAO usar
- Mais de 6 categorias (use dropdown ou multi-select).
- Conteudo sem taxonomia clara (feed cronologico resolve).
- Filtros que requerem logica complexa (date range, free text — use `12d`).

## Props principais
- `posts`: `Post[]` — `{ id, title, excerpt, date, category }`.

## Dependencias
- `react` com `useState` e `useMemo`.
- Tailwind.

## Variacoes
- Filtro multi-select (aceitar array de categorias ativas).
- URL state (sync com `?cat=tutorial`).
- Contador de posts por categoria no chip ("Tutorial 12").
- Infinite scroll no grid filtrado.

## Anti-patterns
- Sem empty state quando filtro retorna zero.
- Filtros sem `role="tab"` e `aria-selected` (a11y).
- Categorias com labels inconsistentes (Tutorial vs tutorial).
- Reset silencioso ao mudar categoria (manter scroll position).
