#!/bin/bash
# bash-guards.sh — PreToolUse(Bash): bloqueia padroes CLI perigosos + protecao de branch.
# BLOCKING (exit 2). Le payload JSON do stdin (tool_input.command).
# Consolidado 2026-06-11: absorve branch-guard.sh (protecao main/master/develop).
# Bypass: BASH_GUARDS_DISABLED=1
# Compat macOS: usa grep -E (BSD nao tem -P).

set -uo pipefail
[ "${BASH_GUARDS_DISABLED:-0}" = "1" ] && exit 0

INPUT="$(cat)"
CMD="$(printf '%s' "$INPUT" | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin); print(d.get("tool_input",{}).get("command",""))
except Exception:
    print("")' 2>/dev/null)"
[ -z "$CMD" ] && exit 0

block() { echo "BLOCKED: $1" >&2; exit 2; }

# --- Operacoes destrutivas / bypass de pipeline ---
case "$CMD" in
  *"vercel --prod"*) block "Use CI/CD pipeline em vez de vercel --prod direto (rule deploy-routing)." ;;
esac
[[ "$CMD" == *"git push"* && ( "$CMD" == *"--force"* || "$CMD" == *" -f "* ) ]] && block "Force push e perigoso. Use --force-with-lease apenas com aprovacao explicita."
[[ "$CMD" == *"--no-verify"* ]] && block "--no-verify pula hooks de seguranca."
[[ "$CMD" == *"git rebase -i"* ]] && block "git rebase -i e interativo (nao suportado) e destrutivo. Use merge."
[[ "$CMD" == *"git checkout -- ."* || "$CMD" == *'git checkout -- *'* ]] && block "git checkout -- . descarta TODAS as mudancas unstaged. Commit primeiro."
[[ "$CMD" == *"git restore ."* ]] && block "git restore . descarta mudancas. Commit ou branch primeiro."
[[ "$CMD" == *"git clean -f"* ]] && block "git clean -f apaga permanentemente arquivos untracked."

# --- Protecao de branch (ex-branch-guard.sh) ---
if [[ "$CMD" == *"git commit"* ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  case "$BRANCH" in
    main|master|develop)
      # Excecao unica: commit inicial em repo sem historico (baseline)
      if git rev-parse HEAD >/dev/null 2>&1; then
        block "Commit em '$BRANCH' proibido. Crie feature branch: git checkout -b feat/nome"
      fi ;;
  esac
fi
# Push explicito para ref protegida (nao casa branches tipo feat/main-page)
if printf '%s' "$CMD" | grep -qE 'git push.*(origin|upstream)[[:space:]]+(main|master|develop)([[:space:]]|$|:)'; then
  block "Push direto em branch protegida. Use PR: gh pr create"
fi

# --- SQL Safety (TOTVS RM multi-tenant) ---
if printf '%s' "$CMD" | grep -qiE 'SELECT[[:space:]]+\*[[:space:]]+FROM[[:space:]]+(PFUNC|SMATRICULA|SMATRICPL|SHABILITACAOALUNO|PPESSOA|SPARCELA|FLAN)([^A-Z0-9_]|$)'; then
  block "SELECT * em tabela TOTVS grande (PFUNC tem 680 cols). Especifique colunas; consulte schema.json."
fi
if printf '%s' "$CMD" | grep -qiE 'FROM[[:space:]]+(PFUNC|SMATRICULA|SMATRICPL|SPARCELA|FLAN|SHABILITACAOALUNO|PFHSTAFT)([^A-Z0-9_]|$)' && \
   ! printf '%s' "$CMD" | grep -qi 'CODCOLIGADA'; then
  block "Query em tabela TOTVS multi-tenant sem filtro CODCOLIGADA. Adicione WHERE CODCOLIGADA = N."
fi

# --- Warning nao-bloqueante ---
if [[ "$CMD" == *"git stash"* && "$CMD" != *"git stash list"* && "$CMD" != *"git stash show"* && "$CMD" != *"git stash pop"* ]]; then
  echo "WARNING: git stash pode perder trabalho. Prefira WIP commit." >&2
fi

exit 0
