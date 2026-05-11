# 07a — Logo + Links + CTA

## Quando usar
- Landing page SaaS padrão com até 6 links principais
- Marketing site com 1 CTA primário de conversão
- Produto com navegação simples e previsível

## Quando NÃO usar
- Produto com dezenas de seções → use `07b-mega-menu`
- App logado com navegação complexa → use `07c-sidebar-fixed`
- Mobile-first com ações rápidas → use `07f-mobile-bottom-tabs`

## Props principais
- `brand: string` — nome da marca (default "Raiz")
- `links: NavLink[]` — array de `{ label, href }`
- `ctaLabel: string`, `ctaHref: string` — CTA primário
- `className?: string` — override

## Dependências
- Tailwind CSS (dark variants)
- Sem libs externas

## Variações
- Sticky: adicionar `sticky top-0 z-40`
- Transparente: remover `bg-white/80` e controlar via scroll (vira `07g`)
- Sem login link: remover `#login`

## Anti-patterns
- Mais de 6 links → overflow visual, migre para mega menu
- CTA secundário próximo ao primário → confusão
- Links com cópia genérica ("Clique aqui") — sempre use ação/substantivo
