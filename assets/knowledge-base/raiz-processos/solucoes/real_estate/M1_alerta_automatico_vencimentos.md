# M1 — Alerta Automatico de Vencimentos Criticos (Apps Script)

**Processo**: real_estate
**Nivel**: N1
**Prioridade**: Quick Win
**Timeline**: 3-5 dias
**Responsavel**: Daniel Souza (executa) + Erika Souza (define regras)
**Resolve**: P1 (seguro), P3 (contratos), P5 (cantinas), P7 (overdue)

---

## Descricao

- **Problema resolvido**: P1 (seguro), P3 (contratos), P5 (cantinas), P7 (overdue)
- **Gap de origem**: Ausencia de N1 basico — planilhas estaticas sem alertas

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Automacao N1 |
| **Problema(s)** | P1, P3, P5, P7 |
| **Impacto** | 5/5 |
| **Esforco** | 1/5 |
| **Dono sugerido** | Daniel Souza (executa) + Erika Souza (define regras) |
| **Timeline** | 3-5 dias |

**Descricao (o que fazer)**:

1. Na planilha DADOS IMOVEIS: adicionar coluna "Data vencimento seguro" e "D-90 alerta" com Apps Script que envia email diario quando D-hoje <= 90 dias do vencimento.
2. Na planilha CONTRATOS ATIVOS: adicionar coluna "Status renovacao" + Apps Script com alerta D-120 (contratos), D-90 (seguros), D-60 (final warning).
3. Configurar destinatarios: Erika Souza (primario) + email gerencia (CC nos alertas criticos D-30).
4. Regra especifica para seguros: alertar em agosto para renovacao com vigencia correta (abr/XX → abr/XX+1), com campo de validacao "vigencia conferida? [S/N]".
5. Testar com 2-3 registros antes de ativar para toda a base.

**KPI de sucesso**:
- Metrica: zero vencimentos detectados tardiamente (pos-vencimento)
- Baseline atual: 100% de controle manual (1 falha critica identificada — Apogeu)
- Meta: 0 falhas de controle de vencimento nos proximos 12 meses
- Como medir: registro de incidentes de vencimento descoberto tardiamente

**Riscos e mitigacao**:

| Risco | Probabilidade | Mitigacao |
|-------|-------------|-----------|
| Apps Script nao ter permissao de envio de email | Baixa | Usar conta de servico ou conta pessoal da area |
| Planilhas com dados desatualizados invalidam alertas | Media | Incluir campo "ultima atualizacao" com alerta se > 30 dias sem edicao |
| Excesso de emails gera ignore (fadiga de alerta) | Media | Calibrar para D-90, D-60, D-30 apenas (nao diario) |

**Dependencias**: Nenhuma — pode ser iniciado imediatamente

---

## Plano de Implementacao

### Visao Geral (IMP-1)

- **Solucao**: Google Apps Script rodando nas planilhas existentes
- **Nivel**: N1
- **Sistema(s)**: Google Sheets + Apps Script
- **Esforco estimado**: 3-4 horas de configuracao
- **Responsavel sugerido**: Daniel Souza

### Pre-Requisitos

| # | Pre-requisito | Status | Como verificar |
|---|--------------|--------|----------------|
| 1 | Acesso editor nas planilhas: DADOS IMOVEIS, CONTRATOS ATIVOS, SITUACAO GERAL IPTU, OVERDUE SUBLOCACAO E CANTINAS, ESTIMATIVA 2026 | [ ] | Abrir cada planilha e verificar permissao |
| 2 | Conta Google com permissao para envio de email (quota: 100 emails/dia no plano gratuito, 1500/dia no Workspace) | [ ] | Testar envio manual de email pela conta |
| 3 | Lista de emails dos destinatarios de alerta (Erika, Daniel, gerencia) | [ ] | Confirmar com Erika |

### Passo a Passo

#### Passo 1: Preparar a planilha DADOS IMOVEIS para alertas de seguro

**Sistema**: Google Sheets
**Caminho**: Abrir planilha DADOS IMOVEIS > verificar estrutura de colunas

**Acao**:
1. Identificar (ou criar) coluna "DATA_VENC_SEGURO" — formato: DD/MM/AAAA
2. Identificar (ou criar) coluna "SEGURADORA"
3. Identificar (ou criar) coluna "VIGENCIA_INICIO" e "VIGENCIA_FIM"
4. Adicionar coluna "ALERTADO_90D" e "ALERTADO_30D" — valores S/N (para evitar email duplicado)
5. Preencher dados de todos os imoveis com seus seguros atuais

