# Educacional — Estrutura Curricular

> Define a oferta acadêmica: cursos, habilitações, grades curriculares e disciplinas. São tabelas de configuração, alteradas raramente (quando a escola reformula currículo).

---

## Hierarquia

```
STIPOCURSO (Nível: Superior, Básico, Técnico)
└── SCurso (Curso: Eng. Civil, Pedagogia)
    └── SHabilitacao (Habilitação: Bacharelado, Licenciatura)
        └── SGrade (Matriz Curricular: 2024.1, 2025.1)
            └── SDiscGrade / SDISCGRADE (Disciplinas na Grade)
                └── SDISCIPLINA (Disciplina: Cálculo I, Português)
```
SHABILITACAOFILIAL = Curso × Habilitação × Grade × Filial (a "matriz aplicada").

---

## Tabelas (11)

| Tabela | Nome de Negócio | DataServer | Campos | PII |
|--------|----------------|------------|--------|-----|
| SCURSOCOMPL | SCURSOCOMPL | EduCursoData | 3 |  |
| SCurso | Curso | EduCursoData | 21 | Sim |
| SDISCGRADE | Disciplina na Grade | EduDiscGradeData | 49 | Sim |
| SDISCGRADECOMPL | SDISCGRADECOMPL | EduDiscGradeData | 8 |  |
| SDISCIPLINA | Disciplina | EduDisciplinaData | 36 | Sim |
| SDiscGrade | Disciplina na Grade | EduGradeData | 33 | Sim |
| SGRADECOMPL | SGRADECOMPL | EduGradeData | 6 |  |
| SGrade | Matriz Curricular | EduGradeData | 50 |  |
| SHABILITACAOCOMPL | SHABILITACAOCOMPL | EduHabilitacaoData | 7 |  |
| SHabilitacao | Habilitação | EduHabilitacaoData | 21 | Sim |
| SOptativas | SOptativas | EduGradeData | 13 | Sim |

---

## Campos por Tabela

### SCURSOCOMPL — SCURSOCOMPL (3 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCURSO | CODCURSO | xs:string | Sim |  |  |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| NOTAAPP | NOTAAPP | xs:string |  |  |  |

### SCurso — Curso (21 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCURSO | Código | xs:string | Sim |  |  |
| NOME | Nome | xs:string | Sim |  | PII |
| COMPLEMENTO | Segundo Nome | xs:string |  |  | PII |
| CODCURINEP | Código INEP | xs:string |  |  |  |
| REGCONTRATO | Número do contrato em cartório | xs:string |  |  |  |
| CFGMATRICULA | Configuração do RA | xs:string |  |  |  |
| HABILITACAO | Habilitação | xs:string |  |  |  |
| CAPES | Código Capes | xs:string |  |  |  |
| CURPRESDIST | Presencial/Distância | xs:string |  |  |  |
| CODMODALIDADECURSO | Modalidade | xs:string |  |  |  |
| MASCARATURMA | Máscara da turma | xs:string |  |  |  |
| REGRAEMISSAONFE | Regra de emissão da NF-e | xs:string |  |  |  |
| CODCOLIGADA | Código da Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODESCOLA | Escola | xs:short |  |  |  |
| CODAREA | Área | xs:short |  |  |  |
| DECRETO | Decreto | xs:string |  |  |  |
| DESCRICAO | Descrição | xs:string |  |  |  |
| CODTIPOCURSO | Nível de ensino | xs:short | Sim | → STIPOCURSO |  |
| IDEIXOTECNOLOGICO | Eixo Tecnológico | xs:int |  |  |  |
| TIPOOFERTA | Integrada | xs:short |  |  |  |
| ENVIARCENSO | Enviar ao Censo | xs:short |  |  |  |

