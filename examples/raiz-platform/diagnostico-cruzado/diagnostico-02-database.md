# D02 -- Diagnostico Cruzado: Database & Data Layer

> **Projetos**: raiz-platform (Next.js 14) vs rAIz-AI-Prof (Vite SPA)
> **Data**: 2026-03-01
> **Escopo**: Supabase, migrations, RLS, schemas, data access, offline storage

---

## 1. Visao Geral Comparativa

| Dimensao | raiz-platform | rAIz-AI-Prof |
|----------|--------------|--------------|
| **Framework** | Next.js 14 (SSR + CSR) | Vite SPA (CSR only) |
| **Supabase Clients** | 3 (browser, server, admin) | 1 (browser singleton) |
| **DB Types file** | 29.617 linhas (gerado automaticamente) | 2.162 linhas (escrito manualmente) |
| **Migrations** | ~250 arquivos (sequencial: `001_`, `002_`...) | ~58 arquivos (ISO timestamp: `20260108000001_`) |
| **Zod Schemas** | 59+ arquivos em `src/lib/db/schemas/` + subdirs (CLM 16, Litigation 38, DPOS 9) | 0 (tipos manuais em `database.types.ts`) |
| **Repositories** | 77+ arquivos com `BaseRepository` abstrato | 0 (queries diretas via helper functions) |
| **RLS Approach** | Workspace-based + super_admin + roles | Per-user (`auth.uid() = user_id`) + helper function |
| **Offline Storage** | Nenhum | Dexie.js/IndexedDB + localStorage + SyncManager |
| **Query Interceptor** | Sim (`query-interceptor.ts` com performance tracking) | Nao |
| **Realtime** | Nao implementado na camada de dados | Sim (`realtime.ts` com RealtimeManager) |
| **Conflict Resolution** | Nao necessario (SSR com admin client) | Sim (`ConflictManager` com merge strategies) |
| **Seed Data** | Templates e configuracoes iniciais | Taxonomia de Bloom |

---

## 2. Supabase Client Patterns

### 2.1 raiz-platform: Setup SSR com 3 Clientes

```
src/lib/supabase/
  client.ts    -- Browser client (createBrowserClient, singleton)
  server.ts    -- Server client (createServerClient, cookies-based)
  admin.ts     -- Admin client (service_role, bypassa RLS)
  query-interceptor.ts -- Instrumentacao de performance
  database.types.ts    -- Tipos gerados (29.617 linhas)
```

**Pontos fortes:**
- Separacao clara de responsabilidades: browser (CSR), server (SSR), admin (API routes)
- `instrumentSupabaseClient()` envolve `.from()` para tracking automatico de queries
- Slow query detection (>200ms) com structured logging
- Singletons evitam instancias duplicadas
- `database.types.ts` e gerado pelo CLI do Supabase (type-safe com Row/Insert/Update)

**Pontos fracos:**
- Admin client usa `getAdminClient()` global -- nao e injetado, dificultando testes
- `BaseRepository` sempre usa admin client (bypassa RLS por padrao)

### 2.2 rAIz-AI-Prof: Browser Client Unico

```
lib/supabase.ts          -- Re-exports e singleton wrapper
lib/supabase/
  client.ts              -- Cliente tipado com helpers CRUD
  init.ts                -- Inicializacao pos-login + migracao
  sync-manager.ts        -- Sync offline-first (push/pull)
  data-service.ts        -- Camada de abstracao localStorage-first
  realtime.ts            -- Subscriptions em tempo real
  adapter-factory.ts     -- Factory para sync adapters por modulo
  module-adapters.ts     -- Adapters pre-configurados
  database.types.ts      -- Tipos manuais (2.162 linhas)
```

**Pontos fortes:**
- Arquitetura offline-first completa: localStorage -> SyncManager -> Supabase
- `DataService` como camada de abstracao unificada (localStorage + Supabase)
- `ConflictManager` para resolucao de conflitos durante sync
- `RealtimeManager` para subscriptions em tempo real
- `create_standard_policies()` como helper DRY para RLS
- `initializeSupabase()` com fluxo completo de migracao local -> cloud

