# D03 - Diagnostico Cruzado: API Design & Error Handling

> **Data**: 2026-03-01
> **Projetos**: raiz-platform (Next.js 14) vs rAIz-AI-Prof (Vite + Vercel Serverless)
> **Escopo**: Organizacao de rotas, error handling, middleware, rate limiting, CORS/CSRF, validacao, documentacao, versionamento

---

## 1. Visao Geral Comparativa

| Dimensao | raiz-platform | rAIz-AI-Prof |
|----------|--------------|--------------|
| **Framework** | Next.js 14 App Router | Vite SPA + Vercel Serverless Functions |
| **Rotas API** | ~85+ diretorios em `src/app/api/` | ~15 arquivos em `api/` |
| **Padrao de handler** | `export const GET/POST = ...` (named exports) | `export default function handler(req, res)` |
| **Runtime** | Node.js (forcado via `runtime = 'nodejs'`) | Node.js (Vercel serverless) |
| **Autenticacao** | Supabase Auth + middleware + CLI tokens | Sem autenticacao nos endpoints |
| **Rate Limiting** | Upstash Redis + in-memory fallback | Upstash Redis + in-memory fallback |
| **CORS** | Delegado ao middleware (sem CORS explicito nas rotas) | Manual em cada handler via `setCors()` |
| **CSRF** | Sem implementacao (confia no middleware SameSite) | Double Submit Cookie + Origin/Referer validation |
| **Validacao de input** | Zod schemas em ~25+ rotas | Validacao manual (sem Zod) |
| **Error handling** | HOFs centralizados (`createRouteHandler`, `withAuth`, `handleApiError`) | Per-handler try/catch com `sendJson()` |
| **Formato de resposta** | `{ success: true/false, data/error }` padronizado | `{ ok: true/false, error }` semi-padronizado |
| **Documentacao API** | Nenhuma (OpenAPI ausente) | Nenhuma (OpenAPI ausente) |
| **Versionamento** | 1 rota versionada (`/api/v1/catalog`) | Nenhum |
| **Testes de API** | Jest para rotas individuais | 1 teste unitario (`http.test.ts`) + testes de integracao LLM |

---

## 2. Organizacao de Rotas API

### 2.1 raiz-platform — Next.js App Router

**Estrutura**: `src/app/api/{dominio}/{recurso}/route.ts`

```
src/app/api/
  admin/          # 20+ sub-rotas (users, config, departments, plans...)
  agent/          # diagnostics
  ai/             # chat (AI SDK streaming)
  analyses/       # templates, preview, datasources
  artifacts/      # CRUD + stats + favorites + versions
  auth/           # hubspot, google-workspace OAuth
  bi/             # chat
  brands/         # CRUD + members
  cache/          # stats
  chat/           # bookmarks, search, scheduled, link-preview
  cli/            # daemon tasks
  clm/            # contratos (signatures, webhook)
  content-studio/ # presentations, video, references, style-guides
  cron/           # jobs agendados
  deep-research/  # stream + CRUD
  dpos/           # ads (insights, objectives)
  google/         # gmail, contacts, people
  health/         # health check
  hubspot/        # stats, contacts
  integrations/   # ads-sync, google-ads, meta-ads
  lit/            # litigation
  n8n/            # webhooks
  reports/        # gerados
  search/         # busca global
  social-media/   # posts, queries, analytics, crisis
  threads/        # chat threads CRUD + branches + export
  totvs-sql/      # data-products, ingest
  v1/             # external API (catalog)
  whatsapp/       # campaigns, config, link, webhook
  workspaces/     # CRUD
  ... (85+ dominios)
```

**Pontos fortes**:
- Organizacao por dominio de negocio (DDD refletido nas rotas)
- Parametros dinamicos via `[id]` no filesystem
- Sub-recursos bem aninhados (ex: `posts/[id]/approve`, `threads/[id]/branches`)
- Barrel exports por dominio com `_helpers.ts`

**Pontos fracos**:
- Sem agrupamento explicito por versao (apenas `v1/` para API externa)
- Alguns dominios com sobreposicao (ex: `chat/`, `chat-ai/`, `chat-dm/`, `chat-events/`, `chat-messages/`, `chat-rooms/` — 6 diretorios para chat)
- Sem index de rotas ou documentacao automatica

