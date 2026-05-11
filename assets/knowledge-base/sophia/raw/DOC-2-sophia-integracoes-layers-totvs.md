# SophiA — Integrações: Layers Education + TOTVS RM

**Data**: 2026-03-22
**Status**: Pesquisa consolidada de fontes públicas

---

## 1. Integração SophiA ↔ Layers Education

### 1.1 Visão Geral da Parceria

- **Início**: 2022 (parceria formal)
- **Produto**: App **"Sophia+ by Layers"** (`education.layers.sophiabylayers`)
- **Objetivo**: Consolidar 7 apps separados em um único app white-label
- **Alcance inicial**: 500+ escolas, 88 mil alunos
- **Custo**: Ferramentas Layers gratuitas para clientes Sophia. Porém ativação da API Sophia pode ter **custo adicional**

### 1.2 Arquitetura da Integração

```
SophiA (ERP Escolar) ──→ API Web SophiA ──→ Layers Data Sync ──→ Sophia+ by Layers App
                          (REST, JSON/XML)    (gateway)            (iOS / Android / Web)
```

**Sophia = provedor de dados** (sistema de gestão/ERP)
**Layers = consumidor** (exibe dados no app)

### 1.3 Layers Education — Plataforma Hub

A Layers funciona como **hub digital** conectando instituições, usuários e apps. 4 caminhos de integração:

| Caminho | Descrição |
|---------|-----------|
| **Portais** | Embedding de apps dentro do ambiente Layers (web/mobile) |
| **SSO (Single Sign-On)** | Autenticação via Layers com acesso a dados do usuário |
| **Sincronização de Dados** | Sync de dados institucionais (usuários, enturmação, grupos, horários) |
| **API Hub** | Consumo de dados em tempo real (horários, frequência, cobranças) |

Padrões de comunicação: **request/respond** e **pub/sub** no API Hub.

### 1.4 Modelos de Sincronização

#### Sincronização Total
1. Layers chama **rota check** → verifica disponibilidade do provedor
2. Provedor responde `200`
3. Layers chama **4 endpoints**: Usuários, Alunos, Turmas, Disciplinas (Componentes)
4. Dados importados completamente

#### Sincronização Incremental
1. Layers chama **rota check**
2. Provedor responde `200`
3. Layers envia **prepare** → provedor tem **30 minutos** para enviar dados modificados
4. Provedor processa e envia deltas

### 1.5 Entidades Layers Data API

| Entidade Layers | Equivalente Escolar | Descrição |
|-----------------|-------------------|-----------|
| **Members** | Alunos, pais, professores, funcionários | Usuários da comunidade |
| **Groups** | Turmas | Agrupamentos de membros |
| **Enrollments** | Enturmação | Conexão membro ↔ grupo |
| **Components** | Disciplinas/matérias | Componentes curriculares |
| **Seasons** | Períodos letivos | Anos/semestres |
| **Tags** | Metadados | Organização e categorização |

### 1.6 Dados Sincronizados Sophia → Layers (confirmado)

- Anos letivos (school years)
- Unidades (campus/units)
- Cursos (courses)
- Turmas (classes)
- Disciplinas (subjects)
- Alunos (students)
- Responsáveis (guardians/parents)
- Professores (teachers)
- Boletins (report cards/transcripts)
- Boletos (payment slips/invoices)

### 1.7 Funcionalidades do App Sophia+ by Layers

| Funcionalidade | Descrição |
|----------------|-----------|
| **Painel Inicial** | Dashboard com resumo |
| **Comunicados** | Feed interativo (financeiro, pedagógico, passeios) |
| **Agenda/Calendário** | Calendário escolar com eventos |
| **Atendimentos** | Chat direto (Coordenação, Financeiro, Administrativo) |
| **Conteúdo de Aula** | Material pedagógico dos professores |
| **Registros Acadêmicos** | Ocorrências (comportamento, tarefas, material) |
| **Notas Acadêmicas** | Provas, trabalhos, médias, boletins trimestrais |
| **Frequência** | Presença/ausência por disciplina, percentuais |
| **Visão Financeira** | Títulos pagos, em aberto, download de boletos |
| **Visão de Horários** | Grade de horários por dia/disciplina |
| **Ficha Médica** | Alergias, medicamentos, contatos de emergência |
| **Diário do Professor** | Faltas, ocorrências, conteúdo, tarefas |
| **E-commerce** | Venda online (em desenvolvimento) |

### 1.8 Ativação da Integração (passo a passo)

