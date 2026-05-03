#!/usr/bin/env bash
# skill-catalog.sh — Discovery dinâmico de skills locais
#
# Output: tabela markdown com todas as skills em ~/Claude/.claude/skills/
# Lê o frontmatter YAML de cada SKILL.md e gera catálogo navegável.
#
# Uso:
#   bash ~/Claude/.claude/scripts/skill-catalog.sh           # tabela markdown
#   bash ~/Claude/.claude/scripts/skill-catalog.sh --json    # output JSON
#   bash ~/Claude/.claude/scripts/skill-catalog.sh --filter ag-1   # só skills que começam com ag-1
#
# Use ag-0-orquestrador para descobrir skills novas sem precisar editar SKILL.md.

set -euo pipefail

SKILLS_DIR="${SKILLS_DIR:-$HOME/Claude/.claude/skills}"
OUTPUT="${1:-markdown}"
FILTER=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --json)    OUTPUT="json"; shift ;;
    --markdown) OUTPUT="markdown"; shift ;;
    --filter)  FILTER="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# //; s/^#//'
      exit 0
      ;;
    *) shift ;;
  esac
done

if [[ ! -d "$SKILLS_DIR" ]]; then
  echo "ERROR: skills dir not found: $SKILLS_DIR" >&2
  exit 1
fi

# Extract frontmatter field from a SKILL.md
extract_field() {
  local file="$1"
  local field="$2"
  awk -v field="$field" '
    /^---$/ { count++; if (count > 2) exit; next }
    count == 1 && $0 ~ "^"field":" {
      sub("^"field": *", "")
      gsub(/^"|"$/, "")
      print
      exit
    }
  ' "$file"
}

# Collect skills
declare -a skills=()
for skill_dir in "$SKILLS_DIR"/*/; do
  skill_md="$skill_dir/SKILL.md"
  [[ -f "$skill_md" ]] || continue
  name="$(basename "$skill_dir")"
  [[ -n "$FILTER" && ! "$name" =~ $FILTER ]] && continue
  skills+=("$name")
done

# Output
if [[ "$OUTPUT" == "json" ]]; then
  echo "["
  first=1
  for name in "${skills[@]}"; do
    skill_md="$SKILLS_DIR/$name/SKILL.md"
    desc="$(extract_field "$skill_md" "description" | head -c 200)"
    model="$(extract_field "$skill_md" "model")"
    disabled="$(extract_field "$skill_md" "disable-model-invocation")"
    invocable="true"
    [[ "$disabled" == "true" ]] && invocable="false"
    [[ $first -eq 0 ]] && echo ","
    first=0
    printf '  {"name": "%s", "description": "%s", "model": "%s", "model_invocable": %s}' \
      "$name" "${desc//\"/\\\"}" "$model" "$invocable"
  done
  echo ""
  echo "]"
else
  echo "# Skill Catalog ($(echo "${#skills[@]}") skills disponíveis)"
  echo ""
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Source: $SKILLS_DIR"
  echo ""
  echo "| Skill | Model | Invocável | Description |"
  echo "|---|---|---|---|"
  for name in "${skills[@]}"; do
    skill_md="$SKILLS_DIR/$name/SKILL.md"
    desc="$(extract_field "$skill_md" "description" | head -c 120)"
    model="$(extract_field "$skill_md" "model")"
    [[ -z "$model" ]] && model="(default)"
    disabled="$(extract_field "$skill_md" "disable-model-invocation")"
    invocable="✓"
    [[ "$disabled" == "true" ]] && invocable="✗ (manual)"
    printf "| \`%s\` | %s | %s | %s |\n" "$name" "$model" "$invocable" "$desc"
  done
fi