### 2.2 rAIz-AI-Prof — Vercel Serverless

**Estrutura**: `api/{dominio}/{funcao}.ts`

```
api/
  _lib/           # Shared: http.ts, types.ts, rateLimit.ts, csrfMiddleware.ts
  health.ts       # Health check
  ping.ts         # Ping
  llm/            # generate.ts, models.ts, image.ts, ocr.ts
  lti/            # login.ts, callback.ts, jwks.ts
  omr/            # process.ts, align.ts, detect-bubbles.ts, detect-qr.ts
  reports/        # generate.ts, schedules.ts, schedules/[id].ts, cron.ts
```

**Pontos fortes**:
- Simples e flat — facil de navegar
- `_lib/` centraliza utilitarios compartilhados
- Cada arquivo e uma funcao serverless independente
- Presets de rate limit bem definidos por endpoint

**Pontos fracos**:
- Padrao de handler repetitivo (boilerplate em cada arquivo)
- Sem autenticacao — qualquer IP pode chamar endpoints
- Parametros dinamicos limitados (`schedules/[id].ts` e o unico)
- Nao escala bem para muitas rotas

---

## 3. Error Handling

### 3.1 raiz-platform — Abordagem Centralizada

O raiz-platform tem **3 camadas de error handling**:

#### Camada 1: `createRouteHandler` HOF
**Arquivo**: `src/lib/api/route-handler.ts`

```typescript
export const GET = createRouteHandler(async (req) => {
  const data = await myService.getAll();
  return NextResponse.json({ success: true, data });
});
```

- Wrap automatico com try/catch
- Classificacao de erros por string matching (`Unauthorized`, `Not Found`, `duplicate`)
- Tracing com OpenTelemetry spans
- Timeout configuravel (`maxDuration`)
- Log diferenciado: warn para 4xx, error para 5xx
- **Adocao**: ~15 rotas (principalmente admin)

#### Camada 2: `withAuth` + `handleApiError`
**Arquivo**: `src/lib/auth/api-error-helpers.ts`

```typescript
export const GET = withAuth(async (user, request) => {
  try {
    const data = await fetchData(user.id);
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error, 'context');
  }
});
```

- Pre-definicoes tipadas: `errors.unauthorized()`, `errors.notFound()`, `errors.validation(zodError)`
- Handler para erros especificos: `GoogleApiError`, `TimeoutError`, `ZodError`
- Handler para modulos: `handleModuleError()` (CLM, DPOS, LIT)
- Handler para HubSpot: `handleHubSpotError()`
- Helpers de parsing: `parseJsonBody()`, `parseSearchParams()` com Zod
- **Adocao**: ~30+ rotas (threads, bi, chat, search)

#### Camada 3: Try/catch inline
```typescript
export async function GET(request: NextRequest) {
  try {
    // ... logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Message' }, { status: 500 });
  }
}
```

- **Adocao**: ~40+ rotas (social-media, whatsapp, config, content-studio)
- Formato de resposta inconsistente entre rotas

