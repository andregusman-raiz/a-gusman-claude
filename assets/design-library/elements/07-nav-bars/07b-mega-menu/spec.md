# 07b — Mega Menu

## Quando usar
- Produto com 8+ sub-seções agrupáveis em 2-4 categorias
- Marketing site com múltiplos produtos/soluções
- Quando descrições curtas ajudam o usuário a escolher

## Quando NÃO usar
- Menos de 5 links no total → use `07a`
- Navegação logada → use `07c-sidebar-fixed`
- Mobile → mega menu vira sheet/drawer

## Props principais
- Estrutura `MegaCategory[]` com `items: MegaItem[]`
- `item.icon` — componente lucide-react
- Estado `open` via useState

## Dependências
- lucide-react (ChevronDown, icons variados)
- Tailwind + dark

## Variações
- Hover-open: substituir onClick por onMouseEnter/onMouseLeave
- Com featured card: adicionar bloco destaque à direita do grid
- Com busca integrada: Input no topo do dropdown

## Anti-patterns
- Dropdown com 20+ items sem categorização
- Esconder navegação crítica atrás do mega menu
- Hover trigger sem fallback para teclado (acessibilidade)
