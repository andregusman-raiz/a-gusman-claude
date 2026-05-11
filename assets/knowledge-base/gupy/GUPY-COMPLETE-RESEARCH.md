# Gupy Tecnologia — Pesquisa Completa

**Data**: 25/03/2026
**Versão**: 1.0
**Fontes**: Documentação oficial Gupy + site corporativo + suporte técnico

---

## 1. Visão Geral — O que é Gupy?

### Company Overview
- **Empresa**: Gupy Tecnologia
- **Fundação**: 2015, São Paulo (BR)
- **Founders**: Profissionais de RH de uma das maiores empresas do Brasil
- **Sede**: São Paulo, com presença em 23 estados do Brasil
- **Tamanho**: 600+ funcionários
- **Tipo**: HR Tech (Tecnologia de Recursos Humanos)

### Posicionamento
Gupy é a **plataforma líder em recrutamento e seleção no Brasil** e uma das HR Techs de mais rápido crescimento do país. Oferece um ecossistema completo de soluções para **transformar o ciclo de vida do funcionário** — desde atração até desenvolvimento e engajamento.

### Estatísticas (2026)
- **4.000+** empresas clientes
- **1+ milhão** de contratações realizadas via plataforma
- **148.000+** admissões usando Gupy Admissão
- **580.000+** pessoas treinadas via Gupy Educação Corporativa
- **850.000+** carreiras transformadas com Gupy Climate & Engagement by Pulses
- Investimento: R$ 500 milhões (SoftBank + Riverwood Capital) — maior rodada de HR Tech em LATAM

---

## 2. Produtos e Módulos Principais

### Arquitetura de 5 Pilares

Gupy oferece uma plataforma integrada com **5 soluções principais**:

#### 2.1 Recruitment & Selection (Recrutamento & Seleção)
**O módulo mais maduro e popular da Gupy.**

**Funcionalidades:**
- **AI Agents**: Triagem automática de candidatos com IA (primeira IA aplicada a R&S no Brasil)
- **Job Posting Management**: Criar e gerenciar vagas padrão e quick-apply
- **Candidate Management**: Banco de talentos com busca e filtros avançados
- **Application Workflow**: Movimentação de candidatos por estágios
- **Behavioral Assessments**: Avaliações comportamentais integradas
- **Diversity & Inclusion**: Coleta de dados de diversidade
- **WhatsApp Applications**: Candidaturas via WhatsApp
- **Internal Recruitment**: Programa de mobilidade interna
- **Question Forms**: Formulários customizados por vaga
- **Interview Scripts**: Templates de entrevistas estruturadas
- **Candidate Tagging**: Organização e categorização de candidatos

**Workflow Padrão:**
1. Publicação da vaga (padrão ou quick-apply)
2. Candidato aplica (web, WhatsApp, LinkedIn)
3. Triagem automática com IA (ranking de perfil-vaga)
4. Entrevista agendada + Google/Microsoft Calendar sync
5. Avaliação técnica/comportamental
6. Aprovação gerencial
7. Oferta e movimentação para admissão

---

#### 2.2 Digital Onboarding (Admissão Digital)
**Automação completa do processo de admissão.**

**Funcionalidades Principais:**
- **Document Validation**: IA valida automaticamente documentos em segundos
  - CPF, RG, CNH, Carteira Profissional, etc.
  - Integração com governo para verificação de dados
- **Electronic Signature**: Assinatura digital com validade legal
- **Checklist Customizado**: Listas de documentos por posição/local
- **Candidate Portal**: Portal centralizado para candidato preencher dados + enviar documentos
- **Data Consistency**: Verificação com bases governamentais (evita erros de digitação)
- **Communication Hub**: Chat integrado entre HR e futuro funcionário
- **Automated Routing**: Roteamento automático para próximos passos
- **Status Tracking**: Acompanhamento em tempo real

**Benefícios:**
- Reduz tempo de admissão em até 55%
- Elimina rework e erros de digitação
- Integração nativa com R&S (dados sincronizados automaticamente)

---

