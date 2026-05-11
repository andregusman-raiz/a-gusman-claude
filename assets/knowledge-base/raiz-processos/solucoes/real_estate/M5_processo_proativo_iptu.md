# M5 — Processo Proativo de IPTU: Mapeamento e Cobranca

**Processo**: real_estate
**Nivel**: N1 (Melhoria Estrutural)
**Prioridade**: Projeto Estrategico
**Timeline**: 3-4 semanas
**Responsavel**: Erika Souza (lider) + Juridico (pareceres) + Financeiro (pagamentos)
**Resolve**: P4 (IPTU em atraso)

---

## Descricao

- **Problema resolvido**: P4 (IPTU em atraso)
- **Gap de origem**: Planilha reativa + responsabilidade em disputa + Juridico sem SLA

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Melhoria Estrutural |
| **Problema(s)** | P4 |
| **Impacto** | 5/5 |
| **Esforco** | 3/5 |
| **Dono sugerido** | Erika Souza (lider) + Juridico (pareceres) + Financeiro (pagamentos) |
| **Timeline** | 3-4 semanas |

**Descricao (o que fazer)**:

1. **Sprint de mapeamento (semana 1)**: Para cada imovel com IPTU em atraso na planilha SITUACAO GERAL IPTU, classificar em: (a) responsabilidade Real Estate, (b) responsabilidade proprietario, (c) em disputa/aguardando Juridico. Usar ticket M2 para formalizar as consultas ao Juridico.
2. **Regularizacao do que e de Real Estate (semana 2-3)**: Para debitos confirmados como responsabilidade da empresa, acionar Financeiro com proposta de parcelamento. Priorizar os de maior valor e risco de execucao fiscal (Botafogo R$ 247k primeiro).
3. **Cobranca ao proprietario (semana 2-3)**: Para debitos confirmados como responsabilidade do proprietario, emitir notificacao formal (template a criar). Registrar no ticket Juridico para acompanhamento.
4. **Alerta prospectivo (semana 4)**: Adicionar na planilha SITUACAO GERAL IPTU colunas: "proximo vencimento cota", "responsavel", "status pagamento". Configurar Apps Script de alerta (integrar com M1).
5. **Rotina mensal**: Primeiro dia util do mes = verificacao de status IPTU de todas as unidades.

**KPI de sucesso**:
- Metrica: (a) % de responsabilidades classificadas, (b) valor total em atraso
- Baseline atual: R$ 2,5M+ em atraso, responsabilidade nao classificada em varios imoveis
- Meta: 100% classificados em 30 dias; 0 novos atrasos em 6 meses
- Como medir: planilha com coluna "responsavel" preenchida + acompanhamento de divida ativa

**Riscos e mitigacao**:

| Risco | Probabilidade | Mitigacao |
|-------|-------------|-----------|
| Juridico nao responder classificacao a tempo | Alta | Usar SLA do M2; escalar P0 para debitos > R$ 100k |
| Proprietario contestar responsabilidade | Media | Ter copia da clausula contratual no ticket |
| Debitos em divida ativa (fora do escopo) | Confirmado | Identificar e transferir formalmente para Juridico |

**Dependencias**: M2 (SLA Juridico) — iniciar M5 logo apos M2 ter SLA acordado

---

## Plano de Implementacao

### Visao Geral (IMP-5)

- **Solucao**: Sprint de classificacao + notificacoes a proprietarios + rotina mensal
- **Nivel**: N1 (processo documentado)
- **Sistema(s)**: Google Sheets + Google Forms (tickets M2)
- **Esforco estimado**: 2-3 semanas de trabalho analitico
- **Responsavel sugerido**: Erika Souza

### Passo 1: Sprint de classificacao (semana 1 de IMP-5)

Para cada imovel com TOTAL_EM_ATRASO > 0 na planilha SITUACAO GERAL IPTU:
1. Verificar clausula IPTU no contrato de locacao da unidade.
2. Classificar: "Real Estate" | "Proprietario" | "Em disputa" | "Divida Ativa" (Juridico).
3. Para "Em disputa": abrir ticket via IMP-2 com tipo "Consulta IPTU / responsabilidade".
4. Para "Proprietario": emitir notificacao formal.

**Template de notificacao ao proprietario**:
```
Assunto: Notificacao — IPTU em atraso — [Endereco]

Prezado(a) [Nome do Proprietario],

Verificamos que o IPTU do imovel em [endereco] encontra-se em atraso
desde [data], conforme clausula [X] do contrato de locacao vigente,
que atribui ao [locador/locatario] a responsabilidade pelo tributo.

Solicitamos regularizacao em 15 dias uteis.

Atenciosamente,
Equipe Real Estate — Raiz Educacao
[erika.souza@raizeducacao.com.br]
```

### Passo 2: Regularizacao dos debitos de responsabilidade Real Estate

1. Para cada debito "Real Estate": calcular valor total atual (portal da prefeitura).
2. Priorizar por valor e risco de execucao fiscal.
3. Caso Botafogo (R$ 247k): verificar se em divida ativa no portal da Prefeitura do Rio. Se sim: transferir para Juridico via ticket P0. Se nao: solicitar parcelamento ao Financeiro.
4. Registrar na planilha: STATUS_ATUAL = "Regularizando" + numero do protocolo.

### Passo 3: Rotina mensal

Lembrete recorrente no Google Calendar, primeiro dia util do mes:
1. Verificar novas cotas vencidas.
2. Verificar status dos tickets Juridico.
3. Verificar pagamentos realizados.
4. Atualizar STATUS_ATUAL na planilha.

### Teste de Validacao

| # | Cenario | Resultado esperado |
|---|---------|-------------------|
| 1 | 100% dos imoveis com atraso classificados | Coluna RESPONSAVEL preenchida para todos |
| 2 | Ticket aberto para cada "Em disputa" > R$ 10k | Registro na planilha de tickets |
| 3 | Notificacao enviada para pelo menos 1 proprietario inadimplente | Email de notificacao com copia na planilha |

### Posicao no Cronograma

| Semana | Implementacao | Responsavel | Dependencia |
|--------|--------------|-------------|-------------|
| 3-6 | IMP-5: sprint IPTU (classificacao + cobrancas) | Erika | IMP-2 (M2) |
