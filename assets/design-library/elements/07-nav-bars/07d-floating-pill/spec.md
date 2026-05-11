# 07d — Floating Pill Nav

## Quando usar
- Landing moderna, estilo Vercel/Linear/Arc
- Hero com imagem ou gradient atrás (backdrop-blur destaca)
- Produto com identidade visual mais criativa/design-forward

## Quando NÃO usar
- App empresarial tradicional (parece informal)
- Dashboard logado → use sidebar
- 8+ links → pill fica apertada

## Props principais
- `brand`, `links`, `ctaLabel`
- Baseado em `rounded-full` + `backdrop-blur-xl`
- Posicionamento: `sticky top-4`

## Dependências
- Tailwind (backdrop-blur requer `backdrop-filter` no plugin)
- Sem JS

## Variações
- Transparent + solid no scroll (combinar com `07g`)
- Com dark/light toggle embutido
- Width fixo `w-fit` + `mx-auto` para pill compacta central

## Anti-patterns
- Sem backdrop-blur em fundo colorido (fica ilegível)
- CTA de alta prioridade em pill secundária
- Pill com > 6 links (poluição visual)
