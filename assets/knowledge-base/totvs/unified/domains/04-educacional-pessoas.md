# Educacional — Pessoas

> Alunos, professores, matrículas, frequência e ocorrências. O núcleo transacional do sistema educacional — cada ação do aluno gera ou consulta registros aqui.

---

## Hierarquia

```
PPESSOA (Cadastro master)
├── SALUNO (Aluno)
│   ├── SHABILITACAOALUNO (Aluno no Curso — status geral)
│   ├── SMATRICPL (Matrícula no Período Letivo)
│   │   └── SMATRICULA (Matrícula na Disciplina)
│   ├── SCONTRATO → (ver domínio Financeiro)
│   ├── SBOLSAALUNO → (ver domínio Financeiro)
│   ├── SOCORRENCIAALUNO (Ocorrências disciplinares)
│   └── SHISTDISCCONCLUIDAS / SHISTDISCPENDENTES
│
├── SProfessor (Professor)
│   └── SPROFESSORTURMA (Vínculo professor ↔ turma-disciplina)
│
└── SResponsavel (Responsável financeiro)

Frequência:
SFREQUENCIA (Presença diária por aluno × turma-disciplina × data)
```

---

## Tabelas (14)

| Tabela | Nome de Negócio | DataServer | Campos | PII |
|--------|----------------|------------|--------|-----|
| AlunosFreq | AlunosFreq | EduFrequenciaDiariaWSData | 4 |  |
| PARAMS | PARAMS | EduFrequenciaDiariaWSData | 5 |  |
| PlanoAulaFreq | PlanoAulaFreq | EduFrequenciaDiariaWSData | 5 |  |
| SFREQUENCIA | Frequência Diária | EduFrequenciaDiariaWSData | 8 |  |
| SMatricula | Matrícula na Disciplina | EduMatriculaData | 43 |  |
| SMatriculaCompl | SMatriculaCompl | EduMatriculaData | 11 |  |
| SOCORRENCIAALUNOARQ | SOCORRENCIAALUNOARQ | EduOcorrenciaAlunoData | 7 |  |
| SOCORRENCIAALUNOCOMPL | SOCORRENCIAALUNOCOMPL | EduOcorrenciaAlunoData | 2 |  |
| SOcorrenciaAluno | Ocorrência do Aluno | EduOcorrenciaAlunoData | 26 |  |
| SPROFESSORTURMA | Professor na Turma | EduProfessorTurmaData | 56 | Sim |
| SPROFESSORTURMACOMPL | SPROFESSORTURMACOMPL | EduProfessorTurmaData | 2 |  |
| SProfessor | Professor | EduProfessorData | 174 | Sim |
| SProfessorCompl | SProfessorCompl | EduProfessorData | 3 |  |
| SResponsavel | Responsável Financeiro | EduResponsavelData | 20 |  |

---

## Campos por Tabela

### AlunosFreq — AlunosFreq (4 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| RA | RA | xs:string | Sim |  |  |
| IDTURMADISC | IDTURMADISC | xs:int | Sim | → STURMADISC |  |
| IDTURMADISCORIGEM | IDTURMADISCORIGEM | xs:int |  |  |  |

### PARAMS — PARAMS (5 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| IDTURMADISC | IDTURMADISC | xs:int | Sim | → STURMADISC |  |
| CODETAPA | CODETAPA | xs:string | Sim |  |  |
| AULASDADAS | AULASDADAS | xs:int |  |  |  |
| CODSUBTURMA | CODSUBTURMA | xs:string |  |  |  |

### PlanoAulaFreq — PlanoAulaFreq (5 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:int |  | → GCOLIGADA |  |
| IDTURMADISC | IDTURMADISC | xs:int |  | → STURMADISC |  |
| CODETAPA | CODETAPA | xs:int |  |  |  |
| AULA | AULA | xs:int |  |  |  |
| FREQUENCIADISPWEB | FREQUENCIADISPWEB | xs:int |  |  |  |

