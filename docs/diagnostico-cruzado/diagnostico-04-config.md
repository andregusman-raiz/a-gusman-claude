# D04 — Diagnostico Cruzado: Configuracao & Environment

> Comparacao detalhada de gestao de configuracao e variaveis de ambiente entre **raiz-platform** e **rAIz-AI-Prof**.

---

## 1. Resumo Executivo

| Dimensao | raiz-platform | rAIz-AI-Prof |
|----------|--------------|--------------|
| **Framework** | Next.js 14 (SSR/SSG) | Vite 7 (SPA) + Vercel Serverless |
| **Validacao de Env** | Zod schema completo (~60 vars) | Nenhuma validacao estruturada |
| **Feature Flags** | DB-backed + Redis cache + workspace overrides | Hardcoded in-memory por dominio |
| **Config Management** | Centralizado (`lib/config/`) + JSON file | Disperso por 22+ arquivos |
| **Secrets Handling** | `process.env` server-side via Zod | `import.meta.env` com guard SEC-001 |
| **Fail-fast** | Sim, throw no startup | Nao, placeholder silencioso |
| **Maturidade** | Alta (4/5) | Baixa (1.5/5) |

---

## 2. Analise Detalhada

### 2.1 Validacao de Variaveis de Ambiente

#### raiz-platform — Zod Schema Validado

**Arquivos-chave:**
- `D:\GitHub\raiz-platform\src\lib\config\env.schema.ts` — Schema Zod com 15 sub-schemas
- `D:\GitHub\raiz-platform\src\lib\config\env.ts` — Modulo de acesso com cache e fail-fast
- `D:\GitHub\raiz-platform\scripts\generate-env-docs.ts` — Geracao automatica de .env.example

**Mecanismo:**
```typescript
// env.schema.ts — Exemplo do schema composto
export const envSchema = supabaseSchema      // REQUIRED: URL + anon_key + service_role
  .merge(appSchema)                          // NODE_ENV, APP_URL
  .merge(aiProviderSchema)                   // Anthropic, OpenAI, Google (pelo menos 1)
  .merge(redisSchema)                        // Upstash (optional)
  .merge(securitySchema)                     // ENCRYPTION_KEY, CRON_SECRET
  .merge(n8nSchema)                          // n8n integration
  .merge(emailSchema)                        // Resend
  .merge(zapiSchema)                         // WhatsApp Z-API
  .merge(oauthSchema)                        // Google, HubSpot OAuth
  .merge(otelSchema)                         // OpenTelemetry
  .merge(totvsSchema)                        // TOTVS SQL Server
  .merge(smtpSchema)                         // Email SMTP
  .merge(metabaseSchema)                     // Metabase BI
  .merge(videoSchema)                        // Video rendering
  .refine(...);                              // Validacao cross-field
```

**Pontos fortes:**
- Fail-fast com mensagens claras no startup
- Cache apos primeira validacao (`_config` singleton)
- Tipo `EnvConfig` inferido automaticamente via `z.infer`
- Helpers tipados: `getEnv('KEY')` retorna tipo correto
- Validacao cross-field (ex: pelo menos 1 AI provider)
- Script para gerar documentacao de env vars
- Funcoes utilitarias: `isDevelopment()`, `isProduction()`, `isTest()`

**Gaps identificados:**
- Schema nao inclui `FIREBASE_*` vars listadas no proprio schema (parcialmente coberto)
- `.env.example` nao existe no repositorio (apenas templates em `.agents/skills/`)
- `config/app.config.json` contem uma API key hardcoded (`googleApiKey`) — **RISCO DE SEGURANCA**

#### rAIz-AI-Prof — Sem Validacao Estruturada

