# S2 — Fluxo de Compra Antecipada com Lead Time Longo

**Processo**: Enxoval de novas unidades escolares
**Nivel**: N1 — Novo tipo de solicitacao no Ticket + aditivo a politica POL-COMP-001
**Prioridade**: Critico (Fase 2 — Outubro 2026)
**Timeline**: 4 semanas | Pre-requisito: S3 ativo (S1 em paralelo ou concluido)
**Responsavel**: Fabiane (owner da politica) + Juridico/Compliance + Financeiro + Administrador Ticket
**Resolve**: C2 (impossibilidade de adiantamentos estruturados para itens com lead time longo; compras spot de marcenaria e brinquedos por falta de modalidade formal)

**ROI estimado**: Fim das compras spot e adiantamentos sem rastreamento. Custo de enxoval previsivel e auditavel. Deadline P0: ativa ate agosto 2026 para impactar ciclo de expansoes 2027.

---

## Descricao

Criar modalidade especial "Compra Antecipada — Enxoval" no Ticket e na politica de compras, que permite:
1. Cotacao simplificada (1 cotacao + justificativa) para itens com lead time > 45 dias
2. Adiantamento de ate 50% do valor aprovado para inicio da producao
3. Rastreamento do adiantamento diretamente no ticket (status, NF parcial, previsao de entrega)

**Criterios para uso da modalidade**:
- Item classificado como "enxoval" no Ticket
- Lead time documentado pelo fornecedor > 45 dias
- Aprovacao da Fabiane (supervisora) + coordenacao financeira

**Fluxo da modalidade**:

```
Ticket "Enxoval - Compra Antecipada"
    → Priscila preenche: item, fornecedor, lead time, valor, % adiantamento
    → Aprovacao: Fabiane (operacional) + financeiro (adiantamento)
    → Compras emite PO parcial (adiantamento)
    → TOTVS registra: "Enxoval [unidade] — item X — em producao"
    → Ticket monitora: previsao de entrega, NF parcial, NF final
    → Fechamento: NF final + recebimento fisico confirmados
```

**Controle de adiantamentos**:
- Cada adiantamento tem ticket proprio com NF e comprovante anexados
- Prestacao de contas automatica: Ticket lembra Priscila a cada 15 dias se NF final nao foi recebida
- Limite: nao abrir novo adiantamento para o mesmo fornecedor se prestacao anterior estiver em aberto

**Resultado esperado**: Fim das compras spot e adiantamentos sem rastreamento. Custo de enxoval previsivel e auditavel.

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: 4 semanas | **Resolve**: C2
**Pre-requisito**: S3 checklist implantado + aval do financeiro para modalidade de adiantamento estruturado + aval juridico para aditivo da politica de compras

### Responsaveis

- **Owner da politica**: Fabiane
- **Redacao do aditivo POL-COMP-001**: Juridico/Compliance com input de Fabiane
- **Aprovacao final**: Diretoria (conforme alcada da politica)
- **Configuracao no Ticket**: Administrador do Ticket
- **Treinamento**: Priscila + time de compras

### Plano de Acao

**Parte 1 — Politica (semanas 1-2)**:
1. Fabiane redige proposta de aditivo a POL-COMP-001 definindo:
   - Criterios para uso da modalidade (item enxoval + lead time > 45 dias)
   - Alcada de aprovacao especifica (Fabiane operacional + financeiro para adiantamento)
   - Limite de adiantamento (ate 50% do valor aprovado)
   - Obrigacoes de prestacao de contas (prazo para NF, controle de abertos)
2. Revisao juridica/compliance
3. Aprovacao pela diretoria
4. Publicacao do aditivo

**Parte 2 — Ticket (semanas 3-4)**:
5. Criar tipo de solicitacao "Compra Antecipada — Enxoval" no Ticket com campos especificos
6. Configurar fluxo de aprovacao (Fabiane + financeiro)
7. Campo de controle de adiantamento: valor solicitado, NF parcial, previsao de entrega, NF final
8. Alerta automatico: se NF final nao chegar em 15 dias apos previsao, notificar Priscila
9. Regra de bloqueio: nao permitir novo adiantamento para fornecedor com prestacao em aberto > 30 dias
10. Treinamento do time (1h)

### Timeline

| Semana | Atividade |
|--------|-----------|
| 1 | Fabiane redige proposta de aditivo da politica |
| 2 | Revisao juridica e aprovacao |
| 3 | Configuracao do tipo de solicitacao no Ticket |
| 4 | Testes, treinamento e deploy |

### Validacoes Pos-Implementacao

- [ ] Fluxo completo testado: Priscila cria pedido → Fabiane aprova → financeiro libera adiantamento → alerta de NF funciona
- [ ] Regra de bloqueio testada: tentativa de novo adiantamento para fornecedor com prestacao em aberto e recusada
- [ ] Time de compras treinado (confirmado via checklist de treinamento)
- [ ] Primeiro pedido real processado pela nova modalidade sem desvios

### KPIs de Acompanhamento

| KPI | Baseline | Meta (90 dias apos S1+S2+S3) |
|-----|---------|------|
| Compras emergenciais spot em dezembro/janeiro | Recorrente | Zero |
| Adiantamentos sem prestacao de contas em aberto > 30d | Desconhecido | < 5% |
| Custo de enxoval previsivel e auditavel | Nao | Sim |
| Lead time de marcenaria respeitado | Raramente | Sistematicamente |