### SDISCGRADE — Disciplina na Grade (49 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCURSO | Cód. Curso | xs:string | Sim |  |  |
| CODHABILITACAO | Cód. Habilitação | xs:string | Sim |  |  |
| CODGRADE | Cód. Matriz | xs:string | Sim |  |  |
| CODDISC | Disciplina | xs:string | Sim |  |  |
| CODGRPDISC | Grupo de disciplinas | xs:string |  |  |  |
| DESCRICAO | Descrição | xs:string |  |  |  |
| TIPODISC | Tipo de Disciplina | xs:string | Sim |  |  |
| OBJETIVO | Objetivo | xs:string |  |  |  |
| ATIVIDADE | Atividade | xs:string |  |  |  |
| CALCMEDIAGLOBAL | Indica se entra no cálc. da média global | xs:string |  |  |  |
| DESEMPENHOALUNO | Indica se mostra no gráf. de desempenho | xs:string |  |  |  |
| IMPBOLETIM | Indica se imprime no boletim e exibe no portal do aluno | xs:string |  |  |  |
| TIPONOTA | Tipo de Nota | xs:string |  |  |  |
| APLICACAO | Código do Sistema | xs:string |  |  |  |
| CODFORMULAPRE | Fórmula de pré-requisito | xs:string |  |  |  |
| CODFORMULACO | Fórmula de correquisito | xs:string |  |  |  |
| CODGRUPOCOMPLEMENTO | Cód. grupo de complemento | xs:string |  |  |  |
| DISCIPLINATCC | Indica se a disciplina é de TCC | xs:string |  |  |  |
| TCCEMGRUPO | Indica se o TCC pode ser em grupo | xs:string |  |  |  |
| CODCOLIGADA | Código da Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODPERIODO | Período | xs:short | Sim |  |  |
| PREREQCRED | Nº mínimo de créditos acadêmico | xs:decimal |  |  |  |
| POSHIST | Ordem no histórico | xs:int |  |  |  |
| NUMCREDITOSCOB | Nº de créditos para cobrança | xs:decimal |  |  |  |
| VALORCREDITO | Valor do crédito para cobrança | xs:decimal |  |  |  |
| CH | Carga Horária | xs:decimal |  |  |  |
| DECIMAIS | Nº casas decimais | xs:int |  |  |  |
| PERCAULASNAOPRES | Percentual de aulas não presenciais | xs:decimal |  |  |  |
| PRIORIDADEMATRICULA | Prioridade na matrícula | xs:int |  |  |  |
| NUMMINDISC | Número mínimo de disciplinas | xs:int |  |  |  |

*... e mais 19 campos. Ver schema.json para lista completa.*

### SDISCGRADECOMPL — SDISCGRADECOMPL (8 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODCURSO | CODCURSO | xs:string | Sim |  |  |
| CODHABILITACAO | CODHABILITACAO | xs:string | Sim |  |  |
| CODGRADE | CODGRADE | xs:string | Sim |  |  |
| CODPERIODO | CODPERIODO | xs:short | Sim |  |  |
| CODDISC | CODDISC | xs:string | Sim |  |  |
| IDTURMADISC_SE | IDTURMADISC_SE | xs:int |  |  |  |
| IDTURMADISC_SE_2 | IDTURMADISC_SE_2 | xs:int |  |  |  |

### SDISCIPLINA — Disciplina (36 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODDISC | Disciplina | xs:string | Sim |  |  |
| CODDISCHIST | Disciplina do histórico | xs:string |  |  |  |
| NOME | Nome | xs:string | Sim |  | PII |
| NOMEREDUZIDO | Nome reduzido | xs:string |  |  |  |
| COMPLEMENTO | Segundo Nome | xs:string |  |  | PII |
| OBJETIVO | Objetivo | xs:string |  |  |  |
| CURSOLIVRE | Curso Livre | xs:string |  |  |  |
| TIPOAULA | Aula | xs:string |  |  |  |
| TIPODISCPROVAO | Disciplina no Provão | xs:string |  |  |  |
| TIPONOTA | Nota | xs:string | Sim |  |  |
| CODEVENTO | CODEVENTO | xs:string |  |  |  |
| RECCREATEDBY | RECCREATEDBY | xs:string |  |  |  |
| RECMODIFIEDBY | RECMODIFIEDBY | xs:string |  |  |  |
| ESTAGIO | Estágio | xs:string |  |  |  |
| CODGRUPOCOMPLEMENTO | Cód. grupo de complemento | xs:string |  |  |  |
| ITINERARIOFORMATIVO | Itinerário Formativo | xs:string |  |  |  |
| CODCOLIGADA | Código da Coligada | xs:short | Sim | → GCOLIGADA |  |
| CH | Total | xs:decimal |  |  |  |
| NUMCREDITOS | Nº Créditos | xs:decimal |  |  |  |
| DECIMAIS | Nº Casas Decimais | xs:int |  |  |  |
| CODTIPOCURSO | Nível de ensino | xs:short | Sim | → STIPOCURSO |  |
| CHESTAGIO | Estágio | xs:decimal |  |  |  |
| CHTEORICA | Teórica | xs:decimal |  |  |  |
| CHPRATICA | Prática | xs:decimal |  |  |  |
| CHLABORATORIAL | Laboratório | xs:decimal |  |  |  |
| RECCREATEDON | RECCREATEDON | xs:dateTime |  |  |  |
| RECMODIFIEDON | RECMODIFIEDON | xs:dateTime |  |  |  |
| IDGRUPOCOMPLEMENTO | Id. grupo de complemento | xs:int |  |  |  |
| CODDISCCENSO | Disciplina no Censo | xs:int |  |  |  |
| CHEXTENSAO | Extensão | xs:decimal |  |  |  |

