# 10e — Two Column Static FAQ

## Quando usar
- SEO crítico — respostas indexáveis sem JS
- Respostas curtas (< 2 linhas cada)
- 6-10 perguntas sem muita variação

## Quando NÃO usar
- Respostas longas (mata layout)
- 15+ perguntas (vira scroll infinito)
- Quando UX interativa agrega valor

## Props principais
- `QAS[]` estático
- Sem estado, sem JS
- HTML semântico: `<dl>`, `<dt>`, `<dd>`

## Dependências
- Só Tailwind

## Variações
- 3 colunas em xl (`xl:grid-cols-3`)
- Com divisores verticais entre colunas
- Com ícone decorativo antes da pergunta

## Anti-patterns
- Usar accordion quando `10e` serve (over-engineering)
- Respostas longas truncadas visualmente (texto cortado)
- Grid quebra feio com respostas desiguais (aceitar ou limitar tamanhos)
