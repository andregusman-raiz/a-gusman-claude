# CLAUDE.md — Workspace

> Instrucoes raiz para qualquer projeto no workspace. Carregado automaticamente.
> **Regras detalhadas** estao em `.claude/rules/*.md` (carregadas sob demanda). Aqui ficam apenas os pointers + regras unicas.

---

## Definition of Done (CRITICO — ler ANTES de declarar trabalho concluido)

Toda tarefa que envolveu edicao de codigo (.ts/.tsx/.js/.jsx/.py/etc) so esta concluida quando:

1. **Reproduziu o intent** — bug reproduzido antes/depois (Playwright para UI), feature exercitada CLI/browser
2. **Rodou verificacao** — `bun run typecheck && bun run lint && bun run test` (ou equivalente do projeto). NUNCA assumir "build passa = ok".
3. **Auditou a entrega vs pedido** — re-ler objetivo original, listar item-por-item: implementado? completo? conectado?
4. **Reportou gap explicito** — se algo ficou pendente: Esperado vs Atual + opcoes (a/b/c) + pergunta direta. NUNCA "aceitavel, corrige depois" silencioso.

Iteracao maxima: **3 ciclos de fix-and-retest**. Apos isso, parar e reportar status real ao usuario.

**Regra de exaustao (anti "edit-first lazy path")**: ANTES de Edit, fazer Read do arquivo e dos imports/dependencias relevantes. Razao read:edit alvo >= 2:1 em tarefa nao-trivial. Edit sem Read precedente em arquivo nao-trivial = sinal de raciocinio raso.

**Hook bloqueante**: `completion-gate.py` (Stop) bloqueia encerramento se editou codigo sem rodar check. `gap-acceptance-guard.py` bloqueia se aceitou gap sem perguntar. Bypass: `COMPLETION_GATE_DISABLED=1` / `GAP_GUARD_DISABLED=1`.

---

## Modo Dual Claude Code + Codex

Workspace usado por Claude Code e Codex. Fonte canonica: `~/Claude/.claude/`.
- Claude Code le `CLAUDE.md` e usa `.claude/`.
- Codex le `AGENTS.md` e usa `.agents/skills/` como adapter.
- `~/Codex` aponta para `~/Claude`. Symlinks em `.Codex/`.

Regra: nao duplicar regras/playbooks/templates. Atualizar `.claude/` primeiro; sincronizar Codex depois.
Health check: `bash ~/Claude/.claude/scripts/dual-mode-check.sh`

---

## Stack Canonica (BLOQUEADORA para projeto novo)

Whitelist completa: `.claude/rules/stack-enforcement.md` + skill `/ag-referencia-stack-decisions`. Hooks `stack-deny-list.sh` e `new-project-guard.sh` impedem desvios.

**Tokens visuais Raiz** (`~/Claude/assets/design-library/UI_UX/raiz-educacao-design-system.md`):
```
--raiz-orange #F7941D | --raiz-teal #5BB5A2 | --raiz-dark #1A1A1A | --raiz-gray-50 #F8F9FA
Fontes: IBM Plex Sans + IBM Plex Mono | Touch target min 44px
Cards: border-0 shadow-sm (NAO combinar) | Focus ring 2px solid orange
A11y: aria-label, skip link, aria-current em breadcrumb | prefers-reduced-motion
```

Workflow projeto novo: `/ag-6-iniciar projeto [desc]` (carrega stack-enforcement automaticamente).
Bypass: `export STACK_GUARD_BYPASS=1` (sessao). ADR obrigatoria para tornar permanente.

Para projeto EXISTENTE com `CLAUDE.md` proprio + >5 commits: hooks ficam silent.

---

## GitHub Actions — Uso Minimo

GHA e ultimo recurso. Detalhes: `.claude/rules/gha-minimal.md`. Whitelist: 4 casos (TOTVS legado, CLI multi-platform, VPS self-hosted, PR gate DB-first). Todo workflow novo DEVE ter header `JUSTIFICATIVA-GHA: <W1-W4>` + `ALTERNATIVA-DESCARTADA`. Bypass: `GHA_GUARD_DISABLED=1`.

---

## Matriz de Decisao — Skill vs Agent vs Machine vs Team

