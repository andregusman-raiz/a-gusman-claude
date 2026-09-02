#!/usr/bin/env bash
# fila-empurra.sh — FECHA O LOOP DA OCIOSIDADE (dono 30/08: "4ª vez que peço e nada muda; resolva de vez").
# Sessão de LLM parada não lê fila nenhuma. O TICK puxa POR ela: builder ocioso >10 min e sem tarefa ativa recebe
# no prompt a próxima tarefa elegível (texto + prova + comando de RESULT). Sem coordenador, sem espera. Sem LLM.
set -uo pipefail
AI="$HOME/Claude/docs/ai-state"; SEND="$HOME/Claude/.claude/scripts/terminal-send.sh"; TL="$AI/terminais/tick.log"
EV="$(mktemp)"
if ! python3 "$HOME/Claude/.claude/scripts/fila_empurra.py" "$AI" > "$EV" 2>>"$TL"; then
  # 31/08 (COMANDO): o gerador crashou em TODOS os ticks 02:15→12:55Z e o passo dizia rc=0 — 10h40 sem entregar tarefa.
  # Falha do gerador passa a ser VISÍVEL: linha rc=1 no tick.log (tick-acorda alarma o COMANDO) e saída ≠0.
  printf '%s step=fila-empurra-gerador rc=1 FALHOU (ver stderr acima)\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$TL"; rm -f "$EV"; exit 1
fi
# 02/09 (auditoria do RESUMO, ordem do dono): (a) SEGUNDO CANAL — cada atribuicao vira evento append-only em
# filas/atribuicoes.jsonl; um papel com Monitor nesse ficheiro acorda mesmo que a tela falhe. (b) sem "desfazer":
# desfazer + re-oferecer a cada tick fez 33 tentativas numa tarefa em 5 h; a atribuicao fica, o LEMBRETE e o vigia
# tratam do resto. (c) BACKOFF + ESCALADA: 3 falhas seguidas de tela num destino -> 60 min sem insistir e aviso
# ativo ao dono (notify-dono.sh); um sucesso zera.
FALHAS="$HOME/.claude/state/fila-empurra-falhas.json"; ATR="$AI/roadmap/filas/atribuicoes.jsonl"
_falhas() { python3 - "$FALHAS" "$@" <<'PYF'
import json,sys,time,os
st,op,dest=sys.argv[1],sys.argv[2],sys.argv[3]
d=json.load(open(st)) if os.path.exists(st) else {}
e=d.get(dest,{"n":0,"ultima":0})
if op=="check": print("skip" if e["n"]>=3 and time.time()-e["ultima"]<3600 else "go"); raise SystemExit
if op=="fail": e["n"]+=1; e["ultima"]=time.time()
if op=="ok": e={"n":0,"ultima":0}
d[dest]=e; json.dump(d,open(st,'w')); print(e["n"])
PYF
}
while IFS=$'\t' read -r PAPEL MSG TASK FRENTE; do
  [ -z "${PAPEL:-}" ] && continue
  # formato com espaco depois dos dois pontos ("papel": "X") — e' o que o contrato manda os papeis filtrarem;
  # o SALARIOS apanhou que json compacto tornaria os monitores mudos (e mudo le-se como calmo).
  printf '{"ts": "%s", "papel": "%s", "task": "%s", "frente": "%s", "msg": %s}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$TASK" "$FRENTE" "$(printf '%s' "$MSG" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()[:300]))')" >> "$ATR"
  if [ "$(_falhas check "$PAPEL")" = "skip" ]; then
    printf '%s step=fila-empurra dest=%s task=%s ADIADO-backoff (3+ falhas de tela; evento em atribuicoes.jsonl)\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$TASK" >> "$TL"; continue
  fi
  if bash "$SEND" "$PAPEL" "$MSG" >/dev/null 2>&1; then
    _falhas ok "$PAPEL" >/dev/null
    printf '%s step=fila-empurra dest=%s task=%s ok\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$TASK" >> "$TL"
  else
    N=$(_falhas fail "$PAPEL")
    printf '%s step=fila-empurra dest=%s task=%s FALHOU-tela (%s seguidas; atribuicao mantida, evento registado)\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$TASK" "$N" >> "$TL"
    [ "$N" -ge 3 ] && bash "$HOME/Claude/.claude/scripts/notify-dono.sh" "empurra:$PAPEL" "$PAPEL inalcancavel pela tela ($N falhas seguidas) — tarefa $TASK atribuida mas nao entregue; ver INALCANCAVEIS.md" >/dev/null 2>&1 || true
  fi
done < "$EV"
rm -f "$EV"
