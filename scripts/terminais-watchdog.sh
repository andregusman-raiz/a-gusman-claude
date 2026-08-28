#!/usr/bin/env bash
# terminais-watchdog.sh — vigia externo (launchd). NUNCA mata processo.
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Uso: terminais-watchdog.sh

Sem argumentos. Atualiza liveness.json e, para cada papel com
estado=aberto no registry, calcula idade de silencio
(min(jsonl_mtime_age_s, heartbeat_age_s) quando disponivel):

  tier 0: 45-90min -> nudge (terminal-send.sh --force); >90min sem
          sessao claude viva no cwd -> revive (terminal-open.sh)
  tier 1: >60min -> nudge
  tier 2/3: so log

NUNCA mata processo algum. Loga em docs/ai-state/terminais/watchdog.log
(uma linha por papel so quando age>45min ou quando agiu). Se nenhum
papel estiver com estado=aberto no registry, loga "nenhum tier0 aberto"
e sai 0.
EOF
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
LOG="$T/watchdog.log"
mkdir -p "$T"

"$SCRIPT_DIR/terminais-liveness.sh" >/dev/null 2>&1 || echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) AVISO: terminais-liveness.sh falhou" >> "$LOG"

LIVE="$T/liveness.json"

SCRIPT_DIR="$SCRIPT_DIR" REGISTRY="$REGISTRY" LIVE="$LIVE" LOG="$LOG" CMUX_BIN="$CMUX_BIN" python3 <<'PYEOF'
import json, os, subprocess, sys, time
sys.path.insert(0, os.environ["SCRIPT_DIR"])
from registry_lib import mutate

SCRIPT_DIR = os.environ["SCRIPT_DIR"]
REGISTRY = os.environ["REGISTRY"]
LIVE = os.environ["LIVE"]
LOG = os.environ["LOG"]
CMUX_BIN = os.environ["CMUX_BIN"]

def log(msg):
    with open(LOG, "a") as f:
        f.write(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()) + " " + msg + "\n")

with open(REGISTRY) as f:
    reg = json.load(f)
terminais = reg.get("terminais", {})

try:
    with open(LIVE) as f:
        live = json.load(f)
except Exception:
    live = {"terminais": {}}
live_terminais = live.get("terminais", {})

abertos = {p: e for p, e in terminais.items() if e.get("estado") == "aberto"}

if not abertos:
    log("nenhum tier0 aberto")
    raise SystemExit(0)

def claude_alive_in_cwd(cwd):
    """Prova 1 (indireta): o proprio cmux ainda lista sessao viva nesse cwd.

    Frágil exatamente quando mais importa: pos-crash/restart do app o
    inventario do cmux e o primeiro a ficar errado. Por isso nao decide sozinha.
    """
    try:
        r = subprocess.run([CMUX_BIN, "sessions", "--agent", "claude", "--json"],
                            capture_output=True, text=True, timeout=8)
        d = json.loads(r.stdout)
        for s in d.get("sessions", []):
            if s.get("cwd") == cwd and s.get("agent_lifecycle") == "running":
                return True
    except Exception:
        pass
    return False


def session_alive_by_process(session_id):
    """Prova 2 (direta): existe processo rodando com ESTE --resume <session_id>.

    Independente do cmux — le a tabela de processos do SO. Impede o caso
    split-brain: revive dispara `claude --resume <mesmo id>` enquanto a
    instancia antiga segue viva, e passariam a existir dois donos do papel.
    Comportamento de dois --resume simultaneos do mesmo id nao e documentado
    pela Anthropic (verificado 27/08), entao o desenho e evitar a situacao.
    """
    if not session_id:
        return False
    try:
        r = subprocess.run(["ps", "-axo", "command="],
                           capture_output=True, text=True, timeout=8)
        return any(session_id in line and "--resume" in line
                   for line in r.stdout.splitlines())
    except Exception:
        # Sem conseguir provar que morreu, o lado seguro e NAO reviver.
        return True

# Cooldown do nudge de estagnacao: sem isso o watchdog (5 min) bate no mesmo
# papel 6x/hora e o nudge vira ruido que o agente aprende a ignorar.
STAGNANT_COOLDOWN_MIN = int(os.environ.get("STAGNANT_COOLDOWN_MIN", "30"))
STATE_PATH = os.path.join(os.path.dirname(LOG), "watchdog-state.json")
try:
    with open(STATE_PATH) as f:
        wstate = json.load(f)
except Exception:
    wstate = {}
last_stagnant = wstate.get("last_stagnant_nudge", {})
mutate_falhas = wstate.get("mutate_falhas", {})
falhou_neste_tick = set()
ALERT_APOS = int(os.environ.get("MUTATE_ALERT_APOS", "3"))
ALERTAS = os.path.join(os.path.dirname(os.path.dirname(LOG)), "de-pr-queue", "ALERTAS.md")
state_dirty = False

