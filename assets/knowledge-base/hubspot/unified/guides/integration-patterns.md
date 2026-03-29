# Guia: Padrões de Integração HubSpot

> Extraídos do código de produção em raiz-platform.

---

## OAuth 2.0 Flow

```
1. GET /api/auth/hubspot → redirect para app.hubspot.com/oauth/authorize
2. HubSpot callback → /api/auth/hubspot/callback → exchange code for tokens
3. Access token (30min) + refresh token (6 months)
4. Auto-refresh via /api/auth/hubspot/refresh
```

## Rate Limiting

- OAuth apps: 100 requests / 10 seconds
- Private apps: 500,000 requests / day
- Search: 5 req/s, 200K results/day
- Batch: 100 records per batch request
- Resposta 429 → retry after header (exponential backoff)

## Pagination (Cursor-Based)

```typescript
// Nunca usar offset para datasets grandes
let after: string | undefined;
do {
  const res = await client.get('/contacts', { params: { limit: 100, after } });
  process(res.data.results);
  after = res.data.paging?.next?.after;
} while (after);
```

## Batch Operations

```typescript
// Até 100 records por batch
await client.post('/crm/v3/objects/contacts/batch/create', {
  inputs: contacts.slice(0, 100)
});
```

## Webhook Verification

```typescript
// Verificar X-HubSpot-Signature (SHA-256 HMAC)
const expectedSig = crypto
  .createHmac('sha256', clientSecret)
  .update(JSON.stringify(body))
  .digest('hex');
```

## Error Classes (raiz-platform)

- Rate limiting via Upstash
- `handleHubSpotError` wrapper
- Pagination parsing helper
- Auth wrappers para routes HubSpot

## Env Vars

| Var | Propósito |
|-----|-----------|
| `HUBSPOT_CLIENT_ID` | OAuth App ID |
| `HUBSPOT_CLIENT_SECRET` | OAuth Secret (nunca expor) |
