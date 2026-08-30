#!/usr/bin/env bash
# fila-pull.sh — FILA PUXADA por frente (falha 1 da crítica): o builder que termina PUXA a próxima tarefa.
# Uso: fila-pull.sh <frente: funil|parcelas|prontidao|sustentacao> <PAPEL>  [--peek]
# Atômico (flock). Tarefa elegível: status=fila e todas as dependências com RESULT done. Marca puxada_por/em.
set -uo pipefail
FR=${1:?frente}; PA=${2:?papel}; PEEK=${3:-}
D="$HOME/Claude/docs/ai-state/roadmap"; Q="$D/filas/fila-$FR.jsonl"; R="$D/results.jsonl"
[ -f "$Q" ] || { echo "fila inexistente: $Q" >&2; exit 1; }
python3 - "$Q" "$R" "$PA" "$PEEK" <<'PY'
import sys,json,fcntl,datetime,os,re
q,r,papel,peek=sys.argv[1:5]
done={ (json.loads(l).get("task") or "") for l in open(r) if '"done"' in l } if os.path.exists(r) else set()
# 30/08 23:4xZ: o estado DERIVA do ultimo RESULT (regra em _POLITICAS-COMUNS), mas o pull so lia a fila.
# Caso medido: E-35b 'bloqueada' em fila-funil e 'fila' em fila-prontidao (o filas-sync criou a 2a row);
# o ultimo RESULT e blocked, e o pull ia oferece-la ao FUNIL — que foi quem a devolveu bloqueada.
# Ultimo RESULT por task; se for blocked/failed, a task nao e puxavel em fila NENHUMA ate haver RESULT novo.
ult={}
if os.path.exists(r):
    for l in open(r):
        try: d=json.loads(l)
        except Exception: continue
        k=d.get("task") or d.get("tarefa")
        if k: ult[k]=(d.get("estado") or d.get("status") or "")
# 30/08 23:3xZ: 'papel in bs' era SUBSTRING — "revisa DE-DATA" deixava o DE-DATA puxar a E-39 cujo executor e Codex/DE-BUILD-B.
# Mesma semantica do fila_empurra.executor(): Codex -> 'dirigido por X' senao DE-BUILD-B; caso contrario 1o papel conhecido.
PAPEIS={"DE-MIG","DE-DATA","DE-SYNC","DE-BUILD-B","FUNIL","DE-CODEX","FUNIL-WP4"}
def executor(bs):
    bs=bs or ""
    if "Codex" in bs:
        m=re.search(r"dirigid[oa] por ([A-Z][A-Z-]+)",bs); return m.group(1) if m and m.group(1) in PAPEIS else "DE-BUILD-B"
    for p_ in PAPEIS:
        if re.search(r"\b"+re.escape(p_)+r"\b",bs): return p_
    return ""
# blocked/failed so trava se quem o registou E o executor da task; blocked de nao-executor e devolucao de encaminhamento, nao bloqueio
def donos(bs):
    # 30/08 23:4xZ (achado do FUNIL): o campo codifica DOIS papeis — "Codex (R2); especifica FUNIL; revisa DE-DATA".
    # executor() sozinho dava DE-BUILD-B e prendia a task longe de quem escreve a SPEC. Quem pode INICIAR = executor + especificador.
    d=set(); ex=executor(bs)
    if ex: d.add(ex)
    for m in re.finditer(r"especifica[m]?\s+([A-Z][A-Z-]+)", bs or ""):
        if m.group(1) in PAPEIS: d.add(m.group(1))
    return d
ult_papel={}
if os.path.exists(r):
    for l in open(r):
        try: d=json.loads(l)
        except Exception: continue
        k=d.get("task") or d.get("tarefa")
        if k: ult_papel[k]=d.get("papel")
travadas=set()
with open(q,"r+") as fh:
    fcntl.flock(fh,fcntl.LOCK_EX)
    rows=[json.loads(l) for l in fh if l.strip()]
    pick=None
    for row in rows:
        if row.get("status")!="fila": continue
        if (row.get("task") or "") in done:
            row["status"]="done"; continue   # reconcilia rótulo velho com results.jsonl
        # 30/08: o fila-empurra ja filtrava por builder_sugerido (fila_empurra.py:54-56) e o pull
        # nao filtrava nada — puxava a 1a elegivel fosse de quem fosse. Efeito medido: o FUNIL puxou
        # a E-10, que a linha do roadmap marca como DE-DATA, e teve de a devolver como blocked.
        # A frente NAO e o builder: fila-funil tem seccao do DE e seccao do consumidor.
        # So filtra quando o campo esta preenchido — tarefa sem sugestao continua a ser de quem chegar.
        tk=row.get("task") or ""; dn=donos(row.get("builder_sugerido") or "")
        if ult.get(tk) in ("blocked","failed") and (not dn or ult_papel.get(tk)==papel): continue   # so nao se re-oferece a QUEM bloqueou
        if dn and papel not in dn: continue   # so quem pode iniciar (executor ou especificador) puxa
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