*... e mais 6 campos. Ver schema.json para lista completa.*

### SDiscGrade — Disciplina na Grade (33 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODCURSO | CODCURSO | xs:string | Sim |  |  |
| CODHABILITACAO | CODHABILITACAO | xs:string | Sim |  |  |
| CODGRADE | CODGRADE | xs:string | Sim |  |  |
| CODPERIODO | CODPERIODO | xs:short | Sim |  |  |
| CODDISC | CODDISC | xs:string | Sim |  |  |
| CODGRPDISC | CODGRPDISC | xs:string |  |  |  |
| PREREQCRED | PREREQCRED | xs:decimal |  |  |  |
| POSHIST | POSHIST | xs:int |  |  |  |
| NUMCREDITOSCOB | NUMCREDITOSCOB | xs:decimal |  |  |  |
| DESCRICAO | DESCRICAO | xs:string |  |  |  |
| VALORCREDITO | VALORCREDITO | xs:decimal |  |  |  |
| TIPODISC | TIPODISC | xs:string |  |  |  |
| CH | CH | xs:decimal |  |  |  |
| OBJETIVO | OBJETIVO | xs:string |  |  |  |
| DECIMAIS | DECIMAIS | xs:int |  |  |  |
| PERCAULASNAOPRES | PERCAULASNAOPRES | xs:decimal |  |  |  |
| PRIORIDADEMATRICULA | PRIORIDADEMATRICULA | xs:int |  |  |  |
| ATIVIDADE | ATIVIDADE | xs:string |  |  |  |
| CALCMEDIAGLOBAL | CALCMEDIAGLOBAL | xs:string |  |  |  |
| DESEMPENHOALUNO | DESEMPENHOALUNO | xs:string |  |  |  |
| IMPBOLETIM | IMPBOLETIM | xs:string |  |  |  |
| TIPONOTA | TIPONOTA | xs:string |  |  |  |
| NUMMINDISC | NUMMINDISC | xs:int |  |  |  |
| CRDISC | CRDISC | xs:int |  |  |  |
| CHDISC | CHDISC | xs:decimal |  |  |  |
| NOME | NOME | xs:string |  |  | PII |
| NOMEREDUZIDO | NOMEREDUZIDO | xs:string |  |  |  |
| COMPLEMENTO | COMPLEMENTO | xs:string |  |  | PII |
| CHDISCIPLINA | CHDISCIPLINA | xs:string |  |  |  |

*... e mais 3 campos. Ver schema.json para lista completa.*

### SGRADECOMPL — SGRADECOMPL (6 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODCURSO | CODCURSO | xs:string | Sim |  |  |
| CODHABILITACAO | CODHABILITACAO | xs:string | Sim |  |  |
| CODGRADE | CODGRADE | xs:string | Sim |  |  |
| IDTURMADISCSE | IDTURMADISCSE | xs:int |  |  |  |
| IDTURMADISCSE2 | IDTURMADISCSE2 | xs:int |  |  |  |

### SGrade — Matriz Curricular (50 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCURSO | Cód. Curso | xs:string | Sim |  |  |
| CODHABILITACAO | Cód. Habilitação | xs:string | Sim |  |  |
| CODGRADE | Código | xs:string | Sim |  |  |
| APLICACAO | Código do Sistema | xs:string |  |  |  |
| CODFORMULA | Fórmula para cálculo da média global | xs:string |  |  |  |
| CODFORMULACR | Fórmula do coeficiente de rendimento | xs:string |  |  |  |
| DESCRICAO | Matriz curricular | xs:string |  |  |  |
| CONTROLEVAGAS | Controle de vagas | xs:string | Sim |  |  |
| REGIME | Regime | xs:string |  |  |  |
| STATUS | Status | xs:string |  |  |  |
| TIPOATIVIDADECURRICULAR | Tipo de avaliação das atividades curriculares | xs:string |  |  |  |
| TIPOELETIVA | Tipo de avaliação das disciplinas eletivas | xs:string |  |  |  |
| TIPOOPTATIVA | Tipo de avaliação das disciplinas optativas | xs:string |  |  |  |
| CODCURSOPROX | Próximo curso | xs:string |  |  |  |
| CODGRADEPROX | Próxima matriz curricular | xs:string |  |  |  |
| CODHABILITACAOPROX | Próxima série | xs:string |  |  |  |
| CODCOLIGADA | Código da Coligada | xs:short | Sim | → GCOLIGADA |  |
| DTINICIO | Data de início | xs:dateTime |  |  |  |
| DTFIM | Data de término | xs:dateTime |  |  |  |
| MAXCREDPERIODO | Max. créditos | xs:decimal |  |  |  |
| MINCREDPERIODO | Min. créditos | xs:decimal |  |  |  |
| CARGAHORARIA | Carga Horária | xs:decimal |  |  |  |
| HABILITACAO | Habilitação | xs:string |  |  |  |
| CURSO | Curso | xs:string |  |  |  |
| DTDOU | Dt. D.O.U. | xs:dateTime |  |  |  |
| DECRETOCURSO | Decreto do curso | xs:string |  |  |  |
| DESCRICAOCURSO | Descrição do curso | xs:string |  |  |  |
| DESCRICAOHABILITACAO | Descrição da habilitação | xs:string |  |  |  |
| DECRETOHABILITACAO | Decreto da habilitação | xs:string |  |  |  |
| CODPERIODO | CODPERIODO | xs:string |  |  |  |

