#!/usr/bin/env bash
# terminais-posto.sh — a cada 30 min: um papel esta ATIVO no que DEVIA estar a fazer agora?
# Sem LLM. Nunca mata, nunca age no trabalho de ninguem: so mede e cutuca.
# Ordem do dono 2026-08-30 03:15Z. Substitui o terminais-watchdog.sh removido na F0a,
# mais estreito: aquele media vida, este mede vida CONTRA tarefa esperada.
set -uo pipefail
T="$HOME/Claude/docs/ai-state/terminais"
R="$HOME/Claude/docs/ai-state/roadmap"
SESS="$HOME/.claude/projects/-Users-andregusmandeoliveira-Claude"
LIMITE_MIN="${POSTO_LIMITE_MIN:-30}"
DRY="${1:-}"

python3 - "$T" "$R" "$SESS" "$LIMITE_MIN" "$DRY" <<'PY'
import json,os,sys,glob,subprocess
from datetime import datetime,timezone
T,R,SESS,LIM,DRY = sys.argv[1],sys.argv[2],sys.argv[3],int(sys.argv[4]),sys.argv[5]
now=datetime.now(timezone.utc)

reg=json.load(open(os.path.join(T,'registry.json')))['terminais']

# Entregas 'em curso' por papel, lidas dos ficheiros de programa
emcurso={}
for f in glob.glob(os.path.join(R,'*.md')):
    if f.endswith('ROADMAP.md'): continue
    for l in open(f,errors='replace'):
        if not l.startswith('  E-'): continue
        if '· em curso ·' not in l and '· em curso·' not in l: continue
        partes=[p.strip() for p in l.split('·')]
        for p in partes:
            for papel in reg:
                if p==papel or p.startswith(papel+' '):
                    emcurso.setdefault(papel,[]).append(partes[0])

def ultimo_evento(sid):
    # 31/08 (achado do DE-MIG: "calado há 60 min" constante com atividade real): o transcript vive em
    # ~/.claude/projects/<cwd de ARRANQUE>/, não necessariamente no dir do workspace; e ler o ficheiro inteiro
    # com json.loads por linha (32 MB, linhas gigantes) falhava/atrasava. Agora: glob em todos os project dirs
    # + leitura só da cauda + regex no timestamp.
    import glob,re
    if not sid: return None
    ts=None
    for f in glob.glob(os.path.expanduser(f'~/.claude/projects/*/{sid}*.jsonl')):
        try:
            with open(f,'rb') as fh:
                fh.seek(0,2); sz=fh.tell(); fh.seek(max(0,sz-200000)); tail=fh.read().decode('utf-8','ignore')
            for m in re.finditer(r'"timestamp":"([^"]+)"',tail):
                if ts is None or m.group(1)>ts: ts=m.group(1)
        except Exception: pass
    return ts

claims={}
try:
    cl=json.load(open(os.path.join(os.path.dirname(T),'de-pr-queue','claims.json')))['claims']
    for branch,c in cl.items():
        term=str(c.get('terminal') or '')
        est=str(c.get('status') or c.get('estado') or '')
        if 'merged' in est.lower() or 'fechad' in est.lower(): continue
        for papel in reg:
            if term.strip()==papel: claims.setdefault(papel,[]).append(f"#{c.get('pr')}")
except Exception as e:
    print('  aviso: claims.json ilegivel —', e)

def tem_posto(papel):
    # 31/08 (COMANDO): o contrato é ESTÁTICO (0/7 papéis têm posto:/acorda_por) — posto é declaração de RUNTIME.
    # Fonte primária: último RESULT status=posto do papel em roadmap/results.jsonl nas últimas 12 h. Contrato fica como OR.
    try:
        import datetime as _dt
        rf=os.path.join(os.path.dirname(T),'roadmap','results.jsonl'); cut=(_dt.datetime.now(_dt.timezone.utc)-_dt.timedelta(hours=12)).strftime('%Y-%m-%dT%H:%M:%SZ')
        if os.path.exists(rf):
            for line in open(rf,errors='replace'):
                try: e=json.loads(line)
                except Exception: continue
                if e.get('status')=='posto' and e.get('papel')==papel and str(e.get('ts',''))>=cut: return True
    except Exception as _ex:
        print(f'tem_posto({papel}): erro a ler results.jsonl — {_ex!r}')   # não engolir: papel fica sem posto E aparece no log
    c=os.path.join(T,'papeis',f'{papel}.md')
    if not os.path.exists(c): return False
    head=open(c,errors='replace').read()[:600]
    return 'posto:' in head or 'acorda_por: evento' in head

alertas=[]
for papel,v in reg.items():
    if v.get('estado')!='aberto': continue
    if v.get('tier') not in (0,1,2): continue
    ts=ultimo_evento(v.get('session_id') or '')
    trabalho=emcurso.get(papel,[])+claims.get(papel,[])
    if ts is None:
        if trabalho: alertas.append((papel,'sem evento medivel',trabalho))
        continue
    try: t=datetime.fromisoformat(ts.replace('Z','+00:00'))
    except Exception: continue
    mins=int((now-t).total_seconds()//60)
    if mins < LIM: continue
    if trabalho:
        alertas.append((papel,f'calado ha {mins} min',trabalho))
    elif not tem_posto(papel):
        alertas.append((papel,f'calado ha {mins} min e sem Entrega em curso nem posto',[]))

if not alertas:
    print(f'posto ok: nenhum papel calado >{LIM} min com trabalho por fazer'); raise SystemExit(0)

for papel,motivo,trab in alertas:
    o=f"POSTO: {motivo}." + (f" Tens em curso: {', '.join(trab)}. Retoma ou diz o que te bloqueia." if trab else " Sem Entrega em curso e sem posto declarado — pede trabalho ao DE-COORD.")
    print(f'  {papel}: {motivo} | {trab}')
    if DRY!='--dry-run':
        subprocess.run([os.path.expanduser('~/.claude/scripts/terminal-send.sh'),papel,o],
                       capture_output=True,timeout=120)
PY