1. Escola já deve ser **cliente Sophia** (Gestão Escolar)
2. Solicitar ao suporte Sophia a **ativação da API** + geração de credenciais (URL, Login, Senha)
3. Credenciais ficam em: `Configurações > Configuração Geral > Integração > Autenticação do Web Service`
4. Escola fornece credenciais para a equipe Layers
5. Layers configura o gateway de integração
6. Pronto em até **48 horas**
7. Dados sincronizados automaticamente

### 1.9 Layers Developer Center

| Aspecto | Detalhe |
|---------|---------|
| **URL** | https://developers.layers.education/ |
| **Contato** | suporte@layers.education / devs@layers.education |
| **Suporte** | Discord (para devs) |
| **Status** | https://status.layers.digital |
| **Integra com** | 20+ sistemas de gestão (além do Sophia) |

#### Serviços da Layers API

| Domínio | Serviços |
|---------|----------|
| **Autenticação** | OAuth2, SSO, session management, LayersPortal.js |
| **Data API** | Usuários, grupos, enturmação, componentes, upload de entidades, tags, seasons |
| **API Hub** | Request/respond e pub/sub entre apps |
| **Notificações** | Email, push, segmentação, agendamento |
| **Pagamentos** | Vendas, cobráveis, itens, kits, inventário |
| **Viewers** | Notas, frequência, horários, financeiro, ficha médica, calendário, registros |
| **Webhooks** | Retry policies, entity tracking |

#### Sistema de Certificação (Graus)

| Grau | Significado | Publicação |
|------|-------------|------------|
| **A** | Zero falhas nos testes | Loja pública |
| **B** | Problemas de UX apenas | Loja pública (mínimo) |
| **C** | Confiabilidade parcial comprometida | Release restrito |
| **D** | Confiabilidade totalmente comprometida | Volta p/ desenvolvimento |
| **F** | Falhas de segurança | Volta p/ desenvolvimento |

---

## 2. API Web SophiA — Documentação Técnica Completa

### 2.1 Visão Geral

- **Arquitetura**: REST
- **Versão documentada**: 1.19.0.0 (Biblioteca/Philos)
- **Formatos**: JSON (`application/json`) e XML (`text/xml`) — escolha do cliente
- **Base URL**: Varia por instituição (ex: `http://www.sophiabiblioteca.com.br`)

### 2.2 Autenticação

- **Endpoint**: `GET /api/autenticacao`
- Configurada em: `Configurações > Configuração Geral > Integração > Autenticação do Web Service`
- Token **vinculado ao IP** do solicitante
- Token **expira após 20 minutos** sem uso
- Token **renovado a cada requisição**
- HTTP 200 = sucesso (retorna Token), HTTP 401 = credenciais inválidas

### 2.3 Headers Obrigatórios

```
User-Agent: SophiAGestaoEscolar
Host: http://www.sophiabiblioteca.com.br
Content-Type: text/xml | application/json
Accept: text/xml | application/json
Token: bcdc03e458ea4ae5b30908bfa22a9264
```

### 2.4 Endpoints Documentados (Biblioteca/Philos — 8 endpoints)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/autenticacao` | Gerar token (usuário + senha do Gerenciador) |
| `GET` | `/api/versao` | Versão da API (**único sem token**) |
| `GET` | `/api/usuario/{identificacao}` | Dados cadastrais de usuário (por código ou matrícula) |
| `POST` | `/api/usuario` | Criar novo usuário |
| `PUT` | `/api/usuario/{identificacao}` | Alterar usuário existente |
| `DELETE` | `/api/usuario/{identificacao}` | Remover usuário (só se sem pendências) |
| `GET` | `/api/usuario/{identificacao}/nadaconsta` | Verificar pendências do usuário |
| `GET` | `/api/biblioteca` | Listar bibliotecas ativas |

### 2.5 Endpoints Gestão Escolar (18 recursos — parcialmente documentados)

| Recurso | Descrição |
|---------|-----------|
| Autenticação | Token generation |
| Avisos | Comunicados e alertas |
| Boletins | Report cards / boletins |
| Calendário | Calendário escolar |
| Campanhas | Campanhas de rematrícula |
| Cursos | Cursos disponíveis |
| Finanças | Títulos, boletos, pagamentos |
| Logotipos | Logos da instituição |
| Notas | Notas e avaliações |
| Pessoas | Alunos, responsáveis, professores |
| Prospecção | Leads/prospects |
| (7 outros) | Não documentados publicamente |

### 2.6 Modelo de Dados — Entidade Usuário (40+ campos)

