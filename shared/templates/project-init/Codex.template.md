# AGENTS.md — {{PROJECT_NAME}}

> Herda regras de `~/Claude/AGENTS.md`. Usado pelo Codex; a fonte canonica compartilhada continua em `~/Claude/.claude/`.

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
npm run dev
npm run build
npm run typecheck
npm run lint
npm test

# Database
supabase start
supabase db push
supabase gen types ts

# Deploy
gh pr create
```

---

## Estrutura do Projeto

```
{{PROJECT_NAME}}/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   └── hooks/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   └── e2e/
└── public/
```

---

## Padroes de Codigo

- Arquivos: `snake_case.ts` para logica, `PascalCase.tsx` para componentes.
- Services: `nome.service.ts`; schemas: `nome.schema.ts`; types: `nome.types.ts`.
- TypeScript strict, sem `any` sem justificativa.
- Zod para validacao de input externo.
- Commits convencionais em ingles.

---

## Quality Gates

Antes de declarar tarefa completa:

| Gate | Comando |
|------|---------|
| Build | `npm run build` |
| TypeCheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests | `npm test` |

---

## Gotchas

<!-- Adicionar gotchas especificos do projeto aqui -->
