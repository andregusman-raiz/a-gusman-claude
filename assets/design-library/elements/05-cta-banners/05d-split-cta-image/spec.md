# 05d — Split CTA + Image

## Quando usar
- Feature em destaque (novo produto, release)
- CTA dual: primário + secundário (preços/demo)
- Meio de página — segmenta conteúdo sem full-bleed
- Imagem agrega narrativa

## Quando NÃO usar
- Final de página onde full-bleed é mais forte (preferir 05a)
- Mobile crítico sem imagem boa (vira só texto)

## Props principais
- `eyebrow`: badge
- `title` / `subtitle`
- `primaryCta` / `secondaryCta`
- `imageAlt`

## Dependências
- `lucide-react` (ArrowRight, Sparkles)

## Variações (responsive, dark)
- Mobile: stack vertical, imagem abaixo
- Desktop: 2 colunas, imagem à direita
- Card com border + gradient sutil

## Anti-patterns
- Imagem sem `alt`/`aria-label`
- 3 CTAs no mesmo bloco
- Card muito grande competindo com hero
- Título longo + subtitle longo = denso demais
