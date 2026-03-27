---
description: "Prevenir perda de edicoes por context compaction ou interrupcao"
paths:
  - "**/*"
---

# Edit Persistence Safety

## Problema
Edicoes planejadas podem ser perdidas quando:
1. Context compaction descarta historico de tool calls
2. Sessao e interrompida entre edicoes
3. Agent faz edicoes em worktree isolado sem avisar
4. Multiplas edicoes acumuladas sem checkpoint (git status)

## Regras OBRIGATORIAS

### 1. Verificar Persistencia Apos Edicoes
Apos cada BATCH de edicoes (2-3 arquivos), rodar:
```bash
git diff --stat
```
Se output vazio → edicoes NAO foram salvas. Re-executar.

### 2. Nunca Acumular Mais de 3 Edicoes Sem Verificacao
- Editar ate 3 arquivos
- `git diff --stat` para confirmar que mudancas existem no disco
- So entao continuar com proximas edicoes

### 3. Checkpoint Antes de Operacoes Longas
Antes de qualquer operacao que pode causar compaction (exploracao de codebase, leitura de muitos arquivos, chamadas de ferramentas pesadas):
- Commitar trabalho em andamento: `git add -p && git commit -m "wip: checkpoint"`
- Ou pelo menos confirmar com `git status` que edicoes estao no disco

### 4. Se Working Tree Limpo Inesperadamente
Quando esperava mudancas mas `git status` mostra working tree limpo:
1. **NAO assumir hook/revert** — provavelmente edicoes nunca foram salvas
2. Verificar `git reflog` para ver se houve checkout/reset recente
3. Verificar `git stash list` para ver se alguem fez stash
4. Se nenhum dos acima → edicoes foram perdidas por compaction/interrupcao
5. Re-executar as edicoes (o Claude deve re-ler os arquivos e re-aplicar)

### 5. Agents com Worktree
Quando agent usa `isolation: "worktree"`:
- Edicoes vao para `.claude/worktrees/`, NAO para o diretorio principal
- O agent DEVE avisar onde as edicoes estao ao terminar
- O coordinator DEVE fazer merge do worktree para o branch principal

### 6. Antes de Declarar "Working Tree Limpo"
NUNCA assumir que "algo reverteu". Verificar:
```bash
git reflog -5          # Houve checkout/reset recente?
git stash list         # Alguem fez stash?
git diff --stat        # Realmente nao ha mudancas?
git log -1 --stat      # O ultimo commit contem as edicoes?
```
So apos essas 4 verificacoes, concluir o que aconteceu.

## Anti-Pattern Principal
```
# ERRADO: fazer 10 edicoes, assumir que todas foram salvas
Edit file1 → Edit file2 → ... → Edit file10 → git commit

# CORRETO: verificar persistencia a cada batch
Edit file1 → Edit file2 → Edit file3 → git diff --stat → continuar
```
