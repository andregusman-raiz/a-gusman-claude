# Dicionario de APIs — TOTVS RM

> Raiz Educacao · Servidor de Producao · Marco 2026
>
> **Para quem e este documento?**
> Para gestores que precisam entender o que e possivel integrar, e para desenvolvedores que precisam saber como comecar.
> Nao e necessario conhecimento tecnico para ler a Parte 1. A Parte 2 e para quem vai implementar.

---

## Parte 1 — O que temos? (Para gestores)

### Visao geral

O TOTVS RM expoe **todas as suas telas e dados via API**. Qualquer coisa que um usuario faz no sistema pela tela, um sistema externo pode fazer via API — ler, criar, alterar ou excluir.

O servidor de producao da Raiz Educacao possui **23 modulos** com aproximadamente **3.900 "portas de acesso" (DataServers)** documentadas e disponiveis.

### O que isso significa na pratica?

| O que voce quer fazer | E possivel via API? |
|---|---|
| Listar todos os funcionarios ativos | Sim, direto |
| Ler holerites de qualquer competencia | Sim, direto |
| Consultar batidas de ponto por funcionario | Sim, direto |
| Ver historico salarial e promocoes | Sim, direto |
| Buscar alunos, turmas, notas e faltas | Sim, direto |
| Consultar boletos e inadimplencia | Sim, direto |
| Ver contratos assinados de matricula | Sim, direto |
| Consultar estoque e compras | Sim, direto |
| Lancar eventos na folha de pagamento | Sim, com validacao |
| Admitir ou demitir funcionario | Sim, com cuidado |
| Gerar relatorios em PDF | Sim, via SOAP |
| Disparar calculo de folha | Sim, via SOAP |

---

### Os 23 modulos disponiveis

| Modulo | Area | Portas de Acesso | Dados reais no servidor |
|---|---|:---:|---|
| **Educacional** | Academico | **730** | Alunos, turmas, notas, frequencia, matriculas |
| **RH** | Recursos Humanos | **426** | Pessoas, vagas, selecoes, beneficios, T&D |
| **Folha de Pagamento** | Departamento Pessoal | **350** | 20.748 funcionarios, 161.842 holerites |
| **Imobiliario** | Patrimonial | **500** | Imoveis, contratos de locacao |
| **Projetos** | Gestao | **277** | Projetos, tarefas, cronograma, custos |
| **Fiscal** | Backoffice | **200** | NF-e, obrigacoes fiscais, SPED |
| **Financeiro** | Backoffice | **161** | Contas a pagar/receber, boletos, bancos |
| **Controle de Ponto** | Dep. Pessoal | **167** | 198.713 batidas registradas |
| **CRM** | Comercial | **136** | Clientes, oportunidades, atendimentos |
| **Seg. e Med. do Trabalho** | Dep. Pessoal | **121** | ASO, EPI, PPRA, CIPA, atestados |
| **Movimento (Faturamento)** | Comercial | **109** | Pedidos, NF-e, faturamento |
| **Contabil** | Backoffice | **91** | Plano de contas, lancamentos, DRE, balanco |
| **Manutencao** | Operacional | **86** | OS, preventiva, corretiva |
| **Biblioteca** | Academico | **86** | Acervo, emprestimos, reservas |
| **Estoque** | Operacional | **84** | Produtos, saldos, inventario, locais |
| **Globais** | Infraestrutura | **78** | Cadastros base: pessoas, enderecos, filiais |
| **Patrimonial** | Operacional | **74** | Bens, depreciacao, inventario |
| **Conector** | Integracao | **65** | Middleware, filas, integracoes |
| **Planej. Controle Producao** | Operacional | **56** | Ordens de producao, planejamento |
| **Avaliacao e Pesquisa** | Academico/RH | **32** | Questionarios, avaliacoes, pesquisas |
| **Compras** | Operacional | **22** | Cotacoes, ordens de compra, fornecedores |
| **Contrato** | Backoffice | **15** | Contratos, vigencias, reajustes |

**Total: ~3.900 DataServers em 23 modulos**

---

### Nivel de maturidade para integracao

```
Facil    ████████████████████  Consulta/leitura de dados
Medio    ████████████░░░░░░░░  Criacao e atualizacao de registros
Avancado ██████░░░░░░░░░░░░░░  Processos e calculos (folha, eSocial)
```

---

### Volumetria de Producao

| Metrica | Quantidade |
|---------|-----------|
| Funcionarios na base | 20.748 |
| Registros de ponto | 198.713+ batidas |
| Pessoas cadastradas (RH) | 359.086 |
| Holerites disponiveis | 161.842 |
| Coligadas mapeadas | 31 ativas |

