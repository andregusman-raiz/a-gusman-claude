#!/bin/bash
# sync.sh — Propaga templates .shared/ para projetos
# Uso: bash ~/.claude/shared/sync.sh [projeto1] [projeto2] ...
# Sem argumentos: sincroniza todos os projetos conhecidos

set -euo pipefail

SHARED_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE="${SHARED_DIR%/.shared}"

# Projetos conhecidos (adicionar novos aqui)
DEFAULT_PROJECTS=(
  "$WORKSPACE/GitHub/raiz-platform"
  "$WORKSPACE/GitHub/rAIz-AI-Prof"
)

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Determinar projetos alvo
if [ $# -gt 0 ]; then
  PROJECTS=("$@")
else
  PROJECTS=("${DEFAULT_PROJECTS[@]}")
fi

# Funcao: copiar arquivo se destino nao existe ou e identico ao template anterior
sync_file() {
  local src="$1"
  local dst="$2"
  local filename
  filename=$(basename "$src")

  if [ ! -f "$dst" ]; then
    # Destino nao existe — copiar
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    log_ok "Criado: $dst"
  elif diff -q "$src" "$dst" > /dev/null 2>&1; then
    # Identico — nada a fazer
    : # silencioso
  else
    # Diferente — nao sobrescrever (customizacao local)
    log_warn "Divergente (nao sobrescrito): $dst"
    log_warn "  Compare: diff '$src' '$dst'"
  fi
}

# Funcao: sincronizar diretorio
sync_dir() {
  local src_dir="$1"
  local dst_dir="$2"
  local label="$3"

  if [ ! -d "$src_dir" ]; then
    return
  fi

  log_info "Sincronizando $label..."

  find "$src_dir" -type f | while read -r src_file; do
    local rel_path="${src_file#$src_dir/}"
    sync_file "$src_file" "$dst_dir/$rel_path"
  done
}

echo ""
echo "============================================"
echo "  .shared/ Sync — Templates & Patterns"
echo "============================================"
echo ""

for project in "${PROJECTS[@]}"; do
  if [ ! -d "$project" ]; then
    log_error "Projeto nao encontrado: $project"
    continue
  fi

  project_name=$(basename "$project")
  echo ""
  log_info "=== Projeto: $project_name ==="

  # 1. Roadmap templates → roadmap/templates/
  sync_dir \
    "$SHARED_DIR/templates/roadmap" \
    "$project/roadmap/templates" \
    "roadmap templates"

  # 2. CI workflows → .github/workflows/ (APENAS se nao existem)
  if [ -d "$SHARED_DIR/templates/ci-workflows" ]; then
    log_info "Sincronizando CI workflows..."
    for src_file in "$SHARED_DIR/templates/ci-workflows"/*.yml; do
      [ -f "$src_file" ] || continue
      filename=$(basename "$src_file")
      dst_file="$project/.github/workflows/$filename"

      if [ ! -f "$dst_file" ]; then
        mkdir -p "$project/.github/workflows"
        cp "$src_file" "$dst_file"
        log_ok "Criado workflow: $filename"
      else
        # CI workflows ja existem — NUNCA sobrescrever
        : # silencioso
      fi
    done
  fi

  # 3. E2E templates → tests/e2e/shared/ (ou test/e2e/shared/)
  if [ -d "$project/tests/e2e" ]; then
    sync_dir "$SHARED_DIR/templates/e2e" "$project/tests/e2e/shared" "E2E templates"
  elif [ -d "$project/test/e2e" ]; then
    sync_dir "$SHARED_DIR/templates/e2e" "$project/test/e2e/shared" "E2E templates"
  fi

  # 4. Database templates → supabase/templates/ (se Supabase existe)
  if [ -d "$project/supabase" ]; then
    sync_dir "$SHARED_DIR/templates/database" "$project/supabase/templates" "database templates"
  fi

  # 5. Service templates → src/lib/templates/ (se src/lib existe)
  if [ -d "$project/src/lib" ]; then
    sync_dir "$SHARED_DIR/templates/service" "$project/src/lib/templates" "service templates"
  fi

  # 6. Component templates → src/components/templates/ (se src/components existe)
  if [ -d "$project/src/components" ]; then
    sync_dir "$SHARED_DIR/templates/component" "$project/src/components/templates" "component templates"
  fi

  # 7. Security templates → src/lib/security/templates/ (se src/lib existe)
  if [ -d "$project/src/lib" ]; then
    sync_dir "$SHARED_DIR/templates/security" "$project/src/lib/security/templates" "security templates"
  fi

  # 8. Monitoring templates → src/lib/monitoring/templates/ (se src/lib existe)
  if [ -d "$project/src/lib" ]; then
    sync_dir "$SHARED_DIR/templates/monitoring" "$project/src/lib/monitoring/templates" "monitoring templates"
  fi

  # 9. Script templates → scripts/templates/ (se scripts/ existe)
  if [ -d "$project/scripts" ]; then
    sync_dir "$SHARED_DIR/templates/scripts" "$project/scripts/templates" "script templates"
  fi

  # 10. UX-QAT templates → ux-qat/ (tipos, rubrics, config, cenario templates)
  if [ -d "$SHARED_DIR/templates/ux-qat" ]; then
    sync_dir "$SHARED_DIR/templates/ux-qat/types" "$project/ux-qat/types" "UX-QAT types"
    sync_dir "$SHARED_DIR/templates/ux-qat/config" "$project/ux-qat/config" "UX-QAT config"
    sync_dir "$SHARED_DIR/templates/ux-qat/rubrics" "$project/ux-qat/rubrics" "UX-QAT rubrics"
    sync_dir "$SHARED_DIR/templates/ux-qat/scenarios/_template" "$project/ux-qat/scenarios/_template" "UX-QAT scenario templates"
    sync_dir "$SHARED_DIR/templates/ux-qat/runtime" "$project/ux-qat/runtime" "UX-QAT runtime engine"
  fi

  log_ok "Projeto $project_name sincronizado."
done

echo ""
echo "============================================"
echo "  Sync completo."
echo ""
echo "  Patterns (referencia, nao copiados):"
echo "  $SHARED_DIR/patterns/"
echo ""
echo "  Gotchas (referencia):"
echo "  $SHARED_DIR/gotchas/"
echo "============================================"
