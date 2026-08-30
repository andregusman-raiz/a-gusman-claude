#!/usr/bin/env bash
# comunicacao-obrigatoria.sh — cruza EVENTOS obrigatórios (artefactos) × LEDGER de mensagens (send.log + msg-ledger.jsonl).
# DOR (30/08): "necessário" não estava em lado nenhum mecânico — ninguém sabia o que faltou subir/descer (26 "não chegou"/dia).
# Regra: evento no artefacto sem mensagem que cite o seu id ao destino obrigatório em GRACE min = EM FALTA (linha no board + DIAG).
# Saída: docs/ai-state/terminais/COMUNICACAO-EM-FALTA.md (derivado, reescrito a cada tick). Sem LLM. Janela: 24 h.
set -uo pipefail
python3 - "${GRACE_MIN:-15}" <<'PY'
import json,os,re,sys,glob,subprocess,datetime as dt
GRACE=int(sys.argv[1]); AI=os.path.expanduser('~/Claude/docs/ai-state'); T=f'{AI}/terminais'
now=dt.datetime.now(dt.timezone.utc); since=now-dt.timedelta(hours=24)
def P(s):
    s=s.replace('Z','+00:00'); return dt.datetime.fromisoformat(s[:26]+s[26:] if '.' in s else s)
# ---- ledger unificado: (ts, from, to, texto) ----
msgs=[]
for l in open(f'{T}/send.log',errors='ignore'):
    m=re.match(r'(\S+) \S+ from=([A-Z-]+) to=([A-Z-]+) [^:]*:: (.*)',l)
    if m and m.group(1)>=since.strftime('%Y-%m-%dT%H:%M:%SZ'): msgs.append((P(m.group(1)),m.group(2),m.group(3),m.group(4)))
if os.path.exists(f'{T}/msg-ledger.jsonl'):
    for l in open(f'{T}/msg-ledger.jsonl'):
        try: e=json.loads(l)
        except: continue
        if e['ts']>=since.isoformat(): msgs.append((P(e['ts']),e['from'],e['to'],e.get('preview','')))
def ok(ts,dest,pat):
    lim=ts+dt.timedelta(minutes=GRACE); rx=re.compile(pat,re.I)
    for mt,f,t,x in msgs:
        if ts-dt.timedelta(minutes=2)<=mt<=lim and (dest=='*' or t in dest) and rx.search(x): return f'{f}→{t} {mt.strftime("%H:%M")}Z'
    return None
ev=[]  # (ts, evento, destino, padrao)
pr_owner={}
try:
    c=json.load(open(f'{AI}/de-pr-queue/claims.json')); c=c.get('claims',c); c=c if isinstance(c,list) else list(c.values())
    for i in c:
        if isinstance(i,dict) and i.get('pr') and i.get('owner'): pr_owner[int(i['pr'])]=i['owner']
except Exception: pass
def prdest(n): return {pr_owner[n]} if n in pr_owner else '*'
# 1) decisões abertas → COMANDO ; decididas → origem
try:
    for d in json.load(open(f'{T}/decisoes.json')):
        a=d.get('aberta_em'); 
        if a and P(a)>=since and d.get('origem')!='COMANDO': ev.append((P(a),f"{d['id']} aberta ({d.get('classe','?')}) por {d.get('origem')}",{'COMANDO'},re.escape(d['id'])))
        de=d.get('decidida_em')
        if de and P(de)>=since and d.get('origem') and d.get('origem')!='COMANDO': ev.append((P(de),f"{d['id']} decidida",{d['origem']},re.escape(d['id'])))
except Exception as e: ev.append((now,f'decisoes.json ilegível: {e}',{'COMANDO'},'$^'))
# 2) PRs: abertos / mergeados / CHANGES_REQUESTED (bot) → DE-COORD ou COMANDO
try:
    R=os.environ.get('DE_REPO','Raiz-Educacao-SA/raiz-data-engine'); s=since.strftime('%Y-%m-%dT%H:%M:%SZ')
    for st,q,lab in (('open',f'created:>={s}','aberto'),('merged',f'merged:>={s}','mergeado')):
        j=subprocess.run(['gh','pr','list','-R',R,'--state',st,'--search',q,'--json','number,createdAt,mergedAt','--limit','50'],capture_output=True,text=True,timeout=60).stdout
        for p in json.loads(j or '[]'):
            ts=P(p['mergedAt'] or p['createdAt']); ev.append((ts,f"PR #{p['number']} {lab}",prdest(p['number']),rf"#{p['number']}\b"))
    j=subprocess.run(['gh','pr','list','-R',R,'--state','open','--json','number,reviews','--limit','60'],capture_output=True,text=True,timeout=60).stdout
    for p in json.loads(j or '[]'):
        cr=[r for r in p.get('reviews',[]) if r.get('state')=='CHANGES_REQUESTED' and r.get('submittedAt','')>=s]
        if cr: ev.append((P(cr[-1]['submittedAt']),f"PR #{p['number']} CHANGES_REQUESTED",prdest(p['number']),rf"#{p['number']}\b"))
