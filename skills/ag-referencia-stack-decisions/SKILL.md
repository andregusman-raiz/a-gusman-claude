---
name: ag-referencia-stack-decisions
description: Stack decisions for rAIz projects — Vercel + Supabase first, libs avulsas só quando necessário. Consult BEFORE choosing any dependency or architecture.
metadata:
  filePattern:
    - "**/package.json"
    - "**/CLAUDE.md"
  bashPattern:
    - "npm install"
    - "npx create-next-app"
    - "bun add"
  priority: 90
---

# Stack Decisions — rAIz Educação

> Vercel + Supabase first. Libs avulsas só quando a plataforma nativa não resolve.
> Baseado em 24 repos e 9 projetos ativos (Mar/2026).

---

## Princípio: Plataforma > Biblioteca

```
Vercel (deploy, cache, analytics, functions, blob) + Supabase (auth, DB, storage, realtime)
= 80% das necessidades resolvidas com ZERO libs extras.
Só adicionar dependência quando Vercel+Supabase genuinamente não resolvem.
```

---

## Tier 1 — OBRIGATÓRIO (sem exceção)

| Área | Escolha | Justificativa | NUNCA usar |
|------|---------|---------------|-----------|
| **Framework** | Next.js 16 App Router | Server Components default, ISR, streaming | Remix, SvelteKit, Pages Router |
| **Linguagem** | TypeScript 5 strict | `--max-warnings=0`, zero `any` | JavaScript |
| **Validação** | Zod 4 | Schema = source of truth (DB, API, forms) | Yup, Joi |
| **Deploy** | Vercel (Git Integration) | PR → preview → merge → auto-deploy | AWS, Azure, `vercel --prod` direto |
| **Banco** | Supabase PostgreSQL | Auth + DB + Storage + RLS integrados | MongoDB, Firebase, DynamoDB |
| **Auth** | Supabase Auth | 2FA, RLS nativo, Magic Link, Google SSO | NextAuth |
| **Storage** | Supabase Storage | Buckets privados, signed URLs, RLS | AWS S3 |
| **CI/CD** | Vercel Git Integration | `buildCommand: pre-deploy-gate.sh && npm run build` | Jenkins, CircleCI |
| **RLS** | ATIVO em TODAS as tabelas | Desde a primeira migration | Tabela sem RLS = dados expostos |

---

## Tier 2 — RECOMENDADO (usar por padrão)

| Área | Escolha | Quando NÃO usar |
|------|---------|-----------------|
| **Styling** | Tailwind 4 + shadcn/ui + Lucide + next-themes | Nunca desviar |
| **Cache** | Vercel Runtime Cache (per-region KV) | Se precisa Redis full (pub/sub, streams) → Upstash |
| **Charts** | Recharts 3.8 | Se precisa heatmap/treemap → Nivo. Se milhões de pontos → ECharts |
| **Email** | Resend + React Email | Vercel não tem email nativo |
| **Testes** | Vitest + Playwright E2E | Jest só em projeto legacy |
| **Package mgr** | npm | bun não adotado em produção |
| **Icons** | Lucide React | Consistência cross-projetos |
| **Fonts** | IBM Plex Sans / Mono | Design system rAIz |
| **Analytics** | Vercel Web Analytics + Speed Insights | Sentry só se precisa stack completa |
| **Observability** | Vercel Logs + Drains | OTel só para raiz-platform |

---

## Tier 3 — SÓ QUANDO NECESSÁRIO

### ORM: Supabase Client vs Drizzle

```
Precisa de ORM?
├── Usa Supabase Auth + Storage → @supabase/supabase-js (queries diretas, zero ORM)
├── Precisa de migrations versionadas → Drizzle ORM + drizzle-kit
├── Precisa de DB branching → Neon + Drizzle
└── NUNCA → Prisma, TypeORM, Sequelize
```

**Padrão**: Supabase client. Drizzle só se precisa de migrations esquemáticas ou Neon.

### Auth avançado: Supabase Auth vs Clerk

```
Precisa de auth multi-org?
├── Uma organização → Supabase Auth (padrão)
├── Multi-org / multi-tenant → Clerk (auto-provisions env vars via Vercel Marketplace)
├── SSO enterprise (SAML/OIDC) → Supabase Auth + sso.service.ts pattern
└── Sem auth (interno/mock) → Skip
```

### File Storage: Supabase Storage vs Vercel Blob

```
Precisa armazenar arquivos?
├── Projeto com Supabase → Supabase Storage (mesmo ecossistema, RLS integrado)
├── Projeto sem Supabase → Vercel Blob (zero config)
├── Precisa de CDN + transformações → Vercel Blob (edge-optimized)
└── NUNCA → AWS S3 direto, Google Cloud Storage
```

### Cache: Vercel Runtime Cache vs Upstash Redis

```
Precisa de cache?
├── Cache de dados/API simples → Vercel Runtime Cache (grátis, per-region, tag invalidation)
├── Cache de página → Next.js 'use cache' + revalidateTag
├── Precisa de pub/sub, streams, ou Lua scripts → Upstash Redis
├── Rate limiting → Vercel Runtime Cache (ou Upstash se precisa sliding window complexo)
└── NUNCA → Memcached, Redis self-hosted
```