| Campo | Max chars | Descrição |
|-------|-----------|-----------|
| `Nome` | 252 | Nome completo (**obrigatório**) |
| `Tipo` | 50 | aluno, professor, etc (**obrigatório**) |
| `Biblioteca` | 60 | Código/nome da biblioteca |
| `Matricula` | 20 | Matrícula (único) |
| `CodigoUsuario` | 15 | Código numérico |
| `Login` | 100 | Login (único) |
| `Senha` | 30 | Senha |
| `Sexo` | 1 | `M` ou `F` |
| `DataNascimento` | 10 | dd/mm/aaaa |
| `NumeroId` | 20 | Número do documento |
| `TipoId` | 252 | Tipo do documento (rg, cpf) |
| `Curso` | 252 | Curso |
| `Serie` | 100 | Série |
| `Periodo` | 100 | Período |
| `Turma` | 100 | Turma |
| `EmailComercial` | 252 | E-mail comercial |
| `EmailResidencial` | 252 | E-mail residencial |
| `TelefoneComercial` | 252 | Telefone comercial |
| `TelefoneResidencial` | 252 | Telefone residencial |
| `EnderecoComercial` | 252 | Endereço comercial |
| `EnderecoResidencial` | 252 | Endereço residencial |
| `CidadeComercial` | 252 | Cidade comercial |
| `CidadeResidencial` | 252 | Cidade residencial |
| `CepComercial` | 9 | CEP comercial |
| `CepResidencial` | 9 | CEP residencial |
| `BairroComercial` | 100 | Bairro comercial |
| `BairroResidencial` | 100 | Bairro residencial |
| `Empresa` | 100 | Empresa |
| `Foto` | Sem limite | Base64 |
| `Inativo` | 5 | true/false |
| `DataBloqueio` | 10 | dd/mm/aaaa |
| `DataValidade` | 10 | dd/mm/aaaa |
| `MotivoBloqueio` | 30 | Motivo do bloqueio |
| `CampoOpcional1-5` | 252 | Campos customizáveis |
| `TabelaOpcional1-4` | 252 | Tabelas opcionais |

**Regras de negócio**:
- Datas: dd/mm/aaaa, range 01/01/1900 a 31/12/9999
- Sexo: "M" ou "F"
- CodigoUsuario deve ser numérico
- Matrícula e Login são **únicos** (rejeita duplicatas)
- Usuários só podem ser removidos se **sem**: circulações em aberto, serviços/taxas, reservas pendentes
- Campos que excedem max chars são **truncados silenciosamente**

### 2.7 Fontes da Documentação API