**Verificacao**: Planilha tem pelo menos as colunas: UNIDADE, DATA_VENC_SEGURO, SEGURADORA, VIGENCIA_FIM

#### Passo 2: Criar script de alerta de seguros

**Sistema**: Google Apps Script
**Caminho**: Planilha DADOS IMOVEIS > Extensoes > Apps Script

**Acao**: Criar arquivo `alertas_seguros.gs` com o seguinte codigo:

```javascript
function verificarVencimentosSeguros() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet()
                .getSheetByName("SEGUROS"); // ajustar nome da aba
  var dados = sheet.getDataRange().getValues();
  var hoje = new Date();

  var emailDestino = "erika.souza@raizeducacao.com.br"; // ajustar
  var emailCC = "gerencia.re@raizeducacao.com.br"; // ajustar

  var alertas90 = [];
  var alertas30 = [];
  var vencidos = [];

  // cabecalho na linha 1, dados a partir da linha 2
  // ajustar indices de coluna conforme estrutura real da planilha
  var COL_UNIDADE = 0;      // coluna A
  var COL_SEGURADORA = 1;   // coluna B
  var COL_VENC = 2;         // coluna C — DATA_VENC_SEGURO
  var COL_ALERT_90 = 3;     // coluna D — ALERTADO_90D
  var COL_ALERT_30 = 4;     // coluna E — ALERTADO_30D

  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (!linha[COL_VENC]) continue;

    var vencimento = new Date(linha[COL_VENC]);
    var diasRestantes = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
    var unidade = linha[COL_UNIDADE];
    var seguradora = linha[COL_SEGURADORA];

    if (diasRestantes < 0) {
      vencidos.push({unidade: unidade, seguradora: seguradora, dias: Math.abs(diasRestantes)});
    } else if (diasRestantes <= 30 && linha[COL_ALERT_30] !== "S") {
      alertas30.push({unidade: unidade, seguradora: seguradora, diasRestantes: diasRestantes});
      sheet.getRange(i+1, COL_ALERT_30+1).setValue("S");
    } else if (diasRestantes <= 90 && linha[COL_ALERT_90] !== "S") {
      alertas90.push({unidade: unidade, seguradora: seguradora, diasRestantes: diasRestantes});
      sheet.getRange(i+1, COL_ALERT_90+1).setValue("S");
    }
  }

  if (vencidos.length > 0 || alertas30.length > 0 || alertas90.length > 0) {
    var corpo = montarEmailSeguros(vencidos, alertas30, alertas90);
    var assunto = "[REAL ESTATE] Alertas de Seguro Patrimonial — " +
                  Utilities.formatDate(hoje, "America/Sao_Paulo", "dd/MM/yyyy");

    GmailApp.sendEmail(emailDestino, assunto, corpo, {cc: emailCC});
  }
}

function montarEmailSeguros(vencidos, alertas30, alertas90) {
  var linhas = ["=== ALERTAS DE SEGURO PATRIMONIAL ===\n"];

  if (vencidos.length > 0) {
    linhas.push("CRITICO — SEGUROS VENCIDOS:");
    vencidos.forEach(function(v) {
      linhas.push("  [!] " + v.unidade + " — " + v.seguradora + " — vencido ha " + v.dias + " dias");
    });
    linhas.push("");
  }

  if (alertas30.length > 0) {
    linhas.push("URGENTE — VENCEM EM MENOS DE 30 DIAS:");
    alertas30.forEach(function(v) {
      linhas.push("  >> " + v.unidade + " — " + v.seguradora + " — " + v.diasRestantes + " dias restantes");
    });
    linhas.push("");
  }

  if (alertas90.length > 0) {
    linhas.push("ATENCAO — VENCEM EM MENOS DE 90 DIAS:");
    alertas90.forEach(function(v) {
      linhas.push("  > " + v.unidade + " — " + v.seguradora + " — " + v.diasRestantes + " dias restantes");
    });
  }

  linhas.push("\nAcesse a planilha: [inserir link]");
  return linhas.join("\n");
}
```

**Configuracao do trigger**:
- Apps Script > Gatilhos (icone relogio) > Adicionar gatilho
- Funcao: `verificarVencimentosSeguros`
- Tipo de evento: Baseado em tempo > Diario > entre 08:00-09:00

**Verificacao**: Executar manualmente a funcao uma vez e confirmar email recebido

#### Passo 3: Replicar para planilha CONTRATOS ATIVOS

