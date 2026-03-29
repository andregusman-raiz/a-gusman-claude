# Gupy Integrações — Documentação Detalhada

**Data**: 25/03/2026
**Foco**: Integrações reais (Payroll, n8n, Zapier, etc.)

---

## 1. Integração com RM TOTVS (Payroll)

### 1.1 Visão Geral

**Status**: ✅ Integração Nativa/Padrão
**Custo**: Sem custo adicional (incluído na admissão)
**Tempo setup**: 4-8 horas
**Suporta**: RM Nuvem + RM On-Premise + RM Educacional

### 1.2 Fluxo Automático

```
┌─────────────────────────────────────────────────┐
│ GUPY ADMISSÃO: Candidato move para "Pronto"    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼ (Webhook automático)
┌─────────────────────────────────────────────────┐
│ DATASERVER (TOTVS Services)                     │
│                                                 │
│ Objeto 1: FOPFunc (Funcionário)                 │
│ • RG, CPF, Nome completo                        │
│ • Data nascimento, nacionalidade                │
│ • Endereço (rua, nº, CEP, cidade)              │
│ • Cargo/Posição                                 │
│ • Data admissão                                 │
│ • Tipo contrato (CLT, PJ, Estagiário)          │
│ • Salário                                       │
│ • Filial                                        │
│                                                 │
│ Objeto 2: FopDependData (Dependentes)           │
│ • Nome dependente                               │
│ • Parentesco                                    │
│ • Data nascimento                               │
│ • CPF (se brasileiro)                           │
│                                                 │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ RM TOTVS: Novo Funcionário Criado              │
│                                                 │
│ ✅ FOPFunc criado (GCOLIGADA, GFILIAL, etc.)   │
│ ✅ Dependentes vinculados                       │
│ ✅ Pronto para folha de pagamento               │
│ ✅ Sem rework manual                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 1.3 Dados Transferidos

#### FOPFunc (Funcionário)

| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| GCOLIGADA | INT | Setup Gupy | ✅ |
| GFILIAL | INT | Setup/Vaga | ✅ |
| CHAPA | VARCHAR | Gupy gerado | ✅ |
| NOME | VARCHAR | Candidato (campo nome) | ✅ |
| SOBRENOME | VARCHAR | Candidato | ✅ |
| CPF | VARCHAR(11) | Documento validado | ✅ |
| RG | VARCHAR | Documento | ✅ |
| DATA_NASC | DATE | Formulário admissão | ✅ |
| SEXO | CHAR(1) | Formulário | ⚠️ |
| NACIONALIDADE | VARCHAR | Formulário | ⚠️ |
| NATURALIDADE | VARCHAR | Formulário | ⚠️ |
| ENDERECO | VARCHAR | Endereço admissão | ✅ |
| NUMERO | INT | Formulário | ✅ |
| COMPLEMENTO | VARCHAR | Formulário | ⚠️ |
| BAIRRO | VARCHAR | Formulário | ✅ |
| CEP | VARCHAR(8) | Validado pelo Gupy | ✅ |
| CIDADE | VARCHAR | Validado pelo Gupy | ✅ |
| UF | CHAR(2) | Validado pelo Gupy | ✅ |
| CODRG | INT | RM Coligada | ✅ |
| CODCARGO | INT | RM Coligada | ✅ |
| DTADMISS | DATE | Data na admissão | ✅ |
| TIPVINC | INT | Tipo: CLT=1, PJ=2 | ✅ |
| SALARIO | NUMERIC | Proposta/Oferta | ⚠️ |

#### FopDependData (Dependentes)

| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| CODDEP | INT | Gerado RM | ✅ |
| NOMEDEP | VARCHAR | Formulário admissão | ✅ |
| GRAUDEP | INT | Selecionado (código RM) | ✅ |
| DATNASDEP | DATE | Formulário | ✅ |
| CPFDEP | VARCHAR(11) | CPF dependente | ⚠️ |
| SEXODEP | CHAR(1) | Formulário | ⚠️ |

**Legenda**:
- ✅ Obrigatório (não preencher = erro)
- ⚠️ Recomendado (vazio = aviso, mas processa)

### 1.4 Mapeamento de Tipo de Contrato

| Gupy | RM TOTVS | Código |
|------|----------|--------|
| CLT | Dependente | 1 |
| PJ | Pessoa Jurídica | 2 |
| Estagiário | Estagiário | 3 |
| Trainee | Trainee | 4 |
| Aprendiz | Jovem Aprendiz | 5 |

### 1.5 Mapeamento de Grau de Parentesco (Dependentes)

| Dependente | Código RM |
|------------|-----------|
| Cônjuge | 1 |
| Filho | 2 |
| Enteado | 3 |
| Pai/Mãe | 4 |
| Irmão/Irmã | 5 |
| Avô/Avó | 6 |
| Neto/Neta | 7 |
| Sogro/Sogra | 8 |
| Genro/Nora | 9 |
| Outro | 10 |

### 1.6 Setup Técnico

#### Pré-requisitos
1. RM TOTVS com tabelas FOPFunc, FopDependData criadas
2. GCOLIGADA e GFILIAL identificados
3. Cargos em SRCRG mapeados
4. Integração via DataServer ativa em ambos os lados

#### Configuração no Gupy
```
Admissão → Integrações → RM TOTVS
├─ Ativar integração
├─ GCOLIGADA: [número]
├─ GFILIAL: [número]
├─ URL Dataserver: [https://...]
├─ Usuário DataServer: [user]
├─ Senha DataServer: [encrypted]
├─ Teste conexão: [Testar]
└─ Salvar
```

#### Mapeamento de Cargos
No Gupy, ao criar vaga:
```
Vaga → Informações
├─ Cargo: [selecionado]
└─ Código RM: [mapeado automaticamente de SRCRG]
```

### 1.7 Fluxo com Dependentes Estrangeiros

Gupy suporta dependentes estrangeiros:

```json
{
  "dependente": {
    "nome": "María García",
    "parentesco": "cônjuge",
    "dataNascimento": "1985-06-15",
    "nacionalidade": "Espanha",
    "cpf": null,  // Estrangeiro, sem CPF
    "passaporte": "ES123456789",  // Campo adicional
    "dataVisto": "2024-01-01"
  }
}
```

RM mapeia: Se sem CPF + nacionalidade diferente = registro com documento estrangeiro

### 1.8 Erros Comuns & Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| `CODDARGO não encontrado` | Cargo não existe em RM | Criar cargo em SRCRG, remap |
| `GCOLIGADA inválida` | Setup Gupy errado | Verificar GCOLIGADA em RM |
| `CPF duplicado` | Candidato já existe em RM | Usar CPF único ou atualizar |
| `CEP inválido` | CEP brasileiro inválido | Validar no formulário admissão |
| `DataServer timeout` | Rede lenta ou RM down | Testar conectividade RM |

### 1.9 Resultado Esperado

Após integração bem-sucedida:
```
RM TOTVS - Módulo RH
├─ Estrutura RH
│  ├─ Coligada: XYZABC
│  ├─ Filial: SP
│  └─ Funcionários: +1 novo
│
├─ Novo Funcionário
│  ├─ CHAPA: 9999
│  ├─ NOME: João Silva
│  ├─ CPF: 123.456.789-00
│  ├─ DTADMISS: 2026-03-25
│  ├─ CARGO: Senior Developer
│  ├─ SALARIO: 8.500,00
│  └─ Dependentes: 1 (Maria - Cônjuge)
│
└─ Pronto para Folha
   ├─ Calcular salário
   ├─ Gerar FGTS
   ├─ Desconto Imposto Renda
   └─ Emitir contra-cheque
```

---

## 2. Integração com ADP

### 2.1 Visão Geral

**Status**: ✅ Integrado via API
**Tipo**: REST API
**Autenticação**: OAuth 2.0
**Suporta**: ADP Workforce Now + outras soluções ADP

### 2.2 Fluxo

```
Gupy Admissão (candidato move para Pronto)
    ↓
Webhook dispara
    ↓
ADP API: POST /v1/workers
    ↓
ADP cria novo worker record
    ↓
Payroll sincroniza automaticamente
```

### 2.3 Campos Mapeados

| Gupy | ADP | Tipo |
|------|-----|------|
| nome | legalName.givenName | String |
| sobrenome | legalName.familyName | String |
| cpf | identificationNumber | String |
| dataNascimento | birthDate | ISO Date |
| email | contact.emails[0] | Email |
| telefone | contact.phones[0] | Phone |
| endereco | homeAddress | Object |

### 2.4 Configuração

```
Admissão → Integrações → ADP
├─ Client ID: [ADP OAuth ID]
├─ Client Secret: [encrypted]
├─ Endpoint: [ADP API base URL]
├─ Scope: workers:write
└─ Testar conexão
```

---

## 3. Integração com Senior RH

### 3.1 Status
✅ Integrado via API
**Tipo**: SOAP + REST (suporta ambas)
**Autenticação**: Token + usuário

### 3.2 Mapeamento

Senior RH tem módulo de Recursos Humanos com tabelas similares a TOTVS:
- RHRH001 (Funcionário)
- RHRH010 (Dependentes)

Integração automática via web service quando admissão finaliza.

---

## 4. Integração com Metadados

### 4.1 Status
✅ Integrado via API customizável

**Tipo**: REST/SOAP
**Nota**: Metadados é plataforma de integração, permite customização

Ideal para empresas com payroll customizado.

---

## 5. Integração com n8n

### 5.1 Visão Geral

**n8n**: Workflow automation open-source
**Método**: Webhook Gupy → n8n Webhook trigger
**Custo**: Grátis (self-hosted)

### 5.2 Fluxo n8n

```
┌─────────────────────────────────────────────────┐
│ 1. GUPY WEBHOOK DISPARA                         │
│    Evento: application.completed (Status=hired) │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ 2. N8N WEBHOOK RECEIVER                         │
│    URL: https://n8n.company.com/webhook/gupy   │
│    Recebe payload JSON                         │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ 3. N8N WORKFLOW ACTIONS                         │
│                                                 │
│    ├─ [IF] Status = "hired"?                    │
│    │                                             │
│    ├─ [SEND EMAIL]                              │
│    │  └─ To: candidate.email                    │
│    │  └─ Subject: Welcome aboard!               │
│    │  └─ Body: Onboarding checklist             │
│    │                                             │
│    ├─ [GOOGLE CALENDAR]                         │
│    │  └─ Create event: Onboarding meeting      │
│    │  └─ Attendees: HR + candidate              │
│    │  └─ Date: +3 days from hire date           │
│    │                                             │
│    ├─ [SLACK]                                   │
│    │  └─ Send to #hiring channel                │
│    │  └─ Message: New hire: João Silva         │
│    │  └─ Include: Profile pic, start date      │
│    │                                             │
│    ├─ [DATABASE]                                │
│    │  └─ Insert into candidates_hired table    │
│    │  └─ Include: hire date, salary, etc.      │
│    │                                             │
│    └─ [RETURN 200 OK]                           │
│       └─ Acknowledge receipt to Gupy            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 5.3 Setup n8n

#### 1. Create Webhook Node
```
New Workflow
├─ Node: Webhook
│  ├─ Method: POST
│  ├─ Path: /webhook/gupy
│  └─ Save webhook URL
```

Copy webhook URL: `https://n8n.company.com/webhook/gupy`

#### 2. Register in Gupy
```
Admissão → Integrações → Webhooks
├─ Ação: application.completed
├─ URL: https://n8n.company.com/webhook/gupy
├─ Status: Active
└─ Salvar
```

#### 3. Build Workflow

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "name": "Extract Data",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "values": [
          {
            "name": "candidateName",
            "value": "={{ $json.candidate.name }}"
          },
          {
            "name": "candidateEmail",
            "value": "={{ $json.candidate.email }}"
          },
          {
            "name": "hireDate",
            "value": "={{ $json.completedAt }}"
          }
        ]
      }
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [650, 300],
      "parameters": {
        "email": "={{ $json.candidateEmail }}",
        "subject": "Welcome to our company!",
        "textContent": "Hi {{ $json.candidateName }}, Welcome aboard!"
      }
    },
    {
      "name": "Slack Notification",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [650, 450],
      "parameters": {
        "channel": "#hiring",
        "message": "New hire: {{ $json.candidateName }} starts on {{ $json.hireDate }}"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {"node": "Extract Data", "type": "main", "index": 0}
        ]
      ]
    },
    "Extract Data": {
      "main": [
        [
          {"node": "Send Email", "type": "main", "index": 0},
          {"node": "Slack Notification", "type": "main", "index": 0}
        ]
      ]
    }
  }
}
```

### 5.4 Example Workflows

**Workflow 1: Auto-Onboarding**
```
Gupy Hire → n8n
├─ Send Welcome Email (Gmail)
├─ Create calendar event (Google Calendar)
├─ Create Slack channel (#candidate-name)
├─ Create task in Asana
├─ Log in Airtable
└─ Return 200 OK
```

**Workflow 2: Payroll Integration**
```
Gupy Admissão Completa → n8n
├─ Extract employee data
├─ Format for ADP/RM/Senior API
├─ POST to payroll system
├─ Verify creation in payroll DB
├─ Send confirmation email to HR
└─ Return 200 OK
```

**Workflow 3: Analytics**
```
Gupy Application.Moved → n8n
├─ Log to BigQuery
├─ Update recruitment dashboard
├─ Calculate metrics (time-to-hire, etc.)
├─ Send daily report
└─ Return 200 OK
```

---

## 6. Integração com Zapier

### 6.1 Visão Geral

**Zapier**: No-code automation platform
**Método**: Gupy webhook → Zapier webhook
**Custo**: Grátis (limited) ou pago (unlimited)

### 6.2 Fluxo

```
Gupy Webhook
    ↓
Zapier Webhooks by Zapier
    ↓
Zap (Action): Send to multiple apps
├─ Gmail (send email)
├─ Google Calendar
├─ Slack
├─ Airtable
├─ Stripe (invoice)
├─ PayPal
└─ etc.
```

### 6.3 Setup Zapier

#### 1. Create Zap
```
Zapier Dashboard
├─ Create → New Zap
├─ Trigger: Webhooks by Zapier
├─ Trigger Event: Catch Hook
├─ Copy Webhook URL
```

#### 2. Register Webhook in Gupy
```
Gupy → Admissão → Webhooks
├─ Action: application.completed
├─ URL: https://hooks.zapier.com/hooks/catch/...
├─ Save
```

#### 3. Test
```
Zapier:
├─ Create test application in Gupy
├─ Webhook fires
├─ Zapier receives data
├─ Test successful ✅
```

#### 4. Add Action
```
Zapier Zap:
├─ Action 1: Gmail
│  └─ Send welcome email to candidate
├─ Action 2: Google Calendar
│  └─ Create onboarding meeting
├─ Action 3: Slack
│  └─ Notify #hiring channel
└─ Turn on Zap ✅
```

---

## 7. Integração com Make.com

### 7.1 Visão Geral

**Make**: Automation platform (formerly Integromat)
**Método**: Similar a Zapier, webhook-based
**Vantagem**: Scenarios complexos, melhor para developers

### 7.2 Setup

```
Make Dashboard
├─ Create Scenario
├─ Module 1: Custom Webhook
│  └─ URL: copy to Gupy
├─ Module 2: Filter
│  └─ IF: status == "hired"
├─ Module 3: Email
│  └─ Send welcome message
├─ Module 4: Slack
│  └─ Notify channel
└─ Activate Scenario
```

---

## 8. Integração com Digibee

### 8.1 Visão Geral

**Digibee**: iPaaS brasileira
**Status**: Connectors nativos Gupy disponíveis
**Ideal para**: Integrações corporativas complexas

### 8.2 Connector Gupy (nativo)

```
Digibee Flow:
├─ Trigger: Gupy (application.completed)
├─ Transform: Extract data + map fields
├─ Action 1: Send to RM TOTVS (via API)
├─ Action 2: Send to ADP (via API)
├─ Action 3: Log to AWS S3 (audit trail)
└─ Action 4: Return 200 OK
```

---

## 9. Integração com LinkAPI

### 9.1 Visão Geral

**LinkAPI**: Plataforma de integração REST
**Tipo**: API wrapper para Gupy
**URL**: https://developers.linkapi.solutions/docs/gupy

### 9.2 Uso

```bash
# LinkAPI oferece endpoint unificado
curl -X GET "https://api.linkapi.solutions/v1/gupy/jobs" \
  -H "Authorization: Bearer LINKAPI_TOKEN"
```

**Vantagens**:
- Mesmo formato que outras APIs (consistência)
- Error handling padronizado
- Rate limiting simplificado

---

## 10. Fluxo Completo: Hiring → Onboarding → Payroll

### Cenário Real: Empresa com 500 funcionários

```
DAY 1: Manager posta vaga em Gupy
├─ Title: Senior Developer
├─ Team: Tech
├─ Salary: R$ 12.000
├─ Deadline: 15 days
└─ Workflow: Entrevista + Behavioral Test

DAY 2-14: Candidates apply
├─ Gupy AI triages (auto-rank)
├─ HR schedules interviews
├─ Webhook → n8n: Send interview reminders

DAY 14: Offers made
├─ Top 2 candidates selected
├─ Offer emailed (via Zapier)
├─ Webhook → Slack: Notify hiring team

DAY 21: Candidate accepts
├─ Application moved to "Offer Accepted"
├─ Webhook → Gupy Admissão: Auto-trigger
├─ n8n: Send digital onboarding link

DAY 22-28: Digital onboarding
├─ Candidate fills form in Gupy Admissão
├─ IA validates CPF, RG, documents
├─ E-signature collected
├─ All data validated ✅

DAY 29: Integration to payroll
├─ Gupy Admissão: Move to "Ready for Payroll"
├─ Webhook → DataServer: Send FOPFunc + FopDependData
├─ RM TOTVS: New employee created
├─ HR verifies in RM

DAY 30: Onboarding complete
├─ Employee starts work
├─ Payroll is ready to process salary
├─ Gupy Climate: Can start surveys
└─ Gupy Learning: Assign training paths

MONTH 2+: Continuous engagement
├─ Climate surveys (Pulses)
├─ Training tracking (Educação Corporativa)
├─ Performance evaluations
└─ Development plans
```

### Integrations Used

| System | Event | Method |
|--------|-------|--------|
| Gupy R&S | application.created | Webhook |
| n8n | application.moved | Webhook |
| Slack | Interview reminder | n8n action |
| Zapier | application.completed | Webhook |
| Gmail | Offer email | Zapier action |
| Gupy Admissão | Status change | Webhook |
| RM TOTVS | Ready for payroll | DataServer |
| Climate | Engagement survey | Native |

---

## 11. Troubleshooting Integrations

### Webhook Not Firing

**Check**:
1. ✅ Webhook registered in Gupy (Setup → Webhooks)
2. ✅ URL is HTTPS (not HTTP)
3. ✅ URL is publicly accessible
4. ✅ Firewall allows outbound to URL
5. ✅ Status is "Active" not "Inactive"

**Test**:
```bash
# 1. Manually trigger in Gupy UI (if available)
# 2. Check logs in receiver (n8n, Zapier, etc.)
# 3. Enable detailed logging in Gupy webhook config
```

### 401 Unauthorized

**Cause**: API token invalid/expired
**Fix**: Regenerate token in Gupy (Setup → Tokens)

### 429 Rate Limited

**Cause**: Exceeded 900 req/min
**Fix**: Implement backoff, cache data, batch requests

### Timeout (30s)

**Cause**: Webhook handler too slow
**Fix**: Return 200 OK immediately, process async

### Data Not Syncing

**Check**:
1. Webhook fired? (check logs)
2. Payload correct? (verify structure)
3. API endpoint responding? (test manually)
4. Data transformation correct? (check mapping)
5. Receiving system accepting? (check audit logs)

---

## 12. Best Practices

✅ **DO**:
- Use webhooks instead of polling
- Implement idempotency (handle duplicate events)
- Log all integrations for audit trail
- Monitor webhook deliveries
- Test with sandbox data first
- Have fallback process (manual if automation fails)
- Document mapping (Gupy fields → target system)
- Version your integrations (v1.0, v1.1, etc.)

❌ **DON'T**:
- Poll API every minute (inefficient)
- Ignore webhook failures silently
- Store sensitive data unencrypted
- Hardcode mappings (use config files)
- Skip testing with production data flow
- Mix multiple integration tools without tracking
- Ignore rate limits and retry logic

---

**For complete API reference**: See [GUPY-API-REFERENCE.md](./GUPY-API-REFERENCE.md)
**For complete research**: See [GUPY-COMPLETE-RESEARCH.md](./GUPY-COMPLETE-RESEARCH.md)
