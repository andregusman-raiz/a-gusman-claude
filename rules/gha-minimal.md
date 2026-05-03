# GitHub Actions — Uso Mínimo

## Princípio

GHA é **último recurso**. A stack canônica (Vercel + Supabase + Railway + Sentry) cobre ~85% dos casos sem workflow custom. Cada `.github/workflows/*.yml` adiciona: tempo de build, manutenção de YAML, secrets duplicados, tokens GHA, drift entre CI local (lint-staged) e CI remoto.

## Origem da regra

Auditoria 2026-05-03 cobriu 12 projetos do workspace, 60+ workflows:

- **data-engine-app**: 36 workflows (16 crons substituíveis por Railway cron, 5 CI substituíveis, 4 manuais migráveis)
- **example-platform**: 17 workflows (15 substituíveis por Vercel CI / Advanced Security / Supabase Functions)
- **8 projetos Next.js puros**: ci.yml redundante (Vercel CI já cobre)
- **6 essenciais identificados** no workspace inteiro: TOTVS MSSQL backfills, report-app Fabric sync (ODBC), example-scraper Python, example-platform CLI release, scraper VPS deploy, migration-governance + contracts

Ver `~/Claude/CLAUDE.md` seção "GitHub Actions — Uso Mínimo" para a matriz pública.

## Matriz de decisão (consultar SEMPRE antes de criar workflow)

| Necessidade | Solução PRIMÁRIA (sem GHA) | GHA whitelisted? |
|---|---|---|
| CI typecheck/lint/test em PR | Vercel CI nativo + pre-commit local | NÃO |
| Deploy preview/produção | Vercel Git Integration | NÃO (a menos VPS self-hosted) |
| Cron / scheduled jobs | Supabase pg_cron, Railway cron, Vercel Cron Jobs | NÃO (a menos > 5min CPU + sem acesso) |
| Secret scanning | GitHub Advanced Security (push protection) | NÃO |
| CodeQL / SAST | GitHub Advanced Security (native) | NÃO |
| Dependency audit | Dependabot (native) | NÃO |
| DAST / OWASP | Vercel Security Advisor / Snyk | NÃO |
| Visual regression | Vercel Preview + Chromatic / Percy | NÃO |
| Auto-rollback | Vercel Rollback API + Sentry monitor webhook | NÃO |
| Sync de dados (HubSpot/Layers/Zeev) | Railway worker + cron | NÃO |
| Backfill manual | CLI script no repo + Railway job trigger | NÃO |

## Whitelist — 4 únicos casos com GHA

Só estes casos justificam workflow custom:

### W1 — Acesso a recurso legado de IP fixo / VPN
TOTVS MSSQL/ODBC/SOAP atrás de IP fixo whitelistado, drivers que Vercel/Railway runtime não suportam. Exemplo: `totvs-mssql-backfill.yml` (ADR-041 data-engine-app).

### W2 — Build/release de binário multi-plataforma
CLI distribuído via npm/Homebrew/winget exige matrix build (linux/macos/windows). Exemplo: `cli-release.yml` (example-platform).

### W3 — Deploy em VPS self-hosted
Sem integração Vercel/Railway. Exemplo: `deploy-scraper-service.yml` (example-platform).

### W4 — PR gate DB-first (psql + dbt + migrations)
Validação de schema/contracts que precisa de runner com psql + dbt instalado. Exemplo: `migration-governance.yml`, `contracts-validation.yaml` (data-engine-app). **Temporário** — migrar para Vercel CI quando viável.

## Formato obrigatório no YAML

Todo `.github/workflows/*.yml` novo DEVE começar com:

```yaml
# JUSTIFICATIVA-GHA: <W1|W2|W3|W4> — <descrição em 1 linha>
# ALTERNATIVA-DESCARTADA: <opção nativa avaliada e razão de não servir>
```

Sem essas duas linhas, o workflow não passa em code review.

## Regra para projeto NOVO

`/ag-6-iniciar projeto` e `/ag-1-iniciar-projeto` (ag-criar-projeto):

1. **NÃO** geram `.github/workflows/ci.yml` por default
2. Geram em vez disso:
   - `.husky/pre-commit` com `lint-staged` rodando typecheck + lint
   - `package.json` script `check`: `bun run typecheck && bun run lint && bun run test`
   - `vercel.json` com `buildCommand: "bun run check && bun run build"`
3. Mensagem ao usuário: "CI roda em Vercel (preview/prod). Para gates locais: `bun run check`."

## Regra para projeto EXISTENTE

Antes de **adicionar** workflow novo a projeto existente:

1. Rodar pergunta: "Existe alternativa Vercel/Supabase/Railway/GHA-Advanced-Security?"
2. Se sim → usar a alternativa
3. Se não → enquadrar no W1-W4 e adicionar header de justificativa

Antes de **modificar** workflow existente:

1. Verificar se o workflow ainda é necessário (auditoria 2026-05-03 listou ~50 candidatos a remoção)
2. Se substituível → propor remoção em vez de modificação

## Bypass

```bash
export GHA_GUARD_DISABLED=1   # bypass apenas desta sessão
```

Bypass permanente exige ADR (`docs/adr/`) com:
- Caso de uso
- Por que stack canônica não cobre
- Plano de remoção quando alternativa existir

## Anti-patterns (PROIBIDOS)

- `ci.yml` em Next.js puro com Vercel deploy ativo → redundante
- `schedule:` cron em workflow para sync de dados → migrar para Railway cron
- `codeql.yml` / `secret-scanning.yml` / `dep-audit.yml` custom → ativar GitHub Advanced Security
- `staging-deploy.yml` / `deploy-gate.yml` → Vercel Git Integration faz isso
- Workflow `workflow_dispatch` para "diagnose" / "fix" → criar CLI script no repo
- Adicionar workflow sem `JUSTIFICATIVA-GHA:` no header

## Plano de migração (referência, não-bloqueante)

| Prioridade | Ação | Workflows afetados |
|---|---|---|
| P0 | Remover ci.yml de Next.js puros com Vercel | 5 (legal-app, auditoria-raiz, example-prof, fin-platform, payroll-app) |
| P0 | Migrar crons data-engine-app para Railway cron | 16 |
| P1 | Ativar GitHub Advanced Security; remover security customs | 5 |
| P1 | CLI scripts + Supabase Functions p/ manual ops | 8 |
| P2 | Smoke tests para Vercel preview tests | 4 |
| baseline | Manter 6 workflows essenciais documentados | 6 |

Resultado projetado: **60+ → 6** (-90%).

## Enforcement

- `ag-6-iniciar` / `ag-criar-projeto` / `ag-01-iniciar-projeto`: NÃO geram ci.yml por default
- `ag-02-setup-ambiente` / `ag-preparar-ambiente`: NÃO geram workflows GHA por default; geram husky + vercel.json
- Code review (incluindo `ag-revisar-codigo`, `ag-criticar-projeto`): bloquear PRs com novos `.github/workflows/*.yml` sem header `JUSTIFICATIVA-GHA:`
- ADR obrigatório para criar 2º workflow no mesmo repo (a menos que ambos estejam na whitelist W1-W4)
