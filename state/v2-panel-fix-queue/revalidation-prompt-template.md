# V2 Panel REVALIDATION Agent — Robust Prompt Template

> Usado para campanha de revalidação V2. Cada agent (Sonnet) corrige gaps do revalidation report.
> No final, um **agent VERIFIER Opus** valida com profundidade que tudo foi feito com qualidade máxima.

---

## FIX AGENT PROMPT (Sonnet — applies revalidation fixes)

```
Você é um `/ag-2-corrigir` agent para campanha REVALIDATION V2. Tarefa: corrigir 100% dos gaps do relatório de **revalidação** V2 do painel `{{PANEL_NAME}}`. **Zero pending. Zero placebo.**

## Contexto

- Repo: `/Users/andregusmandeoliveira/Claude/GitHub/data-engine-app` (worktree isolado)
- Branch: crie `revalidation/{{PANEL_NAME}}-v2-quality` de `main` ATUALIZADO
- Painel: `{{PANEL_NAME}}`
- **Relatório REVALIDATION (este é o NOVO):** `{{REVALIDATION_PATH}}`
- **Relatório ORIGINAL (referência histórica):** `docs/diagnosticos/2026-05-10-painel-XX-{{PANEL_NAME}}-v2-quality-report.md`
- PR original do fix anterior (se existir): mergeado em main; ver `git log --grep="fix({{PANEL_NAME}})" --oneline`

## Diferença: report vs revalidation

- **Report** (1ª iteração): identifica gaps iniciais do painel V2
- **Revalidation** (2ª+ iteração): re-audita após fix; identifica gaps QUE PERSISTEM ou NOVOS gaps descobertos

Revalidation é mais profundo — pode pedir:
- Validar valores numéricos com dados reais (não apenas shape)
- Comparar V2 vs V1 com tolerância numérica
- Re-validar invariants pós-fix
- Checar regressões introduzidas pelo PR original

## Bugs canonical já fixados em PRs anteriores

Verifique em main antes de assumir bug novo:

1. `ManifestQueryRuntime.from_yaml()` classmethod — PR #2636
2. `filters: dict→list` + `_normalize_filters()` defensivo + universal — PR #2637/#2640/#2641
3. KPI keys + `kpi_ouro_id` + `stage_key` patterns — PR #2638/#2644/#2650/#2651
4. `is_placeholder=true` PROIBIDO no manifest — PR #2639/#2642
5. `aggregation` block + `weight_key:` (não `preset:`) — PR #2641
6. `_HTTP_SLUG` canonical (`<panel>` ou `<panel>-dashboard`) — PR #2641/#2649/#2653
7. F27/F28 valores reais via dbt JOIN (NÃO placeholder) — PR #2642
8. `column_map` override DEFAULT joins — PR #2643/#2648
9. `execute(expand=, source_from=, custom_callback_name=, **_f)` keyword args — PR #2645/#2649
10. aggregation_sql real (não SUM stub) — PR #2646
11. V2_FLAGS slug alias — PR #2649
12. Neon VIEW pattern para Tier-2 sem dbt — PR #2641/#2652
13. expand=marca+filial graceful guard sem granularity — PR #2653
14. Lazy ManifestQueryRuntime no module level (import crash fix) — PR #2657

## Tarefas

### Fase 1 — Investigação profunda (read:edit >= 5:1, OBRIGATÓRIO PARA REVALIDATION)

1. Ler relatório REVALIDATION completo: `{{REVALIDATION_PATH}}`
2. Ler relatório ORIGINAL: `docs/diagnosticos/2026-05-10-painel-XX-{{PANEL_NAME}}-v2-quality-report.md`
3. Identificar EXATAMENTE quais gaps:
   - Persistem (PR original não resolveu — investigar PORQUÊ)
   - São novos (introduzidos pelo fix OR descobertos em audit mais profundo)
   - Foram fechados (não estão mais no revalidation — confirmação positiva)
4. Ler `raiz_data_engine/reports_v2/{{PANEL_NAME}}/manifest.yaml` + `data.py` + `aggregation_hook.py` (se existir)
5. Ler PR original (`git log --grep="fix({{PANEL_NAME}})"` para encontrar SHA)
6. `git show <sha>` para entender o que o PR original fez
7. Smoke runtime:
```bash
USE_PANEL_V2_{{PANEL_NAME_UPPER}}=true /Users/andregusmandeoliveira/Claude/GitHub/data-engine-app/.venv/bin/python - <<'PY'
import asyncio, json
from raiz_data_engine.reports_v2.{{PANEL_NAME}}.data import get_data
r = asyncio.run(get_data({"nocache": True}))
print(json.dumps(r, indent=2, default=str)[:4000])
PY
```

### Fase 2 — Falsify hypothesis

Antes de aplicar fix, lista 3+ hipóteses do POR QUE o gap persiste após fix original. Não aceite a primeira plausível. Use o protocolo de raciocínio profundo (rule `deep-reasoning-directive`).

### Fase 3 — Aplicar fixes (zero placebo)

Cada gap do revalidation report → fix REAL (não shape-fix sem efeito). Se um KPI retorna NULL e revalidation pede valor real, NÃO substitua por SUM stub — implemente o cálculo verdadeiro.

### Fase 4 — DoD self-check (BLOQUEADOR)

```bash
PYTHON=/Users/andregusmandeoliveira/Claude/GitHub/data-engine-app/.venv/bin/python
PANEL={{PANEL_NAME}}
PANEL_UPPER={{PANEL_NAME_UPPER}}

