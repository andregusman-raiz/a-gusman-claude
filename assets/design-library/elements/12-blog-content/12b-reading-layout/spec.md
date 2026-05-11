# 12b — Layout de Leitura com TOC Sticky

## Quando usar
- Artigos long-form (>1500 palavras) com 4+ secoes (H2).
- Documentacao tecnica, tutoriais, guias.
- Posts que se beneficiam de navegacao intra-pagina.

## Quando NAO usar
- Posts curtos (<800 palavras) — TOC polui.
- Conteudo sem H2s estruturados.
- Mobile-first devices — TOC oculto abaixo de lg (correto).

## Props principais
- `title`, `author`, `readingTime`, `date`: metadata do post.

## Dependencias
- `react` com `useState` (scroll-spy simulado via click).
- `lucide-react` (`Clock`, `User`).
- Tailwind. `scroll-mt-24` para offset em anchor links.

## Variacoes
- Scroll-spy real com IntersectionObserver.
- TOC com indentacao por H2/H3.
- Reading progress bar no topo (combinar com `14b` pattern).
- Serif font para coluna principal (`font-serif` class).

## Anti-patterns
- Coluna de leitura muito larga (>70ch quebra legibilidade).
- TOC em mobile (ocupa vertical demais — use summary/details).
- Links TOC sem `scroll-mt-*` — anchor cortado pelo header fixo.
- Falta de `aria-label` em nav do indice.
