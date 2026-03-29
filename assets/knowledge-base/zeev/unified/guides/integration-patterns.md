# Guia: Padrões de Integração Zeev

> Extraídos do código de produção em raiz-platform.

---

## Impersonation Flow (padrão obrigatório)

```typescript
// 1. Obter token temporário do usuário
const tempToken = await impersonate(userEmail);
// Cache: 8min TTL (token real expira em ~10min)

// 2. Todas as chamadas com Bearer {temporaryToken}
const assignments = await fetch(url, {
  headers: { Authorization: `Bearer ${tempToken}` }
});
// Usuário só vê seus dados (RLS by Zeev)
```

## Retry com Token Refresh

```typescript
// 2 tentativas: se 401 → refresh token → retry
// Se 5xx → retry direto (sem refresh)
// Hard timeout: 10s por request, 12s global
```

## Cache In-Memory (API Dados)

```typescript
// Max 500 entries, 5min TTL
// Usado para: financeiro list, stats
// Não usado para: token (tem cache próprio de 8min)
```

## Error Classes

```typescript
// ZeevApiError — erro genérico da API
// ZeevAuthError — 401/403, token expirado
// ZeevNotFoundError — 404
// ZeevConnectionError — timeout, rede
```

## Env Vars Necessárias

| Var | Propósito |
|-----|-----------|
| `ZEEV_NATIVE_API_URL` | Base URL (prod ou staging) |
| `ZEEV_SERVICE_TOKEN` | Service account (URL-encoded) |
| `ZEEV_API_BASE_URL` | API Dados base |
| `ZEEV_API_KEY` | API Dados key |
