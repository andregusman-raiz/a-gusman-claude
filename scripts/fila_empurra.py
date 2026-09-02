#!/usr/bin/env python3
# núcleo do fila-empurra (ver fila-empurra.sh). --desfaz AI PAPEL TASK FRENTE devolve a tarefa à fila. --dry não muta.
# rev 2 (22:5xZ, dono: "todos os terminais pararam de novo"): DEFEITO da rev 1 — "tem tarefa puxada" contava como
# "a trabalhar"; puxadas acumulavam sem RESULT (builders mensageiam em vez de result.sh; blocked não libertava;
# PRONTA no .md não chegava ao jsonl) → todos pareciam ocupados → empurra nunca entregava nada. Agora:
#  (1) results: done → fila status done; blocked/failed → status 'bloqueada' (sai do elegível, não conta como ativa)
#  (2) ativa = puxada há < 120 min sem result. Builder ocioso ≥10 min com puxadas velhas → RELEMBRA a mais antiga
#      (1×/60 min por tarefa) em vez de fingir que está ocupado; sem puxada → entrega nova.
#  (3) linhas "Codex (R2) … dirigido por X" → executor = X (cbuild); sem X → DE-BUILD-B.
import sys,json,os,glob,fcntl,datetime,re
def load(q): return [json.loads(l) for l in open(q) if l.strip()]
def save(fh,rows):
    fh.seek(0); fh.truncate()
    for r in rows: fh.write(json.dumps(r,ensure_ascii=False)+"\n")
if sys.argv[1]=='--desfaz':
    AI,papel,task,fr=sys.argv[2:6]; q=f'{AI}/roadmap/filas/fila-{fr}.jsonl'
    with open(q,'r+') as fh:
        fcntl.flock(fh,fcntl.LOCK_EX); rows=load(q)
        for r in rows:
            if r.get('task')==task and r.get('puxada_por')==papel and r.get('empurrada'):
                r['status']='fila'; r.pop('puxada_por',None); r.pop('puxada_em',None); r.pop('empurrada',None)
        save(fh,rows)
    sys.exit(0)
DRY=('--dry' in sys.argv)   # NB: a RECONCILIACAO ledger->rows vive em 'if not DRY' — um teste com --dry NAO exercita esse caminho e da FALHA falsa (medido 01/09)
AI=[a for a in sys.argv[1:] if a!='--dry'][0]; now=datetime.datetime.now(datetime.timezone.utc)
reg=json.load(open(f'{AI}/terminais/registry.json'))['terminais']
P=os.path.expanduser('~/.claude/projects')
# 01/09 (ordem do dono): o critério era o TIER, que vem do número no nome da janela — o FGTS reabriu
# como '3 FGTS' e ficou sem receber tarefa nenhuma, apesar de ter fila própria e trabalho por fazer.
# Proxy a responder pela pergunta real: o que decide é EXECUTAR UM ROADMAP, e isso prova-se por ter
# fila própria — não por um dígito. Papéis satélite (sem fila) continuam de fora, como devem.
def _tem_fila(p,t):
    fr=(t.get('frente') or p).lower()
    return os.path.exists(f'{AI}/roadmap/filas/fila-{fr}.jsonl')
builders=[(p,t) for p,t in reg.items() if t.get('estado')=='aberto' and t.get('agent')=='claude' and (t.get('tier') in (1,2) or _tem_fila(p,t))]
# 01/09: `papeis` respondia a DUAS perguntas diferentes com a mesma lista — quem RECEBE empurrão
# (tier 1-2, que é `builders`) e quem pode ser NOMEADO executor de uma tarefa. O DE-COORD (tier 0)
# é o dono das tarefas de triagem de PR e não estava aqui: executor() devolvia '' e a 2ª passagem
# oferecia a tarefa a QUEM ESTIVESSE LIVRE — o contrário da regra (a verificação vai a quem depende).
# Reconhecer nome != receber trabalho: o empurra continua a despachar só para builders.
papeis={p for p in reg}
done=set(); ruim={}; ruim_ts={}; ult={}; hist={}
rf=f'{AI}/roadmap/results.jsonl'
if os.path.exists(rf):
    for l in open(rf):
        try:
            e=json.loads(l)
            if e.get('status')=='anulado': continue   # 01/09: registo retirado por engano de id — não é estado da tarefa
            ult[e.get('task')]=e   # o ÚLTIMO registro por task vale (retracted reabre)
            hist.setdefault(e.get('task'),[]).append(e)   # 01/09: histórico COMPLETO — para saber de QUEM era o done retractado
        except: pass