### SFREQUENCIA — Frequência Diária (8 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| RA | R.A. | xs:string | Sim |  |  |
| PRESENCA | Presença | xs:string | Sim |  |  |
| JUSTIFICADA | Abona | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDHORARIOTURMA | Identificador do horário da turma | xs:int | Sim |  |  |
| IDTURMADISC | Turma disciplina | xs:int | Sim | → STURMADISC |  |
| DATA | Data | xs:dateTime | Sim |  |  |
| IDJUSTIFICATIVAFALTA | IDJUSTIFICATIVAFALTA | xs:int |  |  |  |

### SMatricula — Matrícula na Disciplina (43 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| RA | R.A. | xs:string | Sim |  |  |
| CODSUBTURMA | Código da Subturma | xs:string |  |  |  |
| OBSHISTORICO | Observação do histórico | xs:string |  |  |  |
| USUARIO | Usuário | xs:string |  |  |  |
| TIPODISCIPLINA | Tipo de disciplina | xs:string |  |  |  |
| NOMEALUNO | Aluno | xs:string |  |  |  |
| CODPERLET | Período letivo | xs:string |  |  |  |
| COBPOSTERIORMATRIC | Considerar no cálculo de cobrança somente para parcelas com vencimento igual ou posterior a data da matrícula | xs:string |  |  |  |
| CODTURMA | Turma | xs:string |  |  |  |
| NOMESTATUS | Situação de matrícula | xs:string |  |  |  |
| MATRICULAISOLADA | Matrícula isolada | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDTURMADISC | Turma disciplina | xs:int | Sim | → STURMADISC |  |
| CODSTATUS | Situação de matrícula | xs:int | Sim | → SSTATUS |  |
| CODSTATUSRES | Resultado | xs:int |  |  |  |
| IDPERLET | Id. Período letivo | xs:int |  | → SPLETIVO |  |
| IDHABILITACAOFILIAL | Matriz aplicada | xs:int |  | → SHABILITACAOFILIAL |  |
| NUMDIARIO | Número no diário | xs:int |  |  |  |
| DTMATRICULA | Data de matrícula | xs:dateTime |  |  |  |
| TIPOMAT | Tipo de matrícula | xs:string |  |  |  |
| CODDISC | Cód. da disciplina | xs:string |  |  |  |
| NOMEDISC | Disciplina | xs:string |  |  |  |
| CODMOTIVO | Motivo da alteração | xs:short |  |  |  |
| DTALTERACAO | Data da alteração | xs:dateTime |  |  |  |
| DTALTERACAOSIST | Data de alteração no sistema | xs:dateTime |  |  |  |
| NUMCREDITOSCOB | Créditos financeiros | xs:double |  |  |  |
| NUMCREDITOS | Créditos acadêmicos | xs:decimal |  |  |  |
| NOTA | Nota | xs:decimal |  |  |  |
| FALTA | Falta | xs:decimal |  |  |  |
| CODCONCEITO | Conceito | xs:string |  |  |  |

*... e mais 13 campos. Ver schema.json para lista completa.*

### SMatriculaCompl — SMatriculaCompl (11 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| IDTURMADISC | IDTURMADISC | xs:int | Sim | → STURMADISC |  |
| RA | RA | xs:string | Sim |  |  |
| RECCREATEDBY | RECCREATEDBY | xs:string |  |  |  |
| RECCREATEDON | RECCREATEDON | xs:dateTime |  |  |  |
| RECMODIFIEDBY | RECMODIFIEDBY | xs:string |  |  |  |
| RECMODIFIEDON | RECMODIFIEDON | xs:dateTime |  |  |  |
| BIMESTRE_1 | BIMESTRE_1 | xs:string |  |  |  |
| BIMESTRE_2 | BIMESTRE_2 | xs:string |  |  |  |
| BIMESTRE_3 | BIMESTRE_3 | xs:string |  |  |  |
| BIMESTRE_4 | BIMESTRE_4 | xs:string |  |  |  |

