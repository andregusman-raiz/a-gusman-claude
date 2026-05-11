/**
 * TOTVS RM DataServer Types — Auto-generated from GetSchema SOAP responses
 * Generated: 2026-03-26
 * DataServers: 29
 * Tables: 72
 * Fields: 1992
 */

// === GlbColigadaData ===
export interface GColigada {
  NOMEFANTASIA: string; // xs:string, max:255, req, Nome Fantasia
  CGC: string; // xs:string, max:20, req, CNPJ / CPF / CEI
  NOME: string; // xs:string, max:255, req, Nome
  INSCRICAOESTADUAL: string | null; // xs:string, max:20, opt, Inscrição Estadual
  TELEFONE: string | null; // xs:string, max:15, opt, Telefone
  FAX: string | null; // xs:string, max:15, opt, Fax
  EMAIL: string | null; // xs:string, max:60, opt, E-Mail
  RUA: string | null; // xs:string, max:100, opt, Rua
  NUMERO: string | null; // xs:string, max:8, opt, Número
  COMPLEMENTO: string | null; // xs:string, max:30, opt, Complemento
  BAIRRO: string | null; // xs:string, max:30, opt, Bairro
  CIDADE: string | null; // xs:string, max:32, opt, Cidade
  ESTADO: string | null; // xs:string, max:2, opt, Estado
  PAIS: string | null; // xs:string, max:20, opt, País
  CEP: string | null; // xs:string, max:9, opt, Cep
  PRODUTORRURAL: string | null; // xs:string, max:1, opt, Produtor Rural
  ATIVO: string | null; // xs:string, max:1, opt, Ativo
  CODEXTERNO: string | null; // xs:string, max:10, opt, Código Externo
  IMPORTADA: string | null; // xs:string, max:1, opt, Importada Via Aponta
  CODCOLIGADA: number; // xs:short, req, default:32, Código
  CONTROLACGC: number | null; // xs:short, opt, Hist. CNPJ
  CONTROLE1: number | null; // xs:short, opt, Controle1
  CONTROLE2: number | null; // xs:short, opt, Controle2
  CONTROLE3: number | null; // xs:short, opt, Controle3
  IDIMAGEM: number | null; // xs:int, opt, Identificador da Imagem
  IMAGEM: Buffer | null; // xs:base64Binary, opt, Imagem
  INTEGRADOFLUIG: number | null; // xs:short, opt, Integrado
  DATALIMITELICENCAS: string | null; // xs:dateTime, opt
}

export interface GFilial {
  NOME: string; // xs:string, max:100, req, Nome
  CGC: string | null; // xs:string, max:20, opt, CNPJ/CPF/CEI
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODFILIAL: number; // xs:short, req, Filial
}

// === GlbUsuarioData ===
export interface GUSUARIO {
  CODUSUARIO: string; // xs:string, max:20, req, default:, Usuário
  NOME: string | null; // xs:string, max:45, opt, Nome
  CODACESSO: string; // xs:string, max:16, req, Código de Acesso
  OBRIGAALTERARSENHA: string | null; // xs:string, max:1, opt, default:T, Alterar senha no Próximo Login
  EMAIL: string | null; // xs:string, max:60, opt, E-Mail
  ACESSONET: string | null; // xs:string, max:1, opt, default:F, Permite Acesso ao TOTVS RM Portal
  CODUSUARIOREDE: string | null; // xs:string, max:20, opt, Usuário de rede
  DOMINIOREDE: string | null; // xs:string, max:256, opt, Domínio de rede
  LIVEID: string | null; // xs:string, max:150, opt
  USUARIOTWITTER: string | null; // xs:string, max:50, opt, Usuário do Twitter
  SENHATWITTER: string | null; // xs:string, max:100, opt, Senha do Twitter
  USUARIOFACEBOOK: string | null; // xs:string, max:50, opt
  SENHAFACEBOOK: string | null; // xs:string, max:100, opt
  USUARIOLINKEDIN: string | null; // xs:string, max:50, opt
  SENHALINKEDIN: string | null; // xs:string, max:100, opt
  USERID: string | null; // xs:string, max:50, opt, UserId
  USERIDFLUIGIDENTITY: string | null; // xs:string, max:32, opt
  IGNORARAUTENTICACAOLDAP: string | null; // xs:string, max:1, opt, default:F, Ignorar Integração/Logon LDAP
  NOMESOCIAL: string | null; // xs:string, max:45, opt, Nome Social
  CODEXTERNO: string | null; // xs:string, max:255, opt, Código externo
  STATUS: number | null; // xs:short, opt, default:1, Ativo
  DATAINICIO: string; // xs:dateTime, req, default:2026-03-26T00:00:00, Início de Validade
  DATAEXPIRACAO: string | null; // xs:dateTime, opt, Expiração de Validade
  CONFIRMABTNOK: number | null; // xs:short, opt, default:1, Confirmação de Operação
  SENHA: string | null; // xs:string, opt, Senha 
  CONTROLE: number | null; // xs:short, opt, CRC do Usuário
  ULTIMACOLIGADA: number | null; // xs:int, opt, Última Coligada Acessada
  DTAEXPSENHA: string | null; // xs:dateTime, opt, Data de expiração da senha
  DIASEXPSENHA: number | null; // xs:int, opt, Dias de expiração da senha
  NUMLOGININVALIDO: number | null; // xs:int, opt, Número de Logins Inválidos
  DATALOGININVALIDO: string | null; // xs:dateTime, opt, Data do último login inválido
  DATAULTIMOACESSO: string | null; // xs:dateTime, opt, Última tentativa de acesso
  FULLDETERMINED: string | null; // xs:string, opt
  INTEGRADOFLUIG: number | null; // xs:short, opt, Integrado
  DATAULTIMOACESSOVALIDO: string | null; // xs:dateTime, opt, Último acesso Válido
  ULTIMASSENHAS: string | null; // xs:string, opt, Últimas senhas utilizadas pelo usuário
  INTERNO1: string | null; // xs:string, opt
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
  RECCREATEDBY: string | null; // xs:string, opt
  RECMODIFIEDBY: string | null; // xs:string, opt
}

export interface GPERMIS {
  CODSISTEMA: string; // xs:string, max:1, req, default:S
  CODUSUARIO: string; // xs:string, max:20, req, default:andre.gusman
  CODCOLIGADA: number; // xs:short, req, default:1
  SUPERVISOR: number | null; // xs:short, opt
  CONTROLE: number | null; // xs:short, opt
  CRIARELAT: number | null; // xs:short, opt
  RECCREATEDBY: string | null; // xs:string, opt
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDBY: string | null; // xs:string, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
}

export interface GUSRPERFIL {
  CODUSUARIO: string; // xs:string, max:20, req, default:andre.gusman
  CODSISTEMA: string; // xs:string, max:1, req, default:S
  CODPERFIL: string; // xs:string, max:15, req
  CODCOLIGADA: number; // xs:short, req, default:1
  INDICE: number; // xs:short, req
  CONTROLE: number | null; // xs:short, opt
  RECCREATEDBY: string | null; // xs:string, opt
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDBY: string | null; // xs:string, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
  STATUS: number | null; // xs:short, opt
  IDPERFIL: string | null; // xs:string, opt
}

// === EduCursoData ===
export interface SCurso {
  CODCURSO: string; // xs:string, max:10, req, Código
  NOME: string; // xs:string, max:500, req, Nome
  COMPLEMENTO: string | null; // xs:string, max:500, opt, Segundo Nome
  CODCURINEP: string | null; // xs:string, max:8, opt, Código INEP
  REGCONTRATO: string | null; // xs:string, max:10, opt, Número do contrato em cartório
  CFGMATRICULA: string | null; // xs:string, max:20, opt, Configuração do RA
  HABILITACAO: string | null; // xs:string, max:60, opt, Habilitação
  CAPES: string | null; // xs:string, max:20, opt, Código Capes
  CURPRESDIST: string | null; // xs:string, max:1, opt, Presencial/Distância
  CODMODALIDADECURSO: string | null; // xs:string, max:4, opt, Modalidade
  MASCARATURMA: string | null; // xs:string, max:50, opt, Máscara da turma
  REGRAEMISSAONFE: string | null; // xs:string, max:1, opt, Regra de emissão da NF-e
  CODCOLIGADA: number; // xs:short, req, default:1, Código da Coligada
  CODESCOLA: number | null; // xs:short, opt, Escola
  CODAREA: number | null; // xs:short, opt, Área
  DECRETO: string | null; // xs:string, opt, Decreto
  DESCRICAO: string | null; // xs:string, opt, Descrição
  CODTIPOCURSO: number; // xs:short, req, Nível de ensino
  IDEIXOTECNOLOGICO: number | null; // xs:int, opt, Eixo Tecnológico
  TIPOOFERTA: number | null; // xs:short, opt, Integrada
  ENVIARCENSO: number | null; // xs:short, opt, default:0, Enviar ao Censo
}

export interface SCURSOCOMPL {
  CODCURSO: string; // xs:string, max:10, req
  CODCOLIGADA: number; // xs:short, req, default:1
  NOTAAPP: string | null; // xs:string, opt
}

// === EduTurmaData ===
export interface STurma {
  CODTURMA: string; // xs:string, max:20, req, default:0, Código da Turma
  CODDEPARTAMENTO: string | null; // xs:string, max:25, opt, Departamento
  CODPREDIO: string | null; // xs:string, max:5, opt, Cód. Prédio
  CODSALA: string | null; // xs:string, max:10, opt, Sala
  CODCCUSTO: string | null; // xs:string, max:25, opt, Centro de custo
  APLICACAO: string | null; // xs:string, max:1, opt, Sistema
  CODFORMULA: string | null; // xs:string, max:8, opt, Fórmula para cálculo do resultado final
  NOMERED: string | null; // xs:string, max:20, opt, Nome reduzido
  NOME: string | null; // xs:string, max:60, opt, Nome
  CODTURMAPROX: string | null; // xs:string, max:20, opt, Código da próxima turma
  TURMAENCERRADA: string | null; // xs:string, max:1, opt, Turma encerrada
  CODBLOCO: string | null; // xs:string, max:5, opt, Bloco
  CODCAMPUS: string | null; // xs:string, max:10, opt, Campus/Polo
  CODPERLET: string | null; // xs:string, max:10, opt, Cód. Período letivo
  URLAULAONLINE: string | null; // xs:string, max:2048, opt, Aula Online
  BALANCEAMENTOMATHABILITA: string | null; // xs:string, max:1, opt, default:N, Habilitar balanceamento
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODFILIAL: number; // xs:short, req, Filial
  IDPERLET: number; // xs:int, req, Id. Período letivo
  IDHABILITACAOFILIAL: number | null; // xs:int, opt, Matriz aplicada
  MAXALUNOS: number | null; // xs:int, opt, Nº máximo de alunos
  DTINICIAL: string | null; // xs:dateTime, opt, Data inicial
  DTFINAL: string | null; // xs:dateTime, opt, Data final
  ALUNOSLABORE: number | null; // xs:int, opt, Nº alunos (Folha de pagamento)
  DTALUNOSLABORE: string | null; // xs:dateTime, opt, Data (Folha de pagamento)
  CODTIPOCURSO: number | null; // xs:short, opt, Nível de ensino
  CODCURSO: string | null; // xs:string, opt, Cód. Curso
  CODHABILITACAO: string | null; // xs:string, opt, Cód. Habilitação
  CODGRADE: string | null; // xs:string, opt, Cód. Matriz
  TIPOMEDIACAO: number | null; // xs:short, opt, default:1, Tipo de mediação
  MODALIDADE: number | null; // xs:short, opt, Modalidade de ensino
  IDUNIDADEPONTO: number | null; // xs:int, opt, Id. unidade ponto
  IDCLASSEVALORPROTHEUS: number | null; // xs:int, opt, Classe de valor
  IDITEMCONTABILPROTHEUS: number | null; // xs:int, opt, Item contábil
  CODHORARIOAGRUPURANIA: number | null; // xs:short, opt, Agrupamento de Horário (Urânia)
  DTINICIOPLETIVO: string | null; // xs:dateTime, opt, Data início do período letivo
  NUMVAGAS: number | null; // xs:int, opt, Num. vagas
  NOMEFILIAL: string | null; // xs:string, opt, Nome filial
  NOMECURSO: string | null; // xs:string, opt, Curso
  NOMEHABILITACAO: string | null; // xs:string, opt, Habilitação
  NOMEGRADE: string | null; // xs:string, opt, Matriz curricular
  NOMETURNO: string | null; // xs:string, opt, Turno
  DTCOMPETENCIAINICIALMOV: string | null; // xs:dateTime, opt, Data de competência inicial movimento
  DTCOMPETENCIAFINALMOV: string | null; // xs:dateTime, opt, Data de competência final movimento
  CODTURNO: number | null; // xs:int, opt, Cód. Turno
  BALANCEAMENTOMATORDEM: number | null; // xs:short, opt, Ordem da turma no balanceamento
  ORIGEMCRIACAO: number | null; // xs:int, opt
  IDFT: number | null; // xs:int, opt
  DESCGRADE: string | null; // xs:string, opt
  TURNO: string | null; // xs:string, opt
  NOMEDEPTO: string | null; // xs:string, opt
  CCUSTO: string | null; // xs:string, opt
  FORMULA: string | null; // xs:string, opt
  CONTROLEVAGAS: string | null; // xs:string, opt
}

export interface STURMACOMPL {
  CODCOLIGADA: number; // xs:short, req, default:1
  CODFILIAL: number; // xs:short, req
  IDPERLET: number; // xs:int, req
  CODTURMA: string; // xs:string, req
  CODCURSO_TELESCOPE: string | null; // xs:string, opt
  NOMECURSO_TELESCOPE: string | null; // xs:string, opt
  CODTURMAD2L: number | null; // xs:int, opt
}

// === EduHabilitacaoData ===
export interface SHabilitacao {
  CODCURSO: string; // xs:string, max:10, req, Cód. Curso
  CODHABILITACAO: string; // xs:string, max:10, req, Código
  CODCURSOHIST: string | null; // xs:string, max:10, opt, Curso no Histórico
  NOME: string; // xs:string, max:150, req, Habilitação
  COMPLEMENTO: string | null; // xs:string, max:150, opt, Complemento
  TEXTOCONCLUSAO: string | null; // xs:string, max:2147483647, opt, Texto de conclusão
  DECRETO: string | null; // xs:string, max:2147483647, opt, Decreto
  DESCRICAO: string | null; // xs:string, max:2147483647, opt, Descrição
  CODHABINEP: string | null; // xs:string, max:8, opt, Código INEP
  COMPLEMENTO2: string | null; // xs:string, max:60, opt, Segundo Complemento
  JURAMENTO: string | null; // xs:string, max:2147483647, opt, Juramento
  CODTIPOHABILITACAO: string | null; // xs:string, max:3, opt, Tipo
  NOMECURSO: string | null; // xs:string, max:60, opt, Nome
  TITULACAOMASCULINA: string | null; // xs:string, max:100, opt, Titulação Masculina
  TITULACAOFEMININA: string | null; // xs:string, max:100, opt, Titulação Feminina
  CURRICULODIGITAL: string | null; // xs:string, max:1, opt, default:S, Habilitação para o currículo digital
  CODCOLIGADA: number; // xs:short, req, default:1, Código da Coligada
  CODSERIEHIST: number | null; // xs:int, opt, Série no Histórico
  INTEGRALIZACAO: number | null; // xs:decimal, opt, Integralização
  DTPROVAO: string | null; // xs:dateTime, opt, Data do provão
  NRHABILITACOESVINCULADAS: number | null; // xs:int, opt
}

export interface SHABILITACAOCOMPL {
  CODCURSO: string; // xs:string, max:10, req
  CODHABILITACAO: string; // xs:string, max:10, req
  CODCOLIGADA: number; // xs:short, req, default:1
  CODCOLIGADAMD: number | null; // xs:int, opt
  CODFILIALMD: number | null; // xs:int, opt
  IDPRD: number | null; // xs:int, opt
  SERIEMD: string | null; // xs:string, opt
}

// === EduTurmaDiscData ===
export interface STurmaDisc {
  CODTURMA: string; // xs:string, max:20, req, default:0, Código da Turma
  CODDISC: string; // xs:string, max:20, req, Cód. Disciplina
  CODCCUSTO: string | null; // xs:string, max:25, opt, Centro de custo
  APLICACAO: string | null; // xs:string, max:1, opt, Sistema
  CODFORMULA: string | null; // xs:string, max:8, opt, Fórmula para cálculo de médias / aprovação
  CODPREDIO: string | null; // xs:string, max:5, opt, Cód. Prédio
  CODSALA: string | null; // xs:string, max:10, opt, Sala
  CODEVENTO: string | null; // xs:string, max:4, opt, Evento
  DISCOPCIONAL: string | null; // xs:string, max:1, opt, Disciplina opcional
  PREALOCACAO: string | null; // xs:string, max:1, opt, Vaga pré-alocada
  CODEVENTOFALTA: string | null; // xs:string, max:4, opt, Evento de falta
  CODEVENTOATRASO: string | null; // xs:string, max:4, opt, Evento de atraso
  TIPO: string | null; // xs:string, max:1, opt, Tipo da turma
  CODBLOCO: string | null; // xs:string, max:5, opt, Cód. Bloco
  CODCAMPUS: string | null; // xs:string, max:10, opt, Campus/Polo
  ADICIONALNOTURNO: string | null; // xs:string, max:1, opt, default:N, Noturno
  ADICIONALEXTRA: string | null; // xs:string, max:1, opt, default:N, Extra
  DISPONIVELMATRICULA: string | null; // xs:string, max:1, opt, default:S, Exibe na matrícula do portal
  GERENCIAL: string | null; // xs:string, max:1, opt, default:N, Gerencial
  ATIVA: string; // xs:string, max:1, req, default:S, Ativa
  ALIASCOMUNIDADE: string | null; // xs:string, max:255, opt, Alias da comunidade no Fluig
  COMPARTILHADA: string | null; // xs:string, max:1, opt, default:N, Compartilhada
  ESPELHO: string | null; // xs:string, max:1, opt, default:N, Espelho
  MASCARATURMAESPELHO: string | null; // xs:string, max:50, opt, Máscara
  URLAULAONLINE: string | null; // xs:string, max:2048, opt, Aula Online
  TIPONOTA: string | null; // xs:string, max:1, opt, Tipo de nota
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  IDTURMADISC: number; // xs:int, req, default:0, Código
  CODFILIAL: number; // xs:short, req, Filial
  IDPERLET: number; // xs:int, req, Id. Período letivo
  CODTURNO: number; // xs:int, req, Turno
  CODPLANILHA: number | null; // xs:int, opt, Planilha
  IDHABILITACAOFILIAL: number | null; // xs:int, opt, Matriz aplicada
  NUMAULASEM: number | null; // xs:int, opt, Número de aulas
  DURACAOAULA: number | null; // xs:int, opt, Duração da aula
  MAXALUNOS: number | null; // xs:int, opt, Nº máximo de alunos
  CODTIPOCURSO: number | null; // xs:short, opt, Nível de ensino
  DTINICIAL: string | null; // xs:dateTime, opt, Data inicial
  DTFINAL: string | null; // xs:dateTime, opt, Data final
  MINALUNOS: number | null; // xs:int, opt, Nº mínimo de alunos
  CUSTOMEDIO: number | null; // xs:decimal, opt, Custo médio
  NOMEDISC: string | null; // xs:string, opt, Nome disciplina
  NOME: string | null; // xs:string, opt, Nome
  CODCURSO: string | null; // xs:string, opt, Cód. Curso
  CODHABILITACAO: string | null; // xs:string, opt, Cód. Habilitação
  CODGRADE: string | null; // xs:string, opt, Matriz curricular
  VAGASCALOUROS: number | null; // xs:int, opt, Vagas para calouros
  NUMMAXALUNOOUTROSCURSOS: number | null; // xs:int, opt, Núm. máximo de alunos de outros cursos
  VAGASLISTAESPERA: number | null; // xs:int, opt, Vagas para a lista de espera
  NUMCREDITOSCOB: number | null; // xs:decimal, opt, Número de créditos para cobrança
  VALORCREDITO: number | null; // xs:decimal, opt, Valor do crédito para cobrança
  COMPLEMENTODISC: string | null; // xs:string, opt
  DTINICIOMATPRES: string | null; // xs:dateTime, opt, Data inicial da matrícula presencial
  DTFIMMATPRES: string | null; // xs:dateTime, opt, Data final da matrícula presencial
  DTINICIOMATPORTAL: string | null; // xs:dateTime, opt, Data inicial da matrícula no portal
  DTFIMMATPORTAL: string | null; // xs:dateTime, opt, Data final da matrícula no portal
  IDTURMADISCANTIGO: number; // xs:int, req, default:0, Código
  NUMMAXALUNOSOUTRASMTZAPLICADAS: number | null; // xs:int, opt, Nº máx. de alunos de outras matrizes aplicadas
  DECIMAIS: number | null; // xs:int, opt, Número de casas decimais
  CODTIPOCURSOPLETIVO: number | null; // xs:short, opt
  NOMEFILIAL: string | null; // xs:string, opt, Nome da filial
  NUMMAXALUNOOUTRACOLIGADA: number | null; // xs:int, opt, Nº máx. de alunos de outras coligadas
  CODAGENDA: number | null; // xs:int, opt, Agenda Infantil
  CODITINERARIOFORMATIVO: number | null; // xs:int, opt, Cód. Itinerário Formativo
  NOMEITINERARIOFORMATIVO: string | null; // xs:string, opt, Itinerário formativo
  ORIGEMCRIACAO: number | null; // xs:int, opt
  IDFT: number | null; // xs:int, opt
  CODPERLET: string | null; // xs:string, opt
}