**Sistema**: Google Sheets + Apps Script
**Caminho**: Planilha CONTRATOS ATIVOS > Extensoes > Apps Script

**Acao**:
1. Criar arquivo `alertas_contratos.gs` com logica similar ao Passo 2.
2. Ajustar colunas para estrutura de contratos: UNIDADE, PROPRIETARIO, DATA_INICIO, DATA_FIM, STATUS_RENOVACAO.
3. Limites de alerta para contratos: D-120 (iniciar negociacao), D-60 (alerta medio), D-30 (urgencia).
4. Adicionar campo especial: se DATA_FIM < hoje e STATUS_RENOVACAO != "Renovado" → alerta CRITICO.

**Verificacao**: Executar com dados de teste (inserir contrato com vencimento em 45 dias e verificar email)

#### Passo 4: Adicionar colunas prospectivas na planilha SITUACAO GERAL IPTU

**Sistema**: Google Sheets
**Caminho**: Planilha SITUACAO GERAL IPTU

**Acao**:
1. Adicionar coluna "RESPONSAVEL_PAGAMENTO" com valores: "Real Estate" | "Proprietario" | "Em disputa" | "Divida Ativa Juridico"
2. Adicionar coluna "PROXIMO_VENCIMENTO_COTA" — data da proxima cota a pagar
3. Adicionar coluna "STATUS_ATUAL" — "Em dia" | "Em atraso" | "Acordo em andamento" | "Pago proprietario"
4. Adicionar coluna "TICKET_JURIDICO" — numero do ticket associado (para rastreabilidade)
5. Configurar alerta: se RESPONSAVEL = "Real Estate" e DATA_VENCIMENTO < hoje + 15 dias → email

**Verificacao**: Planilha com pelo menos 5 registros preenchidos nas novas colunas

### Teste de Validacao

| # | Cenario | Dados de teste | Resultado esperado | Como verificar |
|---|---------|---------------|-------------------|----------------|
| 1 | Seguro vencendo em 25 dias | Inserir linha com DATA_VENC_SEGURO = hoje + 25 | Email com alerta D-30 enviado | Verificar inbox de erika.souza |
| 2 | Contrato vencido sem renovacao | DATA_FIM = ontem, STATUS_RENOVACAO = "Pendente" | Email com alerta CRITICO | Verificar inbox |
| 3 | Todos seguros em dia (> 90 dias) | Alterar todas as datas para hoje + 100 | Nenhum email enviado | Verificar que nao chegou email |

### Checklist de Consistencia

| # | Verificacao | Status |
|---|------------|--------|
| 1 | Apps Script tem acesso a GmailApp (permissao concedida) | [VERIFICAR na primeira execucao] |
| 2 | Quota de email nao excedida (100/dia conta pessoal, 1500/dia Workspace) | OK — volume esperado < 5 emails/dia |
| 3 | Colunas da planilha batem com indices no script | [VERIFICAR ao adaptar o codigo] |
| 4 | Trigger configurado para rodar diariamente | [VERIFICAR apos configuracao] |

### Rollback

**Backup antes de iniciar**: Exportar backup das planilhas em Excel antes de adicionar colunas novas.

**Como reverter**:
1. Excluir o Apps Script (Extensoes > Apps Script > excluir arquivo)
2. Excluir os triggers (Apps Script > Gatilhos > excluir)
3. Esconder ou deletar as colunas adicionadas

**Ponto de nao-retorno**: N/A — Apps Script so le dados e envia emails. Nao altera dados existentes.

### Notas Tecnicas

**Limite Apps Script**:
- Quota de email: 100/dia (conta pessoal Google), 1500/dia (Workspace)
- Para ~30 imoveis, ~10-15 sublocacoes: ambas as cotas sao confortaveis
- Timeout de execucao: 6 minutos por execucao — ok para o volume atual

**Quando escalar para N3 (n8n)**:
- Volume de alertas exceder 50 emails/dia
- Precisar de alertas no Slack alem de email
- Precisar de integracao com TOTVS ou outros sistemas
- O n8n ja esta disponivel em https://n8n.raizeducacao.com.br
- Os scripts Apps Script servem como documentacao funcional para a migracao para n8n

### Posicao no Cronograma

| Semana | Implementacao | Responsavel | Dependencia |
|--------|--------------|-------------|-------------|
| 1 (dias 1-2) | IMP-1: alertas seguros e contratos | Daniel | Nenhuma |
| 1 (dias 3-4) | IMP-1: alertas IPTU + colunas prospectivas | Daniel | Dias 1-2 |
