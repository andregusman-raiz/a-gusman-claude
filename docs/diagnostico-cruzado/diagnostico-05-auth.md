# D05 -- Diagnostico Cruzado: Autenticacao & Autorizacao

> **Projetos**: raiz-platform (Next.js 14 SSR) vs rAIz-AI-Prof (Vite SPA)
> **Data**: 2026-03-01
> **Escopo**: Supabase Auth, RLS, RBAC, multi-tenancy, step-up auth, CLI tokens, API keys, middleware, sessoes, rotas protegidas

---

## 1. Visao Geral Comparativa

| Dimensao | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Framework** | Next.js 14 (App Router, SSR) | Vite 7 (SPA, client-side) |
| **Supabase Auth** | `@supabase/ssr` cookie-based (server+client) | `@supabase/supabase-js` JWT browser-based |
| **Auth Flow** | PKCE code exchange no servidor | OAuth implicit/PKCE no browser |
| **Session Storage** | Cookies HTTP-only (geridos pelo middleware) | localStorage (`raiz-ai-prof-auth`) |
| **Middleware Auth** | Next.js middleware (`src/middleware.ts`) com Node.js runtime | Client-side `AuthGuard` component (React) |
| **RLS Base** | Workspace-based (`is_workspace_member()`) | Per-user (`auth.uid() = user_id`) |
| **Multi-tenancy** | Organizations + Business Units + Workspaces + Brands | School Brands + Units + Segments + Classes |
| **Roles** | `admin`, `user`, `viewer` + `is_super_admin` + access levels (1-5) | `admin`, `user` + access levels (1-4) |
| **Step-up Auth** | Presente mas DESABILITADO (GL-BUG-114) | Inexistente |
| **CLI Tokens** | Device flow completo (64-char tokens, SHA-256 hash) | Inexistente |
| **API Key Auth** | Sim (`rz_dk_` prefix, rate limit, quota, IP whitelist) | Inexistente |
| **Providers OAuth** | Google, HubSpot, Google Workspace | Google, GitHub |
| **Email/Password** | Nao (SSO only) | Sim (reset password implementado) |
| **Domain Allowlist** | Via `allowed_emails` table no DB | Hardcoded em `auth_v0.config.ts` |

---

## 2. Analise Detalhada por Dimensao

### 2.1 Supabase Auth Patterns

#### raiz-platform -- SSR Cookie-Based

**Arquivos-chave**:
- `D:/GitHub/raiz-platform/src/middleware.ts` -- Middleware central de autenticacao
- `D:/GitHub/raiz-platform/src/lib/supabase/server.ts` -- Cliente SSR com cookies
- `D:/GitHub/raiz-platform/src/lib/supabase/client.ts` -- Cliente browser (singleton)
- `D:/GitHub/raiz-platform/src/app/auth/callback/route.ts` -- Code exchange server-side
- `D:/GitHub/raiz-platform/src/lib/auth/index.ts` -- Funcoes de auth (getAuthUser, requireRole, etc.)

**Fluxo de autenticacao**:
1. Usuario inicia login via Google OAuth
2. Supabase redireciona para `/auth/callback` com `code` param
3. Server-side `exchangeCodeForSession(code)` troca codigo por sessao
4. Cookies sao setados automaticamente pelo `@supabase/ssr`
5. Middleware intercepta TODAS as requests e valida sessao via `getUser()`
6. Timeout de 5s no `getUser()` para evitar travamento

**Seguranca adicional**:
- Validacao de `x-forwarded-host` contra `ALLOWED_HOSTS` (previne open redirect)
- CSP enforced em producao, report-only em dev
- HSTS com `max-age=63072000; includeSubDomains; preload`
- Fail-closed: timeout na verificacao de admin/modulos NEGA acesso

```typescript
// Padrao SSR -- D:/GitHub/raiz-platform/src/lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options))
      },
    },
  })
}
```

#### rAIz-AI-Prof -- JWT Browser-Based

**Arquivos-chave**:
- `D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.service.ts` -- Servico de auth
- `D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.store.ts` -- Zustand store
- `D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.guards.ts` -- Guards de rota
- `D:/GitHub/rAIz-AI-Prof/components/auth/AuthGuard.tsx` -- Componente de protecao
- `D:/GitHub/rAIz-AI-Prof/lib/supabase.ts` -- Cliente singleton

**Fluxo de autenticacao**:
1. Usuario clica "Entrar com Google" (ou GitHub)
2. `supabase.auth.signInWithOAuth()` redireciona para provider
3. Callback em `/auth/callback` detecta tokens automaticamente via `detectSessionInUrl`
4. `getSession()` recupera sessao do localStorage
5. `onAuthStateChange` listener atualiza Zustand store reativamente
6. AuthGuard component verifica estado do store antes de renderizar

