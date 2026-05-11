# 12d — Busca Primeiro (Estilo Algolia)

## Quando usar
- Knowledge base grande (>50 artigos) onde navegacao e ineficiente.
- Docs tecnicas onde usuario ja sabe o que busca.
- Help centers, API references, glossarios.

## Quando NAO usar
- Blog pequeno (<20 posts) — grid simples basta.
- Conteudo que se descobre por navegacao curada (use `12a` ou `12c`).
- Busca sem backend competente (requer indexacao, sinonimos).

## Props principais
- `posts`: `Post[]` — `{ id, title, excerpt, tag }`. Filtro client-side simples (substituir por Algolia/Supabase search em producao).

## Dependencias
- `react` com `useState` e `useMemo`.
- `lucide-react` (`Search`, `Command`).
- Tailwind.

## Variacoes
- Integracao com Algolia DocSearch ou Supabase full-text search.
- Highlight de matches no resultado.
- Historico de buscas recentes.
- Comando `Cmd+K` ativando modal fullscreen.

## Anti-patterns
- Busca client-side em datasets grandes (>500 items) — migrar para servidor.
- Input sem `type="search"` (perde X clear nativo).
- Sem empty state quando zero resultados.
- Placeholder vazio ou generico ("Buscar") — indicar o que se pode buscar.
