# SophiA — Contexto Unificado para Integrações

> **Documento-mãe**: consolida tudo que existe em `~/Claude/assets/knowledge-base/sophia/` + o estado real da integração em `~/Claude/projetos/sophia-educacional-frontend/` + transcrição de ligação oficial com o suporte Sophia.
>
> **Propósito**: servir como parâmetro único para qualquer futura integração com a plataforma SophiA (ERP escolar da Primasoft/Volaris). Inclui autenticação, endpoints, modelos, patterns, gotchas, confirmações oficiais e referências cruzadas.
>
> **Última atualização**: 2026-04-08 (incorporada transcrição do suporte Sophia)
> **Ownership**: workspace raiz (`~/Claude/`). Não duplicar — referenciar.

---

## 0. Índice

1. [Empresa e Plataforma](#1-empresa-e-plataforma)
2. [Arquitetura da API](#2-arquitetura-da-api)
3. [Autenticação (crítico)](#3-autenticação-crítico)
4. [URL base, multi-tenant e configuração de ambiente](#4-url-base-multi-tenant-e-configuração-de-ambiente)
5. [Variáveis de ambiente usadas pela integração](#5-variáveis-de-ambiente-usadas-pela-integração)
6. [Catálogo de endpoints por domínio (258 total)](#6-catálogo-de-endpoints-por-domínio)
7. [Modelos principais (datashapes)](#7-modelos-principais-datashapes)
8. [Camada de integração no frontend (Next.js)](#8-camada-de-integração-no-frontend)
9. [Estado atual de consumo (o que o frontend realmente chama)](#9-estado-atual-de-consumo)
10. [Patterns obrigatórios para novos providers](#10-patterns-obrigatórios-para-novos-providers)
11. [Gotchas (19 lições aprendidas)](#11-gotchas-lições-aprendidas)
12. [Cross-reference com TOTVS RM](#12-cross-reference-com-totvs-rm)
13. [Integrações conhecidas (Layers, RD Station, bancos)](#13-integrações-conhecidas)
14. [Glossário técnico → negócio](#14-glossário)
15. [Referências (raw files)](#15-referências)
16. [Confirmações oficiais do suporte Sophia (transcrição 2026-04)](#16-confirmações-oficiais-do-suporte-sophia)

---

## 1. Empresa e Plataforma

| Campo | Valor |
|---|---|
| Razão social | Primasoft Informática Ltda |
| Nome fantasia | Soluções Sophia (ex-Prima Software) |
| CNPJ | 69.112.514/0001-35 |
| Fundação | 13/04/1993 (Eduardo Voigt, Walter Saliba) |
| Sede | Rua Euclides Miragaia 433, São José dos Campos/SP |
| Controlador | Volaris Group (Constellation Software/TSX:CSU, Canadá) — desde jul/2018 |
| Base instalada | 3.500-5.000+ instituições de ensino |
| Produtos | 10 (Gestão Escolar, Ed. Infantil, Acadêmica, Cursos Livres, Biblioteca/Philos, Quadro de Horários/Untis, Acervo, Sophia+, etc.) |

**Produto foco desta integração**: *SophiA Gestão Escolar Web* — versão 100% web/SaaS do ERP escolar, com API REST v1 documentada no portal público via Swagger.

### Ecossistema mobile
- **Sophia+ by Layers** (`education.layers.sophiabylayers`) — parceria Layers Education (2022), consolida 7 apps legados em um app white-label.
- **SophiA Escolar** (legado, `com.intuitiveappz.sophiaPadrao`) — app nativo antigo.

### Reputação
- **Forças**: 30+ anos de mercado, modularidade, ecossistema de integrações (Layers, Diário Escola, Agenda Edu, Google), biblioteca Philos líder de mercado (7x Top Educação).
- **Fraquezas reportadas**: suporte lento, UX pouco intuitiva, instabilidade ocasional, cobranças extras frequentes (importação, treinamentos, ativação de APIs).

---

## 2. Arquitetura da API

| Aspecto | Detalhe |
|---|---|
| Nome oficial | SophiA Web API (SGx API v1) |
| Versão | v1 |
| Estilo | REST |
| Formatos | JSON e XML (negociado via header `Accept`) — **usar JSON** |
| Total de endpoints (Swagger) | **258** (111 paths únicos × múltiplos métodos) |
| Modelos (Swagger) | **153** |
| Tags (agrupamento) | **56** |
| Documentação oficial | Portal Sophia + Swagger UI |
| URL do Swagger | https://portal.sophia.com.br/sophiawebapi/swagger/index.html |
| Especificação bruta | `raw/swagger-sophia-v1.json` (304 KB, 309 KB raw) |
| Multi-tenant | Sim — cada escola tem número de série distinto |
| Paginação | Offset-based (`?Pagina=1&TamanhoPagina=50`) |
| Webhooks | Apenas para bancos (BB, Itaú, Santander, EfiPay, Gerencianet) |
| SDK oficial | Não existe |
| Rate limits | Não documentados publicamente |

### Domínios MECE (5)

| # | Domínio | Tags | Endpoints |
|---|---|---|---|
| 01 | **Acadêmico** | 17 | 114 |
| 02 | **Pessoas e Cadastro** | 16 | 68 |
| 03 | **Financeiro** | 8 | 32 |
| 04 | **Captação / Processo Seletivo** | 6 | 14 |
| 05 | **Administração** | 9 | 30 |

Ver `unified/domains/*.md` para listagem completa por tag.

---

## 3. Autenticação (crítico)

**Este é o ponto mais delicado da integração. Ler com atenção.**

### 3.1 Endpoint

```
POST {SOPHIA_API_HOST}/SophiAWebAPI/{tenantId}/api/v1/Autenticacao
```

### 3.2 Body — atenção ao casing

```json
{
  "Usuario": "parceiro_usuario",
  "Senha": "parceiro_senha"
}
```

⚠️ **Os campos são PascalCase** (`Usuario`, `Senha`) — não `usuario`/`senha`. O DOC-3 menciona minúscula mas a API real em produção exige PascalCase. Confirmado em `rest.client.ts:56`.

### 3.3 Headers obrigatórios

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |
| `User-Agent` | Qualquer string não-vazia (Sophia bloqueia requests sem User-Agent) |

### 3.4 Resposta

- **200 OK** — retorna o token como **string JSON cruda** (com aspas), ex: `"df28d07fdfd1452482d690ea12bb5296"`. **Precisa fazer strip das aspas** antes de usar.
- **400 Bad Request** — usuário ou senha não informado.
- **401 Unauthorized** — credenciais inválidas. Mensagem típica: *"usuario ou senha invalida para tenant {tenantId}"*.

### 3.5 Uso do token

```
GET /api/v1/Alunos
Headers:
  token: <token-retornado>
  Accept: application/json
  User-Agent: <qualquer>
```

⚠️ **O header é `token` (minúsculo)** — não `Authorization: Bearer <...>`. Isso é não-padrão e fácil de errar.

### 3.6 Regras críticas do token

1. **Vinculado ao IP de origem** — mudança de IP (VPN, deploy, NAT) exige novo login. **Consequência em produção Vercel**: cada função serverless pode ter IP diferente → cache de token por-função é inútil em escala horizontal. Solução: Upstash Redis distribuído (ainda não implementado) OU tolerar re-login frequente.
2. **Expira em 20 minutos** — tanto após criação quanto após última renovação (sliding window). Token é renovado em qualquer request bem-sucedido.
3. **Token inválido não pode ser reaproveitado** — uma vez 401, precisa fazer login de novo.
4. **API é recurso PAGO** — ativação por escola tem custo adicional. A escola precisa negociar com o comercial Sophia.
5. **Credenciais são de parceiro** (não de usuário final) — configurado em: *Configurações > Parâmetros > Gerenciar > aba Web API > Parceiros autenticados*.

### 3.7 Implementação de referência

Ver `sophia-educacional-frontend/src/lib/sophia/clients/rest.client.ts`:
- Cache de token em memória com TTL de 18min (margem de 2min do expiry real)
- Retry automático em 401 (limpa cache e re-autentica 1 vez)
- Timeout de 10s no login, 15s nos requests
- Strip automático das aspas do token raw

---

## 4. URL base, multi-tenant e configuração de ambiente

### 4.1 Padrão real confirmado em produção

```
https://portal.sophia.com.br/SophiAWebAPI/{tenantId}/api/v1/{resource}
```

Exemplo concreto:
```
https://portal.sophia.com.br/SophiAWebAPI/9827/api/v1/Alunos
```

### 4.2 Padrão documentado no DOC-4 (oficial PDF)

```
https://escolar.sophia.com.br/Gerenciador/{NumeroSerie}/api/{VersaoApi}
```

**Os dois padrões existem.** O `portal.sophia.com.br/SophiAWebAPI` funciona e é o que o frontend usa hoje (confirmado em produção). O `escolar.sophia.com.br/Gerenciador` aparece na doc oficial de integração do módulo Biblioteca/Philos — pode ser um gateway alternativo, ou exclusivo daquele módulo.

**Recomendação**: começar pelo padrão que o frontend já usa (`portal.sophia.com.br/SophiAWebAPI/{tenant}`). Se falhar, testar o segundo.

### 4.3 tenantId / NumeroSerie

Cada instalação Sophia tem um número de série único, que identifica a escola dentro da infraestrutura Sophia. É o que funciona como **tenant** multi-tenant.

- **Tenant padrão usado hoje**: `9827` (Colégio Pará de Minas, ambiente atual)
- **Como descobrir**: pedir ao suporte Sophia ou olhar na URL do Gerenciador Web da escola.

### 4.4 Endpoints com e sem prefixo de tenant

O Swagger lista endpoints em **dois formatos**:

```
POST /api/v1/Autenticacao              ← sem prefixo (tenant do token)
POST /{tenant}/api/v1/Autenticacao     ← com prefixo explícito
```

Ambos funcionam. O frontend usa o segundo (com prefixo explícito). Cada par endpoint aparece duplicado no Swagger por isso.

---

## 5. Variáveis de ambiente usadas pela integração

| Variável | Obrigatória | Default | Uso |
|---|---|---|---|
| `SOPHIA_API_HOST` | Não | `https://portal.sophia.com.br` | Base URL antes de `/SophiAWebAPI/...` |
| `SOPHIA_API_USER` | **Sim** (quando flag real ativa) | — | Usuário-parceiro para login |
| `SOPHIA_API_PASSWORD` | **Sim** (quando flag real ativa) | — | Senha do parceiro |
| `SOPHIA_TENANT_ID` | **Sim** | `9827` (fallback) | Número de série da escola — mas NÃO confiar no default em produção |
| `SOPHIA_DEFAULT_TENANT` | Não | `9827` | Fallback secundário quando query param `tenantId` ausente |
| `SOPHIA_USE_MOCK` | Não | `"true"` | `"false"` → usa API real. Qualquer outro valor → retorna `[]` (modo mock sem seed) |
| `SOPHIA_WRITE_ENABLED` | Não | `"false"` | `"true"` habilita PUT/POST nos providers que suportam escrita |
| `SOPHIA_ANO_LETIVO` | Não | ano corrente | Usado no provider de contratos para filtrar lançamentos |

### Exemplo mínimo (`.env.local`)

```bash
SOPHIA_USE_MOCK=false
SOPHIA_API_HOST=https://portal.sophia.com.br
SOPHIA_TENANT_ID=9827
SOPHIA_API_USER=seu_parceiro
SOPHIA_API_PASSWORD=sua_senha
SOPHIA_WRITE_ENABLED=false
```

### Exemplo produção (Vercel)

Todas as vars acima devem ser setadas no project do Vercel. **Nunca** commitar `.env.local`. Usar `vercel env add` ou o dashboard.

⚠️ **IP binding na Vercel**: cada função serverless pode rodar em IP diferente do Vercel Edge Network. Consequências práticas:
- O cache de token por-função funciona dentro de uma mesma instance warm.
- Entre instances diferentes, cada uma fará seu próprio login — aumenta latência da primeira request.
- Se a Sophia impuser algum rate limit ou IP allowlisting, vai quebrar em escala.
- **Solução futura**: mover o token para Upstash Redis (cache distribuído) ou rodar um worker único com IP fixo atrás de uma API interna.

---

## 6. Catálogo de endpoints por domínio

### 6.1 Acadêmico (114 endpoints — 17 tags)

**Tags**: `AlunoDigital`, `Alunos`, `AtaNota`, `AvaliacaoInstitucional`, `Avaliacoes`, `Boletins`, `Cursos`, `Disciplinas`, `Escolaridades`, `ListaChamada`, `MateriaLecionada`, `Matriculas`, `Ocorrencias`, `Periodos`, `QuadrosHorarios`, `RematriculaCurricular`, `Turmas`

**Endpoints principais** (o que vai servir para 80% das integrações):

| Método | Path | Query params | Notas |
|---|---|---|---|
| GET | `/Alunos` | `Nome`, `TamanhoPagina`, `Pagina`, `Unidades`, `Periodos`, `Cursos`, `Inativos`, `ConsiderarTurmaFinalizada` | Lista de alunos. **Não retorna codFilial diretamente** — precisa enriquecer via `/Turmas`. |
| GET | `/Alunos/{id}` | `origemAppMatricula` | Detalhe do aluno (shape `AlunoDetalheApiModel` — 33 campos) |
| PUT | `/Alunos/{id}` | `origemAppMatricula` | Atualiza aluno. Exige `SOPHIA_WRITE_ENABLED=true` na camada do frontend. |
| POST | `/Alunos/ValidarLogin` | — | Autentica aluno/responsável por e-mail ou código externo |
| GET | `/Turmas` | `Situacoes`, `Nome`, `Codigos`, `Cursos`, `Unidades`, `Periodos`, `NomeResumido`, `Turnos`, `Series`, `TamanhoPagina`, `Pagina` | Lista de turmas. **Contém `unidade.codigo` — única fonte confiável de codFilial para alunos**. |
| GET | `/Turmas/detalhada/{codigoTurma}` | — | Turma com `professoresDisciplinas[]` — cada item tem `disciplina` + `colaboradores[]`. Fonte para atribuição (disciplina, turma, professor). |
| GET | `/Disciplinas` | `Nome`, `Codigos`, `Setores`, `TamanhoPagina`, `Pagina` | Lista global. **Não filtra por ano letivo nem turma.** |
| GET | `/Disciplinas/{idMatricula}` | `Nome`, `Codigos`, `Setores` | Disciplinas da matrícula específica (scopeada) |
| GET | `/Cursos` | `Nome`, `Codigos`, `TamanhoPagina`, `Pagina` | Lista de cursos (Fund. I, II, Médio, etc.) |
| GET | `/Periodos` | `Nome`, `Codigos` | Períodos letivos (anos) |
| GET | `/AtaNota` | `Turma`, `Disciplina`, `Etapa`, `Numero`, `Codigo` | Lista de atas de nota (definição) |
| GET | `/AtaNota/{id}/NotaAlunos` | — | Notas dos alunos em uma ata |
| PUT | `/AtaNota/{id}/NotaAlunos` | — | Atualiza notas (write) |
| GET | `/alunos/{idAluno}/Matriculas` | `Periodos`, `Cursos`, `Turmas`, `Unidades`, `Situacao` | Matrículas do aluno. ⚠️ **Filtro implícito: retorna apenas situações `ativa` e `concluída`**. Matrículas `transferida`, `cancelada`, `trancada` NÃO aparecem (confirmado suporte 2026-04). Para ver matrícula cancelada, precisa passar `Situacao` explicitamente — e mesmo assim pode não retornar. |
| GET | `/alunos/Matriculas/{idMatricula}/Boletim` | `Disciplinas` | Boletim completo da matrícula |
| GET | `/alunos/Matriculas/{idMatricula}/BoletimImpresso` | — | Boletim pronto para impressão |
| GET | `/alunos/Matriculas/{idMatricula}/FrequenciaCompleto` | `Matricula`, `Disciplina`, `Etapa` | Frequência detalhada |
| GET | `/alunos/Matriculas/{idMatricula}/NotasAvaliacoes` | `Disciplinas`, `NumeroEtapa`, `FiltrarEtapa` | Notas por avaliação |
| GET | `/alunos/{idAluno}/Ocorrencias` | `DataInicial`, `DataFinal`, `Interna` | Ocorrências disciplinares do aluno |
| GET | `/alunos/{idAluno}/QuadrosHorarios` | — | Quadro de horários do aluno |
| GET | `/ListaChamada/{idListaChamada}` | — | Lista de chamada específica |
| GET | `/ListaChamada/Professor/{idProfessor}` | `DataInicial`, `DataFinal`, `Status` | Listas do professor |
| PUT | `/ListaChamada/Alunos` | — | Lançamento de frequência (write) |
| GET | `/MateriaLecionada/{idMatricula}` | `CodigoPlanejamentoAulaSet`, `CodigoTurma`, `CodigoProfessor`, `DataInicial`, `DataFinal`, `MateriaPendente`, `TarefaPendente`, `Disciplina`, `Setor` | Conteúdo lecionado |
| PUT | `/MateriaLecionada` | — | Lança conteúdo (write) |
| GET | `/RematriculaCurricular/Campanha` | `codFisicas` | Campanhas de rematrícula |
| GET | `/RematriculaCurricular/Matriculas` | `codigoFisica` | Matrículas disponíveis para rematrícula |
| GET | `/RematriculaCurricular/Disciplinas` | vários | Disciplinas disponíveis |
| GET | `/RematriculaCurricular/Documentos` | vários | Documentos necessários |
| GET | `/RematriculaCurricular/PlanosPagamentos` | `codigoFisica`, `codigoMatricula`, `codigoOpcao` | Planos de pagamento |
| POST | `/RematriculaCurricular/AceitarContrato` | — | Aceite de contrato (write) |
| POST | `/RematriculaCurricular/ConfirmarPreMatricula` | — | Confirma pré-matrícula (write) |

### 6.2 Pessoas e Cadastro (68 endpoints — 16 tags)

**Tags**: `AutorizacaoRetirada`, `Clientes`, `Colaboradores`, `DadosCadastrais`, `EstadosCivis`, `FichaSaude`, `Fotos`, `FotosResponsaveis`, `Nacionalidades`, `Ocupacoes`, `Paises`, `Parentescos`, `Racas`, `Religioes`, `Responsaveis`, `ResponsaveisAluno`

**Endpoints principais**:

| Método | Path | Notas |
|---|---|---|
| GET | `/Colaboradores` | Professores e funcionários. Query: `Nome`, `Email`, `Apelido`, `Codigos`, `Unidades`. **Não retorna disciplinas/turmas** — enrichment via `/Turmas.professoresDisciplinas[]`. |
| GET | `/DadosCadastrais/{idAluno}` | Dados completos do aluno (33 campos no shape `AlunoDetalheApiModel`) |
| GET | `/Responsaveis/{id}` | Detalhe do responsável |
| GET | `/alunos/{idAluno}/responsaveis` | Lista de responsáveis do aluno |
| POST | `/alunos/{idAluno}/responsaveis` | Adiciona responsável (write) |
| PUT | `/alunos/{idAluno}/responsaveis/{idResponsavel}` | Atualiza responsável (write) |
| PUT | `/alunos/{idAluno}/responsavelFinanceiro` | Marca/desmarca como financeiro (write) |
| PUT | `/alunos/{idAluno}/responsavelPedagogico` | Marca/desmarca como pedagógico (write) |
| GET | `/alunos/{idAluno}/FichaSaude` | Alergias, medicamentos, tipo sanguíneo |
| PUT | `/alunos/{idAluno}/FichaSaude` | Atualiza ficha (write) |
| GET | `/alunos/{idAluno}/AutorizacaoRetirada` | Quem pode buscar o aluno (Ed. Infantil) |
| PUT | `/alunos/{idAluno}/AutorizacaoRetirada` | Atualiza (write) |
| GET/PUT/DELETE | `/alunos/{idAluno}/Fotos` | Gestão de foto do aluno (inclusive `FotosReduzida`) |
| GET/PUT/DELETE | `/responsaveis/{id}/fotos` | Idem para responsáveis |
| GET | `/Nacionalidades`, `/Paises`, `/Racas`, `/Religioes`, `/EstadosCivis`, `/Parentescos`, `/Ocupacoes`, `/Escolaridades` | Tabelas de domínio (lookups) |

### 6.3 Financeiro (32 endpoints — 8 tags)

**Tags**: `BancoBrasil`, `Boletos`, `Contratos`, `EfiPay`, `Gerencianet`, `Itau`, `Lancamentos`, `Santander`

**Endpoints principais**:

| Método | Path | Notas |
|---|---|---|
| GET | `/alunos/{idAluno}/Lancamentos` | `VisualizarDetalhes` — **fonte real de valores financeiros por aluno** (mensalidades, bolsas, renegociações, serviços). |
| GET | `/alunos/{idAluno}/Boletos/{codigoBoleto}` | Dados do boleto |
| GET | `/prematricula/{idPreMatricula}/Contratos` | Documentos contratuais (assinatura/aceite) — **NÃO tem valores financeiros** |
| PUT | `/prematricula/{idPreMatricula}/Contratos/{idAluno}` | Atualiza contrato (write) |
| GET | `/prematricula/Contratos/impressao` | Contrato para impressão |
| POST (webhook) | `/BancoBrasil/ProcessarWebhook` | Callback BB |
| POST (webhook) | `/Itau/ProcessarWebhook/boleto` | Callback Itaú boleto |
| POST (webhook) | `/Itau/ProcessarWebhook/pix` | Callback Itaú PIX |
| POST | `/Itau/oauth/token` | OAuth do Itaú para integração |
| POST (webhook) | `/Santander/ProcessarWebhook` | Callback Santander |
| POST (webhook) | `/EfiPay/ProcessarWebhook` | Callback EfiPay |
| POST (webhook) | `/Gerencianet/ProcessarWebhook` | Callback Gerencianet |

### ⚠️ Nota crítica: `/Contratos` NÃO é o que parece

O endpoint `/api/v1/prematricula/{idPreMatricula}/Contratos` retorna **documentos de assinatura/aceite** (`SophiaContrato`: `codigo`, `descricao`, `urlContrato`, `possuiAceite`, `aceite`, `codigoPreMatricula`). Não tem `valorAnual`, `parcelas`, `valorParcela`.

**Confirmação oficial do suporte Sophia (transcrição 2026-04)**:
> *"A API de Sofia não disponibiliza o endpoint de contratos financeiros. Os dados financeiros estão disponíveis em faturamento e lançamentos."*
>
> *"Essa informação que você quer, querendo ou não, ela é um cálculo. É um resultado de um cálculo. Dentro da API, ele não vai fazer o cálculo. Quem tem que pegar essas informações e programar um cálculo e jogar na tela é a plataforma."*

**Para ter valores financeiros reais, precisa agregar `/Lancamentos` por aluno.** O bug #33 corrigido recentemente justamente tratava disso. Ver `sophia-educacional-frontend/src/lib/sophia/providers/contrato.provider.ts` — o padrão correto é:

```ts
// Derivar contratos de alunos + lancamentos:
const [alunos, lancamentos] = await Promise.all([getAlunos(), getLancamentos()])
// Agrupar lancamentos por alunoRa, filtrar pelo ano letivo, excluir bolsas/renegociados
// valorAnual = sum(valorOriginal), parcelas = count, valorParcela = valorAnual / parcelas
```

### 6.4 Captação / Processo Seletivo (14 endpoints — 6 tags)

**Tags**: `Campanha`, `Contratacao`, `Finalizacao`, `Processo`, `ProcessoSeletivo`, `ResumoContratacao`

| Método | Path | Notas |
|---|---|---|
| POST | `/ProcessoSeletivo/inscricao` | Nova inscrição de candidato (write) |
| GET | `/rematricula/Campanha` | Campanhas ativas |
| GET | `/rematricula/{idOferta}/Processo` | Status do processo |
| GET | `/rematricula/{idOferta}/Contratacao/{idMatricula}` | Dados da contratação |
| POST | `/rematricula/{idOferta}/Contratacao/{idMatricula}` | Formaliza contratação (write) |
| GET | `/rematricula/{idOferta}/Finalizacao` | Tela final do funil |
| POST | `/rematricula/{idOferta}/ResumoContratacao/{idMatricula}` | Resumo final (write) |

**Particularidade**: este domínio é exclusivo Sophia — o TOTVS RM não tem CRM de captação nativo.

### 6.5 Administração (30 endpoints — 9 tags)

**Tags**: `Arquivos`, `Autenticacao`, `Catraca`, `Configuracoes`, `Empresas`, `Health`, `Introducao`, `Marketplace`, `Unidades`

| Método | Path | Notas |
|---|---|---|
| POST | `/Autenticacao` | Login (ver seção 3) |
| GET | `/Health/VersaoAPI` | Health check |
| GET | `/Empresas` | Lista de empresas/escolas vinculadas (Descricao, TamanhoPagina, Pagina) |
| GET | `/Unidades` | Unidades/campi ativos. **Fonte para codFilial/filialNome**. |
| GET | `/Unidades/{idUnidade}/logotipo` | Logotipo da unidade |
| GET | `/Configuracoes` | Configurações gerais |
| GET | `/Configuracoes/MatriculaOnline` | Parâmetros de matrícula online |
| GET | `/Configuracoes/MatriculaOnline/{idUnidade}` | Por unidade |
| POST | `/Catraca` | Registra movimento de aluno (entrada/saída) (write) |
| GET | `/alunos/{idAluno}/Catraca` | Histórico de movimentos. Query: `dataMovimentacaoInicio`, `dataMovimentacaoFim` |
| GET | `/alunos/{idAluno}/Arquivos` | Arquivos disponibilizados. Query: `DataInicial`, `DataFinal`, `CodigoTurma`, `CodigoDisciplina` |
| POST | `/Marketplace/ProcessarVendaMarketplace` | Extensões de terceiros |

### 6.6 Lista completa

A listagem exaustiva está em:
- `unified/apis.json` (JSON estruturado)
- `unified/domains/01-academico.md` (Acadêmico)
- `unified/domains/02-pessoas.md` (Pessoas)
- `unified/domains/03-financeiro.md` (Financeiro)
- `unified/domains/04-captacao.md` (Captação)
- `unified/domains/05-admin.md` (Admin)
- `raw/swagger-sophia-v1.json` (spec completa — 304 KB)
- `raw/DOC-3-sophia-api-real-swagger.md` (dump textual do Swagger, 1721 linhas)

---

## 7. Modelos principais (datashapes)

Extraídos do Swagger (`raw/swagger-sophia-v1.json`). Campos com `*` são obrigatórios.

### 7.1 `AlunoApiModelRetorno` (13 campos) — lista de alunos

```
codigo: int64 *                    Código INTERNO (banco Sophia). ÚNICO. Use para buscas entre métodos.
codigoExterno: string *            Código EXTERNO (o que aparece no cadastro). PODE ter duplicatas.
codigoParceiro: string             Código do parceiro de integração
contaOffice365: string             Conta Office 365
dataNascimento: date-time
email: string
nome: string *
responsaveis: array                Array de ResponsavelAlunoApiModel
rgEscolar: string                  RG escolar
sexo: string *                     "M" ou "F"
telefone: string
turmas: array                      Array de TurmaDescricaoApiModelRetorno (codigo, descricao)
turmasMono: array                  Turmas monodisciplinares
```

⚠️ **Não contém `codFilial`/`codColigada` nem nenhum campo de unidade.** O binding aluno↔filial precisa ser feito cruzando o `turmas[0].codigo` com o `/Turmas.unidade.codigo`. Foi a causa raiz do bug #30.

⚠️ **`codigo` vs `codigoExterno` (confirmado pelo suporte Sophia, 2026-04)**:
- `codigo` é **único** no banco. É o que os outros endpoints aceitam como `{idAluno}` ou filtro.
- `codigoExterno` "é como se fosse o nome do aluno" — pode colidir (mesmo código em dois alunos diferentes). **Não use como chave de lookup interno.**
- Para chave cross-system (mapear aluno Sophia ↔ TOTVS RM), `codigoExterno` pode servir, mas sempre validar duplicidade.

⚠️ **Status de aluno limitado a A/P na API (confirmado pelo suporte, 2026-04)**:
- O Swagger só expõe dois status efetivamente: `"A"` (ativo/matriculado) e `"P"` (sem turma/pendente).
- Status de negócio como `Transferido`, `Cancelado`, `Evadido`, `Trancado` **NÃO são expostos** pela API.
- Para ter esses status: adequação paga sob demanda OU aguardar evolução.
- Consequência prática: qualquer filtro no frontend por "Cancelado", "Transferido" etc. será sempre vazio com dados reais.

### 7.2 `AlunoDetalheApiModel` (33 campos) — detalhe do aluno

Inclui tudo do model retorno mais endereço completo, documentos (RG, CIN, passaporte, CPF), dados pessoais (nome social, estado civil, religião, raça, nacionalidade), local de nascimento, certidão de nascimento, contatos (array).

### 7.3 `ResponsavelAlunoApiModel` (15 campos)

```
codigo: string *
codigoAgendaEdu: string *
codigoAntigo: int64 *
codigoFamilia: string *
codigoFamiliaObsoleto: string
codigoParceiro: string
cpf: string
dataEmissaoCin: date-time
email: string
nome: string *
responsavelFinanceiro: boolean *   Flag independente
responsavelPedagogico: boolean *   Flag independente
retiradaAutorizada: boolean
telefone: string
tipoVinculo: ParentescoApiModel *  Pai, Mae, Avo, etc.
```

⚠️ **Um responsável pode ser financeiro, pedagógico, ambos ou nenhum** — flags independentes. Nunca assumir que um dos dois é default.

### 7.4 `TurmaApiModelRetorno` (shape informal, extraído do frontend)

```
codigo: int64
nome: string                        Ex: "1° Ano A"
nomeResumido: string                Ex: "1A"
situacao: int                       1 = ativa
sala: string
curso: { codigo, descricao }
turnos: array<{ codigo, descricao }> Ex: "Manhã"
periodoLetivo: { codigo, descricao } Ex: "2026"
unidade: { codigo, descricao } *    FONTE DO codFilial
colaborador: { codigo, nome }       Professor titular (pode estar vazio)
professoresDisciplinas: array      Array de objetos com:
  - disciplina: { codigo, nome }
  - colaboradores: array<{ codigo, nome }>
```

⚠️ **`professoresDisciplinas` é a ÚNICA fonte para mapear (disciplina × turma × professor)**. Não há um endpoint dedicado para essa relação. Foi a causa raiz do bug #31.

### 7.5 `SophiaContrato` (contratos de aceite/assinatura)

```
codigo: int32 *
descricao: string
urlContrato: string
possuiAceite: boolean
possuiAssinaturaDigital: boolean
mensagemAssinaturaDigital: string
aceite: boolean
codigoProduto: int32
codigoPreMatricula: int32
```

⚠️ **Nenhum campo financeiro.** Ver nota crítica em §6.3.

### 7.6 `ListaChamadaAulaAlunoApi` (4 campos)

```
codigoListaChamadaAula: int64 *
codigoMatricula: int64 *
falta: int32 *                     0 = presente, 1 = falta, 2 = FJ (falta justificada)?
ocorrencias: array
```

### 7.7 `OcorrenciaAlunoInputApi` (9 campos)

```
aula: int32
codigoAluno: int32 *
codigoDisciplina: int32
codigoOcorrencia: int32 *
dataOcorrencia: date-time *
idOcorrencia: int32 *
numeroAula: int32 *
observacao: string
status: int32 *
```

### 7.8 `CatracaDetalhesApi` (5 campos)

```
coletor: string
identificacao: string               CPF ou código do aluno
momento: date-time
movimento: string                   Entrada/saída
observacao: string
```

### 7.9 Shapes completos

Todos os 153 modelos estão em:
- `raw/swagger-sophia-v1.json` → `components.schemas.*`
- `raw/DOC-3-sophia-api-real-swagger.md` (seção "Models Principais", linhas 321+)

---

## 8. Camada de integração no frontend

Local: `~/Claude/projetos/sophia-educacional-frontend/src/lib/sophia/`

### 8.1 Estrutura

```
src/lib/sophia/
├── clients/
│   └── rest.client.ts          ← authenticate(), restGet/restPost/restPut
├── providers/                  ← 29 providers (1 por domínio lógico)
│   ├── aluno.provider.ts
│   ├── aluno-detalhe.provider.ts
│   ├── turma.provider.ts
│   ├── nota.provider.ts
│   ├── frequencia.provider.ts
│   ├── lancamento.provider.ts
│   ├── contrato.provider.ts
│   ├── parcela.provider.ts
│   ├── boleto.provider.ts
│   ├── bolsa.provider.ts       ← derivado de lancamentos
│   ├── financeiro-extras.provider.ts  ← bolsas/renegociações/serviços derivadas
│   ├── boletim.provider.ts
│   ├── ocorrencia.provider.ts
│   ├── conteudo.provider.ts
│   ├── chamada.provider.ts
│   ├── horario.provider.ts
│   ├── calendario.provider.ts
│   ├── rematricula.provider.ts
│   ├── responsavel.provider.ts
│   ├── saude.provider.ts
│   ├── foto.provider.ts
│   ├── arquivo.provider.ts
│   ├── catraca.provider.ts
│   ├── avaliacao.provider.ts
│   ├── configuracoes.provider.ts
│   ├── lookups.provider.ts     ← tabelas de domínio
│   └── *.test.ts               ← 5 test files com vi.mock
├── adapters/                   ← Sophia shape → App shape
│   ├── aluno.adapter.ts
│   ├── turma.adapter.ts
│   ├── nota.adapter.ts
│   ├── frequencia.adapter.ts
│   ├── ocorrencia.adapter.ts
│   ├── contrato.adapter.ts
│   ├── parcela.adapter.ts
│   ├── bolsa.adapter.ts
│   ├── calendario.adapter.ts
│   ├── turma-helpers.ts        ← buildSerie, extractSegmento
│   └── *.test.ts
├── validators/                 ← Zod schemas
├── api-contracts.ts            ← TypeScript interfaces (SophiaAluno, SophiaTurma, etc.)
├── api-schemas.ts              ← Zod schemas para runtime validation
├── auth.ts                     ← (não usado diretamente; lógica está em rest.client.ts)
├── cache.ts                    ← in-memory TTL cache com presets por recurso
├── feature-flags.ts            ← toggle mock vs real API
├── retry.ts                    ← (utilitário para retry)
├── safe-parse.ts               ← safeParseArray com Zod + logging de falhas
└── sanitize.ts                 ← sanitização de inputs
```

### 8.2 Camadas (fluxo de uma request)

```
UI Page
   │  (useData hook)
   ▼
DataContext (src/lib/data-context.tsx)
   │  fetch("/api/<resource>")
   ▼
API Route (src/app/api/<resource>/route.ts)
   │  calls provider
   ▼
Provider (src/lib/sophia/providers/<x>.provider.ts)
   │  1. check cache
   │  2. check feature flag
   │  3. call restGet()
   │  4. safeParseArray (Zod validation)
   │  5. adapter (Sophia shape → App shape)
   │  6. cache.set
   │  7. return
   ▼
REST Client (src/lib/sophia/clients/rest.client.ts)
   │  1. authenticate() → token em cache 18min
   │  2. fetch URL com header token
   │  3. retry 1x em 401 (refresh token)
   ▼
Sophia API
```

### 8.3 Cache TTL presets

De `cache.ts`:

```ts
ALUNOS: 30min        TURMAS: 1h          NOTAS: 5min
LANCAMENTOS: 15min   COLABORADORES: 1h   UNIDADES: 24h
CURSOS: 24h          DISCIPLINAS: 1h     DEFAULT: 10min
```

**Nota importante sobre serverless**: em Vercel, cada invocation de função tem seu próprio process → cada função tem seu próprio cache. O cache só ajuda em warm containers reutilizando a mesma instance. Para cache distribuído real, mover para Upstash Redis no futuro.

### 8.4 Feature flags

De `feature-flags.ts` — toggle por módulo lê `SOPHIA_USE_MOCK` (default `"true"`) e `SOPHIA_WRITE_ENABLED` (default `"false"`). Quando `SOPHIA_USE_MOCK=false`, todos os `read` retornam `true` (usa API real). Writes só ativam com `SOPHIA_WRITE_ENABLED=true`.

Estrutura do objeto `flags`:

```ts
flags.secretaria.{alunos|turmas|matriculas|rematricula|catraca}
flags.pedagogico.{frequencia|notas|ocorrencias|conteudo}
flags.financeiro.{parcelas|bolsas|contratos|renegociacao|lancamentos|boletos|servicos}
flags.academico.{calendario|grade|horarios}
flags.dados.{saude|responsaveis}
flags.captacao.prospects
flags.explorar.filiais
flags.relatorios.leitura
```

Cada nó tem `read` (getter) e às vezes `write` (getter ou boolean fixo).

---

## 9. Estado atual de consumo

O que o frontend **realmente chama** na API hoje (endpoints executados via `restGet<T>(...)`):

```
/Alunos
/Turmas
/Calendario
/Configuracoes
/Configuracoes/MatriculaOnline
/Lancamentos                                ← (via parcela.provider)
/alunos/{idAluno}/Lancamentos               ← (via lancamento.provider, loop por aluno)
/MatriculasFrequencias                      ← (via frequencia.provider)
/Ocorrencias
/AvaliacaoInstitucional
/RematriculaCurricular/DadosIniciais
/RematriculaCurricular/Documentos
/RematriculaCurricular/DocumentosPendentes
/RematriculaCurricular/Matriculas
/RematriculaCurricular/Responsaveis
/Colaboradores                              ← (via colaboradores API route)
/Disciplinas
```

Total: **~18 endpoints** dos 258 disponíveis. O resto está disponível mas não é consumido pelo frontend atual.

### API routes no Next.js (37 rotas)

```
alunos, autorizacao-retirada, avaliacoes, boletins, boletos, bolsas,
catraca, chamada, colaboradores, configuracoes, contratos, cursos,
disciplinas, faturamento, fotos, frequencia, health, health-versao,
kpis, lancamentos, lookups, matriculas, notas, ocorrencias, periodos,
prospectivos, relatorios, rematricula, rematricula-curricular,
renegociacoes, responsaveis, saude, servicos, tipos-avaliacao,
tipos-ocorrencia, turmas, unidades
```

---

## 10. Patterns obrigatórios para novos providers

Ao criar uma nova integração com qualquer endpoint Sophia:

### 10.1 Estrutura padrão de um provider

```ts
// src/lib/sophia/providers/xxx.provider.ts
import { flags } from "../feature-flags"
import { restGet } from "../clients/rest.client"
import { cacheGet, cacheSet, CACHE_TTL } from "../cache"
import { safeParseArray } from "../safe-parse"
import { XxxSchema } from "../api-schemas"
import { adaptXxx } from "../adapters/xxx.adapter"
import type { AppXxx } from "../adapters/xxx.adapter"
import { logger } from "@/lib/observability/logger"

export async function getXxx(): Promise<AppXxx[]> {
  if (!flags.<modulo>.xxx.read) return []

  const cached = cacheGet<AppXxx[]>("provider:xxx")
  if (cached) return cached

  try {
    const raw = await restGet<unknown[]>("/Xxx", {
      tenantId: process.env.SOPHIA_TENANT_ID?.trim() ?? "9827",
    })

    const validated = safeParseArray(XxxSchema, raw, "provider:xxx")
    const adapted = adaptXxx(validated)

    logger.info("[provider/xxx] Fetched from API", {
      module: "provider/xxx",
      count: adapted.length,
      rawCount: Array.isArray(raw) ? raw.length : 0,
      validCount: validated.length,
    })

    cacheSet("provider:xxx", adapted, CACHE_TTL.DEFAULT)
    return adapted
  } catch (err) {
    logger.error("[provider/xxx] API error", {
      module: "provider/xxx",
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}
```

### 10.2 Checklist para novos endpoints

- [ ] Criar tipo `Sophia<Xxx>` em `api-contracts.ts` baseado no Swagger
- [ ] Criar schema Zod `Sophia<Xxx>Schema` em `api-schemas.ts`
- [ ] Criar adapter em `adapters/xxx.adapter.ts` (Sophia shape → App shape)
- [ ] Criar provider em `providers/xxx.provider.ts` seguindo o pattern acima
- [ ] Adicionar flag em `feature-flags.ts` no módulo certo
- [ ] Adicionar TTL preset em `cache.ts` se o recurso for comum
- [ ] Criar Next.js route handler em `src/app/api/xxx/route.ts`
- [ ] Escrever teste do provider usando `vi.mock` (pattern de `contrato.provider.test.ts`)
- [ ] Escrever teste do adapter com valores hard-coded (não circular)
- [ ] **NUNCA** hardcodar `codColigada` ou `codFilial` — derivar do Turma

### 10.3 Handling de erros

- Providers **devem retornar `[]` em caso de erro** (graceful degradation), logando no logger. NÃO propagar exceções para a UI.
- 404 em endpoints opcionais (ex: `/Atas` para tenant sem módulo de notas) é tratado como "sem dados" com log `info`, não como erro.
- 401 é tratado automaticamente pelo `rest.client.ts` (refresh do token).

### 10.4 Paginação

Quando o endpoint retorna mais de `TamanhoPagina` (default 50, max ~500), fazer loop de paginação:

```ts
let pagina = 1
const results: T[] = []
while (true) {
  const batch = await restGet<T[]>("/Xxx", {
    tenantId,
    // passar Pagina e TamanhoPagina na query via URL ou config
  })
  if (!Array.isArray(batch) || batch.length === 0) break
  results.push(...batch)
  if (batch.length < tamanhoPagina) break
  pagina++
}
```

⚠️ O `rest.client.ts` atual não suporta query params nativamente — precisa ser adicionado ao path. Ver `providers/lancamento.provider.ts` para exemplo de paginação por-aluno.

---

## 11. Gotchas — lições aprendidas

### Autenticação (1-4)

1. **Token expira em 20min** — refresh automático obrigatório. O `rest.client.ts` faz isso com cache de 18min de margem.
2. **Token vinculado ao IP** — mudança de IP (VPN, deploy Vercel, NAT) invalida o token. Cada função serverless pode acabar fazendo seu próprio login.
3. **API é recurso PAGO** — ativação por escola tem custo adicional.
4. **Credenciais são de parceiro** — não de usuário final. Config em *Configurações > Parâmetros > Gerenciar > aba Web API > Parceiros autenticados*.

### API (5-9)

5. **Cada escola tem instância separada** — URL base sempre inclui `{tenantId}` (número de série).
6. **Swagger no portal é REFERÊNCIA** — a API real roda na instância da escola com o mesmo shape, mas pode ter diferenças (módulos ativados, endpoints custom).
7. **JSON e XML** — usar JSON. Negociado via header `Accept`.
8. **Paginação offset-based** — `?Pagina=1&TamanhoPagina=50`. Max prático ~500.
9. **111 paths × ~2.3 métodos = 258 endpoints** — o Swagger expõe alguns paths com e sem prefixo de tenant.

### Dados (10-13)

10. **`codigoExterno` = RA do TOTVS, `codigo` = código interno** — identificadores diferentes. Sempre usar `codigoExterno` como chave cross-system.
11. **Responsável tem flags independentes** — `responsavelFinanceiro` e `responsavelPedagogico` podem ser ambos `true`, ambos `false`, ou qualquer combinação.
12. **Processo seletivo é CRM de captação** — módulo exclusivo Sophia, não existe no TOTVS.
13. **Catraca é hardware físico** — integração com controle de acesso.

### Cross-Reference TOTVS RM (14-16)

14. **Alunos → SALUNO**, Matrículas → SMATRICULA, Turmas → STURMA
15. **Notas → SNOTAETAPA**, Frequência → SFREQUENCIA, Contratos → SCONTRATO
16. **Captação não tem equivalente TOTVS**

### Frontend (17-19)

17. **Mock-first** — foi desenvolvido primeiro com mocks, depois migrou para API real. O toggle `SOPHIA_USE_MOCK` controla, mas **o fallback mock foi removido** nos providers — hoje, `SOPHIA_USE_MOCK=true` faz as funções retornarem `[]`.
18. **208 files, 70 pages** — 5 módulos (Secretaria, Pedagógico, Financeiro, Captação, Régua Cobrança).
19. **Porta 3004** — fixa no workspace.

### Descobertas recentes (2026-04)

20. **`/Alunos` não retorna codFilial** — precisa enriquecer via `/Turmas.unidade.codigo`. Causa do bug #30.
21. **`/Contratos` retorna documentos de aceite, não valores** — valores financeiros vêm de `/Lancamentos` agregado por aluno/ano. Causa do bug #33.
22. **`professoresDisciplinas[]` é a única fonte do par (disciplina, turma, professor)** — não há endpoint dedicado para atribuição. Tratar como pares explícitos, nunca fazer Cartesian product de `disciplinas[] × turmas[]`. Causa do bug #31.
23. **`/Disciplinas` é global, sem filtro por ano letivo** — para o boletim, usar `/Disciplinas/{idMatricula}` ou derivar da turma do aluno via `turma.professoresDisciplinas[].disciplina`. Causa do bug #32.
24. **O header de auth é `token` (minúsculo), não `Authorization: Bearer`** — não-padrão, fácil errar.
25. **O token vem como string JSON cruda** — precisa strip de aspas antes de usar.
26. **Body do POST `/Autenticacao` é PascalCase** (`Usuario`, `Senha`) — não minúsculo como o DOC-3 sugere.

### Confirmadas pelo suporte Sophia em ligação oficial (transcrição 2026-04)

27. **Status de aluno limitado a A/P** — A API só devolve `"A"` (ativo) e `"P"` (pendente). Transferido, cancelado, evadido, trancado NÃO existem na API. Adequação para expor esses status = **custo pago** ou sugestão de melhoria.
28. **`codigo` interno ≠ `codigoExterno`** — `codigo` é único, `codigoExterno` pode ter duplicatas ("é como se fosse o nome do aluno"). **Sempre usar `codigo` para buscas entre métodos da API**.
29. **`/alunos/{id}/Matriculas` filtra implicitamente** — só retorna matrículas com situação `ativa` ou `concluída`. Alunos transferidos/cancelados em anos anteriores simplesmente não aparecem. Não está documentado no Swagger.
30. **A API nunca faz agregações/cálculos** — endpoints retornam dados crus. Total a receber, inadimplência, ticket médio, percentuais — tudo é responsabilidade do cliente. *"Dentro da API, ele não vai fazer o cálculo."*
31. **Boletim customizado vem em raw (letras+números)** — cada turma tem configuração acadêmica que aponta para um template de boletim. A API entrega o conteúdo, mas **sem renderização visual**. Template Word/PDF é do lado do cliente.
32. **Cadeia oficial para Professor → Atribuição** — `/Colaboradores` (pegar `codigo`) → `/ListaChamada/Professor/{idProfessor}` (pegar listas) → `/ListaChamada/Alunos/{idListaChamada}` (alunos). OU usar `/MateriaLecionada` com filtros compostos (`CodigoTurma`, `CodigoProfessor`, `Disciplina`, `DataInicial/Final`). Filtros agem como AND e encurtam o resultado.
33. **Layers não tem endpoints dedicados** — toda a integração Sophia+ consome os mesmos endpoints do Swagger público. Não existe atalho de "pegar comandos da Layers". Cada parceiro implementa sua própria cadeia.
34. **Agenda Edu tem shapes prefixados** — modelos como `AlunoAgendaEduApiModelRetorno` existem no Swagger com o nome explícito. Layers NÃO tem esse prefixo, usa os endpoints genéricos.
35. **Catraca é recente como API** — antigamente só via FTP (arquivo no servidor da escola). Integrações legadas podem depender de FTP, não de `POST /Catraca`.
36. **Campo não-existente no Swagger = não-existente na API** — o Swagger é a documentação canônica. Se não está lá, as opções são: (a) adequação paga, (b) sugestão de melhoria para futura versão, (c) derivar de outro endpoint.
37. **Parâmetros de `/MateriaLecionada` são filtros AND** — `CodigoPlanejamentoAulaSet`, `CodigoTurma`, `CodigoProfessor`, `DataInicial`, `DataFinal`, `MateriaPendente`, `TarefaPendente`, `Disciplina`, `Setor` — passar vários encurta o resultado (interseção, não união).

---

## 12. Cross-reference com TOTVS RM

Tabela de equivalência (útil ao migrar integrações TOTVS → Sophia ou construir consolidações):

| Domínio | Sophia (endpoint/campo) | TOTVS RM (tabela) |
|---|---|---|
| Alunos | `GET /Alunos`, `AlunoApiModelRetorno` | SALUNO |
| Matrículas | `GET /alunos/{id}/Matriculas` | SMATRICULA / SMATRICPL |
| Turmas | `GET /Turmas`, `TurmaApiModelRetorno` | STURMA / STURMADISC |
| Disciplinas | `GET /Disciplinas` | SDISCIPLINA |
| Notas | `GET /AtaNota`, `GET /alunos/Matriculas/{id}/Boletim` | SNOTAETAPA |
| Frequência | `GET /MatriculasFrequencias`, `ListaChamada` | SFREQUENCIA |
| Contratos (documento) | `GET /prematricula/{id}/Contratos` | SCONTRATO |
| Lançamentos | `GET /alunos/{id}/Lancamentos` | FLAN |
| Responsáveis | `GET /alunos/{id}/responsaveis` | PPESSOA + SRESPONSAVEL |
| Professores | `GET /Colaboradores` + `Turmas.professoresDisciplinas[]` | SPROFESSOR + STURMADISC |
| Calendário | `GET /Calendario` | SCALENDARIO / SPLETIVO |
| Ocorrências | `GET /alunos/{id}/Ocorrencias` | SOCORRENCIA |
| Multi-unidade | `GET /Unidades` + `turma.unidade.codigo` | CODCOLIGADA + CODFILIAL |
| Grade curricular | `GET /alunos/{id}/QuadrosHorarios` | SCURSO → SHABILITACAO → SGRADE |
| Captação (CRM) | `GET /rematricula/Campanha` + `POST /ProcessoSeletivo/inscricao` | **Não existe no TOTVS** |
| Biblioteca | Produto separado (Philos) | Não existe no TOTVS |
| Bolsas | Derivadas de `Lancamentos` (parse `descricao` para "bolsa"/"desconto") | SBOLSAS |

### Identificadores entre sistemas

| Sophia | TOTVS RM | Observação |
|---|---|---|
| `codigo` (int64) | código interno TOTVS | Pode ser diferente mesmo para o mesmo aluno |
| `codigoExterno` (string) | `RA` / `CODALUNO` | **Este é o identificador cross-system** |
| `codigoParceiro` (string) | — | Código do parceiro de integração (Sophia+, Layers, etc.) |
| `rgEscolar` (string) | `RGEscolar` | RG escolar (quando aplicável) |

---

## 13. Integrações conhecidas

### 13.1 Layers Education (parceria oficial desde 2022)

- **App**: Sophia+ by Layers (`education.layers.sophiabylayers`)
- **Arquitetura**: Sophia (ERP) → API Web → Layers Data Sync → App
- **4 caminhos de integração**: Portais, SSO, Sincronização de Dados, API Hub (request/respond + pub/sub)
- **Entidades Layers**: Members ↔ Alunos/Responsáveis/Professores, Groups ↔ Turmas, Enrollments ↔ Enturmação, Components ↔ Disciplinas, Seasons ↔ Períodos Letivos, Tags ↔ Metadados
- **Sincronização**: Total (4 endpoints: Usuários, Alunos, Turmas, Disciplinas) ou Incremental (prepare + 30min window)
- **Ativação**: solicitar à Sophia ativação da API + credenciais → entregar à Layers → gateway em até 48h
- **Alcance inicial**: 500+ escolas, 88 mil alunos

### 13.2 RD Station (CRM/marketing)

- Integração nativa para funil de captação
- Automação de envio de e-mails para prospects
- Configurado no módulo Captação

### 13.3 Bancos (liquidação automática)

- Banco do Brasil (webhooks `/BancoBrasil/ProcessarWebhook`)
- Itaú (boleto + PIX + OAuth)
- Santander
- EfiPay / Gerencianet

Todos webhooks POST para `/api/v1/<Banco>/ProcessarWebhook[...]`.

### 13.4 Outros parceiros confirmados

| Parceiro | Tipo | Detalhe |
|---|---|---|
| Microsoft Word | Documentos | Templates para contratos |
| ClickSign | Assinatura | Assinatura eletrônica |
| WhatsApp Web | Comunicação | Mensagens e cobrança |
| Diário Escola | Acadêmico | Dados + boletos via superApp |
| Agenda Edu | Comunicação | Sync via API (requer ativação) |
| Foreducation / Google for Education | Integração SSO | Sem recadastro |
| Odilo | Conteúdo digital | Biblioteca tipo Netflix educacional |
| Untis | Grade horária | Quadro de Horários |

---

## 14. Glossário

| Termo (técnico) | Negócio | Contexto |
|---|---|---|
| `aluno` | Aluno (matrícula) | Identificado por `codigo` (int) e `codigoExterno` (string = RA) |
| `ata_nota` | Ata de notas | Documento oficial de notas por disciplina/etapa |
| `boleto` | Boleto bancário | Via integração BB/Itaú/Santander/EfiPay |
| `catraca` | Controle de acesso | Hardware físico de entrada/saída |
| `contrato` | Contrato educacional | **Documento de aceite** — não contém valores (ver §6.3) |
| `ficha_saude` | Ficha médica | Alergias, medicamentos, tipo sanguíneo |
| `instancia` | Instância da escola | Cada escola tem URL/tenant próprio. API roda na instância |
| `lancamento` | Lançamento financeiro | Cobrança gerada para responsável — **fonte real de valores** |
| `lista_chamada` | Frequência diária | Presença/ausência por aula |
| `matricula` | Matrícula | Vínculo aluno↔curso↔período. Status: ativa/trancada/cancelada |
| `parceiro` | Parceiro de integração | Conta de API autorizada pela escola |
| `processo_seletivo` | Vestibular/CRM | Funil de captação (campanha→inscrição→contratação) |
| `quadro_horario` | Grade de aulas | Por turma/dia/horário |
| `responsavel` | Responsável | Financeiro e/ou pedagógico (flags independentes) |
| `token` | Token de autenticação | 20min, IP-bound, header `token` (minúsculo) |
| `unidade` | Campus | Multi-unidade suportado. Fonte do `codFilial` |
| `colaborador` | Professor/funcionário | Endpoint `/Colaboradores`. Sem disciplinas — enriquecer via `/Turmas` |

---

## 15. Referências

### 15.1 Arquivos desta KB

```
~/Claude/assets/knowledge-base/sophia/
├── CONTEXT.md                   ← ESTE ARQUIVO (mãe)
├── README.md
├── unified/
│   ├── index.md
│   ├── CHANGELOG.md
│   ├── apis.json                ← 258 endpoints + 153 modelos (JSON)
│   ├── domains.json
│   ├── glossary.json            ← 16 termos
│   ├── rules.json               ← auth + cross-ref TOTVS
│   ├── integration.json         ← frontend path, env vars, Swagger URL
│   ├── domains/
│   │   ├── 01-academico.md      ← 114 endpoints, 17 tags
│   │   ├── 02-pessoas.md        ← 68 endpoints, 16 tags
│   │   ├── 03-financeiro.md     ← 32 endpoints, 8 tags
│   │   ├── 04-captacao.md       ← 14 endpoints, 6 tags
│   │   └── 05-admin.md          ← 30 endpoints, 9 tags
│   └── guides/
│       └── gotchas.md           ← 19 lições originais
└── raw/
    ├── swagger-sophia-v1.json   ← Swagger OpenAPI completo (304 KB)
    ├── DOC-1-sophia-gestao-escolar-completo.md    ← Pesquisa (empresa, produtos, API, cross-ref)
    ├── DOC-2-sophia-integracoes-layers-totvs.md   ← Layers + TOTVS
    ├── DOC-3-sophia-api-real-swagger.md           ← Dump textual do Swagger (1721 linhas)
    ├── DOC-4-sophia-api-integracao-web.md         ← API Web v1
    └── DOC-4-sophia-api-web-integracao.md         ← API Web v1 (duplicado, versão mais longa)
```

### 15.2 Implementação de referência (código real em produção)

```
~/Claude/projetos/sophia-educacional-frontend/
├── src/lib/sophia/
│   ├── clients/rest.client.ts              ← Auth + REST (208 linhas)
│   ├── providers/*.ts                      ← 29 providers
│   ├── adapters/*.ts                       ← 10 adapters
│   ├── api-contracts.ts                    ← TS interfaces (Sophia shapes)
│   ├── api-schemas.ts                      ← Zod schemas (runtime validation)
│   ├── cache.ts                            ← TTL cache em memória
│   └── feature-flags.ts                    ← Mock vs real toggle
└── src/app/api/                            ← 37 Next.js route handlers
```

Deployed: https://sophia-educacional-frontend.vercel.app
Repo: https://github.com/Raiz-Educacao-SA/sophia-raiz

### 15.3 Documentação externa

- Swagger UI (público): https://portal.sophia.com.br/sophiawebapi/swagger/index.html
- Site Sophia: https://sophia.com.br
- API Biblioteca/Philos (PDF IFB): https://ifb.edu.br/attachments/article/39100/API%20Web%20de%20Integra%C3%A7%C3%A3o.pdf
- Portal Layers: https://developers.layers.education/
- Suporte Sophia (base de conhecimento oficial): https://suporte.sophia.com.br/bc/SG/SGE/index.html

### 15.4 Contatos Sophia

- Vendas: vendas@sophia.com.br
- Suporte: suporte@prima.com.br
- Comercial (WhatsApp): (12) 99193-3755
- 0800: 0800 55 7074

---

## Apêndice A — Checklist rápido para nova integração

Para integrar qualquer novo endpoint Sophia em um projeto:

1. [ ] Ler esta seção relevante (auth §3, env vars §5, endpoint específico §6)
2. [ ] Localizar o shape no Swagger: `raw/swagger-sophia-v1.json` ou `raw/DOC-3`
3. [ ] Criar tipo TS em `api-contracts.ts` baseado no shape exato
4. [ ] Criar schema Zod em `api-schemas.ts`
5. [ ] Criar adapter Sophia→App em `adapters/`
6. [ ] Criar provider em `providers/` seguindo pattern §10.1
7. [ ] Adicionar feature flag em `feature-flags.ts`
8. [ ] Adicionar TTL preset em `cache.ts` se necessário
9. [ ] Criar Next.js route handler em `src/app/api/<resource>/route.ts`
10. [ ] Escrever teste do provider com `vi.mock` (ver `contrato.provider.test.ts`)
11. [ ] Escrever teste do adapter com valores hard-coded
12. [ ] Testar com `SOPHIA_USE_MOCK=false` e credenciais reais em `.env.local`
13. [ ] **Nunca** hardcodar `codFilial`/`codColigada` — derivar do Turma
14. [ ] Se o endpoint retornar valores, verificar se não é um "documento de aceite" (ver §6.3)
15. [ ] Verificar paginação se resultado pode passar de 50 itens

---

## Apêndice B — Troubleshooting comum

| Sintoma | Causa provável | Fix |
|---|---|---|
| 401 em qualquer request | Token expirou (20min), IP mudou, credenciais inválidas | Forçar re-login via `clearTokenCache()`. Se persistir, validar credenciais no painel Sophia. |
| 401 após deploy Vercel | IP do edge runtime mudou | Esperado — cada função reloga. Se muito frequente, mover cache para Upstash Redis. |
| 400 "usuario ou senha nao informado" | Body com camelCase em vez de PascalCase | Usar `{ "Usuario": ..., "Senha": ... }` |
| Token inválido sempre | Strip das aspas não feito | Token vem como JSON string: `"abc"`. Precisa `.replace(/^"|"$/g, "")`. |
| Campo `codFilial` vazio em Aluno | `/Alunos` não retorna filial | Enriquecer via `/Turmas.unidade.codigo` |
| Valores zerados em contratos | Usando `/Contratos` em vez de `/Lancamentos` | `/Contratos` = documento de aceite. Valores vêm de `/Lancamentos`. |
| Professor com disciplinas erradas | Cartesian product `disciplinas[] × turmas[]` | Usar `turma.professoresDisciplinas[]` como fonte de pares |
| Boletim com disciplinas de outros anos | `/Disciplinas` global é usado | Scope por turma do aluno via `turma.disciplinas[]` ou `/Disciplinas/{idMatricula}` |
| Request bloqueado sem erro claro | User-Agent ausente | Sempre enviar `User-Agent` (qualquer valor não-vazio) |
| 404 em `/Atas` ou `/AtasAlunos` | Módulo de notas não ativado no tenant | Tratar como "sem dados", log info |
| Cache não bate em serverless | Function cold start | Esperado. Cache é por-instance em Vercel. |
| Aluno transferido/cancelado sumiu da lista | API só devolve status A/P | Não tem fix na API — adequação paga. Tratar status como binário. |
| Matrícula cancelada não aparece em `/alunos/{id}/Matriculas` | Filtro implícito ativa+concluída | Não tem fix documentado — abrir chamado se for crítico. |
| Busca por `codigoExterno` retorna múltiplos resultados | `codigoExterno` não é único | Mudar para `codigo` (int64). |
| "Total a receber" / "Inadimplência" vazio | API não faz cálculos agregados | Agregar no cliente. Chamar `/Lancamentos` e somar. |

---

---

## 16. Limitações (HISTÓRICO — status atual em §16.9)

> **Status 2026-04-08**: A seção 16.1–16.8 abaixo representa o backlog comercial ANTERIOR a 2026-04-08. **Todas as "limitações" listadas foram resolvidas** via uma de 4 vias: fix de provider (path estava errado, não a API), remoção cirúrgica (endpoint confirmadamente inexistente), empty state honesto (tenant sem dado), ou agregação local. Ver `sophia-educacional-frontend/docs/specs/sophia-backlog-comercial-decision-2026-04-08.md`.

### 16.9 Status atual (2026-04-08)

- **Notas / Frequência / Ocorrências**: providers corrigidos com paths reais do Swagger (P1/P2/P3, PRs #44–#46 + #48). Frequência APOGEU retorna 298 registros reais.
- **Histórico acadêmico**: removido do produto — endpoint inexistente (R1, PR #47).
- **Bolsas**: UI/rota/provider removidos (R2, PR #54). Tipo `Bolsa` preservado como modelo de desconto em lançamentos.
- **Permanência Média / Alunos em Risco**: KPIs removidos de `/retencao` (R3, PR #54).
- **Contratos financeiros**: tela com banner UX direciona para Faturamento/Lançamentos (inalterado).
- **Catraca / Ficha de Saúde / Ocorrências (tenant-empty)**: endpoint funciona; empty states padronizados em `src/components/empty-states/` (PR #59).
- **Agregações no cliente**: Inadimplência por Turma (#55), KPIs Dashboard Matrículas (#56), enrich Listagem Matrículas (#57), qtdAlunos enturmação (#49).

Conclusão: **nenhuma adequação paga está pendente**. O produto é autossuficiente contra o Swagger Sophia.

---

## 16. Confirmações oficiais do suporte Sophia

> **Fonte**: Transcrição de ligação entre cliente (equipe Raiz) e analista de suporte Sophia (Luiz), abril de 2026. Arquivo original: `~/Downloads/Transcrição - Ligação sophia.docx`.
>
> **Contexto da ligação**: a cliente estava debugando por que alguns dados não vinham da API (status de aluno, atribuição de professor, total a receber no dashboard). O suporte Sophia acessou a instância (tenant 9827) em tempo real e validou os endpoints no Swagger enquanto explicava. **Esta seção preserva as citações diretas** como ground truth — são as únicas afirmações oficiais documentadas fora do Swagger.

### 16.1 Acesso ao Swagger na instância da escola

O Swagger não é apenas referência em `portal.sophia.com.br` — cada escola tem o **mesmo Swagger ativo na sua própria instância** (tenant), acessível com um usuário-parceiro criado em:

> *"Dentro do seu Sofia, lá nos parâmetros do sistema, vai ter uma aba chamada WebAPI. Lá tem, normalmente, vários usuários e senha."*

Caminho: **Configurações > Parâmetros > Gerenciar > aba Web API > Parceiros autenticados**. O suporte autenticou usando a credencial do cliente em tempo real.

Tenant confirmado na ligação: **9827** (mesma instância usada pelo frontend).

### 16.2 Status de aluno — limite A/P (crítico)

> Cliente: *"Ele me retornou aqui que a API, ela só retorna A e P nos status dos alunos, por exemplo. Só que no acadêmico eu tenho mais status, né? Do que A e P."*
>
> Suporte: *"Se a gente verificar que no Swagger ele não traz todos os status, aí talvez isso entra como uma evolução, uma sugestão de melhoria ou adequação."*
>
> Terceiro na ligação: *"Seria pago."*

**Interpretação**: A API **intencionalmente** expõe só `A`/`P`. Qualquer necessidade de `Transferido`, `Cancelado`, `Evadido`, `Trancado` depende de adequação customizada (custo adicional). O suporte confirmou que **não é bug do Swagger** — é limitação de design da API pública.

**Implicação para novas integrações**:
- Não desenhar UX dependendo de status de aluno ricos — tratar como binário.
- Se o negócio exigir status completos, **orçar adequação paga com o comercial Sophia antes do projeto começar**.

### 16.3 `codigo` vs `codigoExterno`

> Suporte: *"Ele tem o código 27184. Aqui é o código dele interno no banco de dados."*
>
> Cliente: *"E o código dele no banco de dados é diferente do código que há ali, o código externo?"*
>
> Suporte: *"Exatamente. O código externo é o código dele que você coloca dentro do cadastro dele. Isso daqui é o código que a gente usa. É um código somente dele e até para consultar algumas outras informações em outros métodos, a gente usa esse código aqui."*
>
> Depois: *"O código externo é como se fosse o nome do aluno. Então, se eu busco por Mateus Messias, pode ser que apareça dois Mateus Messias. [...] O código externo é a mesma coisa. [...] Já o código aqui não. Esse código aqui é único e somente o Matheus Messias que possui esse código aqui."*

**Regra definitiva**:
- **`codigo` (int64)** — chave primária, única, usada em todas as buscas entre endpoints (`/alunos/{id}/...`, filtros `CodigoAluno`, etc.).
- **`codigoExterno` (string)** — é **input do cadastro** (como o "RA" da escola). Pode colidir. Serve como exibição e, com cuidado, como chave cross-system (Sophia ↔ TOTVS RM). **Nunca use em lookups internos**.

### 16.4 Filtro implícito em `/alunos/{id}/Matriculas`

> Cliente: *"Oitavo ano é a de 2026."*
>
> Suporte: *"É o que ele cursou agora em 2026. Mas ele não está trazendo a do oitavo ano. Deixa eu ver uma coisinha. Porque, assim, aqui nos demais anos, o aluno ou ele está ativo, está vendo? Ou concluída. A transferida, a princípio, não está constando aqui."*
>
> Depois: *"Aí, às vezes, pode ser que faça sentido isso que você falou. Na hora que a plataforma tentou buscar a informação, talvez ele traça somente os alunos que estão ativos ou concluídos."*

**Confirmação**: `GET /alunos/{idAluno}/Matriculas` só retorna matrículas com status `ativa` ou `concluída`. Matrículas com status `transferida`, `cancelada`, `trancada` **não aparecem no resultado** mesmo que o aluno esteja cadastrado. Isso **não está documentado no Swagger**.

### 16.5 Contratos financeiros — não existem como endpoint

> Cliente (lendo mensagem do dashboard deles): *"A API de Sofia não disponibiliza o endpoint de contratos financeiros. Os dados financeiros estão disponíveis em faturamento e lançamentos."*
>
> Suporte: *"É porque essa informação que você quer, querendo ou não, ela é um cálculo. É um resultado de um cálculo que você quer que exibir na tela. Porque daí, dentro da API, ele não vai fazer o cálculo. Ele vai te dar as informações que tem ali. Então, tem 300 alunos, 298 estão com boletos pagos. É isso. [...] Quem que tem que pegar essas informações e programar um cálculo e jogar na tela é a plataforma."*
>
> Suporte: *"Se a plataforma não tem essa programação, ela teria, então, que buscar do Sofia. Mas se o Sofia não tem, a informação vai ficar em branco mesmo."*

**Confirmação oficial do fix #33**: o caminho correto é agregar `/alunos/{idAluno}/Lancamentos` por aluno/ano e calcular no lado do cliente. **A API nunca vai fazer cálculos agregados** — essa é a filosofia explícita do produto.

### 16.6 Atribuição Professor → Turma → Disciplina

> Suporte: *"No Sofia, vai ter como o professor responsável. E aí, aponta a lista de chamada que vai trazer para você a informação. Então, por exemplo, eu quero trazer todas as informações de lista de chamada do professor X. Se não me engano, você precisa ir em colaborador, pegar o ID do professor, e aqui em lista de chamada, por exemplo, você faz a busca do ID do professor, que ele vai trazer para você as listas de chamada desse professor."*

**Cadeia oficial** para atribuição Prof → Turma → Disciplina:

```
/Colaboradores  (filtrar por nome/unidade → pegar "codigo")
     │
     ▼
/ListaChamada/Professor/{codigo}  (pegar listas de chamada do período)
     │
     ▼
/ListaChamada/{idListaChamada}  (detalhes: turma, disciplina, data)
     │
     ▼ (opcional)
/ListaChamada/Alunos/{idListaChamada}  (alunos presentes nessa aula)
```

**Alternativa** (mais eficiente para dashboard):

```
/MateriaLecionada  (filtros AND: CodigoProfessor + DataInicial + DataFinal + CodigoTurma)
     ← retorna matérias lecionadas = cada linha já contém (turma, disciplina, professor, data)
```

### 16.7 Boletim customizado da escola

> Cliente: *"Existe SWEG para os relatórios que a gente cria?"*
>
> Suporte: *"Existe. [...] O boletim, na verdade, ele não vai ser um boletim como se fosse na impressão aqui. Você pode escolher vários boletins para você selecionar. [...] Então, por exemplo, você pegou o aluno, que ele é do oitavo ano. A turma dele está utilizando essa configuração acadêmica. Nessa configuração acadêmica, existe aqui o boletim novo."*
>
> Cliente: *"E esse é um relatório que a gente criou?"*
>
> Suporte: *"Isso, é o relatório que vocês criaram. Então esse relatório aqui, na hora que você jogar aqui no método, ele vai trazer diferente. Ele não vai trazer, tipo assim, com a interface bonitinha. Ele vai trazer somente letras e números para você ver se realmente está funcionando ou não. Mas ele traz sim."*

**Interpretação**:
- Cada turma está ligada a uma **configuração acadêmica**.
- A configuração aponta para um ou mais templates de boletim (padrão Sophia ou criados pela escola).
- A API retorna o **conteúdo cru** (dados tabulares em JSON/XML) para qualquer boletim — inclusive os customizados.
- O **template visual (Word/PDF)** não é entregue pela API — fica no gerenciador web do Sophia.
- Para renderizar visual igual ao Sophia, o cliente precisa **reimplementar o template** ou usar o próprio Sophia para exportar.

### 16.8 Integrações com parceiros — sem atalho

> Cliente: *"A Layers já tem algumas coisas. Qual que é o comando que a Layers usa, por exemplo, pro boletim escolar? Qual que é o comando que ele usa pra turma?"*
>
> Suporte: *"Eu acho difícil conseguir para você. Porque aí eu teria que conversar com a equipe de desenvolvimento deles lá, que é algo interno deles. [...] A gente não tem, porque tudo que está na Layers está no Swagger. Entendeu? Está aqui dentro. Tudo que eles usam e está exibindo na Layers está aqui dentro, dentro do Swagger. Não tem nada diferente."*
>
> Depois: *"A gente tem parceiro financeiro, que às vezes faz a consulta no banco. Essas informações estão dentro da API aqui do Swagger, mas não dá para saber qual é o caminho que eles fazem. Porque dentro da consumação da API, eles automatizam o que vai ser exibido."*

**Conclusão**: Não existe documentação oficial de "quais endpoints a Layers/Agenda Edu/parceiro X usa". Cada parceiro monta sua própria cadeia de chamadas. O Swagger público é a única fonte.

**Exceção**: alguns shapes têm prefixo específico de parceiro (ex: `AlunoAgendaEduApiModelRetorno` no raw/DOC-3:386). A Layers, no entanto, consome os modelos genéricos.

### 16.9 Histórico: catraca via FTP (legado)

> Suporte: *"Antigamente a catraca, informações de catraca, quando os alunos entravam na escola pela catraca e já dava como presença, era somente via FTP, que era o que? Gerava um arquivo dentro da plataforma que a pessoa contratou e aí esse arquivo era encaminhado para a pasta do Sofia, o Sofia fazia uma leitura com o layout do arquivo, e aí já colocava lá quem faltou, quem entrou pela catraca e quem não entrou, através dos códigos, enfim. Então agora a gente já tem também essa catraca via API."*

Histórico útil: se encontrar uma integração de catraca baseada em upload de arquivo para diretório do Sophia, é a versão legada. A versão moderna é `POST /api/v1/Catraca`.

### 16.10 Processo de adequação paga

> Suporte: *"Aí já entraria com uma adequação. [...] Porque algumas coisas aqui que tem hoje foi porque clientes às vezes solicitaram como sugestão de melhoria. [...] Agora algumas coisas mais específicas assim, tipo assim, queria que aparecesse ali o transferido, o evadido e tudo mais. Se não constar em uma das informações aqui, em um dos métodos, realmente vai ter que fazer uma adequação. Que aí é fazer o pagamento, para poder eles colocarem a informação aí, ou encaminhar como sugestão de melhoria."*

**Fluxo para expandir a API**:
1. Verificar que o campo/endpoint realmente não existe (procurar em todos os tags relacionados).
2. Abrir chamado no suporte Sophia descrevendo o que precisa.
3. Duas vias:
   - **Adequação paga** (entrega específica, prazo definido, custo adicional).
   - **Sugestão de melhoria** (entra na fila do roadmap, sem garantia de prazo).
4. Adequação gera versionamento do Swagger do tenant — não afeta outras escolas.

### 16.12 Race condition em `authenticate()` (descoberto 2026-04-08)

Quando múltiplas chamadas ao `fetchPaginated` rodam em paralelo com cache de token vazio (cold start serverless), cada call inicia seu próprio `/Autenticacao` → 5 logins simultâneos para 5 páginas. A Sophia aceita mas é desperdício de rate limit e latência.

**Fix canônico**: single-flight pattern no `authenticate()` — coalescer chamadas concorrentes em uma única promise in-flight por tenant:

```ts
const inFlightAuth = new Map<string, Promise<string>>()

export async function authenticate(tenantId: string): Promise<string> {
  const cached = tokenCache.get(tenantId)
  if (cached && Date.now() < cached.expiresAt) return cached.token

  const existing = inFlightAuth.get(tenantId)
  if (existing) return existing

  const promise = doAuthenticate(tenantId).finally(() => inFlightAuth.delete(tenantId))
  inFlightAuth.set(tenantId, promise)
  return promise
}
```

Implementado em `rest.client.ts` (PR #41). Essencial antes de habilitar paginação paralela.

### 16.13 Paginação sequencial estoura timeout do Vercel (descoberto 2026-04-08)

Com ~3000+ alunos, 50 páginas × ~1s cada = ~50s de pagination sequencial. Vercel serverless functions default timeout é 60s — cada request do DataContext ao `/api/alunos` dava 504 aleatoriamente.

**Fix**: `fetchPaginated` dispara páginas em **batches paralelos** via `Promise.all`:

```ts
while (!done && nextPage <= maxPages) {
  const batchSize = Math.min(concurrency, maxPages - nextPage + 1)
  const pages = Array.from({ length: batchSize }, (_, i) => nextPage + i)
  const batches = await Promise.all(pages.map(p => fetchPage(p).catch(() => [])))
  for (const batch of batches) {
    if (batch.length === 0) done = true
    else results.push(...batch)
    if (batch.length < tamanhoPagina) done = true
  }
  nextPage += batchSize
}
```

Default `concurrency: 5`, `tamanhoPagina: 500` (Sophia max). Reduziu latência de `/api/alunos` de ~15s para ~3-5s em tenant de 10k alunos. Implementado em PR #41 + #43.

### 16.14 Gating de páginas em `firstRecord` de notas quebra para tenants sem notas (descoberto 2026-04-08)

A página `/pedagogico/notas/aluno/[ra]` gateava em `if (!firstRecord) return "Aluno não encontrado"` — sendo `firstRecord` o primeiro item de `NOTAS.filter(...)`. Para tenants que não expõem notas (endpoint `/AtasAlunos` retorna 404), TODO aluno parecia "não encontrado" mesmo sendo válido em `/api/alunos`.

**Fix**: o gate deve considerar `alunoRecord` (vem do alunos cache) como fallback. Se nenhum dos dois existe, aí sim não encontrado. Se apenas as notas estão ausentes, renderizar boletim em estado "Cursando":

```ts
if (isLoading && !firstRecord && !alunoRecord) return <Loading />
if (!firstRecord && !alunoRecord) return <NotFound />
const nomeAluno = firstRecord?.alunoNome ?? alunoRecord?.nome ?? ""
const turma = firstRecord?.turma ?? alunoRecord?.turma ?? ""
// ...
```

Implementado nos PRs #39 + #40. Regra geral: nunca usar um sub-dataset (notas) como proxy para "existência do aluno" — o source of truth é `/api/alunos`.

### 16.15 URLs de Google Fonts CDN não são stable (descoberto 2026-04-08)

Tentei registrar IBM Plex Sans no `@react-pdf/renderer` via URLs `fonts.gstatic.com/s/ibmplexsans/v19/...ttf` — **os hashes mudam entre versões** e URLs não são documentadas como endpoints públicos. Cada geração de PDF dava 404 → `PDFDownloadLink` mostrava "Erro ao gerar".

**Fix**: duas opções válidas:
1. **MVP**: usar a Helvetica embutida no `@react-pdf/renderer` (zero setup, layout aceitável)
2. **Produção**: commitar TTFs em `/public/fonts/` e registrar com path relativo (stable)

Nunca usar URLs diretas do Google Fonts para fontes em runtime React-PDF. O CSS `@import` do Google Fonts funciona para o browser mas o que está atrás é um serviço que faz rewriting de URL — ambiente server-side do react-pdf não passa por lá. Implementado em PR #42.

---

### 16.11 Resumo prático das implicações

O que esta transcrição muda em termos práticos para futuras integrações:

| Área | Impacto |
|---|---|
| **Status de aluno** | Trate como binário (ativo/pendente). UX com filtros de status ricos = não implementar ou orçar adequação paga. |
| **Busca entre endpoints** | **Sempre `codigo` (int64)**. Nunca `codigoExterno`. |
| **Histórico acadêmico** | `/alunos/{id}/Matriculas` não dá visão histórica completa — só ativas/concluídas. Para histórico real, precisa outro caminho (ou não tem). |
| **Dashboards financeiros** | Qualquer métrica agregada (total a receber, inadimplência, ticket médio, aging) é trabalho do cliente. API entrega linha-a-linha. |
| **Atribuição de professor** | Nunca assumir que `/Colaboradores` tem disciplinas. Sempre cruzar com `/ListaChamada/Professor/{id}` ou `/MateriaLecionada`. |
| **Boletim personalizado** | API entrega dados, **não entrega visual**. Re-renderizar no cliente ou chamar export do Sophia. |
| **Parceiros existentes** | Não tente copiar a configuração de Layers/Agenda Edu — construa sua própria cadeia a partir do Swagger. |
| **Scope de projeto** | Ao orçar nova integração, **reservar orçamento para adequações pagas** caso o Swagger não cubra 100% do escopo. |

---

**Fim do documento.**
*Para contribuir: editar este arquivo + commitar. Este é o source-of-truth de contexto Sophia para qualquer projeto no workspace.*