#### 2.3 Corporate Education (Educação Corporativa — Niduu)
**Plataforma de treinamento e desenvolvimento.**

**Funcionalidades:**
- **Course Creation**: Criação de cursos com IA
- **Learning Paths (Trilhas)**: Caminhos de aprendizado personalizados
- **Content Types**: Suporte a texto, vídeo, atividades gamificadas
- **Intuitive Design**: Interface amigável para criação sem code
- **User Management**: Gerenciamento de grupos e acesso
- **Progress Tracking**: Acompanhamento de conclusão

**Casos de Uso:**
- Onboarding de novos funcionários
- Treinamento de compliance
- Desenvolvimento de lideranças
- Upskilling de equipes

---

#### 2.4 Climate & Engagement (Clima & Engajamento — Pulses)
**Avaliação contínua de clima organizacional.**

**Funcionalidades:**
- **Pulse Surveys**: Pesquisas rápidas e frequentes
- **Engagement Tracking**: Acompanhamento contínuo do clima
- **Turnover Prediction**: IA prediz risco de saída de talentos
- **Feedback Loop**: Feedback 360º e contínuo
- **Analytics & Dashboards**: Visualização de dados por departamento/area

**Métrica Principal:**
- 850.000+ carreiras transformadas com essa solução

---

#### 2.5 Performance & Development
**Gestão de desempenho e desenvolvimento.**

**Funcionalidades:**
- **Custom Evaluations**: Avaliações configuráveis por empresa
- **Continuous Development**: Planos de desenvolvimento individuais
- **Goal Management**: Definição e acompanhamento de metas
- ** 360 Feedback**: Feedback multidimensional

---

### 2.6 Módulos Complementares

| Módulo | Descrição |
|--------|-----------|
| **Attraction Module** | Estratégia de employer branding e divulgação |
| **Internal Recruitment** | Programa de mobilidade e carreira interna |
| **ExJourney** | Experiência completa do ciclo de vida do funcionário |
| **Global Admin** | Gerenciamento global de posições e funcionários |
| **Benefits Module** | Gestão de benefícios |
| **Internal Communications** | Comunicações internas e engagement |
| **Gupy Academy** | Treinamento de usuários |

---

## 3. API da Gupy — Documentação Técnica

### 3.1 Visão Geral
- **Base URL**: `https://api.gupy.io/api/v1` (ou v2)
- **Protocolo**: HTTPS REST
- **Autenticação**: Bearer Token (RFC 6750)
- **Documentation**: https://developers.gupy.io/
- **Swagger UI**: https://api.gupy.io/api

### 3.2 Autenticação

#### Geração de Token
**Requisito**: Plano Premium ou Enterprise (API não disponível em Professional)

**Como gerar:**
1. Acessar Setup → Tokens Generation na plataforma Gupy
2. Definir permissões necessárias por endpoint
3. Copiar token gerado (não expira)

**Segurança:**
⚠️ **CRÍTICO**: Nunca expor token em código público. Tratar como master password.
- Token permite qualquer ação na plataforma Gupy
- API não expõe CORS headers (proteção adicional)
- Gerar token com permissões mínimas necessárias

#### Uso do Token
```bash
# Header padrão
Authorization: Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Exemplo com curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.gupy.io/api/v1/jobs
```

#### Autenticação Dinâmica para Webhooks
- Suporte para tokens dinâmicos em fluxos de webhook
- Útil para integrações que precisam de segurança adicional

---

### 3.3 Endpoints Principais

#### A. Jobs (Vagas)
```
GET    /api/v1/jobs                    # Listar todas as vagas
POST   /api/v1/jobs                    # Criar nova vaga
GET    /api/v1/jobs/{jobId}            # Obter detalhes da vaga
PATCH  /api/v1/jobs/{jobId}            # Atualizar vaga
DELETE /api/v1/jobs/{jobId}            # Deletar vaga

GET    /api/v2/jobs                    # Listagem v2 (mais completa)
```

