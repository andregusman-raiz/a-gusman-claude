# DOC-2 — Schema do Banco MSSQL: Tabelas Educacionais TOTVS RM

**Versão**: 1.0
**Data**: 2026-03-20
**Módulo**: RM Educacional / SGE
**Versão TOTVS RM**: 12.1.2502
**Banco**: Microsoft SQL Server
**Status**: Referência baseada em TDN + padrões conhecidos — colunas exatas precisam ser confirmadas contra o banco real

---

## 1. Visão Geral

O TOTVS RM utiliza **Microsoft SQL Server** como banco de dados relacional. O módulo educacional (RM Educacional / SGE) armazena dados em tabelas com prefixos que identificam o domínio:

| Prefixo | Domínio | Exemplos |
|---------|---------|---------|
| `S` | Educacional (Scholaris/SGE) | SALUNO, SMATRICULA, STURMA |
| `G` | Global / Framework | GCOLIGADA, GFILIAL, GUSUARIO |
| `E` | Estrutura / Entidade | EENTIDADE, EPARAMETRO |
| `P` | Financeiro / Pedagógico | PPARAMETRO |

### Características do Schema

- **Multi-tenant nativo**: toda tabela possui `CODCOLIGADA` como primeira coluna do PK
- **PKs compostas**: padrão `(CODCOLIGADA, CHAVE_ENTIDADE)` em todas as tabelas principais
- **Nomenclatura**: nomes de tabelas e colunas SEMPRE em MAIÚSCULAS
- **Versão confirmada**: 12.1.2502 (integração raiz-platform)
- **Coligadas ativas**: 20 coligadas confirmadas

> **Aviso Crítico**: Os nomes de colunas listados neste documento são baseados em documentação TDN e padrões de integração conhecidos. **Sempre confirmar contra o banco real** usando as queries de validação da seção 13 antes de implementar queries de produção.

---

## 2. Tabelas Core — Alunos & Matrículas

### 2.1 SALUNO — Cadastro de Alunos

Tabela principal de cadastro de alunos. Cada aluno é identificado pelo RA (Registro Acadêmico) dentro de uma coligada.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `RA` | VARCHAR(20) | NOT NULL | PK — Registro Acadêmico (ID único do aluno na coligada) |
| `NOME` | VARCHAR(100) | NOT NULL | Nome completo do aluno |
| `NOMESOCIAL` | VARCHAR(100) | NULL | Nome social (quando aplicável) |
| `CPF` | VARCHAR(14) | NULL | CPF (formato: 000.000.000-00 ou sem máscara) |
| `DATANASCIMENTO` | DATETIME | NULL | Data de nascimento |
| `SEXO` | CHAR(1) | NULL | `M` = Masculino, `F` = Feminino |
| `NOMEPAI` | VARCHAR(100) | NULL | Nome do pai |
| `NOMEMAE` | VARCHAR(100) | NULL | Nome da mãe |
| `CODRESPFINANCEIRO` | INT | NULL | FK → SRESPONSAVEL — Responsável financeiro |
| `CODRESPACADEMICO` | INT | NULL | FK → SRESPONSAVEL — Responsável acadêmico |
| `EMAIL` | VARCHAR(100) | NULL | E-mail do aluno |
| `TELEFONE` | VARCHAR(20) | NULL | Telefone principal |
| `CELULAR` | VARCHAR(20) | NULL | Celular |
| `ENDERECO` | VARCHAR(200) | NULL | Logradouro |
| `NUMERO` | VARCHAR(10) | NULL | Número do endereço |
| `COMPLEMENTO` | VARCHAR(50) | NULL | Complemento do endereço |
| `BAIRRO` | VARCHAR(80) | NULL | Bairro |
| `CIDADE` | VARCHAR(80) | NULL | Cidade |
| `UF` | CHAR(2) | NULL | Estado (ex: SP, MG, RJ) |
| `CEP` | VARCHAR(10) | NULL | CEP |
| `FOTO` | IMAGE | NULL | Foto do aluno (binário) |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |
| `DATACADASTRO` | DATETIME | NULL | Data de cadastro no sistema |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário que criou o registro |
| `RECCREATEDON` | DATETIME | NULL | Data de criação do registro |
| `RECMODIFIEDBY` | VARCHAR(50) | NULL | Usuário que modificou |
| `RECMODIFIEDON` | DATETIME | NULL | Data da última modificação |

**PK**: `(CODCOLIGADA, RA)`

---

### 2.2 SMATRICULA — Matrículas

Registro da matrícula do aluno em um curso/habilitação/grade para um período letivo.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `RA` | VARCHAR(20) | NOT NULL | PK — FK → SALUNO.RA |
| `CODCURSO` | VARCHAR(20) | NOT NULL | PK — FK → SCURSO.CODCURSO |
| `CODHABILITACAO` | VARCHAR(20) | NOT NULL | PK — FK → SHABILITACAO.CODHABILITACAO |
| `CODGRADE` | VARCHAR(20) | NOT NULL | PK — FK → SGRADE.CODGRADE |
| `CODPERIODOLETIVO` | VARCHAR(20) | NOT NULL | PK — FK → SPLETIVO.CODPERIODOLETIVO |
| `CODTURMA` | VARCHAR(20) | NULL | FK → STURMA.CODTURMA |
| `CODFILIAL` | INT | NULL | FK → GFILIAL.CODFILIAL |
| `STATUS` | CHAR(1) | NOT NULL | `A` = Ativo, `T` = Trancado, `C` = Cancelado, `F` = Formado |
| `DATAINICIO` | DATETIME | NULL | Data de início da matrícula |
| `DATAFIM` | DATETIME | NULL | Data de encerramento da matrícula |
| `SITUACAO` | VARCHAR(30) | NULL | Situação descritiva da matrícula |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário que criou o registro |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |
| `RECMODIFIEDBY` | VARCHAR(50) | NULL | Usuário que modificou |
| `RECMODIFIEDON` | DATETIME | NULL | Data da última modificação |

**PK**: `(CODCOLIGADA, RA, CODCURSO, CODHABILITACAO, CODGRADE, CODPERIODOLETIVO)`

---

### 2.3 SMATRICPL — Matrícula × Período Letivo

