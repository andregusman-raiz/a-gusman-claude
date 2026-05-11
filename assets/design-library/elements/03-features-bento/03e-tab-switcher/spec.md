# 03e — Tab Switcher

## Quando usar
Uma mesma feature aplica-se a múltiplas audiências/usos. Permite visitor filtrar conteúdo relevante sem scroll.

## Quando NÃO usar
Features independentes (preferir 03a ou 03c). Mais de 5 tabs fica apertado.

## Props principais
- `tabs?: Tab[]` — (id, label, icon, title, description, bullets)
- `sectionTitle?: string`

## Dependências
- react (useState), lucide-react (Check + icons por tab)
- shadcn/ui components: Tabs (usamos role=tablist custom com aria corretos)

## Variações
- Tabs em pill group centralizado
- Default active = primeira tab
- Conteúdo 2 colunas: texto esq, visual dir

## Anti-patterns
- Não esconder content crítico atrás de tabs — SEO + primeira impressão
- Evitar labels longas — max 2 palavras por tab
- Não animar troca de conteúdo agressivamente — CLS issue
