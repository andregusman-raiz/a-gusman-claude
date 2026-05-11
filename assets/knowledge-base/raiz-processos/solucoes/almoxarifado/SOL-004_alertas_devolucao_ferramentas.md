# SOL-004 — Alertas Intermediarios de Devolucao de Ferramentas

**Processo**: Almoxarifado (estoque, ferramentas, reposicao, inventario)
**Nivel**: N1 (planilha + lembrete manual) → N3 (automacao n8n, fase futura)
**Prioridade**: Quick Win (Fase 1)
**Timeline**: Dias 3-5 uteis (N1); automacao n8n na Fase 3
**Responsavel**: Sephora (registra emprestimos) + Fabiane (monitora) + Pedro Lemos (lembretes semanais)
**Resolve**: RC-004 (ferramentas emprestadas nao retornam; unico mecanismo de cobranca e o desconto rescisorio, que so acontece na demissao — podendo ser meses depois)

**ROI estimado**: Reducao de 70-80% dos emprestimos em aberto por mais de 30 dias. Ferramentas disponiveis quando necessario. Responsabilizacao sem precisar esperar rescisao.

---

## Descricao

Criar um registro de emprestimos com prazo de devolucao. Para cada ferramenta emprestada: nome do funcionario, matricula, item, data de retirada, prazo de devolucao (padrao: 5 dias uteis para uso pontual; 30 dias para uso prolongado com justificativa). Lembrete ativo no prazo: WhatsApp ou email para o funcionario e para o gestor direto.

**Acoes**:
1. (N1) Adicionar aba "Emprestimos Ativos" na planilha de controle (ou criar planilha dedicada)
2. Campos: funcionario, matricula, unidade, item, quantidade, data retirada, prazo devolucao, status, observacao
3. Sephora registra cada emprestimo na hora da assinatura (ja existe assinatura — agora adiciona data de prazo)
4. (N1) Fabiane ou Pedro Lemos verificam lista toda segunda-feira e enviam lembrete manual para emprestimos vencidos
5. (N3) Automacao via n8n: todo dia util, n8n le planilha, identifica emprestimos vencidos, envia WhatsApp/email automatico para o funcionario e copia para o gestor
6. Registrar no kit admissao/demissao: funcionario assina ciencia do prazo e da clausula de desconto

**Riscos**:
- Resistencia de funcionarios / gestores a lembretes automaticos
- Mitigacao: comunicado claro de que e politica da empresa (nao e perseguicao)

**Ferramentas**: Planilha (N1), n8n com WhatsApp/email (N3), TOTVS para registro patrimonial

---

## Plano de Implementacao

**Nivel**: N1 → N3 | **Timeline**: Dias 3-5 (N1) | **Resolve**: RC-004

### Responsaveis

- Principal: Sephora (registros de emprestimo)
- Monitor: Fabiane
- Lembretes semanais (N1): Pedro Lemos
- N3 (automacao): TI

### Pre-requisitos

- Lista de ferramentas sujeitas a emprestimo (definida por Fabiane)
- Prazos padrao de devolucao definidos
- Canal de lembrete definido (WhatsApp do funcionario ou email corporativo)

### Prazos Padrao de Devolucao

- Uso pontual (< 1 dia): devolucao no mesmo dia ou dia seguinte ate 17h
- Uso de curto prazo (obra de 1-5 dias): prazo combinado no ato do emprestimo (max 5 dias uteis)
- Uso prolongado (obra > 5 dias): aprovacao de Fabiane obrigatoria + prazo registrado (max 30 dias)

### Plano de Acao

| Dia | Atividade | Responsavel |
|-----|-----------|-------------|
| Dia 3 | Criar aba "Emprestimos Ativos" na planilha de controle (ou planilha separada) | Sephora |
| Dia 3 | Campos: funcionario, matricula, unidade, item, qtd, data retirada, prazo devolucao, status, observacao | Sephora |
| Dia 4 | Fabiane define prazos padrao por tipo de uso e publica na politica de emprestimo | Fabiane |
| Dia 4 | Adicionar no kit admissao: funcionario assina ciencia do prazo e clausula de desconto | Fabiane |
| Dia 5 | Definir rotina semanal: toda segunda, Pedro Lemos verifica lista e envia lembrete manual para vencidos | Pedro Lemos |
| Dia 5 | Registrar emprestimos ja em aberto (regularizacao do historico atual) | Sephora |

### Processo de Lembrete Manual (Fase N1)

1. Toda segunda-feira, Pedro Lemos abre planilha de emprestimos
2. Filtra status = "Em aberto" e data prazo <= hoje
3. Envia mensagem padrao para o funcionario (WhatsApp ou email) + copia para gestor direto
4. Registra data do lembrete na planilha
5. Emprestimo sem retorno em 15 dias apos prazo: Fabiane notifica RH para ativacao da clausula de desconto preventivo

### Validacoes Pos-Implementacao

- [ ] Todos os emprestimos em aberto registrados na planilha
- [ ] Primeiro ciclo de lembrete semanal executado
- [ ] Ao menos 3 itens cobrados e devolvidos no primeiro mes
- [ ] Processo de notificacao ao RH testado (ao menos 1 caso)

### KPIs de Acompanhamento

| KPI | Baseline | Meta 30 dias | Meta 60 dias | Meta 90 dias |
|-----|---------|--------------|--------------|--------------|
| Emprestimos em aberto > prazo | Nao mensurado | Baseline estabelecido | -30% | -60% |
| Ferramentas recuperadas por lembrete | 0 (sistematico) | Primeiros casos | Mensuravel | Trend positivo |
