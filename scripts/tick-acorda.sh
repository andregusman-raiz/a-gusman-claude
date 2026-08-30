#!/usr/bin/env bash
# tick-acorda.sh — o tick ACORDA por evento (dono 30/08). rev 2 (23:5xZ, achado do COMANDO): a rev 1 restaurava o estado
# INTEIRO se UM envio do lote falhasse → re-alarmava tudo a cada tick, indefinidamente. Agora: estado commitado POR EVENTO
# (só o que foi entregue sai da lista); envio falhado tenta de novo até 3× e depois é abandonado com linha no tick.log.
# Regra: 1 evento -> 1 destinatário -> 1 mensagem-ponteiro, SÓ no delta. Sem LLM.
set -uo pipefail
AI="$HOME/Claude/docs/ai-state"; ST="$HOME/.claude/state/tick-acorda.json"; SEND="$HOME/Claude/.claude/scripts/terminal-send.sh"; TL="$AI/terminais/tick.log"
EV="$(mktemp)"; OK="$(mktemp)"; KO="$(mktemp)"
python3 - "$AI" "$ST" >"$EV" <<'PY'
import json,os,sys,subprocess,re
AI,STp=sys.argv[1],sys.argv[2]
st=json.load(open(STp)) if os.path.exists(STp) else {}
sent=set(st.get('sent',[])); tries=st.get('tries',{})
out=[]  # (dest, msg, key)
def ev(dest,msg,key):
    if key in sent: return
    if tries.get(key,0)>=3: return
    out.append((dest,msg,key))
# 1) deploy FAILED novo
try:
    j=subprocess.run(['railway','deployment','list','--json'],cwd=os.path.expanduser('~/Claude/GitHub/raiz-data-engine'),capture_output=True,text=True,timeout=60).stdout
    d=json.loads(j or '[]'); d=d if isinstance(d,list) else d.get('deployments',[])
    for x in [x.get('node',x) for x in d[:5]]:
        if x.get('status')=='FAILED' and x.get('id'):
            ev('DE-COORD',f"tick/acorda: deploy FAILED {x['id'][:8]} ({str(x.get('createdAt',''))[11:16]}Z) — leia o log do deployment e o predeploy; fila pode estar travada.",f"deploy|{x['id']}"); break
except Exception: pass
# 2) COMUNICACAO-EM-FALTA novas (máx 4/tick)
try:
    n=0
    for l in open(f'{AI}/terminais/COMUNICACAO-EM-FALTA.md'):
        if 'EM FALTA' not in l or not l.startswith('|'): continue
        c=[x.strip() for x in l.strip('|\n').split('|')]; key=f"emfalta|{c[0]}|{c[1]}"
        if key in sent or tries.get(key,0)>=3: continue
        dest=(c[2].split('/')[0] or 'COMANDO').strip()
        ev(dest,f"tick/acorda: comunicação obrigatória EM FALTA: {c[1]} ({c[0]}) — leia terminais/COMUNICACAO-EM-FALTA.md e emita/regista.",key); n+=1
        if n>=4: break
except Exception: pass
# 2b) RESULT blocked/failed/retracted novo -> COMANDO
try:
    rf=f'{AI}/roadmap/results.jsonl'
    if os.path.exists(rf):
        for l in open(rf):
            try: e=json.loads(l)
            except: continue
            if e.get('status') in ('blocked','failed','retracted'):
                ev('COMANDO',f"tick/acorda: RESULT {e.get('status')} em {e.get('task')} ({e.get('papel')}): {str(e.get('nota',''))[:120]} — leia roadmap/results.jsonl",f"result|{e.get('ts')}|{e.get('task')}")
except Exception: pass
# 2c) HUMAN_REVIEW_REQUIRED do bot (review COMMENTED)
try:
    R=os.environ.get('DE_REPO','Raiz-Educacao-SA/raiz-data-engine')
    j=subprocess.run(['gh','pr','list','-R',R,'--state','open','--json','number,reviews','--limit','60'],capture_output=True,text=True,timeout=60).stdout
    novos=[]
    for pr in json.loads(j or '[]'):
        k=sum(1 for r in pr.get('reviews',[]) if 'HUMAN_REVIEW_REQUIRED' in (r.get('body') or ''))
        if k:
            key=f"human|{pr['number']}|{k}"
            if key not in sent and tries.get(key,0)<3: novos.append((key,f"#{pr['number']}×{k}"))
    if novos:
        ev('DE-COORD',f"tick/acorda: HUMAN_REVIEW_REQUIRED do bot (review COMMENTED, invisível ao reviewDecision) em {' '.join(n for _,n in novos[:6])} — triar o humano (dono/Marcelo) e acionar de-aprovador-externo se for o caso.","human|"+"+".join(k for k,_ in novos))
        # chaves individuais também contam como enviadas quando o agregado sai (ver commit abaixo)
        out[-1]=(out[-1][0],out[-1][1],out[-1][2]+"|"+"|".join(k for k,_ in novos))
except Exception: pass
# 3) passo do tick com rc!=0 (novo)
try:
    bad=[l.strip() for l in open(f'{AI}/terminais/tick.log') if ' rc=' in l and 'rc=0 ' not in l and not l.strip().endswith('rc=0')]
    if bad: ev('COMANDO',f"tick/acorda: passo do tick falhou: {bad[-1][-90:]} — leia terminais/tick.log",f"badstep|{bad[-1][:40]}")
except Exception: pass
for d,m,k in out[:6]: print(f"{d}\t{m[:380]}\t{k}")
PY
while IFS=$'\t' read -r DEST MSG KEY; do
  [ -z "${DEST:-}" ] && continue
  if bash "$SEND" "$DEST" "$MSG" >/dev/null 2>&1; then echo "$KEY" >> "$OK"; else echo "$KEY" >> "$KO"; fi
done < "$EV"
python3 - "$ST" "$OK" "$KO" "$TL" <<'PY'
import json,os,sys,datetime
STp,okp,kop,tl=sys.argv[1:5]
st=json.load(open(STp)) if os.path.exists(STp) else {}
sent=set(st.get('sent',[])); tries=st.get('tries',{})
for l in open(okp):
    k=l.strip()
    if not k: continue
    for sub in k.split('|human|') if k.startswith('human|') else [k]: pass
    sent.add(k)
    if k.startswith('human|'):
        for part in k.split('|')[1:]:
            if part.startswith('human') or not part: continue
    tries.pop(k,None)
for l in open(kop):
    k=l.strip()
    if not k: continue
    tries[k]=tries.get(k,0)+1
    if tries[k]>=3:
        open(tl,'a').write(f"{datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} step=tick-acorda ABANDONADO após 3 falhas: {k[:80]}\n")
st['sent']=sorted(sent)[-500:]; st['tries']=tries
json.dump(st,open(STp,'w'))
PY
rm -f "$EV" "$OK" "$KO"
