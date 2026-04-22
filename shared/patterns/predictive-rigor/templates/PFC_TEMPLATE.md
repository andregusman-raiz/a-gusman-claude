# PFC — Pre-registered Falsification Contract

> **Rule M1** (CRITICAL). Nenhum resultado positivo é aceito sem PFC
> commitado ANTES da execução. Execução sem PFC = resultado `UNCERTIFIED`.

**Copy this file to `docs/roadmap/pfc/<theme_id>-PFC.md` and fill out ALL sections before running any analysis.**

---

## Metadata

- **Theme ID**: <e.g. M01 / X07 / D06>
- **Theme title**: <exact title from THEMES_REGISTRY.yaml>
- **Author**: <agent/operator>
- **Created at**: <YYYY-MM-DD HH:MM>
- **Committed at**: <filled by git hook; must be before any execution>
- **Status**: draft | committed | executed | archived

---

## 1. What I'm testing (precise statement)

Hypothesis under test, in one precise sentence:

> <H1 statement — must be falsifiable, quantitative, with numeric threshold>

Null hypothesis (H0):

> <H0 statement — what "no effect" looks like>

---

## 2. Dataset & sample

- **Universe**: <e.g. stg.match WHERE competition_id=1 AND match_date<=...>
- **N expected**: <number after all filters>
- **Split**: <train / validation / test, dates and proportions>
- **Walk-forward?**: yes/no (if no, WHY — and LAIG must be explicit)
- **Power calc**: with N=<x>, detectable MDE with 80% power, α=5% is <y>%
  - MDE source: scripts/governance/power_calc.py (Rule I05)

---

## 3. Metrics

- **Primary metric**: <CLV / ROI / AUC / Brier / etc>
- **Threshold for PASS**: <value>  (must be Jensen-corrected if CLV)
- **Threshold for MARGINAL**: <value>
- **Threshold for FAIL**: <value>

Placebo test mandatory? yes/no (L7-M17 says yes if ROI claim)

Bonferroni N being used: <count of current hypotheses tested>
Adjusted α = 0.05 / N = <value>

---

## 4. Ex-ante expectations (Write-Before-Execute)

### 4.1 What I EXPECT to find

> <1-3 sentences of specific expectation>

### 4.2 What would FALSIFY my hypothesis

> <specific numeric criterion — if observed X, H1 is dead>

### 4.3 What would CONFIRM my hypothesis

> <specific numeric criterion — only if Y is observed, H1 is supported>

### 4.4 Surprise flag

Things I would treat as SURPRISES requiring extra investigation:

- <e.g. "If ROI > +5%, suspect look-ahead bias — run LAIG audit">
- <...>

---

## 5. Risk of repeat cycles (L1 audit)

Does this theme resemble a past cycle?

| Past cycle | Similarity | Mitigation |
|---|---|---|
| Cycle 4 (target leak) | if using derived feature of outcome | LAIG pass required |
| Cycle 9-11 (pivot-loop) | if previously ARQUIVAR'd topic | M6 sunk-cost ADR required |
| Cycle 13 (look-ahead replay) | if using any close/future data | LAIG pass + time-reverse test |

If similarity found, describe mitigation:

> <mitigation statement>

---

## 6. Look-ahead inspection (LAIG, Rule M3)

For EACH feature / target / outcome source used:

| Name | Observable at T-0 (decision time)? | Source table | Notes |
|------|------------------------------------|--------------|-------|
| <feature_1> | yes / no / depends | <path> | <why yes/no> |
| <feature_2> | yes / no / depends | <path> | <why yes/no> |

If any "no" or "depends", feature is `future_info`. Justify inclusion or remove.

---

## 7. Independence audit (Rule L2-M11)

If testing a multi-layer decomposition:

- Layer 1 feature sources: <list>
- Layer 2 feature sources: <list>
- Overlap detected? yes/no

If overlap, layers are NOT independent. Either reformulate or mark as failing
independence audit upfront.

---

## 8. Baseline parity (Rule L7-M16)

Before running complex model, must report:

- LogReg + Pinnacle-only baseline: <Brier / AUC / whatever primary>
- Flat prediction baseline: <same metric>
- Complex model target MUST beat baseline by Brier delta >= 0.003 OR ROI CI95 exclusive of baseline

Baseline results pre-filled: (run baseline_parity.sh)

```
<paste output>
```

---

## 9. Execution plan

### Steps
1. <step 1>
2. <step 2>
3. ...

### Expected runtime
<X minutes / hours>

### Artifacts produced
- `reports/<theme_id>_<analysis>.md` — main report
- `reports/<theme_id>_detail/` — supporting data
- Updates to `KNOWLEDGE_GRAPH.md` with findings
- Updates to `ASSUMPTION_LEDGER.md` if touches an assumption

---

## 10. Time-to-falsification budget (Rule M10)

- **Build/execute budget**: <hours>
- **Falsification/adversarial budget**: <hours, MUST be >= 40% of build>
- **Ratio**: <Y / (X+Y)>, must be >= 0.4

If ratio < 0.4, PFC rejected by hook.

---

## 11. Goalpost lock (Rule M4)

Thresholds declared in §3 are LOCKED. Moving them post-execution requires:
- Explicit override commit with rationale
- Re-run of full analysis with new threshold
- Adversarial review logging the change

---

## 12. Pre-execution sign-off

By committing this PFC I acknowledge:

- [ ] H1 is falsifiable and numerically specific
- [ ] Jensen correction applied if CLV metric used (Rule L9-R2)
- [ ] Walkforward enforced (Rule M3)
- [ ] LAIG inspection done for every variable
- [ ] Power calc pre-registered (Rule I05)
- [ ] Bonferroni N updated in project counter
- [ ] Baseline parity ran FIRST
- [ ] Time-to-falsification budget >= 40%
- [ ] KNOWLEDGE_GRAPH consulted for invalidating findings
- [ ] Sunk-cost declaration filed if topic previously ARQUIVAR'd (Rule M6)

Signed: <agent_id / operator>
Commit hash of this file: <filled by hook>

---

## 13. Post-execution addendum (filled AFTER results)

### Primary metric value
<actual number>

### Did result match ex-ante expectations?
yes / no / partial

### Surprises?
- ...

### Decision
- [ ] H1 SUPPORTED (per §3 threshold)
- [ ] H1 MARGINAL (between pass and fail)
- [ ] H0 CANNOT BE REJECTED (null result)
- [ ] H1 FALSIFIED

### Evidence artifacts
- Main report: <path>
- Data: <path>
- Bootstrap CI / placebo output: <path>

### KNOWLEDGE_GRAPH update
Entry appended? yes/no (path: <>)

### ASSUMPTION_LEDGER update
Any assumptions changed status? yes/no (list changes)