export interface STURMADISCCOMPL {
  CODCOLIGADA: number; // xs:short, req, default:1
  IDTURMADISC: number; // xs:int, req
}

// === EduMatriculaData ===
export interface SMatricula {
  RA: string; // xs:string, max:20, req, R.A.
  CODSUBTURMA: string | null; // xs:string, max:20, opt, Código da Subturma
  OBSHISTORICO: string | null; // xs:string, max:255, opt, Observação do histórico
  USUARIO: string | null; // xs:string, max:20, opt, Usuário
  TIPODISCIPLINA: string | null; // xs:string, max:1, opt, Tipo de disciplina
  NOMEALUNO: string | null; // xs:string, max:120, opt, Aluno
  CODPERLET: string | null; // xs:string, max:10, opt, Período letivo
  COBPOSTERIORMATRIC: string | null; // xs:string, max:1, opt, default:N, Considerar no cálculo de cobrança somente para parcelas com vencimento igual ou posterior a data da matrícula
  CODTURMA: string | null; // xs:string, max:20, opt, Turma
  NOMESTATUS: string | null; // xs:string, max:30, opt, Situação de matrícula
  MATRICULAISOLADA: string | null; // xs:string, max:1, opt, default:N, Matrícula isolada
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  IDTURMADISC: number; // xs:int, req, Turma disciplina
  CODSTATUS: number; // xs:int, req, Situação de matrícula
  CODSTATUSRES: number | null; // xs:int, opt, Resultado
  IDPERLET: number | null; // xs:int, opt, Id. Período letivo
  IDHABILITACAOFILIAL: number | null; // xs:int, opt, Matriz aplicada
  NUMDIARIO: number | null; // xs:int, opt, Número no diário
  DTMATRICULA: string | null; // xs:dateTime, opt, default:2026-03-26T00:00:00, Data de matrícula
  TIPOMAT: string | null; // xs:string, opt, Tipo de matrícula
  CODDISC: string | null; // xs:string, opt, Cód. da disciplina
  NOMEDISC: string | null; // xs:string, opt, Disciplina
  CODMOTIVO: number | null; // xs:short, opt, Motivo da alteração
  DTALTERACAO: string | null; // xs:dateTime, opt, Data da alteração
  DTALTERACAOSIST: string | null; // xs:dateTime, opt, Data de alteração no sistema
  NUMCREDITOSCOB: number | null; // xs:double, opt, Créditos financeiros
  NUMCREDITOS: number | null; // xs:decimal, opt, Créditos acadêmicos
  NOTA: number | null; // xs:decimal, opt, Nota
  FALTA: number | null; // xs:decimal, opt, Falta
  CODCONCEITO: string | null; // xs:string, opt, Conceito
  IDTURMADISCORIGEM: number | null; // xs:int, opt, Turma disciplina origem
  IDTURMADISCSUBST: number | null; // xs:int, opt, Turma disciplina substituição
  FILIAL: string | null; // xs:string, opt
  CONCEITOECTS: string | null; // xs:string, opt, Classif. ECTS
  CODFILIAL: number | null; // xs:int, opt, Filial
  CODTIPOCURSO: number | null; // xs:int, opt, Nível de ensino
  NOMENIVELENSINO: string | null; // xs:string, opt
  CODFILIALTURMADISC: number | null; // xs:int, opt, Código filial da disciplina
  CODTIPOCURSOTURMADISC: number | null; // xs:int, opt, Código nível de ensino da disciplina
  RECCREATEDBY: string | null; // xs:string, opt, Usuário criador do registro
  RECCREATEDON: string | null; // xs:dateTime, opt, Data de criação do registro
  RECMODIFIEDBY: string | null; // xs:string, opt, Autor da última modificação no registro
  RECMODIFIEDON: string | null; // xs:dateTime, opt, Data da última modificação no registro
}

export interface SMatriculaCompl {
  CODCOLIGADA: number; // xs:short, req, default:1
  IDTURMADISC: number; // xs:int, req
  RA: string; // xs:string, req
  RECCREATEDBY: string | null; // xs:string, opt
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDBY: string | null; // xs:string, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
  BIMESTRE_1: string | null; // xs:string, opt
  BIMESTRE_2: string | null; // xs:string, opt
  BIMESTRE_3: string | null; // xs:string, opt
  BIMESTRE_4: string | null; // xs:string, opt
}

export interface STurmaDisc {
  CODCOLIGADA: number; // xs:short, req
  IDHABILITACAOFILIAL: number | null; // xs:int, opt
  NOMEHABILITACAO: string | null; // xs:string, opt
  IDTURMADISC: number; // xs:int, req
  CODTURMA: string | null; // xs:string, opt
  NOME: string | null; // xs:string, opt
  IDPERLET: number | null; // xs:int, opt
  CODDISC: string | null; // xs:string, opt
  NOMEDISC: string | null; // xs:string, opt
  DTINICIAL: string | null; // xs:string, opt
  DTFINAL: string | null; // xs:string, opt
  NUMCREDITOS: number | null; // xs:decimal, opt
  NUMCREDITOSCOB: number | null; // xs:decimal, opt
  MAXALUNOS: number | null; // xs:int, opt
  TIPODISCIPLINA: string | null; // xs:string, opt
  NUMMAXALUNOOUTROSCURSOS: number | null; // xs:int, opt
  VAGASCALOUROS: number | null; // xs:int, opt
  STATUSOCUPACAOTURMA: number | null; // xs:short, opt
  IMAGE: Buffer | null; // xs:base64Binary, opt
  TIPO: string | null; // xs:string, opt
  NUMVAGAS: number | null; // xs:int, opt
  FILIAL: string | null; // xs:string, opt
  CODFILIAL: number | null; // xs:int, opt
  CH: number | null; // xs:decimal, opt
}

export interface SHorarioTurma {
  NOMETURNO: string | null; // xs:string, max:15, opt, Turno
  HORAINICIAL: string | null; // xs:string, max:5, opt, Hora inicial
  HORAFINAL: string | null; // xs:string, max:5, opt, Hora final
  CODSUBTURMA: string | null; // xs:string, max:20, opt, Subturma
  CODCOLIGADA: number; // xs:short, req
  IDHORARIOTURMA: number; // xs:int, req
  CODHOR: number | null; // xs:int, opt
  IDTURMADISC: number | null; // xs:int, opt
  DIASEMANA: number | null; // xs:short, opt, Dia
  DATAINICIAL: string | null; // xs:dateTime, opt
  DATAFINAL: string | null; // xs:dateTime, opt
}

export interface SProfessorTurma {
  CODCOLIGADA: number; // xs:short, req
  IDPROFESSORTURMA: number; // xs:int, req
  IDTURMADISC: number | null; // xs:int, opt
  CODPROF: string | null; // xs:string, opt, Cód. Professor
  NOME: string | null; // xs:string, opt, Nome
  DTINICIO: string | null; // xs:dateTime, opt, Data inicial
  DTFIM: string | null; // xs:dateTime, opt, Data final
  TIPOPROF: string | null; // xs:string, opt, Tipo do professor
}

// === EduDisciplinaData ===
export interface SDISCIPLINA {
  CODDISC: string; // xs:string, max:20, req, Disciplina
  CODDISCHIST: string | null; // xs:string, max:20, opt, Disciplina do histórico
  NOME: string; // xs:string, max:150, req, Nome
  NOMEREDUZIDO: string | null; // xs:string, max:30, opt, Nome reduzido
  COMPLEMENTO: string | null; // xs:string, max:500, opt, Segundo Nome
  OBJETIVO: string | null; // xs:string, max:2000, opt, Objetivo
  CURSOLIVRE: string | null; // xs:string, max:1, opt, default:N, Curso Livre
  TIPOAULA: string | null; // xs:string, max:1, opt, Aula
  TIPODISCPROVAO: string | null; // xs:string, max:1, opt, default:B, Disciplina no Provão
  TIPONOTA: string; // xs:string, max:1, req, default:N, Nota
  CODEVENTO: string | null; // xs:string, max:4, opt
  RECCREATEDBY: string | null; // xs:string, max:50, opt
  RECMODIFIEDBY: string | null; // xs:string, max:50, opt
  ESTAGIO: string | null; // xs:string, max:1, opt, default:N, Estágio
  CODGRUPOCOMPLEMENTO: string | null; // xs:string, max:10, opt, Cód. grupo de complemento
  ITINERARIOFORMATIVO: string | null; // xs:string, max:1, opt, default:N, Itinerário Formativo
  CODCOLIGADA: number; // xs:short, req, default:1, Código da Coligada
  CH: number | null; // xs:decimal, opt, Total
  NUMCREDITOS: number | null; // xs:decimal, opt, Nº Créditos
  DECIMAIS: number | null; // xs:int, opt, Nº Casas Decimais
  CODTIPOCURSO: number; // xs:short, req, Nível de ensino
  CHESTAGIO: number | null; // xs:decimal, opt, Estágio
  CHTEORICA: number | null; // xs:decimal, opt, Teórica
  CHPRATICA: number | null; // xs:decimal, opt, Prática
  CHLABORATORIAL: number | null; // xs:decimal, opt, Laboratório
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
  IDGRUPOCOMPLEMENTO: number | null; // xs:int, opt, Id. grupo de complemento
  CODDISCCENSO: number | null; // xs:int, opt, Disciplina no Censo
  CHEXTENSAO: number | null; // xs:decimal, opt, Extensão
  NUMAULASPORSEMANA: number | null; // xs:int, opt, Nº de aulas semanais
  CHPRESENCIAL: number | null; // xs:decimal, opt, Presencial
  CHDISTANCIA: number | null; // xs:decimal, opt, À distância
  CHSINCRONA: number | null; // xs:decimal, opt, Síncrona
  CHSINCRONAMEDIADA: number | null; // xs:decimal, opt, Síncrona mediada
  CHASSINCRONA: number | null; // xs:decimal, opt, Assíncrona
}

// === EduDiscGradeData ===
export interface SDISCGRADE {
  CODCURSO: string; // xs:string, max:10, req, Cód. Curso
  CODHABILITACAO: string; // xs:string, max:10, req, Cód. Habilitação
  CODGRADE: string; // xs:string, max:10, req, Cód. Matriz
  CODDISC: string; // xs:string, max:20, req, Disciplina
  CODGRPDISC: string | null; // xs:string, max:6, opt, Grupo de disciplinas
  DESCRICAO: string | null; // xs:string, max:60, opt, Descrição
  TIPODISC: string; // xs:string, max:2, req, Tipo de Disciplina
  OBJETIVO: string | null; // xs:string, max:2000, opt, Objetivo
  ATIVIDADE: string | null; // xs:string, max:1, opt, default:1, Atividade
  CALCMEDIAGLOBAL: string | null; // xs:string, max:1, opt, default:N, Indica se entra no cálc. da média global
  DESEMPENHOALUNO: string | null; // xs:string, max:1, opt, default:0, Indica se mostra no gráf. de desempenho
  IMPBOLETIM: string | null; // xs:string, max:1, opt, default:N, Indica se imprime no boletim e exibe no portal do aluno
  TIPONOTA: string | null; // xs:string, max:1, opt, default:N, Tipo de Nota
  APLICACAO: string | null; // xs:string, max:1, opt, Código do Sistema
  CODFORMULAPRE: string | null; // xs:string, max:8, opt, Fórmula de pré-requisito
  CODFORMULACO: string | null; // xs:string, max:8, opt, Fórmula de correquisito
  CODGRUPOCOMPLEMENTO: string | null; // xs:string, max:10, opt, Cód. grupo de complemento
  DISCIPLINATCC: string | null; // xs:string, max:1, opt, default:N, Indica se a disciplina é de TCC
  TCCEMGRUPO: string | null; // xs:string, max:1, opt, default:N, Indica se o TCC pode ser em grupo
  CODCOLIGADA: number; // xs:short, req, default:1, Código da Coligada
  CODPERIODO: number; // xs:short, req, Período
  PREREQCRED: number | null; // xs:decimal, opt, Nº mínimo de créditos acadêmico
  POSHIST: number | null; // xs:int, opt, Ordem no histórico
  NUMCREDITOSCOB: number | null; // xs:decimal, opt, Nº de créditos para cobrança
  VALORCREDITO: number | null; // xs:decimal, opt, Valor do crédito para cobrança
  CH: number | null; // xs:decimal, opt, Carga Horária
  DECIMAIS: number | null; // xs:int, opt, Nº casas decimais
  PERCAULASNAOPRES: number | null; // xs:decimal, opt, Percentual de aulas não presenciais
  PRIORIDADEMATRICULA: number | null; // xs:int, opt, Prioridade na matrícula
  NUMMINDISC: number | null; // xs:int, opt, Número mínimo de disciplinas
  CRDISC: number | null; // xs:int, opt, Créditos de disciplinas
  CHDISC: number | null; // xs:decimal, opt, Carga horária de disciplinas
  NOMEDISCIPLINA: string | null; // xs:string, opt, Nome da disciplina
  NOMEREDUZIDO: string | null; // xs:string, opt, Nome reduzido
  COMPLEMENTO: string | null; // xs:string, opt, Complemento
  CHDISCIPLINA: string | null; // xs:string, opt, Total
  CHESTAGIO: string | null; // xs:string, opt, Carga horária de estágio
  NUMCREDITOS: string | null; // xs:string, opt, Nº de créditos
  OBJETIVODISCIPLINA: string | null; // xs:string, opt, Objetivo
  IDGRUPOCOMPLEMENTO: number | null; // xs:int, opt, Id. grupo de complemento
  NOMEHABILITACAO: string | null; // xs:string, opt, Nome da Habilitação
  NOMECURSO: string | null; // xs:string, opt, Nome
  CODAREACONHECIMENTO: number | null; // xs:int, opt, Cód. Área Conhec.
  NUMAULASPORSEMANA: number | null; // xs:int, opt, Nº de aulas semanais
  CHPRESENCIAL: number | null; // xs:decimal, opt, Presencial
  CHDISTANCIA: number | null; // xs:decimal, opt, À distância
  CHSINCRONA: number | null; // xs:decimal, opt, Síncrona
  CHSINCRONAMEDIADA: number | null; // xs:decimal, opt, Síncrona mediada
  CHASSINCRONA: number | null; // xs:decimal, opt, Assíncrona
}

export interface SDISCGRADECOMPL {
  CODCOLIGADA: number; // xs:short, req, default:1
  CODCURSO: string; // xs:string, req
  CODHABILITACAO: string; // xs:string, req
  CODGRADE: string; // xs:string, req
  CODPERIODO: number; // xs:short, req
  CODDISC: string; // xs:string, req, default:
  IDTURMADISC_SE: number | null; // xs:int, opt
  IDTURMADISC_SE_2: number | null; // xs:int, opt
}

// === EduGradeData ===
export interface SGrade {
  CODCURSO: string; // xs:string, max:10, req, Cód. Curso
  CODHABILITACAO: string; // xs:string, max:10, req, Cód. Habilitação
  CODGRADE: string; // xs:string, max:10, req, Código
  APLICACAO: string | null; // xs:string, max:1, opt, Código do Sistema
  CODFORMULA: string | null; // xs:string, max:8, opt, Fórmula para cálculo da média global
  CODFORMULACR: string | null; // xs:string, max:8, opt, Fórmula do coeficiente de rendimento
  DESCRICAO: string | null; // xs:string, max:255, opt, Matriz curricular
  CONTROLEVAGAS: string; // xs:string, max:1, req, Controle de vagas
  REGIME: string | null; // xs:string, max:1, opt, default:S, Regime
  STATUS: string | null; // xs:string, max:1, opt, default:0, Status
  TIPOATIVIDADECURRICULAR: string | null; // xs:string, max:1, opt, default:H, Tipo de avaliação das atividades curriculares
  TIPOELETIVA: string | null; // xs:string, max:1, opt, default:H, Tipo de avaliação das disciplinas eletivas
  TIPOOPTATIVA: string | null; // xs:string, max:1, opt, default:H, Tipo de avaliação das disciplinas optativas
  CODCURSOPROX: string | null; // xs:string, max:10, opt, Próximo curso
  CODGRADEPROX: string | null; // xs:string, max:10, opt, Próxima matriz curricular
  CODHABILITACAOPROX: string | null; // xs:string, max:10, opt, Próxima série
  CODCOLIGADA: number; // xs:short, req, default:1, Código da Coligada
  DTINICIO: string | null; // xs:dateTime, opt, Data de início
  DTFIM: string | null; // xs:dateTime, opt, Data de término
  MAXCREDPERIODO: number | null; // xs:decimal, opt, Max. créditos
  MINCREDPERIODO: number | null; // xs:decimal, opt, Min. créditos
  CARGAHORARIA: number | null; // xs:decimal, opt, Carga Horária
  HABILITACAO: string | null; // xs:string, opt, Habilitação
  CURSO: string | null; // xs:string, opt, Curso
  DTDOU: string | null; // xs:dateTime, opt, Dt. D.O.U.
  DECRETOCURSO: string | null; // xs:string, opt, Decreto do curso
  DESCRICAOCURSO: string | null; // xs:string, opt, Descrição do curso
  DESCRICAOHABILITACAO: string | null; // xs:string, opt, Descrição da habilitação
  DECRETOHABILITACAO: string | null; // xs:string, opt, Decreto da habilitação
  CODPERIODO: string | null; // xs:string, opt, default:1
  CARGAHORARIAATVCOMP: number | null; // xs:decimal, opt
  TOTALCREDITOS: number | null; // xs:decimal, opt, Total de créditos
  CONSMINEXIGATVCURR: string | null; // xs:string, opt, default:N, Considerar mínimos exigidos das atividades curriculares
  QTDMINPERIODOSCURSAR: number | null; // xs:int, opt, Qtd mín. de períodos letivos a cursar
  QTDMINOPTELE: number | null; // xs:int, opt, Qtd mín. de optativas/eletivas a cursar
  GERARAPROVESTUDO: number | null; // xs:short, opt, default:0, Caso haja equivalência entre níveis de ensino, gerar automaticamente aproveitamento de estudo no momento da matrícula
  CARGAHORARIAEXTENSAO: number | null; // xs:decimal, opt, CH extensão
  IDFT: number | null; // xs:int, opt
  PERCCHEXTENSAO: number | null; // xs:decimal, opt
  CODENFASE: number | null; // xs:short, opt, Ênfase
  CHDISCOBRIGATORIA: number | null; // xs:decimal, opt, CH disc. obrigatórias
  CHDISCOPTATIVAELETIVA: number | null; // xs:decimal, opt, CH disc. optativas/eletivas
  CHATIVCOMPLEMENTAR: number | null; // xs:decimal, opt, CH ativ. complementares
  CHESTAGIOSUPERVISIONADO: number | null; // xs:decimal, opt, CH estágio supervis.
  CHPRESENCIAL: number | null; // xs:decimal, opt, CH presencial
  CHDISTANCIA: number | null; // xs:decimal, opt, CH à distância (EAD)
  CHSINCRONA: number | null; // xs:decimal, opt, CH síncrona
  CHSINCRONAMEDIADA: number | null; // xs:decimal, opt, CH síncrona mediada
  CHASSINCRONA: number | null; // xs:decimal, opt, CH assíncrona
  CHTCC: number | null; // xs:decimal, opt, CH trab. concl. curso (TCC)
}

