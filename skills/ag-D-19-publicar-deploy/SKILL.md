---
name: ag-D-19-publicar-deploy
description: "Deploy para Vercel ou plataforma detectada, com smoke tests. Use quando codigo esta auditado, testado e versionado."
model: sonnet
argument-hint: "[preview|production|rollback]"
disable-model-invocation: true
---

# ag-D-19 — Publicar Deploy

Spawn the `ag-D-19-publicar-deploy` agent to deploy code to preview, production, or rollback.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-D-19-publicar-deploy`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD]
Ambiente: [preview|production|rollback]
URL: [URL de producao, se conhecida]

$ARGUMENTS

Execute o deploy seguindo o protocolo de seguranca: preflight checks, deploy, smoke tests.
Caminho padrao para producao: PR merge em main -> deploy-gate.yml automatico.
NUNCA usar vercel --prod direto sem pipeline.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user

## Output

- Deploy executado no ambiente solicitado (preview ou producao)
- Smoke test results com URL de acesso
- Rollback executado se necessario, com estado anterior restaurado
- Verificacao: CI verde, deploy sucesso, metricas estaveis, logs limpos

## Anti-Patterns

- NUNCA deploy com testes falhando — "passa local" nao conta; smoke tests em staging devem passar
- NUNCA deploy sem smoke test pos-deploy — metricas estaveis? Logs sem erro? Response time aceitavel?
- NUNCA deploy sem plano de rollback — antes de apertar botao: como reverter em 2 min?
- NUNCA deploy com PRs pendentes — PR pendente pode conter fix de producao; mergear antes
- NUNCA ignorar alertas do provider — "preview failed" e sinal; nao forcar producao se preview esta red

## Quality Gate

- [ ] Smoke tests passam apos deploy?
- [ ] Logs sem erros novos?
- [ ] Metricas estaveis (latency, error rate)?
