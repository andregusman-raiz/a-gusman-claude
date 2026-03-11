---
name: ag-Q-14-criticar-projeto
description: "Code review de PRs e changesets — questiona decisoes de design, aponta complexidade, sugere alternativas. Review construtivo focado em design, nao estilo."
model: sonnet
argument-hint: "[PR number ou changeset]"
disable-model-invocation: true
---

# ag-Q-14 — Criticar Projeto

Spawn the `ag-Q-14-criticar-projeto` agent to perform code review on a PR or changeset.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-Q-14-criticar-projeto`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
PR/Changeset: [PR number, branch name, ou commit range]

$ARGUMENTS

Revisar design, complexidade, e alternativas. Para PRs com 10+ arquivos, usar Agent Teams (reviewer + auditor em paralelo).
Foco em design decisions, NAO em estilo de codigo.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- READ-ONLY review — does NOT edit code, only suggests improvements
- For PRs with 10+ files, automatically uses Agent Teams for parallel review + audit

## Output

- Code review report (markdown) com findings agrupados por severity
- Cada finding com: [SEVERITY] (confidence%), file:line, problema, evidencia, sugestao
- False positives eliminados via confidence scoring (score >= 80 para reportar)

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
