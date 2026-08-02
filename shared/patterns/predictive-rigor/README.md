# Predictive Rigor — Starter Kit

**Versão**: 1.0 (destilado de betting-prediction Phase 1, 2026-04-19)
**Escopo**: qualquer projeto preditivo — betting, finance, operational forecasting, scoring, anomaly detection

---

## O que este kit resolve

Projetos preditivos falham por 5 causas recorrentes:
1. **P-hacking retrospectivo** — testa 100 variantes, reporta a que passou
2. **Data leakage** — feature usa informação não disponível em produção
3. **Baseline theater** — modelo complexo sem comparação com trivial
4. **Multiple testing bias** — 20 testes α=0.05 → 1 "positivo" por sorte
5. **Sunk-cost loops** — "só mais uma variação" por 6 meses

Este kit fornece **ferramentas + templates + regras** para prevenir os 5 antes que causem dano.

---

## Instalação rápida (em projeto novo)

```bash
cd <meu-projeto>
mkdir -p scripts/governance docs/templates docs/specs

# Copiar scripts
cp ~/Claude/.claude/shared/patterns/predictive-rigor/scripts/* scripts/governance/
chmod +x scripts/governance/*.sh

# Copiar templates
cp ~/Claude/.claude/shared/patterns/predictive-rigor/templates/* docs/templates/

# Ativar pre-commit hook
cp scripts/governance/pre_commit_governance.sh .git/hooks/pre-commit
```

---

## 18 scripts universais

### Tier 1 — Pre-test (obrigatório antes de qualquer análise)

| Script | Uso | Previne |
|--------|-----|---------|
| `power_calc.py` | Calcular N mínimo por MDE | Under-powered study |
| `laig_scan.py` | Scan de look-ahead em features | Data leakage |
| `independence_audit.py` | Data lineage entre camadas | Independence theater |
| `goalpost_lock.py` | Lock de critérios PASS/FAIL | Moving goalposts (p-hacking) |

### Tier 2 — Durante teste (em cada run)

| Script | Uso | Previne |
|--------|-----|---------|
| `bootstrap_ci.py` | CI95 por bootstrap | Overclaiming single-point estimates |
| `baseline_parity.py` | Trivial baseline vs modelo | Baseline theater |
| `jensen_correction.py` | Correção para métricas não-lineares | Jensen bias inflation |
| `heteroscedasticity_check.py` | Triple ablation variance | Trivial heteroscedasticity masking null |
| `confounding_check.py` | L2 confounding detection | Confounded claims |

### Tier 3 — Post-test (gate antes de claim)

| Script | Uso | Previne |
|--------|-----|---------|
| `assumption_ledger.py` | Track hipóteses e deltas | Accumulation of untested assumptions |
| `knowledge_graph_validator.py` | KG integrity | Orphan findings |
| `registry_check.py` | Roadmap validation | Status inconsistency |

### Tier 4 — Governance (nivel projeto)

| Script | Uso | Previne |
|--------|-----|---------|
| `sunk_cost_guard.py` | Rule M6 enforcement | "Só mais uma tentativa" loop |
| `time_budget.py` | Budget por fase | Infinite iteration |
| `checkpoint_monitor.py` | Cadência de checkpoints | Silent drift |
| `epoch_closure.py` | Formal closure de fases | Undeclared phase transitions |
| `burn_down.py` | Progresso de work | Visibility |
| `replay_auto_runner.py` | Automated rerun | Manual-only replay |

### Tier 5 — Integration

| Script | Uso |
|--------|-----|
| `pre_commit_governance.sh` | 13 checks integrados em pre-commit git hook |
| `require_baseline_parity.sh` | Bloqueia commit sem baseline parity report |

---

## 6 templates universais

### PFC_TEMPLATE.md — Pre-registered Falsification Contract
Estrutura:
- Hipótese H0 e H1 com mecanismo causal
- Critério PASS (ex-ante, não negociável)
- Critério FAIL (ex-ante)
- N mínimo (power-derived)
- Placebo design
- Bonferroni/FDR threshold

**Uso**: escrever ANTES de qualquer análise. Commit antes de ver dados.

### LAIG_CHECKLIST.md — Look-Ahead Inspection Gate
Checklist por feature:
- "No instante T-0 (decisão), esta quantidade é observável?"
- Source data timestamp
- Dependency chain
- Verdict: SAFE / UNSAFE / DEPENDS

