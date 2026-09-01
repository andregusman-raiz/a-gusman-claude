#!/usr/bin/env bash
# pr-cr-fila.sh — PR com pedido de alteração vira TAREFA no roadmap, com prioridade.
#
# PORQUE EXISTE (ordem do dono, 01/09 14:2xZ): medimos 24 PRs em CHANGES_REQUESTED e só 2 tinham
# envio depois do pedido; os outros 22 estavam parados — o mais velho há 145 h. A causa é estrutural:
# o roadmap tem quem o EMPURRE (fila puxada + fila-empurra + vigia de ociosidade), mas a fila de PRs
# só tinha quem a ANUNCIASSE (tick-acorda emite CR-NOVO uma vez, 3 tentativas, e desiste; e só dispara
# se a CR for sobre o head ACTUAL — logo um PR parado há dias deixa de alarmar por construção).
# Este script fecha a assimetria: cada PR em CR sem envio posterior passa a ser uma tarefa como as
# outras, na fila da frente do claim, NO TOPO (prioridade: aprovar o que já foi construído vem antes
# de construir mais).
#
# INVARIANTES
#  - task = "CR-<numero>"; upsert idempotente (correr 2× não duplica).
#  - Entra no TOPO do ficheiro da fila: fila-pull e fila_empurra escolhem a 1ª elegível na ordem do
#    ficheiro, portanto a posição É a prioridade (sem tocar nos dois consumidores, que são críticos).
#  - Fecha sozinho: houve commit DEPOIS da review → RESULT done com o SHA como prova, e a row sai.
#  - NÃO inventa dono: frente vem do claim. Sem claim e autor da frota → fila-revisao com dono vazio.
#    PR de colega (autor fora da frota) NÃO vira tarefa nossa — conta no resumo e fica de fora.
#  - CONTROLO POSITIVO: se a consulta devolver zero PRs abertos, isso é sonda mal formada, não fila
#    vazia → sai rc=2 sem escrever nada. (A ausência enganou-nos 5× num só dia.)
#  - Falha é VISÍVEL: erro sai rc≠0 para o tick registar; nada de "|| true".
set -uo pipefail
REPO="${DE_REPO:-Raiz-Educacao-SA/raiz-data-engine}"
FROTA="${DE_FROTA_LOGIN:-andregusman-raiz}"
AI="$HOME/Claude/docs/ai-state"
DRY="${1:-}"

command -v gh >/dev/null || { echo "pr-cr-fila: gh ausente" >&2; exit 3; }

RAW=$(gh pr list -R "$REPO" --state open --json number,author,reviewDecision,title --limit 60 2>/dev/null) || {
  echo "pr-cr-fila: gh pr list falhou" >&2; exit 3; }

DETALHE=$(python3 - "$RAW" <<'PY'
import sys,json,subprocess,os
prs=json.loads(sys.argv[1] or "[]")
if not prs:
    print("__VAZIO__"); raise SystemExit(0)
repo=os.environ.get("DE_REPO","Raiz-Educacao-SA/raiz-data-engine")
out=[]
for p in prs:
    if p.get("reviewDecision")!="CHANGES_REQUESTED": continue
    n=p["number"]
    j=subprocess.run(["gh","pr","view",str(n),"-R",repo,"--json","reviews,commits,headRefOid"],
                     capture_output=True,text=True,timeout=60).stdout
    try: d=json.loads(j or "{}")
    except Exception: continue
    crs=[r for r in d.get("reviews",[]) if r.get("state")=="CHANGES_REQUESTED"]
    if not crs: continue
    cr=sorted(crs,key=lambda r:r.get("submittedAt",""))[-1]
    cms=sorted(d.get("commits",[]),key=lambda c:c.get("committedDate",""))
    last=cms[-1] if cms else {}
    out.append({"pr":n,"autor":(p.get("author") or {}).get("login",""),
                "titulo":(p.get("title") or "")[:120],
                "cr_em":cr.get("submittedAt",""),"cr_por":(cr.get("author") or {}).get("login",""),
                "commit_em":last.get("committedDate",""),"commit_oid":(last.get("oid") or "")[:8]})
print(json.dumps(out,ensure_ascii=False))
PY
) || { echo "pr-cr-fila: enriquecimento falhou" >&2; exit 3; }

[ "$DETALHE" = "__VAZIO__" ] && { echo "pr-cr-fila: ZERO PRs abertos — sonda suspeita, nada escrito" >&2; exit 2; }

AI="$AI" REPO="$REPO" FROTA="$FROTA" DRY="$DRY" python3 - "$DETALHE" <<'PY'
import sys,json,os,glob,fcntl,datetime,re
det=json.loads(sys.argv[1] or "[]")
AI=os.environ["AI"]; FROTA=os.environ["FROTA"]; DRY=os.environ.get("DRY","")
now=datetime.datetime.now(datetime.timezone.utc); NOW=now.strftime("%Y-%m-%dT%H:%M:%SZ")
QD=f"{AI}/roadmap/filas"; RES=f"{AI}/roadmap/results.jsonl"

def horas(ts):
    try: return (now-datetime.datetime.fromisoformat(ts.replace("Z","+00:00"))).total_seconds()/3600
    except Exception: return -1.0

