# QAT Learnings — Knowledge Base

> Licoes aprendidas de cada ciclo PDCA. Atualizado automaticamente pelo engine.
> NAO editar manualmente — use o PDCA engine para adicionar entries.

## Formato

```json
{
  "id": "LRN-NNN",
  "cycle": "Cycle #N",
  "date": "YYYY-MM-DD",
  "category": "RUBRIC | SCENARIO | INFRA | PROMPT | GENERAL",
  "scenario": "QAT-XX (ou 'all')",
  "finding": "O que foi observado",
  "action": "O que foi feito para resolver",
  "impact": "Resultado da acao (melhoria de score, reducao de falsos positivos, etc.)",
  "status": "applied | pending | rejected"
}
```

## Learnings

### Rubrica

<!-- Learnings sobre calibracao de rubricas, escalas, pesos -->

### Cenarios

<!-- Learnings sobre design de cenarios, inputs, timing -->

### Infraestrutura

<!-- Learnings sobre timeouts, selectors, stability -->

### Prompts

<!-- Learnings sobre system prompts, temperature, model behavior -->

### Geral

<!-- Learnings transversais -->

---

## Guidelines

1. **Adicionar apos cada ciclo PDCA** que revelou algo novo
2. **Nao duplicar**: verificar se learning similar ja existe antes de adicionar
3. **Ser especifico**: "Score de contextualizacao melhorou 2.3 pontos apos adicionar BNCC ao prompt" > "Melhorou"
4. **Incluir dados**: antes/depois, scores, custos
5. **Marcar status**: applied (ja implementado), pending (a fazer), rejected (nao vale a pena)
6. **Review mensal**: limpar learnings obsoletos, promover patterns recorrentes para `.shared/patterns/`
