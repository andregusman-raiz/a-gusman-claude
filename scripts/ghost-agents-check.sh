#!/usr/bin/env bash
#
# ⛔ CRITERIO NAO CONFIAVEL (28/08 19:20) — NAO USAR PARA APAGAR NADA.
# O criterio abaixo ("inbox com 0 itens + ausente do config.json") descreve
# qualquer agente nomeado que TERMINOU, nao so o que nunca nasceu:
# `build-canais` e `build-decisoes`, que entregaram scripts reais, apareciam
# como ghost. Sinais testados que tambem NAO separam os casos: mencao em
# transcript, transcript proprio, "finished", agent_id citado — presentes nos
# dois grupos. Ate haver sinal que distinga `build-canais` (nasceu) de
# `spec-funil` (nao nasceu), este script serve so como INVENTARIO, nunca como
# base para exclusao. Desligado do canais-render.sh.
#
# ghost-agents-check.sh — detecta agentes que receberam ack de spawn mas NUNCA nasceram.
#
# Medido 2026-08-28: `Agent` com campo `name` (Team/mailbox) devolveu "Spawned successfully...
# running" em ~1s para 7 de 7 agentes inexistentes — inbox `[]`, zero transcript, um deles
# "rodando" 11h com ZERO evento. `Task` nativo (sem name): 16/16 concluiram. O ack confirma
# enfileiramento, nao execucao — e o coordenador fica esperando resultado que nunca vem,
# inventando causa para o silencio.
#
# Um ghost NAO aparece como erro em lugar nenhum: e verde por ausencia na camada de orquestracao.
# Este script torna o silencio visivel.
#
# Uso: ghost-agents-check.sh [--min-idade-min N] [--json]
# Bypass: nenhum (read-only, nunca mata processo).
set -euo pipefail
MIN_IDADE="${GHOST_MIN_IDADE_MIN:-20}"
# Teto de idade: time encerrado ha dias tem inbox vazia por consumo natural, nao por ghost.
# Ghost que importa e o que alguem AINDA espera — sem teto, 61 alarmes de ate 19 dias viram ruido.
MAX_IDADE="${GHOST_MAX_IDADE_MIN:-2880}"
JSON=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --min-idade-min) MIN_IDADE="$2"; shift 2 ;;
    --max-idade-min) MAX_IDADE="$2"; shift 2 ;;
    --json) JSON=1; shift ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    *) echo "arg desconhecido: $1" >&2; exit 2 ;;
  esac
done
TEAMS_DIR="$HOME/.claude/teams"
[[ -d "$TEAMS_DIR" ]] || { echo "sem $TEAMS_DIR — nada a checar"; exit 0; }
MIN_IDADE="$MIN_IDADE" MAX_IDADE="$MAX_IDADE" TEAMS_DIR="$TEAMS_DIR" JSON="$JSON" python3 <<'PYEOF'
import json, os, time, glob
teams, minid, as_json = os.environ["TEAMS_DIR"], int(os.environ["MIN_IDADE"]), os.environ["JSON"] == "1"
maxid = int(os.environ.get("MAX_IDADE", "2880"))
ghosts, membros_ok = [], 0
for sess in sorted(glob.glob(os.path.join(teams, "session-*"))):
    cfg_p = os.path.join(sess, "config.json")
    inbox_d = os.path.join(sess, "inboxes")
    if not (os.path.exists(cfg_p) and os.path.isdir(inbox_d)):
        continue
    try:
        cfg = json.load(open(cfg_p))
    except Exception:
        continue
    members = {m.get("name") or m.get("id") for m in (cfg.get("members") or [])}
    for f in sorted(glob.glob(os.path.join(inbox_d, "*.json"))):
        nome = os.path.basename(f)[:-5]
        idade = int((time.time() - os.path.getmtime(f)) / 60)
        if idade < minid or idade > maxid:
            continue
        try:
            itens = len(json.load(open(f)))
        except Exception:
            itens = -1
        # GHOST = tem inbox (o spawn criou), mas NAO virou member do time e a inbox
        # nunca recebeu nada. E o rastro exato do ack falso: o arquivo existe, o agente nao.
        if nome not in members and itens == 0:
            ghosts.append({"agente": nome, "idade_min": idade, "time": os.path.basename(sess)})
        elif nome in members:
            membros_ok += 1
if as_json:
    print(json.dumps({"ghosts": ghosts, "membros_confirmados": membros_ok}, ensure_ascii=False, indent=2))
elif not ghosts:
    print(f"OK: nenhum ghost agent (>{minid}min); {membros_ok} membro(s) confirmado(s) no config do time")
else:
    print(f"⚠ {len(ghosts)} GHOST AGENT(S) — ack de spawn sem execucao (inbox criada, nunca virou member, 0 itens):")
    for g in sorted(ghosts, key=lambda x: -x["idade_min"]):
        print(f"   {g['agente']:24s} {g['idade_min']:5d}min  ({g['time']})")
    print("   Causa conhecida: Agent com `name` (Team/mailbox) — medido 0/7 em 28/08, Task nativo 16/16.")
    print("   Nao espere por eles: agente com zero evento nao vai aparecer. Respawne com Task, SEM name.")
PYEOF