Vínculo da matrícula por período letivo (detalhe por período dentro de uma matrícula).

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `RA` | VARCHAR(20) | NOT NULL | PK — FK → SALUNO.RA |
| `CODCURSO` | VARCHAR(20) | NOT NULL | PK — FK → SCURSO |
| `CODHABILITACAO` | VARCHAR(20) | NOT NULL | PK — FK → SHABILITACAO |
| `CODGRADE` | VARCHAR(20) | NOT NULL | PK — FK → SGRADE |
| `CODPERIODOLETIVO` | VARCHAR(20) | NOT NULL | PK — FK → SPLETIVO |
| `PERIODO` | INT | NOT NULL | PK — Número do período/série/ano |
| `CODTURMA` | VARCHAR(20) | NULL | FK → STURMA.CODTURMA |
| `STATUS` | CHAR(1) | NOT NULL | Status no período (`A`, `R` = Reprovado, `A` = Aprovado) |
| `MEDIAAPROVACAO` | DECIMAL(5,2) | NULL | Média mínima para aprovação |
| `PERCENTUALFALTA` | DECIMAL(5,2) | NULL | Percentual máximo de faltas |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |

**PK**: `(CODCOLIGADA, RA, CODCURSO, CODHABILITACAO, CODGRADE, CODPERIODOLETIVO, PERIODO)`

---

### 2.4 SRESPONSAVEL — Responsáveis

Cadastro de responsáveis financeiros e acadêmicos dos alunos.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODRESPONSAVEL` | INT | NOT NULL | PK — ID do responsável |
| `NOME` | VARCHAR(100) | NOT NULL | Nome do responsável |
| `CPF` | VARCHAR(14) | NULL | CPF do responsável |
| `PARENTESCO` | VARCHAR(30) | NULL | Grau de parentesco com o aluno |
| `EMAIL` | VARCHAR(100) | NULL | E-mail do responsável |
| `TELEFONE` | VARCHAR(20) | NULL | Telefone |
| `CELULAR` | VARCHAR(20) | NULL | Celular |
| `ENDERECO` | VARCHAR(200) | NULL | Logradouro |
| `BAIRRO` | VARCHAR(80) | NULL | Bairro |
| `CIDADE` | VARCHAR(80) | NULL | Cidade |
| `UF` | CHAR(2) | NULL | Estado |
| `CEP` | VARCHAR(10) | NULL | CEP |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |

**PK**: `(CODCOLIGADA, CODRESPONSAVEL)`

---

## 3. Tabelas Core — Turmas & Disciplinas

### 3.1 STURMA — Turmas

Registro das turmas de cada período letivo.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODTURMA` | VARCHAR(20) | NOT NULL | PK — Código da turma |
| `NOME` | VARCHAR(100) | NOT NULL | Nome/descrição da turma |
| `CODCURSO` | VARCHAR(20) | NOT NULL | FK → SCURSO.CODCURSO |
| `CODHABILITACAO` | VARCHAR(20) | NOT NULL | FK → SHABILITACAO.CODHABILITACAO |
| `CODPERIODOLETIVO` | VARCHAR(20) | NOT NULL | FK → SPLETIVO.CODPERIODOLETIVO |
| `CODFILIAL` | INT | NULL | FK → GFILIAL.CODFILIAL |
| `CODTURNO` | VARCHAR(10) | NULL | Código do turno (M=Manhã, T=Tarde, N=Noite, I=Integral) |
| `CAPACIDADE` | INT | NULL | Capacidade máxima de alunos |
| `QTDALUNOS` | INT | NULL | Quantidade atual de alunos |
| `STATUS` | CHAR(1) | NOT NULL | `A` = Ativa, `E` = Encerrada, `C` = Cancelada |
| `CODPROFESSORREGENTE` | INT | NULL | FK → SPROFESSOR — Professor regente/tutor |
| `SALA` | VARCHAR(30) | NULL | Identificação da sala |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |
| `RECMODIFIEDBY` | VARCHAR(50) | NULL | Usuário que modificou |
| `RECMODIFIEDON` | DATETIME | NULL | Data da última modificação |

**PK**: `(CODCOLIGADA, CODTURMA)`

---

### 3.2 STURMADISC — Disciplinas da Turma

Vínculo entre turmas e disciplinas, com professor responsável e horário.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODTURMA` | VARCHAR(20) | NOT NULL | PK — FK → STURMA.CODTURMA |
| `CODDISC` | VARCHAR(20) | NOT NULL | PK — FK → SDISCIPLINA.CODDISC |
| `CODPROFESSOR` | INT | NULL | FK → SPROFESSOR.CODPROFESSOR |
| `HORARIO` | VARCHAR(100) | NULL | Descrição do horário (ex: SEG 07:00-08:00) |
| `CARGAHORARIA` | DECIMAL(8,2) | NULL | Carga horária da disciplina na turma |
| `CARGAHORARIAREAL` | DECIMAL(8,2) | NULL | Carga horária efetivamente ministrada |
| `SALA` | VARCHAR(30) | NULL | Sala de aula |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |

**PK**: `(CODCOLIGADA, CODTURMA, CODDISC)`

---

### 3.3 SDISCIPLINA — Disciplinas

Cadastro de disciplinas/componentes curriculares.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODDISC` | VARCHAR(20) | NOT NULL | PK — Código da disciplina |
| `NOME` | VARCHAR(100) | NOT NULL | Nome da disciplina |
| `ABREVIATURA` | VARCHAR(20) | NULL | Abreviatura da disciplina |
| `CARGAHORARIA` | DECIMAL(8,2) | NULL | Carga horária total |
| `TIPO` | CHAR(1) | NULL | `O` = Obrigatória, `E` = Eletiva, `C` = Complementar |
| `AREA` | VARCHAR(50) | NULL | Área do conhecimento |
| `EMENTA` | TEXT | NULL | Ementa da disciplina |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |
| `RECMODIFIEDBY` | VARCHAR(50) | NULL | Usuário que modificou |
| `RECMODIFIEDON` | DATETIME | NULL | Data da última modificação |

**PK**: `(CODCOLIGADA, CODDISC)`

---

### 3.4 SPROFESSOR — Professores

