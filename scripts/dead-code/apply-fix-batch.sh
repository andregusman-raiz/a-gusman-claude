#!/usr/bin/env bash
# apply-fix-batch.sh — Aplica fixes de dead code em batches com quality gates.
# Invocado por ag-aplicar-fix-codigo (sub-agent de ag-13-limpar-codigo).
#
# Usage:
#   ./apply-fix-batch.sh <project-path> <findings-json> <P> [batch-size]
#
# Onde P = P0|P1|P2|P3|P4|P5
# Batch size default: 5

set -euo pipefail

PROJECT_PATH="${1:?usage: apply-fix-batch.sh <project> <findings.json> <P>}"
FINDINGS_JSON="${2:?missing findings.json}"
P="${3:?missing P0/P1/...}"
BATCH_SIZE="${4:-5}"

cd "$PROJECT_PATH"

# Detectar package manager
if [ -f bun.lock ] || [ -f bun.lockb ]; then
  PM="bun"
  RUNNER="bunx"
else
  PM="npm"
  RUNNER="npx"
fi

PROGRESS_FILE="$PROJECT_PATH/dead-code-progress.md"

log() {
  local msg="$1"
  echo "[apply-fix-batch] $msg"
  echo "- $(date -u +%Y-%m-%dT%H:%M:%SZ) $msg" >> "$PROGRESS_FILE"
}

# Quality gate runner — retorna 0 se passa, 1 se falha
run_quality_gates() {
  local gate_failed=""
  log "Running quality gates..."

  if ! $PM run typecheck 2>&1 | tail -20; then
    gate_failed="typecheck"
  elif ! $PM run lint 2>&1 | tail -20; then
    gate_failed="lint"
  elif ! $PM run test 2>&1 | tail -20; then
    gate_failed="test"
  elif ! $PM run build 2>&1 | tail -20; then
    gate_failed="build"
  fi

  if [ -n "$gate_failed" ]; then
    log "GATE FAILED: $gate_failed"
    return 1
  fi
  log "GATES OK (typecheck + lint + test + build)"
  return 0
}

# Verificar branch — NUNCA aplicar em main
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" = "main" ] || [ "$current_branch" = "master" ]; then
  log "ERROR: cannot apply on main/master. Create feature branch first."
  exit 1
fi

# Capturar bundle baseline
BUNDLE_BEFORE=0
if [ -d .next/static ]; then
  BUNDLE_BEFORE=$(du -sb .next/static 2>/dev/null | awk '{print $1}')
elif [ -d dist ]; then
  BUNDLE_BEFORE=$(du -sb dist 2>/dev/null | awk '{print $1}')
fi

case "$P" in
  P0)
    log "P0 — Setup baseline (knip + config)"
    if ! grep -q '"knip"' package.json 2>/dev/null; then
      if [ "$PM" = "bun" ]; then
        bun add -d knip
      else
        npm install -D knip
      fi
    fi
    git add package.json knip.json 2>/dev/null || true
    [ -f bun.lock ] && git add bun.lock
    [ -f package-lock.json ] && git add package-lock.json
    git commit -m "chore(deadcode): setup knip baseline" || log "Nothing to commit"
    log "P0 done."
    ;;

  P1)
    log "P1 — Quick wins HIGH confidence"

    # Sub-step 1.1: Unused imports
    log "Applying eslint --fix for unused-imports..."
    $RUNNER eslint --ext .ts,.tsx,.js,.jsx --fix \
      --rule "unused-imports/no-unused-imports: error" . 2>&1 | tail -10 || true

    # Verificar mudancas
    if git diff --quiet; then
      log "No changes from eslint --fix (no unused imports detected or rule unavailable)"
    else
      git add -A
      git commit -m "chore(deadcode): remove unused imports via eslint --fix"
      log "Committed unused imports cleanup"
    fi

    # Sub-step 1.2: Unused exports — extrair findings HIGH categoria=unused-exports
    log "Processing HIGH confidence unused exports..."
    UNUSED_EXPORTS=$(jq -r '.findings[] | select(.category == "unused-exports" and .confidence == "HIGH") | "\(.file):\(.line):\(.name)"' "$FINDINGS_JSON" 2>/dev/null || echo "")
    if [ -n "$UNUSED_EXPORTS" ]; then
      log "Found unused exports — manual review required (sub-agent will iterate)"
      echo "$UNUSED_EXPORTS" > /tmp/unused-exports-list.txt
    fi

    # Quality gate
    if ! run_quality_gates; then
      log "Reverting last commit due to gate failure"
      git revert --no-edit HEAD
    fi
    ;;

  P2)
    log "P2 — Componentes nunca renderizados (MEDIUM, batch=$BATCH_SIZE)"
    ORPHAN_COMPS=$(jq -r '.findings[] | select(.category == "component-orphan") | "\(.file):\(.line):\(.name)"' "$FINDINGS_JSON" 2>/dev/null || echo "")
    if [ -z "$ORPHAN_COMPS" ]; then
      log "No orphan components found"
      exit 0
    fi
    echo "$ORPHAN_COMPS" > /tmp/orphan-components-list.txt
    log "Found $(wc -l < /tmp/orphan-components-list.txt) orphan components"
    log "Processing in batches of $BATCH_SIZE — sub-agent must read list and apply with approval"
    ;;

  P3)
    log "P3 — useState morto (LOW, requires per-item approval)"
    DEAD_STATE=$(jq -r '.findings[] | select(.category | startswith("dead-state")) | "\(.file):\(.line):\(.name):\(.category)"' "$FINDINGS_JSON" 2>/dev/null || echo "")
    if [ -z "$DEAD_STATE" ]; then
      log "No dead state findings"
      exit 0
    fi
    echo "$DEAD_STATE" > /tmp/dead-state-list.txt
    log "Found $(wc -l < /tmp/dead-state-list.txt) dead state cases — sub-agent prompts user per item"
    ;;

  P4)
    log "P4 — Comentarios sem WHY (review manual)"
    DEAD_COMMENTS=$(jq -r '.findings[] | select(.category == "dead-comment") | "\(.file):\(.line)"' "$FINDINGS_JSON" 2>/dev/null || echo "")
    echo "$DEAD_COMMENTS" > /tmp/dead-comments-list.txt
    log "Found $(wc -l < /tmp/dead-comments-list.txt) commented-out blocks"
    ;;

  P5)
    log "P5 — Hardening preventivo"
    log "5.1 — Knip CI (warning mode)"
    log "5.2 — eslint-plugin-unused-imports em pre-commit (lint-staged)"
    log "5.3 — ADR de politica de dead code"
    log "Sub-agent must wire these PRs (changes in .github/workflows or vercel.json + package.json)"
    ;;

  *)
    log "ERROR: unknown P: $P"
    exit 1
    ;;
esac

# Bundle delta (se aplicavel)
BUNDLE_AFTER=0
if [ -d .next/static ]; then
  BUNDLE_AFTER=$(du -sb .next/static 2>/dev/null | awk '{print $1}')
elif [ -d dist ]; then
  BUNDLE_AFTER=$(du -sb dist 2>/dev/null | awk '{print $1}')
fi
DELTA=$((BUNDLE_AFTER - BUNDLE_BEFORE))
log "Bundle delta: $DELTA bytes (before: $BUNDLE_BEFORE, after: $BUNDLE_AFTER)"

log "$P COMPLETE"
