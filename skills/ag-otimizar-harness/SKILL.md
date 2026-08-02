---
name: ag-otimizar-harness
description: "Otimiza overhead do harness: skills caras, cache_control, depreciacao e MCPs de baixo ROI. Usado por ag-9 e ag-13 --target=harness."
model: sonnet
context: fork
allowed-tools: Read, Glob, Grep, Bash, Write
argument-hint: "[--target=skills|mcp|cache|all] [--dry-run] [--apply]"
metadata:
  scoring: HOS (Harness Optimization Score)
  priority: 91
  cache_policy:
    enabled: true
    marker_after: "## 4 Analises"
---

# ag-otimizar-harness — Otimizador do harness

> Complementa `ag-auditar-harness` (que diagnostica) com acoes de otimizacao
> de **custo/performance**: caching, depreciacao, MCP slimming.

## Quando invocar

- Sob demanda: `/ag-otimizar-harness`
- Como sub-fase de `/ag-13-limpar-codigo --target=harness`
- Como recommendation gerada por `ag-auditar-harness` (HCS.mcp_cost baixo)
- Trimestral via `ag-curador-skills`

## Output

Relatorio em `~/Claude/docs/diagnosticos/harness-optimization-YYYY-MM-DD.md`.

Se `--apply`: PR atomico com markers `cache_control: ephemeral` aplicados + skills marcadas como `deprecated: true`.

## 4 Analises

### 1. cost_per_skill — Top skills por custo total

**Fonte:** `~/.claude/projects/*/session-*.jsonl` (ultimos 30 dias).

**Metodo:**
1. Para cada skill invocada (`tool_use` com `name=Skill`):
   - Soma `usage.input_tokens` + `usage.output_tokens` da assistant message subsequente
   - Conta invocacoes
2. Ranking: `tokens_total = mean(tokens_por_invocacao) * invocacoes`

**Output:** Top 10 skills caras com decomposicao mean vs frequency.

### 2. cache_candidates — Skills elegiveis para cache_control

**Criterios (do `prompt-cache-policy.md`):**
- Tamanho >= 300 linhas
- Conteudo estatico (sem timestamp, IDs, paths dinamicos)
- Invocada >= 2x por sessao tipica

**Metodo:**
1. `wc -l` em cada SKILL.md
2. Detecta dinamico: grep `{{`, `\$ARGUMENTS`, `\$(date`, `\$(uuidgen` etc.
3. Cross-check com `cost_per_skill` (frequencia >= 2)
4. Para cada candidato:
   - Sugere ponto de insercao do marker (apos primeiro `## ` longo)
   - Calcula tokens economizados estimados (~tokens_per_invocation * (invocacoes - 1) * 0.9)

**Action `--apply`:** insere `<!-- cache_control: ephemeral -->` no ponto sugerido.

Reusa logica do `ag-otimizar-cache` existente — esta skill orquestra, nao reimplementa.

### 3. dead_skills — Skills com 0 invocacoes em N dias

**Default N=90 dias.**

**Metodo:**
1. Lista todas as skills (`ls ~/Claude/.claude/skills/`)
2. Para cada: grep no transcripts dos ultimos 90 dias
3. Skills com 0 invocacoes:
   - **CONFIRM antes de depreciar:**
     - Tem `metadata.always_available: true`? → skip
     - E referenciada por outra skill (`[[name]]` em outro SKILL.md)? → skip
     - Foi criada nos ultimos 30 dias? → skip (ainda em adocao)
4. Sugere depreciacao via `metadata.deprecated: true` + nota de migracao

**NUNCA delete automatico.** Apenas marca.

### 4. mcp_roi — MCPs com baixo ROI

**Fonte:** `~/.claude/plugins/installed_plugins.json` + transcripts.

**Metodo:**
1. Para cada plugin instalado: conta `mcp__<plugin>__*` tool calls nos ultimos 90 dias
2. Calcula:
   - tools_exposed (do plugin manifest se acessivel)
   - invocacoes
   - ratio = invocacoes / tools_exposed
3. Flag plugins com:
   - ratio < 0.05 (drain de context sem uso)
   - 0 invocacoes em 60 dias
   - duplicacao (ex: chrome-devtools-mcp + playwright sem desfeito)

**Output:** ranking ROI + recomendacao remove/manter.

<!-- cache_control: ephemeral -->

## Implementacao

```
Agent({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Optimize harness costs",
  prompt: """
Voce e ag-otimizar-harness. Execute as 4 analises conforme SKILL.md.

Args: $ARGUMENTS

Para --target (default: all):
  - skills: cost_per_skill + dead_skills
  - cache: cache_candidates
  - mcp: mcp_roi
  - all: tudo

Para --dry-run (default): apenas reporta.
Para --apply: aplica fixes triviais (markers de cache, deprecated: true).
  Aplicar em batch <= 5 mudancas conforme bulk-change-safety.md.
  Cada batch = commit separado.

Output: docs/diagnosticos/harness-optimization-YYYY-MM-DD.md
"""
})
```

## Score: HOS

```
HOS = (
  100 - waste_skills_pct      # % de skills dead vs total
  - missed_cache_pct           # % candidates a cache sem marker aplicado
  - low_roi_mcp_pct            # % MCPs com ROI < 0.05
) / 1
```

Target: HOS >= 75.

## Estado persistido

`~/Claude/.claude/state/harness-optimization-history.jsonl` — uma linha por execucao.

## Relacao com outras skills

- **ag-otimizar-cache** (existente): foco em cache markers. ag-otimizar-harness orquestra + adiciona dead_skills + mcp_roi.
- **ag-curador-skills** (existente): consome output desta skill como input obrigatorio.
- **ag-13-limpar-codigo**: novo modo `--target=harness` delega para esta skill.
- **ag-auditar-harness**: complementar — ag-auditar diagnostica, ag-otimizar age.
