# Ports — Projeto por Porta

| Porta | Projeto | Path | Dev |
|-------|---------|------|-----|
| **3000** | raiz-platform | `~/Claude/GitHub/raiz-platform/` | `npm run dev` |
| **3001** | profdigital | `~/Claude/GitHub/profdigital/` | `npm run dev -- -p 3001` |
| **3002** | automata | `~/Claude/GitHub/automata/` | `npm run dev -- -p 3002` |
| **3003** | totvs-educacional-frontend | `~/Claude/projetos/totvs-educacional-frontend/app/` | `npm run dev -- -p 3003` |
| **3004** | sophia-educacional-frontend | `~/Claude/projetos/sophia-educacional-frontend/` | `npm run dev -- -p 3004` |
| **3005** | fgts-platform | `~/Claude/GitHub/fgts-platform/` | `npm run dev` |
| **4200** | raiz-agent-dashboard | `~/Claude/projetos/raiz-agent-dashboard/` | `npm run dev -p 4200` |

Porta 3000 NUNCA para 2 projetos ao mesmo tempo.

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
