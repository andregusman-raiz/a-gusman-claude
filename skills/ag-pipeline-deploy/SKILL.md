---
name: ag-pipeline-deploy
description: "Pipeline autonomo end-to-end: env check -> typecheck -> lint -> test -> build -> deploy -> smoke test. Auto-recovery em cada etapa (max 3 tentativas). Use for full deploy pipelines."
model: sonnet
argument-hint: "[projeto-path] [ambiente]"
context: fork
disable-model-invocation: true
---

# ag-pipeline-deploy — Deploy Pipeline

Spawn the `ag-pipeline-deploy` agent to run the full 8-stage deploy pipeline autonomously with auto-recovery.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-pipeline-deploy`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Ambiente: [preview|production]


## Output
- Pipeline 8-stage report: env check → typecheck → lint → test → build → deploy → smoke → final
- Status por etapa (PASS/FAIL/RECOVERED)
- Auto-recovery attempts documentados (max 3 por stage)

Execute o pipeline completo end-to-end:
1. Env check  2. Typecheck  3. Lint  4. Test  5. Build  6. Deploy  7. Smoke test  8. Report
Auto-recovery em cada etapa (max 3 tentativas). Se falha apos 3 tentativas, reportar e parar.
Caminho padrao: PR-based via Vercel Git Integration (pre-deploy-gate.sh no buildCommand). Pipeline manual para repos sem Git Integration.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Runs in background with fork context (autonomous pipeline)
- After spawning, confirm to the user

## Troubleshooting

| Erro | Causa Comum | Solucao |
|------|-------------|---------|
| Build OOM | Bundle grande, memory limit | `NODE_OPTIONS='--max-old-space-size=8192'` |
| Typecheck timeout | Projeto grande sem incremental | `bunx tsc --noEmit --incremental` |
| Flaky tests | Race conditions, network deps | `--retry=2` ou `@flaky` tag + skip |
| Missing secrets | Env vars nao configuradas | `vercel env ls` ou `gh secret list` |
| Deploy stuck | Vercel queue, rate limit | `vercel ls` → verificar status |
| Smoke test 404 | Rota nao gerada, rewrite rules | Verificar `vercel.json` rewrites |
| Build cache stale | Cache corrompido | `vercel --force` ou limpar `.next/` |
| ESLint new errors | Dep update trouxe novas regras | `--max-warnings=N` temporario |

## Recovery Procedures

### Build OOM
```bash
export NODE_OPTIONS='--max-old-space-size=8192'
bun run build
# Se persistir: analisar bundle com `bunx next build --analyze`
```

### Missing Secrets
```bash
# Listar secrets necessarios vs configurados:
grep -r "process.env\." src/ | sed 's/.*process.env\.\([A-Z_]*\).*/\1/' | sort -u > /tmp/needed.txt
vercel env ls 2>/dev/null | sort > /tmp/configured.txt
diff /tmp/needed.txt /tmp/configured.txt
```

### Flaky Tests
```bash
# Identificar flaky: rodar 3x e comparar
for i in 1 2 3; do bunx vitest run 2>&1 | grep "FAIL" >> /tmp/flaky-candidates.txt; done
sort /tmp/flaky-candidates.txt | uniq -c | sort -rn | head -10
```
