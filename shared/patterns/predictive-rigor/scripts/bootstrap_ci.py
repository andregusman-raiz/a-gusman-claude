"""Bootstrap CI helper — Rule I06.

Automates the bootstrap analysis that was performed ad-hoc in L9 Attack A10
(bootstrap 1000x walkforward → P(ROI>0)=1.9%). Every function here is
reproducible, seeded, and returns typed output.

Math background
---------------
Standard bootstrap (IID):
    Resample n observations with replacement n_resamples times.
    Estimate statistic on each resample → empirical sampling distribution.
    CI: percentile method: (alpha/2, 1-alpha/2) quantiles.

Block bootstrap:
    Resample non-overlapping blocks of size block_size.
    Preserves short-range autocorrelation (e.g. same-day games sharing market
    risk). For n samples and block_size b: n_blocks = ceil(n/b).
    Last block may be shorter — padded to full block from wrap-around.

Usage
-----
Library mode:
    from scripts.governance.bootstrap_ci import bootstrap_roi_distribution
    result = bootstrap_roi_distribution(pnls)

CLI mode:
    python scripts/governance/bootstrap_ci.py --input data.csv --col pnl
    python scripts/governance/bootstrap_ci.py --input data.csv --col pnl --stake-col stake
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np


# ---------------------------------------------------------------------------
# Core utilities
# ---------------------------------------------------------------------------


def _rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


# ---------------------------------------------------------------------------
# 1. bootstrap_mean
# ---------------------------------------------------------------------------


def bootstrap_mean(
    samples: Sequence[float],
    n_resamples: int = 1000,
    ci: float = 0.95,
    seed: int = 42,
) -> Tuple[float, float, float]:
    """Bootstrap CI for the mean of a 1-D sample.

    Math:
        For each resample b in 1..n_resamples:
            draw n indices with replacement
            compute mean of resampled values
        CI: percentile method at ((1-ci)/2, (1+ci)/2) quantiles.

    Parameters
    ----------
    samples:
        Observed values (e.g. per-bet P&L).
    n_resamples:
        Number of bootstrap iterations.
    ci:
        Confidence level (0.95 → 95% CI).
    seed:
        RNG seed for reproducibility.

    Returns
    -------
    (mean, ci_low, ci_high)
        mean      : arithmetic mean of original sample
        ci_low    : lower bound of bootstrap CI
        ci_high   : upper bound of bootstrap CI

    Example
    -------
    >>> import numpy as np
    >>> rng = np.random.default_rng(0)
    >>> data = rng.normal(0.05, 1.0, size=500).tolist()
    >>> mean, lo, hi = bootstrap_mean(data, seed=42)
    >>> lo < mean < hi
    True
    """
    arr = np.asarray(samples, dtype=float)
    n = len(arr)
    rng = _rng(seed)
    boot_means = np.empty(n_resamples)
    for i in range(n_resamples):
        idx = rng.integers(0, n, size=n)
        boot_means[i] = arr[idx].mean()
    alpha = 1.0 - ci
    lo = float(np.quantile(boot_means, alpha / 2))
    hi = float(np.quantile(boot_means, 1.0 - alpha / 2))
    return float(arr.mean()), lo, hi


# ---------------------------------------------------------------------------
# 2. bootstrap_prob_above
# ---------------------------------------------------------------------------


def bootstrap_prob_above(
    samples: Sequence[float],
    threshold: float = 0.0,
    n_resamples: int = 1000,
    seed: int = 42,
) -> float:
    """P(bootstrap mean > threshold) — L9 A10 style check.

    In A10, this was computed inline as:
        bootstrap 1000 resamples of 1,615 bets → P(ROI > 0) = 1.9%

    This function reproduces that logic as a reusable utility.

    Math:
        P = #{resamples where mean(resample) > threshold} / n_resamples

    Parameters
    ----------
    samples:
        Observed values (ROI per bet, P&L, CLV, etc.).
    threshold:
        Value to compare against (0.0 → P(mean > 0)).
    n_resamples:
        Bootstrap iterations.
    seed:
        RNG seed.

    Returns
    -------
    float in [0, 1]: empirical probability that the bootstrap mean exceeds
    the threshold.

    Example
    -------
    >>> data = [-0.1] * 1615  # all bets lose 10%
    >>> p = bootstrap_prob_above(data, threshold=0.0, seed=42)
    >>> p < 0.05
    True
    """
    arr = np.asarray(samples, dtype=float)
    n = len(arr)
    rng = _rng(seed)
    count = 0
    for _ in range(n_resamples):
        idx = rng.integers(0, n, size=n)
        if arr[idx].mean() > threshold:
            count += 1
    return count / n_resamples


# ---------------------------------------------------------------------------
# 3. bootstrap_roi_distribution
# ---------------------------------------------------------------------------


def bootstrap_roi_distribution(
    pnls: Sequence[float],
    stakes: Optional[Sequence[float]] = None,
    n_resamples: int = 1000,
    seed: int = 42,
) -> Dict[str, float]:
    """Bootstrap ROI distribution — primary evaluation utility.

    ROI per resample = sum(pnl) / sum(stake).
    If stakes is None, assume flat 1-unit stake per bet.

    Returns a dict with:
        mean       : mean ROI of original sample
        ci95_low   : lower bound of 95% CI
        ci95_high  : upper bound of 95% CI
        p_roi_gt_0 : P(bootstrap ROI > 0)
        p_roi_gt_1 : P(bootstrap ROI > +1%)
        p_roi_gt_2 : P(bootstrap ROI > +2%)

    Math:
        ROI_b = sum(pnl[idx]) / sum(stake[idx])
        where idx is drawn with replacement.

    Parameters
    ----------
    pnls:
        Per-bet profit/loss in stake-relative units (e.g. -1.0 for a lost
        1-unit bet, +0.8 for a won 1-unit bet at decimal odd 1.8).
    stakes:
        Per-bet stake amounts. If None, flat 1-unit assumed.
    n_resamples:
        Bootstrap iterations.
    seed:
        RNG seed.

    Returns
    -------
    Dict with keys: mean, ci95_low, ci95_high, p_roi_gt_0, p_roi_gt_1,
    p_roi_gt_2.

    Example
    -------
    >>> pnls = [0.8, -1.0, 0.5, -1.0, 1.2, -1.0] * 100
    >>> result = bootstrap_roi_distribution(pnls, seed=42)
    >>> 'mean' in result and 'p_roi_gt_0' in result
    True
    """
    pnl_arr = np.asarray(pnls, dtype=float)
    n = len(pnl_arr)
    if stakes is None:
        stake_arr = np.ones(n, dtype=float)
    else:
        stake_arr = np.asarray(stakes, dtype=float)
        if len(stake_arr) != n:
            raise ValueError(f"pnls length {n} != stakes length {len(stake_arr)}")

    orig_roi = pnl_arr.sum() / stake_arr.sum()

    rng = _rng(seed)
    boot_rois = np.empty(n_resamples)
    for i in range(n_resamples):
        idx = rng.integers(0, n, size=n)
        boot_rois[i] = pnl_arr[idx].sum() / stake_arr[idx].sum()

    ci_lo = float(np.quantile(boot_rois, 0.025))
    ci_hi = float(np.quantile(boot_rois, 0.975))

    return {
        "mean": float(orig_roi),
        "ci95_low": ci_lo,
        "ci95_high": ci_hi,
        "p_roi_gt_0": float((boot_rois > 0.0).mean()),
        "p_roi_gt_1": float((boot_rois > 0.01).mean()),
        "p_roi_gt_2": float((boot_rois > 0.02).mean()),
    }


# ---------------------------------------------------------------------------
# 4. bootstrap_sharpe
# ---------------------------------------------------------------------------


def bootstrap_sharpe(
    pnls: Sequence[float],
    n_resamples: int = 1000,
    seed: int = 42,
) -> Tuple[float, float, float]:
    """Sharpe ratio per bet with 95% CI — needed for Rule K4 / M06.

    Sharpe per bet = mean(pnl) / std(pnl, ddof=1).
    If std == 0 (all identical returns), returns (sign(mean), nan, nan).

    Math:
        S_b = mean(pnl[idx]) / std(pnl[idx], ddof=1)
    CI: percentile method.

    Parameters
    ----------
    pnls:
        Per-bet P&L in stake-relative units.
    n_resamples:
        Bootstrap iterations.
    seed:
        RNG seed.

    Returns
    -------
    (sharpe, ci95_low, ci95_high)

    Example
    -------
    >>> import numpy as np
    >>> rng = np.random.default_rng(1)
    >>> pnls = rng.normal(0.01, 1.0, 500).tolist()
    >>> sharpe, lo, hi = bootstrap_sharpe(pnls, seed=42)
    >>> lo < sharpe < hi
    True
    """
    arr = np.asarray(pnls, dtype=float)
    n = len(arr)

    def _sharpe(x: np.ndarray) -> float:
        std = x.std(ddof=1)
        if std == 0.0:
            return math.copysign(float("inf"), x.mean()) if x.mean() != 0 else 0.0
        return float(x.mean() / std)

    orig_sharpe = _sharpe(arr)

    rng = _rng(seed)
    boot_sharpes = np.empty(n_resamples)
    for i in range(n_resamples):
        idx = rng.integers(0, n, size=n)
        boot_sharpes[i] = _sharpe(arr[idx])

    ci_lo = float(np.quantile(boot_sharpes, 0.025))
    ci_hi = float(np.quantile(boot_sharpes, 0.975))
    return orig_sharpe, ci_lo, ci_hi


# ---------------------------------------------------------------------------
# 5. block_bootstrap
# ---------------------------------------------------------------------------


def block_bootstrap(
    samples: Sequence[float],
    block_size: int = 10,
    n_resamples: int = 1000,
    seed: int = 42,
) -> Tuple[float, float, float]:
    """Block bootstrap CI preserving autocorrelation.

    Useful when observations share same-day market risk (e.g. CLV or ROI
    streams where multiple bets are placed on the same matchday).

    Strategy: non-overlapping blocks of `block_size`. Build n_blocks =
    ceil(n / block_size) blocks; resample n_blocks blocks with replacement;
    concatenate and truncate to n observations.

    Parameters
    ----------
    samples:
        Ordered sequence of values (must preserve temporal order).
    block_size:
        Number of consecutive observations per block. Larger block_size →
        larger CI → more conservative for autocorrelated data.
    n_resamples:
        Bootstrap iterations.
    seed:
        RNG seed.

    Returns
    -------
    (mean, ci95_low, ci95_high)

    Note
    ----
    Block bootstrap CI is expected to be wider than IID bootstrap CI for
    autocorrelated data. This is by design — it reflects the true uncertainty.

    Example
    -------
    >>> data = [1.0] * 5 + [-1.0] * 5  # autocorrelated pattern
    >>> mean, lo, hi = block_bootstrap(data, block_size=5, seed=42)
    >>> lo <= mean <= hi
    True
    """
    arr = np.asarray(samples, dtype=float)
    n = len(arr)
    n_blocks = math.ceil(n / block_size)

    # Build blocks (last block may be padded with wrap-around)
    blocks: List[np.ndarray] = []
    for b in range(n_blocks):
        start = b * block_size
        block = arr[start : start + block_size]
        if len(block) < block_size:
            # Pad from start of array (wrap-around)
            pad_needed = block_size - len(block)
            block = np.concatenate([block, arr[:pad_needed]])
        blocks.append(block)

    rng = _rng(seed)
    boot_means = np.empty(n_resamples)
    for i in range(n_resamples):
        chosen = rng.integers(0, n_blocks, size=n_blocks)
        resampled = np.concatenate([blocks[j] for j in chosen])[:n]
        boot_means[i] = resampled.mean()

    ci_lo = float(np.quantile(boot_means, 0.025))
    ci_hi = float(np.quantile(boot_means, 0.975))
    return float(arr.mean()), ci_lo, ci_hi


# ---------------------------------------------------------------------------
# 6. compare_two_series
# ---------------------------------------------------------------------------


def compare_two_series(
    a: Sequence[float],
    b: Sequence[float],
    n_resamples: int = 1000,
    seed: int = 42,
) -> Tuple[float, float, float, float]:
    """Bootstrap comparison of two series — for L7-M16 baseline parity.

    If len(a) == len(b): paired comparison (delta per observation).
    If len(a) != len(b): unpaired comparison (resample independently).

    Math (paired):
        delta_i = a_i - b_i
        Bootstrap CI on mean(delta).

    Math (unpaired):
        delta_b = mean(a[idx_a]) - mean(b[idx_b])
        where idx_a, idx_b drawn independently.

    Parameters
    ----------
    a:
        First series (e.g. new model ROI per bet).
    b:
        Second series (e.g. baseline model ROI per bet).
    n_resamples:
        Bootstrap iterations.
    seed:
        RNG seed.

    Returns
    -------
    (delta_mean, ci95_low, ci95_high, p_delta_gt_0)
        delta_mean    : mean(a) - mean(b)
        ci95_low      : lower bound 95% CI
        ci95_high     : upper bound 95% CI
        p_delta_gt_0  : P(a is better than b under bootstrap)

    Example
    -------
    >>> a = [0.1] * 200   # consistently positive
    >>> b = [0.0] * 200   # break-even
    >>> delta, lo, hi, p = compare_two_series(a, b, seed=42)
    >>> p > 0.90
    True
    """
    arr_a = np.asarray(a, dtype=float)
    arr_b = np.asarray(b, dtype=float)
    paired = len(arr_a) == len(arr_b)

    orig_delta = float(arr_a.mean() - arr_b.mean())
    rng = _rng(seed)
    boot_deltas = np.empty(n_resamples)

    if paired:
        diffs = arr_a - arr_b
        n = len(diffs)
        for i in range(n_resamples):
            idx = rng.integers(0, n, size=n)
            boot_deltas[i] = diffs[idx].mean()
    else:
        na, nb = len(arr_a), len(arr_b)
        for i in range(n_resamples):
            idx_a = rng.integers(0, na, size=na)
            idx_b = rng.integers(0, nb, size=nb)
            boot_deltas[i] = arr_a[idx_a].mean() - arr_b[idx_b].mean()

    ci_lo = float(np.quantile(boot_deltas, 0.025))
    ci_hi = float(np.quantile(boot_deltas, 0.975))
    p_gt_0 = float((boot_deltas > 0).mean())
    return orig_delta, ci_lo, ci_hi, p_gt_0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _print_summary_table(result: dict, label: str = "Bootstrap Results") -> None:
    print(f"\n{'='*50}")
    print(f"  {label}")
    print(f"{'='*50}")
    for k, v in result.items():
        if isinstance(v, float):
            print(f"  {k:<20} {v:>12.4f}")
        else:
            print(f"  {k:<20} {v!r}")
    print(f"{'='*50}\n")


def _load_column(path: str, col: str) -> List[float]:
    values: List[float] = []
    if path.endswith(".json"):
        with open(path) as f:
            data = json.load(f)
        if isinstance(data, list):
            for row in data:
                values.append(float(row[col]))
        else:
            raise ValueError("JSON must be a list of objects")
    else:
        # Assume CSV
        with open(path, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                values.append(float(row[col]))
    return values


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Bootstrap CI for betting evaluation pipeline (Rule I06)"
    )
    parser.add_argument("--input", required=True, help="CSV or JSON file path")
    parser.add_argument("--col", required=True, help="Column name for P&L / metric")
    parser.add_argument("--stake-col", default=None, help="Column name for stake amounts")
    parser.add_argument("--n-resamples", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args(argv)

    pnls = _load_column(args.input, args.col)
    stakes = _load_column(args.input, args.stake_col) if args.stake_col else None

    print(f"Loaded {len(pnls)} observations from '{args.col}' in {args.input}")

    # Mean CI
    mean, lo, hi = bootstrap_mean(pnls, n_resamples=args.n_resamples, seed=args.seed)
    _print_summary_table(
        {"mean": mean, "ci95_low": lo, "ci95_high": hi},
        label="Mean Bootstrap CI",
    )

    # ROI distribution
    roi_result = bootstrap_roi_distribution(
        pnls, stakes=stakes, n_resamples=args.n_resamples, seed=args.seed
    )
    _print_summary_table(roi_result, label="ROI Distribution")

    # Sharpe
    sharpe, slo, shi = bootstrap_sharpe(
        pnls, n_resamples=args.n_resamples, seed=args.seed
    )
    _print_summary_table(
        {"sharpe": sharpe, "ci95_low": slo, "ci95_high": shi},
        label="Sharpe per Bet",
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
