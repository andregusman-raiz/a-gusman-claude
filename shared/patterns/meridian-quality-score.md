# Meridian Quality Score (MQS)

## Formula

```
MQS = D1_ALIVE * 0.25 + D2_REAL * 0.20 + D3_WORKS * 0.25 + D4_LOOKS * 0.15 + D5_FEELS * 0.15
```

## Dimensoes

| Dim | Nome | Peso | Como calcular |
|-----|------|------|---------------|
| D1 | ALIVE | 25% | rotas_sem_erro / total_rotas * 100 |
| D2 | REAL | 20% | rotas_dados_reais / rotas_testadas * 100 |
| D3 | WORKS | 25% | features_funcionando / features_testadas * 100 |
| D4 | LOOKS | 15% | media scores visuais (4 viewports) |
| D5 | FEELS | 15% | score do Client Judge (0-100) |

## Classificacao

| MQS | Status | Acao |
|-----|--------|------|
| 90-100 | Excelente | Deploy confiavel |
| 85-89 | Bom | Deploy aceitavel (threshold default) |
| 70-84 | Regular | Correcoes necessarias antes de deploy |
| 50-69 | Fraco | Correcoes significativas necessarias |
| < 50 | Critico | App nao esta pronta para uso |

## Regras de Convergencia

### STOP (todas devem ser verdadeiras)
1. MQS >= threshold (default 85)
2. Zero issues P0 abertas
3. Zero regressoes no ciclo atual
4. delta_MQS < 2 pontos (estabilizou)
5. ciclo_count <= 5

### CONTINUE (qualquer uma verdadeira)
1. MQS < threshold AND issues fixaveis > 0
2. Regressoes detectadas no ciclo atual
3. Issues P0 ainda abertas

### FORCE STOP (qualquer uma verdadeira)
1. ciclo_count >= 5
2. Zero issues fixaveis restantes AND MQS < threshold

## Tracking de Convergencia

Manter historico por ciclo:

```
Cycle 1: MQS 42 ████████░░░░░░░░░░░░ Issues: 28 found, 12 fixed
Cycle 2: MQS 68 █████████████░░░░░░░ Issues: 16 found, 10 fixed
Cycle 3: MQS 82 ████████████████░░░░ Issues:  8 found,  6 fixed
Cycle 4: MQS 89 █████████████████░░░ Issues:  4 found,  3 fixed — CONVERGED
```

## Deteccao de Regressao

Apos cada sprint de fix:
1. Re-rodar dimensoes afetadas nas rotas modificadas
2. Comparar score ANTES vs DEPOIS do sprint
3. Se qualquer dimensao CAIU > 2 pontos → regressao
4. Acao: `git revert` do commit causador, documentar

## Baseline Management

Apos convergencia, salvar baselines por rota:

```json
{
  "/dashboard": { "D1": 100, "D2": 90, "D3": 85, "D4": 80, "D5": 85 },
  "/users": { "D1": 100, "D2": 95, "D3": 90, "D4": 85, "D5": 80 }
}
```

Em runs futuros, comparar contra baselines:
- Score SUBIU → atualizar baseline
- Score CAIU > 5 pontos → regressao detectada (P0)
- Score CAIU 1-5 pontos → warning (tolerancia)
