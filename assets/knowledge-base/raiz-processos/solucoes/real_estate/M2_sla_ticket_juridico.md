# M2 — SLA + Ticket Formal Real Estate → Juridico

**Processo**: real_estate
**Nivel**: N1 (Mudanca de Politica + Quick Win)
**Prioridade**: Quick Win
**Timeline**: 1-2 semanas
**Responsavel**: Erika Souza (demandante) + responsavel Juridico (SLA)
**Resolve**: P2 (dependencia juridico), parcialmente P4, P6

---

## Descricao

- **Problema resolvido**: P2 (dependencia juridico), parcialmente P4, P6
- **Gap de origem**: Ausencia de canal formal com SLA acordado

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Mudanca de Politica + Quick Win |
| **Problema(s)** | P2, P4, P6 |
| **Impacto** | 4/5 |
| **Esforco** | 2/5 |
| **Dono sugerido** | Erika Souza (demandante) + responsavel Juridico (SLA) |
| **Timeline** | 1-2 semanas |

**Descricao (o que fazer)**:

1. Reuniao de alinhamento Real Estate + Juridico: mapear tipos de demandas recorrentes (pareceres de contrato, notificacoes, IPTU, aditivos, obras).
2. Acordar SLA por tipo:
   - Parecer simples (ex: clausula contratual): 3 dias uteis
   - Notificacao/aditivo: 5 dias uteis
   - Consulta IPTU/responsabilidade: 7 dias uteis
   - Parecer obra estrutural: 5 dias uteis
3. Escolher ferramenta de ticket: opcao A = formulario Google Forms → planilha GSheets de controle; opcao B = ferramenta corporativa ja existente (Jira, TOTVS, etc.). Preferir o que ja existe.
4. Criar template de solicitacao com campos: tipo de demanda, urgencia (P0/P1/P2), prazo do contrato associado, descricao, anexos.
5. Regra de escalonamento: se SLA nao for cumprido, Erika notifica gerencia do Juridico com copia do ticket e prazo perdido.

**KPI de sucesso**:
- Metrica: tempo medio de resposta do Juridico para demandas Real Estate
- Baseline atual: nao mensurado (estimado 5-15 dias, cobrancas recorrentes)
- Meta: 100% das demandas respondidas dentro do SLA acordado
- Como medir: data de abertura vs data de fechamento no ticket

**Riscos e mitigacao**:

| Risco | Probabilidade | Mitigacao |
|-------|-------------|-----------|
| Juridico nao aceitar SLA | Media | Apresentar impacto operacional quantificado (obras paradas, contratos expirando) para aprovacao da diretoria |
| Ticket mal preenchido atrasa analise | Media | Template com campos obrigatorios e instrucoes |
| Urgencias P0 nao seguirem o fluxo de ticket | Baixa | Protocolo de P0: ticket + contato direto simultaeneo |

**Dependencias**: Nenhuma tecnica — depende de alinhamento organizacional

---

## Plano de Implementacao

### Visao Geral (IMP-2)

- **Solucao**: Google Forms como canal de entrada + GSheets como backlog de tickets
- **Nivel**: N1 (sem custo, sem dependencia de TI)
- **Sistema(s)**: Google Forms + Google Sheets
- **Esforco estimado**: 4 horas de configuracao + reuniao de alinhamento
- **Responsavel sugerido**: Erika Souza

### Passo 1: Criar o formulario de ticket

**Sistema**: Google Forms
**Caminho**: drive.google.com > Novo > Formularios Google

**Campos obrigatorios**:
```
1. Unidade afetada (lista: todas as unidades do portfolio)
2. Tipo de demanda (lista):
   - Parecer contratual
   - Notificacao ao proprietario
   - Consulta IPTU / responsabilidade
   - Aditivo contratual
   - Obras e benfeitorias
   - Sinistro / acionamento de seguro
   - Sublocacao
   - Outro
3. Urgencia:
   - P0 — Critico (prazo vencendo em < 48h ou risco legal imediato)
   - P1 — Alto (prazo em < 7 dias)
   - P2 — Normal (prazo em > 7 dias)
4. Descricao detalhada (texto longo — minimo 50 caracteres)
5. Prazo do contrato/documento associado (data — opcional)
6. Anexos (upload — opcional)
7. Solicitante (email — preenchido automaticamente via login Google)
```

**Configuracao do Forms**:
- Configuracoes > Respostas > Coletar enderecos de email: ATIVADO
- Enviar copia ao respondente: ATIVADO

### Passo 2: Configurar planilha de controle de tickets

**Sistema**: Google Sheets (vinculada automaticamente ao Forms)
**Caminho**: Forms > Respostas > Icone de planilha > Criar planilha

**Adicionar manualmente as colunas de controle** (a direita das colunas do Forms):
```
- STATUS: Aberto | Em Analise | Aguardando informacao | Concluido | Cancelado
- RESPONSAVEL_JURIDICO: nome do analista
- DATA_PRAZO_SLA: formula =SE(urgencia="P0", abertura+1, SE(urgencia="P1", abertura+5, abertura+7))
- DATA_RESPOSTA: preenchido manualmente pelo Juridico
- TICKET_ID: formula ="RE-"&ROW()-1
- OBSERVACOES: notas de acompanhamento
```

### Passo 3: Script de lembrete de SLA

**Sistema**: Apps Script (na planilha de tickets)

Script verifica diariamente tickets sem DATA_RESPOSTA cujo DATA_PRAZO_SLA passou ou passa nos proximos 24h.
Envia email para Erika com lista de tickets em risco, com CC para email do Juridico acordado na reuniao M2.

**Trigger**: Diario, 09:00-10:00

### Passo 4: Reuniao de alinhamento com o Juridico

**Participantes**: Erika Souza + responsavel do Juridico pelo Real Estate
**Pauta** (45 minutos):
1. Apresentar 5 exemplos reais de demandas sem resposta em > 7 dias
2. Mostrar impacto: obras paradas, contratos expirando, IPTU em atraso
3. Propor SLA: parecer simples = 3 dias uteis; notificacao/aditivo = 5 dias; IPTU = 7 dias; obra = 5 dias
4. Demonstrar o formulario de ticket
5. Acordar ponto focal do Juridico para Real Estate
6. Definir canal P0: WhatsApp direto do ponto focal

**Output esperado**: Email de confirmacao do SLA acordado com copia para gerencia

### Teste de Validacao

| # | Cenario | Resultado esperado |
|---|---------|-------------------|
| 1 | Abrir ticket P1 via Forms | Linha na planilha com prazo SLA = D+5 |
| 2 | SLA vencendo amanha | Email de alerta enviado |
| 3 | Ticket com DATA_RESPOSTA preenchida | Script ignora o ticket |

### Rollback

**Como reverter**: Deixar de usar o formulario. Dados preservados. Nenhum impacto operacional.

### Posicao no Cronograma

| Semana | Implementacao | Responsavel | Dependencia |
|--------|--------------|-------------|-------------|
| 2 (dias 3-5) | IMP-2: Forms de ticket + reuniao Juridico | Erika | Nenhuma |
| 3-6 | IMP-5: sprint IPTU (depende do SLA ativo) | Erika | IMP-2 |
