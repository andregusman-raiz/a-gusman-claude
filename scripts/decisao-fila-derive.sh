#!/usr/bin/env bash
# decisao-fila-derive.sh — FILA ÚNICA de decisões do dono (ordem do dono 2026-09-02, console COMANDO).
# Deriva docs/ai-state/roadmap/filas/fila-decisao.jsonl de DUAS fontes:
#   (1) decisoes.json (fichas D-nnn abertas)  (2) decisions_despertador.yaml do repo DE (DESP-*, status open)
# IDEMPOTENTE: merge por task; preserva progresso (puxada_em/empurrada/etc.); fecha (status=done) linha cuja
# fonte já não está aberta. A fila é DERIVADA — nunca editar à mão (mesma regra do registry).
# O despertador é lido de origin/main do CLONE local SEM fetch (sem rede aqui; o fetch é de quem trabalha o repo).
set -uo pipefail
AI="$HOME/Claude/docs/ai-state"
Q="$AI/roadmap/filas/fila-decisao.jsonl"
DE_REPO="$HOME/Claude/GitHub/raiz-data-engine"
mkdir -p "$(dirname "$Q")"; touch "$Q"
DESP="$(git -C "$DE_REPO" show origin/main:governance/decisions_despertador.yaml 2>/dev/null || true)"
export DESP
python3 - "$AI" "$Q" <<'PY'
import json,sys,os,re,fcntl,datetime
AI,Q=sys.argv[1],sys.argv[2]
now=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
d=json.load(open(f"{AI}/terminais/decisoes.json",encoding="utf-8"))
ds=d["decisoes"] if isinstance(d,dict) and "decisoes" in d else d
abertas={}
for x in ds:
    if (x.get("estado") or "").startswith("abert"):
        abertas[x["id"]]={"titulo":(x.get("titulo") or "")[:160],"bloco":x.get("bloco") or 9,
                          "classe":x.get("classe"),"aberta_em":x.get("aberta_em") or ""}
desp={}
t=os.environ.get("DESP") or ""
for b in re.split(r'\n  - id: ', t)[1:]:
    idv=b.split("\n")[0].strip()
    g=lambda k: (re.search(r'^\s*'+k+r':\s*"?([^"\n]+)"?', b, re.M) or [None,""])[1].strip() if re.search(r'^\s*'+k+r':\s*"?([^"\n]+)"?', b, re.M) else ""
    if g("status")=="open":
        desp["DESP-"+idv]={"titulo":(g("title") or idv)[:160],"sev":g("severity"),"decide_by":g("decide_by")}
# carrega fila existente (merge por task)
rows=[]; seen={}
with open(Q,"r+") as fh:
    fcntl.flock(fh,fcntl.LOCK_EX)
    for l in fh:
        l=l.strip()
        if not l: continue
        try: r=json.loads(l)
        except: continue
        rows.append(r); seen[r.get("task")]=r
    add=0; closed=0
    hoje=datetime.date.today()
    def prio(meta,is_desp):
        if is_desp:
            try:
                db=datetime.date(*map(int,meta["decide_by"].split("-")))
                return 0 if db<=hoje else (0 if meta.get("sev")=="P0" else 1)
            except: return 1
        return 0 if meta.get("bloco")==1 else 1
    _ult={}
    try:
        for _l in open(os.path.expanduser("~/Claude/docs/ai-state/roadmap/results.jsonl"),errors="replace"):
            try: _e=json.loads(_l)
            except Exception: continue
            if _e.get("status") and _e["status"] not in ("posto","anulado"): _ult[_e.get("task")]=_e
    except Exception: _ult={}
    for task,meta in list(abertas.items())+list(desp.items()):
        is_desp=task.startswith("DESP-")
        if task in seen:
            r=seen[task]
            r["resumo"]=meta["titulo"]
            if r.get("status")=="done":   # reaberta na fonte -> reabre na fila
                # 02/09 (achado do COMANDO, 9 rows): o DECISAO regista `done` no ledger (decidiu/despachou), o empurra
                # reconcilia a row para done, e este derive reabria-a a cada tick porque a FONTE (yaml do DE, que so'
                # muda por PR) continua `open` — 7 DESP-* em ping-pong desde 11:57Z. Ledger `done` posterior ao ultimo
                # derive vale: a row fica done com nota; a fonte fecha quando o PR mergear (linha 69-70 trata).
                _l=_ult.get(task) or {}
                if _l.get("status")=="done" and str(_l.get("ts") or "")>=str(r.get("derivada_em") or ""):
                    r["nota_derive"]=f"fonte ainda open; ledger done {_l.get('ts','')[:16]} por {_l.get('papel','')} — aguarda fecho na fonte (PR)"
                    continue
                r["status"]="fila"; r["nota_derive"]=f"reaberta na fonte {now}"
            continue
        rows.append({"task":task,"frente":"decisao","resumo":meta["titulo"],"status":"fila",
                     "depende_de":[],"builder_sugerido":"DECISAO","prova":"",
                     "prioridade":prio(meta,is_desp),
                     "bloco":None if is_desp else meta.get("bloco"),
                     "classe":None if is_desp else meta.get("classe"),
                     "origem":"despertador" if is_desp else "decisoes.json",
                     "derivada_em":now}); add+=1
    vivos=set(abertas)|set(desp)
    for r in rows:
        if r.get("task") not in vivos and r.get("status") not in ("done",):
            r["status"]="done"; r["nota_derive"]=f"fechada na fonte (decidida/arquivada) {now}"; closed+=1
    rows.sort(key=lambda r:(r.get("prioridade") if r.get("prioridade") is not None else 1,
                            r.get("bloco") or 9, str(r.get("task"))))
    fh.seek(0); fh.truncate()
    for r in rows: fh.write(json.dumps(r,ensure_ascii=False)+"\n")
    tot=sum(1 for r in rows if r.get("status")=="fila")
    print(f"fila-decisao: {tot} em fila ({add} novas, {closed} fechadas) · fontes: {len(abertas)} fichas + {len(desp)} despertador")
PY
