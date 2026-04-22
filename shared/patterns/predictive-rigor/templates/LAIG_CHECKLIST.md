# LAIG — Look-Ahead Inspection Gate Checklist

> **Rule M3** (CRITICAL). Toda feature / target / outcome-source responde:
> "No instante T-0 (decisão), esta quantidade é observável?". Resposta "não"
> ou "depende" = tratar como `future_info`. **Would have blocked ciclo 13**.

**Copy this to `docs/roadmap/pfc/<theme_id>-LAIG.md` and fill out for every analysis.**

---

## Metadata

- **Theme ID**: <id>
- **Analysis name**: <e.g. target_c_rebuild, stakes_ablation>
- **Reviewer**: <agent/operator>
- **Date**: <YYYY-MM-DD>
- **Linked PFC**: <path>

---

## 1. Decision time T-0 definition

For this analysis, "the decision" is made at:

> <e.g. T-0 = 30 minutes before kickoff, at time of bet365 odd snapshot>

This is the **only** time at which decision-time features can be observed.
Any quantity computed AFTER T-0 is future_info and cannot enter the model.

---

## 2. Feature inventory

For EVERY column used (as X feature, y target, or outcome probability source):

| # | Column | Source table | Timestamp of capture | Observable at T-0? | Verdict | Remediation |
|---|--------|--------------|---------------------|--------------------|---------|-------------|
| 1 | <col_name> | stg.foo | <when captured> | yes / no / depends | SAFE / FUTURE / PARTIAL | <action> |
| 2 | ... | ... | ... | ... | ... | ... |

**Rules for verdict**:
- **SAFE**: column is 100% observable at T-0, no cross-contamination with future
- **FUTURE**: column contains future information (e.g. `home_goals`, `pinnacle_close`, `stg.sofascore_player_ratings`)
- **PARTIAL**: column is derived from mix (e.g. rolling feature that includes current match if not careful)

**Rules for remediation**:
- FUTURE → remove column or use only as validation target (not input)
- PARTIAL → rewrite computation to use strict `< T-0` filter
- SAFE → proceed

---

## 3. Derived features audit

If any SAFE column was then transformed (ratio, lag, rolling), audit the derivation:

| Derived name | Base columns | Verdict | Risk |
|--------------|--------------|---------|------|
| `rolling_xg_5` | home_xg (PARTIAL) | PARTIAL | if includes current match's xg, is FUTURE |
| ... | ... | ... | ... |

Transformation that turns SAFE → FUTURE:
- Computing statistics over window that includes match t
- Using `MAX(captured_at)` without bound
- Joining on match_id without temporal filter
- Using `is_closing=TRUE` as "latest pre-decision" (FALSE — closing is posterior to Bet365 open)

---

## 4. Target / outcome_probs audit

Target variable (if supervised learning):

> <e.g. `brier_home = (pinnacle_close_ip_home - actual_home_win)²`>

Outcome_probs source:

> <e.g. "pinnacle close implied proportional-normalized">

**Critical question**: is the target / outcome_probs source SAFE at T-0?

If using "what will happen" as target: that's OK (supervised learning).

If using "what the market later decided" (e.g. Pinnacle close) as input at decision time: **NOT SAFE** — this is the ciclo 13 pattern.

If using "what the market will think at close" as target to predict: SAFE (you're predicting a future state, not using it).

---

## 5. Cross-sectional vs temporal semantic audit

Critical distinction (L9 A3+A12):

- **Cross-sectional**: compare bet365 and pinnacle at the SAME instant. PR #103 did this.
- **Temporal**: compare bet365 earlier vs pinnacle later. PR #103 did NOT do this (timestamps are synthetic).

If analysis claims "Pinnacle lags Bet365 temporally", must verify:

- [ ] Timestamps gap between bet365 and pinnacle snapshots is observed (not `0h`)
- [ ] Median gap is at least 1 hour for it to count as temporal
- [ ] Cohort tested does not include the 100% gap=0h cases

If ANY fail, the analysis is cross-sectional only. State this explicitly.

---

## 6. Data lineage check

For each SAFE column:

- Trace back to source capture. When was it actually captured?
- Audit `stg.odds.captured_at` vs `match.match_date` / `match_time`
- Flag if captured_at > kickoff - small_epsilon

Use: `scripts/governance/temporal_audit.sh <column>` (to be implemented, G14).

---

## 7. Summary verdict

- Total features inventoried: <N>
- SAFE: <n1>
- FUTURE (removed/neutralized): <n2>
- PARTIAL (fixed): <n3>

**Overall LAIG verdict**: PASS / FAIL

If FAIL: cannot proceed to execution until remediation. Update PFC
to reflect changes or archive the analysis.

---

## 8. Sign-off

Reviewer confirms:
- [ ] Every column traced to capture timestamp
- [ ] Every derived feature audited for temporal correctness
- [ ] Target/outcome_probs are not future-leaking inputs
- [ ] Cross-sectional vs temporal distinction declared
- [ ] Remediation applied or analysis aborted

Signed: <reviewer_id>
Commit hash: <filled by hook>

---

## Common LAIG FAIL patterns (anti-patterns to watch)

- Using `pinnacle_close` as input feature (ciclo 13)
- Using `home_xg, away_xg` without temporal filter (H8 leak)
- Using `sofascore_player_ratings` (stg table is pós-jogo, D08)
- Using `player_availability` (10:00 UTC derivado de lineups pós-jogo, D09)
- Using `is_closing=TRUE` snapshot as "latest pre-decision" (closing is posterior, D02)
- Computing rolling xg on window that includes match t
- Using `MAX(captured_at)` without `< match_date - epsilon`
- Join `odds_snapshots` on `match_id` without temporal filter

Each of these caused at least one documented cycle.
