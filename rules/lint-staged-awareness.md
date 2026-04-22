# Lint-Staged Awareness

## Problema
Repos com `lint-staged` em pre-commit rodam `eslint --fix` + `prettier --write` nos arquivos staged.
Isso **modifica silenciosamente** o conteudo entre `git add` e o commit final — edicoes que o Claude
fez podem ser revertidas/reformatadas sem aviso visivel na sessao.

**Sintoma classico do usuario**: "o linter reverteu minhas mudancas". Diff mostra conteudo diferente
do que foi editado. Causa real: eslint --fix rodou durante pre-commit e alterou.

## Deteccao
Um repo tem lint-staged se:
1. `package.json` contem chave `"lint-staged"` com globs
2. `.husky/pre-commit` ou `.pre-commit-config.yaml` chama `lint-staged`

Repos conhecidos com lint-staged ativo: `raiz-platform` (eslint --fix + prettier).

## Regras

### 1. Preview do linter ao editar (.ts/.tsx/.js/.jsx)
Hook `lint-staged-preview.sh` (PostToolUse Edit/Write) roda `eslint --fix` no arquivo
IMEDIATAMENTE apos edicao em repos com lint-staged. Assim, reverts acontecem na hora e
sao visiveis em release subsequente (next Read), em vez de silenciosamente no commit.

Se o hook emite `[lint-staged-preview] eslint --fix modificou X` → reler o arquivo e
verificar o que mudou antes de declarar edicao completa.

### 2. Antes de commitar em repo com lint-staged
```bash
# 1. Stage arquivos normalmente
git add <arquivos>

# 2. Preview do que lint-staged vai fazer (opcional mas recomendado para mudancas nao-triviais)
npx lint-staged --diff

# 3. Commit — se ESLint alterar algo, as alteracoes ficam no commit final
git commit -m "..."
```

### 3. Regras ESLint que mais revertam silenciosamente
- `no-unused-vars` / `@typescript-eslint/no-unused-vars` — remove imports/vars "nao usadas"
- `prefer-const` — reescreve `let` para `const`
- `no-var` — reescreve `var` para `let/const`
- `eqeqeq` — troca `==` por `===`
- `no-console` — remove `console.log`
- `import/order` — reordena imports
- `prettier/prettier` — reformata tudo

Se voce editou algo que envolve qualquer uma dessas, espere eslint --fix agir.

### 4. Se o linter esta errado sobre "unused"
Imports que parecem unused mas sao necessarios:
- Types usados so em JSDoc/TSDoc
- React default import em arquivos com JSX (se config exige)
- Side-effect imports (`import "./polyfills"`)
- Types re-exportados implicitamente

Solucao:
```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UsedInTypeOnly } from "./types";
```

### 5. Bypass so em casos extremos
`git commit --no-verify` pula lint-staged inteiro. **PROIBIDO por default** (viola
branch-strategy.md). Exceptions:
- Hotfix urgente de producao (anotar em PR description)
- Lint-staged bugado bloqueando commit legitimo (abrir issue para fix do config)

## Enforcement
- Hook `lint-staged-preview.sh` (PostToolUse) — alerta quando eslint --fix muda arquivo
- Rule `incremental-commits.md` — auto-fix de unused imports via bash-guards.sh
- Rule `edit-persistence-safety.md` — verificar `git diff` apos edicoes

## Debugging quando "linter reverteu"
1. `git reflog -10` — ver historia de HEAD
2. `git log -1 --stat` — ver o que foi realmente commitado
3. `git show HEAD -- <arquivo>` — diff exato do ultimo commit
4. Comparar com a versao que Claude editou (recuperavel via sessao ou re-edit)
5. Se o diff mostra mudancas ALEM das suas → lint-staged agiu. Identificar regra.

## Checklist pre-commit em repo com lint-staged
- [ ] Rodei `eslint --fix <arquivo>` ou hook rodou automaticamente?
- [ ] Reli o arquivo apos linter para ver versao final?
- [ ] Imports "possivelmente unused" tem `eslint-disable` ou sao usados de verdade?
- [ ] Formatacao manual (ex: alinhamento especifico) sobrevive ao prettier?
