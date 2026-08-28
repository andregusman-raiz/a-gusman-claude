#!/bin/bash
# =============================================================================
# workspace-hygiene-guard.sh — PreToolUse(Write): mantém o ROOT do ~/Claude limpo.
# BLOCKING (exit 2). Só atua em escrita DIRETA no root do workspace (não em repos).
# Regra: root só aceita config; docs->docs/, imagens->artefatos/, dados->dados/.
# Bypass: WORKSPACE_HYGIENE_DISABLED=1
# =============================================================================

[ "${WORKSPACE_HYGIENE_DISABLED:-0}" = "1" ] && exit 0

WORKSPACE="$HOME/Claude"

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//;s/"$//')
[ -z "$FILE_PATH" ] && exit 0

# Só interessa escrita DIRETA no root do workspace (dirname == WORKSPACE).
DIR=$(dirname "$FILE_PATH")
[ "$DIR" != "$WORKSPACE" ] && exit 0

BASENAME=$(basename "$FILE_PATH")

# Allowlist de config legítima no root.
case "$BASENAME" in
  CLAUDE.md|AGENTS.md|README.md|CHANGELOG.md|LICENSE) exit 0 ;;
  package.json|package-lock.json|bun.lock|yarn.lock|pnpm-lock.yaml) exit 0 ;;
  tsconfig.json|tsconfig.*.json|.npmrc|.nvmrc|.gitignore|.gitattributes) exit 0 ;;
  .env|.env.*|.mcp.json|.prettierrc*|.eslintrc*|.editorconfig|.DS_Store) exit 0 ;;
  *.pem|*.key|*.crt) exit 0 ;;
esac

# Qualquer outra coisa solta no root é bloqueada com destino sugerido.
case "$BASENAME" in
  *.png|*.jpg|*.jpeg|*.gif|*.webp|*.svg) DEST="artefatos/screenshots/" ;;
  *.csv|*.tsv|*.xlsx|*.parquet|*.json) DEST="dados/  (ou docs/ se for doc)" ;;
  *.md|*.pdf|*.docx|*.pptx) DEST="docs/workspace/  (ou docs/<sub>/)" ;;
  *) DEST="docs/ , dados/ , artefatos/  ou dentro de um repo" ;;
esac

echo "BLOCKED: nada solto no root do workspace (~/Claude)." >&2
echo "Arquivo: $BASENAME -> salve em: $DEST" >&2
echo "Regra: .claude/rules/workspace-layout.md | Bypass: WORKSPACE_HYGIENE_DISABLED=1" >&2
exit 2
