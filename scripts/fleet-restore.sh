#!/usr/bin/env bash
# fleet-restore.sh — restauração ORQUESTRADA da frota de terminais cmux após reboot/crash.
#
# Desenho: docs/workspace/PLANO-botao-restauracao-frota-cmux-2026-08-28.md (§3/§4 — versão
# corrigida, sem snapshot próprio). Fontes de leitura (nunca reimplementadas aqui):
#   - session-com.cmuxterm.app.json do cmux (resumeBinding + sessionId por painel)
#   - docs/ai-state/terminais/registry.json (papel -> tier/agent/cwd/worktree/branch/session_id)
#   - docs/ai-state/terminais/liveness.json (anotação de work_state; NUNCA gate de vivo)
#   - `cmux list-workspaces --id-format both` (verdade ao vivo — decide VIVO/pula)
#
# Restaura via terminal-open.sh <PAPEL> (papel conhecido) ou `cmux new-workspace --command
# <resumeBinding.command>` (órfão com agente). Nunca escreve em registry.json diretamente —
# quem muta é terminal-open.sh/terminal-resolve.sh (registry_lib.mutate, já com lock).
#
# Default é DRY-RUN. --apply executa de verdade.
set -euo pipefail

CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

T="${PAPEL_TERMINAIS_DIR:-$HOME/Claude/docs/ai-state/terminais}"
Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
REGISTRY="${FLEET_RESTORE_REGISTRY:-$T/registry.json}"
LIVENESS="${FLEET_RESTORE_LIVENESS:-$T/liveness.json}"
SESSION_JSON_DEFAULT="$HOME/Library/Application Support/cmux/session-com.cmuxterm.app.json"

TERMINAL_OPEN_BIN="${TERMINAL_OPEN_BIN:-$SCRIPT_DIR/terminal-open.sh}"
TERMINAL_RESOLVE_BIN="${TERMINAL_RESOLVE_BIN:-$SCRIPT_DIR/terminal-resolve.sh}"
CANAL_APPEND_BIN="${CANAL_APPEND_BIN:-$SCRIPT_DIR/canal-append.sh}"
MEMORY_PRESSURE_BIN="${MEMORY_PRESSURE_BIN:-memory_pressure}"

usage() {
  cat <<'EOF'
Uso: fleet-restore.sh [--apply] [--tier N]... [--papel PAPEL]... [--incluir-orfaos]
                       [--max-lote N] [--from <session.json>] [--tudo]

Restauração ORQUESTRADA da frota de terminais cmux (pós-reboot/crash), lendo as
fontes já vivas do cockpit — nunca cria um snapshot próprio.

Default é DRY-RUN: imprime o plano completo (o que faria, em que ordem, com que
comando) e sai 0 sem tocar em nada.

  --apply           executa de verdade (sem isso, só imprime o plano)
  --tier N          restringe a papéis deste tier (repetível: --tier 0 --tier 1)
  --papel X         restringe a este papel do registry (repetível)
  --incluir-orfaos  também restaura workspaces do cmux sem papel no registry
                     (ORFAO_COM_AGENTE via resumeBinding; SHELL_PURO só recria cwd)
  --max-lote N      tamanho do lote por onda de tier (default 3)
  --from PATH       usa este arquivo no lugar do session-*.json real do cmux
                     (para teste/auditoria — nunca aponte pra uma cópia velha em --apply real)
  --tudo            obrigatório quando --apply, sem --tier/--papel, restauraria >6 itens
  --help            esta mensagem

Fontes (só leitura):
  - ~/Library/Application Support/cmux/session-com.cmuxterm.app.json
    (windows[0].tabManager.workspaces[].panels[].terminal: agent, resumeBinding, wasAgentRunning)
  - docs/ai-state/terminais/registry.json (papel -> tier/agent/cwd/worktree/branch/session_id)
  - docs/ai-state/terminais/liveness.json (só anotação; nunca decide vivo/morto)
  - `cmux list-workspaces --id-format both` (verdade AO VIVO — decide VIVO)

Classificação por papel/workspace (união registry ∪ session json):
  VIVO              já existe no cmux (mesmo título) agora -> PULA (nunca duplica --resume)
  PAPEL             título casa com um papel do registry, mas não está vivo
                     -> terminal-open.sh <PAPEL> (ele já resolve cap/memória/worktree/registry)
  ORFAO_COM_AGENTE  sem papel no registry, mas o painel tem resumeBinding/agent.sessionId
                     -> cmux new-workspace --command <resumeBinding.command ou sintetizado>
                     (só com --incluir-orfaos)
  SHELL_PURO        sem agente e sem resumeBinding -> só recria o workspace com --cwd;
                     SEMPRE declara "comando não recuperável" no relatório (nunca finge)
                     (só com --incluir-orfaos)

Ordem: tier 0 -> 1 -> 2 -> 3 -> órfãos (uma onda final), em lotes de --max-lote.
Entre QUAISQUER dois lotes consecutivos (mesmo tier ou cruzando tier) mede-se
memory_pressure; aborta o restante (marcado "abortado") se livre < 20%.

Com --apply, ao final: grava docs/ai-state/terminais/fleet-restore-<ts>.md e
um resumo (<=300 chars) em ALERTAS via `canal-append.sh ALERTAS ... --papel
RESTORE --tipo INFO`. Chama terminal-resolve.sh <PAPEL> depois de cada papel
restaurado com sucesso (reconciliação do workspace_uuid no registry).

Sempre imprime, no final, a tabela `papel | tipo | acao | resultado`.

Recusa (exit != 0), sem tocar em nada:
  - cmux não responde (`cmux ping` falha)                              -> exit 2
  - --from aponta pra arquivo inexistente                              -> exit 2
  - --apply sem --tier/--papel restaurando >6 itens sem --tudo         -> exit 3
EOF
}

