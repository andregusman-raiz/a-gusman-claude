---
description: "Prevencao de memory leaks por processos orfaos"
paths:
  - "**/*"
---

# Memory Safety — Prevencao de Leaks

## TypeCheck: EVITAR tsc --noEmit full

O raiz-platform consome ~3.5GB e 1:50min por `tsc --noEmit`. NUNCA rodar como hook.

### Regras

1. **Para validacao rapida de arquivos especificos**, usar:
   ```bash
   bunx tsc --noEmit path/to/file.ts --skipLibCheck
   ```
2. **Para typecheck completo**, rodar SOMENTE quando explicitamente pedido
3. **NUNCA rodar multiplos tsc simultaneos** — verificar antes: `pgrep -f "tsc" | wc -l`
4. SEMPRE usar timeout: max 3 minutos
5. Em subagents: usar `NODE_OPTIONS=--max-old-space-size=2048`

### Cleanup Automatico

- Cron de sistema roda `cleanup-orphans.sh` a cada 5 minutos
- `Stop` hook roda cleanup ao final da sessao
- `memory-guard.sh` faz cleanup proativo antes de spawnar agents
- Manual: `bash ~/Claude/.claude/scripts/cleanup-orphans.sh`

## TypeCheck Leve via LSP (alternativa para agents durante build)

Quando agent precisa validar tipos DURANTE implementacao (nao no gate final):
1. Usar LSP tool (`hover`, `documentSymbol`) nos arquivos modificados — instantaneo, sem custo de memoria
2. LSP ja esta configurado (`typescript-lsp`) e mantém indice do projeto em memoria
3. **NÃO substitui** o `tsc --noEmit` do quality gate final
4. Usar para: ag-implementar-codigo, ag-construir-validado, ag-corrigir-bugs durante execucao iterativa
5. NAO usar para: ag-validar-execucao, ag-pipeline-deploy, quality gate final (esses precisam de garantia completa)

### Quando usar cada um

| Momento | Ferramenta | Custo |
|---------|-----------|-------|
| Durante build (a cada arquivo) | LSP hover/diagnostics | ~0 mem, instantaneo |
| Validacao parcial (arquivos tocados) | `bunx tsc --noEmit path/file.ts --skipLibCheck` | ~500MB, ~10s |
| Quality gate final (self-check) | `bun run typecheck` (tsc full) | ~3.5GB, ~2min |

## Dev Server: NAO deixar rodando em background

- `bun run dev` consome 4-5GB neste projeto
- NAO rodar em background a menos que necessario para testes
- Se rodou, matar ao terminar: `pkill -f "next-server"`

## Processos que Vazam Memoria

| Processo | Consumo | Causa do Leak |
|----------|---------|---------------|
| `tsc --noEmit` | 2-3.5GB / 1:50min | Timeout do agent, processo continua |
| `next-server` (dev) | 4-5GB | Esquecido rodando em background |
| Playwright Chrome | 30-50MB cada | Testes E2E nao fazem cleanup |