**Pontos fracos:**
- `database.types.ts` escrito manualmente -- desincroniza com schema SQL
- Sem query interceptor ou monitoring de performance
- Sem client server-side (limitacao inerente ao Vite SPA)
- `DataService` usa `as never` e casts frequentes para contornar tipagem

---

## 3. Migration Naming & Conventions

### 3.1 Comparacao de Convencoes

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Formato** | Sequencial: `001_name.sql` a `258_name.sql` | ISO Timestamp: `20260108000001_name.sql` |
| **Quantidade** | ~250 (+ 5 `step_` nao numeradas + `_duplicate_versions/`) | ~58 ativas (+ 7 `.bak` files) |
| **Tamanho total** | `full_migration.sql`: 436KB, `full_migration_safe.sql`: 444KB | Sem consolidacao |
| **Gaps na numeracao** | Sim (ex: 060 -> 130, 136b) | Nao (timestamps sao unicos) |
| **Duplicatas** | Pasta `_duplicate_versions/` com 4+ arquivos | `_ALL_MIGRATIONS_CONSOLIDATED.sql.bak` |
| **Prefixo especial** | `step1_` a `step5_` (migrations de refactoring) | `bncc_data_splits/` (dados grandes divididos) |
| **Verificacao** | `verify_migrations.sql` (32KB) | Nenhuma |

### 3.2 Problemas Identificados

**raiz-platform:**
- Gap de numeracao 060 -> 130 sugere reorganizacao incompleta
- Migrations `step_*` fora da sequencia numerica criam ambiguidade na ordem de execucao
- `136b_litigation_add_business_unit_id.sql` usa sufixo `b` -- nao e convencao padrao
- `_duplicate_versions/` indica conflitos historicos nao resolvidos

**rAIz-AI-Prof:**
- 7 arquivos `.bak` poluindo o diretorio de migrations
- `005_application_logs.sql.bak` sem migration ativa correspondente
- `_ALL_MIGRATIONS_CONSOLIDATED.sql.bak` indica tentativa abandonada de consolidacao

---

## 4. RLS (Row Level Security)

### 4.1 raiz-platform: Workspace-based + Roles

**Arquitetura:**
```
auth.uid() -> users.id -> workspace_members -> workspace_id -> dados
```

**Funcoes helper:**
- `is_super_admin()` -- verifica se usuario e super admin
- `is_workspace_member()` -- verifica membership em workspace (inferido dos patterns)
- Policies usam subqueries com JOINs em `workspace_members`

**Exemplo de policy (users_select):**
```sql
CREATE POLICY users_select ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = users.id
    )
  );
```

**Cobertura:** 68+ migrations referenciam funcoes de RLS. Policies em praticamente todas as tabelas.

### 4.2 rAIz-AI-Prof: Per-user + Helper Function

**Arquitetura:**
```
auth.uid() = user_id (direto)
```

**Funcao helper DRY:**
```sql
CREATE OR REPLACE FUNCTION create_standard_policies(table_name TEXT)
-- Cria automaticamente SELECT, INSERT, UPDATE, DELETE
-- Todas baseadas em: auth.uid() = user_id
```

**Aplicacao em massa:**
```sql
SELECT create_standard_policies('questions');
SELECT create_standard_policies('exams');
-- ... 16 tabelas com politica padrao
```

**Evolucao:** Migrations posteriores (`20260110000003_update_rls_policies.sql`, `20260110000005_improve_rls_and_performance.sql`, `20260114000006_rls_policies.sql`, `20260225000001_p0_security_fixes.sql`, `20260226000004_restrict_rls_policies.sql`) indicam refinamento iterativo das policies.

### 4.3 Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Modelo** | Workspace-based (multi-tenant B2B) | User-based (individual) + org context |
| **Super Admin** | Sim (`is_super_admin()`) | Admin role simples |
| **Helper functions** | `is_super_admin()`, subqueries complexas | `create_standard_policies()` (DRY) |
| **Granularidade** | Per-workspace com roles (owner, admin, member) | Per-user com org hierarchy |
| **Complexidade** | Alta (JOINs em policies, role-based WITH CHECK) | Baixa-Media (direto ou via org JOIN) |
| **Multi-tenancy** | Via workspace_members | Via school_brands -> school_units -> segments -> classes |
| **Audit trail** | Policy dedicada para audit_logs | Nao mencionado em RLS |

