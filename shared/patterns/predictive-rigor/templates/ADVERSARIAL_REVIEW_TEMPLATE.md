# ADVERSARIAL REVIEW — Epoch <N>

> **Rule G17 (CRITICAL).** This document is produced by an adversarial agent at the END of each
> epoch, before the epoch gate is cleared. The agent's posture is "hired to break the project's
> conclusions", NOT to validate them. Every finding must be evidenced; every null result must be
> documented with the same prominence as a finding.
>
> **Do not fill during execution.** Fill only after the last theme of the epoch is closed.
> Copy this file to `docs/roadmap/checkpoints/adversarial_review_epoch_<N>.md`.

---

## §1 Metadata

- **Epoch reviewed**: <e.g. E0 — Governance hardening>
- **Reviewer**: <agent name or "operator + agent pair">
- **Review date**: <YYYY-MM-DD>
- **PR / commit scope**: <link to last PR of epoch or SHA range>
- **Themes closed this epoch**: <count> / <total in epoch>
- **Themes archived/obsolete this epoch**: <count>
- **Prior at epoch start**: <X%> → **Prior at epoch end**: <Y%>
- **Halt triggered during epoch?**: yes/no — <if yes, link to PREMISSA_RAIZ_LEDGER entry>

---

## §2 Re-Execution Checklist

> Adversarial rule: re-run at least 3 critical analyses from this epoch using a different random
> seed (or different temporal split). A robust result should not be seed-sensitive.
>
> For each analysis: list the original report, re-run command, new seed/split, and whether
> the conclusion held.

| # | Original analysis | Report path | Re-run seed/split | Re-run result | Conclusion held? |
|---|-------------------|-------------|-------------------|---------------|-----------------|
| 1 | <e.g. Walkforward epoch replay> | `reports/...` | `seed=42 → seed=137` | <key metric> | yes/no/partial |
| 2 | <e.g. Bootstrap CI on CLV> | `reports/...` | `N=1000 → N=5000` | <key metric> | yes/no/partial |
| 3 | <e.g. Power calc for next epoch> | `reports/...` | `different MDE assumption` | <key metric> | yes/no/partial |

**Drift detected in re-executions?** yes/no
**If yes** — which conclusion changed? (describe and link to §4 Severity Matrix)

---

## §3 Drift Detection Report