| Cenario | Ferramenta | Isolamento |
|---------|-----------|-----------|
| Carregar expertise | Skill `/ag-referencia-*` | Mesmo contexto |
| 1 tarefa busca/analise | Agent (Explore) | Contexto isolado |
| 1 feature/fix single-PR | Machine `/ag-1-construir` ou `/ag-2-corrigir` | Mesmo working tree |
| N tarefas read-only paralelas | N x Agent (Explore) | Sem worktree (seguro) |
| **N tarefas escrita paralelas, mesmo repo** | `/ag-team-safe` | **Worktree por teammate (OBRIGATORIO)** |
| N tarefas escrita, repos diferentes | N x Agent | Repos ja isolam |
| Plano multi-PR (3+ entregas) | `/ag-0-orquestrador` fatia | Serial de ag-1 |
| QA full / Audit completo | `/ag-7-qualidade` / `/ag-9-auditar` | Mesmo repo |

**Regra ouro: paralelismo de escrita no mesmo repo = `isolation:"worktree"` OBRIGATORIO.**

### Protocolo Rewrite + Routing

Antes de prompts nao-triviais, emitir 3 linhas: **Rewrite** + **Rota** (<=15 palavras) + **Executando.** Pular se: comando atomico, continuacao, factual, flag `--go`. Detalhes: `.claude/rules/prompt-protocol.md` | `/ag-referencia-roteamento`.

### Paralelismo (regras inegociaveis)

1. 1 terminal = 1 working tree ativo. Multiplos = `git worktree add .claude/worktrees/<nome>`.
2. Escrita mesmo repo SEMPRE worktree.
3. Read-only paralelo livre.
4. Max 6 teammates simultaneos (memory 36GB; monitorar `memory_pressure`).
5. `TeamDelete` IMEDIATO ao final.
6. Plano multi-PR via `/ag-0-orquestrador` ou `/ag-team-safe`, nunca ag-1 direto.
7. Antes de spawnar paralelo: `claude-locks-status.sh` + `repo-health.sh <repo>`.

Detalhes: `.claude/rules/agent-parallel-safety.md`.

Comandos diagnostico: `bash ~/.claude/scripts/{claude-locks-status,repo-health,worktree-prune}.sh`.
Statusline mostra 🔒 quando outro processo Claude tem lock no repo atual.

---

## Portas Localhost + Browser

Portas: 3000 raiz-platform, 3001 profdigital, 3002 automata, 3003 totvs-educacional, 3004 sophia, 3005 fgts, 4200 raiz-agent-dashboard. Detalhes em `.claude/rules/ports-projects.md`. Porta 3000 NUNCA para 2 ao mesmo tempo.

Browser localhost SEMPRE via Playwright MCP (`browser_navigate`). NUNCA `open`. Detalhes: `.claude/rules/browser-localhost.md` + `/ag-referencia-playwright`. Login persistente + Google SSO: skill `/ag-login-persistente`.

---

## Visao Geral / Arquitetura 3 Camadas

```
~/Claude/
├── CLAUDE.md                 # Este arquivo
├── .claude/                  # Camada 1+2: config + shared
│   ├── settings.local.json | skills/ | hooks/ | rules/ | Playbooks/
│   └── shared/{templates,patterns,gotchas,adr}/
├── GitHub/                   # Camada 3: repos com remote
├── projetos/                 # Projetos sem remote (locais/experimentais)
├── docs/{ai-state,diagnosticos,specs,pesquisas,scripts}/
├── assets/
│   ├── knowledge-base/       # 275 files, 10 sistemas (claude-code, finnet, gupy-pulses,
│   │                         # hubspot, layers, n8n, totvs, z-api, zeev, raiz-processos)
│   ├── design-library/       # tokens, elements (86 VibeUI), solutions (24), UI_UX
│   └── logos/, screenshots/
└── archive/
```

**Camada 1+2** (workspace): COMO trabalhar + O QUE reutilizar.
**Camada 3** (projeto): O QUE e especifico.
Projetos NAO duplicam agents/hooks/playbooks. Usam `.claude/shared/patterns/` (ref) e copiam `.claude/shared/templates/`.

Sync: `bash ~/.claude/shared/sync.sh [projeto-path]`.

---

