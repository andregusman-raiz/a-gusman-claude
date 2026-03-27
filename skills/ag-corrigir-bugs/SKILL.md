---
name: ag-corrigir-bugs
description: "Bugfix unificado com auto-routing. Triage (classificar bugs), Fix (1 bug + 5 gates), Batch (2-5 bugs em sprints), Parallel (6+ bugs em Agent Teams). Substitui ag-corrigir-bugs/24/25/26."
model: sonnet
argument-hint: "[--triage|--fix|--batch|--parallel] [bugs ou path para diagnostico]"
disable-model-invocation: true
---

# ag-corrigir-bugs — Bugfix

Spawn the `ag-23-bugfix` agent to handle any bugfix workflow — from triage to parallel execution.

## Auto-Routing

The agent auto-selects the best mode based on input:

| Input | Mode | Behavior |
|-------|------|----------|
| Lista sem contexto / "triar" | `--triage` | Read-only classification + sprint plan |
| 1 bug claro | `--fix` | Single fix with 5 quality gates |
| 1 bug obscuro | ag-depurar-erro first | Then `--fix` |
| 2-5 bugs | `--batch` | Sequential sprints, incremental commits |
| 6+ independent bugs | `--parallel` | Agent Teams, exclusive ownership |
| 6+ bugs with file overlap | `--batch` | Sequential for safety |

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-23-bugfix`
- `mode`: `bypassPermissions`
- `run_in_background`: `true` (except `--fix` which runs foreground)
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Modo: [--triage|--fix|--batch|--parallel] (ou auto-detect)
Bugs: [lista de bugs — IDs, descricoes, path para diagnostico, ou inline]
Branch: [branch atual ou nome para criar]
Diagnostico: [path para bug_triage.md gerado por mode triage, se disponivel]


Executar bugfix no modo indicado (ou auto-detect baseado na quantidade de bugs).
Seguir todas as quality gates do modo selecionado.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- For `--triage`: agent is READ-ONLY, does NOT fix bugs
- For `--fix`: runs foreground (sequential quality gates, user needs result)
- For `--batch`: uses worktree isolation
- For `--parallel`: uses Agent Teams with exclusive file ownership
- Gates are blocking: if any gate fails, fix before proceeding

## Escalacao: Issues para Bugs Nao Resolvidos

### Mode --triage
Apos classificar bugs, spawnar ag-registrar-issue para cada bug que NAO sera fixado nesta sessao:
```
Agent({
  subagent_type: "ag-registrar-issue",
  name: "issue-registrar",
  model: "haiku",
  run_in_background: true,
  prompt: "Repo: [detectar]\nOrigem: ag-corrigir-bugs --triage\nSeveridade: [P0-P3 da triagem]\nTitulo: [bug title]\nContexto: [descricao + classificacao + sprint sugerido]\nArquivos: [arquivos afetados]\nLabels: bug, triage"
})
```

### Mode --fix / --batch / --parallel
Se um bug falha todas as tentativas de fix (gate nao passa):
- Registrar via ag-registrar-issue com contexto das tentativas falhadas
- Continuar com proximo bug (nao bloquear batch/parallel)

## Migration Note

This agent replaces:
- ag-B-25 (diagnosticar-bugs) → mode `--triage`
- ag-corrigir-bugs (fix-verificar) → mode `--fix`
- ag-corrigir-bugs-batch → mode `--batch`
- ag-B-24 (bugfix-paralelo) → mode `--parallel`

All functionality, anti-patterns, quality gates, and workflows from the original agents are preserved in the merged agent definition.