**Arquivos-chave:**
- `D:\GitHub\rAIz-AI-Prof\config\environment.ts` — Apenas deteccao dev/prod
- `D:\GitHub\rAIz-AI-Prof\lib\supabase\client.ts` — Acesso direto a `import.meta.env`
- `D:\GitHub\rAIz-AI-Prof\domain\llm_providers\v0\llm_providers_v0.env.ts` — Guard SEC-001
- `D:\GitHub\rAIz-AI-Prof\env.example.txt` / `env.example.new.txt` — Documentacao manual

**Mecanismo:**
```typescript
// lib/supabase/client.ts — Acesso direto sem validacao
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Se nao configurado, usa placeholder (nao falha!)
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';
```

**Pontos fortes:**
- Guard SEC-001 para proteger API keys em producao (retorna null fora de localhost)
- `env.example.new.txt` bem documentado com secoes claras
- Funcao `requireEnv()` no serverless (`api/llm/generate.ts`) com throw explicitado
- Health endpoint (`/api/health`) verifica env vars com fallbacks

**Gaps criticos:**
- Zero validacao no startup — app carrega com placeholders silenciosos
- 22 arquivos acessam `import.meta.env` diretamente (sem centralizacao)
- `as string` type assertion em vez de validacao real
- Sem schema Zod ou equivalente
- Dois arquivos `.env.example` com conteudo ligeiramente diferente (confusao)
- Serverless (`api/`) usa `process.env` raw sem schema
- Nomes de variaveis inconsistentes entre frontend e backend (ex: `VITE_GOOGLE_API_KEY` vs `GEMINI_API_KEY`)

---

### 2.2 Feature Flags

#### raiz-platform — DB-Backed com Redis Cache

**Arquivos-chave:**
- `D:\GitHub\raiz-platform\src\lib\config\features.ts` — Definicoes hardcoded (fallback)
- `D:\GitHub\raiz-platform\src\lib\config\feature-flag.service.ts` — Service async com DB + Redis
- `D:\GitHub\raiz-platform\supabase\migrations\133_feature_flags.sql` — Tabela + RLS
- `D:\GitHub\raiz-platform\src\lib\conversation\feature-flags.ts` — Flags por modulo (env-based)

**Arquitetura (3 camadas):**

| Camada | Fonte | Prioridade | Uso |
|--------|-------|-----------|-----|
| Workspace-specific | Supabase `feature_flags` WHERE `workspace_id = X` | 1 (mais alta) | Server-side |
| Global DB | Supabase `feature_flags` WHERE `workspace_id IS NULL` | 2 | Server-side |
| Hardcoded | `features.ts` `FEATURES` object | 3 (fallback) | Client + Server |

**Mecanismo:**
```typescript
// feature-flag.service.ts — Resolucao com cache Redis
export async function isFeatureEnabledForWorkspace(
  feature: FeatureKey,
  workspaceId?: string
): Promise<boolean> {
  return cacheWithFallback(
    `ff:${feature}:${workspaceId || 'global'}`,
    async () => {
      // 1. Check workspace override
      // 2. Check global DB flag
      // 3. Fallback to FEATURES[feature]
    },
    30 // cache 30 seconds
  );
}
```

**Pontos fortes:**
- Rollout gradual por workspace sem deploy
- Cache Redis de 30s reduz latencia
- RLS com read publico e write admin-only
- Tipo `FeatureKey` garante type-safety
- Metadata JSONB para rollout percentual futuro
- Fallback gracioso se DB indisponivel

**Flags adicionais (env-based):**
- `CONVERSATION_CORE_PROMPTS`, `CONVERSATION_CORE_TOOLS`, `CONVERSATION_CORE_HISTORY`
- Controlam rollout de features especificas do conversation core

#### rAIz-AI-Prof — Hardcoded In-Memory por Dominio

**Arquivos-chave:**
- `D:\GitHub\rAIz-AI-Prof\lib\feature-flags.ts` — Placeholder vazio (`export {}`)
- `D:\GitHub\rAIz-AI-Prof\domain\aluno\estudo_socratico\v0\estudo_socratico_v0.feature_flags.ts`
- `D:\GitHub\rAIz-AI-Prof\domain\presentation\v0\presentation_v0.feature_flags.ts`
- `D:\GitHub\rAIz-AI-Prof\domain\support\v0\support_v0.feature_flags.ts`