#### Formato de erro padrao (quando usa api-error-helpers):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "path": ["name"], "message": "Required" }]
  }
}
```

### 3.2 rAIz-AI-Prof — Abordagem Per-Handler

Cada handler repete o mesmo padrao:

```typescript
export default async function handler(req: ApiRequest, res: ApiResponse) {
  setSecurityHeaders(res);
  const cors = setCors(req, res);
  if (!cors.ok) return sendJson(res, 403, { ok: false, error: 'Forbidden origin' });
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });

  const csrf = validateCsrfBasic(req);
  if (!csrf.ok) return sendJson(res, 403, { ok: false, error: 'CSRF validation failed' });

  try {
    // ... logica
    return sendJson(res, 200, { ok: true, ...result });
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: msg });
  }
}
```

#### Formato de resposta:
```json
{ "ok": true, "text": "...", "model": "gemini-2.5-flash", "provider": "google_gemini" }
{ "ok": false, "error": "Rate limit exceeded" }
```

**Nota**: O endpoint `llm/generate.ts` tem classificacao de erros inline sofisticada (mapeia erros para status 429, 502, 503, 504), mas isso nao e reutilizado em outros endpoints.

---

## 4. Formato de Resposta

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Campo de sucesso** | `success: true/false` | `ok: true/false` |
| **Campo de dados** | `data: T` (envelope) | Campos diretos no root (`text`, `models`, etc.) |
| **Campo de erro** | `error: { code, message, details? }` | `error: string` |
| **Metadata** | `meta: { timestamp, count }` (em algumas rotas) | Nenhum |
| **Paginacao** | `meta: { total, page, limit, total_pages, has_more }` | Nenhum |
| **Rate limit headers** | `X-RateLimit-Limit/Remaining/Reset` | `X-RateLimit-Limit/Remaining/Reset` |
| **Consistencia** | ~60% das rotas seguem o padrao | ~90% seguem o padrao `{ ok, error }` |

### Inconsistencias no raiz-platform

1. Algumas rotas retornam `{ error: "message" }` sem `success: false` (formato antigo)
2. Middleware retorna `{ success: false, error: { code, message } }` mas algumas rotas retornam `{ success: false, error: "string" }`
3. `v1/catalog` mistura `success` com `meta` mas sem `data` padronizado em error cases

### Inconsistencias no rAIz-AI-Prof

1. `health.ts` retorna `{ status: 'healthy', checks: {...} }` (formato diferente)
2. `ping.ts` retorna `{ ok: true, ts: 12345 }` (sem `error` field)
3. Alguns endpoints retornam `{ ok: false, error: "msg", message: "detail" }` (campo `message` extra)

---

## 5. Middleware

### 5.1 raiz-platform — Next.js Middleware (`src/middleware.ts`)

**Responsabilidades** (em ordem de execucao):

1. **Request ID**: Gera ID unico para correlacao
2. **Performance timing**: Mede duracao com `performance.now()`
3. **Arquivos estaticos**: Bypass sem processamento
4. **Supabase Auth**: Cria cliente, chama `getUser()` (timeout 5s)
5. **Rotas publicas**: Bypass para `/login`, `/auth/callback`, `/api/health`, `/api/cli`, etc.
6. **CLI token validation**: SHA-256 hash + lookup no Supabase para Bearer tokens
7. **Admin check**: Role lookup com cache Redis (timeout 3s, fail-closed)
8. **Module access**: Permission check com cache Redis (timeout 3s, fail-closed)
9. **Security headers**: CSP, HSTS, X-Frame-Options, etc.
10. **Server-Timing header**: `middleware;dur=X`

**Pontos fortes**:
- Fail-closed para admin/module checks (seguro)
- Cache Redis para roles e permissoes
- CLI token support com pattern validation
- E2E bypass para testes
- Server-Timing para debugging

**Pontos fracos**:
- Middleware monolitico (~450 linhas, complexidade alta)
- Sem CORS handling (delegado a headers em `next.config.mjs` ou rotas)
- Sem CSRF (confia em SameSite cookies)
- Performance: 2 fetches ao Supabase por request (auth + role/module)

### 5.2 rAIz-AI-Prof — Middleware Manual

**Nao ha middleware centralizado.** Cada handler chama manualmente:

```typescript
setSecurityHeaders(res);   // X-Content-Type-Options, HSTS, CSP, etc.
setCors(req, res);          // Valida Origin contra allowed list
validateCsrfBasic(req);     // Valida Origin/Referer para POST/PUT/DELETE
```

Alem disso, existe um **CSRF middleware HOF** mais completo:
- **Arquivo**: `api/_lib/csrfMiddleware.ts`
- **Pattern**: Double Submit Cookie
- **Funcoes**: `validateCsrf()`, `withCsrf()` HOF
- **Features**: timing-safe compare, soft mode, exempt routes, test token
- **Adocao**: Nao utilizado — handlers usam `validateCsrfBasic()` do `http.ts`

---

## 6. Rate Limiting

### 6.1 Comparacao Lado-a-Lado

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Primario** | Upstash Redis (`@upstash/ratelimit`) | Upstash Redis (REST API direto) |
| **Fallback** | In-memory Map | In-memory Map |
| **Tiers** | basic (100/min), standard (30/min), expensive (10/min) | 11 presets por endpoint |
| **Identificador** | `user:{id}` ou `ip:{ip}` | `{dominio}:{funcao}:{ip}` |
| **Headers** | X-RateLimit-Limit/Remaining/Reset + Retry-After | X-RateLimit-Limit/Remaining/Reset + Retry-After |
| **Fail strategy** | Fail-open (fallback to in-memory) | Fail-open (fallback to in-memory) |
| **Integracao** | `checkRateLimit()`, `withRateLimit()` HOF | `checkRateLimitAsync()` por handler |
| **Cleanup** | `setInterval` a cada 5 min | Nenhum (memory leak potencial) |

### 6.2 Presets do rAIz-AI-Prof (mais granulares)

```typescript
RATE_LIMIT_PRESETS = {
  llm_generate:      { limit: 30,   windowMs: 60_000 },
  api_read:          { limit: 100,  windowMs: 60_000 },
  api_write:         { limit: 50,   windowMs: 60_000 },
  auth:              { limit: 10,   windowMs: 60_000 },
  health:            { limit: 1000, windowMs: 60_000 },
  reports_generate:  { limit: 10,   windowMs: 3600_000 },
  reports_schedules: { limit: 20,   windowMs: 60_000 },
  reports_cron:      { limit: 100,  windowMs: 60_000 },
  omr_process:       { limit: 20,   windowMs: 60_000 },
  omr_detect:        { limit: 30,   windowMs: 60_000 },
  omr_align:         { limit: 20,   windowMs: 60_000 },
  lti_login:         { limit: 30,   windowMs: 60_000 },
  lti_callback:      { limit: 50,   windowMs: 60_000 },
  lti_jwks:          { limit: 200,  windowMs: 60_000 },
}
```

### 6.3 Problemas Identificados

1. **raiz-platform**: `checkRateLimit()` sincrono e sempre in-memory (nao usa Redis), mesmo quando Redis esta configurado. So `checkRateLimitAsync()` usa Redis.
2. **rAIz-AI-Prof**: Sem cleanup de buckets in-memory — em serverless isso e menos grave (funcoes morrem), mas em dev mode pode acumular.
3. **Ambos**: Rate limit por IP nao funciona bem atras de NAT/proxy compartilhado — nao tem rate limit por usuario no rAIz-AI-Prof pois nao tem auth.

---

## 7. CORS / CSRF

### 7.1 CORS

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Onde** | Middleware (security headers) + rotas individuais | `setCors()` em cada handler |
| **Allowed origins** | Nao configurado explicitamente em CORS | `APP_ORIGIN` env + `VERCEL_URL` + localhost |
| **Dev mode** | Permissivo (nao ha CORS check) | Aceita qualquer porta localhost |
| **Credenciais** | `Access-Control-Allow-Credentials` ausente | Ausente |
| **Preflight** | Nao tratado no middleware | Cada handler trata `OPTIONS` |
| **Metodos** | Nao restrito | `GET, POST, OPTIONS` |

### 7.2 CSRF

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Protecao** | Nenhuma explicita (confia em SameSite cookies do Supabase) | Dupla: Origin/Referer validation + Double Submit Cookie |
| **Header** | N/A | `X-CSRF-Token` |
| **Cookie** | N/A | `__raiz_csrf` |
| **Implementacao** | N/A | `validateCsrfBasic()` (usado) + `validateCsrf()` (nao usado) |
| **Exempt routes** | N/A | `/api/webhook`, `/api/health`, `/api/omr/process` |
| **Timing-safe** | N/A | Sim (comparacao constante) |

**Gap critico no raiz-platform**: Sem CSRF explicito. O Supabase Auth usa cookies HttpOnly com SameSite=Lax, o que protege contra CSRF basico, mas:
- Requests GET com side-effects nao sao protegidos
- SameSite=Lax permite requests GET cross-origin
- Navegadores mais antigos podem nao respeitar SameSite

---

## 8. Input Validation

### 8.1 raiz-platform — Zod Schemas

**Adocao**: ~25+ rotas usam Zod para validacao de input.

```typescript
// Padrao com parseJsonBody (mais recente)
const result = await parseJsonBody(request, createThreadSchema);
if ('error' in result) return result.error;

