# 08h — Carousel Pagination

## Quando usar
- 3-6 depoimentos curados, similar peso/qualidade
- Espaço vertical limitado
- Usuário controla ritmo (preferível a marquee)

## Quando NÃO usar
- 10+ depoimentos (usuário cansa) → `08c-masonry`
- Landing rápida (carousel custa interação)
- Quando não tem marca forte de "cada quote é importante"

## Props principais
- `SLIDES[]` array
- Estado `index` via useState
- Controles: prev/next + dots tabs

## Dependências
- lucide-react (ChevronLeft, ChevronRight, Quote)
- Tailwind

## Variações
- Auto-play com pause on hover (useEffect setInterval)
- Swipe gestures em mobile (touch events)
- Fade transition entre slides (em vez de troca direta)

## Anti-patterns
- Auto-play sem pausa (acessibilidade)
- Sem indicadores de posição (usuário perdido)
- Altura variável entre slides (layout shift)