import subprocess,glob as _glob
_REPO_DE='Raiz-Educacao-SA/raiz-data-engine'; _merged_cache={}
def _merged_of(repo):
    if repo not in _merged_cache:
        try: _merged_cache[repo]=set(json.loads(subprocess.run(['gh','pr','list','-R',repo,'--state','merged','--search','merged:>=2026-08-23','--json','number','--jq','[.[].number]','--limit','300'],capture_output=True,text=True,timeout=60).stdout or '[]'))
        except Exception: _merged_cache[repo]=None
    return _merged_cache[repo]
_merged=_merged_of(_REPO_DE)
# 01/09 (FGTS reaberto; achado do handoff do terminal "2 FGTS"): a lista de merges era SÓ do Data Engine, logo um done
# de frente com repo próprio (fgts-platform #254, salarios-platform) nunca satisfazia dependência — E-205+ ficariam presas
# para sempre. Repo da frente lido do cabeçalho do programa ("repo <dir>"), resolvido pelo remote do dir; a verificação
# é na UNIÃO {repo da frente, DE} — nunca só na frente, para não regredir o funil, cujas Entregas citam PRs do DE.
_repo_frente={}
for _prog in _glob.glob(f'{AI}/roadmap/*.md'):
    try:
        _m=re.search(r'\brepo ((?:GitHub-raiz|GitHub-pessoal|GitHub|Projetos)/[A-Za-z0-9._-]+)',open(_prog).read(4000))
        if not _m: continue
        _url=subprocess.run(['git','-C',os.path.expanduser('~/Claude/'+_m.group(1)),'remote','get-url','origin'],capture_output=True,text=True,timeout=5).stdout.strip()
        _mm=re.search(r'github\.com[:/]([^/\s]+/[^/\s]+?)(?:\.git)?$',_url)
        if _mm and _mm.group(1)!=_REPO_DE: _repo_frente[os.path.basename(_prog)[:-3]]=_mm.group(1)
    except Exception: pass
_task_frente={}
for _q in _glob.glob(f'{AI}/roadmap/filas/fila-*.jsonl'):
    for _l in open(_q):
        try: _task_frente[json.loads(_l)['task']]=os.path.basename(_q)[5:-6]
        except Exception: pass
def _pr_ok(e):
    # done citando PR ainda ABERTO não satisfaz dependência (E-23 #6417 aberto → E-26 empurrada cedo demais, 31/08)
    _pr=e.get('pr'); nums={','.join(str(x) for x in _pr) if isinstance(_pr,(list,tuple,set)) else str(_pr or '').strip()}|set(re.findall(r'#(\d{4,5})',str(e.get('nota',''))+' '+str(e.get('prova_cmd',''))))
    # 2026-08-31T13:00:38Z: RESULT da E-2 gravou pr="6380,6407,6413,6429" (lista num campo escalar) e este int() crashava o empurra em
    # TODOS os ticks desde 02:15Z — com rc=0 no tick.log, logo ninguem viu. Tolerar lista; ignorar o que nao for numero.
    # rev2 (revisao DE-COORD): lista REAL (JSON array) virava "['6380', '6407']" no str(), zero digitos, nums vazio
    # -> `if not nums: return True` = dependencia satisfeita SEM verificar merge. Falhar aberto e pior que o crash.
    def _flat(v): return [str(x) for x in v] if isinstance(v,(list,tuple,set)) else [str(v)]
    nums={int(x) for n in nums for s in _flat(n) for x in re.split(r'[,\s;]+',s) if x.isdigit()}
    _rf=_repo_frente.get(_task_frente.get(e.get('task'),''))
    _mf=_merged_of(_rf) if _rf else None
    if not nums: return True
    # 01/09 (rota do COMANDO, classe B): FAIL-CLOSED — lista indeterminavel (gh falhou) NAO satisfaz.
    # Antes: `_merged is None -> True` (aberto), apesar do proprio comentario rev2 dizer que aberto e pior.
    _todos=(_merged or set())|(_mf or set())
    return any(n in _todos for n in nums)
