#!/usr/bin/env bash
set -euo pipefail

HOME_DIR="${HOME:-/Users/andregusmandeoliveira}"
WORKSPACE="${WORKSPACE:-$HOME_DIR/Claude}"
CODEX_ALIAS="$HOME_DIR/Codex"
LOCAL_CODEX="$WORKSPACE/.Codex"
GLOBAL_CODEX="$HOME_DIR/.Codex"

failures=0

ok() {
  printf 'OK %s\n' "$1"
}

fail() {
  printf 'MISSING %s\n' "$1" >&2
  failures=$((failures + 1))
}

check_exists() {
  local path="$1"
  if [ -e "$path" ]; then
    ok "$path"
  else
    fail "$path"
  fi
}

check_symlink_target() {
  local path="$1"
  local expected="$2"
  if [ ! -L "$path" ]; then
    fail "$path -> $expected"
    return
  fi

  local actual
  actual="$(readlink "$path")"
  if [ "$actual" = "$expected" ]; then
    ok "$path -> $expected"
  else
    printf 'WRONG %s -> %s (expected %s)\n' "$path" "$actual" "$expected" >&2
    failures=$((failures + 1))
  fi
}

check_count_equal() {
  local left="$1"
  local right="$2"
  local pattern="$3"
  local left_count right_count
  left_count="$(find "$left" -maxdepth 2 -name "$pattern" 2>/dev/null | wc -l | tr -d ' ')"
  right_count="$(find "$right" -maxdepth 2 -name "$pattern" 2>/dev/null | wc -l | tr -d ' ')"

  if [ "$left_count" = "$right_count" ]; then
    ok "$left has $left_count $pattern files matching $right"
  else
    printf 'COUNT-MISMATCH %s=%s %s=%s for %s\n' "$left" "$left_count" "$right" "$right_count" "$pattern" >&2
    failures=$((failures + 1))
  fi
}

check_symlink_target "$CODEX_ALIAS" "$WORKSPACE"

check_symlink_target "$LOCAL_CODEX/rules" "../.claude/rules"
check_symlink_target "$LOCAL_CODEX/shared" "../.claude/shared"
check_symlink_target "$LOCAL_CODEX/skills" "../.agents/skills"
check_symlink_target "$LOCAL_CODEX/Playbooks" "../.claude/Playbooks"
check_symlink_target "$LOCAL_CODEX/mcp" "../.claude/mcp"

check_exists "$LOCAL_CODEX/scripts/repo-health.sh"
check_exists "$LOCAL_CODEX/scripts/Codex-locks-status.sh"
check_exists "$LOCAL_CODEX/scripts/skill-catalog.sh"

check_exists "$GLOBAL_CODEX/shared/templates/project-init/Codex.template.md"
check_exists "$GLOBAL_CODEX/shared/templates/project-init/.env.template"
check_exists "$GLOBAL_CODEX/shared/templates/project-init/tsconfig.template.json"
check_exists "$GLOBAL_CODEX/scripts/repo-health.sh"
check_exists "$GLOBAL_CODEX/scripts/Codex-locks-status.sh"
check_exists "$GLOBAL_CODEX/skills/ag-1-construir/SKILL.md"
check_exists "$GLOBAL_CODEX/skills/xlsx/scripts/recalc.py"

check_count_equal "$WORKSPACE/.claude/skills" "$WORKSPACE/.agents/skills" "SKILL.md"

if [ "$failures" -gt 0 ]; then
  printf 'Dual-mode bridge check failed: %s issue(s).\n' "$failures" >&2
  exit 1
fi

printf 'Dual-mode bridge check passed.\n'
