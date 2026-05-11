# SOL-006 — n8n para Automacao de Alertas Operacionais

**Processo**: Almoxarifado (estoque, ferramentas, reposicao, inventario)
**Nivel**: N3 — Orquestracao via n8n (middleware)
**Prioridade**: Transformacao (Fase 3)
**Timeline**: Semanas 5-8 (3 workflows em sequencia)
**Responsavel**: TI
**Resolve**: RC-002 (estoque volante sem rastreio — complementar a SOL-002), RC-004 (ferramentas emprestadas sem retorno — complementar a SOL-004)

**ROI estimado**: 3-4h/semana economizadas em verificacoes manuais pela equipe. Alertas em tempo real vs verificacao semanal.

---

## Descricao

Implementar 3 workflows n8n:
1. **Estoque minimo**: Verifica saldo no TOTVS diariamente. Se item abaixo do ponto de reposicao → alerta WhatsApp/email para Sephora
2. **Devolucao de ferramenta**: Verifica planilha de emprestimos ativos. Emprestimos vencidos → lembrete automatico para funcionario e gestor (complementa SOL-004)
3. **Cancelamento de ticket**: Ticket sem confirmacao em 5 dias → cancelamento automatico notificado ao solicitante

**Acoes**:
1. Mapear campos no TOTVS para saldo de estoque e ponto de reposicao
2. Estruturar planilha de emprestimos em formato lido por n8n (Google Sheets API)
3. Implementar workflow 1 (estoque minimo) — mais simples, maior impacto imediato
4. Implementar workflow 2 (devolucao) — depende de SOL-004 estar funcionando
5. Implementar workflow 3 (cancelamento ticket) — depende de API do Ticket disponivel
6. Testar cada workflow com dados reais antes de ativar
7. Criar painel de monitoramento: workflows executados, erros, alertas enviados

**Riscos**:
- API do TOTVS pode nao estar disponivel ou documentada
- Mitigacao: comecar com Google Sheets como fonte de dados (independente do TOTVS)

**Ferramentas**: n8n (ja disponivel na Raiz), TOTVS API ou Google Sheets, WhatsApp Business API ou email

---

## Plano de Implementacao

**Nivel**: N3 | **Timeline**: Semanas 5-8 | **Resolve**: RC-002, RC-004

### Responsaveis

- Principal: TI
- Aprovadores: Gestor de TI + Coordenadora do almoxarifado

### Pre-requisitos

- SOL-003 (inventario) e SOL-004 (emprestimos) implementados e com dados consistentes por 2+ semanas
- n8n disponivel e configurado na infraestrutura da Raiz
- API do TOTVS documentada (ou Google Sheets como alternativa)
- Conta WhatsApp Business ou SMTP configurado

### Workflows a Implementar

**Workflow 1 — Estoque Minimo** (Semanas 5-6):
- Trigger: Diario, 08h00
- Acao: Consulta saldo de cada item no TOTVS (ou planilha de controle)
- Condicao: Saldo <= ponto de reposicao definido por item
- Output: Alerta WhatsApp/email para Sephora com lista de itens abaixo do minimo
- Fallback: Se TOTVS indisponivel, log de erro e alerta para TI

**Workflow 2 — Devolucao de Ferramentas** (Semanas 6-7):
- Trigger: Diario, 08h00 (dias uteis)
- Acao: Le planilha de emprestimos ativos (Google Sheets)
- Condicao: Status = "Em aberto" E data prazo <= hoje
- Output D+0: Lembrete automatico para funcionario (WhatsApp/email) + copia gestor
- Output D+15: Se ainda em aberto, alerta para Fabiane acionar RH
- Registra data do lembrete na planilha

**Workflow 3 — Cancelamento de Ticket** (Semanas 7-8):
- Trigger: Diario, 09h00
- Acao: Consulta tickets com status "Aguardando confirmacao" ha > 5 dias uteis
- Output: Notificacao automatica de cancelamento para o solicitante
- Output: Registro de cancelamento na planilha de controle de tickets
- Obs: Depende de API do sistema de Ticket estar disponivel

### Plano de Acao

| Semana | Atividade | Responsavel |
|--------|-----------|-------------|
| Sem 5, Dia 1-2 | Mapear API TOTVS e Google Sheets API (documentar endpoints, auth) | TI |
| Sem 5, Dia 3-5 | Implementar e testar Workflow 1 (estoque minimo) em staging | TI |
| Sem 6, Dia 1-2 | Validar Workflow 1 com dados reais (5 dias monitoramento) | TI + Sephora |
| Sem 6, Dia 3-5 | Implementar e testar Workflow 2 (devolucao) | TI |
| Sem 7 | Validar Workflow 2 + implementar Workflow 3 | TI |
| Sem 8 | Validar todos os 3 workflows, criar painel de monitoramento | TI |
| Sem 8 | Handover: documentar workflows e procedimento de manutencao | TI |

### Validacoes Pos-Implementacao

- [ ] Workflow 1: ao menos 3 alertas de estoque minimo gerados e recebidos corretamente
- [ ] Workflow 2: ao menos 2 lembretes de devolucao enviados sem intervencao manual
- [ ] Workflow 3: ao menos 1 cancelamento automatico processado
- [ ] Zero falhas silenciosas (erros devem gerar alerta para TI)
- [ ] Taxa de sucesso dos workflows > 99% em 1 semana

### Plano de Rollback

- Desativar workflow no n8n — processo retorna ao manual (planilha + verificacao semanal)
- Tempo estimado: 15 minutos por workflow
- Condicao de ativacao: workflow enviando alertas incorretos ou duplicados por > 24h

### KPIs de Acompanhamento

| KPI | Baseline | Meta Fase 3 |
|-----|---------|------------|
| HH/semana em verificacoes manuais | 3-4h | 0h |
| Alertas de estoque automaticos | 0 | >0 (ativos) |
| Lembretes de devolucao automaticos | 0 | >0 (ativos) |
| Taxa de sucesso dos workflows | N/A | >99% |
