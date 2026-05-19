---
name: ag-9-auditar
description: "Auditoria completa de software (wrapper FORTRESS). Roda MERIDIAN + SENTINEL + ARCHITECT + CONDUCTOR + LIGHTHOUSE + HARNESS (opcional) em sequencia. Fortress Score = laudo completo."
model: sonnet
context: fork
argument-hint: "[URL ou path] [--resume] [--include-harness] [--harness-only]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "fortress-state.json,fortress-*.md,harness-audit-*.md"
  bashPattern: "auditar|fortress|audit"
  priority: 93
---

# AUDITAR — Laudo Completo de Software (FORTRESS + HARNESS)

## Invocacao

```
/auditar https://app.example.com               # FORTRESS classico (5D)
/auditar ~/Claude/GitHub/raiz-platform          # FORTRESS classico
/auditar --resume                                # Retoma de fortress-state.json
/auditar --include-harness ~/Claude/...          # FORTRESS + HARNESS (6D, default mensal)
/auditar --harness-only                          # So auditoria do harness local (sem app target)
```

## O que faz

Delega para **ag-fortress (FORTRESS)** — roda 5 ou 6 maquinas em sequencia:

1. **MERIDIAN** (qualidade, MQS)
2. **SENTINEL** (seguranca, SSS)
3. **ARCHITECT** (arquitetura, AQS)
4. **CONDUCTOR** (developer experience, DXS)
5. **LIGHTHOUSE** (observabilidade, OBS)
6. **HARNESS** (auditor do proprio sistema, HCS) — apenas com `--include-harness` ou `--harness-only`

### Score formulas

**Sem HARNESS (default):**
```
Fortress Score (FS) = MQS*0.25 + SSS*0.25 + AQS*0.20 + DXS*0.15 + OBS*0.15
```

**Com HARNESS (--include-harness):**
```
FS6 = MQS*0.22 + SSS*0.22 + AQS*0.18 + DXS*0.13 + OBS*0.13 + HCS*0.12
```

Convergencia: FS >= 80 = passa. FS < 60 = bloqueio P0.

## Quando incluir HARNESS

- **Trimestral** ou apos >3 skills/hooks novos no harness — `--include-harness`
- **Sob suspeita** de drift, redundancia ou prompt injection — `--harness-only`
- **Manual** quando usuario pedir audit do proprio Claude Code

## Produz

- Laudo completo, scores por dimensao
- Action items P0/P1/P2
- Se HARNESS rodou: relatorio adicional em `docs/diagnosticos/harness-audit-YYYY-MM-DD.md`
- Update em `~/Claude/.claude/state/harness-audit-history.jsonl` (HARNESS history)

## Implementacao

```
# Default (5D)
Agent({
  subagent_type: "ag-fortress",
  prompt: "[input completo do usuario]",
  model: "opus",
  run_in_background: true
})

# Com HARNESS (6D)
Agent({
  subagent_type: "ag-fortress",
  prompt: "[input do usuario] --include-harness",
  model: "opus",
  run_in_background: true
})

# So HARNESS
Skill({
  skill: "ag-auditar-harness",
  args: "$ARGUMENTS"
})
```

## Rule referenciada

- `harness-coverage.md` — R9 exige HCS >= 80 em PR que toca `.claude/`
