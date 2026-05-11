# 01f — Social First Auth

## Quando usar
Produtos desenvolvedor/criador (GitHub, Figma, Vercel, Linear). Quando >70% dos users já têm conta Google/GitHub.

## Quando NÃO usar
Produtos enterprise com SSO corporativo obrigatório (Okta, SAML). Mercados onde OAuth providers têm baixa penetração.

## Props principais
- `onGoogle?: () => void` — handler Google OAuth
- `onGithub?: () => void` — handler GitHub OAuth
- `onEmailSubmit?: (email: string) => void` — fallback por e-mail
- `brand?: string` — nome da empresa

## Dependências
- react (useState), lucide-react (Mail)
- SVG inline: Google/GitHub icons (sem pacote extra)
- shadcn/ui components: Button (usamos custom para controle de ícone)

## Variações
- Social buttons em ordem: Google primeiro (adoção mais alta)
- Dark mode: logos mantêm cores brand, container troca bg
- Divider "ou": tem bg do container para cobrir a linha

## Anti-patterns
- Não usar >3 providers social — scroll e paradoxo da escolha
- Não esconder email fallback — alguns users não querem linkar
- Evitar ícones coloridos full em dark mode — GitHub pode ficar monochrome
- Termos/Privacy abaixo: sempre visíveis (compliance)