---

## 5. Data Access Patterns

### 5.1 raiz-platform: Repository Pattern

**Estrutura:**
```
src/lib/db/
  repositories/
    base.repository.ts      -- Classe abstrata com CRUD generico
    *.repository.ts          -- 40+ repos top-level
    clm/                     -- 15 repos (Contract Lifecycle Management)
    dpos/                    -- 7 repos (Digital Advertising)
    litigation/              -- 38 repos (Gestao Juridica)
  schemas/
    *.schema.ts              -- 59+ schemas Zod top-level
    clm/                     -- 16 schemas
    litigation/              -- 38 schemas
    dpos/                    -- 9 schemas
    external/                -- 2 schemas (Google, HubSpot)
```

**BaseRepository abstrato:**
```typescript
abstract class BaseRepository<T extends DbBaseRow> {
  protected supabase: SupabaseClient<Database>;
  protected abstract tableName: string;

  async findById(id: string, columns?: string[]): Promise<T | null>
  async findAll(options?: { columns?, pagination?, sort?, filters? }): Promise<DbPaginatedResult<T>>
  async create(data): Promise<T>
  async update(id, data): Promise<T | null>
  async delete(id): Promise<boolean>
  async bulkCreate(items): Promise<T[]>
  async bulkUpdate(ids, data): Promise<number>
  async bulkDelete(ids): Promise<number>
  async exists(id): Promise<boolean>
  async count(filters?): Promise<number>
}
```

**Observacoes:**
- Repository SEMPRE usa admin client (bypassa RLS) -- seguranca depende das API routes
- `coerceRow<T>()` e `coerceRows<T>()` centralizam casts de tipo
- Paginacao built-in com `DbPaginatedResult<T>`
- Column selection para otimizar bandwidth

### 5.2 rAIz-AI-Prof: Direct Queries + DataService

**Camadas:**
```
lib/supabase/client.ts     -- Helpers tipados: from(), fetchAllForUser(), insert(), update(), etc.
lib/supabase/data-service.ts -- DataService class (localStorage-first)
lib/supabase/adapter-factory.ts -- Factory para adapters de sync
lib/supabase/module-adapters.ts -- Adapters pre-configurados por modulo
```

**DataService (offline-first):**
```typescript
class DataService<T extends DataItem> {
  getAll(): T[]              // Le do localStorage (sincrono)
  getById(id): T | null
  create(item): T            // Salva local + enfileira sync
  update(id, patch): T | null
  delete(id): boolean
  async sync(): Promise<{added, updated, removed}>  // Pull + merge
  async pushAll(): Promise<boolean>                   // Force push
}
```

**Helpers diretos no client:**
```typescript
export function from<T extends TableName>(table: T)
export async function fetchAllForUser<T>(table: T): Promise<ListResult<TableRow<T>>>
export async function fetchById<T>(table: T, id: string): Promise<DataResult<TableRow<T>>>
export async function insert<T>(table: T, data): Promise<DataResult<TableRow<T>>>
export async function update<T>(table: T, id, data): Promise<DataResult<TableRow<T>>>
export async function fetchWithFilters<T>(table, filters, options): Promise<ListResult<TableRow<T>>>
```

---

## 6. Schema Validation

### 6.1 raiz-platform: Zod Schemas (122+ arquivos)

**Contagem:**
| Dominio | Schemas | Exemplos |
|---------|---------|----------|
| Core | 59 | chat, message, settings, rag, dashboard, prediction |
| CLM | 16 | contract, clause, approval, compliance, financial |
| Litigation | 38 | case, entity, strategy, settlement, copilot |
| DPOS | 9 | media-entity, experiment, creative-asset |
| External | 2 | google, hubspot |
| **Total** | **124** | |

**Pattern padrao:**
```typescript
// Variantes: schema principal + create + update
export const createChatRoomSchema = z.object({
  name: z.string().min(1).max(100).trim().transform(val => val.toLowerCase()),
  type: chatRoomTypeSchema,
  description: z.string().max(500).optional().nullable(),
  // ...
});
export type CreateChatRoom = z.infer<typeof createChatRoomSchema>;
```

### 6.2 rAIz-AI-Prof: Typed Client (sem Zod)

