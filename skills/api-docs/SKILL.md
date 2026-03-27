---
name: api-docs
description: "Gerar documentacao de API: OpenAPI spec a partir de codigo, markdown docs a partir de spec, endpoint reference. Trigger quando usuario quer documentar API, gerar swagger, ou criar API reference."
model: sonnet
argument-hint: "[generate|from-spec|from-code] [path]"
metadata:
  filePattern: "openapi.*,swagger.*,**/api/**"
  bashPattern: "api.doc|swagger|openapi|endpoint.*doc"
  priority: 70
---

# API Docs Skill

Gerar documentacao de API: OpenAPI specs, endpoint reference, markdown docs.

## OpenAPI 3.1 Spec Structure

```yaml
openapi: "3.1.0"
info:
  title: "API Name"
  description: "API description"
  version: "1.0.0"
  contact:
    name: "Team Name"
    email: "team@example.com"
servers:
  - url: "https://api.example.com/v1"
    description: "Production"
  - url: "http://localhost:3000/api"
    description: "Development"
paths:
  /users:
    get:
      summary: "List users"
      operationId: "listUsers"
      tags: ["Users"]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        "200":
          description: "Success"
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/User"
                  total:
                    type: integer
        "401":
          $ref: "#/components/responses/Unauthorized"
    post:
      summary: "Create user"
      operationId: "createUser"
      tags: ["Users"]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateUserInput"
      responses:
        "201":
          description: "Created"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
components:
  schemas:
    User:
      type: object
      required: [id, name, email]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        createdAt:
          type: string
          format: date-time
    CreateUserInput:
      type: object
      required: [name, email]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        email:
          type: string
          format: email
  responses:
    Unauthorized:
      description: "Authentication required"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    NotFound:
      description: "Resource not found"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
```

## Generating Spec from Code

### Next.js App Router
```bash
# Scan route files and generate spec
find app/api -name "route.ts" | sort
```

Pattern para extrair endpoints:
```
app/api/users/route.ts        → GET /api/users, POST /api/users
app/api/users/[id]/route.ts   → GET /api/users/{id}, PUT, DELETE
app/api/auth/login/route.ts   → POST /api/auth/login
```

### FastAPI (auto-generated)
```python
# FastAPI gera OpenAPI automaticamente em /openapi.json
# Acessar: http://localhost:8000/openapi.json
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

## Generating Markdown from Spec

### Template: Endpoint Reference

```markdown
# API Reference

Base URL: `https://api.example.com/v1`

## Authentication

All requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users |
| POST | `/users` | Create a new user |
| GET | `/users/{id}` | Get user by ID |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Delete user |

---

#### GET /users

List all users with pagination.

**Parameters**

| Name | In | Type | Required | Default | Description |
|------|----|------|----------|---------|-------------|
| page | query | integer | No | 1 | Page number |
| limit | query | integer | No | 20 | Items per page |

**Response 200**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2026-03-26T10:00:00Z"
    }
  ],
  "total": 42
}
```

**Response 401**

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```
```

### Authentication Section Template

```markdown
## Authentication

This API uses **Bearer Token** authentication.

### Obtaining a Token

```bash
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

### Using the Token

Include in all subsequent requests:
```bash
curl https://api.example.com/v1/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Token Refresh

Tokens expire after 1 hour. Refresh before expiration:
```bash
curl -X POST https://api.example.com/v1/auth/refresh \
  -H "Authorization: Bearer <current-token>"
```
```

### Error Codes Table

```markdown
## Error Codes

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Error Response Format

```json
{
  "error": "ValidationError",
  "message": "Human-readable description",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```
```

### Rate Limiting

```markdown
## Rate Limiting

API requests are rate limited per API key:

| Plan | Requests/min | Requests/day |
|------|-------------|-------------|
| Free | 60 | 1,000 |
| Pro | 600 | 50,000 |
| Enterprise | 6,000 | Unlimited |

Rate limit headers in every response:
- `X-RateLimit-Limit`: Max requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

When rate limited, you receive:
```json
{
  "error": "TooManyRequests",
  "message": "Rate limit exceeded. Retry after 30 seconds.",
  "retryAfter": 30
}
```
```

### Versioning

```markdown
## Versioning

The API uses URL-based versioning:
- Current: `https://api.example.com/v1/`
- Previous: `https://api.example.com/v0/` (deprecated, sunset 2026-12-31)

Breaking changes result in a new major version.
Non-breaking additions (new fields, endpoints) do not change the version.
```

## Regras de Uso

1. OpenAPI 3.1 como formato padrao (nao 2.0/Swagger)
2. Cada endpoint com request/response examples concretos
3. Todos os error codes documentados
4. Authentication section obrigatoria
5. Rate limiting documentado quando aplicavel
6. Schemas reutilizaveis em `components/schemas`
7. Validar spec: `npx @redocly/cli lint openapi.yaml`
