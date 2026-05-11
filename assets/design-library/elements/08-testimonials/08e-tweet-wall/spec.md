# 08e — Tweet Wall

## Quando usar
- Produtos com comunidade ativa (dev tools, creators)
- Quando existem tweets reais (pedir permissão + link)
- Dar sensação de "movimento" + recência (há 2h, 1d)

## Quando NÃO usar
- Sem comunidade pública real (fake tweets = dano reputacional)
- Produto enterprise B2B tradicional (canais formais)
- Quando X/Twitter não é canal do público-alvo

## Props principais
- `TWEETS[]` com engagement numbers
- `verified?: boolean` — badge azul
- `timeAgo: string` — formatação livre

## Dependências
- lucide-react (Heart, MessageCircle, Repeat2)
- SVG custom para verified badge

## Variações
- Link para tweet original (href no article)
- Embutir tweets reais via widget X (mais complexo)
- Com reply-thread visual

## Anti-patterns
- Tweets fake (detectável e viral negativo)
- Sem timestamp (parece embaraçoso/outdated)
- Números inflados (desproporcionais ao alcance real)
