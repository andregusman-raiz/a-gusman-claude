#!/usr/bin/env bash
# session-retro-check.sh — Sugere /ag-retrospectiva quando sessão acumulou trabalho significativo
#
# Heurística: se a sessão atual tem >= THRESHOLD machines invocadas OU >= N PRs criados,
# sugere ao usuário rodar /ag-retrospectiva + /ag-insights para destilar aprendizados.
#
# Uso:
#   bash ~/Claude/.claude/scripts/session-retro-check.sh
#   bash ~/Claude/.claude/scripts/session-retro-check.sh --threshold 3   # mais agressivo
#   bash ~/Claude/.claude/scripts/session-retro-check.sh --quiet         # exit 0 se não sugere, 1 se sugere
#
# Sinais de "trabalho significativo" (qualquer um basta):
#   - >= 5 machines invocadas (count via grep no Claude history)
#   - >= 3 PRs criados via gh
#   - sessão > 4h (heurística por mtime do project state)

set -euo pipefail

THRESHOLD_MACHINES="${THRESHOLD_MACHINES:-5}"
THRESHOLD_PRS="${THRESHOLD_PRS:-3}"
QUIET=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --threshold) THRESHOLD_MACHINES="$2"; shift 2 ;;
    --threshold-prs) THRESHOLD_PRS="$2"; shift 2 ;;
    --quiet) QUIET=1; shift ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# //; s/^#//'
      exit 0
      ;;
    *) shift ;;
  esac
done

CLAUDE_HOME="$HOME/.claude"
HISTORY="$CLAUDE_HOME/history.jsonl"
PROJECTS_DIR="$CLAUDE_HOME/projects"

# Detecta sessão atual (mais recente)
LATEST_SESSION=""
if [[ -d "$PROJECTS_DIR" ]]; then
  LATEST_SESSION=$(find "$PROJECTS_DIR" -name "*.jsonl" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
fi

# Count machines invoked in current session
MACHINE_COUNT=0
if [[ -f "$LATEST_SESSION" ]]; then
  MACHINE_COUNT=$(grep -cE '"name":\s*"(ag-[0-9]+-|Skill)"' "$LATEST_SESSION" 2>/dev/null || echo "0")
fi

# Count PRs created today via gh (best-effort)
PR_COUNT=0
if command -v gh >/dev/null 2>&1; then
  PR_COUNT=$(gh pr list --author "@me" --state all --limit 50 --json createdAt -q "[.[] | select(.createdAt | startswith(\"$(date +%Y-%m-%d)\"))] | length" 2>/dev/null || echo "0")
fi

# Decision
SHOULD_SUGGEST=0
REASONS=()

if [[ "$MACHINE_COUNT" -ge "$THRESHOLD_MACHINES" ]]; then
  SHOULD_SUGGEST=1
  REASONS+=("$MACHINE_COUNT machines invocadas (limite: $THRESHOLD_MACHINES)")
fi

if [[ "$PR_COUNT" -ge "$THRESHOLD_PRS" ]]; then
  SHOULD_SUGGEST=1
  REASONS+=("$PR_COUNT PRs criados hoje (limite: $THRESHOLD_PRS)")
fi

# Output
if [[ $SHOULD_SUGGEST -eq 1 ]]; then
  if [[ $QUIET -eq 0 ]]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "  Sessão acumulou trabalho significativo:"
    for r in "${REASONS[@]}"; do
      echo "    • $r"
    done
    echo ""
    echo "  Sugestões para destilar aprendizados:"
    echo "    /ag-retrospectiva       — analisa decisões, falhas, tempo"
    echo "    /ag-insights --session  — métricas tokens, custo, trends"
    echo "    /ag-thinkback           — replay de pontos de inflexão"
    echo "═══════════════════════════════════════════════════════════════════"
  fi
  exit 1
else
  if [[ $QUIET -eq 0 ]]; then
    echo "Sessão modesta ($MACHINE_COUNT machines, $PR_COUNT PRs hoje) — sem sugestão de retrospectiva."
  fi
  exit 0
fi
