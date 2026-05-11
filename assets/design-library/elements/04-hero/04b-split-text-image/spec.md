# 04b — Split Text + Image Hero

## Quando usar
- Produto visual (dashboards, SaaS B2B, ferramentas)
- Screenshot vende melhor que copy
- Queremos mostrar o produto logo de cara
- Landing de feature específica

## Quando NÃO usar
- Produto ainda em desenvolvimento (sem screenshot)
- Hero muito denso — split precisa respiro
- Mobile-only — stack vira muito alto

## Props principais
- `title` / `subtitle`
- `primaryCta` / `secondaryCta`
- `imageAlt`: descrição acessível do placeholder

## Dependências
- `lucide-react` (ArrowRight, PlayCircle)
- Tailwind (aspect-video, grid, shadow-2xl)

## Variações (responsive, dark)
- Mobile: stack vertical, imagem abaixo
- Desktop `lg:`: 2 colunas 50/50
- Dark: gradient do placeholder ajusta para slate-900

## Anti-patterns
- Screenshot com texto ilegível em mobile
- Aspect-video cortado por altura fixa
- CTA secundário visualmente igual ao primário
- Image sem `alt`/`aria-label`
