---
name: ag-migrar-dados
description: "Gera e valida migration files para mudancas de schema de banco de dados. Detecta ORM do projeto e gera migrations no formato nativo."
model: sonnet
argument-hint: "[descricao da mudanca de schema]"
disable-model-invocation: true
---

# ag-migrar-dados — Migrar Dados

Spawn the `ag-migrar-dados` agent to create and validate database schema migrations.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-migrar-dados`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Schema change: [descricao da mudanca — nova tabela, alteracao, backfill]
ORM: [supabase, prisma, drizzle, ou "auto-detect"]


Gerar migration com naming YYYYMMDDHHMMSS_descricao.sql, verificar conflitos de timestamp, constraints e indices existentes.
Incluir RLS policies e rollback. Validar antes de aplicar.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- NOT background — migrations require sequential validation
- Supports modes: criar (new table), alterar (modify), backfill (data), validar (check pending)
- Always includes RLS policies and rollback plan
