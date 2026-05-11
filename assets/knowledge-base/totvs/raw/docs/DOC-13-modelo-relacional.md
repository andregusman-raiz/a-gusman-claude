# DOC 13 — Modelo Relacional Completo

> Hierarquia de tabelas, relacionamentos (FKs) e dicionário de dados do TOTVS RM Educacional.
> Fonte: TDN, Fórum RM, GLINKSREL, blogs técnicos.
> Data: 2026-03-22

---

## 1. Prefixos de Tabela por Módulo

| Prefixo | Módulo | Nome Legado |
|---------|--------|-------------|
| **S** | TOTVS Educacional (Classis Net) | RM Classis |
| **E** | Educacional (Ensino Básico) | RM Classis |
| **F** | Gestão Financeira | RM Fluxus |
| **G** | Tabelas Globais (Framework) | — |
| **P** | Pessoas / Folha | RM Labore |

---

## 2. Hierarquia Completa de Tabelas

```
GCOLIGADA (Empresa/Instituição)
│
├── GFILIAL (Filial/Campus)
│
├── STIPOCURSO (Nível de Ensino: Superior, Básico)
│   │
│   └── SCURSO (Curso: Eng. Civil, Pedagogia)
│       │
│       └── SHABILITACAO (Habilitação: Bacharelado, Licenciatura)
│           │
│           └── SGRADE (Matriz Curricular: 2024.1)
│               │
│               └── SPERIODO (Período da Grade: 1º sem, 2º sem)
│                   │
│                   └── SDISCGRADE (Disciplinas na Grade)
│                       │
│                       └── SDISCIPLINA (Disciplina: Cálculo I)
│
├── SPLETIVO (Período Letivo: 2026.1, 2026.2)
│   │
│   └── STURMA (Turma: ENG-A, PED-B)
│       │
│       └── STURMADISC (Turma-Disciplina ofertada)
│           │
│           ├── SETAPAS (Etapas: 1ºBim, 2ºBim, Exame)
│           │   └── SNOTAETAPA (Notas/Faltas por aluno×etapa)
│           │
│           ├── SPROFESSORTURMA (Professor atribuído)
│           │
│           ├── SHORARIOTURMA (Horários da turma)
│           │   └── EduFrequenciaDiaria (Presença diária)
│           │
│           ├── SPLANOAULA (Plano de aula)
│           │
│           └── SSUBTURMA (Subturmas)
│
├── SHABILITACAOFILIAL (Matriz Aplicada = Curso×Hab×Grade×Filial)
│
├── PPESSOA (Pessoa — cadastro master)
│   │
│   ├── SALUNO (Aluno: CODPESSOA → PPESSOA)
│   │   │
│   │   ├── SALUNOCOMPL (Dados complementares)
│   │   │
│   │   ├── SHABILITACAOALUNO (Aluno no Curso)
│   │   │   ├── CODSTATUS → SSTATUS (situação no curso)
│   │   │   └── CODTIPOINGRESSO → STIPOINGRESSO
│   │   │
│   │   ├── SMATRICPL (Matrícula no Período Letivo)
│   │   │   ├── CODSTATUS → SSTATUS (situação no período)
│   │   │   ├── CODSTATUSRES → SSTATUS (resultado)
│   │   │   ├── CODTIPOMAT → STIPOMATRICULA
│   │   │   │
│   │   │   └── SMATRICULA (Matrícula na Disciplina)
│   │   │       ├── CODSTATUS → SSTATUS (situação na disc.)
│   │   │       └── CODSTATUSRES → SSTATUS (resultado disc.)
│   │   │
│   │   ├── SCONTRATO (Contrato Financeiro)
│   │   │   └── SPARCELA (Parcelas/Mensalidades)
│   │   │       └── SLAN → FLAN (Lançamento Financeiro)
│   │   │
│   │   ├── SBOLSAALUNO (Bolsas concedidas)
│   │   │   └── SBOLSALAN (Bolsa × Lançamento)
│   │   │
│   │   ├── SOCORRENCIAALUNO (Ocorrências)
│   │   │
│   │   ├── SHISTDISCCONCLUIDAS (Histórico — concluídas)
│   │   ├── SHISTDISCPENDENTES (Histórico — pendentes)
│   │   └── SATIVIDADEALUNO (Atividades complementares)
│   │
│   └── SPROFESSOR (Professor: CODPESSOA → PPESSOA)
│       └── SPROFESSORTURMA (Vínculo prof.↔turma/disc.)
│
├── SSTATUS (Situação de Matrícula — cadastro auxiliar)
├── STIPOMATRICULA (Tipo de Matrícula)
├── STIPOINGRESSO (Tipo de Ingresso)
├── STIPOALUNO (Tipo de Aluno)
├── STITULACAO (Titulação do Professor)
├── SMOTIVOALTSITMAT (Motivo de Alteração)
│
├── SBOLSA (Cadastro de Bolsas)
├── SSERVICO (Serviços educacionais — tipo de cobrança)
│
└── Dicionário de Dados
    ├── GDIC (Metadados: tabelas + campos + descrições)
    ├── GCAMPOS (Versão simplificada de GDIC)
    └── GLINKSREL (Relacionamentos entre tabelas)
```

