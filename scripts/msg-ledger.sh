#!/usr/bin/env bash
# msg-ledger.sh — ledger MECÂNICO das mensagens in-band (SendMessage/UDS) derivado dos transcritos dos RECEPTORES.
# DOR: o canal UDS não passa pelo send.log → 39 msgs/dia invisíveis ao board e ao diag (30/08). Sem disciplina: quem recebeu prova.
# Saída: docs/ai-state/terminais/msg-ledger.jsonl (append idempotente por (receptor, ts, from_pid)) + resumo em stdout. Janela: MSG_HOURS (default 24).
set -uo pipefail
python3 - "${MSG_HOURS:-24}" <<'PY'
import json,glob,os,re,sys,datetime,collections
H=int(sys.argv[1]); AI=os.path.expanduser('~/Claude/docs/ai-state/terminais'); P=os.path.expanduser('~/.claude/projects')
reg=json.load(open(f'{AI}/registry.json'))['terminais']; sid2papel={t['session_id']:p for p,t in reg.items() if t.get('session_id')}
pid2papel={}
for f in glob.glob(os.path.expanduser('~/.claude/sessions/*.json')):
    try: d=json.load(open(f)); pid2papel[str(d['pid'])]=sid2papel.get(d['sessionId'],'?')
    except Exception: pass
since=(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(hours=H)).isoformat()
led=f'{AI}/msg-ledger.jsonl'; seen=set()
if os.path.exists(led):
    for l in open(led):
        try: e=json.loads(l); seen.add((e['to'],e['ts'],e['from_pid']))
        except Exception: pass
rx=re.compile(r'<cross-session-message from=\\"uds:/tmp/cc-socks/(\d+)\.sock\\"[^>]*>(.*?)</cross-session-message>',re.S)
new=[]; tot=collections.Counter(); big=0; n=0
for sid,papel in sid2papel.items():
    for f in glob.glob(f'{P}/*/{sid}*.jsonl'):
        for l in open(f,errors='ignore'):
            if 'cross-session-message' not in l: continue
            m=re.search(r'"timestamp":"([^"]+)"',l)
            if not m or m.group(1)<since: continue
            for pid,body in rx.findall(l):
                n+=1; frm=pid2papel.get(pid,'?'+pid); tot[(frm,papel)]+=1
                if len(body)>200: big+=1
                k=(papel,m.group(1),pid)
                if k in seen: continue
                seen.add(k); new.append({'ts':m.group(1),'from':frm,'from_pid':int(pid),'to':papel,'chars':len(body),'preview':body[:300].replace('\\n',' ')})
with open(led,'a') as fh:
    for e in sorted(new,key=lambda e:e['ts']): fh.write(json.dumps(e,ensure_ascii=False)+'\n')
print(f'in-band {H}h: {n} msgs · >200 chars: {big} · novas no ledger: {len(new)} · pares: '+' '.join(f'{a}→{b}={c}' for (a,b),c in tot.most_common(8)))
PY