APPLY=0
INCLUIR_ORFAOS=0
TUDO=0
MAX_LOTE=3
SESSION_JSON="$SESSION_JSON_DEFAULT"
SESSION_JSON_EXPLICIT=0
TIERS=()
PAPEIS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --apply) APPLY=1; shift ;;
    --incluir-orfaos) INCLUIR_ORFAOS=1; shift ;;
    --tudo) TUDO=1; shift ;;
    --tier)
      [[ $# -ge 2 ]] || { echo "RECUSADO: --tier exige valor" >&2; exit 2; }
      [[ "$2" =~ ^[0-3]$ ]] || { echo "RECUSADO: --tier precisa ser 0, 1, 2 ou 3 (recebido: $2)" >&2; exit 2; }
      TIERS+=("$2"); shift 2 ;;
    --papel)
      [[ $# -ge 2 ]] || { echo "RECUSADO: --papel exige valor" >&2; exit 2; }
      PAPEIS+=("$2"); shift 2 ;;
    --max-lote)
      [[ $# -ge 2 ]] || { echo "RECUSADO: --max-lote exige valor" >&2; exit 2; }
      MAX_LOTE="$2"; shift 2 ;;
    --from)
      [[ $# -ge 2 ]] || { echo "RECUSADO: --from exige valor" >&2; exit 2; }
      SESSION_JSON="$2"; SESSION_JSON_EXPLICIT=1; shift 2 ;;
    -*) echo "flag desconhecida: $1 (--help para uso)" >&2; exit 2 ;;
    *) echo "argumento posicional inesperado: $1 (--help para uso)" >&2; exit 2 ;;
  esac
done

if [[ ! "$MAX_LOTE" =~ ^[0-9]+$ || "$MAX_LOTE" -lt 1 ]]; then
  echo "RECUSADO: --max-lote precisa ser inteiro >= 1 (recebido: $MAX_LOTE)" >&2
  exit 2
fi

if [[ "$SESSION_JSON_EXPLICIT" -eq 1 && ! -f "$SESSION_JSON" ]]; then
  echo "RECUSADO: --from aponta pra arquivo inexistente: $SESSION_JSON" >&2
  exit 2
fi

TIERS_CSV=""
if [[ "${#TIERS[@]}" -gt 0 ]]; then
  TIERS_CSV="$(IFS=,; echo "${TIERS[*]}")"
fi
PAPEIS_CSV=""
if [[ "${#PAPEIS[@]}" -gt 0 ]]; then
  PAPEIS_CSV="$(IFS=,; echo "${PAPEIS[*]}")"
fi

REGISTRY="$REGISTRY" LIVENESS="$LIVENESS" SESSION_JSON="$SESSION_JSON" \
SESSION_JSON_EXPLICIT="$SESSION_JSON_EXPLICIT" CMUX_BIN="$CMUX_BIN" \
TERMINAL_OPEN_BIN="$TERMINAL_OPEN_BIN" TERMINAL_RESOLVE_BIN="$TERMINAL_RESOLVE_BIN" \
CANAL_APPEND_BIN="$CANAL_APPEND_BIN" MEMORY_PRESSURE_BIN="$MEMORY_PRESSURE_BIN" \
APPLY="$APPLY" INCLUIR_ORFAOS="$INCLUIR_ORFAOS" TUDO="$TUDO" MAX_LOTE="$MAX_LOTE" \
TIERS_CSV="$TIERS_CSV" PAPEIS_CSV="$PAPEIS_CSV" T="$T" \
FLEET_RESTORE_SLEEP_SECS="${FLEET_RESTORE_SLEEP_SECS:-5}" \
FLEET_RESTORE_MEM_FREE_PCT="${FLEET_RESTORE_MEM_FREE_PCT:-}" \
python3 <<'PYEOF'
import json
import os
import re
import subprocess
import sys
import tempfile
import time

REGISTRY = os.environ["REGISTRY"]
LIVENESS = os.environ["LIVENESS"]
SESSION_JSON = os.environ["SESSION_JSON"]
SESSION_JSON_EXPLICIT = os.environ["SESSION_JSON_EXPLICIT"] == "1"
CMUX_BIN = os.environ["CMUX_BIN"]
TERMINAL_OPEN_BIN = os.environ["TERMINAL_OPEN_BIN"]
TERMINAL_RESOLVE_BIN = os.environ["TERMINAL_RESOLVE_BIN"]
CANAL_APPEND_BIN = os.environ["CANAL_APPEND_BIN"]
MEMORY_PRESSURE_BIN = os.environ["MEMORY_PRESSURE_BIN"]
APPLY = os.environ["APPLY"] == "1"
INCLUIR_ORFAOS = os.environ["INCLUIR_ORFAOS"] == "1"
TUDO = os.environ["TUDO"] == "1"
MAX_LOTE = int(os.environ["MAX_LOTE"])
TIERS_SET = {int(x) for x in os.environ.get("TIERS_CSV", "").split(",") if x.strip().isdigit()}
PAPEIS_SET = {x for x in os.environ.get("PAPEIS_CSV", "").split(",") if x.strip()}
T = os.environ["T"]
SLEEP_SECS = float(os.environ.get("FLEET_RESTORE_SLEEP_SECS", "5") or "5")
MEM_FREE_OVERRIDE = os.environ.get("FLEET_RESTORE_MEM_FREE_PCT", "").strip()

NOW = time.time()
TS_ISO = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(NOW))
TS_COMPACT = time.strftime("%Y%m%d-%H%M%S", time.gmtime(NOW))

WS_LINE_RE = re.compile(r'^\*?\s*workspace:\d+\s+([0-9A-Fa-f-]{36})\s+(.*?)(\s+\[selected\])?$')
TIER_PREFIX_RE = re.compile(r'^(\d+)\s')


def cmux_env():
    e = dict(os.environ)
    e["CMUX_QUIET"] = "1"
    # Restaurar NAO e crescer a frota: e voltar ao estado anterior ao crash. O cap
    # existe para impedir crescimento nao intencional (quem abre pela UI passa por
    # fora dele de qualquer jeito) — bloquear a restauracao por cap deixaria papeis
    # de fora justamente quando a frota inteira precisa voltar. A trava de MEMORIA
    # do terminal-open NAO e pulada: essa e fisica e protege contra o panic por
    # vm-compressor que ja aconteceu nesta maquina.
    e["TERMINAL_OPEN_SKIP_CAP"] = "1"
    return e


def run_cmux(args, timeout=30):
    try:
        return subprocess.run(
            [CMUX_BIN, *args], capture_output=True, text=True, timeout=timeout, env=cmux_env()
        )
    except FileNotFoundError:
        return subprocess.CompletedProcess(args, 127, "", f"binário não encontrado: {CMUX_BIN}")
    except subprocess.TimeoutExpired:
        return subprocess.CompletedProcess(args, 124, "", "timeout")


def atomic_write(path, content):
    d = os.path.dirname(path) or "."
    os.makedirs(d, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".fleet-restore-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.chmod(tmp, 0o644)
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def safe_load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


# --- guarda 1: cmux precisa responder ANTES de qualquer outra coisa ---
ping = run_cmux(["ping"])
if ping.returncode != 0:
    msg = (ping.stderr or ping.stdout or "").strip()[:200]
    print(f"RECUSADO: cmux não responde (ping rc={ping.returncode}: {msg})", file=sys.stderr)
    sys.exit(2)

# --- fonte 1: session-*.json do cmux (frescor + leitura) ---
session = None
session_missing = not os.path.isfile(SESSION_JSON)
if session_missing:
    if SESSION_JSON_EXPLICIT:
        print(f"RECUSADO: --from aponta pra arquivo inexistente: {SESSION_JSON}", file=sys.stderr)
        sys.exit(2)
    print(
        f"AVISO: session-*.json não encontrado em {SESSION_JSON} — seguindo SEM detecção de "
        "órfãos (só o registry decide PAPEL/VIVO).",
        file=sys.stderr,
    )
else:
    age_min = (NOW - os.path.getmtime(SESSION_JSON)) / 60.0
    if age_min > 60:
        banner = "!" * 70
        for stream in (sys.stdout, sys.stderr):
            print(banner, file=stream)
            print(
                f"AVISO: session-*.json com {age_min:.0f} min de idade (> 60) — ESTADO "
                "POSSIVELMENTE DEFASADO. Confira antes de aplicar de verdade.",
                file=stream,
            )
            print(banner, file=stream)
    try:
        with open(SESSION_JSON, encoding="utf-8") as f:
            session = json.load(f)
    except Exception as e:
        print(f"AVISO: session-*.json ilegível ({e}) — seguindo sem detecção de órfãos.", file=sys.stderr)
        session = None

# --- fonte 2: registry.json (obrigatória) ---
if not os.path.isfile(REGISTRY):
    print(f"RECUSADO: registry não encontrado: {REGISTRY}", file=sys.stderr)
    sys.exit(1)
registry = safe_load(REGISTRY, {"terminais": {}})
terminais = registry.get("terminais") or {}

# --- fonte 3: liveness.json (só anotação — nunca gate) ---
liveness = safe_load(LIVENESS, {"terminais": {}})
liv_terminais = liveness.get("terminais") or {}

# --- fonte 4: cmux list-workspaces --id-format both (verdade AO VIVO) ---
lw = run_cmux(["list-workspaces", "--id-format", "both"])
if lw.returncode != 0:
    print(
        f"AVISO: `cmux list-workspaces` falhou (rc={lw.returncode}) — tratando frota como vazia "
        "(nada será considerado VIVO).",
        file=sys.stderr,
    )
live_text = lw.stdout if lw.returncode == 0 else ""
live_titles = {}
for line in live_text.splitlines():
    line = line.rstrip()
    if not line.strip():
        continue
    m = WS_LINE_RE.match(line)
    if not m:
        continue
    uuid, title = m.group(1), m.group(2).strip()
    live_titles[title] = uuid

# --- session json: título -> workspace dict (pra painéis extras + órfãos) ---
session_by_title = {}
if session:
    try:
        for w in session["windows"][0]["tabManager"]["workspaces"]:
            title = (w.get("customTitle") or "").strip()
            if title:
                session_by_title[title] = w
    except Exception:
        session_by_title = {}


def extra_panel_note(title):
    w = session_by_title.get(title)
    if not w:
        return ""
    panels = w.get("panels") or []
    if len(panels) <= 1:
        return ""
    extra = sum(1 for p in panels[1:] if not ((p.get("terminal") or {}).get("agent")))
    if extra <= 0:
        return ""
    return f" [+{extra} painel(is) extra(s) sem agente, não restaurado(s) — gap conhecido]"


rows = []

# 1) papéis do registry
title_to_papel = {}
for papel, entry in terminais.items():
    title = entry.get("workspace_title") or ""
    title_to_papel[title] = papel
    live_uuid = live_titles.get(title)
    tier = entry.get("tier")
    estado_registry = entry.get("estado")
    rec = {
        "papel": papel,
        "tier": tier,
        "title": title,
        "agent": entry.get("agent"),
        "cwd": entry.get("cwd"),
        "session_id": entry.get("session_id"),
        "resume_command": None,
        "work_state": (liv_terminais.get(papel) or {}).get("work_state"),
        "note": extra_panel_note(title),
    }
    if live_uuid:
        rec["tipo"] = "VIVO"
        if estado_registry == "fechado":
            rec["note"] += " [drift: registry marcava fechado, mas está vivo no cmux]"
    else:
        rec["tipo"] = "PAPEL"
        if estado_registry == "aberto":
            rec["note"] += " [drift: registry marcava aberto, mas não está vivo]"
    rows.append(rec)

# 2) workspaces do session json sem papel no registry -> órfãos
if session_by_title:
    for title, w in session_by_title.items():
        if title in title_to_papel:
            continue
        panels = w.get("panels") or []
        panel0 = panels[0] if panels else {}
        term = panel0.get("terminal") or {}
        agent = term.get("agent") or {}
        rb = term.get("resumeBinding") or {}
        cwd = term.get("workingDirectory") or w.get("currentDirectory")
        live_uuid = live_titles.get(title)
        m = TIER_PREFIX_RE.match(title)
        tier = int(m.group(1)) if m else None
        agent_kind = agent.get("kind")
        session_id = agent.get("sessionId")
        resume_command = rb.get("command")
        rec = {
            "papel": None,
            "tier": tier,
            "title": title,
            "agent": agent_kind,
            "cwd": cwd,
            "session_id": session_id,
            "resume_command": resume_command,
            "work_state": None,
            "note": extra_panel_note(title),
        }
        if live_uuid:
            rec["tipo"] = "VIVO"
        elif session_id or resume_command:
            rec["tipo"] = "ORFAO_COM_AGENTE"
        else:
            rec["tipo"] = "SHELL_PURO"
            rec["note"] = rec["note"] + " comando não recuperável (shell puro)"
        rows.append(rec)


def compute_included(rec):
    if rec["tipo"] == "VIVO":
        return False
    if rec["papel"]:
        if not TIERS_SET and not PAPEIS_SET:
            return True
        return (rec["tier"] in TIERS_SET) or (rec["papel"] in PAPEIS_SET)
    return INCLUIR_ORFAOS


for rec in rows:
    rec["included"] = compute_included(rec)
    rec["group"] = rec["tier"] if (rec["papel"] and rec["tier"] is not None) else 99
    if rec["group"] not in (0, 1, 2, 3):
        rec["group"] = 99

# ordena: grupo (0..3, órfãos=99 por último), depois papel/título
rows.sort(key=lambda r: (r["group"], r["papel"] or r["title"]))

count_included = sum(1 for r in rows if r["included"])

# --- guarda 2: --apply sem --tier/--papel tentando >6 itens exige --tudo ---
gate_blocked = False
if APPLY and not TIERS_SET and not PAPEIS_SET and count_included > 6 and not TUDO:
    gate_blocked = True
    print(
        f"RECUSADO: --apply sem --tier/--papel restauraria {count_included} itens (> 6). "
        "Isso é caro (freeze/panic já aconteceu nesta máquina). Passe --tudo pra confirmar a "
        "intenção, ou restrinja com --tier/--papel.",
        file=sys.stderr,
    )

# --- monta ação/resultado por linha ---
for r in rows:
    papel = r["papel"]
    tipo = r["tipo"]
    if tipo == "VIVO":
        r["acao"] = "-"
        base = f"pulado (vivo)"
        if r["work_state"]:
            base += f"; work_state={r['work_state']}"
        r["resultado"] = base
    elif not r["included"]:
        r["acao"] = "-"
        if papel:
            r["resultado"] = "não incluído (fora do filtro --tier/--papel)"
        else:
            r["resultado"] = "não incluído (use --incluir-orfaos)"
    else:
        if papel:
            r["acao"] = f"terminal-open.sh {papel}"
        elif tipo == "ORFAO_COM_AGENTE":
            cmd = r["resume_command"]
            if not cmd and r["session_id"]:
                if r["agent"] == "claude":
                    cmd = f"claude --dangerously-skip-permissions --resume {r['session_id']}"
                elif r["agent"] == "codex":
                    cmd = f"codex --dangerously-bypass-approvals-and-sandbox resume {r['session_id']}"
            r["_synth_command"] = cmd
            r["acao"] = f"cmux new-workspace --command <{'resumeBinding' if r['resume_command'] else 'sintetizado'}>"
        else:  # SHELL_PURO
            r["acao"] = "cmux new-workspace --cwd (sem --command)"
        r["resultado"] = "planejado" if not APPLY else "pendente"

    if r["note"]:
        r["resultado"] = (r["resultado"] + r["note"]).strip()


def print_table(rows):
    lines = ["| papel | tipo | acao | resultado |", "|---|---|---|---|"]
    for r in rows:
        papel_disp = f"{r['papel']} (t{r['tier']})" if r["papel"] else f"(órfão) {r['title']}"
        lines.append(f"| {papel_disp} | {r['tipo']} | {r['acao']} | {r['resultado']} |")
    table = "\n".join(lines)
    print(table)
    return table


def counts_summary(rows):
    n_vivo = sum(1 for r in rows if r["tipo"] == "VIVO")
    n_restaurado = sum(1 for r in rows if r["resultado"].startswith("restaurado"))
    n_falhou = sum(1 for r in rows if r["resultado"].startswith("falhou"))
    n_abortado = sum(1 for r in rows if r["resultado"].startswith("abortado"))
    n_nao_incluido = sum(1 for r in rows if r["resultado"].startswith("não incluído"))
    n_planejado = sum(1 for r in rows if r["resultado"].startswith("planejado"))
    return dict(
        vivo=n_vivo,
        restaurado=n_restaurado,
        falhou=n_falhou,
        abortado=n_abortado,
        nao_incluido=n_nao_incluido,
        planejado=n_planejado,
    )


print(
    f"=== fleet-restore {'APPLY' if APPLY else 'DRY-RUN'} — {TS_ISO} — "
    f"{count_included} item(ns) selecionado(s) pra restaurar ==="
)

if gate_blocked:
    for r in rows:
        if r["included"]:
            r["resultado"] = "não executado (recusado: use --tudo)"
    print_table(rows)
    sys.exit(3)

if not APPLY:
    print_table(rows)
    print(f"\n(dry-run — nada foi tocado; rode com --apply pra executar de verdade)")
    sys.exit(0)

# ================= execução (só chega aqui com --apply e gate liberado) =================


def restore_papel(papel):
    try:
        p = subprocess.run(
            [TERMINAL_OPEN_BIN, papel], capture_output=True, text=True, timeout=180, env=cmux_env()
        )
    except Exception as e:
        return False, f"erro ao chamar terminal-open.sh: {e}"
    if p.returncode != 0:
        err_lines = [ln for ln in (p.stderr or "").splitlines() if ln.strip()]
        reason = err_lines[-1] if err_lines else f"exit {p.returncode}"
        return False, reason
    return True, "restaurado via terminal-open.sh"


def reconcile(papel):
    try:
        subprocess.run(
            [TERMINAL_RESOLVE_BIN, papel], capture_output=True, text=True, timeout=30, env=cmux_env()
        )
    except Exception:
        pass  # reconciliação é best-effort; não derruba o restore que já aconteceu


def restore_orphan(rec):
    cwd = rec["cwd"]
    if not cwd or not os.path.isdir(cwd):
        return False, f"cwd inexistente: {cwd}"
    title = rec["title"]
    args = ["--json", "new-workspace", "--name", title, "--cwd", cwd, "--focus", "false"]
    if rec["tipo"] == "ORFAO_COM_AGENTE":
        cmd = rec.get("_synth_command") or rec.get("resume_command")
        if cmd:
            args += ["--command", cmd]
    p = run_cmux(args, timeout=60)
    if p.returncode != 0:
        detail = (p.stderr or p.stdout or "").strip()[:200]
        return False, f"cmux new-workspace falhou: {detail}"
    return True, "workspace recriado"


def mem_free_pct():
    if MEM_FREE_OVERRIDE:
        try:
            return int(MEM_FREE_OVERRIDE)
        except ValueError:
            pass
    try:
        p = subprocess.run([MEMORY_PRESSURE_BIN], capture_output=True, text=True, timeout=15)
        out_lines = [ln for ln in p.stdout.splitlines() if ln.strip()]
        last = out_lines[-1] if out_lines else ""
        m = re.search(r"(\d+)", last)
        return int(m.group(1)) if m else 100
    except Exception:
        return 100


groups = {0: [], 1: [], 2: [], 3: [], 99: []}
for r in rows:
    if r["included"]:
        groups[r["group"]].append(r)

abort_reason = None
first_batch = True
for g in (0, 1, 2, 3, 99):
    items = groups[g]
    if not items:
        continue
    batches = [items[i : i + MAX_LOTE] for i in range(0, len(items), MAX_LOTE)]
    for batch in batches:
        if abort_reason:
            for r in batch:
                r["resultado"] = f"abortado (memória insuficiente: {abort_reason}){r['note']}"
            continue
        if not first_batch:
            free = mem_free_pct()
            if free < 20:
                abort_reason = f"{free}% livre < 20% antes do próximo lote"
                print(f"ABORTADO: {abort_reason} — restante marcado como não executado", file=sys.stderr)
                for r in batch:
                    r["resultado"] = f"abortado (memória insuficiente: {abort_reason}){r['note']}"
                continue
        first_batch = False
        for r in batch:
            if r["papel"]:
                ok, msg = restore_papel(r["papel"])
            else:
                ok, msg = restore_orphan(r)
            r["resultado"] = ("restaurado: " if ok else "falhou: ") + msg
            if r["note"]:
                r["resultado"] += r["note"]
            if ok and r["papel"]:
                reconcile(r["papel"])
            time.sleep(SLEEP_SECS)

table_md = print_table(rows)
summary = counts_summary(rows)
summary_line = (
    f"restaurado={summary['restaurado']} pulado_vivo={summary['vivo']} "
    f"falhou={summary['falhou']} abortado={summary['abortado']} "
    f"nao_incluido={summary['nao_incluido']}"
)
print(f"\n{summary_line}")

report_name = f"fleet-restore-{TS_COMPACT}.md"
report_path = os.path.join(T, report_name)
report_content = (
    f"# fleet-restore — {TS_ISO}\n\n"
    f"{summary_line}\n\n"
    f"{table_md}\n"
)
try:
    atomic_write(report_path, report_content)
    print(f"relatório: {report_path}")
except Exception as e:
    print(f"AVISO: falha ao gravar relatório {report_path}: {e}", file=sys.stderr)

resumo = f"fleet-restore concluído: {summary_line} — ver {report_name}"
if len(resumo) > 300:
    resumo = resumo[:297] + "..."
try:
    cp = subprocess.run(
        [CANAL_APPEND_BIN, "ALERTAS", resumo, "--papel", "RESTORE", "--tipo", "INFO"],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if cp.returncode != 0:
        print(f"AVISO: canal-append.sh falhou (rc={cp.returncode}): {(cp.stderr or '').strip()[:200]}", file=sys.stderr)
except Exception as e:
    print(f"AVISO: falha ao chamar canal-append.sh: {e}", file=sys.stderr)

sys.exit(0)
PYEOF
