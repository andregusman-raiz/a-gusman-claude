---
name: ag-revisar-codigo
description: "Code review de PRs e changesets — questiona decisoes de design, aponta complexidade, sugere alternativas. Review construtivo focado em design, nao estilo. Use when reviewing a pull request, merge request, code review, changeset, or architecture feedback on a branch diff."
model: sonnet
argument-hint: "[PR number ou changeset]"
disable-model-invocation: true
---

# ag-revisar-codigo — Criticar Projeto

Review construtivo como engenheiro senior focado em riscos reais de producao — concorrencia, deploys parciais, falhas em escala. Foco em design decisions, NAO estilo.

Spawn the `ag-revisar-codigo` agent to perform code review on a PR or changeset.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-revisar-codigo`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
PR/Changeset: [PR number, branch name, ou commit range]

Revisar design, complexidade, e alternativas. Para PRs com 10+ arquivos, usar Agent Teams (reviewer + auditor em paralelo).
Foco em design decisions, NAO em estilo de codigo.
```

Example invocation: `gh pr diff 42 | review design decisions, concurrency risks, and rollback safety`

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- READ-ONLY review — does NOT edit code, only suggests improvements
- For PRs with 10+ files, automatically uses Agent Teams for parallel review + audit
- After agent completes, verify report covers all diff files and contains only findings with confidence >= 80

## Output

Each finding follows this format:
```
[blocker] (92%) src/api/handler.ts:45
  Problema: Race condition — concurrent requests can double-write to shared cache
  Evidencia: handler reads cache at L45, writes at L52 with no lock
  Sugestao: Use atomic compare-and-set or mutex around read-write block
```

Severity prefixes: **blocker** (impede merge), **suggestion** (melhoria), **nit** (ignoravel), **question** (esclarecimento).

## Anti-Patterns

- NUNCA focar em style — formatacao e trabalho do linter; se lint passa, style nao e concern
- NUNCA dar feedback vago — "codigo confuso" nao e acionavel; apontar linha e cenario concreto
- NUNCA reportar sem evidencia — se nao consegue apontar linha exata e cenario real, score < 80
- NUNCA reportar issues pre-existentes — review e sobre o diff, nao o codebase inteiro
- NUNCA reescrever codigo do autor — sugerir abordagem, nao impor

## Quality Gate

- [ ] Cada finding tem severity E confidence score (0-100)?
- [ ] Apenas findings com score >= 80 reportados?
- [ ] Feedback acionavel com evidencia concreta?
- [ ] Review cobriu TODOS os arquivos do diff?
- [ ] Se quality gate falhar: re-review os arquivos com findings ausentes ou de baixa confianca

### Architecture Checklist
- Dependency Rule: imports apontam para dentro (Presentation -> Application -> Domain)?
- Domain puro: entidades sem imports de framework/ORM?
- Use Cases focados: orquestram logica, nao implementam infra?
- Classe >3 deps injetadas (SRP), metodo >3 branches (Strategy), interface >5 metodos (ISP)?
