---
name: ag-versionar-codigo
description: "Gerencia git - branches, commits semanticos, PRs, releases e changelog. Use ao final de cada fase ou feature para manter historico limpo."
model: sonnet
argument-hint: "[branch|commit|pr|release] [descricao]"
disable-model-invocation: true
---

# ag-versionar-codigo — Versionar Codigo

Spawn the `ag-versionar-codigo` agent to manage git operations: branches, semantic commits, PRs, releases, and changelog.

## Git Context

- **Branch**: !`git branch --show-current 2>/dev/null || echo "no-git"`
- **Status**: !`git status --short 2>/dev/null | head -10`
- **Recent commits**: !`git log --oneline -5 2>/dev/null || echo "no history"`

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-versionar-codigo`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD]
Acao: [branch|commit|pr|tag|changelog|release|cleanup]
Descricao: [descricao da acao]


Execute a acao solicitada seguindo as convencoes de commit semantico e branch naming do projeto.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user

## Output

- Branch criada com nome semantico (feat/, fix/, refactor/)
- Commits semanticos com mensagens descrevendo "why"
- PR criado com titulo, body e checklist padrao
- Release publicada com changelog, tag e GitHub Release (modo release)

## Anti-Patterns

- NUNCA fazer stash sem confirmacao do usuario — stash ja perdeu sessao inteira de trabalho
- NUNCA force push em main/master — destroi historico; apenas em branches pessoais com aviso claro
- NUNCA usar --no-verify — hooks existem por motivo; corrigir o problema, nao ignorar
- NUNCA usar `git add -A` ou `git add .` — listar arquivos explicitamente; previne commit acidental de .env
- NUNCA merge com testes falhando — testes falhando = risco de regressao

## Quality Gate

- [ ] Branch correta (nao em main para codigo)?
- [ ] Commit descreve "why", nao "what"?
- [ ] PR inclui checklist e test plan?
- [ ] Release segue semver corretamente (modo release)?