---

## 3. Tabela de Relacionamentos (Foreign Keys)

### Tabelas de Estrutura Curricular

| Tabela Origem | Campo | → Tabela Destino | Campo |
|--------------|-------|------------------|-------|
| SCURSO | CODCOLIGADA, CODTIPOCURSO | STIPOCURSO | CODCOLIGADA, CODTIPOCURSO |
| SHABILITACAO | CODCOLIGADA, CODCURSO | SCURSO | CODCOLIGADA, CODCURSO |
| SGRADE | CODCOLIGADA, CODCURSO, CODHABILITACAO | SHABILITACAO | CODCOLIGADA, CODCURSO, CODHABILITACAO |
| SPERIODO | PK de SGRADE | SGRADE | PK completa |
| SDISCGRADE | PK de SPERIODO + CODDISC | SPERIODO + SDISCIPLINA | PKs |
| SDISCIPLINA | CODCOLIGADA, CODTIPOCURSO | STIPOCURSO | CODCOLIGADA, CODTIPOCURSO |
| SHABILITACAOFILIAL | CODCURSO, CODHABILITACAO, CODGRADE | SGRADE | Chave composta |
| SHABILITACAOFILIAL | CODFILIAL | GFILIAL | CODFILIAL |

### Tabelas de Período / Turma

| Tabela Origem | Campo | → Tabela Destino | Campo |
|--------------|-------|------------------|-------|
| SPLETIVO | CODCOLIGADA, CODFILIAL | GFILIAL | CODCOLIGADA, CODFILIAL |
| STURMA | CODCOLIGADA, IDPERLET | SPLETIVO | CODCOLIGADA, IDPERLET |
| STURMA | CODCOLIGADA, CODFILIAL | GFILIAL | CODCOLIGADA, CODFILIAL |
| STURMADISC | CODCOLIGADA, CODTURMA, IDPERLET | STURMA | CODCOLIGADA, CODTURMA, IDPERLET |
| STURMADISC | CODCOLIGADA, CODDISC | SDISCIPLINA | CODCOLIGADA, CODDISC |
| STURMADISC | CODCOLIGADA, IDHABILITACAOFILIAL | SHABILITACAOFILIAL | CODCOLIGADA, IDHABILITACAOFILIAL |
| SETAPAS | CODCOLIGADA, IDTURMADISC | STURMADISC | CODCOLIGADA, IDTURMADISC |
| SHORARIOTURMA | CODCOLIGADA, IDTURMADISC | STURMADISC | CODCOLIGADA, IDTURMADISC |

### Tabelas de Aluno / Matrícula