**Particularidades**:
- Usa `getSession()` no callback (menos seguro que `getUser()` que valida com servidor)
- Verificacao de dominio pos-login (signOut automatico se dominio nao permitido)
- Limpa tokens da URL apos callback (`window.history.replaceState`)
- Suporta email/password com reset de senha (nao presente no raiz-platform)

```typescript
// Padrao SPA -- D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.service.ts
async signInWithGoogle(): Promise<AuthResult<void>> {
  const origin = window.location.origin;
  const redirectTo = `${origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'consent' } },
  });
}
```

---

### 2.2 RLS Enforcement Depth

#### raiz-platform -- Workspace-Based RLS

**Arquivo principal**: `D:/GitHub/raiz-platform/supabase/migrations/011_rls_policies.sql`

**Modelo hierarquico**:
```
Super Admin (is_super_admin())
  -> Workspace Admin (is_workspace_admin(ws_id))
    -> Workspace Member (is_workspace_member(ws_id))
      -> Individual User (auth.uid() = id)
```

**Funcoes-chave no banco**:
- `is_super_admin()` -- verifica flag global
- `is_workspace_member(ws_id)` -- verifica membership via `workspace_members`
- `is_workspace_admin(ws_id)` -- verifica role admin no workspace
- `has_organization_access(org_id)` -- verifica via `user_organizations`
- `get_user_permissions(user_id)` -- retorna permissoes completas do access level

**Exemplos de RLS**:
```sql
-- Threads: membros do workspace podem ver
CREATE POLICY threads_select ON public.threads
  FOR SELECT USING (
    public.is_super_admin()
    OR public.is_workspace_member(workspace_id)
  );

-- Users: protecao contra escalacao de privilegios
CREATE POLICY users_update ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_super_admin())
  WITH CHECK (
    (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()) AND is_super_admin = FALSE)
    OR public.is_super_admin()
  );
```

**Cobertura**: RLS habilitado em 40+ tabelas no migration 011 + tabelas adicionais em migrations subsequentes.

#### rAIz-AI-Prof -- Per-User RLS (com evolucao para Multi-Tenancy)

**Arquivos principais**:
- `D:/GitHub/rAIz-AI-Prof/supabase/migrations/20260108000002_row_level_security.sql` -- RLS base
- `D:/GitHub/rAIz-AI-Prof/supabase/migrations/20260110000003_update_rls_policies.sql` -- Multi-tenancy
- `D:/GitHub/rAIz-AI-Prof/supabase/migrations/20260226000004_restrict_rls_policies.sql` -- Restricoes P0

**Modelo base** (migration 002):
```sql
-- Padrao simples: user_id = auth.uid()
CREATE POLICY "Users can view own data" ON questions
  FOR SELECT USING (auth.uid() = user_id);
```

**Modelo evoluido** (migration 003, multi-tenancy):
```sql
-- Verifica escopo organizacional OU fallback para user_id
CREATE POLICY "Users can view data by scope" ON questions
  FOR SELECT USING (
    (brand_id IS NOT NULL AND user_has_access(auth.uid(), brand_id, unit_id, segment_id, class_id))
    OR
    (brand_id IS NULL AND user_can_access_user_data(auth.uid(), user_id))
  );
