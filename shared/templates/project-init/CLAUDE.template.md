# CLAUDE.md — {{PROJECT_NAME}}

> Herda regras de `~/Claude/CLAUDE.md`

---

## Stack

| Componente | Tecnologia |
|-----------|------------|
| Framework | {{FRAMEWORK}} |
| Linguagem | TypeScript (strict) |
| Database | {{DATABASE}} |
| Deploy | {{DEPLOY_PROVIDER}} |
| Styling | {{STYLING}} |
| Auth | {{AUTH_PROVIDER}} |

---

## Comandos Essenciais

```bash
# Desenvolvimento
npm run dev              # Dev server
npm run build            # Build de producao
npm run typecheck        # Verificar tipos (tsc --noEmit)
npm run lint             # ESLint
npm test                 # Testes unitarios

# Database
supabase start           # Supabase local
supabase db push         # Aplicar migrations
supabase gen types ts    # Regenerar tipos

# Deploy
gh pr create             # Criar PR (preview deploy automatico)
# Merge em main → deploy automatico via CI
```

---

## Estrutura do Projeto

```
{{PROJECT_NAME}}/
├── src/
│   ├── app/              # App Router (pages, layouts, API routes)
│   ├── components/       # Componentes React (PascalCase)
│   ├── lib/
│   │   ├── services/     # Business logic (*.service.ts)
│   │   ├── schemas/      # Validacao Zod (*.schema.ts)
│   │   ├── types/        # Tipos TypeScript (*.types.ts)
│   │   └── utils/        # Utilitarios puros
│   └── hooks/            # React hooks (use*.ts)
├── supabase/
│   ├── migrations/       # SQL migrations (YYYYMMDDHHMMSS_desc.sql)
│   └── seed.sql          # Dados iniciais
├── tests/
│   ├── unit/             # Testes unitarios (vitest)
│   └── e2e/              # Testes E2E (playwright)
└── public/               # Assets estaticos
```

---

## Padroes de Codigo

### Naming
- **Arquivos**: `snake_case.ts` para logica, `PascalCase.tsx` para componentes
- **Services**: `nome.service.ts` | **Schemas**: `nome.schema.ts` | **Types**: `nome.types.ts`
- **Hooks**: `useNome.ts` | **Componentes**: `NomeComponente.tsx`

### TypeScript
- Tipos explicitos, evitar `any`
- `interface` para objetos, `type` para unions/intersections
- Zod para validacao de input externo (API, forms)
- Strict mode ativo

### Git
- Commits semanticos: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Branches: `feat/`, `fix/`, `refactor/`, `hotfix/`
- TODA mudanca funcional via PR — commits diretos em main bloqueados

---

## Quality Gates

Antes de declarar tarefa completa:

| Gate | Comando |
|------|---------|
| Build | `npm run build` |
| TypeCheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests | `npm test` |

Checklist rapido: `npm run typecheck && npm run lint && npm test`

---

## Gotchas

<!-- Adicionar gotchas especificos do projeto aqui -->

---

## Documentacao

- PRDs e SPECs em `docs/`
- Decisoes arquiteturais documentadas em PRs
- Changelog gerado de conventional commits