export interface SDiscGrade {
  CODCOLIGADA: number; // xs:short, req
  CODCURSO: string; // xs:string, req
  CODHABILITACAO: string; // xs:string, req
  CODGRADE: string; // xs:string, req
  CODPERIODO: number; // xs:short, req
  CODDISC: string; // xs:string, req
  CODGRPDISC: string | null; // xs:string, opt
  PREREQCRED: number | null; // xs:decimal, opt
  POSHIST: number | null; // xs:int, opt
  NUMCREDITOSCOB: number | null; // xs:decimal, opt
  DESCRICAO: string | null; // xs:string, opt
  VALORCREDITO: number | null; // xs:decimal, opt
  TIPODISC: string | null; // xs:string, opt
  CH: number | null; // xs:decimal, opt
  OBJETIVO: string | null; // xs:string, opt
  DECIMAIS: number | null; // xs:int, opt
  PERCAULASNAOPRES: number | null; // xs:decimal, opt
  PRIORIDADEMATRICULA: number | null; // xs:int, opt
  ATIVIDADE: string | null; // xs:string, opt
  CALCMEDIAGLOBAL: string | null; // xs:string, opt
  DESEMPENHOALUNO: string | null; // xs:string, opt
  IMPBOLETIM: string | null; // xs:string, opt
  TIPONOTA: string | null; // xs:string, opt
  NUMMINDISC: number | null; // xs:int, opt
  CRDISC: number | null; // xs:int, opt
  CHDISC: number | null; // xs:decimal, opt
  NOME: string | null; // xs:string, opt
  NOMEREDUZIDO: string | null; // xs:string, opt
  COMPLEMENTO: string | null; // xs:string, opt
  CHDISCIPLINA: string | null; // xs:string, opt
  CHESTAGIO: string | null; // xs:string, opt
  NUMCREDITOS: string | null; // xs:string, opt
  OBJETIVODISCIPLINA: string | null; // xs:string, opt
}

export interface SOptativas {
  CODCOLIGADA: number; // xs:short, req
  CODDISC: string; // xs:string, req
  CODCURSO: string; // xs:string, req
  CODHABILITACAO: string; // xs:string, req
  CODGRADE: string; // xs:string, req
  TIPO: string | null; // xs:string, opt
  NOMEDISCIPLINA: string | null; // xs:string, opt
  NOMEREDUZIDO: string | null; // xs:string, opt
  COMPLEMENTO: string | null; // xs:string, opt
  CHDISCIPLINA: string | null; // xs:string, opt
  CHESTAGIO: string | null; // xs:string, opt
  NUMCREDITOS: string | null; // xs:string, opt
  OBJETIVODISCIPLINA: string | null; // xs:string, opt
}

export interface SGRADECOMPL {
  CODCOLIGADA: number; // xs:short, req, default:1
  CODCURSO: string; // xs:string, req
  CODHABILITACAO: string; // xs:string, req
  CODGRADE: string; // xs:string, req
  IDTURMADISCSE: number | null; // xs:int, opt
  IDTURMADISCSE2: number | null; // xs:int, opt
}

// === EduProfessorData ===
export interface SProfessor {
  CHAPA: string | null; // xs:string, max:16, opt, Chapa
  CODPROF: string; // xs:string, max:10, req, default:0, Código do Professor
  NOME: string; // xs:string, max:120, req, Nome
  NOMESOCIAL: string | null; // xs:string, max:120, opt, Nome Social
  APELIDO: string | null; // xs:string, max:40, opt, Apelido
  GRAUINSTRUCAO: string | null; // xs:string, max:3, opt, Grau de instrução
  RUA: string | null; // xs:string, max:100, opt, Logradouro
  NUMERO: string | null; // xs:string, max:8, opt, Número
  COMPLEMENTO: string | null; // xs:string, max:60, opt, Complemento
  BAIRRO: string | null; // xs:string, max:80, opt, Bairro
  ESTADO: string | null; // xs:string, max:2, opt, Estado
  CIDADE: string | null; // xs:string, max:32, opt, Cidade
  CEP: string | null; // xs:string, max:9, opt
  PAIS: string | null; // xs:string, max:60, opt, País
  REGPROFISSIONAL: string | null; // xs:string, max:15, opt, Reg. profissional
  CPF: string | null; // xs:string, max:14, opt
  TELEFONE1: string | null; // xs:string, max:15, opt, Telefone I
  TELEFONE2: string | null; // xs:string, max:15, opt, Telefone II
  UFCARTIDENT: string | null; // xs:string, max:2, opt, UF Identidade
  ORGEMISSORIDENT: string | null; // xs:string, max:15, opt, Órgão emissor
  TITULOELEITOR: string | null; // xs:string, max:14, opt, Tit. de eleitor
  ZONATITELEITOR: string | null; // xs:string, max:6, opt, Zona
  SECAOTITELEITOR: string | null; // xs:string, max:6, opt, Seção
  CARTEIRATRAB: string | null; // xs:string, max:10, opt, Cart. de trabalho
  SERIECARTTRAB: string | null; // xs:string, max:5, opt, Série
  UFCARTTRAB: string | null; // xs:string, max:2, opt, UF Cart. de trabalho
  CARTMOTORISTA: string | null; // xs:string, max:15, opt, Cart. Motorista
  TIPOCARTHABILIT: string | null; // xs:string, max:5, opt, Tipo
  CERTIFRESERV: string | null; // xs:string, max:40, opt, Número
  CATEGMILITAR: string | null; // xs:string, max:10, opt, Categoria militar
  CARTMODELO19: string | null; // xs:string, max:15, opt, Carta modelo 19
  NROREGGERAL: string | null; // xs:string, max:15, opt, Registro Nacional Migratório (RNM)
  NRODECRETO: string | null; // xs:string, max:15, opt, Decreto de imigração
  TIPOVISTO: string | null; // xs:string, max:10, opt, Tipo de visto
  TELEFONE3: string | null; // xs:string, max:15, opt, Telefone III
  FAX: string | null; // xs:string, max:15, opt
  EXPED: string | null; // xs:string, max:10, opt, Órgão emissor
  CSM: string | null; // xs:string, max:10, opt, Circunscrição
  RM: string | null; // xs:string, max:10, opt, Região militar
  SITMILITAR: string | null; // xs:string, max:10, opt, Situação militar
  RECURSOREALIZACAOTRAB: string | null; // xs:string, max:120, opt, Recursos para realização do trabalho
  RECURSOACESSIBILIDADE: string | null; // xs:string, max:120, opt, Recursos para acessibilidade ao local de trabalho
  TIPOSANG: string | null; // xs:string, max:10, opt, Tipo sangüíneo
  NPASSAPORTE: string | null; // xs:string, max:15, opt, Nº do passaporte
  PAISORIGEM: string | null; // xs:string, max:20, opt, País de origem
  CERTSERVENTIA: string | null; // xs:string, max:6, opt, Nº de serventia do cartório
  USERID: string | null; // xs:string, max:50, opt, Id. Usuário (USERID)
  CODMUNICIPIO: string | null; // xs:string, max:20, opt, Código do Município
  LOCALIDADE: string | null; // xs:string, max:20, opt, Localidade
  PRIMEIRONOME: string | null; // xs:string, max:40, opt, Nome
  SOBRENOMEPAI: string | null; // xs:string, max:40, opt, Sobrenome do pai
  SOBRENOMEMAE: string | null; // xs:string, max:40, opt, Sobrenome da mãe
  CODNATURALIDADE: string | null; // xs:string, max:20, opt
  NUMERORIC: string | null; // xs:string, max:20, opt, Número RIC
  ORGEMISSORRIC: string | null; // xs:string, max:20, opt, Orgão e UF Emissor RIC
  ORGEMISSORCNH: string | null; // xs:string, max:20, opt, Orgão Emissor CNH
  ORGEMISSORRNE: string | null; // xs:string, max:20, opt, UF Emissor
  MATRICULAOBITO: string | null; // xs:string, max:50, opt, Matrícula da Certidão de Óbito
  PORTARIANATURALIZACAO: string | null; // xs:string, max:16, opt, Portaria de Naturalização
  CODCLASSIFTRABESTRANG: string | null; // xs:string, max:20, opt, Classificação da condição no Brasil
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODPESSOA: number | null; // xs:int, opt, Pessoa
  VALORAULA: number | null; // xs:decimal, opt, Valor aula
  CODTITULACAO: number | null; // xs:short, opt, Titulação
  HORARIOUTILIZADO: number | null; // xs:short, opt, Horário utilizado
  CODIGO: number | null; // xs:int, opt, Código
  DTNASCIMENTO: string; // xs:dateTime, req, Data de nascimento
  ESTADOCIVIL: string | null; // xs:string, opt, Estado civil
  SEXO: string | null; // xs:string, opt, default:M, Sexo
  NACIONALIDADE: string | null; // xs:string, opt, default:10, Nacionalidade
  IDIMAGEM: number | null; // xs:int, opt, ID imagem
  CARTIDENTIDADE: string | null; // xs:string, opt, Cart. de identidade
  DTEMISSAOIDENT: string | null; // xs:dateTime, opt, Data de emissão
  DTCARTTRAB: string | null; // xs:dateTime, opt, Data de emissão
  NIT: number | null; // xs:short, opt, Nit
  DTVENCHABILIT: string | null; // xs:dateTime, opt, Data de vencimento
  NATURALIDADE: string; // xs:string, req, Naturalidade
  ESTADONATAL: string; // xs:string, req, Estado natal
  DATACHEGADA: string | null; // xs:dateTime, opt, Data de chegada ao Brasil
  CONJUGEBRASIL: number | null; // xs:short, opt, Cônjuge no Brasil
  NATURALIZADO: number | null; // xs:short, opt, Naturalizado
  FILHOSBRASIL: number | null; // xs:int, opt, Filhos no Brasil
  NROFILHOSBRASIL: number | null; // xs:short, opt, Nº de filhos no Brasil
  DTVENCIDENT: string | null; // xs:dateTime, opt, Data de venc. RNM
  DTVENCCARTTRAB: string | null; // xs:dateTime, opt, Data de vencimento
  EMAIL: string | null; // xs:string, opt, E-Mail
  INVESTTREINANT: number | null; // xs:decimal, opt, Investimento em treinamentos anteriores
  CORRACA: number | null; // xs:short, opt, Cor / Raça
  DEFICIENTEFISICO: number | null; // xs:short, opt, Física
  CODUSUARIO: string | null; // xs:string, opt, Usuário
  EMPRESA: string | null; // xs:string, opt, Empresa
  CODPROFISSAO: number | null; // xs:int, opt, Profissão
  CODOCUPACAO: string | null; // xs:string, opt, Cargo
  CODFILIAL: number | null; // xs:short, opt
  CODTIPOCURSO: number | null; // xs:short, opt
  NOMEFUNCAO: string | null; // xs:string, opt, Função do Folha de pagamento
  DTTITELEITOR: string | null; // xs:dateTime, opt, Data de emissão
  DTEXPCML: string | null; // xs:dateTime, opt, Data de emissão
  ESTELEIT: string | null; // xs:string, opt, Estado
  DEFICIENTEFALA: number | null; // xs:short, opt, Fala
  DEFICIENTEVISUAL: number | null; // xs:short, opt, Visual
  DEFICIENTEAUDITIVO: number | null; // xs:short, opt, Auditiva
  DEFICIENTEMENTAL: number | null; // xs:short, opt, Mental
  DTEMISSPASSAPORTE: string | null; // xs:dateTime, opt, Emissão
  DTVALPASSAPORTE: string | null; // xs:dateTime, opt, Data de validade
  IMAGEM: Buffer | null; // xs:base64Binary, opt
  CERTNUMERO: string | null; // xs:string, opt, Número da certidão
  CERTFOLHA: string | null; // xs:string, opt, Folha do livro da certidão
  CERTUF: string | null; // xs:string, opt, UF
  CERTLIVRO: string | null; // xs:string, opt, Livro da certidão
  CERTDATA: string | null; // xs:dateTime, opt, Data da certidão
  CERTCARTORIO: string | null; // xs:string, opt, Cartório
  TIPOCERTIDAO: string | null; // xs:string, opt, Tipo de Certidão
  CERTIDISTRITO: string | null; // xs:string, opt
  CERTCOMARCA: string | null; // xs:string, opt, Comarca
  CODIGOPT: number | null; // xs:int, opt
  CODFREGUESIA: string | null; // xs:string, opt
  CODPOSTAL: string | null; // xs:string, opt
  NUMEROCARTCIDADAO: string | null; // xs:string, opt
  DTEMISSAOCARTCIDADAO: string | null; // xs:dateTime, opt
  ORGEXPCARTCIDADAO: string | null; // xs:string, opt
  DTVALIDADECARTCIDADAO: string | null; // xs:dateTime, opt
  POVOINDIGENA: string | null; // xs:string, opt, Povo indígena
  CODMEMOOBS: number | null; // xs:int, opt, Cód. Observações para o PPP
  BRPDH: number | null; // xs:short, opt, default:0, Reabilitado(BR)
  FUMANTE: number | null; // xs:short, opt, Fumante
  OBSPESSOA: string | null; // xs:string, opt, Observações da pessoa
  IDIMAGEMDOC: number | null; // xs:int, opt, ID Imagem do documento
  IDIMAGEMDOCV: number | null; // xs:int, opt, ID Imagem do verso do documento
  AJUSTATAMANHOFOTO: number | null; // xs:short, opt, Ajusta tamanho da foto?
  DATAAPROVACAOCURR: string | null; // xs:dateTime, opt, Data da aprovação do currículo
  IDBIOMETRIA: number | null; // xs:int, opt
  ESTADOROW: number | null; // xs:short, opt, default:0
  ROWVALIDA: string | null; // xs:unsignedShort, opt, default:0
  ALUNO: number | null; // xs:short, opt, default:0, É aluno
  PROFESSOR: number | null; // xs:short, opt, default:0, É professor
  CANDIDATO: number | null; // xs:short, opt, default:0, É candidato
  USUARIOBIBLIOS: number | null; // xs:short, opt, default:0, É usuário biblios
  FUNCIONARIO: number | null; // xs:short, opt, default:0, É funcionário
  EXFUNCIONARIO: number | null; // xs:short, opt, default:0, É ex-funcionário
  CODIGOMX: number | null; // xs:int, opt
  TAGSCRIPT: string | null; // xs:string, opt, Tags de busca
  NROINT: string | null; // xs:string, opt
  CURP: string | null; // xs:string, opt
  DTVENCIDENTPT: string | null; // xs:dateTime, opt, Dt. Vencimento
  CODTIPOBAIRRO: number | null; // xs:short, opt, Cód. Tipo Bairro
  CODORGAOCLASSE: string | null; // xs:string, opt, Órgão da Classe
  CODUFREGISTRO: string | null; // xs:string, opt, UF Registro Profissional
  CODTIPORUA: number | null; // xs:short, opt, Cód. Tipo Rua
  DTEMISSAORIC: string | null; // xs:dateTime, opt, Data Emissão RIC
  DTEMISSAOCNH: string | null; // xs:dateTime, opt, Data Emissão CNH
  DATANATURALIZACAO: string | null; // xs:dateTime, opt, Data Naturalização
  DTEMISSAORNE: string | null; // xs:dateTime, opt, Data Emissão RNM
  IDPAIS: number | null; // xs:int, opt, Código do País
  DEFICIENTEINTELECTUAL: number | null; // xs:short, opt, default:0, Intelectual
  DATAOBITO: string | null; // xs:dateTime, opt, Data do Óbito
  FALECIDO: number | null; // xs:short, opt, default:0, Falecido
  DATAPRIMEIRACNH: string | null; // xs:dateTime, opt, Data Primeira CNH
  UFCNH: string | null; // xs:string, opt, Estado Emissor
  EMAILPESSOAL: string | null; // xs:string, opt, Email Pessoal
  ANO1EMPREGO: number | null; // xs:int, opt, Ano do Primeiro Emprego
  IDADE: number | null; // xs:int, opt, Idade
  TIPOPRAZORESIDENCIA: number | null; // xs:short, opt, default:0, Prazo de residência indeterminado
  DEFICIENTEOUTROS: string | null; // xs:string, opt, default:0, Outros
  CERTDISTRITO: string | null; // xs:string, opt
  FIADOR_SGI: number | null; // xs:short, opt
  CONJUGE_SGI: number | null; // xs:short, opt
  DEFICIENTEMOBREDUZIDA: number | null; // xs:short, opt
  RECCREATEDBY: string | null; // xs:string, opt
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDBY: string | null; // xs:string, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
  DEFICIENTEOBSERVACAO: string | null; // xs:string, opt
  MUDOUCPF: number | null; // xs:short, opt
}

export interface SProfessorCompl {
  CODCOLIGADA: number; // xs:short, req, default:1
  CODPROF: string; // xs:string, req
  SENHAPROF: string | null; // xs:string, opt
}

// === EduHorarioTurmaData ===
export interface SHorarioTurma {
  CODPREDIO: string | null; // xs:string, max:5, opt, Cód. Prédio
  CODSALA: string | null; // xs:string, max:10, opt, Sala
  LOCACAO: string | null; // xs:string, max:60, opt, Locação
  TIPOAULA: string | null; // xs:string, max:1, opt, Tipo aula
  NOMETURNO: string | null; // xs:string, max:15, opt, Turno
  HORAINICIAL: string | null; // xs:string, max:5, opt, Início
  HORAFINAL: string | null; // xs:string, max:5, opt, Término
  CODBLOCO: string | null; // xs:string, max:5, opt, Cód. Bloco
  CODSUBTURMA: string | null; // xs:string, max:20, opt, Subturma
  SCIENTIAACTIVITYHOSTKEY: string | null; // xs:string, max:255, opt
  CODHORARIOTURMA: string | null; // xs:string, max:100, opt
  URLAULAONLINE: string | null; // xs:string, max:2048, opt, Aula Online
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  IDHORARIOTURMA: number; // xs:int, req, default:0, Id. do Horário
  CODHOR: number; // xs:int, req, Código horário
  IDTURMADISC: number; // xs:int, req
  CODFILIAL: number | null; // xs:short, opt, Filial
  DATAINICIAL: string | null; // xs:dateTime, opt, Data inicial
  DATAFINAL: string | null; // xs:dateTime, opt, Data final
  DIASEMANA: number | null; // xs:short, opt, Dia da semana
  IDPERLET: number | null; // xs:int, opt, Id. Período letivo
  CODTIPOSALA: number | null; // xs:short, opt, Tipo de sala
  RECCREATEDBY: string | null; // xs:string, opt
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDBY: string | null; // xs:string, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
  IDHORARIOTURMAVINC: number | null; // xs:int, opt, Id. do Horário
  ESPELHO: string | null; // xs:string, opt
  CODTIPOCURSO: number | null; // xs:short, opt
}

// === EduFrequenciaDiariaWSData ===
export interface SFREQUENCIA {
  RA: string; // xs:string, max:20, req, R.A.
  PRESENCA: string; // xs:string, max:1, req, Presença
  JUSTIFICADA: string | null; // xs:string, max:1, opt, Abona
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  IDHORARIOTURMA: number; // xs:int, req, Identificador do horário da turma
  IDTURMADISC: number; // xs:int, req, Turma disciplina
  DATA: string; // xs:dateTime, req, Data
  IDJUSTIFICATIVAFALTA: number | null; // xs:int, opt
}

export interface PARAMS {
  CODCOLIGADA: number; // xs:short, req
  IDTURMADISC: number; // xs:int, req
  CODETAPA: string; // xs:string, req
  AULASDADAS: number | null; // xs:int, opt
  CODSUBTURMA: string | null; // xs:string, opt
}

export interface AlunosFreq {
  CODCOLIGADA: number; // xs:short, req
  RA: string; // xs:string, req
  IDTURMADISC: number; // xs:int, req
  IDTURMADISCORIGEM: number | null; // xs:int, opt
}

export interface PlanoAulaFreq {
  CODCOLIGADA: number | null; // xs:int, opt
  IDTURMADISC: number | null; // xs:int, opt
  CODETAPA: number | null; // xs:int, opt
  AULA: number | null; // xs:int, opt
  FREQUENCIADISPWEB: number | null; // xs:int, opt
}

