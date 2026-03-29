# SophiA Web API - Documentacao Completa (Swagger Real)

**Fonte**: https://portal.sophia.com.br/sophiawebapi/swagger/index.html
**Versao**: SGx API v1
**Data captura**: 2026-03-23
**Total**: 111 endpoints unicos, 153 models, 56 tags
**Arquivo Swagger**: swagger-sophia-v1.json (309KB)

---

## Autenticacao

- **Endpoint**: POST /api/v1/Autenticacao
- **Body**: {"usuario": "parceiro", "senha": "senha"}
- **Config no Sophia**: Configuracoes > Parametros > Gerenciar > aba Web API > Parceiros autenticados
- **Multi-tenant**: Endpoints suportam /{tenant}/api/v1/... para instancias especificas

---

## Catalogo de Endpoints por Tag

### AlunoDigital (1 endpoints)

- POST /api/v1/AlunoDigital/ProcessarWebhook -- ProcessarWebhook

### Alunos (4 endpoints)

- GET /api/v1/Alunos -- Retorna os alunos Query: Nome, TamanhoPagina, Unidades, Periodos, Cursos, Pagina, Inativos, ConsiderarTurmaFinalizada
- POST /api/v1/Alunos/ValidarLogin -- Autentica um usuário com base no e-mail ou Código externo
- GET /api/v1/Alunos/{id} -- Retorna os dados do aluno Query: origemAppMatricula
- PUT /api/v1/Alunos/{id} -- Altera os dados do aluno Query: origemAppMatricula

### Arquivos (1 endpoints)

- GET /api/v1/alunos/{idAluno}/Arquivos -- Retorna os arquivos disponibilizados para o aluno Query: DataInicial, DataFinal, CodigoTurma, CodigoDisciplina, TamanhoPagina, Pagina

### AtaNota (3 endpoints)

- GET /api/v1/AtaNota -- Retorna as ata nota Query: Turma, Disciplina, Etapa, Numero, Codigo
- GET /api/v1/AtaNota/{id}/NotaAlunos -- Retorna as ata aluno
- PUT /api/v1/AtaNota/{id}/NotaAlunos -- Atualiza as ata aluno

### Autenticacao (1 endpoints)

- POST /api/v1/Autenticacao -- Autenticação da API

### AutorizacaoRetirada (2 endpoints)

- GET /api/v1/alunos/{idAluno}/AutorizacaoRetirada -- GetAutorizacaoRetiradaAluno
- PUT /api/v1/alunos/{idAluno}/AutorizacaoRetirada -- PutAutorizacaoRetiradaAluno

### AvaliacaoInstitucional (4 endpoints)

- GET /api/v1/AvaliacaoInstitucional -- ObterAvaliacoesInstitucional Query: codigoFisica
- GET /api/v1/AvaliacaoInstitucional/{codigoAvaliacao}/Usuario/{codigoFisica} -- ObterInformacoesAvaliacao
- POST /api/v1/AvaliacaoInstitucional/{codigoAvaliacao}/Usuario/{codigoFisica} -- GravarRespostasAvaliacao
- GET /api/v1/AvaliacaoInstitucional/{codigoAvaliacao}/Usuario/{codigoFisica}/Questoes -- ObterQuestoesAvaliacao

### Avaliacoes (1 endpoints)

- GET /api/v1/Avaliacoes/tiposAvaliacao -- Retorna os tipos de avaliação

### BancoBrasil (2 endpoints)

- GET /api/v1/BancoBrasil/ProcessarWebhook -- ProcessarWebhook
- POST /api/v1/BancoBrasil/ProcessarWebhook -- ProcessarWebhook

### Boletins (1 endpoints)

- GET /api/v1/alunos/{idAluno}/Boletins -- Get

### Boletos (1 endpoints)

- GET /api/v1/alunos/{idAluno}/Boletos/{codigoBoleto} -- Get

### Campanha (1 endpoints)

- GET /api/v1/rematricula/Campanha -- Get Query: codFisicas

### Catraca (2 endpoints)

- POST /api/v1/Catraca -- Método para inserir movimento do aluno
- GET /api/v1/alunos/{idAluno}/Catraca -- Método para retornar movimentação do aluno Query: dataMovimentacaoInicio, dataMovimentacaoFim

### Clientes (2 endpoints)

- POST /api/v1/clientes -- PostCliente Query: enviarEmail
- POST /api/v1/clientes/{id}/Documentos -- PostDocumentos

### Colaboradores (1 endpoints)

- GET /api/v1/Colaboradores -- Retorna os colaboradores ativos Query: Nome, Email, Apelido, Codigos, Unidades, TamanhoPagina, Pagina

### Configuracoes (3 endpoints)

- GET /api/v1/Configuracoes -- GetConfiguracoes
- GET /api/v1/Configuracoes/MatriculaOnline -- GetMatriculaOnline
- GET /api/v1/Configuracoes/MatriculaOnline/{idUnidade} -- GetMatriculaOnlineDetalhe

### Contratacao (2 endpoints)

- GET /api/v1/rematricula/{idOferta}/Contratacao/{idMatricula} -- GetContratacao Query: url, idAtendimento
- POST /api/v1/rematricula/{idOferta}/Contratacao/{idMatricula} -- PostContratacao Query: url, rematricula

### Contratos (3 endpoints)

- GET /api/v1/prematricula/Contratos/impressao -- ImpressaoContratos Query: srvApp, idPreMatricula, idCampanha, idDocumento, codigoProduto
- GET /api/v1/prematricula/{idPreMatricula}/Contratos -- GetContratos
- PUT /api/v1/prematricula/{idPreMatricula}/Contratos/{idAluno} -- PutContratos Query: url

### Cursos (1 endpoints)

- GET /api/v1/Cursos -- Retorna os cursos Query: Nome, Codigos, TamanhoPagina, Pagina

### DadosCadastrais (1 endpoints)

- GET /api/v1/DadosCadastrais/{idAluno} -- Get

### Disciplinas (2 endpoints)

- GET /api/v1/Disciplinas -- Retorna as disciplinas Query: Nome, Codigos, Setores, TamanhoPagina, Pagina
- GET /api/v1/Disciplinas/{idMatricula} -- Retorna as disciplinas por matrícula Query: Nome, Codigos, Setores, TamanhoPagina, Pagina

### EfiPay (2 endpoints)

- POST /api/v1/EfiPay/ProcessarWebhook -- Realiza chamada do método InformarPagamento no servidor de tarefas
- POST /api/v1/EfiPay/ProcessarWebhook/{idTitulo} -- Realiza chamada do método InformarPagamento no servidor de tarefas

### Empresas (1 endpoints)

- GET /api/v1/Empresas -- Retorna as empresas Query: Descricao, TamanhoPagina, Pagina

### Escolaridades (1 endpoints)

- GET /api/v1/Escolaridades -- Retorna as escolaridades Query: Descricao, TamanhoPagina, Pagina

### EstadosCivis (1 endpoints)

- GET /api/v1/EstadosCivis -- GetEstadosCivis Query: Descricao, TamanhoPagina, Pagina

### FichaSaude (2 endpoints)

- GET /api/v1/alunos/{idAluno}/FichaSaude -- GetFichaSaude
- PUT /api/v1/alunos/{idAluno}/FichaSaude -- PutFichaSaude

### Finalizacao (1 endpoints)

- GET /api/v1/rematricula/{idOferta}/Finalizacao -- GetFinalizacao

### Fotos (7 endpoints)

- GET /api/v1/alunos/{idAluno}/Fotos -- Retorna a foto do aluno
- PUT /api/v1/alunos/{idAluno}/Fotos -- Método para inserir foto do aluno Query: origemAppMatricula
- DELETE /api/v1/alunos/{idAluno}/Fotos -- Deleta a foto do aluno
- GET /api/v1/alunos/{idAluno}/Fotos/FotosReduzida -- Retorna a foto reduzida do aluno
- PUT /api/v1/alunos/{idAluno}/Fotos/FotosReduzida -- Método para inserir foto reduzida do aluno Query: origemAppMatricula
- DELETE /api/v1/alunos/{idAluno}/Fotos/FotosReduzida -- Deleta a foto reduzida do aluno
- GET /api/v1/alunos/{idAluno}/Fotos/FotosReduzida/matricula -- Retorna a foto reduzida do aluno com base na matricula

### FotosResponsaveis (6 endpoints)

- GET /api/v1/responsaveis/{id}/fotos -- GetFotosResponsaveis
- PUT /api/v1/responsaveis/{id}/fotos -- PutFotosResponsaveis
- DELETE /api/v1/responsaveis/{id}/fotos -- DeleteFotosResponsaveis
- GET /api/v1/responsaveis/{id}/fotos/FotoReduzida -- GetFotoReduzidaResponsaveis
- PUT /api/v1/responsaveis/{id}/fotos/FotoReduzida -- PutFotoReduzidaResponsaveis
- DELETE /api/v1/responsaveis/{id}/fotos/FotoReduzida -- DeleteFotoReduzidaResponsaveis

### Gerencianet (2 endpoints)

- POST /api/v1/Gerencianet/ProcessarWebhook -- Realiza chamada do método InformarPagamento no servidor de tarefas
- POST /api/v1/Gerencianet/ProcessarWebhook/{idTitulo} -- Realiza chamada do método InformarPagamento no servidor de tarefas

