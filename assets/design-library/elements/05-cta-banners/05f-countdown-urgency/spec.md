# 05f — Countdown Urgency CTA

## Quando usar
- Promoção genuína com deadline real
- Black Friday, liquidação, flash sale
- Launch window (early bird, beta)
- Webinar/evento com horário

## Quando NÃO usar
- Urgência fake (o usuário percebe e perde confiança)
- Produto sem ciclo de promoção
- B2B enterprise onde desconto rígido soa amador
- Sites que precisam renderizar SSR estático (countdown é client-only)

## Props principais
- `title` / `subtitle`
- `targetDate`: Date objetivo
- `ctaLabel` / `onCtaClick`

## Dependências
- `react` (useState, useEffect)
- `lucide-react` (Clock, ArrowRight)

## Variações (responsive, dark)
- Mobile: números menores mas ainda dramáticos
- Gradient vermelho/rosa por urgência
- `tabular-nums` evita "jumping" quando muda dígito

## Anti-patterns
- Countdown que reseta ao recarregar (fake)
- Não usar `aria-live` → screenreader grita cada segundo
- Esquecer `clearInterval` no unmount (memory leak)
- Target no passado sem fallback visual
