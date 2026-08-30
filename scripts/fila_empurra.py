#!/usr/bin/env python3
# núcleo do fila-empurra (ver fila-empurra.sh). --desfaz AI PAPEL TASK FRENTE devolve a tarefa à fila.
import sys,json,os,glob,fcntl,datetime
def load(q): return [json.loads(l) for l in open(q) if l.strip()]
def save(fh,rows):
    fh.seek(0); fh.truncate()
    for r in rows: fh.write(json.dumps(r,ensure_ascii=False)+"\n")
if sys.argv[1]=='--desfaz':
    AI,papel,task,fr=sys.argv[2:6]; q=f'{AI}/roadmap/filas/fila-{fr}.jsonl'
    with open(q,'r+') as fh:
        fcntl.flock(fh,fcntl.LOCK_EX); rows=load(q)
        for r in rows:
            if r.get('task')==task and r.get('puxada_por')==papel:
                r['status']='fila'; r.pop('puxada_por',None); r.pop('puxada_em',None); r.pop('empurrada',None)
        save(fh,rows)
    sys.exit(0)
DRY=('--dry' in sys.argv)
AI=[a for a in sys.argv[1:] if a!='--dry'][0]; now=datetime.datetime.now(datetime.timezone.utc)
reg=json.load(open(f'{AI}/terminais/registry.json'))['terminais']
P=os.path.expanduser('~/.claude/projects')
builders=[(p,t) for p,t in reg.items() if t.get('estado')=='aberto' and t.get('agent')=='claude' and t.get('tier') in (1,2)]
done=set()
rf=f'{AI}/roadmap/results.jsonl'
if os.path.exists(rf):
    for l in open(rf):
        try:
            e=json.loads(l)
            if e.get('status')=='done': done.add(e.get('task'))
        except: pass
filas=sorted(glob.glob(f'{AI}/roadmap/filas/fila-*.jsonl'))
out=[]
for papel,t in builders:
    sid=t.get('session_id') or ''
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
    if last is None or (now-last).total_seconds()<600: continue
    ativa=any(r.get('status')=='puxada' and r.get('puxada_por')==papel and r.get('task') not in done
              for q in filas for r in load(q))
    if ativa: continue
    pick=qpick=None
    for pref in (True,False):
        for q in filas:
            for r in load(q):
                if r.get('status')!='fila': continue
                if r.get('task') in done: continue   # rótulo velho: já tem RESULT done
                bs=(r.get('builder_sugerido') or '')
                if pref and papel not in bs: continue
                if not pref and bs and papel not in bs: continue
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
    msg=(f"TAREFA (tick/fila-empurra, sem coordenador): {pick['task']} [{fr}] — {pick.get('resumo','')[:170]}. "
         f"Prova: {(pick.get('prova') or 'ver programa')[:110]}. Já feita? regista e puxa outra. "
         f"FIM: bash ~/.claude/scripts/result.sh {papel} {pick['task']} done '<prova>' ; "
         f"DEPOIS: bash ~/.claude/scripts/fila-pull.sh {fr} {papel}")
    out.append((papel,msg[:580],pick['task'],fr))
for p,m,tk,fr in out[:5]: print(f"{p}\t{m}\t{tk}\t{fr}")
