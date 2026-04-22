"""
Baseline Parity Script — Rule L7-M16
=====================================
Runs 4 baselines on 1x2 Brasileirão (competition_id=1) historical data.
LogReg + Pinnacle-only must be computed BEFORE any complex model.
A new model family must beat best baseline by Brier delta >= 0.003 or CI95 ROI exclusive.

Usage:
    python scripts/governance/baseline_parity.py [--competition 1] [--output <path>]

Exit 0 on success.
"""
import argparse
import sys
import os
from datetime import datetime, timezone

import numpy as np
import psycopg2
import psycopg2.extras
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

_QUERY = """
WITH pin_close AS (
    SELECT
        match_id,
        MAX(CASE WHEN selection='home' THEN implied_prob END) AS pin_ip_h,
        MAX(CASE WHEN selection='draw' THEN implied_prob END) AS pin_ip_d,
        MAX(CASE WHEN selection='away' THEN implied_prob END) AS pin_ip_a
    FROM stg.odds
    WHERE bookmaker='pinnacle'
      AND market='1x2'
      AND is_closing=true
    GROUP BY match_id
    HAVING COUNT(DISTINCT selection)=3
)
SELECT
    m.id              AS match_id,
    m.match_date,
    EXTRACT(YEAR FROM m.match_date)::int AS season_year,
    m.result,
    pc.pin_ip_h,
    pc.pin_ip_d,
    pc.pin_ip_a,
    pc.pin_ip_h + pc.pin_ip_d + pc.pin_ip_a AS overround
FROM stg.match m
JOIN pin_close pc ON pc.match_id = m.id
WHERE m.competition_id = %(competition_id)s
  AND m.result IN ('H','D','A')
ORDER BY m.match_date, m.id
"""


def load_data(dsn: str, competition_id: int) -> list[dict]:
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(_QUERY, {"competition_id": competition_id})
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def rows_to_arrays(rows: list[dict]):
    """Convert DB rows to numpy arrays.

    Returns
    -------
    y : ndarray shape (N,), int — 0=H, 1=D, 2=A
    pin_ip : ndarray shape (N, 3) — vig-included implied probs [H, D, A]
    overround : ndarray shape (N,)
    years : ndarray shape (N,), int
    """
    result_map = {"H": 0, "D": 1, "A": 2}
    y = np.array([result_map[r["result"]] for r in rows], dtype=np.int32)
    pin_ip = np.array(
        [[float(r["pin_ip_h"]), float(r["pin_ip_d"]), float(r["pin_ip_a"])] for r in rows],
        dtype=np.float64,
    )
    overround = np.array([float(r["overround"]) for r in rows], dtype=np.float64)
    years = np.array([int(r["season_year"]) for r in rows], dtype=np.int32)
    return y, pin_ip, overround, years


# ---------------------------------------------------------------------------
# Vig removal (Shin-lite: proportional normalisation)
# ---------------------------------------------------------------------------

def remove_vig(pin_ip: np.ndarray) -> np.ndarray:
    """Proportional vig removal: p_true_i = p_vig_i / sum(p_vig).

    Returns probs that sum to 1.0 per row.
    """
    row_sum = pin_ip.sum(axis=1, keepdims=True)
    return pin_ip / row_sum


# ---------------------------------------------------------------------------
# Brier score multiclass
# ---------------------------------------------------------------------------

