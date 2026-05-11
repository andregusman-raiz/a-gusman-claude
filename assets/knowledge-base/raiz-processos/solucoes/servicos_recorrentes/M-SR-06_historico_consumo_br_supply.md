# M-SR-06 — Historico de Consumo BR Supply por Unidade para Pedido Consolidado

**Processo**: servicos_recorrentes
**Nivel**: N2
**Prioridade**: Consolidacao (P3)
**Timeline**: 30 dias (planilha de historico); medio prazo (integracao NIMBI)
**Responsavel**: Raquel Pereira + time BI (integracao futura)
**Resolve**: RC-SR-06 (pedido manual sem base historica)

---

## Descricao

**RC Atacada**: RC-SR-06 (pedido manual sem base historica)
**Nivel**: N2 — Relatorio BR Supply + consolidacao
**Responsavel**: Raquel Pereira + time BI (integracao futura)
**Prazo estimado**: Curto prazo (30 dias para planilha de historico); medio prazo (integracao NIMBI)

**O que fazer**:

**Fase imediata (N1 — planilha)**:
- Exportar historico dos ultimos 6 meses da plataforma BR Supply por unidade por item
- Calcular media de consumo mensal + 20% (estoque de seguranca conforme politica POL-COMP-001)
- Criar sugestao mensal de pedido por unidade: responsavel de unidade confirma ou ajusta
- Raquel revisa consolidado antes do dia 15

**Fase futura (N2 — integracao)**:
Conectar dados de historico BR Supply ao TOTVS via projeto Marketplace NIMBI (quando contrato Juridico for concluido). Gerar sugestao automatica sem intervencao manual de Raquel.

**Resultado esperado**:
- Reducao estimada de 40-60% nos pedidos urgentes entre ciclos (ruptura por falta de planejamento)
- Responsavel de unidade com carga reduzida: confirma em vez de preencher do zero
- Visibilidade de consumo por unidade para negociacao de volume com BR Supply

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Medio |
| Esforco | Alto |
| Prioridade | P3 |
| Responsavel | Raquel + BI |
| Prazo | 90 dias |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 3 — Otimizacao e Automacao** (Agosto - Dezembro 2026)
**Tarefa 3.1** no plano de implementacao

**Responsavel**: Raquel Pereira + time BI (se integracao NIMBI avancada)
**Prazo**: Outubro/2026 (planilha consolidada) + Dezembro/2026 (integracao se contrato NIMBI concluido)

### Passos Fase 1 (N1 — Planilha)

**Agosto**: Raquel exporta historico dos ultimos 6 meses de pedidos BR Supply por unidade (exportar da plataforma BR Supply)

**Setembro**: Criar planilha de "Sugestao de Pedido Mensal por Unidade" com media de consumo + 20% por item

**Outubro**: Testar por 1 ciclo (enviar sugestao pre-preenchida para responsaveis de unidade antes do dia 15; eles confirmam ou ajustam)

**Novembro**: Avaliar reducao de pedidos urgentes vs. baseline anterior

**Dezembro**: Se contrato NIMBI concluido, avaliar integracao para automatizacao da sugestao

**Criterio de conclusao**: Planilha de sugestao testada por 2 ciclos mensais; reducao mensuravel de pedidos urgentes.

### Estrutura da Planilha de Sugestao

```
Colunas: Unidade | Item | Media Consumo 6 meses | Estoque Seguranca (+20%) | Sugestao Pedido | Ajuste Responsavel | Pedido Final
```

**Regra de ajuste**: Responsavel de unidade pode aumentar ou reduzir a sugestao em ate 30%. Ajuste acima de 30% requer justificativa.

### Fase 2 (N2 — Integracao NIMBI)

Dependencia: Contrato NIMBI concluido pelo Juridico
Objetivo: Gerar sugestao de pedido automaticamente sem intervencao manual de Raquel
Sistema: TOTVS + plataforma NIMBI + BR Supply

### Metrica de Sucesso

| Metrica | Baseline | Meta 6 meses |
|--------|---------|-------------|
| Pedidos urgentes BR Supply entre ciclos | Alto (estimado) | Reducao 40% |

### Dependencias Criticas

| Dependencia | Risco | Mitigacao |
|------------|-------|----------|
| Contrato NIMBI (fase 2) | Medio (projeto parado no juridico) | Fase 1 nao depende de NIMBI (planilha) |
