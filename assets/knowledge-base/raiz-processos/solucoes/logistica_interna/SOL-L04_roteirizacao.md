# SOL-L04 — Roteirizacao com Tempo de Parada Variavel por Escola

**Processo**: Logistica Interna (Malote + Frete + Motoboy) — Raiz Educacao
**Nivel**: N1 (ajuste operacional no uso do Google Maps + dados proprios)
**Prioridade**: Quick Win
**Timeline**: 1-2 semanas (medicao) → Semana 3 (roteiro ajustado) | Prazo: Semana 3
**Responsavel**: Paulo Henrique + Joniclei (medicao) / Maressa (consolidacao)
**Resolve**: RC-L04

---

## Descricao

O Google Maps otimiza deslocamento, mas nao sabe quanto tempo o motorista fica em cada escola. Criar planilha de tempo de parada real por escola (medir por 2 semanas) e incorporar no planejamento de rota como restricao.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto ALTO — Quick Win

**Metodologia proposta**:
1. Paulo Henrique e Joniclei registram hora de chegada e saida em cada escola por 10 dias uteis
2. Calcular media e desvio por escola
3. Escolas com desvio alto = priorizadas para SOL-L01 (ponto fixo)
4. Reconfigurar roteiro no Google Maps com waypoints em ordem otimizada + folga total calculada com base nos tempos reais
5. Revisar a cada 30 dias nas primeiras ocorrencias pos-POP

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-L04 (Roteirizacao) | RC-L04 | > 85% das rotas cumpridas sem estouro apos ajuste | Semana 3 |

---

## Pre-requisitos

- Planilha simples para registro de hora de chegada e saida por escola
- Disposicao dos motoristas (Paulo Henrique e Joniclei) para registrar por 10 dias uteis

---

## Plano de Implementacao

| Etapa | Atividade |
|-------|-----------|
| Semana 1-2 | Motoristas registram hora chegada + hora saida em cada escola por 10 dias uteis |
| Fim Semana 2 | Maressa consolida dados: media e desvio de tempo de parada por escola |
| Inicio Semana 3 | Identificar escolas com desvio alto (priorizadas para SOL-L01) |
| Semana 3 | Reconfigurar roteiro no Google Maps com waypoints em ordem otimizada + adicionar buffer calculado |
| Semana 4 | Validar novo roteiro em 2 viagens e ajustar se necessario |

### Passos Criticos (S_melhorias)

1. Paulo Henrique e Joniclei registram hora de chegada e saida em cada escola por 10 dias uteis
2. Calcular media e desvio por escola
3. Escolas com desvio alto = priorizadas para SOL-L01 (ponto fixo)
4. Reconfigurar roteiro no Google Maps com waypoints em ordem otimizada + folga total calculada com base nos tempos reais
5. Revisar a cada 30 dias nas primeiras ocorrencias pos-POP

---

## Formula de Buffer

```
Tempo total planejado = deslocamento Google Maps
                      + soma de paradas medias por escola
                      + 20% buffer geral de imprevisto

Se tempo total > jornada disponivel → rebalancear rotas entre motoristas
                                     ou identificar escolas para POA/MG virarem frete
```

**Regra de buffer**:
> Tempo total de rota = deslocamento Google Maps + soma de paradas reais + 20% buffer de imprevisto

---

## Criterios de Validacao Pos-Implementacao

- [ ] Planilha de tempos de parada por escola criada e preenchida por 10 dias
- [ ] Roteiro atualizado com buffer incorporado
- [ ] Comparativo antes/depois: % rotas cumpridas sem estouro
- [ ] Meta: > 85% das rotas sem estouro apos ajuste

---

## KPI de Sucesso

- Roteiros cumpridos sem estouro > 85% das viagens
- Baseline atual: alta frequencia de estouros (nao medido — iniciar medicao na Semana 1)

---

## Contexto no Roadmap

**Fase 1 — Quick Win (Semanas 1-2 medicao, Semana 3 roteiro ajustado)**

```
Semana 1    Semana 2    Semana 3    Semana 4    Mes 2+
[SOL-L04: Medicao tempos de parada ─────────────────]→[Roteiro ajustado]
```

**Dependencias**:
- SOL-L01 e SOL-L04 se complementam: escolas com desvio alto em SOL-L04 sao priorizadas para ponto fixo em SOL-L01
- Executar em paralelo com SOL-L01 e SOL-L02 na Semana 1
