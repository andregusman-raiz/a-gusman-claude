# DOC 11 — DataServer Objects do Módulo Educacional

> Referência completa dos Business Objects do TOTVS RM Educacional.
> Fonte: API Legada TOTVS (apitotvslegado.z15.web.core.windows.net) + TDN + Fórum RM.
> Data: 2026-03-22

---

## 1. EduAlunoData (SAluno) — Cadastro de Alunos

**PK**: `CODCOLIGADA; RA`
**Sub-objetos**: SAlunoCompl, SHabilitacaoAluno, VFiliacao, PPESSOADEFICIENCIA
**~150 campos** — principais abaixo:

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| RA | String | 20 | Sim | 0 | Registro Acadêmico |
| NOME | String | 120 | Sim | — | Nome completo |
| NOMESOCIAL | String | 120 | Não | — | Nome social |
| SOBRENOME | String | 60 | Não | — | Sobrenome |
| CPF | String | 14 | Não | — | CPF |
| DTNASCIMENTO | DateTime | — | Sim | — | Data de nascimento |
| SEXO | String | — | Não | — | Sexo |
| ESTADOCIVIL | String | — | Não | — | Estado civil |
| EMAIL | String | 60 | Não | — | Email |
| CODTIPOCURSO | Int16 | — | Sim | — | Nível de ensino |
| CODTIPOALUNO | Int16 | — | Não | — | FK → STipoAluno |
| CODPESSOA | Int32 | — | Não | — | FK → PPESSOA.CODIGO |
| CODCOLCFO | Int16 | — | Não | — | Coligada do Cliente/Fornecedor |
| CODCFO | String | 25 | Não | — | Cliente/Fornecedor (resp. financeiro) |
| CORRACA | Int16 | — | Não | — | Cor/Raça |
| NACIONALIDADE | Int16 | — | Não | 10 | Nacionalidade |
| ESTADONATAL | String | 2 | Sim | — | Estado natal |
| NATURALIDADE | String | 32 | Sim | — | Naturalidade |
| NOMEPAI | String | 120 | Não | — | Nome do pai |
| NOMEMAE | String | 120 | Não | — | Nome da mãe |
| RUA | String | 140 | Não | — | Logradouro |
| NUMERO | String | 8 | Não | — | Número |
| COMPLEMENTO | String | 30 | Não | — | Complemento |
| BAIRRO | String | 80 | Não | — | Bairro |
| CIDADE | String | 32 | Não | — | Cidade |
| ESTADO | String | 2 | Não | — | UF |
| CEP | String | 10 | Não | — | CEP |
| PAIS | String | 50 | Não | — | País |
| TELEFONE1 | String | 15 | Não | — | Telefone 1 |
| TELEFONE2 | String | 15 | Não | — | Telefone 2 |
| TELEFONE3 | String | 15 | Não | — | Telefone 3 |
| CARTIDENTIDADE | String | 20 | Não | — | RG |
| TITULOELEITOR | String | — | Não | — | Título de eleitor |
| IMAGEM | Byte[] | — | Não | — | Foto do aluno |
| DEFICIENTEFISICO | Int16 | — | Não | — | Deficiência física |
| DEFICIENTEFALA | Int16 | — | Não | — | Deficiência fala |
| DEFICIENTEMENTAL | Int16 | — | Não | — | Deficiência mental |
| DEFICIENTEVISUAL | Int16 | — | Não | — | Deficiência visual |
| DEFICIENTEAUDITIVO | Int16 | — | Não | — | Deficiência auditiva |
| ALUNO | String | 1 | Não | — | É aluno (S/N) |
| PROFESSOR | String | 1 | Não | — | É professor (S/N) |
| CANDIDATO | String | 1 | Não | — | É candidato (S/N) |
| USUARIOBIBLIOS | String | 1 | Não | — | Usuário biblioteca (S/N) |
| FUNCIONARIO | String | 1 | Não | — | É funcionário (S/N) |

---

## 2. EduHabilitacaoAlunoData (SHabilitacaoAluno) — Aluno × Curso

