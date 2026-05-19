#!/usr/bin/env bash
# baseline-machines.sh — Baseline de custo/duracao por machine ag-0..ag-13.
#
# Le sessoes em ~/.claude/projects/*/session-*.jsonl, agrega metricas por
# machine invocada, gera relatorio em docs/diagnosticos/.
#
# Uso:
#   bash ~/Claude/.claude/scripts/baseline-machines.sh [--last-n=20] [--out=PATH]
#
# Output:
#   ~/Claude/docs/diagnosticos/baseline-machines-YYYY-MM-DD.md
#
# Metricas por machine:
#   - invocacoes (count)
#   - tokens input/output (mean, p95)
#   - duracao p50/p95 (segundos)
#   - taxa de convergencia (atingiu score-alvo? — heuristica: nao houve gap report)
#   - skills/agents mais invocados em conjunto
#   - hooks acionados (frequencia)
set -euo pipefail

LAST_N="${LAST_N:-20}"
OUT_DIR="${HOME}/Claude/docs/diagnosticos"
OUT_FILE="${OUT_DIR}/baseline-machines-$(date +%Y-%m-%d).md"
SESSIONS_DIR="${HOME}/.claude/projects"

# Parse args
for arg in "$@"; do
  case "$arg" in
    --last-n=*) LAST_N="${arg#*=}" ;;
    --out=*)    OUT_FILE="${arg#*=}" ;;
    --help|-h)
      sed -n '2,20p' "$0"
      exit 0
      ;;
  esac
done

mkdir -p "$OUT_DIR"

if [ ! -d "$SESSIONS_DIR" ]; then
  echo "ERRO: $SESSIONS_DIR nao existe" >&2
  exit 1
fi

# Verifica dependencias
for cmd in jq python3 find; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "ERRO: $cmd nao instalado" >&2; exit 1; }
done

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Encontra ultimas N sessoes JSONL (modificadas)
# Desabilita pipefail nesta linha: head fecha o pipe → SIGPIPE em xargs/sort vira erro com pipefail.
set +o pipefail
find "$SESSIONS_DIR" -name "*.jsonl" -type f -print0 2>/dev/null \
  | xargs -0 stat -f '%m %N' 2>/dev/null \
  | sort -rn \
  | head -n "$LAST_N" \
  | awk '{print $2}' > "$TMP/sessions.txt"
set -o pipefail

N_SESSIONS="$(wc -l < "$TMP/sessions.txt" | tr -d ' ')"

if [ "$N_SESSIONS" = "0" ]; then
  echo "ERRO: nenhuma sessao encontrada em $SESSIONS_DIR" >&2
  exit 1
fi

# Extrai eventos relevantes por sessao
# Para cada session.jsonl: tool_use de Agent/Skill, tokens (usage), timestamps.
python3 - "$TMP/sessions.txt" "$TMP/agg.json" <<'PY'
import json
import os
import sys
from collections import defaultdict
from datetime import datetime

sessions_file, out_file = sys.argv[1], sys.argv[2]

MACHINES = [f"ag-{i}" for i in range(0, 14)]
agg = defaultdict(lambda: {
    "invocations": 0,
    "tokens_in": [],
    "tokens_out": [],
    "duration_s": [],
    "skills_co_invoked": defaultdict(int),
    "hooks_fired": defaultdict(int),
    "gap_reports": 0,
})

with open(sessions_file) as f:
    paths = [p.strip() for p in f if p.strip()]

