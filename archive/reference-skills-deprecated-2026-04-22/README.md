# Deprecated Reference Skills — archived 2026-04-22

## Razão

5 reference skills foram deprecadas em 2026-04-22 por redundância:

| Skill deprecada | Canonical substituto | Razão |
|---|---|---|
| `/ag-referencia-supabase` | `supabase:supabase` (plugin oficial) | Plugin oficial mantido pela Supabase, mais atualizado |
| `/ag-referencia-nextjs` | `vercel:nextjs` (plugin oficial) | Plugin oficial mantido pela Vercel, cobre App Router/RSC/middleware |
| `/ag-referencia-typescript` | inline em CLAUDE.md + code context | Convenções TS já estão no CLAUDE.md + analyzer LSP cobre uso real |
| `/ag-referencia-qualidade` | `.claude/rules/quality-gate.md` | Rule carrega automaticamente em system-reminders, zero friction |
| `/ag-referencia-design-library` | `~/Claude/assets/design-library/catalog.md` | Catálogo direto em assets, consultado pelas machines |

## Reference skills mantidas (6 de 11)

- `/ag-referencia-roteamento` — árvore de decisão expandida (sem equivalente)
- `/ag-referencia-sdd` — metodologia SDD (sem equivalente)
- `/ag-referencia-stack-decisions` — stack approved (sem equivalente)
- `/ag-referencia-anti-ciclo-preditivo` — 30+ regras ML (densa, sem equivalente)
- `/ag-referencia-mock-first` — metodologia específica (sem equivalente)
- `/ag-referencia-python` — patterns Python (manter até ter equivalente oficial)
- `/ag-referencia-seguranca-rules` — contexto RLS/LGPD específico

## Rollback

```bash
cd ~/Claude/.claude
git mv archive/reference-skills-deprecated-2026-04-22/ag-referencia-supabase skills/ag-referencia-supabase
# etc
```

## Referências

- ADR-0001: `.claude/shared/adr/ADR-0001-consolidacao-pos-opus-47.md`
- Execution plan: `~/Claude/docs/diagnosticos/2026-04-22-execution-plan.md`
