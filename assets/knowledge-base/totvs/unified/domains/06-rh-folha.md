# RH / Folha de Pagamento

> Funcionários (professores e staff), complementos, histórico salarial e estabilidade. Módulo Labore/FOP — 524 campos só em PFunc (maior tabela do RM).

---

## Hierarquia

```
PFunc (Funcionário — 524 campos)
├── PFCOMPL (Dados complementares)
├── PFHSTHOR (Histórico de horário)
├── PFHSTSEC (Histórico de seção/departamento)
├── PFHSTUTILIZAPONTOAHGORA (Ponto eletrônico)
├── PEstabilidadeProvisoria (Estabilidade)
├── PPendenciaDemissional (Pendências demissão)
└── VPCOMPL (Complemento VP)
```

---

## Tabelas (8)

| Tabela | Nome de Negócio | DataServer | Campos | PII |
|--------|----------------|------------|--------|-----|
| PEstabilidadeProvisoria | PEstabilidadeProvisoria | FopFuncData | 8 |  |
| PFCOMPL | PFCOMPL | FopFuncData | 54 |  |
| PFHSTHOR | PFHSTHOR | FopFuncData | 7 |  |
| PFHSTSEC | PFHSTSEC | FopFuncData | 5 |  |
| PFHSTUTILIZAPONTOAHGORA | PFHSTUTILIZAPONTOAHGORA | FopFuncData | 4 |  |
| PFunc | Funcionário (Folha) | FopFuncData | 524 | Sim |
| PPendenciaDemissional | PPendenciaDemissional | FopFuncData | 3 |  |
| VPCOMPL | VPCOMPL | FopFuncData | 7 |  |

---

## Campos por Tabela

### PEstabilidadeProvisoria — PEstabilidadeProvisoria (8 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short |  | → GCOLIGADA |  |
| CHAPA | CHAPA | xs:string |  |  |  |
| DESCRICAO | Descrição | xs:string | Sim |  |  |
| DTINICIO | Início Estabilidade | xs:dateTime |  |  |  |
| DTFIM | Fim Estabilidade | xs:dateTime |  |  |  |
| DataExoneracao | DataExoneracao | xs:dateTime |  |  |  |
| TemEstabilidade | TemEstabilidade | xs:short |  |  |  |
| RepresentanteEmpregador | RepresentanteEmpregador | xs:short |  |  |  |

### PFCOMPL — PFCOMPL (54 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CHAPA | CHAPA | xs:string | Sim |  |  |
| OPCAOVR | OPCAOVR | xs:string |  |  |  |
| PLANOODONTO | PLANOODONTO | xs:string |  |  |  |
| DUTVRMES | DUTVRMES | xs:int |  |  |  |
| DUTVRPMESX | DUTVRPMESX | xs:int |  |  |  |
| PLSAUDE | PLSAUDE | xs:string |  |  |  |
| MATSODEXO | MATSODEXO | xs:string |  |  |  |
| MATFETRANSPOR | MATFETRANSPOR | xs:string |  |  |  |
| DOMAMIL | DOMAMIL | xs:string |  |  |  |
| FETRANSPOR | FETRANSPOR | xs:string |  |  |  |
| CESTABASICA | CESTABASICA | xs:string |  |  |  |
| PLANOUNIMED | PLANOUNIMED | xs:string |  |  |  |
| PLANOEMPRESA | PLANOEMPRESA | xs:decimal |  |  |  |
| ADTEMPACUM | ADTEMPACUM | xs:decimal |  |  |  |
| MAIORREMPROF | MAIORREMPROF | xs:decimal |  |  |  |
| QUADRIENIO4 | QUADRIENIO4 | xs:string |  |  |  |
| QUADRIENIO_4 | QUADRIENIO_4 | xs:int |  |  |  |
| PREPOSTO | PREPOSTO | xs:string |  |  |  |
| CODPREPOSTO | CODPREPOSTO | xs:int |  |  |  |
| QUINQUENIO_5 | QUINQUENIO_5 | xs:int |  |  |  |
| DIFMAIORSALARIO | DIFMAIORSALARIO | xs:decimal |  |  |  |
| ENVIA_CARTAINSS | ENVIA_CARTAINSS | xs:string |  |  |  |
| ENVIACARTAINSS | ENVIACARTAINSS | xs:string |  |  |  |
| DTJORREDUZIDA | DTJORREDUZIDA | xs:dateTime |  |  |  |
| DTRETORNO | DTRETORNO | xs:dateTime |  |  |  |
| PERCREDUTO | PERCREDUTO | xs:int |  |  |  |
| REDUCAO | REDUCAO | xs:string |  |  |  |
| DIASREDUCAO | DIASREDUCAO | xs:string |  |  |  |
| SALARIOREDUZIDO | SALARIOREDUZIDO | xs:decimal |  |  |  |

*... e mais 24 campos. Ver schema.json para lista completa.*