for papel, entry in abertos.items():
    tier = entry.get("tier")
    live_info = live_terminais.get(papel, {})
    jsonl_age = live_info.get("jsonl_mtime_age_s")
    hb_age = live_info.get("heartbeat_age_s")
    nudged_now = False

    # ESTAGNACAO != SILENCIO. O resto deste loop mede silencio (idade do ultimo
    # sinal); um agente preso em loop de erro produz sinal o tempo todo e
    # passaria batido. work_state vem do liveness (ver terminais-liveness.sh).
    # "aguardando_ciclo" e vivo por desenho (cadencia declarada) — nunca nudge.
    if live_info.get("work_state") == "aguardando_ciclo":
        log(f"{papel} tier={tier} work_state=aguardando_ciclo acao=nenhuma")
    if live_info.get("work_state") == "stagnant":
        if tier in (0, 1):
            prev = last_stagnant.get(papel, 0)
            mins = (time.time() - prev) / 60.0
            if mins >= STAGNANT_COOLDOWN_MIN:
                busy_min = (jsonl_age or 0) / 60.0
                msg = (f"[watchdog] voce esta se declarando ocupado ha {int(busy_min)}min "
                       f"sem avanco no transcript. Se estiver repetindo a mesma tentativa: "
                       f"pare, releia o objetivo, e ou mude de abordagem ou registre o "
                       f"bloqueio explicito no canal do papel.")
                subprocess.run([os.path.join(SCRIPT_DIR, "terminal-send.sh"), papel, msg, "--force"])
                last_stagnant[papel] = time.time()
                state_dirty = True
                nudged_now = True
                log(f"{papel} tier={tier} work_state=stagnant acao=nudge-estagnacao")
            else:
                log(f"{papel} tier={tier} work_state=stagnant acao=cooldown({int(mins)}/{STAGNANT_COOLDOWN_MIN}min)")
        else:
            log(f"{papel} tier={tier} work_state=stagnant acao=log-only")

    ages = [a for a in (jsonl_age, hb_age) if isinstance(a, (int, float))]
    if not ages:
        continue  # sem sinal de idade disponivel -> nao da pra avaliar silencio
    age_s = min(ages)
    age_min = age_s / 60.0

    if age_min <= 45:
        continue  # saudavel para o criterio de silencio, nao loga

    acted = None
    if tier == 0:
        if age_min <= 90:
            acted = "nudge"
        else:
            cwd = entry.get("cwd")
            # Revive so com as DUAS provas negativas. Uma so nao basta:
            # a do cmux erra pos-crash, a de processo nao ve sessao em outra maquina.
            if claude_alive_in_cwd(cwd):
                acted = "nudge"
            elif session_alive_by_process(entry.get("session_id")):
                log(f"{papel} silencioso mas processo --resume vivo -> nudge (nao revive)")
                acted = "nudge"
            else:
                acted = "revive"
    elif tier == 1:
        if age_min > 60:
            acted = "nudge"

    # Um papel estagnado ha muito tempo satisfaz os DOIS criterios (estagnacao e
    # silencio). Sem isto ele levaria dois nudges no mesmo tick, e o segundo nao
    # respeita cooldown nenhum — anulando a razao de existir do cooldown.
    if acted == "nudge" and nudged_now:
        acted = "suprimido(ja nudgado por estagnacao)"

    log(f"{papel} tier={tier} age={age_min:.0f}min acao={acted or 'log-only'}")

    if acted == "nudge":
        msg = f"[watchdog] mudo ha {int(age_min)}min — execute um tick agora: leia o boot/QUEUE do papel, produza progresso ou registre bloqueio explicito."
        subprocess.run([os.path.join(SCRIPT_DIR, "terminal-send.sh"), papel, msg, "--force"])
    elif acted == "revive":
        def mark_fechado(r):
            e = r["terminais"][papel]
            e["estado"] = "fechado"
            e["workspace_uuid"] = None
        try:
            mutate(REGISTRY, mark_fechado)
            if mutate_falhas.pop(papel, None) is not None:
                state_dirty = True
        except Exception as e:
            # Este mutate roda DENTRO do processo do watchdog: excecao aqui abortaria
            # o tick inteiro e os papeis restantes nem seriam avaliados. Alem disso,
            # reabrir sem ter marcado fechado produziria duas instancias do papel.
            n = mutate_falhas.get(papel, 0) + 1
            mutate_falhas[papel] = n
            falhou_neste_tick.add(papel)
            state_dirty = True
            log(f"{papel} ERRO ao marcar fechado ({e}) — revive ABORTADO neste tick (falha {n})")
            # Falha cronica NAO pode viver so no log: um tier 0 que nao consegue ser
            # revivido fica sem vigia efetivo, e log que ninguem le e pior que verde cego.
            # Depois de ALERT_APOS ciclos seguidos, escala para o canal que o RESUMO le.
            if n == ALERT_APOS:
                try:
                    with open(ALERTAS, "a") as f:
                        f.write(
                            f"\n[{time.strftime('%Y-%m-%d %H:%M')}] WATCHDOG ALERTA: revive de "
                            f"{papel} (tier {tier}) falhou {n} ciclos seguidos — nao consegui escrever "
                            f"no registry ({e}). O papel segue 'aberto' e SEM vigia efetivo. "
                            f"Evidencia: docs/ai-state/terminais/watchdog.log.\n"
                        )
                except Exception as werr:
                    log(f"{papel} ERRO tambem ao escrever ALERTAS.md: {werr}")
            continue
        entry["estado"] = "fechado"
        entry["workspace_uuid"] = None
        subprocess.run([os.path.join(SCRIPT_DIR, "terminal-open.sh"), papel])

# O contador diz "ciclos SEGUIDOS" — entao qualquer tick que NAO falhou naquele
# papel zera. Sem isto, residuo de um episodio antigo somava com uma falha nova e
# o alerta saia na 1a falha dizendo "falhou 3 ciclos seguidos": o alerta mentia
# sobre a propria evidencia, que e o jeito mais rapido de queimar um canal.
# Cobre tambem papel que saiu do registry (contador orfao ficaria para sempre).
podado = {p: n for p, n in mutate_falhas.items() if p in falhou_neste_tick}
if podado != mutate_falhas:
    mutate_falhas = podado
    state_dirty = True

if state_dirty:
    wstate["last_stagnant_nudge"] = last_stagnant
    wstate["mutate_falhas"] = mutate_falhas
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(wstate, f, indent=2)
    os.replace(tmp, STATE_PATH)
PYEOF
