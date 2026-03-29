# Educacional — Operação

> Operação do dia-a-dia: turmas, horários, notas, etapas de avaliação, planos de aula e infraestrutura física. Tabelas de volume alto, atualizadas frequentemente.

---

## Hierarquia

```
SPLETIVO (Período Letivo: 2026.1)
└── STurma (Turma: ENG-A, PED-B)
    └── STurmaDisc (Turma-Disciplina ofertada)
        ├── SETAPAS (Etapas: 1ºBim, 2ºBim, Exame)
        │   └── SNotaEtapa (Notas/Faltas por aluno × etapa)
        ├── SHorarioTurma (Horários dia/hora/sala)
        ├── SPlanoAula (Plano de aula por data)
        └── SPROFESSORTURMA → (ver domínio Pessoas)

Infraestrutura:
SPredio → SBLOCO → SSala
```

---

## Tabelas (19)

| Tabela | Nome de Negócio | DataServer | Campos | PII |
|--------|----------------|------------|--------|-----|
| ILocal | ILocal | EduSalaData | 3 | Sim |
| NOTASVIEW | View de Notas | EduNotasData | 24 | Sim |
| SBLOCO | Bloco | EduBlocoData | 6 |  |
| SBLOCOCOMPL | SBLOCOCOMPL | EduBlocoData | 4 |  |
| SHorarioTurma | Horário da Turma | EduHorarioTurmaData | 40 |  |
| SNotaEtapa | Nota por Etapa | EduNotaEtapaData | 10 |  |
| SNotaEtapaComentario | SNotaEtapaComentario | EduNotaEtapaData | 7 |  |
| SNotas | Notas Consolidadas | EduNotasData | 48 | Sim |
| SNotasComentario | SNotasComentario | EduNotasData | 7 |  |
| SPREDIOCOMPL | SPREDIOCOMPL | EduPredioData | 3 |  |
| SPlanoAula | Plano de Aula | EduPlanoAulaData | 39 |  |
| SPlanoAulaArquivo | SPlanoAulaArquivo | EduPlanoAulaData | 7 |  |
| SPredio | Prédio | EduPredioData | 25 | Sim |
| SSALACOMPL | SSALACOMPL | EduSalaData | 5 |  |
| SSala | Sala de Aula | EduSalaData | 20 |  |
| STURMACOMPL | STURMACOMPL | EduTurmaData | 7 |  |
| STURMADISCCOMPL | STURMADISCCOMPL | EduTurmaDiscData | 2 |  |
| STurma | Turma | EduTurmaData | 54 | Sim |
| STurmaDisc | Turma-Disciplina (Oferta) | EduMatriculaData | 92 | Sim |

---

## Campos por Tabela

### ILocal — ILocal (3 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODLOCAL | CODLOCAL | xs:string | Sim |  |  |
| NOME | NOME | xs:string |  |  | PII |

### NOTASVIEW — View de Notas (24 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| IDTURMADISC | IDTURMADISC | xs:int | Sim | → STURMADISC |  |
| NUMDIARIO | Nº | xs:int |  |  |  |
| RA | R.A. | xs:string | Sim |  |  |
| NOME | Aluno | xs:string |  |  | PII |
| DESCRICAO | Status | xs:string |  |  |  |
| NOTASFALTASWEB | NOTASFALTASWEB | xs:string |  |  |  |
| DIBLOQNOTAFALTA | DIBLOQNOTAFALTA | xs:string |  |  |  |
| MEDIAETAPA | MEDIAETAPA | xs:decimal |  |  |  |
| DTINICIODIGITACAO | DTINICIODIGITACAO | xs:dateTime |  |  |  |
| DTLIMITEDIGITACAO | DTLIMITEDIGITACAO | xs:dateTime |  |  |  |
| DTINICIALDIGITACAOTURMADISC | DTINICIALDIGITACAOTURMADISC | xs:dateTime |  |  |  |
| DTFINALDIGITACAOTURMADISC | DTFINALDIGITACAOTURMADISC | xs:dateTime |  |  |  |
| CODETAPA | CODETAPA | xs:int |  |  |  |
| TIPOETAPA | TIPOETAPA | xs:string |  |  |  |
| NOTAETAPA | Nota na etapa | xs:decimal |  |  |  |
| CODCONCEITOETAPA | Nota na etapa | xs:string |  |  |  |
| CODPROVATESTIS | Cod. Prova do TOTVS Educacional Avaliação e Pesquisa | xs:string |  |  |  |
| CODPESSOA | Cod. Pessoa | xs:string |  | → PPESSOA |  |
| IDTURMADISCORIGEM | Turma disciplina original | xs:int |  |  |  |
| DISPONIVELALUNOS | Disponível alunos | xs:string |  |  |  |
| IDHABILITACAOFILIAL | Habilitação Filial | xs:int |  | → SHABILITACAOFILIAL |  |
| NOMESOCIAL | Nome Social | xs:string |  |  | PII |
| NOMECIVIL | Aluno | xs:string |  |  |  |

