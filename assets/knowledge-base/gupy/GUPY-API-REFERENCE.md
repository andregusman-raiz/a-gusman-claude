# Gupy API — Quick Reference Guide

**Last updated**: 25/03/2026
**API Version**: v1 & v2
**For full details**: See [GUPY-COMPLETE-RESEARCH.md](./GUPY-COMPLETE-RESEARCH.md)

---

## Quick Start

### 1. Get Token
```
Setup → Tokens Generation (Premium+ plan required)
```

### 2. Test Endpoint
```bash
curl -X GET "https://api.gupy.io/api/v1/jobs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Listen to Webhooks
```bash
POST /api/v1/webhooks
{
  "action": "application.created",
  "postbackUrl": "https://your-domain.com/webhook",
  "status": "active",
  "techOwnerName": "Your Name",
  "techOwnerEmail": "your@email.com"
}
```

---

## Base URL
```
https://api.gupy.io/api/v1
https://api.gupy.io/api/v2  (newer, more complete)
```

## Authentication
```
Header: Authorization: Bearer {TOKEN}
Token: Non-expiring, requires Premium+ plan
CORS: NOT exposed (backend-only)
```

---

## Core Endpoints

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/jobs` | List all jobs |
| `POST` | `/jobs` | Create job |
| `GET` | `/jobs/{id}` | Get job details |
| `PATCH` | `/jobs/{id}` | Update job |
| `DELETE` | `/jobs/{id}` | Delete job |

**Query params**: `?page=1&limit=50`

**Response sample**:
```json
{
  "id": "job-123",
  "title": "Senior Engineer",
  "description": "...",
  "department": "Tech",
  "positionCode": "ENG-001",
  "status": "open",
  "createdAt": "2026-03-20T00:00:00Z"
}
```

---

### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/jobs/{jobId}/applications` | List job applications |
| `GET` | `/applications` (v2) | List all applications |
| `POST` | `/jobs/{jobId}/applications` | Create application |
| `GET` | `/applications/{id}` | Get application |
| `PATCH` | `/applications/{id}` | Update status/data |

**Status values**: `applicant`, `interview`, `offer`, `hired`, `rejected`

**Response sample**:
```json
{
  "id": "app-456",
  "jobId": "job-123",
  "candidateId": "cand-789",
  "status": "interview",
  "candidate": {
    "id": "cand-789",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+55 11 99999-9999"
  },
  "tags": ["senior", "python"],
  "createdAt": "2026-03-21T10:00:00Z",
  "movedAt": "2026-03-22T14:30:00Z"
}
```

---

### Candidates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/candidates` | List all candidates |
| `POST` | `/candidates` | Create candidate |
| `GET` | `/candidates/{id}` | Get candidate |
| `PATCH` | `/candidates/{id}` | Update candidate |

**Response sample**:
```json
{
  "id": "cand-123",
  "name": "Maria Santos",
  "email": "maria@example.com",
  "phone": "+55 11 88888-8888",
  "linkedinUrl": "https://linkedin.com/in/maria-santos",
  "education": [
    {
      "school": "UFRJ",
      "course": "Engineering",
      "graduationYear": 2020
    }
  ],
  "tags": ["engineer", "python"]
}
```

---

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/departments` | List departments |
| `POST` | `/departments` | Create department |
| `PATCH` | `/departments/{id}` | Update department |

---

### Job Roles (Cargos)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/job-roles` | List job roles |
| `POST` | `/job-roles` | Create role |
| `PATCH` | `/job-roles/{id}` | Update role |

---

### Branches (Filiais)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/branches` | List branches |
| `POST` | `/branches` | Create branch |
| `PATCH` | `/branches/{id}` | Update branch |

---

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | List users |
| `POST` | `/users` | Create user |
| `PATCH` | `/users/{id}` | Update user |
| `DELETE` | `/users/{id}` | Delete user |

---

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/webhooks` | List webhook configs |
| `POST` | `/webhooks` | Create webhook |
| `PATCH` | `/webhooks/{id}` | Update webhook |
| `DELETE` | `/webhooks/{id}` | Delete webhook |

---

## Webhook Events

### application.created
Fired when new application submitted.

**Payload**:
```json
{
  "action": "application.created",
  "id": "app-123",
  "jobId": "job-456",
  "candidateId": "cand-789",
  "candidate": {
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "job": {
    "title": "Senior Developer",
    "id": "job-456"
  },
  "createdAt": "2026-03-25T10:00:00Z"
}
```

---

### application.moved
Fired when application moves between stages.

**Payload**:
```json
{
  "action": "application.moved",
  "id": "app-123",
  "jobId": "job-456",
  "candidateId": "cand-789",
  "status": "interview",
  "statusName": "Entrevista",
  "candidate": {
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "movedAt": "2026-03-25T14:30:00Z",
  "tags": ["python", "senior"]
}
```

---

### application.completed
Fired when application is final (hired or rejected).

**Payload**:
```json
{
  "action": "application.completed",
  "id": "app-123",
  "jobId": "job-456",
  "candidateId": "cand-789",
  "status": "hired",  // or "rejected"
  "statusName": "Contratado",
  "candidate": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+55 11 99999-9999"
  },
  "job": {
    "title": "Senior Developer",
    "id": "job-456"
  },
  "completedAt": "2026-03-25T16:00:00Z"
}
```

---

## Webhook Setup

**Register webhook**:
```bash
curl -X POST "https://api.gupy.io/api/v1/webhooks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "application.completed",
    "postbackUrl": "https://your-api.com/webhooks/gupy",
    "status": "active",
    "techOwnerName": "Dev Team",
    "techOwnerEmail": "dev@company.com"
  }'