### State Management

```
Precisa de state client-side?
├── Maioria → Server Components + Supabase queries (ZERO state lib)
├── UI complexa client → Zustand (lightweight)
├── Form state → React Hook Form + Zod
└── NUNCA → Redux, Recoil, Jotai, MobX
```

### AI/LLM

```
Tem feature AI?
├── Chat/streaming → AI SDK v6 + AI Gateway (OIDC, zero API keys)
├── Multi-provider → AI Gateway routing (model: 'provider/model')
├── Durable agents → Workflow DevKit (DurableAgent)
├── UI de AI → AI Elements (npx ai-elements)
└── Sem AI → Skip
```

### Notifications

```
Precisa de notificações?
├── Só email → Resend (já no stack)
├── Multi-channel (email + in-app + SMS) → Novu
├── Agendamento → Vercel Cron + Resend
├── Eventos async → Vercel Queues
└── NUNCA → Firebase Cloud Messaging, OneSignal
```

### Error Tracking

```
Precisa de error tracking?
├── MVP / interno → Vercel Logs + Web Analytics (grátis, built-in)
├── Produção com usuários → Sentry 10.46+ via Vercel Marketplace
├── Observabilidade full → Vercel Drains + OTel + Sentry
└── NUNCA → LogRocket (privacy), Bugsnag (custo)
```

---

## Template de Novo Projeto (Vercel + Supabase first)

```bash
# 1. Scaffold
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --yes

# 2. UI
cd my-app
npx shadcn@latest init -d --yes
npx shadcn@latest add button card dialog input select badge separator tabs

# 3. Core deps
npm install lucide-react next-themes sonner zod @supabase/supabase-js @supabase/ssr

# 4. Dev deps
npm install -D vitest @vitejs/plugin-react @testing-library/react playwright

# 5. Vercel
vercel link
vercel env pull

# 6. Supabase (se precisa de DB)
npx supabase init
# Criar projeto no dashboard → env vars auto-provisionadas via Vercel Marketplace
```

### Quando adicionar Drizzle (só se necessário):
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

### Quando adicionar Clerk (só se multi-org):
```bash
vercel integration add clerk
npm install @clerk/nextjs
```

---

## Estrutura padrão

```
src/
├── app/
│   ├── (app)/          # Routes autenticadas (middleware gate)
│   ├── (auth)/         # Login/registro
│   ├── api/            # Route Handlers
│   └── layout.tsx      # ThemeProvider + Toaster
├── components/
│   ├── ui/             # shadcn/ui (copy-paste)
│   ├── layout/         # Sidebar, Topbar, AppShell
│   └── [module]/       # Components por módulo
├── lib/
│   ├── supabase/       # createClient (server + browser)
│   ├── db/             # Drizzle schema (se usado)
│   └── utils.ts        # cn() + helpers
├── actions/            # Server Actions com Zod validation
└── proxy.ts            # Auth middleware (Next.js 16)
```

---

## Anti-Patterns (NUNCA fazer)

| Anti-pattern | Por quê | Fazer em vez disso |
|-------------|---------|-------------------|
| Prisma | Zero uso; Drizzle é o padrão quando ORM é necessário | `@supabase/supabase-js` ou Drizzle |
| Redux | Server Components eliminam a necessidade | Server-first ou Zustand |
| CSS Modules | Tailwind é consolidado | Tailwind classes |
| Monorepo (Turborepo) | Complexidade sem necessidade | Repos independentes + .claude/shared/ |
| AWS S3 para storage | Supabase Storage ou Vercel Blob resolvem | Usar plataforma nativa |
| `vercel --prod` direto | Sem CI checks | Sempre via PR + merge |
| Tabela sem RLS | Dados expostos | RLS desde a primeira migration |
| `any` no TypeScript | Erosão de type safety | `unknown` + type guard |
| `git add -A` | Pode commitar .env | Listar arquivos específicos |
| API keys manuais (AI) | Risco de vazamento | AI Gateway com OIDC (vercel env pull) |
| `middleware.ts` (Next.js 16) | Renomeado | `proxy.ts` |

---

## Gotchas de Produção

1. **lint-staged reverte TUDO** se ESLint falha → fix lint ANTES de commit
2. **RLS esquecido = dados expostos** → SEMPRE incluir na migration
3. **tsc --noEmit consome 3.5GB** → LSP durante dev, tsc só no gate final
4. **proxy.ts (não middleware.ts)** em Next.js 16 → Node.js runtime only
5. **Vercel timeouts**: 60s default, 300s max → background jobs para ops longas
6. **Supabase client**: server = `createServerClient()`, browser = `createBrowserClient()`
7. **AI Gateway OIDC**: `vercel env pull` provisiona token. Re-rodar se expirar (~24h)
8. **Circular imports** → extrair types para arquivo separado imediatamente

---

## Quando desviar do padrão

1. Documentar em ADR (Architecture Decision Record)
2. Confirmar com o usuário ANTES de implementar
3. Registrar exceção no CLAUDE.md do projeto
4. NUNCA desviar silenciosamente

---

*Atualizado em 2026-03-28. Revisar trimestralmente.*
