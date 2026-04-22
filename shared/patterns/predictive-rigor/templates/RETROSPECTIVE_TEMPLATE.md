# RETROSPECTIVE — Epoch <N>

> **Rule G18 (CRITICAL).** This retrospective is mandatory at the end of every epoch.
> All three questions (Q1/Q2/Q3) MUST be answered with non-trivial content.
> Placeholder answers ("nothing to report", "N/A", "TBD") are invalid.
>
> **Do not fill during execution.** Fill only after adversarial review (G17) is signed off.
> Copy this file to `docs/roadmap/checkpoints/retrospective_epoch_<N>.md`.
>
> The epoch gate does NOT clear until `epoch_closure.py validate --epoch N` exits 0.

---

## §1 Metadata

- **Epoch completed**: <e.g. E0 — Governance hardening>
- **Epoch start date**: <YYYY-MM-DD>
- **Epoch end date**: <YYYY-MM-DD>
- **Retrospective date**: <YYYY-MM-DD>
- **Author**: <agent or "operator">
- **Themes closed (done)**: <count>
- **Themes archived (done, with evidence)**: <count>
- **Themes obsolete (invalidated)**: <count>
- **Themes pending (carried to next epoch)**: <count> — list IDs: [<G01>, <G02>...]
- **Adversarial review**: `docs/roadmap/checkpoints/adversarial_review_epoch_<N>.md`
- **Adversarial review sign-off status**: APPROVED / CONDITIONAL / REFUSED
- **Prior at epoch end**: <X%>

---

## §2 Themes Closed This Epoch

> List all themes that moved to `status: done` or `status: archived` this epoch.
> Include the evidence_on_close for each so this retrospective is self-contained.

| Theme ID | Title | Status | Evidence on close |
|----------|-------|--------|------------------|
| <G01> | <title> | done | <one-sentence summary of evidence> |
| <G02> | <title> | archived | <one-sentence summary> |
| ... | | | |

---

## §3 Q1 — O que descobrimos que mudou hipótese?

> **Mandatory.** List every finding from this epoch's themes that caused a hypothesis in a
> PENDING theme to change. "Changed" means: the finding forces a re-read of the pending theme's
> premise, or makes the pending theme more/less likely to succeed, or requires rewriting its PFC.
>
> If nothing changed any pending hypothesis this epoch, that itself must be justified — it would
> be unusual for N themes to produce zero cross-contamination of hypotheses.
>
> **Good answer example:**
> "Finding in G14 (registry_check enforcement) revealed that 3 themes had PFCs committed AFTER
> their analysis scripts ran — not before. This changes the assumption in M01 (independence audit)
> that governance is enforced: we cannot assume past analyses are PFC-clean. M01 must now include
> an audit pass over existing reports, not just enforce forward."
>
> **Bad answer (not accepted):** "Nothing changed any hypothesis this epoch."

<!-- FILL_REQUIRED: replace this block with real findings before epoch_closure validate -->
### Findings that changed pending-theme hypotheses:

1. **Finding**: <finding from KNOWLEDGE_GRAPH — include F-XXX reference>
   - **Source theme**: <theme ID that produced this finding>
   - **Affected pending theme(s)**: [<theme IDs>]
   - **How it changes the hypothesis**: <precise statement — what was assumed before, what must change>
   - **Action required on affected themes**: [ ] Rewrite PFC | [ ] Archive | [ ] Reprioritize | [ ] No action needed (justify)

2. **Finding**: <finding>
   - **Source theme**: <ID>
   - **Affected pending theme(s)**: [<IDs>]
   - **How it changes the hypothesis**: <statement>
   - **Action required**: [ ] Rewrite PFC | [ ] Archive | [ ] Reprioritize | [ ] No action needed (justify)

*(add more as needed)*

---

## §4 Q2 — O que NÃO testamos mas deveríamos ter?

> **Mandatory.** List every gap that SHOULD have been covered by this epoch's themes but wasn't.
> "Gap" means: a question that the themes opened but didn't close, a dependency that was assumed
> but not validated, or an attack vector from the adversarial review (§5 of ADVERSARIAL_REVIEW)
> that remains unanswered.
>
> Each gap must have: (a) why it matters, (b) what concrete test would close it, (c) whether
> it blocks a pending theme or just degrades confidence.
>
> **Good answer example:**
> "G12 (goalpost_lock.py) was implemented but we never ran it against historical goalposts to
> confirm no silent changes occurred in epoch 0 itself. We implemented the guard for the future
> but did not audit the past. This matters because diag_09 identified threshold drift as a
> critical failure mode. Concrete test: run `goalpost_lock.py --audit-history` against all
> PFCs committed before epoch 0. Blocks: none directly, but degrades confidence in G05."

### Gaps identified:

<!-- FILL_REQUIRED: replace this block with real gaps before epoch_closure validate -->
1. **Gap**: <describe what was not tested>
   - **Why it matters**: <impact on project confidence or future themes>
   - **Concrete test to close it**: <specific command, SQL, or analysis>
   - **Blocks any pending theme?**: yes (<IDs>) / no
   - **Disposition**: [ ] Create new theme to cover it | [ ] Add to existing theme <ID> | [ ] Accept gap with documented rationale

2. **Gap**: <describe>
   - **Why it matters**: <impact>
   - **Concrete test**: <test>
   - **Blocks any pending theme?**: yes/no
   - **Disposition**: [ ] New theme | [ ] Add to <ID> | [ ] Accept gap

