# Financeiro Educacional

> Contratos, parcelas/mensalidades, bolsas e lançamentos financeiros. Ponte entre o módulo educacional (S) e o financeiro (F/Fluxus).

---

## Hierarquia

```
SHABILITACAOALUNO (Aluno no Curso)
└── SContrato (Contrato Educacional)
    ├── SParcela (Parcelas/Mensalidades)
    │   └── SLAN (Ponte educacional → financeiro)
    │       └── FLAN* (Lançamento Financeiro — módulo Fluxus)
    │           └── FLANBAIXA* (Pagamentos)
    │
    └── SBOLSAALUNO (Bolsas concedidas)
        └── SBOLSALAN (Desconto por lançamento)

*FLAN e FLANBAIXA são do módulo Financeiro (F), não do Educacional (S)
```

---

## Tabelas (7)

| Tabela | Nome de Negócio | DataServer | Campos | PII |
|--------|----------------|------------|--------|-----|
| SBOLSACOMPL | SBOLSACOMPL | EduBolsaData | 6 |  |
| SBOLSARETROATIVACONTRATO | SBOLSARETROATIVACONTRATO | EduContratoData | 14 |  |
| SBolsa | Bolsa de Estudo | EduBolsaData | 26 | Sim |
| SCONTRATOACESSOS | SCONTRATOACESSOS | EduContratoData | 15 | Sim |
| SContrato | Contrato Educacional | EduContratoData | 55 |  |
| SParcela | Parcela/Mensalidade | EduParcelaData | 29 |  |
| SResponsavelContrato | SResponsavelContrato | EduContratoData | 10 |  |

---

## Campos por Tabela

### SBOLSACOMPL — SBOLSACOMPL (6 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODBOLSA | CODBOLSA | xs:string | Sim | → SBOLSA |  |
| RECCREATEDBY | RECCREATEDBY | xs:string |  |  |  |
| RECMODIFIEDBY | RECMODIFIEDBY | xs:string |  |  |  |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| RECCREATEDON | RECCREATEDON | xs:dateTime |  |  |  |
| RECMODIFIEDON | RECMODIFIEDON | xs:dateTime |  |  |  |

### SBOLSARETROATIVACONTRATO — SBOLSARETROATIVACONTRATO (14 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| RA | R.A. | xs:string | Sim |  |  |
| CODCONTRATO | Cód. do contrato | xs:string | Sim |  |  |
| CLASSIFICACAO | Classificação | xs:string |  |  |  |
| FORMAUTILIZACAO | Forma de utilização do crédito | xs:string |  |  |  |
| FORMAAPROVEITAMENTO | Forma de aproveitamento do crédito | xs:string |  |  |  |
| CODBOLSA | Cód. da bolsa | xs:string | Sim | → SBOLSA |  |
| NOMEBOLSA | Nome | xs:string | Sim |  |  |
| CODSERVICO | Cód. do serviço | xs:string |  | → SSERVICO |  |
| NOMESERVICO | Nome Serviço | xs:string |  |  |  |
| CODCOLIGADA | Cód. Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDPERLET | Id. Período letivo | xs:int | Sim | → SPLETIVO |  |
| IDBOLSAALUNO | Id. Bolsa Aluno | xs:string | Sim |  |  |
| VALOR | Valor do crédito/débito gerado | xs:decimal |  |  |  |
| VALORRESTANTE | Valor restante do crédito/débito gerado | xs:decimal |  |  |  |

### SBolsa — Bolsa de Estudo (26 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODBOLSA | Código | xs:string | Sim | → SBOLSA |  |
| CODCFO | Código do responsável financeiro | xs:string |  |  |  |
| NOME | Nome | xs:string | Sim |  | PII |
| VALIDADELIMITADA | Bolsa incondicional | xs:string |  |  |  |
| FIES | FIES | xs:string |  |  |  |
| BOLSAFUNC | Bolsa de funcionário | xs:string |  |  |  |
| TIPOSAC | Tipo de sacado | xs:string |  |  |  |
| ATIVA | Bolsa ativa | xs:string |  |  |  |
| TIPODESC | Tipo de desconto | xs:string | Sim |  |  |
| PERMITEALTERARVALOR | Permite alterar valor | xs:string |  |  |  |
| NOMERESPONSAVELBOLSACRED | Responsável Financeiro | xs:string |  |  |  |
| CODCLASSIFICACAO | Classificação | xs:string |  |  |  |
| VERIFICAINADIMPLENCIA | Verifica inadimplência do outro sacado | xs:string |  |  |  |
| CONTABCOMPETENCIA | Compõe contabilização por competência | xs:string |  |  |  |
| ORDEMAPLICDESCANTECIPACAO | Aplicar desconto por antecipação | xs:string |  |  |  |
| AFETABASECALCULO | Afeta base de cálculo | xs:string |  |  |  |
| CODCOLIGADA | Cód. Coligada | xs:short | Sim | → GCOLIGADA |  |
| VALOR | Desconto (%) | xs:decimal | Sim |  |  |
| CODTIPOCURSO | Cód. Nível de ensino | xs:short | Sim | → STIPOCURSO |  |
| CODCOLCFO | Coligada do cliente/fornecedor | xs:short |  |  |  |
| ORDEMPERDA | Ordem de perda | xs:short |  |  |  |
| RENOVACAOAUTOMATICA | RENOVACAOAUTOMATICA | xs:string |  |  |  |
| APLICFORMULA | APLICFORMULA | xs:string |  |  |  |
| CODFORMULAPERCENTUAL | Fórmula para percentual | xs:string |  |  |  |
| CODFORMULAVALOR | Fórmula para valor | xs:string |  |  |  |
| TIPOCONTABLANOUTROSACADO | Tipo contábil do lançamento do outro sacado | xs:short |  |  |  |

