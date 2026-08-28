#!/usr/bin/env bash
# terminais-liveness.sh — coleta estado dos terminais/daemons/launchd e escreve
# liveness.json (escrita atomica via tmp+mv). Cada coleta falha isolada.
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Uso: terminais-liveness.sh

Sem argumentos. Le registry.json + cmux (workspaces/sessions/status/rpc
feed.list) + daemons HTTP + launchd, e escreve
docs/ai-state/terminais/liveness.json (escrita atomica via tmp+mv).
Cada coleta individual falha isolada (nunca derruba o script inteiro);
itens que falharem aparecem como null/"down"/[] no JSON de saida.
EOF
  exit 0
fi

CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
OUT="$T/liveness.json"
mkdir -p "$T"

CMUX_BIN="$CMUX_BIN" REGISTRY="$REGISTRY" OUT="$OUT" python3 <<'PYEOF'
import json, os, re, subprocess, time
import urllib.request, urllib.error

CMUX_BIN = os.environ["CMUX_BIN"]
REGISTRY = os.environ["REGISTRY"]
OUT = os.environ["OUT"]
HOME = os.path.expanduser("~")

STAGNANT_AFTER_S = int(os.environ.get("STAGNANT_AFTER_S", "900"))
BUSY_WINDOW_S = int(os.environ.get("BUSY_WINDOW_S", "300"))


def work_state(list_status, jsonl_age, growing, hb_age, codex_pids, cadencia_seg=None):
    """Separa ATIVIDADE de PROGRESSO.

    O watchdog media so SILENCIO (idade do ultimo sinal). Um agente preso em
    loop — repetindo a mesma chamada com erro por 40 min — produz sinal o tempo
    todo: age fica pequena e ele passa despercebido. Este campo distingue:

      progressing — subagente escrevendo agora (prova de trabalho novo)
      busy        — sinal recente, mas sem prova de avanco
      stagnant    — o agente se declara ocupado E nao ha avanco ha
                    STAGNANT_AFTER_S: e o loop de erro. Acionavel.
      aguardando_ciclo — papel de cadencia declarada, dentro da janela dele
      quiet       — sem sinal recente (o watchdog ja cobre por idade)
      unknown     — sem dado suficiente; NUNCA inferir saude a partir de ausencia

    "productive" (o output vale alguma coisa) nao e mensuravel por mtime e
    deliberadamente nao existe aqui.
    """
    ages = [a for a in (jsonl_age, hb_age) if isinstance(a, (int, float))]
    if not ages and not codex_pids:
        return "unknown"
    age = min(ages) if ages else None

    if growing:
        return "progressing"

    declara_ocupado = bool(list_status and any(
        t in list_status.lower() for t in ("running", "busy", "working", "thinking")
    ))
    # EXPECTATIVA DECLARADA (28/08): papel que trabalha em CICLOS (RESUMO horario,
    # COMANDO ~20min) fica com transcript parado ENTRE ciclos e a pill do cmux diz
    # "Running" — isso e o estado NORMAL, nao estagnacao. Sem esta regra o watchdog
    # nudge-ava o RESUMO 1x/hora (3 falsos em 27/08), e nudge cronicamente falso
    # treina o agente a ignorar o verdadeiro. Regra: com cadencia declarada, o limiar
    # e max(STAGNANT_AFTER_S, cadencia*1.5); dentro da janela o estado e
    # "aguardando_ciclo" (vivo por desenho), nunca "stagnant".
    limiar = STAGNANT_AFTER_S
    if isinstance(cadencia_seg, (int, float)) and cadencia_seg > 0:
        limiar = max(STAGNANT_AFTER_S, cadencia_seg * 1.5)
        if declara_ocupado and age is not None and age <= limiar:
            return "aguardando_ciclo"
    if declara_ocupado and age is not None and age > limiar:
        return "stagnant"
    if age is not None and age <= BUSY_WINDOW_S:
        return "busy"
    return "quiet"


def safe(fn, default):
    try:
        return fn()
    except Exception:
        return default

def run(args, timeout=8):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)

now = time.time()
ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now))