### Health (1 endpoints)

- GET /api/v1/Health/VersaoAPI -- GetVersaoAPI

### Introducao (1 endpoints)

- GET /api/v1/rematricula/{idOferta}/Introducao -- GetIntroducao

### Itau (3 endpoints)

- POST /api/v1/Itau/ProcessarWebhook/boleto -- ProcessarWebhookBoleto
- POST /api/v1/Itau/ProcessarWebhook/pix -- ProcessarWebhookPix
- POST /api/v1/Itau/oauth/token -- OAuthToken

### Lancamentos (1 endpoints)

- GET /api/v1/alunos/{idAluno}/Lancamentos -- GetLancamentos Query: VisualizarDetalhes

### ListaChamada (5 endpoints)

- PUT /api/v1/ListaChamada/Alunos -- PutListaChamadaAluno
- GET /api/v1/ListaChamada/Alunos/{idListaChamada} -- GetAlunos
- PUT /api/v1/ListaChamada/ListaChamada -- PutListaChamada
- GET /api/v1/ListaChamada/Professor/{idProfessor} -- GetTurmas Query: DataInicial, DataFinal, Status
- GET /api/v1/ListaChamada/{idListaChamada} -- GetListaChamada

### Marketplace (3 endpoints)

- POST /api/v1/Marketplace/ProcessarVendaMarketplace -- Realiza chamada do método ProcessarVendaMarketplace no servidor de tarefas
- POST /api/v1/Marketplace/ProverItensTabs -- Realiza chamada do método ProverItensTabs no servidor de tarefas
- POST /api/v1/Marketplace/ProverTabs -- Realiza chamada do método ProverTabs no servidor de tarefas

### MateriaLecionada (4 endpoints)

- GET /api/v1/MateriaLecionada -- GetAll Query: CodigoPlanejamentoAulaSet, CodigoTurma, CodigoProfessor, DataInicial, DataFinal, MateriaPendente, TarefaPendente, Disciplina, Setor
- PUT /api/v1/MateriaLecionada -- Put
- GET /api/v1/MateriaLecionada/listaChamada/{idListaChamada} -- GetByIdListaChamada Query: CodigoPlanejamentoAulaSet, CodigoTurma, CodigoProfessor, DataInicial, DataFinal, MateriaPendente, TarefaPendente, Disciplina, Setor
- GET /api/v1/MateriaLecionada/{idMatricula} -- Get Query: CodigoPlanejamentoAulaSet, CodigoTurma, CodigoProfessor, DataInicial, DataFinal, MateriaPendente, TarefaPendente, Disciplina, Setor

### Matriculas (8 endpoints)

- GET /api/v1/alunos/Matriculas/{idMatricula} -- GetAlunos
- GET /api/v1/alunos/Matriculas/{idMatricula}/Boletim -- GetBoletim Query: Disciplinas
- GET /api/v1/alunos/Matriculas/{idMatricula}/BoletimImpresso -- GetBoletimImpresso
- GET /api/v1/alunos/Matriculas/{idMatricula}/FrequenciaCompleto -- GetFrequencia Query: Matricula, Disciplina, Etapa
- GET /api/v1/alunos/Matriculas/{idMatricula}/NotasAvaliacoes -- GetNotasAvaliacoes Query: Disciplinas, NumeroEtapa, FiltrarEtapa
- GET /api/v1/alunos/Matriculas/{idMatricula}/NotasAvaliacoesCompleto -- GetNotasAvaliacoesPorEtapasDisciplinas Query: Disciplinas, NumeroEtapa, FiltrarEtapa
- GET /api/v1/alunos/{idAluno}/Matriculas -- GetMatriculas Query: Periodos, Cursos, Turmas, Unidades, Situacao
- POST /api/v1/alunos/{idAluno}/Matriculas -- PostMatriculas

### Nacionalidades (1 endpoints)

- GET /api/v1/Nacionalidades -- Retorna as nacionalidades Query: Descricao, TamanhoPagina, Pagina

### Ocorrencias (2 endpoints)

- GET /api/v1/alunos/{idAluno}/Ocorrencias -- GetOcorrencias Query: DataInicial, DataFinal, Interna
- GET /api/v1/tipo/Ocorrencias -- GetTiposOcorrencias Query: Frequencia

### Ocupacoes (1 endpoints)

- GET /api/v1/Ocupacoes -- Retorna as ocupações Query: Descricao, TamanhoPagina, Pagina

### Paises (1 endpoints)

- GET /api/v1/Paises -- Retorna os países Query: Descricao, TamanhoPagina, Pagina

### Parentescos (1 endpoints)

- GET /api/v1/Parentescos -- Retorna os parentescos Query: Descricao, TiposParentesco, TamanhoPagina, Pagina

### Periodos (1 endpoints)

- GET /api/v1/Periodos -- Retorna os períodos letivos Query: Nome, Codigos, TamanhoPagina, Pagina

### Processo (1 endpoints)

- GET /api/v1/rematricula/{idOferta}/Processo -- GetProcesso Query: preMatriculado

### ProcessoSeletivo (1 endpoints)

- POST /api/v1/ProcessoSeletivo/inscricao -- PostInscricao

### QuadrosHorarios (3 endpoints)

- GET /api/v1/alunos/matricula/{matriculaAluno}/QuadrosHorarios/Detalhados -- GetDetalhadoRedirecionamento
- GET /api/v1/alunos/matriculas/{idMatricula}/QuadrosHorarios/Detalhados -- GetDetalhado
- GET /api/v1/alunos/{idAluno}/QuadrosHorarios -- Get

### Racas (1 endpoints)

- GET /api/v1/Racas -- GetRacas Query: Descricao, TamanhoPagina, Pagina

### Religioes (1 endpoints)

- GET /api/v1/Religioes -- Retorna as religiões Query: Descricao, TamanhoPagina, Pagina

### RematriculaCurricular (14 endpoints)

- POST /api/v1/RematriculaCurricular/AceitarContrato -- AceitarContrato
- GET /api/v1/RematriculaCurricular/Boletos -- ObterDadosBoleto Query: codigoPreMatricula, codigoFisica
- POST /api/v1/RematriculaCurricular/ConfirmarPreMatricula -- ConfirmarPreMatricula
- GET /api/v1/RematriculaCurricular/DadosIniciais -- ObterDadosIniciais Query: codigoFisica, codigoConcurso, matriculaAtual
- GET /api/v1/RematriculaCurricular/DadosRematricula -- GetDadosRematriculaCurricular Query: codigoOfertaServico
- GET /api/v1/RematriculaCurricular/Disciplinas -- ObterDisciplinas Query: CodigoMatricula, CodigoOfertaServico, CodigoCurso, CodigoCurriculo, CodigoSerie, CodigoPeriodo, CodigoTurma, CodigoTurno
- GET /api/v1/RematriculaCurricular/Documentos -- ObterDocumentos Query: codigoCurso, codigoSerie, codigoCurriculo, codigoFisica
- GET /api/v1/RematriculaCurricular/DocumentosPendentes -- ObterDocumentosPendentes Query: codigoCurso, codigoFisica
- GET /api/v1/RematriculaCurricular/Matriculas -- GetMatriculas Query: codigoFisica
- GET /api/v1/RematriculaCurricular/Permissoes -- GetPermissoesCampos
- GET /api/v1/RematriculaCurricular/PlanosPagamentos -- ObterPlanosPagemento Query: codigoFisica, codigoMatricula, codigoOpcao
- GET /api/v1/RematriculaCurricular/Relatorio -- ImprimirRelatorio Query: IdPreMatricula, IdUnidade, IdPeriodo, IdDocumento, IdOrigem
- GET /api/v1/RematriculaCurricular/Responsaveis -- ObterResponsaveis Query: codigoFisica, codigoOfertaServico
- POST /api/v1/RematriculaCurricular/VerificarHorario -- VerificarHorario

### Responsaveis (1 endpoints)

- GET /api/v1/Responsaveis/{id} -- GetResponsaveis

### ResponsaveisAluno (5 endpoints)

- GET /api/v1/alunos/{idAluno}/responsaveis -- GetResponsaveis
- POST /api/v1/alunos/{idAluno}/responsaveis -- PostResponsaveis
- PUT /api/v1/alunos/{idAluno}/responsaveis/{idResponsavel} -- PutResponsaveis
- PUT /api/v1/alunos/{idAluno}/responsavelFinanceiro -- PutResponsavelFinanceiro
- PUT /api/v1/alunos/{idAluno}/responsavelPedagogico -- PutResponsavelPedagogico

### ResumoContratacao (1 endpoints)

- POST /api/v1/rematricula/{idOferta}/ResumoContratacao/{idMatricula} -- PostResumoContratacao Query: url, rematricula

### Santander (2 endpoints)

- GET /api/v1/Santander/ProcessarWebhook -- ProcessarWebhook
- POST /api/v1/Santander/ProcessarWebhook -- ProcessarWebhook

### Turmas (2 endpoints)

