---
name: ag-Q-15-auditar-codigo
description: "Auditoria de seguranca, qualidade e conformidade. OWASP Top 10, secrets scan, dependency audit. Use antes de deploy."
model: sonnet
argument-hint: "[projeto-path]"
disable-model-invocation: true
---

# ag-Q-15 — Auditar Codigo

Spawn the `ag-Q-15-auditar-codigo` agent to perform a security and quality audit.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-Q-15-auditar-codigo`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Focus: [OWASP, secrets, deps, all]

$ARGUMENTS

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
- Dependency audit (`npm audit --production`)
- RLS verification (para projetos Postgres/Supabase)

## Anti-Patterns

- NUNCA auditar sem rodar `npm audit` — ferramenta automatica detecta o que olho humano perde
- NUNCA ignorar severity CRITICAL — um CRITICAL bloqueia deploy
- NUNCA confiar no README para avaliacao de seguranca — codigo e a verdade

## Quality Gate

- [ ] Nenhum secret hardcoded encontrado?
- [ ] Nenhuma vulnerabilidade CRITICAL sem remediacao?
- [ ] OWASP Top 10 coberto (A01-A10)?
- [ ] Todas as issues tem remediacao sugerida?