### SBLOCO — Bloco (6 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODPREDIO | Prédio | xs:string | Sim |  |  |
| CODBLOCO | Bloco | xs:string | Sim |  |  |
| DESCRICAO | Descrição | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODFILIAL | Cód. Filial | xs:short | Sim | → GFILIAL |  |
| OBSERVACAO | OBSERVACAO | xs:string |  |  |  |

### SBLOCOCOMPL — SBLOCOCOMPL (4 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODPREDIO | CODPREDIO | xs:string | Sim |  |  |
| CODBLOCO | CODBLOCO | xs:string | Sim |  |  |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODFILIAL | CODFILIAL | xs:short | Sim | → GFILIAL |  |

### SHorarioTurma — Horário da Turma (40 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| NOMETURNO | Turno | xs:string |  |  |  |
| HORAINICIAL | Hora inicial | xs:string |  |  |  |
| HORAFINAL | Hora final | xs:string |  |  |  |
| CODSUBTURMA | Subturma | xs:string |  |  |  |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| IDHORARIOTURMA | IDHORARIOTURMA | xs:int | Sim |  |  |
| CODHOR | CODHOR | xs:int |  |  |  |
| IDTURMADISC | IDTURMADISC | xs:int |  | → STURMADISC |  |
| DIASEMANA | Dia | xs:short |  |  |  |
| DATAINICIAL | DATAINICIAL | xs:dateTime |  |  |  |
| DATAFINAL | DATAFINAL | xs:dateTime |  |  |  |
| CODPREDIO | Cód. Prédio | xs:string |  |  |  |
| CODSALA | Sala | xs:string |  |  |  |
| LOCACAO | Locação | xs:string |  |  |  |
| TIPOAULA | Tipo aula | xs:string |  |  |  |
| NOMETURNO | Turno | xs:string |  |  |  |
| HORAINICIAL | Início | xs:string |  |  |  |
| HORAFINAL | Término | xs:string |  |  |  |
| CODBLOCO | Cód. Bloco | xs:string |  |  |  |
| CODSUBTURMA | Subturma | xs:string |  |  |  |
| SCIENTIAACTIVITYHOSTKEY | SCIENTIAACTIVITYHOSTKEY | xs:string |  |  |  |
| CODHORARIOTURMA | CODHORARIOTURMA | xs:string |  |  |  |
| URLAULAONLINE | Aula Online | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDHORARIOTURMA | Id. do Horário | xs:int | Sim |  |  |
| CODHOR | Código horário | xs:int | Sim |  |  |
| IDTURMADISC | IDTURMADISC | xs:int | Sim | → STURMADISC |  |
| CODFILIAL | Filial | xs:short |  | → GFILIAL |  |
| DATAINICIAL | Data inicial | xs:dateTime |  |  |  |
| DATAFINAL | Data final | xs:dateTime |  |  |  |

*... e mais 10 campos. Ver schema.json para lista completa.*

### SNotaEtapa — Nota por Etapa (10 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| TIPOETAPA | Tipo da etapa | xs:string | Sim |  |  |
| RA | R.A. | xs:string | Sim |  |  |
| CODCONCEITO | Conceito | xs:string |  |  |  |
| CONCEITOECTS | Classif. ECTS | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODETAPA | Etapa | xs:short | Sim |  |  |
| IDTURMADISC | Turma disciplina | xs:int | Sim | → STURMADISC |  |
| IDGRUPO | Grupo de conceitos | xs:short |  |  |  |
| NOTAFALTA | Nota/Falta | xs:decimal |  |  |  |
| AULASDADAS | Número de aulas dadas | xs:short |  |  |  |

