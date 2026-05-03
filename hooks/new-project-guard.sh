#!/usr/bin/env bash
# new-project-guard.sh — PreToolUse Bash hook
#
# Detecta comandos de SCAFFOLDING (criação de projeto) e injeta lembrete das
# regras Raiz antes de prosseguir. Não bloqueia cegamente — informa Claude para
# que ele faça scaffolding alinhado com a stack canônica.
#
# Triggers (apenas):
#   - npm create *, bun create *, npx create-*, pnpm create *
#   - git init em pasta vazia
#
# Comportamento:
#   - Detectou scaffolding → exit 2 com mensagem (Claude lê regras + repete comando alinhado)
#   - Não é scaffolding → exit 0 (passa direto)
#
# Bypass: STACK_GUARD_BYPASS=1

set -uo pipefail

[[ "${STACK_GUARD_BYPASS:-0}" == "1" ]] && exit 0

INPUT="$(cat)"
COMMAND="$(echo "$INPUT" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("command", d.get("command","")))' 2>/dev/null || echo "")"

[[ -z "$COMMAND" ]] && exit 0

# Patterns de scaffolding (criação de projeto novo)
SCAFFOLDING_PATTERNS=(
  '^npm create '
  '^bun create '
  '^npx create-'
  '^pnpm create '
  '^yarn create '
)

IS_SCAFFOLDING=0
for pattern in "${SCAFFOLDING_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    IS_SCAFFOLDING=1
    break
  fi
done

# Marker para evitar disparar duas vezes na mesma sessão
MARKER="/tmp/.claude-newproj-warned-$$"

if [[ $IS_SCAFFOLDING -eq 1 && ! -f "$MARKER" ]]; then
  touch "$MARKER"
  cat >&2 <<EOF
═══════════════════════════════════════════════════════════════════
  NEW-PROJECT GUARD: scaffolding detectado
═══════════════════════════════════════════════════════════════════
Comando: $COMMAND

Você está criando projeto novo. Antes de prosseguir, ALINHE com a
stack Raiz. Leia uma vez (carregando no contexto):

  Read ~/Claude/.claude/rules/stack-enforcement.md
  Read ~/Claude/.claude/rules/package-manager.md
  Read ~/Claude/assets/design-library/UI_UX/raiz-educacao-design-system.md

Decisões obrigatórias antes de scaffolding:
  ✓ Package manager: bun (preferido) ou npm — NUNCA pnpm/yarn
  ✓ Framework: Next.js (App Router) | Vite + React (SPA)
  ✓ Componentes: shadcn/ui (instalar após scaffolding)
  ✓ Ícones: lucide-react (NUNCA emojis em UI)
  ✓ Fontes: IBM Plex Sans + IBM Plex Mono (via next/font ou Google Fonts)
  ✓ Cores: paleta Raiz (#F7941D orange, #5BB5A2 teal) — NÃO Tailwind defaults
  ✓ Testes: Vitest + Playwright
  ✓ Monitoramento: Sentry SDK
  ✓ Auth (se aplicável): Supabase Auth | Clerk
  ✓ DB (se aplicável): Supabase | Neon

Se usuário pediu lib fora da whitelist (Turborepo, Prisma, MUI, etc.):
  → PERGUNTAR antes, criar ADR documentando trade-off, NÃO decidir sozinho.

Após ler as regras, REPETIR o comando (este hook só dispara 1x por sessão):
  $COMMAND

═══════════════════════════════════════════════════════════════════
EOF
  exit 2
fi

exit 0
