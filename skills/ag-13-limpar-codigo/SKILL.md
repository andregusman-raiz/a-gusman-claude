---
name: ag-13-limpar-codigo
description: "Maquina autonoma de limpeza de dead code (Knip + AST + bundle, confidence tiers, PRs atomicos). Use para tech debt, hand-off, reducao de bundle, cleanup pos-spike, auditoria de saude."
model: sonnet
context: fork
argument-hint: "[--triage-only | --apply-quick-wins | --full-pipeline | --create-issues | --resume | categoria:components|imports|state|comments]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage, LSP
metadata:
  filePattern: "limpar-codigo-state.json,dead-code-findings.json,dead-code-*.md"
  bashPattern:
    - "\\bknip\\b"
    - "\\bdead.code\\b"
    - "\\bunused.imports\\b"
  priority: 90
---

# LIMPAR CODIGO — Maquina Autonoma de Dead Code Cleanup

## Invocacao

```
/ag-13-limpar-codigo                          # Diagnostico + plano (default report-only)
/ag-13-limpar-codigo --triage-only            # So lista, sem plano nem fix
/ag-13-limpar-codigo --apply-quick-wins       # P0+P1 high-confidence auto-aplicados (PRs atomicos)
/ag-13-limpar-codigo --full-pipeline          # Todos os Ps com gates entre PRs (max ciclos = 2)
/ag-13-limpar-codigo --create-issues          # Cria GitHub issues por P do plano
/ag-13-limpar-codigo --resume                 # Retoma de limpar-codigo-state.json
/ag-13-limpar-codigo categoria:components     # So componentes nunca renderizados
/ag-13-limpar-codigo categoria:imports        # So unused imports
/ag-13-limpar-codigo categoria:state          # So useState/useReducer morto
/ag-13-limpar-codigo categoria:comments       # So comentarios sem explicacao
```

## O que faz

Limpeza completa AUTONOMA em 5 fases:

```
DISCOVERY -> MULTI-TOOL SCAN -> AST CUSTOM -> CONFIDENCE RANKING -> APPLY FIXES -> SHIP
                                                                          ↑          │
                                                                          └──────────┘
                                                                        (max 2 cycles)
```

1. **DISCOVERY**: detecta stack (Next/Vite/Astro/Remix), entry points, monorepo, instala Knip se ausente, gera `knip.json` com ignores conservadores
2. **MULTI-TOOL SCAN**: paralelo via Team — Knip + ts-prune + depcheck + ESLint --no-fix + Madge + bundle analyzer. Output JSON unificado
3. **AST CUSTOM**: TS Compiler API para 4 categorias do pedido especifico:
   - Componentes nunca renderizados (JSX traversal a partir de entry points)
   - State morto (useState/useReducer com setter sem call ou value sem leitura)
   - Props nao usados (bonus DX)
   - Comentarios com codigo sem prefixo WHY/TODO/FIXME/HACK/NOTE/JSDoc/SPDX
4. **CONFIDENCE RANKING**: combina sinais (tools que concordam + bundle confirmation + git churn + cobertura). HIGH (3+ tools) / MEDIUM (1-2) / LOW (suspeita, review humano)
5. **APPLY FIXES**: aplica fixes em PRs atomicos por categoria, com quality gates entre batches (typecheck + lint + test + build + bundle delta). Se gate falha -> revert + alternativa

## Modos (auto-detectados se nao especificados)

| Modo | Sinais / flag | Comportamento |
|------|---------------|---------------|
| triage | `--triage-only` ou primeiro run | So scan + report. NAO aplica fix. NAO gera plano |
| diagnostico | default (sem flag) | Scan + report + plano P0-P5. NAO aplica fix |
| quick-wins | `--apply-quick-wins` | Aplica P0 (setup) + P1 (high-confidence) automaticamente |
| full | `--full-pipeline` | Aplica P0-P5 com user approval gates em P2/P3/P4 |
| issues | `--create-issues` | Cria GitHub issues do plano (1 issue por P, sub-issues por T) |
| categoria | `categoria:X` | Scan + fix so da categoria especificada |

