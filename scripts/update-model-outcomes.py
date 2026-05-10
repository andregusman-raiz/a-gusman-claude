#!/usr/bin/env python3
"""
update-model-outcomes.py — Atualiza tracking de outcomes de modelo por categoria.

Uso:
  python3 update-model-outcomes.py <categoria> <modelo> <success|fail>
  python3 update-model-outcomes.py --report

Exemplo:
  python3 update-model-outcomes.py ag-2-corrigir:totvs opus success
  python3 update-model-outcomes.py --report

Design (P2 da analise Ruflo vs ag-*):
  Multi-armed bandit conservador. Nao substitui opus-mode.txt.
  Apenas rastreia outcomes para sugerir upgrade quando win_rate(sonnet) < 0.5.
  ag-0-orquestrador consulta antes de rotear em categorias com >= 5 observacoes.
"""

import json
import os
import sys
from pathlib import Path

STATE_FILE = Path.home() / ".claude/state/model-outcomes.json"
# Fallback para workspace path
WORKSPACE_STATE = Path.home() / "Claude/.claude/state/model-outcomes.json"


def load_state() -> dict:
    for path in [STATE_FILE, WORKSPACE_STATE]:
        if path.exists():
            try:
                with open(path) as f:
                    return json.load(f), path
            except (json.JSONDecodeError, OSError):
                continue
    return {}, WORKSPACE_STATE


def save_state(state: dict, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(state, f, indent=2)


def win_rate(model_data: dict) -> float:
    total = model_data["success"] + model_data["fail"]
    if total == 0:
        return None  # Sem dados suficientes
    return model_data["success"] / total


def report(state: dict):
    print("\nModel Outcomes Report")
    print("=" * 60)
    categories = state.get("categories", {})

    for cat, models in sorted(categories.items()):
        sonnet = models.get("sonnet", {"success": 0, "fail": 0})
        opus = models.get("opus", {"success": 0, "fail": 0})

        s_rate = win_rate(sonnet)
        o_rate = win_rate(opus)
        s_total = sonnet["success"] + sonnet["fail"]
        o_total = opus["success"] + opus["fail"]

        if s_total == 0 and o_total == 0:
            continue  # Skip categorias sem dados

        print(f"\n{cat}:")
        if s_total > 0:
            print(f"  sonnet: {s_rate:.0%} win rate ({s_total} obs)")
        if o_total > 0:
            print(f"  opus:   {o_rate:.0%} win rate ({o_total} obs)")

        # Sugestao de routing
        if s_total >= 5 and s_rate is not None and s_rate < 0.5:
            print(f"  ⚠ SUGESTAO: win_rate(sonnet)={s_rate:.0%} < 50% — considerar opus para esta categoria")
        elif s_total >= 5 and s_rate is not None and s_rate >= 0.8:
            print(f"  ✓ sonnet suficiente (win_rate={s_rate:.0%})")

    print("\n" + "=" * 60)


def update(state: dict, category: str, model: str, outcome: str) -> dict:
    if "categories" not in state:
        state["categories"] = {}

    if category not in state["categories"]:
        state["categories"][category] = {
            "sonnet": {"success": 0, "fail": 0},
            "opus": {"success": 0, "fail": 0}
        }

    if model not in state["categories"][category]:
        state["categories"][category][model] = {"success": 0, "fail": 0}

    if outcome == "success":
        state["categories"][category][model]["success"] += 1
    elif outcome == "fail":
        state["categories"][category][model]["fail"] += 1
    else:
        print(f"Outcome invalido: {outcome}. Use 'success' ou 'fail'.", file=sys.stderr)
        sys.exit(1)

    return state


def suggest_model(state: dict, category: str):
    """Sugere modelo para categoria se ha dados suficientes (>= 5 obs)."""
    categories = state.get("categories", {})
    if category not in categories:
        return None

    sonnet = categories[category].get("sonnet", {"success": 0, "fail": 0})
    s_total = sonnet["success"] + sonnet["fail"]

    if s_total < 5:
        return None  # Dados insuficientes

    s_rate = win_rate(sonnet)
    if s_rate is not None and s_rate < 0.5:
        return "opus"  # Sugerir upgrade
    return "sonnet"  # Default suficiente


def main():
    args = sys.argv[1:]

    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)

    state, path = load_state()

    if args[0] == "--report":
        report(state)
        sys.exit(0)

    if args[0] == "--suggest" and len(args) >= 2:
        suggestion = suggest_model(state, args[1])
        if suggestion:
            print(suggestion)
        else:
            print("sonnet")  # Default quando sem dados
        sys.exit(0)

    if len(args) != 3:
        print("Uso: update-model-outcomes.py <categoria> <modelo> <success|fail>", file=sys.stderr)
        print("     update-model-outcomes.py --report", file=sys.stderr)
        print("     update-model-outcomes.py --suggest <categoria>", file=sys.stderr)
        sys.exit(1)

    category, model, outcome = args
    state = update(state, category, model, outcome)
    save_state(state, path)

    # Feedback imediato se ha dados suficientes
    s_data = state["categories"].get(category, {}).get("sonnet", {"success": 0, "fail": 0})
    s_total = s_data["success"] + s_data["fail"]
    if s_total >= 5:
        s_rate = win_rate(s_data)
        if s_rate is not None and s_rate < 0.5:
            print(f"⚠ {category}: win_rate(sonnet)={s_rate:.0%} < 50% — considerar opus", file=sys.stderr)

    print(f"✓ {category} / {model} / {outcome} registrado.")


if __name__ == "__main__":
    main()
