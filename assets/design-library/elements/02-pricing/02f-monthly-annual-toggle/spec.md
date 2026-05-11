# 02f — Monthly/Annual Toggle

## Quando usar
Pricing com desconto anual evidente. Funciona bem para SaaS B2B onde economia anual é argumento de venda forte.

## Quando NÃO usar
Só plano mensal ou só anual. Pricing com períodos múltiplos (mensal/trimestral/anual/bianual) — toggle fica confuso.

## Props principais
- `tiers?: Tier[]` — tiers com `monthly` e `annual` prices
- `title?: string` — título da seção
- `onSelect?: (tier, cycle) => void` — handler com ciclo selecionado

## Dependências
- react (useState), lucide-react (Check)
- shadcn/ui components: Tabs, Badge (usamos inline role=tablist)

## Variações
- Default cycle = "annual" (incentiva LTV maior)
- Badge "-20%" no toggle + savings em cada card quando annual
- Preço sempre exibido como "/mês" (mesmo no anual — honesty UX)

## Anti-patterns
- Não esconder o preço mensal real quando estiver em annual — transparência
- Evitar defaults mensal — deixa dinheiro na mesa
- Não animar demais a troca — UX simples
