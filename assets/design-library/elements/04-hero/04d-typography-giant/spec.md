# 04d — Typography Giant Hero

## Quando usar
- Portfólio criativo, estúdio de design, agência
- Marca editorial, fashion, arquitetura
- Quando o produto é o próprio manifesto
- Hero para storytelling tipográfico

## Quando NÃO usar
- SaaS B2B tradicional (parece pouco utilitário)
- Quando precisa comunicar muita informação rápido
- E-commerce (cliente precisa do produto, não de poesia)

## Props principais
- `words`: array de palavras em linhas separadas
- `tagline`: frase de canto
- `ctaLabel` / `onCtaClick`

## Dependências
- `lucide-react` (ArrowDown)
- Tailwind com `clamp()` inline style para tipografia fluida

## Variações (responsive, dark)
- `clamp(3.5rem, 14vw, 14rem)` → escala com viewport
- Mobile: texto ainda impactante mas legível
- Desktop: ocupa altura da viewport (`min-h-screen`)

## Anti-patterns
- 5+ palavras → vira parede de texto
- Esquecer `tracking-tighter` → tipografia massiva precisa negative tracking
- Header/footer pesados → competem com o hero
- Font-weight < 700 → hero massivo pede peso forte
