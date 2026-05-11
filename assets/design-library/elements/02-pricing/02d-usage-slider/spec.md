# 02d — Usage Slider

## Quando usar
Pricing per-seat ou usage-based onde o valor varia conforme uso (ex: Linear, Slack, GitHub). Permite usuário simular antes de comprar.

## Quando NÃO usar
Preços fixos sem variabilidade real. Produtos com muitos eixos de pricing (seats + storage + requests) — fica confuso.

## Props principais
- `basePrice?: number` — preço fixo da plataforma
- `perSeatPrice?: number` — incremento por seat
- `minSeats?: number`, `maxSeats?: number` — range do slider
- `features?: string[]` — features inclusas independente do uso
- `onSelect?: (seats, total) => void` — handler com seleção

## Dependências
- react (useState, useMemo), lucide-react (Users, Check)
- shadcn/ui components: Slider (usamos input range nativo com accent-color)

## Variações
- Slider nativo `<input type="range">` estilizado com `accent-slate-900`
- Cálculo em tempo real via useMemo
- Formatação BRL nativa (Intl.NumberFormat)

## Anti-patterns
- Não mostrar só o total — detalhar breakdown ajuda transparência
- Evitar max=Infinity — sempre oferecer "Fale com vendas" para casos extremos
- Não esconder basePrice — comprador fica desconfiado
