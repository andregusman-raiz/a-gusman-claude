# Harness Coverage

> Inegociaveis para o proprio harness (skills, agents, hooks, rules, MCP).
> Validado por `/ag-auditar-harness` (HCS) e `/ag-otimizar-harness` (HOS).
> Hook `harness-drift-guard.sh` emite warning quando esta rule e violada.

## Principio

O harness e codigo. Toda mudanca no harness exige a mesma disciplina aplicada
a codigo de producao: review, Definition of Done, ausencia de drift, custo
explicito, gates bloqueantes documentados.

## R1 — Toda machine ag-N expõe state estruturado

Toda invocacao de machine `ag-0` ate `ag-13` DEVE persistir state em formato
compativel com `~/Claude/.claude/shared/templates/machine-state.schema.json`.

Campos minimos:
- `machine` (string `ag-N`)
- `session_id`
- `started_at`
- `phases[]` (cada uma com `name`, `status`)
- `scores{}` (vazio so se machine nao tem score por design — raro, justificar)
- `exit_code`

Path padrao: `docs/ai-state/machine-state-{machine}-{session_id}.json`.

## R2 — Skill description bate com corpo

Cada `SKILL.md` tem:
- `description:` no frontmatter (1-3 linhas)
- corpo coerente com a description

Drift entre os dois e detectado por `HCS.drift`. Hook `harness-drift-guard.sh`
emite warning apos edicao >50 linhas. Apos edicao grande:

1. Reler frontmatter `description`
2. Reler primeiros 2 paragrafos do corpo
3. Confirmar coerencia (gates: capacidade descrita == capacidade implementada)

## R3 — Hook bloqueante tem bypass env var documentado

Todo hook em `~/Claude/.claude/hooks/` que pode retornar exit code 2 (bloqueio)
DEVE ter:

- Comentario no header com `Bypass: ENV_VAR_NAME=1`
- Implementacao real do bypass (check no inicio da main)
- Nome semantico: `<COMPONENT>_DISABLED=1` ou `<COMPONENT>_STRICT=1`

Hooks atualmente conformes: `completion-gate.py`, `gap-acceptance-guard.py`,
`branch-guard.sh`, `harness-drift-guard.sh`, `instinct-extract.py` (este
ultimo nao-bloqueante, mas tem bypass mesmo assim), `orq-goal-guard.sh`
(bypass `ORQ_GOAL_GUARD_DISABLED=1` ou `orq-goal-bypass.flag` one-shot).

## R4 — Skills longas (>=300 linhas estaticas) tem cache_policy declarado

Frontmatter:

```yaml
metadata:
  cache_policy:
    enabled: true
    marker_after: "## <secao>"
```

E corpo tem `<!-- cache_control: ephemeral -->` no ponto correto.

`HCS.dod_violation` penaliza skills longas sem este declarativo.

## R5 — Toda machine que cria PR inclui checklist

`ag-1`, `ag-2`, `ag-3`, `ag-13` (e outras que criam PR) DEVEM gerar PR body
com checklist minima:

- [ ] Typecheck passa
- [ ] Lint passa
- [ ] Test passa
- [ ] Build funciona
- [ ] Sem console.log/debugger residual

Referencia: `pr-workflow.md`.

## R6 — Modificar machine ag-N requer testes manuais documentados

Apos edicao em `~/Claude/.claude/skills/ag-N-*/SKILL.md`:

1. Invocar a machine em modo `--draft` em projeto-teste
2. Verificar que phases existentes ainda rodam
3. Verificar que score (se aplicavel) ainda converge
4. Documentar no commit message: `feat(ag-N): ... — tested via ag-N --draft em <projeto>`

## R7 — MCPs sem ROI > 0.05 sao removidos no proximo ciclo

`ag-otimizar-harness` calcula ratio = invocacoes_90d / tools_exposed.
MCPs com ratio < 0.05 sao flag-ed. Decisao no proximo `ag-curador-skills`.

## R8 — DAG pipelines (`ag-0 --dag`) sempre passam via `ag-team-safe` para paralelismo

Nodes com `isolation: worktree` em camadas paralelas DEVEM ser spawned via
`ag-team-safe` (que ja valida worktree contention). Engine de DAG do `ag-0`
nunca cria worktree direto.

## R9 — Pre-merge gate: HCS >= 80 em PR que toca `.claude/`

Qualquer PR que modifica `~/Claude/.claude/skills/`, `hooks/`, `rules/`, ou
`scripts/` DEVE rodar `/ag-auditar-harness` antes de merge.

Se HCS < 80: nao merge. Corrigir findings P0/P1 antes.

## R10 — Memory tipado e ortogonal a instincts

- Memory tipado (`feedback_*.md`, `project_*.md`, etc.): curado por humano
- Instincts (`_instinct-candidates.md`): auto-extraidos, sugeridos

A bridge `promote-instinct.py` converte um em outro APENAS por decisao humana.
Auto-promotion (>=0.85 confidence) e opt-in via flag, nunca default.

## Enforcement automatico

| Regra | Hook/Skill | Ponto de checagem |
|---|---|---|
| R2 | `harness-drift-guard.sh` | PostToolUse Write em SKILL.md |
| R3 | `ag-auditar-harness` (HCS.injection) | Audit trimestral |
| R4 | `ag-otimizar-cache` + `ag-auditar-harness` | Audit trimestral |
| R5 | `ag-pipeline-issue` checklist generator | Geracao de PR |
| R6 | Convencao de commit message (manual) | Commit time |
| R7 | `ag-otimizar-harness` | Audit trimestral |
| R8 | `agent-parallel-safety.md` + `ag-team-safe` | Spawn time |
| R9 | CI (futuro) ou `ag-curador-skills` | Pre-merge |
| R10 | `promote-instinct.py` design | Promotion time |

## Bypass

Nao ha bypass global. Cada hook tem seu env var de bypass conforme R3.
Para casos extremos (incident response): documentar em ADR sob `.claude/shared/adr/`.