for path in paths:
    if not os.path.exists(path):
        continue
    msgs = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    msgs.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    except (OSError, IOError):
        continue

    # Detecta invocacoes de machine via Skill tool ou Agent tool
    current_machine = None
    machine_start_ts = None
    machine_tokens_in = 0
    machine_tokens_out = 0

    for m in msgs:
        t = m.get("type")
        ts = m.get("timestamp") or m.get("ts")
        if t == "assistant":
            content = m.get("message", {}).get("content", [])
            usage = m.get("message", {}).get("usage", {}) or {}
            if isinstance(usage, dict):
                machine_tokens_in += usage.get("input_tokens", 0) or 0
                machine_tokens_out += usage.get("output_tokens", 0) or 0
            if not isinstance(content, list):
                continue
            for c in content:
                if not isinstance(c, dict):
                    continue
                if c.get("type") == "tool_use":
                    name = c.get("name", "")
                    inp = c.get("input", {}) or {}
                    if name == "Skill":
                        skill_name = (inp.get("skill") or "").strip()
                        if skill_name in MACHINES:
                            current_machine = skill_name
                            machine_start_ts = ts
                            machine_tokens_in = 0
                            machine_tokens_out = 0
                        elif current_machine and skill_name.startswith("ag-"):
                            agg[current_machine]["skills_co_invoked"][skill_name] += 1
                    elif name == "Agent" and current_machine:
                        subagent = (inp.get("subagent_type") or "").strip()
                        if subagent:
                            agg[current_machine]["skills_co_invoked"][f"agent:{subagent}"] += 1
        elif t == "user":
            content = m.get("message", {}).get("content", "")
            if isinstance(content, list):
                for c in content:
                    if isinstance(c, dict) and c.get("type") == "tool_result":
                        result_text = ""
                        rc = c.get("content", "")
                        if isinstance(rc, list):
                            result_text = " ".join(
                                (r.get("text", "") if isinstance(r, dict) else "")
                                for r in rc
                            )
                        elif isinstance(rc, str):
                            result_text = rc
                        if "Esperado vs Atual" in result_text or "gap" in result_text.lower():
                            if current_machine:
                                agg[current_machine]["gap_reports"] += 1
                        if "BLOQUEADO" in result_text:
                            if current_machine:
                                # Extrai nome do hook do output
                                for line in result_text.splitlines():
                                    if "hook" in line.lower() or "guard" in line.lower():
                                        agg[current_machine]["hooks_fired"][line.strip()[:80]] += 1

    if current_machine and machine_tokens_in > 0:
        agg[current_machine]["invocations"] += 1
        agg[current_machine]["tokens_in"].append(machine_tokens_in)
        agg[current_machine]["tokens_out"].append(machine_tokens_out)

# Serializa
def stats(arr):
    if not arr:
        return {"n": 0, "mean": 0, "p50": 0, "p95": 0, "sum": 0}
    s = sorted(arr)
    n = len(s)
    return {
        "n": n,
        "mean": round(sum(s) / n, 1),
        "p50": s[n // 2],
        "p95": s[min(int(n * 0.95), n - 1)],
        "sum": sum(s),
    }

out = {}
for machine, data in agg.items():
    out[machine] = {
        "invocations": data["invocations"],
        "tokens_in": stats(data["tokens_in"]),
        "tokens_out": stats(data["tokens_out"]),
        "duration_s": stats(data["duration_s"]),
        "gap_reports": data["gap_reports"],
        "top_co_invoked": sorted(
            data["skills_co_invoked"].items(),
            key=lambda kv: -kv[1],
        )[:10],
        "hooks_fired": dict(data["hooks_fired"]),
    }

with open(out_file, "w") as f:
    json.dump(out, f, indent=2)
PY

# Gera markdown
{
  echo "# Baseline Machines — $(date +%Y-%m-%d)"
  echo ""
  echo "Sessoes analisadas: $N_SESSIONS (ultimas $LAST_N modificadas)"
  echo "Diretorio: \`$SESSIONS_DIR\`"
  echo ""
  echo "## Por machine"
  echo ""
  echo "| Machine | Invoc. | Tokens IN (mean) | Tokens OUT (mean) | Gap reports | Top co-invocados |"
  echo "|---|---|---|---|---|---|"

  python3 - "$TMP/agg.json" <<'PY'
import json
import sys

with open(sys.argv[1]) as f:
    data = json.load(f)

# Ordena: ag-0..ag-13
order = [f"ag-{i}" for i in range(0, 14)]
for m in order:
    if m not in data:
        continue
    d = data[m]
    tin = d["tokens_in"]
    tout = d["tokens_out"]
    co = ", ".join(f"{k}({v})" for k, v in d["top_co_invoked"][:3]) or "-"
    print(f"| {m} | {d['invocations']} | {tin['mean']} | {tout['mean']} | {d['gap_reports']} | {co} |")
PY

  echo ""
  echo "## Json bruto"
  echo ""
  echo '```json'
  cat "$TMP/agg.json"
  echo '```'
} > "$OUT_FILE"

echo "Baseline gerado: $OUT_FILE"
