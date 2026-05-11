# 11d — Empty State com CTA Primario

## Quando usar
- Dashboard vazio na primeira sessao do usuario.
- Lista sem itens apos filtro (ajustar mensagem).
- Secao que requer 1 acao clara para ser util (criar projeto, adicionar time).

## Quando NAO usar
- Loading (use skeleton em vez disso — `14b`).
- Erro (use `14e-error-boundary-card`).
- 404 (use `14a-404-with-search`).

## Props principais
- `title`: heading (default "Comece por aqui").
- `description`: texto explicando o que fazer.
- `primaryLabel`, `secondaryLabel`: labels dos CTAs.
- `onPrimary`, `onSecondary`: handlers.

## Dependencias
- `react`.
- `lucide-react` (`Plus`, `BookOpen`).
- Tailwind. SVG inline (nao depende de external asset).

## Variacoes
- Com 2 CTAs primarios (criar do zero / importar template).
- Sem secondary — so CTA primario.
- Com video tutorial ao inves de link docs.

## Anti-patterns
- Empty state sem CTA — usuario fica travado.
- Copy generica ("Nenhum item") sem contexto de proximo passo.
- Ilustracao sem ligacao com o dominio do produto.
- Mais de 2 CTAs (perde foco).