**PK**: `CODCOLIGADA; IDHABILITACAOFILIAL; RA`
**Sub-objeto**: SHabilitacaoAlunoCompl

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| IDHABILITACAOFILIAL | Int32 | — | Sim | — | FK → SHabilitacaoFilial |
| RA | String | 20 | Sim | — | FK → SAluno.RA |
| CODCURSO | String | — | Sim | — | FK → SCurso |
| CODHABILITACAO | String | — | Sim | — | FK → SHabilitacao |
| CODGRADE | String | — | Sim | — | FK → SGrade |
| **CODSTATUS** | **Int32** | — | **Sim** | — | **FK → SSTATUS — Situação de matrícula no CURSO** |
| **CODTIPOINGRESSO** | **Int16** | — | Não | — | **FK → STipoIngresso** |
| DTINGRESSO | DateTime | — | Não | — | Data de ingresso no curso |
| DTCONCLUSAOCURSO | DateTime | — | Não | — | Data de conclusão |
| DTCOLACAOGRAU | DateTime | — | Não | — | Data de colação de grau |
| DTEMISDIPLOMA | DateTime | — | Não | — | Data emissão diploma |
| CR | Decimal | — | Não | — | Coeficiente de rendimento |
| MEDIAGLOBAL | Decimal | — | Não | — | Média global |
| CODCAMPUS | String | 10 | Não | — | Campus/Polo |
| OBSERVACAO | String | — | Não | — | Observações |
| USACURRICULOINDIVIDUAL | Boolean | — | Não | — | Usa currículo individual |

---

## 3. EduMatricPLData (SMatricPL) — Matrícula no Período Letivo

**PK**: `CODCOLIGADA; IDPERLET; IDHABILITACAOFILIAL; RA`
**Sub-objeto**: SMatricPLCompl

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| RA | String | 20 | Sim | — | FK → SAluno.RA |
| IDHABILITACAOFILIAL | Int32 | — | Sim | — | FK → SHabilitacaoFilial |
| IDPERLET | Int32 | — | Sim | — | FK → SPLetivo |
| **CODSTATUS** | **Int32** | — | **Sim** | — | **FK → SSTATUS — Situação no período letivo** |
| **CODTIPOMAT** | **Int16** | — | Não | — | **FK → STipoMatricula** |
| CODTURMA | String | 20 | Não | — | FK → STurma |
| CODFILIAL | Int16 | — | Não | — | FK → GFilial |
| DTMATRICULA | DateTime | — | Sim | — | Data de matrícula |
| PERIODO | Int32 | — | Não | — | Período/série |
| **CODSTATUSRES** | **Int32** | — | Não | — | **FK → SSTATUS — Resultado final** |
| CR | Decimal | — | Não | — | Coeficiente de rendimento |
| NUMALUNO | Int32 | — | Não | — | Número do aluno na turma |

---

## 4. EduMatriculaData (SMatricula) — Matrícula na Disciplina

**PK**: `CODCOLIGADA; IDTURMADISC; RA`
**Sub-objetos**: SMatriculaCompl, STurmaDisc, SHorarioTurma, SProfessorTurma

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| IDTURMADISC | Int32 | — | Sim | — | FK → STurmaDisc |
| RA | String | 20 | Sim | — | FK → SAluno.RA |
| **CODSTATUS** | **Int32** | — | **Sim** | — | **FK → SSTATUS — Situação na disciplina** |
| **CODSTATUSRES** | **Int32** | — | Não | — | **FK → SSTATUS — Resultado na disciplina** |
| CODSUBTURMA | String | 20 | Não | — | Subturma |
| IDPERLET | Int32 | — | Não | — | FK → SPLetivo |
| IDHABILITACAOFILIAL | Int32 | — | Não | — | FK → SHabilitacaoFilial |
| NUMDIARIO | Int32 | — | Não | — | Número do diário |
| DTMATRICULA | DateTime | — | Não | — | Data de matrícula |
| NOTA | Decimal | — | Não | — | Nota |
| FALTA | Decimal | — | Não | — | Faltas |
| CODCONCEITO | String | — | Não | — | Conceito |
| NUMCREDITOS | Decimal | — | Não | — | Créditos acadêmicos |
| CODPERLET | String | 10 | Não | — | Período letivo |
| MATRICULAISOLADA | String | 1 | Não | N | Matrícula isolada |

