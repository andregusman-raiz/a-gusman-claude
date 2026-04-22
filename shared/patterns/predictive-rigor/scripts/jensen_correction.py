"""Jensen correction helper — ruling utility.

L9-R2 + Rule L9 finding: CLV under null hypothesis has positive bias of
+0.12% to +0.23% due to Jensen's inequality (log(1/x) is convex).

Before claiming CLV-based edge:
  1. Run `estimate_jensen_floor()` on your data's odd distribution
  2. Any CLV threshold used must be ≥ noise_floor + 2*se_floor
  3. Project-default: threshold = +0.4% (midpoint upper range)

This module provides:
  - estimate_jensen_floor_empirical: bootstrap-based estimate
  - adjust_clv: subtract floor from observed CLV
  - recommend_threshold: given bootstrap floor, suggest threshold
  - validate_clv_claim: quick sanity for CI95 claims

Usage in a PFC / analysis:
    from scripts.governance.jensen_correction import validate_clv_claim
    ok, msg = validate_clv_claim(
        clv_mean=0.0055, clv_ci_low=0.0048, clv_ci_high=0.0062,
        jensen_floor_pct=0.23)
    if not ok:
        print(msg)
"""

from __future__ import annotations

import math
import random
from typing import Sequence, Tuple


def estimate_jensen_floor_empirical(
    odds_sample: Sequence[float],
    n_bootstrap: int = 1000,
    noise_std_pct: float = 0.05,
    seed: int = 42,
) -> Tuple[float, float]:
    """Bootstrap-estimate Jensen bias under the null hypothesis.

    Method: simulate CLV under null (bet_odd = pin_close_odd) with multiplicative
    noise on price to capture variance. Mean of observed CLV under null = floor.

    Args:
        odds_sample: sample of historical odds to represent distribution
        n_bootstrap: bootstrap iterations
        noise_std_pct: std-dev of multiplicative log-noise on price (5% default)
        seed: RNG seed

    Returns:
        (floor_pct, se_pct): estimated Jensen bias as decimal proportion,
                             and standard error
    """
    rng = random.Random(seed)
    if not odds_sample:
        return 0.0, 0.0
    clv_means = []
    for _ in range(n_bootstrap):
        clvs = []
        for odd in odds_sample:
            if odd <= 1.0:
                continue
            # Simulate: bet_ip == pin_ip + noise
            ln_noise = rng.gauss(0, noise_std_pct)
            bet_ip = (1.0 / odd) * math.exp(ln_noise)
            pin_ip = 1.0 / odd
            clv = pin_ip / bet_ip - 1.0
            clvs.append(clv)
        if clvs:
            clv_means.append(sum(clvs) / len(clvs))
    if not clv_means:
        return 0.0, 0.0
    mean = sum(clv_means) / len(clv_means)
    var = sum((x - mean) ** 2 for x in clv_means) / max(len(clv_means) - 1, 1)
    se = math.sqrt(var / len(clv_means))
    return mean, se


def adjust_clv(observed_clv: float, jensen_floor: float) -> float:
    """Subtract Jensen floor from observed CLV. Returns adjusted CLV."""
    return observed_clv - jensen_floor


def recommend_threshold(jensen_floor: float, se_floor: float, k: float = 2.0) -> float:
    """Return recommended CLV threshold = floor + k * se.

    Default k=2 (conservative; ≈ 95% above noise floor).
    """
    return jensen_floor + k * se_floor


def validate_clv_claim(
    clv_mean: float,
    clv_ci_low: float,
    clv_ci_high: float,
    jensen_floor_pct: float = 0.0023,
    min_detectable_effect: float = 0.004,
) -> Tuple[bool, str]:
    """Validate a CLV claim for edge existence.

    A claim is valid iff:
    - clv_ci_low > jensen_floor (CI95 exclui noise floor)
    - clv_mean >= min_detectable_effect
    """
    if clv_mean < min_detectable_effect:
        return (
            False,
            f"CLV mean {clv_mean:.4%} < min_detectable_effect {min_detectable_effect:.4%}. "
            f"Claim insufficient."
        )
    if clv_ci_low <= jensen_floor_pct:
        return (
            False,
            f"CI95 low {clv_ci_low:.4%} <= Jensen floor {jensen_floor_pct:.4%}. "
            f"Claim in noise floor."
        )
    return (
        True,
        f"CLV {clv_mean:.4%} [{clv_ci_low:.4%}, {clv_ci_high:.4%}] "
        f"excludes Jensen floor {jensen_floor_pct:.4%}. Claim valid."
    )


# Project constants (L9 finding)
PROJECT_JENSEN_FLOOR_DEFAULT = 0.0023  # 0.23%
PROJECT_CLV_THRESHOLD_DEFAULT = 0.004  # 0.4%


if __name__ == "__main__":
    # Self-test
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--odds", type=float, nargs="*",
                   default=[1.5, 1.8, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0],
                   help="Sample odds distribution")
    p.add_argument("--noise-std", type=float, default=0.05)
    p.add_argument("--bootstrap", type=int, default=1000)
    args = p.parse_args()

    floor, se = estimate_jensen_floor_empirical(
        args.odds, n_bootstrap=args.bootstrap, noise_std_pct=args.noise_std
    )
    print(f"Jensen floor (empirical): {floor:.4%} ± {se:.4%}")
    rec = recommend_threshold(floor, se)
    print(f"Recommended CLV threshold: {rec:.4%}")

    # Project defaults
    print(f"\nProject defaults:")
    print(f"  Jensen floor: {PROJECT_JENSEN_FLOOR_DEFAULT:.4%}")
    print(f"  CLV threshold: {PROJECT_CLV_THRESHOLD_DEFAULT:.4%}")
