# 07e — Command Palette

## Quando usar
- Power users (dev tools, data platforms, Linear/Raycast-style)
- Produto com 15+ ações/atalhos
- Usuários que voltam ao produto (dwell time alto)

## Quando NÃO usar
- Marketing/landing (excesso de complexidade)
- Usuário casual que nunca aprendeu atalhos
- Público não-técnico

## Props principais
- `COMMANDS` lista interna com `group`
- Estado: `open`, `query`
- Atalho: ⌘K / Ctrl+K via useEffect

## Dependências
- lucide-react
- Tailwind + dark
- Sem lib externa (sem cmdk/downshift)

## Variações
- Com histórico recente: persistir em localStorage
- Com ícone de status (loading, sucesso)
- Com agrupamento por contexto (página atual)

## Anti-patterns
- Palette sem atalho de teclado (perde propósito)
- Esconder navegação crítica só na palette
- Sem estado vazio ("Nenhum resultado")
