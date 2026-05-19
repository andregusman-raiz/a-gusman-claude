---
name: ag-auditar-react-hooks
description: "Auditor de Hooks React. Detecta violacoes das Rules of Hooks, deps faltando/excessivas em useEffect/useMemo/useCallback, candidatos a custom hook, useState que deveria virar useReducer. Use para audit qualidade React proativo."
model: sonnet
context: fork
argument-hint: "[path do projeto] [--report-only | --fix-safe | --deep]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, LSP
metadata:
  filePattern: "react-hooks-audit-*.md,react-hooks-audit-*.json"
  bashPattern:
    - "\\beslint-plugin-react-hooks\\b"
    - "\\buseEffect\\b.*deps\\b"
  priority: 85
---

# ag-auditar-react-hooks — Audit de Hooks React

Auditor especializado em qualidade de Hooks React. Detecta os 4 problemas que o `eslint-plugin-react-hooks` sozinho nao cobre: heuristica de extracao de custom hook, useState complexo que deveria ser useReducer, deps redundantes, e padroes de uso anti-ergonomicos.

## Invocacao

```
/ag-auditar-react-hooks                          # CWD, modo report-only
/ag-auditar-react-hooks ~/Claude/GitHub/x        # path explicito
/ag-auditar-react-hooks --fix-safe               # aplica fixes HIGH-confidence (exhaustive-deps + obvious memo)
/ag-auditar-react-hooks --deep                   # analise AST + heuristicas de refactor
```

## O que faz (4 categorias)

### 1. Rules of Hooks (eslint-plugin-react-hooks strict)

Detecta violacoes que o lint padrao captura:
- Hook chamado dentro de `if/else/ternary`
- Hook dentro de `for/while/forEach/map`
- Hook depois de `return` condicional
- Hook chamado em funcao que nao e component nem custom hook
- Ordem de chamada inconsistente entre renders

Tool: `eslint --rule 'react-hooks/rules-of-hooks: error' --rule 'react-hooks/exhaustive-deps: warn'`

### 2. Deps de useEffect/useMemo/useCallback

- **Faltando**: vars do closure usadas no body mas ausentes do array (cobertura `exhaustive-deps`)
- **Excessivas**: vars no array que NAO sao usadas no body (lint nao captura — AST custom)
- **Stale closure**: setter de state usado dentro de callback sem state estar nas deps
- **Object/array literais inline**: `useEffect(..., [{foo: 1}])` re-cria objeto a cada render → loop infinito disfarcado
- **Funcao inline em deps**: `useEffect(..., [() => x])` re-cria a cada render
- **Deps com primitivos derivados**: `[user.name]` em vez de `[user]` quando so name e usado (otimizacao)

### 3. Candidatos a custom hook

Heuristica de extracao (sinais combinados):
- `useEffect` com body > 15 linhas E envolve fetch/subscribe/timer
- 3+ `useState` declarados juntos para a mesma feature (ex: `loading`, `data`, `error`)
- Logica de setup + cleanup em useEffect aparece em 2+ componentes (duplicacao)
- Combinacao `useState + useEffect` que poderia ser `useQuery`/`useSWR`/`useResource`
- Imperativo: refs + observers + listeners no mesmo componente

Output: lista de candidatos com nome sugerido (`useFetch{Entity}`, `use{Feature}`).

### 4. useState que deveria ser useReducer

Sinais:
- 4+ `useState` no mesmo componente correlacionados (mesma feature)
- `setState` chamado em sequencia: `setLoading(true); setData(null); setError(null)` (transicao de estado)
- Updates que dependem de multiplos states anteriores: `setX(prev => ...y...)` cruzando states
- State machine implicita: `status: 'idle' | 'loading' | 'success' | 'error'` com `if/else` longo

Output: sugestao de shape do reducer + action types.

## Modos

| Modo | Flag | Comportamento |
|------|------|--------------|
| report-only | default | Scan + relatorio. NUNCA modifica codigo |
| fix-safe | `--fix-safe` | Aplica `exhaustive-deps --fix` + remove deps obviamente redundantes. Quality gates entre fixes |
| deep | `--deep` | AST custom completa: heuristica custom hook + useReducer sugerida + diff sugerido |

## Pipeline

### Fase 1 — Setup
```bash
# Detectar package manager
PM=$([ -f bun.lock ] && echo "bun" || echo "npm")

# Garantir eslint-plugin-react-hooks instalado
$PM list eslint-plugin-react-hooks 2>/dev/null || $PM add -d eslint-plugin-react-hooks

# Baseline: contar hooks por arquivo
find src/ app/ components/ -name "*.tsx" 2>/dev/null | \
  xargs grep -c "use[A-Z]" | sort -t: -k2 -nr | head -20
```

### Fase 2 — ESLint strict scan
```bash
bunx eslint \
  --rule 'react-hooks/rules-of-hooks: error' \
  --rule 'react-hooks/exhaustive-deps: error' \
  --no-eslintrc \
  --plugin react-hooks \
  --parser @typescript-eslint/parser \
  --ext .tsx,.ts \
  --format json \
  src/ app/ components/ > hooks-eslint.json 2>/dev/null || true
```

Categorias derivadas:
- `rules-of-hooks` → violacao crítica (BLOCKER)
- `exhaustive-deps` missing → bug provavel (HIGH)
- `exhaustive-deps` unnecessary → otimizacao (MEDIUM)

### Fase 3 — AST custom (so em `--deep`)

