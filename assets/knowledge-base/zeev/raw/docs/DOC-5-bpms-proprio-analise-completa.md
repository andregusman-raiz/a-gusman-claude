# DOC-5: BPMS Próprio — Análise Completa

> Análise detalhada para construção de BPMS próprio baseado na feature set do Zeev,
> ecossistema open-source disponível, e visão de implementação para a rAIz.
> Data: 2026-03-24

---

## 1. Mapa de Features do Zeev (o que um BPMS precisa fazer)

Baseado na KB (374 artigos) e API (98 endpoints) do Zeev, estas são TODAS as capacidades
que um BPMS de nível enterprise precisa oferecer:

### 1.1 Visão do Usuário Final

| Feature | Descrição | Criticidade |
|---------|-----------|-------------|
| **Abrir solicitação** | Iniciar um processo preenchendo formulário | P0 |
| **Caixa de tarefas** | Ver tarefas pendentes atribuídas a mim | P0 |
| **Executar tarefa** | Preencher formulário + concluir com ação | P0 |
| **Acompanhar solicitações** | Ver status das solicitações que abri | P0 |
| **Mensagens/menções** | Comunicar dentro de uma solicitação | P1 |
| **Encaminhar tarefa** | Redirecionar para outra pessoa | P1 |
| **Devolver solicitação** | Retornar a quem enviou | P1 |
| **Cancelar solicitação** | Cancelar um processo em andamento | P1 |
| **Consultar opinião** | Solicitar parecer de terceiro sem encaminhar | P2 |
| **Substituto/ausência** | Configurar substituto quando ausente | P2 |
| **Notificações** | Alertas por email/push sobre tarefas | P1 |
| **Mobile** | Funcionar em dispositivos móveis | P1 |
| **Anexos** | Upload de arquivos nas tarefas | P1 |
| **Assinatura eletrônica** | Assinar documentos (D4Sign, DocuSign) | P2 |
| **Filtros e busca** | Buscar solicitações por código, status, data | P1 |

### 1.2 Visão do Gestor/Monitor

| Feature | Descrição | Criticidade |
|---------|-----------|-------------|
| **Monitorar SLA** | Ver tarefas atrasadas vs no prazo | P0 |
| **Painéis nativos** | Dashboard automático por processo | P0 |
| **Painéis customizados** | Criar gráficos personalizados | P1 |
| **Relatório de solicitações** | Listar/filtrar todas as solicitações | P0 |
| **Relatório de tarefas** | Listar/filtrar todas as tarefas pendentes | P0 |
| **Exportar para Excel** | Exportar dados em planilha | P1 |
| **Monitorar equipe** | Ver tarefas de membros da equipe | P1 |
| **Custo de solicitação** | Monitorar custo total de um processo | P2 |
| **Cronoanálise** | Registro de tempo de trabalho por tarefa | P2 |
| **Logs de auditoria** | Quem fez o quê, quando | P0 |

### 1.3 Visão do Construtor de Processos (Modelagem)

| Feature | Descrição | Criticidade |
|---------|-----------|-------------|
| **Desenhador visual BPMN** | Editor drag-and-drop de fluxos | P0 |
| **Tarefa humana** | Etapa que requer ação de uma pessoa | P0 |
| **Tarefa de regra de negócio** | Lógica automática (modificar campos, calcular) | P0 |
| **Tarefa de serviço** | Integração com sistema externo (API call) | P0 |
| **Tarefa de script** | Executar código customizado (JS) | P1 |
| **Tarefa de agente IA** | Executar prompt de IA como etapa | P1 |
| **Tarefa externa** | Componente externo embeddable | P2 |
| **Gateway exclusivo** | Decisão condicional (if/else) | P0 |
| **Gateway paralelo** | Execução paralela de branches | P0 |
| **Gateway inclusivo** | N de M branches executados | P1 |
| **Evento de início** | Trigger do processo | P0 |
| **Evento de fim** | Conclusão (total ou parcial) | P0 |
| **Evento de timer** | Agendamento, deadline, recorrência | P0 |
| **Evento de mensagem** | Esperar/enviar sinal entre processos | P1 |
| **Evento de link** | Conectar pontos distantes do fluxo | P2 |
| **Evento de marco** | Checkpoint sem ação | P2 |
| **Subprocesso** | Processo filho reutilizável | P1 |
| **Swimlanes/raias** | Separação visual por papel/departamento | P1 |
| **Piscinas** | Separação de organizações | P2 |
| **Versionamento** | Versões do processo (publicar nova sem parar instâncias) | P0 |
| **Validação** | Verificar erros antes de publicar | P0 |
| **Importar/exportar** | Formato intercambiável entre ambientes | P1 |

