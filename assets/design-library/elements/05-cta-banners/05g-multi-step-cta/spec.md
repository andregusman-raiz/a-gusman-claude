# 05g — Multi-Step CTA

## Quando usar
- Produto com múltiplos personas (self-serve, SMB, enterprise)
- Final de landing — dar opções em vez de forçar caminho
- Quando funil se divide claramente (trial / demo / sales)
- B2B com ciclos de decisão diversos

## Quando NÃO usar
- Produto simples com 1 CTA óbvio
- Quando as 3 opções se sobrepõem (cliente fica confuso)
- Espaço vertical limitado (cards pedem respiro)

## Props principais
- `title` / `subtitle`
- `options`: array de `{ icon, title, description, bullets, ctaLabel, onCtaClick, highlighted }`

## Dependências
- `lucide-react` (Rocket, Play, PhoneCall, ArrowRight, Check)

## Variações (responsive, dark)
- Mobile: 1 coluna, cards empilhados
- Desktop: 3 colunas (`md:grid-cols-3`)
- Card `highlighted` com inversão de cores e badge

## Anti-patterns
- 4+ opções (paralisia de escolha)
- Sem "mais popular" destacado
- Bullets desiguais entre cards (parece inconsistente)
- Ícones sem `aria-hidden` (screenreader lê redundante)
