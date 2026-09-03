#!/usr/bin/env python3
"""loop-guard.py — PreToolUse (ScheduleWakeup|CronCreate): papel do cockpit nos tiers 0-2 NAO acorda por relogio.

Contrato (_POLITICAS-COMUNS / CLAUDE.md): "Nenhum papel acorda por relogio (/loop, ScheduleWakeup, CronCreate proibidos
nos tiers 0-2); acorda por evento (Monitor) ou pelo dono." Medido 03/09 (diagnostico §13): 12 acordares por relogio em
24 h — COMANDO 7 (auto-pacing de 10 min a noite toda, ~70 turnos de verificacao), DE-DATA 3, DE-BUILD-B 2. O contrato
vivia em texto; passa a mecanismo. Sessao sem papel (ad-hoc) passa. Tier 3 passa.
Bypass: LOOP_GUARD_DISABLED=1 (sessao) — ou o dono a ordenar por escrito na ficha do papel.
"""
import json, os, sys

if os.environ.get("LOOP_GUARD_DISABLED") == "1":
    sys.exit(0)
try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)
tool = payload.get("tool_name") or ""
if tool not in ("ScheduleWakeup", "CronCreate"):
    sys.exit(0)
# ScheduleWakeup com stop=true e' PARAR o loop — sempre permitido
ti = payload.get("tool_input") or {}
if tool == "ScheduleWakeup" and ti.get("stop"):
    sys.exit(0)
ws = os.environ.get("CMUX_WORKSPACE_ID") or ""
if not ws:
    sys.exit(0)
reg_path = os.path.expanduser("~/Claude/docs/ai-state/terminais/registry.json")
try:
    reg = json.load(open(reg_path)).get("terminais") or {}
except Exception:
    sys.exit(0)
papel = tier = None
for p, e in reg.items():
    if e.get("workspace_uuid") == ws:
        papel, tier = p, e.get("tier")
        break
if papel is None or tier not in (0, 1, 2):
    sys.exit(0)
print(
    f"BLOQUEADO (loop-guard): {papel} e' tier {tier} — nenhum papel dos tiers 0-2 acorda por relogio "
    f"({tool}). Acorda por EVENTO: Monitor(tail -n0 -F .../filas/atribuicoes.jsonl | grep '\"papel\": \"{papel}\"'), "
    f"Monitor nos ficheiros que vigias, ou o dono. Se estas a espera de algo, declara posto (result.sh {papel} <task> posto "
    f"'<o que vigias e como expira>') e cala-te. Bypass: LOOP_GUARD_DISABLED=1.",
    file=sys.stderr,
)
sys.exit(2)
