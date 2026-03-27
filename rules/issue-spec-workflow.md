# Issue → SPEC → Verify Workflow (Obrigatorio)

## Regra Principal

TODA GitHub Issue que sera implementada DEVE passar pelo pipeline:

```
Issue → SPEC → [Plan] → Build → Verify vs SPEC → Test → PR (closes #N)
```

## Quando aplicar

- Usuario diz "implementar issue #N", "resolver issue #N", "trabalhar na issue #N"
- ag-0-orquestrador classifica intent como trabalho baseado em issue
- ag-registrar-issue criou uma issue que agora sera resolvida
- Qualquer referencia a "issue", "ticket", "#N" seguida de intent de implementacao

## Como aplicar

Spawnar ag-pipeline-issue-issue-pipeline. Ele orquestra tudo.

```
Agent({
  subagent_type: "ag-pipeline-issue-issue-pipeline",
  mode: "auto",
  run_in_background: false,
  prompt: "Issue: #[number]\nRepo: [owner/repo]\nProjeto path: [path]"
})
```

## Artifacts obrigatorios

| Artifact | Path | Obrigatorio |
|----------|------|-------------|
| SPEC | `docs/specs/issue-[number]-spec.md` | SEMPRE |
| Plan | `docs/specs/issue-[number]-plan.md` | Features e bugs complexos |
| Testes | junto ao codigo | SEMPRE |
| PR | GitHub PR com `closes #N` | SEMPRE |

## NUNCA

- Implementar issue sem SPEC (nem bug simples — usar SPEC minimal)
- Criar PR sem verificacao vs SPEC documentada
- Fechar issue sem testes correspondentes
- Apagar SPECs apos merge (documentacao permanente)

## Bypass (unico caso)

- Issues com label `hotfix` ou severidade P0: fix PRIMEIRO, SPEC retroativa
- Mesmo no bypass, verificacao e testes sao OBRIGATORIOS