```

**Funcoes-chave**:
- `user_has_access(user_id, brand_id, unit_id, segment_id, class_id)` -- hierarquia organizacional
- `user_can_access_user_data(user_id, data_user_id)` -- acesso a dados sem contexto org

**Cobertura**: RLS habilitado em ~20 tabelas de dados + 6 tabelas organizacionais.

---

### 2.3 Permission Levels -- RBAC

#### raiz-platform -- 5-Tier Access Levels + Role-Based

**Arquivo**: `D:/GitHub/raiz-platform/supabase/migrations/062_access_levels.sql`

| Nivel | Nome | Modulos | LLMs | CLI |
|---|---|---|---|---|
| 1 | Basico | home, chat | haiku | Nao |
| 2 | Usuario | +workspaces, automations | +sonnet | Nao |
| 3 | Avancado | +programs, analises, rag | +sonnet | Nao |
| 4 | Pro | +google, hubspot | +opus, extended thinking | Sim |
| 5 | Enterprise | TUDO + admin | TUDO, sem limites | Sim |

**Controles granulares por nivel**:
- `modules_allowed` -- array de modulos acessiveis
- `settings_allowed` -- tabs de configuracao
- `llm_permissions` -- modelos permitidos, limites de tokens/custo
- `plus_menu_permissions` -- features individuais (image gen, agent, OCR, etc.)
- `jarvis_enabled` -- assistente de voz
- `cli_enabled` -- acesso via CLI/daemon

**Verificacao server-side**: `D:/GitHub/raiz-platform/src/lib/auth/validate-model-permission.ts`
```typescript
export async function validateModelPermission(userId: string, requestedModel: string | null): Promise<ModelPermissionResult> {
  const permissions = await getUserPermissions(userId)
  if (permissions.is_super_admin || permissions.has_full_access) {
    return { allowed: true, allowedModels: ['fast','balanced','powerful'], maxTier: 'powerful', canUseExtendedThinking: true }
  }
  // downgrade model se necessario
}
```

#### rAIz-AI-Prof -- 4-Tier Access Levels + Role-Based

**Arquivo**: `D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.schema.ts`

| Nivel | Label | Descricao |
|---|---|---|
| 1 | Administrador | Acesso total + configuracoes |
| 2 | Nivel 2 | Intermediario alto (configuravel) |
| 3 | Nivel 3 | Intermediario (configuravel) |
| 4 | Nivel 4 | Basico (padrao para novos users) |

**Controles**:
- `visibleItems` -- modulos de menu visiveis
- `visibleSubItems` -- submodulos visiveis
- Armazenados em localStorage (`LEVEL_PERMISSIONS_STORAGE_KEY`)
- Admin definidos via hardcoded `ADMIN_EMAILS` array

**Diferenca critica**: Niveis no rAIz sao client-side (localStorage), enquanto no raiz-platform sao server-side (banco de dados com RPC functions).

---

### 2.4 Multi-Tenancy

#### raiz-platform

**Modelo**: Organization -> Business Unit -> Workspace -> Members

**Tabelas**:
- `organizations` -- empresas/escolas do grupo
- `business_units` -- unidades de negocio
- `workspaces` -- espacos de trabalho colaborativos
- `workspace_members` -- membros com roles (owner, admin, member)
- `brands` -- marcas com members (viewer, editor, admin)

**Helpers server-side**: `D:/GitHub/raiz-platform/src/lib/auth/organization-access.ts`
- `hasOrganizationAccess()` -- via RPC `has_organization_access`
- `applyOrganizationFilter()` -- filtra queries por organizacao
- `requireOrganizationAccess()` -- throw se sem acesso
- `getUserPermissions()` -- via RPC `get_user_permissions`

**API route pattern**:
```typescript
// D:/GitHub/raiz-platform/src/lib/auth/api-helpers.ts
const auth = await requireAuthAndBusinessUnit(businessUnitId);
if (isErrorResponse(auth)) return auth;
// auth.userId, auth.businessUnitId garantidos
```

#### rAIz-AI-Prof

**Modelo**: School Brand -> School Unit -> Educational Segment -> Class

**Arquivo**: `D:/GitHub/rAIz-AI-Prof/supabase/migrations/20260110000001_multi_tenancy_schema.sql`

**Tabelas**:
- `school_brands` -- marcas de escola
- `school_units` -- unidades (FK para brand)
- `educational_segments` -- segmentos (INFANTIL, FUND_1, FUND_2, EM)
- `classes` -- turmas (3A, 5B, etc.)
- `user_organizations` -- associacao usuario-organizacao com role hierarquico
- `organization_configs` -- configuracoes com heranca

**Hierarquia de roles organizacionais**:
```
ADMIN > DIR_GERAL_PEDAGOGICO > GERAL_MARCA > GERAL_UNIDADE > PROFESSOR > ALUNO
```

**RLS organizacional**: `user_has_access()` function com cascata hierarquica:
- ADMIN/DIR_GERAL_PEDAGOGICO: acesso total
- GERAL_MARCA: acesso a todas unidades da marca
- GERAL_UNIDADE: acesso a todos segmentos da unidade
- PROFESSOR: acesso a turmas atribuidas
- ALUNO: acesso apenas a propria turma

---

### 2.5 Step-Up Authentication

#### raiz-platform -- Implementado mas DESABILITADO

**Arquivo**: `D:/GitHub/raiz-platform/src/lib/security/step-up-auth.ts`

**Status**: DESABILITADO (GL-BUG-114). Motivos documentados:
1. Storage in-memory (Map) incompativel com serverless (cold starts)
2. TOTP validation intencialmente rejeita TODOS os codigos
3. Zero callers em producao

**Design previsto**:
- Metodos: TOTP, email_code, sms_code, push
- Grace period: 15 min (skip re-auth dentro da janela)
- Challenge TTL: 5 min
- Trigger: operacoes de risco alto/medio

```typescript
export interface StepUpConfig {
  requiredForRiskLevel: 'high' | 'medium';
  methods: StepUpMethod[];
  challengeTtlMs: number;    // 5 min
  gracePeriodMs: number;     // 15 min
}
```

#### rAIz-AI-Prof -- Inexistente

Nenhuma implementacao de step-up auth. Todas as operacoes usam a sessao base.

---

### 2.6 CLI Tokens

#### raiz-platform -- Device Flow Completo

**Arquivos**:
- `D:/GitHub/raiz-platform/src/lib/services/cli-auth.service.ts` -- Servico principal
- `D:/GitHub/raiz-platform/src/app/api/auth/cli/device/route.ts` -- Gerar device code
- `D:/GitHub/raiz-platform/src/app/api/auth/cli/token/route.ts` -- Polling para token
- `D:/GitHub/raiz-platform/src/app/api/auth/cli/authorize/route.ts` -- Autorizacao no browser
- `D:/GitHub/raiz-platform/src/app/api/auth/cli/refresh/route.ts` -- Refresh token
- `D:/GitHub/raiz-platform/packages/cli/src/modules/auth.ts` -- Modulo CLI

**Device Flow**:
1. CLI chama `/api/auth/cli/device` -> recebe `device_code` + `user_code`
2. Usuario abre `verification_uri_complete` no browser
3. Usuario autoriza no browser (`/auth/cli` page)
4. CLI faz polling em `/api/auth/cli/token` com `device_code`
5. Quando autorizado, recebe `access_token` (15min) + `refresh_token` (30 dias)

**Validacao no middleware**:
```typescript
// D:/GitHub/raiz-platform/src/middleware.ts, linha 260
const CLI_TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,128}$/;
if (CLI_TOKEN_PATTERN.test(token)) {
  const tokenHash = await sha256Hex(token);
  // Busca token no banco via service_role_key
  // Se valido, seta header x-cli-user-id
}
```

**Seguranca**:
- Tokens armazenados como SHA-256 hash no banco
- Access token: 15 min TTL
- Refresh token: 30 dias
- Revogacao via `/api/auth/cli/tokens` (DELETE)
- Setup code para one-click connect (10 min TTL)

#### rAIz-AI-Prof -- Inexistente

Sem CLI, sem tokens machine-to-machine.

---

### 2.7 API Key Authentication

#### raiz-platform -- Completo com Rate Limit e Quotas

**Arquivos**:
- `D:/GitHub/raiz-platform/src/lib/auth/api-key-auth.ts` -- Validacao de API keys
- `D:/GitHub/raiz-platform/src/lib/auth/api-middleware.ts` -- Pipeline completo

**Formato**: `rz_dk_<base64url>` (prefixo 6 chars + random 20+ chars)

**Pipeline de validacao** (`runApiMiddleware`):
1. Extrair API key do header `Authorization: Bearer rz_dk_...`
2. Validar formato (prefixo + charset)
3. Autenticar via `totvs-api-factory.service`
4. Validar IP contra whitelist (CIDR suportado)
5. Checar rate limit (RPM)
6. Checar quota diaria

**Response headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1709312400
X-Quota-Limit: 1000
X-Quota-Remaining: 999
```