Cadastro de professores/docentes.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODPROFESSOR` | INT | NOT NULL | PK — ID do professor |
| `NOME` | VARCHAR(100) | NOT NULL | Nome completo |
| `CPF` | VARCHAR(14) | NULL | CPF |
| `EMAIL` | VARCHAR(100) | NULL | E-mail |
| `TELEFONE` | VARCHAR(20) | NULL | Telefone |
| `REGISTRO` | VARCHAR(30) | NULL | Registro profissional (ex: CRP, CREA) |
| `TITULACAO` | VARCHAR(50) | NULL | Titulação (Graduação, Especialização, Mestrado, Doutorado) |
| `CODUSUARIO` | VARCHAR(50) | NULL | FK → GUSUARIO.CODUSUARIO — Login no sistema |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |
| `DATACADASTRO` | DATETIME | NULL | Data de cadastro |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |

**PK**: `(CODCOLIGADA, CODPROFESSOR)`

---

## 4. Tabelas Core — Avaliação & Notas

### 4.1 SETAPA — Etapas de Avaliação

Define as etapas avaliativas do período letivo (bimestres, trimestres, semestres, etc.).

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODETAPA` | VARCHAR(20) | NOT NULL | PK — Código da etapa |
| `NOME` | VARCHAR(80) | NOT NULL | Nome da etapa (ex: 1º Bimestre) |
| `TIPO` | CHAR(1) | NULL | `B` = Bimestre, `T` = Trimestre, `S` = Semestre, `A` = Anual |
| `PESO` | DECIMAL(5,2) | NULL | Peso da etapa no cálculo da média anual |
| `DATAINI` | DATETIME | NULL | Data de início da etapa |
| `DATAFIM` | DATETIME | NULL | Data de encerramento da etapa |
| `CODPERIODOLETIVO` | VARCHAR(20) | NOT NULL | FK → SPLETIVO.CODPERIODOLETIVO |
| `ORDEM` | INT | NULL | Ordem de exibição da etapa |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |

**PK**: `(CODCOLIGADA, CODETAPA)`

---

### 4.2 SNOTA — Notas dos Alunos

Registro das notas por aluno, disciplina, etapa e turma.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `RA` | VARCHAR(20) | NOT NULL | PK — FK → SALUNO.RA |
| `CODDISC` | VARCHAR(20) | NOT NULL | PK — FK → SDISCIPLINA.CODDISC |
| `CODETAPA` | VARCHAR(20) | NOT NULL | PK — FK → SETAPA.CODETAPA |
| `CODTURMA` | VARCHAR(20) | NOT NULL | PK — FK → STURMA.CODTURMA |
| `CODAVALIACAO` | VARCHAR(20) | NULL | FK → SAVALIACAO.CODAVALIACAO |
| `NOTA` | DECIMAL(5,2) | NULL | Nota do aluno (0,00 a 10,00 tipicamente) |
| `NOTACONVERTIDA` | DECIMAL(5,2) | NULL | Nota convertida (quando há conversão de escala) |
| `SITUACAO` | VARCHAR(20) | NULL | `APROVADO`, `REPROVADO`, `EM_EXAME`, `CURSANDO` |
| `DATALANC` | DATETIME | NULL | Data de lançamento da nota |
| `CODPROFESSOR` | INT | NULL | FK → SPROFESSOR — Professor que lançou a nota |
| `OBSERVACAO` | VARCHAR(200) | NULL | Observação sobre a nota |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |
| `RECMODIFIEDBY` | VARCHAR(50) | NULL | Usuário que modificou |
| `RECMODIFIEDON` | DATETIME | NULL | Data da última modificação |

**PK**: `(CODCOLIGADA, RA, CODDISC, CODETAPA, CODTURMA)`

---

### 4.3 SFALTA — Faltas dos Alunos

Registro de presença/ausência por aula ou dia letivo.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `RA` | VARCHAR(20) | NOT NULL | PK — FK → SALUNO.RA |
| `CODDISC` | VARCHAR(20) | NOT NULL | PK — FK → SDISCIPLINA.CODDISC |
| `DATA` | DATETIME | NOT NULL | PK — Data da aula |
| `AULA` | INT | NOT NULL | PK — Número da aula no dia (1, 2, 3...) |
| `CODTURMA` | VARCHAR(20) | NOT NULL | FK → STURMA.CODTURMA |
| `TIPO` | CHAR(2) | NOT NULL | `P` = Presente, `F` = Falta, `FJ` = Falta Justificada |
| `JUSTIFICATIVA` | VARCHAR(200) | NULL | Texto da justificativa (quando FJ) |
| `CODPROFESSOR` | INT | NULL | FK → SPROFESSOR — Professor que registrou |
| `DATALANC` | DATETIME | NULL | Data do lançamento |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |

**PK**: `(CODCOLIGADA, RA, CODDISC, DATA, AULA)`

---

### 4.4 SAVALIACAO — Avaliações

Cadastro de avaliações (provas, trabalhos, etc.) dentro de uma etapa.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODAVALIACAO` | VARCHAR(20) | NOT NULL | PK — Código da avaliação |
| `NOME` | VARCHAR(80) | NOT NULL | Nome da avaliação (ex: Prova 1, Trabalho) |
| `TIPO` | VARCHAR(20) | NULL | `PROVA`, `TRABALHO`, `APRESENTACAO`, `PARTICIPACAO` |
| `PESO` | DECIMAL(5,2) | NULL | Peso no cálculo da nota da etapa |
| `NOTAMAXIMA` | DECIMAL(5,2) | NULL | Nota máxima possível |
| `CODETAPA` | VARCHAR(20) | NOT NULL | FK → SETAPA.CODETAPA |
| `CODDISC` | VARCHAR(20) | NULL | FK → SDISCIPLINA.CODDISC (quando específica de disciplina) |
| `DATAAVALIACAO` | DATETIME | NULL | Data da avaliação |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |

**PK**: `(CODCOLIGADA, CODAVALIACAO)`

---

## 5. Tabelas Core — Estrutura Curricular

### 5.1 SCURSO — Cursos

Cadastro de cursos oferecidos pela instituição.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODCURSO` | VARCHAR(20) | NOT NULL | PK — Código do curso |
| `NOME` | VARCHAR(100) | NOT NULL | Nome completo do curso |
| `ABREVIATURA` | VARCHAR(20) | NULL | Abreviatura |
| `NIVEL` | VARCHAR(20) | NOT NULL | `INFANTIL`, `FUNDAMENTAL`, `MEDIO`, `SUPERIOR`, `TECNICO`, `POS` |
| `MODALIDADE` | VARCHAR(20) | NULL | `PRESENCIAL`, `EAD`, `SEMIPRESENCIAL` |
| `DURACAO` | INT | NULL | Duração em períodos (semestres/anos) |
| `CARGAHORARIA` | DECIMAL(8,2) | NULL | Carga horária total do curso |
| `CODIGOMEC` | VARCHAR(20) | NULL | Código MEC (ensino superior) |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |

**PK**: `(CODCOLIGADA, CODCURSO)`

---

### 5.2 SHABILITACAO — Habilitações