**Uso**: em cada feature nova. Unsafe = bloqueia merge.

### INDEPENDENCE_AUDIT.md — Multi-layer data lineage
Matrix de sources por camada. Verifica overlap.

**Uso**: em arquiteturas multi-modelo. 100% overlap = "dual validation theatrical".

### BASELINE_PARITY.md — Trivial baseline comparison
Compara modelo complexo contra:
- Random baseline
- Market-only / benchmark trivial
- LogReg simples

**Uso**: antes de reportar qualquer modelo complexo.

### ADVERSARIAL_REVIEW_TEMPLATE.md — Structured critique
- 3 razões pelas quais o resultado pode ser espúrio
- Data leakage possíveis
- Alternative explanations
- Required evidence para descartar cada

**Uso**: antes de claim de edge/signal.

### RETROSPECTIVE_TEMPLATE.md — Phase closure
- What worked
- What didn't
- Prior update quantitativo
- Lessons for next phase

**Uso**: fim de cada fase/epoch/onda.

---

## 30+ regras anti-ciclo (meta)

Regras críticas inegociáveis (falha = bloqueio):

**M1 — Pre-registered Falsification Contract**
Antes de qualquer análise, escrever spec com "espero X", "se Y, falsifica". Resultado positivo sem PFC pre-committed = UNCERTIFIED.

**M3 — Look-Ahead Inspection Gate (LAIG)**
Toda feature responde: "no instante T-0, esta quantidade é observável?". Não ou "depende" = não usar.

**M4 — Goalpost lock**
Critério PASS/FAIL locked antes de ver dados. Ajustar threshold mid-analysis = violação.

**M6 — Sunk cost declaration**
Antes de "só mais uma tentativa", declarar formalmente tempo investido + razão explícita para continuar (não inércia).

**M11 — Independence Audit**
Arquitetura multi-camada prova via data lineage que camadas não compartilham source. Sem audit, claims de "dual validation" = theatrical.

**M16 — Baseline parity**
Baseline trivial rodado ANTES de modelo complexo. Se complexo não supera trivial por margin significante, arquivar.

**Demais 24 regras** — ver `~/.claude/rules/predictive-systems.md` (workspace-level)

---

## Quick-start workflow (para análise nova)

```
Dia 1: Write PFC + adversarial review (templates)
Dia 2: Power calc + coverage audit
Dia 3: LAIG scan em features
Dia 4: Goalpost lock + baseline parity plan
Dia 5-8: Implementation
Dia 9-10: Walkforward + bootstrap + placebo
Dia 11: Heteroscedasticity check + confounding check
Dia 12: Adversarial review of results
Dia 13: Assumption ledger update + KG entry
Dia 14: Phase retrospective if closing phase
```

**Hard stop**: sem PFC commitado antes de Dia 5, bloqueio.

---

## Projetos onde este kit é útil

- **Sports betting prediction** (origem)
- **Financial quant** (alpha claims → requiring replication cross-regime)
- **Churn/default prediction** (baseline parity obrigatório)
- **Fraud detection** (multiple testing em rules engines)
- **Recommendation systems** (AB test rigor)
- **Operational forecasting** (jansen correction for MAPE)
- **Anomaly detection** (placebo = shuffled labels)
- **A/B testing programs** (family-level FDR)

---

## História (contexto)

Este kit foi destilado de **13 ciclos falhos** em `~/Claude/GitHub/betting-prediction` (Phase 1, 2025-2026). Cada regra M1-M40 corresponde a um incidente documentado em `reports/ANTI_CYCLE_RULES.md` + `reports/DIAGNOSIS_SYNTHESIS.md` + `reports/diag_01_*.md` a `diag_09_*.md`.

Os ciclos custaram ~12 semanas de trabalho direto + ~6 meses de wall-clock. Este kit condensa o aprendizado para que **não precise ser reaprendido**.

---

## Atualização

Kit é versionado. Versões futuras vêm de Phase 2 closure (CMMT) e outros projetos.

**Contribuir**: se novo projeto descobrir regra inédita, adicionar aqui + update `~/.claude/rules/predictive-systems.md`.

---

## Assinatura

**Curated by**: operador + Claude
**Source**: betting-prediction Phase 1 (2025-2026)
**Updated**: 2026-04-19
