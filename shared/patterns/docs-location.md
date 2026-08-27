# Docs Location — PROJECT_ROOT Resolution

> Single source of truth para onde QUALQUER skill de doc salva markdown.
> Referenciado por: `spec-writer`, `prd-writer`, `adr`, `markdown-report`, `ag-documentar-projeto`, `ag-5-documentos`, `data-dictionary`, `api-docs`, `changelog-gen`, `diagram`.

## Regra

Todo doc gerado por skill (SPEC, PRD, ADR, diagnostico, relatorio, plano) DEVE ser salvo dentro do projeto ao qual pertence — **NUNCA** em `~/Claude/docs/` (workspace raiz).

## Resolucao do destino (3 passos obrigatorios)

```bash
# 1. Resolver PROJECT_ROOT
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# 2. Validar que NAO e o workspace raiz
WORKSPACE_ROOT="$HOME/Claude"
if [ "$PROJECT_ROOT" = "$WORKSPACE_ROOT" ]; then
  # CWD e o workspace, nao um projeto. PARAR.
  echo "ERRO: estou em ~/Claude (workspace raiz), nao em projeto."
  echo "Opcoes:"
  echo "  a) cd para o projeto antes (ex: cd ~/Claude/GitHub/example-platform)"
  echo "  b) passar projeto-path explicito como argumento"
  echo "  c) se realmente for doc cross-project: usar --workspace-doc -> ~/Claude/docs/workspace/"
  exit 1
fi

# 3. Caminho final
DEST="$PROJECT_ROOT/docs/{specs|adr|diagnosticos|plans|...}/{nome}.md"
```

## Decisao por tipo de doc

| Tipo de doc | Destino canonical | Skills que geram |
|------------|-------------------|------------------|
| SPEC tecnica | `$PROJECT_ROOT/docs/specs/{nome}-spec.md` | spec-writer, ag-5-documentos |
| PRD | `$PROJECT_ROOT/docs/specs/{nome}-prd.md` | prd-writer, ag-5-documentos |
| ADR | `$PROJECT_ROOT/docs/adr/ADR-{NNN}-{slug}.md` | adr |
| Diagnostico tecnico | `$PROJECT_ROOT/docs/diagnosticos/{data}-{slug}.md` | markdown-report, ag-5-documentos |
| Plano de execucao | `$PROJECT_ROOT/docs/plans/{slug}.md` | markdown-report, ag-5-documentos |
| Relatorio executivo | `$PROJECT_ROOT/docs/reports/{slug}.md` | markdown-report, ag-5-documentos |
| Changelog | `$PROJECT_ROOT/CHANGELOG.md` | changelog-gen |
| README | `$PROJECT_ROOT/README.md` | ag-documentar-projeto |
| Data dictionary | `$PROJECT_ROOT/docs/data-dictionaries/{schema}.md` | data-dictionary |
| API docs | `$PROJECT_ROOT/docs/api/{...}` | api-docs |
| Diagrama | `$PROJECT_ROOT/docs/diagrams/{slug}.{md,svg,png}` | diagram |

## Excecoes legitimas (workspace-level)

Apenas estes tipos podem ser salvos em `~/Claude/docs/workspace/` (workspace raiz):

1. **Cross-project research** — pesquisa que cobre N projetos (ex: comparativo de stacks)
2. **Workspace ADRs** — decisoes que afetam todos os projetos (`.claude/shared/adr/` ja existe pra isso)
3. **Sessao handoff cross-project** — handoff explicito multi-repo
4. **Templates / patterns** — vao em `.claude/shared/patterns/` (nao em `docs/`)

Ativacao: passar flag `--workspace-doc` ao invocar a skill, OU salvar explicitamente em path `~/Claude/docs/workspace/`.

## Quando o usuario nao especifica projeto

Se o usuario invoca uma skill sem `cd` no projeto e sem path explicito:

1. Detectar projeto pelo conteudo do prompt (palavras como "example-platform", "example-automata", "fgts")
2. Se ambiguo: PERGUNTAR. Listar opcoes (output de `ls ~/Claude/GitHub/`, `ls ~/Claude/projetos/`)
3. NUNCA assumir `~/Claude/` como destino — quebra a regra raiz

## Helper bash (copiar pra qualquer skill)

```bash
resolve_doc_root() {
  local cwd="${1:-$(pwd)}"
  local project_root
  project_root="$(cd "$cwd" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null)"
  project_root="${project_root:-$cwd}"

  if [ "$project_root" = "$HOME/Claude" ]; then
    echo "ERROR: workspace_root_not_project" >&2
    return 1
  fi
  echo "$project_root"
}

# Uso:
PROJECT_ROOT=$(resolve_doc_root) || {
  echo "Skill abortada: estou em ~/Claude. Mude para um projeto ou passe path explicito."
  exit 1
}
DEST="$PROJECT_ROOT/docs/specs/${SLUG}-spec.md"
mkdir -p "$(dirname "$DEST")"
```

## Enforcement

- **Hook** `~/.claude/scripts/docs-location-guard.sh` (PreToolUse Write) — bloqueia Write em `~/Claude/docs/{specs,diagnosticos,plans,adr,reports}/` quando ha projeto detectavel.
- **Bypass de sessao** (emergencia): `export DOCS_GUARD_DISABLED=1`.
- **Bypass legitimo**: salvar em `~/Claude/docs/workspace/...` (sem bloqueio).

## Migracao do legado

Os 369 .md ja em `~/Claude/docs/{specs,diagnosticos,plans}/` foram acumulados por sessoes que rodaram com CWD = `~/Claude`. Migrar via:

```bash
bash ~/Claude/.claude/scripts/migrate-orphan-docs.sh
```

O script detecta projeto-pai pelo nome do arquivo + grep do conteudo e move. Nao-cadastrados ficam em `~/Claude/docs/workspace/` (legitimo).
