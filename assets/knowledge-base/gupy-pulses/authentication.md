# Gupy API - Authentication & Authorization

> Deep documentation extracted from https://developers.gupy.io/

---

## Overview

Gupy APIs require **Premium or Enterprise plan** subscription for API access. Token generation is self-service at these tiers.

---

## Authentication Method

All Gupy APIs use **Bearer Token authentication** (RFC 6750).

### Required Header

```
Authorization: Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Example Request

```http
GET /api/v1/jobs
Host: api.gupy.io
Authorization: Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Token Generation

### Recruitment & Selection (R&S) API

1. Access platform **Setup > Advanced Settings > Token Generation**
2. Select which V1 endpoints to enable (Applications, Jobs, Webhooks, etc.)
3. Generate token and store securely

### Admission API

1. POST to `https://admission.app.gupy.io/api/v1/auth/token`
2. Body:
   ```json
   {
     "clientId": "public-api-<companyId>",
     "secret": "<secret-from-setup>"
   }
   ```
3. Secret obtained from **Setup > Admissao > Geracao de Tokens**
4. Token expires after **604800 seconds (7 days)**

### Corporate Education (Training) API

- Separate authentication mechanism (product-specific)
- Different architecture from other Gupy products
- Dedicated token generation documented under Training auth section

### Climate & Engagement API

- Bearer token required: `Authorization: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- Heat map/scores APIs require **separate token** requested via support form at https://suporte.gupy.io/s/suporte/
- Account administrator must submit form requesting the heatmap API token

---

## Security Schemes

The API documentation references multiple security schemes:

| Scheme | Description |
|--------|-------------|
| **Bearer HTTP** | Primary method for standard API access |
| **JWT tokens** | Used in some product-specific contexts |
| **Firebase auth** | Referenced in some internal flows |
| **API key** | Legacy/alternative authentication |

---

## Security Best Practices

- **NEVER expose access tokens publicly** - treat as master passwords
- Token possession allows unrestricted platform actions
- API does NOT expose CORS headers (additional security layer)
- Request tokens with **minimal required permissions**
- Rotate tokens periodically

---

## Rate Limiting

| Parameter | Value |
|-----------|-------|
| **Max requests** | 900 per minute per IP |
| **Evaluation interval** | Every 30 seconds, looking back 5 minutes |
| **Enforcement delay** | Up to 30 seconds before WAF detects/enforces |
| **HTTP status on exceed** | `429 Too Many Requests` |
| **Response header** | `WAF: Rate-Limit` |

### Rate Limit Headers (per-endpoint)

```
X-RateLimit-Limit: <hourly request limit>
X-RateLimit-Remaining: <requests remaining>
X-RateLimit-Reset: <UTC timestamp of window reset>
```

> Rate limit values can change without prior notice.

---

## Pagination

All list endpoints use **offset-based pagination**.

### Parameters

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `page` | Page number | 1 | - |
| `perPage` | Records per page | 10 | 100 |

### Response Format

```json
{
  "results": [...],
  "totalResults": 100,
  "page": 1,
  "totalPages": 10
}
```

---

## Response Format

### Single Object

```json
{
  "id": 36,
  "code": null,
  "name": "Estagio em Desenvolvimento",
  "roleName": "Programador"
}
```

### List Response

```json
{
  "results": [...],
  "totalResults": 100,
  "page": 1,
  "totalPages": 1
}
```

### Date/Time Format

`YYYY-MM-DDT00:00:00Z` (UTC-0, 3 hours ahead of BRT)

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Request processed successfully |
| 201 | New record created (POST) |
| 400 | Missing/incorrect mandatory parameter |
| 401 | Not authorized - check Authorization header sent |
| 403 | Not authorized - check Authorization header is correct |
| 404 | Endpoint or resource not found |
| 409 | Conflict (e.g., record already exists) |
| 429 | Too many requests - check rate-limit headers |
| 500 | Gupy internal error - retry and contact support |

### Error Response Format

```json
{
  "title": "Validation Error",
  "detail": "Invalid perPage param: _val_ must be integer",
  "status": 400
}
```

---

## API Best Practices

1. **Retry with exponential backoff**: `baseDelay = Math.pow(2, attempt) * 1000` + randomization
2. **Rate limit compliance**: Distribute requests across time windows
3. **Efficient data usage**: Use `fields` parameter to minimize response size
4. **Caching**: Cache infrequently-changing data (roles, departments, branches)
5. **Date filtering**: Use `updatedAfter`/`updatedBefore` for targeted queries
6. **Version management**: Keep integrations on latest API version (v1.0, v2.0 available)
7. **LGPD/GDPR compliance**: Respect data privacy regulations

---

## API Base URLs

| Product | Base URL |
|---------|----------|
| R&S (Recruitment) | `https://api.gupy.io/api/v1/` |
| Admission | `https://admission.app.gupy.io/api/v1/` |
| Engagement | `https://www.pulses.com.br/api/engage/v1/` |
| Admin Global | `https://api.gupy.io/os/v1/` (positions) |
| Admin Global | `https://api.gupy.io/user-management/v1/` (employees) |

---

## SAML Configuration

Gupy supports SAML SSO with the following providers:
- OneLogin
- AD FS (Active Directory Federation Services)
- Azure AD
- KeyCloak

Configuration guides available in the platform documentation.

---

## Firewall / IP Allowlist (for Webhooks)

If your endpoint is behind a firewall, allow these Gupy IPs:

```
3.225.75.195
3.213.125.198
3.81.178.137
18.235.49.246
18.209.132.16
34.231.178.88
34.237.26.228
52.3.10.144
54.87.127.240
```
