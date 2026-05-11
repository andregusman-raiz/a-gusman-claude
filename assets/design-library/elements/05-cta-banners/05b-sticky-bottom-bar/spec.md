# 05b — Sticky Bottom Bar CTA

## Quando usar
- Landing longa — cliente pode rolar e esquecer CTA
- Promoção temporária ("desconto expira em X")
- Captura de email/newsletter persistente
- Mobile — CTA sempre acessível

## Quando NÃO usar
- Site com outras barras fixas no bottom (overlap)
- Conteúdo que já precisa dos últimos pixels (checkout)
- Quando vira intrusivo (já tem modal + exit-intent)

## Props principais
- `message` — texto curto (<100 chars)
- `ctaLabel` / `onCtaClick`
- `dismissible`: permite fechar (padrão true, acessibilidade)

## Dependências
- `react` (useState)
- `lucide-react` (ArrowRight, X)

## Variações (responsive, dark)
- Mobile: mensagem pode ficar truncada — testar
- Backdrop blur com 95% opacity
- Dark mode automático

## Anti-patterns
- Sem dismiss → enfurece usuário (acessibilidade)
- Mensagem > 120 chars → quebra em 2 linhas móvel
- z-index baixo (outras modais passam por cima)
- Não respeitar safe-area em iOS notch
