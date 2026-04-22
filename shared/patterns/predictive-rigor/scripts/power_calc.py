"""Power calculation helper — Rule I05.

Before any confirmatory test, declare MDE (Minimum Detectable Effect)
and required N for 80% power at α=5%.

For binomial proportion tests (win rate) and normal-approximate tests
(ROI, CLV), compute:
  - N required given target MDE
  - MDE detectable given N
  - Power achieved given N and observed effect

L9 Finding: N=1615 bets → power 4.5% for ROI=+1%. Project was structurally
underpowered and nobody checked.

Usage:
    python scripts/governance/power_calc.py --kind binomial --p0 0.5 --mde 0.02
    python scripts/governance/power_calc.py --kind roi --sd 0.05 --mde 0.01
"""

from __future__ import annotations

import argparse
import math
import sys
from typing import Optional


Z_95 = 1.96  # two-sided 95% CI
Z_80 = 0.8416  # one-sided 80% power


def required_n_binomial(p0: float, mde: float, alpha: float = 0.05, power: float = 0.80) -> int:
    """Sample size required to detect shift p0 → p0+mde with given power.

    Two-sided test.
    """
    from_z = Z_95 if alpha == 0.05 else _z_alpha_two_sided(alpha)
    power_z = Z_80 if power == 0.80 else _z_power(power)
    p1 = p0 + mde
    se0 = math.sqrt(p0 * (1 - p0))
    se1 = math.sqrt(p1 * (1 - p1))
    numerator = (from_z * se0 + power_z * se1) ** 2
    denominator = mde ** 2
    return int(math.ceil(numerator / denominator))


def mde_binomial_given_n(p0: float, n: int, alpha: float = 0.05, power: float = 0.80) -> float:
    """Minimum Detectable Effect for binomial test given N."""
    from_z = Z_95 if alpha == 0.05 else _z_alpha_two_sided(alpha)
    power_z = Z_80 if power == 0.80 else _z_power(power)
    # Conservative: use p0 for both SEs (slight over-estimate of MDE)
    se = math.sqrt(p0 * (1 - p0) / n)
    return (from_z + power_z) * se


def required_n_roi(sd_per_bet: float, mde: float, alpha: float = 0.05, power: float = 0.80) -> int:
    """N to detect ROI/bet = mde given std dev per bet sd_per_bet."""
    from_z = Z_95 if alpha == 0.05 else _z_alpha_two_sided(alpha)
    power_z = Z_80 if power == 0.80 else _z_power(power)
    z_total = from_z + power_z
    return int(math.ceil((z_total * sd_per_bet / mde) ** 2))


def mde_roi_given_n(sd_per_bet: float, n: int, alpha: float = 0.05, power: float = 0.80) -> float:
    """MDE for ROI test given N and std dev per bet."""
    from_z = Z_95 if alpha == 0.05 else _z_alpha_two_sided(alpha)
    power_z = Z_80 if power == 0.80 else _z_power(power)
    se_mean = sd_per_bet / math.sqrt(n)
    return (from_z + power_z) * se_mean


def power_given_n_and_effect(
    n: int, effect: float, sd_per_bet: float, alpha: float = 0.05
) -> float:
    """Power (probability of rejecting H0) given N, observed effect, sd per bet."""
    from_z = Z_95 if alpha == 0.05 else _z_alpha_two_sided(alpha)
    se_mean = sd_per_bet / math.sqrt(n)
    z_diff = effect / se_mean - from_z
    return _phi(z_diff)


def _z_alpha_two_sided(alpha):
    # crude inverse CDF
    # Only used for non-standard alpha; for 0.05 use Z_95 constant
    return Z_95 if alpha == 0.05 else 1.96  # simplification


def _z_power(power):
    return Z_80 if power == 0.80 else 0.8416


def _phi(z):
    """Standard normal CDF approximation."""
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2)))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--kind", choices=["binomial", "roi"], required=True)
    p.add_argument("--p0", type=float, help="baseline probability (binomial)")
    p.add_argument("--sd", type=float, help="std dev per bet (roi)")
    p.add_argument("--mde", type=float, help="minimum detectable effect (decimal)")
    p.add_argument("--n", type=int, help="available sample size")
    p.add_argument("--power", type=float, default=0.80)
    p.add_argument("--alpha", type=float, default=0.05)
    args = p.parse_args()

    print(f"Inputs: kind={args.kind} power={args.power} alpha={args.alpha}")
    print()

    if args.kind == "binomial":
        if args.p0 is None:
            sys.stderr.write("--p0 required for binomial\n")
            return 1
        if args.mde:
            n = required_n_binomial(args.p0, args.mde, args.alpha, args.power)
            print(f"N required to detect p0={args.p0:.3f} → {args.p0+args.mde:.3f}: {n}")
        if args.n:
            mde = mde_binomial_given_n(args.p0, args.n, args.alpha, args.power)
            print(f"MDE detectable with N={args.n}: {mde:.4%}")
    else:  # roi
        if args.sd is None:
            sys.stderr.write("--sd required for roi\n")
            return 1
        if args.mde:
            n = required_n_roi(args.sd, args.mde, args.alpha, args.power)
            print(f"N required to detect ROI/bet = {args.mde:.4%} (sd={args.sd:.3f}): {n}")
        if args.n:
            mde = mde_roi_given_n(args.sd, args.n, args.alpha, args.power)
            print(f"MDE detectable with N={args.n}, sd={args.sd:.3f}: {mde:.4%}")
            if args.mde:
                # Also compute power at observed effect
                pw = power_given_n_and_effect(args.n, args.mde, args.sd, args.alpha)
                print(f"Power if effect = {args.mde:.4%}: {pw:.1%}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