### SNotaEtapaComentario — SNotaEtapaComentario (7 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODPROVA | CODPROVA | xs:short | Sim |  |  |
| CODETAPA | CODETAPA | xs:short | Sim |  |  |
| TIPOETAPA | TIPOETAPA | xs:string | Sim |  |  |
| IDTURMADISC | IDTURMADISC | xs:int | Sim | → STURMADISC |  |
| RA | RA | xs:string | Sim |  |  |
| COMENTARIO | COMENTARIO | xs:string |  |  |  |

### SNotas — Notas Consolidadas (48 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| TIPOETAPA | Tipo da etapa | xs:string | Sim |  |  |
| RA | R.A. | xs:string | Sim |  |  |
| CODCONCEITO | Conceito | xs:string |  |  |  |
| COMENTARIO | Comentário | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODPROVA | Avaliação | xs:short | Sim |  |  |
| CODETAPA | Etapa | xs:short | Sim |  |  |
| IDTURMADISC | Turma disciplina | xs:int | Sim | → STURMADISC |  |
| IDGRUPO | Grupo de conceitos | xs:short |  |  |  |
| NOTA | Nota | xs:decimal |  |  |  |
| NUMACERTOS | Número de Acertos | xs:int |  |  |  |
| NOMEETAPA | Nome da etapa | xs:string |  |  |  |
| NUMDIARIO | NUMDIARIO | xs:int |  |  |  |
| MEDIA | MEDIA | xs:decimal |  |  |  |
| DTPROVA | DTPROVA | xs:dateTime |  |  |  |
| VALOR | VALOR | xs:decimal |  |  |  |
| DESCPROVA | DESCPROVA | xs:string |  |  |  |
| DISPONIVELALUNOS | DISPONIVELALUNOS | xs:string |  |  |  |
| PERMITEENTREGAWEB | PERMITEENTREGAWEB | xs:string |  |  |  |
| NOME | NOME | xs:string |  |  | PII |
| NOMECIVIL | NOMECIVIL | xs:string |  |  |  |
| NOMESOCIAL | NOMESOCIAL | xs:string |  |  | PII |
| RANOTAS | RANOTAS | xs:string |  |  |  |
| NOTAETAPA | NOTAETAPA | xs:decimal |  |  |  |
| CODCONCEITOETAPA | CODCONCEITOETAPA | xs:string |  |  |  |
| IDGRUPONOTAS | IDGRUPONOTAS | xs:short |  |  |  |
| NOTASFALTASWEB | NOTASFALTASWEB | xs:string |  |  |  |
| DIBLOQNOTAFALTA | DIBLOQNOTAFALTA | xs:string |  |  |  |
| CODSTATUS | CODSTATUS | xs:int |  | → SSTATUS |  |
| DESCRICAO | DESCRICAO | xs:string |  |  |  |

*... e mais 18 campos. Ver schema.json para lista completa.*

### SNotasComentario — SNotasComentario (7 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODPROVA | CODPROVA | xs:short | Sim |  |  |
| CODETAPA | CODETAPA | xs:short | Sim |  |  |
| TIPOETAPA | TIPOETAPA | xs:string | Sim |  |  |
| IDTURMADISC | IDTURMADISC | xs:int | Sim | → STURMADISC |  |
| RA | RA | xs:string | Sim |  |  |
| COMENTARIO | COMENTARIO | xs:string |  |  |  |

### SPREDIOCOMPL — SPREDIOCOMPL (3 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODPREDIO | CODPREDIO | xs:string | Sim |  |  |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODFILIAL | CODFILIAL | xs:short | Sim | → GFILIAL |  |

