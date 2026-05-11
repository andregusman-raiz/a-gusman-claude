# 07g — Transparent → Solid on Scroll

## Quando usar
- Landing com hero full-bleed (vídeo, imagem, gradient grande)
- Marketing imersivo onde nav precisa sumir no topo
- Produtos visuais (agências, consumo, portfolio)

## Quando NÃO usar
- Dashboard/app logado
- Landing simples com hero branco
- Quando legibilidade over background é imprevisível

## Props principais
- `threshold: number` — px para virar solid (default 50)
- `brand`, `links`
- Estado `solid` via scroll listener

## Dependências
- Tailwind + transitions
- Hook scroll simples (sem lib)

## Variações
- Trigger por seção (IntersectionObserver) em vez de scroll absoluto
- Combinar com `07d` (pill flutuante solid)
- Inversão em modo dark (começa dark, vira light)

## Anti-patterns
- Textos transparentes em fundo inconsistente (map claro/escuro)
- Transitions abruptas (< 200ms)
- Scroll listener sem `passive: true` (performance)