// === EduNotasData ===
export interface SNotas {
  TIPOETAPA: string; // xs:string, max:1, req, Tipo da etapa
  RA: string; // xs:string, max:20, req, R.A.
  CODCONCEITO: string | null; // xs:string, max:10, opt, Conceito
  COMENTARIO: string | null; // xs:string, max:1000000, opt, Comentário
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODPROVA: number; // xs:short, req, Avaliação
  CODETAPA: number; // xs:short, req, Etapa
  IDTURMADISC: number; // xs:int, req, Turma disciplina
  IDGRUPO: number | null; // xs:short, opt, Grupo de conceitos
  NOTA: number | null; // xs:decimal, opt, Nota
  NUMACERTOS: number | null; // xs:int, opt, Número de Acertos
  NOMEETAPA: string | null; // xs:string, opt, Nome da etapa
  NUMDIARIO: number | null; // xs:int, opt
  MEDIA: number | null; // xs:decimal, opt
  DTPROVA: string | null; // xs:dateTime, opt
  VALOR: number | null; // xs:decimal, opt
  DESCPROVA: string | null; // xs:string, opt
  DISPONIVELALUNOS: string | null; // xs:string, opt
  PERMITEENTREGAWEB: string | null; // xs:string, opt
  NOME: string | null; // xs:string, opt
  NOMECIVIL: string | null; // xs:string, opt
  NOMESOCIAL: string | null; // xs:string, opt
  RANOTAS: string | null; // xs:string, opt
  NOTAETAPA: number | null; // xs:decimal, opt
  CODCONCEITOETAPA: string | null; // xs:string, opt
  IDGRUPONOTAS: number | null; // xs:short, opt
  NOTASFALTASWEB: string | null; // xs:string, opt
  DIBLOQNOTAFALTA: string | null; // xs:string, opt
  CODSTATUS: number | null; // xs:int, opt
  DESCRICAO: string | null; // xs:string, opt
  MEDIAETAPA: number | null; // xs:decimal, opt
  DTINICIODIGITACAO: string | null; // xs:dateTime, opt
  DTLIMITEDIGITACAO: string | null; // xs:dateTime, opt
  ETAPAENCERRADA: string | null; // xs:string, opt
  CODFORMULANOTA: string | null; // xs:string, opt
  DATAATUAL: string | null; // xs:dateTime, opt
  DTINICIALDIGITACAOTURMADISC: string | null; // xs:dateTime, opt
  DTFINALDIGITACAOTURMADISC: string | null; // xs:dateTime, opt
  CODFILIAL: number | null; // xs:short, opt
  CODTIPOCURSO: number | null; // xs:short, opt
  DESCRESULT: string | null; // xs:string, opt
  CODDESCRESULT: number | null; // xs:int, opt
  DIBLOQNOTAFALTARES: string | null; // xs:string, opt
  NOTASFALTASWEBRES: string | null; // xs:string, opt
  CODPESSOA: number | null; // xs:int, opt
  CODPROVATESTIS: string | null; // xs:string, opt
  IDTURMADISCORIGEM: number | null; // xs:int, opt
  IDHABILITACAOFILIAL: number | null; // xs:int, opt
}

export interface SNotasComentario {
  CODCOLIGADA: number; // xs:short, req, default:1
  CODPROVA: number; // xs:short, req
  CODETAPA: number; // xs:short, req
  TIPOETAPA: string; // xs:string, req
  IDTURMADISC: number; // xs:int, req
  RA: string; // xs:string, req
  COMENTARIO: string | null; // xs:string, opt
}

export interface NOTASVIEW {
  CODCOLIGADA: number; // xs:short, req
  IDTURMADISC: number; // xs:int, req
  NUMDIARIO: number | null; // xs:int, opt, Nº
  RA: string; // xs:string, req, R.A.
  NOME: string | null; // xs:string, opt, Aluno
  DESCRICAO: string | null; // xs:string, opt, Status
  NOTASFALTASWEB: string | null; // xs:string, opt
  DIBLOQNOTAFALTA: string | null; // xs:string, opt
  MEDIAETAPA: number | null; // xs:decimal, opt
  DTINICIODIGITACAO: string | null; // xs:dateTime, opt
  DTLIMITEDIGITACAO: string | null; // xs:dateTime, opt
  DTINICIALDIGITACAOTURMADISC: string | null; // xs:dateTime, opt
  DTFINALDIGITACAOTURMADISC: string | null; // xs:dateTime, opt
  CODETAPA: number | null; // xs:int, opt
  TIPOETAPA: string | null; // xs:string, opt
  NOTAETAPA: number | null; // xs:decimal, opt, Nota na etapa
  CODCONCEITOETAPA: string | null; // xs:string, opt, Nota na etapa
  CODPROVATESTIS: string | null; // xs:string, opt, Cod. Prova do TOTVS Educacional Avaliação e Pesquisa
  CODPESSOA: string | null; // xs:string, opt, Cod. Pessoa
  IDTURMADISCORIGEM: number | null; // xs:int, opt, Turma disciplina original
  DISPONIVELALUNOS: string | null; // xs:string, opt, Disponível alunos
  IDHABILITACAOFILIAL: number | null; // xs:int, opt, Habilitação Filial
  NOMESOCIAL: string | null; // xs:string, opt, Nome Social
  NOMECIVIL: string | null; // xs:string, opt, Aluno
}

// === EduProfessorTurmaData ===
export interface SPROFESSORTURMA {
  CODPERLET: string | null; // xs:string, max:10, opt, Período letivo
  CODTURMA: string | null; // xs:string, max:20, opt, Código da Turma
  CODDISC: string | null; // xs:string, max:20, opt, Código da disciplina
  NOME: string | null; // xs:string, max:120, opt, Nome
  TIPOPROF: string | null; // xs:string, max:1, opt, Tipo professor
  CODPROF: string; // xs:string, max:10, req, Professor
  DESCONSIDERAPONTO: string | null; // xs:string, max:1, opt, Desconsidera ponto
  COMPOESALARIO: string | null; // xs:string, max:1, opt, default:N, Compõe salário
  RECCREATEDBY: string | null; // xs:string, max:50, opt, Criado por
  RECMODIFIEDBY: string | null; // xs:string, max:50, opt, Modificado por
  USERID: string | null; // xs:string, max:50, opt, Id. usuário (USERID)
  CODUSUARIO: string | null; // xs:string, max:20, opt, default:andre.gusman, Usuário
  RESPONSAVELASSINARDIARIO: string | null; // xs:string, max:1, opt, default:N, Responsável por iniciar o processo de assinatura do diário
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  IDPROFESSORTURMA: number; // xs:int, req, default:0, Id. professor/turma
  IDPERLET: number | null; // xs:int, opt, Id. Período letivo
  IDTURMADISC: number | null; // xs:int, opt, Id. turma/disciplina
  DTINICIO: string; // xs:dateTime, req, Data de início
  VALORHORA: number | null; // xs:double, opt, Valor por hora
  AULASSEMANAISPROF: number | null; // xs:double, opt, Aulas por semana
  DTFIM: string | null; // xs:dateTime, opt, Data de término
  VALORFIXO: number | null; // xs:double, opt, Valor fixo
  PERCENTFATURAMENTO: number | null; // xs:double, opt, Faturamento (%)
  NOMEDISCIPLINA: string | null; // xs:string, opt, Nome da disciplina
  CODTIPOPART: string | null; // xs:string, opt, Tipo de Participação
  RECCREATEDON: string | null; // xs:dateTime, opt, Criado em
  RECMODIFIEDON: string | null; // xs:dateTime, opt, Modificado em
  STATUS: number | null; // xs:short, opt, default:2, Status do registro
  IDPROFESSORTURMAANTIGO: number | null; // xs:int, opt, default:0, Id. professor/turma
  IDTURMADISCANTIGO: number | null; // xs:int, opt, Id. turma/disciplina
  FUNCAOPROFTURMA: number | null; // xs:short, opt, Função do professor
  CODPESSOA: number | null; // xs:int, opt
  UCELETIVAS: number | null; // xs:short, opt, default:0, Eletivas
  UCLIBRAS: number | null; // xs:short, opt, default:0, Libras
  UCLINGUAINDIGENA: number | null; // xs:short, opt, default:0, Língua indígena
  UCLINGUALITESTRANGEIRAESPANHOL: number | null; // xs:short, opt, default:0, Língua/Literatura estrangeira - Espanhol
  UCLINGUALITESTRANGEIRAFRANCES: number | null; // xs:short, opt, default:0, Língua/Literatura estrangeira - Francês
  UCLINGUALITESTRANGEIRAOUTRA: number | null; // xs:short, opt, default:0, Língua/Literatura estrangeira - outra
  UCPROJETOVIDA: number | null; // xs:short, opt, default:0, Projeto de vida
  UCTRILHASAPROFUNDAPRENDIZAGEM: number | null; // xs:short, opt, default:0, Trilhas de aprofundamento/aprendizagens
  CODTABELA: string | null; // xs:string, opt
  NIVEL: string | null; // xs:string, opt
  FAIXA: string | null; // xs:string, opt
  CALCULARESILICAO: string | null; // xs:string, opt
  DATARESILICAO: string | null; // xs:dateTime, opt
  TIPORESILICAO: string | null; // xs:string, opt
  TIPOMEDIACAO: number | null; // xs:short, opt, Tipo de mediação
  UCOUTRAS: number | null; // xs:short, opt, default:0, Outra(s) unidade(s) curricular(es) obrigatória(s)
  AREAITINERARIOLINGUAGENS: number | null; // xs:short, opt, default:0, Linguagens e suas tecnologias
  AREAITINERARIOMATEMATICA: number | null; // xs:short, opt, default:0, Matemática e suas tecnologias
  AREAITINERARIONATUREZA: number | null; // xs:short, opt, default:0, Ciências da natureza e suas tecnologias
  AREAITINERARIOHUMANAS: number | null; // xs:short, opt, default:0, Ciências humanas e sociais aplicadas
  PROFISSIONALLECIONAIFTP: number | null; // xs:short, opt, default:0, Profissional escolar leciona no Itinerário de formação técnica e profissional (IFTP)
  DOCENTEREGENTE: number | null; // xs:short, opt, default:0, Docente Regente
  DOCENTECONTEUDISTA: number | null; // xs:short, opt, default:0, Docente Conteudista
  DOCENTECOORDENADOR: string | null; // xs:unsignedShort, opt, default:0, Docente Coordenador
}

export interface SPROFESSORTURMACOMPL {
  CODCOLIGADA: number; // xs:short, req, default:1
  IDPROFESSORTURMA: number; // xs:int, req
}

// === EduNotaEtapaData ===
export interface SNotaEtapa {
  TIPOETAPA: string; // xs:string, max:1, req, Tipo da etapa
  RA: string; // xs:string, max:20, req, R.A.
  CODCONCEITO: string | null; // xs:string, max:10, opt, Conceito
  CONCEITOECTS: string | null; // xs:string, max:10, opt, Classif. ECTS
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODETAPA: number; // xs:short, req, Etapa
  IDTURMADISC: number; // xs:int, req, Turma disciplina
  IDGRUPO: number | null; // xs:short, opt, Grupo de conceitos
  NOTAFALTA: number | null; // xs:decimal, opt, Nota/Falta
  AULASDADAS: number | null; // xs:short, opt, Número de aulas dadas
}

export interface SNotaEtapaComentario {
  CODCOLIGADA: number; // xs:short, req, default:1
  CODPROVA: number; // xs:short, req
  CODETAPA: number; // xs:short, req
  TIPOETAPA: string; // xs:string, req
  IDTURMADISC: number; // xs:int, req
  RA: string; // xs:string, req
  COMENTARIO: string | null; // xs:string, opt
}

// === EduPlanoAulaData ===
export interface SPlanoAula {
  CODPREDIO: string | null; // xs:string, max:5, opt, Cód. Prédio
  CODSALA: string | null; // xs:string, max:10, opt, Sala
  CODPROF: string | null; // xs:string, max:10, opt, Professor substituto
  CONTEUDO: string | null; // xs:string, max:2147483647, opt, Conteúdo Previsto
  LOCACAO: string | null; // xs:string, max:60, opt, Locação
  CONTEUDOEFETIVO: string | null; // xs:string, max:2147483647, opt, Conteúdo Realizado
  REPOSICAO: string | null; // xs:string, max:1, opt, Reposição
  SUBSTITUTO: string | null; // xs:string, max:1, opt, Substituto
  PAGAMENTOPROF: string | null; // xs:string, max:1, opt, Professor que receberá pela aula
  HORAINICIAL: string | null; // xs:string, max:5, opt, Início
  HORAFINAL: string | null; // xs:string, max:5, opt, Término
  TIPOFALTA: string | null; // xs:string, max:1, opt, Falta
  CODBLOCO: string | null; // xs:string, max:5, opt, Cód. Bloco
  CODSUBTURMA: string | null; // xs:string, max:20, opt, Subturma
  LICAOCASA: string | null; // xs:string, max:4000, opt, Lição de casa
  CONFIRMADO: string | null; // xs:string, max:1, opt, default:N, Confirmado
  URLAULAONLINE: string | null; // xs:string, max:2048, opt, Aula Online
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  IDTURMADISC: number; // xs:int, req, Id. turma/disciplina
  AULA: number; // xs:int, req, Aula
  IDHORARIOTURMA: number; // xs:int, req, Id. do Horário
  CODFILIAL: number | null; // xs:short, opt, Filial
  CODHOR: number; // xs:int, req, Código horário
  DATA: string | null; // xs:dateTime, opt, Data
  DATAEFETIVA: string | null; // xs:dateTime, opt, Data
  HORAINICIALREALIZADO: string | null; // xs:string, opt, HORAINICIAL
  HORAFINALREALIZADO: string | null; // xs:string, opt, HORAFINAL
  CODTURMA: string | null; // xs:string, opt, Código da Turma
  CODDISC: string | null; // xs:string, opt, Código da disciplina
  NOMEDISC: string | null; // xs:string, opt, Nome da disciplina
  FREQUENCIADISPWEB: string | null; // xs:string, opt, Frequência disponível para os alunos
  DIASEMANA: string | null; // xs:string, opt, Dia da semana
  OBSERVACAO: string | null; // xs:string, opt, Observação
  IDPLANOAULA: number; // xs:int, req, Id. plano aula
  TIPOAULA: string | null; // xs:string, opt, Tipo aula
  IDPERLET: number | null; // xs:int, opt, Id. Período letivo
  PREDIO: string | null; // xs:string, opt, Prédio
  BLOCO: string | null; // xs:string, opt, Bloco
  SALA: string | null; // xs:string, opt, Sala
}

export interface SPlanoAulaArquivo {
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  IDTURMADISC: number; // xs:int, req, Id. turma/disciplina
  IDPLANOAULA: number; // xs:int, req, Id. plano aula
  IDMATERIALSEC: number; // xs:int, req, Id. do arquivo da aula
  PATHARQUIVO: string; // xs:string, req, Arquivo
  DESCRICAO: string; // xs:string, req, Descrição
  ARQUIVO: Buffer; // xs:base64Binary, req, Arquivo
}

// === EduTipoMatriculaData ===
export interface STipoMatricula {
  DESCRICAO: string; // xs:string, max:60, req, Descrição
  PERMITETRANCAMENTO: string | null; // xs:string, max:1, opt, default:0, Permite trancamento
  INDICADEPENDENCIA: string | null; // xs:string, max:1, opt, default:0, Indica Dependência
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODTIPOMAT: number; // xs:short, req, default:0, Código
  CODTIPOCURSO: number; // xs:short, req, Nível de ensino
}

// === EduStatusData ===
export interface SStatus {
  DESCRICAO: string; // xs:string, max:30, req, Descrição
  PLDIARIO: string | null; // xs:string, max:1, opt, default:N, Aluno com esta situação de matrícula é exibido no diário
  PLMDSTANTIGODISC: string | null; // xs:string, max:1, opt, default:N, Disciplinas com esta situação de matrícula assumem a nova situação de matrícula do período letivo
  PLREMATRICULA: string | null; // xs:string, max:1, opt, default:N, Opções para matrícula no próximo P. Let
  PLBLQALTSITMATSEMFIADORAPROV: string | null; // xs:string, max:1, opt, default:N, Bloqueia alteração para este status por falta de fiador aprovado
  PLPRMMATITINERARIOPRTMENUEXCL: string | null; // xs:string, max:1, opt, default:N, Permite matricular em Itinerários Formativos
  PERMITEALUNOCANCELARDISCPORTAL: string | null; // xs:string, max:1, opt, default:N, Permite cancelar disciplina na matrícula
  PLITBLQALTSITMATITINERARIOPRT: string | null; // xs:string, max:1, opt, default:N, Bloqueia alteração de situação matrícula em itinerário formativo na matrícula online
  PERALTINCITINERMENUEXCMATIFPRT: string | null; // xs:string, max:1, opt, default:N, Permite incluir itinerário formativo
  PEREXCITINERARMENUEXCMATIFPRT: string | null; // xs:string, max:1, opt, default:N, Permite excluir itinerário formativo
  PLALTSTATUSDISCITFORCONTALUMAT: string | null; // xs:string, max:1, opt, default:N, Alterar situação de matrícula apenas das disciplinas de itinerário que contam como aluno matriculado na turma
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODSTATUS: number; // xs:int, req, default:0, Código
  CODTIPOCURSO: number; // xs:short, req, Nível de ensino
  CUCODSTATUSPL: number | null; // xs:int, opt, Modifica a situação de matrícula do aluno no período letivo atual para
  PLCODSTATUSCUR: number | null; // xs:int, opt, Altera situação de matrícula do aluno no curso para
  PLCODSTATUSDISC: number | null; // xs:int, opt, Altera situação de matrícula das disciplinas em curso e/ou conta como aluno matriculado para
  PLCODTIPOALUNO: number | null; // xs:short, opt, Altera tipo do aluno para
  PLINDICATRANC: string | null; // xs:string, opt, default:N, Indica trancamento
  CUCONCCURSO: string | null; // xs:string, opt, default:N, Indica conclusão do curso
  CUINDICAJUBILADO: string | null; // xs:string, opt, default:N, Indica jubilamento
  CUINDICATRANSF: string | null; // xs:string, opt, default:N, Indica transferência
  CUPERMITEMATRICPL: string | null; // xs:string, opt, default:N, Permite matricular o aluno em um período letivo
  CURSO: string | null; // xs:string, opt, default:N, No curso
  DICONTCRTES: string | null; // xs:string, opt, default:N, Conta créditos financeiros (cobrança por crédito)
  DICREDITOCURSADO: string | null; // xs:string, opt, default:N, Conta como créditos cursados ou em curso
  DIEMCURSO: string | null; // xs:string, opt, default:N, É uma disciplina em curso
  DIHISTORICO: string | null; // xs:string, opt, default:N, Imprime no histórico
  DIINCALUNODISC: string | null; // xs:string, opt, default:N, Conta como aluno matriculado na turma e turma/disciplina
  DISCIPLINA: string | null; // xs:string, opt, default:N, Na disciplina
  DISPONIVELWEB: string | null; // xs:string, opt, default:N, Visível para seleção no contexto educacional do Portal
  DIVALIDAPRE: string | null; // xs:string, opt, default:N, Pré/correquisito válido
  LISTAGENSWEB: string | null; // xs:string, opt, default:N, Disponível nas listagens de consulta do professor (ex: Funcionalidade 
  MATRICULAPROVISORIA: string | null; // xs:string, opt, default:N, Matrícula provisória (processo seletivo)
  NOTASFALTASWEB: string | null; // xs:string, opt, default:N, Disponível para digitação de notas/faltas
  PLATIVO: string | null; // xs:string, opt, default:N, Aluno ativo
  PLBLOQFINANC: string | null; // xs:string, opt, default:N, Bloqueia alterações financeiras
  DIBLOQNOTAFALTA: string | null; // xs:string, opt, default:N, Bloquear alterações de notas e faltas
  PLBLQALTSITMAT: string | null; // xs:string, opt, default:N, Bloqueia alteração de situação de matrícula
  PLCANCELACONTRATO: string | null; // xs:string, opt, default:N, Cancela contrato financeiro
  PLDISCAUTOMATICA: string | null; // xs:string, opt, default:N, Matricular automaticamente nas disciplinas da turma
  PLETIVO: string | null; // xs:string, opt, default:N, No período letivo
  PLEXIGECONTRATO: string | null; // xs:string, opt, default:N, Exige contrato financeiro
  PLINCLUIRDISC: string | null; // xs:string, opt, default:N, Bloqueia inclusão/exclusão de disciplinas
  RESULTADO: string | null; // xs:string, opt, default:N, Status de resultado final
  PLPERMITETRANCAMENTO: string | null; // xs:string, opt, default:N, Permite trancamento
  PLPRIORIDADE: string | null; // xs:string, opt, Prioridade matrícula nas disciplinas
  PLORDDISCPERANT: string | null; // xs:string, opt, Disciplinas de períodos anteriores em ordem
  PLLIMITEDISCPERANT: number | null; // xs:int, opt, Buscar disciplinas até o limite de
  PLORDDISCPERPOST: string | null; // xs:string, opt, Disciplinas de períodos anteriores em ordem
  PLLIMITEDISCPERPOST: number | null; // xs:int, opt, Buscar disciplinas até o limite de
  APROVADO: string | null; // xs:string, opt, default:N, Aprovado
  DIINDICATRANC: string | null; // xs:string, opt, default:N, Trancamento da matrícula da disciplina
  PLDISPENTURMACAO: string | null; // xs:string, opt, default:N, Status listado no processo de enturmação
  PERALUMATRICWEB: string | null; // xs:string, opt, default:N, Permite ao aluno efetuar matrícula
  PERALUINCDISC: string | null; // xs:string, opt, default:N, Permite incluir disciplina na matrícula
  PERALUEXCDISC: string | null; // xs:string, opt, default:N, Permite excluir disciplina na matrícula
  PLCANCELAUSUARIOCORPORE: string | null; // xs:string, opt, Ação usuário do aluno
  PLCANCELAUSUARIOBIBLIOS: string | null; // xs:string, opt, default:N, Cancela usuário do Gestão Bibliotecária
  CONTABCOMPETENCIA: string | null; // xs:string, opt, Gera contabilização por competência
  PLCODSTATUSATIV: number | null; // xs:int, opt, Altera status das atividades complementares do aluno para
  ENVIAREMAILMUDSITMAT: string | null; // xs:string, opt, default:N, Enviar Email na mudança de situação de matrícula
  TEMPLATEENVIOEMAIL: string | null; // xs:string, opt, Template para envio de email
  IDRELATORIO: string | null; // xs:string, opt, Anexar Relatório
  COLIGADARELATORIO: string | null; // xs:string, opt
  PLBLQALTSITSEMDOC: string | null; // xs:string, opt, default:N, Bloqueia alteração para este status por falta de doc. obrigatórios
  ABATEPOSTALTERSTATUS: string | null; // xs:string, opt, default:N, Abater valor da disciplina somente para parcelas com vencimento igual ou posterior a data de alteração da situação de matrícula
  DIBLQALTSITMATDISC: string | null; // xs:string, opt, default:N, Bloqueia alteração de situação de matrícula nas disciplinas
  DIBLQALTSITMATDISCPRT: string | null; // xs:string, opt, default:N, Não altera a situação de matrícula na disciplina (apenas para matrícula on-line)
  CODEXTERNO: string | null; // xs:string, opt, Código Externo
  PLPREENCHEDTMATENCCENSO: string | null; // xs:string, opt, Data de encerramento da matrícula
  CUSTATUSFLUIGCOMUNIDADE: string | null; // xs:string, opt, default:N, Aluno ativo na comunidade do Fluig
  PLSTATUSFLUIGCOMUNIDADE: string | null; // xs:string, opt, default:N, Aluno ativo na comunidade do Fluig
  DISTATUSFLUIGCOMUNIDADE: string | null; // xs:string, opt, default:N, Aluno ativo na comunidade do Fluig
  CUINDICADESVINCULACAO: string | null; // xs:string, opt, default:N, Indica desvinculação do curso
  PLVALINADIMPLMATRICPORTAL: string | null; // xs:string, opt, default:S, Validar inadimplência de aluno na matrícula pelo portal
  EXIBEQUADROAVISO: string | null; // xs:string, opt, default:N, Exibe no Quadro de Avisos quando o parâmetro 
  CODCOLIGADARPTPLETIVOEMAIL: number | null; // xs:int, opt, Cód. coligada relatório
  IDRPTPLETIVOEMAIL: number | null; // xs:int, opt, Anexar Relatório (novo gerador)
  NOVORPTPLETIVOEMAIL: string | null; // xs:string, opt, default:N, Utilizar novo gerador
  PLCODSTATUSDISCITINERARIO: number | null; // xs:int, opt, Altera situação de matrícula das disciplinas do Itinerário Formativo para:
  PERALUINCITINERARIO: string | null; // xs:string, opt, default:N, Permite incluir itinerário na matrícula.
  PERALUEXCITINERARIO: string | null; // xs:string, opt, default:N, Permite excluir itinerário na matrícula.
  CUDIPLOMADIGITALSITUACAOMATRIC: string | null; // xs:string, opt, Situação de matrícula no curso - Diploma Digital
  PLDIPLOMADIGITALSITUACAOMATRIC: string | null; // xs:string, opt, Situação de matrícula no período letivo - Diploma Digital
  DIDIPLOMADIGITALSITUACAOMATRIC: string | null; // xs:string, opt, Situação de matrícula na disciplina - Diploma Digital
  STATUSMATRICULACANCELDISCPRT: number | null; // xs:int, opt, Altera situação de matrícula na disciplina para
  MOTIVOMATDISCCANCELPORTAL: number | null; // xs:int, opt, Motivo da alteração
}

