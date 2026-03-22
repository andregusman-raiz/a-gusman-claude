# UX-QAT PDCA Cycle

> Ciclo Plan-Do-Check-Act adaptado para avaliacao visual continua.

## Visao Geral

```
PLAN → DO → CHECK → ACT → (repeat)
```

O PDCA e o diferenciador do UX-QAT: nao e medicao passiva, e melhoria ativa.

## PLAN: Preparar

1. **Pre-flight**: Verificar estrutura, ferramentas, URL
2. **Carregar KB**: baselines, failure-patterns, learnings, design tokens
3. **Planejar capture points**: telas × breakpoints × temas
4. **Priorizar**: baixo baseline primeiro, flaky por ultimo
5. **Estimar custo**: se L3 incluido, calcular ~$0.05-0.10/capture point

## DO: Executar

Para cada capture point, 4 camadas com short-circuit:

### L1 Renderizacao
- Navegar ate a rota
- Verificar: carregamento, sem overflow, sem JS errors, elementos-chave visiveis
- Se FAIL → RENDER → skip L2-L4

### L2 Interacao
- Executar interacoes definidas no cenario
- Verificar: hover/focus/click respondem, touch targets >= 44px, animacoes
- Se CRITICAL FAIL → INTERACTION → skip L3-L4

### L3 Percepcao Visual
- Capturar screenshot
- Enviar ao Judge com design tokens + rubric + golden sample
- Receber scores por criterio + penalties
- Se score < threshold → PERCEPTION

### L4 Compliance
- axe-core: WCAG violations
- Lighthouse: performance, accessibility, best-practices
- Se violations criticas → COMPLIANCE

## CHECK: Classificar

### 6 Categorias de Falha

| Categoria | Indicadores | Severidade Tipica |
|-----------|------------|-------------------|
| RENDER | Nao carrega, overflow, blank | P0-P1 |
| INTERACTION | Hover/focus quebrado | P1-P2 |
| PERCEPTION | Score L3 < threshold | P2-P3 |
| COMPLIANCE | WCAG violations | P1-P2 |
| RUBRIC | Falso positivo/negativo | P3 |
| FLAKY | Variancia > 2 pontos | P3 |

### Baseline Comparison

- Delta = score_atual - baseline
- Delta < -1.0 → REGRESSAO
- Delta > +1.0 → MELHORIA
- Sem baseline → primeiro run

### Failure Pattern Matching

Comparar diagnosticos com patterns conhecidos:
- Match → referenciar, verificar se fix aplicado
- Sem match → novo pattern candidato

## ACT: Melhorar

### 1. Atualizar Baselines
- So para CIMA (melhoria)
- NUNCA para baixo (regressao nao reseta baseline)
- Manter historico dos ultimos 10 runs

### 2. Registrar Failure Patterns
- Novo entry com status `open`
- Indicadores, severidade, tela, breakpoint

### 3. Adicionar Learnings
- Rubric ajustada (falso positivo/negativo)
- Tela redesenhada
- Judge prompt modificado
- Threshold recalibrado

### 4. Disparar Alertas
- P0 → sugerir rollback
- P1 → sugerir criacao de issue
- P2 → registrar para proximo ciclo
- P3 → apenas registrar

### 5. Gerar Report
- `summary.json` com metricas
- `report.md` com tabelas e acoes PDCA

## Frequencia Recomendada

| Frequencia | Camadas | Objetivo |
|------------|---------|----------|
| Cada deploy | L1+L2+L4 | Detectar regressoes |
| Semanal | L1+L2+L3+L4 | Avaliacao completa |
| Trimestral | Full + calibracao | Refinar rubrics e Judge |
