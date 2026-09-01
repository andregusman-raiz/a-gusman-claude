#!/usr/bin/env bash
# result.sh — RESULT record: o builder REGISTRA o desfecho; ninguém manda mensagem de resultado (falha 3 da crítica).
# Uso: result.sh <PAPEL> <TASK|E-nn> <status: done|blocked|failed|retracted|anulado> "<prova_cmd>" ["nota ≤200"] [PR]
# retracted = desfaz um done ANTERIOR MEU porque a prova caiu — afirma algo sobre a QUALIDADE do trabalho.
# anulado   = este registo não devia existir (id errado, tarefa trocada). NÃO diz nada sobre trabalho anterior
#             nem sobre quem o fez. 01/09: um papel usou `retracted` numa colisão de identificador e, além de
#             reabrir a Entrega FECHADA de outro papel, deixou no ledger a afirmação de que a prova DELE caíra —
#             falso. Um verbo respondia por duas coisas incompatíveis; agora são dois.
# O ÚLTIMO registro por task é o que vale (board/filas/empurra), EXCEPTO `anulado`, que é ignorado por eles.
# posto = declaração de vigília (A28b): NÃO é tarefa nem bloqueio — o tick não alarma, o board não conta. Exige nota (o que vigia + como expira).
# Append-only com flock em roadmap/results.jsonl. Board/DIAG/despertar derivam daqui.
set -uo pipefail
[ $# -ge 4 ] || { echo "uso: result.sh PAPEL TASK done|blocked|failed|retracted|anulado PROVA_CMD [NOTA] [PR]" >&2; exit 2; }
P=$1; T=$2; ST=$3; PV=$4; NT=${5:-}; PR=${6:-}
case "$ST" in done|blocked|failed|retracted|anulado|posto) ;; *) echo "status inválido: $ST" >&2; exit 2;; esac
# 30/08 23:5xZ (COMANDO): chamada incompleta era aceite em silêncio (texto todo em prova_cmd, nota vazia) — verde por ausência.
# blocked/failed/retracted/anulado EXIGEM nota (o motivo é o registro); done sem nota avisa e segue (prova_cmd basta).
if [ -z "$NT" ] && [ "$ST" != "done" ]; then echo "RECUSADO: $ST exige NOTA (5º argumento): o motivo é o registro. Uso: result.sh PAPEL TASK $ST '<prova_cmd>' '<motivo ≤200>' [PR]" >&2; exit 2; fi
[ -z "$NT" ] && echo "AVISO: done sem nota — prova_cmd será exibida no board como nota." >&2
F="$HOME/Claude/docs/ai-state/roadmap/results.jsonl"
python3 - "$F" "$P" "$T" "$ST" "$PV" "$NT" "$PR" <<'PY'
import sys,json,datetime,fcntl
f,p,t,st,pv,nt,pr=sys.argv[1:8]
# 01/09 (COMANDO): os limites eram aplicados em SILENCIO — medido: 140 de 219 notas (64%) estavam no
# tecto, cortadas a meio da frase, e ninguem sabia (autor pensa que escreveu tudo, leitor recebe um
# texto plausivel e amputado). O script ja RECUSAVA nota ausente; passar a marcar o corte torna a
# perda visivel sem quebrar o fluxo de quem escreve (recusar partiria 64% das chamadas).
def _cap(v, n):
    return (v[:n-4].rstrip() + " […]") if len(v) > n else v
if len(nt) > 200: print(f"AVISO: nota tinha {len(nt)} chars, cortada em 200 — o resto PERDEU-SE. Poe a evidencia num ficheiro e aponta-o.", file=sys.stderr)
if len(pv) > 400: print(f"AVISO: prova_cmd tinha {len(pv)} chars, cortada em 400 — o resto PERDEU-SE.", file=sys.stderr)
rec={"ts":datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),"papel":p,"task":t,"status":st,"prova_cmd":_cap(pv,400),"nota":_cap(nt,200),"pr":pr}
with open(f,"a") as fh:
    fcntl.flock(fh,fcntl.LOCK_EX); fh.write(json.dumps(rec,ensure_ascii=False)+"\n")
print("RESULT registrado:",t,st)
PY