# 31/08 18:5xZ (achado DE-COORD): o mesmo conjunto `done` respondia a DUAS perguntas — (a) "dependencia
# satisfeita?" (exigir PR merged: CERTO) e (b) "tarefa feita, nao re-oferecas" (exigir merged: ERRADO —
# E-53 done citando #6437 CONGELADO foi re-empurrada ao DE-MIG a cada tick, 17:57 e 18:43, sem convergir).
# Agora: done_result (RESULT basta) suprime re-oferta/relembrete/reconciliacao; done (com _pr_ok) so p/ deps.
done_result=set()
for t,e in ult.items():
    if e.get('status')=='done':
        done_result.add(t)
        if _pr_ok(e): done.add(t)
    elif e.get('status') in ('blocked','failed'): ruim[t]=(e.get('papel'), e.get('nota','')[:80]); ruim_ts[t]=e.get('ts','')
   # 30/08: guardar QUEM bloqueou — blocked de nao-dono nao e bloqueio, e devolucao
STp=os.path.expanduser('~/.claude/state/fila-empurra.json'); st=json.load(open(STp)) if os.path.exists(STp) else {}
lembr=st.get('lembretes',{})
filas=sorted(glob.glob(f'{AI}/roadmap/filas/fila-*.jsonl'))
# (1) reconciliar filas com results
if not DRY:
    for q in filas:
        with open(q,'r+') as fh:
            fcntl.flock(fh,fcntl.LOCK_EX); rows=load(q); ch=False
            for r in rows:
                # 02/09: em fila-decisao, `done` do DECISAO fecha a DECISAO, nao a EXECUCAO (row com fase=execucao e
                # builder DE-COORD). Reconciliar para done escondia PRs por abrir.
                if r['task'] in done_result and r.get('status')!='done' and not (r.get('fase')=='execucao' and (ult.get(r['task']) or {}).get('papel')=='DECISAO'):
                    r['status']='done'; ch=True
                # 02/09 (auditoria do dono; §5 do COMANDO): a reconciliacao so subia (fila->done) e nunca
                # descia. Medido: E-4 e E-94 `done` na row com `blocked` no ledger ha >24 h — e `done` na row
                # nao e' so rotulo, e' o que o BOARD e a leitura humana mostram como fechado. O contrato ja
                # existe ("o ultimo registo do ledger vale"); isto aplica-o na direccao que faltava, com a
                # mesma guarda do ramo de baixo: so quando o blocked e' POSTERIOR a puxada da row (um RESULT
                # anterior a puxada nao descreve o trabalho que a row representa).
                elif r.get('status')=='done' and r['task'] in ruim and not (r.get('puxada_em') and ruim_ts.get(r['task'],'') and ruim_ts[r['task']] < r['puxada_em']):
                    _p,_n=ruim[r['task']]
                    r['status']='bloqueada'; r['bloqueio']=_n; r['reconciliado_do_ledger']=ruim_ts.get(r['task'],''); ch=True
                elif r['task'] in ruim and r.get('status')=='puxada' and not (r.get('puxada_em') and ruim_ts.get(r['task'],'') and ruim_ts[r['task']] < r['puxada_em']):
                    # 01/09 (medido): E-201 foi devolvida por DE-BUILD-B às 16:13 (encaminhamento errado) e puxada
                    # pelo FGTS às 16:3x; a devolução ANTIGA ia desfazer a puxada NOVA. Um RESULT anterior à
                    # puxada não descreve a puxada — só conta o que veio depois dela.
                    _p,_n=ruim[r['task']]
                    if _p and r.get('puxada_por') and _p!=r.get('puxada_por'): r['status']='fila'; r.pop('puxada_por',None); r['devolvida']=f'blocked por {_p}, que nao a puxou'
                    else: r['status']='bloqueada'; r['bloqueio']=_n
                    ch=True
                elif ult.get(r['task'],{}).get('status')=='invalidada' and r.get('status')=='done':
                    r['status']='fila'; ch=True   # 01/09: veredicto de verificador (critério objetivo) reabre sem guard de autoria
                elif ult.get(r['task'],{}).get('status')=='retracted' and r.get('status')=='done':
                    # 01/09 (achado do COMANDO, medido no efeito): a condição não olhava DE QUEM era a
                    # retractação. O SALARIOS cunhou E-75 sem saber que o número já era uma Entrega do
                    # FUNIL fechada na véspera; ao retractar o SEU registo errado, a linha FECHADA do
                    # FUNIL foi reaberta e ficou disponível para o tick lha empurrar como trabalho novo.
                    # Só se recuperou porque alguém avisou o prejudicado — recuperação que depende de
                    # aviso não é recuperação. Invariante: só quem escreveu o `done` o pode retractar.
                    # Excepção MEDIDA (não suposta): das 7 retractações do ledger, 2 são cruzadas e uma
                    # delas é legítima — retractar um `done` de origem automática (semeadura/tick) é
                    # corrigir o programa, não o trabalho de outro papel. Essa continua a reabrir.
                    _r=ult.get(r['task'],{}); _quem=_r.get('papel') or ''
                    _dono_done=''
                    for _a in reversed(hist.get(r['task'],[])):
                        if _a.get('status')=='done': _dono_done=_a.get('papel') or ''; break
                    if _quem==_dono_done or _dono_done in ('','seed','tick'):
                        r['status']='fila'; ch=True
                    elif r.get('conflito_retractacao') != f"{_quem}!={_dono_done}":
                        # não reabre — e deixa rasto no ficheiro, porque não reabrir em silêncio é a
                        # mesma família do defeito: uma decisão que ninguém consegue ver.
                        r['conflito_retractacao']=f"{_quem}!={_dono_done}"; r['conflito_em']=_r.get('ts',''); ch=True
                elif ult.get(r['task'],{}).get('status')=='retracted' and r.get('status')=='bloqueada':
                    # 01/09 (achado do COMANDO, consequencia medida no SALARIOS): a retractacao de um blocked
                    # ERRADO chegava ao ledger e NUNCA a row — o mapa _st do filas-sync so se aplica a row NOVA
                    # e nenhum ramo aqui olhava para row 'bloqueada'. 'bloqueada' era pegajoso: nada que o papel
                    # escrevesse o revertia, e a fila lia-se vazia sobre trabalho dele. Guard de autoria igual ao
                    # ramo de cima: so quem escreveu o blocked/failed (ou origem automatica) o reabre ao retractar.
                    _r=ult.get(r['task'],{}); _quem=_r.get('papel') or ''
                    _dono_blk=''
                    for _a in reversed(hist.get(r['task'],[])):
                        if _a.get('status') in ('blocked','failed'): _dono_blk=_a.get('papel') or ''; break
                    if _quem==_dono_blk or _dono_blk in ('','seed','tick'):
                        r['status']='fila'; r.pop('bloqueio',None); ch=True
                    elif r.get('conflito_retractacao') != f"{_quem}!={_dono_blk}":
                        r['conflito_retractacao']=f"{_quem}!={_dono_blk}"; r['conflito_em']=_r.get('ts',''); ch=True
            if ch: save(fh,rows)