def get_mem():
    r = run(["memory_pressure"], timeout=5)
    line = r.stdout.strip().splitlines()[-1]
    m = re.search(r'(\d+)\s*%', line)
    return int(m.group(1)) if m else None
mem_free_pct = safe(get_mem, None)

def get_rate_limits():
    with open("/tmp/.claude-rate-limits") as f:
        raw = f.read().strip()
    d = {}
    for part in raw.split("|"):
        if "=" in part:
            k, v = part.split("=", 1)
            d[k] = v
    return d
rate_limits = safe(get_rate_limits, {})

try:
    with open(REGISTRY) as f:
        reg = json.load(f)
    registry_error = None
except Exception as e:
    reg = {}
    registry_error = str(e)
terminais_reg = reg.get("terminais", {})

def get_workspaces():
    r = run([CMUX_BIN, "list-workspaces", "--id-format", "both"], timeout=8)
    out = []
    for line in r.stdout.splitlines():
        line = line.rstrip()
        if not line.strip():
            continue
        m = re.match(r'^\*?\s*workspace:\d+\s+([0-9A-Fa-f-]{36})\s+(.*?)(\s+\[selected\])?$', line)
        if not m:
            continue
        out.append({
            "uuid": m.group(1),
            "title": m.group(2).strip(),
            "selected": bool(m.group(3)),
        })
    return out
workspaces = safe(get_workspaces, [])
title_to_uuid = {w["title"]: w["uuid"] for w in workspaces}

def get_sessions_count(agent):
    r = run([CMUX_BIN, "sessions", "--agent", agent, "--json"], timeout=8)
    d = json.loads(r.stdout)
    return len(d.get("sessions", []))
sessions_cmux = {
    "claude": safe(lambda: get_sessions_count("claude"), None),
    "codex": safe(lambda: get_sessions_count("codex"), None),
}

def get_feed_pending():
    r = run([CMUX_BIN, "rpc", "feed.list", "{}"], timeout=8)
    d = json.loads(r.stdout)
    return len(d.get("items", []))
feed_items_pending = safe(get_feed_pending, None)

def check_daemon(port):
    req = urllib.request.Request(f"http://127.0.0.1:{port}/health", method="GET")
    try:
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return "down"
daemons = {
    "visao": safe(lambda: check_daemon(8791), "down"),
    "lousa": safe(lambda: check_daemon(8792), "down"),
    "rosto": safe(lambda: check_daemon(8790), "down"),
    "gusman_os": safe(lambda: check_daemon(4577), "down"),
}

LAUNCHD_LABELS = [
    "com.raiz.terminais-watchdog",
    "com.raiz.terminais-liveness",
    "com.raiz.radar-prazos",
    "com.raiz.de-plantao-caffeinate",
    "com.raiz.de-plantao-watchdog",
]
def get_launchd():
    r = run(["launchctl", "list"], timeout=5)
    rows = {}
    for line in r.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) != 3:
            continue
        pid, status, label = parts
        rows[label] = pid
    return {lbl: rows.get(lbl, "-") for lbl in LAUNCHD_LABELS}
launchd = safe(get_launchd, {lbl: "-" for lbl in LAUNCHD_LABELS})

def get_codex_procs():
    r = run(["pgrep", "-x", "codex"], timeout=5)
    pids = [p for p in r.stdout.split() if p]
    result = {}
    for pid in pids:
        psr = run(["ps", "-o", "command=", "-p", pid], timeout=5)
        cmdline = psr.stdout.strip()
        if "mcp-server" in cmdline or "app-server" in cmdline:
            continue
        cwd = None
        try:
            lsofr = run(["lsof", "-a", "-d", "cwd", "-p", pid], timeout=5)
            lines = lsofr.stdout.splitlines()
            if len(lines) > 1:
                cols = lines[1].split()
                if cols:
                    cwd = cols[-1]
        except Exception:
            pass
        rollouts = []
        try:
            lsofr2 = run(["lsof", "-p", pid], timeout=5)
            for l in lsofr2.stdout.splitlines():
                if "rollout-" in l:
                    rollouts.append(l.split()[-1])
        except Exception:
            pass
        result[pid] = {"cwd": cwd, "rollouts": rollouts}
    return result
