---
name: ag-referencia-roteamento
description: "Arvore de decisao expandida para escolher entre machine, agent, skill, plugin, ferramenta direta. Invocar quando rota ambigua ou para auditar escolha antes de executar."
context: fork
---

# Roteamento de Ferramentas — Decision Tree Expandida

> Complementa `.claude/rules/prompt-protocol.md` com arvore de decisao detalhada, heuristicas e exemplos.
> Invocar quando: (a) usuario pedir explicitamente, (b) Claude detectar 2+ rotas viaveis, (c) auditoria de escolha antes de executar tarefa critica.

## Quando Invocar

- Ambiguidade real na rota (ex: "testa isso" — QAT? E2E? unit? manual via Playwright?)
- Pedido composto com multiplas frentes (decidir: serializar, paralelizar, ou delegar?)
- Usuario digitou `/ag-referencia-roteamento [intent]` ou "qual o melhor comando para X"
- Claude vai executar algo caro (deploy prod, team paralelo, refactor em N arquivos) e quer confirmar rota

## Heuristicas Rapidas (decidir em 1 pergunta)

| Pergunta | Resposta → Ferramenta |
|----------|----------------------|
| Preciso de expertise de stack carregada no contexto? | `/ag-referencia-nextjs`, `supabase`, `typescript`, etc. |
| Preciso de quality gates (typecheck + lint + test + PR)? | Machine (`/ag-1-construir`, `/ag-2-corrigir`) |
| E 1 arquivo com mudanca obvia? | Edit direto |
| E N arquivos com mesmo pattern (bulk)? | Machine com bulk-change-safety aplicado |
| N frentes de escrita paralelas no mesmo repo? | `/ag-team-safe` com worktree obrigatorio |
| Exploracao read-only ampla? | `Agent(Explore)` em paralelo |
| Atalho para acao isolada sem pipeline? | Plugin (`/commit`, `/deploy`, `/review-pr`) |
| Incerto sobre classificacao? | `/ag-0-orquestrador` |

## Arvore de Decisao por Intent

### 1. Construir algo (feature, bug, refactor, UI, integracao)

```
Intent = construir
├── Quick fix 1 arquivo, mudanca obvia?
│   └── Edit direto (sem agent)
├── Feature isolada, self-contained, sem pipeline?
│   └── /feature-dev (plugin)
├── Feature com spec + testes + review + PR?
│   └── /ag-1-construir [feature X]
├── Build + review concorrente (pair programming)?
│   └── /ag-1-construir --validado [feature X]
├── Multi-repo ou N frentes independentes?
│   └── /ag-team-safe (worktree por teammate)
└── Ambiguo → /ag-0-orquestrador
```

### 2. Corrigir algo (bug, tipos, debt)

```
Intent = corrigir
├── Erro TypeScript conhecido em 1 arquivo?
│   └── Edit direto + bunx tsc --noEmit path/file.ts
├── Bug com causa conhecida, 1-2 arquivos?
│   └── /ag-2-corrigir [descricao]
├── Bug em producao, precisa investigar Sentry?
│   └── /seer (plugin sentry) + /ag-2-corrigir
├── Erros TypeScript em massa (N arquivos)?
│   └── /ag-2-corrigir tipos (com bulk-change-safety)
├── So diagnosticar sem fix?
│   └── /ag-2-corrigir --triage-only [area]
└── Tech debt / refactor sem mudanca de comportamento?
    └── /ag-1-construir refatorar [X]
```

### 3. Entregar (deploy, release, rollback)

```
Intent = entregar
├── Preview automatico?
│   └── git push feature branch (Vercel Git Integration dispara)
├── Preview manual com pipeline completo?
│   └── /ag-3-entregar (preview)
├── Producao via merge PR?
│   └── gh pr merge → Vercel Git Integration dispara build
├── Producao com pipeline manual (8 etapas + canary)?
│   └── /ag-3-entregar producao
├── Rollback?
│   └── /ag-3-entregar rollback (sempre com confirmacao)
└── Atalho rapido sem pipeline (so preview)?
    └── /deploy (plugin vercel)
```

### 4. Testar (qualidade, comportamento, visual)

```
Intent = testar
├── Unit tests de modulo especifico?
│   └── bun run test -- path/module (direto)
├── QAT textual (comportamento semantico)?
│   └── /ag-4-teste-final qat [path]
├── UX-QAT visual (screenshots por breakpoint)?
│   └── /ag-4-teste-final ux-qat [url]
├── E2E suite completa com auto-fix?
│   └── /ag-4-teste-final e2e [path]
├── Exploratoria manual (navegar como usuario)?
│   └── ag-testar-manual ou Playwright MCP direto
├── Benchmark comparativo?
│   └── /ag-4-teste-final benchmark [url]
└── Ciclo test-fix-retest ate convergencia?
    └── /ag-4-teste-final ciclo [path]
```

### 5. Documentar

```
Intent = documentar
├── PRD / SPEC tecnica?
│   └── /prd ou /spec-writer (skills dedicadas)
├── Office (PPTX, DOCX, XLSX, PDF)?
│   └── Skill direta: /pptx, /docx, /xlsx, /pdf
├── README / API docs / changelog?
│   └── /ag-5-documentos projeto [path]
├── Diagrama (flow, ER, arquitetura)?
│   └── /diagram (mermaid)
├── ADR (decisao arquitetural)?
│   └── /adr [decisao]
└── Organizar arquivos/pastas?
    └── /ag-5-documentos organizar [path]
```

### 6. Pesquisar / Explorar