export interface SStatusItinerarioFormativo {
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODTIPOCURSO: number; // xs:int, req, Nível de ensino
  CODSTATUS: number; // xs:int, req, default:0, Código
  CODSTATUSITINERARIOFORMATIVO: number; // xs:int, req, default:0, Código
}

// === EduParcelaData ===
export interface SParcela {
  RA: string; // xs:string, max:20, req, R.A.
  CODCONTRATO: string; // xs:string, max:20, req, Cód. do contrato
  CODSERVICO: string; // xs:string, max:10, req, Cód. do serviço
  TIPODESC: string | null; // xs:string, max:1, opt, default:P, Tipo de desconto
  TIPOPARCELA: string | null; // xs:string, max:1, opt, default:P, Tipo parcela
  VALORAUTOMATICO: string | null; // xs:string, max:1, opt, default:N, Valor calculado pelo número de créditos
  NOMESERVICO: string | null; // xs:string, max:60, opt, Serviço
  ORIGEM: string | null; // xs:string, max:2, opt, Origem
  CODCOLIGADA: number; // xs:short, req, default:1, Cód. Coligada
  IDPARCELA: number; // xs:int, req, default:0, Identificador da parcela
  IDPERLET: number; // xs:int, req, Período letivo
  PARCELA: number; // xs:short, req, Parcela
  COTA: number; // xs:short, req, Cota
  VALOR: number | null; // xs:decimal, opt, Valor
  DTVENCIMENTO: string; // xs:dateTime, req, Dt. vencimento
  DESCONTO: number | null; // xs:decimal, opt, Desconto contabilizado
  DTCOMPETENCIA: string | null; // xs:dateTime, opt, Dt. competência
  IDLAN: number | null; // xs:int, opt, Ref.
  ORIGEMCONTACORRENTE: string | null; // xs:string, opt, Origem da conta corrente do aluno
  VALORORIGINAL: number | null; // xs:decimal, opt, Valor Original
  VLRBOLSAATEVENC: number | null; // xs:decimal, opt, Valor bolsa condicional
  VLRBOLSAPOSVENC: number | null; // xs:decimal, opt, Valor bolsa incondicional
  VLRDESCONTO: number | null; // xs:decimal, opt, Valor de desconto
  VLRLIQUIDO: number | null; // xs:decimal, opt, Valor líquido
  VLRCREDRETROATIVO: number | null; // xs:decimal, opt, Valor Crédito Retroativo
  RECCREATEDBY: string | null; // xs:string, opt
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDBY: string | null; // xs:string, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
}

export interface SResponsavel {
  CODCOLIGADA: number; // xs:short, req, default:1, Cód. Coligada
  IDPARCELA: number; // xs:int, req, Identificador da parcela
  CODCOLCFO: number; // xs:short, req, Coligada do cliente/fornecedor
  CODCFO: string; // xs:string, req, Código do responsável financeiro
  RA: string | null; // xs:string, opt, R.A.
  CODSERVICO: string | null; // xs:string, opt, Serviço
  IDPERLET: number | null; // xs:int, opt, Período letivo
  NOMECLIFOR: string | null; // xs:string, opt, Responsável Financeiro
  PERCENTUAL: number; // xs:decimal, req, Percentual
}

// === EduContratoData ===
export interface SContrato {
  RA: string; // xs:string, max:20, req, R.A.
  CODCONTRATO: string; // xs:string, max:20, req, default: , Cód. do contrato
  CODPLANOPGTO: string | null; // xs:string, max:10, opt, Código do plano de pagamento
  TIPOCONTRATO: string; // xs:string, max:1, req, default:P, Tipo do contrato
  CODCCUSTO: string | null; // xs:string, max:25, opt, Custo
  ASSINADO: string | null; // xs:string, max:1, opt, Assinado
  DIAFIXO: string | null; // xs:string, max:1, opt, Dia fixo
  STATUS: string | null; // xs:string, max:1, opt, Cancelado
  TIPOBOLSA: string; // xs:string, max:1, req, default:S, Tipo da bolsa
  NOMEALUNO: string | null; // xs:string, max:120, opt, Aluno
  NOMEHABILITACAO: string | null; // xs:string, max:150, opt, Habilitação
  NOMECURSO: string | null; // xs:string, max:500, opt, Curso
  NOMETURNO: string | null; // xs:string, max:15, opt, Turno
  CODTURMA: string | null; // xs:string, max:20, opt, Turma
  CODPERLET: string | null; // xs:string, max:10, opt, Período letivo
  NOMEPLANOPGTO: string | null; // xs:string, max:60, opt, Nome do plano de pagamento
  DESCRICAOPLANOPGTO: string | null; // xs:string, max:60, opt, Descrição do plano de pagamento
  DESCGRADE: string | null; // xs:string, max:255, opt, Matriz curricular
  STATUSCONT: string | null; // xs:string, max:1, opt, Status da contabilização
  USARSOLICITACAO: string | null; // xs:string, max:1, opt, Utilizar contrato em solicitações do aluno pelo portal
  PERIODOCONTABIL: string | null; // xs:string, max:1, opt, default:A, Controle contábil
  USARPESQEXT: string | null; // xs:string, max:1, opt, Utilizar contrato em solicitações de Pesquisa/Extensão
  CODPLANOPGTOPERSONALIZ: string | null; // xs:string, max:10, opt, Plano de pagamento modelo
  CODUSUARIOPERSONALIZ: string | null; // xs:string, max:20, opt, Usuário responsável pela personalização
  CONSIDERADESCANTECIPACAO: string | null; // xs:string, max:1, opt, default:S, Considera desconto por antecipação
  CONSIDERADESCANTECIPACAOBOLSA: string | null; // xs:string, max:1, opt, Considerar o valor do desconto por antecipação no valor base para calcular o valor da(s) bolsa(s).
  NOMETURMA: string | null; // xs:string, max:60, opt, Nome da turma
  CODCOLIGADA: number; // xs:short, req, default:1, Cód. Coligada
  IDPERLET: number; // xs:int, req, Id. Período letivo
  IDHABILITACAOFILIAL: number | null; // xs:int, opt, Matriz aplicada
  DTCONTRATO: string | null; // xs:dateTime, opt, Data do contrato
  DTASSINATURA: string | null; // xs:dateTime, opt, Data da assinatura
  DIAVENCIMENTO: number | null; // xs:short, opt, Dia de vencimento
  CODFILIAL: number; // xs:short, req, Filial
  CODTIPOCURSO: number; // xs:short, req, Cód. Nível de ensino
  DTCANCELAMENTO: string | null; // xs:dateTime, opt, Data de cancelamento
  IDOPERACAO: number | null; // xs:int, opt, Id. Operação
  VALORSERVICO: number | null; // xs:decimal, opt, Valor dos serviços contabilizados
  DESCONTO: number | null; // xs:decimal, opt, Desconto contabilizado
  VALORBOLSA: number | null; // xs:decimal, opt, Valor das bolsas contabilizadas
  CODCURSO: string | null; // xs:string, opt, Código do curso
  CODHABILITACAO: string | null; // xs:string, opt, Código da habilitação
  CODGRADE: string | null; // xs:string, opt, Código da matriz curricular
  DTCOMPETENCIAINICIAL: string | null; // xs:dateTime, opt, Data de competência inicial
  DTCOMPETENCIAFINAL: string | null; // xs:dateTime, opt, Data de competência final
  IDCLASSEVALORPROTHEUS: number | null; // xs:int, opt, Classe de valor
  IDITEMCONTABILPROTHEUS: number | null; // xs:int, opt, Item contábil
  VALORBASEPERSONALIZ: number | null; // xs:decimal, opt, default:0, Valor base do contrato pré-personalização
  VALORCONTRATOAPOSPERSONALIZ: number | null; // xs:decimal, opt, default:0, Valor do contrato após personalização
  DATAPERSONALIZ: string | null; // xs:dateTime, opt, Última data de personalização
  DTCOMPETENCIAINICIALMOV: string | null; // xs:dateTime, opt, Data de competência inicial
  DTCOMPETENCIAFINALMOV: string | null; // xs:dateTime, opt, Data de competência final
  DTCONTRATO1: string | null; // xs:dateTime, opt
  IDOPERACAO1: number | null; // xs:int, opt
  ALUNO: string | null; // xs:string, opt
}

export interface SResponsavelContrato {
  CODCONTRATO: string; // xs:string, max:20, req, Cód. do contrato
  RESPMOVIMENTO: string | null; // xs:string, max:1, opt, Responsável financeiro do movimento
  DADOSACADEMICOS: string | null; // xs:string, max:1, opt, default:N, Responsável financeiro com acesso aos dados acadêmicos
  CODCOLIGADA: number; // xs:short, req, default:1, Cód. Coligada
  RA: string | null; // xs:string, opt, R.A.
  IDPERLET: number | null; // xs:int, opt, Período letivo
  CODCOLCFO: number; // xs:short, req, Coligada do cliente/fornecedor
  CODCFO: string; // xs:string, req, Código do responsável financeiro
  PERCENTUAL: number; // xs:decimal, req, Percentual
  NOMECLIFOR: string | null; // xs:string, opt, Responsável Financeiro
}

export interface SBOLSARETROATIVACONTRATO {
  RA: string; // xs:string, max:20, req, R.A.
  CODCONTRATO: string; // xs:string, max:20, req, Cód. do contrato
  CLASSIFICACAO: string | null; // xs:string, max:1, opt, Classificação
  FORMAUTILIZACAO: string | null; // xs:string, max:1, opt, Forma de utilização do crédito
  FORMAAPROVEITAMENTO: string | null; // xs:string, max:1, opt, Forma de aproveitamento do crédito
  CODBOLSA: string; // xs:string, max:10, req, Cód. da bolsa
  NOMEBOLSA: string; // xs:string, max:60, req, Nome
  CODSERVICO: string | null; // xs:string, max:10, opt, Cód. do serviço
  NOMESERVICO: string | null; // xs:string, max:60, opt, Nome Serviço
  CODCOLIGADA: number; // xs:short, req, default:1, Cód. Coligada
  IDPERLET: number; // xs:int, req, Id. Período letivo
  IDBOLSAALUNO: string; // xs:string, req, Id. Bolsa Aluno
  VALOR: number | null; // xs:decimal, opt, Valor do crédito/débito gerado
  VALORRESTANTE: number | null; // xs:decimal, opt, Valor restante do crédito/débito gerado
}

export interface SCONTRATOACESSOS {
  CODCONTRATO: string; // xs:string, max:20, req, Cód. do contrato
  CODCOLIGADA: number; // xs:short, req, Cód. Coligada
  RA: string | null; // xs:string, opt, R.A.
  IDPERLET: number | null; // xs:int, opt, Período letivo
  STATUS: boolean; // xs:boolean, req, default:false, Permitir Acesso
  NOME: string; // xs:string, req, Nome
  CODUSUARIO: string; // xs:string, req, Código do usuário
  TIPORELACIONAMENTO: string; // xs:string, req, Tipo de Relacionamento
  RECCREATEDBY: string | null; // xs:string, opt
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDBY: string | null; // xs:string, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
  CODPESSOA: number | null; // xs:int, opt
  CODCOLCFO: number | null; // xs:short, opt
  CODCFO: string | null; // xs:string, opt
}

// === EduBolsaData ===
export interface SBolsa {
  CODBOLSA: string; // xs:string, max:10, req, default:0, Código
  CODCFO: string | null; // xs:string, max:25, opt, Código do responsável financeiro
  NOME: string; // xs:string, max:60, req, Nome
  VALIDADELIMITADA: string | null; // xs:string, max:1, opt, default:1, Bolsa incondicional
  FIES: string | null; // xs:string, max:1, opt, default:0
  BOLSAFUNC: string | null; // xs:string, max:1, opt, default:0, Bolsa de funcionário
  TIPOSAC: string | null; // xs:string, max:1, opt, default:N, Tipo de sacado
  ATIVA: string | null; // xs:string, max:1, opt, default:S, Bolsa ativa
  TIPODESC: string; // xs:string, max:1, req, default:P, Tipo de desconto
  PERMITEALTERARVALOR: string | null; // xs:string, max:1, opt, default:S, Permite alterar valor
  NOMERESPONSAVELBOLSACRED: string | null; // xs:string, max:60, opt, Responsável Financeiro
  CODCLASSIFICACAO: string | null; // xs:string, max:5, opt, Classificação
  VERIFICAINADIMPLENCIA: string | null; // xs:string, max:1, opt, default:S, Verifica inadimplência do outro sacado
  CONTABCOMPETENCIA: string | null; // xs:string, max:1, opt, default:S, Compõe contabilização por competência
  ORDEMAPLICDESCANTECIPACAO: string | null; // xs:string, max:1, opt, default:A, Aplicar desconto por antecipação
  AFETABASECALCULO: string | null; // xs:string, max:1, opt, default:N, Afeta base de cálculo
  CODCOLIGADA: number; // xs:short, req, default:1, Cód. Coligada
  VALOR: number; // xs:decimal, req, default:0, Desconto (%)
  CODTIPOCURSO: number; // xs:short, req, Cód. Nível de ensino
  CODCOLCFO: number | null; // xs:short, opt, Coligada do cliente/fornecedor
  ORDEMPERDA: number | null; // xs:short, opt, Ordem de perda
  RENOVACAOAUTOMATICA: string | null; // xs:string, opt
  APLICFORMULA: string | null; // xs:string, opt
  CODFORMULAPERCENTUAL: string | null; // xs:string, opt, Fórmula para percentual
  CODFORMULAVALOR: string | null; // xs:string, opt, Fórmula para valor
  TIPOCONTABLANOUTROSACADO: number | null; // xs:short, opt, Tipo contábil do lançamento do outro sacado
}

export interface SBOLSACOMPL {
  CODBOLSA: string; // xs:string, max:10, req
  RECCREATEDBY: string | null; // xs:string, max:50, opt
  RECMODIFIEDBY: string | null; // xs:string, max:50, opt
  CODCOLIGADA: number; // xs:short, req, default:1
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
}

// === EduResponsavelData ===
export interface SResponsavel {
  CODCOLIGADA: number; // xs:short, req, default:1, Cód. Coligada
  IDPARCELA: number; // xs:int, req, Identificador da parcela
  CODCOLCFO: number; // xs:short, req, Coligada do cliente/fornecedor
  CODCFO: string; // xs:string, req, Código do responsável financeiro
  NOMECFO: string | null; // xs:string, opt, Código do responsável financeiro
  IDPERLET: number | null; // xs:int, opt, Período letivo
  CODSERVICO: string | null; // xs:string, opt, Serviço
  RA: string | null; // xs:string, opt, R.A.
  PERCENTUAL: number | null; // xs:decimal, opt, Percentual
  PARCELA: number | null; // xs:short, opt
  NOMECLIFOR: string | null; // xs:string, opt
}

// === EduOcorrenciaAlunoData ===
export interface SOcorrenciaAluno {
  RA: string; // xs:string, max:20, req, Registro Acadêmico
  TIPOETAPA: string | null; // xs:string, max:1, opt, Tipo da etapa
  CODPROF: string | null; // xs:string, max:10, opt, Código do professor
  DISPONIVELWEB: string | null; // xs:string, max:1, opt, Disponível Web
  RECCREATEDBY: string | null; // xs:string, max:50, opt, Usuário de cadastro
  RECMODIFIEDBY: string | null; // xs:string, max:50, opt, Usuário de alteração
  RESPONSAVELCIENTE: string | null; // xs:string, max:1, opt, Responsável ciente da ocorrência?
  CODUSUARIOCIENTE: string | null; // xs:string, max:50, opt, Cód. usuário responsável
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  IDOCORALUNO: number; // xs:int, req, default:0, Id. Ocorrência
  CODOCORRENCIAGRUPO: number; // xs:short, req, Código do Grupo de ocorrência
  CODOCORRENCIATIPO: number; // xs:int, req, Código do Tipo de ocorrência
  IDPERLET: number; // xs:int, req, Id. Período letivo
  IDTURMADISC: number | null; // xs:int, opt, Id. Turma / Disciplina
  CODETAPA: number | null; // xs:short, opt, Código da Etapa
  DATAOCORRENCIA: string | null; // xs:dateTime, opt, Data e hora da ocorrência
  OBSERVACOES: string | null; // xs:string, opt, Observações
  CODPERLET: string | null; // xs:string, opt, Período letivo
  DESCGRUPOOCOR: string | null; // xs:string, opt, Grupo de Ocorrência
  DESCTIPOOCOR: string | null; // xs:string, opt, Tipo de Ocorrência
  RECCREATEDON: string | null; // xs:dateTime, opt, Data de cadastro
  RECMODIFIEDON: string | null; // xs:dateTime, opt, Data de alteração
  DTRESPONSAVELCIENTE: string | null; // xs:dateTime, opt, Data que ficou ciente
  NOMEUSUARIOCIENTE: string | null; // xs:string, opt, Responsável ciente pela ocorrência
  OBSERVACOESINTERNAS: string | null; // xs:string, opt, Observações internas
  POSSUIARQUIVO: string | null; // xs:string, opt
}

