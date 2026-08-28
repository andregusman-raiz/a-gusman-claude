#!/usr/bin/env bash
# gha-guard.sh
# PreToolUse Write/Edit/MultiEdit hook: bloqueia criar/editar .github/workflows/*.yml
# sem header de justificativa (JUSTIFICATIVA-GHA + ALTERNATIVA-DESCARTADA).
#
# Regra completa: ~/Claude/.claude/rules/gha-minimal.md
# Whitelist (W1-W4):
#   W1 — Acesso a recurso legado de IP fixo / VPN (TOTVS MSSQL/ODBC/SOAP)
#   W2 — Build/release de binario multi-plataforma
#   W3 — Deploy em VPS self-hosted
#   W4 — PR gate DB-first (psql + dbt + migrations)
#
# Bypass:
#   GHA_GUARD_DISABLED=1
#
# Exit codes:
#   0 = permitido (silencioso)
#   2 = bloqueado (mensagem para o modelo via stderr)

set -uo pipefail

# Bypass explicito
if [ "${GHA_GUARD_DISABLED:-0}" = "1" ]; then
  exit 0
fi

# Ler payload do stdin
PAYLOAD="$(cat)"

# Extrair tool_name, file_path e content
PARSED="$(printf '%s' "$PAYLOAD" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    tn = d.get("tool_name", "")
    ti = d.get("tool_input") or {}
    fp = ti.get("file_path", "")
    # Para Write: content. Para Edit: new_string. Para MultiEdit: concat new_strings
    content = ti.get("content", "")
    if not content:
        content = ti.get("new_string", "")
    if not content:
        edits = ti.get("edits") or []
        content = "\n".join(e.get("new_string", "") for e in edits)
    # Substituir tabs e newlines em content por marcadores para sobreviver ao split
    content = content.replace("\t", "\\t").replace("\n", "\\n")
    print(f"{tn}\t{fp}\t{content}")
except Exception:
    print("\t\t")
')"

TOOL_NAME="$(printf '%s' "$PARSED" | cut -f1)"
FILE_PATH="$(printf '%s' "$PARSED" | cut -f2)"
CONTENT="$(printf '%s' "$PARSED" | cut -f3-)"

# Aplicar somente em Write/Edit/MultiEdit
case "$TOOL_NAME" in
  Write|Edit|MultiEdit) ;;
  *) exit 0 ;;
esac

# Sem path? deixa passar
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Path nao e workflow GHA? deixa passar
case "$FILE_PATH" in
  */.github/workflows/*.yml|*/.github/workflows/*.yaml) ;;
  *) exit 0 ;;
esac

# Verificar se ja existe header de justificativa
# Aceita variantes: JUSTIFICATIVA-GHA, JUSTIFICATIVA_GHA, justificativa-gha (case-insensitive)
HAS_JUSTIFICATIVA=0
HAS_ALTERNATIVA=0

# 1. Checar no novo conteudo (Write ou Edit/MultiEdit substituindo header)
if printf '%s' "$CONTENT" | grep -qiE "JUSTIFICATIVA[-_]GHA"; then
  HAS_JUSTIFICATIVA=1
fi
if printf '%s' "$CONTENT" | grep -qiE "ALTERNATIVA[-_]DESCARTADA"; then
  HAS_ALTERNATIVA=1
fi

# 2. Se Edit/MultiEdit em arquivo existente, checar se header ja esta no arquivo
if [ "$HAS_JUSTIFICATIVA" = "0" ] && [ -f "$FILE_PATH" ]; then
  if grep -qiE "JUSTIFICATIVA[-_]GHA" "$FILE_PATH" 2>/dev/null; then
    HAS_JUSTIFICATIVA=1
  fi
  if grep -qiE "ALTERNATIVA[-_]DESCARTADA" "$FILE_PATH" 2>/dev/null; then
    HAS_ALTERNATIVA=1
  fi
fi

# Se ambos presentes, deixa passar
if [ "$HAS_JUSTIFICATIVA" = "1" ] && [ "$HAS_ALTERNATIVA" = "1" ]; then
  exit 0
fi

# Montar mensagem de bloqueio
{
  echo "BLOCKED: novo/editado workflow GHA sem justificativa."
  echo ""
  echo "Path tentado: $FILE_PATH"
  echo ""
  echo "REGRA: GHA e ULTIMO RECURSO. Stack canonica (Vercel/Supabase/Railway/GitHub Advanced Security)"
  echo "       cobre ~85% dos casos sem workflow custom."
  echo ""
  echo "Antes de criar/editar este workflow, responda:"
  echo "  1. Por que isso nao pode ser Vercel CI nativo?"
  echo "  2. Por que nao pode ser Supabase pg_cron / Railway cron / Vercel Cron?"
  echo "  3. Por que nao pode ser GitHub Advanced Security (CodeQL, secret-scan, Dependabot)?"
  echo ""
  echo "Whitelist (W1-W4) — unicos casos justificaveis:"
  echo "  W1 — Acesso a recurso legado IP fixo/VPN (TOTVS MSSQL/ODBC/SOAP)"
  echo "  W2 — Build/release de binario multi-plataforma (CLI npm/Homebrew)"
  echo "  W3 — Deploy em VPS self-hosted"
  echo "  W4 — PR gate DB-first (psql + dbt + migrations)"
  echo ""
  echo "Se enquadra em W1-W4, adicione no topo do YAML:"
  echo ""
  echo "  # JUSTIFICATIVA-GHA: <W1|W2|W3|W4> — <descricao em 1 linha>"
  echo "  # ALTERNATIVA-DESCARTADA: <opcao nativa avaliada e razao de nao servir>"
  echo ""
  echo "Headers detectados:"
  echo "  JUSTIFICATIVA-GHA: $([ "$HAS_JUSTIFICATIVA" = "1" ] && echo "OK" || echo "FALTANDO")"
  echo "  ALTERNATIVA-DESCARTADA: $([ "$HAS_ALTERNATIVA" = "1" ] && echo "OK" || echo "FALTANDO")"
  echo ""
  echo "Regra completa: ~/Claude/.claude/rules/gha-minimal.md"
  echo "Bypass de emergencia: export GHA_GUARD_DISABLED=1"
} >&2

exit 2
