# Project Context — [NOME DO PROJETO]

> Constituicao do projeto. Todos os agents carregam este documento automaticamente.
> Atualizado conforme decisoes sao tomadas. Single source of truth para padroes e convencoes.

**Ultima atualizacao**: [DATA]
**Responsavel**: [NOME]

---

## 1. Identidade do Projeto

| Campo | Valor |
|-------|-------|
| Nome | [nome] |
| Repo | [owner/repo] |
| Stack | [Next.js X, Supabase, Vercel, etc.] |
| Porta dev | [3000-3005] |
| Branch principal | [main/master] |
| Package manager | [bun/npm] |
| Deploy | [Vercel Git Integration / manual] |

## 2. Stack Aprovado

Decisoes de stack vigentes. Qualquer desvio requer ADR + aprovacao.

| Categoria | Escolha | ADR | Por que |
|-----------|---------|-----|---------|
| Framework | Next.js 16 App Router | — | padrao rAIz |
| Database | Supabase PostgreSQL | — | padrao rAIz |
| Auth | Supabase Auth | — | padrao rAIz |
| Styling | Tailwind + shadcn/ui | — | padrao rAIz |
| ORM | @supabase/supabase-js | — | padrao rAIz |
| Testing | Vitest + Playwright | — | padrao rAIz |
| AI | AI SDK v6 + AI Gateway | — | padrao rAIz |
| [outro] | [escolha] | ADR-NNN | [rationale] |

## 3. Patterns Adotados

### Naming
- Arquivos: `snake_case` (logica), `PascalCase` (components)
- Services: `*.service.ts` | Types: `*.types.ts`
- API routes: `/api/[domain]/[action]`

### Estrutura de pastas
```
src/
├── app/           # Next.js App Router
├── components/    # UI components (shadcn + custom)
├── lib/           # Business logic, services
├── types/         # TypeScript types/interfaces
├── utils/         # Pure utility functions
└── hooks/         # React hooks
```

### Error Handling
- API: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
- Client: Error boundaries por rota
- Logging: [structured/console/Sentry]

### Data Fetching
- Server Components para dados estaticos
- Server Actions para mutacoes
- SWR/React Query para dados client-side com revalidacao

## 4. ADRs Vigentes

| ADR | Decisao | Status |
|-----|---------|--------|
| ADR-001 | [titulo] | Vigente |
| ADR-002 | [titulo] | Vigente |
| ADR-003 | [titulo] | Superseded by ADR-005 |

> Detalhes em `docs/adr/ADR-NNN-*.md`

## 5. Convencoes de API

### Autenticacao
- [Bearer token / Supabase Auth / API key]
- Header: `Authorization: Bearer [token]`

### Paginacao
- Cursor-based: `?cursor=X&limit=N`
- Response: `{ data: T[], nextCursor: string | null }`

### Versionamento
- [URL: /api/v1/ | Header: X-API-Version | nenhum]

## 6. Ambiente e Secrets

| Variavel | Descricao | Obrigatoria |
|----------|-----------|-------------|
| `DATABASE_URL` | Supabase connection string | Sim |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Sim |
| [outras] | [descricao] | [sim/nao] |

> Valores reais NUNCA neste arquivo. Apenas nomes e descricoes.

## 7. Restricoes e Limites Conhecidos

- [ex: TOTVS RM so aceita conexao via IP fixo]
- [ex: Supabase free tier: max 500MB storage]
- [ex: API X tem rate limit de 100 req/min]

## 8. Historico de Decisoes Recentes

| Data | Decisao | Contexto |
|------|---------|----------|
| [data] | [o que mudou] | [por que] |

---

> Este documento e carregado automaticamente por agents via `@reference`.
> Para atualizar: editar diretamente ou rodar `ag-documentar-projeto` com flag `--context`.