export interface SOCORRENCIAALUNOARQ {
  NOMEARQUIVO: string; // xs:string, max:255, req, Nome do arquivo
  DESCARQUIVO: string | null; // xs:string, max:500, opt, Descrição
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  IDARQUIVOOCORALUNO: number; // xs:int, req, default:0, Id. Arquivo
  IDOCORALUNO: number; // xs:int, req, Id. Ocorrência
  ARQUIVO: Buffer | null; // xs:base64Binary, opt, Arquivo
  TAMANHOARQUIVO: number | null; // xs:float, opt, Tamanho do arquivo (KB)
}

export interface SOCORRENCIAALUNOCOMPL {
  CODCOLIGADA: number; // xs:short, req, default:1
  IDOCORALUNO: number; // xs:int, req
}

// === FopFuncData ===
export interface PFunc {
  CHAPA: string; // xs:string, max:16, req, Chapa
  CODRECEBIMENTO: string; // xs:string, max:1, req, Tipo de Recebimento
  CODSITUACAO: string | null; // xs:string, max:1, opt, Situação
  CODTIPO: string; // xs:string, max:1, req, Tipo de Funcionário
  CODSECAO: string | null; // xs:string, max:35, opt, Seção
  CODFUNCAO: string | null; // xs:string, max:10, opt, Função
  CODSINDICATO: string | null; // xs:string, max:10, opt, Sindicato
  CODHORARIO: string | null; // xs:string, max:10, opt, Horário
  SITUACAOFGTS: string | null; // xs:string, max:1, opt, Situação do FGTS
  CONTAFGTS: string | null; // xs:string, max:11, opt, Nro. Conta FGTS
  CONTRIBSINDICAL: string | null; // xs:string, max:1, opt, default:X, Contribuição Sindical
  TIPOADMISSAO: string | null; // xs:string, max:1, opt, Tipo de Admissão
  MOTIVOADMISSAO: string | null; // xs:string, max:2, opt, Motivo da Admissão
  TIPODEMISSAO: string | null; // xs:string, max:1, opt, Tipo de Demissão
  MOTIVODEMISSAO: string | null; // xs:string, max:5, opt, Motivo de Demissão
  CODSAQUEFGTS: string | null; // xs:string, max:2, opt, Código de Saque do FGTS
  EVTADIANTFERIAS: string | null; // xs:string, max:4, opt, Evento de Adiantamento de Férias
  OBSFERIAS: string | null; // xs:string, max:80, opt, Observação de Férias
  SITUACAORAIS: string | null; // xs:string, max:1, opt, Situação da RAIS
  CONTAPAGAMENTO: string | null; // xs:string, max:15, opt, Nro. Conta Corrente
  VINCULORAIS: string | null; // xs:string, max:2, opt, Vínculo da RAIS
  ANTIGACARTTRAB: string | null; // xs:string, max:10, opt, Antiga Carteira de Trabalho
  ANTIGASERIECART: string | null; // xs:string, max:5, opt, Antiga Série da Carteira de Trabalho
  ANTIGONOME: string | null; // xs:string, max:120, opt, Antigo Nome
  ANTIGOPIS: string | null; // xs:string, max:11, opt, Antigo PIS
  ANTIGACHAPA: string | null; // xs:string, max:16, opt, Antiga Chapa do Funcionário
  ANTIGOTIPOFUNC: string | null; // xs:string, max:1, opt, Antigo Tipo de Funcionário
  ANTIGOTIPOADM: string | null; // xs:string, max:1, opt, Antigo Tipo de Admissão
  ANTIGASECAO: string | null; // xs:string, max:35, opt, Antiga Seção
  PISPARAFGTS: string | null; // xs:string, max:11, opt, PIS para FGTS
  NOME: string; // xs:string, max:120, req, Nome
  PISPASEP: string | null; // xs:string, max:11, opt, Nro. PIS/PASEP
  CODBANCOFGTS: string | null; // xs:string, max:3, opt, Banco FGTS
  CODBANCOPAGTO: string | null; // xs:string, max:3, opt, Banco de Pagamento
  CODAGENCIAPAGTO: string | null; // xs:string, max:6, opt, Agência de Pagamento
  CODBANCOPIS: string | null; // xs:string, max:3, opt, Banco PIS
  OPBANCARIA: string | null; // xs:string, max:5, opt, Operação Bancária
  GRUPOSALARIAL: string | null; // xs:string, max:10, opt, Faixa Salarial
  CODEQUIPE: string | null; // xs:string, max:20, opt, Código da Equipe
  INTEGRCONTABIL: string | null; // xs:string, max:22, opt, Contabil
  INTEGRGERENCIAL: string | null; // xs:string, max:22, opt, Gerencial
  CI: string | null; // xs:string, max:11, opt, Código Contribuinte Individual
  ANTIGOCI: string | null; // xs:string, max:11, opt, Antigo Código Contribuinte Individual
  CODGRPQUIOSQUE: string | null; // xs:string, max:15, opt, Código do Grupo de Quiosque
  CODNIVELSAL: string | null; // xs:string, max:10, opt, Nível Salarial
  CODTABELASALARIAL: string | null; // xs:string, max:10, opt, Código da Tabela Salarial
  REGIMEREVEZAMENTO: string | null; // xs:string, max:15, opt, Regime de Revezamento
  CODFORNECEDOR: string | null; // xs:string, max:25, opt, Fornecedor Lançamento Financeiro
  SEXO: string; // xs:string, max:1, req, Sexo
  NACIONALIDADE: string | null; // xs:string, max:3, opt, default:10, Nacionalidade
  GRAUINSTRUCAO: string | null; // xs:string, max:2, opt, Grau de Instrução
  NATURALIDADE: string | null; // xs:string, max:32, opt, Naturalidade
  APELIDO: string | null; // xs:string, max:40, opt, Apelido
  EMAIL: string | null; // xs:string, max:60, opt, E-Mail
  CARTIDENTIDADE: string | null; // xs:string, max:15, opt, Nro. Identidade
  ORGEMISSORIDENT: string | null; // xs:string, max:15, opt, Orgão Emissor
  UFCARTIDENT: string | null; // xs:string, max:2, opt, Estado Emissor Identidade
  CARTEIRATRAB: string | null; // xs:string, max:10, opt, Nro. CTPS
  SERIECARTTRAB: string | null; // xs:string, max:5, opt, Série CTPS
  UFCARTTRAB: string | null; // xs:string, max:2, opt, Estado Emissor CTPS
  TITULOELEITOR: string | null; // xs:string, max:14, opt, Nro. Titulo de Eleitor
  SECAOTITELEITOR: string | null; // xs:string, max:6, opt, Seção Eleitoral
  ZONATITELEITOR: string | null; // xs:string, max:6, opt, Zona
  CERTIFRESERV: string | null; // xs:string, max:40, opt, Nro. Certificado Reservista
  CATEGMILITAR: string | null; // xs:string, max:10, opt, Categoria Militar
  CARTMOTORISTA: string | null; // xs:string, max:15, opt, Nro. Habilitação
  TIPOCARTHABILIT: string | null; // xs:string, max:5, opt, Tipo
  CPF: string; // xs:string, max:11, req
  REGPROFISSIONAL: string | null; // xs:string, max:15, opt, Registro Profissional
  RUA: string | null; // xs:string, max:140, opt, Rua
  COMPLEMENTO: string | null; // xs:string, max:60, opt, Complemento
  BAIRRO: string | null; // xs:string, max:80, opt, Bairro
  CIDADE: string | null; // xs:string, max:32, opt, Município
  ESTADO: string | null; // xs:string, max:2, opt, Estado
  PAIS: string | null; // xs:string, max:60, opt, País
  CEP: string | null; // xs:string, max:9, opt
  TELEFONE1: string | null; // xs:string, max:15, opt, Telefone I
  TELEFONE2: string | null; // xs:string, max:15, opt, Telefone II
  TELEFONE3: string | null; // xs:string, max:15, opt, Telefone III
  FAX: string | null; // xs:string, max:15, opt, Fax
  NOMEBANCOPGTO: string | null; // xs:string, max:40, opt, Nome do Banco
  NOMEAGENCIAPGTO: string | null; // xs:string, max:60, opt, Nome da Agência
  NOMEFUNC: string | null; // xs:string, max:120, opt, Nome
  NOME_FUNCAO: string | null; // xs:string, max:100, opt, Nome Funcão
  TIPOSANG: string | null; // xs:string, max:10, opt, Tipo Sanguíneo
  NOME_SECAO: string | null; // xs:string, max:60, opt, Descrição Seção
  CHAPAORIGEM: string | null; // xs:string, max:16, opt, Chapa
  NUMEROCARTAOSUS: string | null; // xs:string, max:100, opt, Número do Cartão SUS
  RECCREATEDBY: string | null; // xs:string, max:50, opt
  RECMODIFIEDBY: string | null; // xs:string, max:50, opt
  USAVALETRANSP: string | null; // xs:string, max:2, opt, Usa vale transporte
  TPCONTABANCARIA: string | null; // xs:string, max:1, opt, Tipo de conta bancária
  NRPROCJUD: string | null; // xs:string, max:20, opt, Número do processo judicial
  TPREGIMEPREV: string | null; // xs:string, max:1, opt, Tipo de regime previdenciário (ou Sistema de proteção social dos militares)
  NROLEIANISTIA: string | null; // xs:string, max:13, opt, Nro. da Lei de Anistia
  NROPROCESSOJUDICIAL: string | null; // xs:string, max:20, opt, Nro. Processo Jurídico
  NATUREZAESTAGIO: string | null; // xs:string, max:1, opt, Natureza do Estágio
  CODNIVELESTAGIO: string | null; // xs:string, max:1, opt, Nível do Estágio
  AREAATUACAOESTAGIO: string | null; // xs:string, max:100, opt, Área de Atuação do Estágio
  NUMEROAPOLICEESTAGIO: string | null; // xs:string, max:30, opt, Numero da Apólice do Estágio
  CPFCOORDENADORESTAGIO: string | null; // xs:string, max:11, opt, CPF do Coordenador do Estágio
  NOMECOORDENADORESTAGIO: string | null; // xs:string, max:80, opt, Nome do Coordenador do Estágio
  CNPJEMPRESAORIGEM: string | null; // xs:string, max:80, opt, CNPJ Empresa Origem
  MATRICULAEMPRESAORIGEM: string | null; // xs:string, max:30, opt, Matricula Empresa Origem
  NUMERORIC: string | null; // xs:string, max:20, opt, Numero do RIC
  ORGEMISSORRIC: string | null; // xs:string, max:20, opt, Orgão e UF Emissor RIC
  CNPJEMPRESAANTERIOR: string | null; // xs:string, max:20, opt, Inscrição Empregador Anterior
  MATRICULAANTERIOR: string | null; // xs:string, max:30, opt, Matrícula eSocial Anterior
  OBSERVACAOSUCESSAO: string | null; // xs:string, max:255, opt, Observação Sucessão
  CHAPASUBSTRABTEMP: string | null; // xs:string, max:16, opt, Chapa do Funcionário Substituido
  DESCRICAOSALVARIAVEL: string | null; // xs:string, max:999, opt, Descrição do Salário Variável
  ORGEMISSORCNH: string | null; // xs:string, max:20, opt, Orgão Emissor
  CODBANCOPAGTO2: string | null; // xs:string, max:3, opt, Banco de Pagamento
  CODAGENCIAPAGTO2: string | null; // xs:string, max:6, opt, Agência de Pagamento
  CONTAPAGAMENTO2: string | null; // xs:string, max:15, opt, Nro. Conta Corrente
  OPBANCARIA2: string | null; // xs:string, max:5, opt, Operação Bancária
  TPCONTABANCARIA2: string | null; // xs:string, max:1, opt, Tipo de conta bancária
  MATRICULAESOCIAL: string | null; // xs:string, max:30, opt, Matrícula eSocial
  CNPJEMPRESASUCESSORA: string | null; // xs:string, max:20, opt, CNPJ Empresa Sucessora
  JUSTIFICATIVATRABTEMP: string | null; // xs:string, max:999, opt, Justificativa para a Contratação
  JUSTIFICATIVAPRORROGTEMP: string | null; // xs:string, max:999, opt, Justificativa para prorrogação do contrato
  CPFSUBSTRABTEMP: string | null; // xs:string, max:11, opt, CPF do Funcionário Substituído
  NROINSCRITEMP: string | null; // xs:string, max:20, opt, Número de Inscrição
  CODSINDICATOFILIACAO: string | null; // xs:string, max:10, opt, Sindicato
  CODFUNCAOCONF: string | null; // xs:string, max:10, opt, Função
  CNPJCEDENTE: string | null; // xs:string, max:80, opt, CNPJ da empresa cedente
  MATRICULACEDENTE: string | null; // xs:string, max:30, opt, Matrícula do trabalhador no empregador de origem (Cedente)
  TIPOCONTRATOPRAZO: string | null; // xs:string, max:2, opt, Tipo de Contrato
  PREFIXOPERIODOESOCIAL: string | null; // xs:string, max:10, opt, Prefixo Período (eSocial)
  MOTIVOCONTPRAZODETERMINADO: string | null; // xs:string, max:255, opt, Motivo da contratação por prazo determinado
  CNPJEMPRESACONTRATANTEAPRENDIZ: string | null; // xs:string, max:20, opt, CNPJ Entidade Qualificadora/ Empregador Cotista
  NROPROCESSOTRABADMISSAO: string | null; // xs:string, max:20, opt, Nro. Processo Trabalhista
  CNPJRESPONSAVELMATRICULA: string | null; // xs:string, max:20, opt, CNPJ do Responsável
  MATRICULABENEFICIARIO: string | null; // xs:string, max:30, opt, Matrícula Beneficiário
  CNPJMANDATOELETIVO: string | null; // xs:string, max:20, opt, CNPJ do órgão público de origem
  MATRICULAMANDATOELETIVO: string | null; // xs:string, max:30, opt, Matrícula do servidor no órgão público de origem
  NOMESOCIAL: string | null; // xs:string, max:120, opt, Nome Social
  INSCESTABELECIMENTOATIVPRATICA: string | null; // xs:string, max:20, opt, Inscrição Estabelecimento Atividades Práticas
  CARTMODELO19: string | null; // xs:string, max:15, opt, Carta Modelo 19
  NROREGGERAL: string | null; // xs:string, max:15, opt, Registro Nacional Migratório (RNM)
  NRODECRETO: string | null; // xs:string, max:15, opt, Decreto de Imigração
  TIPOVISTO: string | null; // xs:string, max:10, opt, Tipo de Visto
  EMPRESA: string | null; // xs:string, max:60, opt, Empresa que a pessoa trabalha
  CODOCUPACAO: string | null; // xs:string, max:3, opt, Código da Ocupação
  RECURSOREALIZACAOTRAB: string | null; // xs:string, max:120, opt, Recursos para realização do trabalho
  RECURSOACESSIBILIDADE: string | null; // xs:string, max:120, opt, Recursos p/ acessibilidade ao local de trabalho
  LOCALIDADE: string | null; // xs:string, max:20, opt, Localidade
  CSM: string | null; // xs:string, max:10, opt, Circunscrição Militar
  EXPED: string | null; // xs:string, max:10, opt, Orgão de Expedição
  RM: string | null; // xs:string, max:10, opt, Região Militar
  PRIMEIRONOME: string | null; // xs:string, max:40, opt, Nome
  SOBRENOMEPAI: string | null; // xs:string, max:40, opt, Sobrenome do pai
  SOBRENOMEMAE: string | null; // xs:string, max:40, opt, Sobrenome da mãe
  CODNATURALIDADE: string | null; // xs:string, max:20, opt
  ORGEMISSORRNE: string | null; // xs:string, max:20, opt, UF Emissor
  MATRICULAOBITO: string | null; // xs:string, max:50, opt, Matrícula da Certidão de Óbito
  PORTARIANATURALIZACAO: string | null; // xs:string, max:16, opt, Portaria de Naturalização
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  NROFICHAREG: number | null; // xs:int, opt, Nro. Ficha de Registro
  JORNADA: number | null; // xs:decimal, opt, Não Mais Utilizado pelo Sistema
  NRODEPIRRF: number | null; // xs:short, opt, default:0, Nro. Dependente IRRF
  NRODEPSALFAM: number | null; // xs:short, opt, default:0, Nro. Depend. Sal. Família:
  DTBASE: string | null; // xs:dateTime, opt, Data Base
  SALARIO: number | null; // xs:decimal, opt, Salário Mensal
  DTOPCAOFGTS: string | null; // xs:dateTime, opt, Data Opção FGTS
  SALDOFGTS: number | null; // xs:decimal, opt, Saldo FGTS Fins Rescisório
  DTSALDOFGTS: string | null; // xs:dateTime, opt, Data Último Saldo FGTS
  APOSENTADO: number | null; // xs:short, opt, Aposentadoria
  TEMMAIS65ANOS: number | null; // xs:short, opt, Indicativo de De Idade Sup. a 65 Anos
  AJUDACUSTO: number | null; // xs:decimal, opt, Ajuda de Custo
  PERCENTADIANT: number | null; // xs:decimal, opt, % Adiantamento
  ARREDONDAMENTO: number | null; // xs:decimal, opt, Arredondamento
  DATAADMISSAO: string | null; // xs:dateTime, opt, Data de Admissão
  DTTRANSFERENCIA: string | null; // xs:dateTime, opt, Data da Transferência
  TEMPRAZOCONTR: number | null; // xs:short, opt, Contrato com Prazo
  FIMPRAZOCONTR: string | null; // xs:dateTime, opt, Data Final do Contrato
  DATADEMISSAO: string | null; // xs:dateTime, opt, Data de Demissão
  DTDESLIGAMENTO: string | null; // xs:dateTime, opt, Data de Desligamento
  DTULTIMOMOVIM: string | null; // xs:dateTime, opt, Data do Último Movimento
  DTPAGTORESCISAO: string | null; // xs:dateTime, opt, Data de Pagamento da Recisão
  TEMAVISOPREVIO: number | null; // xs:short, opt, Tem Aviso Prévio Indenizado
  DTAVISOPREVIO: string | null; // xs:dateTime, opt, Data de Início do Aviso Prévio
  NRODIASAVISO: number | null; // xs:short, opt, Nro. Dias de Aviso
  DTVENCFERIAS: string | null; // xs:dateTime, opt, Data de Vencimento das Férias
  INICPROGFERIAS1: string | null; // xs:dateTime, opt, Início Período Gozo
  FIMPROGFERIAS1: string | null; // xs:dateTime, opt, Fim Período Gozo
  QUERABONO: number | null; // xs:short, opt, Optou pelo Abono
  QUER1APARC13O: number | null; // xs:short, opt, 1ª Parc. 13º salário
  NRODIASADIANTFER: number | null; // xs:short, opt, Nro. Dias de Adiantamento de Férias
  FERIASCOLETIVAS: number | null; // xs:short, opt, Férias Coletivas
  NRODIASFERIAS: number | null; // xs:decimal, opt, Nro. Dias de Férias
  NRODIASABONO: number | null; // xs:decimal, opt, Nro. Dias Abono
  INICPROGFERIAS2: string | null; // xs:dateTime, opt, Não Mais Utilizado pelo Sistema
  FIMPROGFERIAS2: string | null; // xs:dateTime, opt, Não Mais Utilizado pelo Sistema
  SALDOFERIAS: number | null; // xs:decimal, opt, default:0, Saldo de Férias
  SALDOFERIASANT: number | null; // xs:decimal, opt, Saldo de Férias Anterior
  SALDOFERANTAUX: number | null; // xs:decimal, opt, Saldo de Férias Anterior Auxiliar
  DTPAGTOFERIAS: string | null; // xs:dateTime, opt, Data de Pagamento das Férias
  DTAVISOFERIAS: string | null; // xs:dateTime, opt, Data do Aviso de Férias
  NDIASLICREM1: number | null; // xs:decimal, opt, Nro. Dias de Licença Remunerada
  NDIASLICREM2: number | null; // xs:decimal, opt, Nro. Dias de Licença Remunerada 2
  DTINICIOLICENCA: string | null; // xs:dateTime, opt, Data de Início da Licença
  MEDIASALMATERN: number | null; // xs:decimal, opt, Média Sal. Maternidade:
  MEMBROSINDICAL: number | null; // xs:short, opt, Membro Sindical
  DIASUTEISMES: number | null; // xs:short, opt, Dias Úteis do Mês
  DIASUTMEIOEXP: number | null; // xs:short, opt, Dias Úteis do Mês Meio Exp.
  DIASUTPROXMES: number | null; // xs:short, opt, Dias Úteis do Próx. Mês
  DIASUTPROXMEIO: number | null; // xs:short, opt, Dias Úteis do Próx. Mês Meio Exp.
  DIASUTRESTANTES: number | null; // xs:short, opt, Dias Úteis Restantes
  DIASUTRESTMEIO: number | null; // xs:short, opt, Dias Úteis Restantes Meio Exp.
  MUDOUENDERECO: number | null; // xs:short, opt, Mudou Endereço
  MUDOUCARTTRAB: number | null; // xs:short, opt, Mudou Carteira de Trabalho
  MUDOUNOME: number | null; // xs:short, opt, Mudou Nome
  MUDOUPIS: number | null; // xs:short, opt, Mudou PIS
  MUDOUCHAPA: number | null; // xs:short, opt, Mudou Chapa
  MUDOUADMISSAO: number | null; // xs:short, opt, Mudou Admissão
  ANTIGADTADM: string | null; // xs:dateTime, opt, Antiga Data de Admissão
  MUDOUDTOPCAO: number | null; // xs:short, opt, Mudou Opção
  ANTIGADTOPCAO: string | null; // xs:dateTime, opt, Antiga Data de Opção
  MUDOUSECAO: number | null; // xs:short, opt, Mudou Seção
  MUDOUDTNASCIM: number | null; // xs:short, opt, Mudou Data de Nascimento
  ANTIGADTNASCIM: string | null; // xs:dateTime, opt, Antiga Data de Nascimento
  FALTAALTERFGTS: number | null; // xs:short, opt, Envio de Informações para o FGTS
  DEDUZIRRF65: number | null; // xs:decimal, opt, Deduz IRRF Maior de 65 Anos
  ULTIMORECALCULODATA: string | null; // xs:dateTime, opt, Data do Último Recálculo
  ULTIMORECALCULOHORA: string | null; // xs:dateTime, opt, Último Recálculo
  DESCONTAAVISOPREVIO: number | null; // xs:short, opt, Desconta Aviso Previo do Funcionário
  CODFILIAL: number; // xs:short, req, Código da Filial
  INDINICIOHOR: number | null; // xs:short, opt, Letra
  DTCADASTROPIS: string | null; // xs:dateTime, opt, Data de Cadastro no PIS
  CODPESSOA: number | null; // xs:int, opt, Identificador
  RESCISAOCALCULADA: number | null; // xs:short, opt, Rescisão Calculada
  MEMBROCIPA: number | null; // xs:short, opt, Membro CIPA
  USASALCOMPOSTO: number | null; // xs:short, opt, Usa Salário Composto
  REGATUAL: number | null; // xs:int, opt, Registro Atual
  NUMVEZESDESCEMPRESTIMO: number | null; // xs:short, opt, Empréstimo - Nº de vezes
  DATAINICIODESCEMPRESTIMO: string | null; // xs:dateTime, opt, Início Desconto do Empréstimo
  JORNADAMENSAL: number | null; // xs:int, opt, Jornada
  PREVDISP: string | null; // xs:dateTime, opt, Previsão de Disponibilidade
  CODOCORRENCIA: number | null; // xs:short, opt, Código da Ocorrência
  CODCATEGORIA: number | null; // xs:short, opt, Código da Categoria
  CLASSECONTRIB: number | null; // xs:short, opt, Classe de Contribuição
  ESUPERVISOR: number | null; // xs:short, opt, Funcionário tem Status de Supervisor
  USACONTROLEDESALDO: number | null; // xs:short, opt, Utiliza Controle de Saldo de Verbas
  MUDOUCI: number | null; // xs:short, opt, Mudou Código Contribuinte Individual
  PERIODORESCISAO: number | null; // xs:short, opt, Período da Rescisao
  FGTSMESANTRECOLGRFP: number | null; // xs:short, opt, FGTS Mês Anterior Será Recolhido na GRFP
  TRABALHOUNADEMISSAO: number | null; // xs:short, opt, Indica se trabalhou no dia da demissão
  NRODIASFERIASJORNRED: number | null; // xs:short, opt, Dias Direito (Jorn. Reduzida)
  POSSUIALVARAMENOR16: number | null; // xs:short, opt, Possui Alvará Judicial (somente p/ menor 16 não-aprendiz)
  DATARESCISAO: string | null; // xs:dateTime, opt, Data de Rescisão
  SITUACAOINSS: number | null; // xs:short, opt, INSS
  DTAPOSENTADORIA: string | null; // xs:dateTime, opt, Data Aposentadoria
  TEMDEDUCAOCPMF: number | null; // xs:short, opt, Tem Dedução de CPMF
  NRODIASFERIASCORRIDOS: number | null; // xs:short, opt, Nro. Dias Corridos de Férias
  NRODIASABONOCORRIDOS: number | null; // xs:short, opt, Nro. Dias Corridos de Abono
  POSICAOABONO: number | null; // xs:short, opt, Posição do abono
  QUERADIANTAMENTO: number | null; // xs:short, opt, Quer Adiantamento nas Férias
  DTPROXAQUISFERIAS: string | null; // xs:dateTime, opt, Data do Próximo Período Aquisitivo
  CODCOLFORNEC: number | null; // xs:short, opt, Global
  ISENTOIRRF: number | null; // xs:short, opt, Isento IRRF
  DTNASCIMENTO: string; // xs:dateTime, req, Data de Nascimento
  DTEMISSAOIDENT: string | null; // xs:dateTime, opt, Data de Emissão Ident.
  DTCARTTRAB: string | null; // xs:dateTime, opt, Data de Emissão CTPS
  NIT: number | null; // xs:short, opt, Carteira Tipo NIT
  DTVENCHABILIT: string | null; // xs:dateTime, opt, Data de Venc. Habilitação
  NUMERO: string | null; // xs:string, opt, Número
  NOMEPAI: string | null; // xs:string, opt, Nome do Pai
  NOMEMAE: string | null; // xs:string, opt, Nome da Mãe
  CODIGO: number | null; // xs:int, opt, Identificador
  Jornada_Mensal: string | null; // xs:string, opt, Jornada
  Hora: number | null; // xs:decimal, opt, Salário Hora
  NPASSAPORTE: string | null; // xs:string, opt, Passaporte
  DTEMISSPASSAPORTE: string | null; // xs:dateTime, opt, Emissão Passaporte
  DTVALPASSAPORTE: string | null; // xs:dateTime, opt, Validade Passaporte
  PAISORIGEM: string | null; // xs:string, opt, País Origem
  TIPOAPOSENTADORIA: number | null; // xs:short, opt, Tipo Aposentadoria
  DEFICIENTEFISICO: number | null; // xs:short, opt, Físico
  DEFICIENTEAUDITIVO: number | null; // xs:short, opt, Auditivo
  DEFICIENTEFALA: number | null; // xs:short, opt, Fala
  DEFICIENTEVISUAL: number | null; // xs:short, opt, Visual
  DEFICIENTEMENTAL: number | null; // xs:short, opt, Mental
  BRPDH: number | null; // xs:short, opt, Reabilitado(BR)
  DTMUDANCAFUNCAO: string | null; // xs:dateTime, opt, Data da Mudança
  MOTMUDANCAFUNCAO: string | null; // xs:string, opt, Motivo da Mudança
  DTMUDANCAHORARIO: string | null; // xs:dateTime, opt, Data da Mudança
  DTMUDANCASALARIO: string | null; // xs:dateTime, opt, Data da Mudança
  MOTMUDANCASALARIO: string | null; // xs:string, opt, Motivo da Mudança
  DTMUDANCASECAO: string | null; // xs:dateTime, opt, Data da Mudança
  MOTMUDANCASECAO: string | null; // xs:string, opt, Motivo da Mudança
  DTMUDANCACONTRIBSINDICAL: string | null; // xs:dateTime, opt, Data da Mudança
  VALORMUDANCACONTRIBSINDICAL: number | null; // xs:decimal, opt, Valor
  HSTSIT_MOTIVO: string | null; // xs:string, opt, Motivo da Mudança
  HSTSIT_DATAMUDANCA: string | null; // xs:dateTime, opt, Data da Mudança
  HSTAFT_ESTTEMPOSERVICO: boolean | null; // xs:boolean, opt, default:false, Estorna tempo de casa (para anuênios, quinquênios, etc.)
  IDIMAGEM: number | null; // xs:int, opt
  HSTSEFIP_DTMUDANCA: string | null; // xs:dateTime, opt, Data da Mudança
  SALDOFGTSREAL: number | null; // xs:decimal, opt, Saldo Real FGTS
  CONTRIBASSOC1OCORRCNPJ: string | null; // xs:string, opt, CNPJ 1ª Ocorrência
  CONTRIBASSOC2OCORRCNPJ: string | null; // xs:string, opt, CNPJ 2ª Ocorrência
  CONTRIBASSISTCNPJ: string | null; // xs:string, opt, CNPJ Assistencial
  CONTRIBCONFEDCNPJ: string | null; // xs:string, opt, CNPJ Confederativa
  CONTRIBASSOC1OCORRVALOR: number | null; // xs:decimal, opt, Valor
  CONTRIBASSOC2OCORRVALOR: number | null; // xs:decimal, opt, Valor
  CONTRIBASSISTVALOR: number | null; // xs:decimal, opt, Valor
  CONTRIBCONFEDVALOR: number | null; // xs:decimal, opt, Valor
  LOCALTRABCODMUNCIPIO: string | null; // xs:string, opt, Local de Trabalho (Código Município)
  MESESHORAEXTRAS: number | null; // xs:int, opt, Meses de Horas Extras
  MESESGRATIFICACAO: number | null; // xs:int, opt, Meses de Gratificação
  MESESDISSIDIOCOLETIVO: number | null; // xs:int, opt, Meses de Dissídio Coletivo
  INDICADORSINDICALIZADO: number | null; // xs:short, opt, Indicador de Sindicalizado
  HSTBANCO_DTMUDANCA: string | null; // xs:dateTime, opt, Data da Mudança
  PARECERREQUISICAO: string | null; // xs:string, opt, Parecer Requisição
  BENEFPONTOS: number | null; // xs:int, opt, Pontos do Funcionário
  CORRACA: string | null; // xs:string, opt, Cor / Raça
  CODUSUARIO: string | null; // xs:string, opt, default:andre.gusman, Código do Usuário
  ESTADOCIVIL: string | null; // xs:string, opt, Estado Civil
  ESTADONATAL: string | null; // xs:string, opt, Estado Natal
  CANDIDATO: number | null; // xs:short, opt, default:0
  REPOEVAGA: string | null; // xs:string, opt, Reposição de Vaga
  RESCISAOPRECISARECALC: number | null; // xs:int, opt, Rescisão Precisa de Recálculo
  CODCOLIGADAORIGEM: number | null; // xs:short, opt, Coligada
  CODPOSTAL: string | null; // xs:string, opt, Cód. Postal
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
  CODTIPOBAIRRO: number | null; // xs:short, opt, Tipo de Bairro
  CODTIPORUA: number | null; // xs:short, opt, Tipo de Rua
  RESIDENCIAPROPRIA: number | null; // xs:short, opt, Residencia Própria
  RESIDENCIARECURSOSFGTS: number | null; // xs:short, opt, Imóvel adquirido com recursos do FGTS
  TIPOREINTEGRACAO: number | null; // xs:short, opt, Tipo de Reintegração
  DATAREINTEGRACAO: string | null; // xs:dateTime, opt, Data da Reintegração
  DATARETORNOEFETIVO: string | null; // xs:dateTime, opt, Data de Retorno Efetivo
  DTPREVTERMINOESTAGIO: string | null; // xs:dateTime, opt, Data de Previsão Termino do Estágio
  CODINSTITUICAOENSINOESTAGIO: string | null; // xs:string, opt, Instituição de Ensino do Estágio
  CODAGENTEINTEGRACAOESTAGIO: string | null; // xs:string, opt, Agente de Integração do Estágio
  DTADMISSAOEMPRESAORIGEM: string | null; // xs:dateTime, opt, Data de Admissão na Empresa Origem
  CODCATEGORIAEMPRESAORIGEM: string | null; // xs:string, opt, Categoria Empresa Origem
  INDADMISSAO: number | null; // xs:int, opt, Indicativo de Admissão
  DTEMISSAORIC: string | null; // xs:dateTime, opt, Data da emissão
  SUCESSAOVINCULO: number | null; // xs:short, opt, Sucessão de Vínculo Trabalhista
  DTINICIOVINCULO: string | null; // xs:dateTime, opt, Data Início Vínculo
  MOTIVOTRABTEMP: number | null; // xs:short, opt, Hipótese legal para Contratação Trabalhador Temporário
  DEFICIENTEINTELECTUAL: number | null; // xs:short, opt, Deficiente intelectual
  CODMUNICIPIO: string | null; // xs:string, opt, Município
  IDPAIS: number | null; // xs:short, opt, País
  DTEMISSAOCNH: string | null; // xs:dateTime, opt, Data emissão CNH
  SITUACAOIRRF: number | null; // xs:short, opt, default:1, IRRF
  NROFILHOSBRASIL: number | null; // xs:short, opt, default:0, Nro. Filhos Brasileiros
  CARREGOUAVISOPREVIO: number | null; // xs:short, opt, default:0, Carregou dados aviso prévio
  RECEBSEGDESEMP: number | null; // xs:short, opt, Estava recebendo seguro desemprego na admissão
  IDDADOSRESID: number | null; // xs:short, opt, Alocação do Residente ou Domiciliado no Exterior
  EXTERNO: string | null; // xs:string, opt
  CODCLASSIFTRABESTRANG: string | null; // xs:string, opt, Classificação do Trabalhador Estrangeiro
  INDPAGTOJUIZO: number | null; // xs:short, opt, Indica pagamento em juízo
  HSTBANCO_DTMUDANCA2: string | null; // xs:dateTime, opt, Data da Mudança
  CODIGORECEITA3533: number | null; // xs:short, opt, DIRF - Informar remuneração no Cód. da Receita 3533
  DTDESLIGAMENTOREINT: string | null; // xs:dateTime, opt, Data do Desligamento
  MOTIVOTRANSFERENCIA: number | null; // xs:short, opt, Motivo da transferência
  CODCCUSTO: string | null; // xs:string, opt, Centro de Custo
  IDITEMCONTABIL: number | null; // xs:int, opt, Item Contábil (Área e Linha de Negócio)
  IDCLASSEVALOR: number | null; // xs:int, opt, Classe de Valor
  TIPOREGIMEJORNADA: number | null; // xs:short, opt, Tipo de regime da jornada
  CODORGORIDES: string | null; // xs:string, opt, Órgão de Origem / Destino
  CODREGJURI: string | null; // xs:string, opt, Regime jurídico
  ANOSCONTRIBINSS: number | null; // xs:int, opt, Anos de contribuição ao INSS
  IDADE: number | null; // xs:int, opt, Idade
  INDSIMPLES: number | null; // xs:short, opt, Indicador de Contribuição Substituída
  TPINCLUSAOCONTRATO: number | null; // xs:short, opt, Tipo de Inclusão de Contrato
  TEMPOPARCIAL: number | null; // xs:short, opt, Contrato de trabalho em regime de tempo parcial
  COTAPCD: number | null; // xs:short, opt, Preenche cota de PCD
  COLTOMADORTEMP: number | null; // xs:short, opt, Coligada do tomador contratante de funcionário temporário
  CODIGOTOMADORTEMP: string | null; // xs:string, opt, Empresa contratante do funcionário temporário
  DTDEMISSAOPREVISTA: string | null; // xs:dateTime, opt
  DTAVISOPREVIOTRAB: string | null; // xs:dateTime, opt
  TEMCLAUASSEG: number | null; // xs:short, opt, Contém cláusula assecuratória
  CODTIPOCONTRATO: number | null; // xs:short, opt,  
  TPINSCRICAOTEMP: number | null; // xs:short, opt, Tipo Inscrição
  CODCATEGORIAESOCIAL: number | null; // xs:short, opt, Código da Categoria eSocial
  TIPOAVISOPREVIO: number | null; // xs:short, opt
  ESOCIALFUNCAOCONF: number | null; // xs:short, opt, default:0, Possui Função de Confiança/Cargo em Comissão
  DTINIMUDANCAFUNCAOCONF: string | null; // xs:dateTime, opt, Data Inicial da Mudança
  MOTMUDANCAFUNCAOCONF: string | null; // xs:string, opt, Motivo da Mudança
  DTFIMMUDANCAFUNCAOCONF: string | null; // xs:dateTime, opt, Data Final da Mudança
  DTMUDANCAINDSIMPLES: string | null; // xs:dateTime, opt, Data da Mudança
  CODCATEGORIATRABCEDIDO: number | null; // xs:short, opt, Categoria de origem do trabalhador
  DATAADMISSAOCEDENTE: string | null; // xs:dateTime, opt, Data de admissão do trabalhador no empregador de origem (Cedente)
  TIPOREGIMETRABALHISTACEDIDO: number | null; // xs:short, opt, Tipo de regime trabalhista
  TIPOREGIMEPREVIDENCIARIOCEDIDO: number | null; // xs:short, opt, Tipo de regime previdenciário (ou Sistema de proteção social dos militares)
  INFOONUSCESSAO: number | null; // xs:short, opt, Ônus da cessão/requisição
  ESOCIALNATATIVIDADE: number | null; // xs:short, opt, Natureza da Atividade eSocial
  MOTIVOSAIDATRANSFERENCIA: number | null; // xs:short, opt, Motivo Saída por Transferência
  DTMUDANCAOHISTORICO: string | null; // xs:dateTime, opt
  DEMISSAODESEMPISULFINAD: number | null; // xs:short, opt, Demissão por Desempenho Insuficiente ou Inadaptação
  DTFIMQUARENTENA: string | null; // xs:dateTime, opt, Data Fim Quarentena
  TIPOCONTPRAZODETERMINADO: number | null; // xs:short, opt, Tipo de contrato por prazo determinado
  REFERENCIA_MENSAL: string | null; // xs:string, opt, Jornada (Carga Horária)
  DTMUDANCACATEGORIAESOCIAL: string | null; // xs:dateTime, opt, Data da Mudança
  DTMUDANCACODRECEBIMENTO: string | null; // xs:dateTime, opt, Data da Mudança
  DESCRICAOHORARIO: string | null; // xs:string, opt, Descrição do Horario
  DESCRICAOSITUACAO: string | null; // xs:string, opt, Descrição da Situação
  DESCRICAOSECAO: string | null; // xs:string, opt, Descrição Seção
  NOMEFILIAL: string | null; // xs:string, opt, Nome da Filial
  NOMEDOCARGO: string | null; // xs:string, opt, Nome do Cargo
  DESCRICAOTIPORECEB: string | null; // xs:string, opt, Descrição Tipo de Recebimento
  DESCRICAOTIPOFUNC: string | null; // xs:string, opt, Descrição Tipo de Funcionário
  TEMPODECASA: number | null; // xs:int, opt, Tempo de Casa
  UTILIZAPONTO: string | null; // xs:string, opt, Utiliza Ponto
  NOMECCUSTO: string | null; // xs:string, opt, Nome do Centro de Custo
  DTMUDANCACODTIPOFUNCIONARIO: string | null; // xs:dateTime, opt, Data da Mudança
  NOMEDEPARTAMENTO: string | null; // xs:string, opt, Nome do Departamento
  TIPOADESAOBEM: string | null; // xs:string, opt, Tipo de adesão
  DTACORDOBEM: string | null; // xs:dateTime, opt, Data do acordo
  PERCENTUALREDUCAOBEM: number | null; // xs:decimal, opt, Percentual de redução da Jornada
  DURACAOBEM: number | null; // xs:short, opt, Dias de duração do acordo
  VALORREDUZIDOBEM: number | null; // xs:decimal, opt, Valor reduzido
  DTMUDANCABEM: string | null; // xs:dateTime, opt, Data da Mudança
  DTCANCELAMENTOBEM: string | null; // xs:dateTime, opt, Data do Cancelamento
  DIASPRORROGACAOBEM: number | null; // xs:int, opt, Dias de Prorrogação
  DTANTECIPACAOBEM: string | null; // xs:dateTime, opt, Data da Antecipação
  DTMUDANCATIPOREGIMEJORNADA: string | null; // xs:dateTime, opt, Data da Mudança
  NAOCALCULARECIBOFERIAS: number | null; // xs:short, opt, Não calcula Recibo de Férias
  DTPRORROGACAOBEM: string | null; // xs:dateTime, opt, Data Prorrogação BEM
  TIPOREGPREVDIRIGENTESINDICAL: number | null; // xs:short, opt, Tipo de regime previdenciário (ou Sistema de proteção social dos militares)
  TIPOREGTRABDIRIGENTESINDICAL: number | null; // xs:short, opt, Tipo de regime trabalhista
  ENVIORESCISAOCONSIGNADO: number; // xs:short, req, default:1
  BENEFICIARIO: number | null; // xs:short, opt, Beneficiário Entes Públicos
  DATAINICIOBENEFICIARIO: string | null; // xs:dateTime, opt, Data de início do cadastro do beneficiário
  DATAINCAPACIDADE: string | null; // xs:dateTime, opt, Data do reconhecimento da incapacidade
  BENEFICIARIOINCAPAZ: number | null; // xs:short, opt, Possui doença incapacitante
  FUNCAOACUMULAVEL: number | null; // xs:short, opt, default:0, Considerar como Função/Emprego/Cargo Acumulável
  TIPOPROVIMENTO: string | null; // xs:string, opt, Tipo de provimento
  DTEXERCICIO: string | null; // xs:dateTime, opt, Data da entrada em exercício
  TIPOPLANOSEGREGACAOMASSA: string | null; // xs:string, opt, Tipo de plano de segregação da massa
  TETORGPS: number | null; // xs:short, opt, Sujeito ao teto do RGPS
  ABONOPERMANENCIA: number | null; // xs:short, opt, Recebe abono permanência
  DTINICIOABONO: string | null; // xs:dateTime, opt, Data de início do abono
  DTMUDANCAESTATUTARIO: string | null; // xs:dateTime, opt, Data da Mudança
  INDICATIVOREMUNERACAOCARGO: number | null; // xs:short, opt, default:0, Indicativo de remuneração do cargo efetivo
  TIPOREGTRABMANDATOELETIVO: number | null; // xs:short, opt, Tipo de regime trabalhista
  TIPOREGPREVMANDATOELETIVO: number | null; // xs:short, opt, Tipo de regime previdenciário (ou Sistema de proteção social dos militares)
  CODCATEGORIAMANDATOELETIVO: number | null; // xs:short, opt, Categoria de origem do servidor
  DTEXERCICIOMANDATOELETIVO: string | null; // xs:dateTime, opt, Data de exercício do servidor no órgão público de origem
  TIPOREGIMETRABALHISTA: number | null; // xs:short, opt, Tipo de regime trabalhista
  DESCONSIDERARIRRFSIMPLIFICADO: number | null; // xs:short, opt, Desconsiderar Desconto Simplificado do IRRF
  IMAGEM: Buffer | null; // xs:base64Binary, opt
  MODALIDADECONTRATACAO: number | null; // xs:short, opt, Modalidade de Contratação
  DTMUDANCAHGORA: string | null; // xs:dateTime, opt, Data da Mudança
  UTILIZAPONTOAHGORA: number | null; // xs:int, opt, Utiliza Ponto Ahgora
  EMAILPESSOAL: string | null; // xs:string, opt
  CODMEMOOBS: number | null; // xs:int, opt
  FUMANTE: number | null; // xs:short, opt, Fumante
  FERIASFINALIZADASPROXMES: number | null; // xs:short, opt
  TIPOREDUCAOAVISO: number | null; // xs:short, opt
  FORMAREDUCAOAVISO: number | null; // xs:short, opt
  NROATESTADOOBITO: string | null; // xs:string, opt
  NROPROCESSOTRAB: string | null; // xs:string, opt
  OBSERVACAORESCISAO: string | null; // xs:string, opt
  OBSERVACAOAVISOPREVIO: string | null; // xs:string, opt
  OBSCANCELAMENTOAVISO: string | null; // xs:string, opt
  APMISTO: number | null; // xs:short, opt
  MOTIVOCANCELAMENTOAVISO: number | null; // xs:short, opt
  DTCANCELAMENTOAVISO: string | null; // xs:dateTime, opt
  TRANSFERENCIASUCESSAO: number | null; // xs:short, opt
  APMISTO_DTAVTRAB: string | null; // xs:dateTime, opt
  SEQUENCIATRANSF: number | null; // xs:short, opt
  FERIASDIASUTEIS: number | null; // xs:short, opt, Somente Dias Úteis
  FERIASSALDODIASUTEIS: number | null; // xs:decimal, opt, Saldo em Dias Úteis
  INDSITREMUNAPOSDESLIG: number | null; // xs:short, opt
  DTDESLIGAMENTOJUDICIAL: string | null; // xs:dateTime, opt
  ADESAOPDV: number | null; // xs:short, opt
  DTEMISSAOCNH1: string | null; // xs:dateTime, opt
  ORGEMISSORCNH1: string | null; // xs:string, opt
  DTEXPCML: string | null; // xs:dateTime, opt, Data Emissão Cert. Militar
  DTTITELEITOR: string | null; // xs:dateTime, opt, Data Tit. Eleitor
  DEFICIENTEOBSERVACAO: string | null; // xs:string, opt
  FIADOR_SGI: number | null; // xs:short, opt
  CONJUGE_SGI: number | null; // xs:short, opt
  DEFICIENTEMOBREDUZIDA: number | null; // xs:short, opt
  DATACHEGADA: string | null; // xs:dateTime, opt, Data de Chegada ao Brasil
  CONJUGEBRASIL: number | null; // xs:short, opt, default:0, Cônjuge no Brasil
  NATURALIZADO: number | null; // xs:short, opt, default:0, Naturalizado
  FILHOSBRASIL: number | null; // xs:short, opt, default:0, Filhos no Brasil
  DTVENCIDENT: string | null; // xs:dateTime, opt, Data de Venc. RNM
  DTVENCCARTTRAB: string | null; // xs:dateTime, opt, Data de Venc. CTPS
  INVESTTREINANT: number | null; // xs:decimal, opt, default:0, Investimento em Treinamentos Anteriores
  CODPROFISSAO: number | null; // xs:int, opt, Código da Profissão
  OBSPESSOA: string | null; // xs:string, opt, Observações da pessoa
  IDIMAGEMDOC: number | null; // xs:int, opt, ID Imagem do documento
  IDIMAGEMDOCV: number | null; // xs:int, opt, ID Imagem do verso do documento
  AJUSTATAMANHOFOTO: number | null; // xs:short, opt, Ajusta tamanho da foto?
  DATAAPROVACAOCURR: string | null; // xs:dateTime, opt, Data da aprovação do currículo
  SITMILITAR: string | null; // xs:string, opt, Situação Militar
  ESTELEIT: string | null; // xs:string, opt, Est. Emissor Tit. Eleitor
  IDBIOMETRIA: number | null; // xs:int, opt
  ESTADOROW: number | null; // xs:short, opt, default:0
  ROWVALIDA: string | null; // xs:unsignedShort, opt, default:0
  ALUNO: number | null; // xs:short, opt, default:0, É aluno
  PROFESSOR: number | null; // xs:short, opt, default:0, É professor
  USUARIOBIBLIOS: number | null; // xs:short, opt, default:0, É usuário biblios
  FUNCIONARIO: number | null; // xs:short, opt, default:0, É funcionário
  EXFUNCIONARIO: number | null; // xs:short, opt, default:0, É ex-funcionário
  CODIGOPT: number | null; // xs:int, opt
  CODFREGUESIA: string | null; // xs:string, opt, Cód. Freguesia
  NUMEROCARTCIDADAO: string | null; // xs:string, opt, Número Cartão Cidadão
  DTEMISSAOCARTCIDADAO: string | null; // xs:dateTime, opt, Data Emissão Cartão Cidadão
  ORGEXPCARTCIDADAO: string | null; // xs:string, opt, Org. Exp. Cartão Cidadão
  DTVALIDADECARTCIDADAO: string | null; // xs:dateTime, opt, Data Validade Cartão Cidadão
  CODIGOMX: number | null; // xs:int, opt
  TAGSCRIPT: string | null; // xs:string, opt, Tags de busca
  NROINT: string | null; // xs:string, opt
  CURP: string | null; // xs:string, opt
  DTVENCIDENTPT: string | null; // xs:dateTime, opt, Dt. Vencimento
  CODORGAOCLASSE: string | null; // xs:string, opt, Órgão da Classe
  CODUFREGISTRO: string | null; // xs:string, opt, UF Registro Profissional
  DATANATURALIZACAO: string | null; // xs:dateTime, opt, Data Naturalização
  DTEMISSAORNE: string | null; // xs:dateTime, opt, Data Emissão RNM
  DATAOBITO: string | null; // xs:dateTime, opt, Data do Óbito
  FALECIDO: number | null; // xs:short, opt, default:0, Falecido
  DATAPRIMEIRACNH: string | null; // xs:dateTime, opt, Data Primeira CNH
  UFCNH: string | null; // xs:string, opt, Estado Emissor
  ANO1EMPREGO: number | null; // xs:int, opt, Ano do Primeiro Emprego
  TIPOPRAZORESIDENCIA: number | null; // xs:short, opt, default:0, Prazo de residência indeterminado
  DEFICIENTEOUTROS: string | null; // xs:string, opt, default:0, Outros
  IDREQ: number | null; // xs:int, opt
}