**Mecanismo:**
```typescript
// Per-domain hardcoded flags (ex: presentation)
export const PRESENTATION_AI_FEATURE_FLAGS = {
  TEXT_GENERATION: true,
  IMAGE_GENERATION: true,
  GLOBAL_ENABLE: true,
};

// Toggle via funcoes exportadas (muda estado em runtime memory)
export function enableAiForText() { ... }
export function disableAiForText() { ... }
```

**Pontos fortes:**
- Padroes consistentes entre dominios (GLOBAL_ENABLE + sub-flags)
- Funcoes toggle para rollback rapido em runtime
- Logging em cada mudanca de flag

**Gaps criticos:**
- `lib/feature-flags.ts` e um placeholder vazio — sistema centralizado nunca implementado
- Flags sao hardcoded no bundle — mudanca requer deploy
- Sem persistencia — toggle em runtime se perde no proximo page refresh
- Cada dominio reimplementa o mesmo pattern (~70 linhas duplicadas x 3)
- Sem per-user/per-organization override
- `env.example.new.txt` lista feature flags via VITE_* (`VITE_DEBUG_MODE`, `VITE_ENABLE_ANALYTICS`) mas nao ha codigo que as consuma

---

### 2.3 Config Management

#### raiz-platform — Centralizado com Merge de Fontes

**Arquivos-chave:**
- `D:\GitHub\raiz-platform\src\lib\config.ts` — Config management com 3 fontes
- `D:\GitHub\raiz-platform\config\app.config.json` — Config file persistido

**Hierarquia de merge:**
```
Environment vars (maior prioridade)
  └─ config/app.config.json
      └─ DEFAULT_CONFIG (menor prioridade)
```

**Funcoes disponíveis:**
- `getAppConfig()` — Retorna config merged e cached
- `saveAppConfig(partial)` — Persiste alteracoes no JSON
- `updateLimits()` / `updateClaudeConfig()` / `updateImageApiConfig()` — Helpers especializados
- `getImageModelForUseCase()` — Config per-use-case com recommended defaults

**Pontos fortes:**
- Merge inteligente com deep-merge para sub-objetos
- Cache com `clearConfigCache()` para invalidacao
- Config file persistido para settings que nao vem de env vars

**Gaps:**
- **SEGURANCA**: `config/app.config.json` contem API key do Google hardcoded no repositorio
- Config file esta no `.gitignore`? (nao verificado — se commitado, e um leak)

#### rAIz-AI-Prof — Config Disperso

**Arquivos relevantes:**
- `D:\GitHub\rAIz-AI-Prof\config\environment.ts` — Apenas dev/prod detection (8 linhas de logica)
- `D:\GitHub\rAIz-AI-Prof\lib\query\client.ts` — Constantes hardcoded para TanStack Query
- `D:\GitHub\rAIz-AI-Prof\lib\monitoring\analytics.ts` — Config inline
- `D:\GitHub\rAIz-AI-Prof\lib\monitoring\sentry.ts` — Config inline
- `D:\GitHub\rAIz-AI-Prof\api\_lib\rateLimit.ts` — Constantes de rate limit

**Problemas:**
- Nao existe um modulo centralizado de config
- Cada modulo define suas proprias constantes inline
- Nao ha merge de fontes (apenas import.meta.env direto)
- Rate limit presets estao hardcoded no API layer, nao configuráveis

---

