# SophiA API Web de Integracao — Documentacao Oficial v1.0

> Fonte: PDF "Integracao_API_Web 1 (1) 2.pdf" — Prima Informatica / Sophia Gestao Escolar Web
> Atualizado: 2026-03-24

---

## 1. Introducao

API Web de integracao para o Sophia Gestao Escolar Web, versao 1. Requer modulo Web API ativado na instalacao.

## 2. Estrutura da API Web

### 2.1 Ambiente

Apenas ambiente produtivo. URL base:

```
https://escolar.sophia.com.br/Gerenciador/{NumeroSerie}/api/{VersaoApi}
```

- `{NumeroSerie}` — numero de serie da instalacao (ex: 6150)
- `{VersaoApi}` — versao da API (ex: v1)

### 2.2 Headers de Requisicao

| Parametro | Valor |
|-----------|-------|
| User-Agent | Nome do sistema (ex: SophiaBiblioteca) |
| Host | Endereco do servidor (ex: https://escolar.sophia.com.br) |
| Content-Type | `text/xml` ou `application/json` |
| Accept | `text/xml` ou `application/json` |
| Token | Token de autenticacao (gerado por `/Autenticacao/PostAutenticacao`) |

### 2.3 Formatos

Suporta JSON e XML. Escolha do formato via headers `Content-Type` e `Accept`.

---

## 3. Autenticacao

### 3.1 Token de Sistema — POST /Autenticacao/PostAutenticacao

Autenticacao do sistema integrado. Gera token para comunicacao com a API.

**Configuracao**: `Configuracoes > Integracao com Web API > Seguranca` no Sophia Gestao Escolar Web.

**Regras do Token**:
- Vinculado ao IP do equipamento que requisitou
- Renovado a cada requisicao feita a qualquer recurso
- Expira em **20 minutos** apos criacao ou ultima renovacao
- Token invalido NAO pode ser reaproveitado

**Body**:

| Campo | Tipo | Tam | Descricao |
|-------|------|-----|-----------|
| Usuario | Texto | 255 | Usuario de acesso ao modulo |
| Senha | Texto | 255 | Senha de acesso ao modulo |

**Respostas**: 200 OK (token gerado) | 401 Unauthorized

**Retorno JSON**: string com token (ex: `"df28d07fdfd1452482d690ea12bb5296"`)

### 3.2 Login de Pessoa — POST /AutenticacaoPessoa/PostAutenticacao

Login de pessoa (aluno, pai, mae, responsavel). Requer e-mail cadastrado e senha enviada via **Alunos > Enviar e-mail de senha**.

**Body**:

| Campo | Tipo | Tam | Descricao |
|-------|------|-----|-----------|
| Usuario | Texto | 250 | E-mail de acesso da pessoa |
| Senha | Texto | 15 | Senha de acesso da pessoa |

**Respostas**: 200 OK | 500 Internal Server Error

**Retorno JSON** (login como pai):
```json
{
  "Alunos": [
    {
      "CodigoInterno": 27,
      "Genero": "o",
      "Nome": "aluno b",
      "Foto": null,
      "Recursos": ["avisos","boletim","calendario","fichafinanceira","boleto","demonstrativopagamento","notasrecentes"],
      "ResponsavelFinanceiro": true,
      "ResponsavelPedagogico": true,
      "TipoUsuario": 2
    }
  ],
  "CPF": "882.911.702-15",
  "CodigoInterno": 26,
  "Genero": "o",
  "Nome": "Pai aluno b",
  "TokenValidacao": null,
  "TokenRequisicao": "d09927f86c854be7a86370817e4612ef"
}
```

**TipoUsuario**: 0 = aluno, 2 = responsavel

**Recursos disponiveis por pessoa**: avisos, boletim, calendario, fichafinanceira, boleto, demonstrativopagamento, notasrecentes

### 3.3 Enviar Senha — POST /AutenticacaoPessoa/PostEnviarSenha

Envia e-mail de recuperacao de senha. NAO necessita token.

**Body**:

| Campo | Tipo | Tam | Descricao |
|-------|------|-----|-----------|
| Email | Texto | 250 | E-mail da pessoa |

**Respostas**: 200 OK

**Retorno JSON**:
```json
{ "MensagemSet": ["E-mail enviado para alunob@prima.com."], "Resultado": true }
```

### 3.4 Trocar Senha — POST /AutenticacaoPessoa/PostTrocarSenha

Troca de senha do usuario.

**Body**:

| Campo | Tipo | Tam | Descricao |
|-------|------|-----|-----------|
| CodigoInterno | Inteiro | | Codigo retornado por PostAutenticacao |
| SenhaAntiga | Texto | 15 | |
| SenhaNova | Texto | 15 | |

**Respostas**: 200 OK

**Retorno JSON**:
```json
{ "MensagemSet": ["Senha atual incorreta."], "Resultado": false }
```

---

## 4. Avisos

### 4.1 GET /Aviso/GetAvisos

Retorna avisos lancados no Sophia Gestao Escolar Web.

**URL**: `/Aviso/GetAvisos?Codigo={Codigo}&CodigoUsuario={CodigoUsuario}&TipoUsuario={TipoUsuario}&ResponsavelPedagogico={ResponsavelPedagogico}&ResponsavelFinanceiro={ResponsavelFinanceiro}`

**Params**:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| Codigo | Inteiro | Codigo interno do aluno |
| CodigoUsuario | Inteiro | Codigo interno do usuario logado |
| TipoUsuario | Inteiro | Tipo de usuario do aluno |
| ResponsavelPedagogico | Boleano | Usuario logado e responsavel pedagogico? |
| ResponsavelFinanceiro | Boleano | Usuario logado e responsavel financeiro? |

**Retorno JSON**:
```json
[
  { "Codigo": 1, "Descricao": "Festa julina no dia 15/07/2018...", "Titulo": "Festa julina", "Lido": false }
]
```

### 4.2 POST /Aviso/PostMarcarComoLido

Marca aviso como lido.

**Body**:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| CodigoPessoa | Inteiro | Codigo interno do usuario logado |
| CodigoAviso | Inteiro | Codigo do aviso |

**Respostas**: 204 No Content

---

## 5. Boletim

### 5.1 GET /Boletim/GetFiltroBoletim

Retorna arvore de filtro para chamada de impressao do boletim.

**URL**: `/Boletim/GetFiltroBoletim?codigo={codigo}`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| codigo | Inteiro | Codigo interno do aluno |

**Link de impressao**:
```
https://escolar.sophia.com.br/Gerenciador/{NumeroSerie}/BoletimRelatorio/Visualizar?m={CodigoMatricula}&t={CodigoTurma}&b={CodigoBoletim}
```

**Retorno JSON**:
```json
[
  {
    "Codigo": 1,
    "Descricao": "SGEW Prima 1",
    "BoletimPeriodoSet": [
      {
        "Codigo": 1,
        "Descricao": "2018",
        "BoletimTurmaSet": [
          { "Codigo": 8, "Descricao": "1o Ano - Turma B", "CodigoBoletim": null, "CodigoMatricula": 23, "Parametrizado": false }
        ]
      }
    ]
  }
]
```

### 5.2 GET /Boletim/GetTodasEtapasBoletim

Retorna arvore do boletim com etapas e notas completas.

**URL**: `/Boletim/GetTodasEtapasBoletim?codigo={codigo}`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| codigo | Inteiro | Codigo interno do aluno |

**Retorno JSON** (estrutura por etapa):
```json
[
  {
    "Descricao": "Bimestre 1",
    "IdEtapa": 4,
    "IdMatricula": 10,
    "Disciplinas": [
      {
        "Descricao": "Historia",
        "MediaAluno": "7,8",
        "MediaAlunoCor": "000",
        "MediaTurma": "",
        "MediaTurmaCor": "000",
        "AulasDadas": 10,
        "Faltas": 0,
        "Percentual": 0.0,
        "TarefasDadas": 10,
        "TarefasRealizadas": 10,
        "Observacao": "-1",
        "Avaliacoes": [
          { "Descricao": "Prova 1", "NotaAluno": "7,8", "NotaAlunoCor": "000", "MediaTurma": "", "MediaTurmaCor": "000", "Peso": "1", "DataHora": "-1" }
        ],
        "Setores": []
      }
    ]
  }
]
```

**Campos de disciplina**:
- `MediaAluno` / `MediaTurma` — medias (string com virgula decimal)
- `MediaAlunoCor` / `MediaTurmaCor` — cor hex (ex: "000" = preto, "F00" = vermelho)
- `AulasDadas`, `Faltas`, `Percentual` — frequencia
- `TarefasDadas`, `TarefasRealizadas` — tarefas
- `Observacao` — "-1" = nao informada
- `Avaliacoes[]` — provas e trabalhos com notas individuais
- `Setores[]` — setores (quando aplicavel)

**Etapas tipicas**: Bimestre 1-4, Etapas de recuperacao final

---

## 6. Calendario

### 6.1 GET /Calendario/GetCalendario

Retorna eventos do calendario da escola.

**URL**: `/Calendario/GetCalendario?Codigo={Codigo}&DataInicial={DataInicial}&DataFinal={DataFinal}`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| Codigo | Inteiro | Codigo interno do aluno |
| DataInicial | Data | Data de inicio do filtro |
| DataFinal | Data | Data de fim do filtro |

**Retorno JSON**:
```json
[
  {
    "Cor": "FFCACA",
    "Data": "13/02/2018",
    "Eventos": [
      { "Cor": "FFCACA", "Descricao": "CARNAVAL", "Horario": "" }
    ]
  }
]
```

---

## 7. Campanhas e Midias

### 7.1 GET /Campanha/GetCampanhas

Retorna campanhas e midias.

**Retorno JSON**:
```json
[
  {
    "Codigo": 1,
    "Descricao": "Verao",
    "MidiaSet": [
      { "Codigo": 1, "Descricao": "TV" },
      { "Codigo": 2, "Descricao": "Radio" },
      { "Codigo": 3, "Descricao": "Mailing de eventos" }
    ]
  }
]
```

---

## 8. Cursos

### 8.1 GET /Curso/GetCursos

Retorna todos os cursos da escola.

**Retorno JSON**:
```json
[
  { "Codigo": 1, "Descricao": "Curso 1", "Tipo": 1 },
  { "Codigo": 1, "Descricao": "Curso 1 - PRIMEIRA", "Tipo": 2 }
]
```

**Tipo**: 1 = CursoSeriado, 2 = CursoSerie

---

## 9. Financeiro

### 9.1 GET /FichaFinanceira/GetBoleto

Retorna boleto desejado.

**URL**: `/FichaFinanceira/GetBoleto?idTitulo={idTitulo}`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| idTitulo | Inteiro | IdTitulo retornado por GetFichaFinanceira |

**Retorno JSON**:
```json
{
  "CaminhoPDF": "http://localhost/sgew/6150/financeiro/Home/BoletoRelatorio/GerarRelatorioBoletoLaserPorTitulo?c=1",
  "LinhaDigitavel": "00190.00009 03321.321006 00000.003212 1 73950000003080"
}
```

### 9.2 GET /FichaFinanceira/GetFichaFinanceira

Retorna ficha financeira do aluno. **Somente formato JSON**. Datas em formato Microsoft JSON (`\/Date(timestamp)\/`).

**URL**: `/FichaFinanceira/GetFichaFinanceira?codigo{codigo}`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| codigo | Inteiro | Codigo interno do aluno |

**Retorno JSON**:
```json
[
  {
    "Boleto": 85,
    "CaminhoPDF": "http://localhost/sgew/6150/financeiro/Home/BoletoRelatorio/GerarRelatorioBoletoLaserPorTitulo?c=321",
    "DataPagamento": "\/Date(-62135596800000)\/",
    "DataVcto": "\/Date(1543975200000-0200)\/",
    "Descricao": "Fundamental - teste - 1o Ano - 10/10",
    "IdTitulo": 321,
    "LinhaDigitavel": "00190.00009 01234.012344 00000.085019 1 77290000240000",
    "Numero": 321,
    "Pago": false,
    "ResponsavelFinanceiro": "Pai aluno b",
    "TemBoleto": true,
    "ValorPago": 0.0,
    "ValorPrevisto": 850.0000
  }
]
```

### 9.3 GET /FichaFinanceira/GetFiltroRelatorioDemonstrativoPagamento

Retorna demonstrativos de pagamento dos alunos/responsaveis.

**URL**: `/FichaFinanceira/GetFiltroRelatorioDemonstrativoPagamento?codigoResponsavel={codigoResponsavel}`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| codigoResponsavel | Inteiro | Codigo interno do usuario logado |

**Retorno JSON**:
```json
[
  {
    "Url": "http://localhost/sgew/6150/DemonstrativoPagamentoRelatorio/VisualizarRelatorioDemonstrativoPagamentoPorResponsavel?c=5&a=2018",
    "Ano": 2018
  }
]
```

---

## 10. Logotipo

### 10.1 GET /Logotipo/GetLogotipo

Retorna string base64 do logotipo. **NAO necessita token no header.**

**Retorno**: string base64 (XML) ou string JSON com base64 da imagem.

---

## 11. Notas Recentes

### 11.1 GET /Nota/ListarNotasRecentes

Retorna notas recentes do aluno.

**URL**: `/Nota/ListarNotasRecentes?codigo={codigo}`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| codigo | Inteiro | Codigo interno do aluno |

**Retorno JSON**:
```json
[
  {
    "Codigo": 15,
    "Cor": "000",
    "DataHora": "",
    "Descricao": "Trabalho 1",
    "Disciplina": "Matematica",
    "Etapa": "Bimestre 1 - Bimestre 1",
    "MediaTurma": "-1",
    "Nota": "8,3",
    "Professor": "-1",
    "Setores": [],
    "Turma": "1a Serie A EF"
  }
]
```

---

## 12. Cadastro de Pessoa

### 12.1 POST /Pessoa/PostPessoa

Inclusao de pessoa (aluno + responsaveis).

#### Pessoa (body)

| Campo | Tipo | Tam | Obrig | Descricao |
|-------|------|-----|-------|-----------|
| MoraCom | Boleano | | | true = aluno mora em endereco proprio |
| ResponsavelFinanceiro | Boleano | | | true = responsavel financeiro e o proprio aluno |
| ResponsavelPedagogico | Boleano | | | true = responsavel pedagogico e o proprio aluno |
| Nome | Texto | 100 | Sim | Nome do aluno |
| CPF | Texto | 11 | | CPF do aluno |
| Sexo | Texto | 1 | | M = masculino, F = feminino |
| RgNumero | Texto | 12 | | Numero do RG |
| RgOrgaoEmissor | Texto | 15 | | Orgao emissor do RG |
| DataNascimento | Data | | | Formato yyyy-MM-dd |
| CidadeNascimento | Texto | 250 | | |
| UFNascimento | Texto | 2 | | |
| Observacoes | Texto | 8000 | | |
| ContatoSet | Lista | | | Lista de ContatoSet |
| Cep | Texto | 9 | | |
| Bairro | Texto | 250 | | |
| Cidade | Texto | 250 | | |
| UF | Texto | 2 | | |
| Logradouro | Texto | 400 | | |
| Numero | Texto | 20 | | |
| Complemento | Texto | 250 | | |
| ResponsavelSet | Lista | | | Lista de ResponsavelSet |

#### ResponsavelSet

| Campo | Tipo | Tam | Descricao |
|-------|------|-----|-----------|
| MoraCom | Boleano | | Aluno mora com este responsavel |
| ResponsavelFinanceiro | Boleano | | Este responsavel e o financeiro |
| ResponsavelPedagogico | Boleano | | Este responsavel e o pedagogico |
| Parentesco | Texto | 15 | |
| Sexo | Texto | 1 | M/F |
| Nome | Texto | 100 | |
| CPF | Texto | 11 | |
| DataNascimento | Data | | yyyy-MM-dd |
| RG | Texto | 12 | |
| RgOrgaoEmissor | Texto | 15 | |
| ContatoSet | Lista | | Lista de ContatoSet |
| Cep | Texto | 9 | |
| Bairro | Texto | 250 | |
| Cidade | Texto | 250 | |
| UF | Texto | 2 | |
| Logradouro | Texto | 400 | |
| Numero | Texto | 20 | |
| Complemento | Texto | 250 | |
| EmpresaTrabalha | Texto | 100 | |
| Profissao | Texto | 100 | |

#### ContatoSet

| Campo | Tipo | Tam | Descricao |
|-------|------|-----|-----------|
| Tipo | Texto | 15 | Email, Celular, Residencial, Comercial, Outro |
| Valor | Texto | 250 | Contato do tipo especificado |

**Respostas**: 201 Created | 400 Bad Request

**Retorno JSON**:
```json
{ "Codigo": 0, "CodigoSet": [], "MensagemSet": [], "Resultado": true }
```

---

## 13. Prospectivo (Captacao)

### 13.1 POST /Prospectivo/PostProspectivo

Inclusao de prospectivos (leads de captacao).

**Body**:

| Campo | Tipo | Tam | Obrig | Descricao |
|-------|------|-----|-------|-----------|
| CodigoUnidade | Inteiro | | Sim | Via /Unidade/GetUnidades |
| CodigoCampanha | Inteiro | | Sim | Via /Campanha/GetCampanhas |
| CodigoMidia | Inteiro | | Sim | Via /Campanha/GetCampanhas |
| Agendamento | Data e Hora | | | dd/MM/yyyy HH:mm |
| Nome | Texto | 100 | Sim | |
| Email | Texto | 250 | Sim | |
| Telefone | Texto | 250 | Sim | |
| Observacao | Texto | 8000 | | |
| CodigoCurso | Inteiro | | | Via /Curso/GetCursos |
| TipoCurso | Inteiro | | | 0 = simples, 1 = seriado, 2 = serie |
| CodigoSituacaoFunil | Inteiro | | | Via /SituacaoFunil/GetSituacoesFunil |

**Respostas**: 200 OK

### 13.2 Codigos de Erro

| Codigo | Descricao |
|--------|-----------|
| 0 | Erro geral {0} |
| 1 | Valor informado no campo {0} e invalido |
| 2 | {0} e uma dependencia inexistente |
| 3 | O campo {0} e obrigatorio |
| 4 | O campo {0} ultrapassou o tamanho maximo |
| 5 | O e-mail informado no campo {0} e invalido |
| 6 | O telefone informado no campo {0} e invalido |
| 7 | A data informada no campo {0} esta fora do intervalo permitido |
| 8 | O numero de serie vinculado a unidade informada nao e valido |
| 9 | A configuracao de integracao com a WebApi nao foi realizada no sistema |
| 10 | A ordem de atendimento na configuracao de integracao com a WebApi nao esta cadastrada no sistema |
| 11 | O valor informado no campo {0} e invalido ou nao foi definido na configuracao de integracao com a WebApi |

---

## 14. Situacoes de Funil

### 14.1 GET /SituacaoFunil/GetSituacoesFunil

Retorna situacoes do funil de captacao.

**Retorno JSON**:
```json
[
  { "Codigo": 1, "Descricao": "Prospectivo" },
  { "Codigo": 2, "Descricao": "Contato efetivo" },
  { "Codigo": 3, "Descricao": "Visita agendada" },
  { "Codigo": 4, "Descricao": "Visita realizada" }
]
```

---

## 15. Unidades

### 15.1 GET /Unidade/GetUnidades

Retorna as unidades da escola.

**Retorno JSON**:
```json
[
  { "Codigo": 1, "Bairro": "Residencial Independencia", "Cidade": "Sao Jose dos Campos", "Descricao": "SGEW Prima Unidade 1", "Estado": "SP" },
  { "Codigo": 2, "Bairro": "Pilares", "Cidade": "Rio de Janeiro", "Descricao": "SGEW Prima Unidade 2", "Estado": "RJ" }
]
```

---

## 16. Resumo de Endpoints

| # | Metodo | Endpoint | Auth | Descricao |
|---|--------|----------|------|-----------|
| 1 | POST | /Autenticacao/PostAutenticacao | - | Gerar token do sistema |
| 2 | POST | /AutenticacaoPessoa/PostAutenticacao | - | Login de pessoa (aluno/pai) |
| 3 | POST | /AutenticacaoPessoa/PostEnviarSenha | - | Enviar e-mail de recuperacao |
| 4 | POST | /AutenticacaoPessoa/PostTrocarSenha | Token | Trocar senha |
| 5 | GET | /Aviso/GetAvisos | Token | Listar avisos |
| 6 | POST | /Aviso/PostMarcarComoLido | Token | Marcar aviso como lido |
| 7 | GET | /Boletim/GetFiltroBoletim | Token | Filtro para impressao do boletim |
| 8 | GET | /Boletim/GetTodasEtapasBoletim | Token | Boletim completo com notas |
| 9 | GET | /Calendario/GetCalendario | Token | Eventos do calendario |
| 10 | GET | /Campanha/GetCampanhas | Token | Campanhas e midias |
| 11 | GET | /Curso/GetCursos | Token | Cursos da escola |
| 12 | GET | /FichaFinanceira/GetBoleto | Token | Boleto (PDF + linha digitavel) |
| 13 | GET | /FichaFinanceira/GetFichaFinanceira | Token | Ficha financeira (JSON only) |
| 14 | GET | /FichaFinanceira/GetFiltroRelatorioDemonstrativoPagamento | Token | Demonstrativos pagamento |
| 15 | GET | /Logotipo/GetLogotipo | - | Logotipo base64 |
| 16 | GET | /Nota/ListarNotasRecentes | Token | Notas recentes do aluno |
| 17 | POST | /Pessoa/PostPessoa | Token | Cadastrar pessoa (aluno+resp) |
| 18 | POST | /Prospectivo/PostProspectivo | Token | Cadastrar prospectivo |
| 19 | GET | /SituacaoFunil/GetSituacoesFunil | Token | Situacoes do funil |
| 20 | GET | /Unidade/GetUnidades | Token | Unidades da escola |

**Total: 20 endpoints** (8 POST + 12 GET)

---

## 17. Armadilhas e Gotchas

1. **Token vinculado ao IP** — nao pode ser compartilhado entre servidores/maquinas diferentes
2. **Token expira em 20 min** — renovado automaticamente a cada requisicao, mas se ficar idle > 20min precisa re-autenticar
3. **FichaFinanceira retorna SOMENTE JSON** — nao suporta XML
4. **Datas em formato Microsoft JSON** — `\/Date(timestamp)\/` (FichaFinanceira)
5. **Datas normais em dd/MM/yyyy** — Calendario, Prospectivo
6. **GetLogotipo NAO precisa de token** — endpoint publico
7. **PostEnviarSenha NAO precisa de token** — endpoint publico
8. **Recursos por pessoa sao dinamicos** — verificar array `Recursos` no retorno de PostAutenticacao para saber quais endpoints a pessoa pode acessar
9. **TipoUsuario**: 0 = aluno, 2 = responsavel — afeta quais dados retornam
10. **Sexo/Genero**: "M"/"F" para input, "o"/"a" para output (pronome portugues)
11. **Notas com virgula decimal** — retornadas como string "7,8" (formato BR), NAO float
12. **Cores em hex sem #** — "000" = preto, "F00" = vermelho
