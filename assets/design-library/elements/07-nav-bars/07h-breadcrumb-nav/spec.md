# 07h — Breadcrumb Nav com Dropdown

## Quando usar
- App com hierarquia profunda (workspace > projeto > seção)
- GitHub/GitLab-style: nome do repo navegável, dropdown de branches
- Admin/settings com sub-páginas

## Quando NÃO usar
- Landing / marketing (sem hierarquia)
- Apps flat (1-2 níveis)
- Mobile estreito (usar voltar nativo)

## Props principais
- `crumbs: Crumb[]` — `{ label, href? }` (último sem href = atual)
- `siblings: string[]` — peers do último crumb (dropdown)

## Dependências
- lucide-react (ChevronDown, Check)
- Tailwind + dark

## Variações
- Separador `›` ou `>` em vez de `/`
- Sem dropdown (breadcrumb puro)
- Com truncate para labels longos (`truncate max-w-[200px]`)

## Anti-patterns
- Breadcrumb com só 1 nível (redundante)
- Dropdown sem filtro quando > 10 siblings
- Esconder o caminho do usuário
