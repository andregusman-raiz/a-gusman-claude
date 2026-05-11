# SOL-T05 — Integracao Ticket de Solicitacao com Planilha Inventario (N2)

**Processo**: Gestao de Telefonia Corporativa
**Nivel**: N2 (integracao nativa entre sistemas existentes)
**Prioridade**: Consolidacao
**Timeline**: 2-3 semanas (Semanas 3-6 — Abril/2026)
**Responsavel**: TI + Maressa (Owner) | Aprovador: Gestao de Contratos
**Resolve**: RC-T03 (pedidos informais) e RC-T04 (inventario desatualizado)

---

## Descricao

Apos o Google Forms (SOL-T04) estar funcionando, evoluir para integracao com o sistema de tickets da empresa (se houver — ex: Zeev, Freshdesk, Jira Service Management) para que cada solicitacao gere automaticamente uma tarefa rastreavel, com SLA de 10 dias uteis monitorado.

**Posicao na Matriz Impacto x Esforco**: Esforco MEDIO / Impacto ALTO

**Pre-requisito absoluto**: SOL-T01 (planilha estruturada) e SOL-T04 (formulario) devem estar funcionando.

### ROI / Impacto Esperado

| Metrica | Antes | Depois (estimado) | Melhoria |
|---------|-------|-------------------|----------|
| % solicitacoes com ticket formal | ~10% | 95% (meta Fase 2) | +85pp |
| SLA 10 dias uteis monitorado | Nao | Sim | Baseline |

---

## Fluxo Integrado

```
Solicitacao (Google Forms / ticket)
       ↓
Ticket criado automaticamente com SLA 10 dias uteis
       ↓
Aprovacao registrada no ticket
       ↓
Entrega agendada + termo gerado
       ↓
Inventario atualizado (manual ou via API Google Sheets)
       ↓
Ticket fechado com comprovante
```

---

## Configuracao n8n — Alertas (N3)

Quando N2 estiver ativo, configurar 4 workflows n8n (usando instancia ja disponivel em n8n.raizeducacao.com.br):

| Workflow | Gatilho | Acao |
|----------|---------|------|
| Alerta SLA Proximo | Diario 8h — verificar solicitacoes com SLA = hoje+2 dias | Email para Operacoes com lista de pendencias |
| Linhas Orfas | Semanal segunda-feira — varrer planilha por Status=Ativo sem titular | Email para Maressa com lista de linhas sem dono |
| Estoque Baixo | Diario — chips virgens < N unidades (definir threshold) | Email para Maressa + responsavel de compras |
| Contrato Vencendo | Mensal — verificar coluna de vencimento de contratos | Email 90 dias antes + 60 dias antes + 30 dias antes |

**Pre-requisito n8n**: Acesso a planilha Google Sheets via API (Service Account Google)

---

## Plano de Implementacao

### Pre-requisitos

- SOL-T01 (planilha estruturada) operacional
- SOL-T04 (formulario Google Forms) operacional

### Plano Detalhado

| Semana | Atividade |
|--------|-----------|
| Semana 3 | Mapear sistema de tickets disponivel (Zeev? Freshdesk? Jira SM?). Se nao houver, manter Google Forms como ticket informal e complementar com SLA via planilha. |
| Semana 4 | Se sistema de tickets disponivel: configurar integracao Forms → ticket. Se nao: criar coluna "SLA_vencimento" na aba Solicitacoes_Pendentes (=Data_solicitacao + 10 dias uteis). |
| Semana 5 | Configurar alertas automaticos (N3 — ver acima). Testar fluxo completo com 3 solicitacoes piloto. |
| Semana 6 | Ajustar baseado no piloto. Documentar POP de atendimento (como Operacoes processa cada tipo de solicitacao). |

### Checklist de Validacao SOL-T05

- [ ] Fluxo de solicitacao → atendimento rastreado de ponta a ponta
- [ ] SLA de 10 dias uteis monitorado (alerta quando proximo de vencer)
- [ ] Inventario atualizado a cada entrega/devolucao (lancamento obrigatorio antes de fechar ticket)
- [ ] 3 solicitacoes piloto processadas com sucesso

---

## KPIs de Acompanhamento

| KPI | Baseline (hoje) | Meta Fase 1 | Meta Fase 2 | Meta Fase 3 |
|-----|----------------|-------------|-------------|-------------|
| % solicitacoes com ticket formal | ~10% | 80% | 95% | 100% |
| SLA 10 dias uteis monitorado | Nao | Parcial | Sim | Sim |

---

## Contexto no Roadmap

**Fase 2 — Governanca: Fluxo Formal (Semanas 3-6)**

**Dependencias**:
```
SOL-T05 (integracao ticket) ← depende de SOL-T01 + SOL-T04
```
