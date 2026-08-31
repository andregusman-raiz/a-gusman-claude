---
description: "Guardrail deterministico do ag-0 (orq-goal-active.json)"
paths:
  - "**/orq-goal*.json"
  - "docs/ai-state/**"
---

# orq-goal — Guardrail Determinístico do ag-0-orquestrador

> Stop hook que bloqueia encerramento até checks factuais do goal atual fecharem.
> Singleton em `~/Claude/docs/ai-state/orq-goal-active.json`.
> Schema: `~/Claude/.claude/shared/templates/orq-goal-active.schema.json`.
> Hook: `~/Claude/.claude/hooks/orq-goal-guard.sh`.
> Verifier: `~/Claude/.claude/scripts/orq-goal-verify.py`.

## Escopo por sessão (fix 2026-08-24)

O goal file é global (singleton em disco), mas o bloqueio de Stop agora é escopado por sessão via
campo opcional `session_id` (valor de `$CLAUDE_CODE_SESSION_ID`, capturado automaticamente por
`orq-goal-init.sh` na criação). `orq-goal-guard.sh` só bloqueia o Stop da sessão dona — outras
sessões da máquina passam livre (`exit 0`) sem rodar o verifier. Goal sem `session_id` (arquivo
legado ou criado manualmente sem o env var disponível) mantém o comportamento antigo: bloqueia
todas as sessões, para não regredir silenciosamente. Ver [[gotcha-orq-goal-guard-sem-session-id-vaza-entre-sessoes]] na memória do usuário para o histórico do bug.

## Princípio

`/goal` built-in usa LLM evaluator (Sonnet/Opus) sobre o transcript — caro, variável, sem ferramentas.
Este guardrail é **determinístico** (sem LLM): roda `gh`, `test -f`, `jq`, `curl` para checks factuais
declarados em JSON. Complementa o `/goal` nativo, não substitui.

Usado pelo `ag-0-orquestrador` para impedir o antipattern "delegou e considerou concluído" — Stop
fica bloqueado até artifacts esperados existirem ou TTL expirar.

---

## Quando ag-0 DEVE ativar o goal

Escrever `orq-goal-active.json` no Pre-flight passo 3.5 quando:

1. **Modo `--full`** — sempre (mode = `full`)
2. **Modo `--dag`** — sempre (mode = `dag`)
3. **Intent crítico (single-PR)** — palavras-chave: `producao`, `critico`, `compliance`,
   `auth`, `pagamento`, `LGPD`, `seguranca`, `financeiro` (mode = `single-pr`)
4. **Usuário passou `--with-goal`** — força ativação mesmo em ad-hoc (mode = `ad-hoc`)
5. **Combo beyond-obvious aceito** — combos #1 (feature crítica) e #3 (projeto novo SaaS) sempre
   ativam goal

NÃO ativar para:
- Comando atômico (`/commit`, factual)
- Continuação (`--resume`)
- Spike/exploração descartável
- Flag `--no-goal` (override explícito)

---

## Tipos de check (matriz por categoria de intent)

| Tipo | Args | Quando usar |
|---|---|---|
| `gh_pr_open` | `{head_branch, repo?}` | Esperar PR aberto (fase build) |
| `gh_pr_merged` | `{pr_number?, head_branch?, repo?}` | Esperar PR merged (fase final) |
| `file_exists` | `{path}` | SPEC, ADR, state file existirem |
| `score_threshold` | `{file, field, min}` | MQS/SSS/FS >= threshold |
| `phase_done` | `{state_file, phase_id}` | Fase específica do `orq-goal-{slug}.json` em status=done |
| `deploy_url_active` | `{url, expected_status?}` | Preview/prod responde HTTP |
| `command_success` | `{command, timeout?}` | Custom (typecheck, lint, smoke) |

### Matriz por machine route

| Intent → Machine | Checks padrão gerados pelo ag-0 |
|---|---|
| feature → ag-1-construir | `gh_pr_open` + `file_exists(SPEC)` + (se domínio sensível) `score_threshold(MQS>=85)` |
| bug → ag-2-corrigir | `gh_pr_open` + `command_success(bun run typecheck)` |
| deploy → ag-3-entregar | `deploy_url_active` + (se prod) `gh_pr_merged` |
| QA → ag-7-qualidade | `score_threshold(meridian-state.json, .mqs, 85)` + `file_exists(quality-certificate.md)` |
| security → ag-8-seguranca | `score_threshold(sentinel-state.json, .sss, 80)` |
| audit → ag-9-auditar | `score_threshold(fortress-state.json, .fs, 80)` + `file_exists(fortress laudo)` |
| --full | `phase_done(state_file, 7)` + checks específicos do plan |
| --dag | `command_success(dag engine final)` por node crítico |

