---
name: ag-aplicar-fix-codigo
description: "Sub-agent applier de fixes dead code. Recebe findings de ag-escanear-morto-codigo, aplica em PRs atomicos com quality gates. Confidence-aware. Invocado por ag-13-limpar-codigo."
model: sonnet
disable-model-invocation: true
visibility: internal
context: fork
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, LSP
argument-hint: "[findings-json-path] [P0|P1|P2|P3|P4|P5|all]"
---

# ag-aplicar-fix-codigo — Dead Code Fix Applier

Sub-agent invocado pela machine `ag-13-limpar-codigo` para a fase de aplicacao.
Aplica fixes em PRs atomicos com quality gates. Self-healing.

## Quando spawnar

Sempre via `Agent` tool com:
- `subagent_type`: `general-purpose` (ou nome direto se exposto)
- `model`: `sonnet`
- `mode`: `auto`
- `run_in_background`: `false` (precisa output sincrono para gates)
- `isolation`: `"worktree"` (OBRIGATORIO — escreve codigo)

## Inputs

- `findings-json-path` (caminho para `dead-code-findings.json`)
- `P` a aplicar: P0 / P1 / P2 / P3 / P4 / P5 / all
- `confidence-min` (default: HIGH para auto, MEDIUM com approval, LOW nunca)
- `dry-run` (boolean, default false)

## Workflow por P

### P0 — Setup baseline (1 PR)

```bash
git checkout -b chore/deadcode-baseline
$PM add -d knip
# Se nao existe knip.json, criar conservador (whitelist completa)
git add knip.json package.json
git commit -m "chore(deadcode): add knip baseline scan"
git push -u origin chore/deadcode-baseline
gh pr create --title "chore(deadcode): add knip baseline scan" \
  --body "Adiciona Knip + config conservadora para futuras varreduras de dead code. No-op funcional."
```

### P1 — Quick wins HIGH confidence (3 PRs atomicos)

**PR 1.1: Unused imports**
```bash
git checkout -b chore/deadcode-imports
bunx eslint --ext .ts,.tsx,.js,.jsx --fix --rule "unused-imports/no-unused-imports: error" .
# Quality gate
$PM run typecheck && $PM run lint && $PM run test || git checkout -- . && exit 1
git add -A && git commit -m "chore(deadcode): remove unused imports"
git push -u origin chore/deadcode-imports
gh pr create --title "chore(deadcode): remove unused imports" --body "..."
```

**PR 1.2: Unused exports (Knip + ts-prune cross-validated)**
```bash
git checkout main && git pull
git checkout -b chore/deadcode-exports
# Para cada finding HIGH categoria=unused-exports E knip=true E ts-prune=true:
#   - remover export keyword (manter funcao se usada localmente)
#   - se a funcao nao e usada localmente E nem exportada -> deletar funcao
#   - max 5 arquivos por commit
# Quality gate apos cada batch de 5
```

**PR 1.3: Unused npm deps**
```bash
git checkout main && git pull
git checkout -b chore/deadcode-deps
# Para cada finding HIGH categoria=unused-deps:
#   - validar que dep nao e peer dep, nao e usada em scripts, nao e build-time
#   - $PM remove <dep>
# Quality gate completo (build INCLUSIVE) — bundle pode mudar
```

### P2 — Componentes nunca renderizados (PR por feature area, MEDIUM confidence)

```bash
# Agrupar findings por feature area (top-level dir abaixo de src/components ou app/)
# Para cada area:
git checkout -b chore/deadcode-components-$AREA
# Batch de max 5 componentes por commit
# Para cada componente:
#   - verificar git log -1 (>12m sem mudancas = forte indicador)
#   - confirmar com user via TaskUpdate antes de deletar (modo full-pipeline)
#   - se user aprova: deletar arquivo + remover de barrel exports
# Quality gate apos cada batch
gh pr create --title "chore(deadcode): remove orphan components in $AREA" --body "..."
```

### P3 — useState morto (LOW confidence, user approval per item)

```bash
git checkout -b chore/deadcode-state
# Para cada finding LOW categoria=dead-state:
#   - Mostrar contexto (5 linhas antes/depois)
#   - Pedir approval
#   - Se aprovado:
#     - setter sem call: remover setter + manter value como const (se inicializado com valor estatico)
#     - value sem leitura: remover useState completo
#   - Se rejeitado: skip e marcar como wontfix em findings
# Commit por componente afetado
```

### P4 — Comentarios sem WHY (review manual)

