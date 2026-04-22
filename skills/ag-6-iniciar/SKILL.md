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

## Inline Stack Decisions (Opus 4.7 ADR-0001 P1.2)

**Stack approved (Vercel + Supabase first):**

| Necessidade | Canonical | Plugin skill | Alternativa |
|---|---|---|---|
| Framework | Next.js 16 App Router | `vercel:nextjs` | — |
| Auth | Supabase Auth | `supabase:supabase` | Clerk via `vercel:auth` (multi-org) |
| DB | Supabase Postgres | `supabase:supabase` | Neon (branching) via `vercel:vercel-storage` |
| Storage | Supabase Storage | `supabase:supabase` | Vercel Blob via `vercel:vercel-storage` |
| Cache | Vercel Runtime Cache | `vercel:runtime-cache` | — |
| Email | Resend | — | — |
| Styling | Tailwind 4 + shadcn/ui | `vercel:shadcn` | — |
| Forms | React Hook Form + Zod | — | — |
| State | Server Components + Zustand | — | — |
| AI (single provider) | AI SDK | `vercel:ai-sdk` | — |
| AI (multi/failover) | AI Gateway | `vercel:ai-gateway` | — |
| Chatbot multi-platform | Chat SDK | `vercel:chat-sdk` | — |
| Workflow/durável | Workflow DevKit | `vercel:workflow` | — |
| Charts | Recharts | — | — |
| Testes unit | Vitest | — | — |
| Testes E2E | Playwright (MCP) | — | — |
| Monitoring | Sentry | `sentry:sentry-sdk-setup` | — |
| Deploy | Vercel | `vercel:deployments-cicd` | Railway via `railway:use-railway` |
| Env vars | Vercel CLI | `vercel:env-vars` | — |

**Bibliotecas REJEITADAS:** MongoDB, Firebase, Redux, MUI, Chakra, NextAuth, Prisma (novo projeto), Jest (novo projeto), Cypress.

**NUNCA desviar sem ADR + aprovação do usuário.**

## Pre-Load: Stack Decisions + Design Library

ANTES de criar projeto novo ou pesquisar alternativas:

### 1. Stack obrigatório (inline acima; `/ag-referencia-stack-decisions` tem detalhes completos)
- **Vercel + Supabase first** — libs avulsas só quando plataforma nativa não resolve
- Template: Next.js 16 + Tailwind 4 + shadcn/ui + Zod + Supabase (Auth+DB+Storage)
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