### 1.4 Visão do Construtor de Formulários

| Feature | Descrição | Criticidade |
|---------|-----------|-------------|
| **Campos básicos** | Texto, número, data, checkbox, radio, select | P0 |
| **Texto rico** | Editor WYSIWYG | P1 |
| **Campo arquivo** | Upload com validação de extensão | P0 |
| **Campos sigilosos** | Mascaramento de dados sensíveis (LGPD) | P1 |
| **Tabelas multivaloradas** | Grid editável (linhas dinâmicas) | P1 |
| **Automação de campos** | Campo X muda → campo Y calcula | P0 |
| **Listas de opções** | Opções fixas ou dinâmicas (API) | P0 |
| **Validação** | Regex, obrigatório, range | P0 |
| **Fórmulas** | Expressões matemáticas/lógicas | P1 |
| **Campos condicionais** | Mostrar/ocultar baseado em valor | P1 |
| **Templates** | Gerar documentos (PDF/DOCX) a partir de campos | P1 |
| **Checklist** | Lista de procedimentos com check | P2 |

### 1.5 Visão de Administração

| Feature | Descrição | Criticidade |
|---------|-----------|-------------|
| **Pessoas** | CRUD de usuários, importação em massa | P0 |
| **Times** | Agrupamento organizacional | P0 |
| **Funções** | Papéis dentro dos times | P0 |
| **Grupos de permissão** | Controle de acesso por feature | P0 |
| **Superadministrador** | Acesso total ao sistema | P0 |
| **Feriados/turnos** | Calendário para cálculo de SLA | P1 |
| **Fuso horário** | Config por pessoa | P2 |
| **Internacionalização** | Multi-idioma | P2 |
| **Customização visual** | Logo, cores, tema | P1 |
| **Autenticação externa** | SSO/JWT/OAuth | P0 |
| **MFA** | Autenticação multifator | P1 |
| **Avisos de privacidade** | LGPD/compliance | P1 |

### 1.6 Visão de Integração

| Feature | Descrição | Criticidade |
|---------|-----------|-------------|
| **API REST completa** | 98 endpoints documentados | P0 |
| **Impersonação** | Agir em nome de outro usuário | P0 |
| **Integrações visuais** | Configurar chamadas API no editor | P1 |
| **Webhooks** | Notificar sistemas externos | P0 |
| **Conectores** | Power Automate, Zapier | P2 |
| **oData** | Filtros avançados nas APIs | P1 |
| **Rate limiting** | Controle de volume de requisições | P0 |
| **Cache de integrações** | Cache configurável por integração | P1 |
| **Gerar documentos** | PDF/DOCX via API | P1 |

---

## 2. Endpoints Zeev NÃO Implementados na raiz-platform

A API v2 do Zeev tem **98 endpoints**. A raiz-platform implementa apenas **~15**.
Estes são os endpoints que existem no Zeev mas NÃO estamos usando:

### 2.1 Alta Prioridade (desbloqueiam funcionalidades críticas)