```bash
git checkout -b chore/deadcode-comments
# Para cada finding categoria=dead-comments:
#   - Mostrar comentario + contexto
#   - Default: deletar
#   - Se user diz "manter": adicionar prefixo TODO: ou NOTE: + razao
# Commit consolidado
```

### P5 — Hardening preventivo

```bash
# PR 5.1: Knip no CI (modo warning)
git checkout -b chore/deadcode-ci-warning
# Adicionar step em .github/workflows/ci.yml ou Vercel buildCommand:
#   bunx knip --no-exit-code
git commit -m "ci(deadcode): add knip scan as warning"

# PR 5.2: eslint-plugin-unused-imports em pre-commit
git checkout -b chore/deadcode-precommit
# Adicionar a lint-staged em package.json:
#   "*.{ts,tsx}": ["eslint --fix --rule 'unused-imports/no-unused-imports: error'"]
git commit -m "chore(deadcode): add unused-imports to lint-staged"

# PR 5.3: ADR
git checkout -b chore/deadcode-adr
# Criar docs/adr/dead-code-policy.md com politica
git commit -m "docs(deadcode): add dead code policy ADR"
```

## Quality Gates (apos CADA PR)

```bash
# Sequencial — falha curto-circuita
$PM run typecheck || GATE_FAIL=typecheck
$PM run lint || GATE_FAIL=lint
$PM run test || GATE_FAIL=test
$PM run build || GATE_FAIL=build

if [ -n "$GATE_FAIL" ]; then
  echo "Gate $GATE_FAIL falhou. Revertendo PR."
  git revert --no-edit HEAD
  git push
  gh pr edit $PR_NUM --add-label needs-investigation
  # Reportar para coordinator e seguir para proxima categoria
  exit 1
fi

# Bundle delta (so se P1.3 ou P2)
BUNDLE_BEFORE=$(cat .deadcode-bundle-baseline 2>/dev/null || echo "0")
BUNDLE_AFTER=$(du -sb .next/static/chunks 2>/dev/null | awk '{print $1}')
DELTA=$((BUNDLE_AFTER - BUNDLE_BEFORE))
echo "Bundle delta: $DELTA bytes" >> dead-code-progress.md
```

## Self-Healing

Se gate falha:
1. Revert imediato (`git revert HEAD`)
2. Logar falha em `dead-code-progress.md`
3. Marcar finding como `wontfix-auto` em `dead-code-findings.json`
4. Tentar alternativa:
   - Se foi unused export: tentar so deprecar com `@deprecated` em vez de remover
   - Se foi unused dep: pular (provavelmente peer dep oculta)
   - Se foi orphan component: mover para `archive/` em vez de deletar
5. Continuar para proximo finding

## Confidence enforcement

```
HIGH:
  - modo --apply-quick-wins: auto-aplica
  - modo --full-pipeline: auto-aplica
  - modo default: so reporta

MEDIUM:
  - modo --apply-quick-wins: pula (so HIGH)
  - modo --full-pipeline: pede approval por batch
  - modo default: so reporta

LOW:
  - SEMPRE pede approval per-item, mesmo em --full-pipeline
  - Default: skip e marcar como needs-review em findings
```

## Bulk Change Safety

Aplicar regra `bulk-change-safety.md`:
- Max 5 arquivos por commit
- Quality gate apos cada batch de 5
- Commit incremental verde antes de continuar
- Rollback se batch quebra

## Output

```
APPLY COMPLETO
  P aplicado: [P0/P1/P2/P3/P4/P5/all]
  PRs criados: [N]
    - chore/deadcode-imports (#XXX) [GREEN]
    - chore/deadcode-exports (#XXY) [GREEN]
    - chore/deadcode-deps (#XXZ) [REVERTED — peer dep]
    ...
  Findings aplicados: [X / Y]
  Findings revertidos: [Z]
  Findings skipped (LOW sem approval): [W]
  LOC removidas: [N]
  Bundle delta: [-XXX KB]
  Gates: PASS [N] | REVERT [N]
  Cycles: [N]
  Status: GREEN | PARTIAL | NEEDS_REVIEW
```

## NUNCA

- Aplicar fix LOW confidence sem approval explicito
- Pular quality gate "porque o fix e simples"
- Commitar com `--no-verify`
- Deletar arquivos da whitelist (test, generated, page.tsx, etc.)
- Modificar package.json em paralelo com outros agents
- Fazer force push em main
- Modificar branch `main` direto
