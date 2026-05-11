# 01a — Split Screen Auth

## Quando usar
Login/signup de SaaS B2B que quer reforçar brand e value proposition. Ideal quando há espaço para storytelling visual ao lado do form.

## Quando NÃO usar
Apps mobile-first ou produtos onde auth deve ser o mais discreto possível. Em viewports < 1024px o hero visual é escondido, perdendo parte do valor.

## Props principais
- `onSubmit?: ({ email, password }) => void` — handler do form
- `onForgotPassword?: () => void` — link de recuperação
- `onSignUp?: () => void` — link para criação de conta
- `brand?: string` — nome da empresa no canto superior
- `heroTitle?: string` — título do painel direito
- `heroSubtitle?: string` — subtítulo do painel direito

## Dependências
- react, lucide-react (Mail, Lock, ArrowRight, Sparkles), tailwindcss
- shadcn/ui components usados: nenhum (inputs/button nativos estilizados)

## Variações
- Responsive: 50/50 em `lg:` (>=1024px), stack single-column em mobile
- Dark mode: tokens `slate-*` reagem a `dark:`, gradient hero mantém brand
- Layout: esquerda pode virar direita trocando `grid-cols` order

## Anti-patterns
- Evitar imagens hero muito pesadas que bloqueiam LCP
- Não esconder o brand em mobile — manter visível
- Não usar campos extras (CPF, telefone) neste layout — preferir 01d-multi-step-wizard
