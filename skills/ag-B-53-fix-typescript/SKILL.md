---
name: ag-B-53-fix-typescript
description: "Corrige erros TypeScript com auto-routing. Scan (diagnosticar), Fix (batch incremental), Sweep (varredura com ratchet). Substitui workflow manual de typecheck."
model: sonnet
argument-hint: "[--scan|--fix|--sweep] [path ou escopo]"
disable-model-invocation: true
---

# ag-B-53 — Fix TypeScript

Spawn the `ag-B-53-fix-typescript` agent to handle TypeScript error correction — from diagnosis to large-scale sweeps.

## Auto-Routing

The agent auto-selects the best mode based on input:

| Input | Mode | Behavior |
|-------|------|----------|
| "diagnosticar tipos" / desconhecido | `--scan` | Categorizar erros, gerar plano (read-only) |
| 1-10 erros claros | `--fix` | Batch incremental, 5 arquivos/batch, commits |
| 10-50 erros | `--fix` | Multiplos batches com quality gates |
| 50+ erros / "limpar tipos" | `--sweep` | Varredura por categoria, ratchet threshold |
| Pos-upgrade de lib | ag-B-09 first | Causa raiz, depois `--fix` |

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-B-53-fix-typescript`
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
- NEVER uses `as any`, `@ts-ignore`, or relaxes `strict` mode
- Memory safety: max 1 `tsc` process, uses LSP for quick checks

## Escalacao

### Erros nao-resolvidos
Se erro de tipo resiste a 3 tentativas de fix:
- Documentar em `errors-log.md`
- Escalar para ag-B-09 (depurar) se causa raiz nao-obvia
- Escalar para ag-M-50 (registrar-issue) se requer mudanca arquitetural

### Pos-Sweep
Apos sweep completo, spawnar ag-Q-13 para validar que fixes nao quebraram funcionalidade.

## Sinais de Ativacao (para ag-M-00)

| Sinal do usuario | Modo |
|-------------------|------|
| "corrigir tipos", "fix typescript", "typecheck" | auto-detect |
| "diagnosticar tipos", "quantos erros TS" | --scan |
| "limpar tipos", "sweep typescript", "zerar erros" | --sweep |
| "erros de tipo no [arquivo]" | --fix (escopo limitado) |
| "reducir error budget", "ratchet" | --sweep |