**Abordagem:**
- Tipos manuais em `database.types.ts` (2.162 linhas)
- Interfaces TypeScript puras (sem validacao runtime)
- `TableName`, `TableRow<T>`, `TableInsert<T>`, `TableUpdate<T>` como generics
- Zod usado apenas no sync-queue (`SyncOperationSchema`)

**Exemplo:**
```typescript
export interface Question {
  id: string;
  user_id: string;
  status: QuestionStatus;
  question_data: Json;
  disciplina: string | null;
  bncc_codes: string[];
  // ...
}
```

### 6.3 Risco de Desincronizacao

| Projeto | Risco | Motivo |
|---------|-------|--------|
| raiz-platform | Baixo | `database.types.ts` gerado pelo CLI (29.617 linhas). Zod schemas sao camada adicional |
| rAIz-AI-Prof | **Alto** | `database.types.ts` escrito manualmente. Qualquer migration nova requer update manual |

---

## 7. Offline Storage & Sync (rAIz-AI-Prof exclusivo)

### 7.1 Arquitetura de 3 Camadas

```
Camada 1: localStorage (sincrono, rapido, 5MB limite)
    |
Camada 2: IndexedDB/Dexie (assincrono, GBs, queries)
    |
Camada 3: Supabase (cloud, authoritative)
```

### 7.2 Componentes

| Componente | Arquivo | Funcao |
|-----------|---------|--------|
| **Storage** | `lib/storage.ts` | Facade para localStorage |
| **IndexedDB** | `lib/storage/indexeddb.ts` | Dexie DB com 9 stores (questions, lessonPlans, peis, games, presentations, mindmaps, logs, syncQueue, keyValue) |
| **SyncManager** | `lib/supabase/sync-manager.ts` | Orquestra push/pull. Auto-sync a cada 30s. Online/offline detection |
| **DataService** | `lib/supabase/data-service.ts` | Abstracoes CRUD offline-first com sync enfileirado |
| **SyncQueue** | `lib/storage/sync-queue.ts` | Fila persistente em IndexedDB (Dexie) com prioridade e retry |
| **OfflineQueue** | `lib/offline/offline-queue.ts` | Fila offline com operacoes CREATE/UPDATE/DELETE/SYNC |
| **ConflictManager** | `lib/sync/conflict-resolution.service.ts` | Resolucao de conflitos local vs remoto |
| **Realtime** | `lib/supabase/realtime.ts` | Subscriptions PostgreSQL changes |
| **AdapterFactory** | `lib/supabase/adapter-factory.ts` | Factory para adapters de sync por modulo |

### 7.3 Fluxo de Sync

```
1. Usuario cria/edita item
2. DataService salva em localStorage (imediato)
3. SyncManager.addPendingOperation() enfileira operacao
4. A cada 30s (ou ao reconectar):
   a. syncAll() processa operacoes pendentes (push)
   b. pullAll() busca dados novos do server (pull)
   c. ConflictManager resolve conflitos (local dirty vs remote)
5. RealtimeManager notifica mudancas instantaneas
```

### 7.4 Problemas Observados

- **Duplicacao:** Existe `SyncQueue` (IndexedDB) E `SyncManager.pendingOperations` (localStorage) -- duas filas concorrentes
- **OfflineQueue** vs **SyncQueue** -- duas implementacoes paralelas com responsabilidades sobrepostas
- **DataService** gera IDs com `table_${Date.now()}_random` -- nao e UUID, pode conflitar no Supabase

---

## 8. Database Schema Complexity

### 8.1 raiz-platform

| Metrica | Valor |
|---------|-------|
| Migrations | ~250 |
| Tabelas estimadas | 150+ |
| Dominios | 12+ (Chat, CLM, Litigation, DPOS, Social, RAG, TOTVS, WhatsApp, etc.) |
| Extensions | `uuid-ossp`, `pgvector`, `pg_trgm` (inferido) |
| Functions/RPCs | 20+ (`is_super_admin`, `match_agent_memories`, `clean_expired_*`, etc.) |
| Triggers | Auto-update `updated_at`, audit logging, user profile sync |
| Full migration SQL | 444KB |
| Vector columns | Sim (embeddings 1536-dim para agent memory, messages, RAG) |