## Categorias detectadas

| Categoria | Tool primaria | Cross-check | Confidence default |
|-----------|---------------|-------------|--------------------|
| Unused imports | ESLint `unused-imports` | Knip | HIGH (auto-fix em P1) |
| Unused exports | Knip | ts-prune | HIGH |
| Unused npm deps | Knip / depcheck | manual review | MEDIUM (cuidado peer deps) |
| Componentes nunca renderizados | Knip + AST custom | bundle analyzer + react-scanner | MEDIUM (review por feature) |
| useState morto (setter sem call) | AST custom | ESLint | LOW (refs/closures) |
| useState morto (value sem leitura) | AST custom | ESLint | LOW |
| Props nunca usados | AST custom | TS LSP | MEDIUM |
| Comentarios sem WHY | regex + AST | manual review | LOW |
| Arquivos orfaos | Knip + Madge | bundle | MEDIUM |
| Types nunca usados | Knip | ts-prune | HIGH |
| Branches de feature flag morta | grep `if (false)` + env vars antigas | manual | LOW |

## Confidence tiers (regras de auto-fix)

- **HIGH** (3+ tools concordam, sem dynamic refs, no bundle): pode auto-fix em modo `--apply-quick-wins`
- **MEDIUM** (1-2 tools, alguma ambiguidade): requer user approval per-batch antes de aplicar
- **LOW** (suspeita, review humano obrigatorio): nunca auto-fix, so listar no plano

## Whitelist de protecao (NUNCA tocar)

```
**/*.test.*          **/*.spec.*           **/__tests__/**
**/__fixtures__/**   **/*.stories.*        **/*.generated.*
**/__generated__/**  prisma/client/**      **/codegen/**
**/*.d.ts (publicos) **/index.ts (barrels) **/middleware.ts
**/page.tsx          **/layout.tsx         **/route.ts
**/error.tsx         **/not-found.tsx      **/loading.tsx
**/template.tsx      **/global.css         **/globals.css
LICENSE              SPDX headers          Copyright headers
```

## Framework awareness (Next.js App Router exemplo)

Plugin Knip do framework SEMPRE ativo. Conhece convencoes:
- `app/**/page.tsx` -> entry point implicito
- `app/**/layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx`, `template.tsx` -> framework files
- `app/**/route.ts` -> API route
- `middleware.ts` -> entry point
- `next.config.{js,ts,mjs}` -> config
- Server Actions (`"use server"`)
- `generateStaticParams`, `generateMetadata` -> framework exports

Para Vite/Remix/Astro: plugins equivalentes em `knip.json`.

## Pipeline detalhado

### Fase 1 — Discovery
```bash
# Detectar stack
- ler package.json -> dependencies/devDependencies
- detectar Next/Vite/Astro/Remix/CRA/SvelteKit
- detectar monorepo (workspaces, turbo.json, nx.json)
- detectar entry points (app/, pages/, src/index.ts, scripts em package.json)

# Instalar Knip se ausente
$PM add -d knip @types/node

# Gerar knip.json conservador
- include entry points detectados
- ignores defensivos (whitelist acima)
- plugins do framework detectado

# Capturar baseline
- LOC total (cloc ou wc -l em src/)
- bundle size atual ($PM run build && du -sh .next/ ou dist/)
- test coverage atual (se houver)
- git churn (ultimos 12m por arquivo)
```

### Fase 2 — Multi-tool Scan (paralelo via Team)

Spawnar `ag-escanear-morto-codigo` com `isolation: "worktree"`. Sub-tarefas paralelas:
- `bunx knip --reporter json > knip-output.json`
- `bunx ts-prune --json > tsprune-output.json` (cross-check)
- `bunx depcheck --json > depcheck-output.json` (cross-check)
- `bunx eslint --ext .ts,.tsx --no-fix --format json > eslint-output.json`
- `bunx madge --circular --json src > madge-circular.json`
- `bunx madge --orphans --json src > madge-orphans.json`
- `$PM run build && bunx @next/bundle-analyzer` ou `bunx rollup-plugin-visualizer`

Unificar em `dead-code-findings-raw.json`.

