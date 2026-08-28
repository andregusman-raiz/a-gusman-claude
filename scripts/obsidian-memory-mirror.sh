#!/usr/bin/env bash
# Enrich Obsidian view of memory system with backlinks to active projects.
# Memory files live in ~/.claude/.../memory/ (symlinked as 30-Memory in vault).
# This script creates a sidecar index at 30-Memory-Index.md inside the vault root,
# WITHOUT modifying the original memory files (they're authoritative).
#
# Triggered by SessionStart hook. Idempotent.

set -euo pipefail

VAULT="$HOME/Claude/claude_obsidian"
MEMORY_DIR="$HOME/.claude/projects/-Users-andregusmandeoliveira-Claude/memory"
INDEX="$VAULT/30-Memory-Index.md"

if [[ ! -d "$MEMORY_DIR" ]]; then
  exit 0
fi

# Active project slugs — auto-descobertos a partir de 20-Projects/
# (arquivos .md sao slug.md; subdirs sao tratados como slug)
PROJECTS_DIR="$VAULT/20-Projects"
PROJECTS=()
if [[ -d "$PROJECTS_DIR" ]]; then
  while IFS= read -r entry; do
    base=$(basename "$entry")
    # Pular hidden, README, e arquivos especiais
    case "$base" in
      .*|README.md|index.md) continue ;;
    esac
    # Remover .md se for arquivo
    slug="${base%.md}"
    PROJECTS+=("$slug")
  done < <(find "$PROJECTS_DIR" -maxdepth 1 -mindepth 1 \( -name "*.md" -o -type d \) | sort -u)
fi
# Fallback se vazio
if [[ ${#PROJECTS[@]} -eq 0 ]]; then
  PROJECTS=(jusraiz raiz-data-engine raiz-platform salarios-platform financas-pessoais)
fi

{
  cat <<EOF
---
type: index
date: $(date +%Y-%m-%d)
tags: [meta, memory, index]
status: active
source: obsidian-memory-mirror
---

# Memory Index — Backlinks por Projeto

> Auto-gerado por \`~/.claude/scripts/obsidian-memory-mirror.sh\` no SessionStart.
> Memory files originais em \`[[30-Memory]]\` (symlink, nao editar pelo vault).

## Por tipo

EOF

  for type in user feedback project reference; do
    echo "### $type"
    echo ""
    find "$MEMORY_DIR" -maxdepth 1 -name "${type}_*.md" -type f 2>/dev/null | sort | while read -r f; do
      base=$(basename "$f" .md)
      echo "- [[30-Memory/$base|$base]]"
    done
    echo ""
  done

  echo "## Por projeto ativo"
  echo ""
  for proj in "${PROJECTS[@]}"; do
    echo "### [[20-Projects/$proj|$proj]]"
    echo ""
    matches=$(grep -l -i "$proj" "$MEMORY_DIR"/*.md 2>/dev/null || true)
    if [[ -z "$matches" ]]; then
      echo "_(nenhuma memoria menciona)_"
    else
      echo "$matches" | while read -r f; do
        base=$(basename "$f" .md)
        echo "- [[30-Memory/$base|$base]]"
      done
    fi
    echo ""
  done
} > "$INDEX"

exit 0
