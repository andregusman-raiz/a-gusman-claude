# 04e — Product Screenshot Below Hero

## Quando usar
- Hero conversão: texto curto + CTA + prova visual enorme
- Produto com UI bonita que vende
- Analytics, dashboards, design tools
- Quando queremos o "wow" da screenshot

## Quando NÃO usar
- Produto sem interface visual forte
- Texto longo acima precisa de mais atenção
- Produto early-stage sem UI final

## Props principais
- `eyebrow` / `title` / `subtitle`
- `primaryCta`

## Dependências
- `lucide-react` (ArrowRight)
- Tailwind (shadow custom, aspect-video, gradient)

## Variações (responsive, dark)
- Mobile: screenshot fica menor mas ainda dramática
- Desktop: sombra 50px blur, produto "flutuando"
- Dark: sombra preta profunda em vez de slate

## Anti-patterns
- Screenshot cortada por fold → perde impacto
- Sombra fraca → produto parece "flat"
- Subtitle > 2 linhas → poluí o caminho até o CTA
- Placeholder sem `aria-label` (acessibilidade)