*... e mais 20 campos. Ver schema.json para lista completa.*

### SHABILITACAOCOMPL — SHABILITACAOCOMPL (7 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCURSO | CODCURSO | xs:string | Sim |  |  |
| CODHABILITACAO | CODHABILITACAO | xs:string | Sim |  |  |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODCOLIGADAMD | CODCOLIGADAMD | xs:int |  |  |  |
| CODFILIALMD | CODFILIALMD | xs:int |  |  |  |
| IDPRD | IDPRD | xs:int |  |  |  |
| SERIEMD | SERIEMD | xs:string |  |  |  |

### SHabilitacao — Habilitação (21 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCURSO | Cód. Curso | xs:string | Sim |  |  |
| CODHABILITACAO | Código | xs:string | Sim |  |  |
| CODCURSOHIST | Curso no Histórico | xs:string |  |  |  |
| NOME | Habilitação | xs:string | Sim |  | PII |
| COMPLEMENTO | Complemento | xs:string |  |  | PII |
| TEXTOCONCLUSAO | Texto de conclusão | xs:string |  |  |  |
| DECRETO | Decreto | xs:string |  |  |  |
| DESCRICAO | Descrição | xs:string |  |  |  |
| CODHABINEP | Código INEP | xs:string |  |  |  |
| COMPLEMENTO2 | Segundo Complemento | xs:string |  |  |  |
| JURAMENTO | Juramento | xs:string |  |  |  |
| CODTIPOHABILITACAO | Tipo | xs:string |  |  |  |
| NOMECURSO | Nome | xs:string |  |  |  |
| TITULACAOMASCULINA | Titulação Masculina | xs:string |  |  |  |
| TITULACAOFEMININA | Titulação Feminina | xs:string |  |  |  |
| CURRICULODIGITAL | Habilitação para o currículo digital | xs:string |  |  |  |
| CODCOLIGADA | Código da Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODSERIEHIST | Série no Histórico | xs:int |  |  |  |
| INTEGRALIZACAO | Integralização | xs:decimal |  |  |  |
| DTPROVAO | Data do provão | xs:dateTime |  |  |  |
| NRHABILITACOESVINCULADAS | NRHABILITACOESVINCULADAS | xs:int |  |  |  |

### SOptativas — SOptativas (13 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODDISC | CODDISC | xs:string | Sim |  |  |
| CODCURSO | CODCURSO | xs:string | Sim |  |  |
| CODHABILITACAO | CODHABILITACAO | xs:string | Sim |  |  |
| CODGRADE | CODGRADE | xs:string | Sim |  |  |
| TIPO | TIPO | xs:string |  |  |  |
| NOMEDISCIPLINA | NOMEDISCIPLINA | xs:string |  |  |  |
| NOMEREDUZIDO | NOMEREDUZIDO | xs:string |  |  |  |
| COMPLEMENTO | COMPLEMENTO | xs:string |  |  | PII |
| CHDISCIPLINA | CHDISCIPLINA | xs:string |  |  |  |
| CHESTAGIO | CHESTAGIO | xs:string |  |  |  |
| NUMCREDITOS | NUMCREDITOS | xs:string |  |  |  |
| OBJETIVODISCIPLINA | OBJETIVODISCIPLINA | xs:string |  |  |  |

---

## Regras de Negócio

- Hierarquia: TipoCurso → Curso → Habilitação → Grade → Disciplinas
- Uma disciplina pode aparecer em múltiplas grades
- SHABILITACAOFILIAL é o ponto de amarração para matrículas

---

## APIs

### SOAP DataServers neste domínio
- `EduCursoData`
- `EduDiscGradeData`
- `EduDisciplinaData`
- `EduGradeData`
- `EduHabilitacaoData`

*Ver apis.json para endpoints REST e status detalhado.*
