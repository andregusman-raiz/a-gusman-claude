#!/usr/bin/env bash
# terminal-restart.sh — reinicia o Claude Code de UM papel do cockpit NO MESMO workspace cmux (mantém workspace_uuid,
# session_id via --resume, cwd, registry) para apanhar a versão nova do binário. Ordem do dono 2026-09-03 ("reiniciar todos os
# terminais, um de cada vez, para atualizar a versão do claude" — sem perder automações, monitores, papéis).
#
# O que sobrevive sozinho: launchd (tick, cockpit, estado-diff, posto), hooks, filas/ledger/claims, registry (mesmo uuid),
# contexto (--resume). O que MORRE e este script trata: o PID (→ enderecos.json re-derivado aqui), o sock UDS (novo),
# e os Monitors da sessão (→ o papel é instruído a re-armar os do contrato; o número que tinha fica no log).
#
# Uso: terminal-restart.sh <PAPEL> [--dry-run] [--force]
#   --dry-run  só mostra o que faria (sem cmux)         --force  ignora "prompt com texto" (nunca ignora "ocupado")
set -uo pipefail
PAPEL=${1:?papel}; DRY=0; FORCE=0
for a in "${@:2}"; do case "$a" in --dry-run) DRY=1;; --force) FORCE=1;; esac; done
CMUX="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"; export CMUX_QUIET=1
AI="$HOME/Claude/docs/ai-state"; REG="$AI/terminais/registry.json"; LOG="$AI/terminais/restart.log"
now(){ date -u +%Y-%m-%dT%H:%M:%SZ; }
say(){ echo "[$(now)] $*"; }
die(){ say "ERRO: $*" >&2; exit 2; }

UUID=$(python3 -c "import json,sys; t=json.load(open('$REG'))['terminais'].get('$PAPEL') or {}; print(t.get('workspace_uuid') or '')")
[ -n "$UUID" ] || die "papel $PAPEL sem workspace_uuid no registry"
AGENT=$(python3 -c "import json; print((json.load(open('$REG'))['terminais'].get('$PAPEL') or {}).get('agent',''))")
[ "$AGENT" = "claude" ] || die "papel $PAPEL e' agent=$AGENT — este script so reinicia sessoes claude (codex: manual, codex resume)"
"$CMUX" workspace list --id-format both 2>/dev/null | grep -q "$UUID" || die "workspace $UUID nao existe no cmux (papel fechado? usa terminal-open.sh)"

# comando de relancamento = o mesmo que o terminal-open.sh derivaria (model/effort do contrato, --resume session_id)
CMD=$(bash "$HOME/Claude/.claude/scripts/terminal-open.sh" "$PAPEL" --dry-run --force 2>/dev/null | grep -oE 'claude --dangerously-skip-permissions.*' | head -1)
if [ -z "$CMD" ]; then   # terminal-open recusa (memoria <20%, cap): um REINICIO nao acrescenta sessao — deriva do registry + frontmatter
  CMD=$(python3 - "$REG" "$PAPEL" "$AI/terminais/papeis/$PAPEL.md" <<'PYC'
import json,sys,re
reg,papel,md=sys.argv[1:4]; t=json.load(open(reg))['terminais'].get(papel) or {}; fm={}
try:
    s=open(md).read()
    if s.startswith('---'):
        for l in s.split('---',2)[1].splitlines():
            m=re.match(r'\s*(model|effort)\s*:\s*"?([A-Za-z0-9-]+)"?',l)
            if m: fm[m.group(1)]=m.group(2)
except Exception: pass
model=fm.get('model') or t.get('model') or ''; effort=fm.get('effort') or ''; sid=t.get('session_id') or ''
print('claude --dangerously-skip-permissions'+(f' --model {model}' if model else '')+(f' --effort {effort}' if effort else '')+(f' --resume {sid}' if sid else ''))
PYC
)
  say "comando derivado do registry+contrato (terminal-open recusou: $(bash "$HOME/Claude/.claude/scripts/terminal-open.sh" "$PAPEL" --dry-run --force 2>&1 | grep RECUSADO | head -1 | cut -c1-60))"