- GET /api/v1/Turmas -- Retorna as turmas Query: Situacoes, Nome, Codigos, Cursos, Unidades, Periodos, NomeResumido, TamanhoPagina, Pagina, Turnos, Series
- GET /api/v1/Turmas/detalhada/{codigoTurma} -- GetTurmaDetalhada

### Unidades (2 endpoints)

- GET /api/v1/Unidades -- Retorna as unidades ativas Query: Nome, TamanhoPagina, Pagina
- GET /api/v1/Unidades/{idUnidade}/logotipo -- ObterLogo

---

## Models Principais

### ProblemDetails (5 campos)

- detail: string 
- instance: string 
- status: integer(int32) 
- title: string 
- type: string 

### CatracaDetalhesApi (5 campos)

- coletor: string 
- identificacao: string 
- momento: string(date-time) 
- movimento: string 
- observacao: string 

### FrequenciaAulaApi (5 campos)

- alunos: array 
- codigoListaChamada: integer(int32) * 
- codigoProfessor: integer(int32) 
- quantidadeAula: integer(int32) 
- status: integer(int32) * 

### ListaChamadaAulaAlunoApi (4 campos)

- codigoListaChamadaAula: integer(int64) * 
- codigoMatricula: integer(int64) * 
- falta: integer(int32) * 
- ocorrencias: array 

### OcorrenciaAlunoInputApi (9 campos)

- aula: integer(int32) 
- codigoAluno: integer(int32) * 
- codigoDisciplina: integer(int32) 
- codigoOcorrencia: integer(int32) * 
- dataOcorrencia: string(date-time) * 
- idOcorrencia: integer(int32) * 
- numeroAula: integer(int32) * 
- observacao: string 
- status: integer(int32) * 

### AceitarContratoCurricularDadosAssinatura (4 campos)

- CPF: string 
- CodigoPreMatricula: integer(int32) 
- IP: string 
- Nome: string 

### DadosDisciplinaRematriculaCurricular (3 campos)

- disciplina: integer(int32) 
- tipo: integer(int32) 
- turma: integer(int32) 

### VerificarHorarioRematriculaCurricular (4 campos)

- codigoFisica: integer(int32) 
- codigoMatricula: integer(int32) 
- codigoOpcao: integer(int32) 
- disciplinas: array 

### AlunoAgendaEduApiModelRetorno (14 campos)

- codigo: integer(int64) * Código do aluno
- codigoAgendaEdu: string Código de integração com Agenda Edu
- codigoExterno: string * Código externo do aluno
- codigoParceiro: string Código parceiro
- contaOffice365: string Conta do Office 365 do aluno
- dataNascimento: string(date-time) Data de nascimento do aluno
- email: string E-mail do aluno
- nome: string * Nome do aluno
- responsaveis: array 
- rgEscolar: string RA/RG Escolar
- sexo: string * Sexo do aluno ('M' ou 'F')
- telefone: string Telefone do aluno
- turmas: array Turmas que o aluno possui matrícula
- turmasMono: array Turmas monodisciplinares que o aluno possui

### ResponsavelAlunoApiModel (15 campos)

- codigo: string * Código do responsável
- codigoAgendaEdu: string * Código do responsável
- codigoAntigo: integer(int64) * Código do responsável
- codigoFamilia: string * Código da família
- codigoFamiliaObsoleto: string Código da família obsoleto
- codigoParceiro: string Codigo parceiro
- cpf: string CPF do responsável
- dataEmissaoCin: string(date-time) Data de emissão do CIN
- email: string E-mail do responsável
- nome: string * Nome do responsável
- responsavelFinanceiro: boolean * Responsável financeiro
- responsavelPedagogico: boolean * Responsável pedagógico
- retiradaAutorizada: boolean 
- telefone: string Telefone do responsável
- tipoVinculo: ParentescoApiModel * Tipo de vínculo com o aluno

### AlunoApiModelRetorno (13 campos)

- codigo: integer(int64) * Código do aluno
- codigoExterno: string * Código externo do aluno
- codigoParceiro: string Código parceiro
- contaOffice365: string Conta do Office 365 do aluno
- dataNascimento: string(date-time) Data de nascimento do aluno
- email: string E-mail do aluno
- nome: string * Nome do aluno
- responsaveis: array 
- rgEscolar: string RA/RG Escolar
- sexo: string * Sexo do aluno ('M' ou 'F')
- telefone: string Telefone do aluno
- turmas: array Turmas que o aluno possui matrícula
- turmasMono: array Turmas monodisciplinares que o aluno possui

### AlunoDetalheApiModel (33 campos)

- bairro: BairroApiModel Bairro do aluno
- cep: string CEP do aluno
- certidaoNascimento: string Certidão de nascimento do aluno
- cidade: CidadeApiModel Cidade do aluno
- codigo: integer(int64) * Código do aluno
- codigoExterno: string Código externo do aluno
- complemento: string Complemento do endereço do aluno
- contaOffice365: string Office 365 do aluno
- contatos: array Contatos do aluno (Telefone fixo, celular, e-mail)
- cpf: string CPF do aluno
- dataEmissaoCin: string(date-time) Data de emissão do CIN do aluno
- dataExpedicaoPassaporte: string(date-time) Data de expedição do passaporte do aluno
- dataExpedicaoRg: string(date-time) Data de expedição do RG do aluno
- dataNascimento: string(date-time) Data de nascimento do aluno
- dataValidadePassaporte: string(date-time) Data de validade do passaporte do aluno
- estadoCivil: EstadoCivilApiModel Estado civil do aluno
- localNascimento: CidadeApiModel Local de nascimento do aluno
- logradouro: string Logradouro do aluno
- nacionalidade: NacionalidadeApiModel Nacionalidade do aluno
- nome: string * Nome do aluno
- nomeSocial: string Nome social do aluno
- numeroLogradouro: string Número do logradouro do aluno
- numeroPassaporte: string Número do passaporte do aluno
- orgaoExpedidorRg: string Órgão expedidor do RG do aluno
- paisExpedidorPassaporte: PaisApiModel País expedidor do passaporte do aluno
- raca: RacaApiModel Raça/cor do aluno
- religiao: ReligiaoApiModel Religião do aluno
- rg: string RG do aluno
- rgEscolar: string RA/RG Escolar
- sexo: string * Sexo do aluno ('M' ou 'F')
- uf: string UF do aluno
- ufLocalNascimento: string UF do local de nascimento do aluno
- utilizaNomeSocial: boolean Aluno utiliza nome social

### ArquivoModelRetorno (8 campos)

- bytes: integer(int32) 
- codigo: integer(int32) 
- data: string(date-time) 
- descricao: string 
- endereco: string 
- proprietario: FisicaDescricaoApiModelRetorno 
- publico: boolean 
- turmasDisciplinas: array 

### AutenticacaoAlunoApiModel (3 campos)

- codigo: string Código externo
- email: string E-mail a ser validado
- senha: string Senha correspondente ao e-mail ou Código externo

### AutenticacaoAlunoApiModelRetorno (7 campos)

- acessoValido: boolean Acesso valido
- codigoExterno: string Código externo
- codigoInterno: string Código interno
- msgRetorno: string Mensagem de possíveis erros de acesso
- responsavelFinanceiro: boolean Valida se possui perfil de responsável financeiro
- responsavelPedagogico: boolean Valida se possui perfil de responsável pedagógico
- tipoAcesso: string Acesso realizado por:

### AutorizacaoRetiradaAlunoApiModel (8 campos)

- aguardarForaEscola: boolean 
- autorizarSaidaTerminoAtividadeExtra: boolean 
- autorizarSaidaTerminoHorarioRegular: boolean 
- deixarEscolaAcompanhado: boolean 
- deixarEscolaConducaoEscolar: boolean 
- deixarEscolaSozinho: boolean 
- outrasPessoas: array 
- responsaveisAutorizados: array 

### FichaSaudeAlunoApiModel (99 campos)

