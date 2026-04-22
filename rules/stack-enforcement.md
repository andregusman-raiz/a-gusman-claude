# Stack Enforcement — Vercel + Supabase First

## Regra

Antes de instalar qualquer dependência nova ou escolher tecnologia:

1. Verificar se Vercel ou Supabase já resolvem nativamente
2. Consultar `/ag-referencia-stack-decisions` para a decisão aprovada
3. Se a lib não está na lista aprovada → ADR obrigatório + aprovação do usuário

## Checklist rápido

| Preciso de... | Usar | NÃO usar |
|---|---|---|
| Auth | Supabase Auth (ou Clerk se multi-org) | NextAuth, Auth0 |
| Database | Supabase PostgreSQL (ou Neon se branching) | MongoDB, Firebase |
| Storage | Supabase Storage (ou Vercel Blob) | AWS S3 |
| Cache | Vercel Runtime Cache | Redis self-hosted |
| Email | Resend | SendGrid |
| ORM | @supabase/supabase-js (ou Drizzle se migrations) | Prisma |
| State | Server Components (ou Zustand se necessário) | Redux |
| Styling | Tailwind + shadcn/ui | MUI, Chakra |
| AI | AI Gateway + AI SDK v6 | API keys diretas |
| Charts | Recharts | Chart.js |
| Testes | Vitest + Playwright | Jest (novo), Cypress |

## Plugin skills canonical por stack area (ADR-0001)

Para cada escolha na tabela acima, use a skill oficial correspondente:

| Stack area | Skill oficial canonical |
|---|---|
| Auth (Clerk/Auth0) | `vercel:auth` |
| Database (Supabase) | `supabase:supabase` + `supabase:supabase-postgres-best-practices` |
| Storage (Vercel Blob, Neon, Upstash) | `vercel:vercel-storage` |
| Cache | `vercel:runtime-cache` + `vercel:next-cache-components` |
| ORM Supabase | `supabase:supabase` |
| Styling (shadcn) | `vercel:shadcn` |
| AI SDK (streaming, tools, agents) | `vercel:ai-sdk` |
| AI Gateway (multi-provider, failover) | `vercel:ai-gateway` |
| Chatbot multi-platform | `vercel:chat-sdk` |
| Claude API/SDK direto | `claude-api` |
| Workflow/durável | `vercel:workflow` |
| Sandbox (exec untrusted code) | `vercel:vercel-sandbox` |
| Next.js framework | `vercel:nextjs` + `vercel:next-cache-components` + `vercel:next-upgrade` |
| Turbopack | `vercel:turbopack` |
| Functions (serverless/edge) | `vercel:vercel-functions` |
| Routing middleware | `vercel:routing-middleware` |
| Marketplace integrations | `vercel:marketplace` |
| Error monitoring | `sentry:sentry-sdk-setup` + `sentry:sentry-workflow` |
| Infra não-Vercel (Railway) | `railway:use-railway` |
| UI criativa | `frontend-design:frontend-design` |
| Figma → código | `figma:figma-implement-design` |

## Enforcement

- ag-6-iniciar DEVE aplicar o template padrão ao criar projeto E invocar skills canonicals
- ag-1-construir DEVE verificar deps antes de instalar
- Se lib rejeitada for detectada em `npm install` → alertar o usuário
- Ao configurar AI feature: preferir `vercel:ai-sdk` antes de escrever call direto a provider