- [API Biblioteca/Philos (PDF público - IFB)](https://ifb.edu.br/attachments/article/39100/API%20Web%20de%20Integra%C3%A7%C3%A3o.pdf)
- [API Gestão Escolar 1.0 (restrito - Scribd)](https://www.scribd.com/document/592604325/Integracao-API-Web)
- [Descritivo Funcional Biblioteca Web (PDF - IFB)](https://www.ifb.edu.br/attachments/article/39100/Descritivo%20Funcional%20do%20Sophia%20Biblioteca%20Web.pdf)

---

## 3. Integração SophiA ↔ TOTVS: NÃO EXISTE

### 3.1 Conclusão Principal

**NÃO há integração direta, conector, middleware ou parceria entre SophiA e TOTVS.** São sistemas **concorrentes** no mercado de gestão educacional brasileiro.

- Nenhum conector encontrado
- Nenhuma escola usando ambos de forma integrada
- Não existe middleware ou bridge
- Empresas completamente independentes (Sophia/Volaris vs TOTVS S.A.)

### 3.2 Único Formato Compartilhado: Educacenso

O **Educacenso** (formato INEP/MEC) é o único formato padronizado que ambos exportam:
- SophiA: `Gestão > Ferramentas de Análise > Gerador de Saída` → arquivo .zip
- TOTVS: Menu Educacenso dentro do TOTVS Educacional
- **Dados cobertos**: escolas, turmas, alunos, profissionais (dados básicos apenas)
- **NÃO cobre**: financeiro, históricos acadêmicos detalhados, notas, ocorrências

### 3.3 Migração SophiA → TOTVS (manual)

- **Não existe migrador automático**
- TOTVS tem "Importador de Dados" que aceita arquivos `.TXT` (campos separados por `;`, encoding UTF-8/ANSI)
- Arquivo deve ter mesmo nome da tabela de destino + extensão .txt
- Importador **NÃO segue regras de negócio** — insere direto no banco
- Caminho: extrair do Sophia (API ou banco) → transformar (ETL) → importar no TOTVS

### 3.4 Migração TOTVS → SophiA (manual)

- **Não existe migrador automático**
- SophiA API aceita criação via POST (JSON/XML)
- Limitado: API Biblioteca = CRUD de usuários; API Gestão Escolar = 18 recursos (doc restrita)

### 3.5 Caminho Viável para Migração

1. Exportar dados do sistema origem (API ou acesso direto ao banco)
2. Transformar com ETL (Python/Node, n8n, ou similar)
3. Importar no sistema destino (API ou importador)
4. Educacenso como ponte para dados básicos de alunos/turmas/profissionais

### 3.6 Mapeamento Conceitual SophiA → TOTVS RM

| Conceito SophiA | Equivalente TOTVS RM | Observação |
|-----------------|---------------------|------------|
| Aluno (tipo "aluno") | SALUNO | Dados pessoais + matrícula |
| Professor (tipo "professor") | SPROFESSOR | Dados pessoais |
| Turma | STURMA | Turma/classe |
| Curso | SCURSO | Curso |
| Serie | SHABILITACAO (parcial) | Série/ano escolar |
| Periodo | SPLETIVO | Ano/período letivo |
| Disciplina | SDISCIPLINA | Disciplina/matéria |
| Nota/Boletim | SNOTA + SETAPA | Notas por etapa |
| Biblioteca | N/A | TOTVS não tem módulo nativo |
| Finanças | FLAN | Lançamentos financeiros |
| Responsavel | SRESPONSAVEL | Responsável legal |
| Matricula | SMATRICULA | Matrícula do aluno |
| Multi-unidade | CODCOLIGADA + CODFILIAL | Multi-tenant |

> **ATENÇÃO**: Mapeamento conceitual/inferido. Schema real do SophiA **NÃO é público**.

### 3.7 Comparação Competitiva

| Critério | SophiA | TOTVS Educacional |
|----------|--------|-------------------|
| **Empresa** | Soluções Sophia (Volaris/CSI) | TOTVS S.A. (B3:TOTS3) |
| **Fundação** | 1993 | 1983 |
| **Foco** | Escolas K-12 + Bibliotecas | K-12 + Superior + ERP completo |
| **Clientes** | 3.500+ instituições | "8 das 10 melhores escolas" |
| **Banco de dados** | Oracle, SQL Server, PostgreSQL | SQL Server (RM) |
| **Deploy** | Desktop + Web | Desktop (RM) + Web |
| **ERP integrado** | Não (foco educacional) | Sim (Financeiro, RH, Compras, Estoque) |
| **Biblioteca** | SIM (líder, Philos) | Não é foco |
| **API** | REST, JSON/XML, 18 recursos (escolar) + 8 (biblioteca) | REST/SOAP, ampla |
| **Porte ideal** | Pequenas/médias escolas | Médias/grandes instituições e redes |

---

## Sources

### Sophia ↔ Layers
- [Layers Developer Center](https://developers.layers.education/)
- [Fluxo de Importação - Layers](https://developers.layers.education/docs/api/data/importacao-de-dados/fluxo-de-importacao/)
- [O que é a Layers? - Dev Center](https://developers.layers.education/content/quickstart/layers.html)
- [Membros e Grupos - Layers](https://developers.layers.education/docs/concepts/ecossistema-layers/membros-e-grupos/)
- [Layers + Sophia - Fusões & Aquisições](https://fusoesaquisicoes.com/acontece-no-setor/layers-se-une-ao-sistema-de-gestao-sophia-para-impulsionar-acesso-as-tecnologias-educacionais/)
- [Funcionalidades Sophia by Layers - Colégio Nova Meta](https://colegionovameta.com.br/blog/funcionalidades-sophia-by-layers/)
- [Sophia+ novas funções](https://sophia.com.br/aplicativo-para-escolas-confira-novas-funcoes-no-app-sophia/)
- [Layers - Captação R$21M (Exame)](https://exame.com/negocios/eles-acabam-de-captar-r-21-milhoes-para-colocar-a-agendinha-da-escola-dentro-de-um-app/)

### Sophia ↔ TOTVS
- [TOTVS Importador de Dados](https://centraldeatendimento.totvs.com/hc/pt-br/articles/360007502332)
- [TOTVS Importador - Como Fazer](https://tdn.totvs.com/display/public/LRM/TOTVS+Educacional+-+Importador+%7C+Como+Fazer)
- [TOTVS Migrar para Educacional (SlideShare)](https://www.slideshare.net/slideshow/totvs-educacional-conhea-o-produto-e-sabia-como-migrar-para-ele/7699368)

### API SophiA
- [API Biblioteca/Philos (PDF - IFB)](https://ifb.edu.br/attachments/article/39100/API%20Web%20de%20Integra%C3%A7%C3%A3o.pdf)
- [API Gestão Escolar (Scribd)](https://www.scribd.com/document/592604325/Integracao-API-Web)
- [Integração Diário Escola](https://diarioescola.com.br/integracao-sophia-e-superapp-diario-escola/)
- [Integração Agenda Edu](https://atendimento.agendaedu.com/hc/pt-br/articles/12935986823067)