### PFHSTHOR — PFHSTHOR (7 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CHAPA | CHAPA | xs:string | Sim |  |  |
| DTMUDANCA | DTMUDANCA | xs:dateTime | Sim |  |  |
| MOTIVO | MOTIVO | xs:string |  |  |  |
| CODHORARIO | CODFUNCAO | xs:string |  |  |  |
| INDINICIOHOR | CODFAIXA | xs:short |  |  |  |
| DATAALTERACAO | CODNIVEL | xs:dateTime |  |  |  |

### PFHSTSEC — PFHSTSEC (5 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CHAPA | CHAPA | xs:string | Sim |  |  |
| DTMUDANCA | DTMUDANCA | xs:dateTime | Sim |  |  |
| MOTIVO | MOTIVO | xs:string |  |  |  |
| CODSECAO | CODFUNCAO | xs:string |  |  |  |

### PFHSTUTILIZAPONTOAHGORA — PFHSTUTILIZAPONTOAHGORA (4 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CHAPA | CHAPA | xs:string | Sim |  |  |
| UTILIZAPONTO | UTILIZAPONTO | xs:int |  |  |  |
| DTMUDANCA | DTMUDANCA | xs:dateTime | Sim |  |  |

### PFunc — Funcionário (Folha) (524 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CHAPA | Chapa | xs:string | Sim |  |  |
| CODRECEBIMENTO | Tipo de Recebimento | xs:string | Sim |  |  |
| CODSITUACAO | Situação | xs:string |  |  |  |
| CODTIPO | Tipo de Funcionário | xs:string | Sim |  |  |
| CODSECAO | Seção | xs:string |  |  |  |
| CODFUNCAO | Função | xs:string |  |  |  |
| CODSINDICATO | Sindicato | xs:string |  |  |  |
| CODHORARIO | Horário | xs:string |  |  |  |
| SITUACAOFGTS | Situação do FGTS | xs:string |  |  |  |
| CONTAFGTS | Nro. Conta FGTS | xs:string |  |  |  |
| CONTRIBSINDICAL | Contribuição Sindical | xs:string |  |  |  |
| TIPOADMISSAO | Tipo de Admissão | xs:string |  |  |  |
| MOTIVOADMISSAO | Motivo da Admissão | xs:string |  |  |  |
| TIPODEMISSAO | Tipo de Demissão | xs:string |  |  |  |
| MOTIVODEMISSAO | Motivo de Demissão | xs:string |  |  |  |
| CODSAQUEFGTS | Código de Saque do FGTS | xs:string |  |  |  |
| EVTADIANTFERIAS | Evento de Adiantamento de Férias | xs:string |  |  |  |
| OBSFERIAS | Observação de Férias | xs:string |  |  |  |
| SITUACAORAIS | Situação da RAIS | xs:string |  |  |  |
| CONTAPAGAMENTO | Nro. Conta Corrente | xs:string |  |  |  |
| VINCULORAIS | Vínculo da RAIS | xs:string |  |  |  |
| ANTIGACARTTRAB | Antiga Carteira de Trabalho | xs:string |  |  |  |
| ANTIGASERIECART | Antiga Série da Carteira de Trabalho | xs:string |  |  |  |
| ANTIGONOME | Antigo Nome | xs:string |  |  |  |
| ANTIGOPIS | Antigo PIS | xs:string |  |  |  |
| ANTIGACHAPA | Antiga Chapa do Funcionário | xs:string |  |  |  |
| ANTIGOTIPOFUNC | Antigo Tipo de Funcionário | xs:string |  |  |  |
| ANTIGOTIPOADM | Antigo Tipo de Admissão | xs:string |  |  |  |
| ANTIGASECAO | Antiga Seção | xs:string |  |  |  |
| PISPARAFGTS | PIS para FGTS | xs:string |  |  |  |

*... e mais 494 campos. Ver schema.json para lista completa.*

### PPendenciaDemissional — PPendenciaDemissional (3 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short |  | → GCOLIGADA |  |
| CHAPA | CHAPA | xs:string |  |  |  |
| DESCRICAO | Descrição | xs:string | Sim |  |  |

### VPCOMPL — VPCOMPL (7 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODPESSOA | CODPESSOA | xs:int | Sim | → PPESSOA |  |
| RECCREATEDBY | RECCREATEDBY | xs:string |  |  |  |
| RECCREATEDON | RECCREATEDON | xs:dateTime |  |  |  |
| RECMODIFIEDBY | RECMODIFIEDBY | xs:string |  |  |  |
| RECMODIFIEDON | RECMODIFIEDON | xs:dateTime |  |  |  |
| CODIGOEXTERNO | CODIGOEXTERNO | xs:string |  |  |  |
| IDEXTERNO | IDEXTERNO | xs:int |  |  |  |

---

## Regras de Negócio

- PFunc é a MAIOR tabela do RM (524 campos) — cuidado com SELECT *
- Dados sensíveis: salário, CPF, conta bancária — PII obrigatório
- Integra com eSocial (módulo TAF) e FGTS Digital
- Usado pelos projetos fgts-platform e salarios-platform

---

## APIs

### SOAP DataServers neste domínio
- `FopFuncData`

*Ver apis.json para endpoints REST e status detalhado.*
