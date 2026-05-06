#!/usr/bin/env bash
# scan-orchestrator.sh — Orquestra Knip + ts-prune + depcheck + ESLint + Madge + bundle analyzer.
# Invocado por ag-escanear-morto-codigo (sub-agent de ag-13-limpar-codigo).
#
# Usage:
#   ./scan-orchestrator.sh <project-path> [--quick|--deep]
#
# Output: $PROJECT/dead-code-findings-raw.json (input para AST custom + ranking)

set -euo pipefail

PROJECT_PATH="${1:-$(pwd)}"
MODE="${2:---quick}"

cd "$PROJECT_PATH"

# Detectar package manager
if [ -f bun.lock ] || [ -f bun.lockb ]; then
  PM="bun"
  RUNNER="bunx"
else
  PM="npm"
  RUNNER="npx"
fi

# Detectar stack
STACK="unknown"
if [ -f next.config.js ] || [ -f next.config.ts ] || [ -f next.config.mjs ]; then
  STACK="next"
elif [ -f vite.config.js ] || [ -f vite.config.ts ]; then
  STACK="vite"
elif [ -f astro.config.mjs ]; then
  STACK="astro"
elif grep -q "@remix-run" package.json 2>/dev/null; then
  STACK="remix"
fi

echo "[scan-orchestrator] Project: $PROJECT_PATH"
echo "[scan-orchestrator] PM: $PM | Runner: $RUNNER | Stack: $STACK | Mode: $MODE"

# Garantir Knip instalado
if ! grep -q '"knip"' package.json 2>/dev/null; then
  echo "[scan-orchestrator] Installing knip..."
  if [ "$PM" = "bun" ]; then
    bun add -d knip
  else
    npm install -D knip
  fi
fi

# Gerar knip.json conservador se nao existir
if [ ! -f knip.json ] && [ ! -f knip.ts ] && [ ! -f knip.config.ts ]; then
  cat > knip.json <<'EOF'
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "app/**/page.tsx",
    "app/**/page.ts",
    "app/**/layout.tsx",
    "app/**/route.ts",
    "app/**/error.tsx",
    "app/**/not-found.tsx",
    "app/**/loading.tsx",
    "app/**/template.tsx",
    "app/**/default.tsx",
    "middleware.ts",
    "middleware.tsx",
    "instrumentation.ts",
    "next.config.{js,ts,mjs,cjs}",
    "vite.config.{js,ts}",
    "astro.config.{js,ts,mjs}",
    "src/index.{ts,tsx,js,jsx}",
    "src/main.{ts,tsx,js,jsx}",
    "scripts/**/*.{ts,js}"
  ],
  "ignore": [
    "**/*.test.{ts,tsx,js,jsx}",
    "**/*.spec.{ts,tsx,js,jsx}",
    "**/__tests__/**",
    "**/__fixtures__/**",
    "**/__mocks__/**",
    "**/*.stories.{ts,tsx,js,jsx,mdx}",
    "**/*.generated.{ts,tsx}",
    "**/__generated__/**",
    "**/codegen/**",
    "prisma/client/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**"
  ],
  "ignoreDependencies": [
    "@types/*"
  ],
  "ignoreExportsUsedInFile": true
}
EOF
  echo "[scan-orchestrator] Created conservative knip.json"
fi

OUTPUT_DIR="${PROJECT_PATH}/.deadcode-scan"
mkdir -p "$OUTPUT_DIR"

# Função helper para rodar tool com timeout e capturar erro silenciosamente
run_tool() {
  local name=$1
  local cmd=$2
  local output=$3
  echo "[scan-orchestrator] Running $name..."
  if timeout 180 bash -c "$cmd" > "$output" 2>"$output.err"; then
    echo "[scan-orchestrator] $name: OK"
  else
    echo "[scan-orchestrator] $name: WARN (exit=$?, see $output.err)"
  fi
}

# Step 1 — Tools paralelos
run_tool "knip" \
  "$RUNNER knip --reporter json" \
  "$OUTPUT_DIR/knip.json" &

run_tool "ts-prune" \
  "$RUNNER ts-prune 2>&1 | tail -n +2" \
  "$OUTPUT_DIR/tsprune.txt" &

run_tool "depcheck" \
  "$RUNNER depcheck --json" \
  "$OUTPUT_DIR/depcheck.json" &

run_tool "eslint" \
  "$RUNNER eslint --ext .ts,.tsx,.js,.jsx --no-fix --format json . 2>/dev/null || true" \
  "$OUTPUT_DIR/eslint.json" &

run_tool "madge-orphans" \
  "$RUNNER madge --orphans --json src 2>/dev/null || $RUNNER madge --orphans --json app 2>/dev/null || echo '[]'" \
  "$OUTPUT_DIR/madge-orphans.json" &

wait

# Step 2 — Bundle analyzer (so se --deep)
if [ "$MODE" = "--deep" ]; then
  echo "[scan-orchestrator] Building for bundle analysis..."
  if [ "$PM" = "bun" ]; then
    bun run build > "$OUTPUT_DIR/build.log" 2>&1 || echo "[scan-orchestrator] Build failed, skipping bundle analysis"
  else
    npm run build > "$OUTPUT_DIR/build.log" 2>&1 || echo "[scan-orchestrator] Build failed, skipping bundle analysis"
  fi

  if [ -d .next/static/chunks ]; then
    find .next/static/chunks -name "*.js" -exec basename {} \; | sort -u > "$OUTPUT_DIR/bundle-chunks.txt"
    BUNDLE_SIZE=$(du -sb .next/static 2>/dev/null | awk '{print $1}')
    echo "{\"bundle_size_bytes\": $BUNDLE_SIZE}" > "$OUTPUT_DIR/bundle-meta.json"
  elif [ -d dist ]; then
    find dist -name "*.js" -exec basename {} \; | sort -u > "$OUTPUT_DIR/bundle-chunks.txt"
    BUNDLE_SIZE=$(du -sb dist 2>/dev/null | awk '{print $1}')
    echo "{\"bundle_size_bytes\": $BUNDLE_SIZE}" > "$OUTPUT_DIR/bundle-meta.json"
  fi
fi

# Step 3 — Capturar git churn (ultimos 12 meses por arquivo)
echo "[scan-orchestrator] Capturing git churn..."
git log --since="12 months ago" --name-only --pretty=format: 2>/dev/null \
  | sort | uniq -c | sort -rn \
  | awk '{print "{\"file\":\""$2"\",\"commits_12m\":"$1"}"}' \
  | jq -s '.' > "$OUTPUT_DIR/git-churn.json" 2>/dev/null || echo "[]" > "$OUTPUT_DIR/git-churn.json"

# Step 4 — Coverage (se houver)
if [ -f coverage/coverage-summary.json ]; then
  cp coverage/coverage-summary.json "$OUTPUT_DIR/coverage-summary.json"
fi

# Step 5 — Metadata final
cat > "$OUTPUT_DIR/scan-metadata.json" <<EOF
{
  "project": "$PROJECT_PATH",
  "stack": "$STACK",
  "package_manager": "$PM",
  "scan_started": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "mode": "$MODE",
  "tools_run": ["knip", "ts-prune", "depcheck", "eslint", "madge", $([ "$MODE" = "--deep" ] && echo "\"bundle-analyzer\"" || echo "")]
}
EOF

echo ""
echo "[scan-orchestrator] DONE. Raw outputs in $OUTPUT_DIR/"
echo "[scan-orchestrator] Next: run ast-custom-scan.ts to enrich findings"
echo "[scan-orchestrator] Then: ag-escanear-morto-codigo unifies into dead-code-findings.json"