## Docs Location — projeto, nao workspace

Toda doc gerada (SPEC, PRD, ADR, diagnostico, relatorio, plano) salvar em `<PROJECT_ROOT>/docs/{specs|adr|diagnosticos|plans|reports}/`. Hook `docs-location-guard.sh` (PreToolUse Write) bloqueia salvar em `~/Claude/docs/{specs,...}/`. Excecao cross-project: `~/Claude/docs/workspace/`. Bypass emergencia: `DOCS_GUARD_DISABLED=1`. Pattern: `.claude/shared/patterns/docs-location.md`.

---

## Execucao Autonoma via CLI

REGRA: Claude Code DEVE executar tudo via CLI. NUNCA pedir ao usuario para rodar manualmente comandos, deploy, migrations ou operacoes de infraestrutura.

---

## Regras Criticas (pointers — detalhes em `.claude/rules/*.md`)

`config-protection` (read+merge, nunca overwrite) | `edit-persistence-safety` (`git diff --stat` cada 2-3 edits) | `deploy-routing` (build+typecheck antes, nunca `vercel --prod` direto) | `root-cause-debugging` (max 2 fix attempts) | `bulk-change-safety` (batch 5) | `lint-staged-awareness` (eslint --fix reverte silencioso) | `agent-parallel-safety` (worktree obrigatorio para escrita paralela) | `fix-verification` (Playwright antes/depois) | `issue-spec-workflow` | `quality-gate` (anti-teatro) | `memory-safety` (LSP em vez de tsc full) | `plugin-routing` | `sql-multi-db-governance` | `predictive-systems` (30 regras + 5 criticas) | `prompt-cache-policy`.

**Inline (sem rule dedicada)**:
- GitHub Issues: `gh label list` antes de aplicar label.
- Estimativas: NAO estimar a menos pedido. Calibrar IA-paced: feature ~15min, bugfix ~10min, PR+QA ~30min, SPEC+build+tests ~60min. NUNCA "dias/semanas".
- Gap reporting: Esperado vs Atual + O que falta + Opcoes (a/b/c) + Pergunta direta. Hook `gap-acceptance-guard.py` bloqueia. Bypass: `GAP_GUARD_DISABLED=1`.
- NUNCA mudar abordagem sem autorizacao. NUNCA gerar dados mock sem pedido explicito. Zero hardcode (URLs/keys/magic numbers → env vars; excecoes: 0/1/true/HTTP codes).

---

## Convencoes Universais de Codigo

snake_case (logica), PascalCase (React) | sem `any` | Zod schemas | strict mode | conventional commits | TODA mudanca via feature branch + PR (commits em main BLOQUEADOS) | squash merge features, merge commit hotfix | max 5 mudancas sem commit, NUNCA `git add -A` | migrations: `YYYYMMDDHHMMSS_desc.sql`.

Detalhes: `.claude/rules/{naming-conventions,commit-conventions,branch-strategy,pr-workflow,merge-strategy,package-manager}.md`.

---

## Quality Gates / SDD / Security

- Quality gates: `bun run typecheck && bun run lint && bun run test` | skill `/ag-R-57-quality-gates`
- SDD methodology (PRD→SPEC→Execucao→Review): skill `/ag-R-58-sdd-methodology` + `/ag-referencia-sdd`
- Security rules (RLS, audit, LGPD, permissoes): skill `/ag-R-59-security-rules` + `/ag-referencia-seguranca-rules`

---

## Machines (Interface Principal — 13 commands)

Padrao MERIDIAN: fases, convergencia, state, self-healing. Cada machine encapsula multiplos agents.