**Campos principais de Job:**
- Job ID
- Title (Título da vaga)
- Description (Descrição)
- Department (Departamento)
- Workflow ID (Processo seletivo)
- Status (Aberta, Fechada, etc.)
- CreatedAt / UpdatedAt
- Position Code (Código da posição)

---

#### B. Applications (Candidaturas)
```
GET    /api/v1/jobs/{jobId}/applications     # Listar candidaturas de uma vaga
GET    /api/v2/applications                  # Listar todas as candidaturas (v2)
POST   /api/v1/jobs/{jobId}/applications     # Submeter candidatura
GET    /api/v1/applications/{appId}          # Detalhes da candidatura
PATCH  /api/v1/applications/{appId}          # Atualizar status/dados
```

**Campos principais de Application:**
- Application ID
- Job ID
- Candidate ID
- Status (Candidato, Entrevista, Oferta, Contratado, Rejeitado, etc.)
- Created At
- Moved At (última movimentação)
- Tags (categorização)
- Candidate Info (nome, email, telefone, etc.)

---

#### C. Candidates (Candidatos)
```
GET    /api/v1/candidates                    # Listar candidatos
GET    /api/v2/candidates                    # Versão v2
POST   /api/v1/candidates                    # Criar candidato
GET    /api/v1/candidates/{candidateId}      # Detalhes do candidato
PATCH  /api/v1/candidates/{candidateId}      # Atualizar candidato
```

**Campos principais:**
- Candidate ID
- Name, Email, Phone
- LinkedIn URL
- CV URL
- Education, Experience
- Tags
- Created At

---

#### D. Career Pages (Portal de Vagas)
```
GET    /api/v1/career-pages                  # Listar portais de carreira
GET    /api/v1/career-pages/{pageId}         # Detalhes do portal
POST   /api/v1/career-pages/{pageId}/jobs    # Jobs de um portal
```

---

#### E. Departments (Departamentos)
```
GET    /api/v1/departments                   # Listar departamentos
POST   /api/v1/departments                   # Criar departamento
PATCH  /api/v1/departments/{deptId}          # Atualizar
```

---

#### F. Job Roles (Cargos)
```
GET    /api/v1/job-roles                     # Listar cargos
POST   /api/v1/job-roles                     # Criar cargo
PATCH  /api/v1/job-roles/{roleId}            # Atualizar
```

---

#### G. Branches (Filiais)
```
GET    /api/v1/branches                      # Listar filiais
POST   /api/v1/branches                      # Criar filial
PATCH  /api/v1/branches/{branchId}           # Atualizar
```

---

#### H. Users (Usuários)
```
GET    /api/v1/users                         # Listar usuários
POST   /api/v1/users                         # Criar usuário
PATCH  /api/v1/users/{userId}                # Atualizar usuário
DELETE /api/v1/users/{userId}                # Deletar usuário
```

---

#### I. Email Templates
```
GET    /api/v1/email-templates               # Listar templates
```

---

### 3.4 Webhooks (Event-Driven Integration)

#### Conceito
Webhooks são notificações de eventos. Quando algo acontece em Gupy, um JSON é enviado para sua URL registrada.

#### Configuração
```
POST   /api/v1/webhooks                      # Criar webhook
GET    /api/v1/webhooks                      # Listar webhooks
PATCH  /api/v1/webhooks/{webhookId}          # Atualizar webhook
DELETE /api/v1/webhooks/{webhookId}          # Deletar webhook
```

#### Webhook Payload Request
```json
{
  "action": "application.created|application.moved|application.completed",
  "postbackUrl": "https://seu-dominio.com/webhook/gupy",
  "status": "active|inactive",
  "techOwnerName": "Seu Nome",
  "techOwnerEmail": "seu-email@dominio.com"
}
```

#### Eventos Disponíveis
| Evento | Descrição |
|--------|-----------|
| `application.created` | Candidatura criada |
| `application.moved` | Candidatura movida entre estágios |
| `application.completed` | Candidatura concluída (contratado/rejeitado) |