$PYTHON -m pytest tests/reports_v2/$PANEL -q --tb=short || exit 1
V2_PANEL_QUALITY_PANEL=$PANEL $PYTHON -m pytest tests/reports_v2/test_panel_quality_scorecard.py -q || exit 1
$PYTHON scripts/ci/validate_v2_sources.py --panel $PANEL || exit 1
$PYTHON scripts/ci/validate_v2_http_dispatch.py | grep "$PANEL: PASS" || exit 1
$PYTHON scripts/ci/validate_v2_no_hardcoded_empty.py | grep "$PANEL: PASS" || exit 1
USE_PANEL_V2_${PANEL_UPPER}=true $PYTHON -m pytest tests/reports/$PANEL -q --tb=short || exit 1
$PYTHON -m ruff check raiz_data_engine/reports_v2/$PANEL tests/reports_v2/$PANEL || exit 1
grep -q "is_placeholder.*true" raiz_data_engine/reports_v2/$PANEL/manifest.yaml && exit 1
USE_PANEL_V2_${PANEL_UPPER}=true $PYTHON - <<PY
import asyncio
from raiz_data_engine.reports_v2.${PANEL}.data import get_data
r = asyncio.run(get_data({"nocache": True}))
db_error = r.get("meta", {}).get("db_error")
if db_error and "relation" not in str(db_error).lower() and "DATABASE_URL" not in str(db_error):
    raise SystemExit(f"FAIL: meta.db_error = {db_error}")
print("RUNTIME OK")
PY
```

### Fase 5 — DoD checklist no PR body

Estrutura obrigatória:

```
## DoD checklist (zero pending — REVALIDATION)

### Gaps revalidation por categoria

**Persistiam após fix original:**
- [ ] gap X — fix aplicado + teste cobrindo + gate verde

**Novos (descobertos no revalidation):**
- [ ] gap Y — fix aplicado + teste cobrindo + gate verde

**Já fechados pelo PR original (confirmação):**
- [ ] gap Z — confirma fechado, sem regressão

### Quality gates
- [ ] pytest tests/reports_v2/{{PANEL_NAME}} PASS
- [ ] scorecard PASS
- [ ] validate_v2_sources PASS
- [ ] validate_v2_http_dispatch PASS
- [ ] validate_v2_no_hardcoded_empty PASS
- [ ] tests/reports/{{PANEL_NAME}} (V2 flag) PASS
- [ ] ruff PASS
- [ ] manifest sem is_placeholder PASS
- [ ] runtime sem db_error inesperado PASS

### Hipóteses falsificadas (Fase 2)
1. <hipótese> — refutada por <evidência>
2. <hipótese> — refutada por <evidência>
3. <hipótese> — confirmada (raiz causa) com <evidência>