```
ag-0   ORQUESTRADOR   Gateway — classifica e delega (entry point) | --full: pipeline 7-fases para features 3+ PRs
ag-1   CONSTRUIR      feature, issue, refactor, otimizar, ui, integrar, --validado
ag-2   CORRIGIR       bugs, tipos, batch, debt, triage
ag-3   ENTREGAR       preview, producao, rollback
ag-4   TESTE-FINAL    qat, ux-qat, benchmark, ciclo, e2e
ag-5   DOCUMENTOS     projeto, office, organizar, ortografia
ag-6   INICIAR        projeto, ambiente, explorar, pesquisar
ag-7   QUALIDADE      MERIDIAN (5D QA autonomo, MQS >= 85)
ag-8   SEGURANCA      SENTINEL (6D security+load+LGPD, SSS >= 80)
ag-9   AUDITAR        FORTRESS (laudo completo 5 machines)
ag-10  BENCHMARK      Crawl SaaS, screenshot, AI analysis, SPEC
ag-11  DESENHAR       UI/UX design, componentes, paletas, layouts, shadcn
ag-12  SQL-TOTVS-ZEEV Otimizar SQL Server (TOTVS RM) + PostgreSQL + Zeev BPM
ag-13  LIMPAR-CODIGO  Dead code (Knip + AST + bundle, confidence tiers, PRs atomicos)
```

Na duvida: `/ag-0-orquestrador [pedido]` classifica e roteia.

### Activation modes

Toda machine aceita `--autonomo` (sem checkpoints), `--draft` (rascunho rapido), `--interativo` (default). Detalhes: `.claude/rules/activation-modes.md`.

---

## Knowledge Bases (consultar ANTES de implementar)

- **TOTVS RM**: `~/Claude/assets/knowledge-base/totvs/` (29 DataServers, 9950 tabelas, 1992 campos, 17 docs). Skill `/ag-12-sql-totvs-zeev` carrega o KB automaticamente.
- **Design Library**: `~/Claude/assets/design-library/` (tokens, 86 elements VibeUI, 24 solutions). Skill `/ag-11-ux-ui` ou `/ag-referencia-design-presentation`. NAO hardcodar hex — usar `tokens/colors.json`.
- **SQL multi-DB**: PBI_RAIZ (matriculas/financeiro), TOTVS RM (RH/ponto), Neon (HubSpot/Layers/Zeev). Detalhes + guards em `.claude/rules/sql-multi-db-governance.md`.

---

## Plugin Skills (canonical)

Preferir sempre skill oficial quando existir. Tabela completa + regras de prioridade em `.claude/rules/plugin-routing.md`.

Atalho mental: deploy Vercel → `vercel:deployments-cicd` | Next.js → `vercel:nextjs` | shadcn → `vercel:shadcn` | Sentry → `sentry:sentry-workflow` | Figma → codigo → `figma:figma-implement-design` | Chrome DevTools (perf/a11y/memory) → `chrome-devtools-mcp:*` | Supabase → `supabase:supabase` | Railway → `railway:use-railway` | AI SDK → `vercel:ai-sdk` | E2E verification → `vercel:verification`.

Plugins ativos (12): typescript-lsp, pyright-lsp, supabase, github, playwright, vercel, context7, chrome-devtools-mcp, figma, railway, code-review, pr-review-toolkit. MCPs: sentry (SSE) + plugin MCPs.

---

## Skills locais + Opus fallback

Skills `ag-*` chamadas dentro das machines via `subagent_type` ou direto via `/ag-nome`. Reference skills sob demanda: `/ag-referencia-{nextjs,typescript,supabase,python,qualidade,sdd,seguranca-rules,mock-first,anti-ciclo-preditivo,roteamento,stack-decisions,design-library,design-presentation,prompt-guide,redesign-workflow,playwright,tdd}`. Gotchas: `.claude/shared/gotchas/`. Playbooks: `.claude/Playbooks/`. ADRs: `.claude/shared/adr/`.

7 skills Opus por design (`ag-avaliar-arquitetura`, `ag-criar-skill`, `ag-depurar-erro`, `ag-especificar-solucao`, `ag-melhorar-agentes`, `ag-mesa-redonda`, `ag-planejar-execucao`). Rate limit → `opus-off` (sonnet) / `opus-on` (restaura) / `opus-status`. Estado em `~/.claude/state/opus-mode.txt`. SessionStart hook aplica `opus-fallback.sh auto`.

Opus 4.7 1M context: prompts longos OK, subagents menos necessarios para <300K tokens, `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=85`. ADR-0001: `.claude/shared/adr/ADR-0001-consolidacao-pos-opus-47.md`.

raiz-data-engine status: Q9 DONE + Q10 PARTIAL, score 94/100. Detalhes em `CLAUDE.md` do projeto.

<!-- cache_control: ephemeral -->

