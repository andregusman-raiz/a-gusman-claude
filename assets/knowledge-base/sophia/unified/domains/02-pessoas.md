# Pessoas e Cadastro

> Responsáveis, colaboradores, clientes, dados cadastrais, fotos, ficha de saúde.

---

## Tags da API (16)

`AutorizacaoRetirada`, `Clientes`, `Colaboradores`, `DadosCadastrais`, `EstadosCivis`, `FichaSaude`, `Fotos`, `FotosResponsaveis`, `Nacionalidades`, `Ocupacoes`, `Paises`, `Parentescos`, `Racas`, `Religioes`, `Responsaveis`, `ResponsaveisAluno`

## Endpoints (68)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/v1/Colaboradores` | Retorna os colaboradores ativos |
| GET | `/api/v1/DadosCadastrais/{idAluno}` |  |
| GET | `/api/v1/EstadosCivis` |  |
| GET | `/api/v1/Nacionalidades` | Retorna as nacionalidades |
| GET | `/api/v1/Ocupacoes` | Retorna as ocupações |
| GET | `/api/v1/Paises` | Retorna os países |
| GET | `/api/v1/Parentescos` | Retorna os parentescos |
| GET | `/api/v1/Racas` |  |
| GET | `/api/v1/Religioes` | Retorna as religiões |
| GET | `/api/v1/Responsaveis/{id}` |  |
| GET | `/api/v1/alunos/{idAluno}/AutorizacaoRetirada` |  |
| PUT | `/api/v1/alunos/{idAluno}/AutorizacaoRetirada` |  |
| GET | `/api/v1/alunos/{idAluno}/FichaSaude` |  |
| PUT | `/api/v1/alunos/{idAluno}/FichaSaude` |  |
| GET | `/api/v1/alunos/{idAluno}/Fotos` | Retorna a foto do aluno |
| PUT | `/api/v1/alunos/{idAluno}/Fotos` | Método para inserir foto do aluno |
| DELETE | `/api/v1/alunos/{idAluno}/Fotos` | Deleta a foto do aluno |
| GET | `/api/v1/alunos/{idAluno}/Fotos/FotosReduzida` | Retorna a foto reduzida do aluno |
| PUT | `/api/v1/alunos/{idAluno}/Fotos/FotosReduzida` | Método para inserir foto reduzida do aluno |
| DELETE | `/api/v1/alunos/{idAluno}/Fotos/FotosReduzida` | Deleta a foto reduzida do aluno |
| GET | `/api/v1/alunos/{idAluno}/Fotos/FotosReduzida/matricula` | Retorna a foto reduzida do aluno com base na matricula |
| GET | `/api/v1/alunos/{idAluno}/responsaveis` |  |
| POST | `/api/v1/alunos/{idAluno}/responsaveis` |  |
| PUT | `/api/v1/alunos/{idAluno}/responsaveis/{idResponsavel}` |  |
| PUT | `/api/v1/alunos/{idAluno}/responsavelFinanceiro` |  |
| PUT | `/api/v1/alunos/{idAluno}/responsavelPedagogico` |  |
| POST | `/api/v1/clientes` |  |
| POST | `/api/v1/clientes/{id}/Documentos` |  |
| GET | `/api/v1/responsaveis/{id}/fotos` |  |
| PUT | `/api/v1/responsaveis/{id}/fotos` |  |
| DELETE | `/api/v1/responsaveis/{id}/fotos` |  |
| GET | `/api/v1/responsaveis/{id}/fotos/FotoReduzida` |  |
| PUT | `/api/v1/responsaveis/{id}/fotos/FotoReduzida` |  |
| DELETE | `/api/v1/responsaveis/{id}/fotos/FotoReduzida` |  |
| GET | `/{tenant}/api/v1/Colaboradores` | Retorna os colaboradores ativos |
| GET | `/{tenant}/api/v1/DadosCadastrais/{idAluno}` |  |
| GET | `/{tenant}/api/v1/EstadosCivis` |  |
| GET | `/{tenant}/api/v1/Nacionalidades` | Retorna as nacionalidades |
| GET | `/{tenant}/api/v1/Ocupacoes` | Retorna as ocupações |
| GET | `/{tenant}/api/v1/Paises` | Retorna os países |

*... e mais 28 endpoints. Ver apis.json para lista completa.*

---

## Regras

- Responsável pode ser financeiro e/ou pedagógico (flag separada)
- Ficha de saúde: alergias, medicações, tipo sanguíneo (não existe no TOTVS)
- Autorização de retirada: quem pode buscar o aluno (Ed. Infantil)
- Tabelas auxiliares: parentescos, nacionalidades, raças, religiões, ocupações

*Swagger completo em `raw/swagger-sophia-v1.json`*
