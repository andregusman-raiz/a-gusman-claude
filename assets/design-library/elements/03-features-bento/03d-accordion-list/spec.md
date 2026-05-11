# 03d — Accordion List

## Quando usar
Páginas FAQ-style para features. Quando descrições são longas e usuário quer expandir apenas o que interessa.

## Quando NÃO usar
Landing page de primeira impressão — esconde informação. Features curtas (preferir 03a).

## Props principais
- `features?: AccordionFeature[]` — (icon, title, summary, details)
- `title?: string` — título da seção

## Dependências
- react (useState), lucide-react (ChevronDown + icons por feature)
- shadcn/ui components: Accordion (usamos custom inline com aria-expanded/controls)

## Variações
- Single-open default (openIdx state) — trocar para Set<number> se multi
- Primeiro item aberto por default para mostrar padrão
- Icon em square à esquerda de cada trigger

## Anti-patterns
- Não permitir multi-open sem indicação clara — UX fica confusa
- Evitar animações pesadas na expansão — slide simples basta
- Não esconder chevron — affordance de "clicável"
