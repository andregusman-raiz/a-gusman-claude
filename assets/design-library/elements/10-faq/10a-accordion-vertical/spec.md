# 10a — Accordion Vertical

## Quando usar
- FAQ padrão em landing SaaS
- 5-10 perguntas, 1 resposta por vez
- Quando espaço vertical importa

## Quando NÃO usar
- 15+ perguntas → `10c-searchable`
- Categorias claras → `10d-categorized-tabs`
- Quando todas Q/A precisam ser visíveis (SEO) → `10e-two-column-static`

## Props principais
- `QAS[]` — array `{ q, a }`
- Estado `open` (single-open por padrão)
- Aria: `aria-expanded`, `aria-controls`, `aria-labelledby`

## Dependências
- lucide-react (Plus com rotate-45 para virar X)
- Tailwind + dark
- Sem shadcn accordion (HTML nativo com useState)

## Variações
- Multi-open (array em vez de number)
- ChevronDown em vez de Plus
- Com ícones por categoria

## Anti-patterns
- Respostas longas demais (> 5 linhas)
- Sem transição (abrir seco)
- Accordion sem aria (acessibilidade)
