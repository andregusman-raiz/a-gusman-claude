#!/usr/bin/env bash
# result.sh — RESULT record: o builder REGISTRA o desfecho; ninguém manda mensagem de resultado (falha 3 da crítica).
# Uso: result.sh <PAPEL> <TASK|E-nn> <status: done|blocked|failed> "<prova_cmd>" ["nota ≤200"] [PR]
# Append-only com flock em roadmap/results.jsonl. Board/DIAG/despertar derivam daqui.
set -uo pipefail
[ $# -ge 4 ] || { echo "uso: result.sh PAPEL TASK done|blocked|failed PROVA_CMD [NOTA] [PR]" >&2; exit 2; }
P=$1; T=$2; ST=$3; PV=$4; NT=${5:-}; PR=${6:-}
case "$ST" in done|blocked|failed) ;; *) echo "status inválido: $ST" >&2; exit 2;; esac
F="$HOME/Claude/docs/ai-state/roadmap/results.jsonl"
python3 - "$F" "$P" "$T" "$ST" "$PV" "$NT" "$PR" <<'PY'
import sys,json,datetime,fcntl
f,p,t,st,pv,nt,pr=sys.argv[1:8]
rec={"ts":datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),"papel":p,"task":t,"status":st,"prova_cmd":pv[:400],"nota":nt[:200],"pr":pr}
with open(f,"a") as fh:
    fcntl.flock(fh,fcntl.LOCK_EX); fh.write(json.dumps(rec,ensure_ascii=False)+"\n")
print("RESULT registrado:",t,st)
PY