### 2.4 Secrets Handling

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **API Keys** | `process.env` server-side, validado por Zod | `import.meta.env.VITE_*` no frontend (dev), `process.env` no serverless (prod) |
| **Guard contra exposicao** | Next.js isola server/client naturalmente | SEC-001: `isLocalDevelopment()` guard manual |
| **Supabase Service Role** | Server-only via `SUPABASE_SERVICE_ROLE_KEY` | Nao usa service role (client-only com anon key) |
| **Encryption** | `ENCRYPTION_KEY` (64 hex chars, validado) | Nao existe |
| **Segredo de CRON** | `CRON_SECRET` validado | Nao existe |
| **Risco principal** | API key em `config/app.config.json` | API keys VITE_* no bundle em dev (design intencional, mas arriscado) |

#### Fluxo de Seguranca do rAIz-AI-Prof (SEC-001):

```
[Dev Local]                           [Producao]
import.meta.env.VITE_*  ──────>  /api/llm/generate.ts
  (no bundle JS)                    process.env.GEMINI_API_KEY
  isLocalDevelopment()=true         isLocalDevelopment()=false
  → retorna API key                → retorna null (proxy serverless)
```

Esse design e defensivo, mas depende de um guard manual em cada ponto de acesso. Um unico `import.meta.env.VITE_OPENAI_API_KEY` sem o guard SEC-001 vaza a key.

---

### 2.5 Arquivos .env

#### raiz-platform

| Arquivo | Status | Notas |
|---------|--------|-------|
| `.env` | .gitignore | - |
| `.env.local` | .gitignore | Usado em dev |
| `.env.example` | **NAO EXISTE** | Gap — deveria existir |
| `.env.development` | .gitignore | - |
| `.env.production` | .gitignore | - |
| `.env.staging` | .gitignore | - |
| `.env.vercel` | .gitignore | - |

**Templates disponíveis** (em `.agents/skills/ln-733-env-configurator/references/`):
- `env_development.template`
- `env_example.template`
- `env_production.template`

**Script de geracao:** `scripts/generate-env-docs.ts` gera `.env.example` automaticamente a partir do schema.

#### rAIz-AI-Prof

| Arquivo | Status | Notas |
|---------|--------|-------|
| `.env` | .gitignore | - |
| `.env.*` | .gitignore | Exceto .env.example* |
| `env.example.txt` | Commitado | 58 linhas, basico |
| `env.example.new.txt` | Commitado | 90 linhas, mais completo |
| `.env.local` | .gitignore | Usado em dev |

**Problema:** Dois arquivos example divergentes. `env.example.new.txt` inclui Azure, Sentry, Analytics e feature flags que `env.example.txt` nao tem. Nenhum dos dois segue o nome convencional `.env.example`.

---

### 2.6 Build-time vs Runtime Config

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Build-time** | `NEXT_PUBLIC_*` incorporado no bundle JS | `VITE_*` incorporado via `import.meta.env` |
| **Runtime (server)** | `process.env` em API routes e server components | `process.env` em Vercel serverless (`api/`) |
| **Runtime (client)** | `NEXT_PUBLIC_*` (prefixo obrigatorio) | `VITE_*` (prefixo obrigatorio) |
| **Separacao server/client** | Automatica pelo Next.js | Manual — guard SEC-001 necessario |
| **Risco de leak** | Baixo (Next.js bloqueia server vars no client) | Medio (dev keys VITE_* no bundle, sem validacao automatica) |

---

### 2.7 Fail-fast em Config Ausente

#### raiz-platform — Fail-fast Completo

```typescript
// getValidatedConfig() lanca Error com detalhes
throw new Error(
  `[Config] Variaveis de ambiente invalidas:\n${issues}\n\n` +
  `Verifique .env.local ou as variaveis no Vercel Dashboard.`
);
```

Resultado: App nao inicia se config invalida. Desenvolvedor ve exatamente o que falta.

#### rAIz-AI-Prof — Fail-silent

```typescript
// lib/supabase/client.ts — placeholder silencioso
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';
```

Resultado: App inicia normalmente mas funcionalidades falham em runtime com erros crypticos. Unica excecao: `requireEnv()` no serverless `api/llm/generate.ts` faz fail-fast.

