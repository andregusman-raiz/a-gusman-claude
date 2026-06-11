---
description: "eslint --fix reverte silencioso em pre-commit"
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Lint-Staged Awareness

## Problema
Repos com `lint-staged` em pre-commit rodam `eslint --fix` + `prettier --write` nos staged — edicoes do Claude podem ser revertidas/reformatadas silenciosamente entre `git add` e o commit. Sintoma: "o linter reverteu minhas mudancas".

Deteccao: chave `"lint-staged"` no package.json ou `.husky/pre-commit`. Repo conhecido: `raiz-platform`.

## Regras

1. **Apos editar em repo com lint-staged**: rodar `npx eslint --fix <arquivo>` e reler o resultado antes de declarar a edicao completa (preview manual — nao ha hook automatico).
2. **Regras que mais revertem**: `no-unused-vars` (remove imports), `prefer-const`, `no-console`, `import/order`, `prettier/prettier`. Editou algo nessas categorias → espere o --fix agir.
3. **Import "unused" que e necessario** (type-only em JSDoc, side-effect import): marcar `// eslint-disable-next-line @typescript-eslint/no-unused-vars`.
4. **`git commit --no-verify` PROIBIDO** por default (bash-guards bloqueia). Excecao: hotfix de producao, anotado no PR.
5. **Diagnostico de "linter reverteu"**: `git reflog -10` → `git show HEAD -- <arquivo>` → diff alem das suas mudancas = lint-staged agiu.

Relacionadas: `edit-persistence-safety.md` (git diff --stat pos-edicao), `incremental-commits.md`.
