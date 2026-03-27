---
name: ag-6-iniciar
description: "Maquina autonoma de inicializacao. Projeto novo, setup ambiente, explorar codebase, pesquisar alternativas — produz ambiente pronto para dev."
model: sonnet
context: fork
argument-hint: "[projeto|ambiente|explorar|pesquisar] [descricao ou path]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList
metadata:
  filePattern: "project-profile.json,codebase-map.md"
  bashPattern: "iniciar|scaffold|setup"
  priority: 90
---

# INICIAR — Maquina Autonoma de Inicializacao

## Invocacao

```
/iniciar projeto SaaS com Next.js + Supabase + Clerk
/iniciar ambiente ~/Claude/GitHub/raiz-platform
/iniciar explorar ~/Claude/GitHub/novo-repo
/iniciar pesquisar alternativas de auth
```

## Modos

| Modo | Agent interno | O que faz |
|------|--------------|-----------|
| projeto | ag-criar-projeto + ag-preparar-ambiente | Scaffold + setup (templates de .claude/shared/) |
| ambiente | ag-preparar-ambiente | Dev environment (deps, env vars, dev server) |
| explorar | ag-explorar-codigo | Mapear codebase (project-profile, findings) |
| pesquisar | ag-pesquisar-referencia | Benchmarks e alternativas com trade-offs |