| Tabela Origem | Campo | → Tabela Destino | Campo |
|--------------|-------|------------------|-------|
| SALUNO | CODPESSOA | PPESSOA | CODIGO |
| SALUNO | CODCOLIGADA, CODTIPOALUNO | STIPOALUNO | CODCOLIGADA, CODTIPOALUNO |
| SHABILITACAOALUNO | CODCOLIGADA, RA | SALUNO | CODCOLIGADA, RA |
| SHABILITACAOALUNO | CODCOLIGADA, IDHABILITACAOFILIAL | SHABILITACAOFILIAL | CODCOLIGADA, IDHABILITACAOFILIAL |
| SHABILITACAOALUNO | CODCOLIGADA, CODSTATUS | SSTATUS | CODCOLIGADA, CODSTATUS |
| SHABILITACAOALUNO | CODCOLIGADA, CODTIPOINGRESSO | STIPOINGRESSO | CODCOLIGADA, CODTIPOINGRESSO |
| SMATRICPL | CODCOLIGADA, RA | SALUNO | CODCOLIGADA, RA |
| SMATRICPL | CODCOLIGADA, IDPERLET | SPLETIVO | CODCOLIGADA, IDPERLET |
| SMATRICPL | CODCOLIGADA, IDHABILITACAOFILIAL | SHABILITACAOFILIAL | CODCOLIGADA, IDHABILITACAOFILIAL |
| SMATRICPL | CODCOLIGADA, CODSTATUS | SSTATUS | CODCOLIGADA, CODSTATUS |
| SMATRICPL | CODCOLIGADA, CODSTATUSRES | SSTATUS | CODCOLIGADA, CODSTATUS |
| SMATRICPL | CODCOLIGADA, CODTIPOMAT | STIPOMATRICULA | CODCOLIGADA, CODTIPOMAT |
| SMATRICULA | CODCOLIGADA, IDTURMADISC | STURMADISC | CODCOLIGADA, IDTURMADISC |
| SMATRICULA | CODCOLIGADA, RA | SALUNO | CODCOLIGADA, RA |
| SMATRICULA | CODCOLIGADA, CODSTATUS | SSTATUS | CODCOLIGADA, CODSTATUS |

### Tabelas de Notas / Frequência

| Tabela Origem | Campo | → Tabela Destino | Campo |
|--------------|-------|------------------|-------|
| SNOTAETAPA | CODCOLIGADA, RA | SALUNO | CODCOLIGADA, RA |
| SNOTAETAPA | CODCOLIGADA, IDTURMADISC, CODETAPA, TIPOETAPA | SETAPAS | PK |
| FrequenciaDiaria | CODCOLIGADA, IDTURMADISC | STURMADISC | CODCOLIGADA, IDTURMADISC |
| FrequenciaDiaria | CODCOLIGADA, RA | SALUNO | CODCOLIGADA, RA |
| FrequenciaDiaria | CODCOLIGADA, IDHORARIOTURMA | SHORARIOTURMA | PK |

### Tabelas de Professor

| Tabela Origem | Campo | → Tabela Destino | Campo |
|--------------|-------|------------------|-------|
| SPROFESSOR | CODPESSOA | PPESSOA | CODIGO |
| SPROFESSOR | CODCOLIGADA, CODTITULACAO | STITULACAO | CODCOLIGADA, CODTITULACAO |
| SPROFESSORTURMA | CODCOLIGADA, CODPROF | SPROFESSOR | CODCOLIGADA, CODPROF |
| SPROFESSORTURMA | CODCOLIGADA, IDTURMADISC | STURMADISC | CODCOLIGADA, IDTURMADISC |

### Tabelas Financeiras

| Tabela Origem | Campo | → Tabela Destino | Campo |
|--------------|-------|------------------|-------|
| SCONTRATO | CODCOLIGADA, RA | SALUNO | CODCOLIGADA, RA |
| SCONTRATO | CODCOLIGADA, IDPERLET | SPLETIVO | CODCOLIGADA, IDPERLET |
| SPARCELA | CODCOLIGADA, RA | SALUNO | CODCOLIGADA, RA |
| SPARCELA | CODCOLIGADA, CODCONTRATO | SCONTRATO | CODCOLIGADA, CODCONTRATO |
| SPARCELA | CODCOLIGADA, CODSERVICO | SSERVICO | CODCOLIGADA, CODSERVICO |
| SLAN | CODCOLIGADA, IDLAN | FLAN | CODCOLIGADA, IDLAN |
| SLAN | CODCOLIGADA, IDPARCELA | SPARCELA | CODCOLIGADA, IDPARCELA |
| SBOLSAALUNO | CODCOLIGADA, RA | SALUNO | CODCOLIGADA, RA |
| SBOLSAALUNO | CODCOLIGADA, CODBOLSA | SBOLSA | CODCOLIGADA, CODBOLSA |
| SBOLSALAN | CODCOLIGADA, IDLAN | FLAN | CODCOLIGADA, IDLAN |

---

## 4. Dicionário de Dados — Queries de Introspecção

O TOTVS RM armazena metadados em GDIC, GCAMPOS e GLINKSREL. Útil para descobrir campos não documentados.