Habilitações/ênfases dentro de um curso.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODCURSO` | VARCHAR(20) | NOT NULL | PK — FK → SCURSO.CODCURSO |
| `CODHABILITACAO` | VARCHAR(20) | NOT NULL | PK — Código da habilitação |
| `NOME` | VARCHAR(100) | NOT NULL | Nome da habilitação |
| `NIVEL` | VARCHAR(20) | NULL | Nível da habilitação (herda do curso ou específico) |
| `CARGAHORARIA` | DECIMAL(8,2) | NULL | Carga horária total da habilitação |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |

**PK**: `(CODCOLIGADA, CODCURSO, CODHABILITACAO)`

---

### 5.3 SGRADE — Grades Curriculares

Versões de grade curricular para cada habilitação.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODCURSO` | VARCHAR(20) | NOT NULL | PK — FK → SCURSO |
| `CODHABILITACAO` | VARCHAR(20) | NOT NULL | PK — FK → SHABILITACAO |
| `CODGRADE` | VARCHAR(20) | NOT NULL | PK — Código da grade |
| `NOME` | VARCHAR(100) | NOT NULL | Nome da grade (ex: Grade 2024) |
| `ANOINGRESSO` | INT | NULL | Ano de ingresso dos alunos nessa grade |
| `CARGAHORARIA` | DECIMAL(8,2) | NULL | Carga horária total da grade |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |

**PK**: `(CODCOLIGADA, CODCURSO, CODHABILITACAO, CODGRADE)`

---

### 5.4 SGRADEDISC — Disciplinas da Grade

Vínculo entre grade curricular e disciplinas, com período em que a disciplina é cursada.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODGRADE` | VARCHAR(20) | NOT NULL | PK — FK → SGRADE.CODGRADE |
| `CODDISC` | VARCHAR(20) | NOT NULL | PK — FK → SDISCIPLINA.CODDISC |
| `PERIODO` | INT | NOT NULL | PK — Período/série em que a disciplina é cursada |
| `CARGAHORARIA` | DECIMAL(8,2) | NULL | Carga horária da disciplina na grade |
| `TIPO` | CHAR(1) | NULL | `O` = Obrigatória, `E` = Eletiva, `C` = Complementar |
| `PREREQUISITO` | VARCHAR(20) | NULL | FK → SDISCIPLINA — Pré-requisito da disciplina |
| `ORDEM` | INT | NULL | Ordem de exibição |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |

**PK**: `(CODCOLIGADA, CODGRADE, CODDISC, PERIODO)`

---

## 6. Tabelas Core — Período & Calendário

### 6.1 SPLETIVO — Períodos Letivos

Cadastro dos períodos letivos (anos, semestres, bimestres).

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODPERIODOLETIVO` | VARCHAR(20) | NOT NULL | PK — Código do período letivo |
| `NOME` | VARCHAR(80) | NOT NULL | Nome do período (ex: 2025/1, 2025 - 1º Semestre) |
| `ANO` | INT | NOT NULL | Ano letivo |
| `SEMESTRE` | INT | NULL | Semestre (1 ou 2, quando aplicável) |
| `DATAINI` | DATETIME | NOT NULL | Data de início do período |
| `DATAFIM` | DATETIME | NOT NULL | Data de encerramento do período |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo (período vigente), `N` = Encerrado |
| `TIPO` | VARCHAR(20) | NULL | `ANUAL`, `SEMESTRAL`, `BIMESTRAL`, `TRIMESTRAL` |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |

**PK**: `(CODCOLIGADA, CODPERIODOLETIVO)`

---

### 6.2 SCALENDARIO — Calendário Letivo

Registro dos dias letivos, feriados e recessos.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `DATA` | DATETIME | NOT NULL | PK — Data do evento |
| `CODPERIODOLETIVO` | VARCHAR(20) | NULL | FK → SPLETIVO.CODPERIODOLETIVO |
| `TIPO` | VARCHAR(20) | NOT NULL | `LETIVO`, `FERIADO`, `RECESSO`, `EVENTO`, `NAOLETIVO` |
| `DESCRICAO` | VARCHAR(200) | NULL | Descrição do evento/feriado |
| `CODFILIAL` | INT | NULL | FK → GFILIAL (quando o calendário é por filial) |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |

**PK**: `(CODCOLIGADA, DATA)`

---

## 7. Tabelas Core — Ocorrências & Plano de Aula

### 7.1 SOCORRENCIA — Ocorrências Disciplinares

Registro de ocorrências acadêmicas e disciplinares de alunos.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODOCORRENCIA` | INT | NOT NULL | PK — ID da ocorrência (identity) |
| `RA` | VARCHAR(20) | NOT NULL | FK → SALUNO.RA |
| `CODDISC` | VARCHAR(20) | NULL | FK → SDISCIPLINA.CODDISC (quando em disciplina específica) |
| `CODTURMA` | VARCHAR(20) | NULL | FK → STURMA.CODTURMA |
| `DATA` | DATETIME | NOT NULL | Data da ocorrência |
| `TIPO` | VARCHAR(30) | NOT NULL | Ex: `DISCIPLINAR`, `PEDAGOGICA`, `SAUDE`, `ADMINISTRATIVA` |
| `DESCRICAO` | TEXT | NOT NULL | Descrição detalhada da ocorrência |
| `CODPROFESSOR` | INT | NULL | FK → SPROFESSOR — Professor que registrou |
| `STATUS` | VARCHAR(20) | NOT NULL | `ABERTA`, `EM_ANALISE`, `ENCERRADA` |
| `RESOLUCAO` | TEXT | NULL | Descrição da resolução |
| `DATAENCERRAMENTO` | DATETIME | NULL | Data de encerramento |
| `CODRESPONSAVEL` | INT | NULL | FK → SRESPONSAVEL — Responsável notificado |
| `NOTIFICADO` | CHAR(1) | NULL | `S` = Responsável notificado, `N` = Não notificado |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |
| `RECMODIFIEDBY` | VARCHAR(50) | NULL | Usuário que modificou |
| `RECMODIFIEDON` | DATETIME | NULL | Data da última modificação |

**PK**: `(CODCOLIGADA, CODOCORRENCIA)`

---

### 7.2 SPLANODEAULA — Planos de Aula

Registro dos planos de aula elaborados pelos professores.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODPLANO` | INT | NOT NULL | PK — ID do plano (identity) |
| `CODDISC` | VARCHAR(20) | NOT NULL | FK → SDISCIPLINA.CODDISC |
| `CODTURMA` | VARCHAR(20) | NOT NULL | FK → STURMA.CODTURMA |
| `DATA` | DATETIME | NOT NULL | Data da aula planejada |
| `AULA` | INT | NULL | Número da aula |
| `CONTEUDO` | TEXT | NULL | Conteúdo programático a ser trabalhado |
| `OBJETIVO` | TEXT | NULL | Objetivos da aula |
| `METODOLOGIA` | TEXT | NULL | Metodologia/estratégias de ensino |
| `RECURSOS` | TEXT | NULL | Recursos didáticos utilizados |
| `AVALIACAO` | TEXT | NULL | Formas de avaliação planejadas |
| `CODPROFESSOR` | INT | NOT NULL | FK → SPROFESSOR — Professor responsável |
| `STATUS` | VARCHAR(20) | NULL | `RASCUNHO`, `PUBLICADO`, `EXECUTADO` |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |
| `RECMODIFIEDBY` | VARCHAR(50) | NULL | Usuário que modificou |
| `RECMODIFIEDON` | DATETIME | NULL | Data da última modificação |

