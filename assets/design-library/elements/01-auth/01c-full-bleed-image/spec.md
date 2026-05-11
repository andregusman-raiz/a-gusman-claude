# 01c — Full Bleed Image Auth

## Quando usar
Produtos premium, creative tools, marketplaces de design, viagens, hospitalidade — onde a imagem vende a experiência.

## Quando NÃO usar
Apps corporativos/admin (ruído visual), produtos com tema dark estrito, ou quando performance mobile é crítica (imagem grande).

## Props principais
- `onSubmit?: ({ email, password }) => void` — handler do form
- `onSignUp?: () => void` — link para criação de conta
- `brand?: string` — nome da empresa
- `backgroundUrl?: string` — URL da imagem de fundo (default: Unsplash placeholder)

## Dependências
- react, lucide-react (Mail, Lock, ArrowRight), tailwindcss
- shadcn/ui components: nenhum — inputs nativos com estilos tailwind

## Variações
- Card flutua à direita por default — usar `justify-start` ou `justify-center` para mover
- Dark mode: card `slate-950/90` com backdrop-blur mantém legibilidade
- Overlay: gradient escurecedor ajuda contraste do card

## Anti-patterns
- Evitar imagens < 2000px — pixelam em monitores large
- Não escolher imagens muito movimentadas — prejudica leitura do card
- Evitar overlay opaco demais — perde valor da imagem