### Fase 3 — AST Custom Scan

Spawnar agente com TS Compiler API. Para cada arquivo `.tsx`:

**A — Componentes nunca renderizados:**
```ts
// Pseudocodigo
const components = collectExportedComponents(srcFiles)
const usages = traverseJsxFromEntryPoints(entryPoints)
const orphans = components.filter(c => !usages.has(c.name))
// Cross-check: dynamic imports, lazy(), next/dynamic
```

**B — useState morto:**
```ts
// Para cada chamada de useState/useReducer:
const [state, setState] = useState(initial)
// Verificar:
// - setState e chamado em alguma posicao? (escopo do componente + closures)
// - state e lido em algum lugar? (JSX, callbacks, useEffect deps)
// Se um dos dois eh false -> candidato (LOW confidence)
```

**C — Props nao usados:**
```ts
// Para cada componente com Props interface:
// - listar props declarados
// - listar props acessados no body
// - diff = props nao usados
```

**D — Comentarios sem WHY:**
```ts
// Regex: ^\s*//.*[(){};=].*$ (parece codigo)
// AND nao tem prefixo: TODO|FIXME|HACK|NOTE|XXX|@param|@returns|SPDX|Copyright|eslint-disable
// AND bloco > 2 linhas consecutivas
// -> candidato comentario sem explicacao
```

Output: `ast-custom-findings.json` mergeado em `dead-code-findings.json`.

### Fase 4 — Confidence Ranking

Combinar sinais em `dead-code-findings.json`:
```json
{
  "category": "component-orphan",
  "file": "src/components/UnusedCard.tsx",
  "name": "UnusedCard",
  "signals": {
    "knip": true,
    "ts-prune": true,
    "ast-custom": true,
    "bundle-absent": true,
    "git-churn": "0 commits in 14 months",
    "test-coverage": 0
  },
  "confidence": "HIGH",
  "recommendation": "delete",
  "loc": 87
}
```

Gerar:
- `docs/diagnosticos/dead-code-YYYY-MM-DD.md` (relatorio com tabelas, contagens, exemplos)
- `docs/plans/dead-code-refactor-plan-YYYY-MM-DD.md` (arvore P0-P5)
- `dead-code-findings.json` (machine-readable)
- `limpar-codigo-state.json` (state para `--resume`)

### Fase 5 — Apply Fixes

So executa se modo for `--apply-quick-wins` ou `--full-pipeline`.

Spawnar `ag-aplicar-fix-codigo` para cada P em sequencia (NUNCA paralelo entre Ps):

**P0 — Setup baseline (1 PR pequeno, no-op funcional)**
- `chore(deadcode): add knip + baseline report`

**P1 — Quick wins HIGH confidence**
- PR 1: `chore(deadcode): remove unused imports` (eslint --fix)
- PR 2: `chore(deadcode): remove unused exports` (Knip + ts-prune cross-validated)
- PR 3: `chore(deadcode): remove orphan deps`
- Quality gate apos cada PR. Falha -> revert + alternativa.

**P2 — Componentes nunca renderizados** (user approval per batch de 5)
- PR por feature area: `chore(deadcode): remove orphan components in <area>`
- Confirma com user antes de cada batch via TaskUpdate

**P3 — useState morto** (LOW confidence, user approval per item)
- PR por componente afetado, commits pequenos

**P4 — Comentarios sem WHY** (review manual, LOW confidence)
- PR consolidado: `chore(deadcode): remove dead code comments`

**P5 — Hardening (preventivo)**
- PR: adicionar Knip ao CI em modo warning
- PR: `eslint-plugin-unused-imports` em pre-commit (lint-staged)
- PR: ADR documentando politica

### Quality Gates entre PRs

```bash
# Apos CADA PR de fix:
$PM run typecheck && $PM run lint && $PM run test && $PM run build

# Bundle delta:
echo "Bundle: $(du -sh .next/static)" >> dead-code-progress.md

# Se algum gate falha:
git revert HEAD
echo "Gate failed at $CATEGORY, reverted. Logs: ..." >> dead-code-progress.md
# Continua com proxima categoria
```