def donos(bs):
    # 01/09 (FUNIL, ordem do dono "entenda pq nao recebo empurra e corrija"): este resolvedor era a
    # versao PRE-correcao do que o fila-pull.sh ja consertou em 30/08 (substring -> word-boundary;
    # "revisa DE-DATA" fazia o REVISOR virar executor) e 01/09 (donos = executor + ESPECIFICADORES:
    # "quem pode INICIAR"). Duas copias do mesmo predicado, uma corrigida e a outra nao — mesma
    # familia do caso SALARIOS documentado no proprio fila-pull.sh:30-36. Efeito medido com a row
    # real da E-12b ("Codex (R2); especifica FUNIL/spec; revisa DE-DATA"): executor() devolvia
    # DE-BUILD-B e a tarefa NUNCA seria oferecida ao FUNIL, que e quem escreve a SPEC sem a qual o
    # build nao arranca — "trabalho do papel que o mecanismo nao sabia mostrar", por construcao.
    # Espelho de fila-pull.sh::donos(); se mudar la, mudar aqui (estrutural por fazer: 1 fonte so).
    bs=bs or ''; d=set()
    if 'Codex' in bs:
        m=re.search(r'dirigid[oa] por ([A-Z][A-Z-]+)',bs)
        d.add(m.group(1) if m and m.group(1) in papeis else 'DE-BUILD-B')
    else:
        for p_ in sorted(papeis):   # sorted: iterar set era nao-deterministico com 2+ papeis na string
            if re.search(r'\b'+re.escape(p_)+r'\b',bs): d.add(p_); break
    for m in re.finditer(r'especifica[m]?\s+([A-Z][A-Z-]+)',bs):
        if m.group(1) in papeis: d.add(m.group(1))
    return d   # vazio = sem sugestão
