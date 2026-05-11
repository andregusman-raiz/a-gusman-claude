# 05c — Email Capture Inline CTA

## Quando usar
- Newsletter com audiência ainda sendo construída
- Cliente ainda não pronto para comprar (top of funnel)
- Waitlist de produto em pre-launch
- Content marketing / blog

## Quando NÃO usar
- Produto já em produção e foco em conversão paga
- Quando email capture está em 3+ lugares na página
- Mobile flow de checkout

## Props principais
- `title` / `subtitle`
- `placeholder` / `ctaLabel`
- `onSubmit(email)`: handler
- `disclaimer`: texto LGPD/GDPR

## Dependências
- `react` (useState, FormEvent)
- `lucide-react` (Mail, ArrowRight, CheckCircle2)

## Variações (responsive, dark)
- Mobile: input + botão empilhados
- Desktop: lado a lado (`sm:flex-row`)
- Estado submitted: mensagem de confirmação verde

## Anti-patterns
- Submit sem feedback visual (usuário não sabe se funcionou)
- Sem `type="email"` (nativa validation perdida)
- `required` junto com validação custom inconsistente
- Ausência de disclaimer LGPD
