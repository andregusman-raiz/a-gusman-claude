# Independence Audit Template

> **Rule L2-M11**. Toda decomposição multi-camada prova via data lineage que
> camadas NÃO compartilham feature-fonte. Sem audit, merge bloqueado.
> **Would have caught** C1/C2 teatro em DGM-v4 (ambos ingerindo Pinnacle close).

**Copy to `docs/roadmap/pfc/<theme_id>-INDEPENDENCE.md`.**

---

## Metadata

- **Theme ID**: <id>
- **Architecture component**: <e.g. DecisionPipeline 3-layer, new Target C>
- **Reviewer**: <agent>
- **Date**: <YYYY-MM-DD>
- **Linked PFC**: <path>

---

## 1. Layers or components claimed independent

List every layer/component that the architecture claims act as
independent validators:

| Component | Role | Claimed as independent of |
|-----------|------|--------------------------|
| C1 Target C | price residual trigger | C2, C3 |
| C2 EV calc | edge estimation | C1 |
| C3 Kelly | sizing | C1, C2 (uses edge from C2) |

If "dual-validation" is claimed anywhere, list ALL components involved.

---

## 2. Feature-source inventory per layer

For each layer, enumerate EVERY data source it reads at decision time:

### Layer C1
| Feature | Source table | Column | Captured when |
|---------|--------------|--------|---------------|
| `implied_prob_home` | mart.features_pre_match | derived from bet365 | pre-match |
| `feat_X` | ... | ... | ... |

### Layer C2
| Feature | Source table | Column | Captured when |
|---------|--------------|--------|---------------|
| `outcome_probs` | pinnacle (via Phase 9.3 fallback) | derived from pinn close | POSTERIOR to T-0 |
| ... | ... | ... | ... |

### Layer C3
| Feature | Source table | Column | Captured when |
|---------|--------------|--------|---------------|
| `edge` | C2 output | — | after C2 |
| `bankroll` | operator state | — | state |

---

## 3. Overlap matrix

For each pair of "independent" layers, compute intersection of their
source sets:

| Layer A | Layer B | Shared sources | Overlap % |
|---------|---------|----------------|-----------|
| C1 | C2 | {pinnacle_close_ip, ...} | >0 → FAIL |
| C2 | C3 | {edge} | expected (C3 uses C2 output) |

If any pair marked "independent" has overlap > 0, **INDEPENDENCE FAILS**.

**DGM-v4 case**: C1 uses pinnacle close + bet365 current → target.
C2 uses pinnacle close implied → outcome_probs.
Overlap = {pinnacle_close}. Supposed dual-validation is NOT independent.

---

## 4. Data lineage trace

For each shared source identified above, trace full lineage:

```
pinnacle close (stg.odds WHERE is_closing=TRUE)
  ↓
  ├── C1 Target C label  (P(pin_ip_close > bet_ip + 0.005))
  └── C2 outcome_probs   (1/pin_odd_close normalized)
```

Visualize as DAG. If same source feeds ≥2 "independent" layers, flag.

---

## 5. Temporal independence

Even if sources LOOK distinct, check temporal semantics (L9 A3+A12):

- Are both captured at same instant?
- Are both derived from correlated underlying process (e.g. both books
  reacting to same news)?

If yes, statistical independence is questionable even without shared source.

---

## 6. Verdict

- Components claimed independent: <N>
- Pairs audited: <C(N,2)>
- Pairs with overlap > 0: <M>
- **Verdict**: PASS (all M=0) / FAIL (any M>0) / PARTIAL (shared but explicitly justified)

If FAIL:
- Architecture cannot be validated with current claim of independence
- Either remove the claim (treat as single-layer with multiple inputs)
- OR redesign layers to have distinct sources
- Document decision

---

## 7. Redesign guidance (if FAIL)

Ask:
- Can C1's feature set exclude what C2 uses? (e.g. C1 only uses Bet365,
  movement velocity, soft-book consensus; C2 only uses Pinnacle implied)
- Is one layer's role truly different (prediction vs filter vs sizing)?
- Should we collapse layers rather than pretend they're independent?

---

## 8. Sign-off

Reviewer confirms:
- [ ] All feature sources enumerated per layer
- [ ] Overlap matrix computed
- [ ] Data lineage traced for every shared source
- [ ] Temporal independence evaluated
- [ ] Verdict documented

Signed: <reviewer_id>
Commit hash: <filled by hook>
