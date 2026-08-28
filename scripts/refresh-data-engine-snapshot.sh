#!/usr/bin/env bash
# refresh-data-engine-snapshot.sh
#
# Atualiza a section <!-- AUTO-REFRESH --> da memory
# reference_data_engine_kpi_discovery.md com snapshot vivo do raiz-data-engine:
#   - Alembic head (do banco se DATABASE_URL setado, senão do filesystem)
#   - KPI IDs ativos no registry yaml
#   - Views ouro.gold_* (do banco se possível, senão grep migrations)
#   - Docs recentes em docs/plans/ e docs/diagnosticos/ (top 5)
#   - Mtime do registry (detecta drift entre yaml e banco)
#
# Idempotente. Custo zero de tokens. Pula se raiz-data-engine não existe.
# Triggers: SessionStart, PostToolUse Edit/Write em paths chave.

set -uo pipefail

REPO="$HOME/Claude/GitHub/raiz-data-engine"
MEM="$HOME/.claude/projects/-Users-andregusmandeoliveira-Claude/memory/reference_data_engine_kpi_discovery.md"

[ -d "$REPO" ] || exit 0
[ -f "$MEM" ] || exit 0

# Filter: só rodar se trigger foi em path relevante (quando vier de hook PostToolUse)
PAYLOAD=$(cat 2>/dev/null || echo "{}")
HOOK_TYPE=$(echo "$PAYLOAD" | jq -r '.hook_event_name // empty' 2>/dev/null || echo "")
TOOL_INPUT_PATH=$(echo "$PAYLOAD" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

if [ "$HOOK_TYPE" = "PostToolUse" ]; then
  case "$TOOL_INPUT_PATH" in
    *raiz-data-engine/raiz_data_engine/reports/core/kpi_registry/*) ;;
    *raiz-data-engine/migrations/*) ;;
    *raiz-data-engine/docs/plans/*) ;;
    *raiz-data-engine/docs/diagnosticos/*) ;;
    *) exit 0 ;;
  esac
fi

# Filter: se SessionStart, só rodar se CWD bater com data-engine
if [ "$HOOK_TYPE" = "SessionStart" ]; then
  CWD=$(echo "$PAYLOAD" | jq -r '.cwd // empty' 2>/dev/null || echo "")
  case "$CWD" in
    *raiz-data-engine*) ;;
    *) exit 0 ;;
  esac
fi

cd "$REPO" 2>/dev/null || exit 0

NOW=$(date +"%Y-%m-%d %H:%M:%S")
REGISTRY="$REPO/raiz_data_engine/reports/core/kpi_registry/kpis_ouro_fichas.yaml"

# 1) Alembic head — tentar banco, fallback para filesystem
ALEMBIC_HEAD="(indisponível)"
ALEMBIC_SOURCE="filesystem"
if [ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null 2>&1; then
  HEAD_FROM_DB=$(timeout 5 psql "$DATABASE_URL" -tAc "SELECT version_num FROM alembic_version" 2>/dev/null | tr -d '[:space:]')
  if [ -n "$HEAD_FROM_DB" ]; then
    ALEMBIC_HEAD="$HEAD_FROM_DB"
    ALEMBIC_SOURCE="neon"
  fi
fi
if [ "$ALEMBIC_HEAD" = "(indisponível)" ]; then
  for VDIR in "$REPO/alembic/versions" "$REPO/migrations/versions"; do
    if [ -d "$VDIR" ]; then
      LATEST_MIG=$(ls -1 "$VDIR"/*.py 2>/dev/null | sort | tail -1)
      if [ -n "$LATEST_MIG" ]; then
        ALEMBIC_HEAD=$(grep -E "^revision\s*[:=]" "$LATEST_MIG" 2>/dev/null | head -1 | sed -E "s/.*[\"']([^\"']+)[\"'].*/\1/")
        ALEMBIC_SOURCE="filesystem ($(basename $LATEST_MIG))"
        break
      fi
    fi
  done
fi

# 2) KPI IDs ativos no registry
KPI_COUNT="(yaml ausente)"
KPI_BLOCKS=""
if [ -f "$REGISTRY" ]; then
  KPI_COUNT=$(grep -c "^  - id:" "$REGISTRY" 2>/dev/null || echo 0)
  KPI_BLOCKS=$(grep "^  - id:" "$REGISTRY" 2>/dev/null | awk '{print $3}' | sed -E 's/[0-9]+$//' | sort -u | tr '\n' ',' | sed 's/,$//')
fi
REGISTRY_MTIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$REGISTRY" 2>/dev/null || echo "?")

# 3) Views Ouro
OURO_VIEWS=""
if [ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null 2>&1; then
  OURO_VIEWS=$(timeout 5 psql "$DATABASE_URL" -tAc "SELECT viewname FROM pg_views WHERE schemaname='ouro' ORDER BY viewname" 2>/dev/null | grep -v '^$' | sed 's/^/- /')
fi
if [ -z "$OURO_VIEWS" ]; then
  # Fallback: grep nos SQL migrations + alembic versions
  OURO_VIEWS=$(grep -rh -oE "ouro\.[a-z_]+" "$REPO/migrations/" "$REPO/alembic/versions/" "$REPO/raiz_data_engine/" 2>/dev/null | sort -u | sed 's/^/- /' | head -25)
fi
[ -z "$OURO_VIEWS" ] && OURO_VIEWS="_(nenhuma view detectada)_"

# 4) Top 5 docs recentes em plans + diagnosticos
RECENT_DOCS=""
for D in docs/plans docs/diagnosticos; do
  if [ -d "$REPO/$D" ]; then
    FOUND=$(find "$REPO/$D" -maxdepth 1 -type f -name "*.md" -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -3 | sed "s|$REPO/||" | sed 's/^/- /')
    [ -n "$FOUND" ] && RECENT_DOCS="$RECENT_DOCS\n**$D/**\n$FOUND\n"
  fi
done
[ -z "$RECENT_DOCS" ] && RECENT_DOCS="_(nenhum doc detectado)_"

# 5) Counts de painéis ativos
PANELS=""
if [ -d "$REPO/raiz_data_engine/reports" ]; then
  PANEL_LIST=$(find "$REPO/raiz_data_engine/reports" -maxdepth 1 -type d -not -name "core" -not -name "reports" -not -name "_templates" 2>/dev/null | xargs -n1 basename 2>/dev/null | sort | sed 's/^/- /')
  PANELS="$PANEL_LIST"
fi

# Construir bloco
BLOCK=$(cat <<EOF
<!-- AUTO-REFRESH BEGIN — não editar manualmente; gerado por refresh-data-engine-snapshot.sh -->
## Snapshot vivo

_Atualizado em ${NOW}_

### Alembic head
- **\`$ALEMBIC_HEAD\`** (fonte: $ALEMBIC_SOURCE)
- Se fonte = filesystem, o estado real no banco pode divergir. Validar com \`psql "\$DATABASE_URL" -c "SELECT version_num FROM alembic_version"\`.

### Registry de fichas
- Arquivo: \`raiz_data_engine/reports/core/kpi_registry/kpis_ouro_fichas.yaml\`
- Mtime: $REGISTRY_MTIME
- KPI IDs declarados: **$KPI_COUNT**
- Prefixos ativos: \`$KPI_BLOCKS\`
- ⚠️ Yaml pode estar atrás do banco — sempre cross-check com Alembic head.

### Views \`ouro.*\` detectadas
$OURO_VIEWS

### Painéis ativos em \`raiz_data_engine/reports/\`
$PANELS

### Docs recentes (top 3 por mtime)
$(printf "$RECENT_DOCS")
<!-- AUTO-REFRESH END -->
EOF
)

# Substituir bloco existente
python3 - "$MEM" "$BLOCK" <<'PYEOF'
import re, sys, pathlib

mem_path = pathlib.Path(sys.argv[1])
new_block = sys.argv[2]

content = mem_path.read_text()
pattern = re.compile(
    r"<!-- AUTO-REFRESH BEGIN.*?<!-- AUTO-REFRESH END -->",
    re.DOTALL,
)

if pattern.search(content):
    new_content = pattern.sub(new_block, content)
else:
    new_content = content.rstrip() + "\n\n" + new_block + "\n"

mem_path.write_text(new_content)
PYEOF

exit 0