---

## 5. EduStatusData (SStatus) — Situação de Matrícula

**PK**: `CODCOLIGADA; CODSTATUS`
**Sub-objeto**: SStatusItinerarioFormativo
**Documentação completa em DOC-12.**

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODSTATUS | Int32 | — | Sim | 0 | Código do status |
| DESCRICAO | String | 30 | Sim | — | Descrição (ex: "Matriculado") |
| CODTIPOCURSO | Int16 | — | Sim | — | Nível de ensino |
| + ~50 flags S/N | String | — | Não | N | Ver DOC-12 completo |

---

## 6. EduTipoMatriculaData (STipoMatricula)

**PK**: `CODCOLIGADA; CODTIPOMAT`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODTIPOMAT | Int16 | — | Sim | 0 | Código |
| DESCRICAO | String | 60 | Sim | — | Ex: "Regular", "Dependência", "Adaptação" |
| CODTIPOCURSO | Int16 | — | Sim | — | Nível de ensino |
| PERMITETRANCAMENTO | String | 1 | Não | 0 | Permite trancamento (S/N) |
| INDICADEPENDENCIA | String | 1 | Não | 0 | Indica dependência (S/N) |

---

## 7. EduTipoIngressoData (STipoIngresso)

**PK**: `CODCOLIGADA; CODTIPOINGRESSO`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODTIPOINGRESSO | Int16 | — | Sim | 0 | Código |
| DESCRICAO | String | 60 | Sim | — | Ex: "Vestibular", "ENEM", "Transferência" |
| CODTIPOCURSO | Int16 | — | Sim | — | Nível de ensino |
| TIPOINGRESSO | Int32 | — | Sim | — | Tipo Ingresso — Diploma Digital (MEC) |

---

## 8. EduTipoAlunoData (STipoAluno)

**PK**: `CODCOLIGADA; CODTIPOALUNO`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODTIPOALUNO | Int16 | — | Sim | 0 | Código |
| DESCRICAO | String | 60 | Sim | — | Ex: "Ativo", "Egresso", "Trancado" |
| CODTIPOCURSO | Int16 | — | Sim | 0 | Nível de ensino |

---

## 9. EduTipoCursoData (STipoCurso) — Nível de Ensino

**PK**: `CODCOLIGADA; CODTIPOCURSO`
**Sub-objetos**: STabCompl, SCamposCompl, STipoCursoCompl

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODTIPOCURSO | Int16 | — | Sim | 0 | Código |
| NOME | String | 60 | Sim | — | Ex: "Ensino Superior", "Ensino Básico" |
| APRESENTACAO | String | — | Sim | 0 | Apresentação |
| CFGMATRICULA | String | 20 | Não | ########## | Configuração do RA (máscara) |
| EMAIL | String | 60 | Não | — | Email do nível |
| USAEDUCACENSO | String | 1 | Não | N | Usa Educa Censo |

---

## 10. EduCursoData (SCurso)

**PK**: `CODCOLIGADA; CODCURSO`
**Sub-objeto**: SCURSOCOMPL

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODCURSO | String | 10 | Sim | — | Código do curso |
| NOME | String | 500 | Sim | — | Nome do curso |
| CODTIPOCURSO | Int16 | — | Sim | — | FK → STipoCurso |
| CODESCOLA | Int16 | — | Não | — | Escola |
| CODAREA | Int16 | — | Não | — | Área |
| CODCURINEP | String | 8 | Não | — | Código INEP |
| DECRETO | String | — | Não | — | Decreto de autorização |
| CURPRESDIST | String | 1 | Não | — | P=Presencial, D=Distância |
| CFGMATRICULA | String | 20 | Não | — | Config do RA |

---

## 11. EduHabilitacaoData (SHabilitacao)

