# 03g — Video Showcase

## Quando usar
Produtos complexos que se explicam melhor com vídeo (demo de workflow, tour guiado). Complementa features detalhadas.

## Quando NÃO usar
Apps simples (video vira overhead). Se equipe não produz vídeo de qualidade — substituir por screenshot animado/GIF.

## Props principais
- `videoPosterUrl?: string` — imagem poster do vídeo
- `videoLabel?: string` — texto no badge
- `features?: MiniFeature[]` — 4 cards ao redor
- `onPlay?: () => void` — handler play (embed/modal)

## Dependências
- react, lucide-react (Play, Zap, Shield, BarChart3, Users)
- shadcn/ui components: Card, Button (inline)

## Variações
- Grid 3 colunas lg: (features | video | features), stack em mobile
- Botão play grande e centralizado; aspect-video mantém proporção
- Badge label no canto inferior do video

## Anti-patterns
- Autoplay com som — nunca
- Esconder o poster (degrada LCP)
- Features genéricas ao redor — escolher os 4 highlights reais
