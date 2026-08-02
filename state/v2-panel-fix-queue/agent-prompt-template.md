# V2 Panel Fix Agent — Prompt Template

> Used by orchestrator to spawn one agent per V2 quality diagnostic. Every agent
> MUST satisfy the Definition of Done at the bottom — zero pending allowed.

---

## Agent prompt body (substitute `{{PANEL_NAME}}` and `{{DIAGNOSTIC_PATH}}`)

You are a `/ag-2-corrigir` agent. Your task: corrigir 100% dos pontos do relatório de qualidade V2 do painel `{{PANEL_NAME}}`. **Zero pending permitido.**

## Contexto

- **Repo:** `/Users/andregusmandeoliveira/Claude/GitHub/raiz-data-engine` (worktree isolado)
- **Branch:** crie `fix/{{PANEL_NAME}}-v2-quality-gaps` derivado de `main` atualizado
- **Painel:** `{{PANEL_NAME}}`
- **Relatório fonte:** `{{DIAGNOSTIC_PATH}}` (LEIA COMPLETO antes de qualquer edit)

## Histórico de bugs canonical já descobertos em outros painéis

Antes de assumir bug novo, verifique se o seu painel cai num destes padrões já corrigidos:

1. **`ManifestQueryRuntime.from_yaml()` ausente** (PR #2636) — 12 painéis V2 importavam método inexistente. Provavelmente já mergeado, mas confirme.
2. **`filters:` em dict YAML** (PR #2637) — quebra `resolve_filters` com `'str' object has no attribute 'get'`. Formato canonical é **lista** com `name:` campo. Cross-impact identificado em: contabil, pesquisa_satisfacao, possivelmente outros.
3. **KPI keys divergentes do parity catalog** (PR #2638) — manifest declara `key:` que não existe no catalog. Sempre validar contra `tests/reports/<panel>/parity_catalog.json` ou equivalente.
4. **Schema column drift** (PR #2638) — manifest declara colunas que não existem no dbt model. Validar com `validate_v2_column_refs.py --panel <painel>` quando DATABASE_URL disponível.
5. **`is_placeholder=true` no manifest** (PR #2639 deixou pending) — **PROIBIDO**. Se algum KPI exige JOIN externo, faça o JOIN no dbt model. Não devolva placeholder ao envelope.

## Painéis-modelo canonical (referência)

Quando estiver em dúvida sobre formato canonical, leia ANTES de editar:
- `raiz_data_engine/reports_v2/funnel/manifest.yaml` — Tier-1 sólido, formato canonical
- `raiz_data_engine/reports_v2/dva/manifest.yaml` — Tier-1 sólido
- `raiz_data_engine/reports/core/manifest_query/runtime.py` — contrato runtime canonical

## Tarefas (ordem)

### Fase 1 — Investigação (read:edit >= 3:1, OBRIGATÓRIO)

1. Ler relatório completo: `{{DIAGNOSTIC_PATH}}`
2. Ler `raiz_data_engine/reports_v2/{{PANEL_NAME}}/manifest.yaml` + `data.py`
3. Ler `raiz_data_engine/reports/core/manifest_query/runtime.py`
4. Comparar com painéis-modelo (funnel, dva)
5. Reproduzir runtime smoke:
```bash
USE_PANEL_V2_{{PANEL_NAME_UPPER}}=true /Users/andregusmandeoliveira/Claude/GitHub/raiz-data-engine/.venv/bin/python - <<'PY'
import asyncio, json
from raiz_data_engine.reports_v2.{{PANEL_NAME}}.data import get_data
r = asyncio.run(get_data({"nocache": True}))
print(json.dumps(r, indent=2, default=str)[:3000])
PY
```
6. Verificar dbt model em `dbt/models/` para tabelas referenciadas

### Fase 2 — Aplicar TODOS os fixes do relatório

Para CADA gap (P0/P1/P2/P3) listado no relatório, aplicar fix correspondente. Anti-pattern proibido: pular gap "de baixa severidade".

- **P0 runtime** — converter `filters:` dict→lista; remover `is_placeholder`; corrigir shape do manifest
- **P0 source** — materializar dbt model se necessário; corrigir tier (1 vs 2); declarar `dbt_model:` no manifest
- **P0 KPI semantics** — alinhar keys/source_cols com parity catalog
- **P1 validators online** — rodar S40/S30 se DATABASE_URL disponível
- **P2 slug/docstring** — adicionar `http_slug` no manifest, `_HTTP_SLUG` em data.py, corrigir docstrings stale
- **P2 known_gaps** — declarar gaps que existem; remover gaps que foram resolvidos
- **P3 testes** — adicionar `test_runtime_no_db_error.py`, `test_real_kpi_values.py`, etc.

### Fase 3 — Materializar dbt model se necessário

Se `dbt_model_missing: true`:
1. Verificar se `dbt/models/<schema>/<panel>/<table>.sql` existe
2. Se DATABASE_URL: `cd dbt && dbt run --select <table>`
3. Se DATABASE_URL ausente: instruções exatas no PR body
4. Após materialização: REMOVER `dbt_model_missing: true` e `dbt_model_note` do manifest. Tornar Tier-1 real.

### Fase 4 — DoD self-check (BLOQUEADOR)

Antes de criar PR, executar TODOS os gates abaixo. **Qualquer FAIL → não cria PR, reporta status real.**

```bash
cd <worktree>
PYTHON=/Users/andregusmandeoliveira/Claude/GitHub/raiz-data-engine/.venv/bin/python
PANEL={{PANEL_NAME}}
PANEL_UPPER={{PANEL_NAME_UPPER}}

# 1. Suite V2 do painel
$PYTHON -m pytest tests/reports_v2/$PANEL -q --tb=short || exit 1

# 2. Scorecard
V2_PANEL_QUALITY_PANEL=$PANEL $PYTHON -m pytest tests/reports_v2/test_panel_quality_scorecard.py -q || exit 1

# 3. Source contract
$PYTHON scripts/ci/validate_v2_sources.py --panel $PANEL || exit 1

# 4. Dispatch HTTP
$PYTHON scripts/ci/validate_v2_http_dispatch.py | grep "$PANEL: PASS" || exit 1

# 5. No hardcoded empty
$PYTHON scripts/ci/validate_v2_no_hardcoded_empty.py | grep "$PANEL: PASS" || exit 1

# 6. Suite legacy com flag V2
USE_PANEL_V2_${PANEL_UPPER}=true $PYTHON -m pytest tests/reports/$PANEL -q --tb=short || exit 1

# 7. Ruff
$PYTHON -m ruff check raiz_data_engine/reports_v2/$PANEL tests/reports_v2/$PANEL || exit 1

# 8. CRÍTICO — zero placeholder no manifest
if grep -q "is_placeholder.*true" raiz_data_engine/reports_v2/$PANEL/manifest.yaml; then
  echo "FAIL: is_placeholder=true ainda presente no manifest"
  exit 1
fi

# 9. CRÍTICO — runtime sem db_error
USE_PANEL_V2_${PANEL_UPPER}=true $PYTHON - <<PY
import asyncio
from raiz_data_engine.reports_v2.${PANEL}.data import get_data
r = asyncio.run(get_data({"nocache": True}))
db_error = r.get("meta", {}).get("db_error")
if db_error and "DATABASE_URL" not in str(db_error):
    raise SystemExit(f"FAIL: meta.db_error = {db_error}")
print("RUNTIME OK")
PY
```

### Fase 5 — DoD checklist obrigatório (item-por-item, copiar para PR body)

Marque cada item como ✅ FEITO ou ❌ FAIL com evidência:

```
## DoD checklist (Definition of Done — zero pending)

Para CADA gap P0/P1/P2/P3 listado em {{DIAGNOSTIC_PATH}}:
- [ ] Gap identificado no relatório
- [ ] Fix aplicado
- [ ] Teste cobrindo a regressão
- [ ] Quality gate confirma fix

## Quality gates (todos PASS)

- [ ] tests/reports_v2/{{PANEL_NAME}} — passed
- [ ] test_panel_quality_scorecard.py — passed
- [ ] validate_v2_sources.py — PASS
- [ ] validate_v2_http_dispatch.py — PASS
- [ ] validate_v2_no_hardcoded_empty.py — PASS
- [ ] tests/reports/{{PANEL_NAME}} (flag V2) — passed
- [ ] ruff — PASS
- [ ] manifest sem is_placeholder=true — PASS
- [ ] runtime smoke sem db_error — PASS

## Cross-panel impact (se aplicável)

- [ ] Bug encontrado afeta outros painéis? Lista quais + status (fix neste PR? follow-up?)

## Follow-ups (apenas se IMPOSSÍVEL no worktree, ex: dbt run em prod)

Cada follow-up DEVE incluir comando exato para executar. Sem follow-up vago.
```

## Restrições

- **Worktree isolado** — paralelo seguro
- **Read:edit >= 3:1** — leia muito antes de editar
- **Conventional commit EN:** `fix({{PANEL_NAME}}): resolve V2 quality report gaps (P0..P3)`
- **Zero pending** — se um gap não pode ser resolvido no worktree, é follow-up COM COMANDO EXATO no PR body, não pending vago
- **NÃO criar PR** se DoD self-check falhar — reporta status real ao orchestrator

## Output esperado

Mensagem final ao orchestrator com:
1. URL do PR criado (ou status `BLOQUEADO` se DoD falhou)
2. Causa raiz identificada
3. DoD checklist completo
4. Cross-panel impact (se aplicável)
5. Follow-ups (com comandos exatos)