fi
[ -n "$CMD" ] || die "nao consegui derivar o comando de relancamento"
SID=$(printf '%s' "$CMD" | grep -oE -- '--resume [0-9a-f-]+' | awk '{print $2}')
if [ -n "$SID" ] && [ "${#SID}" -lt 36 ]; then   # registry com id CURTO (ex.: RESUMO) — --resume exige o uuid inteiro
  FULL=$(ls "$HOME/.claude/projects"/*/"$SID"*.jsonl 2>/dev/null | head -1 | xargs -I{} basename {} .jsonl)
  [ -n "$FULL" ] && CMD=${CMD/--resume $SID/--resume $FULL} && SID=$FULL
fi
OLDPID=$(python3 -c "import json; d=json.load(open('$AI/terminais/enderecos.json')); d=d.get('papeis',d); v=d.get('$PAPEL'); print((v.get('pid') if isinstance(v,dict) else v) or '')" 2>/dev/null)
# pid antigo em falta no enderecos (VISAO, 14:01Z: esperou 6 s as cegas) -> deriva do processo que corre esta sessao
if [ -z "$OLDPID" ] && [ -n "$SID" ]; then OLDPID=$(ps -axo pid,command | grep -E -- "--(resume|session-id) ${SID:0:8}" | grep -v grep | awk '{print $1}' | head -1); fi
SCREEN=$("$CMUX" read-screen --workspace "$UUID" --lines 40 2>/dev/null || true)
MON=$(printf '%s' "$SCREEN" | grep -oE '[0-9]+ monitors?' | tail -1)
VER_OLD=$(python3 -c "import json,glob; print(next((json.load(open(f)).get('version','?') for f in glob.glob('$HOME/.claude/sessions/*.json') if str(json.load(open(f)).get('pid'))=='$OLDPID'),'?'))" 2>/dev/null)

say "== $PAPEL · workspace $UUID · pid atual ${OLDPID:-?} · versao atual ${VER_OLD:-?} · ${MON:-0 monitors} =="
say "relancar com: $CMD"
# pre-check 1: ocupado? (turno a correr) — NUNCA se reinicia a meio de um turno
if printf '%s' "$SCREEN" | grep -qiE 'esc to interrupt|queued messages|\bthinking\b|\bworking\b'; then
  die "$PAPEL esta OCUPADO (turno a correr). Espera o fim do turno e repete."
fi
# pre-check 2: texto no prompt (caixa entre os 2 ultimos separadores)
BOX=$(printf '%s' "$SCREEN" | python3 -c "
import sys,re; s=sys.stdin.read().split('\n'); seps=[i for i,l in enumerate(s) if re.match(r'^─{10,}',l.strip())]
box=s[seps[-2]+1:seps[-1]] if len(seps)>=2 else []; t=' '.join(l.strip().lstrip('❯').strip() for l in box).strip(); print(t)")
if [ -n "$BOX" ] && [ "$FORCE" -eq 0 ]; then
  say "AVISO: ha texto no prompt de $PAPEL: '$(printf '%s' "$BOX" | cut -c1-80)'. Se e' fantasma/rascunho sem valor, repete com --force; se e' teu, envia-o ou apaga-o primeiro."; exit 3
fi
if [ "$DRY" -eq 1 ]; then say "[dry-run] 1) send '/exit' → 2) espera pid $OLDPID morrer → 3) send comando → 4) espera sessions/<pid>.json novo com $SID → 5) enderecos-sync → 6) instrucao de re-armar ${MON:-monitors}"; exit 0; fi

# 1) sair
"$CMUX" send --workspace "$UUID" "/exit"; sleep 0.4; "$CMUX" send-key --workspace "$UUID" enter
for i in $(seq 1 60); do
  [ -n "$OLDPID" ] && ! kill -0 "$OLDPID" 2>/dev/null && break; [ -z "$OLDPID" ] && sleep 6 && break
  # FGTS 14:05Z: sessao com shells/monitors de fundo abre o dialogo "1. Exit and stop tasks / 2. Move to background / 3. Stay"
  # e espera Enter — a opcao 1 e' a certa (os monitors sao re-armados pelo papel depois do resume; em background ficariam orfaos).
  if [ $((i % 3)) -eq 0 ] && "$CMUX" read-screen --workspace "$UUID" --lines 8 2>/dev/null | grep -q "Exit and stop tasks"; then
    say "dialogo de saida com tarefas de fundo: confirmo '1. Exit and stop tasks'"; "$CMUX" send-key --workspace "$UUID" enter >/dev/null 2>&1
  fi
  sleep 1
done
if [ -n "$OLDPID" ] && kill -0 "$OLDPID" 2>/dev/null; then die "o processo $OLDPID nao saiu em 60 s — NAO relancei. Ve o pane."; fi
say "sessao antiga terminou (pid ${OLDPID:-?})"; sleep 2
# 2) relancar no MESMO pane
"$CMUX" send --workspace "$UUID" "$CMD"; sleep 0.4; "$CMUX" send-key --workspace "$UUID" enter
NEWPID=""; VER_NEW=""
for i in $(seq 1 120); do
  R=$(python3 -c "
import json,glob
for f in sorted(glob.glob('$HOME/.claude/sessions/*.json'), key=lambda x: -__import__('os').path.getmtime(x)):
    try: d=json.load(open(f))
    except Exception: continue
    if str(d.get('sessionId','')).startswith('$SID') and str(d.get('pid'))!='$OLDPID': print(d.get('pid'), d.get('version','?')); break" 2>/dev/null)
  if [ -n "$R" ]; then NEWPID=${R%% *}; VER_NEW=${R##* }; break; fi; sleep 1
done
[ -n "$NEWPID" ] || die "sessao nova nao apareceu em 120 s (sessions/*.json sem $SID). Ve o pane: pode estar a pedir algo."
# 3) enderecos + sock
bash "$HOME/Claude/.claude/scripts/enderecos-sync.sh" >/dev/null 2>&1 || true
EPID=$(python3 -c "import json; d=json.load(open('$AI/terminais/enderecos.json')); d=d.get('papeis',d); v=d.get('$PAPEL'); print((v.get('pid') if isinstance(v,dict) else v) or '')" 2>/dev/null)
SOCK_OK=$([ -S "/tmp/cc-socks/$NEWPID.sock" ] && echo sim || echo NAO)
# 4) espera o prompt e instrui a re-armar
for i in $(seq 1 30); do "$CMUX" read-screen --workspace "$UUID" --lines 12 2>/dev/null | grep -q '❯' && break; sleep 1; done
"$CMUX" send --workspace "$UUID" "Sessao reiniciada na versao ${VER_NEW} (update do Claude Code, ordem do dono 03/09). Tinhas ${MON:-0 monitors} armados: re-arma AGORA os Monitors que o teu contrato (acorda_por) exige, confirma em 1 linha o que armaste, e continua de onde estavas — sem RESULT novo."; sleep 0.4; "$CMUX" send-key --workspace "$UUID" enter
say "OK: $PAPEL pid $OLDPID → $NEWPID · versao ${VER_OLD:-?} → $VER_NEW · enderecos=$([ "$EPID" = "$NEWPID" ] && echo sincronizado || echo "DESSINCRONIZADO ($EPID)") · sock=$SOCK_OK · monitors a re-armar: ${MON:-0}"
printf '%s\t%s\t%s→%s\t%s→%s\tmonitors=%s\tsock=%s\n' "$(now)" "$PAPEL" "$OLDPID" "$NEWPID" "${VER_OLD:-?}" "$VER_NEW" "${MON:-0}" "$SOCK_OK" >> "$LOG"