**Modulos de banco:**
- Core: users, workspaces, workspace_members, threads, messages, files
- Chat: chat_rooms, chat_messages, chat_members, chat_presence, chat_typing, chat_notifications
- CLM: 15+ tabelas (contracts, clauses, approvals, compliance, financial, obligations, signatures, templates, workflows)
- Litigation: 30+ tabelas (cases, entities, strategies, settlements, copilot, analytics)
- DPOS: 10+ tabelas (media_entities, experiments, creative_assets, council_sessions)
- Social Media: 10+ tabelas (posts, automation, inbox, sources, reports, competitors)
- RAG: documents, chunks, folders, configs, quotas, feedback, batch_jobs
- Automations: automations, automation_runs
- Analytics: analyses, predictions, dashboards, feature_store
- Agent: agent_memory, reflexion_entries, workflow_checkpoints, thread_summary_segments
- Integrations: external_integrations, mcp_servers, registry_tools

### 8.2 rAIz-AI-Prof

| Metrica | Valor |
|---------|-------|
| Migrations | ~58 ativas |
| Tabelas estimadas | 35-40 |
| Dominios | 5+ (Questions, Planning, Multi-tenancy, BNCC, Students) |
| Extensions | `uuid-ossp` (inferido) |
| Functions/RPCs | 5+ (`handle_new_user`, `create_standard_policies`, etc.) |
| Triggers | `on_auth_user_created`, auto-update `updated_at` |
| Vector columns | Nao |

**Modulos de banco:**
- Core: user_profiles, user_settings, questions, exams, exam_questions
- Content: pei_documents, chat_sessions, games, presentations, mindmaps, lesson_plans, essay_corrections, essay_prompts, adapted_exams, support_materials
- Planning: school_plans, plan_scope, planning_templates, session_assessments
- Multi-tenancy: school_brands, school_units, educational_segments, classes, user_organizations, organization_configs
- Students: students (normalizado), student_performance, session_files
- BNCC: bncc_items, bloom_taxonomy
- Analytics: quality_metrics_daily, improvement_analytics, application_logs, llm_usage_tracking
- Sync: sync_metadata, shared_items
- Collaboration: collaboration tables, report_schedules, user_feedback

---

## 9. Gaps Identificados

### 9.1 Gaps no rAIz-AI-Prof (precisaria adotar do raiz-platform)

| # | Gap | Impacto | Arquivo de Referencia (raiz-platform) |
|---|-----|---------|--------------------------------------|
| G1 | Sem `database.types.ts` gerado automaticamente | Desincronizacao schema SQL <-> tipos TS | `src/lib/supabase/database.types.ts` |
| G2 | Sem Repository Pattern | Queries espalhadas, sem camada de abstracao server-side | `src/lib/db/repositories/base.repository.ts` |
| G3 | Sem Zod schemas para validacao runtime | Dados invalidos podem atingir o banco | `src/lib/db/schemas/*.schema.ts` |
| G4 | Sem query interceptor / performance monitoring | Sem visibilidade de queries lentas | `src/lib/supabase/query-interceptor.ts` |
| G5 | Sem audit trail (trigger de auditoria) | Sem rastreabilidade de mudancas | Migration `audit_logs` |
| G6 | Filas de sync duplicadas (SyncQueue + SyncManager + OfflineQueue) | Operacoes podem ser processadas duas vezes ou perdidas | N/A |
| G7 | Geracao de IDs nao-UUID no DataService | Conflitos potenciais com UUIDs do Supabase | `DataService.generateId()` |
| G8 | `.bak` files no diretorio de migrations | Poluicao, risco de execucao acidental | `supabase/migrations/*.bak` |

### 9.2 Gaps no raiz-platform (precisaria adotar do rAIz-AI-Prof)

| # | Gap | Impacto | Arquivo de Referencia (rAIz-AI-Prof) |
|---|-----|---------|--------------------------------------|
| G9 | Sem offline support | Indisponibilidade se rede cair | `lib/supabase/sync-manager.ts`, `lib/supabase/data-service.ts` |
| G10 | Sem Realtime subscriptions na camada de dados | Dados podem ficar stale em abas abertas | `lib/supabase/realtime.ts` |
| G11 | Sem `create_standard_policies()` helper | RLS policies repetitivas e propensas a erro | Migration `20260108000002_row_level_security.sql` |
| G12 | BaseRepository sempre usa admin client | RLS bypassed por default, seguranca depende de API routes | `src/lib/db/repositories/base.repository.ts` |
| G13 | Gaps na numeracao de migrations (060->130) | Confusao sobre ordem de execucao | N/A |

