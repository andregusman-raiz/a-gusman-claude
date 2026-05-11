# 01e — Magic Link Only

## Quando usar
Produtos modernos (Notion, Linear, Vercel) que priorizam UX sem senha. Ideal para usuários técnicos e produtos B2B internos.

## Quando NÃO usar
Produtos com audiência não-técnica que esperam senha tradicional. Ambientes offline. Compliance que exige MFA próprio.

## Props principais
- `onSendLink?: (email: string) => void` — dispara envio do link
- `brand?: string` — nome da empresa

## Dependências
- react (useState), lucide-react (Mail, Sparkles, CheckCircle2)
- shadcn/ui components: Button, Input, Alert (usamos custom inline)

## Variações
- Success state inline (este) vs navegação para página dedicada
- Dark mode: success card em emerald-950/40 preserva hierarquia
- Resend: permite reenvio sem navegar — bom para UX

## Anti-patterns
- Não permitir reenvio imediato (rate limit no backend; opcional countdown no UI)
- Não esconder o e-mail digitado no success — usuário precisa confirmar
- Evitar copy genérico "check your email" — personalizar com o e-mail
