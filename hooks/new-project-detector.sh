#!/usr/bin/env bash
# new-project-detector.sh — SessionStart hook
#
# Detecta se sessão atual é em projeto NOVO ou SEM CLAUDE.md próprio.
# Se sim → injeta lembrete das regras Raiz (5 bullets) no contexto.
# Se não → silent (não polui projetos consolidados).
#
# Heurística de "projeto novo":
#   - cwd não é um repo git OU
#   - repo tem < 5 commits OU
#   - cwd não tem CLAUDE.md próprio (e não é o workspace ~/Claude) OU
#   - package.json criado nos últimos 7 dias
#
# Output (stdout): texto injetado no system prompt da sessão (Claude Code lê)
# Exit 0 sempre (hook informativo, não bloqueador)

set -uo pipefail

CWD="$(pwd)"

# Skip workspace raiz (~/Claude) — tem CLAUDE.md gigante já
[[ "$CWD" == "$HOME/Claude" ]] && exit 0

# Skip se não é diretório de trabalho típico
[[ "$CWD" == "$HOME" ]] && exit 0
[[ "$CWD" == "/" ]] && exit 0

is_new_project() {
  # Sem .git → novo
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    return 0
  fi
  # < 5 commits → novo
  local commits
  commits=$(git log --oneline 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$commits" -lt 5 ]]; then
    return 0
  fi
  # Sem CLAUDE.md próprio → trate como novo
  if [[ ! -f "CLAUDE.md" ]]; then
    return 0
  fi
  # package.json muito recente → novo
  if [[ -f "package.json" ]]; then
    local mtime now diff
    mtime=$(stat -f %m package.json 2>/dev/null || stat -c %Y package.json 2>/dev/null || echo 0)
    now=$(date +%s)
    diff=$((now - mtime))
    if [[ "$diff" -lt 604800 ]]; then  # 7 dias = 604800s
      return 0
    fi
  fi
  return 1
}

if is_new_project; then
  cat <<'EOF'

╔══════════════════════════════════════════════════════════════════╗
║ NEW-PROJECT-DETECTOR — projeto novo ou sem CLAUDE.md detectado   ║
╠══════════════════════════════════════════════════════════════════╣
║ Stack canônica Raiz (rules/stack-enforcement.md):                ║
║   ✓ bun (preferido) | npm | npx — NUNCA pnpm, yarn, turbo        ║
║   ✓ shadcn/ui para componentes — NUNCA MUI, Chakra               ║
║   ✓ lucide-react para ícones — NUNCA emojis em UI                ║
║   ✓ Tailwind + tokens Raiz (NÃO defaults indigo)                 ║
║   ✓ Fontes: IBM Plex Sans + IBM Plex Mono                        ║
║   ✓ Cores: #F7941D (orange) #5BB5A2 (teal)                       ║
║   ✓ Vitest + Playwright para testes                              ║
║   ✓ Sentry SDK para monitoramento                                ║
║                                                                  ║
║ Antes de criar UI/scaffolding, leia:                             ║
║   ~/Claude/.claude/rules/stack-enforcement.md                    ║
║   ~/Claude/assets/design-library/UI_UX/raiz-educacao-...md       ║
║                                                                  ║
║ Lib fora whitelist → ADR + aprovação. NÃO decidir sozinho.       ║
║ Bypass: export STACK_GUARD_BYPASS=1 (sessão)                     ║
╚══════════════════════════════════════════════════════════════════╝

EOF
fi

exit 0