#### Webhook Payload Response (Exemplo)
```json
{
  "id": "app-123456",
  "jobId": "job-789",
  "candidateId": "cand-456",
  "status": "interview",
  "statusName": "Entrevista",
  "createdAt": "2026-03-25T10:00:00Z",
  "movedAt": "2026-03-25T14:30:00Z",
  "candidate": {
    "id": "cand-456",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+55 11 99999-9999",
    "linkedinUrl": "https://linkedin.com/in/joao-silva"
  },
  "job": {
    "id": "job-789",
    "title": "Senior Developer",
    "department": "Tech"
  },
  "tags": ["frontend", "senior"]
}
```

#### Requisitos e Constraints
- URL deve ser **HTTPS, pública e acessível**
- Timeout: **30 segundos** (se não responder, é erro)
- Status esperado: **200 OK** (retornar status de recepção, não de integração)
- Retry automático: até 2 horas com delay progressivo
  - 1º tentativa: 1 minuto
  - 2-3º tentativas: 5, 15 minutos
  - 4º+ tentativas: 30 minutos (constante)

#### Exemplo de Implementação (Node.js)
```javascript
// Receber webhook
app.post('/webhook/gupy', (req, res) => {
  const payload = req.body;
  console.log('Evento recebido:', payload.action);
  console.log('Candidato:', payload.candidate.name);
  console.log('Status:', payload.status);

  // Processar dados
  // Importante: retornar 200 rapidamente
  res.status(200).json({ received: true });
});
```

---

### 3.5 Data Models / Entidades

#### Job
```json
{
  "id": "job-123",
  "title": "Senior Software Engineer",
  "description": "Procuramos dev experiente...",
  "department": "Technology",
  "positionCode": "ENG-001",
  "branch": "São Paulo",
  "workflowId": "wf-456",
  "status": "open|closed|draft",
  "createdAt": "2026-03-01T00:00:00Z",
  "updatedAt": "2026-03-25T00:00:00Z"
}
```

#### Application
```json
{
  "id": "app-123",
  "jobId": "job-456",
  "candidateId": "cand-789",
  "status": "applicant|interview|offer|hired|rejected",
  "statusName": "Entrevista",
  "createdAt": "2026-03-20T10:00:00Z",
  "movedAt": "2026-03-22T14:30:00Z",
  "tags": ["frontend", "python"],
  "comments": [
    {
      "id": "comment-1",
      "author": "Maria HR",
      "text": "Ótimo perfil",
      "createdAt": "2026-03-21T09:00:00Z"
    }
  ]
}
```

#### Candidate
```json
{
  "id": "cand-123",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+55 11 99999-9999",
  "linkedinUrl": "https://linkedin.com/in/joao-silva",
  "cvUrl": "https://...",
  "education": [
    {
      "school": "USP",
      "course": "Computer Science",
      "graduationYear": 2020
    }
  ],
  "experience": [
    {
      "company": "Tech Company",
      "position": "Developer",
      "duration": "2020-2026"
    }
  ],
  "tags": ["python", "senior"],
  "createdAt": "2026-03-15T00:00:00Z"
}
```

---

### 3.6 Rate Limiting

- **Limite**: 900 requisições por minuto por IP
- **Headers de resposta**: Indicam limite restante e tempo de reset
- **Erro**: HTTP 429 (Too Many Requests) quando limite atingido

**Estratégia recomendada:**
- Implementar backoff exponencial
- Cachear dados quando possível
- Usar batch requests para operações em massa
- Monitorar uso próximo ao limite

---

### 3.7 Error Handling

**Padrão de resposta de erro:**
```json
{
  "error": "Invalid request",
  "message": "Token is required",
  "statusCode": 400
}
```

**HTTP Status Codes comuns:**
| Code | Significado |
|------|-------------|
| 200 | OK |
| 400 | Bad Request (validação) |
| 401 | Unauthorized (token inválido/expirado) |
| 403 | Forbidden (token sem permissão) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

### 3.8 Pagination

Endpoints que retornam listas suportam paginação:

**Query Parameters:**
```
?page=1&limit=50
?offset=0&limit=50
```

