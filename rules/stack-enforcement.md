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

## Enforcement

- ag-6-iniciar DEVE aplicar o template padrão ao criar projeto
- ag-1-construir DEVE verificar deps antes de instalar
- Se lib rejeitada for detectada em `npm install` → alertar o usuário