```

**Webhook requirements**:
- URL must be **HTTPS**
- Must return **200 OK** within **30 seconds**
- Return status of *receipt*, not integration success
- Retry: 1min, 5min, 15min, 30min (constant) for 2 hours

---

## Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation) |
| `401` | Unauthorized (bad token) |
| `403` | Forbidden (no permission) |
| `404` | Not Found |
| `429` | Rate Limited (900 req/min) |
| `500` | Server Error |

---

## Rate Limiting

**Limit**: 900 requests/minute per IP

**Headers in response**:
```
X-RateLimit-Limit: 900
X-RateLimit-Remaining: 850
X-RateLimit-Reset: 1648132200
```

**When 429 error**:
- Wait before retry
- Use exponential backoff
- Retry after: 1s, 2s, 4s, 8s...

---

## Pagination

**Query parameters**:
```
?page=1&limit=50      # page-based
?offset=0&limit=50    # offset-based
```

**Response**:
```json
{
  "items": [...],
  "total": 1000,
  "page": 1,
  "limit": 50,
  "hasMore": true,
  "nextPageToken": "..."
}
```

**Best practice**: Use `limit=50`, iterate with pagination

---

## Common Payloads

### Create Job
```bash
POST /api/v1/jobs
{
  "title": "Senior Developer",
  "description": "Looking for experienced dev...",
  "department": "Technology",
  "positionCode": "DEV-001",
  "branch": "São Paulo",
  "workflowId": "wf-123"
}
```

### Create Application
```bash
POST /api/v1/jobs/{jobId}/applications
{
  "candidateId": "cand-123",
  "applicantData": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+55 11 99999-9999"
  }
}
```

### Update Application Status
```bash
PATCH /api/v1/applications/{appId}
{
  "status": "interview",
  "tags": ["python", "senior"]
}
```

### Create Webhook
```bash
POST /api/v1/webhooks
{
  "action": "application.moved",
  "postbackUrl": "https://your-api.com/webhook",
  "status": "active",
  "techOwnerName": "Integration Team",
  "techOwnerEmail": "integration@company.com"
}
```

---

## Libraries & SDKs

**Official**:
- Node.js/JavaScript: via npm (check GitHub)
- Python: Python client available
- Java: Java SDK available

**Community**:
- LinkAPI: REST wrapper
- Digibee: Native connector
- dltHub: Python data loader

**Generate your own**:
- GitHub: https://github.com/gupy-io/gupy-api-factory
- OpenAPI spec: Available for SDK generation

---

## Integration Examples

### Node.js - Get All Applications
```javascript
const token = process.env.GUPY_TOKEN;

async function getAllApplications() {
  let page = 1;
  let allApps = [];
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `https://api.gupy.io/api/v2/applications?page=${page}&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const data = await res.json();
    allApps = allApps.concat(data.items);
    hasMore = data.hasMore;
    page++;
  }

  return allApps;
}
```

### Python - Listen to Webhook
```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhook/gupy', methods=['POST'])
def handle_webhook():
    payload = request.json

    if payload['action'] == 'application.completed':
        candidate = payload['candidate']
        print(f"New hire: {candidate['name']} ({candidate['email']})")
        # Send to payroll system, etc.

    return {'received': True}, 200

if __name__ == '__main__':
    app.run(port=5000)
```

### cURL - Create Job
```bash
curl -X POST "https://api.gupy.io/api/v1/jobs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Manager",
    "description": "Lead our product team...",
    "department": "Product",
    "positionCode": "PM-001",
    "branch": "São Paulo"
  }'
```

---

## Security Checklist

- [ ] Token stored in `.env`, not in code
- [ ] All requests over HTTPS
- [ ] Token treated as master password
- [ ] Rate limiting respected (aim for <500 req/min)
- [ ] Webhooks validate HTTPS only
- [ ] Error responses logged securely
- [ ] Token rotated annually
- [ ] Implement request signing (optional but recommended)
- [ ] Monitor failed auth attempts
- [ ] Use restrictive IAM permissions

---

## Support & Resources

- **API Docs**: https://developers.gupy.io/
- **Swagger UI**: https://api.gupy.io/api
- **Support**: https://suporte.gupy.io/
- **Status**: https://status.gupy.io/
- **GitHub**: https://github.com/gupy-io

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Token invalid/expired, regenerate |
| 403 Forbidden | Token lacks permissions, add in Setup |
| 429 Rate Limited | Wait, implement backoff, cache data |
| 30s Webhook Timeout | Optimize webhook handler, return 200 quickly |
| CORS Error | API doesn't expose CORS; call from backend only |
| Missing fields | Check API v1 vs v2, may have added fields |

---

**For comprehensive docs**: See [GUPY-COMPLETE-RESEARCH.md](./GUPY-COMPLETE-RESEARCH.md)
