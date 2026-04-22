# Baseline Parity Template

> **Rule L7-M16**. LogReg + Pinnacle-only rodados ANTES de qualquer modelo
> complexo. Nova família arquivada se não supera baseline por Brier delta
> ≥ 0.003 OU CI95 ROI exclusivo.

**Copy to `docs/roadmap/pfc/<theme_id>-BASELINE.md`.**

---

## Metadata

- **Theme ID**: <id>
- **Proposed method**: <e.g. LightGBM with L4 features, Bayesian hierarchical>
- **Reviewer**: <agent>
- **Date**: <YYYY-MM-DD>
- **Linked PFC**: <path>

---

## 1. Baseline set (MUST pre-exist before proposed method runs)

### Baseline 1: Flat prediction
- Predicts (1/3, 1/3, 1/3) for every match in 1x2
- Primary metric on validation split: <Brier, Log-Loss, etc>
- Expected: ~0.222 Brier

### Baseline 2: Home-advantage only
- Predicts fixed (p_h, p_d, p_a) learned from train set base rate
- Primary metric on validation split: <value>
- Expected: ~0.215 Brier (Brasileirão)

### Baseline 3: Pinnacle-only
- outcome_probs = vig-removed Pinnacle close implied
- Primary metric on validation split: <value>
- Expected: **this is the one to beat**

### Baseline 4: Logistic regression + odds features
- Features: implied_prob_home / draw / away + 5-10 simple features
- Primary metric on validation split: <value>
- Expected: should EMPATE Pinnacle (L7 surprise)

---

## 2. Pre-flight baseline execution

Before proposed method runs, execute:

```bash
python scripts/governance/baseline_parity.py \
    --theme <id> \
    --universe <query or preset> \
    --split train_end=2020,valid_end=2023 \
    --metric brier \
    --output reports/baseline_<theme_id>.md
```

Expected output table:

| Baseline | Train | Valid | Test | Notes |
|----------|-------|-------|------|-------|
| Flat | 0.222 | 0.222 | 0.222 | no variance |
| Home-only | 0.218 | 0.215 | 0.214 | single rate |
| Pinnacle-only | 0.190 | 0.189 | 0.188 | sharp ground truth |
| LogReg+odds | 0.190 | 0.189 | 0.188 | L7 surprise: tied Pinnacle |

---

## 3. Proposed method gate

Proposed method must clear ONE of:
- Brier valid delta >= 0.003 BELOW best baseline
- ROI CI95 on paper-trade strictly > 0 AND strictly > best baseline ROI

If neither, method is arquivada.

---

## 4. Sanity checks

Before accepting a "supera baseline" claim:

- [ ] Same split applied to baseline and method
- [ ] Same universe filter
- [ ] Same handling of missing data
- [ ] Walkforward (no leakage into baseline either)
- [ ] Bootstrap CI95 on delta, not on raw values

If method looks 5x better than baseline, suspect contamination.

---

## 5. Why LogReg?

L7 discovered: LogReg with just odds features EMPATA Pinnacle in Brier.
LightGBM is WORSE than LogReg in 4/4 folds. Why?

- Mercado sharp absorve não-linearidades
- Overfitting em features derivadas de odds
- LogReg é mais honesto estatisticamente

Consequence: any LightGBM / XGBoost / NN variant must be justified AGAINST
LogReg before adding complexity.

---

## 6. Proposed method results (fill AFTER baseline)

| Metric | Best baseline | Proposed method | Delta | CI95 delta |
|--------|---------------|-----------------|-------|------------|
| Brier valid | <value> | <value> | <delta> | [<low>, <high>] |
| AUC valid | <value> | <value> | <delta> | [<low>, <high>] |
| ROI walkforward | <value> | <value> | <delta> | [<low>, <high>] |
| Jensen-adj CLV | <value> | <value> | <delta> | [<low>, <high>] |

### Verdict
- [ ] Proposed method passes gate (delta + CI95 strict)
- [ ] Proposed method MARGINAL (passes one criterion, not both)
- [ ] Proposed method FAILS (archived)

---

## 7. Sign-off

Reviewer confirms:
- [ ] All 4 baselines ran with same split/universe/filters
- [ ] Best baseline identified correctly
- [ ] Proposed method comparison used identical pipeline
- [ ] Delta + CI95 both passed (not just delta)
- [ ] Verdict recorded

If method passes, document AND update ASSUMPTION_LEDGER for this layer.

Signed: <reviewer_id>
Commit hash: <filled by hook>