def brier_multi(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Multiclass Brier score (mean across matches, divided by n_outcomes).

    Convention used throughout this project (consistent with diag_07 L7 values ~0.191):
        Brier = (1/N) * sum_i[ (1/K) * sum_k (p_ik - o_ik)^2 ]
    where K=3 outcomes, o_ik is one-hot.

    Flat baseline yields ~0.222, Pinnacle yields ~0.189-0.192.

    y_true : (N,) int in {0,1,2}
    y_prob : (N,3) float, rows sum to 1
    """
    n = len(y_true)
    onehot = np.zeros((n, 3), dtype=np.float64)
    onehot[np.arange(n), y_true] = 1.0
    # sum over outcomes then divide by K=3, then mean over matches
    return float(np.mean(np.sum((y_prob - onehot) ** 2, axis=1) / 3.0))


# ---------------------------------------------------------------------------
# Baselines
# ---------------------------------------------------------------------------

def baseline_flat(n: int) -> np.ndarray:
    """Flat: 1/3 per outcome."""
    return np.full((n, 3), 1.0 / 3.0)


def baseline_home_advantage(y_train: np.ndarray, n_test: int) -> np.ndarray:
    """Home-advantage only: fixed rate learned from train set."""
    n_train = len(y_train)
    rates = np.array(
        [
            np.sum(y_train == 0) / n_train,
            np.sum(y_train == 1) / n_train,
            np.sum(y_train == 2) / n_train,
        ]
    )
    return np.tile(rates, (n_test, 1))


def baseline_pinnacle(pin_ip: np.ndarray) -> np.ndarray:
    """Pinnacle-only: vig-removed close as probs."""
    return remove_vig(pin_ip)


def baseline_logreg(
    pin_ip_train: np.ndarray,
    overround_train: np.ndarray,
    y_train: np.ndarray,
    pin_ip_test: np.ndarray,
    overround_test: np.ndarray,
) -> np.ndarray:
    """Logistic regression on odds features only.

    Features: implied_prob_home, implied_prob_draw, implied_prob_away, overround (4 features).
    """
    X_train = np.column_stack([pin_ip_train, overround_train])
    X_test = np.column_stack([pin_ip_test, overround_test])
    model = LogisticRegression(
        solver="lbfgs",
        max_iter=1000,
        C=1.0,
        random_state=42,
    )
    model.fit(X_train, y_train)
    return model.predict_proba(X_test)


# ---------------------------------------------------------------------------
# Split logic
# ---------------------------------------------------------------------------

def make_mask(years: np.ndarray, start: int, end: int) -> np.ndarray:
    """Inclusive year range mask."""
    return (years >= start) & (years <= end)


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def render_report(results: dict, timestamp: str, competition_id: int) -> str:
    """Render the markdown report."""
    date_str = timestamp[:10]  # YYYY-MM-DD

    rows_train = results["train"]
    rows_valid = results["valid"]
    rows_test = results.get("test")

    def fmt(v):
        if v is None:
            return "n/a"
        return f"{v:.4f}"

    baselines = ["Flat", "Home-only", "Pinnacle-only", "LogReg+odds"]
    keys = ["flat", "home_only", "pinnacle", "logreg"]
    notes = [
        "no variance",
        "fixed rate from train",
        "sharp ground truth",
        "4 features: ip_h/d/a + overround",
    ]

    table_header = "| Baseline | Train Brier | Valid Brier | Test Brier | Train LogLoss | Valid LogLoss | Notes |"
    table_sep = "|----------|-------------|-------------|------------|---------------|---------------|-------|"
    table_rows = []
    for name, key, note in zip(baselines, keys, notes):
        tr_brier = fmt(rows_train["brier"][key])
        va_brier = fmt(rows_valid["brier"][key])
        te_brier = fmt(rows_test["brier"][key]) if rows_test else "n/a"
        tr_ll = fmt(rows_train["logloss"][key])
        va_ll = fmt(rows_valid["logloss"][key])
        table_rows.append(
            f"| {name} | {tr_brier} | {va_brier} | {te_brier} | {tr_ll} | {va_ll} | {note} |"
        )

    # Best baseline on validation
    valid_briers = {k: rows_valid["brier"][k] for k in keys}
    best_key = min(valid_briers, key=valid_briers.get)
    best_name_map = dict(zip(keys, baselines))
    best_name = best_name_map[best_key]
    best_value = valid_briers[best_key]

    # L7 note: LogReg vs Pinnacle delta
    delta_logreg_vs_pin = rows_valid["brier"]["logreg"] - rows_valid["brier"]["pinnacle"]
    delta_sign = "+" if delta_logreg_vs_pin >= 0 else ""

    lines = [
        f"# Baseline Parity — {date_str}",
        "",
        f"**Competition:** {competition_id} (Brasileirão Série A)  ",
        f"**Generated:** {timestamp}  ",
        f"**Rule:** L7-M16 — LogReg + Pinnacle-only before any complex model  ",
        "",
        "## Split Definition",
        "",
        "| Split | Years | N matches |",
        "|-------|-------|-----------|",
        f"| Train | 2012–2020 | {results['n_train']} |",
        f"| Valid | 2021–2023 | {results['n_valid']} |",
        f"| Test  | 2024+     | {results['n_test']}  |",
        "",
        "Universe: matches with Pinnacle close 1x2 (all 3 selections) + completed result.",
        "",
        "## Results",
        "",
        table_header,
        table_sep,
    ] + table_rows + [
        "",
        f"**Best baseline (validation):** {best_name} with Brier {best_value:.4f}",
        "",
        f"Any proposed complex model must beat best baseline by >= 0.003 Brier.",
        f"Minimum target: Brier(valid) < {best_value - 0.003:.4f}",
        "",
        "## L7 Surprise Confirmation",
        "",
        f"LogReg vs Pinnacle delta (valid Brier): {delta_sign}{delta_logreg_vs_pin:.4f}",
        "",
        (
            "LogReg **ties** Pinnacle — confirming L7 finding that a linear model on 4 odds features "
            "extracts all signal available in Pinnacle close. LightGBM and other non-linear families "
            "must be justified against LogReg first, not against Pinnacle directly."
        )
        if abs(delta_logreg_vs_pin) < 0.003
        else (
            f"LogReg {'beats' if delta_logreg_vs_pin < 0 else 'loses to'} Pinnacle by {abs(delta_logreg_vs_pin):.4f} — "
            "verify this against L7 expectation of near-zero delta."
        ),
        "",
        "## Gate",
        "",
        "Before proposing any complex model family:",
        "",
        "```bash",
        f"python scripts/governance/baseline_parity.py --competition {competition_id}",
        "```",
        "",
        "Gate criterion (rule L7-M16):",
        f"- Brier(valid) delta >= 0.003 BELOW {best_name} ({best_value:.4f}), i.e. < {best_value - 0.003:.4f}",
        "- OR: ROI CI95 on walkforward strictly > 0 AND strictly > best baseline ROI",
        "",
        "If neither criterion met → family is archived.",
    ]

    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(competition_id: int, dsn: str, output_path: str | None) -> None:
    print(f"[baseline_parity] Loading data for competition_id={competition_id}...")
    rows = load_data(dsn, competition_id)
    print(f"[baseline_parity] Loaded {len(rows)} matches with complete Pinnacle close.")

    if len(rows) < 100:
        print("[baseline_parity] ERROR: too few matches to compute baselines.", file=sys.stderr)
        sys.exit(1)

    y, pin_ip, overround, years = rows_to_arrays(rows)

    # Split masks
    train_mask = make_mask(years, 2012, 2020)
    valid_mask = make_mask(years, 2021, 2023)
    test_mask = make_mask(years, 2024, 9999)

    n_train = int(train_mask.sum())
    n_valid = int(valid_mask.sum())
    n_test = int(test_mask.sum())
    print(f"[baseline_parity] Split — train: {n_train}, valid: {n_valid}, test: {n_test}")

    if n_valid == 0:
        print("[baseline_parity] ERROR: no validation data (2021-2023).", file=sys.stderr)
        sys.exit(1)

    # Compute predictions for each split
    def compute_split_metrics(mask, split_name):
        if mask.sum() == 0:
            return None

        y_s = y[mask]
        pin_ip_s = pin_ip[mask]
        over_s = overround[mask]
        n_s = int(mask.sum())

        # Flat
        flat_probs = baseline_flat(n_s)

        # Home-only: always learned from train
        home_probs = baseline_home_advantage(y[train_mask], n_s)

        # Pinnacle-only
        pin_probs = baseline_pinnacle(pin_ip_s)

        # LogReg: fit on train, predict on this split
        logreg_probs = baseline_logreg(
            pin_ip[train_mask], overround[train_mask], y[train_mask],
            pin_ip_s, over_s,
        )

        brier = {
            "flat": brier_multi(y_s, flat_probs),
            "home_only": brier_multi(y_s, home_probs),
            "pinnacle": brier_multi(y_s, pin_probs),
            "logreg": brier_multi(y_s, logreg_probs),
        }
        logloss = {
            "flat": float(log_loss(y_s, flat_probs)),
            "home_only": float(log_loss(y_s, home_probs)),
            "pinnacle": float(log_loss(y_s, pin_probs)),
            "logreg": float(log_loss(y_s, logreg_probs)),
        }
        return {"brier": brier, "logloss": logloss}

    train_metrics = compute_split_metrics(train_mask, "train")
    valid_metrics = compute_split_metrics(valid_mask, "valid")
    test_metrics = compute_split_metrics(test_mask, "test")

    # Print table to stdout
    print("\n[baseline_parity] Results:")
    print(f"{'Baseline':<16} {'Train Brier':>12} {'Valid Brier':>12} {'Test Brier':>12} {'Notes'}")
    print("-" * 75)
    baselines = [
        ("Flat", "flat", "no variance"),
        ("Home-only", "home_only", "fixed rate from train"),
        ("Pinnacle-only", "pinnacle", "sharp ground truth"),
        ("LogReg+odds", "logreg", "4 features: ip_h/d/a + overround"),
    ]
    for name, key, note in baselines:
        tr = f"{train_metrics['brier'][key]:.4f}" if train_metrics else "n/a"
        va = f"{valid_metrics['brier'][key]:.4f}" if valid_metrics else "n/a"
        te = f"{test_metrics['brier'][key]:.4f}" if test_metrics else "n/a"
        print(f"{name:<16} {tr:>12} {va:>12} {te:>12}   {note}")

    # Best baseline on validation
    valid_briers = {k: valid_metrics["brier"][k] for _, k, _ in baselines}
    best_key = min(valid_briers, key=valid_briers.get)
    best_name = {k: n for n, k, _ in baselines}[best_key]
    best_value = valid_briers[best_key]

    delta_lr_pin = valid_metrics["brier"]["logreg"] - valid_metrics["brier"]["pinnacle"]
    print(f"\nBest baseline (valid): {best_name} with Brier {best_value:.4f}")
    print(f"Any complex model must beat by >= 0.003 → target < {best_value - 0.003:.4f}")
    print(f"LogReg vs Pinnacle delta (valid Brier): {'+' if delta_lr_pin >= 0 else ''}{delta_lr_pin:.4f}")

    # Generate output report
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%SZ")

    if output_path is None:
        output_path = f"reports/baseline_parity_{timestamp}.md"

    results = {
        "train": train_metrics,
        "valid": valid_metrics,
        "test": test_metrics,
        "n_train": n_train,
        "n_valid": n_valid,
        "n_test": n_test,
    }

    report_md = render_report(results, timestamp, competition_id)

    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"\n[baseline_parity] Report written to: {output_path}")
    print("[baseline_parity] Done. Exit 0.")


def main():
    parser = argparse.ArgumentParser(
        description="Baseline parity script (L7-M16): LogReg + Pinnacle before any complex model."
    )
    parser.add_argument(
        "--competition",
        type=int,
        default=1,
        help="competition_id (default: 1 = Brasileirão Série A)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output path for the markdown report (default: reports/baseline_parity_<timestamp>.md)",
    )
    parser.add_argument(
        "--dsn",
        type=str,
        default="postgresql://betting:betting@localhost:5433/betting_dev",
        help="PostgreSQL DSN",
    )
    args = parser.parse_args()
    run(competition_id=args.competition, dsn=args.dsn, output_path=args.output)


if __name__ == "__main__":
    main()