---

## TTL (expires_at)

| Modo | TTL padrão | Override |
|---|---|---|
| single-pr | 2h | `expires_at` explícito |
| full | 4h | Pode estender por fase |
| dag | 6h | Conforme `max_parallel` |
| ad-hoc com --with-goal | 1h | |

Hook arquiva como `.expired.json` após o TTL — não bloqueia para sempre.

---

## Procedimento de ativação (passos do ag-0)

```bash
# 1. Calcular slug
SLUG=$(echo "<intent>" | head -c 80 | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\{2,\}/-/g; s/^-//; s/-$//' | cut -d'-' -f1-4)

# 2. Gerar checks conforme matriz acima

# 3. Escrever arquivo
cat > ~/Claude/docs/ai-state/orq-goal-active.json <<JSON
{
  "slug": "$SLUG",
  "intent": "<intent>",
  "machine_route": "<rota>",
  "mode": "<single-pr|full|dag|ad-hoc>",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "expires_at": "$(date -u -v+4H +%Y-%m-%dT%H:%M:%SZ)",
  "status": "active",
  "bypass_allowed": true,
  "checks": [...]
}
JSON

# 4. (Opcional, --full) Propor /goal built-in para guardrail extra
echo "Sugiro também colar: /goal <condicao baseada em transcript>"
```

---

## Atualização durante execução

ag-0, após cada delegação retornar e Verification Gate executar:

1. Recarregar `orq-goal-active.json`
2. Para cada check, marcar `status: "pass"` se já confirmou artifact factualmente
3. Salvar de volta

O hook re-roda os checks ainda assim — se há discrepância entre status declarado e realidade,
o factual vence (anti-teatro).

---

## Bypass

| Mecanismo | Escopo |
|---|---|
| `ORQ_GOAL_GUARD_DISABLED=1` (env) | Sessão inteira |
| `touch ~/Claude/docs/ai-state/orq-goal-bypass.flag` | Próximo Stop apenas (one-shot) |
| Apagar `orq-goal-active.json` | Imediato |
| `--no-goal` no comando ag-0 | Não ativa para este pedido |
| Marcar todos checks como `skip: true` | Hook libera (passed) |

Bypass abusivo é registrado em telemetria via `orq-decisions.jsonl` (campo `gap: "bypass:<motivo>"`).

---

## Anti-patterns

| Anti-pattern | Por que ruim |
|---|---|
| Ativar goal para `/commit` ou factual lookup | Custo de hook a cada Stop sem benefício |
| TTL > 8h | Sessão real fica refém de goal antigo |
| Checks só com `skip: true` | Equivale a não ter goal — não ative |
| Misturar checks single-PR com phase_done de --full | Use modes separados |
| Pular bypass quando usuário pede explicitamente "parar" | Respeitar autonomia — usar one-shot flag |
| Hardcodar path absoluto de outro usuário em check | Quebra portabilidade |

---

## Composição com outras rules

- Herda **Definition of Done** do `CLAUDE.md` root (typecheck/lint/test)
- Herda **Verification Gate** do `ag-0-orquestrador` (artifact check)
- Compõe com **`/goal` built-in** (opt-in, opcional, quando usuário cola comando)
- Compatível com **`orq-decisions.jsonl`** (log de outcomes; goal-active é o gate)
- Compatível com **modo `--autonomo`** (hook bloqueia até checks fecharem ou TTL expirar)

---

## Smoke test (dry-run)

```bash
# 1. Criar goal fake
cat > ~/Claude/docs/ai-state/orq-goal-active.json <<'JSON'
{
  "slug": "smoke-test",
  "intent": "smoke test do guardrail",
  "started_at": "2026-05-23T15:00:00Z",
  "expires_at": "2030-01-01T00:00:00Z",
  "status": "active",
  "checks": [
    {"type": "file_exists", "args": {"path": "/tmp/orq-goal-smoke-marker"}}
  ]
}
JSON

# 2. Rodar verifier
python3 ~/Claude/.claude/scripts/orq-goal-verify.py ~/Claude/docs/ai-state/orq-goal-active.json
# Deve retornar {"ok": false, "pending":[...]}

# 3. Criar marker
touch /tmp/orq-goal-smoke-marker

# 4. Re-rodar
python3 ~/Claude/.claude/scripts/orq-goal-verify.py ~/Claude/docs/ai-state/orq-goal-active.json
# Deve retornar {"ok": true, ...}

# 5. Limpar
rm -f /tmp/orq-goal-smoke-marker ~/Claude/docs/ai-state/orq-goal-active.json
```