except Exception as e: ev.append((now,f'gh indisponível: {str(e)[:60]}',{'COMANDO'},'$^'))
# 3) deploy FAILED → DE-COORD/COMANDO ; prod ≠200 (sonda do tick) → DE-COORD/COMANDO
try:
    j=subprocess.run(['railway','deployment','list','--json'],cwd=os.path.expanduser('~/Claude/GitHub/raiz-data-engine'),capture_output=True,text=True,timeout=60).stdout
    d=json.loads(j or '[]'); d=d if isinstance(d,list) else d.get('deployments',[])
    for x in d:
        x=x.get('node',x)
        if x.get('status')=='FAILED' and (x.get('createdAt') or '')>=since.isoformat(): ev.append((P(x['createdAt']),f"deploy FAILED {x.get('id','')[:8]}",{'DE-COORD','COMANDO'},r'deploy|FAILED|railway'))
except Exception: pass
pp=f'{AI}/roadmap/PROD-PROBE.jsonl'
if os.path.exists(pp):
    bad=None
    for l in open(pp):
        try: e=json.loads(l)
        except: continue
        if P(e['ts'])<since: continue
        if str(e.get('readiness'))!='200' and bad is None: bad=P(e['ts']); ev.append((bad,f"prod readiness={e.get('readiness')}",{'DE-COORD','COMANDO'},r'prod|readiness|500|502|503'))
        if str(e.get('readiness'))=='200': bad=None
# 4) Entregas PRONTA (commits do roadmap nas últimas 24 h) → COMANDO
try:
    out=subprocess.run(['git','log','--since=24 hours ago','--format=@@%cI','-p','--','docs/ai-state/roadmap/'],cwd=os.path.expanduser('~/Claude'),capture_output=True,text=True,timeout=60).stdout
    ts=None
    for l in out.splitlines():
        if l.startswith('@@'): ts=P(l[2:]); continue
        m=re.match(r'\+\s*(E-\d+[a-z]?)\b.*· (PRONTA|pronta)',l)
        if m and ts: ev.append((ts,f"{m.group(1)} PRONTA",{'COMANDO'},rf"{m.group(1)}\b"))
except Exception: pass
# ---- cruzamento ----
rows=[]; falta=0; pend=0
for ts,name,dest,pat in sorted(ev,key=lambda e:e[0]):
    r=ok(ts,dest,pat); age=(now-ts).total_seconds()/60
    if r: st=f'✓ {r}'
    elif age<GRACE: st=f'… pendente ({GRACE-int(age)} min)'; pend+=1
    else: st=f'⚠ EM FALTA há {int(age)} min'; falta+=1
    rows.append(f"| {ts.strftime('%d %H:%M')}Z | {name} | {'/'.join(sorted(dest)) if dest!='*' else 'qualquer papel'} | {st} |")
hdr=f"# COMUNICAÇÃO OBRIGATÓRIA — derivado por comunicacao-obrigatoria.sh {now.strftime('%Y-%m-%dT%H:%MZ')} · 24 h · graça {GRACE} min\n\n**{falta} em falta · {pend} pendentes · {len(ev)-falta-pend} cobertos · {len(ev)} eventos** (ledger: {len(msgs)} msgs = send.log + msg-ledger)\n\n| evento (ts) | o quê | destino obrigatório | estado |\n|---|---|---|---|\n"
tmp=f'{T}/COMUNICACAO-EM-FALTA.md.tmp'; open(tmp,'w').write(hdr+'\n'.join(rows)+'\n'); os.replace(tmp,f'{T}/COMUNICACAO-EM-FALTA.md')
print(f'comunicacao-obrigatoria: {falta} em falta · {pend} pendentes · {len(ev)-falta-pend} cobertos · {len(ev)} eventos · ledger {len(msgs)} msgs')
PY
