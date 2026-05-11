# 05e — Centered Quote CTA

## Quando usar
- Página com cliente de peso (nome reconhecível)
- Próximo ao CTA final — prova social + ação
- Testimonial único que vale mais que uma sessão de cards
- B2B com ciclo de decisão longo

## Quando NÃO usar
- Sem testimonials reais (NUNCA inventar)
- Quote sem permissão explícita do cliente
- Produto B2C de impulso (nota/review é mais eficaz)

## Props principais
- `quote` — texto entre aspas, 30-50 palavras ideal
- `authorName` / `authorRole`
- `authorAvatar` — opcional, fallback para iniciais
- `ctaLabel` / `onCtaClick`

## Dependências
- `lucide-react` (Quote, ArrowRight)

## Variações (responsive, dark)
- Mobile: quote menor, todo conteúdo centrado
- Desktop: tipografia grande (`md:text-4xl`)
- Avatar: imagem ou gradient com iniciais

## Anti-patterns
- Quote longa demais (>60 palavras) → ninguém lê
- Role genérico ("CEO") sem empresa
- Avatar sem `alt`
- Quote marks escapadas erradas
