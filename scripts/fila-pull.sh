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
# 31/08 (claude-8a; revisto COMANDO): "done" era substring sobre TODAS as linhas → Entrega reaberta (retracted/blocked depois) voltava a done. Agora: ÚLTIMO RESULT por task.
_ult={}; _ent={}
if os.path.exists(r):
    for l in open(r):
        try: e=json.loads(l); _ult[e.get("task")]=e.get("status"); _ent[e.get("task")]=e
        except Exception: pass
done={t for t,st in _ult.items() if st=="done"}
# 01/09 (rota do COMANDO, classe B — alinhamento com fila_empurra._pr_ok, familia E-23/#6417):
# done citando PR ainda ABERTO nao satisfaz dependencia. O empurra segurava as tasks e o pull
# oferecia-as (E-204 done citando #254 OPEN -> pull ofereceu E-207); a guarda so vale pelo
# consumidor mais fraco. Direcao do erro exigida na rota: FAIL-CLOSED — estado indeterminavel
# (gh falhou) NAO oferece. Sem numero citado -> sem rede, nada muda.
import subprocess
_frente=os.path.basename(q)[5:-6]; _merged_cache={}
def _repo_frente():
    try:
        _m=re.search(r'\brepo ((?:GitHub-raiz|GitHub-pessoal|GitHub|Projetos)/[A-Za-z0-9._-]+)',open(os.path.join(os.path.dirname(q),'..',f'{_frente}.md')).read(4000))
        if not _m: return None
        _url=subprocess.run(['git','-C',os.path.expanduser('~/Claude/'+_m.group(1)),'remote','get-url','origin'],capture_output=True,text=True,timeout=5).stdout.strip()
        _mm=re.search(r'github\.com[:/]([^/\s]+/[^/\s]+?)(?:\.git)?$',_url)
        return _mm.group(1) if _mm else None
    except Exception: return None
def _merged_of(repo):
    if repo not in _merged_cache:
        try: _merged_cache[repo]=set(json.loads(subprocess.run(['gh','pr','list','-R',repo,'--state','merged','--search','merged:>=2026-08-23','--json','number','--jq','[.[].number]','--limit','300'],capture_output=True,text=True,timeout=30).stdout or '[]'))
        except Exception: _merged_cache[repo]=None
    return _merged_cache[repo]
def dep_ok(t):
    e=_ent.get(t) or {}
    def _flat(v): return [str(x) for x in v] if isinstance(v,(list,tuple,set)) else [str(v)]
    nums={int(x) for src in (_flat(e.get('pr') or ''))+re.findall(r'#(\d{3,5})',str(e.get('nota',''))+' '+str(e.get('prova_cmd',''))) for x in re.split(r'[,\s;]+',str(src)) if x.isdigit()}
    if not nums: return True
    repos=['Raiz-Educacao-SA/raiz-data-engine']; rf=_repo_frente()
    if rf and rf not in repos: repos.append(rf)
    sets=[m for m in (_merged_of(x) for x in repos) if m is not None]
    if any(n in m for n in nums for m in sets): return True
    return False   # nao encontrado OU lista indeterminavel -> fail-closed
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
# 31/08: SALARIOS (papel novo) faltava aqui E na lista do filas-sync.sh:50 — DUAS listas hardcoded,
# em scripts diferentes, ambas a falhar FAIL-OPEN: sem o papel, executor()->"" -> donos()->set() ->
# `if dn and papel not in dn` nao filtra -> a E-60 (bloqueada, do SALARIOS) foi oferecida ao FUNIL.
# Popular o campo no filas-sync era necessario e NAO suficiente: o consumidor tem lista propria.
# Reparacao minima (P9). Estrutural por fazer: derivar PAPEIS do registry.json, que ja os tem.
# 01/09: derivado do registry (a "reparacao estrutural por fazer" que este proprio comentario pedia).
def _papeis():
    base={"DE-MIG","DE-DATA","DE-SYNC","DE-BUILD-B","FUNIL","DE-CODEX","FUNIL-WP4","SALARIOS","DE-COORD"}
    try:
        _r=json.load(open(os.path.expanduser("~/Claude/docs/ai-state/terminais/registry.json")))["terminais"]
        base|={k for k in _r if k}
    except Exception: pass
    return base