codex_procs = safe(get_codex_procs, {})

terminais_out = {}
for papel, entry in terminais_reg.items():
    def build(papel=papel, entry=entry):
        estado_registry = entry.get("estado")
        title = entry.get("workspace_title")
        live_uuid = title_to_uuid.get(title)
        workspace_found = live_uuid is not None

        list_status = None
        if live_uuid:
            try:
                r = run([CMUX_BIN, "list-status", "--workspace", live_uuid], timeout=5)
                list_status = r.stdout.strip() or None
            except Exception:
                list_status = None

        cwd = entry.get("cwd")
        session_id = entry.get("session_id")
        jsonl_mtime_age_s = None
        agent_jsonl_growing = False
        if cwd and session_id:
            proj_dir_name = cwd.replace("/", "-")
            proj_dir = os.path.join(HOME, ".claude", "projects", proj_dir_name)
            jsonl_path = os.path.join(proj_dir, f"{session_id}.jsonl")
            if not os.path.exists(jsonl_path):
                # sessao retomada de outro cwd: o transcript fica na pasta do projeto ORIGINAL
                import glob as _glob
                _hits = _glob.glob(os.path.join(HOME, ".claude", "projects", "*", f"{session_id}.jsonl"))
                if _hits:
                    jsonl_path = _hits[0]
                    proj_dir = os.path.dirname(jsonl_path)
            if os.path.exists(jsonl_path):
                jsonl_mtime_age_s = int(now - os.path.getmtime(jsonl_path))
            if os.path.isdir(proj_dir):
                for fname in os.listdir(proj_dir):
                    if fname.startswith("agent-") and fname.endswith(".jsonl"):
                        fpath = os.path.join(proj_dir, fname)
                        if now - os.path.getmtime(fpath) < 600:
                            agent_jsonl_growing = True
                            break

        heartbeat_age_s = None
        hb_rel = entry.get("heartbeat")
        if hb_rel:
            hb_path = os.path.join(HOME, "Claude", hb_rel)
            if os.path.exists(hb_path):
                heartbeat_age_s = int(now - os.path.getmtime(hb_path))

        codex_pids = []
        codex_rollouts = []
        if entry.get("agent") == "codex" and cwd:
            for pid, info in codex_procs.items():
                pcwd = info.get("cwd") or ""
                if pcwd == cwd or pcwd.startswith(cwd.rstrip("/") + "/"):
                    codex_pids.append(pid)
                    codex_rollouts.extend(info.get("rollouts", []))

        return {
            "estado_registry": estado_registry,
            "workspace_found": workspace_found,
            "list_status": list_status,
            "jsonl_mtime_age_s": jsonl_mtime_age_s,
            "agent_jsonl_growing": agent_jsonl_growing,
            "heartbeat_age_s": heartbeat_age_s,
            "work_state": work_state(
                list_status, jsonl_mtime_age_s, agent_jsonl_growing,
                heartbeat_age_s, codex_pids,
                entry.get("cadencia_seg"),
            ),
            "codex_pids": codex_pids,
            "codex_rollouts": codex_rollouts,
        }
    terminais_out[papel] = safe(build, {
        "estado_registry": entry.get("estado"),
        "workspace_found": False,
        "list_status": None,
        "jsonl_mtime_age_s": None,
        "agent_jsonl_growing": False,
        "heartbeat_age_s": None,
        "work_state": "unknown",
        "codex_pids": [],
        "codex_rollouts": [],
        "erro_coleta": True,
    })

out = {
    "ts": ts,
    "registry_error": registry_error,
    "memory_free_pct": mem_free_pct,
    "rate_limits": rate_limits,
    "workspaces": workspaces,
    "terminais": terminais_out,
    "daemons": daemons,
    "launchd": launchd,
    "feed_items_pending": feed_items_pending,
    "sessions_cmux": sessions_cmux,
}

tmp = OUT + ".tmp"
with open(tmp, "w") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
    f.write("\n")
os.replace(tmp, OUT)
print(f"liveness.json escrito: {OUT}")
PYEOF
