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

## Canonical delegation (ADR-0001)

Esta machine **delega para skills oficiais** quando aplicável:

| Detecção | Canonical | Ação |
|---|---|---|
| `vercel.json` OR `.vercel/project.json` presente | `vercel:deployments-cicd` | Orquestrar via skill oficial Vercel |
| `railway.json` presente | `railway:use-railway` | Orquestrar via skill oficial Railway |
| Deploy manual via CLI | `vercel:vercel-cli` | Usar CLI guidance oficial |
| Env vars gestão | `vercel:env-vars` | Delegar configuração |
| Rollback Vercel | `vercel:deployments-cicd` (modo rollback) | Delegar |

**Para deploys simples em projetos Vercel, preferir invocar diretamente `vercel:deployments-cicd`.** Esta machine (ag-3-entregar) adiciona valor quando: pipeline multi-ambiente (preview → staging → prod), quality gates customizados, integração com Sentry release, ou recovery multi-tentativa.

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
