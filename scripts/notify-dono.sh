#!/usr/bin/env bash
# notify-dono.sh <chave> <mensagem> — aviso ATIVO ao dono (notificação macOS), sem LLM, 1 por hora por chave.
# 02/09 (ordem do dono: "corrija todos os itens de forma exaustiva"): a escalada era passiva (ficheiro + painel).
# Uso: só para o que muda o que o dono faria a seguir (terminal inalcançável de facto, empurra a falhar 3x seguidas).
set -u
K="${1:?chave}"; M="${2:?mensagem}"; ST="$HOME/.claude/state/notify-dono.json"; mkdir -p "$(dirname "$ST")"
python3 - "$K" "$M" "$ST" <<'PYN'
import json,sys,time,subprocess,os
k,m,st=sys.argv[1],sys.argv[2],sys.argv[3]
d=json.load(open(st)) if os.path.exists(st) else {}
if time.time()-d.get(k,0)<3600: print("silenciado (1/h)"); raise SystemExit(0)
d[k]=time.time(); json.dump(d,open(st,'w'))
msg=m.replace('"','\\"')[:200]
subprocess.run(['osascript','-e',f'display notification "{msg}" with title "cockpit" subtitle "{k[:40]}"'],capture_output=True,timeout=5)
with open(os.path.expanduser('~/Claude/docs/ai-state/terminais/send.log'),'a') as f:
    f.write(f"{time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())} NOTIFY-DONO chave={k} :: {m[:160]}\n")
print("notificado")
PYN