*(add more as needed)*

---

## §5 Q3 — Há achado que contradiz tema pendente? Reprise ou arquivar?

> **Mandatory.** For each finding from this epoch, check whether it contradicts any pending
> theme's premise. Then decide: REPRISE (rewrite the theme to account for the finding, continue)
> or ARCHIVE (theme's premise is invalidated, mark as obsolete, document why).
>
> Contradiction = a pending theme assumes X, but a finding proved not-X (or strongly suggests it).
> Partial contradiction = finding makes X less likely but doesn't fully negate it.
>
> If no contradictions are found after reviewing ALL epoch findings against ALL pending themes:
> justify explicitly why — don't write "none found" without showing the check was done.
>
> **Good answer example:**
> "Finding A3+A12 (synthetic timestamps) from diag_09 contradicts PR103 (temporal lag hypothesis).
> PR103 assumes Pinnacle lags Bet365 in time — but 100% of closing pairs have timestamp gap=0h.
> Decision: ARCHIVE PR103 as obsolete. Rationale: temporal lag is non-testable with current data.
> Any future reprise requires true intraday snapshots with distinct timestamps."

<!-- FILL_REQUIRED: replace this block with real contradiction checks before epoch_closure validate -->
### Contradiction checks:

1. **Finding**: <F-XXX from KNOWLEDGE_GRAPH — one sentence summary>
   - **Contradicts pending theme(s)**: [<theme IDs>]
   - **Nature of contradiction**: full / partial
   - **Decision**: REPRISE / ARCHIVE
   - **Rationale**: <why reprise or archive — what would need to change for reprise>
   - **If REPRISE**: actions required on theme (update PFC, rewrite hypothesis, etc.)
   - **If ARCHIVE**: update THEMES_REGISTRY.yaml `status: obsolete` + `archived_reason`

2. **Finding**: <finding>
   - **Contradicts**: [<IDs>]
   - **Nature**: full / partial
   - **Decision**: REPRISE / ARCHIVE
   - **Rationale**: <rationale>

*(add more as needed — if no contradictions found, show the check: "finding F-XXX checked against themes [list] — no contradiction because [reason]")*

---

## §6 Premissa-Raiz Update

> Based on Q1/Q2/Q3 and the adversarial review, update the project's prior belief.
> Reference: `docs/roadmap/PREMISSA_RAIZ_LEDGER.md`.

- **Prior at epoch start**: <X%>
- **Prior at epoch end**: <Y%>
- **Delta**: <+/- Z pp>
- **Justification for delta**: <why the prior moved — cite findings, or explain why stable>
- **Halt threshold (15%)**: <above / below>
- **Halt triggered by prior?**: yes / no

---

## §7 Decision — Proceed to Next Epoch or Halt?

> After filling Q1/Q2/Q3 and the adversarial review, the operator must make an explicit
> decision. "Proceed" is only valid if:
> (a) adversarial review sign-off = APPROVED or CONDITIONAL (conditions met)
> (b) prior ≥ 15% OR operator explicitly acknowledges halt trigger with documented rationale
> (c) no CRITICAL drift in adversarial review §6 without resolution plan

**Decision**: PROCEED TO EPOCH <N+1> / HALT / CONDITIONAL PROCEED

**If PROCEED**: confirm conditions:
- [ ] Adversarial review signed off: APPROVED / CONDITIONAL (conditions met: <list>)
- [ ] Prior ≥ 15% OR operator acknowledgment on file: <link>
- [ ] No unresolved CRITICAL drifts: <confirm or list resolution>
- [ ] `epoch_closure.py validate --epoch <N>` exits 0: <confirm>

**If HALT**: document halt ritual steps per CHECKPOINTS_LOG.md §Halt ritual protocol.

**If CONDITIONAL PROCEED**: list conditions that must be resolved before first theme of epoch N+1:
1. <condition>
2. <condition>

---

## §8 Re-Prioritization Actions for Pending Themes

> Based on the retrospective, list concrete actions on the pending backlog before epoch N+1 starts.
> These must be executed BEFORE running `epoch_closure.py validate`.

| Action | Theme affected | Action type | Owner | Deadline |
|--------|---------------|-------------|-------|----------|
| <e.g. Rewrite PFC for M01 to include historical audit> | M01 | PFC update | operator | before epoch N+1 theme 1 |
| <e.g. Archive PR103 — mark obsolete in THEMES_REGISTRY> | PR103 | status update | operator | immediate |
| <e.g. Create new theme N141 to cover gap in §4 item 1> | N141 (new) | create theme | operator | before epoch N+1 theme 3 |

---

## §9 Sign-off

> Retrospective is valid only after both the operator and the adversarial review (G17) sign off.
> `epoch_closure.py validate` checks that Q1/Q2/Q3 are non-empty AND this sign-off block exists.

**Retrospective status**: COMPLETE / INCOMPLETE (do not submit as COMPLETE if any Q has placeholder answers)

**Operator sign-off**:
- Name: <operator>
- Date: <YYYY-MM-DD>
- Statement: "I confirm Q1/Q2/Q3 are answered with non-trivial content, the adversarial review
  is signed off, and the re-prioritization actions above are committed or scheduled."

**Epoch gate**: CLEARED on <YYYY-MM-DD> by `epoch_closure.py validate --epoch <N>`