### 9.3 Gaps Compartilhados

| # | Gap | Impacto |
|---|-----|---------|
| G14 | Nenhum projeto usa migration tooling automatizado (ex: `supabase db diff`) | Migrations manuais propensas a erro |
| G15 | Nenhum projeto tem testes de integracao para migrations | Regressoes de schema nao detectadas |
| G16 | Ambos tem `config.toml` identicos (sem customizacao) | Oportunidade perdida de otimizacao |

---

## 10. Oportunidades Priorizadas

### P0 -- Critico (resolver imediatamente)

| ID | Oportunidade | Projeto | Esforco | Detalhes |
|----|-------------|---------|---------|----------|
| **O1** | Gerar `database.types.ts` automaticamente no rAIz-AI-Prof | rAIz | 2h | Usar `supabase gen types typescript` para gerar os tipos. Atualmente 2.162 linhas manuais vs 29.617 geradas no raiz-platform. Risco de desincronizacao e alto. |
| **O2** | Unificar filas de sync no rAIz-AI-Prof | rAIz | 4h | Existem 3 mecanismos concorrentes: `SyncManager.pendingOperations` (localStorage), `SyncQueue` (IndexedDB/Dexie), `OfflineQueue` (IndexedDB/Dexie). Unificar em um unico `SyncQueue` baseado em Dexie. |
| **O3** | Corrigir geracao de IDs no DataService | rAIz | 1h | Substituir `${table}_${Date.now()}_random` por `crypto.randomUUID()` para compatibilidade com Supabase UUID PKs. |
| **O4** | Adicionar audit trail no rAIz-AI-Prof | rAIz | 4h | Copiar pattern de `audit_logs` do raiz-platform. Migration + trigger de auditoria para tabelas criticas (questions, exams, school_plans). |

### P1 -- Importante (proximas 2 semanas)

| ID | Oportunidade | Projeto | Esforco | Detalhes |
|----|-------------|---------|---------|----------|
| **O5** | Adotar `create_standard_policies()` no raiz-platform | raiz | 3h | O rAIz-AI-Prof tem um helper elegante que cria policies CRUD padrao com uma unica chamada. Adaptar para suportar workspace-based RLS. |
| **O6** | Adicionar Zod schemas no rAIz-AI-Prof (tabelas criticas) | rAIz | 8h | Comecar com: questions, exams, lesson_plans, school_plans. Pattern: schema principal + createSchema + updateSchema. Referenciar `src/lib/db/schemas/chat.schema.ts`. |
| **O7** | Adicionar query interceptor no rAIz-AI-Prof | rAIz | 3h | Portar `query-interceptor.ts` do raiz-platform. Adaptar para `import.meta.env` (Vite) em vez de `process.env` (Next). |
| **O8** | Limpar migrations do rAIz-AI-Prof | rAIz | 1h | Remover 7 arquivos `.bak` e `_ALL_MIGRATIONS_CONSOLIDATED.sql.bak`. Mover para `_archived/` se necessario manter referencia. |
| **O9** | Resolver gap de numeracao no raiz-platform | raiz | 2h | Documentar o gap 060->130 com migration de comentario. Criar convencao para `step_*` files. |

### P2 -- Desejavel (proximo mes)

| ID | Oportunidade | Projeto | Esforco | Detalhes |
|----|-------------|---------|---------|----------|
| **O10** | Criar Repository layer para rAIz-AI-Prof (server-side) | rAIz | 16h | Se/quando migrar para SSR (Next.js ou Remix), adotar `BaseRepository` do raiz-platform. Enquanto for SPA, o `DataService` e suficiente. |
| **O11** | Injetar client no BaseRepository (raiz-platform) | raiz | 4h | Em vez de chamar `getAdminClient()` no construtor, receber `SupabaseClient` por injecao. Permite usar server client com RLS e facilita testes. |
| **O12** | Adicionar Realtime subscriptions no raiz-platform | raiz | 8h | Portar `RealtimeManager` do rAIz-AI-Prof. Util para chat rooms, notifications, dashboards em tempo real. |
| **O13** | Implementar verificacao automatica de migrations | Ambos | 4h | Script CI que roda `supabase db diff` e falha se houver drift entre migrations e schema real. |
| **O14** | Criar shared migration utilities package | Ambos | 8h | Package compartilhado com: `create_standard_policies()` adaptavel, helpers de audit trail, patterns de indexes. |

