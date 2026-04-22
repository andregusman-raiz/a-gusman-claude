#!/usr/bin/env bash
# validate-skills.sh — Validacao automatizada de skills
# Inspirado no skill-validator.js do BMAD-METHOD (32 regras)
# Uso: bash ~/.claude/scripts/validate-skills.sh [--fix] [--verbose]

set -uo pipefail

SKILLS_DIR="${HOME}/Claude/.claude/skills"
FIX_MODE=false
VERBOSE=false
ERRORS=0
WARNINGS=0
TOTAL=0

for arg in "$@"; do
  case "$arg" in
    --fix) FIX_MODE=true ;;
    --verbose) VERBOSE=true ;;
  esac
done

# Colors
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_error() { echo -e "${RED}ERROR${NC} [$1]: $2"; ((ERRORS++)); }
log_warn() { echo -e "${YELLOW}WARN${NC}  [$1]: $2"; ((WARNINGS++)); }
log_ok() { $VERBOSE && echo -e "${GREEN}OK${NC}    [$1]: $2" || true; }
log_info() { echo -e "${CYAN}INFO${NC}  $1"; }

echo "=== Skill Validator ==="
echo "Dir: ${SKILLS_DIR}"
echo ""

# ── RULE 1: Every skill dir has SKILL.md ──
for dir in "${SKILLS_DIR}"/*/; do
  skill_name=$(basename "$dir")
  ((TOTAL++))

  skill_file="${dir}SKILL.md"
  if [[ ! -f "$skill_file" ]]; then
    log_error "$skill_name" "Missing SKILL.md"
    continue
  fi

  # ── RULE 2: Frontmatter exists and has required fields ──
  if ! head -1 "$skill_file" | grep -q '^---'; then
    log_error "$skill_name" "Missing frontmatter (no --- header)"
    continue
  fi

  # Extract frontmatter
  frontmatter=$(sed -n '/^---$/,/^---$/p' "$skill_file" | head -20)

  # ── RULE 3: name field present ──
  if ! echo "$frontmatter" | grep -q '^name:'; then
    log_error "$skill_name" "Missing 'name' in frontmatter"
  else
    fm_name=$(echo "$frontmatter" | grep '^name:' | sed 's/name: *//' | tr -d '"')
    if [[ "$fm_name" != "$skill_name" ]]; then
      log_warn "$skill_name" "Frontmatter name '${fm_name}' != dir name '${skill_name}'"
    else
      log_ok "$skill_name" "name matches dir"
    fi
  fi

  # ── RULE 4: description field present and non-empty ──
  if ! echo "$frontmatter" | grep -q '^description:'; then
    log_error "$skill_name" "Missing 'description' in frontmatter"
  else
    desc=$(echo "$frontmatter" | grep '^description:' | sed 's/description: *//' | tr -d '"')
    if [[ ${#desc} -lt 10 ]]; then
      log_warn "$skill_name" "Description too short (${#desc} chars, min 10)"
    else
      log_ok "$skill_name" "description present (${#desc} chars)"
    fi
  fi

  # ── RULE 5: model field present ──
  if ! echo "$frontmatter" | grep -q '^model:'; then
    log_warn "$skill_name" "Missing 'model' field (will use session default)"
  else
    model=$(echo "$frontmatter" | grep '^model:' | awk '{print $2}')
    case "$model" in
      opus|sonnet|haiku) log_ok "$skill_name" "model: $model" ;;
      *) log_warn "$skill_name" "Unknown model '$model' (expected: opus/sonnet/haiku)" ;;
    esac
  fi

  # ── RULE 6: No hardcoded paths with /Users/ ──
  if grep -q '/Users/' "$skill_file" 2>/dev/null; then
    hardcoded=$(grep -c '/Users/' "$skill_file")
    # Allow ~/Claude references (they're relative-ish)
    real_hardcoded=$(grep '/Users/' "$skill_file" | grep -cv '~/Claude' || true)
    if [[ $real_hardcoded -gt 0 ]]; then
      log_warn "$skill_name" "Found ${real_hardcoded} hardcoded /Users/ paths (use ~/Claude instead)"
    fi
  fi

  # ── RULE 7: No duplicate skills (same description) ──
  # Collected below in batch

  # ── RULE 8: References to other skills/agents exist ──
  refs=$(grep -oE 'ag-[a-z0-9-]+' "$skill_file" 2>/dev/null | sort -u || true)
  for ref in $refs; do
    if [[ "$ref" != "$skill_name" ]] && [[ ! -d "${SKILLS_DIR}/${ref}" ]]; then
      # Check if it's a subagent_type reference (may not be a skill dir)
      if ! grep -rq "subagent_type.*${ref}" "${SKILLS_DIR}" 2>/dev/null; then
        log_warn "$skill_name" "References '${ref}' but no skill dir found"
      fi
    fi
  done

  # ── RULE 9: disable-model-invocation consistency ──
  if echo "$frontmatter" | grep -q 'disable-model-invocation: true'; then
    if ! grep -q 'Agent tool' "$skill_file" 2>/dev/null; then
      log_warn "$skill_name" "disable-model-invocation=true but no Agent tool invocation pattern found"
    fi
  fi

  # ── RULE 10: argument-hint present ──
  if ! echo "$frontmatter" | grep -q 'argument-hint:'; then
    log_warn "$skill_name" "Missing 'argument-hint' (helps user know what to pass)"
  fi

  # ── RULE 11: File size sanity ──
  file_size=$(wc -c < "$skill_file")
  if [[ $file_size -lt 100 ]]; then
    log_warn "$skill_name" "SKILL.md suspiciously small (${file_size} bytes)"
  elif [[ $file_size -gt 20000 ]]; then
    log_warn "$skill_name" "SKILL.md very large (${file_size} bytes) — consider splitting"
  fi

  # ── RULE 12: Has invocation section ──
  if ! grep -qi 'invoca' "$skill_file" 2>/dev/null && ! grep -qi 'usage' "$skill_file" 2>/dev/null; then
    log_warn "$skill_name" "No Invocation/Usage section found"
  fi

done

# ── RULE 7 (batch): Duplicate detection by description similarity ──
log_info "Checking for potential duplicates..."
# Use temp file for compat with bash 3.2 (no associative arrays)
TMPDUPES=$(mktemp)
trap "rm -f $TMPDUPES" EXIT
for dir in "${SKILLS_DIR}"/*/; do
  skill_name=$(basename "$dir")
  skill_file="${dir}SKILL.md"
  [[ ! -f "$skill_file" ]] && continue

  desc=$(sed -n '/^---$/,/^---$/p' "$skill_file" | grep '^description:' | sed 's/description: *//' | tr -d '"' | cut -c1-50)
  [[ -z "$desc" ]] && continue

  existing=$(grep "^${desc}	" "$TMPDUPES" 2>/dev/null | cut -f2)
  if [[ -n "$existing" ]]; then
    log_warn "$skill_name" "Similar description to '${existing}' — potential duplicate?"
  else
    printf '%s\t%s\n' "$desc" "$skill_name" >> "$TMPDUPES"
  fi
done

# ── Summary ──
echo ""
echo "=== Summary ==="
echo -e "Skills scanned: ${CYAN}${TOTAL}${NC}"
echo -e "Errors:         ${RED}${ERRORS}${NC}"
echo -e "Warnings:       ${YELLOW}${WARNINGS}${NC}"

if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
  echo -e "${GREEN}All skills valid!${NC}"
  exit 0
elif [[ $ERRORS -eq 0 ]]; then
  echo -e "${YELLOW}Warnings only — skills functional but could improve${NC}"
  exit 0
else
  echo -e "${RED}Errors found — some skills may not work correctly${NC}"
  exit 1
fi
