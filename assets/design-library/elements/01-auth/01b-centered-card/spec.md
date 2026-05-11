# 01b — Centered Card Auth

## Quando usar
Layout clássico e seguro para apps internos, admin panels e MVPs. Minimal setup, neutro, funciona em qualquer viewport.

## Quando NÃO usar
Marketing/product landing pages onde auth é primeira impressão da marca — preferir split screen (01a) ou full-bleed (01c).

## Props principais
- `onSubmit?: ({ email, password }) => void` — handler do form
- `onForgotPassword?: () => void` — link de recuperação
- `onSignUp?: () => void` — link para criação de conta
- `brand?: string` — nome da empresa

## Dependências
- react, lucide-react (Mail, Lock, ArrowRight), tailwindcss
- shadcn/ui components: Button, Card, Input, Checkbox (opcional — aqui usamos nativos)

## Variações
- Responsive: single column, max-w-sm sempre centralizado
- Dark mode: fundo `slate-900`, card `slate-950` com ring
- Width: trocar `max-w-sm` por `max-w-md` para form com mais campos

## Anti-patterns
- Evitar sombra muito forte — manter `shadow-xl` ou menos
- Não usar mais de 3 campos neste layout — perde a leveza
- Não posicionar no topo (perde simetria visual)