#### rAIz-AI-Prof -- Inexistente

Sem API externa, sem API keys.

---

### 2.8 Auth Middleware

#### raiz-platform -- Next.js Middleware (Centralizado)

**Arquivo**: `D:/GitHub/raiz-platform/src/middleware.ts` (456 linhas)

**Camadas de protecao**:

| Etapa | Descricao |
|---|---|
| 1 | Skip static files (ico, png, css, js, etc.) |
| 2 | Guard: preview deploys sem env vars -> pass through |
| 3 | Criar Supabase SSR client com cookie management |
| 4 | `getUser()` com timeout 5s |
| 5 | Rotas publicas (/login, /auth/callback, /install) -> pass com cookies |
| 6 | Rotas API publicas (/api/health, /api/auth, /api/cli, etc.) -> pass |
| 7 | Redirect usuarios logados de /login para home |
| 8 | E2E bypass em dev (cookie `e2e-bypass`) |
| 9 | Usuarios nao logados: tentar validar CLI Bearer token |
| 10 | Admin routes: verificar role com cache Redis (fail-closed) |
| 11 | Module access: verificar permissoes via `get_user_permissions` RPC (fail-closed) |
| 12 | Security headers: CSP, HSTS, X-Frame-Options, etc. |

**Features especiais**:
- Request ID para correlacao (`x-request-id`)
- Server-Timing header para DevTools
- Redis cache para roles e permissoes de modulos
- Fail-closed: timeout NEGA acesso (nunca fail-open)
- Logging condicional (skip `_next`, `chat-events`, `.json`)

#### rAIz-AI-Prof -- Client-Side AuthGuard (Descentralizado)

**Arquivo**: `D:/GitHub/rAIz-AI-Prof/components/auth/AuthGuard.tsx`

**Camadas de protecao**:

| Etapa | Descricao |
|---|---|
| 1 | Zustand store inicializa com `getSession()` |
| 2 | `onAuthStateChange` listener atualiza estado |
| 3 | AuthGuard component verifica `status === 'authenticated'` |
| 4 | `canAccessRoute()` verifica role/level/admin |
| 5 | Redirect para `/login` se nao autenticado |
| 6 | Domain check pos-login (signOut se dominio nao permitido) |

**Limitacoes**:
- Sem middleware server-side (SPA pura)
- Verificacao de auth so no client (tokens acessiveis via JS)
- Sem security headers (depende de Vercel config)
- Sem rate limiting
- Sem fail-closed (falha silenciosa)

---

### 2.9 Session Management

#### raiz-platform

| Aspecto | Implementacao |
|---|---|
| **Storage** | Cookies HTTP-only via `@supabase/ssr` |
| **Refresh** | Automatico pelo middleware (`getUser()` renova) |
| **Timeout** | 5s timeout no `getUser()` do middleware |
| **Invalidacao** | `signOut()` + log via RPC `log_user_logout` |
| **PKCE** | Code exchange server-side (`exchangeCodeForSession`) |
| **CLI tokens** | Access: 15min, Refresh: 30 dias |
| **E2E bypass** | Cookie `e2e-bypass` + `E2E_BYPASS_SECRET` em dev |

#### rAIz-AI-Prof

| Aspecto | Implementacao |
|---|---|
| **Storage** | localStorage (`raiz-ai-prof-auth`) |
| **Refresh** | `autoRefresh: true` no Supabase config |
| **Timeout** | Inatividade: 24h (`SESSION_CONFIG.inactivityTimeoutSec`) |
| **Invalidacao** | `supabase.auth.signOut()` |
| **Token handling** | `onAuthStateChange` com `TOKEN_REFRESHED` event |
| **Deduplication** | Ignora `SIGNED_IN` duplicado para mesmo user |
| **URL cleanup** | Remove tokens da URL apos callback |

---

### 2.10 Protected Routes

#### raiz-platform -- Server-Side Route Protection

```
src/middleware.ts (TODAS as rotas passam)
  |
  +-- Public: /login, /auth/callback, /install, /privacy
  +-- Public API: /api/health, /api/auth, /api/cli, /api/meet-extension
  +-- Admin: /admin/* (verificacao Redis-cached)
  +-- Module-gated: / (home), /chat, /workspaces, etc. (access level check)
  +-- API routes: auth via getAuthUser() + requireWorkspace() + requireBusinessUnit()
```

**Helpers para API routes** (`D:/GitHub/raiz-platform/src/lib/auth/index.ts`):
- `getAuthUser()` -- throw se nao autenticado
- `getOptionalAuthUser()` -- retorna null se nao autenticado
- `requireRole(['admin'])` -- verifica role
- `requireAdmin()` -- verifica has_admin_access
- `requireSuperAdmin()` -- verifica is_super_admin
- `requireWorkspaceMember(wsId)` -- verifica membership
- `requireWorkspaceAdmin(wsId)` -- verifica admin do workspace
- `requireBrandMember(brandId)` -- verifica membership de marca
- `requireBrandRole(brandId, 'editor')` -- verifica role minimo na marca
- `requireBusinessUnitMember(buId)` -- verifica membership de BU
- `requireOwnerAccess(params)` -- brand_id OU workspace_id

#### rAIz-AI-Prof -- Client-Side Route Protection

```
AppRoutes.tsx
  |
  +-- Public: /login, /auth/callback, /forgot-password, /reset-password
  +-- AuthGuard (wrapper):
      +-- Home: / (qualquer autenticado)
      +-- Dashboard: /dashboard (level1Only)
      +-- Configuracoes: /configuracoes/* (level1Only via LEVEL1_ONLY_ROUTES)
      +-- Demais modulos: qualquer autenticado
```

**Guards disponíveis** (`D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.guards.ts`):
- `canAccessRoute(pathname, user, options)` -- verificacao geral
- `canAccessAdmin(user)` -- role === 'admin'
- `isLevel1User(user)` -- accessLevel === 1
- `hasMinAccessLevel(user, minLevel)` -- comparacao numerica
- `canEditSystemSettings(user)` -- level === 1
- `canDeleteItem(user, ownerId)` -- admin ou owner
- `getRequiredRole(pathname)` -- lookup em PROTECTED_ROUTES
- `isLevel1OnlyRoute(pathname)` -- lookup em LEVEL1_ONLY_ROUTES

---

## 3. Gaps Identificados

### 3.1 Gaps Criticos (P0 -- Risco de Seguranca)