### SCONTRATOACESSOS — SCONTRATOACESSOS (15 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCONTRATO | Cód. do contrato | xs:string | Sim |  |  |
| CODCOLIGADA | Cód. Coligada | xs:short | Sim | → GCOLIGADA |  |
| RA | R.A. | xs:string |  |  |  |
| IDPERLET | Período letivo | xs:int |  | → SPLETIVO |  |
| STATUS | Permitir Acesso | xs:boolean | Sim |  |  |
| NOME | Nome | xs:string | Sim |  | PII |
| CODUSUARIO | Código do usuário | xs:string | Sim |  |  |
| TIPORELACIONAMENTO | Tipo de Relacionamento | xs:string | Sim |  |  |
| RECCREATEDBY | RECCREATEDBY | xs:string |  |  |  |
| RECCREATEDON | RECCREATEDON | xs:dateTime |  |  |  |
| RECMODIFIEDBY | RECMODIFIEDBY | xs:string |  |  |  |
| RECMODIFIEDON | RECMODIFIEDON | xs:dateTime |  |  |  |
| CODPESSOA | CODPESSOA | xs:int |  | → PPESSOA |  |
| CODCOLCFO | CODCOLCFO | xs:short |  |  |  |
| CODCFO | CODCFO | xs:string |  |  |  |

### SContrato — Contrato Educacional (55 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| RA | R.A. | xs:string | Sim |  |  |
| CODCONTRATO | Cód. do contrato | xs:string | Sim |  |  |
| CODPLANOPGTO | Código do plano de pagamento | xs:string |  |  |  |
| TIPOCONTRATO | Tipo do contrato | xs:string | Sim |  |  |
| CODCCUSTO | Custo | xs:string |  |  |  |
| ASSINADO | Assinado | xs:string |  |  |  |
| DIAFIXO | Dia fixo | xs:string |  |  |  |
| STATUS | Cancelado | xs:string |  |  |  |
| TIPOBOLSA | Tipo da bolsa | xs:string | Sim |  |  |
| NOMEALUNO | Aluno | xs:string |  |  |  |
| NOMEHABILITACAO | Habilitação | xs:string |  |  |  |
| NOMECURSO | Curso | xs:string |  |  |  |
| NOMETURNO | Turno | xs:string |  |  |  |
| CODTURMA | Turma | xs:string |  |  |  |
| CODPERLET | Período letivo | xs:string |  |  |  |
| NOMEPLANOPGTO | Nome do plano de pagamento | xs:string |  |  |  |
| DESCRICAOPLANOPGTO | Descrição do plano de pagamento | xs:string |  |  |  |
| DESCGRADE | Matriz curricular | xs:string |  |  |  |
| STATUSCONT | Status da contabilização | xs:string |  |  |  |
| USARSOLICITACAO | Utilizar contrato em solicitações do aluno pelo portal | xs:string |  |  |  |
| PERIODOCONTABIL | Controle contábil | xs:string |  |  |  |
| USARPESQEXT | Utilizar contrato em solicitações de Pesquisa/Extensão | xs:string |  |  |  |
| CODPLANOPGTOPERSONALIZ | Plano de pagamento modelo | xs:string |  |  |  |
| CODUSUARIOPERSONALIZ | Usuário responsável pela personalização | xs:string |  |  |  |
| CONSIDERADESCANTECIPACAO | Considera desconto por antecipação | xs:string |  |  |  |
| CONSIDERADESCANTECIPACAOBOLSA | Considerar o valor do desconto por antecipação no valor base para calcular o valor da(s) bolsa(s). | xs:string |  |  |  |
| NOMETURMA | Nome da turma | xs:string |  |  |  |
| CODCOLIGADA | Cód. Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDPERLET | Id. Período letivo | xs:int | Sim | → SPLETIVO |  |
| IDHABILITACAOFILIAL | Matriz aplicada | xs:int |  | → SHABILITACAOFILIAL |  |

