# 14c — Empty State com Ilustracao

## Quando usar
- Lista vazia (inbox, notifications, projects) antes do primeiro item.
- Apos filtro que resulta em zero (com mensagem adaptada).
- Modulo novo recem-ativado sem dados.

## Quando NAO usar
- Loading state (use `14b-loading-skeleton`).
- Erro (use `14e-error-boundary-card`).
- 404 de rota (use `14a-404-with-search`).

## Props principais
- `title`: heading (default "Nada por aqui ainda").
- `description`: contexto do que falta.
- `ctaLabel`, `onCta`: acao primaria.

## Dependencias
- `react`.
- `lucide-react` (`Plus`).
- Tailwind. SVG inline (lotus Raiz-brand).

## Variacoes
- Ilustracao diferente por dominio (inbox = caixa, projects = pasta).
- Sem CTA quando e estado decorativo.
- Com 2 CTAs (criar vs importar template).

## Anti-patterns
- "No data" seco sem contexto ou CTA.
- Ilustracao meramente decorativa sem ligacao com dominio.
- Empty state identico em diferentes secoes (genericidade).
- SVG externo (preferir inline para evitar flash).