| # | Gap | Projeto | Impacto | Evidencia |
|---|---|---|---|---|
| G01 | **rAIz usa `getSession()` em vez de `getUser()`** | rAIz-AI-Prof | `getSession()` nao valida token com servidor Supabase; token expirado/revogado pode ser aceito | `auth_v0.service.ts:377` |
| G02 | **Permissoes de nivel armazenadas em localStorage** | rAIz-AI-Prof | Usuario pode manipular localStorage para escalar privilegios | `auth_v0.levels.storage.ts`, `auth_v0.levels.defaults.ts:90` |
| G03 | **Admin definidos via hardcode** | rAIz-AI-Prof | `ADMIN_EMAILS` array em `auth_v0.config.ts` requer deploy para alterar | `auth_v0.config.ts:59-63` |
| G04 | **Sem middleware server-side** | rAIz-AI-Prof | Todas as verificacoes de auth sao client-side; API routes (Vercel functions) podem ser acessadas diretamente | Arquitetura SPA |
| G05 | **RLS function SECURITY DEFINER sem search_path restrito** | rAIz-AI-Prof | `user_has_access()` e `user_can_access_user_data()` sao SECURITY DEFINER sem `SET search_path` (parcialmente corrigido em migration `20260226000001`) | `20260110000003_update_rls_policies.sql:18,86` |

### 3.2 Gaps Importantes (P1 -- Funcionalidade Faltante)

| # | Gap | Projeto | Impacto |
|---|---|---|---|
| G06 | **Step-up auth desabilitado** | raiz-platform | Operacoes sensiveis (delete account, billing, API key rotation) nao tem verificacao adicional |
| G07 | **Sem rate limiting** | rAIz-AI-Prof | APIs serverless podem ser abusadas (sem Redis/Upstash) |
| G08 | **Sem audit trail de auth events** | rAIz-AI-Prof | Login/logout nao sao registrados em tabela (apenas console.log) |
| G09 | **Sem CLI/machine-to-machine auth** | rAIz-AI-Prof | Impossibilita integracao com ferramentas externas ou automacao |
| G10 | **Sem API key auth** | rAIz-AI-Prof | Impossibilita exposicao de APIs para terceiros (LTI, SIS) |
| G11 | **Sem protecao contra open redirect** | rAIz-AI-Prof | `redirectTo` no callback nao e validado |
| G12 | **Sem E2E test auth bypass** | rAIz-AI-Prof | E2E tests precisam de credenciais reais (parcialmente endereçado com fixtures) |

### 3.3 Gaps de Melhoria (P2 -- Consistencia e Robustez)

| # | Gap | Projeto | Impacto |
|---|---|---|---|
| G13 | **Domain allowlist hardcoded vs DB** | rAIz-AI-Prof | `auth_v0.config.ts` vs raiz-platform que usa tabela `allowed_emails` |
| G14 | **Sem cache de permissoes** | rAIz-AI-Prof | Cada verificacao consulta Supabase Auth (nenhum Redis/memory cache) |
| G15 | **User profile self-healing ausente** | rAIz-AI-Prof | Se `user_profiles` row nao existe, nao e criado automaticamente |
| G16 | **Sem security headers** | rAIz-AI-Prof | CSP, HSTS, X-Frame-Options dependem de config Vercel (nao enforced no codigo) |
| G17 | **Sem request ID/correlation** | rAIz-AI-Prof | Impossibilita rastreamento de requests distribuidos |
| G18 | **`canDeleteItem` permite qualquer user** | rAIz-AI-Prof | Retorna `true` para qualquer usuario autenticado (fallback permissivo) |

### 3.4 Gaps de Evolucao (P3 -- Futuro)

| # | Gap | Projeto | Impacto |
|---|---|---|---|
| G19 | **Sem RBAC no banco para rAIz** | rAIz-AI-Prof | Roles definidos client-side; banco nao tem tabela `roles` ou `permissions` |
| G20 | **Sem invite flow** | rAIz-AI-Prof | raiz-platform tem `/auth/invite` com accept flow; rAIz nao tem |
| G21 | **Sem MFA/2FA** | Ambos | raiz-platform documenta "2FA obrigatorio" mas nao implementa; rAIz nao menciona |
| G22 | **Sem OAuth config admin** | rAIz-AI-Prof | raiz-platform tem `/api/admin/oauth-config` para gerenciar providers; rAIz usa config estatica |
| G23 | **Sem extension auth** | rAIz-AI-Prof | raiz-platform tem auth flow para Chrome extension (Meet Extension); rAIz nao tem |

---

## 4. Oportunidades Priorizadas

### P0 -- Correcoes Imediatas (Seguranca)

