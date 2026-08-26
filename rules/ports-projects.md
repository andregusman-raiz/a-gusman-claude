---
description: "Mapa porta->projeto (tabela inline no CLAUDE.md)"
paths:
  - "**/e2e/**"
  - "**/playwright.config.*"
---

# Ports — Projeto por Porta

| Porta | Projeto | Path | Dev |
|-------|---------|------|-----|
| **3000** | raiz-platform | `~/Claude/GitHub/raiz-platform/` | `npm run dev` |
| **3001** | profdigital | `~/Claude/GitHub/profdigital/` | `npm run dev -- -p 3001` |
| **3002** | automata | `~/Claude/GitHub/automata/` | `npm run dev -- -p 3002` |
| **3003** | totvs-educacional-frontend | `~/Claude/projetos/totvs-educacional-frontend/app/` | `npm run dev -- -p 3003` |
| **3004** | sophia-educacional-frontend | `~/Claude/projetos/sophia-educacional-frontend/` | `npm run dev -- -p 3004` |
| **3005** | fgts-platform | `~/Claude/GitHub/fgts-platform/` | `npm run dev` |
| **3006** | markdown-viewer (runtime global por projeto) | `~/.claude/skills/markdown-viewer/assets/app/` | `/markdown-viewer` |
| **4200** | raiz-agent-dashboard | `~/Claude/projetos/raiz-agent-dashboard/` | `npm run dev -p 4200` |
| **3007** | raiz-funil-auditor (`web/`, front "Centro de Operações" — SPEC pendente de aprovação, `docs/specs/SPEC-front-centro-operacoes.md`) | `~/Claude/Projetos/raiz-funil-auditor/web/` | `bun run dev` |

Porta 3000 NUNCA para 2 projetos ao mesmo tempo.

## Portas de serviço (backend/daemon, não `npm run dev`)

| Porta | Serviço | Path |
|-------|---------|------|
| **8001** | escuta-web (FastAPI) | `~/Claude/GitHub-raiz/escuta/` |
| **8765** | whisper-server (whisper.cpp) | local (brew) |
| **8790** | rosto-d (FastAPI, F-EX2) | `~/Claude/GitHub-pessoal/rosto/` |
| **8791** | visao-d (FastAPI, video intelligence) | `~/Claude/GitHub-pessoal/visao/` |
| **8792** | lousa-d (FastAPI, escrita no quadro; REST+SSE) | `~/Claude/GitHub-pessoal/lousa/` |
| **8793** | lousa sidecar InkSight (TensorFlow, loopback) | `~/Claude/GitHub-pessoal/lousa/sidecars/inksight/` |

## Persistencia Playwright

Profiles persistentes: `~/.cache/playwright-claude/`. SSO Google: 1 login → N apps via OAuth.

```bash
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --google         # setup unico
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --sso raiz-platform   # uso diario
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh totvs-educacional     # apps sem SSO
```

```ts
import { loginViaGoogleSso } from '~/Claude/.claude/shared/templates/e2e/persistent-context.helper';
const { context, page } = await loginViaGoogleSso('raiz-platform');
```

Em CI usar `storageState`, nao isso.
