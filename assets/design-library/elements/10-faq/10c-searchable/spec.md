# 10c — Searchable FAQ

## Quando usar
- Help center / docs hub (15+ perguntas)
- Produto com domínio técnico amplo
- Quando usuário chega com dúvida específica

## Quando NÃO usar
- Poucas perguntas (< 8) — busca é overkill
- Landing de conversão (complexidade demais)
- Quando respostas são genéricas

## Props principais
- `QAS[]` com `tags?: string[]` opcional (filtro futuro)
- Estado: `q` (query) + `open` (índice ativo)
- Filtro case-insensitive em Q + A

## Dependências
- lucide-react (Search, ChevronDown)
- Tailwind + dark

## Variações
- Com filtro por tags (chips acima)
- Com sugestões populares quando vazio
- Com destaque do termo buscado (mark tag)

## Anti-patterns
- Sem estado vazio ("nenhum resultado")
- Busca lenta sem debounce em listas grandes (> 100)
- Sem contador de resultados
