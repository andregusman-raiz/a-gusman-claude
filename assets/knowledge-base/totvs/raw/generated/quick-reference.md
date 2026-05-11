# TOTVS RM — Quick Reference (Auto-Generated)

> Generated: 2026-03-26

## Metrics

| Metric | Value |
|--------|-------|
| DataServers (SOAP) | 29 |
| Tables mapped | 72 |
| Fields mapped | 1992 |
| SOAP WebServices | 15 |
| REST endpoints probed | 55 |
| REST endpoints OK | 7 |

## DataServer → Table Map

| DataServer | Main Table | Fields | Sub-Tables |
|-----------|------------|--------|------------|
| GlbColigadaData | GColigada | 28 | GFilial |
| GlbUsuarioData | GUSUARIO | 41 | GPERMIS, GUSRPERFIL |
| EduCursoData | SCurso | 21 | SCURSOCOMPL |
| EduTurmaData | STurma | 54 | STURMACOMPL |
| EduHabilitacaoData | SHabilitacao | 21 | SHABILITACAOCOMPL |
| EduTurmaDiscData | STurmaDisc | 68 | STURMADISCCOMPL |
| EduMatriculaData | SMatricula | 43 | SMatriculaCompl, STurmaDisc, SHorarioTurma, SProfessorTurma |
| EduDisciplinaData | SDISCIPLINA | 36 | - |
| EduDiscGradeData | SDISCGRADE | 49 | SDISCGRADECOMPL |
| EduGradeData | SGrade | 50 | SDiscGrade, SOptativas, SGRADECOMPL |
| EduProfessorData | SProfessor | 174 | SProfessorCompl |
| EduHorarioTurmaData | SHorarioTurma | 29 | - |
| EduFrequenciaDiariaWSData | SFREQUENCIA | 8 | PARAMS, AlunosFreq, PlanoAulaFreq |
| EduNotasData | SNotas | 48 | SNotasComentario, NOTASVIEW |
| EduProfessorTurmaData | SPROFESSORTURMA | 56 | SPROFESSORTURMACOMPL |
| EduNotaEtapaData | SNotaEtapa | 10 | SNotaEtapaComentario |
| EduPlanoAulaData | SPlanoAula | 39 | SPlanoAulaArquivo |
| EduTipoMatriculaData | STipoMatricula | 6 | - |
| EduStatusData | SStatus | 88 | SStatusItinerarioFormativo |
| EduParcelaData | SParcela | 29 | SResponsavel |
| EduContratoData | SContrato | 55 | SResponsavelContrato, SBOLSARETROATIVACONTRATO, SCONTRATOACESSOS |
| EduBolsaData | SBolsa | 26 | SBOLSACOMPL |
| EduResponsavelData | SResponsavel | 11 | - |
| EduOcorrenciaAlunoData | SOcorrenciaAluno | 26 | SOCORRENCIAALUNOARQ, SOCORRENCIAALUNOCOMPL |
| FopFuncData | PFunc | 524 | PFCOMPL, VPCOMPL, PEstabilidadeProvisoria, PPendenciaDemissional, PFHSTHOR, PFHSTSEC, PFHSTUTILIZAPONTOAHGORA |
| EduSalaData | SSala | 20 | ILocal, SSALACOMPL |
| EduTurnoData | STurno | 8 | - |
| EduPredioData | SPredio | 25 | SPREDIOCOMPL |
| EduBlocoData | SBLOCO | 6 | SBLOCOCOMPL |

## Top Tables by Field Count

| Table | Fields | DataServer |
|-------|--------|------------|
| PFunc | 524 | FopFuncData |
| SProfessor | 174 | EduProfessorData |
| SStatus | 88 | EduStatusData |
| STurmaDisc | 68 | EduTurmaDiscData |
| SPROFESSORTURMA | 56 | EduProfessorTurmaData |
| SContrato | 55 | EduContratoData |
| STurma | 54 | EduTurmaData |
| PFCOMPL | 54 | FopFuncData |
| SGrade | 50 | EduGradeData |
| SDISCGRADE | 49 | EduDiscGradeData |
| SNotas | 48 | EduNotasData |
| SMatricula | 43 | EduMatriculaData |
| GUSUARIO | 41 | GlbUsuarioData |
| SPlanoAula | 39 | EduPlanoAulaData |
| SDISCIPLINA | 36 | EduDisciplinaData |
| SDiscGrade | 33 | EduGradeData |
| SHorarioTurma | 29 | EduHorarioTurmaData |
| SParcela | 29 | EduParcelaData |
| GColigada | 28 | GlbColigadaData |
| SBolsa | 26 | EduBolsaData |

## SOAP WebServices

| Service | Operations | Key Methods |
|---------|-----------|-------------|
| EAIService | 9 | receiveMessage |
| wsCRMAtendimento | 27 | criarAtendimento, criarAtendimentoSimples, criarAtendimentoCliente, criarAtendimentoWorkflow, encaminharAtendimentoParaAtendente |
| wsConceito | 9 | ExecutarConceito |
| wsConsultaSQL | 9 | RealizarConsultaSQL, RealizarConsultaSQLContexto |
| wsDataServer | 21 | GetSchema, IsValidDataServer, GetSchemaEmail, ReadView, ReadViewEmail |
| wsEdu | 17 | ListarBoletos, ImprimeBoleto, ImprimeBoletoParam, CalculaCodigoBarrasBoleto, CalculaCodigoIpteBoleto |
| wsFin | 10 | SaveLancamento, BaixaLancamento, ValorLiquido |
| wsFormulaVisual | 9 | GetParameters, Execute |
| wsImb | 12 | GerarPlanoFinanciamentoMemoria, ValorAtualizadoLancamentosXML, ValorAtualizadoLancamentosJSON, CriarContratoVendaCodInterno, CriarContratoVendaCodExterno |
| wsMov | 8 | SaveMovimento |
| wsPrj | 11 | ApropriarMovimentoTituloAPagar, ConsistirProjeto, RecuperaNumeroDeProjetos |
| wsProcess | 16 | GetSchema, GetSchema2, ExecuteProcess, ExecuteWithParams, ExecuteWithParamsAsync |
| wsReport | 16 | GetReportList, GetReportMetaData, GenerateReport, GetGeneratedReportSize, GetFileHash |
| wsSau | 31 | GetListaExames, GetResultadoExame, getResultadoExame, RegistraRecebimentoResultadoExame_Shift, AtualizaStatusExameShifLiss |
| wsTOTVSMessage | 9 | ReceberArquivo |

## REST API (Working Endpoints)

| Endpoint | Fields | Status |
|----------|--------|--------|
| educational/v1/StudentContexts | - | OK |
| educational/v1/ProfessorContexts | - | OK |
| framework/v1/companies | 17 | OK |
| framework/v1/branches | 19 | OK |
| rh/v1/employeehistorystatus | 6 | OK |
| rh/v1/employeeHistorySection | 8 | OK |
| rh/v1/calculatedWarnings | 10 | OK |

## Access Vectors

| Vector | Status | Notes |
|--------|--------|-------|
| SQL Server Direct | BLOCKED (firewall) | Needs VPN or IP whitelist |
| REST API (PROD) | OK | JWT auth, 5min TTL |
| REST API (DEV) | OK | Same auth |
| SOAP DataServer | OK | GetSchema, ReadView, ReadRecord |
| SOAP wsConsultaSQL | LIMITED | Only pre-registered queries (GCONSSQL) |
| SOAP wsReport | OK | Report generation |
| SOAP wsProcess | OK | Workflow execution |