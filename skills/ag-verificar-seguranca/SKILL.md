---
name: ag-verificar-seguranca
description: "Auditoria de seguranca, qualidade e conformidade. OWASP Top 10, secrets scan, dependency audit. Use antes de deploy."
model: sonnet
argument-hint: "[projeto-path]"
disable-model-invocation: true
---

# ag-verificar-seguranca — Auditar Codigo

Spawn the `ag-verificar-seguranca` agent to perform a security and quality audit.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-verificar-seguranca`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Focus: [OWASP, secrets, deps, all]


Executar auditoria de seguranca conforme foco solicitado. Verificar OWASP Top 10, secrets expostos, dependencias vulneraveis, RLS, e conformidade.
Gerar relatorio com severidade e recomendacoes.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- READ-ONLY audit — does NOT fix issues, only reports findings
- Supports focus modes: OWASP, secrets, deps, or all

## Output

- audit-report.md com findings: descricao, severity, localizacao (file:line), remediacao
- OWASP Top 10 checklist (A01-A10)
- Secrets scan (grep: sk_, pk_, api_key, token, password)
- Dependency audit (`bun run audit --production`)
- RLS verification (para projetos Postgres/Supabase)

## Anti-Patterns

- NUNCA auditar sem rodar `bun run audit` — ferramenta automatica detecta o que olho humano perde
- NUNCA ignorar severity CRITICAL — um CRITICAL bloqueia deploy
- NUNCA confiar no README para avaliacao de seguranca — codigo e a verdade

## Escalacao: Issues para Findings P0/P1

Findings com severidade P0 (CRITICAL) ou P1 (HIGH) DEVEM ser registrados como GitHub Issues:

```
Agent({
  subagent_type: "ag-registrar-issue",
  name: "issue-registrar",
  model: "haiku",
  run_in_background: true,
  prompt: "Repo: [detectar]\nOrigem: ag-verificar-seguranca\nSeveridade: [P0-critical ou P1-high]\nTitulo: [SECURITY] descricao do finding\nContexto: [finding completo: descricao, localizacao file:line, OWASP category, remediacao sugerida]\nArquivos: [arquivos afetados]\nLabels: security"
})
```

- P0/P1: SEMPRE criar issue (bloqueia deploy)
- P2/P3: apenas documentar em audit-report.md (nao poluir backlog)

## Quality Gate

- [ ] Nenhum secret hardcoded encontrado?
- [ ] Nenhuma vulnerabilidade CRITICAL sem remediacao?
- [ ] OWASP Top 10 coberto (A01-A10)?
- [ ] Todas as issues tem remediacao sugerida?
- [ ] Findings P0/P1 registrados como GitHub Issues via ag-registrar-issue?

### Auditoria de Resiliencia
Para cada dependencia externa (API, DB, servico), verificar:
- [ ] **Circuit Breaker** presente? (evita cascading failure)
- [ ] **Retry com backoff exponencial**? (com jitter, sem retry em 4xx)
- [ ] **Timeout configurado**? (connection + read + total)
- [ ] **Fallback definido**? (cache stale, valor padrao, degradacao)
- [ ] **Health Check** implementado? (liveness + readiness)
- [ ] **Idempotencia** em operacoes de escrita? (retry seguro)

### Classificacao de Severidade — Resiliencia

| Achado | Severidade |
|--------|-----------|
| Chamada externa sem timeout | P0 — CRITICO |
| Retry sem backoff (loop infinito possivel) | P0 — CRITICO |
| Sem circuit breaker em dependencia critica | P1 — ALTO |
| Sem fallback para servico opcional | P2 — MEDIO |
| Health check incompleto (so liveness) | P3 — BAIXO |
