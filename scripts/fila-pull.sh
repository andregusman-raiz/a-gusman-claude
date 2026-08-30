#!/usr/bin/env bash
# fila-pull.sh — FILA PUXADA por frente (falha 1 da crítica): o builder que termina PUXA a próxima tarefa.
# Uso: fila-pull.sh <frente: funil|parcelas|prontidao|sustentacao> <PAPEL>  [--peek]
# Atômico (flock). Tarefa elegível: status=fila e todas as dependências com RESULT done. Marca puxada_por/em.
set -uo pipefail
FR=${1:?frente}; PA=${2:?papel}; PEEK=${3:-}
D="$HOME/Claude/docs/ai-state/roadmap"; Q="$D/filas/fila-$FR.jsonl"; R="$D/results.jsonl"
[ -f "$Q" ] || { echo "fila inexistente: $Q" >&2; exit 1; }
python3 - "$Q" "$R" "$PA" "$PEEK" <<'PY'
import sys,json,fcntl,datetime,os
q,r,papel,peek=sys.argv[1:5]
done={ (json.loads(l).get("task") or "") for l in open(r) if '"done"' in l } if os.path.exists(r) else set()
with open(q,"r+") as fh:
    fcntl.flock(fh,fcntl.LOCK_EX)
    rows=[json.loads(l) for l in fh if l.strip()]
    pick=None
    for row in rows:
        if row.get("status")!="fila": continue
        if (row.get("task") or "") in done:
            row["status"]="done"; continue   # reconcilia rótulo velho com results.jsonl
        deps=row.get("depende_de") or []
        if all(d in done for d in deps): pick=row; break
    if not pick:
        bloq=sum(1 for x in rows if x.get("status")=="fila")
        print(f"FILA-VAZIA: nenhuma tarefa elegível em {os.path.basename(q)} ({bloq} na fila, bloqueadas por dependência)"); sys.exit(0)
    if peek=="--peek":
        print("PRÓXIMA (peek):", json.dumps(pick,ensure_ascii=False)[:400]); sys.exit(0)
    pick["status"]="puxada"; pick["puxada_por"]=papel; pick["puxada_em"]=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    fh.seek(0); fh.truncate()
    for row in rows: fh.write(json.dumps(row,ensure_ascii=False)+"\n")
    print("PUXADA:", json.dumps(pick,ensure_ascii=False)[:500])
    print(f"AO TERMINAR: bash ~/.claude/scripts/result.sh {papel} {pick['task']} done \"<prova_cmd>\" \"<nota>\" [PR]")
PY