### SOCORRENCIAALUNOARQ — SOCORRENCIAALUNOARQ (7 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| NOMEARQUIVO | Nome do arquivo | xs:string | Sim |  |  |
| DESCARQUIVO | Descrição | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDARQUIVOOCORALUNO | Id. Arquivo | xs:int | Sim |  |  |
| IDOCORALUNO | Id. Ocorrência | xs:int | Sim |  |  |
| ARQUIVO | Arquivo | xs:base64Binary |  |  |  |
| TAMANHOARQUIVO | Tamanho do arquivo (KB) | xs:float |  |  |  |

### SOCORRENCIAALUNOCOMPL — SOCORRENCIAALUNOCOMPL (2 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| IDOCORALUNO | IDOCORALUNO | xs:int | Sim |  |  |

### SOcorrenciaAluno — Ocorrência do Aluno (26 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| RA | Registro Acadêmico | xs:string | Sim |  |  |
| TIPOETAPA | Tipo da etapa | xs:string |  |  |  |
| CODPROF | Código do professor | xs:string |  |  |  |
| DISPONIVELWEB | Disponível Web | xs:string |  |  |  |
| RECCREATEDBY | Usuário de cadastro | xs:string |  |  |  |
| RECMODIFIEDBY | Usuário de alteração | xs:string |  |  |  |
| RESPONSAVELCIENTE | Responsável ciente da ocorrência? | xs:string |  |  |  |
| CODUSUARIOCIENTE | Cód. usuário responsável | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDOCORALUNO | Id. Ocorrência | xs:int | Sim |  |  |
| CODOCORRENCIAGRUPO | Código do Grupo de ocorrência | xs:short | Sim |  |  |
| CODOCORRENCIATIPO | Código do Tipo de ocorrência | xs:int | Sim |  |  |
| IDPERLET | Id. Período letivo | xs:int | Sim | → SPLETIVO |  |
| IDTURMADISC | Id. Turma / Disciplina | xs:int |  | → STURMADISC |  |
| CODETAPA | Código da Etapa | xs:short |  |  |  |
| DATAOCORRENCIA | Data e hora da ocorrência | xs:dateTime |  |  |  |
| OBSERVACOES | Observações | xs:string |  |  |  |
| CODPERLET | Período letivo | xs:string |  |  |  |
| DESCGRUPOOCOR | Grupo de Ocorrência | xs:string |  |  |  |
| DESCTIPOOCOR | Tipo de Ocorrência | xs:string |  |  |  |
| RECCREATEDON | Data de cadastro | xs:dateTime |  |  |  |
| RECMODIFIEDON | Data de alteração | xs:dateTime |  |  |  |
| DTRESPONSAVELCIENTE | Data que ficou ciente | xs:dateTime |  |  |  |
| NOMEUSUARIOCIENTE | Responsável ciente pela ocorrência | xs:string |  |  |  |
| OBSERVACOESINTERNAS | Observações internas | xs:string |  |  |  |
| POSSUIARQUIVO | POSSUIARQUIVO | xs:string |  |  |  |

### SPROFESSORTURMA — Professor na Turma (56 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODPERLET | Período letivo | xs:string |  |  |  |
| CODTURMA | Código da Turma | xs:string |  |  |  |
| CODDISC | Código da disciplina | xs:string |  |  |  |
| NOME | Nome | xs:string |  |  | PII |
| TIPOPROF | Tipo professor | xs:string |  |  |  |
| CODPROF | Professor | xs:string | Sim |  |  |
| DESCONSIDERAPONTO | Desconsidera ponto | xs:string |  |  |  |
| COMPOESALARIO | Compõe salário | xs:string |  |  |  |
| RECCREATEDBY | Criado por | xs:string |  |  |  |
| RECMODIFIEDBY | Modificado por | xs:string |  |  |  |
| USERID | Id. usuário (USERID) | xs:string |  |  |  |
| CODUSUARIO | Usuário | xs:string |  |  |  |
| RESPONSAVELASSINARDIARIO | Responsável por iniciar o processo de assinatura do diário | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDPROFESSORTURMA | Id. professor/turma | xs:int | Sim |  |  |
| IDPERLET | Id. Período letivo | xs:int |  | → SPLETIVO |  |
| IDTURMADISC | Id. turma/disciplina | xs:int |  | → STURMADISC |  |
| DTINICIO | Data de início | xs:dateTime | Sim |  |  |
| VALORHORA | Valor por hora | xs:double |  |  |  |
| AULASSEMANAISPROF | Aulas por semana | xs:double |  |  |  |
| DTFIM | Data de término | xs:dateTime |  |  |  |
| VALORFIXO | Valor fixo | xs:double |  |  |  |
| PERCENTFATURAMENTO | Faturamento (%) | xs:double |  |  |  |
| NOMEDISCIPLINA | Nome da disciplina | xs:string |  |  |  |
| CODTIPOPART | Tipo de Participação | xs:string |  |  |  |
| RECCREATEDON | Criado em | xs:dateTime |  |  |  |
| RECMODIFIEDON | Modificado em | xs:dateTime |  |  |  |
| STATUS | Status do registro | xs:short |  |  |  |
| IDPROFESSORTURMAANTIGO | Id. professor/turma | xs:int |  |  |  |
| IDTURMADISCANTIGO | Id. turma/disciplina | xs:int |  |  |  |

