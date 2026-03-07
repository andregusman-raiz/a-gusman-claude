# Playbook 05: Otimizacao de Custos com IA

> Usar o modelo certo para a tarefa certa.

## Selecao de Modelo

### Por Tipo de Tarefa

| Tarefa | Modelo Recomendado | Justificativa |
|--------|-------------------|---------------|
| Arquitetura e design | Opus | Raciocinio complexo, decisoes criticas |
| Planejamento e SPEC | Opus / Sonnet | Estrutura, analise, decomposicao |
| Implementacao de codigo | Sonnet | Bom equilibrio qualidade/custo |
| Bug fixes simples | Sonnet / Haiku | Escopo limitado |
| Testes e reviews | Sonnet | Analise de codigo |
| Documentacao | Sonnet / Haiku | Geracao de texto |
| Quick tasks | Haiku | Rapido e barato |
| Exploracao de codebase | Sonnet | Entende contexto |

### Por Complexidade

```
Trivial (< 5 min)     → Haiku
Simples (5-30 min)     → Sonnet
Moderada (30 min-2h)   → Sonnet
Complexa (2h+)         → Opus para planejamento, Sonnet para execucao
Critica (arquitetura)  → Opus
```

## Estrategias de Economia

### 1. Contexto Minimo
- Carregar apenas arquivos relevantes
- Usar findings.md ao inves de re-explorar
- Limpar contexto entre tarefas grandes

### 2. Prompts Especificos
- ❌ "Melhore este codigo"
- ✅ "Extraia a funcao validateEmail para utils/validation.ts"

### 3. Dividir Tarefas Grandes
- ❌ "Implemente todo o modulo de autenticacao"
- ✅ Dividir em: schema → migration → service → middleware → testes

### 4. Cache de Contexto
- Salvar findings.md apos exploracao
- Reutilizar SPEC entre sessoes
- Nao re-explorar o que ja foi mapeado

## Alertas

- Sessao > 100K tokens sem output concreto → pausar e replanejar
- Mesmo erro 3+ vezes → parar e escalar
- Modelo Opus em tarefa simples → avaliar downgrade
