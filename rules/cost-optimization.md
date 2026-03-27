---
description: "Otimizacao de custo de tokens e model routing"
paths:
  - "**/*"
---

# Cost Optimization

## Model Routing

Cada agente tem um modelo recomendado no seu SKILL.md. Ao delegar:

| Complexidade | Modelo | Agentes Tipicos |
|-------------|--------|-----------------|
| Scans rapidos, lookups | haiku | ag-explorar-codigo explore, ag-saude-sessao health |
| Implementacao, debug, review | sonnet | ag-implementar-codigo build, ag-testar-codigo test, ag-revisar-codigo review |
| Arquitetura, specs, analise profunda | opus | ag-0-orquestrador orq, ag-analisar-contexto analisar, ag-especificar-solucao spec, ag-planejar-execucao plan, ag-depurar-erro debug |

## Default Model
Para sessoes gerais, usar Sonnet como default (80% cost savings vs Opus).
Mudar para Opus apenas para: arquitetura, specs complexas, analise profunda.
Env var: `CLAUDE_CODE_MODEL=claude-sonnet-4-6`

## Budget Safety
Para sessoes autonomas (ralph, headless, batch):
```bash
claude -p "..." --max-budget-usd 10.00
```

## Reducao de Tokens
- /clear entre tarefas nao-relacionadas
- /compact proativo a 60% do context
- Subagents para exploracao (context separado)
- CLAUDE.md conciso (cada linha = tokens em toda sessao)
- @reference em vez de inline para docs grandes