*... e mais 26 campos. Ver schema.json para lista completa.*

### SPROFESSORTURMACOMPL — SPROFESSORTURMACOMPL (2 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| IDPROFESSORTURMA | IDPROFESSORTURMA | xs:int | Sim |  |  |

### SProfessor — Professor (174 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CHAPA | Chapa | xs:string |  |  |  |
| CODPROF | Código do Professor | xs:string | Sim |  |  |
| NOME | Nome | xs:string | Sim |  | PII |
| NOMESOCIAL | Nome Social | xs:string |  |  | PII |
| APELIDO | Apelido | xs:string |  |  |  |
| GRAUINSTRUCAO | Grau de instrução | xs:string |  |  |  |
| RUA | Logradouro | xs:string |  |  | PII |
| NUMERO | Número | xs:string |  |  | PII |
| COMPLEMENTO | Complemento | xs:string |  |  | PII |
| BAIRRO | Bairro | xs:string |  |  | PII |
| ESTADO | Estado | xs:string |  |  |  |
| CIDADE | Cidade | xs:string |  |  | PII |
| CEP | CEP | xs:string |  |  | PII |
| PAIS | País | xs:string |  |  |  |
| REGPROFISSIONAL | Reg. profissional | xs:string |  |  |  |
| CPF | CPF | xs:string |  |  | PII |
| TELEFONE1 | Telefone I | xs:string |  |  |  |
| TELEFONE2 | Telefone II | xs:string |  |  |  |
| UFCARTIDENT | UF Identidade | xs:string |  |  |  |
| ORGEMISSORIDENT | Órgão emissor | xs:string |  |  |  |
| TITULOELEITOR | Tit. de eleitor | xs:string |  |  |  |
| ZONATITELEITOR | Zona | xs:string |  |  |  |
| SECAOTITELEITOR | Seção | xs:string |  |  |  |
| CARTEIRATRAB | Cart. de trabalho | xs:string |  |  |  |
| SERIECARTTRAB | Série | xs:string |  |  |  |
| UFCARTTRAB | UF Cart. de trabalho | xs:string |  |  |  |
| CARTMOTORISTA | Cart. Motorista | xs:string |  |  |  |
| TIPOCARTHABILIT | Tipo | xs:string |  |  |  |
| CERTIFRESERV | Número | xs:string |  |  |  |
| CATEGMILITAR | Categoria militar | xs:string |  |  |  |

*... e mais 144 campos. Ver schema.json para lista completa.*

### SProfessorCompl — SProfessorCompl (3 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODPROF | CODPROF | xs:string | Sim |  |  |
| SENHAPROF | SENHAPROF | xs:string |  |  |  |

