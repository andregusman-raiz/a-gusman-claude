# Gotchas: Git & CI

## git stash
- NUNCA usar automaticamente — sempre confirmar com usuario
- Pode causar issues com lint-staged
- Preferir `git commit -m "wip: ..."` para salvar trabalho

## --no-verify
- Hook bloqueia automaticamente
- NUNCA usar para "contornar" pre-commit
- Se pre-commit falha: corrigir o problema, nao pular a verificacao

## Force Push
- Hook bloqueia `git push --force`
- Se necessario (raro): confirmar explicitamente com usuario
- NUNCA force push em main/master

## git add -A
- NUNCA usar — pode incluir .env, secrets, binarios
- Preferir `git add arquivo1 arquivo2` (explicito)
- Ou `git add -p` para review interativo

## CI Paralelo
- GitHub Actions tem limite de runners simultaneos
- Se CI fica em fila: verificar workflows paralelos

## lint-staged
- Falha mais comum: imports nao utilizados
- Segunda mais comum: erros de tipo em arquivo modificado
- Se lint-staged rejeita: corrigir e retry (max 3x), NUNCA --no-verify

## Conventional Commits
- Formato: `tipo(escopo): descricao`
- Tipos: feat, fix, refactor, docs, test, chore, ci, perf
- Hook valida automaticamente apos commit

## Agentes Paralelos e Git State

O maior risco de perda de trabalho no sistema e dois agentes operando no mesmo repo simultaneamente.

- **NUNCA** dois agentes no mesmo repo sem `isolation: "worktree"`
- `parallel-agent-guard.sh` (PreToolUse:Bash) cria lock antes de `git commit`/`git push`
- Lock em `/tmp/claude-git-locks/[repo-hash].lock` com PID:timestamp
- Timeout de 30s (lock expirado e removido automaticamente)
- Se lock bloqueou o agent: o outro agente ainda esta rodando — aguardar conclusao
- **Recovery de lock travado** (processo morreu sem cleanup):
  ```bash
  rm /tmp/claude-git-locks/*.lock
  ```
- `isolation: "worktree"` obrigatorio para: ag-B-08, ag-B-10, ag-B-23, ag-I-35
- Sem worktree: executar sequencialmente, nao em paralelo