---

## 3. Tabela Comparativa Completa

| Dimensao | raiz-platform | rAIz-AI-Prof | Gap |
|----------|--------------|--------------|-----|
| Schema de validacao | Zod com 15 sub-schemas | Nenhum | **CRITICO** |
| Fail-fast no startup | Sim | Nao (placeholder) | **CRITICO** |
| Tipo inferido de env | `EnvConfig` via `z.infer` | `as string` assertions | **ALTO** |
| Feature flags (storage) | PostgreSQL + Redis | Hardcoded in-memory | **ALTO** |
| Feature flags (granularidade) | Per-workspace | Per-domain (sem per-user) | **MEDIO** |
| Feature flags (toggle sem deploy) | Sim (DB update) | Nao (requer deploy) | **ALTO** |
| Config centralizado | `lib/config.ts` + `lib/config/env.ts` | Nao existe | **ALTO** |
| Merge de fontes | 3 camadas (env > file > default) | N/A | **MEDIO** |
| Secrets no server | Isolados automaticamente (Next.js) | Guard manual SEC-001 | **MEDIO** |
| .env.example | Nao existe (mas tem script gerador) | 2 arquivos divergentes | **BAIXO** |
| Health check de env | Parcial (via API routes) | Sim (`/api/health`) | OK |
| Documentacao de env | Script auto-generator | Inline nos .env.example | **BAIXO** |
| Validacao cross-field | Sim (Zod refine) | Nao | **ALTO** |
| Constantes de rate limit | Redis-backed (`@upstash/ratelimit`) | Hardcoded no API layer | **MEDIO** |
| API key no repositorio | **SIM** (app.config.json) | Nao | **CRITICO (raiz-platform)** |

---

## 4. Gaps Identificados

### 4.1 Gaps em rAIz-AI-Prof (para importar de raiz-platform)

| # | Gap | Severidade | Descricao |
|---|-----|-----------|-----------|
| G1 | Sem validacao Zod de env | CRITICA | 40 usos de `import.meta.env` sem validacao alguma |
| G2 | Fail-silent com placeholders | CRITICA | App inicia com config invalida, falhas em runtime |
| G3 | Feature flags hardcoded | ALTA | Requer deploy para toggle, sem per-org override |
| G4 | Config disperso | ALTA | 22+ arquivos acessam env vars diretamente |
| G5 | Dois .env.example divergentes | MEDIA | `env.example.txt` vs `env.example.new.txt` |
| G6 | Nomes inconsistentes frontend/backend | MEDIA | `VITE_GOOGLE_API_KEY` vs `GEMINI_API_KEY` |
| G7 | Feature flags VITE_* nao consumidas | BAIXA | Documentadas mas sem codigo que as leia |
| G8 | Sem encryption key / cron secret | MEDIA | Nao ha mecanismo de encriptacao de dados sensiveis |
| G9 | lib/feature-flags.ts vazio | MEDIA | Placeholder nunca implementado |

### 4.2 Gaps em raiz-platform (para corrigir internamente)

| # | Gap | Severidade | Descricao |
|---|-----|-----------|-----------|
| G10 | API key em app.config.json | CRITICA | Google API key hardcoded no config file |
| G11 | .env.example ausente | MEDIA | Templates existem mas .env.example nao e gerado |
| G12 | Schema nao cobre Firebase completamente | BAIXA | Vars parcialmente cobertas |

---

## 5. Oportunidades Priorizadas

### P0 — Critico (implementar imediatamente)

#### P0-1: Criar schema Zod de env para rAIz-AI-Prof

**Impacto:** Elimina G1, G2, G4, G6
**Esforco:** M (4-8h)
**Referencia:** `D:\GitHub\raiz-platform\src\lib\config\env.schema.ts`

