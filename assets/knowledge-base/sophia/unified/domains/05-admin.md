# Administração e Config

> Empresas, unidades, autenticação, configurações, marketplace, arquivos, catraca.

---

## Tags da API (9)

`Arquivos`, `Autenticacao`, `Catraca`, `Configuracoes`, `Empresas`, `Health`, `Introducao`, `Marketplace`, `Unidades`

## Endpoints (30)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/api/v1/Autenticacao` | Autenticação da API |
| POST | `/api/v1/Catraca` | Método para inserir movimento do aluno |
| GET | `/api/v1/Configuracoes` |  |
| GET | `/api/v1/Configuracoes/MatriculaOnline` |  |
| GET | `/api/v1/Configuracoes/MatriculaOnline/{idUnidade}` |  |
| GET | `/api/v1/Empresas` | Retorna as empresas |
| GET | `/api/v1/Health/VersaoAPI` |  |
| POST | `/api/v1/Marketplace/ProcessarVendaMarketplace` | Realiza chamada do método ProcessarVendaMarketplace no servi |
| POST | `/api/v1/Marketplace/ProverItensTabs` | Realiza chamada do método ProverItensTabs no servidor de tar |
| POST | `/api/v1/Marketplace/ProverTabs` | Realiza chamada do método ProverTabs no servidor de tarefas |
| GET | `/api/v1/Unidades` | Retorna as unidades ativas |
| GET | `/api/v1/Unidades/{idUnidade}/logotipo` |  |
| GET | `/api/v1/alunos/{idAluno}/Arquivos` | Retorna os arquivos disponibilizados para o aluno |
| GET | `/api/v1/alunos/{idAluno}/Catraca` | Método para retornar movimentação do aluno |
| GET | `/api/v1/rematricula/{idOferta}/Introducao` |  |
| POST | `/{tenant}/api/v1/Autenticacao` | Autenticação da API |
| POST | `/{tenant}/api/v1/Catraca` | Método para inserir movimento do aluno |
| GET | `/{tenant}/api/v1/Configuracoes` |  |
| GET | `/{tenant}/api/v1/Configuracoes/MatriculaOnline` |  |
| GET | `/{tenant}/api/v1/Configuracoes/MatriculaOnline/{idUnidade}` |  |
| GET | `/{tenant}/api/v1/Empresas` | Retorna as empresas |
| GET | `/{tenant}/api/v1/Health/VersaoAPI` |  |
| POST | `/{tenant}/api/v1/Marketplace/ProcessarVendaMarketplace` | Realiza chamada do método ProcessarVendaMarketplace no servi |
| POST | `/{tenant}/api/v1/Marketplace/ProverItensTabs` | Realiza chamada do método ProverItensTabs no servidor de tar |
| POST | `/{tenant}/api/v1/Marketplace/ProverTabs` | Realiza chamada do método ProverTabs no servidor de tarefas |
| GET | `/{tenant}/api/v1/Unidades` | Retorna as unidades ativas |
| GET | `/{tenant}/api/v1/Unidades/{idUnidade}/logotipo` |  |
| GET | `/{tenant}/api/v1/alunos/{idAluno}/Arquivos` | Retorna os arquivos disponibilizados para o aluno |
| GET | `/{tenant}/api/v1/alunos/{idAluno}/Catraca` | Método para retornar movimentação do aluno |
| GET | `/{tenant}/api/v1/rematricula/{idOferta}/Introducao` |  |

---

## Regras

- Multi-unidade: cada escola pode ter vários campi
- Autenticação: token 20min, vinculado ao IP, custo adicional por escola
- Catraca: integração com controle de acesso físico
- Marketplace: extensões e integrações de terceiros

*Swagger completo em `raw/swagger-sophia-v1.json`*