**PK**: `CODCOLIGADA; CODCURSO; CODHABILITACAO`
**Sub-objeto**: SHABILITACAOCOMPL

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODCURSO | String | 10 | Sim | — | FK → SCurso |
| CODHABILITACAO | String | 10 | Sim | — | Código |
| NOME | String | 150 | Sim | — | Nome da habilitação |
| INTEGRALIZACAO | Decimal | — | Não | — | Integralização |
| CODHABINEP | String | 8 | Não | — | Código INEP |
| TITULACAOMASCULINA | String | 100 | Não | — | Titulação masculina |
| TITULACAOFEMININA | String | 100 | Não | — | Titulação feminina |
| TEXTOCONCLUSAO | String | MAX | Não | — | Texto de conclusão |
| DECRETO | String | MAX | Não | — | Decreto |

---

## 12. EduHabilitacaoFilialData (SHabilitacaoFilial) — Matriz Aplicada

**PK**: `CODCOLIGADA; IDHABILITACAOFILIAL`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| IDHABILITACAOFILIAL | Int32 | — | Sim | — | ID da matriz aplicada |
| CODFILIAL | Int16 | — | Sim | — | FK → GFilial |
| CODCURSO | String | — | Sim | — | FK → SCurso |
| CODHABILITACAO | String | — | Sim | — | FK → SHabilitacao |
| CODGRADE | String | — | Sim | — | FK → SGrade |
| CODTURNO | Int32 | — | Não | — | FK → STurno |
| CODTIPOCURSO | Int16 | — | Não | — | FK → STipoCurso |
| ATIVO | String | 1 | Não | — | Ativa (S/N) |
| EMAILCOORDENACAO | String | — | Não | — | Email da coordenação |

---

## 13. EduGradeData (SGrade) — Matriz Curricular

**PK**: `CODCOLIGADA; CODCURSO; CODHABILITACAO; CODGRADE`
**Sub-objetos**: SDiscGrade, SOptativas, SGRADECOMPL

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODCURSO | String | 10 | Sim | — | FK → SCurso |
| CODHABILITACAO | String | 10 | Sim | — | FK → SHabilitacao |
| CODGRADE | String | 10 | Sim | — | Código da grade |
| DESCRICAO | String | 255 | Não | — | Descrição |
| CARGAHORARIA | Decimal | — | Não | — | Carga horária total |
| TOTALCREDITOS | Decimal | — | Não | — | Total de créditos |
| CONTROLEVAGAS | String | 1 | Sim | — | Controle de vagas |
| REGIME | String | 1 | Não | S | Regime acadêmico |
| DTINICIO | DateTime | — | Não | — | Vigência início |
| DTFIM | DateTime | — | Não | — | Vigência fim |
| CODFORMULA | String | 8 | Não | — | Fórmula da média global |

---

## 14. EduPeriodoData (SPeriodo) — Período da Grade

**PK**: `CODCOLIGADA; CODCURSO; CODHABILITACAO; CODGRADE; CODPERIODO`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| Herda PK de SGrade | — | — | — | — | — |
| CODPERIODO | String | — | Sim | — | Código do período |
| DESCRICAO | String | — | Não | — | Descrição |
| VALORELETIVA | Decimal | — | Não | — | CH eletiva mínima |
| VALOROPTATIVA | Decimal | — | Não | — | CH optativa mínima |
| ANOREF | Int32 | — | Não | — | Ano de referência |

---

## 15. EduDiscGradeData (SDiscGrade) — Disciplina na Grade

**PK**: `CODCOLIGADA; CODCURSO; CODHABILITACAO; CODGRADE; CODPERIODO; CODDISC`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| Herda PK de SPeriodo | — | — | — | — | — |
| CODDISC | String | — | Sim | — | FK → SDisciplina |
| TIPODISC | String | 1 | Não | — | B=Básica, O=Optativa, E=Eletiva |
| CH | Decimal | — | Não | — | Carga horária |
| PREREQCRED | Decimal | — | Não | — | Créditos pré-requisito |
| NUMCREDITOSCOB | Decimal | — | Não | — | Créditos cobrados |
| CODFORMULAPRE | String | 8 | Não | — | Fórmula pré-requisito |
| CODFORMULACO | String | 8 | Não | — | Fórmula co-requisito |
| DISCIPLINATCC | String | 1 | Não | — | É TCC (S/N) |