### SPlanoAula — Plano de Aula (39 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODPREDIO | Cód. Prédio | xs:string |  |  |  |
| CODSALA | Sala | xs:string |  |  |  |
| CODPROF | Professor substituto | xs:string |  |  |  |
| CONTEUDO | Conteúdo Previsto | xs:string |  |  |  |
| LOCACAO | Locação | xs:string |  |  |  |
| CONTEUDOEFETIVO | Conteúdo Realizado | xs:string |  |  |  |
| REPOSICAO | Reposição | xs:string |  |  |  |
| SUBSTITUTO | Substituto | xs:string |  |  |  |
| PAGAMENTOPROF | Professor que receberá pela aula | xs:string |  |  |  |
| HORAINICIAL | Início | xs:string |  |  |  |
| HORAFINAL | Término | xs:string |  |  |  |
| TIPOFALTA | Falta | xs:string |  |  |  |
| CODBLOCO | Cód. Bloco | xs:string |  |  |  |
| CODSUBTURMA | Subturma | xs:string |  |  |  |
| LICAOCASA | Lição de casa | xs:string |  |  |  |
| CONFIRMADO | Confirmado | xs:string |  |  |  |
| URLAULAONLINE | Aula Online | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDTURMADISC | Id. turma/disciplina | xs:int | Sim | → STURMADISC |  |
| AULA | Aula | xs:int | Sim |  |  |
| IDHORARIOTURMA | Id. do Horário | xs:int | Sim |  |  |
| CODFILIAL | Filial | xs:short |  | → GFILIAL |  |
| CODHOR | Código horário | xs:int | Sim |  |  |
| DATA | Data | xs:dateTime |  |  |  |
| DATAEFETIVA | Data | xs:dateTime |  |  |  |
| HORAINICIALREALIZADO | HORAINICIAL | xs:string |  |  |  |
| HORAFINALREALIZADO | HORAFINAL | xs:string |  |  |  |
| CODTURMA | Código da Turma | xs:string |  |  |  |
| CODDISC | Código da disciplina | xs:string |  |  |  |
| NOMEDISC | Nome da disciplina | xs:string |  |  |  |

*... e mais 9 campos. Ver schema.json para lista completa.*

### SPlanoAulaArquivo — SPlanoAulaArquivo (7 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDTURMADISC | Id. turma/disciplina | xs:int | Sim | → STURMADISC |  |
| IDPLANOAULA | Id. plano aula | xs:int | Sim |  |  |
| IDMATERIALSEC | Id. do arquivo da aula | xs:int | Sim |  |  |
| PATHARQUIVO | Arquivo | xs:string | Sim |  |  |
| DESCRICAO | Descrição | xs:string | Sim |  |  |
| ARQUIVO | Arquivo | xs:base64Binary | Sim |  |  |

### SPredio — Prédio (25 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODPREDIO | Código | xs:string | Sim |  |  |
| NOME | Nome | xs:string | Sim |  | PII |
| RUA | Logradouro | xs:string |  |  | PII |
| NUMERO | Número | xs:string |  |  | PII |
| COMPLEMENTO | Complemento | xs:string |  |  | PII |
| BAIRRO | Bairro | xs:string |  |  | PII |
| ESTADO | Estado | xs:string |  |  |  |
| CIDADE | Cidade | xs:string |  |  | PII |
| CEP | CEP | xs:string |  |  | PII |
| PAIS | País | xs:string |  |  |  |
| TELEFONE | Telefone | xs:string |  |  | PII |
| DDD | DDD | xs:string |  |  |  |
| FAX | Fax | xs:string |  |  | PII |
| CONTATO | Contato | xs:string |  |  |  |
| EMAIL | Email do contato | xs:string |  |  | PII |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODFILIAL | Cód. Filial | xs:short | Sim | → GFILIAL |  |
| CODCAMPUS | Campus/Polo | xs:string |  |  |  |
| CODCOLIGADAPT | CODCOLIGADAPT | xs:short |  |  |  |
| CODFILIALPT | CODFILIALPT | xs:short |  |  |  |
| CODPREDIOPT | CODPREDIOPT | xs:string |  |  |  |
| CODFREGUESIA | CODFREGUESIA | xs:string |  |  |  |
| CODPOSTAL | CODPOSTAL | xs:string |  |  |  |
| CODMUNICIPIO | CODMUNICIPIO | xs:string |  |  |  |
| LOCALIDADE | LOCALIDADE | xs:string |  |  |  |

### SSALACOMPL — SSALACOMPL (5 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODPREDIO | CODPREDIO | xs:string | Sim |  |  |
| CODBLOCO | CODBLOCO | xs:string | Sim |  |  |
| CODSALA | CODSALA | xs:string | Sim |  |  |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODFILIAL | CODFILIAL | xs:short | Sim | → GFILIAL |  |

