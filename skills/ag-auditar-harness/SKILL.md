---
name: ag-auditar-harness
description: "Auditor sistematico do proprio harness (skills, agents, hooks, rules, MCP). Detecta drift, prompt injection risk, redundancia semantica, violacao de DoD, cost MCP. Produz HCS (Harness Coverage Score). Invocado por /ag-9-auditar --include-harness."
model: opus
context: fork
allowed-tools: Read, Glob, Grep, Bash, Write
argument-hint: "[--apply-quick-wins | --report-only] [--threshold=80]"
metadata:
  scoring: HCS
  target: 80
  priority: 94
  cache_policy:
    enabled: true
    marker_after: "## Sub-auditores"
---

# ag-auditar-harness — Auditor do harness

> Equivalente local ao AgentShield do ECC, focado nos pontos fracos especificos
> do sistema rAIz: drift de skills, hooks bloqueantes sem bypass documentado,
> redundancia semantica entre skills, machines sem score, MCPs com baixo ROI.

## Quando invocar

- Trimestral via `ag-curador-skills`
- Sob demanda: `/ag-auditar-harness`
- Como dimensao HARNESS de `/ag-9-auditar --include-harness`
- Apos qualquer adicao de >3 skills novas (gate manual)

## Output

Relatorio em `~/Claude/docs/diagnosticos/harness-audit-YYYY-MM-DD.md` com:

- **HCS total** (0-100) — media ponderada dos 5 sub-scores
- **Sub-scores** (cada um 0-100) — drift, injection, redundancy, dod_violation, mcp_cost
- **Findings P0/P1/P2** — path + linha + fix sugerido
- **Quick wins** (se `--apply-quick-wins`) — PR atomico com fixes triviais

## HCS — formula

```
HCS = (
  HCS_drift      * 0.25 +
  HCS_injection  * 0.30 +    # peso maior — security first
  HCS_redundancy * 0.15 +
  HCS_dod        * 0.20 +
  HCS_mcp_cost   * 0.10
)
```

Convergencia: HCS >= 80 = passa. HCS < 60 = bloqueio P0.

## Sub-auditores

### 1. HCS.drift — Skills cujo description nao bate com conteudo

**Detecta:** descricao de skill (frontmatter `description:`) divergente do corpo do SKILL.md.

**Metodo:**
1. Para cada `~/Claude/.claude/skills/*/SKILL.md`:
   - Extrai frontmatter `description`
   - Extrai primeiro paragrafo de prosa (apos `# titulo`)
   - Compara via:
     - Levenshtein normalizado (rapido, primeiro filtro)
     - Embedding cosine (sentence-transformers/all-MiniLM-L6-v2) se disponivel localmente
2. Score por skill = max(0, 100 - 100 * (1 - similaridade))
3. HCS.drift = mean(scores) onde score < 70 conta como finding P1

**Heuristica fallback (sem embedding):** keywords sobreposicao tf-idf simples via stdlib Python.

**Fix sugerido:** reescrever description OU atualizar corpo para refletir capacidade real.

### 2. HCS.injection — Hooks/skills com risco de injection

**Detecta:**

| Padrao | Severidade | Exemplo |
|---|---|---|
| `eval $(...)` em hook .sh com input de stdin | P0 | `eval $(echo "$1")` |
| `bash -c "$..."` com variavel nao-quoted | P0 | `bash -c "$user_cmd"` |
| Skill com `{{user_input}}` interpolado em Bash | P1 | "Run: $ARGUMENTS" |
| Skill com `subagent_type` parametrizado por input | P1 | `subagent_type: {{type}}` |
| Hook que `curl | sh` URLs nao-fixas | P0 | `curl $URL | sh` |

**Metodo:** AST Python para .py + grep + heuristica para .sh.

**Score:** 100 - 20*P0_count - 5*P1_count, floor 0.

### 3. HCS.redundancy — Skills semanticamente sobrepostas