PAPEIS=_papeis()
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
    changed=False
    pick=None
    causas={"fora-da-janela":0,"dep-por-fechar":0,"pr-por-mergear":0,"de-outro-papel":0,"bloqueada-p-mim":0}
    for row in rows:
        if row.get("status")!="fila": continue
        # 31/08 00:3xZ: o empurra ja respeitava `fora_da_janela` (fila_empurra.py:112) e o pull nao —
        # E-30..E-34 continuavam puxaveis com a cadeia declarada fora do programa em parcelas.md:5.
        # O campo e DERIVADO pelo filas-sync a cada tick; e a unica representacao do facto.
        if row.get("fora_da_janela"): causas["fora-da-janela"]+=1; continue
        # 02/09 21:3xZ (auditoria das filas): em fila-decisao, `done` do DECISAO fecha a DECISAO; a row em fase=execucao
        # (abrir o PR no yaml, builder DE-COORD) NAO esta feita — o pull marcava-a done e tornava-a invisivel (7 DESP-*).
        if (row.get("task") or "") in done and not (row.get("fase")=="execucao" and ult_papel.get(row.get("task") or "")=="DECISAO"):
            row["status"]="done"; changed=True; continue   # reconcilia rótulo velho com results.jsonl
        # 30/08: o fila-empurra ja filtrava por builder_sugerido (fila_empurra.py:54-56) e o pull
        # nao filtrava nada — puxava a 1a elegivel fosse de quem fosse. Efeito medido: o FUNIL puxou
        # a E-10, que a linha do roadmap marca como DE-DATA, e teve de a devolver como blocked.
        # A frente NAO e o builder: fila-funil tem seccao do DE e seccao do consumidor.
        # So filtra quando o campo esta preenchido — tarefa sem sugestao continua a ser de quem chegar.
        tk=row.get("task") or ""; dn=donos(row.get("builder_sugerido") or "")
        if ult.get(tk) in ("blocked","failed") and (not dn or ult_papel.get(tk)==papel): causas["bloqueada-p-mim"]+=1; continue   # so nao se re-oferece a QUEM bloqueou
        if dn and papel not in dn: causas["de-outro-papel"]+=1; continue   # so quem pode iniciar (executor ou especificador) puxa
        deps=row.get("depende_de") or []
        if any(d not in done for d in deps): causas["dep-por-fechar"]+=1; continue
        if all(dep_ok(d) for d in deps): pick=row; break
        causas["pr-por-mergear"]+=1
    # 03/09 (ordem do dono: "precisa dar trabalho sempre que possivel"; diagnostico tier1 §4.2/§4.4 — 4 builders ociosos
    # 8-16% de ocupacao com 7 Entregas executaveis fora da janela por declaracao de 30/08). Dois passos EXTRA, so para
    # papel SEM NENHUMA puxada em fila nenhuma (quem tem trabalho em maos nao ganha mais):
    #   passo 2 "capacidade ociosa entra" (precedente: COMANDO 31/08 13:00Z, E-27, citando A22) — row PROPRIA `fora_da_janela`
    #            com dependencias fechadas; a row leva `entrou_por` para o leitor saber que entrou por capacidade, nao por plano.
    #   passo 3 "emprestimo" — row de OUTRO papel (nunca CR-/DESP-/D-: PR e decisao tem autor), dependencias fechadas, cujo dono
    #            esta ocupado (tem puxada) ou e' coordenador (tier 0); a row leva `emprestada_de`.
    entrou=None
    if not pick:
        import glob as _g3
        _pux={}
        for _q in _g3.glob(os.path.join(os.path.dirname(q),"fila-*.jsonl")):
            try:
                for _l in open(_q):
                    if not _l.strip(): continue
                    _r=json.loads(_l)
                    if _r.get("status")=="puxada" and _r.get("puxada_por"): _pux[_r["puxada_por"]]=_pux.get(_r["puxada_por"],0)+1
            except Exception: pass
        try: _tier={k:v.get("tier") for k,v in json.load(open(os.path.expanduser("~/Claude/docs/ai-state/terminais/registry.json")))["terminais"].items()}
        except Exception: _tier={}
        if _pux.get(papel,0)==0:
            for row in rows:
                if row.get("status")!="fila" or not row.get("fora_da_janela"): continue
                tk=row.get("task") or ""; dn=donos(row.get("builder_sugerido") or "")
                if ult.get(tk) in ("blocked","failed") and (not dn or ult_papel.get(tk)==papel): continue
                if dn and papel not in dn: continue
                deps=row.get("depende_de") or []
                if any(d not in done for d in deps) or not all(dep_ok(d) for d in deps): continue
                pick=row; entrou="capacidade-ociosa (A22; precedente E-27 31/08)"; break
        if _pux.get(papel,0)==0 and not pick:
            for row in rows:
                if row.get("status")!="fila" or row.get("fora_da_janela"): continue
                tk=row.get("task") or ""
                if re.match(r"^(CR|DESP|D)-",tk): continue
                dn=donos(row.get("builder_sugerido") or "")
                if not dn or papel in dn: continue
                if ult.get(tk) in ("blocked","failed"): continue
                deps=row.get("depende_de") or []
                if any(d not in done for d in deps) or not all(dep_ok(d) for d in deps): continue
                if all((_pux.get(d_,0)>0 or _tier.get(d_)==0) for d_ in dn):
                    pick=row; entrou="emprestimo:"+",".join(sorted(dn)); break
    outras={}
    for x in rows:
        st=x.get("status") or "?"
        if st!="fila": outras[st]=outras.get(st,0)+1
    extra="; fora da contagem: "+", ".join(f"{v} {k}" for k,v in sorted(outras.items())) if outras else ""
    def persist():
        fh.seek(0); fh.truncate()
        for row in rows: fh.write(json.dumps(row,ensure_ascii=False)+"\n")
    # achado do FUNIL (31/08): a reconciliacao "status=done" acima so sobrevivia no disco se,
    # NA MESMA invocacao, houvesse tambem uma tarefa elegivel pra puxar (o unico "fh.write" ficava
    # depois dos dois exits). Numa fila ja toda done -- o caso em que a reconciliacao era precisa --
    # ela era calculada em memoria e perdida. Custo medido: E-46 ficou "fila" no disco desde 02:11Z
    # apesar de done, e virou "executavel parada ha 8h30" no nome do FUNIL. Conserto: persistir
    # sempre que algum row mudou, EXCEPTO em --peek (peek nao deve mutar -- desenho correto, mantido).
    if peek=="--peek":
        if not pick:
            bloq=sum(1 for x in rows if x.get("status")=="fila")
            det=", ".join(f"{v} {k}" for k,v in causas.items() if v) or "0 razões contadas"
            print(f"FILA-VAZIA: nenhuma tarefa elegível em {os.path.basename(q)} ({bloq} na fila: {det}{extra})"); sys.exit(0)
        print("PRÓXIMA (peek"+(f", entrou_por={entrou}" if entrou else "")+"):", json.dumps(pick,ensure_ascii=False)[:400]); sys.exit(0)
    if not pick:
        if changed: persist()
        bloq=sum(1 for x in rows if x.get("status")=="fila")
        det=", ".join(f"{v} {k}" for k,v in causas.items() if v) or "0 razões contadas"
        print(f"FILA-VAZIA: nenhuma tarefa elegível em {os.path.basename(q)} ({bloq} na fila: {det}{extra})"); sys.exit(0)
    pick["status"]="puxada"; pick["puxada_por"]=papel; pick["puxada_em"]=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if entrou:
        pick["entrou_por"]=entrou
        if entrou.startswith("emprestimo:"): pick["emprestada_de"]=entrou.split(":",1)[1]
    persist()
    print("PUXADA:", json.dumps(pick,ensure_ascii=False)[:500])
    if entrou and entrou.startswith("emprestimo:"): print(f"EMPRESTADA de {pick['emprestada_de']}: avisa-o em 1 linha (leia fila-{_frente} {pick['task']}) — se ele discordar, regista anulado e devolve.")
    elif entrou: print("ENTROU POR CAPACIDADE OCIOSA (fora da janela declarada): regista no RESULT que entrou por capacidade; o COMANDO pode devolver a fila.")
    print(f"AO TERMINAR: bash ~/.claude/scripts/result.sh {papel} {pick['task']} done \"<prova_cmd>\" \"<nota>\" [PR]")
PY