// Padrao com parse direto (mais antigo)
const query = listUsersQuerySchema.parse(rawQuery);
```

**Pontos fortes**:
- Schemas tipados e reutilizaveis
- `parseJsonBody()` e `parseSearchParams()` padronizados
- Erros de validacao retornam `{ success: false, error: { code: "VALIDATION_ERROR", details: [...] } }`
- Coercao automatica (`z.coerce.number()`)

**Pontos fracos**:
- ~60% das rotas ainda fazem validacao manual ou nenhuma
- Schemas inline (nao compartilhados entre rotas similares)

### 8.2 rAIz-AI-Prof — Validacao Manual

**Zero uso de Zod** em endpoints de API.

```typescript
// Validacao inline tipica
if (!prompt.trim()) return sendJson(res, 400, { ok: false, error: 'Missing prompt' });
if (prompt.length > 50_000) return sendJson(res, 413, { ok: false, error: 'Prompt too large' });

// Validacao com funcao custom
function validateConfig(config: ReportConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!validPeriods.includes(config.period)) errors.push(`Periodo invalido: ${config.period}`);
  // ...
  return { valid: errors.length === 0, errors };
}
```

**Pontos fracos**:
- Sem tipagem em runtime (TypeScript types nao protegem requests reais)
- Validacao inconsistente entre endpoints
- Body lido via `readJson<T>()` que faz cast sem validacao (`as T`)
- LTI login aceita parametros sem sanitizacao

---

## 9. API Versioning

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Versionamento** | Parcial — 1 rota em `/api/v1/` | Nenhum |
| **Estrategia** | URL path (`/api/v1/catalog`) | N/A |
| **Rotas versionadas** | `v1/catalog`, `v1/data-products/` | N/A |
| **Uso** | Apenas para API externa (TOTVS SQL Data Products) | N/A |
| **Compatibilidade** | Endpoints internos nao versionados | Nenhum endpoint versionado |

---

## 10. Documentacao de API

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **OpenAPI/Swagger** | Nenhum | Nenhum |
| **JSDoc nos handlers** | ~30% das rotas | ~60% das rotas |
| **CLAUDE.md** | `src/app/api/CLAUDE.md` com padrao obrigatorio | `CLAUDE.md` na raiz |
| **Type exports** | Tipos de request/response em schemas | Tipos inline nos handlers |
| **API guide** | Nenhum | Nenhum |

---

## 11. Security Headers

| Header | raiz-platform | rAIz-AI-Prof |
|--------|--------------|--------------|
| `X-Content-Type-Options: nosniff` | Middleware | `setSecurityHeaders()` |
| `X-Frame-Options: DENY` | Middleware | `setSecurityHeaders()` |
| `X-XSS-Protection: 1; mode=block` | Middleware | `setSecurityHeaders()` |
| `Referrer-Policy` | `origin-when-cross-origin` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Sim (camera, mic, geo) | Nao |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | `max-age=31536000; includeSubDomains` (prod only) |
| `Content-Security-Policy` | Enforce (prod) / Report-Only (dev) | `default-src 'none'` (APIs) |
| `X-DNS-Prefetch-Control` | Sim | Nao |
| `Cache-Control` | Variavel por rota | `no-store, no-cache, must-revalidate, private` |
| `X-Request-ID` | Sim (middleware) | Nao |
| `Server-Timing` | Sim (middleware) | Nao |

---

## 12. Padroes Reutilizaveis

### Do raiz-platform para o rAIz-AI-Prof:

1. **`createRouteHandler` HOF** — Elimina boilerplate repetitivo
2. **`withAuth` wrapper** — Padroniza autenticacao
3. **`apiError()` / `errors.*` factory** — Erros consistentes com codes
4. **`parseJsonBody()` com Zod** — Validacao type-safe
5. **`apiSuccess()` / `apiCreated()` / `paginatedResponse()`** — Respostas padronizadas
6. **Request ID correlation** — Tracing end-to-end
7. **Server-Timing header** — Debugging de performance

### Do rAIz-AI-Prof para o raiz-platform:

1. **CSRF Double Submit Cookie** (`csrfMiddleware.ts`) — Protecao robusta
2. **Rate limit presets por endpoint** — Granularidade fina
3. **Security headers centralizados** (`setSecurityHeaders()`) — Garantia de cobertura
4. **Secret redaction** (`redactSecrets()`) — Previne leak em logs
5. **Payload size limit** (`readReqBody` com 1MB cap) — Anti-abuse

---

## 13. Gaps Identificados

### raiz-platform

| # | Gap | Severidade | Arquivo(s) Afetado(s) |
|---|-----|------------|----------------------|
| G1 | **Sem CSRF protection** — confia apenas em SameSite cookies | Alta | `src/middleware.ts` |
| G2 | **3 patterns de error handling coexistindo** — `createRouteHandler`, `withAuth+handleApiError`, try/catch inline | Media | ~85+ rotas em `src/app/api/` |
| G3 | **Formato de resposta inconsistente** — `error: string` vs `error: { code, message }` | Media | ~40% das rotas |
| G4 | **Sem OpenAPI/Swagger** para 85+ endpoints | Media | Projeto inteiro |
| G5 | **CORS nao configurado explicitamente** no middleware | Media | `src/middleware.ts` |
| G6 | **checkRateLimit() sincrono nao usa Redis** — confuso para developers | Baixa | `src/lib/auth/rate-limit.ts` |
| G7 | **Sem request ID nos logs da maioria das rotas** (so middleware) | Baixa | `src/app/api/` |
| G8 | **Chat fragmentado em 6 diretorios** — dificil de navegar | Baixa | `src/app/api/chat*` |
| G9 | **Sem API versioning strategy** para endpoints internos | Baixa | Projeto inteiro |
| G10 | **~60% das rotas sem validacao Zod** | Media | ~50+ rotas |

### rAIz-AI-Prof

| # | Gap | Severidade | Arquivo(s) Afetado(s) |
|---|-----|------------|----------------------|
| G11 | **Sem autenticacao** — qualquer IP acessa todos os endpoints | Critica | Todas as rotas em `api/` |
| G12 | **Boilerplate repetitivo** — 50+ linhas identicas em cada handler | Alta | Todos os 15 handlers |
| G13 | **Zero validacao com Zod** — bodies lidos com cast inseguro | Alta | `api/llm/generate.ts`, `api/reports/generate.ts`, etc. |
| G14 | **Sem request ID/correlation** — impossivel rastrear requests | Media | Todas as rotas |
| G15 | **CSRF middleware completo nao utilizado** — `withCsrf()` existe mas ninguem usa | Media | `api/_lib/csrfMiddleware.ts` |
| G16 | **Formato de resposta `ok` vs `success`** — diferente do raiz-platform | Media | Todas as rotas |
| G17 | **Sem cleanup de rate limit buckets** — memory leak em dev | Baixa | `api/_lib/rateLimit.ts` |
| G18 | **Error messages vazam stack traces** em `lti/login.ts` | Media | `api/lti/login.ts:172` |
| G19 | **`readJson()` faz cast `as T` sem validacao** | Media | `api/_lib/http.ts:56` |
| G20 | **Sem OpenAPI/Swagger** para 15 endpoints | Baixa | Projeto inteiro |

---

## 14. Oportunidades Priorizadas

### P0 — Criticos (resolver imediatamente)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|----|-------------|---------|---------|---------|
| **O1** | Adicionar autenticacao aos endpoints do rAIz-AI-Prof | rAIz-AI-Prof | M | Critico — endpoints LLM abertos |
| **O2** | Implementar CSRF no raiz-platform | raiz-platform | S | Alto — SameSite insuficiente |
| **O3** | Corrigir leak de stack traces em error responses | rAIz-AI-Prof | S | Alto — info disclosure |

### P1 — Alta prioridade (proximo sprint)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|----|-------------|---------|---------|---------|
| **O4** | Unificar error handling no raiz-platform (migrar para `withAuthAndErrorHandler`) | raiz-platform | L | Alto — consistencia |
| **O5** | Criar handler factory no rAIz-AI-Prof (eliminar boilerplate) | rAIz-AI-Prof | M | Alto — DRY |
| **O6** | Adicionar Zod validation nos endpoints rAIz-AI-Prof | rAIz-AI-Prof | M | Alto — seguranca |
| **O7** | Padronizar formato de resposta entre projetos (`success`/`data`/`error`) | Ambos | M | Alto — DX |
| **O8** | Implementar request ID no rAIz-AI-Prof | rAIz-AI-Prof | S | Medio — observabilidade |

### P2 — Media prioridade (backlog)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|----|-------------|---------|---------|---------|
| **O9** | Gerar OpenAPI spec automaticamente | Ambos | L | Medio — documentacao |
| **O10** | Consolidar chat APIs (6 diretorios -> 1) | raiz-platform | L | Medio — manutencao |
| **O11** | Implementar CORS configuravel no middleware raiz-platform | raiz-platform | S | Medio — seguranca |
| **O12** | Adicionar Permissions-Policy no rAIz-AI-Prof | rAIz-AI-Prof | S | Baixo — compliance |
| **O13** | Ativar `withCsrf()` HOF em vez de `validateCsrfBasic()` | rAIz-AI-Prof | S | Medio — seguranca |
| **O14** | Adicionar cleanup de buckets in-memory | rAIz-AI-Prof | S | Baixo — estabilidade |

### P3 — Baixa prioridade (nice-to-have)

| ID | Oportunidade | Projeto | Esforco | Impacto |
|----|-------------|---------|---------|---------|
| **O15** | Definir estrategia de API versioning | Ambos | M | Medio — longevidade |
| **O16** | Server-Timing headers no rAIz-AI-Prof | rAIz-AI-Prof | S | Baixo — debugging |
| **O17** | Unificar tiers de rate limit entre projetos | Ambos | S | Baixo — consistencia |
| **O18** | Adicionar X-DNS-Prefetch-Control no rAIz-AI-Prof | rAIz-AI-Prof | S | Baixo — performance |

---

## 15. Recomendacoes com Caminhos Concretos

### R1: Handler Factory para rAIz-AI-Prof (O5)

Criar `api/_lib/createHandler.ts` inspirado no `createRouteHandler` do raiz-platform:

```typescript
// api/_lib/createHandler.ts
import type { ApiRequest, ApiResponse } from './types';
import { setCors, setSecurityHeaders, sendJson, validateCsrfBasic } from './http';
import { checkRateLimitAsync, getClientIp, RATE_LIMIT_PRESETS } from './rateLimit';

