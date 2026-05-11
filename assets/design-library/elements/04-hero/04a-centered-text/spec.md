# 04a — Centered Text Hero

## Quando usar
- Landing page de SaaS com proposta de valor clara
- Produto novo sem screenshot ainda pronto
- Foco total na mensagem (copy > visual)
- Quando a identidade visual é sóbria e tipográfica

## Quando NÃO usar
- Produto visualmente rico (preferir 04b ou 04e)
- Hero que precisa demonstrar o produto imediatamente
- Páginas de e-commerce (cliente quer ver o produto)

## Props principais
- `eyebrow`: badge acima do título (opcional)
- `title`: H1 principal
- `subtitle`: parágrafo descritivo
- `primaryCta` / `secondaryCta`: `{ label, onClick }`

## Dependências
- `lucide-react` (ArrowRight)
- Tailwind CSS com modo dark

## Variações (responsive, dark)
- Mobile: `text-4xl`, CTAs em coluna
- Tablet `md:`: `text-6xl`, CTAs em linha
- Desktop `lg:`: `text-7xl`
- Dark mode: fundo `slate-950`, texto `slate-50`

## Anti-patterns
- Título com mais de 10 palavras → cansa o leitor
- 3+ CTAs → decisão difícil; manter 2 no máximo
- Subtitle que repete o título
- Remover o `text-balance` → quebras ruins em 2 linhas