| Endpoint | O que faz | Impacto |
|----------|-----------|---------|
| `GET /api/2/flows/{id}/design/elements` | **Lista elementos do desenho do processo** | Obtém a estrutura completa do fluxo |
| `GET /api/2/flows/{id}/design/form` | **Lista campos de formulário do processo** | Obtém o schema de todos os campos (não só preenchidos) |
| `GET /api/2/flows/{id}/design/users` | **Lista pessoas do desenho** | Quem pode executar cada etapa |
| `POST /api/2/instances` | **Criar nova solicitação** | Abrir processos via API |
| `PATCH /api/2/formvalues/{instanceid}` | **Atualizar campos de formulário** | Modificar dados de solicitações em andamento |
| `GET /api/2/instances/report` | **Relatório completo de solicitações** | Visão admin de todas as instâncias |
| `POST /api/2/instances/report/count` | **Contar solicitações** | Métricas globais |
| `GET /api/2/users` | **Listar todas as pessoas** | Gestão de usuários |
| `POST /api/2/messages` | **Adicionar mensagem** | Comunicação dentro de solicitações |
| `GET /api/2/messages/instance/{id}` | **Listar mensagens** | Ler comunicações |

### 2.2 Média Prioridade

| Endpoint | O que faz |
|----------|-----------|
| `GET /api/2/flows/{id}/export` | Exportar processo para formato intercambiável |
| `POST /api/2/flows/import` | Importar processo |
| `POST /api/2/instances/subprocess` | Criar subprocesso |
| `PATCH /api/2/instances/{id}/cancel` | Cancelar solicitação |
| `PATCH /api/2/instances/{id}/cancel/undo` | Reverter cancelamento |
| `POST /api/2/files/createfile` | Gerar documento PDF/DOCX |
| `POST /api/2/files/instance-task` | Anexar arquivo a tarefa |
| `PATCH /api/2/formvalues/{from}/copy-to/{to}` | Copiar dados entre instâncias |
| `GET /api/2/integrations/{uid}/execute` | Executar integração |
| `GET /api/2/teams` | Listar times |
| `GET /api/2/positions` | Listar funções |
| `GET /api/2/requests` | Listar processos que posso iniciar |

### 2.3 Baixa Prioridade (admin avançado)

| Endpoint | O que faz |
|----------|-----------|
| `POST /api/2/users` | Cadastrar pessoa |
| `DELETE /api/2/users/{id}` | Excluir pessoa |
| `PATCH /api/2/users/{id}/absent/enter|leave` | Ausência temporária |
| `PATCH /api/2/users/{id}/account/activate|deactivate|lock|unlock` | Gestão de acesso |
| `POST /api/2/users/{id}/groups/{id}` | Vincular pessoa a grupo |
| `POST /api/2/users/{id}/positions/{pid}/{tid}` | Vincular pessoa a time/função |
| `POST /api/2/users/{id}/transfer/{newid}` | Transferir propriedade de dados |
| `POST /api/2/services/import` | Importar serviço |
| `GET /api/2/groups/{id}/permissions` | Listar permissões de grupo |

---

## 3. Análise: Construir vs. Expandir

### 3.1 Cenário A — Expandir Acesso ao Zeev (2-6 semanas)

**O que fazer**: Implementar os endpoints de alta prioridade (seção 2.1) na raiz-platform.

```
Semana 1-2: Design + Form endpoints
  GET /flows/{id}/design/elements  → Estrutura do fluxo
  GET /flows/{id}/design/form      → Schema dos formulários
  GET /flows/{id}/design/users     → Responsáveis por etapa

Semana 3-4: Instances + Messages
  POST /instances                  → Abrir solicitações via plataforma
  PATCH /formvalues/{id}           → Editar dados de solicitações
  POST /messages                   → Comunicação em solicitações
  GET /messages/instance/{id}      → Ler mensagens

Semana 5-6: Users + Reports
  GET /users                       → Listar pessoas
  GET /instances/report            → Relatório completo
  POST /instances/report/count     → Contagem global
```

