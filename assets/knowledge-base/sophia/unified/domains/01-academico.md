# Acadêmico

> Alunos, matrículas, disciplinas, cursos, turmas, notas, boletins, frequência, horários, avaliações.

---

## Tags da API (17)

`AlunoDigital`, `Alunos`, `AtaNota`, `AvaliacaoInstitucional`, `Avaliacoes`, `Boletins`, `Cursos`, `Disciplinas`, `Escolaridades`, `ListaChamada`, `MateriaLecionada`, `Matriculas`, `Ocorrencias`, `Periodos`, `QuadrosHorarios`, `RematriculaCurricular`, `Turmas`

## Endpoints (114)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/api/v1/AlunoDigital/ProcessarWebhook` |  |
| GET | `/api/v1/Alunos` | Retorna os alunos |
| POST | `/api/v1/Alunos/ValidarLogin` | Autentica um usuário com base no e-mail ou Código externo |
| GET | `/api/v1/Alunos/{id}` | Retorna os dados do aluno |
| PUT | `/api/v1/Alunos/{id}` | Altera os dados do aluno |
| GET | `/api/v1/AtaNota` | Retorna as ata nota |
| GET | `/api/v1/AtaNota/{id}/NotaAlunos` | Retorna as ata aluno |
| PUT | `/api/v1/AtaNota/{id}/NotaAlunos` | Atualiza as ata aluno |
| GET | `/api/v1/AvaliacaoInstitucional` |  |
| GET | `/api/v1/AvaliacaoInstitucional/{codigoAvaliacao}/Usuario/{co` |  |
| POST | `/api/v1/AvaliacaoInstitucional/{codigoAvaliacao}/Usuario/{co` |  |
| GET | `/api/v1/AvaliacaoInstitucional/{codigoAvaliacao}/Usuario/{co` |  |
| GET | `/api/v1/Avaliacoes/tiposAvaliacao` | Retorna os tipos de avaliação |
| GET | `/api/v1/Cursos` | Retorna os cursos |
| GET | `/api/v1/Disciplinas` | Retorna as disciplinas |
| GET | `/api/v1/Disciplinas/{idMatricula}` | Retorna as disciplinas por matrícula |
| GET | `/api/v1/Escolaridades` | Retorna as escolaridades |
| PUT | `/api/v1/ListaChamada/Alunos` |  |
| GET | `/api/v1/ListaChamada/Alunos/{idListaChamada}` |  |
| PUT | `/api/v1/ListaChamada/ListaChamada` |  |
| GET | `/api/v1/ListaChamada/Professor/{idProfessor}` |  |
| GET | `/api/v1/ListaChamada/{idListaChamada}` |  |
| GET | `/api/v1/MateriaLecionada` |  |
| PUT | `/api/v1/MateriaLecionada` |  |
| GET | `/api/v1/MateriaLecionada/listaChamada/{idListaChamada}` |  |
| GET | `/api/v1/MateriaLecionada/{idMatricula}` |  |
| GET | `/api/v1/Periodos` | Retorna os períodos letivos |
| POST | `/api/v1/RematriculaCurricular/AceitarContrato` |  |
| GET | `/api/v1/RematriculaCurricular/Boletos` |  |
| POST | `/api/v1/RematriculaCurricular/ConfirmarPreMatricula` |  |
| GET | `/api/v1/RematriculaCurricular/DadosIniciais` |  |
| GET | `/api/v1/RematriculaCurricular/DadosRematricula` |  |
| GET | `/api/v1/RematriculaCurricular/Disciplinas` |  |
| GET | `/api/v1/RematriculaCurricular/Documentos` |  |
| GET | `/api/v1/RematriculaCurricular/DocumentosPendentes` |  |
| GET | `/api/v1/RematriculaCurricular/Matriculas` |  |
| GET | `/api/v1/RematriculaCurricular/Permissoes` |  |
| GET | `/api/v1/RematriculaCurricular/PlanosPagamentos` |  |
| GET | `/api/v1/RematriculaCurricular/Relatorio` |  |
| GET | `/api/v1/RematriculaCurricular/Responsaveis` |  |

*... e mais 74 endpoints. Ver apis.json para lista completa.*

---

## Regras

- Aluno identificado por CodigoAluno (não RA como no TOTVS)
- Matrícula = vínculo aluno×curso×período (similar a SMATRICPL/SMATRICULA no TOTVS)
- Boletins e atas de nota são documentos consolidados (não registros por etapa)
- Lista de chamada = frequência diária (similar a SFREQUENCIA no TOTVS)
- Avaliação institucional = pesquisa de satisfação (não existe no TOTVS)

*Swagger completo em `raw/swagger-sophia-v1.json`*