> Compare key numeric results between the START of this epoch and the END.
> "Drift" = any number that moved by >10% relative or any directional flip.
>
> Sources to compare: KNOWLEDGE_GRAPH.md (findings), PREMISSA_RAIZ_LEDGER.md (prior),
> ASSUMPTION_LEDGER.md (assumption statuses), goalposts/*.yaml (thresholds).

### 3.1 Numeric drift table

| Metric | Epoch start value | Epoch end value | Delta | Drift flag |
|--------|------------------|-----------------|-------|------------|
| Prior belief (PREMISSA_RAIZ_LEDGER) | X% | Y% | Δ pp | yes/no |
| Themes with `assumption: supported` | N | M | ΔN | yes/no |
| Themes with `assumption: challenged` | N | M | ΔN | yes/no |
| CLV Jensen threshold (G05 registered) | +0.4% | +0.4% | 0 | no |
| <other numeric gate> | <value> | <value> | <delta> | yes/no |

### 3.2 Directional flips (findings that reversed)

> List any finding from KNOWLEDGE_GRAPH that now has a contradicting finding
> added during this epoch. If none, write "none detected."

- <Finding F-XXX (epoch start): "X was Y"> → <Finding F-YYY (epoch end): "X is Z"> — flip on [topic]
- ...

### 3.3 Assumption status changes (ASSUMPTION_LEDGER)

> List assumptions that changed status this epoch (pending → challenged → supported → invalidated).

| Assumption ID | Status before epoch | Status after epoch | Theme that changed it |
|---------------|--------------------|--------------------|----------------------|
| <e.g. A01> | pending | challenged | <G14 — walkforward showed...> |

---

## §4 Goalpost Audit

> **Rule M4 (CRITICAL).** Any threshold that moved silently — without a registered ADR + PFC update
> committed BEFORE the change — is a protocol violation. This section audits every numeric gate
> to detect silent moves.
>
> Check: `docs/roadmap/goalposts/*.yaml`, `THEMES_REGISTRY.yaml` threshold fields,
> PFCs under `docs/roadmap/pfc/`. Compare git log for each file.

### 4.1 Threshold inventory

| Gate | Registered value (epoch start) | Current value | Changed? | ADR reference | Violation? |
|------|--------------------------------|---------------|----------|---------------|-----------|
| CLV skill threshold (G05) | +0.4% CI95 excl +0.25% | <current> | yes/no | <ADR link or "none"> | yes/no |
| FAILURE_CRITERION ROI floor | -9.93% (history) | <current> | yes/no | <ADR link or "none"> | yes/no |
| Power target (I05) | 80% at MDE=+1% | <current> | yes/no | <ADR link or "none"> | yes/no |
| <other gate> | <value> | <value> | yes/no | <link> | yes/no |

### 4.2 Silent changes detected

> List any threshold that changed WITHOUT a corresponding ADR + PFC update committed before execution.
> If none: write "GOALPOST AUDIT CLEAN — no silent changes detected this epoch."

- **[VIOLATION / CLEAN]** <gate name>: <description of silent change or clean status>

---

## §5 Ten Questions the Operator is Avoiding

> This section is mandatory. The adversarial agent identifies the 10 most uncomfortable
> questions that the KNOWLEDGE_GRAPH, assumption ledger, and epoch work leave unanswered —
> specifically questions the operator has not asked but should.
>
> Format: state the question, then state WHY the operator might be avoiding it (cognitive bias
> or convenience), then state what evidence would answer it.
>
> **Example (from diag_09):**
> Q: "Are `is_closing` / `is_opening` timestamps synthetic?"
> Why avoided: "Would invalidate 13 cycles of walkforward interpretation."
> Evidence needed: "SQL: SELECT captured_at - kickoff_at per flag per book."

<!-- FILL_REQUIRED: replace numbered questions with real uncomfortable questions before epoch_closure validate -->
1. **Q:** <State the uncomfortable question precisely>
   - **Why possibly avoided:** <bias or inconvenience driving avoidance>
   - **Evidence that would answer it:** <concrete test, SQL, code check, or experiment>

2. **Q:** <question>
   - **Why possibly avoided:** <reason>
   - **Evidence needed:** <test>

3. **Q:** <question>
   - **Why possibly avoided:** <reason>
   - **Evidence needed:** <test>

4. **Q:** <question>
   - **Why possibly avoided:** <reason>
   - **Evidence needed:** <test>

5. **Q:** <question>
   - **Why possibly avoided:** <reason>
   - **Evidence needed:** <test>

6. **Q:** <question>
   - **Why possibly avoided:** <reason>
   - **Evidence needed:** <test>

7. **Q:** <question>
   - **Why possibly avoided:** <reason>
   - **Evidence needed:** <test>

8. **Q:** <question>
   - **Why possibly avoided:** <reason>
   - **Evidence needed:** <test>

9. **Q:** <question>
   - **Why possibly avoided:** <reason>
   - **Evidence needed:** <test>

10. **Q:** <question>
    - **Why possibly avoided:** <reason>
    - **Evidence needed:** <test>

---

## §6 Severity Matrix

> Consolidate all drift, goalpost violations, and re-execution failures into a single
> severity matrix. This drives the halt decision.

| # | Finding | Category | Severity | Halt trigger? | Recommended action |
|---|---------|----------|----------|---------------|-------------------|
| 1 | <e.g. "Bootstrap seed sensitivity on CLV CI"> | re-execution drift | MEDIUM | no | document in KNOWLEDGE_GRAPH, monitor next epoch |
| 2 | <e.g. "CLV threshold lowered from +0.4% to +0.35% without ADR"> | goalpost violation | CRITICAL | YES | revert threshold, require ADR + PFC before proceeding |
| 3 | <e.g. "Prior dropped below 15% — now at 12%"> | numeric drift | CRITICAL | YES | halt ritual per CHECKPOINTS_LOG halt protocol |
| 4 | | | | | |
| 5 | | | | | |

### Summary

- **CRITICAL drifts found:** <N>
- **HIGH drifts found:** <N>
- **MEDIUM drifts found:** <N>
- **Halt triggered by adversarial review?** yes/no
  - If yes: halt protocol in `CHECKPOINTS_LOG.md §Halt ritual protocol` applies immediately.
  - If no: proceed to §7 Sign-off.

---

## §7 Sign-off

> The adversarial reviewer must explicitly sign off (or refuse to sign off) before the epoch gate
> can be cleared. A refused sign-off blocks epoch advancement — operator must resolve findings.

**Sign-off status:** APPROVED / REFUSED / CONDITIONAL

**Conditions (if CONDITIONAL):**
1. <condition that must be met before gate clears>
2. <condition>

**Refused because (if REFUSED):**
- <specific CRITICAL finding that blocks sign-off — reference §6 row>

**Adversarial reviewer sign-off:**
- Name: <agent or "operator + agent pair">
- Date: <YYYY-MM-DD>
- Commit of this document: <SHA — filled by git>

**Epoch gate status after this review:** CLEARED / BLOCKED