```sql
-- Listar TODAS as tabelas educacionais
SELECT DISTINCT TABELA
FROM GCAMPOS
WHERE TABELA LIKE 'S%'
ORDER BY TABELA;

-- Campos de uma tabela específica
SELECT TABELA, COLUNA, DESCRICAO
FROM GDIC
WHERE TABELA = 'SHABILITACAOALUNO'
ORDER BY COLUNA;

-- Buscar campo por descrição
SELECT TABELA, COLUNA, DESCRICAO
FROM GDIC
WHERE DESCRICAO LIKE '%matrícula%'
ORDER BY TABELA, COLUNA;

-- Buscar campo por nome
SELECT TABELA, COLUNA, DESCRICAO
FROM GDIC
WHERE COLUNA LIKE '%STATUS%'
ORDER BY TABELA;

-- Descobrir relacionamentos de uma tabela
SELECT MASTERTABLE, MASTERFIELD, CHILDTABLE, CHILDFIELD
FROM GLINKSREL
WHERE MASTERTABLE = 'SALUNO' OR CHILDTABLE = 'SALUNO'
ORDER BY MASTERTABLE;

-- Descobrir TODOS os relacionamentos educacionais
SELECT * FROM GLINKSREL
WHERE MASTERTABLE LIKE 'S%' OR CHILDTABLE LIKE 'S%'
ORDER BY MASTERTABLE, CHILDTABLE;

-- Módulos que usam uma tabela (código do sistema)
SELECT TABELA, APLICACOES
FROM GDIC
WHERE TABELA = 'SMATRICPL' AND COLUNA = '#';
-- Decodificar APLICACOES via GSISTEMA
```

### Tabela GSISTEMA — Códigos de Módulo

```sql
SELECT CODSISTEMA, NOME FROM GSISTEMA;
-- S = Educacional (Classis)
-- F = Financeiro (Fluxus)
-- P = Folha/RH (Labore)
-- G = Global (Framework)
```

---

## 5. Catálogo Completo de Tabelas Educacionais

### Tabelas Principais (uso diário)

| Tabela | PK | Descrição | Volume |
|--------|-----|-----------|--------|
| SALUNO | CODCOLIGADA, RA | Cadastro de alunos | Alto |
| SHABILITACAOALUNO | CODCOLIGADA, IDHABILITACAOFILIAL, RA | Aluno × Curso | Alto |
| SMATRICPL | CODCOLIGADA, IDPERLET, IDHABILITACAOFILIAL, RA | Matrícula no período | Alto |
| SMATRICULA | CODCOLIGADA, IDTURMADISC, RA | Matrícula na disciplina | Alto |
| SNOTAETAPA | CODCOLIGADA, RA, IDTURMADISC, CODETAPA, TIPOETAPA | Notas/Faltas | Alto |
| STURMADISC | CODCOLIGADA, IDTURMADISC | Turma-Disciplina | Alto |
| STURMA | CODCOLIGADA, CODFILIAL, IDPERLET, CODTURMA | Turmas | Médio |
| SPLETIVO | CODCOLIGADA, IDPERLET | Períodos letivos | Baixo |
| SPROFESSORTURMA | CODCOLIGADA, IDPROFESSORTURMA | Professor na turma | Médio |

### Tabelas de Estrutura (configuração)

| Tabela | PK | Descrição |
|--------|-----|-----------|
| SCURSO | CODCOLIGADA, CODCURSO | Cursos |
| SHABILITACAO | CODCOLIGADA, CODCURSO, CODHABILITACAO | Habilitações |
| SGRADE | CODCOLIGADA, CODCURSO, CODHABILITACAO, CODGRADE | Grades curriculares |
| SPERIODO | PK de SGRADE + CODPERIODO | Períodos da grade |
| SDISCGRADE | PK de SPERIODO + CODDISC | Disciplinas na grade |
| SDISCIPLINA | CODCOLIGADA, CODDISC | Disciplinas |
| SHABILITACAOFILIAL | CODCOLIGADA, IDHABILITACAOFILIAL | Matriz aplicada |
| SETAPAS | CODCOLIGADA, IDTURMADISC, CODETAPA, TIPOETAPA | Etapas de avaliação |

### Tabelas Auxiliares (cadastro)

| Tabela | PK | Descrição |
|--------|-----|-----------|
| SSTATUS | CODCOLIGADA, CODSTATUS | Situação de matrícula (ver DOC-12) |
| STIPOMATRICULA | CODCOLIGADA, CODTIPOMAT | Tipo de matrícula |
| STIPOINGRESSO | CODCOLIGADA, CODTIPOINGRESSO | Tipo de ingresso |
| STIPOALUNO | CODCOLIGADA, CODTIPOALUNO | Tipo de aluno |
| STIPOCURSO | CODCOLIGADA, CODTIPOCURSO | Nível de ensino |
| STITULACAO | CODCOLIGADA, CODTITULACAO | Titulação professor |
| SMOTIVOALTSITMAT | — | Motivo alteração matrícula |