**Resultado**: Visibilidade total do Zeev + capacidade de abrir/editar solicitações + comunicação. Mantém Zeev como engine.

**Prós**: Esforço mínimo, zero risco de migração, usa infraestrutura existente.
**Contras**: Continua dependente do Zeev (vendor lock-in, custo da licença, limitações do produto).

### 3.2 Cenário B — BPMS Híbrido TypeScript (4-8 meses)

**Stack proposta:**

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERFACE (Next.js + shadcn)            │
│  Process Designer    │  Task Inbox    │  Admin Console      │
│  (react-flow, MIT)   │  (shadcn)      │  (shadcn)           │
├─────────────────────────────────────────────────────────────┤
│                     API (Next.js Route Handlers)            │
│  REST API  │  Webhooks  │  Agent Tool (zeev_bpm v2)         │
├─────────────────────────────────────────────────────────────┤
│                  EXECUTION ENGINE                           │
│  bpmn-engine (MIT)   │  XState (state machines, MIT)        │
│  Timers (pg-boss)    │  Rules (custom, JSON-based)          │
├─────────────────────────────────────────────────────────────┤
│                  FORM ENGINE                                │
│  JSON Schema Forms   │  react-hook-form + Zod               │
│  Dynamic rendering   │  Conditional logic                   │
├─────────────────────────────────────────────────────────────┤
│                  PERSISTÊNCIA                               │
│  PostgreSQL (Supabase)  │  Audit trail  │  RLS por org      │
│  Blob (Vercel Blob)     │  Redis (Upstash) for queues       │
├─────────────────────────────────────────────────────────────┤
│                  INTEGRAÇÕES                                │
│  n8n (workflows)  │  Webhooks  │  API REST  │  MCP Tools    │
└─────────────────────────────────────────────────────────────┘
```

**Faseamento:**

#### Fase 1: Motor + Modelagem (8-10 semanas)

| Componente | Lib/Tool | Entrega |
|-----------|----------|---------|
| Execution engine | `bpmn-engine` (MIT, 962 stars) | Interpretar/executar BPMN XML |
| Process state | PostgreSQL (Supabase) | Persistir instâncias, variáveis, histórico |
| Visual designer | `react-flow` (MIT, 35.8k stars) | Editor drag-and-drop de fluxos |
| BPMN serialization | Custom (react-flow → BPMN XML) | Salvar/carregar em formato padrão |
| Elements suportados | Tasks, Gateways (XOR, AND), Events (start, end, timer) | Core BPMN elements |

**Schema de banco (core):**

```sql
-- Definições de processo
CREATE TABLE process_definitions (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  version INT DEFAULT 1,
  bpmn_xml TEXT NOT NULL,          -- BPMN 2.0 XML
  form_schema JSONB,               -- JSON Schema dos formulários por etapa
  status TEXT DEFAULT 'draft',     -- draft, published, archived
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Instâncias (solicitações)
CREATE TABLE process_instances (
  id UUID PRIMARY KEY,
  definition_id UUID REFERENCES process_definitions(id),
  definition_version INT,
  org_id UUID NOT NULL,
  requester_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'active',    -- active, completed, cancelled, suspended
  variables JSONB DEFAULT '{}',    -- Dados do formulário
  result TEXT,                     -- Resultado final
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  lead_time_hours NUMERIC
);

-- Tarefas pendentes
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  instance_id UUID REFERENCES process_instances(id),
  element_id TEXT NOT NULL,         -- ID do elemento BPMN
  name TEXT NOT NULL,
  type TEXT DEFAULT 'human',        -- human, service, rule, script, ai
  status TEXT DEFAULT 'pending',    -- pending, active, completed, cancelled
  assignee_id UUID REFERENCES users(id),
  assignee_group TEXT,              -- Grupo responsável
  sla_deadline TIMESTAMPTZ,
  is_late BOOLEAN DEFAULT false,
  form_schema JSONB,                -- Campos específicos desta etapa
  form_data JSONB,                  -- Dados preenchidos
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  action_taken TEXT                  -- Ação de conclusão escolhida
);

