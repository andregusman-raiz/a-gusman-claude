# 08b — Marquee Scroll Horizontal

## Quando usar
- Seção com 8+ depoimentos curtos
- Dar sensação de "muita gente usa" (volume visual)
- Landing com hero impactante seguida de prova social animada

## Quando NÃO usar
- Quotes longos (não cabem em card estreito)
- Quando leitura detalhada importa → use `08a`
- Público com preferência por motion reduzido (tem fallback, mas perde graça)

## Props principais
- Array `TESTIMONIALS` com `quote` curto
- Animação CSS `@keyframes` (40s linear infinite)
- Duplicação do array para loop infinito

## Dependências
- Só Tailwind + CSS custom
- Respeita `prefers-reduced-motion`

## Variações
- 2 linhas em direções opostas (mais movimento)
- Pausa on hover (já incluso)
- Velocidade configurável via prop + CSS var

## Anti-patterns
- Quotes longos (não dá tempo de ler)
- Sem gradient nas bordas (visual corta-cru)
- Ignorar `prefers-reduced-motion`