### P3 -- Nice to have (backlog)

| ID | Oportunidade | Projeto | Esforco | Detalhes |
|----|-------------|---------|---------|----------|
| **O15** | Consolidar `database.types.ts` gerado com Zod schemas (raiz-platform) | raiz | 16h | Gerar Zod schemas automaticamente a partir de `database.types.ts` para eliminar duplicacao. Ferramentas: `zod-prisma-types` ou custom codegen. |
| **O16** | Adicionar pgvector no rAIz-AI-Prof para RAG educacional | rAIz | 16h | Embeddings para busca semantica de questoes e planos de aula. Referenciar migrations 048-056 do raiz-platform. |
| **O17** | Unificar convencao de migration naming | Ambos | 2h | Decidir entre sequencial (raiz-platform) e ISO timestamp (rAIz-AI-Prof). Recomendacao: ISO timestamp para ambos (padrao Supabase). |

---

## 11. Patterns Reutilizaveis

### 11.1 Do raiz-platform para rAIz-AI-Prof

| Pattern | Origem | Destino | Como Adaptar |
|---------|--------|---------|-------------|
| **BaseRepository** | `src/lib/db/repositories/base.repository.ts` | Quando rAIz migrar para SSR | Substituir `getAdminClient()` por client injetado |
| **Zod Schema Convention** | `src/lib/db/schemas/chat.schema.ts` | `lib/schemas/` (novo) | Manter 3 variantes: base, create, update |
| **Query Interceptor** | `src/lib/supabase/query-interceptor.ts` | `lib/supabase/query-interceptor.ts` | Trocar `process.env` por `import.meta.env`, usar `logger.simple` |
| **Audit Trigger** | Migrations de audit_logs | Nova migration `YYYYMMDD_audit_trail.sql` | Simplificar (sem workspace_id, apenas user_id) |
| **Performance Indexes** | Migration `027_performance_indexes.sql` | Revisar migrations existentes | Garantir GIN indexes para arrays, btree para FKs |

### 11.2 Do rAIz-AI-Prof para raiz-platform

| Pattern | Origem | Destino | Como Adaptar |
|---------|--------|---------|-------------|
| **create_standard_policies()** | Migration `20260108000002` | Nova migration no raiz-platform | Adaptar para workspace-based: `is_workspace_member(table.workspace_id)` |
| **SyncManager** | `lib/supabase/sync-manager.ts` | `src/lib/sync/` (novo) | Adaptar para server-side + client-side hybrid |
| **RealtimeManager** | `lib/supabase/realtime.ts` | `src/lib/supabase/realtime.ts` | Integrar com existing observability/monitoring |
| **DataService Pattern** | `lib/supabase/data-service.ts` | Conceito de offline para features especificas | Aplicar seletivamente (chat drafts, rascunhos) |
| **Conflict Resolution** | `lib/sync/conflict-resolution.service.ts` | Se implementar offline no raiz | Estrategia de merge com metadata de versao |

---

## 12. Metricas de Complexidade

| Metrica | raiz-platform | rAIz-AI-Prof | Ratio |
|---------|--------------|--------------|-------|
| Linhas `database.types.ts` | 29.617 | 2.162 | 13.7x |
| Migrations | ~250 | ~58 | 4.3x |
| Schemas (Zod) | 124 | 0 | -- |
| Repositories | 77+ | 0 | -- |
| Tabelas estimadas | 150+ | 35-40 | 4.0x |
| Dominios de negocio | 12+ | 5+ | 2.4x |
| Complexidade RLS | Alta (workspace + roles + super admin) | Baixa-Media (per-user + org context) | -- |
| Offline capability | Nenhuma | Completa (3 camadas) | -- |
| Real-time capability | Nenhuma | Completa (subscriptions) | -- |