### SResponsavel — Responsável Financeiro (20 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | Cód. Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDPARCELA | Identificador da parcela | xs:int | Sim |  |  |
| CODCOLCFO | Coligada do cliente/fornecedor | xs:short | Sim |  |  |
| CODCFO | Código do responsável financeiro | xs:string | Sim |  |  |
| RA | R.A. | xs:string |  |  |  |
| CODSERVICO | Serviço | xs:string |  | → SSERVICO |  |
| IDPERLET | Período letivo | xs:int |  | → SPLETIVO |  |
| NOMECLIFOR | Responsável Financeiro | xs:string |  |  |  |
| PERCENTUAL | Percentual | xs:decimal | Sim |  |  |
| CODCOLIGADA | Cód. Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDPARCELA | Identificador da parcela | xs:int | Sim |  |  |
| CODCOLCFO | Coligada do cliente/fornecedor | xs:short | Sim |  |  |
| CODCFO | Código do responsável financeiro | xs:string | Sim |  |  |
| NOMECFO | Código do responsável financeiro | xs:string |  |  |  |
| IDPERLET | Período letivo | xs:int |  | → SPLETIVO |  |
| CODSERVICO | Serviço | xs:string |  | → SSERVICO |  |
| RA | R.A. | xs:string |  |  |  |
| PERCENTUAL | Percentual | xs:decimal |  |  |  |
| PARCELA | PARCELA | xs:short |  |  |  |
| NOMECLIFOR | NOMECLIFOR | xs:string |  |  |  |

---

## Regras de Negócio

- Matrícula tem 3 níveis: Curso (SHABILITACAOALUNO) → Período (SMATRICPL) → Disciplina (SMATRICULA)
- Cada nível tem seu próprio CODSTATUS → SSTATUS (com flags diferentes)
- Frequência: sem registro = Presente. Registro com SITUACAO='A' = Ausente
- Mínimo 75% de frequência para aprovação (LDB Art. 24)

---

## Queries Disponíveis (11)

| Query | Descrição | Tabelas | Caso de Uso |
|-------|-----------|---------|-------------|
| dashboard-matriculas-status | Dashboard: contagem de matrículas por status no período letivo | SMATRICPL, SSTATUS, SPLETIVO | Dashboard principal — distribuição de alunos por situação |
| alunos-por-turma | Lista alunos matriculados em uma turma com status | SMATRICULA, SALUNO, SSTATUS | Chamada, diário de classe |
| boletim-aluno | Boletim completo do aluno: todas disciplinas, todas etapas | SNOTAETAPA, SMATRICULA, STURMADISC | Boletim escolar, relatório para pais |
| frequencia-diaria-turma | Frequência diária de uma turma em um período | SFREQUENCIA, SALUNO, SHORARIOTURMA | Registro de chamada, relatório de faltas |
| turmas-professor | Turmas e disciplinas vinculadas a um professor | SPROFESSORTURMA, STURMADISC, STURMA | Tela do professor, grade horária |
| historico-aluno | Histórico escolar completo: disciplinas concluídas + pendentes | SHISTDISCCONCLUIDAS, SHISTDISCPENDENTES, SDISCIPLINA | Histórico escolar, transferência |
| professores-sem-turma | Professores cadastrados sem vínculo de turma no período | SPROFESSOR, SPROFESSORTURMA | Gestão de RH, alocação de professores |
| evasao-tendencia | Alunos com frequência abaixo do limiar configurável | SNOTAETAPA, SMATRICULA, SALUNO | Prevenção de evasão, alerta precoce |
| status-matricula-detalhado | Status de matrícula com todas as flags SSTATUS expandidas | SMATRICPL, SSTATUS, SALUNO | Análise detalhada de situação acadêmica |
| turmas-professor-horario | Grade horária do professor com dia/hora/sala | SPROFESSORTURMA, SHORARIOTURMA, STURMADISC | Grade horária do professor |
| alunos-risco-evasao | Score de risco de evasão baseado em frequência + notas + inadimplência | SNOTAETAPA, SMATRICULA, SPARCELA | Modelo preditivo de evasão |

---

## APIs

### SOAP DataServers neste domínio
- `EduFrequenciaDiariaWSData`
- `EduMatriculaData`
- `EduOcorrenciaAlunoData`
- `EduProfessorData`
- `EduProfessorTurmaData`
- `EduResponsavelData`

*Ver apis.json para endpoints REST e status detalhado.*