**PK**: `(CODCOLIGADA, CODPLANO)`

---

## 8. Tabelas Core — Histórico & Relatórios

### 8.1 SHISTORICO — Histórico Escolar

Registro histórico do desempenho do aluno por disciplina e ano, consolidado após o encerramento do período letivo.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `RA` | VARCHAR(20) | NOT NULL | PK — FK → SALUNO.RA |
| `CODDISC` | VARCHAR(20) | NOT NULL | PK — FK → SDISCIPLINA.CODDISC |
| `ANO` | INT | NOT NULL | PK — Ano letivo do histórico |
| `PERIODO` | INT | NOT NULL | PK — Período cursado |
| `NOTA` | DECIMAL(5,2) | NULL | Nota final consolidada |
| `FALTAS` | INT | NULL | Total de faltas no período |
| `CARGAHORARIA` | DECIMAL(8,2) | NULL | Carga horária da disciplina |
| `PERCENTUALFALTA` | DECIMAL(5,2) | NULL | Percentual de faltas (calculado) |
| `RESULTADO` | VARCHAR(20) | NOT NULL | `APROVADO`, `REPROVADO`, `TRANSFERIDO`, `EXAME` |
| `NOMEDISCIPLINA` | VARCHAR(100) | NULL | Nome da disciplina (desnormalizado para histórico) |
| `CODPERIODOLETIVO` | VARCHAR(20) | NULL | FK → SPLETIVO.CODPERIODOLETIVO |

**PK**: `(CODCOLIGADA, RA, CODDISC, ANO, PERIODO)`

---

### 8.2 SRELATORIO — Relatórios

Cadastro de templates de relatórios do módulo educacional.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODRELATORIO` | INT | NOT NULL | PK — ID do relatório |
| `NOME` | VARCHAR(100) | NOT NULL | Nome do relatório |
| `TIPO` | VARCHAR(30) | NULL | `BOLETIM`, `HISTORICO`, `DIARIO`, `FREQUENCIA`, `CUSTOM` |
| `TEMPLATE` | TEXT | NULL | Template/definição do relatório (XML, JSON ou caminho) |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |

**PK**: `(CODCOLIGADA, CODRELATORIO)`

---

## 9. Tabelas Framework (Global)

Tabelas do framework TOTVS RM compartilhadas por todos os módulos.

### 9.1 GCOLIGADA — Coligadas

Unidades de negócio (escolas/unidades) cadastradas no sistema.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `NOME` | VARCHAR(100) | NOT NULL | Nome da coligada/escola |
| `NOMEFANTASIA` | VARCHAR(100) | NULL | Nome fantasia |
| `CNPJ` | VARCHAR(18) | NULL | CNPJ da coligada |
| `IE` | VARCHAR(20) | NULL | Inscrição estadual |
| `CIDADE` | VARCHAR(80) | NULL | Cidade sede |
| `UF` | CHAR(2) | NULL | Estado |
| `TELEFONE` | VARCHAR(20) | NULL | Telefone |
| `EMAIL` | VARCHAR(100) | NULL | E-mail institucional |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |

**PK**: `(CODCOLIGADA)`

> **Confirmado**: 20 coligadas ativas na integração raiz-platform.

---

### 9.2 GFILIAL — Filiais

Filiais de cada coligada (unidades físicas/campi).

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODFILIAL` | INT | NOT NULL | PK — Código da filial |
| `NOME` | VARCHAR(100) | NOT NULL | Nome da filial |
| `ENDERECO` | VARCHAR(200) | NULL | Endereço completo |
| `CIDADE` | VARCHAR(80) | NULL | Cidade |
| `UF` | CHAR(2) | NULL | Estado |
| `TELEFONE` | VARCHAR(20) | NULL | Telefone |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |

**PK**: `(CODCOLIGADA, CODFILIAL)`

---

### 9.3 GUSUARIO — Usuários do Sistema

