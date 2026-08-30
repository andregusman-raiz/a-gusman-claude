#!/usr/bin/env bash
# enderecos-sync.sh — deriva papel → nome de sessão-par (SendMessage) a partir de ~/.claude/sessions/<pid>.json × registry.
# DOR: nome do ListAgents muda a cada reinício ("instável entre ciclos"); endereço por papel tem de ser derivado, nunca decorado.
# Saída: docs/ai-state/terminais/enderecos.json {papel: {name, pid, session_id, cwd, kind}} — chamado pelo tick; sem LLM.
set -uo pipefail
python3 - <<'PY'
import json,glob,os,subprocess,re
AI=os.path.expanduser('~/Claude/docs/ai-state/terminais'); reg=json.load(open(f'{AI}/registry.json'))['terminais']
sid2papel={t['session_id']:p for p,t in reg.items() if t.get('session_id')}
# nome exibido pelo ListAgents = basename(cwd)-<2 hex do session_id?>; a fonte segura é o próprio ListAgents de uma sessão —
# aqui derivamos o mapa pid/session e o nome via `claude agents --json` quando disponível; senão nome = basename(cwd)+'-'+sid[:2]
out={}
for f in glob.glob(os.path.expanduser('~/.claude/sessions/*.json')):
    try: d=json.load(open(f))
    except Exception: continue
    pid=str(d.get('pid')); 
    try: os.kill(int(pid),0)
    except Exception: continue   # sessão morta: não entra
    sid=d.get('sessionId',''); papel=sid2papel.get(sid)
    if not papel: continue
    base=os.path.basename(d.get('cwd','')); tag=re.sub(r'[^0-9a-f]','',sid)[:2]
    out[papel]={'name_hint':f'{base}-{tag}' if base!='Claude' else f'claude-{tag}','pid':int(pid),'session_id':sid,'cwd':d.get('cwd'),'kind':d.get('kind'),'sock':f'/tmp/cc-socks/{pid}.sock'}
tmp=f'{AI}/enderecos.json.tmp'; json.dump(out,open(tmp,'w'),indent=1,ensure_ascii=False); os.replace(tmp,f'{AI}/enderecos.json')
print(f'enderecos.json: {len(out)} papéis vivos → ' + ' '.join(f"{p}={v['name_hint']}" for p,v in sorted(out.items())))
PY