export interface PFCOMPL {
  CODCOLIGADA: number; // xs:short, req, default:1
  CHAPA: string; // xs:string, req
  OPCAOVR: string | null; // xs:string, opt
  PLANOODONTO: string | null; // xs:string, opt
  DUTVRMES: number | null; // xs:int, opt
  DUTVRPMESX: number | null; // xs:int, opt
  PLSAUDE: string | null; // xs:string, opt
  MATSODEXO: string | null; // xs:string, opt
  MATFETRANSPOR: string | null; // xs:string, opt
  DOMAMIL: string | null; // xs:string, opt
  FETRANSPOR: string | null; // xs:string, opt
  CESTABASICA: string | null; // xs:string, opt
  PLANOUNIMED: string | null; // xs:string, opt
  PLANOEMPRESA: number | null; // xs:decimal, opt
  ADTEMPACUM: number | null; // xs:decimal, opt
  MAIORREMPROF: number | null; // xs:decimal, opt
  QUADRIENIO4: string | null; // xs:string, opt
  QUADRIENIO_4: number | null; // xs:int, opt
  PREPOSTO: string | null; // xs:string, opt
  CODPREPOSTO: number | null; // xs:int, opt
  QUINQUENIO_5: number | null; // xs:int, opt
  DIFMAIORSALARIO: number | null; // xs:decimal, opt
  ENVIA_CARTAINSS: string | null; // xs:string, opt
  ENVIACARTAINSS: string | null; // xs:string, opt
  DTJORREDUZIDA: string | null; // xs:dateTime, opt
  DTRETORNO: string | null; // xs:dateTime, opt
  PERCREDUTO: number | null; // xs:int, opt
  REDUCAO: string | null; // xs:string, opt
  DIASREDUCAO: string | null; // xs:string, opt
  SALARIOREDUZIDO: number | null; // xs:decimal, opt
  DIAS_REDUCAO: string | null; // xs:string, opt
  TIPO_FUNREDUCAO: string | null; // xs:string, opt
  EMAILPESSOAL: string | null; // xs:string, opt
  IDYUBE: string | null; // xs:string, opt
  LOTACAO: string | null; // xs:string, opt
  VLHRPADRAO: number | null; // xs:decimal, opt
  PROFESSORREGENTE: string | null; // xs:string, opt
  ESTACIONAMENTO: string | null; // xs:string, opt
  CAJU: string | null; // xs:string, opt
  NUMEROCARTEIRASAUDE: string | null; // xs:string, opt
  CONTRATOSAUDE: string | null; // xs:string, opt
  CONTRATOSAUDE1: string | null; // xs:string, opt
  CODNIVELEF: string | null; // xs:string, opt
  CODNIVELEFII: string | null; // xs:string, opt
  CODNIVELEM: string | null; // xs:string, opt
  OPTRANSPORTE: string | null; // xs:string, opt
  PROFESSORANTIGO: string | null; // xs:string, opt
  DATACASAMENTO: string | null; // xs:dateTime, opt
  DIASUTEISALIMENTACAO: string | null; // xs:string, opt
  VLHRPADRAO2: number | null; // xs:decimal, opt
  DATAHOMOLOGACAO: string | null; // xs:dateTime, opt
  SEGMENTODEATUACAO: string | null; // xs:string, opt
  SEGMENTODEATUACAO1: string | null; // xs:string, opt
  DATALAUDO: string | null; // xs:dateTime, opt
}

