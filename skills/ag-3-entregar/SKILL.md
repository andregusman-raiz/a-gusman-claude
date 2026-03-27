---
name: ag-3-entregar
description: "Maquina autonoma de entrega. Preview, producao, rollback — pipeline completo com preflight, build, deploy, smoke, monitor. Recovery automatico."
model: sonnet
context: fork
argument-hint: "[producao|rollback] [--resume] [--skip-smoke] [--dry-run]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "entregar-state.json"
  bashPattern: "entregar|deploy|vercel"
  priority: 96
---

# ENTREGAR — Maquina Autonoma de Entrega

## Invocacao

```
/entregar                    # Preview (default seguro)
/entregar producao           # Pipeline completo producao
/entregar rollback           # Rollback verificado
/entregar --resume           # Retomar
```

## O que faz

Deploy completo AUTONOMO em 5 fases:

```
ASSESS → PREFLIGHT → DEPLOY → SMOKE → MONITOR → REPORT
```

1. **ASSESS**: Detecta modo (preview/production/rollback), verifica CLI auth
2. **PREFLIGHT**: Credentials + typecheck + lint + test + build (production only)
3. **DEPLOY**: Push/merge/vercel deploy conforme modo
4. **SMOKE**: Verifica URL (homepage, assets, auth, console errors)
5. **MONITOR**: Observa metricas por 5min (production only)

## Modos

| Modo | Sinais | Pipeline |
|------|--------|----------|
| preview | default, "preview" | push branch → auto-deploy Vercel |
| producao | "producao", "prod" | preflight completo → merge PR → Vercel |
| rollback | "rollback", "reverter" | listar deploys → promover anterior |

## Output

```
ENTREGAR COMPLETO
  Modo: [preview/producao/rollback]
  URL: [deploy_url]
  Smoke: [pass/fail]
  Monitor: [status]
```