### Cross-panel impact
### Follow-ups (com comando exato)
```

## Restrições CRÍTICAS

- Worktree isolado, **read:edit >= 5:1** (revalidation exige profundidade)
- Conventional commit: `fix({{PANEL_NAME}}): resolve V2 quality REVALIDATION gaps (post-original-fix)`
- Zero pending; **OBRIGATÓRIO criar PR** mesmo DRAFT se DoD falhar
- **Zero placebo:** não substituir KPI por SUM stub se revalidation pede valor real
- Reportar ao orquestrador com PR URL + DoD + hipóteses falsificadas

## Output

PR URL + DoD checklist completo + hipóteses falsificadas + cross-panel impact + follow-ups com comandos exatos.
```

---

## VERIFIER AGENT PROMPT (Opus — deep quality verification post-fix)

```
Você é um agent VERIFIER Opus para revalidation V2. Sua tarefa: validar com profundidade que o painel `{{PANEL_NAME}}` foi corrigido com QUALIDADE MÁXIMA pelo PR #{{FIX_PR_NUMBER}}. **NÃO aplique fixes — apenas avalie.**

usando opus porque verification profunda de qualidade exige raciocínio multi-passo (5+ hipóteses, evidência citada, cadeia causal explícita, confiança quantificada).

## Protocolo (rule `deep-reasoning-directive`)

Execute os 5 passos antes de declarar PASS/FAIL:

1. **Exhaust** — liste 3+ formas pelas quais o fix pode ainda ser incompleto
2. **Verify** — para cada uma, busque evidência concreta via Read/grep/Bash
3. **Falsify** — tente quebrar cada gap "fechado" do revalidation
4. **Connect** — cadeia causal: gap original → fix → estado atual
5. **Report** — confiança quantificada (0-100%) com lacunas explícitas

## Contexto

- Repo: `/Users/andregusmandeoliveira/Claude/GitHub/data-engine-app` (read-only para você)
- Painel: `{{PANEL_NAME}}`
- Revalidation report: `{{REVALIDATION_PATH}}`
- Quality report original: `docs/diagnosticos/2026-05-10-painel-XX-{{PANEL_NAME}}-v2-quality-report.md`
- PR a verificar: #{{FIX_PR_NUMBER}}
- Branch: `revalidation/{{PANEL_NAME}}-v2-quality`

## Tarefas

### 1. Leitura completa

- Ler revalidation report (gaps endereçados)
- Ler quality report original (contexto)
- Ler PR body de #{{FIX_PR_NUMBER}} via `gh pr view {{FIX_PR_NUMBER}} --json body`
- Ler diff completo do PR via `gh pr diff {{FIX_PR_NUMBER}}`
- Ler estado atual: `raiz_data_engine/reports_v2/{{PANEL_NAME}}/manifest.yaml`, `data.py`, `aggregation_hook.py`
- Ler testes adicionados: `tests/reports_v2/{{PANEL_NAME}}/`

### 2. Validação gap-por-gap (BLOQUEADOR)

Para CADA gap listado no revalidation report:

- [ ] Gap identificado nas mudanças do PR? (cite linha do diff)
- [ ] Fix é REAL (cálculo correto) ou PLACEBO (stub que passa shape mas não resolve)?
- [ ] Teste cobrindo o gap específico?
- [ ] Quality gate confirma fix?
- [ ] Existe forma plausível do gap ainda estar presente? Liste.

Se algum gap não passa em TODOS os checks: FAIL.

### 3. Quality gates independentes (rode você mesmo, não confie no PR self-check)

```bash
PYTHON=/Users/andregusmandeoliveira/Claude/GitHub/data-engine-app/.venv/bin/python
PANEL={{PANEL_NAME}}
PANEL_UPPER={{PANEL_NAME_UPPER}}

cd /Users/andregusmandeoliveira/Claude/GitHub/data-engine-app

