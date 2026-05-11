# 03h — Interactive Preview

## Quando usar
Features visuais (dashboards, UI kit, design tool) onde a preview é o próprio argumento de venda. Hover/focus troca imagem.

## Quando NÃO usar
Mobile-first (hover não existe em touch — se for só mobile, usar 03e tab). Features textuais sem preview real.

## Props principais
- `features?: Feature[]` — (id, icon, title, description, previewCaption, accentFrom, accentTo)
- `title?: string`, `subtitle?: string`

## Dependências
- react (useState), lucide-react (icons)
- shadcn/ui components: Tabs (custom inline com role=tablist e onMouseEnter/onFocus)

## Variações
- Hover + focus + click trocam active — inclusivo para teclado
- Preview placeholder: gradient + icon grande (substituir por screenshot real)
- Labels em caption rodapé simulam arquivo de screenshot

## Anti-patterns
- Não depender só de hover — adicionar onFocus e onClick (keyboard + mobile)
- Animar troca demasiado — simples fade suficiente
- Previews sem caption — user fica perdido sobre o que está vendo
