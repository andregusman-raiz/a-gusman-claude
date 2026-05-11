# 01d — Multi-Step Wizard

## Quando usar
Signup com muitos campos que intimidam se exibidos todos juntos. Ótimo para onboarding B2B com verificação de e-mail.

## Quando NÃO usar
Login (apenas e-mail + senha) — usuários recorrentes devem ir direto. Fluxos <4 campos — overkill.

## Props principais
- `onComplete?: ({ email, name, company, code }) => void` — submit final
- `brand?: string` — nome da empresa no topo

## Dependências
- react (useState), lucide-react (Mail, User, Building2, Check, ArrowRight, ArrowLeft)
- shadcn/ui components: Button, Input, Progress (usamos custom stepper inline)

## Variações
- Progress indicator: numbered steps com linha conectora, troca `Check` quando done
- Steps configuráveis via array `STEPS` — facilmente extensível para 4-5 etapas
- Dark mode: stepper ativo mantém contraste slate-50/slate-900

## Anti-patterns
- Não usar mais que 4 steps — fatiga
- Não permitir skip de step obrigatório
- Não perder dados entre steps (aqui mantemos no state)
- Evitar voltar ao step 1 após envio de código — reenviar código sim