# Gates obrigatórios
$PYTHON -m pytest tests/reports_v2/$PANEL -q --tb=short
V2_PANEL_QUALITY_PANEL=$PANEL $PYTHON -m pytest tests/reports_v2/test_panel_quality_scorecard.py -q
$PYTHON scripts/ci/validate_v2_sources.py --panel $PANEL
$PYTHON scripts/ci/validate_v2_http_dispatch.py | grep $PANEL
$PYTHON scripts/ci/validate_v2_no_hardcoded_empty.py | grep $PANEL
$PYTHON -m ruff check raiz_data_engine/reports_v2/$PANEL tests/reports_v2/$PANEL

# CRÍTICO — zero placeholder
grep -q "is_placeholder.*true" raiz_data_engine/reports_v2/$PANEL/manifest.yaml && echo "FAIL placeholder" || echo "OK no placeholder"

# CRÍTICO — runtime sem db_error inesperado
USE_PANEL_V2_${PANEL_UPPER}=true $PYTHON -c "
import asyncio
from raiz_data_engine.reports_v2.$PANEL.data import get_data
r = asyncio.run(get_data({'nocache': True}))
print('RUNTIME:', r.get('meta', {}))
"
```

### 4. Heurísticas anti-placebo (red flags)

- KPI `aggregation_sql: "0"` ou `"NULL"` — PLACEBO (a não ser que documente como known_gap real)
- `column_map` apontando para coluna que não existe no schema real — drift
- Teste apenas verifica `result is not None` (não verifica valor) — fraco
- Manifest declara `kpi_ouro_id` mas não há entry no registry — drift
- `_HTTP_SLUG` não bate com o que `validate_v2_http_dispatch.py` espera
- Removeu um teste em vez de fazer ele passar — regressão escondida

### 5. Cross-panel impact check

- Mudanças no `runtime.py` ou `manifest_query/` afetam outros painéis? Verifique.
- Mudanças em `feature_flags.py` quebram outros painéis V2?
- Tests pre-existentes em `tests/reports_v2/` ainda passam? (rodar suite full uma vez)

### 6. Veredicto FINAL

Output OBRIGATÓRIO:

```
## VERIFIER VERDICT — {{PANEL_NAME}}

### Veredicto: [PASS / FAIL / CONDITIONAL_PASS]

### Confiança: XX% (justificativa: <X evidências citadas>)

### Gaps revalidation — status individual

| Gap | Status no PR | Fix real? | Teste? | Veredicto |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

### Heurísticas anti-placebo

| Red flag | Detectado? | Evidência |
|---|---|---|
| KPI placebo SQL | sim/não | linha X do diff |
| Schema drift | sim/não | manifest L:Y vs prata.<table> |
| Teste fraco | sim/não | test_X.py L:Z |
| ... | ... | ... |

### Hipóteses falsificadas

1. <hipótese de fix incompleto> — REFUTADA por <evidência>
2. <hipótese> — REFUTADA por <evidência>
3. <hipótese> — CONFIRMADA (gap real ainda presente)

### Cross-panel impact
<lista de painéis potencialmente afetados + evidência>

### Recomendação ao orquestrador

- **PASS:** painel revalidation closed; marcar task completed
- **FAIL:** spawn re-fix agent com gaps específicos: <lista>
- **CONDITIONAL_PASS:** PR pode mergear mas Q11 follow-up: <lista exata com comandos>
```

## Restrições

- Read-only — você NÃO edita código, manifests, ou testes
- NÃO crie PRs
- Reporte ao orquestrador o veredicto completo
- Cada claim deve citar arquivo:linha
- NÃO use "deveria estar OK" — confirme com evidência ou marque FAIL
```

---

## How orchestrator invokes (per panel)

1. Detect new `*-v2-quality-revalidation.md` via Monitor
2. Spawn FIX agent (Sonnet, worktree isolation, run_in_background: true)
3. Wait for teammate-message with PR URL
4. **Spawn VERIFIER agent (Opus, run_in_background: true)** with the FIX agent's PR number
5. Wait for VERIFIER verdict
6. If PASS: mark task completed
7. If FAIL: spawn re-FIX agent with VERIFIER's gap list
8. If CONDITIONAL_PASS: mark completed + document follow-ups

Justificativa Opus: "usando opus porque verification profunda de qualidade exige raciocínio multi-passo (5+ hipóteses, evidência citada, cadeia causal explícita, confiança quantificada)."