#### OP-01: Migrar `getSession()` para `getUser()` no rAIz
- **Arquivo**: `D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.service.ts`
- **Linhas**: 226-294 (`getSession`), 373-406 (`handleOAuthCallback`)
- **Acao**: Substituir `supabase.auth.getSession()` por `supabase.auth.getUser()` para validacao server-side do token
- **Risco**: `getSession()` retorna dados do localStorage sem validar com Supabase Auth; token expirado/revogado aceito
- **Referencia raiz-platform**: `src/middleware.ts:193-195`

#### OP-02: Mover permissoes de nivel para o banco (rAIz)
- **Arquivo atual**: `D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.levels.storage.ts`
- **Acao**: Criar tabela `access_levels` similar ao raiz-platform (`062_access_levels.sql`) e RPC function `get_user_permissions`
- **Pattern a reusar**: `D:/GitHub/raiz-platform/supabase/migrations/062_access_levels.sql`

#### OP-03: Adicionar middleware nas Vercel functions do rAIz
- **Acao**: Criar wrapper `withAuth()` para API routes que valida JWT server-side
- **Pattern a reusar**: `D:/GitHub/raiz-platform/src/lib/auth/api-helpers.ts` (requireAuthAndBusinessUnit pattern)

#### OP-04: Corrigir `canDeleteItem` permissivo
- **Arquivo**: `D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.guards.ts:164-178`
- **Acao**: Remover fallback `return true` e exigir ownership ou admin

### P1 -- Melhorias Importantes

#### OP-05: Implementar audit trail de auth no rAIz
- **Pattern a reusar**: raiz-platform registra login/logout via RPC `log_user_logout`
- **Acao**: Criar tabela `auth_events` (event_type, user_id, ip, user_agent, timestamp)
- **Referencia**: `D:/GitHub/rAIz-AI-Prof/supabase/migrations/20260108000003_audit_logs.sql`

#### OP-06: Migrar domain allowlist para banco no rAIz
- **Arquivo atual**: `D:/GitHub/rAIz-AI-Prof/domain/auth/v0/auth_v0.config.ts:30-48`
- **Acao**: Criar tabela `allowed_domains` com CRUD admin
- **Pattern raiz-platform**: tabela `allowed_emails` (migration 069)

#### OP-07: Ativar step-up auth no raiz-platform
- **Arquivo**: `D:/GitHub/raiz-platform/src/lib/security/step-up-auth.ts`
- **Prerequisitos**: (1) Redis storage, (2) TOTP library (otplib), (3) Security review
- **Acao**: Resolver GL-BUG-106 e GL-BUG-114

#### OP-08: Adicionar security headers via Vercel config no rAIz
- **Pattern a reusar**: CSP, HSTS, X-Frame-Options do middleware raiz-platform
- **Arquivo**: `D:/GitHub/raiz-platform/src/middleware.ts:102-129`
- **Acao**: Adicionar `headers` em `vercel.json` ou criar middleware Vercel

#### OP-09: Implementar rate limiting no rAIz
- **Pattern a reusar**: Upstash Redis rate limit do raiz-platform
- **Acao**: Adicionar Upstash Redis para rate limit em API routes criticas

### P2 -- Consistencia e Robustez

#### OP-10: Unificar modelo de RBAC entre projetos
- **raiz-platform**: 3 roles + 5 access levels + super_admin + workspace roles
- **rAIz-AI-Prof**: 2 roles + 4 access levels + 6 org roles
- **Acao**: Documentar modelo unificado para futura convergencia

#### OP-11: Implementar user profile self-healing no rAIz
- **Pattern a reusar**: `D:/GitHub/raiz-platform/src/lib/auth/index.ts:130-151` (upsert on missing)
- **Acao**: Se `user_profiles` nao existe para `auth.uid()`, criar automaticamente

#### OP-12: Adicionar open redirect protection no rAIz
- **Pattern a reusar**: `D:/GitHub/raiz-platform/src/app/auth/callback/route.ts:8-9`
  ```typescript
  const rawNext = searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'
  ```

#### OP-13: Implementar request ID/correlation no rAIz
- **Pattern a reusar**: `D:/GitHub/raiz-platform/src/middleware.ts:66-73` (generateRequestId)

### P3 -- Evolucao Futura

#### OP-14: Implementar MFA/2FA em ambos projetos
- **Prerequisito**: Supabase MFA (TOTP) ou WebAuthn
- **Acao**: Ativar via Supabase dashboard + UI components

#### OP-15: Implementar invite flow no rAIz
- **Pattern a reusar**: `D:/GitHub/raiz-platform/src/app/auth/invite/page.tsx` + API routes

#### OP-16: CLI auth para rAIz (quando necessario)
- **Pattern a reusar**: Device flow do raiz-platform
- **Arquivos**: `D:/GitHub/raiz-platform/src/lib/services/cli-auth.service.ts`

---

## 5. Patterns Reutilizaveis