Cadastro de usuários do RM com acesso ao sistema.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODUSUARIO` | VARCHAR(50) | NOT NULL | PK — Login do usuário |
| `NOME` | VARCHAR(100) | NOT NULL | Nome completo |
| `EMAIL` | VARCHAR(100) | NULL | E-mail do usuário |
| `PERFIL` | VARCHAR(30) | NULL | Perfil de acesso (ADMIN, PROFESSOR, ALUNO, RESPONSAVEL) |
| `CODCOLIGADA` | SMALLINT | NULL | Coligada padrão do usuário |
| `ATIVO` | CHAR(1) | NOT NULL | `S` = Ativo, `N` = Inativo |
| `ULTIMOACESSO` | DATETIME | NULL | Data/hora do último acesso |
| `RECCREATEDBY` | VARCHAR(50) | NULL | Usuário criador |
| `RECCREATEDON` | DATETIME | NULL | Data de criação |

**PK**: `(CODUSUARIO)`

---

### 9.4 GPARAMGLOBAL — Parâmetros Globais

Parâmetros de configuração global do sistema RM.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `CODCOLIGADA` | SMALLINT | NOT NULL | PK — Código da coligada |
| `CODPARAMETRO` | VARCHAR(50) | NOT NULL | PK — Código do parâmetro |
| `VALOR` | VARCHAR(200) | NULL | Valor do parâmetro |
| `DESCRICAO` | VARCHAR(200) | NULL | Descrição do parâmetro |
| `TIPO` | VARCHAR(20) | NULL | Tipo do valor (`STRING`, `INT`, `DECIMAL`, `BOOL`, `DATE`) |

**PK**: `(CODCOLIGADA, CODPARAMETRO)`

---

## 10. Chaves Estrangeiras (Relacionamentos)

### Relacionamentos Principais

| Tabela Origem | Coluna(s) | Tabela Destino | Coluna(s) | Cardinalidade |
|---------------|-----------|----------------|-----------|---------------|
| `SALUNO` | `CODCOLIGADA` | `GCOLIGADA` | `CODCOLIGADA` | N:1 |
| `SALUNO` | `CODRESPFINANCEIRO` | `SRESPONSAVEL` | `CODRESPONSAVEL` | N:1 |
| `SALUNO` | `CODRESPACADEMICO` | `SRESPONSAVEL` | `CODRESPONSAVEL` | N:1 |
| `SMATRICULA` | `(CODCOLIGADA, RA)` | `SALUNO` | `(CODCOLIGADA, RA)` | N:1 |
| `SMATRICULA` | `(CODCOLIGADA, CODTURMA)` | `STURMA` | `(CODCOLIGADA, CODTURMA)` | N:1 |
| `SMATRICULA` | `(CODCOLIGADA, CODCURSO)` | `SCURSO` | `(CODCOLIGADA, CODCURSO)` | N:1 |
| `SMATRICULA` | `(CODCOLIGADA, CODPERIODOLETIVO)` | `SPLETIVO` | `(CODCOLIGADA, CODPERIODOLETIVO)` | N:1 |
| `SMATRICPL` | `(CODCOLIGADA, RA, ...)` | `SMATRICULA` | `(CODCOLIGADA, RA, ...)` | N:1 |
| `STURMA` | `(CODCOLIGADA, CODCURSO)` | `SCURSO` | `(CODCOLIGADA, CODCURSO)` | N:1 |
| `STURMA` | `(CODCOLIGADA, CODPERIODOLETIVO)` | `SPLETIVO` | `(CODCOLIGADA, CODPERIODOLETIVO)` | N:1 |
| `STURMA` | `CODFILIAL` | `GFILIAL` | `CODFILIAL` | N:1 |
| `STURMADISC` | `(CODCOLIGADA, CODTURMA)` | `STURMA` | `(CODCOLIGADA, CODTURMA)` | N:1 |
| `STURMADISC` | `(CODCOLIGADA, CODDISC)` | `SDISCIPLINA` | `(CODCOLIGADA, CODDISC)` | N:1 |
| `STURMADISC` | `CODPROFESSOR` | `SPROFESSOR` | `CODPROFESSOR` | N:1 |
| `SNOTA` | `(CODCOLIGADA, RA)` | `SALUNO` | `(CODCOLIGADA, RA)` | N:1 |
| `SNOTA` | `(CODCOLIGADA, CODDISC)` | `SDISCIPLINA` | `(CODCOLIGADA, CODDISC)` | N:1 |
| `SNOTA` | `(CODCOLIGADA, CODETAPA)` | `SETAPA` | `(CODCOLIGADA, CODETAPA)` | N:1 |
| `SNOTA` | `(CODCOLIGADA, CODTURMA)` | `STURMA` | `(CODCOLIGADA, CODTURMA)` | N:1 |
| `SFALTA` | `(CODCOLIGADA, RA)` | `SALUNO` | `(CODCOLIGADA, RA)` | N:1 |
| `SFALTA` | `(CODCOLIGADA, CODDISC)` | `SDISCIPLINA` | `(CODCOLIGADA, CODDISC)` | N:1 |
| `SFALTA` | `(CODCOLIGADA, CODTURMA)` | `STURMA` | `(CODCOLIGADA, CODTURMA)` | N:1 |
| `SETAPA` | `(CODCOLIGADA, CODPERIODOLETIVO)` | `SPLETIVO` | `(CODCOLIGADA, CODPERIODOLETIVO)` | N:1 |
| `SOCORRENCIA` | `(CODCOLIGADA, RA)` | `SALUNO` | `(CODCOLIGADA, RA)` | N:1 |
| `SPLANODEAULA` | `(CODCOLIGADA, CODTURMA)` | `STURMA` | `(CODCOLIGADA, CODTURMA)` | N:1 |
| `SPLANODEAULA` | `CODPROFESSOR` | `SPROFESSOR` | `CODPROFESSOR` | N:1 |
| `SHISTORICO` | `(CODCOLIGADA, RA)` | `SALUNO` | `(CODCOLIGADA, RA)` | N:1 |
| `SHABILITACAO` | `(CODCOLIGADA, CODCURSO)` | `SCURSO` | `(CODCOLIGADA, CODCURSO)` | N:1 |
| `SGRADE` | `(CODCOLIGADA, CODCURSO, CODHABILITACAO)` | `SHABILITACAO` | `(CODCOLIGADA, CODCURSO, CODHABILITACAO)` | N:1 |
| `SGRADEDISC` | `(CODCOLIGADA, CODGRADE)` | `SGRADE` | `(CODCOLIGADA, CODGRADE)` | N:1 |
| `SGRADEDISC` | `(CODCOLIGADA, CODDISC)` | `SDISCIPLINA` | `(CODCOLIGADA, CODDISC)` | N:1 |

---

## 11. Modelo Multi-Tenant

### Regra Fundamental

**Toda query de produção DEVE incluir filtro por `CODCOLIGADA`.**

```sql
-- CORRETO: sempre filtrar por coligada
SELECT * FROM SALUNO WHERE CODCOLIGADA = @CodColigada AND RA = @RA

