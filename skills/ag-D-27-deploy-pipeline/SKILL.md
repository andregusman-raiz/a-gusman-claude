---
name: ag-D-27-deploy-pipeline
description: "Pipeline autonomo end-to-end: env check -> typecheck -> lint -> test -> build -> deploy -> smoke test. Auto-recovery em cada etapa (max 3 tentativas). Use for full deploy pipelines."
model: sonnet
argument-hint: "[projeto-path] [ambiente]"
context: fork
disable-model-invocation: true
---

# ag-D-27 — Deploy Pipeline

Spawn the `ag-D-27-deploy-pipeline` agent to run the full 8-stage deploy pipeline autonomously with auto-recovery.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-D-27-deploy-pipeline`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Ambiente: [preview|production]

$ARGUMENTS

## Output
- Pipeline 8-stage report: env check → typecheck → lint → test → build → deploy → smoke → final
- Status por etapa (PASS/FAIL/RECOVERED)
- Auto-recovery attempts documentados (max 3 por stage)

Execute o pipeline completo end-to-end:
1. Env check  2. Typecheck  3. Lint  4. Test  5. Build  6. Deploy  7. Smoke test  8. Report
Auto-recovery em cada etapa (max 3 tentativas). Se falha apos 3 tentativas, reportar e parar.
Caminho padrao: PR-based via deploy-gate.yml. Pipeline manual para repos sem CI/CD.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Runs in background with fork context (autonomous pipeline)
- After spawning, confirm to the user
