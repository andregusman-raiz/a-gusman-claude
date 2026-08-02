# Deprecated Agents — archived 2026-04-22

## Razão da deprecação

Os 58 arquivos `.claude/agents/*.md` neste diretório foram deprecados em 2026-04-22 conforme **ADR-0001** (`.claude/shared/adr/ADR-0001-consolidacao-pos-opus-47.md`).

## Motivação

1. **Duplicação total com `.claude/skills/*/SKILL.md`** — cada agent aqui tinha um skill equivalente (mesmo nome, mesmo propósito), totalizando ~12.100 linhas redundantes entre as duas camadas.
2. **Alinhamento com direção Claude Code** — skills são a interface oficial (context: fork, invocação via `/`). Agents separados estão sendo descontinuados como conceito.
3. **Opus 4.7 com 1M context** — fragmentação em 2 camadas era necessária para limites antigos; agora é contraprodutiva.

## Como era usado antes

```
Agent tool → subagent_type: "ag-implementar-codigo" → resolvia via .claude/agents/ag-implementar-codigo.md
```

## Como é usado agora

```
Agent tool → subagent_type: "ag-implementar-codigo" → resolve via .claude/skills/ag-implementar-codigo/SKILL.md
```

## Rollback

Se alguma invocação quebrar por dependência neste diretório:

```bash
cd ~/Claude/.claude
git mv archive/agents-deprecated-2026-04-22/ agents
# ou
tar -xzf /tmp/agents-snapshot-2026-04-22.tar.gz
```

## Migração aplicada

Todos os 58 agents foram movidos via `git mv` (preserva histórico). Conteúdo único dos agents (seções que não existiam nas skills equivalentes) deve ter sido migrado antes — auditoria em `~/Claude/docs/diagnosticos/2026-04-22-agx-diagnostic/inventory.json`.

## Reference

- Diagnostic report: `~/Claude/docs/diagnosticos/2026-04-22-ag-x-diagnostic-report.md`
- ADR: `~/Claude/.claude/shared/adr/ADR-0001-consolidacao-pos-opus-47.md`
- Execution plan: `~/Claude/docs/diagnosticos/2026-04-22-execution-plan.md`