def idle_min(sid):
    last=None
    for f in glob.glob(f'{P}/*/{sid}*.jsonl'):
        try:
            with open(f,'rb') as fh:
                fh.seek(0,2); sz=fh.tell(); fh.seek(max(0,sz-120000)); tail=fh.read().decode('utf-8','ignore')
            i=tail.rfind('"timestamp":"')
            if i>0:
                d=datetime.datetime.strptime(tail[i+13:i+32],'%Y-%m-%dT%H:%M:%S').replace(tzinfo=datetime.timezone.utc)
                if not last or d>last: last=d
        except Exception: pass
    return 10**6 if last is None else (now-last).total_seconds()/60
out=[]
for papel,t in builders:
    if idle_min(t.get('session_id') or '')<10: continue
    # puxadas deste papel (sem result)
    mine=[]
    for q in filas:
        for r in load(q):
            if r.get('status')=='puxada' and r.get('puxada_por')==papel and r['task'] not in done_result and r['task'] not in ruim:
                try: age=(now-datetime.datetime.fromisoformat(r.get('puxada_em','').replace('Z','+00:00'))).total_seconds()/60
                except Exception: age=10**6
                mine.append((age,r,q))
    # ocioso ≥10 min = parado, independentemente da idade da puxada (sessão parada não avança tarefa nenhuma)
    if mine:
        # (2) ocioso com puxadas velhas: relembra a mais antiga, 1×/60 min por tarefa
        mine.sort(key=lambda m:-m[0]); age,r,q=mine[0]
        k=f"{papel}|{r['task']}"; lt=lembr.get(k,0)
        if now.timestamp()-lt<3600: continue
        lembr[k]=now.timestamp()
        fr=os.path.basename(q)[5:-6]
        msg=(f"LEMBRETE (tick/fila-empurra): tens {len(mine)} tarefa(s) puxada(s) sem RESULT há {int(age)} min — a mais antiga: {r['task']} [{fr}] {r.get('resumo','')[:120]}. "
             f"Continua, ou regista: bash ~/.claude/scripts/result.sh {papel} {r['task']} done|blocked '<prova/motivo>' — só depois puxa outra.")
        out.append((papel,msg[:580],r['task'],fr)); continue
    # (3) sem puxada: entrega nova
    pick=qpick=None
    # 01/09 (revisão do COMANDO ao pr-cr-fila): a posição no ficheiro só dá prioridade DENTRO da fila —
    # `filas` é alfabético, logo uma row prioritária no topo de fila-sustentacao perdia para qualquer
    # elegível em fila-funil. O dono pediu prioridade GLOBAL ("aprovar o que já foi construído vem
    # antes de construir mais"), por isso o nível de prioridade envolve o ciclo todo: primeiro as rows
    # com prioridade 0 (hoje: PR com alterações pedidas), em todas as filas; só depois o resto.
    for prio_only in (True,False):
      for pref in (True,False):
        for q in filas:
            for r in load(q):
                if r.get('status')!='fila' or r.get('task') in done_result or r.get('task') in ruim or r.get('fora_da_janela'): continue
                if prio_only and r.get('prioridade')!=0: continue
                dn=donos(r.get('builder_sugerido'))
                if pref and papel not in dn: continue
                if not pref and dn: continue
                if all(d in done for d in (r.get('depende_de') or [])): pick,qpick=r,q; break
            if pick: break
        if pick: break
      if pick: break
    if not pick: continue
    if not DRY:
        with open(qpick,'r+') as fh:
            fcntl.flock(fh,fcntl.LOCK_EX); rows=load(qpick)
            for r in rows:
                if r.get('task')==pick['task'] and r.get('status')=='fila':
                    r['status']='puxada'; r['puxada_por']=papel; r['puxada_em']=now.strftime('%Y-%m-%dT%H:%M:%SZ'); r['empurrada']=True
            save(fh,rows)
    fr=os.path.basename(qpick)[5:-6]
    cod=' (via cbuild/Codex — tu diriges)' if 'Codex' in (pick.get('builder_sugerido') or '') else ''
    msg=(f"TAREFA (tick/fila-empurra, sem coordenador): {pick['task']} [{fr}]{cod} — {pick.get('resumo','')[:160]}. "
         f"Prova: {(pick.get('prova') or 'ver programa')[:100]}. Já feita? regista e puxa outra. "
         f"FIM: bash ~/.claude/scripts/result.sh {papel} {pick['task']} done '<prova>' ; DEPOIS: bash ~/.claude/scripts/fila-pull.sh {fr} {papel}")
    out.append((papel,msg[:580],pick['task'],fr))