### SSala — Sala de Aula (20 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODPREDIO | Prédio | xs:string | Sim |  |  |
| CODBLOCO | Bloco | xs:string | Sim |  |  |
| CODSALA | Código | xs:string | Sim |  |  |
| DESCRICAO | Descrição | xs:string |  |  |  |
| ANDAR | Andar | xs:string |  |  |  |
| CODLOCAL | Localidade do TOTVS Backoffice - Linha RM Gestão Patrimonial | xs:string |  |  |  |
| DISPONIVEL | Indisponível para alocação em: | xs:string |  |  |  |
| HORINIINDISP | Hora inicial | xs:string |  |  |  |
| HORFININDISP | Hora final | xs:string |  |  |  |
| CODSALAREFURANIA | Referência de sala para o Urânia | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODFILIAL | Cód. Filial | xs:short | Sim | → GFILIAL |  |
| CODTIPOSALA | Tipo de sala | xs:short |  |  |  |
| CAPACIDADE | Capacidade | xs:int |  |  |  |
| CAPACIDADEMAXIMA | Capacidade máxima | xs:int |  |  |  |
| CAPACIDADEPROVA | Capacidade para prova | xs:int |  |  |  |
| AREA | Área m2 | xs:decimal |  |  |  |
| CUSTOHORA | Custo da hora/aula | xs:decimal |  |  |  |
| PERMITERESERVA | Permite reserva | xs:string |  |  |  |
| DIASEMANAINDISP | Dia da semana | xs:short |  |  |  |

### STURMACOMPL — STURMACOMPL (7 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| CODFILIAL | CODFILIAL | xs:short | Sim | → GFILIAL |  |
| IDPERLET | IDPERLET | xs:int | Sim | → SPLETIVO |  |
| CODTURMA | CODTURMA | xs:string | Sim |  |  |
| CODCURSO_TELESCOPE | CODCURSO_TELESCOPE | xs:string |  |  |  |
| NOMECURSO_TELESCOPE | NOMECURSO_TELESCOPE | xs:string |  |  |  |
| CODTURMAD2L | CODTURMAD2L | xs:int |  |  |  |

### STURMADISCCOMPL — STURMADISCCOMPL (2 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| IDTURMADISC | IDTURMADISC | xs:int | Sim | → STURMADISC |  |

### STurma — Turma (54 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODTURMA | Código da Turma | xs:string | Sim |  |  |
| CODDEPARTAMENTO | Departamento | xs:string |  |  |  |
| CODPREDIO | Cód. Prédio | xs:string |  |  |  |
| CODSALA | Sala | xs:string |  |  |  |
| CODCCUSTO | Centro de custo | xs:string |  |  |  |
| APLICACAO | Sistema | xs:string |  |  |  |
| CODFORMULA | Fórmula para cálculo do resultado final | xs:string |  |  |  |
| NOMERED | Nome reduzido | xs:string |  |  |  |
| NOME | Nome | xs:string |  |  | PII |
| CODTURMAPROX | Código da próxima turma | xs:string |  |  |  |
| TURMAENCERRADA | Turma encerrada | xs:string |  |  |  |
| CODBLOCO | Bloco | xs:string |  |  |  |
| CODCAMPUS | Campus/Polo | xs:string |  |  |  |
| CODPERLET | Cód. Período letivo | xs:string |  |  |  |
| URLAULAONLINE | Aula Online | xs:string |  |  |  |
| BALANCEAMENTOMATHABILITA | Habilitar balanceamento | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODFILIAL | Filial | xs:short | Sim | → GFILIAL |  |
| IDPERLET | Id. Período letivo | xs:int | Sim | → SPLETIVO |  |
| IDHABILITACAOFILIAL | Matriz aplicada | xs:int |  | → SHABILITACAOFILIAL |  |
| MAXALUNOS | Nº máximo de alunos | xs:int |  |  |  |
| DTINICIAL | Data inicial | xs:dateTime |  |  |  |
| DTFINAL | Data final | xs:dateTime |  |  |  |
| ALUNOSLABORE | Nº alunos (Folha de pagamento) | xs:int |  |  |  |
| DTALUNOSLABORE | Data (Folha de pagamento) | xs:dateTime |  |  |  |
| CODTIPOCURSO | Nível de ensino | xs:short |  | → STIPOCURSO |  |
| CODCURSO | Cód. Curso | xs:string |  |  |  |
| CODHABILITACAO | Cód. Habilitação | xs:string |  |  |  |
| CODGRADE | Cód. Matriz | xs:string |  |  |  |
| TIPOMEDIACAO | Tipo de mediação | xs:short |  |  |  |

*... e mais 24 campos. Ver schema.json para lista completa.*

