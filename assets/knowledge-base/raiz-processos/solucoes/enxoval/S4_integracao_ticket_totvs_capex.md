# S4 — Integracao Ticket-TOTVS para CAPEX de Enxoval

**Processo**: Enxoval de novas unidades escolares
**Nivel**: N2 (integracao nativa API) ou N3 (n8n como orquestrador)
**Prioridade**: Transformacao (Ciclo 3 — Q1 2027)
**Timeline**: 6-8 semanas | Pre-requisito: S1 + S2 estabilizados por ao menos 30 dias
**Responsavel**: TI (arquitetura da integracao) + Financeiro (validacao dos lancamentos)
**Resolve**: C4 (ausencia de rastreabilidade CAPEX por unidade; lancamentos manuais no TOTVS; impossibilidade de comparar custo de enxoval entre expansoes)

**ROI estimado**: Financeiro ve o CAPEX de cada expansao em tempo real. Auditoria interna tem rastreabilidade completa. Time consegue comparar custo de enxoval entre unidades para identificar oportunidades de padronizacao e economia de escala.

---

## Descricao

Integrar o Ticket (onde os pedidos de enxoval sao criados e aprovados) com o TOTVS (onde o CAPEX e controlado), garantindo que todo investimento de enxoval seja rastreavel por unidade em tempo real.

**Escopo da integracao**:

| Evento no Ticket | Acao no TOTVS |
|-----------------|---------------|
| Pedido de enxoval aprovado | Cria pre-lancamento CAPEX com codigo "Enxoval-[UNI]-[ANO]" |
| Adiantamento aprovado | Registra saida financeira vinculada ao projeto |
| NF parcial anexada | Atualiza status para "Em Producao" |
| Recebimento fisico confirmado | Converte pre-lancamento em ativo imobilizado |
| Ticket encerrado | Fecha o projeto CAPEX da unidade |

**Hierarquia de implementacao**:

```
N2 (PREFERIVEL): Zeev/Ticket API → TOTVS API direta
  Prazo: 4-6 semanas
  Pre-requisito: API TOTVS documentada e acessivel para o modulo Patrimonio/CAPEX

N3 (ALTERNATIVA): Ticket webhook → n8n → TOTVS API
  Prazo: 6-8 semanas
  Pre-requisito: n8n com acesso a rede interna onde TOTVS esta instalado
```

**Relatorio esperado no TOTVS**:
- CAPEX por unidade (atual vs orcado)
- CAPEX por categoria (mobiliario, TI, seguranca, etc.)
- Comparativo entre expansoes (custo/m2, custo/aluno)
- Adiantamentos abertos vs fechados

**Resultado esperado**: Financeiro ve o CAPEX de cada expansao em tempo real. Auditoria interna tem rastreabilidade completa. Time consegue comparar custo de enxoval entre unidades para identificar oportunidades de padronizacao e economia de escala.

---

## Plano de Implementacao

**Nivel**: N2/N3 | **Timeline**: 6-8 semanas | **Resolve**: C4
**Pre-requisito**: S1 + S2 em producao e estabilizados (pelo menos 30 dias de uso)

### Responsaveis

- **Arquitetura**: TI
- **Mapeamento de campos TOTVS**: Financeiro + TI
- **Desenvolvimento da integracao**: TI (N2) ou equipe n8n (N3)
- **Validacao dos lancamentos**: Financeiro
- **Aprovacao go-live**: Fabiane + Financeiro

### Pre-requisitos

- S1 e S2 em producao e estabilizados
- Documentacao da API do TOTVS (modulo Patrimonio/CAPEX) disponivel
- Instancia do n8n configurada na rede interna (ou acesso a API TOTVS via rede segura)
- Definicao da estrutura de codigos de projeto no TOTVS ("Enxoval-[MARCA]-[UNIDADE]-[ANO]")

### Plano de Acao

**Semana 1-2 — Mapeamento tecnico**:
1. TI documenta API do TOTVS: endpoints para criacao de pre-lancamentos CAPEX, update de status, fechamento
2. Definir estrutura de codigos: "Enxoval-[MARCA]-[UNIDADE]-[ANO]" (ex: Enxoval-MATRIZ-BANGU-2027)
3. Mapear campos Ticket → TOTVS: categoria, valor, fornecedor, status, datas
4. Decisao arquitetural: N2 (API direta) vs N3 (n8n) — baseada na complexidade da API TOTVS e acessibilidade

**Semana 3-4 — Desenvolvimento**:
5. Implementar a integracao no ambiente de dev
6. Criar mapeamento de eventos: aprovacao no Ticket → pre-lancamento no TOTVS
7. Implementar update de status (em producao, entregue, cancelado)
8. Tratamento de erros: se TOTVS nao responder, Ticket registra o erro e notifica TI

**Semana 5-6 — Testes**:
9. Testes com dados reais em staging
10. Validacao dos lancamentos pelo financeiro (os numeros batem?)
11. Teste de rollback: o que acontece se uma compra e cancelada apos o lancamento?

**Semana 7-8 — Piloto e deploy**:
12. Piloto com um projeto de enxoval real (unidade com menor risco)
13. Monitoramento por 2 semanas
14. Deploy completo para todos os projetos de enxoval

### Timeline

| Semana | Atividade |
|--------|-----------|
| 1-2 | Mapeamento tecnico e decisao arquitetural |
| 3-4 | Desenvolvimento da integracao |
| 5-6 | Testes com dados reais e validacao financeira |
| 7-8 | Piloto e deploy completo |

### Validacoes Pos-Implementacao

- [ ] 10 eventos testados no piloto (aprovacoes, updates, fechamentos) todos refletidos corretamente no TOTVS
- [ ] Relatorio de CAPEX por unidade no TOTVS mostra os dados corretos
- [ ] Financeiro consegue reconciliar lancamentos TOTVS vs pedidos Ticket sem discrepancias
- [ ] Falha de conectividade tratada: Ticket registra erro e notifica TI, nao perde o evento
- [ ] Dashboard de CAPEX de enxoval disponivel para Fabiane e Financeiro

### Plano de Rollback

- Desativar integracao (webhook/n8n) — lancamentos voltam a ser feitos manualmente no TOTVS
- Dados ja lancados permanecem no TOTVS (nao ha rollback de dados financeiros)
- Tempo estimado para desativar: 15 minutos

### KPIs de Acompanhamento

| KPI | Baseline | Meta Pos-S4 |
|-----|---------|------------|
| CAPEX de enxoval rastreavel por unidade | Parcial/retroativo | Total (automatico) |
| Visibilidade multi-area em tempo real | Total (Ticket) | Total (Ticket + TOTVS) |
| Tempo de reconciliacao financeira por enxoval | Horas | Imediato (automatico) |
| Comparativo de custo entre expansoes disponivel | Nao | Sim |