**Response:**
```json
{
  "items": [...],
  "total": 1000,
  "page": 1,
  "limit": 50,
  "hasMore": true,
  "nextPageToken": "eyJ..."
}
```

---

## 4. Fluxos de Integração

### 4.1 Fluxo Completo: Recrutamento → Admissão → Folha de Pagamento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. RECRUTAMENTO & SELEÇÃO (Gupy R&S)                       │
├─────────────────────────────────────────────────────────────┤
│ • Publicar vaga                                             │
│ • Triagem com IA                                            │
│ • Entrevistas                                               │
│ • Avaliações comportamentais                                │
│ • WEBHOOK: application.completed → Status "Contratado"     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ADMISSÃO (Gupy Admissão)                                │
├─────────────────────────────────────────────────────────────┤
│ • Dados candidato transferidos automaticamente (webhook)   │
│ • Portal de admissão enviado para futuro funcionário       │
│ • Preenchimento de formulários                              │
│ • Validação automática de documentos (IA)                  │
│ • Assinatura digital de contratos                           │
│ • Status: "Pronto para Integração com Folha"              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. INTEGRAÇÃO COM FOLHA (Payroll)                          │
├─────────────────────────────────────────────────────────────┤
│ SUPORTADOS:                                                 │
│ • RM TOTVS (Nuvem + On-Premise)      [INTEGRAÇÃO PADRÃO] │
│ • ADP                                                       │
│ • Senior                                                    │
│ • Metadados                                                 │
│                                                             │
│ PROCESSO AUTOMÁTICO:                                       │
│ • FOPFunc: Dados de funcionário (PJ, CLT, Estagiário)    │
│ • FopDependData: Dados de dependentes                      │
│ • Suporte para dependentes brasileiros e estrangeiros      │
│ • Interns e Young Apprentices                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Integração com RM TOTVS (Padrão)

**Tecnologia:**
- Dataserver services (TOTVS)
- Objetos: FOPFunc (funcionário) + FopDependData (dependentes)

**Dados Transferidos:**
- Dados pessoais
- Posição/Cargo
- Unidade/Filial
- Data de admissão
- Tipo de emprego (CLT, PJ, etc.)
- Dependentes

**Benefício:**
- Integração padrão (sem custo adicional, rápido)
- Possível customização se empresa tem particularidades

**Resultado:**
- Novo funcionário já aparece em RM pronto para folha
- Redução de tempo: até 55%
- Zero rework

---

### 4.3 Integração com Educação Corporativa

**Webhook Application.Completed** dispara:
- Criação automática de trilha onboarding
- Atribuição de cursos obrigatórios (compliance, sistemas, etc.)
- Acompanhamento de conclusão

---

### 4.4 Integração com Plataformas Externas

**Ferramentas suportadas:**
- **n8n**: Webhook receptor + triggers/actions
- **Zapier**: Zap com webhook Gupy como trigger
- **Make.com**: Integração via webhook
- **LinkAPI**: Integração padronizada
- **Digibee**: Connectors nativos Gupy
- **Custom**: Qualquer plataforma que aceite HTTP POST

---

## 5. Integrações e Conectores

### 5.1 Integração com Payroll/Folha

| Sistema | Status | Método | Notas |
|---------|--------|--------|-------|
| **RM TOTVS** | ✅ Integrado | Padrão | Integração nativa, sem custo |
| **ADP** | ✅ Integrado | API | Integração via API |
| **Senior** | ✅ Integrado | API | Suporte a Senior |
| **Metadados** | ✅ Integrado | API | Integração customizável |
| **Nuvem TOTVS** | ✅ Integrado | Dataserver | Nuvem TOTVS suportada |

---

### 5.2 Integração com Sistemas RH/People Analytics

| Sistema | Status | Método |
|---------|--------|--------|
| HR Systems genéricos | ✅ Webhook | Custom |
| People Analytics | ✅ API | REST |
| Benefits platforms | ✅ Webhook | Event-driven |
| Payroll genérico | ✅ API | REST + Webhook |

---

### 5.3 Integração com Plataformas de Automação