---

## Parte 2 — Como funciona? (Para desenvolvedores)

### Autenticacao

O servidor aceita dois metodos:

**Opcao A — Bearer Token (recomendado)**
```
POST https://raizeducacao160286.rm.cloudtotvs.com.br:8051/api/connect/token
Content-Type: application/json

{ "username": "SEU_USUARIO_RM", "password": "SUA_SENHA_RM" }
```
Retorna um token valido por **5 minutos**. Use no header de todas as requisicoes:
```
Authorization: Bearer eyJhbGci...
```

**Opcao B — Basic Auth**
```
Authorization: Basic base64(usuario:senha)
```
Funciona, mas menos seguro. Use apenas internamente.

---

### Padrao de URL

**REST via DataServer (acesso direto aos DataServers):**
```
GET    /RMSRestDataServer/rest/{DataServer}
GET    /RMSRestDataServer/rest/{DataServer}/{id}
POST   /RMSRestDataServer/rest/{DataServer}
PUT    /RMSRestDataServer/rest/{DataServer}/{id}
DELETE /RMSRestDataServer/rest/{DataServer}/{id}
```

**REST API moderna (endpoints dedicados):**
```
GET    /api/{modulo}/v1/{recurso}
GET    /api/{modulo}/v1/{recurso}/{id}
```

**Parametros de consulta:**
```
?limit=50           → maximo de registros retornados
?start=0            → paginacao (offset)
?filter=CAMPO=VALOR → filtro (nem todos os DataServers suportam)
```

**Formato de ID composto** (chave primaria com multiplos campos):
```
CODCOLIGADA$_$CAMPO2$_$CAMPO3
Exemplo: 1$_$00278  (coligada 1, chapa 00278)
```

---

### DataServers por modulo — Referencia rapida

#### Departamento Pessoal / Folha

| DataServer | O que retorna | Exemplo de uso |
|---|---|---|
| `FopFuncData` | Cadastro completo de funcionarios | Listar ativos, buscar por CPF |
| `FopEnvelopeData` | Holerites por competencia | Portal do colaborador |
| `FopEventoData` | Tabela de eventos (verbas) | Entender composicao da folha |
| `FopFichaFinancData` | Ficha financeira do funcionario | Historico de pagamentos |
| `FopHstSalData` | Historico salarial | Rastrear promocoes e reajustes |
| `FopHstSitData` | Historico de situacoes | Admissao, afastamentos, demissao |
| `FopDependData` | Dependentes | IR, plano de saude |
| `FopRescisaoData` | Dados rescisorios e ferias | Agendamento de ferias |
| `FopAvisoPrevioData` | Avisos previos | Controle de desligamentos |
| `FopCCustoData` | Centros de custo | Rateio de folha |
| `FopSecaoData` | Secoes/departamentos | Organograma |
| `FopFuncaoData` | Funcoes/cargos (CBO) | Tabela de cargos |
| `FopLancExternoData` | Lancamentos externos | Integrar bonus, comissoes |
| `FopEsocialFilaEventosData` | Fila eSocial | Monitorar envios |
| `FopConvenioData` | Convenios | Beneficios corporativos |
| `FopEnvelopeFeriasData` | Recibo de ferias | Portal do colaborador |

#### Controle de Ponto

| DataServer | O que retorna | Exemplo de uso |
|---|---|---|
| `PtoBatidaData` | Registro de batidas | Espelho de ponto |
| `PtoHorarioData` | Horarios de trabalho | Configuracao de jornadas |
| `PtoAbonoData` | Tipos de abono | Justificativas de ausencia |
| `PtoOcorrenciaCalculadaData` | Ocorrencias calculadas | Horas extras/faltas |
| `PtoSaldoBancoHorData` | Banco de horas | Saldo por funcionario |
| `PtoEspelhoCartaoData` | Espelho do cartao ponto | Impressao/portal |
| `PtoBatidasDoDiaData` | Batidas do dia atual | Dashboard em tempo real |
| `PtoDataMovimentoDiaDia` | Movimento diario | Analise de presenca |
| `PtoJustFunData` | Justificativas | Aprovacao de absenteismo |

#### Recursos Humanos