**Plano:**
1. Criar `D:\GitHub\rAIz-AI-Prof\lib\config\env.schema.ts` com sub-schemas:
   - `supabaseSchema`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `appSchema`: `VITE_APP_NAME`, `VITE_APP_VERSION`, `VITE_APP_ENV`
   - `monitoringSchema`: `VITE_SENTRY_DSN`, `VITE_ANALYTICS_DOMAIN`
   - `devOnlySchema`: `VITE_GOOGLE_API_KEY`, `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`
2. Criar `D:\GitHub\rAIz-AI-Prof\lib\config\env.ts` com:
   - `getClientEnv()` — validado para frontend (`import.meta.env`)
   - `getServerEnv()` — validado para serverless (`process.env`)
   - Fail-fast com mensagens claras
3. Criar `D:\GitHub\rAIz-AI-Prof\lib\config\env.server.ts` para o API layer:
   - `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Refatorar os 22 arquivos para usar `getClientEnv()` em vez de `import.meta.env` direto

```typescript
// lib/config/env.schema.ts (proposta)
import { z } from 'zod';

export const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('SUPABASE_URL deve ser uma URL valida'),
  VITE_SUPABASE_ANON_KEY: z.string().min(20, 'ANON_KEY parece curta demais'),
  VITE_APP_NAME: z.string().default('rAIz AI Prof'),
  VITE_APP_VERSION: z.string().default('2.0.0'),
  VITE_APP_ENV: z.enum(['development', 'production', 'staging']).default('development'),
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_ANALYTICS_DOMAIN: z.string().optional(),
  // Dev-only keys (opcionais, usados apenas em localhost)
  VITE_GOOGLE_API_KEY: z.string().optional(),
  VITE_OPENAI_API_KEY: z.string().optional(),
  VITE_ANTHROPIC_API_KEY: z.string().optional(),
});

export const serverEnvSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
}).refine(
  d => d.GEMINI_API_KEY || d.OPENAI_API_KEY || d.ANTHROPIC_API_KEY,
  { message: 'Pelo menos uma API key de LLM e obrigatoria no servidor' }
);
```

#### P0-2: Remover API key do app.config.json (raiz-platform)

**Impacto:** Elimina G10
**Esforco:** S (30min)
**Acao:** Remover `googleApiKey` de `D:\GitHub\raiz-platform\config\app.config.json`, rotacionar a key comprometida, adicionar `config/app.config.json` ao `.gitignore` se nao estiver.

---

### P1 — Alta Prioridade (proximo sprint)

#### P1-1: Implementar feature flags centralizadas no rAIz-AI-Prof

**Impacto:** Elimina G3, G9
**Esforco:** L (8-16h)
**Referencia:** `D:\GitHub\raiz-platform\src\lib\config\feature-flag.service.ts`

**Plano:**
1. Criar tabela `feature_flags` no Supabase do rAIz-AI-Prof (copiar migration 133 de raiz-platform, adaptar para `organization_id` em vez de `workspace_id`)
2. Implementar `lib/config/feature-flag.service.ts` com:
   - Resolucao: organization override > global DB > hardcoded fallback
   - Cache client-side via TanStack Query (staleTime: 60s)
   - Sem Redis (simplificar — o projeto nao tem server-side cache)
3. Migrar os 3 feature flag files de dominio para o sistema centralizado
4. Criar hook `useFeatureFlag(key: string): boolean` para consumo no React

```typescript
// lib/config/feature-flags.ts (proposta)
import { from } from '@/lib/supabase/client';

export type FeatureKey =
  | 'ai.socratic.analysis'
  | 'ai.socratic.questions'
  | 'ai.socratic.synthesis'
  | 'ai.presentation.text'
  | 'ai.presentation.images'
  | 'ai.support.global';

const DEFAULTS: Record<FeatureKey, boolean> = {
  'ai.socratic.analysis': true,
  'ai.socratic.questions': true,
  'ai.socratic.synthesis': true,
  'ai.presentation.text': true,
  'ai.presentation.images': true,
  'ai.support.global': true,
};

