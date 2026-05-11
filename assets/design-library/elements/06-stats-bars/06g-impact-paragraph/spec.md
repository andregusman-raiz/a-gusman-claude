# 06g — Impact Paragraph Stats

## Quando usar
- Storytelling com números (mais humano que grid)
- Seção "Sobre nós" ou "Nossa história"
- Marca que valoriza narrativa sobre métrica fria
- Report anual / press release

## Quando NÃO usar
- Precisa mostrar stats isolados comparáveis (preferir 06a ou 06c)
- Dashboards e analytics
- Quando a narrativa fica forçada

## Props principais
- `eyebrow`: badge acima do parágrafo
- Highlights hardcoded no JSX (content-first)

## Dependências
- Nenhuma além de Tailwind

## Variações (responsive, dark)
- Mobile: `text-2xl`, ainda confortável
- Desktop: `lg:text-4xl` para impacto
- Highlight usa "marcador" visual (bg-indigo semi-transparente)
- Timestamp dos dados em rodapé

## Anti-patterns
- Parágrafo longo demais (>80 palavras) → perde impacto
- Highlights em todas as palavras → perde destaque
- Números sem contexto temporal
- Sem fonte/data dos números
