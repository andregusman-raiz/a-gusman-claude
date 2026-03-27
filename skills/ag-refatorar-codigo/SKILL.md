---
name: ag-refatorar-codigo
description: "Reestruturacao sem mudanca de comportamento. Extrair modulo, renomear em cascata, reorganizar. Cada passo com commit. Use when refactoring code structure."
model: sonnet
argument-hint: "[modulo ou padrao a refatorar]"
disable-model-invocation: true
---

# ag-refatorar-codigo — Refatorar Codigo

Spawn the `ag-refatorar-codigo` agent to restructure code without changing behavior.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-refatorar-codigo`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Escopo: [module or pattern to refactor from $ARGUMENTS]


## Output
- refactor-report.md com analise antes/depois
- Commits incrementais (1 por step de refatoracao)
- Testes existentes continuam passando (zero regressao)

Protocolo incremental:
1. Mudar UMA coisa → Rodar testes → Pass → Commit
2. Repetir ate completar escopo
3. Se teste falha → Revert → Investigar

Pre-condicao: RECUSAR se nao existem testes.
Output: refactor-report.md (antes → depois, arquivos, commits, diagrama).
Worktree isolation ativo.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the refactor agent is running
- REFUSES to refactor without existing passing tests
- Each step is a separate commit for safe rollback
- Uses worktree isolation

### Code Smell → Refactoring Map

| Code Smell | Refactoring | Trigger |
|-----------|-------------|---------|
| Funcao > 40 linhas | Extract Function | Limites Clean Code |
| Classe > 300 linhas | Extract Class | Limites Clean Code |
| Switch/if-else chain (>= 3 branches) | Replace Conditional with Polymorphism | Complexidade |
| Primitivo com regras de dominio | Replace Primitive with Value Object | Email, Money, CPF |
| Parametros demais (>3) | Introduce Parameter Object | Clean Code limit |
| Feature Envy | Move Method | Metodo usa mais dados de outra classe |
| Duplicacao | Extract Method + reuse | DRY |

### Regras de Ouro para Refatoracao
1. **NUNCA refatorar sem testes passando** — testes sao a rede de seguranca
2. **NUNCA misturar refactoring e feature no mesmo commit** — impossibilita rollback
3. **Cada passo deve manter testes verdes** — se quebraram, reverter imediatamente
4. **Preferir refatoracoes pequenas e incrementais** — 5 commits pequenos > 1 commit grande
