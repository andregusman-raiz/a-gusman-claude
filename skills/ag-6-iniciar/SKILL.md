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

## Pre-Load: Stack Decisions + Design Library

ANTES de criar projeto novo ou pesquisar alternativas:

### 1. Stack obrigatório (`/ag-referencia-stack-decisions`)
- **Vercel + Supabase first** — libs avulsas só quando plataforma nativa não resolve
- Template: Next.js 16 + Tailwind 4 + shadcn/ui + Zod + Supabase (Auth+DB+Storage)
- Árvores de decisão: Auth (Supabase vs Clerk), DB (Supabase vs Neon), Cache (Runtime Cache vs Redis)
- NUNCA desviar do stack aprovado sem ADR + aprovação do usuário

### 2. Design Library (`catalogo-raiz.vercel.app`)
- **Soluções** (24 patterns): dashboard, workflow, chat, etc.
- **Elementos UI** (144): referências best-in-class
- **Módulos funcionais** (32): auth, LLM router, TOTVS sync, export engine, etc.
- Se solução/módulo existe → adaptar em vez de criar do zero

---

## Modos

| Modo | Agent interno | O que faz |
|------|--------------|-----------|
| projeto | ag-criar-projeto + ag-preparar-ambiente | Scaffold + setup (consulta Design Library primeiro) |
| ambiente | ag-preparar-ambiente | Dev environment (deps, env vars, dev server) |
| explorar | ag-explorar-codigo | Mapear codebase (project-profile, findings) |
| pesquisar | ag-pesquisar-referencia | Benchmarks e alternativas com trade-offs |
