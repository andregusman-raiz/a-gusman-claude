# 08a — Quote Card Grid 3x2

## Quando usar
- Seção "social proof" de landing page
- 6 depoimentos selecionados (fit ideal)
- Quando cada quote é curto (< 300 chars)

## Quando NÃO usar
- Menos de 4 depoimentos → use `08f-single-featured-hero`
- Muitas citações a mostrar → `08b-marquee` ou `08c-masonry`
- Vídeo-testemunhos → `08d-video-grid`

## Props principais
- Array `TESTIMONIALS` externalizável
- `{ quote, name, role, company, initials }`
- Layout: grid `1 / 2 / 3` columns

## Dependências
- lucide-react (Quote icon)
- Tailwind + dark

## Variações
- Com foto real em vez de iniciais
- Com logo da empresa (substitui avatar)
- Com rating stars (5 estrelas acima do quote)

## Anti-patterns
- Quotes muito longos (quebra altura do card)
- Sem identificação da pessoa (perde credibilidade)
- Depoimentos fake/genéricos
