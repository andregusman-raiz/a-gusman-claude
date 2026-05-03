#!/usr/bin/env bash
# stack-deny-list.sh — PreToolUse Bash hook
#
# Bloqueia comandos de instalação de package managers / libs FORA da whitelist Raiz.
# Whitelist: bun (preferido), npm, npx, node, git, gh.
# Tudo mais (pnpm, turbo, yarn) requer ADR + bypass explícito.
#
# Filosofia anti-overthinking: APENAS o ato de "instalar lib não-whitelist" é bloqueado.
# `bun install`, `npm install <pkg-da-whitelist>`, edits em arquivos: passam direto.
#
# Bypass legítimo:
#   export STACK_GUARD_BYPASS=1     # bypass de sessão
#   ou criar ADR em docs/adr/ documentando decisão
#
# Exit codes:
#   0 = comando OK (passa)
#   2 = BLOCK (Claude vê mensagem e deve adaptar)

set -uo pipefail

# Bypass de sessão
[[ "${STACK_GUARD_BYPASS:-0}" == "1" ]] && exit 0

# Lê o comando do stdin (Claude Code envia JSON com tool_input)
INPUT="$(cat)"
COMMAND="$(echo "$INPUT" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("command", d.get("command","")))' 2>/dev/null || echo "")"

[[ -z "$COMMAND" ]] && exit 0

# Patterns bloqueados
BLOCK_PATTERNS=(
  '^pnpm install'
  '^pnpm add '
  '^pnpm i '
  '^pnpm create'
  ' pnpm install'
  ' pnpm add '
  '^npm install -g pnpm'
  '^npm install pnpm'
  '^npm i pnpm'
  '^npm install turbo'
  '^npm install -g turbo'
  '^npm install -D turbo'
  '^npx create-turbo'
  '^yarn add'
  '^yarn install'
)

for pattern in "${BLOCK_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    cat >&2 <<EOF
═══════════════════════════════════════════════════════════════════
  STACK GUARD: comando bloqueado
═══════════════════════════════════════════════════════════════════
Comando detectado: $COMMAND

Este comando instala lib FORA da whitelist Raiz.
Stack canônica (rules/stack-enforcement.md):
  ✓ bun (preferido), npm, npx, node, git, gh
  ✓ shadcn/ui, Lucide React, IBM Plex Sans, Tailwind
  ✗ pnpm, yarn, turbo, MUI, Chakra, Prisma (sem ADR)

Alternativas:
  • Para package management → bun install ou npm install
  • Para monorepo → bun workspaces (sem turbo)
  • Para criar projeto → bun create / npx create-next-app --use-bun

Se REALMENTE precisa desta lib:
  1. Criar ADR em docs/adr/ documentando trade-off
  2. Confirmar com o usuário (não decidir sozinho)
  3. export STACK_GUARD_BYPASS=1 (bypass desta sessão)

Referência: ~/Claude/.claude/rules/stack-enforcement.md
═══════════════════════════════════════════════════════════════════
EOF
    exit 2
  fi
done

exit 0
