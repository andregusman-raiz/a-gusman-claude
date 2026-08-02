---
name: ag-corrigir-tipos
description: "Corrige erros TypeScript com auto-routing. Scan (diagnosticar), Fix (batch incremental), Sweep (varredura com ratchet), Audit-any (auditoria proativa de any/inferencias fracas). Substitui workflow manual de typecheck."
model: sonnet
argument-hint: "[--scan|--fix|--sweep|--audit-any] [path ou escopo]"
disable-model-invocation: true
---

# ag-corrigir-tipos — Fix TypeScript

Spawn the `ag-corrigir-tipos` agent to handle TypeScript error correction — from diagnosis to large-scale sweeps.

## Auto-Routing

The agent auto-selects the best mode based on input:

| Input | Mode | Behavior |
|-------|------|----------|
| "diagnosticar tipos" / desconhecido | `--scan` | Categorizar erros, gerar plano (read-only) |
| 1-10 erros claros | `--fix` | Batch incremental, 5 arquivos/batch, commits |
| 10-50 erros | `--fix` | Multiplos batches com quality gates |
| 50+ erros / "limpar tipos" | `--sweep` | Varredura por categoria, ratchet threshold |
| "audit any" / "scan any" / "props sem tipo" | `--audit-any` | Auditoria proativa SEM precisar de erro TS |
| Pos-upgrade de lib | ag-depurar-erro first | Causa raiz, depois `--fix` |

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-corrigir-tipos`
- `mode`: `bypassPermissions`
- `run_in_background`: `true` (except `--fix` < 10 errors which runs foreground)
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Modo: [--scan|--fix|--sweep] (ou auto-detect)
Escopo: [all | modulo | lista de arquivos]
Threshold CI: [numero, se aplicavel para ratchet]

Executar correcao de erros TypeScript no modo indicado (ou auto-detect).
Seguir quality gates: max 5 arquivos/batch, commit entre batches, zero `as any`.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- For `--scan`: agent is READ-ONLY, does NOT fix errors
- For `--fix`: commits incrementally every 5 files
- For `--sweep`: categorizes first, then attacks by type (easy→hard)
- For `--audit-any`: READ-ONLY, audita codigo SEM depender de erros TS emitidos
- NEVER uses `as any`, `@ts-ignore`, or relaxes `strict` mode
- Memory safety: max 1 `tsc` process, uses LSP for quick checks

## Modo --audit-any (auditoria proativa de qualidade de tipos)

Audita o codigo SEM precisar de erros TS emitidos pelo `tsc`. Detecta 4 problemas que `strict` mode nao captura sozinho:

### 1. `any` explicito
- Grep AST por `: any`, `as any`, `<any>`, `Array<any>`, `Promise<any>`, `Record<string, any>`
- Cross-check: variavel realmente nao tem tipo derivavel? (sugerir `unknown` ou tipo concreto)
- Excecoes legitimas: testes, mocks, type guards intencionais (anotar `// expected: any`)

### 2. Props sem interface/type
- Para cada componente React (function ou arrow), verificar:
  - Tem `Props` interface/type declarado?
  - OU usa `React.FC<X>`?
  - OU destructura props sem tipo (`function Foo({ x, y }) {}` sem annotation)?
- Sugerir interface inferida a partir do uso de props no body

### 3. Inconsistencia interface vs type
- Contar uso de `interface X` vs `type X = { ... }`
- Se projeto tem > 70% de um e < 30% do outro: sugerir padronizar
- Verificar `.eslintrc` para regra `@typescript-eslint/consistent-type-definitions`
- NUNCA decidir sozinho — reportar e pedir preferencia (interface preferida quando ha extends + augmentation; type quando ha unioes/intersecoes)

### 4. Tipos pouco restritivos
- `string` quando deveria ser literal union (ex: status: 'idle' | 'loading' | 'error')
- `number` quando deveria ser branded type (ex: UserId, OrderId)
- `Record<string, unknown>` para responses de API (sugerir Zod schema)
- `Object`, `{}`, `Function` — anti-patterns conhecidos

### Pipeline --audit-any

```bash
# 1. Setup
bunx eslint --rule '@typescript-eslint/no-explicit-any: warn' \
  --rule '@typescript-eslint/no-unsafe-assignment: warn' \
  --rule '@typescript-eslint/no-unsafe-return: warn' \
  --rule '@typescript-eslint/explicit-module-boundary-types: warn' \
  --format json --ext .ts,.tsx src/ app/ components/ > any-audit.json

# 2. AST custom (props sem tipo)
# Spawn ag-corrigir-tipos com prompt especifico para coletar componentes sem Props interface

# 3. Contagem interface vs type
grep -c '^interface ' src/**/*.ts > interface-count
grep -c '^type .* = {' src/**/*.ts > type-count
```

### Output --audit-any

Escreve `docs/diagnosticos/typescript-audit-YYYY-MM-DD.md`:

```markdown
# TypeScript Audit — [projeto] — [data]

## Resumo
- Arquivos scanned: N
- `any` explicito: N ocorrencias em N arquivos
- Props sem tipo: N componentes
- Inconsistencia interface vs type: N% / N%
- Tipos pouco restritivos: N candidatos

## Top 10 ocorrencias de `any`
| Arquivo:linha | Snippet | Fix sugerido |
|---|---|---|

## Componentes sem Props interface
[path:linha + props destructured + interface sugerida]

## Tipos pouco restritivos
[path:linha + tipo atual + tipo sugerido + razao]
```

Apply mode (apos `--audit-any` + user approval): pode invocar `--fix` para casos HIGH-confidence (substituir `as any` por `unknown` + narrowing, adicionar Props interface inferida).

## Escalacao

### Erros nao-resolvidos
Se erro de tipo resiste a 3 tentativas de fix:
- Documentar em `errors-log.md`
- Escalar para ag-depurar-erro (depurar) se causa raiz nao-obvia
- Escalar para ag-registrar-issue (registrar-issue) se requer mudanca arquitetural

### Pos-Sweep
Apos sweep completo, spawnar ag-testar-codigo para validar que fixes nao quebraram funcionalidade.

## Sinais de Ativacao (para ag-0-orquestrador)

| Sinal do usuario | Modo |
|-------------------|------|
| "corrigir tipos", "fix typescript", "typecheck" | auto-detect |
| "diagnosticar tipos", "quantos erros TS" | --scan |
| "limpar tipos", "sweep typescript", "zerar erros" | --sweep |
| "erros de tipo no [arquivo]" | --fix (escopo limitado) |
| "reducir error budget", "ratchet" | --sweep |
| "audit any", "scan any", "props sem tipo", "interface vs type" | --audit-any |
