# UX-QAT Continuous Improvement

> 4 modulos de melhoria continua integrados ao ciclo PDCA.

## Modulo 1: Rubric Refinement

### Quando refinar
- Falso positivo: Judge da nota baixa para tela boa → ajustar escala
- Falso negativo: Judge da nota alta para tela ruim → ajustar criterios
- Variancia alta: scores inconsistentes entre runs → rubric ambigua

### Como refinar
1. Coletar 5+ avaliacoes da mesma rubric
2. Identificar criterios com maior variancia
3. Reescrever descricoes das faixas com termos mais objetivos
4. Adicionar evidencias concretas (ex: "contraste >= 4.5:1" em vez de "bom contraste")
5. Re-calibrar com golden samples

### Versionamento
- Incrementar patch: ajuste de descricao (1.0.0 → 1.0.1)
- Incrementar minor: novo criterio ou mudanca de peso (1.0.0 → 1.1.0)
- Incrementar major: reestruturacao completa (1.0.0 → 2.0.0)

## Modulo 2: Scenario Detection

### Deteccao automatica
- ag-08 constroi tela nova → ag-43 sugere cenario UX-QAT
- ag-14 detecta PR sem cenario para tela nova → alerta no review
- `/ag43 scan` detecta rotas sem cenario

### Cobertura
- Medir % de telas com cenario UX-QAT
- Target: 80% das telas user-facing cobertas
- Priorizar: telas com mais trafego primeiro

## Modulo 3: Cost Intelligence

### Metricas de custo
- Custo por run (L3 screenshots × preco/screenshot)
- Custo por sprint (soma de runs)
- Custo por tela (historico de runs por tela)
- Short-circuit savings (L3 calls evitadas por L1/L2 fail)

### Otimizacao
- **Smart sampling**: Nao avaliar todos os breakpoints toda vez
  - Telas estaveis (variancia < 0.3): avaliar 2 breakpoints (375, 1440)
  - Telas novas/instaveis: avaliar todos os breakpoints
- **Pruning**: Remover cenarios de telas descontinuadas
- **Batch**: Agrupar screenshots para reduzir overhead de API calls

### Budget
- Default: ~$20/sprint
- Se exceder: reduzir frequencia L3 ou aplicar smart sampling
- Short-circuit tipicamente economiza 20-30% do custo L3

## Modulo 4: Trends Export

### Metricas exportadas
- Score medio por tela ao longo do tempo
- Pass rate por camada (L1, L2, L3, L4)
- Regressoes por sprint
- Top failure patterns recorrentes
- WCAG violations trending

### Formato de export
```json
{
  "period": "2026-Q1",
  "runs": 12,
  "avgScore": 7.2,
  "passRate": 85,
  "regressionsDetected": 3,
  "topFailures": [
    { "pattern": "overflow-mobile", "count": 8 },
    { "pattern": "contrast-low", "count": 5 }
  ],
  "costTotal": 24.50,
  "shortCircuitSavings": 8.20
}
```

### Dashboards
- Integrar com Grafana (se disponivel) via trends JSON
- Report markdown semanal via ag-42

## Ciclo de Melhoria

```
Sprint N:   PDCA run → findings → baselines
Sprint N+1: Devs corrigem findings → novo PDCA run → baselines melhoram
Sprint N+2: Rubric refinement baseado em dados acumulados
Trimestral: Full calibracao (Opus) + scenario detection + cost review
```

## Anti-Patterns de Melhoria

- **NUNCA** ajustar rubric para esconder falhas (nota 5 vira nota 7)
- **NUNCA** remover cenarios porque sao "muito exigentes"
- **NUNCA** ignorar tendencia descendente — investigar causa raiz
- **NUNCA** calibrar Judge com exemplos ruins — garbage in, garbage out
