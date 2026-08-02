---
description: "Prevencao de memory leaks por processos orfaos"
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Memory Safety — Prevencao de Leaks

## TypeCheck

`tsc --noEmit` full no raiz-platform = ~3.5GB / ~2min. NUNCA como hook; NUNCA multiplos simultaneos (`pgrep -f tsc | wc -l` antes); sempre timeout <=3min.

| Momento | Ferramenta | Custo |
|---------|-----------|-------|
| Durante build (a cada arquivo) | LSP hover/diagnostics (typescript-lsp) | ~0 |
| Validacao parcial | `bunx tsc --noEmit path/file.ts --skipLibCheck` | ~500MB, ~10s |
| Quality gate final | `bun run typecheck` (full) | ~3.5GB, ~2min |

LSP NAO substitui o tsc full do gate final. Subagents: `NODE_OPTIONS=--max-old-space-size=2048`.

## Processos

- Dev server (`bun run dev` = 4-5GB): NAO deixar em background; matar ao terminar (`pkill -f next-server`).
- Playwright Chrome: fechar apos E2E.
- Cleanup: `cleanup-orphans.sh` (cron 5min + SessionStart hook); `memory-guard.sh` roda antes de TeamCreate.
