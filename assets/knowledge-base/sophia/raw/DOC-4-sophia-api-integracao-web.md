# Sophia API Web de Integracao — Referencia Completa

> Fonte: PDF "Integração_API_Web 1 (1) 2.pdf" (50 paginas, versao 1.0)
> Produto: Sophia Gestao Escolar Web
> Empresa: Prima/Soluções Sophia

## URLs Base

| API | URL Pattern | Auth Header |
|-----|-------------|-------------|
| **REST (Swagger)** | `https://portal.sophia.com.br/SophiAWebAPI/{tenantId}/api/v1/{Resource}` | `token: JWT` |
| **Integracao (PDF)** | `https://escolar.sophia.com.br/Gerenciador/{NumeroSerie}/Api/v1/{Resource}` | `Token: string` |

## Headers Obrigatorios

```
User-Agent: SophiaBiblioteca  (ou nome do sistema)
Host: https://escolar.sophia.com.br
Content-Type: application/json
Accept: application/json
Token: {token_de_autenticacao}
```

## Autenticacao

### 4.1 POST /Autenticacao/PostAutenticacao (sistema)
- Body: `{ "Usuario": "string(255)", "Senha": "string(255)" }`
- 200 OK → retorna token string
- 401 Unauthorized
- Token IP-bound, 20min TTL, renovado a cada request

### 4.2 POST /AutenticacaoPessoa/PostAutenticacao (pai/aluno)
- Body: `{ "Usuario": "email(250)", "Senha": "string(15)" }`
- Retorna: `{ Alunos: [{ CodigoInterno, Nome, Genero, Foto, Recursos: [...], ResponsavelFinanceiro, ResponsavelPedagogico, TipoUsuario }], CPF, CodigoInterno, Genero, Nome, TokenRequisicao, TokenValidacao }`
- TipoUsuario: 0=aluno, 1=mae/pai, 2=outro responsavel

## Endpoints Disponiveis

### Avisos
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/Aviso/GetAvisos` | Codigo (aluno), CodigoUsuario, TipoUsuario, ResponsavelPedagogico (bool), ResponsavelFinanceiro (bool) |
| POST | `/Aviso/PostMarcarComoLido` | CodigoPessoa, CodigoAviso |

Retorno: `[{ Codigo, Descricao, Titulo, Lido }]`

### Boletim (NOTAS)
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/Boletim/GetFiltroBoletim` | codigo (aluno) → retorna arvore de unidades/periodos/turmas para filtro |
| GET | `/Boletim/GetTodasEtapasBoletim` | codigo (aluno) → retorna TODAS as notas por etapa/disciplina |

Retorno GetTodasEtapasBoletim:
```json
[{
  "Descricao": "Bimestre 1",
  "IdEtapa": 4,
  "IdMatricula": 10,
  "Disciplinas": [{
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
    "Avaliacoes": [{
      "Descricao": "Prova 1",
      "NotaAluno": "7,8",
      "NotaAlunoCor": "000",
      "MediaTurma": "",
      "MediaTurmaCor": "000",
      "Peso": "1",
      "DataHora": "-1"
    }],
    "Setores": []
  }]
}]
```

### Calendario
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/Calendario/GetCalendario` | Codigo (aluno), DataInicial, DataFinal |

Retorno: `[{ Cor: "FFCACA", Data: "13/02/2018", Eventos: [{ Cor, Descricao, Horario }] }]`

### Campanhas (Captacao)
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/Campanha/GetCampanhas` | - |

Retorno: `[{ Codigo, Descricao, MidiaSet: [{ Codigo, Descricao }] }]`

### Cursos
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/Curso/GetCursos` | - |

Retorno: `[{ Codigo, Descricao, Tipo }]` (Tipo: 1=seriado, 2=serie)

### Financeiro
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/FichaFinanceira/GetBoleto` | idTitulo (retornado por GetFichaFinanceira) |
| GET | `/FichaFinanceira/GetFichaFinanceira` | codigo (aluno) |
| GET | `/FichaFinanceira/GetFiltroRelatorioDemonstrativoPagamento` | codigoResponsavel |

GetFichaFinanceira retorno:
```json
[{
  "Boleto": 85,
  "CaminhoPDF": "http://...",
  "DataPagamento": "/Date(timestamp)/",
  "DataVcto": "/Date(timestamp)/",
  "Descricao": "Fundamental - teste - 1o Ano - 10/10",
  "IdTitulo": 321,
  "LinhaDigitavel": "00190.00009 ...",
  "Numero": 321,
  "Pago": false,
  "ResponsavelFinanceiro": "Pai aluno b",
  "TemBoleto": true,
  "ValorPago": 0.0,
  "ValorPrevisto": 850.0000
}]
```
**NOTA**: Datas em formato Microsoft JSON: `/Date(timestamp)/`

### Logotipo
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/Logotipo/GetLogotipo` | - (nao precisa token) |

Retorno: string base64 da imagem

### Notas Recentes
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/Nota/ListarNotasRecentes` | codigo (aluno) |

Retorno:
```json
[{
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
}]
```

### Pessoa (Cadastro)
| Metodo | Endpoint | Params |
|--------|----------|--------|
| POST | `/Pessoa/PostPessoa` | Body com 25+ campos (Nome, CPF, Sexo, endereco, responsaveis, contatos) |

Retorno: `{ Codigo: 0, CodigoSet: [], MensagemSet: [], Resultado: true }`

### Prospectivo (Captacao)
| Metodo | Endpoint | Params |
|--------|----------|--------|
| POST | `/Prospectivo/PostProspectivo` | CodigoUnidade, CodigoCampanha, CodigoMidia, Agendamento, Nome, Email, Telefone, Observacao, CodigoCurso, TipoCurso, CodigoSituacaoFunil |

### Situacao Funil
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/SituacaoFunil/GetSituacoesFunil` | - |

Retorno: `[{ Codigo: 1, Descricao: "Prospectivo" }, { Codigo: 2, Descricao: "Contato efetivo" }, ...]`

### Unidades
| Metodo | Endpoint | Params |
|--------|----------|--------|
| GET | `/Unidade/GetUnidades` | - |

Retorno: `[{ Codigo, Bairro, Cidade, Descricao, Estado }]`

## Mapping API Integracao → Frontend Modulos

| Modulo Frontend | Endpoints Integracao | Status Atual |
|----------------|---------------------|-------------|
| **Notas/Pedagogico** | GetTodasEtapasBoletim, ListarNotasRecentes | VAZIO (usa API REST que nao tem) |
| **Financeiro** | GetFichaFinanceira, GetBoleto | VAZIO |
| **Calendario** | GetCalendario | VAZIO |
| **Comunicacao/Avisos** | GetAvisos, PostMarcarComoLido | VAZIO |
| **Captacao** | GetCampanhas, PostProspectivo, GetSituacoesFunil | VAZIO |
| **Cadastro** | PostPessoa | NAO IMPLEMENTADO |
| **Unidades** | GetUnidades | FUNCIONA (via API REST) |
| **Cursos** | GetCursos | PARCIAL |

## Armadilhas

1. **Datas Microsoft JSON**: `/Date(1543975200000-0200)/` — precisa parser especial
2. **Notas como string**: `"7,8"` (virgula BR, nao ponto) — precisa `parseFloat(nota.replace(",", "."))`
3. **Token IP-bound**: Token so funciona do IP que autenticou
4. **NumeroSerie obrigatorio**: Cada escola tem um numero de serie unico (ex: 6150, 9827)
5. **Formato XML/JSON**: Cliente escolhe via Accept header
6. **Observacao -1**: Significa "sem observacao" (nao e numero negativo)
