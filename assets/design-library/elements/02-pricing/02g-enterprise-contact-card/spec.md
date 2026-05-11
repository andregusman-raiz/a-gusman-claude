# 02g — Enterprise Contact Card

## Quando usar
SaaS com tiers padrão + um Enterprise customizado (preço sob consulta). Classic pattern B2B: Starter/Pro/Business/Enterprise.

## Quando NÃO usar
Produtos sem diferenciação real para enterprise — fica performativo. Quando Enterprise tem preço fixo — usar 02a ou 02f.

## Props principais
- `tiers?: Tier[]` — array de 4 tiers, último com `isEnterprise: true`
- `title?: string` — título da seção
- `onSelect?: (tier) => void` — handler (Enterprise abre form de contato)

## Dependências
- react, lucide-react (Check, Building2, ArrowRight)
- shadcn/ui components: Card, Button (inline)

## Variações
- Enterprise card tem gradient próprio (indigo/purple) para destacar
- Grid 4 colunas em lg:, 2 colunas md:, 1 coluna mobile
- min-h no bloco de preço mantém alinhamento mesmo com "Sob consulta"

## Anti-patterns
- Não omitir features do Enterprise — sempre listar o que o diferencia
- Evitar copy "Call us" vago — "Falar com vendas" é mais claro
- Não fazer Enterprise card igual aos outros — deve destacar visualmente