Spawn agent com ts-morph ou TS Compiler API. Para cada `.tsx`:

```ts
// A — Deps excessivas (lint nao captura)
for (const call of findCalls(['useEffect', 'useMemo', 'useCallback'])) {
  const deps = call.arguments[1]?.elements ?? []
  const bodyIdentifiers = collectIdentifiersInBody(call.arguments[0])
  const unused = deps.filter(d => !bodyIdentifiers.has(d.text))
  if (unused.length) report({ kind: 'unnecessary-dep', call, unused })
}

// B — Object/array literal inline em deps (re-cria a cada render)
for (const dep of allDeps) {
  if (dep.kind === 'ObjectLiteralExpression' || dep.kind === 'ArrayLiteralExpression') {
    report({ kind: 'inline-object-dep', dep, severity: 'HIGH' })
  }
}

// C — Candidato custom hook
for (const effect of useEffectCalls) {
  if (effect.bodyLines > 15 && /fetch|subscribe|setInterval|addEventListener/.test(effect.bodyText)) {
    report({ kind: 'custom-hook-candidate', effect, suggested: deriveName(effect) })
  }
}

// D — useReducer candidate
const states = collectUseStateInComponent(componentNode)
if (states.length >= 4 && correlatedSetters(states)) {
  report({ kind: 'usereducer-candidate', states, suggestedShape: deriveReducerShape(states) })
}
```

### Fase 4 — Relatorio

Escrever em `docs/diagnosticos/react-hooks-audit-YYYY-MM-DD.md`:

```markdown
# React Hooks Audit — [projeto] — [data]

## Resumo
- Arquivos .tsx scanned: N
- Hooks usados: N (useState: X, useEffect: Y, useMemo: Z, useCallback: W, custom: V)
- Violacoes Rules of Hooks: N (BLOCKER)
- Deps faltando: N (HIGH)
- Deps excessivas: N (MEDIUM)
- Inline object/array em deps: N (HIGH)
- Candidatos custom hook: N
- Candidatos useReducer: N

## Violacoes Criticas

### Rules of Hooks
[lista com path:linha + snippet + fix sugerido]

### Inline Object/Array em Deps (re-render loop)
[path:linha + snippet + fix: extrair p/ useMemo ou mover p/ fora]

## Sugestoes de Refactor

### Custom Hook Candidates
[path:linha + heuristica + nome sugerido + esqueleto do hook]

### useReducer Candidates
[path:linha + states correlacionados + shape sugerido + action types]

## Otimizacoes
[deps excessivas, primitivos derivados, etc.]
```

Tambem `react-hooks-audit-YYYY-MM-DD.json` machine-readable para integrar com `ag-9-auditar`.

## Apply mode (`--fix-safe`)

Aplica APENAS fixes HIGH-confidence sem mudar comportamento:
- `exhaustive-deps --fix` (oficial eslint-plugin-react-hooks)
- Remove deps obviamente redundantes (vars nao referenciadas no body)
- Quality gate apos cada arquivo: `bun run typecheck && bun run lint`
- Se gate falha → revert + report

NUNCA aplica automaticamente:
- Extracao de custom hook (mudanca arquitetural)
- Conversao useState → useReducer (mudanca arquitetural)
- Remocao de hooks (pode quebrar logica)

## Whitelist (NUNCA tocar)

```
**/*.test.tsx           **/*.spec.tsx
**/__tests__/**          **/__fixtures__/**
**/*.stories.tsx         **/node_modules/**
**/*.generated.tsx       **/codegen/**
```

## Output

```
REACT HOOKS AUDIT COMPLETO
  Modo: [report-only|fix-safe|deep]
  Arquivos: [N]
  Violacoes: [N total]
    BLOCKER (rules-of-hooks): [N]
    HIGH (missing deps / inline object): [N]
    MEDIUM (unnecessary deps): [N]
  Candidatos refactor: [N custom hook + N useReducer]
  Relatorio: docs/diagnosticos/react-hooks-audit-YYYY-MM-DD.md
  JSON: react-hooks-audit-YYYY-MM-DD.json
  Fixes aplicados: [N] (so se --fix-safe)
  Status: GREEN | NEEDS_REVIEW | BLOCKED
```

## Quando usar

| Sinal do usuario | Acao |
|---|---|
| "auditar hooks" / "audit React hooks" | report-only |
| "useEffect com deps erradas" | report-only --deep |
| "esse componente tem muito useState" | --deep (foca em useReducer candidates) |
| "extrair custom hook" | --deep (foca em custom hook candidates) |
| "limpar deps redundantes" | --fix-safe |
| "audit completo React" | --deep + integrar output em ag-9-auditar |

## Composicao com outras machines

- **ag-7-qualidade**: invoca como sub-check da dimensao WORKS
- **ag-9-auditar**: incluir output na dimensao ARCHITECT/PATTERNS
- **ag-2-corrigir tipos**: pipeline complementar (TS + Hooks juntos)
- **ag-13-limpar-codigo**: detecta useState morto; este detecta useState ineficiente — sao ortogonais

## Referencias

- React docs: https://react.dev/reference/rules/rules-of-hooks
- eslint-plugin-react-hooks: https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
- "useReducer vs useState" (Kent C. Dodds): https://kentcdodds.com/blog/should-i-usestate-or-usereducer
- "When to useMemo and useCallback" (Kent C. Dodds): https://kentcdodds.com/blog/usememo-and-usecallback