| Plataforma | Tipo | Capacidade |
|------------|------|-----------|
| **n8n** | Low-code automation | Webhook + API nodes |
| **Zapier** | Workflow automation | Zaps com Gupy trigger |
| **Make.com** | Automation platform | Webhook receiver |
| **LinkAPI** | Integration platform | Connector oficial |
| **Digibee** | iPaaS | Connectors nativos |

---

### 5.4 GitHub & DevOps

- **Repository**: https://github.com/gupy-io/gupy-api-factory
- **API Factory**: Tools para gerar clientes API automaticamente
- Suporte para SDK em múltiplas linguagens

---

## 6. Casos de Uso e Fluxos

### 6.1 Caso 1: ATS Integrado com Folha (Empresa Média)

```
Objetivo: Automatizar ciclo completo R&S → Admissão → Folha
Timeline: 5-8 horas para integração padrão

Passos:
1. Gerar API token no Gupy (permissão: jobs, applications, webhooks)
2. Configurar webhook para application.completed
3. Webhook envia dados para RM TOTVS (nativo ou via DataServer)
4. RM cria novo funcionário automaticamente
5. Admissão usa Gupy Admissão para coleta de docs
6. Docs validados → RM recebe dados via integração padrão
7. Folha de pagamento inicia com zero rework

ROI: Redução de 55% em tempo de admissão
```

---

### 6.2 Caso 2: Analytics e Reporting (Empresa Grande)

```
Objetivo: Centralizar dados de recrutamento e clima em BI

Steps:
1. API token com permissão: applications, candidates, jobs
2. ETL job (nightly) faz GET /api/v2/applications?updated_after=X
3. Dados importados para data warehouse (Snowflake, BigQuery)
4. Dashboards conectados a BI tool (Tableau, Looker, etc.)
5. Relatórios automáticos enviados via email

Resultados:
- Time HR acesso a analytics em tempo real
- Funil de contratação visível
- Predição de turnover via Climate
- Recomendações de aumento de salário
```

---

### 6.3 Caso 3: Automação com n8n (Startup)

```
Objetivo: Automação leve sem custos altos

n8n Workflow:
1. [Trigger] Gupy Webhook: application.moved → "Entrevista"
2. [Action] Enviar email com dicas ao candidato
3. [Action] Criar event no Google Calendar
4. [Action] Notify Slack channel: #hiring
5. [Action] Log em Airtable (backup)

Custo: Grátis (n8n self-hosted)
```

---

## 7. Preços e Planos

### Estrutura de Planos

| Plano | Professional | Premium | Enterprise |
|-------|--------------|---------|-----------|
| **Ideal para** | Empresas com <50 contratações/ano | Empresas em crescimento acelerado | Grandes empresas |
| **API Access** | ❌ Não | ✅ Sim | ✅ Sim |
| **Contratações/mês** | Até 50/ano | Acelerado | Ilimitado |
| **AI Triagem** | ✅ Gaia AI | ✅ Gaia AI | ✅ Gaia AI |
| **Assessment** | ✅ Teste de perfil | ✅ Testes avançados | ✅ Customizado |
| **Workflow Approval** | ❌ | ✅ Approve vagas | ✅ Multi-level |
| **Google/Microsoft Sync** | ❌ | ✅ Sim | ✅ Sim |
| **Suporte Especializado** | Email | Standard | 24/7 + PSA |
| **Preço base** | R$ 730/mês* | A partir de R$ 2.000** | Custom |

*Contrato anual, valores de 2026
**Contrato anual, varia por volume

### Faturamento
- Baseado em: número de funcionários + vagas abertas por mês
- Ciclo: Mensal (com contrato anual para desconto)
- Pagamento: Fatura
- Contato: https://info.gupy.io/agendar-demonstracao-menu para cotação

---

## 8. Boas Práticas de Integração

### 8.1 Segurança

✅ **DO's:**
- Armazenar token em variável de ambiente (`.env`)
- Usar HTTPS em todas as chamadas
- Validar payloads de webhook (opcional: JWT signature)
- Implementar retry logic com backoff exponencial
- Logar todas as requisições para audit trail
- Rotacionar token anualmente