### 5.1 Pattern: Server-Side Auth Validation (raiz-platform -> rAIz)

```typescript
// Pode ser adaptado para Vercel API routes do rAIz
// Fonte: D:/GitHub/raiz-platform/src/lib/auth/index.ts

export async function getAuthUser(): Promise<AuthUser> {
  const supabase = createClient(); // server-side client
  const { data: { user } } = await supabase.auth.getUser(); // VALIDA com servidor
  if (!user) throw new Error('Unauthorized');

  // Buscar profile com admin client (bypass RLS)
  const adminClient = getAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Self-healing: criar profile se nao existe
  if (!profile) {
    await adminClient.from('users').upsert({ id: user.id, email: user.email });
  }

  return mapToAuthUser(profile);
}
```

### 5.2 Pattern: Fail-Closed Permission Check (raiz-platform -> rAIz)

```typescript
// Fonte: D:/GitHub/raiz-platform/src/middleware.ts:354-373
// FAIL-CLOSED: deny access on timeout/error
const roleData = await withTimeout(checkPermission(), 3000, null);
if (roleData === null) {
  console.warn('Permission check timeout - denying access (fail-closed)');
  return deny(); // NUNCA fail-open
}
```

### 5.3 Pattern: Access Level RPC (raiz-platform -> rAIz)

```sql
-- Fonte: D:/GitHub/raiz-platform/supabase/migrations/062_access_levels.sql
-- Pode ser adaptado para o rAIz substituindo localStorage

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
  -- Busca usuario -> busca access_level -> retorna permissoes JSON
  -- Super admin = full access
  -- Sem nivel = nivel mais restritivo (fail-closed)
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 5.4 Pattern: Multi-Tenancy RLS Helper (rAIz -> raiz-platform)

```sql
-- Fonte: D:/GitHub/rAIz-AI-Prof/supabase/migrations/20260110000003_update_rls_policies.sql
-- Modelo hierarquico de roles organizacionais e' mais granular que raiz-platform

CREATE OR REPLACE FUNCTION user_has_access(
    p_user_id UUID, p_brand_id UUID, p_unit_id UUID,
    p_segment_id UUID, p_class_id UUID
) RETURNS BOOLEAN AS $$
  -- ADMIN: acesso total
  -- DIR_GERAL_PEDAGOGICO: acesso total
  -- GERAL_MARCA: acesso a unidades da marca
  -- GERAL_UNIDADE: acesso a segmentos da unidade
  -- PROFESSOR: acesso a turmas atribuidas
  -- ALUNO: acesso a propria turma
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Matriz de Risco

| Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|
| Token revogado aceito no rAIz (G01) | Alta | Critico | OP-01: usar `getUser()` |
| Escalacao de privilegios via localStorage (G02) | Media | Critico | OP-02: mover para banco |
| API routes sem auth no rAIz (G04) | Alta | Alto | OP-03: wrapper `withAuth()` |
| `canDeleteItem` permite qualquer user (G18) | Media | Medio | OP-04: exigir ownership |
| Step-up auth desabilitado (G06) | Baixa | Alto | OP-07: ativar apos prerequisites |
| Sem audit trail (G08) | Media | Medio | OP-05: tabela auth_events |
| Sem MFA (G21) | Baixa | Alto | OP-14: futuro |

---

## 7. Resumo Executivo

O **raiz-platform** possui uma arquitetura de autenticacao e autorizacao madura e robusta, com:
- Auth SSR cookie-based com middleware centralizado
- RLS workspace-based com funcoes helper no banco
- 5 niveis de acesso granulares com controle server-side de modulos, LLMs, e features
- CLI device flow e API key auth com rate limiting
- Fail-closed em todas as verificacoes
- Redis cache para performance
- Security headers completos

O **rAIz-AI-Prof** tem uma implementacao funcional mas com lacunas significativas de seguranca:
- Auth client-side com `getSession()` (nao valida com servidor)
- Permissoes armazenadas em localStorage (manipulaveis)
- Sem middleware server-side (APIs expostas)
- Admin hardcoded em codigo
- Multi-tenancy organizacional bem desenhada no banco, mas sem enforcement server-side completo

**Prioridade imediata**: Corrigir G01 (getSession -> getUser), G02 (localStorage -> DB), G04 (middleware server-side), e G18 (canDeleteItem). Estas 4 correcoes eliminam os riscos de seguranca mais criticos do rAIz-AI-Prof.

**Patterns a reusar**: O modelo de access levels do raiz-platform (migration 062) e o wrapper de API auth (`api-helpers.ts`) podem ser adaptados diretamente para o rAIz. O modelo de multi-tenancy hierarquico do rAIz (Brand -> Unit -> Segment -> Class) e mais granular e pode inspirar melhorias no raiz-platform.
