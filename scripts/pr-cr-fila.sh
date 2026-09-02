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
    crs_s=sorted(crs,key=lambda r:r.get("submittedAt",""))
    cr=crs_s[-1]
    # 02/09 (auditoria do RESUMO): o bot re-publica CHANGES_REQUESTED a cada ~45 min (#6340: 8 CRs num dia) e
    # cada uma invalidava o done e re-oferecia a tarefa. CR nova com o MESMO corpo (normalizado: sem digitos/
    # espacos) da anterior nao e' trabalho novo — e' o ciclo do bot; fica registado, nao reabre.
    import re as _re
    def _norm(b): return _re.sub(r'[\d\s]+','',str(b or ''))[:2000]
    # Medido (4 PRs): o corpo da CR repetida do bot QUASE nunca e' igual (re-escreve a prosa). O criterio
    # que discrimina e' o FACTO: houve commit entre a CR anterior e esta? Sem commit, o bot so' repetiu.
    _cms_between = [c for c in d.get("commits",[]) if len(crs_s)>=2 and crs_s[-2].get("submittedAt","") < (c.get("committedDate") or "") <= cr.get("submittedAt","")]
    cr_igual = len(crs_s)>=2 and (not _cms_between or _norm(cr.get("body"))==_norm(crs_s[-2].get("body")))
    cms=sorted(d.get("commits",[]),key=lambda c:c.get("committedDate",""))
    last=cms[-1] if cms else {}
    out.append({"pr":n,"autor":(p.get("author") or {}).get("login",""),
                "titulo":(p.get("title") or "")[:120],
                "cr_em":cr.get("submittedAt",""),"cr_por":(cr.get("author") or {}).get("login",""),"cr_igual":cr_igual,
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

# 01/09 (medido no teste): o campo `papel` do claim traz às vezes SENTINELAS em prosa — "(sem dono
# declarado)" — que são texto e passam como se fossem papel. executor() não os reconhece, devolve "",
# e a 2ª passagem do empurra oferece a tarefa a QUEM ESTIVER LIVRE. Só vale papel que EXISTE no registry.
try:
    _reg=json.load(open(f"{AI}/terminais/registry.json"))["terminais"]
    _PAPEIS={k for k in _reg if k}
except Exception:
    _PAPEIS={"DE-MIG","DE-DATA","DE-SYNC","DE-BUILD-B","FUNIL","SALARIOS","DE-COORD"}
claim_dono={k:(v if v in _PAPEIS else "") for k,v in claim_dono.items()}

ult={}; hist={}
if os.path.exists(RES):
    for l in open(RES):
        try:
            e=json.loads(l)
            if e.get("status")=="anulado": continue
            ult[e.get("task")]=e; hist.setdefault(e.get("task"),[]).append(e)
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

novos=[]; fechados=[]; externos=[]; ja_reenviados=[]; obsoletas=[]

# 01/09 (revisão do COMANDO, ponto c): se o PR mergear/fechar enquanto a tarefa está PUXADA, ela fica
# puxada para sempre e o fila-empurra lembra o papel 1×/60min sobre trabalho que já não existe — um
# lembrete periódico de uma coisa morta ensina a frota a ignorar lembretes. Fecho por evento:
# task CR-<n> cuja PR já não está aberta → RESULT done com o estado real como prova, e a row sai.
_abertos={d["pr"] for d in det}
import subprocess
for q in glob.glob(f"{QD}/fila-*.jsonl"):
    rows=carrega(q); mudou=False; manter=[]
    for r in rows:
        t=r.get("task","")
        if r.get("origem")!="pr-cr-fila" or not t.startswith("CR-"): manter.append(r); continue
        n=int(t[3:])
        if n in _abertos: manter.append(r); continue
        estado=""
        try:
            estado=json.loads(subprocess.run(["gh","pr","view",str(n),"-R",os.environ["REPO"],"--json","state"],
                              capture_output=True,text=True,timeout=40).stdout or "{}").get("state","")
        except Exception:
            manter.append(r); continue          # falha de rede: NÃO apagar (ausência não é prova)
        if estado in ("MERGED","CLOSED"):
            if (ult.get(t) or {}).get("status")!="done" and not DRY:
                result("tick",t,"done",f"gh pr view {n} --json state = {estado}",
                       f"PR #{n} {estado}: tarefa de correcao deixou de ter objecto")
            obsoletas.append(n); mudou=True
        elif estado:
            manter.append(r)                     # voltou a aberto sem CR: fica, o proximo ciclo decide
        else:
            manter.append(r)
    if mudou and not DRY: grava(q,manter)
por_fila={}   # fila -> lista de rows a inserir no topo

for d in det:
    n=d["pr"]; task=f"CR-{n}"
    reenviado = bool(d["commit_em"] and d["cr_em"] and d["commit_em"] > d["cr_em"])
    if d["autor"]!=FROTA and n not in claim_frente:
        externos.append((n,d["autor"],reenviado)); continue
    if reenviado:
        ja_reenviados.append(n)
        # 02/09 (auditoria do RESUMO): o tick escrevia `done` por cima do `blocked` do builder sem facto novo —
        # e 27-48 min depois invalidava o proprio done, a row voltava a fila, o empurra re-oferecia, o builder
        # bloqueava de novo em 1-2 min (CR-6340: 9 ciclos/9 turnos de LLM em 6 h, zero progresso). Um `done`
        # do tick por cima de um `blocked` so' e' legitimo se houver commit POSTERIOR ao blocked.
        _u=ult.get(task) or {}
        _bloq_sem_facto_novo = _u.get("status") in ("blocked","failed") and str(d.get("commit_em") or "") <= str(_u.get("ts") or "")
        if _u.get("status") not in ("done",None) and not _bloq_sem_facto_novo:
            if not DRY:
                result("tick",task,"done",f"commit {d['commit_oid']} em {d['commit_em']} > review {d['cr_em']}",
                       f"PR #{n}: correcao enviada depois do pedido; aguarda re-review")
            fechados.append(n)
        continue
    # 01/09 15:5xZ (medido): 4 tarefas foram fechadas com `done` pelos papéis SEM que houvesse envio
    # depois da review — três delas sem nota nenhuma. O papel respondeu por comentário e deu por feito,
    # mas o portão do bot só reabre com push: o PR continua parado e a tarefa nunca mais era recriada,
    # porque o `done` a suprimia para sempre. `done` declarado não é efeito no mundo: o critério
    # objetivo (envio posterior à CR) é que fecha. Reabre, com o motivo escrito e contado.
    _u=(ult.get(task) or {})
    if _u.get("status")=="done":
        # 01/09 16:5xZ (medido): reabrir SÓ a row não chegava — o ledger continuava a dizer `done`, e tanto
        # o fila-pull como o empurra derivam estado do ÚLTIMO RESULT: no ciclo seguinte marcavam a row done
        # outra vez. A reabertura era desfeita em 10 min e as 4 tarefas ficaram invisíveis a todos.
        # O tick regista `invalidada` (status PRÓPRIO de verificador, decisão COMANDO 01/09 17:0xZ): `retracted`
        # significa 'o autor retira porque a prova caiu' e aqui o autor não retirou nada — um verificador viu
        # uma condição objetiva. Com `retracted`, as contagens de retractação por papel ficavam poluídas.
        _n_reab=sum(1 for _h in hist.get(task,[]) if _h.get("status") in ("retracted","invalidada") and _h.get("papel")=="tick")+1
        if d.get("cr_igual"):
            _ja=any(d["cr_em"] in str(_h.get("prova") or "") for _h in hist.get(task,[]))
            if not _ja and not DRY:
                result("tick",task,"done",f"CR {d['cr_em']} do bot e' identica a anterior (corpo normalizado)",
                       f"PR #{n}: bot repetiu a mesma CR sem push novo — ciclo do bot, nao trabalho novo; precisa de humano/dismiss (D-034/D-138)")
            continue
        d["_reaberta"]=(_n_reab, _u.get("ts",""), _u.get("papel",""))
        if not DRY:
            result("tick",task,"invalidada",f"gh pr view {n}: ultimo commit {d['commit_em'] or '-'} <= review {d['cr_em']}",
                   f"done de {_u.get('papel')} @{_u.get('ts','')[11:16]} sem envio depois da review — o bot so re-avalia com push (reabertura {_n_reab}x)")
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
         "resumo":((f"REABERTA ({d['_reaberta'][0]}x): {d['_reaberta'][2]} registou done as {d['_reaberta'][1][11:16]} mas NAO houve envio depois da review — o bot so re-avalia com PUSH. " if d.get("_reaberta") else "")
                   + f"PR #{n} com alteracoes pedidas ha {h:.0f}h e SEM envio depois — responder e reenviar."
                   + ("" if fr!="revisao" else f" [TRIAGEM: sem frente canonica{' nem dono' if not claim_dono.get(n) else ''}; tema do claim: {_fr or 'nenhum'}]")
                   + f" {d['titulo']}"),
         # 01/09 (revisão do COMANDO, lendo o fila_empurra): builder_sugerido VAZIO não deixa a tarefa
         # inerte — o ciclo `for pref in (True,False)` oferece-a na 2ª passagem a QUEM ESTIVER OCIOSO.
         # Isso é pior que ficar parada: uma CR sobre um PR alheio cai em cima de quem calhou estar
         # livre, e a lição de hoje é a inversa (a verificação vai a quem DEPENDE). Sem dono no claim,
         # o dono é o coordenador da fila de PRs — atribuir é a função dele, não é inventar responsável.
         "status":"fila","depende_de":[],"builder_sugerido":(claim_dono.get(n) or "DE-COORD"),
         "prova":"","prioridade":0,"pr":n,"cr_em":d["cr_em"],"origem":"pr-cr-fila","derivado_em":NOW,
         "reaberturas":(d["_reaberta"][0] if d.get("_reaberta") else 0)}
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
                a["prioridade"]=0
                a["reaberturas"]=r.get("reaberturas",0)   # senão o contador ficava preso em 1x
                # rows antigas sem dono -> 2ª passagem do empurra as dava a quem estivesse livre.
                # "sem dono" inclui SENTINELA em prosa ("(sem dono declarado)"), que não é vazio mas também não é papel.
                if a.get("builder_sugerido") not in _PAPEIS: a["builder_sugerido"]=r["builder_sugerido"]
                # 01/09 (sequencia medida pelo COMANDO: 7 rows CR classificadas 'bloqueada' com bloqueio
                # preenchido voltavam a 'fila' a cada tick, bloqueio INTACTO — "a explicacao sobrevive e a
                # consequencia nao"; o filas-sync reportava re-derivadas 0 e estava inocente, o autor era esta
                # linha). 'bloqueada' com razao medida e classificacao do coordenador: o upsert NAO a desfaz.
                # Reabrir bloqueada tem UM caminho sancionado: retractacao do proprio autor no ledger
                # (reconciler do empurra, 7d7cd60). 'done' continua a reabrir aqui (CR vivo sem push posterior).
                if a.get("status")=="done": a["status"]="fila"
            else:
                topo.append(r)
        if topo:
            atuais=[r for r in atuais if r.get("task") not in {x["task"] for x in topo}]
            atuais=topo+atuais                 # TOPO = prioridade
        grava(q,atuais)

print(f"pr-cr-fila: obsoletas fechadas {len(obsoletas)} {sorted(obsoletas)} · {len(det)} PRs em CR · tarefas novas {len(novos)} {sorted(novos)} · "
      f"fechadas por reenvio {len(fechados)} {sorted(fechados)} · ja reenviados {len(ja_reenviados)} · "
      f"externos ignorados {len(externos)}" + (" [DRY]" if DRY else ""))
PY