-- Histórico de execução (event sourcing lite)
CREATE TABLE execution_log (
  id BIGSERIAL PRIMARY KEY,
  instance_id UUID REFERENCES process_instances(id),
  element_id TEXT,
  event_type TEXT,                  -- element_enter, element_exit, variable_set, error, timer_fired
  data JSONB,
  actor_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mensagens em solicitações
CREATE TABLE instance_messages (
  id UUID PRIMARY KEY,
  instance_id UUID REFERENCES process_instances(id),
  author_id UUID REFERENCES users(id),
  content TEXT,
  mentions UUID[],
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Anexos
CREATE TABLE instance_attachments (
  id UUID PRIMARY KEY,
  instance_id UUID REFERENCES process_instances(id),
  task_id UUID REFERENCES tasks(id),
  file_name TEXT,
  file_url TEXT,                    -- Vercel Blob URL
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Fase 2: Tarefas + Formulários (6-8 semanas)

| Componente | Lib/Tool | Entrega |
|-----------|----------|---------|
| Task inbox | shadcn (Table, Badge, Tabs) | Lista de tarefas pendentes |
| Task execution | react-hook-form + Zod | Formulário dinâmico por etapa |
| Form builder | JSON Schema + custom UI | Editor de campos para cada etapa |
| SLA engine | pg-boss (MIT) + cron | Verificar deadlines, marcar atrasos |
| Notificações | Resend (email) + push | Alertar responsáveis |
| Actions | Custom | Botões de conclusão configuráveis |

**Form engine architecture:**

```typescript
// Cada etapa do processo define seus campos via JSON Schema
interface TaskFormSchema {
  elementId: string;
  fields: FormField[];
  actions: FormAction[];         // Botões de conclusão
  conditions: FieldCondition[];  // Visibilidade condicional
  validations: FieldValidation[];
}

interface FormField {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file' | 'rich-text' | 'table' | 'checkbox';
  label: string;
  required: boolean;
  readOnly: boolean;             // Pode ser read-only em certas etapas
  options?: SelectOption[];      // Para selects
  validation?: ZodSchema;
  defaultValue?: unknown;
  formula?: string;              // Fórmula calculada
  sensitive?: boolean;           // LGPD: mascara o valor
}

interface FormAction {
  id: string;
  label: string;                 // "Aprovar", "Rejeitar", "Devolver"
  nextElement?: string;          // Para qual gateway/etapa vai
  requiresComment: boolean;
  style: 'primary' | 'destructive' | 'secondary';
}
```

#### Fase 3: Admin + Indicadores (4-6 semanas)

| Componente | Lib/Tool | Entrega |
|-----------|----------|---------|
| Dashboard SLA | Recharts + shadcn | Gráficos de performance |
| Backlog views | shadcn DataTable | Por processo, por pessoa, aging |
| User management | shadcn + Supabase Auth | CRUD de pessoas |
| Teams/roles | Custom | Organização hierárquica |
| Audit trail | execution_log table | Quem fez o quê, quando |
| Process analytics | SQL views + Recharts | Lead time, volume, tendências |

#### Fase 4: Integrações + IA (4-6 semanas)

| Componente | Lib/Tool | Entrega |
|-----------|----------|---------|
| Service tasks | n8n + webhooks | Conectar a sistemas externos |
| AI tasks | AI SDK + agent tool | Etapas executadas por IA |
| Webhook events | Next.js routes | Notificar sistemas sobre mudanças |
| REST API completa | Next.js routes | API para integrações externas |
| Import Zeev data | Migration scripts | Migrar processos existentes do Zeev |

---

## 4. Comparativo de Esforço Total

| Fase | Entrega | Esforço (2 devs) | Dependências |
|------|---------|-------------------|--------------|
| **Fase 1** | Motor + Editor Visual | 8-10 semanas | bpmn-engine, react-flow |
| **Fase 2** | Tarefas + Formulários | 6-8 semanas | Fase 1 |
| **Fase 3** | Admin + Indicadores | 4-6 semanas | Fase 2 |
| **Fase 4** | Integrações + IA | 4-6 semanas | Fase 2 |
| **Total** | BPMS funcional | **22-30 semanas** (~5-7 meses) | — |

vs. **Expandir Zeev**: 2-6 semanas para implementar endpoints faltantes.

---

## 5. Decisão: Build vs. Buy — Framework

| Critério | Expandir Zeev (A) | BPMS Próprio (B) |
|----------|-------------------|-------------------|
| **Time to value** | 2-6 semanas | 5-7 meses |
| **Custo upfront** | Baixo (dev time) | Alto (5-7 meses × 2 devs) |
| **Custo recorrente** | Licença Zeev | Hosting (Vercel + Supabase) |
| **Vendor lock-in** | Alto (Zeev controla tudo) | Zero |
| **Customização** | Limitada à API | Total |
| **IA nativa** | Limitada (Zai básica) | Total (AI SDK, agentes, LLM) |
| **UX** | Zeev UI (genérica) | shadcn/Tailwind (customizada) |
| **Multi-tenant** | Zeev gerencia | Supabase RLS por org |
| **Risco técnico** | Baixo | Médio (bpmn-engine é 962 stars) |
| **Risco de negócio** | Médio (Zeev pode mudar preços/API) | Baixo (código é seu) |
| **Migração** | Não precisa | Precisa migrar processos existentes |
| **Manutenção** | Zeev faz | Time interno |

### Recomendação Escalonada

```
AGORA (Semana 1-6):
  → Cenário A: Implementar endpoints faltantes do Zeev
  → Ganhar visibilidade total + abertura de solicitações + mensagens
  → Zero risco, máximo valor imediato

PARALELO (Mês 2-4):
  → POC do Cenário B: bpmn-engine + react-flow + 1 processo simples
  → Validar se a stack funciona para o caso de uso
  → 2 semanas de spike, sem compromisso

SE POC BEM-SUCEDIDA (Mês 4-10):
  → Construir BPMS próprio em fases
  → Migrar processos um a um do Zeev
  → Depreciar Zeev gradualmente (Strangler Fig pattern)
```

---

## 6. Referências Técnicas

### Engines

| Projeto | URL | Stars | Licença |
|---------|-----|-------|---------|
| bpmn-engine | github.com/paed01/bpmn-engine | 962 | MIT |
| bpmn-server | github.com/bpmnServer/bpmn-server | 237 | MIT |
| XState | github.com/statelyai/xstate | 29.4k | MIT |
| Temporal | github.com/temporalio/temporal | 19.1k | MIT |
| Flowable | github.com/flowable/flowable-engine | 9.1k | Apache-2.0 |
| trigger.dev | github.com/triggerdotdev/trigger.dev | 14.2k | Apache-2.0 |

### Editors

| Projeto | URL | Stars | Licença |
|---------|-----|-------|---------|
| react-flow | github.com/xyflow/xyflow | 35.8k | MIT |
| bpmn-js | github.com/bpmn-io/bpmn-js | 9.5k | Comercial |
| bpmn-visualization-js | github.com/process-analytics/bpmn-visualization-js | 280 | Apache-2.0 |

### Complementares

| Projeto | URL | Uso |
|---------|-----|-----|
| pg-boss | github.com/timgit/pg-boss | Job queue sobre PostgreSQL |
| react-hook-form | github.com/react-hook-form/react-hook-form | Form engine |
| Zod | github.com/colinhacks/zod | Validação de schemas |
| Recharts | github.com/recharts/recharts | Gráficos para dashboards |
| awesome-workflow-engines | github.com/meirwah/awesome-workflow-engines | Lista curada |