---

## 16. EduDisciplinaData (SDisciplina)

**PK**: `CODCOLIGADA; CODDISC`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODDISC | String | 20 | Sim | — | Código da disciplina |
| NOME | String | 100 | Sim | — | Nome |
| NOMEREDUZIDO | String | 30 | Não | — | Nome reduzido |
| CH | Decimal | — | Não | — | Carga horária total |
| NUMCREDITOS | Decimal | — | Não | — | Créditos |
| CODTIPOCURSO | Int16 | — | Sim | — | FK → STipoCurso |
| TIPONOTA | String | 1 | Sim | N | N=Numérica, C=Conceito |
| CHTEORICA | Decimal | — | Não | — | CH Teórica |
| CHPRATICA | Decimal | — | Não | — | CH Prática |
| CHLABORATORIAL | Decimal | — | Não | — | CH Laboratório |
| CHESTAGIO | Decimal | — | Não | — | CH Estágio |
| CHEXTENSAO | Decimal | — | Não | — | CH Extensão |
| OBJETIVO | String | 2000 | Não | — | Objetivo |
| CURSOLIVRE | String | 1 | Não | N | Curso livre |
| ITINERARIOFORMATIVO | String | 1 | Não | N | Itinerário formativo |

---

## 17. EduPLetivoData (SPLetivo) — Período Letivo

**PK**: `CODCOLIGADA; IDPERLET`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| IDPERLET | Int32 | — | Sim | 0 | ID do período letivo |
| CODPERLET | String | 10 | Sim | 0 | Código (ex: "2026.1") |
| DESCRICAO | String | 60 | Não | — | Descrição |
| CODFILIAL | Int16 | — | Sim | — | FK → GFilial |
| CODTIPOCURSO | Int16 | — | Sim | — | FK → STipoCurso |
| DTINICIO | DateTime | — | Sim | — | Data de início |
| DTFIM | DateTime | — | Não | — | Data de término |
| ENCERRADO | String | 1 | Não | N | Encerrado (S/N) |
| DIASLETIVOS | Int32 | — | Não | — | Dias letivos |
| CARGAHORARIA | Decimal | — | Não | — | Carga horária |
| IDPERLETANT | Int32 | — | Não | — | FK → Período anterior |
| IDPERLETPROX | Int32 | — | Não | — | FK → Próximo período |
| EXIBIRPORTAL | String | 1 | Sim | S | Exibir no portal (S/N) |

---

## 18. EduTurmaData (STurma)

**PK**: `CODCOLIGADA; CODFILIAL; IDPERLET; CODTURMA`
**Sub-objeto**: STURMACOMPL

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODFILIAL | Int16 | — | Sim | — | FK → GFilial |
| IDPERLET | Int32 | — | Sim | — | FK → SPLetivo |
| CODTURMA | String | 20 | Sim | 0 | Código da turma |
| IDHABILITACAOFILIAL | Int32 | — | Não | — | FK → SHabilitacaoFilial |
| NOME | String | 60 | Não | — | Nome da turma |
| MAXALUNOS | Int32 | — | Não | — | Máximo de alunos |
| DTINICIAL | DateTime | — | Não | — | Data inicial |
| DTFINAL | DateTime | — | Não | — | Data final |
| CODCURSO | String | — | Não | — | FK → SCurso |
| CODHABILITACAO | String | — | Não | — | FK → SHabilitacao |
| CODGRADE | String | — | Não | — | FK → SGrade |
| CODTIPOCURSO | Int16 | — | Não | — | FK → STipoCurso |
| TURMAENCERRADA | String | 1 | Não | — | Encerrada (S/N) |
| CODCAMPUS | String | 10 | Não | — | Campus/Polo |
| URLAULAONLINE | String | 2048 | Não | — | URL aula online |

---

## 19. EduTurmaDiscData (STurmaDisc) — Turma-Disciplina

