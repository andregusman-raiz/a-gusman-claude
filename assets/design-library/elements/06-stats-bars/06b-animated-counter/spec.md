# 06b — Animated Counter Stats

## Quando usar
- Hero adjacente ou featured section
- Quando números são impactantes e merecem destaque
- Marketing sites com design "vivo"
- Landing de produto maduro com métricas relevantes

## Quando NÃO usar
- Accessibility-first para usuários com `prefers-reduced-motion`
- Stats que mudam em runtime (não é dashboard)
- Dashboards de analytics (confunde dado real com animação)

## Props principais
- `stats`: `[{ value, label, suffix?, prefix?, decimals? }]`
- `duration`: ms da animação (padrão 1600)

## Dependências
- `react` (useEffect, useState, useRef)
- `IntersectionObserver` API
- `requestAnimationFrame`

## Variações (responsive, dark)
- Mobile: 2 colunas
- Desktop: 4 colunas
- Animação dispara apenas quando entra no viewport
- `tabular-nums` evita jitter de largura

## Anti-patterns
- Duração > 3s — parece lento
- Não respeitar `prefers-reduced-motion`
- `setInterval` em vez de `requestAnimationFrame` → jitter
- Animação sempre tocando (não usar IntersectionObserver) → confunde