-- ERRADO: nunca consultar sem filtro de coligada
SELECT * FROM SALUNO WHERE RA = @RA
```

### Colunas de Isolamento por Tabela

| Tabela | Coluna(s) de Isolamento | Obrigatório no WHERE |
|--------|------------------------|----------------------|
| `SALUNO` | `CODCOLIGADA` | Sempre |
| `SMATRICULA` | `CODCOLIGADA`, `CODFILIAL` (opcional) | Sempre |
| `STURMA` | `CODCOLIGADA`, `CODFILIAL` (opcional) | Sempre |
| `STURMADISC` | `CODCOLIGADA` | Sempre |
| `SNOTA` | `CODCOLIGADA` | Sempre |
| `SFALTA` | `CODCOLIGADA` | Sempre |
| `SPLETIVO` | `CODCOLIGADA` | Sempre |
| `GFILIAL` | `CODCOLIGADA` | Sempre |

### PKs Compostas — Padrão

```
PK = (CODCOLIGADA, <chave_entidade>)
```

Em tabelas de relacionamento:
```
PK = (CODCOLIGADA, <chave1>, <chave2>)
```

### CODCOLIGADA é sempre SMALLINT

```sql
-- Tipo correto nos parâmetros
DECLARE @CodColigada SMALLINT = 1
```

---

## 12. Notas Importantes

### Convenções de Nomenclatura

- **Tabelas e colunas**: sempre `UPPERCASE`
- **Prefixo S**: módulo educacional (Scholaris/SGE)
- **Prefixo G**: framework global TOTVS RM
- **Prefixo E**: entidades/estrutura do framework

### Tipos de Dados Padrão

| Categoria | Tipo SQL Server | Observação |
|-----------|----------------|------------|
| Identificadores numéricos | `SMALLINT` (CODCOLIGADA), `INT` (demais) | CODCOLIGADA sempre SMALLINT |
| Códigos alfanuméricos | `VARCHAR(20)` | CODCURSO, CODTURMA, CODDISC, etc. |
| Nomes | `VARCHAR(100)` | NOME, campos de texto curto |
| Textos longos | `TEXT` ou `VARCHAR(MAX)` | Descrições, ementas, conteúdos |
| Datas | `DATETIME` ou `SMALLDATETIME` | Preferência DATETIME para precisão |
| Status/Flags | `CHAR(1)` | `S`/`N`, `A`/`I`, etc. |
| Notas/Médias | `DECIMAL(5,2)` | 0,00 a 10,00 |
| Monetário | `DECIMAL(15,4)` ou `MONEY` | Valores financeiros |
| Porcentagem | `DECIMAL(5,2)` | 0,00 a 100,00 |

### RA — Registro Acadêmico

- Identificador único do aluno **dentro de uma coligada**
- Tipo: `VARCHAR(20)` (pode ser numérico com zeros à esquerda)
- **Nunca é único globalmente** — sempre usar `(CODCOLIGADA, RA)` como chave

### Colunas de Auditoria (Padrão TOTVS)

Todas as tabelas principais incluem:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `RECCREATEDBY` | VARCHAR(50) | Usuário que criou o registro |
| `RECCREATEDON` | DATETIME | Data/hora de criação |
| `RECMODIFIEDBY` | VARCHAR(50) | Usuário da última modificação |
| `RECMODIFIEDON` | DATETIME | Data/hora da última modificação |

### Status Codes Comuns

| Contexto | Código | Significado |
|----------|--------|-------------|
| Ativo/Inativo | `S` / `N` | Sim/Não (padrão brasileiro TOTVS) |
| Status Matrícula | `A` | Ativo |
| Status Matrícula | `T` | Trancado |
| Status Matrícula | `C` | Cancelado |
| Status Matrícula | `F` | Formado/Concluído |
| Tipo Falta | `P` | Presente |
| Tipo Falta | `F` | Falta |
| Tipo Falta | `FJ` | Falta Justificada |
| Sexo | `M` / `F` | Masculino/Feminino |

---

## 13. Queries de Validação do Schema

Execute estas queries contra o banco real para confirmar o schema antes de implementar integrações.

### 13.1 Listar Todas as Tabelas Educacionais

```sql
-- Todas as tabelas com prefixo S (educacional)
SELECT
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE 'S%'
    AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Todas as tabelas do framework global (prefixo G)
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE 'G%'
    AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

### 13.2 Inspecionar Colunas de uma Tabela

```sql
-- Colunas da tabela SALUNO (confirmar nomes e tipos)
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'SALUNO'
ORDER BY ORDINAL_POSITION;

-- Reutilize para qualquer tabela
-- WHERE TABLE_NAME = 'SMATRICULA'
-- WHERE TABLE_NAME = 'STURMA'
-- WHERE TABLE_NAME = 'SNOTA'
-- etc.
```

### 13.3 Confirmar PKs e Índices

```sql
-- PKs de todas as tabelas educacionais
SELECT
    tc.TABLE_NAME,
    kcu.COLUMN_NAME,
    kcu.ORDINAL_POSITION
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
    AND tc.TABLE_NAME = kcu.TABLE_NAME
WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    AND tc.TABLE_NAME LIKE 'S%'
ORDER BY tc.TABLE_NAME, kcu.ORDINAL_POSITION;
```

### 13.4 Confirmar Chaves Estrangeiras

```sql
-- Foreign keys das tabelas educacionais
SELECT
    fk.name AS FK_NAME,
    tp.name AS PARENT_TABLE,
    cp.name AS PARENT_COLUMN,
    tr.name AS REFERENCED_TABLE,
    cr.name AS REFERENCED_COLUMN
FROM sys.foreign_keys fk
JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id
    AND fkc.parent_column_id = cp.column_id
JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id
    AND fkc.referenced_column_id = cr.column_id
WHERE tp.name LIKE 'S%'
ORDER BY tp.name, fk.name;
```

### 13.5 Verificar Existência de Colunas Específicas

```sql
-- Confirmar se colunas documentadas existem
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('SALUNO', 'SMATRICULA', 'STURMA', 'SNOTA', 'SFALTA')
    AND COLUMN_NAME IN ('CODCOLIGADA', 'RA', 'NOME', 'STATUS', 'ATIVO')
ORDER BY TABLE_NAME, COLUMN_NAME;
```

### 13.6 Validar Dados de Coligadas

```sql
-- Confirmar coligadas ativas (esperado: 20)
SELECT
    CODCOLIGADA,
    NOME,
    ATIVO
FROM GCOLIGADA
WHERE ATIVO = 'S'
ORDER BY CODCOLIGADA;

-- Contar alunos ativos por coligada
SELECT
    CODCOLIGADA,
    COUNT(*) AS TOTAL_ALUNOS
FROM SALUNO
WHERE ATIVO = 'S'
GROUP BY CODCOLIGADA
ORDER BY CODCOLIGADA;
```

### 13.7 Verificar Período Letivo Ativo

```sql
-- Período letivo vigente por coligada
SELECT
    CODCOLIGADA,
    CODPERIODOLETIVO,
    NOME,
    ANO,
    DATAINI,
    DATAFIM
FROM SPLETIVO
WHERE ATIVO = 'S'
ORDER BY CODCOLIGADA, ANO DESC;
```

---

## 14. Diagrama Entidade-Relacionamento

### Visão Geral (Texto)

```
FRAMEWORK GLOBAL
─────────────────────────────────────────────────────────────
GCOLIGADA ──┬──── GFILIAL
            │
            └──── GUSUARIO

MÓDULO EDUCACIONAL (prefixo S)
─────────────────────────────────────────────────────────────

SCURSO ──── SHABILITACAO ──── SGRADE ──── SGRADEDISC ──── SDISCIPLINA
                                                               │
SPLETIVO ──── SETAPA                                          │
    │                                                          │
    └──── SCALENDARIO                                          │
                                                               │
GCOLIGADA ──── SALUNO ──────────── SMATRICULA ──── STURMA ────┘
               │    └── SMATRICPL      │               │
               │                       │               └──── STURMADISC ──── SPROFESSOR
               │                       │
               └──────────────────── SNOTA ──── SETAPA
               │                       │
               └──────────────────── SFALTA
               │
               └──────────────────── SOCORRENCIA
               │
               └──────────────────── SHISTORICO

STURMA ──── SPLANODEAULA ──── SPROFESSOR
```

