# Security Patterns (Cross-Project)

## Principios Fundamentais

1. **RLS em TODAS as tabelas** — sem excecao (ver supabase.md)
2. **Audit trail** — JSONB com quem, o que, quando, onde, resultado
3. **LGPD compliance** — base legal, direito ao esquecimento, minimizacao
4. **Secrets nunca no codigo** — .env.local para dev, env vars do provider para prod

## NUNCA Logar
- password, token, secret, apiKey
- creditCard, cpf, rg, PII
- Headers de autorizacao completos
- Request bodies com dados sensiveis

## Niveis de Permissao (quando aplicavel)

| Nivel | Acesso |
|-------|--------|
| superadmin | Acesso total, gerencia usuarios |
| core_team | Projetos internos |
| external_agent | Projetos atribuidos |
| client | Somente leitura |

## OWASP Top 10 — Checklist

1. **Injection**: Usar parameterized queries (Supabase faz por padrao)
2. **Broken Auth**: 2FA, token rotation, session management
3. **Sensitive Data**: Encrypt at rest + in transit, mascarar PII
4. **XXE**: Nao processar XML externo sem validacao
5. **Broken Access**: RLS + middleware auth check em TODA rota
6. **Security Misconfig**: Headers seguros, CORS restritivo
7. **XSS**: Sanitizar input, CSP headers
8. **Insecure Deserialization**: Validar com Zod antes de usar
9. **Known Vulns**: `npm audit` regular, Dependabot ativo
10. **Insufficient Logging**: Audit trail + error tracking (Sentry)

## Headers de Seguranca
```typescript
// next.config.js ou vercel.json
{
  "headers": [
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
  ]
}
```

## Secrets Management

### Desenvolvimento
```bash
# .env.local (NUNCA commitado)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

### Producao
```bash
# Via CLI do provider
vercel env add SUPABASE_URL production
supabase secrets set MY_SECRET=value
```

### Rotacao
Ao rotacionar credentials, atualizar TODOS os ambientes:
1. Local (.env.local)
2. CI (GitHub Secrets)
3. Vercel (env vars)
4. Supabase (se aplicavel)

## Rate Limiting

### Upstash Sliding Window
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Por IP (anonimo)
const ipLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min
});

// Por user (autenticado) — limites mais generosos
const userLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(300, '1 m'), // 300 req/min
  prefix: 'ratelimit:user',
});

// Combinar IP + user para rate limit hibrido
const identifier = user?.id ?? ip;
const { success } = await ratelimit.limit(identifier);
```

### Headers de resposta
```typescript
// Sempre retornar rate limit info
headers.set('X-RateLimit-Limit', String(limit));
headers.set('X-RateLimit-Remaining', String(remaining));
headers.set('X-RateLimit-Reset', String(reset));
// 429: incluir Retry-After
headers.set('Retry-After', String(retryAfter));
```

## CSRF Protection

### Double-Submit Cookie
```typescript
// 1. Gerar token no cookie (httpOnly=false para JS ler)
const csrfToken = randomBytes(32).toString('hex');
cookies().set('csrf-token', csrfToken, { sameSite: 'strict', secure: true });

// 2. Client envia token no header
fetch('/api/action', {
  method: 'POST',
  headers: { 'X-CSRF-Token': getCookie('csrf-token') },
});

// 3. Server compara cookie vs header
const cookieToken = req.cookies.get('csrf-token')?.value;
const headerToken = req.headers.get('x-csrf-token');
if (cookieToken !== headerToken) return Response.json({ error: 'CSRF' }, { status: 403 });
```

### SameSite Cookie (defesa primaria)
```typescript
cookies().set('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',  // Bloqueia envio cross-site
  path: '/',
  maxAge: 60 * 60 * 24, // 24h
});
```

## CORS Configuration

### Trusted Origins
```typescript
// next.config.js ou middleware.ts
const TRUSTED_ORIGINS = [
  'https://app.raizeducacao.com.br',
  'https://raizeducacao.com.br',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
].filter(Boolean);

function corsHeaders(origin: string | null) {
  if (!origin || !TRUSTED_ORIGINS.includes(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}
```

## API Key Rotation

### Dual-Key Overlap Pattern
```
Dia 0: Key A ativa
Dia 1: Gerar Key B, aceitar A e B (periodo de overlap)
Dia 2-7: Migrar consumers para Key B
Dia 8: Revogar Key A, apenas B ativa
```

```typescript
// Aceitar ambas as keys durante overlap
const validKeys = [process.env.API_KEY_CURRENT, process.env.API_KEY_PREVIOUS].filter(Boolean);
const provided = req.headers.get('x-api-key');
if (!provided || !validKeys.includes(provided)) {
  return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
}
```

### Checklist de rotacao
1. Gerar nova key
2. Configurar como `API_KEY_CURRENT` em todos os ambientes
3. Mover key antiga para `API_KEY_PREVIOUS`
4. Aguardar todos os consumers migrarem (monitorar logs)
5. Remover `API_KEY_PREVIOUS`

## Encryption at Rest (PII Fields)

### Pattern: Encrypt/Decrypt com AES-256-GCM
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.PII_ENCRYPTION_KEY!, 'hex'); // 32 bytes

function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}
```

### Campos para encriptar
- CPF, RG, telefone pessoal
- Endereco completo
- Dados bancarios
- Informacoes medicas/educacionais sensiveis

### NUNCA encriptar
- IDs (precisam de index/lookup)
- Email (usado para login — hash se precisar anonimizar)
- Timestamps (precisam de range queries)

## Scan Automatico
```bash
# Detectar secrets hardcoded
grep -rn "sk-\|eyJ\|password\s*=\s*[\"']" --include="*.ts" --include="*.tsx" src/
```
