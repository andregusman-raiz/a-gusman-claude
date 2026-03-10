# Cost Optimization Patterns (Cross-Project)

## Model Routing

### Regra: usar o modelo mais barato que resolve a tarefa

| Complexidade | Modelo | Custo Relativo | Agentes Tipicos |
|-------------|--------|----------------|-----------------|
| Scans, lookups, formatacao | Haiku | 1x | ag-03 explore, ag-28 health |
| Implementacao, debug, review | Sonnet | 5x | ag-08 build, ag-13 test, ag-14 review |
| Arquitetura, specs, analise profunda | Opus | 25x | ag-00 orq, ag-04 analisar, ag-06 spec |

### Default Model
```bash
# Sonnet como default (80% cost savings vs Opus)
export CLAUDE_CODE_MODEL=claude-sonnet-4-6
# Mudar para Opus APENAS para: arquitetura, specs complexas, analise profunda
```

## Token Efficiency

### /clear entre tarefas
Contexto acumulado de tarefa anterior polui a proxima E custa tokens.
```
Tarefa A → /clear → Tarefa B → /clear → Tarefa C
```

### /compact proativo
```bash
# Ativar compaction agressiva
export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=60
```
Ao compactar, preservar: arquivos modificados, task atual, comandos de teste.

### Subagents para exploracao
Investigacao de codebase em subagent = context separado, nao polui o principal.
Cada subagent recebe 200K de context proprio.

## Budget Safety

### Sessoes autonomas
```bash
# Sempre definir budget maximo
claude -p "tarefa..." --max-budget-usd 10.00

# Para batch operations
claude -p "tarefa..." --max-budget-usd 5.00 --model claude-sonnet-4-6
```

### Monitoramento
- Verificar custo acumulado periodicamente durante sessoes longas
- Se tarefa esta consumindo mais que o esperado → /compact ou /clear + retomar

## CLAUDE.md Conciseness

### Cada linha no CLAUDE.md = tokens em TODA mensagem da sessao
- Remover instrucoes redundantes
- Usar tabelas em vez de listas longas
- Mover detalhes para skills/rules (carregados sob demanda)
- Evitar exemplos extensos — 1 exemplo bom vale mais que 5 mediocres

### Reducao de contexto automatico
```
CLAUDE.md: ~200 linhas max
Rules: carregar por relevancia (nao todas sempre)
Skills: disable-model-invocation para as que nao precisam de LLM
```

## Batch Operations

### Bulk em vez de one-by-one
```typescript
// MAL — N queries
for (const item of items) {
  await supabase.from('items').insert(item);
}

// BOM — 1 query
await supabase.from('items').insert(items);
```

### File operations
```bash
# MAL — N chamadas de ferramenta
Read file1.ts → Read file2.ts → Read file3.ts

# BOM — paralelo (todas na mesma mensagem)
# Ler file1.ts, file2.ts, file3.ts simultaneamente
```

## Caching para LLM

### Evitar re-computacao
- Salvar resultados de analises longas em arquivos (session-state.json, diagnostico.md)
- Reutilizar specs/PRDs existentes em vez de regenerar
- Cache de resultados de grep/search em variaveis quando usado multiplas vezes

### Prompt caching
- Prefixos longos e estaveis se beneficiam de cache automatico
- CLAUDE.md estavel = cache hit em toda mensagem

## Metricas de Custo

| Metrica | Target | Como medir |
|---------|--------|------------|
| Modelo correto por tarefa | 90%+ | Audit de sessoes |
| /clear entre tarefas | 100% | Observacao |
| Budget autonomo definido | 100% | Flag --max-budget-usd |
| Context < 60% ao compactar | 100% | /compact proativo |
| Batch vs sequential | Sempre batch | Code review |

## NUNCA
- Usar Opus para tarefas que Sonnet resolve
- Sessoes autonomas sem --max-budget-usd
- Acumular contexto de 3+ tarefas sem /clear
- CLAUDE.md com > 300 linhas
- Re-analisar codebase inteiro quando precisa de 1 arquivo
- Inline docs grandes no CLAUDE.md (usar @reference)