interface HandlerOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  rateLimit?: keyof typeof RATE_LIMIT_PRESETS;
  csrf?: boolean;
}

export function createHandler(
  options: HandlerOptions,
  handler: (req: ApiRequest, res: ApiResponse) => Promise<void>
) {
  return async (req: ApiRequest, res: ApiResponse) => {
    setSecurityHeaders(res);
    const cors = setCors(req, res);
    if (!cors.ok) return sendJson(res, 403, { ok: false, error: 'Forbidden origin' });
    if (req.method === 'OPTIONS') return sendJson(res, 204, {});
    if (req.method !== options.method) return sendJson(res, 405, { ok: false, error: 'Method not allowed' });

    if (options.csrf !== false) {
      const csrf = validateCsrfBasic(req);
      if (!csrf.ok) return sendJson(res, 403, { ok: false, error: 'CSRF validation failed' });
    }

    if (options.rateLimit) {
      const ip = getClientIp(req);
      const preset = RATE_LIMIT_PRESETS[options.rateLimit];
      const rl = await checkRateLimitAsync({ key: `${options.rateLimit}:${ip}`, ...preset });
      // ... headers e 429 response
    }

    try {
      await handler(req, res);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      sendJson(res, 500, { ok: false, error: error.message });
    }
  };
}
```

**Reduz cada handler de ~60 linhas para ~10 linhas.**

### R2: Migracao de Error Handling no raiz-platform (O4)

**Meta**: Migrar todas as rotas para `withAuthAndErrorHandler` de `src/lib/auth/api-error-helpers.ts`.

**Prioridade de migracao**:
1. Rotas com try/catch inline que retornam `{ error: string }` (formato antigo)
2. Rotas que usam `createRouteHandler` (migrar para `withAuthAndErrorHandler`)
3. Rotas admin (ja usam `createRouteHandler` — manter ou migrar)

**Arquivos-chave**:
- `src/lib/auth/api-error-helpers.ts` — fonte da verdade
- `src/lib/api/route-handler.ts` — considerar deprecar em favor de `withAuthAndErrorHandler`

### R3: Unificacao do Formato de Resposta (O7)

**Padrao proposto** (ambos projetos):

```typescript
// Sucesso
{ success: true, data: T, meta?: { timestamp, count, ... } }

