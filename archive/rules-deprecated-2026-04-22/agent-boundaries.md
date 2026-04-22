---
description: "Regras de ownership de arquivos para agents paralelos"
paths:
  - "**/*"
---

# Protocolo de Boundaries para Agents Paralelos

## Principio
Quando multiplos agents trabalham em paralelo, CADA agent tem ownership exclusivo.

## Regra Zero: Path Absoluto Obrigatorio
Ao spawnar QUALQUER agent (especialmente cross-repo), SEMPRE especificar o path absoluto do repo-alvo no prompt.
NUNCA confiar que o CWD herdado e correto — agents herdam o diretorio da sessao pai, que pode ser outro repo.
Exemplo: "Trabalhe no repo em ~/Claude/GitHub/raiz-platform/" (nao apenas "no raiz-platform")

## Regras de Ownership

### 1. Declarar Escopo Antes de Executar
Cada agent recebe:
- Lista EXPLICITA de arquivos que pode modificar
- Lista de arquivos que NAO pode tocar
- Escopo de commits

### 2. Sem Overlap
Se dois agents precisam do mesmo arquivo → NAO paralelizar.

### 3. Arquivos Compartilhados (Read-Only)
- package.json / lock files
- tsconfig.json / configs de build
- middleware / tipos compartilhados / .env

Se agent precisa modificar shared file → reportar ao coordinator.

### 4. Coordinator Responsabilidades
- Dividir tasks em grupos independentes
- Atribuir ownership explicito
- Verificar que nao ha overlap
- Merge apenas branches verdes
- Resolver conflicts

### 5. Validation Gate por Agent
Antes de merge:
- Typecheck passando
- Lint passando
- Commit com mensagem descritiva

### 6. Limites de Paralelismo
- Max 4 agents paralelos
- Max 8 arquivos por agent
- Se total < 6 tasks → usar sequencial

### 7. Limites de Recursos (Memory Safety)
MacBook Pro M5 com 36GB RAM — proteger contra memory overflow.

**Regra: max 4 sessoes Claude Code simultaneas**

| Cenario | Sessoes | Subagents/sessao | Total estimado |
|---------|---------|-------------------|----------------|
| Conservador | 2 | 2 | ~16GB |
| Normal | 3 | 3 | ~27GB |
| Agressivo | 4 | 3 | ~36GB |
| MAX (nunca exceder) | 5 | 2 | ~35GB |

**Dentro de cada sessao (Agent Teams):**
- Max 4 teammates simultaneos (nao 5)
- Cada teammate sem subagents proprios (flat, nao nested)
- `TeamDelete` IMEDIATO apos teammates terminarem (liberar memoria)
- Preferir sequencial (ag-corrigir-bugs) quando < 6 tasks

**MCP servers:**
- Subagents herdam MCPs da sessao pai — NAO iniciar MCPs extras
- Se sessao nao precisa de browser → nao carregar playwright/chrome-devtools

**Monitoramento durante execucao paralela:**
```bash
# Verificar memoria antes de spawnar mais agents
memory_pressure  # macOS: normal/warn/critical
# Se warn ou critical → NAO spawnar mais agents, aguardar os atuais
```

**iTerm2 + tmux:**
- `teammateMode: "tmux"` ativo — Agent Teams abrem em split panes nativos via `tmux -CC`
- Scrollback: max 10.000 linhas (Settings → Profiles → Terminal)
- Fechar panes/sessoes inativas — tmux e iTerm2 mantém processos vivos
- Usar `tmux ls` para verificar sessoes ativas antes de spawnar novos agents
- Prefix `Ctrl+A` (nao `Ctrl+B`) — remapeado para evitar conflito com Claude Code

## Enforcement por ag-0-orquestrador

ag-0-orquestrador DEVE recusar paralelismo se:
1. Agents modificam codigo SEM `isolation: "worktree"`
2. Overlap de arquivos > 0
3. Memory pressure em warn/critical

Acao: "Executando sequencialmente por seguranca."

## Anti-Patterns
- NUNCA agents sem escopo definido
- NUNCA dois agents no mesmo arquivo
- NUNCA merge branch sem validation
- NUNCA modificar package.json em paralelo
- NUNCA spawnar agents sem verificar memory_pressure
- NUNCA manter Teams vivos apos conclusao (TeamDelete obrigatorio)