# ---------- 02/09 (ordem do dono): dois sinais que ate hoje so o COMANDO fazia a mao ----------
# (N4) FILA VAZIA != PROGRAMA CUMPRIDO: uma fila sem nada em 'fila' nem 'puxada' avisa o coordenador da frente
#      1x/24h — "cunhar ou declarar concluida". Medido: salarios com 0 puxaveis e 26 itens em aberto no programa.
# (P1) ROW BLOQUEADA A CITAR DECISAO JA TOMADA: a decisao saiu do console e a row ficou presa (7 rows, uma ha 133 h).
#      Avisa o AUTOR do blocked 1x/12h; a partir de 48 h copia o COMANDO. Levantar continua a ser ato do autor.
_vaz=st.get('vazias',{}); _dpres=st.get('decididas_presas',{})
def _coord(fr):
    try:
        head=open(f'{AI}/roadmap/{fr}.md',errors='replace').read(3000)
        m=re.search(r'\brepo ((?:GitHub-raiz|GitHub-pessoal|GitHub|Projetos)/[A-Za-z0-9._-]+)',head)
        if m and 'raiz-data-engine' in m.group(1): return 'DE-COORD'
        if m: return 'COMANDO'
    except Exception: pass
    return 'DE-COORD' if fr in ('parcelas','prontidao','sustentacao','revisao','deps') else 'COMANDO'
try:
    _dj=json.load(open(f'{AI}/terminais/decisoes.json')); _decs=_dj.get('decisoes',_dj)
    _decs=list(_decs.values()) if isinstance(_decs,dict) else (_decs or [])
    _byid={d.get('id'):d for d in _decs if isinstance(d,dict)}
except Exception: _byid={}
for q in filas:
    fr=os.path.basename(q)[5:-6]; rows=load(q)
    if fr in ('decisao',): continue
    if rows and not any(r.get('status') in ('fila','puxada') for r in rows):
        if now.timestamp()-_vaz.get(fr,0)>=86400:
            _vaz[fr]=now.timestamp(); _c=_coord(fr)
            out.append((_c,f"tick/fila-empurra: fila-{fr} SEM trabalho enfileirado ({sum(1 for r in rows if r.get('status')=='done')} done, {sum(1 for r in rows if r.get('status')=='bloqueada')} bloqueadas). Fila vazia nao e programa cumprido: confere roadmap/{fr}.md — cunha o que falta ou declara concluida.",f"fila-{fr}-vazia",fr))
    for r in rows:
        if r.get('status')!='bloqueada': continue
        txt=str(r.get('bloqueio') or '')+' '+str(r.get('nota_comando') or '')
        for did in sorted(set(re.findall(r'D-\d+',txt))):
            d=_byid.get(did) or {}
            if not d.get('decidida_em'): continue
            try: h=(now-datetime.datetime.fromisoformat(str(d['decidida_em']).replace('Z','+00:00'))).total_seconds()/3600
            except Exception: continue
            if h<24: continue
            autor=(ult.get(r.get('task'),{}) or {}).get('papel') or r.get('puxada_por') or r.get('builder_sugerido') or ''
            if not autor or autor=='tick': continue
            k=f"{r.get('task')}|{did}|{autor}"
            if now.timestamp()-_dpres.get(k,0)<43200: continue
            _dpres[k]=now.timestamp()
            m=f"tick/fila-empurra: {r.get('task')} [{fr}] continua bloqueada a citar {did}, DECIDIDA ha {int(h)} h ({str(d.get('decisao') or '')[:80]}). So o autor levanta: regista RESULT novo (posto/done) ou re-bloqueia com motivo NOVO."
            out.append((autor,m,r.get('task'),fr))
            if h>=48: out.append(('COMANDO',f"tick/fila-empurra: {r.get('task')} [{fr}] bloqueada ha {int(h)} h a citar {did} ja decidida; autor {autor} avisado; sem RESULT novo — cobra.",r.get('task'),fr))
st['vazias']=_vaz; st['decididas_presas']=_dpres
if not DRY:
    st['lembretes']=lembr; json.dump(st,open(STp,'w'))
for p,m,tk,fr in out[:6]: print(f"{p}\t{m}\t{tk}\t{fr}")