---

## 13. Recomendacoes Finais

### Para Convergencia de Longo Prazo

1. **Adotar ISO timestamp para migrations em ambos os projetos.** O raiz-platform deve migrar de `NNN_name.sql` para `YYYYMMDDHHMMSS_name.sql` nas proximas migrations. O padrao ISO e o default do Supabase CLI e evita gaps de numeracao.

2. **Gerar `database.types.ts` automaticamente em ambos.** O rAIz-AI-Prof deve parar de manter tipos manuais e adotar `supabase gen types typescript --local` no CI. Adicionar como step pre-build.

3. **Criar package compartilhado de database utilities.** Funcoes como `create_standard_policies()`, helpers de audit trail, e patterns de indexes podem viver em um monorepo ou package npm privado.

4. **Unificar validacao:** Ambos os projetos devem ter Zod schemas para tabelas criticas. No raiz-platform isso ja existe. No rAIz-AI-Prof e um gap P1.

5. **Repository pattern quando houver server-side.** O raiz-platform ja tem. O rAIz-AI-Prof nao precisa enquanto for SPA puro, mas se migrar para SSR, deve adotar o `BaseRepository` com injecao de client.

### Matriz de Decisao: O Que Copiar de Onde

```
raiz-platform -----> rAIz-AI-Prof
  [x] Zod schemas (O6)
  [x] Query interceptor (O7)
  [x] Audit trail (O4)
  [x] database.types.ts gerado (O1)
  [ ] Repository pattern (quando SSR)

rAIz-AI-Prof -----> raiz-platform
  [x] create_standard_policies() (O5)
  [x] RealtimeManager (O12)
  [ ] SyncManager (se precisar offline)
  [ ] DataService (seletivamente)
```

---

## Apendice A: Arquivos-Chave por Projeto

### raiz-platform
```
D:\GitHub\raiz-platform\src\lib\supabase\client.ts
D:\GitHub\raiz-platform\src\lib\supabase\server.ts
D:\GitHub\raiz-platform\src\lib\supabase\admin.ts
D:\GitHub\raiz-platform\src\lib\supabase\query-interceptor.ts
D:\GitHub\raiz-platform\src\lib\supabase\database.types.ts
D:\GitHub\raiz-platform\src\lib\db\repositories\base.repository.ts
D:\GitHub\raiz-platform\src\lib\db\schemas\chat.schema.ts
D:\GitHub\raiz-platform\src\lib\db\CLAUDE.md
D:\GitHub\raiz-platform\supabase\migrations\002_core_tables.sql
D:\GitHub\raiz-platform\supabase\migrations\011_rls_policies.sql
D:\GitHub\raiz-platform\supabase\config.toml
```

### rAIz-AI-Prof
```
D:\GitHub\rAIz-AI-Prof\lib\supabase.ts
D:\GitHub\rAIz-AI-Prof\lib\supabase\client.ts
D:\GitHub\rAIz-AI-Prof\lib\supabase\init.ts
D:\GitHub\rAIz-AI-Prof\lib\supabase\sync-manager.ts
D:\GitHub\rAIz-AI-Prof\lib\supabase\data-service.ts
D:\GitHub\rAIz-AI-Prof\lib\supabase\realtime.ts
D:\GitHub\rAIz-AI-Prof\lib\supabase\adapter-factory.ts
D:\GitHub\rAIz-AI-Prof\lib\supabase\database.types.ts
D:\GitHub\rAIz-AI-Prof\lib\storage\indexeddb.ts
D:\GitHub\rAIz-AI-Prof\lib\storage\sync-queue.ts
D:\GitHub\rAIz-AI-Prof\lib\offline\offline-queue.ts
D:\GitHub\rAIz-AI-Prof\supabase\migrations\20260108000001_initial_schema.sql
D:\GitHub\rAIz-AI-Prof\supabase\migrations\20260108000002_row_level_security.sql
D:\GitHub\rAIz-AI-Prof\supabase\migrations\20260110000001_multi_tenancy_schema.sql
D:\GitHub\rAIz-AI-Prof\supabase\config.toml
D:\GitHub\rAIz-AI-Prof\docs\adr\002-dexie-indexeddb.md
```