- acompanhamento: string 
- alergiaAlimentos: string 
- alergicoMedicamento: boolean 
- andou: integer(int32) 
- asma: boolean 
- bronquite: boolean 
- catapora: boolean 
- caxumba: boolean 
- consomeFormulaLactea: integer(int32) TipoInformacaoGenerico (-1 - Indeifinido, 0 - Não, 1 - Sim, 
- consomeFormulaLacteaDescricao: string 
- contatosMedicoContatar: array 
- coqueluxe: boolean 
- covid19GrupoRisco: boolean 
- covid19Observacoes: string 
- covid19Teve: boolean 
- covid19Vacinado: boolean 
- dataInicioDoencaCronica: string(date-time) 
- dependenciaInsulina: boolean 
- diabete: boolean 
- doencaCeliaca: boolean 
- doencaCongenita: string 
- doencaContagiosa: string 
- doencaCronica: string 
- doseMedicamentoDorCabeca: string 
- doseMedicamentoFebre: string 
- enderecoHospitalClinica: string 
- enderecoMedicoContatar: string 
- engatinhou: integer(int32) 
- epilepsia: boolean 
- escarlatina: boolean 
- estaturaAoNascer: number(double) 
- falou: integer(int32) 
- fazUsoMedicamento: boolean 
- firmouPescoco: integer(int32) 
- fonoaudiologico: boolean 
- formaDeAlimentar: string 
- habitoSono: string 
- hemofilia: boolean 
- hepatite: boolean 
- hipertensao: boolean 
- historicoDoencaFamilia: boolean 
- historicoDoencaFamiliaDesc: string 
- introduziuAlimentacaoComplementar: integer(int32) TipoInformacaoGenerico (-1 - Indeifinido, 0 - Não, 1 - Sim, 
- introduziuAlimentacaoComplementarMeses: string 
- maternidadeJuntoAMae: integer(int32) TipoInformacaoGenerico (-1 - Indeifinido, 0 - Não, 1 - Sim, 
- maternidadeObservacoes: string 
- medicacao: integer(int32) 
- medicamento: string 
- medicamentoAlergico: string 
- medicamentoDorCabeca: string 
- medicamentoFebre: string 
- meningite: boolean 
- nascimentoATermo: boolean 
- nascimentoCesaria: boolean 
- nascimentoForceps: boolean 
- nascimentoNormal: boolean 
- nascimentoPrematuro: boolean 
- necessidadeAuditiva: boolean 
- necessidadeEspecial: string 
- necessidadeFala: boolean 
- necessidadeFisica: boolean 
- necessidadeVisual: boolean 
- neurologico: boolean 
- nomeHospitalClinica: string 
- nomeMedicoContatar: string 
- nomeResponsavel: string 
- numeroPlanoSaude: string 
- outraDoencaContagiosa: boolean 
- outraDoencaCronica: boolean 
- outraNecessidade: boolean 
- outrasAlergias: string 
- outroAcompanhamento: boolean 
- parentesContatar: array 
- pesoAoNascer: number(double) 
- planoSaude: string 
- possivelCuidado: string 
- possuiAlergiaAlimentos: boolean 
- possuiDoencaCongenita: boolean 
- possuiOutrasAlergias: boolean 
- preferenciasAlimentares: string 
- psicologico: boolean 
- psicopedagogico: boolean 
- recebeuLeiteMaterno: integer(int32) TipoInformacaoGenerico (-1 - Indeifinido, 0 - Não, 1 - Sim, 
- recebeuLeiteMaternoTempo: string 
- registroSus: string 
- restricaoAlimentar: string 
- reumatismo: boolean 
- rinite: boolean 
- rubeola: boolean 
- sarampo: boolean 
- sentou: integer(int32) 
- suplementoVitaminico: integer(int32) TipoInformacaoGenerico (-1 - Indeifinido, 0 - Não, 1 - Sim, 
- suplementoVitaminicoDesc: string 
- telefoneHospitalClinica: string 
- terapiaOcupacional: boolean 
- tipoSanguineo: string Tipo sanguíneo
- transtorno: integer(int32) TipoInformacaoGenerico (-1 - Indeifinido, 0 - Não, 1 - Sim, 
- transtornoObs: string 
- tratamentoMedico: string 

### FichaSaudeParenteContatarApiModel (4 campos)

- contatos: array 
- nome: string 
- parentesco: ParentescoApiModel 
- rg: string 

### LancamentoAlunoApiModelRetorno (18 campos)

- boletoDisponivel: boolean * Se o boleto está disponível para impressão ou não
- codigo: integer(int64) * Código do lançamento
- codigoBoleto: integer(int32) Código do boleto, utilizado para impressão do boleto através
- codigoPix: string Pix copia e cola do boleto, quando integrado com a plataform
- competencia: string Competência
- dataPagamento: string Data do pagamento do lançamento
- dataVencimento: string * Data de vencimento do lançamento
- descricao: string * Descrição do lançamento
- detalhes: array Detalhes
- linhaDigitavel: string Linha digitável do boleto
- numeroBoleto: integer(int32) Número do boleto
- numeroLancamento: integer(int64) * Número do lançamento
- recebido: integer(int32) * 0 - Não recebido; 1 - Recebido; 2 - Baixado;
- responsavelFinanceiro: string * Nome do responsável financeiro do lançamento
- titular: string Titular
- urlBoletoDigital: string Link de acesso ao boleto, quando integrado com a plataformas
- valorPrevisto: number(double) * Valor previsto de recebimento
- valorRecebido: number(double) Valor recebido

### LancamentoDetalheAlunoApiModel (5 campos)

- classificacao: string 
- nomeItem: string 
- tipo: string 
- valor: number(double) 
- venda: string 

### OcorrenciaAlunoApiModelRetorno (7 campos)

- codigoExternoDisciplina: string Codigo da disciplina
- dataOcorrencia: string(date-time) Data da ocorrência
- disciplina: string Disciplina
- interna: boolean Ocorrência interna
- observacao: string Observação
- ocorrencia: string Ocorrência
- professor: string Nome do professor

### OutraPessoaRetiradaAlunoApiModel (4 campos)

- contato: string 
- nome: string 
- rg: string 
- tipoVinculo: ParentescoApiModel * Tipo de vínculo com o aluno

### ResponsavelAlunoApiModel (13 campos)

- codigo: integer(int64) * Código do responsável
- codigoFamilia: string * Código da família
- codigoFamiliaObsoleto: string Código da família obsoleto
- codigoParceiro: string Codigo parceiro
- cpf: string CPF do responsável
- dataEmissaoCin: string(date-time) Data de emissão do CIN
- email: string E-mail do responsável
- nome: string * Nome do responsável
- responsavelFinanceiro: boolean * Responsável financeiro
- responsavelPedagogico: boolean * Responsável pedagógico
- retiradaAutorizada: boolean 
- telefone: string Telefone do responsável
- tipoVinculo: ParentescoApiModel * Tipo de vínculo com o aluno

### ResponsavelAlunoDetalheApiModel (37 campos)

- bairro: BairroApiModel Bairro do responsável
- bairroComercial: BairroApiModel Bairro comercial do responsável
- cep: string CEP do responsável
- cepComercial: string CEP comercial do responsável
- cidade: CidadeApiModel Cidade do responsável
- cidadeComercial: CidadeApiModel Cidade comercial do responsável
- codigo: integer(int64) * Código do responsável
- complemento: string Complemento do endereço do responsável
- complementoComercial: string Complemento do endereço comercial do responsável
- contatos: array Contatos do responsável
- contatosComercial: array Contatos comerciais do responsável
- cpf: string CPF do responsável
- dataEmissaoCin: string(date-time) Data de emissão do CIN do responsavel
- dataExpedicaoRg: string(date-time) Data de expedição do RG do responsável
- dataNascimento: string(date-time) Ddata de nascimento do responsável
- empresa: EmpresaApiModel Empresa que responsável trabalha
- enderecoIgualDoAluno: boolean CEP do responsável
- escolaridade: EscolaridadeApiModel Escolaridade do responsável
- estadoCivil: EstadoCivilApiModel Estado civil do responsável
- falecido: boolean Se responsável é falecido
- inscricaoMunicipal: string Inscricao municipal
- logradouro: string Logradouro do responsável
- logradouroComercial: string Logradouro comercial do responsável
- nacionalidade: NacionalidadeApiModel Nacionalidade do responsável
- nome: string * Nome do responsável
- numeroLogradouro: string Número do logradouro do responsável
- numeroLogradouroComercial: string Número do logradouro comercial do responsável
- ocupacao: OcupacaoApiModel Ocupação do responsável
- orgaoExpedidorRg: string Órgão expedidor do RG do responsável
- religiao: ReligiaoApiModel Religião do responsável
- renda: number(double) Renda do responsável
- rg: string RG do responsável
- sexo: string * Sexo do responsável ('M' ou 'F')
- tipoVinculo: ParentescoApiModel * Tipo de vínculo com o aluno
- trabalha: boolean Se responsável trabalha
- uf: string UF do responsável
- ufComercial: string UF comercial do responsável

### RespostaAvaliacaoInstitucionalModelEntrada (4 campos)

- codigoResposta: integer(int32) 
- comentario: string 
- respostaAberta: string 
- respostasFechadas: array 

### RespostaBaseAvaliacaoInstitucionalModelEntrada (3 campos)

- identificaAvaliador: boolean 
- respostas: array 
- respostasComplementares: array 

### RespostaComplementarAvaliacaoInstitucionalModelEntrada (4 campos)

- codigoAlternativa: integer(int32) 
- codigoAlternativaComplementarResposta: integer(int32) 
- codigoResposta: integer(int32) 
- codigoRespostaComplementar: integer(int32) 

### ClienteApiModel (35 campos)

- anoConclusaoEscolaAnterior: integer(int32) Ano de conclusão da escola anterior
- bairro: ClienteCodigoDescricaoApiModel Bairro do cliente
- camposLivre: array Campos livre do cliente
- cep: string CEP do cliente
- cidade: ClienteCodigoDescricaoApiModel Cidade do cliente
- complemento: string Complemento do endereço do cliente
- contatos: array Contatos do cliente
- cpf: string CPF do cliente
- dataEmissaoCin: string(date-time) Data de emissao do CIN
- dataExpedicaoRg: string(date-time) Data de expedição do RG do aluno
- dataNascimento: string(date-time) Data de nascimento do cliente
- escolaAnterior: ClienteCodigoDescricaoApiModel Escola anterior
- estadoCivil: ClienteCodigoDescricaoApiModel Estado civil do aluno
- interesse: ClienteInteresseApiModel Interesse
- localNascimento: ClienteCodigoDescricaoApiModel Local de nascimento do aluno
- logradouro: string Logradouro do cliente
- nacionalidade: ClienteCodigoDescricaoApiModel Nacionalidade do aluno
- necessidadeAuditiva: boolean Necessidade auditiva do responsável
- necessidadeFala: boolean Necessidade de fala do responsável
- necessidadeFisica: boolean Necessidade física do responsável
- necessidadeVisual: boolean Necessidade visual do responsável
- necessidadesEspeciais: string Necessidades especiais
- nome: string * Nome do cliente
- nomeSocial: string Nome social do cliente
- numeroLogradouro: string Número do logradouro do cliente
- observacao: string Observação
- raca: string Raça/cor do aluno
- responsavel: ClienteResponsavelApiModel Responsável
- rg: string RG do cliente
- rgOrgaoExpedidor: string Órgão expedidor do RG do cliente
- rgUfOrgaoExpedidor: string UF do órgão expedidor do RG do cliente
- sexo: string * Sexo do cliente ('M' ou 'F')
- tipoContato: integer(int32) Tipo de contato
- uf: string UF do cliente
- ufLocalNascimento: string UF do local de nascimento do aluno

### ClienteInteresseApiModel (7 campos)

- curso: ClienteInteresseCursoApiModel * Curso de interesse
- escolaAnterior: ClienteCodigoDescricaoApiModel Escola anterior
- midia: ClienteCodigoDescricaoApiModel * Mídia
- periodo: ClienteCodigoDescricaoApiModel * Período de interesse
- serie: ClienteCodigoDescricaoApiModel * Série de interesse
- turno: ClienteCodigoDescricaoApiModel * Turno de interesse
- unidade: ClienteCodigoDescricaoApiModel * Unidade de interesse

### ClienteInteresseCursoApiModel (3 campos)

- codigo: integer(int32) 
- curriculo: integer(int32) 
- descricao: string 

### ClienteResponsavelApiModel (37 campos)

- bairro: ClienteCodigoDescricaoApiModel Bairro do responsável
- bairroComercial: ClienteCodigoDescricaoApiModel Bairro comercial do responsável
- cep: string CEP do responsável
- cepComercial: string CEP comercial do responsável
- cidade: ClienteCodigoDescricaoApiModel Cidade do responsável
- cidadeComercial: ClienteCodigoDescricaoApiModel Cidade comercial do responsável
- codigo: integer(int64) * Código do responsável
- complemento: string Complemento do endereço do responsável
- complementoComercial: string Complemento do endereço comercial do responsável
- contatos: array Contatos do responsável
- contatosComercial: array Contatos comerciais do responsável
- cpf: string CPF do responsável
- dataEmissaoCin: string(date-time) Data de emissão do CIN do responsavel
- dataExpedicaoRg: string(date-time) Data de expedição do RG do responsável
- dataNascimento: string(date-time) Ddata de nascimento do responsável
- empresa: ClienteCodigoDescricaoApiModel Empresa que responsável trabalha
- enderecoIgualDoAluno: boolean CEP do responsável
- escolaridade: ClienteCodigoDescricaoApiModel Escolaridade do responsável
- estadoCivil: ClienteCodigoDescricaoApiModel Estado civil do responsável
- falecido: boolean Se responsável é falecido
- inscricaoMunicipal: string Inscricao municipal
- logradouro: string Logradouro do responsável
- logradouroComercial: string Logradouro comercial do responsável
- nacionalidade: ClienteCodigoDescricaoApiModel Nacionalidade do responsável
- nome: string * Nome do responsável
- numeroLogradouro: string Número do logradouro do responsável
- numeroLogradouroComercial: string Número do logradouro comercial do responsável
- ocupacao: ClienteCodigoDescricaoApiModel Ocupação do responsável
- orgaoExpedidorRg: string Órgão expedidor do RG do responsável
- religiao: ClienteCodigoDescricaoApiModel Religião do responsável
- renda: number(double) Renda do responsável
- rg: string RG do responsável
- sexo: string * Sexo do responsável ('M' ou 'F')
- tipoVinculo: ParentescoApiModel * Tipo de vínculo com o aluno
- trabalha: boolean Se responsável trabalha
- uf: string UF do responsável
- ufComercial: string UF comercial do responsável

### DocumentoClienteApiModel (3 campos)

- descricao: string * Descrição do documento
- extensao: string * Extensão do documento para download
- url: string * URL do documento para download

### ColaboradorApiModelRetorno (11 campos)

- apelido: string Apelido do colaborador
- codigo: integer(int64) * Código do colaborador
- codigoExterno: string Codigo externo do colaborador
- contaOffice365: string Conta do Office365 do colaborador
- cpf: string CPF do colaborador
- dataNascimento: string(date-time) Data de nascimento do colaborador
- email: string E-mail do colaborador
- emailCorporativo: string E-mail corporativo do colaborador
- leciona: boolean * Colaborador leciona
- nome: string * Nome do colaborador
- sexo: string * Sexo do colaborador('M' ou 'F')

### ConfiguracaoMatriculaOnlineApiModelRetorno (4 campos)

- configuracao: MatriculaOnlineApiModel Configurações da matrícula online
- escolaAnterior: array Lista de escolas anteriores
- midia: array Lista de mídias
- parentesco: array Lista de parentescos

### CursoAdicionalApiModel (4 campos)

- codigo: integer(int32) 
- nome: string 
- obrigatorio: boolean 
- turnos: array 

### CursoApiModel (4 campos)

- codigo: integer(int32) 
- formaApresentacaoValores: integer(int32) 
- nome: string 
- turnos: array 

### CursoEfetivacaoContratacaoApiModel (5 campos)

- codigo: integer(int32) 
- codigoTurno: integer(int32) 
- financeiroMatricula: FinanceiroEfetivacaoContratacaoApiModel 
- financeiroMensalidade: FinanceiroEfetivacaoContratacaoApiModel 
- obrigatorio: boolean 

### DemaisVencimentoApiModel (5 campos)

- codigo: integer(int32) 
- descricao: string 
- dia: integer(int32) 
- padrao: boolean 
- util: boolean 

### DescontoApiModel (9 campos)

- aplicavelNaMatricula: boolean 
- aplicavelNaMensalidade: boolean 
- codigo: integer(int32) 
- complemento: string 
- descricao: string 
- descricaoResumida: string 
- tipoValor: integer(int32) 
- validoCondPgtoPersonalizavel: boolean 
- valor: number(float) 

### EfetivacaoContratacaoApiModel (5 campos)

- codigoPreMatricula: integer(int32) 
- cursoRegular: CursoEfetivacaoContratacaoApiModel 
- cursosAdicionais: array 
- produtos: array 
- servicos: array 

### FinanceiroApiModel (5 campos)

- demaisVencimentos: array 
- formasPagamentos: array 
- primeiroVencimento: string(date-time) 
- termoExibicao: string 
- vencimentoAVista: string(date-time) 

### FinanceiroEfetivacaoContratacaoApiModel (8 campos)

- codigoFormaPagamento: integer(int32) 
- demaisParcelasPersonalizacao: integer(int32) 
- diaDemaisVencimento: integer(int32) 
- diaUtilDemaisVencimento: boolean 
- formaPagamento: FormaPagamentoApiModel 
- primeiroVencimento: string(date-time) 
- valorPrimeiraParcelaPersonalizacao: number(double) 
- vencimentoAVista: string(date-time) 

### FinanceiroMatriculaAtualApiModel (4 campos)

- demaisVencimentos: DemaisVencimentoApiModel 
- formaPagamento: FormaPagamentoApiModel 
- primeiroVencimento: string(date-time) 
- termoExibicao: string 

### FormaPagamentoApiModel (13 campos)

- codigo: integer(int32) 
- condicaoPersonalizavel: boolean 
- data1VectoRematric: string(date-time) 
- demaisVectoRematric: array 
- descricao: string 
- descricaoResumo: string 
- ignorarCobrancaMatricula: boolean 
- limite1VectoRematric: string(date-time) 
- numeroParcela: integer(int32) 
- personalizacao: PersonalizacaoFormaPagamentoApiModel 
- valor: number(double) 
- valorResumo: number(double) 
- vectoDiasAposRematric: integer(int32) 

### MatriculaApiModel (4 campos)

- financeiroMatricula: FinanceiroMatriculaAtualApiModel 
- financeiroMensalidade: FinanceiroMatriculaAtualApiModel 
- nomeCurso: string 
- nomeTurno: string 

### PersonalizacaoFormaPagamentoApiModel (3 campos)

- observacoes: string 
- percentualMinimoEntrada: number(double) 
- qtdMaximaDemaisParcelas: integer(int32) 

### ProdutoApiModel (6 campos)

- codigo: integer(int32) 
- descontos: array 
- financeiroMatricula: FinanceiroApiModel 
- financeiroMensalidade: FinanceiroApiModel 
- nome: string 
- obrigatorio: boolean 

### ProdutoEfetivacaoContratacaoApiModel (5 campos)

- codigo: integer(int32) 
- financeiroMatricula: FinanceiroEfetivacaoContratacaoApiModel 
- financeiroMensalidade: FinanceiroEfetivacaoContratacaoApiModel 
- obrigatorio: boolean 
- quantidade: integer(int32) 

### ServicoApiModel (6 campos)

- codigo: integer(int32) 
- descontos: array 
- financeiroMatricula: FinanceiroApiModel 
- financeiroMensalidade: FinanceiroApiModel 
- nome: string 
- obrigatorio: boolean 

### ServicoEfetivacaoContratacaoApiModel (4 campos)

- codigo: integer(int32) 
- financeiroMatricula: FinanceiroEfetivacaoContratacaoApiModel 
- financeiroMensalidade: FinanceiroEfetivacaoContratacaoApiModel 
- obrigatorio: boolean 

### TurnoApiModel (8 campos)

- codigo: integer(int32) 
- cursosAdicionais: array 
- descontos: array 
- financeiroMatricula: FinanceiroApiModel 
- financeiroMensalidade: FinanceiroApiModel 
- nome: string 
- produtos: array 
- servicos: array 

### TurnoSimplificadoApiModel (5 campos)

- codigo: integer(int32) 
- descontos: array 
- financeiroMatricula: FinanceiroApiModel 
- financeiroMensalidade: FinanceiroApiModel 
- nome: string 

### ContratoApiModel (9 campos)

- aceite: boolean 
- codigo: integer(int32) * 
- codigoPreMatricula: integer(int32) 
- codigoProduto: integer(int32) 
- descricao: string * 
- mensagemAssinaturaDigital: string 
- possuiAceite: boolean * 
- possuiAssinaturaDigital: boolean * 
- urlContrato: string * 

### CursoApiModelRetorno (3 campos)

- codigo: integer(int32) * Código do curso
- nome: string * Nome do curso
- nomeResumido: string * Nome resumido do curso

### CursoDescricaoApiModelRetorno (3 campos)

- codigo: integer(int64) * Código do curso
- descricao: string * Descrição do curso
- tipoCurso: string * Tipo do curso

### DisciplinaApiModelRetorno (4 campos)

- avaliacoes: array Avaliacoes da disciplina ou setor
- codigo: integer(int32) * Código da disciplina
- codigoSetor: integer(int32) Código do setor
- nome: string * Nome da disciplina ou setor

### DisciplinaMatriculaApiModelRetorno (7 campos)

- codigoDisciplina: integer(int32) * Código da disciplina
- codigoSetor: integer(int32) Codigo Setor
- disciplina: string * Nome da disciplina
- disciplinaResumida: string Nome da disciplina resumido
- grupo: string Nome Grupo
- setor: string Nome Setor
- turma: string Nome Turma

### EducbankApiModel (3 campos)

- externalId: string 
- invoiceId: string 
- status: string 

### FrequenciaTurmasModelRetorno (19 campos)

- bloco: string Bloco
- codigoDisciplina: integer(int32) Código da disciplina
- codigoLista: integer(int32) Código da lista
- codigoListaAula: string Código da lista de chamada da aula
- codigoTurma: integer(int32) Código da turma
- codigoUnidade: integer(int32) Código da unidade
- dataListaChamada: string Data da lista de chamada
- disciplina: string Disciplina
- disciplinaResumida: string Disciplina Resumida
- horaFinal: string Hora final
- horaInicio: string Hora inicio
- materiaLecionada: boolean Se a materia lecionada é obrigatoria
- sala: string Sala
- setor: string Setor
- status: string Situação da lista de chamada
- subTurmas: string SubTurmas
- tipoLista: string Tipo lista
- turma: string Turma
- unidade: string Unidade

### FrequenciasApiModelRetorno (6 campos)

- abono: integer(int32) Abono
- aulasDadas: integer(int32) Carga horária
- cargaHoraria: number(double) Carga Horária
- faltas: integer(int32) Faltas
- percentualPresenca: number(double) Percentual de presença
- tipoLista: integer(int32) Tipo Lista

### FrequenciasBaseApiModelRetorno (3 campos)

- aulasDadas: integer(int32) Carga horária
- faltas: integer(int32) Faltas
- percentualPresenca: number(double) Percentual de presença

### FrequenciasChamadaApiModelRetorno (11 campos)

- data: string(date-time) Data
- disciplina: string Disciplina
- disciplinaResumido: string Disciplina Resumido
- etapa: string Etapa
- faltas: integer(int32) Tipo frequência
- horarioFim: string Horários Fim
- horarioInicio: string Horário de início
- mes: string Mes
- setor: string Setor
- setorResumido: string Setor Resumido
- tipoLista: integer(int32) Tipo Lista

### FrequenciasDisciplinaApiModelRetorno (8 campos)

- codigoDisciplina: integer(int32) Código da disciplina
- codigoSetor: integer(int32) Código do setor
- etapas: array Etapas
- frequencia: FrequenciasApiModelRetorno Frenquência
- nomeDisciplina: string Nome da disciplina
- nomeDisciplinaResumido: string Nome da disciplina resumido
- nomeSetor: string Nome do setor
- nomeSetorResumido: string Nome do setor resumido

### FrequenciasEtapaApiRetorno (3 campos)

- frequencia: FrequenciasBaseApiModelRetorno Frenquência
- nomeEtapa: string Nome da etapa
- numeroEtapa: integer(int64) Número da etapa

### MatriculasFrequenciasApiModelRetorno (7 campos)

- Chamada: array Falta
- codigoMatricula: integer(int32) Código da matricula
- disciplinas: array Cursos
- frequencia: FrequenciasApiModelRetorno Frenquência
- nomeAluno: string Nome do aluno
- tipoLista: integer(int32) Tipo Lista
- turma: string Turma

### BoletoItauWebHookBoletoApiModel (29 campos)

- chavePix: string 
- codigoBarras: string 
- codigoCarteira: string 
- codigoEspecie: string 
- codigoInstituicaoFinanceiraPagamento: string 
- codigoTipoPessoa: string 
- dacTitulo: string 
- dataCredito: string 
- dataInclusaoPagamento: string 
- dataNotificacao: string 
- dataVencimento: string 
- descricaoEspecie: string 
- endToEndId: string 
- horaNotificacao: string 
- idBeneficiario: string 
- idBoleto: string 
- nomePagador: string 
- numeroAgenciaRecebedora: string 
- numeroCadastroNacionalPessoaJuridica: string 
- numeroCadastroPessoaFisica: string 
- numeroLinhaDigitavel: string 
- numeroNossoNumero: string 
- pixCopiaECola: string 
- tipoCobranca: string 
- tipoLiquidacao: string 
- txid: string 
- valorCreditado: string 
- valorPagoTotalCobranca: string 
- valorTitulo: string 

### PixItauWebHookPixApiModel (6 campos)

- chave: string 
- endToEndId: string 
- horario: string(date-time) 
- infoPagador: string 
- txid: string 
- valor: string 

### CatalogTabApiModel (4 campos)

- alias: string 
- channel: ChannelApiModel 
- metadata: MetadataTabApiModel 
- title: string 

### ChannelApiModel (3 campos)

- id: string 
- metadata: object 
- slug: string 

### MetadataTabApiModel (3 campos)

- idFisica: integer(int32) 
- idResponsavel: integer(int32) 
- idUnidade: integer(int32) 

### RequestItensTabsApiModel (3 campos)

- context: ContextApiModel 
- data: DataItensApiModel 
- secret: string 

### RequestTabsApiModel (3 campos)

- context: ContextApiModel 
- data: DataTabApiModel 
- secret: string 

### UserApiModel (3 campos)

- email: string 
- id: string 
- name: string 

### MateriaLecionadaDadoModelRetorno (4 campos)

- codigoListaAula: integer(int32) Codigo da lista de chamada aula
- codigoPlanejamentoAula: integer(int32) Codigo do Planejamento
- conteudoDado: string Conteudo dado pelo professor
- tarefa: string Tarefa dada pelo professor

### MatriculaOnlineApiModel (12 campos)

- camposFormulario: array Lista campos do formulário
- exibeMensagemBoasVindas: boolean Exibir mensagem de boas vindas
- exibeTitulo: boolean Exibir título
- imagemDesktop: string(byte) Imagem para visualização no computador
- imagemMobile: string(byte) Imagem para visualização no celular
- linkVideo: string Endereço do vídeo
- mensagemBoasVindas: string Mensagem de boas vindas
- mensagemTitulo: string Exibir mensagem do título
- nomeImagemDesktop: string Nome da imagem para visualização no computador
- nomeImagemMobile: string Nome da imagem para visualização no celular
- tipoMidia: string Tipo de mídia
- unidades: array Lista de unidades

### MatriculaOnlineCamposFormularioApiModel (6 campos)

- descricao: string Descrição do campo
- idCampo: string ID do campo no HTML
- obrigatorio: integer(int32) Indica se o campo é obrigatório (0 - NÃO, 1 - SIM)
- tipoCurso: integer(int32) Tipo de curso relacionado ao campo (0 - REGULAR, 1 - CURRICU
- tipoPessoa: integer(int32) Tipo de pessoa relacionada ao campo (0 - ALUNO, 1 - RESPONSÁ
- visualizar: integer(int32) Indica se o campo deve ser exibido (0 - NÃO, 1 - SIM)

### MatriculaOnlineCursoApiModel (3 campos)

- codigo: integer(int32) Código do curso
- curriculo: integer(int32) Currículo
- descricao: string Descrição do curso

### MatriculaOnlineDisponibilidadeApiModel (4 campos)

- cursos: array Lista de cursos
- periodos: array Lista de períodos
- series: array Lista de series
- turnos: array Lista de turnos

### MatriculaOnlineSerieApiModel (3 campos)

- codigo: integer(int32) Código do serie
- codigoCurso: integer(int32) Código do curso
- descricao: string Descrição do serie

### MatriculaOnlineTurnoApiModel (3 campos)

- codigo: integer(int32) Código do turno
- codigoSerie: integer(int32) Código da série
- descricao: string Descrição do turno

### MatriculasAlunoInclusaoApiModel (8 campos)

- curriculo: string Curriculo da matrícula
- curso: string Curso da matrícula
- dataPagamento: string(date-time) Data de pagamento da matrícula
- descontoMensalidade: string Descrição do desconto da mensalidade
- periodoLetivo: string Período letivo da matrícula
- turno: string Turno da matrícula
- unidade: string Unidade da matrícula
- valorPrimeiraParcela: number(double) Valor pago da matrícula

### MatriculasAlunoListaApiModelRetorno (15 campos)

- codigoMatricula: integer(int64) 
- codigoUnidade: integer(int32) 
- dataCancelamento: string 
- dataMatricula: string 
- motivoCancelamento: string 
- nomeSerie: string 
- nomeTurma: string 
- nomeTurno: string 
- nomeUnidade: string 
- situacao: string 
- temBoletim: boolean 
- temFrequencia: boolean 
- temHorarios: boolean 
- temNota: boolean 
- turma: integer(int64) 

### MatriculasAvaliacoesApiModel (3 campos)

- disciplinas: string Lista de códigos externos das disciplinas (separados por vír
- filtrarEtapa: boolean Filtrar etapas conforme configurações de integração para o A
- numeroEtapa: string Lista de números das etapas (separados por vírgula)

### MatriculasDetalheApiModel (16 campos)

- codigoAluno: integer(int32) Código do aluno
- codigoCurso: integer(int32) Código do curso
- codigoMatricula: integer(int32) Código do matrícula
- codigoPeriodo: integer(int32) Código do período
- codigoSerie: integer(int32) Código da série
- codigoTurma: integer(int32) Código da turma
- codigoTurno: integer(int32) Código do turno
- codigoUnidade: integer(int32) Código da unidade
- nomeAluno: string Nome do aluno
- nomeCurso: string Nome do curso
- nomePeriodo: string Nome do período
- nomeSerie: string Nome da série
- nomeTurma: string Nome da turma
- nomeTurno: string Nome do turno
- nomeUnidade: string Nome da unidade
- numeroChamada: integer(int32) Número da chamada

### AtaAlunoApiModelRetorno (3 campos)

- codigoMatricula: integer(int32) Código da matrícula
- nome: string Nome do aluno
- nota: string Nota

### AtaNotaApiModelRetorno (17 campos)

- arredondamentoCasasDecimais: integer(int32) Quantidade de casas decimais do arredondamento da ata nota
- codigo: integer(int32) Código da ata nota
- conceito: boolean Se é conceito ou numérico da ata nota
- conceitos: array Se é conceito ou numérico da ata nota
- dataAvaliacao: string(date-time) Data da avaliação da ata nota
- dataLimite: string(date-time) Data limite do lançamento da ata nota
- global: boolean Se é avaliação global
- grupo: GrupoAtaNotaApiModelRetorno Grupo da ata nota
- nomeAvaliacao: string Nome da avaliação da ata nota
- nomeResumidoAvaliacao: string Nome resumido da avaliação da ata nota
- notaMaxima: number(double) Nota máxima da ata nota
- numero: integer(int32) Número da ata nota
- peso: integer(int32) Peso da avaliação da ata nota
- setor: SetorAtaNotaApiModelRetorno Setor da ata nota
- situacao: integer(int32) Situação da ata nota
- tipo: integer(int32) Tipo da ata nota
- tipoArredondamento: integer(int32) Tipo de arredondamento da ata nota

### ParentescoApiModel (3 campos)

- codigo: integer(int32) * Código do parentesco
- descricao: string * Descrição do parentesco
- tipoParentesco: integer(int32) * Tipo do parentesco (1 - Mãe, 2 - Pai, 3 - Outros)

### PeriodoApiModelRetorno (4 campos)

- codigo: integer(int32) * Código do período
- inicio: string(date-time) * Início do período letivo
- nome: string * Nome do período
- termino: string(date-time) * Término do período letivo

### AreasConhecimentoApiModel (3 campos)

- descricaoDisciplina: string Descrição da disciplina
- idDisciplina: integer(int32) Id da disciplina
- nota: string Nota da disciplina

### InscricaoProcessoSeletivoApiModel (11 campos)

- areasConhecimento: array Áreas de conhecimento avaliadas no processo seletivo
- dataInscricao: string(date-time) Data de inscrição no processo seletivo
- descricaoGrupo: string Descrição do grupo
- descricaoPeriodoLetivo: string Descrição do período letivo
- descricaoProcessoSeletivo: string Descricção do processo seletivo
- idCandidato: integer(int32) Id do candidato
- idGrupo: integer(int32) Id do grupo
- idPeriodoLetivo: integer(int32) Id do período letivo
- idProcessoSeletivo: integer(int32) Id do processo seletivo
- mediaFinal: string Média final no processo seletivo
- opcoesCurso: array Opções de cursos para inscrição no processo seletivo

### OpcoesCursoApiModel (7 campos)

- descricaoCurso: string Descrição do curso
- descricaoTurno: string Descrição do turno
- descricaoUnidade: string Descrição da unidade
- idCurso: integer(int32) Id do curso
- idTurno: integer(int32) Id do turno
- idUnidade: integer(int32) Id da unidade
- ordem: integer(int32) Ordem da escolhas de opção de curso

### CampoCadastroApiModel (5 campos)

- chave: string * Identificação do campo
- editavel: boolean * Se campo será editável no cadastro
- tamanho: integer(int32) Tamanho do campo (aplicado para campos textos)
- utilizarMascaraTelefone: boolean * Se campo utilizará máscara de telefone
- visivel: boolean * Se campo será visível no cadastro

### ProcessoApiModel (10 campos)

- ativo: boolean 
- camposAluno: array 
- camposAutorizacaoRetirada: array 
- camposContrato: array 
- camposFichaSaude: array 
- camposMae: array 
- camposPai: array 
- camposResponsavel: array 
- etapas: array 
- permiteTrocarResponsavel: boolean 

### AvalistaRematriculaCurricularModelEntrada (14 campos)

- codigo: integer(int32) 
- contato1: string 
- contato2: string 
- contato3: string 
- contatoForma1: integer(int32) 
- contatoForma2: integer(int32) 
- contatoForma3: integer(int32) 
- cpf: string 
- email: string 
- endereco: LocalizacaoRematriculaCurricularModelEntrada 
- nome: string 
- rg: string 
- rgDataExpedicao: string(date-time) 
- rgOrgaoExpeditor: string 

### ConfirmacaoRematriculaCurricularModelEntrada (13 campos)

- codigoCurriculo: integer(int32) 
- codigoCurso: integer(int32) 
- codigoMatricula: integer(int32) 
- codigoOfertaServico: integer(int32) 
- codigoPeriodo: integer(int32) 
- codigoSerie: integer(int32) 
- codigoTurma: integer(int32) 
- codigoTurno: integer(int32) 
- codigoUnidade: integer(int32) 
- dadosPreMatricula: PreMatriculaRematriculaCurricularModelEntrada 
- documentosCurso: array 
- fichaCadastral: FichaCadastralRematriculaCurricularModelEntrada 
- tentativa: boolean 

### DisciplinaContratacaoRematriculaCurricularModelEntrada (3 campos)

- disciplina: integer(int32) 
- tipo: integer(int32) 
- turma: integer(int32) 

### DocumentoCursoRematriculaCurricularModelEntrada (5 campos)

- codigo: integer(int32) 
- conteudo: string 
- extensao: string 
- nome: string 
- nomeArquivoOriginal: string 

### FamiliaRematriculaCurricularModelEntrada (70 campos)

- filiacao1Parentesco: integer(int32) 
- filiacao1Sexo: integer(int32) 
- filiacao2Parentesco: integer(int32) 
- filiacao2Sexo: integer(int32) 
- maeComercialContato1: string 
- maeComercialContato2: string 
- maeComercialContato3: string 
- maeComercialEndereco: LocalizacaoRematriculaCurricularModelEntrada 
- maeComercialFormaContato1: integer(int32) 
- maeComercialFormaContato2: integer(int32) 
- maeComercialFormaContato3: integer(int32) 
- maeCpf: string 
- maeDataEmissaoCin: string(date-time) 
- maeDataNascimento: string(date-time) 
- maeEmail: string 
- maeEmpresa: integer(int32) 
- maeEnderecoIgual: boolean 
- maeEscolaridade: integer(int32) 
- maeEstadoCivil: integer(int32) 
- maeFalecida: integer(int32) 
- maeInscricaoMunicipal: string 
- maeNacionalidade: string 
- maeNome: string 
- maeOcupacao: string 
- maeRG: string 
- maeRGDataExpedicao: string(date-time) 
- maeRGOrgaoExpedicao: string 
- maeReligiao: string 
- maeRenda: number(double) 
- maeResidencialContato1: string 
- maeResidencialContato2: string 
- maeResidencialContato3: string 
- maeResidencialEndereco: LocalizacaoRematriculaCurricularModelEntrada 
- maeResidencialFormaContato1: integer(int32) 
- maeResidencialFormaContato2: integer(int32) 
- maeResidencialFormaContato3: integer(int32) 
- maeTrabalha: boolean 
- paiComercialContato1: string 
- paiComercialContato2: string 
- paiComercialContato3: string 
- paiComercialEndereco: LocalizacaoRematriculaCurricularModelEntrada 
- paiComercialFormaContato1: integer(int32) 
- paiComercialFormaContato2: integer(int32) 
- paiComercialFormaContato3: integer(int32) 
- paiCpf: string 
- paiDataEmissaoCin: string(date-time) 
- paiDataNascimento: string(date-time) 
- paiEmail: string 
- paiEmpresa: integer(int32) 
- paiEnderecoIgual: boolean 
- paiEscolaridade: integer(int32) 
- paiEstadoCivil: integer(int32) 
- paiFalecido: integer(int32) 
- paiInscricaoMunicipal: string 
- paiNacionalidade: string 
- paiNome: string 
- paiOcupacao: string 
- paiRG: string 
- paiRGDataExpedicao: string(date-time) 
- paiRGOrgaoExpedicao: string 
- paiReligiao: string 
- paiRenda: number(double) 
- paiResidencialContato1: string 
- paiResidencialContato2: string 
- paiResidencialContato3: string 
- paiResidencialEndereco: LocalizacaoRematriculaCurricularModelEntrada 
- paiResidencialFormaContato1: integer(int32) 
- paiResidencialFormaContato2: integer(int32) 
- paiResidencialFormaContato3: integer(int32) 
- paiTrabalha: boolean 

### FichaCadastralRematriculaCurricularModelEntrada (30 campos)

- contato1: string 
- contato2: string 
- contato3: string 
- cpf: string 
- dataEmissaoCin: string(date-time) 
- dataNasc: string(date-time) 
- email: string 
- empresa: integer(int32) 
- endereco: LocalizacaoRematriculaCurricularModelEntrada 
- estCivil: integer(int32) 
- familia: FamiliaRematriculaCurricularModelEntrada 
- fisica: integer(int32) 
- formaContato1: integer(int32) 
- formaContato2: integer(int32) 
- formaContato3: integer(int32) 
- localNasc: LocalizacaoRematriculaCurricularModelEntrada 
- nacionalidade: string 
- nome: string 
- nomeCivilRegistrado: string 
- nomeSocial: boolean 
- ocupacao: string 
- orgaoExp: string 
- passaporte: PassaporteRematriculaCurricularModelEntrada 
- permitirRemoverMae: boolean 
- permitirRemoverPai: boolean 
- raca: string 
- religiao: string 
- responsaveis: ResponsaveisRematriculaCurricularModelEntrada 
- rg: string 
- sexo: integer(int32) 

### LocalizacaoRematriculaCurricularModelEntrada (9 campos)

- bairro: string 
- cep: string 
- cidade: string 
- codBairro: integer(int32) 
- codCidade: integer(int32) 
- complemento: string 
- numero: string 
- rua: string 
- uf: string 

### PassaporteRematriculaCurricularModelEntrada (4 campos)

- codigoPais: integer(int32) 
- dataExpedicao: string(date-time) 
- dataValidade: string(date-time) 
- numero: string 

### PreMatriculaRematriculaCurricularModelEntrada (10 campos)

- avalista: AvalistaRematriculaCurricularModelEntrada 
- cursoDiaVcto: integer(int32) 
- cursoFormaPgto: integer(int32) 
- cursoUtilVcto: boolean 
- disciplinasSelecionadas: array 
- matriculaDiaVcto: integer(int32) 
- matriculaFormaPgto: integer(int32) 
- matriculaUtilVcto: boolean 
- responsavelFinanceiro: integer(int32) 
- responsavelPedagogico: integer(int32) 

### ResponsaveisRematriculaCurricularModelEntrada (57 campos)

- respFinanceiroCNPJ: string 
- respFinanceiroCPF: string 
- respFinanceiroCodigo: integer(int32) 
- respFinanceiroContato1: string 
- respFinanceiroContato2: string 
- respFinanceiroContato3: string 
- respFinanceiroDataEmissaoCin: string(date-time) 
- respFinanceiroDescricao: string 
- respFinanceiroDtNascimento: string(date-time) 
- respFinanceiroEmail: string 
- respFinanceiroEmpresa: integer(int32) 
- respFinanceiroEndereco: LocalizacaoRematriculaCurricularModelEntrada 
- respFinanceiroEnderecoIgual: boolean 
- respFinanceiroEscolaridade: integer(int32) 
- respFinanceiroEstadoCivil: integer(int32) 
- respFinanceiroFormaContato1: integer(int32) 
- respFinanceiroFormaContato2: integer(int32) 
- respFinanceiroFormaContato3: integer(int32) 
- respFinanceiroInscricaoMunicipal: string 
- respFinanceiroNacionalidade: string 
- respFinanceiroNome: string 
- respFinanceiroOcupacao: string 
- respFinanceiroParentesco: integer(int32) 
- respFinanceiroRG: string 
- respFinanceiroRGDtExp: string(date-time) 
- respFinanceiroRGOrgaoExp: string 
- respFinanceiroReligiao: string 
- respFinanceiroRenda: number(double) 
- respFinanceiroSexo: integer(int32) 
- respPedagogicoCNPJ: string 
- respPedagogicoCPF: string 
- respPedagogicoCodigo: integer(int32) 
- respPedagogicoContato1: string 
- respPedagogicoContato2: string 
- respPedagogicoContato3: string 
- respPedagogicoDataEmissaoCin: string(date-time) 
- respPedagogicoDataNascimento: string(date-time) 
- respPedagogicoDescricaoParentesco: string 
- respPedagogicoEmail: string 
- respPedagogicoEmpresa: integer(int32) 
- respPedagogicoEndereco: LocalizacaoRematriculaCurricularModelEntrada 
- respPedagogicoEnderecoIgual: boolean 
- respPedagogicoEscolaridade: integer(int32) 
- respPedagogicoEstadoCivil: integer(int32) 
- respPedagogicoFormaContato1: integer(int32) 
- respPedagogicoFormaContato2: integer(int32) 
- respPedagogicoFormaContato3: integer(int32) 
- respPedagogicoNacionalidade: string 
- respPedagogicoNome: string 
- respPedagogicoOcupacao: string 
- respPedagogicoOrgaoExpedidor: string 
- respPedagogicoParentesco: integer(int32) 
- respPedagogicoRG: string 
- respPedagogicoRGDataExpedicao: string(date-time) 
- respPedagogicoReligiao: string 
- respPedagogicoRenda: number(double) 
- respPedagogicoSexo: integer(int32) 

### TurmaApiModelRetorno (11 campos)

- codigo: integer(int32) * Código da turma
- colaborador: FisicaDescricaoApiModelRetorno Professor da turma
- curso: CursoDescricaoApiModelRetorno Curso da turma
- nome: string * Nome da turma
- nomeResumido: string * Nome da resumido turma
- periodoLetivo: PeriodoLetivoDescricaoApiModelRetorno Período letívo da turma
- professoresDisciplinas: array Professores e disciplinas da turma
- sala: string Sala da turma
- situacao: integer(int32) * Situaçao da turma
- turnos: array Turnos da turma
- unidade: UnidadeDescricaoApiModelRetorno Unidade da turma

### TurmaAvaliacaoModelRetorno (17 campos)

- atas: array 
- codigo: integer(int32) 
- codigoDisciplina: integer(int32) 
- codigoEtapa: integer(int32) 
- codigoSetor: integer(int32) 
- dataAvaliacao: string(date-time) 
- global: boolean 
- nomeAvaliacao: string 
- nomeResumido: string 
- notaMaxima: string 
- numeroEtapa: integer(int32) 
- peso: number(double) 
- pesoSetor: number(double) 
- qtdCasasDecimais: integer(int32) 
- recuperacao: boolean 
- tipoAvaliacao: string 
- tipoNota: integer(int32) 

### TurmaDisciplinaProfessorApiModelRetorno (3 campos)

- colaboradores: array Colaborador
- colaboradoresAuxiliares: array Colaborador
- disciplina: DisciplinaApiModelRetorno * Disciplina

### TurmaMonoApiModelRetorno (3 campos)

- codigo: integer(int64) Código do turma
- descricao: string Descrição da turma
- disciplina: DisciplinaApiModelRetorno Descrição da disciplina

### UnidadeApiModel (6 campos)

- bairro: string Bairro do titular da unidade
- cidade: string Cidade do titular da unidade
- codigo: integer(int32) * Código da unidade
- estado: string Estado do titular da unidade
- nome: string * Nome da unidade
- nomeResumido: string Nome resumido da unidade