### STurmaDisc — Turma-Disciplina (Oferta) (92 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODTURMA | Código da Turma | xs:string | Sim |  |  |
| CODDISC | Cód. Disciplina | xs:string | Sim |  |  |
| CODCCUSTO | Centro de custo | xs:string |  |  |  |
| APLICACAO | Sistema | xs:string |  |  |  |
| CODFORMULA | Fórmula para cálculo de médias / aprovação | xs:string |  |  |  |
| CODPREDIO | Cód. Prédio | xs:string |  |  |  |
| CODSALA | Sala | xs:string |  |  |  |
| CODEVENTO | Evento | xs:string |  |  |  |
| DISCOPCIONAL | Disciplina opcional | xs:string |  |  |  |
| PREALOCACAO | Vaga pré-alocada | xs:string |  |  |  |
| CODEVENTOFALTA | Evento de falta | xs:string |  |  |  |
| CODEVENTOATRASO | Evento de atraso | xs:string |  |  |  |
| TIPO | Tipo da turma | xs:string |  |  |  |
| CODBLOCO | Cód. Bloco | xs:string |  |  |  |
| CODCAMPUS | Campus/Polo | xs:string |  |  |  |
| ADICIONALNOTURNO | Noturno | xs:string |  |  |  |
| ADICIONALEXTRA | Extra | xs:string |  |  |  |
| DISPONIVELMATRICULA | Exibe na matrícula do portal | xs:string |  |  |  |
| GERENCIAL | Gerencial | xs:string |  |  |  |
| ATIVA | Ativa | xs:string | Sim |  |  |
| ALIASCOMUNIDADE | Alias da comunidade no Fluig | xs:string |  |  |  |
| COMPARTILHADA | Compartilhada | xs:string |  |  |  |
| ESPELHO | Espelho | xs:string |  |  |  |
| MASCARATURMAESPELHO | Máscara | xs:string |  |  |  |
| URLAULAONLINE | Aula Online | xs:string |  |  |  |
| TIPONOTA | Tipo de nota | xs:string |  |  |  |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| IDTURMADISC | Código | xs:int | Sim | → STURMADISC |  |
| CODFILIAL | Filial | xs:short | Sim | → GFILIAL |  |
| IDPERLET | Id. Período letivo | xs:int | Sim | → SPLETIVO |  |

*... e mais 62 campos. Ver schema.json para lista completa.*

---

## Regras de Negócio

- IDTURMADISC é a chave central da operação — liga turma, disciplina, notas, horários
- Notas são por aluno × turma-disciplina × etapa × tipo
- Etapas são configuráveis por turma-disciplina (flexibilidade por escola)

---

## Queries Disponíveis (7)

| Query | Descrição | Tabelas | Caso de Uso |
|-------|-----------|---------|-------------|
| dashboard-frequencia-media | Dashboard: frequência média por turma-disciplina | SNOTAETAPA, STURMADISC, STURMA | Dashboard — monitoramento de frequência geral |
| notas-por-turma-etapa | Notas de todos alunos de uma turma-disciplina em uma etapa | SNOTAETAPA, SALUNO, STURMADISC | Digitação de notas, boletim parcial |
| vagas-turma | Vagas disponíveis por turma (max - matriculados) | STURMA, SMATRICULA | Processo seletivo, rematrícula |
| resultado-final-turma | Resultado final (aprovado/reprovado) por turma-disciplina | SMATRICULA, SSTATUS, SALUNO | Ata final, conselho de classe |
| boletim-completo-pivot | Boletim com notas em colunas (pivot por etapa) | SNOTAETAPA, SETAPAS, SMATRICULA | Boletim formatado para impressão |
| ocupacao-salas | Taxa de ocupação de salas por dia/horário | SHORARIOTURMA, SSALA, STURMADISC | Otimização de espaço físico |
| disciplinas-reprovacao-alta | Disciplinas com taxa de reprovação acima do limiar | SMATRICULA, SSTATUS, SDISCIPLINA | Análise pedagógica, plano de melhoria |

---

## APIs

### SOAP DataServers neste domínio
- `EduBlocoData`
- `EduHorarioTurmaData`
- `EduMatriculaData`
- `EduNotaEtapaData`
- `EduNotasData`
- `EduPlanoAulaData`
- `EduPredioData`
- `EduSalaData`
- `EduTurmaData`
- `EduTurmaDiscData`

*Ver apis.json para endpoints REST e status detalhado.*
