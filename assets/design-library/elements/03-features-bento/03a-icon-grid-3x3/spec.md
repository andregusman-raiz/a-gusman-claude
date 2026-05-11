# 03a — Icon Grid 3x3

## Quando usar
Apresentar 6-9 features principais de forma escaneável. Clássico, funciona em qualquer landing page.

## Quando NÃO usar
Features que precisam de comparação (preferir 03f) ou storytelling visual (preferir 03b bento).

## Props principais
- `features?: Feature[]` — array (icon, title, description)
- `title?: string`, `subtitle?: string` — headline da seção

## Dependências
- react, lucide-react (vários icons disponíveis), tailwindcss
- shadcn/ui components: nenhum

## Variações
- Grid 3 colunas lg, 2 colunas sm, 1 coluna mobile
- Icon em square rounded com bg invertido
- Hover scale suave (group)

## Anti-patterns
- Não usar menos que 6 features — vazio visual; para 4-5 preferir 03c
- Descriptions > 2 linhas quebram alinhamento — manter concisas
- Evitar ícones decorativos sem significado — cada icon deve representar a feature