```
Intent = pesquisar
├── Grep/glob especifico com target conhecido?
│   └── Grep / Glob direto (sem agent)
├── Exploracao ampla multi-arquivo (>3 queries)?
│   └── Agent(subagent_type=Explore)
├── Pesquisar alternativas de tecnologia/lib?
│   └── /ag-6-iniciar pesquisar [tema]
├── Entender codebase novo?
│   └── /ag-6-iniciar explorar [path]
├── Benchmark de SaaS externo (crawl UI)?
│   └── /ag-10-benchmark-software [nome] [url]
└── Docs de lib externa?
    └── WebFetch ou context7 MCP (quando disponivel)
```

### 7. Paralelizar

```
Paralelismo
├── N agents read-only (Explore)?
│   └── Livre — sem worktree necessario
├── N agents de escrita, MESMO repo?
│   └── /ag-team-safe (worktree OBRIGATORIO por teammate)
├── N agents de escrita, REPOS diferentes?
│   └── Agent normal (repos separados ja isolam)
├── 3+ tasks coordenadas com ownership?
│   └── TeamCreate + TaskCreate (max 4 teammates)
└── Build + review concorrente (1 feature)?
    └── /ag-1-construir --validado
```

### 8. Validar / Auditar

```
Intent = validar
├── QA full autonomo (5D: ALIVE/REAL/WORKS/LOOKS/FEELS)?
│   └── /ag-7-qualidade [url/path]
├── Security + load + LGPD (6D)?
│   └── /ag-8-seguranca [url/path]
├── Laudo completo (FORTRESS: 5 machines)?
│   └── /ag-9-auditar [url/path]
├── Review de PR?
│   └── /review-pr (plugin) ou /code-review
└── Health check de sessao/repo?
    └── ag-saude-sessao ou bash ~/.claude/scripts/repo-health.sh
```

## Exemplos Reais (input → preamble → rota)

### Exemplo 1 — Prompt ambiguo

**Input:** "ve se tem algo estranho no projeto"

**Preamble:**
```
**Rewrite:** Audit do projeto atual procurando tech debt, bugs latentes, inconsistencias arquiteturais.
**Rota:** /ag-9-auditar — audit completo com 5 machines (MERIDIAN+SENTINEL+ARCHITECT+CONDUCTOR+LIGHTHOUSE).
**Executando.**
```

### Exemplo 2 — Rota obvia

**Input:** "commita essas mudancas"

**Preamble:** (rota obvia, 1 linha)
```
**Rota obvia:** ag-versionar-codigo (branch protegido, hook branch-guard ativo). Executando.
```

### Exemplo 3 — Intent composto

**Input:** "corrige o dropdown e testa no localhost"

**Preamble:**
```
**Rewrite:** Corrigir bug do dropdown + verificacao E2E via Playwright no localhost.
**Rota:** /ag-2-corrigir (root-cause + fix) + Playwright MCP (verify em 3000/3001/etc conforme projeto).
**Executando.**
```

### Exemplo 4 — Rota ja no prompt

**Input:** "usa ag-1 para adicionar pagina /dashboard/financeiro"

**Preamble:** (so rewrite, nao re-rotear)
```
**Rewrite:** Criar rota /dashboard/financeiro (Next.js App Router) com pagina nova via pipeline completo.
**Rota:** /ag-1-construir feature (ja especificada pelo usuario). Executando.
```

### Exemplo 5 — Prompt trivial

**Input:** "/commit"

**Sem preamble.** Executa direto.

### Exemplo 6 — Bypass flag

**Input:** "le o package.json --go"

**Sem preamble.** Read direto.

## Anti-Patterns (rotas erradas comuns)

| Anti-pattern | Correcao |
|-------------|----------|
| Usar `/ag-1-construir` para commit simples | `/commit` plugin ou ag-versionar-codigo |
| Usar Edit direto em refactor cross-file | `/ag-1-construir refatorar` (com worktree) |
| Spawnar 4 agents de escrita sem worktree | `/ag-team-safe` obrigatorio |
| Rodar `tsc --noEmit` full como hook | Memory leak — usar LSP ou `tsc --noEmit path/file.ts` |
| Deploy direto sem pipeline | `/ag-3-entregar` ou PR + Vercel Git Integration |
| Escolher reference skill sem carregar no contexto | Reference skill existe para isso — carregar |
| Usar machine para tarefa < 5min | Plugin ou ferramenta direta |
| Pular rewrite em prompt ambiguo | Violacao do protocolo — sempre aplicar |

## Checkpoints de Auditoria (quando suspeitar de rota errada)

1. **Rota escolhida e machine mas a tarefa e atomica** → rebaixar para plugin/ferramenta
2. **Rota e ferramenta direta mas a tarefa implica quality gates** → escalar para machine
3. **Paralelismo sem worktree em repo compartilhado** → BLOQUEAR, aplicar worktree
4. **Rota ignora flag `--autonomo`/`--draft` do prompt** → respeitar flag
5. **Rota contradiz regra de inegociavel (deploy direto, bypass hook)** → BLOQUEAR

## Referencias

- `.claude/rules/prompt-protocol.md` — protocolo minimo e formato
- `.claude/rules/agent-decision-guide.md` — matriz construir/corrigir/etc
- `.claude/rules/agent-invocation.md` — Skill vs Agent vs Teams
- `.claude/rules/plugin-routing.md` — plugin vs agent
- `.claude/rules/activation-modes.md` — flags de modo
- `.claude/rules/multi-agent-isolation.md` — regras de paralelismo
- `.claude/rules/agent-boundaries.md` — ownership e memory safety
