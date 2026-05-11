# 10d — Categorized Tabs FAQ

## Quando usar
- FAQ com 3-4 áreas claras (Billing, Product, Support)
- 8-20 perguntas totais que se agrupam bem
- Pricing pages com dúvidas mistas

## Quando NÃO usar
- Categorias forçadas (poucos itens por tab) → use `10a`
- Busca é prioridade → `10c-searchable`
- Mobile onde tabs viram scroll horizontal

## Props principais
- `CATEGORIES[]` com `{ id, label, icon, items }`
- Estado duplo: `tab` (categoria) + `open` (qual Q aberta)
- Aria: `role="tablist"`, `role="tab"`, `aria-selected`

## Dependências
- lucide-react (CreditCard, Package, LifeBuoy, Plus)
- Tailwind

## Variações
- Tabs verticais (sidebar de categorias)
- Com contador por categoria (`Billing (4)`)
- Todos expandidos por padrão por tab

## Anti-patterns
- 1 pergunta por categoria (forçado)
- Tabs sem ícone em labels longos (visual monótono)
- Resetar `open` ao trocar tab? Escolha: este mantém (pode confundir)
