# Governanca de Incorporacao de Software

## Regra Principal
Toda incorporacao de software externo ao rAIz Platform segue o Playbook 11.
Incorporacao sem due diligence (ag-32) e BLOQUEADA.

## Workflow Obrigatorio

```
ag-32 Due Diligence → GO/NO-GO
  ↓ (se GO)
ag-33 Mapear Integracao → integration-map.md
  ↓
ag-34 Planejar Incorporacao → roadmap.md + task_plan.md
  ↓
ag-35 Incorporar Modulo → execucao fase a fase
  ↓ (por fase)
ag-12 Validar + ag-13 Testar + ag-15 Auditar
```

## Regras Inegociaveis

1. **Anti-Corruption Layer**: TODA conexao entre sistema externo e rAIz usa ACL
2. **Feature Flags**: TODO codigo de incorporacao atras de flag (default: off)
3. **Zero impacto core**: rAIz Platform NAO e modificado para acomodar externo
4. **Rollback por fase**: Cada fase tem plano de rollback testado
5. **RLS obrigatorio**: Tabelas de incorporacao seguem mesmas regras de seguranca
6. **Incremental**: Uma fase por vez, nunca big bang
7. **Documentacao**: Cada incorporacao tem pasta `incorporation/[nome]/`

## Estrutura de Documentacao

```
incorporation/
└── [nome-sistema]/
    ├── due-diligence-report.md
    ├── integration-map.md
    ├── roadmap.md
    ├── task_plan_fase_N.md
    ├── risk-register.md
    ├── progress.md
    ├── decisions/
    └── postmortem.md
```

## Naming Conventions

- Branch: `feat/incorp-[nome]-[modulo]`
- Commits: `feat(incorp-[nome]): [descricao]`
- Migrations: `YYYYMMDDHHMMSS_incorp_[nome]_[descricao].sql`
- Feature flags: `incorp_[nome]_[feature]`
- Adapter files: `src/lib/incorporation/[nome]/adapter.ts`

## Cadencia de Review

- Por modulo: ag-12 (validar) + ag-13 (testar)
- Por fase: ag-14 (review) + ag-15 (audit)
- Por incorporacao: postmortem com licoes