## Propriedades MERIDIAN

- **Autonomo**: scan + plano sem perguntar; aplicacao gated por modo
- **Convergente**: SCAN -> APPLY -> VERIFY loop ate green (max 2 cycles)
- **State persistente**: `limpar-codigo-state.json` — resume de onde parou
- **Self-healing**: regressao em quality gate -> revert + alternativa
- **Artifacts**: PRs atomicos, diagnostico, plano, JSON, issues opt-in
- **Confidence-aware**: nunca auto-fix LOW; gated approval para MEDIUM

## Output

```
LIMPAR CODIGO COMPLETO
  Modo: [triage|diagnostico|quick-wins|full|issues|categoria:X]
  Stack detectada: [Next 16 / Vite 5 / etc.]
  Findings totais: [N]
    HIGH: [X] | MEDIUM: [Y] | LOW: [Z]
  Por categoria:
    Unused imports: [N]
    Unused exports: [N]
    Orphan components: [N]
    Dead state: [N]
    Dead comments: [N]
    Orphan files: [N]
    Unused deps: [N]
  Diagnostico: docs/diagnosticos/dead-code-YYYY-MM-DD.md
  Plano: docs/plans/dead-code-refactor-plan-YYYY-MM-DD.md
  PRs aplicados: [N] (se modo apply)
  GitHub issues: [N] (se --create-issues)
  LOC removidas: [N]
  Bundle delta: [-XXX KB]
  Build time delta: [-Ys]
  Ciclos: [N]
  Status: GREEN | PARTIAL | NEEDS_REVIEW
```

## Riscos e mitigacoes (resumo)

| Risco | Mitigacao |
|-------|-----------|
| Deletar API publica | Whitelist `**/index.ts` + entries explicitos |
| Dynamic imports perdidos | Knip `ignoreDependencies` + manual review de strings `import()` |
| Convencao de framework deletada | Plugin Knip do framework sempre ativo |
| State usado via ref/closure | Confidence LOW por default — review humano |
| License/SPDX header removido | Regex exclui `/*!`, `// SPDX-`, `Copyright` |
| Test fixtures deletadas | Glob exclude robusto na whitelist |
| Codigo gerado | Glob exclude `*.generated.*`, `prisma/`, `__generated__/` |
| Falso positivo causa regressao | Quality gate completo + smoke E2E + revert automatico |

## Comparacao com plugins / outras machines

| | ag-13-limpar-codigo | code-simplifier (plugin) | ag-2-corrigir debt |
|---|---|---|---|
| Foco | Dead code elimination | Simplificacao de logica | Tech debt geral |
| Tools | Knip + AST + bundle | Manual reasoning | grep + manual |
| Output | PRs atomicos por categoria | 1 PR de simplificacao | 1 PR de cleanup |
| Confidence tiers | Sim (HIGH/MED/LOW) | Nao | Nao |
| GitHub issues | Sim (`--create-issues`) | Nao | Nao |
| Quando usar | "tem coisa morta no codigo" | "esse codigo esta complicado" | "tem debt acumulado" |

## Sub-agents internos

- `ag-escanear-morto-codigo` — executor de scan multi-tool (read-only, paralelo)
- `ag-aplicar-fix-codigo` — applier com gates e PR atomization (escrita, sequencial entre Ps)

## Helper scripts

- `~/Claude/.claude/scripts/dead-code/scan-orchestrator.sh` — orquestra Knip + ts-prune + ESLint + bundle
- `~/Claude/.claude/scripts/dead-code/ast-custom-scan.ts` — TS Compiler API para 4 categorias custom
- `~/Claude/.claude/scripts/dead-code/apply-fix-batch.sh` — aplica fixes em batches com quality gates

## Referencias

- Knip docs: https://knip.dev
- "Software Design X-Rays" (Adam Tornhill) — code health, churn analysis
- "Working Effectively with Legacy Code" (Michael Feathers) — characterization tests
- ESLint plugin unused-imports: https://github.com/sweepline/eslint-plugin-unused-imports
- Mikado Method: https://mikadomethod.info/
