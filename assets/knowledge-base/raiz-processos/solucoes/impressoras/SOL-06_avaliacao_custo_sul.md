# SOL-06 — Avaliacao Formal Modelo Custo Sul (Multimidia vs. Internalizacao)

**Processo**: Gestao de Impressoras (Locadas e Proprias) — Raiz Educacao
**Nivel**: N1 (analise de dados — dependente de SOL-01)
**Prioridade**: Estrategico
**Timeline**: Mai/2026 (apos 1 mes de dados Printwayy disponivel) | Prazo: 31/mai/2026
**Responsavel**: Maressa + area Financeira | Apoio: Kevin (extracao dados), Samara (cotacao)
**Resolve**: CR-06 (modelo de custo Sul sem evidencia)

---

## Descricao

Com dados do Printwayy integrados ao BI (SOL-01), realizar analise comparativa formal: custo atual Multimidia por escola Sul vs. custo estimado de internalizacao (mecanografia Unificado e Americano).

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO (apos SOL-01) / Impacto MEDIO — decisao estrategica de custo

**Dependencia critica**: SOL-01 deve estar operacional com pelo menos 30 dias de dados de volume Sul.

### Decisao Esperada

Internalizacao viavel para Unificado e Americano se volume > X impressoes/mes (benchmark a calcular).

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-06 (Custo Sul) | CR-06 | Decisao modelo Sul fundamentada | Mai/2026 |

---

## Metricas de Decisao

- Ponto de break-even: volume de impressao mensal onde internalizacao fica mais barata que locacao
- Se volume atual de Americano e Unificado > break-even: recomendar internalizacao
- Se volume < break-even: manter Multimidia com revisao em 12 meses

---

## Plano de Implementacao

### Pre-requisitos

- SOL-01 operacional com pelo menos 30 dias de dados de volume Sul (CLV, Americano, Unificado, Uniao)
- Contrato Multimidia com valores mensais por escola
- Cotacao de equipamentos para internalizacao (Americano e Unificado — mecanografia)

### Plano Detalhado

| Dia | Atividade | Responsavel |
|-----|-----------|-------------|
| Dia 1 | Extrair do BI: volume de impressao mensal por escola Sul (dados Printwayy) | Kevin |
| Dia 2 | Calcular custo por impressao atual: valor contrato Multimidia / volume | Maressa + Financeiro |
| Dia 3-5 | Obter cotacao de equipamentos para internalizacao (Americano + Unificado): CAPEX, insumos/mes, AT/ano | Samara |
| Dia 6-7 | Calcular TCO 24 meses: locado (Multimidia) vs. proprio (internalizacao) por escola | Maressa + Financeiro |
| Dia 8 | Elaborar recomendacao por escola com base em volume, perfil e TCO | Maressa |
| Dia 9-10 | Apresentar recomendacao para decisao (gestao) | Maressa |

Passos adicionais (S_melhorias):
1. Extrair do BI: volume de impressao mensal por escola Sul, custo contrato Multimidia por escola
2. Calcular custo por impressao atual (contrato / volume)
3. Calcular custo de internalizacao: CAPEX equipamento + insumos/mes + manutencao anual
4. Comparar TCO 24 meses: locado vs. proprio
5. Recomendar modelo por escola com base em volume e perfil de uso

### Checklist de Validacao

- [ ] Dados de volume disponiveis para as 4 escolas Sul (CLV, Americano, Unificado, Uniao)
- [ ] Custo por impressao atual Multimidia calculado
- [ ] TCO 24 meses calculado para internalizacao de Americano e Unificado
- [ ] Recomendacao documentada com evidencia numerica
- [ ] Decisao registrada (manter Multimidia ou internalizar)

---

## Contexto no Roadmap

**Estrategico — Mai/2026 (apos SOL-01 ter 1 mes de dados)**

```
Abr/2026    Mai/2026
            SOL-06 >>
```

**Dependencia**:
```
SOL-01 (Printwayy→BI) → SOL-06 depende de SOL-01 (dados de volume Sul)
```
