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
DRY=('--dry' in sys.argv)
AI=[a for a in sys.argv[1:] if a!='--dry'][0]; now=datetime.datetime.now(datetime.timezone.utc)
reg=json.load(open(f'{AI}/terminais/registry.json'))['terminais']
P=os.path.expanduser('~/.claude/projects')
builders=[(p,t) for p,t in reg.items() if t.get('estado')=='aberto' and t.get('agent')=='claude' and t.get('tier') in (1,2)]
papeis={p for p,_ in builders}
done=set(); ruim={}; ult={}
rf=f'{AI}/roadmap/results.jsonl'
if os.path.exists(rf):
    for l in open(rf):
        try: e=json.loads(l); ult[e.get('task')]=e   # o ÚLTIMO registro por task vale (retracted reabre)
        except: pass
for t,e in ult.items():
    if e.get('status')=='done': done.add(t)
    elif e.get('status') in ('blocked','failed'): ruim[t]=(e.get('papel'), e.get('nota','')[:80])   # 30/08: guardar QUEM bloqueou — blocked de nao-dono nao e bloqueio, e devolucao
STp=os.path.expanduser('~/.claude/state/fila-empurra.json'); st=json.load(open(STp)) if os.path.exists(STp) else {}
lembr=st.get('lembretes',{})
filas=sorted(glob.glob(f'{AI}/roadmap/filas/fila-*.jsonl'))
# (1) reconciliar filas com results
if not DRY:
    for q in filas:
        with open(q,'r+') as fh:
            fcntl.flock(fh,fcntl.LOCK_EX); rows=load(q); ch=False
            for r in rows:
                if r['task'] in done and r.get('status')!='done': r['status']='done'; ch=True
                elif r['task'] in ruim and r.get('status')=='puxada':
                    _p,_n=ruim[r['task']]
                    if _p and r.get('puxada_por') and _p!=r.get('puxada_por'): r['status']='fila'; r.pop('puxada_por',None); r['devolvida']=f'blocked por {_p}, que nao a puxou'
                    else: r['status']='bloqueada'; r['bloqueio']=_n
                    ch=True
                elif ult.get(r['task'],{}).get('status')=='retracted' and r.get('status')=='done': r['status']='fila'; ch=True
            if ch: save(fh,rows)
def executor(bs):
    bs=bs or ''
    if 'Codex' in bs:
        m=re.search(r'dirigid[oa] por ([A-Z][A-Z-]+)',bs); return m.group(1) if m and m.group(1) in papeis else 'DE-BUILD-B'
    for p in papeis:
        if p in bs: return p
    return ''   # sem sugestão
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
            if r.get('status')=='puxada' and r.get('puxada_por')==papel and r['task'] not in done and r['task'] not in ruim:
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
    for pref in (True,False):
        for q in filas:
            for r in load(q):
                if r.get('status')!='fila' or r.get('task') in done or r.get('task') in ruim: continue
                ex=executor(r.get('builder_sugerido'))
                if pref and ex!=papel: continue
                if not pref and ex: continue
                if all(d in done for d in (r.get('depende_de') or [])): pick,qpick=r,q; break
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
if not DRY:
    st['lembretes']=lembr; json.dump(st,open(STp,'w'))
for p,m,tk,fr in out[:6]: print(f"{p}\t{m}\t{tk}\t{fr}")
