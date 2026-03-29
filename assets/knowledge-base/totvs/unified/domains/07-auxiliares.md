# Tabelas Auxiliares (Lookups)

> Tabelas de domínio configuráveis por escola. Definem os valores válidos para status, tipos e turnos. SSTATUS é a mais complexa — 50+ flags booleanas por status.

---

## Hierarquia

```
SStatus (Situação de Matrícula)
├── 50+ flags booleanas (PLATIVO, PLEXIGECONTRATO, DIBLQNOTAFALTA...)
├── Usada por: SHABILITACAOALUNO, SMATRICPL, SMATRICULA (3 níveis)
└── Valores configuráveis por escola (CODCOLIGADA)

STipoMatricula (1=Matrícula, 2=Rematrícula)
STurno (Manhã, Tarde, Noite, Integral...)
SStatusItinerarioFormativo (BNCC — itinerários formativos)
```

---

## Tabelas (4)

| Tabela | Nome de Negócio | DataServer | Campos | PII |
|--------|----------------|------------|--------|-----|
| SStatus | Status de Matrícula | EduStatusData | 88 |  |
| SStatusItinerarioFormativo | SStatusItinerarioFormativo | EduStatusData | 4 |  |
| STipoMatricula | Tipo de Matrícula | EduTipoMatriculaData | 6 |  |
| STurno | Turno/Período | EduTurnoData | 8 | Sim |

---

## Campos por Tabela

### SStatus — Status de Matrícula (88 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| DESCRICAO | Descrição | xs:string | Sim |  |  |
| PLDIARIO | Aluno com esta situação de matrícula é exibido no diário | xs:string |  |  |  |
| PLMDSTANTIGODISC | Disciplinas com esta situação de matrícula assumem a nova situação de matrícula do período letivo | xs:string |  |  |  |
| PLREMATRICULA | Opções para matrícula no próximo P. Let | xs:string |  |  |  |
| PLBLQALTSITMATSEMFIADORAPROV | Bloqueia alteração para este status por falta de fiador aprovado | xs:string |  |  |  |
| PLPRMMATITINERARIOPRTMENUEXCL | Permite matricular em Itinerários Formativos | xs:string |  |  |  |
| PERMITEALUNOCANCELARDISCPORTAL | Permite cancelar disciplina na matrícula | xs:string |  |  |  |
| PLITBLQALTSITMATITINERARIOPRT | Bloqueia alteração de situação matrícula em itinerário formativo na matrícula online | xs:string |  |  |  |
| PERALTINCITINERMENUEXCMATIFPRT | Permite incluir itinerário formativo | xs:string |  |  |  |
| PEREXCITINERARMENUEXCMATIFPRT | Permite excluir itinerário formativo | xs:string |  |  |  |
| PLALTSTATUSDISCITFORCONTALUMAT | Alterar situação de matrícula apenas das disciplinas de itinerário que contam como aluno matriculado na turma | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODSTATUS | Código | xs:int | Sim | → SSTATUS |  |
| CODTIPOCURSO | Nível de ensino | xs:short | Sim | → STIPOCURSO |  |
| CUCODSTATUSPL | Modifica a situação de matrícula do aluno no período letivo atual para | xs:int |  |  |  |
| PLCODSTATUSCUR | Altera situação de matrícula do aluno no curso para | xs:int |  |  |  |
| PLCODSTATUSDISC | Altera situação de matrícula das disciplinas em curso e/ou conta como aluno matriculado para | xs:int |  |  |  |
| PLCODTIPOALUNO | Altera tipo do aluno para | xs:short |  |  |  |
| PLINDICATRANC | Indica trancamento | xs:string |  |  |  |
| CUCONCCURSO | Indica conclusão do curso | xs:string |  |  |  |
| CUINDICAJUBILADO | Indica jubilamento | xs:string |  |  |  |
| CUINDICATRANSF | Indica transferência | xs:string |  |  |  |
| CUPERMITEMATRICPL | Permite matricular o aluno em um período letivo | xs:string |  |  |  |
| CURSO | No curso | xs:string |  |  |  |
| DICONTCRTES | Conta créditos financeiros (cobrança por crédito) | xs:string |  |  |  |
| DICREDITOCURSADO | Conta como créditos cursados ou em curso | xs:string |  |  |  |
| DIEMCURSO | É uma disciplina em curso | xs:string |  |  |  |
| DIHISTORICO | Imprime no histórico | xs:string |  |  |  |
| DIINCALUNODISC | Conta como aluno matriculado na turma e turma/disciplina | xs:string |  |  |  |
| DISCIPLINA | Na disciplina | xs:string |  |  |  |

*... e mais 58 campos. Ver schema.json para lista completa.*

### SStatusItinerarioFormativo — SStatusItinerarioFormativo (4 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODTIPOCURSO | Nível de ensino | xs:int | Sim | → STIPOCURSO |  |
| CODSTATUS | Código | xs:int | Sim | → SSTATUS |  |
| CODSTATUSITINERARIOFORMATIVO | Código | xs:int | Sim |  |  |

### STipoMatricula — Tipo de Matrícula (6 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| DESCRICAO | Descrição | xs:string | Sim |  |  |
| PERMITETRANCAMENTO | Permite trancamento | xs:string |  |  |  |
| INDICADEPENDENCIA | Indica Dependência | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODTIPOMAT | Código | xs:short | Sim | → STIPOMATRICULA |  |
| CODTIPOCURSO | Nível de ensino | xs:short | Sim | → STIPOCURSO |  |

### STurno — Turno/Período (8 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| NOME | Turno | xs:string | Sim |  | PII |
| HORINI | Hora inicial | xs:string | Sim |  |  |
| HORFIM | Hora final | xs:string | Sim |  |  |
| TIPO | Tipo Turno | xs:string | Sim |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODTURNO | Código | xs:int | Sim |  |  |
| CODTIPOCURSO | Nível de ensino | xs:short | Sim | → STIPOCURSO |  |
| CODFILIAL | Filial | xs:short |  | → GFILIAL |  |

---

## Regras de Negócio

- SSTATUS é a tabela mais importante para entender regras de negócio
- Cada flag controla um comportamento (financeiro, acadêmico, disciplina)
- Valores são POR COLIGADA — cada escola pode ter status diferentes
- Ver rules.json > matricula > statusFlags para categorização completa

---

## APIs

### SOAP DataServers neste domínio
- `EduStatusData`
- `EduTipoMatriculaData`
- `EduTurnoData`

*Ver apis.json para endpoints REST e status detalhado.*
