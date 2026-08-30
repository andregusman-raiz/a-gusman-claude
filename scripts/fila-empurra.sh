#!/usr/bin/env bash
# fila-empurra.sh — FECHA O LOOP DA OCIOSIDADE (dono 30/08: "4ª vez que peço e nada muda; resolva de vez").
# Sessão de LLM parada não lê fila nenhuma. O TICK puxa POR ela: builder ocioso >10 min e sem tarefa ativa recebe
# no prompt a próxima tarefa elegível (texto + prova + comando de RESULT). Sem coordenador, sem espera. Sem LLM.
set -uo pipefail
AI="$HOME/Claude/docs/ai-state"; SEND="$HOME/Claude/.claude/scripts/terminal-send.sh"; TL="$AI/terminais/tick.log"
EV="$(mktemp)"
python3 "$HOME/Claude/.claude/scripts/fila_empurra.py" "$AI" > "$EV" 2>>"$TL" || true
while IFS=$'\t' read -r PAPEL MSG TASK FRENTE; do
  [ -z "${PAPEL:-}" ] && continue
  if bash "$SEND" "$PAPEL" "$MSG" >/dev/null 2>&1; then
    printf '%s step=fila-empurra dest=%s task=%s ok\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$TASK" >> "$TL"
  else
    python3 "$HOME/Claude/.claude/scripts/fila_empurra.py" --desfaz "$AI" "$PAPEL" "$TASK" "$FRENTE" >/dev/null 2>&1 || true
    printf '%s step=fila-empurra dest=%s task=%s FALHOU-desfeita\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$TASK" >> "$TL"
  fi
done < "$EV"
rm -f "$EV"