### Tabelas Financeiras Educacionais

| Tabela | PK | Descrição |
|--------|-----|-----------|
| SCONTRATO | CODCOLIGADA, CODCONTRATO | Contrato educacional |
| SPARCELA | CODCOLIGADA, IDPARCELA | Parcelas/mensalidades |
| SSERVICO | CODCOLIGADA, CODSERVICO | Serviços (tipo cobrança) |
| SBOLSA | CODCOLIGADA, CODBOLSA | Cadastro de bolsas |
| SBOLSAALUNO | — | Bolsas concedidas ao aluno |
| SBOLSALAN | — | Bolsa × lançamento financeiro |
| SLAN | — | Lançamento educacional → FLAN |
| FLAN | CODCOLIGADA, IDLAN | Lançamento financeiro (módulo F) |
| FLANBAIXA | — | Baixas/pagamentos |

### Tabelas de Histórico / Complemento

| Tabela | Descrição |
|--------|-----------|
| SHISTDISCCONCLUIDAS | Disciplinas concluídas pelo aluno |
| SHISTDISCPENDENTES | Disciplinas pendentes |
| SHISTDISCOPTELETIVAS | Optativas/eletivas cursadas |
| SHISTDISCEQUIVCONCLUIDAS | Equivalências concluídas |
| SATIVIDADEALUNO | Atividades complementares |
| SOCORRENCIAALUNO | Ocorrências disciplinares |
| SALUNOCOMPL | Complemento do aluno |
| STURMADISCCOMPL | Complemento turma-disciplina |
| SMATRICPLCOMPL | Complemento matrícula PL |
| SCURSOCOMPL | Complemento do curso |

### Tabelas Globais Usadas pelo Educacional

| Tabela | PK | Descrição |
|--------|-----|-----------|
| GCOLIGADA | CODCOLIGADA | Empresas/instituições |
| GFILIAL | CODCOLIGADA, CODFILIAL | Filiais/campi |
| PPESSOA | CODIGO | Cadastro de pessoas (master) |
| GDIC | TABELA, COLUNA | Dicionário de dados |
| GCAMPOS | TABELA, CAMPO | Dicionário simplificado |
| GLINKSREL | MASTERTABLE, CHILDTABLE | Relacionamentos |
| GSISTEMA | CODSISTEMA | Códigos de módulo |

---

## 6. Fontes

- [WSA - Principais tabelas do TOTVS RM](https://www.wsa.com.br/principais-tabelas-do-totvs-rm/)
- [Estagiário do RM - GDIC e GCAMPOS](https://estagiariodorm.wordpress.com/2020/04/06/a-tabela-gdic/)
- [Estagiário do RM - GLINKSREL](https://estagiariodorm.wordpress.com/2020/04/14/a-tabela-glinksrel/)
- [Estagiário do RM - Códigos dos Sistemas](https://estagiariodorm.wordpress.com/2020/07/19/codigo-dos-sistemas/)
- [TDN - Provedor de Dados Educacional](https://tdn.totvs.com/display/public/LRM/Provedor+de+Dados+-+Educacional)
- [TDN - Turma Disciplina](https://tdn.totvs.com/display/public/LRM/Turma+Disciplina)
- [Central TOTVS - Notas de Etapa](https://centraldeatendimento.totvs.com/hc/pt-br/articles/360028825871)
- [Fórum RM - SQL Alunos por Disciplinas](https://www.forumrm.com.br/topic/12424)
- [GitHub - bitts/Consultas-SQL](https://github.com/bitts/Consultas-SQL) (38 queries)
- [GitHub - marcelovmb/SQL_TOTVS_RM](https://github.com/marcelovmb/SQL_TOTVS_RM)
- [GitHub - MaikRodriguess/Codigos-SQL-TOTVS](https://github.com/MaikRodriguess/Codigos-SQL-TOTVS)
- [UNIFAGOC - Cadastros Auxiliares](https://comvoce.unifagoc.edu.br/?p=3464)
- [UNIFAGOC - Estrutura Curricular](https://comvoce.unifagoc.edu.br/?p=5653)
- [API Legada TOTVS](https://apitotvslegado.z15.web.core.windows.net/)

---

*Documento gerado em 2026-03-22.*