**Detecta:** pares de skills com similaridade > 0.85 (candidatos a merge).

**Metodo:**
1. Embedding de cada `description + primeiro paragrafo`
2. Pairwise cosine
3. Para cada par > 0.85: P2 finding "considere merge ou delineacao mais clara"

**Score:** 100 - 5 * pares_acima_threshold, floor 0.

**Fallback sem embedding:** Jaccard de tokens normalizados (stem + stopwords PT/EN).

### 4. HCS.dod_violation — Machines sem Definition of Done aplicada

**Detecta em `~/Claude/.claude/skills/ag-N-*/SKILL.md`:**

- Machine sem `metadata.scoring` no frontmatter
- Machine sem score numerico mencionado no corpo (`>= NN`)
- Machine sem referencia a rule de DoD (`quality-gate.md`, `fix-verification.md`, etc.)
- Machine sem hook `completion-gate.py` mencionado (verificar via grep em corpo)
- Machine que cria PR mas sem checklist (`- [ ] Typecheck`, etc.)

**Score:** 100 - 10 * violacoes_por_machine, mean across ag-1..ag-13.

### 5. HCS.mcp_cost — MCPs com baixo ROI

**Detecta em `~/.claude/plugins/installed_plugins.json`:**

| Sinal | Penalidade |
|---|---|
| Plugin instalado ha >30 dias sem invocacao registrada | -10 |
| Plugin com >50 tools expostas (drain de context) | -15 |
| Plugins duplicados (mesma capacidade) — ex: 2 playwrights | -20 |
| Plugin com scope=project mas projeto nao-existe mais | -10 |

**Cross-check:** `~/.claude/projects/*/session-*.jsonl` busca `mcp__<plugin>__*` tool calls.

**Score:** 100 - sum(penalidades), floor 0.

<!-- cache_control: ephemeral -->

## Implementacao

```
Agent({
  subagent_type: "general-purpose",
  model: "opus",
  description: "Audit local harness",
  prompt: """
Voce e o ag-auditar-harness. Execute as 5 sub-auditorias abaixo.

Paths:
  Skills: ~/Claude/.claude/skills/
  Hooks:  ~/Claude/.claude/hooks/
  Rules:  ~/Claude/.claude/rules/
  Plugins: ~/.claude/plugins/installed_plugins.json
  Sessoes: ~/.claude/projects/*/session-*.jsonl

Para cada sub-auditor:
  1. Execute o metodo descrito
  2. Calcule sub-score 0-100
  3. Liste top 5 findings P0/P1/P2

Depois:
  - HCS total = ponderada conforme formula
  - Escreva relatorio em docs/diagnosticos/harness-audit-YYYY-MM-DD.md
  - Se --apply-quick-wins: aplica fixes P2 triviais (typo em description, etc.)
    em PR atomico chamado chore: harness audit quick wins YYYY-MM-DD

Args recebidos: $ARGUMENTS
"""
})
```

## Quick wins eligibility

Aplicaveis automaticamente com `--apply-quick-wins`:

- Typo em `description` do frontmatter
- Skill sem `metadata.priority` (default 50)
- Hook sem bypass env var documentado em comentario
- MCP duplicado: desinstala o mais antigo

**NUNCA aplicar automaticamente:**

- Merge de skills (decisao humana)
- Mudar `model:` de skill (custo)
- Remover hook bloqueante (security risk)
- Alterar score formula

## Rule referenciada

Esta skill implementa o que `~/Claude/.claude/rules/harness-coverage.md` exige.

## Estado persistido

`~/Claude/.claude/state/harness-audit-history.jsonl` — uma linha por execucao:

```jsonc
{"date":"2026-05-18","hcs":82,"sub":{"drift":85,"injection":90,"redundancy":75,"dod":80,"mcp":85},"findings_p0":0,"findings_p1":3,"findings_p2":12}
```

Permite tracking de tendencia (`ag-insights` consome este arquivo).
