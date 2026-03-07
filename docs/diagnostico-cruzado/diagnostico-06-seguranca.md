# D06 - Diagnostico Cruzado: Seguranca

> Comparativo de postura de seguranca entre raiz-platform e rAIz-AI-Prof.
> Data: 2026-03-01 | Versao: 1.0

---

## Indice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Security Headers](#2-security-headers)
3. [Content Security Policy (CSP)](#3-content-security-policy-csp)
4. [Sanitizacao de Input / XSS](#4-sanitizacao-de-input--xss)
5. [Defesa contra Prompt Injection](#5-defesa-contra-prompt-injection)
6. [Rate Limiting](#6-rate-limiting)
7. [CORS](#7-cors)
8. [CSRF Protection](#8-csrf-protection)
9. [Secret Scanning e Redacao em Logs](#9-secret-scanning-e-redacao-em-logs)
10. [Idempotencia](#10-idempotencia)
11. [SQL Injection](#11-sql-injection)
12. [Dependency Audit e SAST](#12-dependency-audit-e-sast)
13. [Anti-Exfiltracao](#13-anti-exfiltracao)
14. [Gaps Identificados](#14-gaps-identificados)
15. [Oportunidades Priorizadas](#15-oportunidades-priorizadas)
16. [Padroes Reutilizaveis](#16-padroes-reutilizaveis)

---

## 1. Resumo Executivo

| Dimensao | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Maturidade geral** | Alta | Media-Alta |
| **Headers de seguranca** | Middleware dinamico (todas as rotas) | vercel.json estatico (todas as rotas) + API programatico |
| **CSP** | Dinamico (enforce prod / report-only dev) | Estatico (enforce sempre) |
| **Sanitizacao HTML** | DOMPurify com 5 presets | DOMPurify com 4 presets + stripHtml |
| **Prompt injection** | Detector avancado (26 regras, 4 severidades, rate-limit escalation, middleware wrapper) | Sanitizer com 14 regex + 8 strings exatas + risk score |
| **Rate limiting** | Redis (Upstash) + in-memory fallback, 3 tiers, ~248 endpoints | Redis (Upstash) + in-memory fallback, 9 presets, ~33 endpoints |
| **CORS** | Delegado ao Next.js/Vercel (sem config explicita) | Programatico com allowlist + validacao Sec-Fetch |
| **CSRF** | Nenhum (SPA com cookies Supabase) | Modulo completo (token generation, validation, hook React) |
| **Secret scanning** | Modulo dedicado (22 patterns + entropia + redacao recursiva) | secureLogger (14 patterns + campo-sensitivo + redacao recursiva) |
| **Idempotencia** | Servico dedicado com SHA-256 keys e cache | Nenhum |
| **SQL injection** | Supabase SDK (parametrizado) + MSSQL prepared statements | Supabase SDK (parametrizado) |
| **SAST/CI** | npm audit + Claude Security Review + AI Code Review + E2E | CodeQL + npm audit + OWASP ZAP + security-audit.js + E2E |
| **Anti-exfiltracao** | Secrets scanner com categorias (secret vs pii) | N/A (nao tem modulo dedicado) |

**Score geral estimado:**
- raiz-platform: **8.2/10** (infraestrutura de seguranca madura com gaps pontuais)
- rAIz-AI-Prof: **7.0/10** (cobertura boa com lacunas em idempotencia e anti-exfiltracao)

---

## 2. Security Headers

### Estado Atual

| Header | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| `X-Content-Type-Options: nosniff` | Middleware (`src/middleware.ts:103`) | vercel.json + `setSecurityHeaders()` |
| `X-Frame-Options: DENY` | Middleware (`src/middleware.ts:104`) | vercel.json + `setSecurityHeaders()` |
| `X-XSS-Protection: 1; mode=block` | Middleware (`src/middleware.ts:105`) | vercel.json (SPA) + `setSecurityHeaders()` (API) |
| `Referrer-Policy` | `origin-when-cross-origin` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (2 anos) | `max-age=31536000; includeSubDomains; preload` (1 ano, SPA) / sem preload (API, prod only) |
| `X-DNS-Prefetch-Control` | `on` | Ausente |
| `Server-Timing` | Presente (duracao do middleware) | Ausente |
| `Cache-Control` (API) | `no-store, max-age=0` (vercel.json) | `no-store, no-cache, must-revalidate` (vercel.json) + `private` (API programatico) |
| `X-Request-ID` | Gerado no middleware (crypto random 10 chars) | Ausente |

### Mecanismo de Aplicacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Onde** | `src/middleware.ts` (Node.js runtime, linhas 102-129) | `vercel.json` (headers section) + `api/_lib/http.ts:setSecurityHeaders()` |
| **Tipo** | Dinamico (codigo TS executado por request) | Hibrido: estatico (vercel.json para SPA) + programatico (API functions) |
| **CSP variavel** | Sim (enforce em prod, report-only em dev) | Nao (sempre enforce) |
| **Excecoes** | Arquivos estaticos ignoram middleware | Assets com cache longo; API tem CSP restritivo separado |

### Analise

**raiz-platform** tem vantagem por aplicar headers programaticamente no middleware, permitindo logica condicional (CSP enforce vs report-only por ambiente). Tambem inclui `X-Request-ID` para correlacao de logs e `Server-Timing` para diagnostico de performance.

**rAIz-AI-Prof** tem a vantagem de headers duplos (vercel.json para o CDN + programatico para APIs), garantindo que mesmo se o codigo falhar, os headers do CDN ainda sao aplicados. A separacao de CSP para APIs (`default-src 'none'`) vs SPA e uma boa pratica.

### Gaps

- **raiz-platform**: Nao tem `interest-cohort=()` no Permissions-Policy (FLoC/Topics API)
- **raiz-platform**: HSTS nao aplicado condicionalmente (tambem em dev)
- **rAIz-AI-Prof**: Sem `X-DNS-Prefetch-Control`
- **rAIz-AI-Prof**: Sem `X-Request-ID` para correlacao de requests
- **rAIz-AI-Prof**: Sem `Server-Timing` header
- **rAIz-AI-Prof**: HSTS apenas em producao no `setSecurityHeaders()`, mas no vercel.json aplica sempre (inconsistencia)

---

## 3. Content Security Policy (CSP)

### raiz-platform (dinamico, `src/middleware.ts:114-129`)

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://*.googleusercontent.com https://*.supabase.co;
connect-src 'self' data: blob: https://*.supabase.co wss://*.supabase.co
            https://*.ingest.sentry.io https://vitals.vercel-insights.com
            https://api.powerbi.com https://*.analysis.windows.net;
font-src 'self' data:;
worker-src 'self' blob:;
frame-src 'self' blob: data: https://app.powerbi.com https://*.powerbi.com
           https://*.analysis.windows.net https://lookerstudio.google.com;
object-src 'self' blob:;
frame-ancestors 'none';
```

- **Enforce** em producao (`Content-Security-Policy`)
- **Report-only** em desenvolvimento (`Content-Security-Policy-Report-Only`)
- **Ausente**: `report-uri` / `report-to` (nao reporta violacoes)
- **Ausente**: `upgrade-insecure-requests`
- **Risco**: `'unsafe-inline'` em script-src e style-src (necessario para Next.js inline scripts)

### rAIz-AI-Prof (estatico)

**SPA** (`vercel.json` para `/(.*)`):
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co
            https://generativelanguage.googleapis.com https://api.openai.com
            https://api.anthropic.com https://*.sentry.io https://plausible.io
            https://fonts.googleapis.com https://fonts.gstatic.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

**API** (`vercel.json` para `/api/(.*)`):
```
default-src 'none';
frame-ancestors 'none';
base-uri 'none';
form-action 'none';
```

### Comparacao

| Diretiva | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| `default-src` | `'self'` | SPA: `'self'` / API: `'none'` |
| `script-src` | `'self' 'unsafe-inline'` | `'self' 'unsafe-inline' 'unsafe-eval'` |
| `upgrade-insecure-requests` | Ausente | Presente |
| `base-uri` | Ausente | `'self'` (SPA) / `'none'` (API) |
| `form-action` | Ausente | `'self'` (SPA) / `'none'` (API) |
| `report-to` / `report-uri` | Ausente | Ausente |
| `img-src` allowlist | Restrito (`*.googleusercontent.com`, `*.supabase.co`) | Permissivo (`https:` wildcard) |
| CSP separado para API | Nao | Sim (muito restritivo) |

### Gaps

- **raiz-platform**: Falta `base-uri`, `form-action`, `upgrade-insecure-requests`; sem CSP separado para APIs
- **rAIz-AI-Prof**: Usa `'unsafe-eval'` em script-src (risco XSS via eval); `img-src 'self' data: https: blob:` e muito permissivo (permite qualquer imagem HTTPS)
- **Ambos**: Sem `report-to` / `report-uri` para monitoramento de violacoes CSP

---

## 4. Sanitizacao de Input / XSS

### raiz-platform

**Arquivo principal**: `src/lib/utils/sanitize.ts`

| Funcao | Uso | Lib |
|---|---|---|
| `sanitizeHtml(html)` | Conteudo geral | DOMPurify com allowlist de ~40 tags |
| `sanitizeEmailHtml(html)` | Emails (mais restritivo) | DOMPurify + `FORBID_TAGS` + `noopener noreferrer` em links |
| `sanitizeSvg(svg)` | Charts/infograficos | DOMPurify com tags SVG permitidas |
| `sanitizeMessageHtml(html)` | Mensagens de chat | DOMPurify com config padrao |
| `sanitizeHighlight(html)` | Search highlights | DOMPurify apenas `mark`, `strong`, `em` |
| `hasDangerousContent(html)` | Verificacao pre-render | Regex (`<script`, `javascript:`, `on\w+=`, etc.) |

**dangerouslySetInnerHTML**: 24 usos em 19 arquivos. Maioria em componentes de renderizacao de conteudo (chat, charts, slides).

### rAIz-AI-Prof

**Arquivo principal**: `lib/security/sanitize.ts`

| Funcao | Uso | Lib |
|---|---|---|
| `sanitizeStrict(html)` | Comentarios, campos simples | DOMPurify (7 tags) |
| `sanitizeMedium(html)` | Conteudo educacional | DOMPurify (18 tags) |
| `sanitizeRich(html)` | Planos de aula | DOMPurify (22 tags + links + imgs) |
| `sanitizeMarkdown(html)` | Markdown renderizado | Rich + `mark`, `del`, `ins`, `kbd` |
| `stripHtml(html)` | Texto puro | DOMPurify com 0 tags |
| `escapeHtml(str)` | Exibicao como texto | Regex manual (6 chars) |
| `createSafeInnerHTML(html, level)` | Helper React | Wrapper com nivel de sanitizacao |
| `containsDangerousHtml(str)` | Verificacao | Regex (`<script`, `<iframe`, etc.) |

**dangerouslySetInnerHTML**: 15 usos em 4 arquivos (muito menor superficie).

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Biblioteca** | DOMPurify | DOMPurify |
| **Presets** | 5 (default, email, SVG, message, highlight) | 4 (strict, medium, rich, markdown) + stripHtml |
| **React helper** | Nao | `createSafeInnerHTML(html, level)` |
| **Usos dangerouslySetInnerHTML** | 24 em 19 arquivos | 15 em 4 arquivos |
| **Verificacao pre-render** | `hasDangerousContent()` | `containsDangerousHtml()` |
| **ALLOW_DATA_ATTR** | `false` | `false` (strict/medium) / `true` (rich) |
| **Zod validation** | Usado em schemas de API | Usado em `lib/validation/schemas.ts` |

### Gaps

- **raiz-platform**: Nao tem helper React equivalente a `createSafeInnerHTML`; maior superficie de ataque (19 arquivos com dangerouslySetInnerHTML)
- **rAIz-AI-Prof**: `ALLOW_DATA_ATTR: true` no preset rich pode ser vetor de XSS via data attributes
- **Ambos**: Nenhum usa Trusted Types API (protecao nativa do navegador contra DOM XSS)

---

## 5. Defesa contra Prompt Injection

### raiz-platform

**Arquivos**:
- `src/lib/security/prompt-injection-detector.ts` (510 linhas)
- `src/lib/ai/middleware/prompt-validation.middleware.ts` (78 linhas)

**Caracteristicas**:
- **26 regras de deteccao** em 6 categorias: `instruction_override` (5), `jailbreak` (7), `prompt_extraction` (3), `data_exfiltration` (2), `context_confusion` (3), `suspicious` (2)
- **4 niveis de severidade**: critical, high, medium, low
- **Comportamento por severidade**:
  - Critical/High: bloqueia request (throw `PromptInjectionError`)
  - Medium/Low: log warning + **rate-limit escalation** (5 deteccoes em 5 min -> bloqueio)
- **Rate limiting de escalacao**: Redis (Upstash) com fallback in-memory
- **Protecao ReDoS**: Limite de scan a 10,000 chars (user) / 50,000 chars (system)
- **Middleware wrapper**: `withPromptValidation(provider)` aplica validacao em ALL providers automaticamente
- **Scan de system prompts editaveis**: `scanSystemPrompt()` para prompts que usuarios podem customizar
- **Integracao**: Middleware wrapper aplicado em todos os providers (Anthropic, GPT, Gemini, Perplexity)
- **Toggle**: Desativavel via `PROMPT_INJECTION_DETECTION_ENABLED=false`

### rAIz-AI-Prof

**Arquivo**: `lib/security/promptSanitizer.ts` (255 linhas)

**Caracteristicas**:
- **14 regex de deteccao** em 4 categorias: jailbreak (3), vazamento de sistema (4), mudanca de persona (4), comandos de dev (5)
- **8 strings exatas** de injecao (DAN mode, Developer Mode, etc.)
- **Risk score** (0-100): composicao de pesos por tipo de deteccao
- **Modos**: Strict (pesos 2x) e normal
- **Funcionalidades extras**:
  - `sanitizePrompt()`: Remove patterns suspeitos
  - `buildSafePrompt()`: Template seguro com variaveis sanitizadas
  - `truncatePrompt()`: Truncamento inteligente (preserva palavras)
  - `escapePromptForXml()`: Escape XML para prompts
- **Verificacoes adicionais**: Repeticao excessiva, ratio de chars especiais, tamanho maximo
- **Sem rate-limit escalation**: Nao escala deteccoes repetidas
- **Sem middleware wrapper**: Chamado manualmente pelos generators

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Regras** | 26 regex (4 severidades) | 14 regex + 8 strings exatas |
| **Abordagem** | Bloqueio (throw error) | Score de risco (isSafe boolean) |
| **Rate-limit escalation** | Sim (Redis + in-memory) | Nao |
| **Protecao ReDoS** | Sim (limites de chars) | Sim (maxLength 50K) |
| **Middleware automatico** | Sim (`withPromptValidation`) | Nao (chamada manual) |
| **Sanitizacao de output** | Nao | Sim (`sanitizePrompt` remove patterns) |
| **Template seguro** | Nao | Sim (`buildSafePrompt`) |
| **Scan de system prompt** | Sim (`scanSystemPrompt`) | Nao (foco no user prompt) |
| **Testes** | Sim (`prompt-injection-detector.test.ts`) | Sim (`promptSanitizer.test.ts`) |

### Gaps

- **raiz-platform**: Nao tem sanitizacao de output (remove patterns); nao tem template builder seguro
- **rAIz-AI-Prof**: Sem rate-limit escalation; sem middleware automatico (risco de bypass); sem scan de system prompts
- **Ambos**: Nao usam embeddings/ML para deteccao (apenas regex)

---

## 6. Rate Limiting

### raiz-platform

**Arquivos**:
- `src/lib/auth/rate-limit.ts` - Middleware para API routes (3 tiers)
- `src/lib/security/rate-limiter.ts` - Servico de rate limiting por tool/user

**Tiers (API middleware)**:

| Tier | Limite | Uso |
|---|---|---|
| `basic` | 100/min | GET endpoints |
| `standard` | 30/min | POST/PATCH/DELETE |
| `expensive` | 10/min | AI operations |

**Tiers (tool rate limiter)**:

| Tool | Limite |
|---|---|
| `default` | 60/min |
| `whatsappsend` | 10/min |
| `gmail_send_message` | 10/min |
| `bash`, `write`, `edit` | 30/min |
| `read`, `glob`, `grep` | 120/min |
| `daemon_register` | 5/min |
| `daemon_heartbeat` | 20/min |
| `daemon_tasks` | 100/min |

**Helpers**: `withRateLimit()` wrapper, `getRateLimitHeaders()`, `getRateLimitIdentifier()` (user ID ou IP)

**Backend**: Redis (Upstash) com fallback in-memory. Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.

### rAIz-AI-Prof

**Arquivos**:
- `api/_lib/rateLimit.ts` - Rate limiting distribuido
- `hooks/useRateLimit.ts` - Hook React para rate limit client-side

**Presets**:

| Preset | Limite |
|---|---|
| `llm_generate` | 30/min |
| `api_read` | 100/min |
| `api_write` | 50/min |
| `auth` | 10/min |
| `health` | 1000/min |
| `reports_generate` | 10/hora |
| `omr_process` | 20/min |
| `lti_login` | 30/min |
| `lti_jwks` | 200/min |

**Backend**: Redis (Upstash) via REST API pipeline (INCR + EXPIRE + TTL atomico) com fallback in-memory. Timeout configurable (`RATE_LIMIT_TIMEOUT_MS`) para evitar travamentos.

**Client-side**: Hook `useRateLimit` para protecao no frontend (UX).

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Backend** | Redis + in-memory | Redis + in-memory |
| **Metodo Redis** | `@upstash/ratelimit` SDK | REST API pipeline (raw fetch) |
| **Tiers** | 3 (basic/standard/expensive) | 9 presets customizados |
| **Client-side** | Nao | `useRateLimit` hook |
| **Headers** | X-RateLimit-* completos | Nao padronizado (sem headers) |
| **Wrapper helper** | `withRateLimit()` | Manual por endpoint |
| **Timeout** | Sem timeout explicito | `RATE_LIMIT_TIMEOUT_MS` |
| **Cobertura** | ~248 endpoints (baseado em grep count) | ~33 endpoints |

### Gaps

- **raiz-platform**: Sem rate limit no frontend; sem timeout explicito para Redis
- **rAIz-AI-Prof**: Sem headers X-RateLimit-* padronizados nas respostas; sem wrapper helper automatico
- **Ambos**: Sem rate limit por IP no middleware level (antes de auth); sem distributed rate limiting entre instancias serverless de forma perfeita

---

## 7. CORS

### raiz-platform

**Configuracao**: Nenhuma configuracao CORS explicita encontrada. Delegado ao Next.js (que por padrao nao adiciona headers CORS). O middleware (`src/middleware.ts`) nao seta headers CORS.

**Implicacao**: APIs sao acessiveis apenas de same-origin por padrao. Nao ha API publica que necessite CORS. CLI e Extension usam Bearer tokens, nao cookies.

### rAIz-AI-Prof

**Arquivo**: `api/_lib/http.ts:setCors()` e `getAllowedOrigins()`

**Configuracao**:
- **Producao**: Allowlist explicita (`APP_ORIGIN` env var + `VERCEL_URL` + `localhost:3000`)
- **Desenvolvimento**: Qualquer porta do localhost/127.0.0.1
- **Methods**: `GET, POST, OPTIONS`
- **Headers**: `Content-Type, X-CSRF-Token`
- **Max-Age**: 86400 (24h)
- **Vary**: `Origin` (correto para caching)
- **Sem origin**: Permite (server-to-server calls)

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Abordagem** | Sem CORS (same-origin only) | Allowlist programatica |
| **Wildcards** | N/A | Nao (sem `*`) |
| **Credentials** | N/A | Nao explicito (`Access-Control-Allow-Credentials` ausente) |
| **Preflight cache** | N/A | 24h |
| **Validacao** | N/A | Normalize + compare |

### Gaps

- **raiz-platform**: Se alguma API futura precisar de CORS (mobile app, etc.), nao ha infraestrutura
- **rAIz-AI-Prof**: `Access-Control-Allow-Credentials` ausente (pode ser problema se cookies forem necessarios)

---

## 8. CSRF Protection

### raiz-platform

**Status**: Nenhum modulo CSRF encontrado.

**Mitigacao implicita**: Next.js App Router usa server actions com tokens automaticos; Supabase usa JWT em cookies httpOnly; middleware verifica autenticacao em todas as rotas protegidas.

### rAIz-AI-Prof

**Arquivos**:
- `lib/security/csrf.ts` - Modulo completo de CSRF protection
- `api/_lib/http.ts:validateCsrfBasic()` - Validacao baseada em Origin/Referer

**Funcionalidades**:
- Token generation com `crypto.getRandomValues`
- Timing-safe comparison (`timingSafeEqual`)
- Storage em localStorage
- Hook React `useCsrfToken()` para integracao em componentes
- `csrfFetch()` - Wrapper de fetch que adiciona CSRF token automaticamente
- `validateCsrfBasic()` - Validacao Origin/Referer com Sec-Fetch headers
- Validacao de Origin com allowlist
- Referer validation como fallback
- Cross-site detection via `Sec-Fetch-Mode` + `Sec-Fetch-Site`

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Modulo dedicado** | Nao | Sim (completo) |
| **Token pattern** | N/A | Synchronizer token + Double submit |
| **Validacao Origin** | N/A | Sim (allowlist + Sec-Fetch) |
| **Validacao Referer** | N/A | Sim (fallback) |
| **React hook** | N/A | `useCsrfToken()` |
| **Fetch wrapper** | N/A | `csrfFetch()` |

### Gaps

- **raiz-platform**: Sem protecao CSRF explicita. Depende de SameSite cookies e JWT. Risco baixo mas nao zero
- **rAIz-AI-Prof**: Token em localStorage (vs httpOnly cookie) e menos seguro contra XSS que rouba o token

---

## 9. Secret Scanning e Redacao em Logs

### raiz-platform

**Arquivos**:
- `src/lib/security/secrets-scanner.ts` (278 linhas) - Scanner dedicado
- `src/lib/observability/logger.ts` - Logger estruturado com redacao automatica

**Secrets Scanner**:
- **22 patterns** de deteccao: AWS (2), GitHub (5), Generic API Key (2), Bearer/Basic (2), JWT (1), Private Key (1), Password in URL (1), Database URL (1), Slack (1), Stripe (1), Google (1), Supabase (1), OpenAI (1), Anthropic (1), Password Assignment (1), Env Secret (1)
- **3 patterns PII** (LGPD): Email, CPF, Phone BR
- **Analise de entropia** (Shannon entropy > 4.5 para strings >= 16 chars)
- **Categorias**: `secret` vs `pii` (filtravel)
- **Funcoes**: `scanForSecrets()`, `containsSecrets()`, `redactSecrets()`, `redactSecretsInObject()` (recursivo)
- **Confidence levels**: high, medium, low

**Logger** (`src/lib/observability/logger.ts`):
- `createLogEntry()` chama `redactSecrets(message)` e `redactSecretsInObject(data)` automaticamente
- JSON estruturado com `timestamp`, `service`, `env`, `context`, `data`, `error`
- Level filtering baseado em `LOG_LEVEL` env var
- Producao: remove `console.log/debug/trace` via Next.js compiler

### rAIz-AI-Prof

**Arquivos**:
- `lib/security/secureLogger.ts` (278 linhas) - Secure logger com redacao
- `lib/logging/sanitizer.ts` (99 linhas) - Sanitizacao de objetos de log
- `api/_lib/http.ts:redactSecrets()` - Redacao basica em HTTP helpers

**secureLogger**:
- **14 patterns regex**: OpenAI key, Google API, Anthropic key, Bearer, JWT, Password in URL, Email, Card number, CPF, Password/Senha/ApiKey/Token/Secret in JSON
- **25 campos sensiveis**: password, senha, apiKey, token, access_token, refresh_token, privateKey, authorization, cookie, session, ssn, cpf, credit_card, cvv, etc.
- **Redacao recursiva** com limite de profundidade (10)
- **Preview parcial**: `[REDACTED:sk-a...]` (mostra primeiros 4 chars)
- **Producao-aware**: Desativa debug logs em producao automaticamente

**Logging sanitizer** (`lib/logging/sanitizer.ts`):
- `sanitizeObject()` reutiliza `redactData()` do secureLogger
- `removeForbiddenFields()` - Remove campos proibidos (16 campos) completamente (nao redacta, remove)
- `hashSHA256()` para anonimizacao de IDs

**HTTP helpers** (`api/_lib/http.ts`):
- `redactSecrets()` basico: apenas 3 patterns (sk-*, AIza*, ya29.*)

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Patterns de secrets** | 22 + 3 PII | 14 + HTTP helper (3) |
| **Analise de entropia** | Sim (Shannon entropy) | Nao |
| **Categorias** | secret vs pii (filtravel) | Unico |
| **Redacao recursiva** | Sim (sem limite profundidade, por key pattern) | Sim (limite 10, por key name) |
| **Preview parcial** | `[REDACTED:AWS Access Key]` (tipo) | `[REDACTED:sk-a...]` (preview chars) |
| **Integracao logger** | Automatica (every log entry) | `createSecureLogger()` factory |
| **Campos forbid** | Por regex no key name | Set fixo de 25 campos |
| **Hash anonimizacao** | Nao | Sim (SHA-256) |
| **Producao-aware** | Sim (via LOG_LEVEL + Next.js compiler) | Sim (auto-detect hostname) |

### Gaps

- **raiz-platform**: Nao faz hash anonimizacao de IDs; sem preview parcial da secret (tipo vs conteudo)
- **rAIz-AI-Prof**: Sem analise de entropia; menos patterns (14 vs 22); HTTP helper tem apenas 3 patterns (insuficiente)
- **Ambos**: Nenhum integra com Sentry para filtrar secrets em error reports automaticamente

---

## 10. Idempotencia

### raiz-platform

**Arquivo**: `src/lib/security/idempotency.ts` (245 linhas)

**Funcionalidades**:
- Geracao de chave via SHA-256 (Web Crypto API) ou hash simples (fallback)
- Key pattern: `idem_{hash}_{toolName}` / SHA-256 full hex
- Cache in-memory com TTL (5 min padrao), max 1000 entries
- Metodos: `check()`, `record()`, `checkAndRecord()`, `invalidate()`, `invalidateUser()`
- Cleanup automatico via `setInterval`
- Eviction de entries antigas quando excede max
- Singleton pattern com `getIdempotencyService()`
- **Testes**: `src/lib/security/__tests__/idempotency.test.ts`

**Uso**: Prevencao de execucao duplicada de tools no agent service.

### rAIz-AI-Prof

**Status**: Nenhum modulo de idempotencia encontrado.

### Gap

- **rAIz-AI-Prof**: Sem protecao contra duplicidade. LLM calls duplicados podem gerar custo desnecessario e resultados inconsistentes
- **raiz-platform**: Idempotencia apenas in-memory (nao persiste entre instancias serverless)

---

## 11. SQL Injection

### raiz-platform

- **Supabase SDK**: Todas as queries via `.from().select().eq()` etc. (parametrizado)
- **MSSQL**: Via `mssql` package com prepared statements e `.input()` parametrizado
- **Raw SQL**: Migrations Supabase usam SQL direto, mas sao executadas pelo admin (nao user input)
- **RPC calls**: Via `.rpc('function_name', params)` (parametrizado pelo SDK)
- **Zod validation**: Input schemas validam tipos antes de chegar ao DB

### rAIz-AI-Prof

- **Supabase SDK**: Todas as queries via SDK (parametrizado)
- **Sem MSSQL**: Apenas Supabase (sem acesso SQL direto)
- **Dexie (IndexedDB)**: Queries locais com API parametrizada
- **Zod validation**: `lib/validation/schemas.ts` com schemas de formulario

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **ORM/SDK** | Supabase SDK + MSSQL | Supabase SDK + Dexie |
| **Raw SQL** | Sim (migrations, admin only) | Nao |
| **Prepared statements** | Sim (MSSQL `.input()`) | N/A (sem SQL direto) |
| **Zod validation** | Sim | Sim |
| **Risco residual** | MSSQL queries com interpolacao string | Baixo (tudo via SDK) |

### Gaps

- **raiz-platform**: Verificar se todos os queries MSSQL usam `.input()` e nao interpolacao de string
- **rAIz-AI-Prof**: Sem risco significativo (tudo via SDK)

---

## 12. Dependency Audit e SAST

### raiz-platform

| Ferramenta | Arquivo | Frequencia |
|---|---|---|
| `npm audit` | `.github/workflows/ci.yml` (security-audit job) | Push/PR |
| `npm audit` | `.github/workflows/quality-gates.yml` (npm-audit job) | Push/PR |
| Claude Security Review | `.github/workflows/security-review.yml` | PR (via Anthropic API) |
| AI Code Review | `.github/workflows/ai-code-review.yml` | PR |
| E2E Tests | `.github/workflows/ci.yml` (Playwright) | Push/PR |
| TypeCheck | `.github/workflows/ci.yml` + `typecheck.yml` | Push/PR |
| ESLint | `.github/workflows/ci.yml` | Push/PR |
| Bundle Size | `.github/workflows/ci.yml` | Push/PR |

**Destaque**: Claude Security Review usa `claude-haiku-4-5` para revisar diffs de PRs focando em OWASP Top 10, auth issues, data exposure, injection, secrets.

### rAIz-AI-Prof

| Ferramenta | Arquivo | Frequencia |
|---|---|---|
| CodeQL | `.github/workflows/codeql.yml` | Push/PR/Weekly (Monday) |
| `npm audit` | `.github/workflows/ci.yml` (dependency-check job) | Push/PR |
| OWASP ZAP Baseline | `.github/workflows/ci.yml` (security-scan job) | Push/PR |
| Custom security-audit.js | `.github/workflows/ci.yml` (security-scan job) | Push/PR |
| Quality Gates | `.github/workflows/quality-gates.yml` (npm-audit) | Push/PR |
| E2E Tests | `.github/workflows/ci.yml` (Playwright) | Push/PR |
| TypeCheck | `.github/workflows/ci.yml` | Push/PR |
| ESLint | `.github/workflows/ci.yml` | Push/PR |
| Lighthouse | `.github/workflows/lighthouse.yml` | Push/PR |

**Destaque**: OWASP ZAP faz scan automatico da aplicacao buildada; CodeQL faz analise estatica semanal; security-audit.js verifica OWASP Top 10 (access control, crypto, injection, CSRF, rate limiting, vulnerable components, auth, input validation, logging).

### Comparacao

| Ferramenta | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **CodeQL** | Ausente | Sim (weekly + PR) |
| **OWASP ZAP** | Ausente | Sim (baseline scan) |
| **AI Security Review** | Claude Haiku (PR) | Ausente |
| **Custom audit script** | Ausente | `security-audit.js` (OWASP) |
| **npm audit** | Sim (2 workflows) | Sim (2 workflows) |
| **SAST** | Via AI review | Via CodeQL |

### Gaps

- **raiz-platform**: Sem CodeQL (SAST); sem OWASP ZAP (DAST); sem script de audit customizado
- **rAIz-AI-Prof**: Sem AI-powered security review (complementar ao CodeQL)
- **Ambos**: Sem Snyk ou Dependabot para alertas automaticos de vulnerabilidades

---

## 13. Anti-Exfiltracao

### raiz-platform

**Arquivo**: `src/lib/security/secrets-scanner.ts`

- `scanForSecrets()` com opcao `excludeCategories` permite detectar vazamento de dados
- Categorias `secret` vs `pii` permitem checks separados (anti-exfil foca em `secret`)
- `containsSecrets()` como quick-check
- Logger integrado redacta automaticamente
- **Uso em agent**: O agent service pode usar o scanner para verificar outputs de tools antes de retornar ao usuario

### rAIz-AI-Prof

**Status**: Sem modulo dedicado de anti-exfiltracao.

- secureLogger redacta dados em logs, mas nao ha mecanismo para verificar dados saindo da aplicacao
- Nao ha verificacao de outputs de LLM antes de exibir ao usuario

### Gaps

- **rAIz-AI-Prof**: Nao verifica se respostas de LLM contem dados sensiveis antes de exibir
- **raiz-platform**: Anti-exfil existe mas nao esta aplicado sistematicamente em todos os outputs de LLM
- **Ambos**: Nao ha DLP (Data Loss Prevention) para uploads/downloads

---

## 14. Gaps Identificados

### Criticos (P0)

| # | Gap | Projeto | Impacto |
|---|---|---|---|
| G01 | `'unsafe-eval'` em CSP script-src | rAIz-AI-Prof | XSS via eval injection |
| G02 | Sem middleware automatico para prompt injection | rAIz-AI-Prof | Bypass se developer esquece de chamar sanitizer |
| G03 | Sem CodeQL ou SAST automatizado | raiz-platform | Vulnerabilidades estaticas nao detectadas |

### Altos (P1)

| # | Gap | Projeto | Impacto |
|---|---|---|---|
| G04 | CSP sem `base-uri`, `form-action`, `upgrade-insecure-requests` | raiz-platform | Ataques de base tag injection, form hijack |
| G05 | Sem report-to/report-uri no CSP | Ambos | Violacoes CSP nao monitoradas |
| G06 | Sem CSRF protection explicita | raiz-platform | Risco baixo mas presente com cookies |
| G07 | Sem idempotencia em LLM calls | rAIz-AI-Prof | Custo duplicado, resultados inconsistentes |
| G08 | img-src `https:` wildcard no CSP | rAIz-AI-Prof | Qualquer imagem HTTPS pode ser carregada (exfiltracao via img src) |

### Medios (P2)

| # | Gap | Projeto | Impacto |
|---|---|---|---|
| G09 | Sem rate-limit escalation em prompt injection | rAIz-AI-Prof | Ataques persistentes nao escalados |
| G10 | Sem X-Request-ID para correlacao | rAIz-AI-Prof | Debugging/auditoria dificultada |
| G11 | HSTS inconsistente (vercel.json vs setSecurityHeaders) | rAIz-AI-Prof | Comportamento diferente em SPA vs API |
| G12 | Sem analise de entropia em secrets | rAIz-AI-Prof | Secrets de formato desconhecido nao detectados |
| G13 | `ALLOW_DATA_ATTR: true` em sanitize rich | rAIz-AI-Prof | Vetor XSS via data attributes |
| G14 | Headers X-RateLimit-* ausentes | rAIz-AI-Prof | Clientes nao sabem quando estao perto do limite |
| G15 | Sem AI Security Review em PRs | rAIz-AI-Prof | Dependencia apenas de CodeQL (padrao, nao contextual) |
| G16 | Sem OWASP ZAP ou DAST | raiz-platform | Nao testa app em runtime |

### Baixos (P3)

| # | Gap | Projeto | Impacto |
|---|---|---|---|
| G17 | Sem `interest-cohort=()` no Permissions-Policy | raiz-platform | Tracking via Topics API possivel |
| G18 | Sem Trusted Types API | Ambos | DOM XSS via strings nao trusted |
| G19 | Sem Dependabot/Snyk alertas automaticos | Ambos | Alertas de vuln so no CI, nao em PRs automaticos |
| G20 | CSRF token em localStorage vs httpOnly cookie | rAIz-AI-Prof | Token roubavel via XSS |
| G21 | Sem DLP para uploads/downloads | Ambos | Dados sensiveis podem ser exportados |
| G22 | Idempotencia apenas in-memory | raiz-platform | Nao persiste entre instancias serverless |

---

## 15. Oportunidades Priorizadas

### P0 - Critico (resolver em 1-2 semanas)

| ID | Acao | Projeto | Esforco | Arquivo(s) |
|---|---|---|---|---|
| O01 | Remover `'unsafe-eval'` do CSP script-src | rAIz-AI-Prof | S (2h) | `vercel.json` |
| O02 | Criar middleware wrapper para prompt sanitizer | rAIz-AI-Prof | M (4h) | `domain/llm_providers/v0/` + novo `lib/ai/middleware/` |
| O03 | Adicionar CodeQL workflow | raiz-platform | S (1h) | `.github/workflows/codeql.yml` (copiar de rAIz) |

### P1 - Alto (resolver em 2-4 semanas)

| ID | Acao | Projeto | Esforco | Arquivo(s) |
|---|---|---|---|---|
| O04 | Adicionar `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests` ao CSP | raiz-platform | S (1h) | `src/middleware.ts` |
| O05 | Adicionar `report-to` com Sentry CSP integration | Ambos | M (4h) | Middleware/vercel.json |
| O06 | Implementar CSRF protection basica | raiz-platform | M (8h) | Novo `src/lib/security/csrf.ts` (reutilizar de rAIz) |
| O07 | Implementar IdempotencyService para LLM calls | rAIz-AI-Prof | M (4h) | Novo `lib/security/idempotency.ts` (reutilizar de raiz-platform) |
| O08 | Restringir `img-src` no CSP (remover wildcard `https:`) | rAIz-AI-Prof | S (2h) | `vercel.json` |

### P2 - Medio (resolver em 4-8 semanas)

| ID | Acao | Projeto | Esforco | Arquivo(s) |
|---|---|---|---|---|
| O09 | Adicionar rate-limit escalation ao prompt sanitizer | rAIz-AI-Prof | M (4h) | `lib/security/promptSanitizer.ts` |
| O10 | Adicionar X-Request-ID nos API handlers | rAIz-AI-Prof | S (2h) | `api/_lib/http.ts` |
| O11 | Unificar HSTS (remover do setSecurityHeaders, manter no vercel.json) | rAIz-AI-Prof | S (1h) | `api/_lib/http.ts` + `vercel.json` |
| O12 | Adicionar analise de entropia ao secureLogger | rAIz-AI-Prof | M (4h) | `lib/security/secureLogger.ts` (copiar de raiz-platform) |
| O13 | Adicionar headers X-RateLimit-* nas API responses | rAIz-AI-Prof | S (2h) | `api/_lib/rateLimit.ts` |
| O14 | Adicionar AI Security Review workflow | rAIz-AI-Prof | M (4h) | `.github/workflows/security-review.yml` (copiar de raiz-platform) |
| O15 | Adicionar OWASP ZAP baseline scan | raiz-platform | M (4h) | `.github/workflows/ci.yml` (copiar job de rAIz) |
| O16 | Remover `ALLOW_DATA_ATTR: true` do preset rich | rAIz-AI-Prof | S (1h) | `lib/security/sanitize.ts` |

### P3 - Baixo (backlog)

| ID | Acao | Projeto | Esforco |
|---|---|---|---|
| O17 | Adicionar `interest-cohort=()` ao Permissions-Policy | raiz-platform | S (30min) |
| O18 | Avaliar Trusted Types API para CSP | Ambos | L (pesquisa) |
| O19 | Configurar Dependabot ou Snyk | Ambos | S (2h) |
| O20 | Mover CSRF token para httpOnly cookie | rAIz-AI-Prof | M (8h) |
| O21 | Avaliar DLP para exports/uploads | Ambos | L (pesquisa) |
| O22 | Migrar idempotencia para Redis | raiz-platform | M (4h) |

---

## 16. Padroes Reutilizaveis

### De raiz-platform para rAIz-AI-Prof

| Padrao | Origem | Destino | Descricao |
|---|---|---|---|
| **Prompt Injection Middleware** | `src/lib/ai/middleware/prompt-validation.middleware.ts` | `lib/ai/middleware/` | Wrapper `withPromptValidation(provider)` que aplica scan automatico |
| **Secrets Scanner** | `src/lib/security/secrets-scanner.ts` | `lib/security/` | 22 patterns + entropia + categorias + redacao |
| **Idempotency Service** | `src/lib/security/idempotency.ts` | `lib/security/` | SHA-256 key generation + cache + TTL |
| **Rate Limit Headers** | `src/lib/auth/rate-limit.ts:getRateLimitHeaders()` | `api/_lib/rateLimit.ts` | `X-RateLimit-*` + `Retry-After` |
| **X-Request-ID** | `src/middleware.ts:generateRequestId()` | `api/_lib/http.ts` | Correlacao de requests com crypto random |
| **CodeQL Workflow** | N/A (a criar) | `.github/workflows/codeql.yml` | Reutilizar workflow ja existente no rAIz |
| **Claude Security Review** | `.github/workflows/security-review.yml` | `.github/workflows/` | AI-powered security review em PRs |

### De rAIz-AI-Prof para raiz-platform

| Padrao | Origem | Destino | Descricao |
|---|---|---|---|
| **CSRF Module** | `lib/security/csrf.ts` | `src/lib/security/` | Token generation + validation + React hook |
| **OWASP ZAP CI** | `.github/workflows/ci.yml` (security-scan job) | `.github/workflows/ci.yml` | Baseline scan DAST automatico |
| **Security Audit Script** | `scripts/security-audit.js` | `scripts/` | Audit customizado OWASP Top 10 |
| **CSP API Separado** | `vercel.json` (API CSP `default-src 'none'`) | `src/middleware.ts` | CSP ultra-restritivo para rotas API |
| **CORS Programatico** | `api/_lib/http.ts:setCors()` | `src/lib/` | Allowlist + Sec-Fetch validation |
| **Prompt Template Builder** | `lib/security/promptSanitizer.ts:buildSafePrompt()` | `src/lib/security/` | Template seguro com variaveis sanitizadas |
| **Client-side Rate Limit** | `hooks/useRateLimit.ts` | `src/hooks/` | Hook React para UX protection |
| **createSafeInnerHTML** | `lib/security/sanitize.ts` | `src/lib/utils/sanitize.ts` | Helper React para dangerouslySetInnerHTML |

---

## Apendice: Mapa de Arquivos de Seguranca

### raiz-platform

```
src/
  middleware.ts                              # Security headers, CSP, auth, RBAC
  lib/
    auth/
      rate-limit.ts                          # API rate limiting (3 tiers)
      api-middleware.ts                       # Auth middleware wrapper
      api-key-auth.ts                        # API key validation
      api-error-helpers.ts                   # Error helpers com rate limit
    security/
      prompt-injection-detector.ts           # 26 rules, 4 severities, escalation
      rate-limiter.ts                        # Per-user/tool rate limiting
      idempotency.ts                         # SHA-256 idempotency keys
      secrets-scanner.ts                     # 22 patterns + entropy + PII
    ai/
      middleware/
        prompt-validation.middleware.ts       # Provider wrapper automatico
    observability/
      logger.ts                              # Structured logger com redacao
    utils/
      sanitize.ts                            # DOMPurify (5 presets)
    external/
      signature.ts                           # HMAC signature verification
.github/
  workflows/
    ci.yml                                   # npm audit, bundle check, E2E
    security-review.yml                      # Claude AI security review
    ai-code-review.yml                       # AI code review
    quality-gates.yml                        # TS/ESLint budgets, npm audit
```

### rAIz-AI-Prof

```
lib/
  security/
    index.ts                                 # Barrel (SEC-001 a SEC-006)
    apiKeyValidator.ts                       # API key format validation
    auditLog.ts                              # Audit logging
    crypto.ts                                # AES-GCM encryption
    csrf.ts                                  # CSRF token management
    html.ts                                  # HTML escaping (legacy)
    promptSanitizer.ts                       # 14 regex + 8 strings + risk score
    sanitize.ts                              # DOMPurify (4 presets)
    secureLogger.ts                          # Logger com 14 patterns + 25 campos
  logging/
    sanitizer.ts                             # Log sanitization + SHA-256 hash
    logger.ts                                # Logger principal
  validation/
    schemas.ts                               # Zod schemas de formularios
api/
  _lib/
    rateLimit.ts                             # Redis + in-memory (9 presets)
    http.ts                                  # CORS, CSRF, security headers, redact
hooks/
  useRateLimit.ts                            # Client-side rate limit
scripts/
  security-audit.js                          # OWASP audit customizado
.github/
  workflows/
    ci.yml                                   # npm audit, OWASP ZAP, E2E, security-audit
    codeql.yml                               # CodeQL SAST (weekly + PR)
    quality-gates.yml                        # TS/ESLint budgets, npm audit
```

---

## Apendice: Checklist de Verificacao Rapida

| Check | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| Security headers em todas as rotas | OK | OK |
| CSP aplicado | OK (dinamico) | OK (estatico) |
| CSP sem `'unsafe-eval'` | OK | **FALHA** |
| `frame-ancestors 'none'` | OK | OK |
| HSTS com preload | OK (63M sec) | Parcial (31M sec SPA / sem preload API) |
| Sanitizacao HTML (DOMPurify) | OK (5 presets) | OK (4 presets) |
| Prompt injection detection | OK (avancado) | OK (basico) |
| Rate limiting backend | OK (Redis) | OK (Redis) |
| Rate limiting frontend | **AUSENTE** | OK (hook) |
| CORS controlado | OK (same-origin) | OK (allowlist) |
| CSRF protection | **AUSENTE** | OK (modulo completo) |
| Secret redaction em logs | OK (automatico) | OK (automatico) |
| Secret scanning (patterns) | OK (22+3 patterns) | OK (14 patterns) |
| Entropy analysis | OK | **AUSENTE** |
| Idempotency | OK (in-memory) | **AUSENTE** |
| SQL injection prevention | OK (SDK + prepared) | OK (SDK) |
| npm audit em CI | OK | OK |
| CodeQL/SAST | **AUSENTE** | OK |
| OWASP ZAP/DAST | **AUSENTE** | OK |
| AI security review | OK (Claude) | **AUSENTE** |
| E2E tests | OK (Playwright) | OK (Playwright) |
| Audit logging | Parcial (audit_logs table) | OK (auditLog.ts) |
| API key validation | Via middleware | OK (modulo dedicado) |
| Encryption at rest | Via Supabase | OK (AES-GCM) |
