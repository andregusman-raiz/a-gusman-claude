#!/bin/bash
# =============================================================================
# workspace-housekeep.sh — higiene periódica do ~/Claude.
# Default: DRY-RUN (só relata). Use --apply para executar limpezas SEGURAS.
# Nunca deleta repos nem itens >100M automaticamente. Respeita zona de exclusão.
# Agendar (opcional): crontab semanal -> bash ~/Claude/.claude/scripts/workspace-housekeep.sh --apply
# =============================================================================
set -uo pipefail

WS="$HOME/Claude"
APPLY=0; [ "${1:-}" = "--apply" ] && APPLY=1
STAMP=$(date +%Y-%m-%d)
QUAR="$WS/_quarentena/housekeep-$STAMP"

# Config permitida no root (espelha workspace-hygiene-guard.sh)
is_config() {
  case "$1" in
    CLAUDE.md|AGENTS.md|README.md|CHANGELOG.md|LICENSE) return 0 ;;
    package.json|package-lock.json|bun.lock|yarn.lock|pnpm-lock.yaml) return 0 ;;
    tsconfig*.json|.npmrc|.nvmrc|.gitignore|.gitattributes) return 0 ;;
    .env|.env.*|.mcp.json|.prettierrc*|.eslintrc*|.editorconfig|.DS_Store) return 0 ;;
    *.pem|*.key|*.crt) return 0 ;;
    *) return 1 ;;
  esac
}

echo "== workspace-housekeep ($([ $APPLY = 1 ] && echo APPLY || echo DRY-RUN)) =="

# 1) Arquivos soltos no root (não-config) -> quarentena
echo "-- [1] soltos no root --"
found=0
while IFS= read -r f; do
  b=$(basename "$f"); is_config "$b" && continue
  found=1; echo "   solto: $b"
  if [ $APPLY = 1 ]; then mkdir -p "$QUAR"; mv "$f" "$QUAR/" && echo "      -> _quarentena/housekeep-$STAMP/"; fi
done < <(find "$WS" -maxdepth 1 -type f)
[ $found = 0 ] && echo "   (limpo)"

# 2) Caches regeneráveis no root do workspace
echo "-- [2] caches regeneráveis (root) --"
for c in .ruff_cache .pytest_cache .mypy_cache .tmp .cleanup-backups test-results; do
  d="$WS/$c"; [ -e "$d" ] || continue
  sz=$(du -sh "$d" 2>/dev/null | cut -f1)
  echo "   $c ($sz)"
  if [ $APPLY = 1 ]; then rm -rf "$d" && echo "      removido"; fi
done

# 3) Quarentena vencida (>30 dias) — só REPORTA (delete é decisão consciente)
echo "-- [3] quarentena vencida (>30d) --"
if [ -d "$WS/_quarentena" ]; then
  find "$WS/_quarentena" -maxdepth 1 -mindepth 1 -mtime +30 2>/dev/null | while read -r q; do
    echo "   VENCIDO: $(basename "$q") ($(du -sh "$q" 2>/dev/null | cut -f1)) — revisar e deletar manualmente"
  done
fi

# 4) .git inflados (>500M) nos buckets — REPORTA para gc manual
echo "-- [4] .git inflados (>500M) --"
for base in GitHub-raiz GitHub-pessoal Projetos; do
  [ -d "$WS/$base" ] || continue
  for g in "$WS/$base"/*/.git; do
    [ -d "$g" ] || continue
    szm=$(du -sm "$g" 2>/dev/null | cut -f1)
    [ "${szm:-0}" -gt 500 ] && echo "   $(basename "$(dirname "$g")"): ${szm}M — rodar: git -C <repo> gc --aggressive"
  done
done

echo "== fim =="
[ $APPLY = 0 ] && echo "(dry-run — rode com --apply para executar [1] e [2])"