**PK**: `CODCOLIGADA; IDTURMADISC`
**Sub-objeto**: STURMADISCCOMPL

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| IDTURMADISC | Int32 | — | Sim | 0 | ID (identity) |
| CODFILIAL | Int16 | — | Sim | — | FK → GFilial |
| CODTURMA | String | 20 | Sim | 0 | FK → STurma |
| IDPERLET | Int32 | — | Sim | — | FK → SPLetivo |
| CODDISC | String | 20 | Sim | — | FK → SDisciplina |
| CODTURNO | Int32 | — | Sim | — | FK → STurno |
| MAXALUNOS | Int32 | — | Não | — | Máximo de alunos |
| MINALUNOS | Int32 | — | Não | — | Mínimo de alunos |
| DTINICIAL | DateTime | — | Não | — | Data inicial |
| DTFINAL | DateTime | — | Não | — | Data final |
| IDHABILITACAOFILIAL | Int32 | — | Não | — | FK → SHabilitacaoFilial |
| CODCURSO | String | — | Não | — | FK → SCurso |
| CODHABILITACAO | String | — | Não | — | FK → SHabilitacao |
| CODGRADE | String | — | Não | — | FK → SGrade |
| ATIVA | String | 1 | Sim | S | Ativa (S/N) |
| COMPARTILHADA | String | 1 | Não | N | Compartilhada (S/N) |
| URLAULAONLINE | String | 2048 | Não | — | URL aula online |

---

## 20. EduProfessorData (SProfessor)

**PK**: `CODCOLIGADA; CODPROF`
**Sub-objeto**: SProfessorCompl
**~130 campos** — principais:

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODPROF | String | 10 | Sim | 0 | Código do professor |
| NOME | String | 120 | Sim | — | Nome |
| CODPESSOA | Int32 | — | Não | — | FK → PPESSOA.CODIGO |
| CHAPA | String | 16 | Não | — | Chapa (vínculo RH) |
| VALORAULA | Decimal | — | Não | — | Valor da aula |
| CODTITULACAO | Int16 | — | Não | — | FK → STitulacao |
| DTNASCIMENTO | DateTime | — | Sim | — | Data de nascimento |
| CPF | String | 14 | Não | — | CPF |
| EMAIL | String | — | Não | — | Email |
| CODFILIAL | Int16 | — | Não | — | FK → GFilial |

---

## 21. EduProfessorTurmaData (SProfessorTurma)

**PK**: `CODCOLIGADA; IDPROFESSORTURMA`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| IDPROFESSORTURMA | Int32 | — | Sim | — | ID |
| IDTURMADISC | Int32 | — | Sim | — | FK → STurmaDisc |
| CODPROF | String | 10 | Sim | — | FK → SProfessor |
| DTINICIO | DateTime | — | Não | — | Data início |
| DTFIM | DateTime | — | Não | — | Data fim |
| TIPOPROF | String | — | Não | — | Tipo do professor |
| VALORHORA | Decimal | — | Não | — | Valor hora |
| VALORFIXO | Decimal | — | Não | — | Valor fixo |

---

## 22. EduEtapasData (SEtapas) — Etapas de Avaliação

**PK**: `CODCOLIGADA; IDTURMADISC; CODETAPA; TIPOETAPA`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| IDTURMADISC | Int32 | — | Sim | — | FK → STurmaDisc |
| CODETAPA | Int16 | — | Sim | — | Código da etapa |
| TIPOETAPA | String | 1 | Sim | — | **N=Nota, F=Falta** |
| DESCRICAO | String | 60 | Não | — | Ex: "1º Bimestre", "Exame Final" |
| PONTDIST | Decimal | — | Não | — | Pontos distribuídos |
| MEDIA | Decimal | — | Não | — | Média para aprovação |
| FREQMIN | Decimal | — | Não | — | Frequência mínima (%) |
| DTINICIO | DateTime | — | Não | — | Data início |
| DTFIM | DateTime | — | Não | — | Data fim |
| AULASDADAS | Int16 | — | Não | — | Aulas dadas |
| AULASPREVISTAS | Int16 | — | Não | — | Aulas previstas |
| DTLIMITEDIGITACAO | DateTime | — | Não | — | Data limite para lançamento |
| ETAPAFINAL | String | 1 | Não | N | É etapa final (S/N) |
| ETAPAENCERRADA | String | 1 | Não | N | Etapa encerrada (S/N) |
| CODFORMULANOTA | String | 8 | Não | — | Fórmula de nota |
| CODFORMULAFALTA | String | 8 | Não | — | Fórmula de falta |

