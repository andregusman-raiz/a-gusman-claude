#!/bin/bash
# decisoes-view-guard.sh — PreToolUse(Write|Edit|MultiEdit): impede edicao manual
# da VIEW GERADA de decisoes.
#
# Achado 7 (auditoria terminais 48h, 2026-08-28): DECISOES-PENDENTES.md e uma
# view gerada por decisoes-render.sh a partir de decisoes.json (builder B do
# contrato de reforma) — se qualquer papel escreve direto nela via Write/Edit,
# a proxima renderizacao (launchd 10min) SOBRESCREVE a mudanca em silencio, e
# o papel acha que registrou algo que nunca sobrevive. So decisao-nova.sh /
# decisao-decidir.sh escrevem em decisoes.json; a view e derivada.
#
# Excecao: a propria decisoes-render.sh escreve a view via Python
# (tmp+os.replace), NUNCA via Edit/Write tool do Claude Code — este guard so
# intercepta a tool_use Write/Edit/MultiEdit de uma SESSAO, entao o render
# nunca passa por aqui e nunca e bloqueado.
#
# Apendice manual: sob a secao final `## ENTRADA MANUAL` do proprio arquivo,
# via `cat >> DECISOES-PENDENTES.md <<'EOF' ... EOF` (Bash, nao Write/Edit) —
# decisoes-render.sh faz INGEST dela no proximo ciclo (rede de seguranca
# documentada no proprio decisoes-render.sh).
#
# BLOCKING (exit 2). Bypass: DECISOES_VIEW_EDIT=1
set -uo pipefail
[ "${DECISOES_VIEW_EDIT:-0}" = "1" ] && exit 0

TARGET_REL="docs/ai-state/terminais/DECISOES-PENDENTES.md"
TARGET_ABS="$HOME/Claude/$TARGET_REL"

PAYLOAD="$(cat)"
# MultiEdit tambem usa um unico "file_path" no topo (a lista "edits" so tem
# old_string/new_string, sem path por item) — 1 campo basta para os 3 tools.
HIT="$(printf '%s' "$PAYLOAD" | TARGET_PATH="$TARGET_ABS" python3 -c '
import json, os, sys
target = os.path.realpath(os.environ["TARGET_PATH"])
try:
    d = json.load(sys.stdin)
except Exception:
    print("0"); raise SystemExit(0)
ti = d.get("tool_input") or {}
p = ti.get("file_path") or ti.get("path") or ""
if not p:
    print("0"); raise SystemExit(0)
try:
    abs_p = os.path.realpath(os.path.expanduser(p))
except Exception:
    print("0"); raise SystemExit(0)
print("1" if abs_p == target else "0")
' 2>/dev/null)"
[ "$HIT" != "1" ] && HIT=0

if [ "$HIT" = "1" ]; then
  echo "BLOQUEADO: $TARGET_REL e VIEW GERADA por decisoes-render.sh a partir de decisoes.json." >&2
  echo "  - Nova decisao do dono pendente: bash ~/.claude/scripts/decisao-nova.sh \"<titulo>\" --papel <PAPEL> --efeito \"...\"" >&2
  echo "  - Fechar decisao existente: bash ~/.claude/scripts/decisao-decidir.sh D-nnn \"<texto>\"" >&2
  echo "  - Apendice manual (raro): 'cat >> $TARGET_REL <<EOF' via Bash, SOB a secao '## ENTRADA MANUAL' no fim do arquivo — decisoes-render.sh ingere no proximo ciclo." >&2
  echo "  Escrever direto via Write/Edit e sobrescrito em silencio no proximo render (ate 10min)." >&2
  echo "  Bypass consciente: DECISOES_VIEW_EDIT=1" >&2
  exit 2
fi

exit 0