| DataServer | O que retorna | Exemplo de uso |
|---|---|---|
| `RhuPessoaData` | Cadastro de pessoas (359k registros) | Base unificada de pessoas |
| `RhuCargoData` | Cargos | Organograma |
| `RhuFuncaoData` | Funcoes | Perfil de cargo |
| `RhuBenefFuncData` | Beneficios por funcionario | Gestao de beneficios |
| `RhuReqDesligamentoData` | Requisicoes de desligamento | Workflow de demissao |
| `RhuSelecoesData` | Processos seletivos | Recrutamento e selecao |
| `RhuTreinamentosData` | Treinamentos | T&D |
| `RhuAvaliacoesData` | Avaliacoes de desempenho | Performance |
| `RhuGradeRemuneracaoData` | Grade salarial | Politica de remuneracao |
| `RhuPDIData` | Plano de desenvolvimento | PDI individual |

#### Educacional

| DataServer | O que retorna | Exemplo de uso |
|---|---|---|
| `EduAlunoData` | Cadastro de alunos | Portal do aluno, BI |
| `EduAlunosTurmasProfData` | Alunos por turma (c/ foto) | App de frequencia, chamada |
| `EduFrequenciaDiariaData` | Frequencia diaria | Lancar e consultar chamada |
| `EduMatriculaData` | Matriculas por periodo | Controle de matriculas |
| `EduContratoData` | Contratos de matricula | Assinatura eletronica |
| `EduTurmaData` | Turmas | Grade horaria |
| `EduNotaData` | Notas e avaliacoes | Boletim online |
| `EduBoletoData` | Boletos educacionais | Portal financeiro do aluno |
| `EduProfessorData` | Cadastro de professores | App docente |
| `EduDisciplinaData` | Disciplinas | Curriculo academico |
| `EduHabilitacaoFilialData` | Cursos por filial | Oferta academica |

#### Financeiro / Contabil

| DataServer | O que retorna | Exemplo de uso |
|---|---|---|
| `FinBoletoData` | Boletos gerados | Conciliacao bancaria |
| `FinAcordoData` | Acordos de pagamento | Gestao de inadimplencia |
| `FinBancoData` | Bancos cadastrados | Parametrizacao |
| `FinLancamentoData` | Lancamentos financeiros | Fluxo de caixa |
| `CtbContaData` | Plano de contas | Estrutura contabil |
| `CtbLancamentoData` | Lancamentos contabeis | Escrituracao |
| `CtbCCustoData` | Centros de custo contabeis | Rateio contabil |
| `CtbAccountingEntriesDataApi` | Partidas dobradas (API moderna) | Integracao contabil |

#### Compras / Estoque

| DataServer | O que retorna | Exemplo de uso |
|---|---|---|
| `CmpCotacaoData` | Cotacoes de compra | Processo de compras |
| `CmpOrdemCompraData` | Ordens de compra | Aprovacao e follow-up |
| `CmpQualificacaoCfoData` | Qualificacao de fornecedores | Homologacao |
| `EstConsultaSaldoData` | Saldo em estoque | Dashboard de estoque |
| `EstGrdData` | Grade de produtos | Catalogo |
| `EstMntInventarioData` | Inventario | Contagem fisica |

#### Seguranca e Medicina do Trabalho

| DataServer | O que retorna | Exemplo de uso |
|---|---|---|
| `SmtAtestadoData` | Atestados medicos | Controle de afastamentos |
| `SmtExamesData` | Exames (ASO, admissional, etc.) | Agenda medica |
| `SmtEpiData` | EPIs cadastrados | Controle de entrega |
| `SmtEmprestimoEPIData` | Emprestimos de EPI | Rastreabilidade |
| `SmtOcorrenciaData` | Acidentes e ocorrencias | CIPA, CAT |
| `SmtPPRAData` | PPRA/PGR | Laudos ambientais |
| `SmtCtrlVacinalData` | Carteira vacinal | Saude ocupacional |

---

### Protocolo SOAP (operacoes avancadas)

Alem do REST, o TOTVS RM expoe um **webservice SOAP** para operacoes que envolvem regras de negocio complexas (calculos, processos, relatorios).

```
URL do WSDL: https://raizeducacao160286.rm.cloudtotvs.com.br:8051/wsDataServer/MEX?wsdl
SOAPAction:  http://www.totvs.com/IwsDataServer/{Metodo}
```

**Operacoes principais:**

| Metodo SOAP | Para que serve |
|---|---|
| `ReadRecord` | Ler um registro pelo ID (retorna XML estruturado) |
| `SaveRecord` | Criar ou alterar um registro com validacoes de negocio |
| `DeleteRecord` | Excluir registro |
| `ReadView` | Consultar visao/lista com filtros SQL |
| `ConsultaSQL` | Executar SQL customizado (requer sentenca cadastrada no servidor) |