export async function isFeatureEnabled(
  key: FeatureKey,
  orgId?: string
): Promise<boolean> {
  try {
    if (orgId) {
      const { data } = await from('feature_flags')
        .select('enabled')
        .eq('key', key)
        .eq('organization_id', orgId)
        .single();
      if (data) return data.enabled;
    }
    const { data } = await from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .is('organization_id', null)
      .single();
    if (data) return data.enabled;
  } catch { /* DB indisponivel */ }
  return DEFAULTS[key] ?? false;
}
```

#### P1-2: Centralizar config do rAIz-AI-Prof

**Impacto:** Elimina G4
**Esforco:** M (4-8h)

**Plano:**
1. Criar `D:\GitHub\rAIz-AI-Prof\lib\config\index.ts` como ponto unico de acesso
2. Mover constantes dispersas (rate limits, stale times, etc.) para `lib\config\constants.ts`
3. Refatorar imports nos 22 arquivos para usar o modulo centralizado

#### P1-3: Unificar .env.example do rAIz-AI-Prof

**Impacto:** Elimina G5
**Esforco:** S (1h)
**Acao:** Merge de `env.example.txt` e `env.example.new.txt` em um unico `.env.example`, deletar os arquivos antigos.

---

### P2 — Media Prioridade (backlog)

#### P2-1: Gerar .env.example automaticamente (raiz-platform)

**Impacto:** Elimina G11
**Esforco:** S (1h)
**Acao:** Rodar `npx tsx scripts/generate-env-docs.ts` e commitar o output. Adicionar ao CI para manter atualizado.

#### P2-2: Implementar feature flags via env no rAIz-AI-Prof (interim)

**Impacto:** Parcialmente elimina G3 (solucao temporaria antes de P1-1)
**Esforco:** S (2h)
**Acao:** Consumir `VITE_DEBUG_MODE`, `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_SENTRY` que ja estao documentados no `.env.example`. Conectar ao `config/environment.ts`.

#### P2-3: Padronizar nomes de variaveis (rAIz-AI-Prof)

**Impacto:** Elimina G6
**Esforco:** S (2h)
**Acao:** Documentar convencao (VITE_* para client, sem prefixo para server). Aliases no health check ja cobrem (`SUPABASE_URL` fallback para `VITE_SUPABASE_URL`).

---

### P3 — Baixa Prioridade (nice-to-have)

#### P3-1: Adicionar encryption key management ao rAIz-AI-Prof

**Impacto:** Elimina G8
**Esforco:** M (4h)
**Referencia:** `ENCRYPTION_KEY` schema em `D:\GitHub\raiz-platform\src\lib\config\env.schema.ts`

#### P3-2: Cobrir Firebase vars no schema de raiz-platform

**Impacto:** Elimina G12
**Esforco:** S (30min)
**Acao:** Verificar se o `firebaseSchema` esta de fato incluido no merge do `envSchema`.

---

## 6. Patterns Reutilizaveis

### Pattern 1: Zod Env Schema (raiz-platform -> rAIz-AI-Prof)

**Origem:** `D:\GitHub\raiz-platform\src\lib\config\env.schema.ts`
**Aplicacao:** Criar equivalente Vite-aware para rAIz-AI-Prof

Adaptacoes necessarias:
- Trocar `process.env` por `import.meta.env` no client
- Manter `process.env` para o API layer serverless
- Adicionar prefixo `VITE_` no schema client-side

### Pattern 2: Feature Flag Service com Fallback (raiz-platform -> rAIz-AI-Prof)

**Origem:** `D:\GitHub\raiz-platform\src\lib\config\feature-flag.service.ts`
**Aplicacao:** Adaptar para TanStack Query cache em vez de Redis

Adaptacoes necessarias:
- Substituir `cacheWithFallback()` (Redis) por `useQuery()` com `staleTime: 60_000`
- Trocar `workspace_id` por `organization_id` (modelo de dados do rAIz-AI-Prof)
- Simplificar — nao precisa de admin client (usar anon key com RLS)

### Pattern 3: Config Management com Merge de Fontes (raiz-platform -> rAIz-AI-Prof)

**Origem:** `D:\GitHub\raiz-platform\src\lib\config.ts`
**Aplicacao:** Adaptar para SPA (sem filesystem access)

Adaptacoes necessarias:
- Remover `fs.readFileSync` (SPA nao tem acesso a filesystem)
- Substituir config file por localStorage/Supabase
- Manter hierarquia: env vars > remote config > defaults

### Pattern 4: requireEnv() (rAIz-AI-Prof -> raiz-platform)

**Origem:** `D:\GitHub\rAIz-AI-Prof\api\llm\generate.ts`
**Aplicacao:** Pattern simples e eficaz para serverless functions

```typescript
function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v || v.trim() === '') {
    throw new Error(`Configuração incompleta: ${key} não configurada.`);
  }
  return v;
}
```

Embora raiz-platform ja tenha o Zod schema, esse pattern e util para contextos onde o schema completo e overkill (scripts, edge functions).

### Pattern 5: Health Check de Env (rAIz-AI-Prof -> raiz-platform)

**Origem:** `D:\GitHub\rAIz-AI-Prof\api\health.ts`
**Aplicacao:** Endpoint diagnostico com checagem de env + conectividade

raiz-platform tem `/api/health` mas poderia adotar o formato estruturado de `HealthResponse` com checks individuais (`env`, `supabase`, `llm`).

---

## 7. Riscos e Alertas

### ALERTA CRITICO: API Key Exposta

O arquivo `D:\GitHub\raiz-platform\config\app.config.json` contem:
```json
"imageApi": {
  "provider": "google",
  "googleApiKey": "AIzaSyCEl_HkXOBRIeVlbeYjrXdhxLsXQgQbHC4"
}
```

**Acao imediata necessaria:**
1. Rotacionar esta key no Google Cloud Console
2. Remover do config file
3. Mover para variavel de ambiente `GOOGLE_API_KEY` (ja coberta pelo schema)
4. Verificar se este arquivo esta no `.gitignore`
5. Se foi commitado, considerar `git filter-branch` ou BFG para remover do historico

### ALERTA MEDIO: Keys VITE_* no Bundle

O rAIz-AI-Prof expoe API keys via `VITE_*` em desenvolvimento. Embora o guard SEC-001 previna uso em producao, um erro de configuracao (ex: `VITE_GOOGLE_API_KEY` setado no Vercel) incluiria a key no bundle publico.

**Mitigacao:** O schema Zod proposto (P0-1) pode incluir uma validacao que rejeita `VITE_*_API_KEY` em producao builds.

---

## 8. Roadmap de Implementacao Sugerido

```
Semana 1 (P0):
├── P0-2: Remover API key do app.config.json (30min)
└── P0-1: Schema Zod para rAIz-AI-Prof (4-8h)
    ├── Criar lib/config/env.schema.ts
    ├── Criar lib/config/env.ts
    ├── Criar lib/config/env.server.ts
    └── Refatorar 22 arquivos

Semana 2 (P1):
├── P1-3: Unificar .env.example (1h)
├── P1-2: Centralizar config (4-8h)
└── P1-1: Feature flags DB-backed (8-16h, pode iniciar em paralelo)

Semana 3+ (P2/P3):
├── P2-1: Gerar .env.example raiz-platform (1h)
├── P2-2: Feature flags via env (interim) (2h)
├── P2-3: Padronizar nomes (2h)
└── P3-*: Nice-to-have
```

**Esforco total estimado:** ~30-40h para fechar todos os gaps criticos e altos.

---

*Documento gerado em 2026-03-01. Baseado na analise do codigo-fonte de ambos os projetos.*