# frente por PR, a partir do claim (NUNCA por inferência de nome de ramo: 01/09, a propriedade
# de um PR foi inferida pelo nome do ramo e estava errada — os ramos dos colegas seguem a mesma convenção).
claim_frente={}; claim_dono={}
try:
    cj=json.load(open(f"{AI}/de-pr-queue/claims.json"))
    cl=cj.get("claims") if isinstance(cj,dict) else cj
    if isinstance(cl,dict): cl=list(cl.values())
    for c in (cl or []):
        if not isinstance(c,dict): continue
        pr=c.get("pr")
        if not pr: continue
        claim_frente[int(pr)]=c.get("frente") or ""
        claim_dono[int(pr)]=c.get("papel") or c.get("owner") or ""
except Exception: pass

ult={}
if os.path.exists(RES):
    for l in open(RES):
        try: e=json.loads(l); ult[e.get("task")]=e
        except Exception: pass

def carrega(q):
    if not os.path.exists(q): return []
    return [json.loads(l) for l in open(q) if l.strip()]

def grava(q,rows):
    with open(q,"w") as fh:
        fcntl.flock(fh,fcntl.LOCK_EX)
        for r in rows: fh.write(json.dumps(r,ensure_ascii=False)+"\n")

def result(papel,task,status,prova,nota):
    linha={"ts":NOW,"papel":papel,"task":task,"status":status,"prova":prova,"nota":nota,"pr":""}
    with open(RES,"a") as fh:
        fcntl.flock(fh,fcntl.LOCK_EX); fh.write(json.dumps(linha,ensure_ascii=False)+"\n")

novos=[]; fechados=[]; externos=[]; ja_reenviados=[]
por_fila={}   # fila -> lista de rows a inserir no topo

for d in det:
    n=d["pr"]; task=f"CR-{n}"
    reenviado = bool(d["commit_em"] and d["cr_em"] and d["commit_em"] > d["cr_em"])
    if d["autor"]!=FROTA and n not in claim_frente:
        externos.append((n,d["autor"],reenviado)); continue
    if reenviado:
        ja_reenviados.append(n)
        if (ult.get(task) or {}).get("status") not in ("done",None):
            if not DRY:
                result("tick",task,"done",f"commit {d['commit_oid']} em {d['commit_em']} > review {d['cr_em']}",
                       f"PR #{n}: correcao enviada depois do pedido; aguarda re-review")
            fechados.append(n)
        continue
    if (ult.get(task) or {}).get("status")=="done":
        continue   # já fechado antes e sem CR nova
    # 01/09 (teste seco do próprio autor): o campo `frente` do claim é o TEMA (contabil, vault-assistant,
    # merge-queue…), não a frente que os construtores puxam. A 1ª execução criou 10 filas com UMA tarefa
    # cada e zero rows pré-existentes — filas que ninguém lê. Só entram nas filas com movimento real;
    # o resto vai para `revisao`, que é trabalho de triagem do coordenador (atribuir dono), não trabalho perdido.
    CANONICAS={"sustentacao","prontidao","funil","parcelas","salarios","deps"}
    _fr=claim_frente.get(n) or ""
    fr = _fr if _fr in CANONICAS else "revisao"
    q=f"{QD}/fila-{fr}.jsonl"
    h=horas(d["cr_em"])
    row={"task":task,"frente":fr,
         "resumo":(f"PR #{n} com alteracoes pedidas ha {h:.0f}h e SEM envio depois — responder e reenviar."
                   + ("" if fr!="revisao" else f" [TRIAGEM: sem frente canonica{' nem dono' if not claim_dono.get(n) else ''}; tema do claim: {_fr or 'nenhum'}]")
                   + f" {d['titulo']}"),
         "status":"fila","depende_de":[],"builder_sugerido":claim_dono.get(n,""),
         "prova":"","prioridade":0,"pr":n,"cr_em":d["cr_em"],"origem":"pr-cr-fila","derivado_em":NOW}
    por_fila.setdefault(q,[]).append(row)
    novos.append(n)

if not DRY:
    for q,rows_novas in por_fila.items():
        atuais=carrega(q)
        idx={r.get("task"):i for i,r in enumerate(atuais)}
        topo=[]
        for r in rows_novas:
            t=r["task"]
            if t in idx:                       # upsert: actualiza a idade/resumo, mantém o resto
                a=atuais[idx[t]]
                a["resumo"]=r["resumo"]; a["derivado_em"]=NOW
                if a.get("status") in ("done","bloqueada"): a["status"]="fila"
            else:
                topo.append(r)
        if topo:
            atuais=[r for r in atuais if r.get("task") not in {x["task"] for x in topo}]
            atuais=topo+atuais                 # TOPO = prioridade
        grava(q,atuais)

print(f"pr-cr-fila: {len(det)} PRs em CR · tarefas novas {len(novos)} {sorted(novos)} · "
      f"fechadas por reenvio {len(fechados)} {sorted(fechados)} · ja reenviados {len(ja_reenviados)} · "
      f"externos ignorados {len(externos)}" + (" [DRY]" if DRY else ""))
PY