// Erro
{ success: false, error: { code: string, message: string, details?: unknown } }
```

**Migracao no rAIz-AI-Prof**:
- Substituir `ok` por `success`
- Envelopar dados em `data`
- Estruturar erros com `{ code, message }`

### R4: Autenticacao no rAIz-AI-Prof (O1)

**Opcoes**:
1. **Supabase Auth (preferido)** — ja usa Supabase. Validar JWT do cookie no handler.
2. **API Key simples** — header `Authorization: Bearer <key>` com lookup em env var.
3. **Hybrid** — Auth por cookie para SPA, API key para integracao LTI/OMR.

**Arquivo**: Criar `api/_lib/auth.ts`

### R5: CSRF no raiz-platform (O2)

**Opcao recomendada**: Importar pattern do rAIz-AI-Prof (`csrfMiddleware.ts`) para o middleware do Next.js.

**Arquivos**:
- Criar `src/lib/security/csrf.ts` baseado em `rAIz-AI-Prof/api/_lib/csrfMiddleware.ts`
- Integrar em `src/middleware.ts`
- Gerar token CSRF no login e setar cookie

---

## 16. Resumo Executivo

| Metrica | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Maturidade API** | Media-Alta | Baixa-Media |
| **Seguranca** | Media (falta CSRF) | Baixa (falta auth) |
| **Consistencia** | Media (3 patterns coexistindo) | Media-Alta (1 pattern repetido) |
| **DX (Developer Experience)** | Media (helpers bons, adocao parcial) | Baixa (muito boilerplate) |
| **Observabilidade** | Alta (request ID, tracing, Server-Timing) | Baixa (apenas logs) |
| **Documentacao** | Baixa (sem OpenAPI) | Baixa (sem OpenAPI) |
| **Validacao** | Media (Zod em ~40% das rotas) | Baixa (manual) |
| **Rate Limiting** | Boa (Redis + tiers) | Boa (Redis + presets granulares) |
| **Escalabilidade** | Alta (App Router, modular) | Media (flat structure) |

### Top 5 Acoes Imediatas

1. **[P0]** Adicionar autenticacao ao rAIz-AI-Prof (`api/_lib/auth.ts`)
2. **[P0]** Implementar CSRF no raiz-platform (importar pattern do rAIz-AI-Prof)
3. **[P0]** Sanitizar error messages no rAIz-AI-Prof (remover stack traces)
4. **[P1]** Criar handler factory no rAIz-AI-Prof (eliminar boilerplate)
5. **[P1]** Unificar formato de resposta entre projetos

---

## Apendice: Mapa de Arquivos Relevantes

### raiz-platform
| Arquivo | Descricao |
|---------|-----------|
| `src/middleware.ts` | Middleware centralizado (auth, security headers, routing) |
| `src/lib/api/route-handler.ts` | HOF `createRouteHandler` com tracing e timeout |
| `src/lib/auth/api-error-helpers.ts` | `withAuth`, `handleApiError`, `apiSuccess`, `errors.*` |
| `src/lib/auth/rate-limit.ts` | Rate limiting (Redis + in-memory) com tiers |
| `src/lib/cache/redis.ts` | Upstash Redis client + rate limit backend |
| `src/app/api/CLAUDE.md` | Convencoes de API routes |
| `src/app/api/threads/route.ts` | Exemplo de rota bem estruturada (auth + rate limit + Zod) |
| `src/app/api/admin/users/route.ts` | Exemplo com `createRouteHandler` + Zod |
| `src/app/api/v1/catalog/route.ts` | Unica rota versionada (API externa) |

### rAIz-AI-Prof
| Arquivo | Descricao |
|---------|-----------|
| `api/_lib/http.ts` | `setCors`, `setSecurityHeaders`, `validateCsrfBasic`, `sendJson`, `readJson` |
| `api/_lib/types.ts` | `ApiRequest`, `ApiResponse` types |
| `api/_lib/rateLimit.ts` | Rate limiting (Redis + in-memory) com presets |
| `api/_lib/csrfMiddleware.ts` | CSRF Double Submit Cookie (nao utilizado) |
| `api/llm/generate.ts` | Handler mais complexo (multi-provider, error classification) |
| `api/health.ts` | Health check com status checks |
| `api/reports/generate.ts` | Handler com validacao custom |
| `api/lti/login.ts` | LTI 1.3 OIDC initiation |