export interface VPCOMPL {
  CODPESSOA: number; // xs:int, req
  RECCREATEDBY: string | null; // xs:string, opt
  RECCREATEDON: string | null; // xs:dateTime, opt
  RECMODIFIEDBY: string | null; // xs:string, opt
  RECMODIFIEDON: string | null; // xs:dateTime, opt
  CODIGOEXTERNO: string | null; // xs:string, opt
  IDEXTERNO: number | null; // xs:int, opt
}

export interface PEstabilidadeProvisoria {
  CODCOLIGADA: number | null; // xs:short, opt, default:1
  CHAPA: string | null; // xs:string, opt
  DESCRICAO: string; // xs:string, req, Descrição
  DTINICIO: string | null; // xs:dateTime, opt, Início Estabilidade
  DTFIM: string | null; // xs:dateTime, opt, Fim Estabilidade
  DataExoneracao: string | null; // xs:dateTime, opt
  TemEstabilidade: number | null; // xs:short, opt
  RepresentanteEmpregador: number | null; // xs:short, opt
}

export interface PPendenciaDemissional {
  CODCOLIGADA: number | null; // xs:short, opt, default:1
  CHAPA: string | null; // xs:string, opt
  DESCRICAO: string; // xs:string, req, Descrição
}

export interface PFHSTHOR {
  CODCOLIGADA: number; // xs:short, req, default:1
  CHAPA: string; // xs:string, req
  DTMUDANCA: string; // xs:dateTime, req
  MOTIVO: string | null; // xs:string, opt
  CODHORARIO: string | null; // xs:string, opt, CODFUNCAO
  INDINICIOHOR: number | null; // xs:short, opt, CODFAIXA
  DATAALTERACAO: string | null; // xs:dateTime, opt, CODNIVEL
}

export interface PFHSTSEC {
  CODCOLIGADA: number; // xs:short, req, default:1
  CHAPA: string; // xs:string, req
  DTMUDANCA: string; // xs:dateTime, req
  MOTIVO: string | null; // xs:string, opt
  CODSECAO: string | null; // xs:string, opt, CODFUNCAO
}

export interface PFHSTUTILIZAPONTOAHGORA {
  CODCOLIGADA: number; // xs:short, req, default:1
  CHAPA: string; // xs:string, req
  UTILIZAPONTO: number | null; // xs:int, opt
  DTMUDANCA: string; // xs:dateTime, req
}

// === EduSalaData ===
export interface SSala {
  CODPREDIO: string; // xs:string, max:5, req, Prédio
  CODBLOCO: string; // xs:string, max:5, req, Bloco
  CODSALA: string; // xs:string, max:10, req, Código
  DESCRICAO: string | null; // xs:string, max:60, opt, Descrição
  ANDAR: string | null; // xs:string, max:3, opt, Andar
  CODLOCAL: string | null; // xs:string, max:40, opt, Localidade do TOTVS Backoffice - Linha RM Gestão Patrimonial
  DISPONIVEL: string | null; // xs:string, max:1, opt, default:T, Indisponível para alocação em:
  HORINIINDISP: string | null; // xs:string, max:5, opt, Hora inicial
  HORFININDISP: string | null; // xs:string, max:5, opt, Hora final
  CODSALAREFURANIA: string | null; // xs:string, max:30, opt, Referência de sala para o Urânia
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODFILIAL: number; // xs:short, req, Cód. Filial
  CODTIPOSALA: number | null; // xs:short, opt, Tipo de sala
  CAPACIDADE: number | null; // xs:int, opt, Capacidade
  CAPACIDADEMAXIMA: number | null; // xs:int, opt, Capacidade máxima
  CAPACIDADEPROVA: number | null; // xs:int, opt, Capacidade para prova
  AREA: number | null; // xs:decimal, opt, Área m2
  CUSTOHORA: number | null; // xs:decimal, opt, Custo da hora/aula
  PERMITERESERVA: string | null; // xs:string, opt, default:S, Permite reserva
  DIASEMANAINDISP: number | null; // xs:short, opt, Dia da semana
}

export interface ILocal {
  CODCOLIGADA: number; // xs:short, req
  CODLOCAL: string; // xs:string, req
  NOME: string | null; // xs:string, opt
}

export interface SSALACOMPL {
  CODPREDIO: string; // xs:string, max:5, req
  CODBLOCO: string; // xs:string, max:5, req
  CODSALA: string; // xs:string, max:10, req
  CODCOLIGADA: number; // xs:short, req, default:1
  CODFILIAL: number; // xs:short, req
}

// === EduTurnoData ===
export interface STurno {
  NOME: string; // xs:string, max:15, req, Turno
  HORINI: string; // xs:string, max:6, req, Hora inicial
  HORFIM: string; // xs:string, max:6, req, Hora final
  TIPO: string; // xs:string, max:1, req, Tipo Turno
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODTURNO: number; // xs:int, req, default:0, Código
  CODTIPOCURSO: number; // xs:short, req, Nível de ensino
  CODFILIAL: number | null; // xs:short, opt, Filial
}

// === EduPredioData ===
export interface SPredio {
  CODPREDIO: string; // xs:string, max:5, req, Código
  NOME: string; // xs:string, max:60, req, Nome
  RUA: string | null; // xs:string, max:40, opt, Logradouro
  NUMERO: string | null; // xs:string, max:8, opt, Número
  COMPLEMENTO: string | null; // xs:string, max:60, opt, Complemento
  BAIRRO: string | null; // xs:string, max:80, opt, Bairro
  ESTADO: string | null; // xs:string, max:2, opt, Estado
  CIDADE: string | null; // xs:string, max:32, opt, Cidade
  CEP: string | null; // xs:string, max:9, opt
  PAIS: string | null; // xs:string, max:16, opt, País
  TELEFONE: string | null; // xs:string, max:15, opt, Telefone
  DDD: string | null; // xs:string, max:4, opt
  FAX: string | null; // xs:string, max:15, opt, Fax
  CONTATO: string | null; // xs:string, max:40, opt, Contato
  EMAIL: string | null; // xs:string, max:60, opt, Email do contato
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODFILIAL: number; // xs:short, req, Cód. Filial
  CODCAMPUS: string | null; // xs:string, opt, Campus/Polo
  CODCOLIGADAPT: number | null; // xs:short, opt
  CODFILIALPT: number | null; // xs:short, opt
  CODPREDIOPT: string | null; // xs:string, opt
  CODFREGUESIA: string | null; // xs:string, opt
  CODPOSTAL: string | null; // xs:string, opt
  CODMUNICIPIO: string | null; // xs:string, opt
  LOCALIDADE: string | null; // xs:string, opt
}

export interface SPREDIOCOMPL {
  CODPREDIO: string; // xs:string, max:5, req
  CODCOLIGADA: number; // xs:short, req, default:1
  CODFILIAL: number; // xs:short, req
}

// === EduBlocoData ===
export interface SBLOCO {
  CODPREDIO: string; // xs:string, max:5, req, Prédio
  CODBLOCO: string; // xs:string, max:5, req, Bloco
  DESCRICAO: string | null; // xs:string, max:60, opt, Descrição
  CODCOLIGADA: number; // xs:short, req, default:1, Coligada
  CODFILIAL: number; // xs:short, req, Cód. Filial
  OBSERVACAO: string | null; // xs:string, opt
}

export interface SBLOCOCOMPL {
  CODPREDIO: string; // xs:string, max:5, req
  CODBLOCO: string; // xs:string, max:5, req
  CODCOLIGADA: number; // xs:short, req, default:1
  CODFILIAL: number; // xs:short, req
}