*... e mais 25 campos. Ver schema.json para lista completa.*

### SParcela — Parcela/Mensalidade (29 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| RA | R.A. | xs:string | Sim |  |  |
| CODCONTRATO | Cód. do contrato | xs:string | Sim |  |  |
| CODSERVICO | Cód. do serviço | xs:string | Sim | → SSERVICO |  |
| TIPODESC | Tipo de desconto | xs:string |  |  |  |
| TIPOPARCELA | Tipo parcela | xs:string |  |  |  |
| VALORAUTOMATICO | Valor calculado pelo número de créditos | xs:string |  |  |  |
| NOMESERVICO | Serviço | xs:string |  |  |  |
| ORIGEM | Origem | xs:string |  |  |  |
| CODCOLIGADA | Cód. Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDPARCELA | Identificador da parcela | xs:int | Sim |  |  |
| IDPERLET | Período letivo | xs:int | Sim | → SPLETIVO |  |
| PARCELA | Parcela | xs:short | Sim |  |  |
| COTA | Cota | xs:short | Sim |  |  |
| VALOR | Valor | xs:decimal |  |  |  |
| DTVENCIMENTO | Dt. vencimento | xs:dateTime | Sim |  |  |
| DESCONTO | Desconto contabilizado | xs:decimal |  |  |  |
| DTCOMPETENCIA | Dt. competência | xs:dateTime |  |  |  |
| IDLAN | Ref. | xs:int |  |  |  |
| ORIGEMCONTACORRENTE | Origem da conta corrente do aluno | xs:string |  |  |  |
| VALORORIGINAL | Valor Original | xs:decimal |  |  |  |
| VLRBOLSAATEVENC | Valor bolsa condicional | xs:decimal |  |  |  |
| VLRBOLSAPOSVENC | Valor bolsa incondicional | xs:decimal |  |  |  |
| VLRDESCONTO | Valor de desconto | xs:decimal |  |  |  |
| VLRLIQUIDO | Valor líquido | xs:decimal |  |  |  |
| VLRCREDRETROATIVO | Valor Crédito Retroativo | xs:decimal |  |  |  |
| RECCREATEDBY | RECCREATEDBY | xs:string |  |  |  |
| RECCREATEDON | RECCREATEDON | xs:dateTime |  |  |  |
| RECMODIFIEDBY | RECMODIFIEDBY | xs:string |  |  |  |
| RECMODIFIEDON | RECMODIFIEDON | xs:dateTime |  |  |  |

### SResponsavelContrato — SResponsavelContrato (10 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCONTRATO | Cód. do contrato | xs:string | Sim |  |  |
| RESPMOVIMENTO | Responsável financeiro do movimento | xs:string |  |  |  |
| DADOSACADEMICOS | Responsável financeiro com acesso aos dados acadêmicos | xs:string |  |  |  |
| CODCOLIGADA | Cód. Coligada | xs:short | Sim | → GCOLIGADA |  |
| RA | R.A. | xs:string |  |  |  |
| IDPERLET | Período letivo | xs:int |  | → SPLETIVO |  |
| CODCOLCFO | Coligada do cliente/fornecedor | xs:short | Sim |  |  |
| CODCFO | Código do responsável financeiro | xs:string | Sim |  |  |
| PERCENTUAL | Percentual | xs:decimal | Sim |  |  |
| NOMECLIFOR | Responsável Financeiro | xs:string |  |  |  |

---

## Regras de Negócio

- Contrato criado automaticamente quando SSTATUS.PLEXIGECONTRATO = 'S'
- Contrato cancelado quando matrícula muda para status com PLCANCELACONTRATO = 'S'
- Rematrícula gera NOVO contrato para o período seguinte
- Inadimplência bloqueia portal/rematrícula quando PLVALINADIMPLMATRICPORTAL = 'S'

---

## Queries Disponíveis (4)

| Query | Descrição | Tabelas | Caso de Uso |
|-------|-----------|---------|-------------|
| inadimplentes-periodo | Alunos com parcelas vencidas no período | SPARCELA, SCONTRATO, SALUNO | Cobrança, relatório financeiro |
| bolsistas-ativos | Alunos com bolsa ativa e percentual de desconto | SBOLSAALUNO, SBOLSA, SALUNO | Gestão de bolsas, relatório social |
| receita-por-coligada | Receita total e inadimplência por coligada/período | FLAN, FLANBAIXA, SLAN | Dashboard financeiro, DRE educacional |
| inadimplencia-acumulada | Inadimplência acumulada por faixa de atraso (30/60/90+ dias) | SPARCELA, FLAN, FLANBAIXA | Relatório de aging de recebíveis |

---

## APIs

### SOAP DataServers neste domínio
- `EduBolsaData`
- `EduContratoData`
- `EduParcelaData`

*Ver apis.json para endpoints REST e status detalhado.*
