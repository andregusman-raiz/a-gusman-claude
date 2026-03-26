---
name: ag-meridian
description: "Maquina autonoma de qualidade. Descobre app, testa 5 dimensoes (ALIVE/REAL/WORKS/LOOKS/FEELS), corrige, re-testa ate convergencia. Quality Certificate + Fix PR + baselines."
model: opus
context: fork
argument-hint: "[URL ou path do projeto] [--threshold N] [--audit-only] [--resume] [--scope rotas]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "meridian-*.json,meridian-*.md"
  bashPattern: "meridian"
  priority: 95
---

# MERIDIAN — Maquina Autonoma de Qualidade de Software

## Invocacao

```
/meridian https://app.example.com              # App deployada
/meridian ~/Claude/GitHub/raiz-platform         # Projeto local
/meridian https://app.example.com --threshold 90   # Threshold customizado
/meridian https://app.example.com --audit-only     # So diagnosticar
/meridian --resume                                  # Retomar run interrompido
/meridian ~/Claude/GitHub/fgts-platform --scope "/dashboard,/consultas"  # Rotas especificas
```

## O que faz

Executa QA completo AUTONOMO em 5 fases:

1. **SCOUT** — Mapeia toda a aplicacao (rotas, features, auth, dados)
2. **SIEGE** — Testa 5 dimensoes:
   - D1-ALIVE: Carrega sem erros?
   - D2-REAL: Dados sao reais (nao mock)?
   - D3-WORKS: Features funcionam?
   - D4-LOOKS: Visual correto em 4 viewports?
   - D5-FEELS: Cliente aceitaria? (narrativa)
3. **FORGE** — Corrige bugs encontrados em sprints
4. **CONVERGE** — Calcula MQS, loop ate >= threshold
5. **DELIVER** — Quality Certificate, Fix PR, baselines, issues

## Execucao

Spawnar o agent principal:

```
Agent({
  subagent_type: "ag-meridian",
  prompt: "{input do usuario}",
  run_in_background: true,
  mode: "auto"
})
```

## Artefatos Produzidos

| Artefato | Arquivo |
|----------|---------|
| Quality Certificate | `docs/meridian-certificate-YYYY-MM-DD.md` |
| Fix PR | GitHub PR com before/after |
| Baselines | `meridian-baselines.json` |
| State (recovery) | `meridian-state.json` |
| KB Update | `~/.claude/shared/meridian-kb/` |
| Issues backlog | GitHub Issues com label `meridian-finding` |

## Agents Delegados

| Agent | Fase | Proposito |
|-------|------|-----------|
| ag-explorar-codigo | SCOUT | Explorar codebase |
| ag-testar-ux-qualidade | SIEGE D4 | Visual quality testing |
| ag-corrigir-bugs | FORGE | Bugfix em sprints |
| ag-corrigir-tipos | FORGE | Fix TypeScript errors |
| ag-depurar-erro | FORGE | Debug de bugs obscuros |
