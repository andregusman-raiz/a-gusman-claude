# M7 — Automacao de Cobranca de Overdue (Apps Script D+X)

**Processo**: real_estate
**Nivel**: N1
**Prioridade**: Quick Win
**Timeline**: 2-3 dias
**Responsavel**: Daniel Souza
**Resolve**: P7 (overdue sem processo)

---

## Descricao

- **Problema resolvido**: P7 (overdue sem processo)
- **Gap de origem**: Controle reativo sem SLA de cobranca

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Automacao N1 |
| **Problema(s)** | P7 |
| **Impacto** | 2/5 |
| **Esforco** | 1/5 |
| **Dono sugerido** | Daniel Souza |
| **Timeline** | 2-3 dias |

**Descricao (o que fazer)**:

1. Na planilha OVERDUE SUBLOCACAO E CANTINAS: revisar estrutura de colunas para garantir: sublocatario, vencimento, valor, data pagamento, status (em aberto/pago/acordo).
2. Definir regra de cobranca: D+3 = email automatico; D+10 = email formal; D+20 = escalonamento para Erika.
3. Configurar Apps Script que leia a planilha diariamente e envie emails de cobranca conforme regra.
4. Template de email de cobranca: tom profissional, com dados da divida, conta bancaria e prazo.
5. Registrar data de envio de cada cobranca na planilha (coluna "ultima cobranca").

**KPI de sucesso**:
- Metrica: dias medios de atraso no recebimento de overdue
- Baseline atual: nao mensurado (processo manual)
- Meta: reducao de 50% no saldo overdue em 60 dias
- Como medir: coluna "valor em aberto" na planilha vs mes anterior

**Dependencias**: Nenhuma

---

## Plano de Implementacao

### Visao Geral (IMP-7)

- **Solucao**: Apps Script com regra D+3 (email automatico) / D+10 (email formal) / D+20 (escalonamento)
- **Nivel**: N1
- **Sistema(s)**: Google Sheets + Apps Script
- **Esforco estimado**: 2-3 horas
- **Responsavel sugerido**: Daniel Souza

### Passo 1: Verificar estrutura da planilha OVERDUE

**Colunas necessarias**:
```
SUBLOCATARIO | TIPO | COMPETENCIA | VALOR | DATA_VENCIMENTO |
DATA_PAGAMENTO | STATUS | DATA_ULTIMA_COBRANCA | QTD_COBRANCAS | EMAIL_CONTATO
```

Adicionar as colunas que faltarem e preencher EMAIL_CONTATO para cada sublocatario/cantina.

### Passo 2: Script de cobranca automatica

Funcao `cobrarOverdue()` roda diariamente 10:00. Logica:

```
Para cada linha onde:
  - DATA_PAGAMENTO esta vazia
  - STATUS != "Pago" e != "Cancelado"
  - DATA_VENCIMENTO < hoje - 3 dias

Se QTD_COBRANCAS < 2 E dias desde ultima cobranca >= 5:
  → Enviar email para EMAIL_CONTATO com dados do debito
  → Atualizar DATA_ULTIMA_COBRANCA e QTD_COBRANCAS

Se QTD_COBRANCAS >= 2 OU dias_atraso >= 20:
  → Incluir no relatorio de escalonamento para Erika (nao enviar email automatico)

Ao final: enviar relatorio de acoes realizadas para Erika
```

**Template de email de cobranca**:
```
Assunto: Aviso de vencimento — Sublocacao [competencia]

Prezado(a),

O pagamento referente a [competencia] no valor de R$ [valor],
com vencimento em [data], ainda nao foi localizado.

Para regularizacao: [conta bancaria / dados de pagamento]

Contato: erika.souza@raizeducacao.com.br

Raiz Educacao — Real Estate
```

**Trigger**: Diario, 10:00-11:00

### Rollback

Deletar o trigger. Emails ja enviados nao podem ser cancelados, mas o processo para.
**Ponto de nao-retorno**: Primeiro email de cobranca enviado ao sublocatario.

### Posicao no Cronograma

| Semana | Implementacao | Responsavel | Dependencia |
|--------|--------------|-------------|-------------|
| 2 (dias 1-2) | IMP-7: automacao overdue | Daniel | Nenhuma |