### Fluxo de Dados — Boletim de Notas

```
SALUNO (quem)
  └─► SMATRICULA (em qual curso/período)
        └─► STURMA (em qual turma)
              └─► STURMADISC (quais disciplinas)
                    └─► SNOTA (quais notas)
                          └─► SETAPA (de qual etapa)
                    └─► SFALTA (quais faltas)
```

### Fluxo de Dados — Estrutura Curricular

```
SCURSO (curso)
  └─► SHABILITACAO (habilitação/ênfase)
        └─► SGRADE (grade curricular/versão)
              └─► SGRADEDISC (disciplinas da grade por período)
                    └─► SDISCIPLINA (detalhes da disciplina)
```

---

## 15. Sumário das Tabelas

| Tabela | Prefixo | Domínio | PK Principal | Registros Estimados |
|--------|---------|---------|--------------|---------------------|
| `SALUNO` | S | Alunos | CODCOLIGADA, RA | Alto (todos os alunos) |
| `SMATRICULA` | S | Matrículas | CODCOLIGADA, RA, CODCURSO... | Alto |
| `SMATRICPL` | S | Matrícula × Período | CODCOLIGADA, RA, ... PERIODO | Alto |
| `SRESPONSAVEL` | S | Responsáveis | CODCOLIGADA, CODRESPONSAVEL | Médio |
| `STURMA` | S | Turmas | CODCOLIGADA, CODTURMA | Médio |
| `STURMADISC` | S | Disciplinas/Turma | CODCOLIGADA, CODTURMA, CODDISC | Médio |
| `SDISCIPLINA` | S | Disciplinas | CODCOLIGADA, CODDISC | Baixo (cadastro) |
| `SPROFESSOR` | S | Professores | CODCOLIGADA, CODPROFESSOR | Baixo (cadastro) |
| `SETAPA` | S | Etapas Avaliativas | CODCOLIGADA, CODETAPA | Baixo (cadastro) |
| `SNOTA` | S | Notas | CODCOLIGADA, RA, CODDISC, CODETAPA, CODTURMA | Muito Alto |
| `SFALTA` | S | Faltas | CODCOLIGADA, RA, CODDISC, DATA, AULA | Muito Alto |
| `SAVALIACAO` | S | Avaliações | CODCOLIGADA, CODAVALIACAO | Médio |
| `SCURSO` | S | Cursos | CODCOLIGADA, CODCURSO | Muito Baixo |
| `SHABILITACAO` | S | Habilitações | CODCOLIGADA, CODCURSO, CODHABILITACAO | Baixo |
| `SGRADE` | S | Grades Curriculares | CODCOLIGADA, CODCURSO, CODHABILITACAO, CODGRADE | Baixo |
| `SGRADEDISC` | S | Disciplinas da Grade | CODCOLIGADA, CODGRADE, CODDISC, PERIODO | Baixo |
| `SPLETIVO` | S | Períodos Letivos | CODCOLIGADA, CODPERIODOLETIVO | Muito Baixo |
| `SCALENDARIO` | S | Calendário | CODCOLIGADA, DATA | Baixo |
| `SOCORRENCIA` | S | Ocorrências | CODCOLIGADA, CODOCORRENCIA | Médio |
| `SPLANODEAULA` | S | Planos de Aula | CODCOLIGADA, CODPLANO | Médio |
| `SHISTORICO` | S | Histórico Escolar | CODCOLIGADA, RA, CODDISC, ANO, PERIODO | Alto |
| `SRELATORIO` | S | Relatórios | CODCOLIGADA, CODRELATORIO | Baixo |
| `GCOLIGADA` | G | Coligadas | CODCOLIGADA | 20 (confirmado) |
| `GFILIAL` | G | Filiais | CODCOLIGADA, CODFILIAL | Baixo |
| `GUSUARIO` | G | Usuários | CODUSUARIO | Médio |
| `GPARAMGLOBAL` | G | Parâmetros Globais | CODCOLIGADA, CODPARAMETRO | Baixo |

---

---

## Tabelas Financeiras

| Tabela | Schema | Descrição | Colunas-Chave | Volume |
|--------|--------|-----------|---------------|--------|
| `FLAN` | F | Lançamentos Financeiros | CODCOLIGADA, IDLAN, CODCFO, STATUSLAN | Alto |
| `FLANRATCMP` | F | Rateio por Centro de Custo | CODCOLIGADA, IDLAN, CODCCUSTO | Médio |
| `FBOL` | F | Boletos / Títulos | CODCOLIGADA, IDLAN, NOSSONUMERO | Alto |
| `SBOLSAS` | S | Bolsas e Descontos | CODCOLIGADA, RA, CODBOLSA, TIPOBOLSA | Baixo |
| `FCFO` | F | Cadastro Financeiro (Contratos) | CODCOLIGADA, CODCFO, NOMEFANTASIA | Médio |

### FLAN — Campos Principais

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| CODCOLIGADA | int | Coligada |
| IDLAN | int | ID do lançamento (PK) |
| CODCFO | varchar(25) | Código do cliente (responsável financeiro) |
| RA | varchar(20) | Matrícula do aluno |
| COMPETENCIA | varchar(7) | Competência (YYYY-MM) |
| DTVENCIMENTO | datetime | Data de vencimento |
| VALORORIGINAL | decimal(15,4) | Valor original |
| VALORDESCONTO | decimal(15,4) | Valor de desconto |
| VALORPAGO | decimal(15,4) | Valor pago |
| STATUSLAN | int | 0=Aberto, 1=Baixado, 2=Cancelado |
| DTPAGAMENTO | datetime | Data do pagamento |

### SBOLSAS — Campos Principais

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| CODCOLIGADA | int | Coligada |
| RA | varchar(20) | Matrícula |
| CODBOLSA | int | Código da bolsa (PK) |
| TIPOBOLSA | int | 1=Integral, 2=Parcial, 3=Mérito, 4=Social, 5=Convênio, 6=Funcionário |
| PERCENTUAL | decimal(5,2) | Percentual de desconto |
| DTINICIO | datetime | Vigência início |
| DTFIM | datetime | Vigência fim |
| ATIVA | bit | 0=Inativa, 1=Ativa |

---

*Documento gerado em 2026-03-20. Atualizado em 2026-03-21 com tabelas financeiras (FLAN, FBOL, SBOLSAS, FCFO). Confirmar nomes exatos de colunas contra o banco real.*
