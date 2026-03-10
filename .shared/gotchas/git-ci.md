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