**Exemplo de envelope SaveRecord:**
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tot="http://www.totvs.com/">
  <soapenv:Body>
    <tot:SaveRecord>
      <tot:DataServerName>FopLancExternoData</tot:DataServerName>
      <tot:XML><!-- XML do registro aqui --></tot:XML>
      <tot:Contexto>CODCOLIGADA=1;CODAPLICACAO=P;CODUSUARIO=usuario</tot:Contexto>
    </tot:SaveRecord>
  </soapenv:Body>
</soapenv:Envelope>
```

---

### Tabela de dificuldade por caso de uso

| Caso de uso | Tipo | Dificuldade | Observacao |
|---|---|:---:|---|
| Listar funcionarios / alunos | REST GET | Facil | Funciona imediatamente |
| Consultar holerites | REST GET | Facil | Filtrar por ANOCOMP/MESCOMP |
| Consultar batidas de ponto | REST GET | Facil | Filtrar por CODCOLIGADA e CHAPA |
| Exportar dados para BI | REST GET | Facil | Paginar com limit/start |
| Portal do colaborador (leitura) | REST GET | Medio | Token por usuario RM |
| Lancar evento na folha | REST POST / SOAP | Medio | Requer XML de estrutura |
| Marcar frequencia de aluno | REST PUT | Medio | EduFrequenciaDiariaData |
| Criar aluno / funcionario | SOAP SaveRecord | Avancado | Muitos campos obrigatorios |
| Efetuar matricula completa | SOAP SaveRecord | Avancado | Envolve multiplos DataServers |
| Calcular folha de pagamento | SOAP Process | Expert | Requer ProcessServer |
| Integracao eSocial | SOAP/REST | Expert | Envolve fila e validacoes |

---

### Comecando em 5 minutos

**1. Obter token:**
```bash
curl -X POST "https://raizeducacao160286.rm.cloudtotvs.com.br:8051/api/connect/token" \
  -H "Content-Type: application/json" \
  -d '{"username":"SEU_USUARIO","password":"SUA_SENHA"}'
```

**2. Listar funcionarios ativos:**
```bash
curl "https://raizeducacao160286.rm.cloudtotvs.com.br:8051/RMSRestDataServer/rest/FopFuncData?limit=10&filter=CODSITUACAO=A" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**3. Consultar batidas de ponto de um funcionario:**
```bash
curl "https://raizeducacao160286.rm.cloudtotvs.com.br:8051/RMSRestDataServer/rest/PtoBatidaData?filter=CHAPA=00278" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**4. Ver holerite de marco/2026:**
```bash
curl "https://raizeducacao160286.rm.cloudtotvs.com.br:8051/RMSRestDataServer/rest/FopEnvelopeData?filter=ANOCOMP=2026 AND MESCOMP=3" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### Descobrir o DataServer de qualquer tela

Dentro do TOTVS RM, em qualquer tela, pressione:

```
Ctrl + Alt + F9
```

O sistema exibe o nome exato do DataServer daquela tela. Use esse nome direto na URL da API.

---

## Resumo Executivo

| | |
|---|---|
| **Servidor de producao** | raizeducacao160286.rm.cloudtotvs.com.br:8051 |
| **Modulos disponiveis** | 23 |
| **DataServers (endpoints)** | ~3.900 |
| **Protocolos** | REST (JSON) + SOAP (XML) |
| **Autenticacao** | Bearer Token (JWT) ou Basic Auth |
| **Funcionarios na base** | 20.748 |
| **Registros de ponto** | 198.713+ batidas |
| **Pessoas cadastradas (RH)** | 359.086 |
| **Holerites disponiveis** | 161.842 |
| **Status** | Producao ativa, APIs respondendo |

---

### Relacao com outros arquivos da KB

| Arquivo | Complementa com |
|---------|----------------|
| `../apis.json` | 29 DataServers SOAP detalhados (schemas) + 55 REST probados (status codes) |
| `../schema.json` | 69 tabelas, 1992 campos, FKs, PII |
| `../queries.json` | 28 queries SQL catalogadas |
| `integration-patterns.md` | Padroes de codigo, retry, concorrencia |
| `gotchas.md` | 24 licoes aprendidas |

> Este dicionario e a visao de alto nivel. Para detalhes de campos e schemas, consulte `schema.json` e `apis.json`.

---

*Documento gerado em 26/03/2026 · Dados verificados no servidor de producao · Raiz Educacao*