---

## 23. SNotaEtapa — Notas e Faltas por Etapa

**PK**: `CODCOLIGADA; RA; IDTURMADISC; CODETAPA; TIPOETAPA`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | — | Coligada |
| RA | String | 20 | Sim | — | FK → SAluno.RA |
| IDTURMADISC | Int32 | — | Sim | — | FK → STurmaDisc |
| CODETAPA | Int16 | — | Sim | — | FK → SEtapas |
| TIPOETAPA | String | 1 | Sim | — | **N=Nota, F=Falta** |
| NOTAFALTA | Decimal | — | Não | — | **Valor: nota (quando N) ou qtd faltas (quando F)** |
| AULASDADAS | Int16 | — | Não | — | Aulas dadas na etapa |

---

## 24. EduFrequenciaDiariaData — Frequência Diária

**PK**: `CODCOLIGADA; IDHORARIOTURMA; IDTURMADISC; RA; DATA`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | — | Coligada |
| IDHORARIOTURMA | Int32 | — | Sim | — | FK → SHorarioTurma |
| IDTURMADISC | Int32 | — | Sim | — | FK → STurmaDisc |
| RA | String | 20 | Sim | — | FK → SAluno.RA |
| DATA | DateTime | — | Sim | — | Data da aula |
| PRESENCA | String | 1 | Não | — | **S=Presente, N=Ausente** |
| JUSTIFICADA | String | 1 | Não | — | **S=Justificada, N=Não** |
| IDJUSTIFICATIVAFALTA | Int32 | — | Não | — | FK → Justificativa |

---

## 25. EduFaltasProfessorData — Diário de Aulas

**PK**: `CODCOLIGADA; IDTURMADISC; AULA; IDHORARIOTURMA`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | — | Coligada |
| IDTURMADISC | Int32 | — | Sim | — | FK → STurmaDisc |
| AULA | Int32 | — | Sim | — | Número da aula |
| IDHORARIOTURMA | Int32 | — | Sim | — | FK → SHorarioTurma |
| DATA | DateTime | — | Não | — | Data da aula |
| CONTEUDO | String | — | Não | — | Conteúdo planejado |
| CONTEUDOEFETIVO | String | — | Não | — | Conteúdo efetivo |
| CODPROF | String | 10 | Não | — | Professor substituto |
| REPOSICAO | String | 1 | Não | — | É reposição (S/N) |
| HORAINICIAL | DateTime | — | Não | — | Hora inicial |
| HORAFINAL | DateTime | — | Não | — | Hora final |

---

## 26. EduContratoData (SContrato) — Contrato Financeiro

**PK**: `CODCOLIGADA; RA; IDPERLET; CODCONTRATO`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | — | Coligada |
| RA | String | 20 | Sim | — | FK → SAluno.RA |
| IDPERLET | Int32 | — | Sim | — | FK → SPLetivo |
| CODCONTRATO | Int32 | — | Sim | — | Código do contrato |
| IDHABILITACAOFILIAL | Int32 | — | Não | — | FK → SHabilitacaoFilial |
| CODPLANOPGTO | Int32 | — | Não | — | Plano de pagamento |
| DTCONTRATO | DateTime | — | Não | — | Data do contrato |
| DIAVENCIMENTO | Int32 | — | Não | — | Dia de vencimento |
| TIPOCONTRATO | String | — | Não | — | Tipo do contrato |
| VALORSERVICO | Decimal | — | Não | — | Valor do serviço |
| DESCONTO | Decimal | — | Não | — | Desconto |
| VALORBOLSA | Decimal | — | Não | — | Valor da bolsa |

---

## 27. EduBolsaData (SBolsa) — Cadastro de Bolsas

