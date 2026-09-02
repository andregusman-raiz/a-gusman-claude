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
    # 01/09 (COMANDO): removida a disjuncao `or 'acorda_por: evento' in head`. `acorda_por` diz COMO o
    # papel acorda — nao diz que esta parado AGORA; e a norma do cockpit e que NENHUM papel acorda por
    # relogio, logo o contrato bem escrito passava a suprimir o alerta de silencio para sempre: quanto
    # mais correcto o contrato, mais invisivel o papel. Medido antes de mexer: dos 19 contratos so o
    # OTIMIZADOR casa qualquer das clausulas, e casa AS DUAS -> remocao e no-op hoje, e fecha o buraco.
    return 'posto:' in head

alertas=[]
for papel,v in reg.items():
    if v.get('estado')!='aberto': continue
    # 01/09: mesmo defeito do empurra — o tier decidia quem era vigiado, e um papel com roadmap
    # próprio aberto como tier 3 podia parar em silêncio sem ninguém notar.
    _fr=(v.get('frente') or papel).lower()
    if v.get('tier') not in (0,1,2) and not os.path.exists(os.path.join(os.path.dirname(T),'roadmap','filas',f'fila-{_fr}.jsonl')): continue
    ts=ultimo_evento(v.get('session_id') or '')
    trabalho=emcurso.get(papel,[])+claims.get(papel,[])
    if ts is None:
        if trabalho: alertas.append((papel,'sem evento medivel',trabalho))
        continue
    try: t=datetime.fromisoformat(ts.replace('Z','+00:00'))
    except Exception: continue
    mins=int((now-t).total_seconds()//60)
    if mins < LIM: continue
    # 01/09 (COMANDO, achado do DE-BUILD-B): tem_posto() era so alcancavel no ramo elif, ou seja SO com
    # trabalho vazio — logo um papel com claim aberto E posto declarado era nudgeado a cada ciclo, e esse e
    # justamente o caso mais comum de precisar de posto (bloqueado numa Entrega real, nao ocioso).
    # tem_posto() ja tem janela de 12 h, portanto posto velho volta a alertar sozinho.
    if tem_posto(papel):
        continue
    if trabalho:
        alertas.append((papel,f'calado ha {mins} min',trabalho))
    else:
        alertas.append((papel,f'calado ha {mins} min e sem Entrega em curso nem posto',[]))

# 02/09 (auditoria do dono; achado nomeado pelo SALARIOS): o vigia e o empurra so olhavam OCIOSIDADE —
# e o empurra so entrega a quem esta parado ha >=10 min. Um papel ATIVO que fecha Entregas e nunca puxa
# fica invisivel aos dois: "o mecanismo que apanharia a omissao esta desligado pela mesma condicao que a
# produz". Medido no dia: COMANDO/FUNIL/SALARIOS fecharam 2/5/6 Entregas com ZERO pulls. Segunda condicao,
# ortogonal ao silencio: fechou ha pouco + nao tem nada puxado + a fila DELE tem coisa elegivel.
# A elegibilidade NAO e re-implementada aqui — pergunta-se ao proprio fila-pull em --peek (nao muta).
import subprocess as _sp
_JAN_MIN=int(os.environ.get('POSTO_FECHOU_SEM_PUXAR_MIN','90'))
_ult_done={}; _puxadas=set()
_rf=os.path.join(os.path.dirname(T),'roadmap','results.jsonl')
if os.path.exists(_rf):
    for _l in open(_rf,errors='replace'):
        try: _e=json.loads(_l)
        except Exception: continue
        if _e.get('status')=='done' and _e.get('papel') and _e.get('papel')!='tick':
            _ult_done[_e['papel']]=_e.get('ts')
for _q in glob.glob(os.path.join(os.path.dirname(T),'roadmap','filas','fila-*.jsonl')):
    for _l in open(_q,errors='replace'):
        try: _r=json.loads(_l)
        except Exception: continue
        if _r.get('status')=='puxada' and _r.get('puxada_por'): _puxadas.add(_r['puxada_por'])
_ja=[a[0] for a in alertas]
for _papel,_v in reg.items():
    if _v.get('estado')!='aberto' or _papel in _ja or _papel in _puxadas: continue
    _ts=_ult_done.get(_papel)
    if not _ts: continue
    try: _min=int((now-datetime.fromisoformat(_ts.replace('Z','+00:00'))).total_seconds()//60)
    except Exception: continue
    if _min>_JAN_MIN: continue
    # 02/09 20:3xZ (caso FGTS): posto declarado ha pouco = esta em algo (a row pode ja estar done por reconciliacao
    # enquanto ele corrige/continua). Mesma janela de 12 h do ramo do silencio.
    if tem_posto(_papel): continue
    _fr=(_v.get('frente') or _papel).lower()
    if not os.path.exists(os.path.join(os.path.dirname(T),'roadmap','filas',f'fila-{_fr}.jsonl')): continue
    try:
        _o=_sp.run(['bash',os.path.expanduser('~/.claude/scripts/fila-pull.sh'),_fr,_papel,'--peek'],
                   capture_output=True,text=True,timeout=60).stdout
    except Exception: continue
    if 'PRÓXIMA' not in _o and 'PROXIMA' not in _o: continue
    try:
        _pj=json.loads(_o.split('PRÓXIMA (peek):')[-1].strip()); _prox=f"{_pj.get('task')} — {str(_pj.get('resumo') or '')[:70]}"
    except Exception: _prox=_o.split('PRÓXIMA (peek):')[-1].strip()[:80]
    alertas.append((_papel,f'fechaste ha {_min} min e nao puxaste — fila-{_fr} tem elegivel: {_prox}. Puxa (fila-pull.sh {_fr} {_papel}) ou declara posto',[]))

if not alertas:
    print(f'posto ok: nenhum papel calado >{LIM} min com trabalho por fazer, nenhum fechou sem puxar'); raise SystemExit(0)

for papel,motivo,trab in alertas:
    o=f"POSTO: {motivo}." + (f" Tens em curso: {', '.join(trab)}. Retoma ou diz o que te bloqueia." if trab else " Sem Entrega em curso e sem posto declarado — pede trabalho ao DE-COORD.")
    print(f'  {papel}: {motivo} | {trab}')
    if DRY!='--dry-run':
        subprocess.run([os.path.expanduser('~/.claude/scripts/terminal-send.sh'),papel,o],
                       capture_output=True,timeout=120)
PY
