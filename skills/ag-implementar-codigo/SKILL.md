---
name: ag-implementar-codigo
description: "Implementa codigo seguindo o plano do ag-planejar-execucao. Re-le o plano a cada 10 acoes. Salva progresso a cada 5 acoes. Self-check antes de declarar pronto. Use when building/implementing code from a plan."
model: sonnet
argument-hint: "[projeto-path] [scope/modulos]"
disable-model-invocation: true
---

# ag-implementar-codigo — Construir Codigo

Spawn the `ag-implementar-codigo` agent to implement code following a task plan.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-implementar-codigo`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Dynamic Context
- **Branch**: !`git branch --show-current 2>/dev/null || echo "no-git"`
- **Task plan**: !`cat task_plan.md 2>/dev/null | head -30 || echo "none"`

## Prompt Template

```
Projeto: [CWD or user-provided path]
Branch: [from dynamic context]
Scope: [modules/scope from $ARGUMENTS]


Implementar seguindo task_plan.md:
- Re-ler plano a cada 10 acoes
- Commit incremental a cada 5 acoes
- Durante build: usar LSP tool (hover/documentSymbol) para validar tipos dos arquivos modificados (instantaneo, sem custo de memoria)
- Self-check FINAL (tsc full + lint + test) apenas antes de declarar pronto
- Para 3+ modulos independentes, usar Agent Teams (parallel build)

Worktree isolation ativo. Codigo que funciona > codigo perfeito.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the build agent is running
- Supports parallel build via Agent Teams for 3+ independent modules
- Uses worktree isolation for safe implementation

## Output
- Codigo funcional implementando todos os itens do task_plan.md
- Commits incrementais (1 a cada 5 arquivos modificados)
- session-state.json atualizado com progresso
- Handoff para ag-validar-execucao apos self-check passar

## Anti-Patterns
- NUNCA implementar sem ler o plano primeiro — task_plan.md e vinculante
- NUNCA acumular 10+ arquivos sem commit — context reset perde trabalho nao salvo
- NUNCA ignorar erros de typecheck para "avancar" — debt tecnico retorna multiplicado
- NUNCA deixar TODOs/stubs e marcar como done — "parcial" nao e "done"
- NUNCA refatorar ou otimizar durante build — agentes especializados existem (ag-refatorar-codigo, ag-otimizar-codigo)

## Exemplos

### Lendo task_plan.md e extraindo items
```bash
# O agente deve ler o plano e extrair uma lista de items:
cat task_plan.md | grep -E "^- \[ \]" | head -20
# Cada item vira um "step" a implementar
```

### Commit incremental (a cada 5 acoes)
```bash
# Apos implementar 5 items ou 5 arquivos:
git add src/lib/auth.service.ts src/lib/auth.types.ts
git commit -m "feat(auth): implement login and token validation"
# Continuar com proximos items
```

### Self-check antes de declarar pronto
```bash
# Comparar plano vs codigo:
# 1. Reler task_plan.md
# 2. Para cada item: verificar que existe no codigo
# 3. Rodar quality gates:
bun run typecheck && bun run lint && bun run test
# Se tudo passa → declarar pronto
# Se falha → corrigir antes de declarar
```

### Lidando com bloqueio
```bash
# 1. Ler errors-log.md para nao repetir tentativas
cat docs/ai-state/errors-log.md 2>/dev/null
# 2. Tentar abordagem alternativa
# 3. Se bloqueado 2x no mesmo problema → documentar e escalar
echo "BLOCKED: [descricao] — tentei X e Y, ambos falharam" >> docs/ai-state/errors-log.md
```

## Quality Gate
- [ ] Self-check de completude executado (releu task_plan, cada item: done/parcial/faltando)?
- [ ] Codigo compila e roda sem erros (`bun run build && bun run typecheck`)?
- [ ] session-state.json atualizado com progresso?
- [ ] errors-log.md atualizado se erros ocorreram?
- [ ] task_plan.md com 100% dos items marcados como done?

### SOLID Checklist (Self-Check Adicional)
Antes de declarar implementacao pronta, verificar:
- [ ] **SRP**: Cada classe/modulo tem 1 motivo para mudar?
- [ ] **OCP**: Novo comportamento via extensao (Strategy/Plugin), nao via if/else?
- [ ] **LSP**: Subtipos substituiveis sem quebrar contrato?
- [ ] **ISP**: Interfaces coesas, sem metodos desnecessarios?
- [ ] **DIP**: Dependencias injetadas via interface, nao importacao direta?

### Clean Code Limits (Self-Check Adicional)
- [ ] Funcoes <= 40 linhas?
- [ ] Arquivos <= 300 linhas?
- [ ] Parametros <= 3 por funcao (usar objeto se mais)?
- [ ] Aninhamento <= 3 niveis?
- [ ] Zero numeros magicos (usar constantes nomeadas)?
- [ ] Zero ternarios aninhados?

