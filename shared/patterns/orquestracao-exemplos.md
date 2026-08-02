# Orquestração — Exemplos, Combos e Failure Reactions

> Extraído de `skills/ag-0-orquestrador/SKILL.md` para reduzir tokens carregados por invocação.
> Conteúdo VERBATIM — não alterar sem sincronizar com a skill.

---

## Seção A — Combos Beyond-Obvious

Quando intent + contexto cruzarem os gatilhos abaixo, ag-0 PROPÕE o combo (não roda automaticamente — pergunta antes).

### 1. Feature Crítica em Produção
**Gatilhos**: "feature crítica", "produção", "afeta receita", "auth", "pagamento", "compliance"
**Combo**:
```
ag-mesa-redonda [decisão arquitetural]
  → ag-1-construir [feature] (gera SPEC interno)
  → ag-adversario [SPEC] (red team)
  → ag-1-construir --validado [feature] (Boris Cherny pair)
  → ag-7-qualidade [url preview]
```
**Sugestão ao usuário**: "Detectei feature crítica. Sugiro pipeline mesa-redonda → adversário → --validado → qualidade. Confirma ou prefere ag-1 direto (`--simples`)?"

### 2. Refactor Grande
**Gatilhos**: "refatorar", "reestruturar", "extrair módulo", >20 arquivos no escopo
**Combo**:
```
ag-cacar-bugs [path] --deep        # mapeia bugs latentes ANTES do refactor
  → ag-destilar [docs/arquitetura]   # comprime contexto
  → ag-analisar-contexto [path]      # tech debt + riscos
  → ag-1-construir refactor [scope]
  → ag-4-teste-final ciclo [path]    # test-fix-retest
```

### 3. Projeto Novo SaaS
**Gatilhos**: "criar projeto", "novo SaaS", "MVP", "scaffolding"
**Combo**:
```
ag-mesa-redonda [stack: vercel+supabase vs clerk vs neon]
  → /ag-referencia-stack-decisions
  → ag-6-iniciar projeto [desc]
  → ag-criar-projeto [scaffolding]
  → ag-preparar-ambiente [docker, CI, env]
  → ag-login-persistente [setup SSO Google]
```

### 4. Codebase Desconhecido
**Gatilhos**: primeira vez no repo, "explorar", "entender", "ler código"
**Combo**:
```
ag-saude-sessao                    # health check (stash, dirty, processos)
  → ag-6-iniciar explorar [path]
  → ag-advisor [path]              # análise proativa de melhorias
  → ag-cacar-bugs [path]           # bugs latentes
  → tarefa solicitada
```

### 5. Pós-Sprint / N PRs Mergeados
**Gatilhos**: "fim de sprint", "retrospectiva", >5 PRs mergeados na sessão
**Combo**:
```
ag-retrospectiva [sessão]
  → ag-insights [tokens, custo, trends]
  → ag-thinkback [decisões questionáveis]
  → atualizar MEMORY.md/feedback_*.md
```

---

## Seção B — Fluxos Compostos Clássicos (Machine → Machine)

### Feature Completa (build → test → deploy)
```
ag-1-construir [feature]
  → se --with-test: ag-4-teste-final qat [path]
  → se --with-deploy: vercel:deployments-cicd (preview) OU ag-3-entregar producao
```

### Bug → Fix → Verify → Deploy
```
ag-2-corrigir [bug]
  → se fix pronto e --ship: vercel:deployments-cicd OU ag-3-entregar
```

### Auditoria → Fix → Redeploy
```
ag-9-auditar [url]
  → se issues encontradas: ag-2-corrigir lista: [issues]
  → vercel:deployments-cicd OU ag-3-entregar producao
  → ag-7-qualidade [url] (confirmar fixes)
```

---

## Seção C — Failure Reactions Map

Quando rota delegada falha ou produz output incompleto, ag-0 NAO declara concluido. Aplica reacao:

| Sinal | Acao primaria | Fallback se primaria falhar |
|-------|---------------|----------------------------|
| ag-1 retorna sem PR (output vazio ou erro) | Re-tentar com `--draft` (output mais rapido, menos rigoroso) | Escalar ao usuario com transcript do erro |
| ag-1 timeout / OOM | `memory_pressure` check + cleanup-orphans + retry com `NODE_OPTIONS=--max-old-space-size=8192` | Quebrar tarefa: ag-0 fatia em 2 PRs e re-roteia |
| ag-1 PR aberto mas typecheck/lint falha | Auto-route para `ag-2-corrigir tipos` no mesmo branch | Reportar ao usuario com diff dos errors |
| ag-2 corrigir falha apos 3 ciclos red | Escalar: rota para `ag-depurar-erro` (Opus, deep reasoning) | Reportar com hipoteses + pedir input do usuario |
| ag-3 deploy preview falha | Verificar logs Vercel; se env var faltando: `vercel:env-vars` add | Rollback automatico + escalate |
| ag-7/8/9 score abaixo threshold | Auto-route para `ag-2-corrigir` com lista de issues; re-rodar audit apos | Reportar findings sem "aceitar gap" silenciosamente |
| Plugin canonical falha (ex: vercel:deployments-cicd) | Tentar machine wrapper local (ag-3-entregar) com diagnostico | Escalate |
| MCP necessario nao disponivel | Skill alternativa OU executar manualmente via CLI equivalente | Reportar limitacao ao usuario |
| 2 falhas consecutivas na mesma rota | PARAR — nao tentar 3a vez. Escalar com hipoteses sobre causa raiz | — |

**Regra de ouro**: max 2 retries automaticos. Apos 2 falhas, parar e reportar com:
- Tentativas feitas (rota + erro)
- Hipoteses sobre causa raiz
- Opcoes para o usuario decidir (a/b/c)
- NUNCA "aceitar gap" silenciosamente — bloqueado pelo `gap-acceptance-guard`

---

## Seção D — Routing Decisions Log Schema + Exemplos

Append em `~/Claude/docs/ai-state/orq-decisions.jsonl` ao final de cada sessao (uma linha JSON por delegacao):

```json
{"ts":"2026-05-10T15:30:00Z","intent":"corrigir bug de dropdown disciplinas","route":"ag-2-corrigir","mode":"bug","outcome":"success","artifact":"PR #234","retries":0,"gap":null}
{"ts":"2026-05-10T15:35:00Z","intent":"adicionar feature multi-tenant","route":"ag-1-construir","mode":"feature","outcome":"partial","artifact":"PR #235","retries":1,"gap":"build vermelho — auto-route ag-2-corrigir tipos"}
{"ts":"2026-05-10T15:50:00Z","intent":"adicionar feature multi-tenant","route":"ag-2-corrigir","mode":"tipos","outcome":"success","artifact":"PR #235 fix typecheck","retries":0,"gap":null}
```

Campos:
- `ts`: ISO timestamp
- `intent`: primeiras 80 chars do pedido
- `route`: machine/skill/plugin escolhido
- `mode`: subcomando (bug/feature/refactor/tipos/etc)
- `outcome`: success | partial | failed
- `artifact`: PR URL, score path, ou `null`
- `retries`: numero de re-routes ate sucesso
- `gap`: descricao curta do gap se outcome=partial; null caso contrario

**Uso**: `ag-retrospectiva` consome o log para identificar:
- Rotas com `retries > 0` frequentes → prompt da machine precisa melhorar
- `outcome=partial` recorrente em mesma rota → ajustar Verification Gate
- `outcome=failed` na mesma intent twice → falta capability ou skill nova

Manter ate 1000 linhas; rotacionar mensalmente para `archive/orq-decisions-YYYY-MM.jsonl`.