❌ **DON'Ts:**
- NUNCA commitar token em git
- NUNCA expor token em logs públicos
- NUNCA usar token em URLs (apenas header)
- NUNCA ignorar validação de SSL/TLS
- NUNCA chamar API diretamente do navegador (CORS bloqueado)

---

### 8.2 Performance

**Recomendações:**
- Usar pagination: máximo 50 registros por request
- Cachear dados de lookup (jobs, departments) por 24h
- Batch inserts quando possível (múltiplos usuarios em uma requisição)
- Usar webhooks em vez de polling quando possível
- Rate limit: respeitar 900 req/min (aim for 300-500 para margem)
- Async processing para operações pesadas

---

### 8.3 Error Handling

```javascript
// Exemplo: Retry com backoff exponencial
async function callGuopyAPI(endpoint, options = {}) {
  let retries = 3;
  let delay = 1000; // 1s inicial

  while (retries > 0) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${process.env.GUPY_TOKEN}`
        },
        ...options
      });

      if (response.status === 429) {
        // Rate limited
        await sleep(delay);
        delay *= 2; // Exponential backoff
        retries--;
        continue;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (retries > 0) {
        await sleep(delay);
        delay *= 2;
        retries--;
      } else {
        throw error;
      }
    }
  }
}
```

---

### 8.4 Validation & Testing

**Antes de produção:**
1. Testar webhook com dados reais (Gupy offers test endpoint)
2. Validar schema dos dados retornados
3. Testar rate limit behavior (pode usar ferramenta de load test)
4. Verificar integração end-to-end (R&S → Admissão → Folha)
5. Confirmar performance com volume esperado

---

## 9. Recursos Úteis

### Official Documentation
- **Main Portal**: https://developers.gupy.io/
- **Swagger UI**: https://api.gupy.io/api
- **Support**: https://suporte.gupy.io/

### Knowledge Base (Gupy)
- **Gupy Academy**: https://academy.gupy.io/
- **Blog RH**: https://www.gupy.io/blog
- **Learning Center**: https://info.gupy.io/

### Social & Community
- **LinkedIn**: https://www.linkedin.com/company/gupy
- **GitHub**: https://github.com/gupy-io
- **Instagram**: @gupy_

### Contato
- **Sales**: https://info.gupy.io/agendar-demonstracao-menu
- **Support (Enterprise)**: suporte@gupy.io
- **Tech Support**: https://suporte.gupy.io/s/suporte/

---

## 10. Resumo Executivo

| Aspecto | Status | Nota |
|--------|--------|------|
| **API Disponível?** | ✅ Sim | v1 + v2, Premium+ plans |
| **Webhooks?** | ✅ Sim | 3 eventos: created, moved, completed |
| **Rate Limit** | ✅ Sim | 900 req/min por IP |
| **Authentication** | ✅ Bearer Token | Não expira, por permissão |
| **Integrações Padrão** | ✅ 4 Payroll | RM TOTVS, ADP, Senior, Metadados |
| **Automação** | ✅ n8n, Zapier | Via webhook |
| **SLA/Support** | ✅ Enterprise | 24/7 com PSA |
| **Data Security** | ✅ HTTPS, Token | Compliance BR |
| **Best For** | PME-Grande | Recrutamento + Admissão |

---

## 11. Próximas Ações Recomendadas

1. **Solicitar API Token**: Acessar Gupy → Setup → Token Generation
2. **Revisar Endpoints**: Consultar https://developers.gupy.io/reference
3. **Planificar Webhook**: Decidir eventos (created, moved, completed)
4. **Selecionar Integração**: Payroll nativa vs custom via API
5. **Testar Sandbox**: Usar dados de teste antes de produção
6. **Documentar Fluxo**: Mapear processos integrados (R&S → Admissão → Folha)
7. **Setup Monitoring**: Implementar logs + alertas para falhas de integração

---

**Documento compilado em**: 25/03/2026
**Versão**: 1.0
**Mantido por**: Research & Integration Team