**PK**: `CODCOLIGADA; CODBOLSA`
**Sub-objeto**: SBOLSACOMPL

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODBOLSA | String | 10 | Sim | 0 | Código da bolsa |
| NOME | String | 60 | Sim | — | Nome |
| VALOR | Decimal | — | Sim | 0 | Desconto (%) |
| CODTIPOCURSO | Int16 | — | Sim | — | FK → STipoCurso |
| TIPODESC | String | 1 | Sim | P | **P=Percentual, V=Valor** |
| CODCFO | String | 25 | Não | — | Responsável financeiro |
| FIES | String | 1 | Não | 0 | FIES (S/N) |
| BOLSAFUNC | String | 1 | Não | 0 | Bolsa funcionário (S/N) |
| ATIVA | String | 1 | Não | S | Bolsa ativa (S/N) |
| PERMITEALTERARVALOR | String | 1 | Não | S | Permite alterar valor (S/N) |
| VERIFICAINADIMPLENCIA | String | 1 | Não | S | Verifica inadimplência (S/N) |

---

## 28. EduOcorrenciaAlunoData (SOcorrenciaAluno)

**PK**: `CODCOLIGADA; IDOCORALUNO`
**Sub-objetos**: SOCORRENCIAALUNOARQ (arquivos), SOCORRENCIAALUNOCOMPL

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| IDOCORALUNO | Int32 | — | Sim | 0 | ID da ocorrência |
| RA | String | 20 | Sim | — | FK → SAluno.RA |
| CODOCORRENCIAGRUPO | Int16 | — | Sim | — | Grupo de ocorrência |
| CODOCORRENCIATIPO | Int32 | — | Sim | — | Tipo de ocorrência |
| IDPERLET | Int32 | — | Sim | — | FK → SPLetivo |
| IDTURMADISC | Int32 | — | Não | — | FK → STurmaDisc |
| CODETAPA | Int16 | — | Não | — | Etapa |
| DATAOCORRENCIA | DateTime | — | Não | — | Data e hora |
| OBSERVACOES | String | — | Não | — | Observações |
| CODPROF | String | 10 | Não | — | FK → SProfessor |
| DISPONIVELWEB | String | 1 | Não | — | Disponível no portal (S/N) |

---

## 29. EduSubTurmaData (SSubTurma)

**PK**: `CODCOLIGADA; IDTURMADISC; CODSUBTURMA`

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | — | Coligada |
| IDTURMADISC | Int32 | — | Sim | — | FK → STurmaDisc |
| CODSUBTURMA | String | 20 | Sim | — | Código da subturma |
| MAXALUNOS | Int32 | — | Não | — | Máximo de alunos |
| CODDISC | String | — | Não | — | FK → SDisciplina |
| CODTURMA | String | — | Não | — | FK → STurma |
| CODPERLET | String | — | Não | — | Período letivo |

---

## Inventário: +500 DataServer Objects Educacionais

Além dos 29 documentados acima, existem **530+ objects** com prefixo `Edu*`:

| Categoria | Qtd aprox. | Exemplos |
|-----------|-----------|----------|
| Acadêmico (alunos, matrículas, notas) | ~80 | EduAlunoData, EduMatriculaData, EduMatricPLData |
| Estrutura curricular (cursos, grades) | ~40 | EduCursoData, EduGradeData, EduDiscGradeData |
| Turmas e horários | ~30 | EduTurmaData, EduTurmaDiscData, EduHorarioData |
| Financeiro (contratos, bolsas) | ~50 | EduContratoData, EduBolsaData, EduParcelaData |
| Processo Seletivo | ~60 | EduPSProcessoSeletivoData, EduPSCandidatosData |
| Professores | ~20 | EduProfessorData, EduProfessorTurmaData |
| Extensão/Pesquisa/TCC | ~40 | EduTCCData, EduProjProjetoData |
| Tabelas auxiliares | ~30 | EduStatusData, EduTipoAlunoData, EduTipoCursoData |
| Censo/MEC | ~20 | EduAlunoMECData, EduCursoMECData |
| Integração (EB, Urania, Scientia) | ~50 | EduEBxxData, EduScientiaxData |
| Outros (CV, ocorrências, docs) | ~100+ | EduOcorrenciaAlunoData, EduDocumentoData |

---

*Documento gerado em 2026-03-22. Fonte: API Legada TOTVS + TDN + Fórum RM.*
