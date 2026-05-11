# Gupy API - Webhooks

> Deep documentation extracted from https://developers.gupy.io/

---

## Overview

Gupy webhooks are an event notification system. When events occur, a JSON payload is dispatched via POST to a registered URL.

---

## Webhook Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /webhooks | Configure/create webhook |
| GET | /webhooks | List webhook configurations |
| PUT | /webhooks/{id} | Update webhook configuration |
| DELETE | /webhooks/{id} | Delete webhook configuration |

---

## Creating a Webhook

**POST** `/api/v1/webhooks`

```json
{
  "action": "application.completed",
  "status": "active",
  "techOwnerEmail": "contact@company.com",
  "techOwnerName": "John Developer",
  "postbackUrl": "https://integration.example.com/webhook",
  "clientHeaders": {
    "apiKey": "your-api-token",
    "content-type": "application/json"
  }
}
```

**Response (201):**
```json
{
  "id": "d5b2eca6-09c5-4014-9eb8-1d729dd2e3d6",
  "action": "application.completed",
  "postbackUrl": "https://integration.example.com/webhook",
  "status": "active"
}
```

### Fields

| Field | Description |
|-------|-------------|
| `action` | Event type to monitor |
| `status` | `active` or `inactive` |
| `techOwnerName` | Technical contact name |
| `techOwnerEmail` | Technical contact email |
| `postbackUrl` | Destination URL (must be HTTPS, public) |
| `clientHeaders` | Custom headers per request |

**IMPORTANT**: Custom `clientHeaders` REPLACE the default `Content-Type` header. Include it explicitly if needed.

---

## Updating a Webhook

1. Get webhook `id` via GET /webhooks with `fields=all`
2. PUT /webhooks/{id} with updated fields
3. `postbackUrl` is **mandatory** even if unchanged

```json
{
  "action": "pre-employee.moved",
  "clientHeaders": {
    "token": "updated-token-value"
  },
  "status": "active",
  "techOwnerEmail": "newemail@company.com",
  "postbackUrl": "https://updated-url.com"
}
```

---

## Notification Standard Properties

Every webhook notification contains:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique event ID (for deduplication) |
| `companyName` | string | Gupy customer organization name |
| `event` | string | Event type that triggered notification |
| `date` | datetime | Event occurrence timestamp |
| `data` | object | Event-specific payload |

---

## Delivery Mechanism

**Request format:**
```http
POST https://mycompany.com/callback
Authorization: [configured header]
Content-Type: application/json;charset=utf-8
```

**Expected response:** `200 OK`

---

## Retry Policy

On failure (non-200 response or timeout), retries over a **2-hour window**:

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 15 minutes |
| 4th+ retry | 30 minutes (constant) |

---

## Delivery Guarantees

- **At least once delivery** - duplicates possible, use `id` for deduplication
- **No ordering guarantee** - use `date` property for chronological sequencing
- **30-second timeout** - return 200 immediately, process asynchronously
- **Auto-deactivation**: URLs with 100% error rate over 7 consecutive days are **removed without notice**

**Best practice:** Return HTTP 200 immediately upon receipt. Process integration logic asynchronously.

---

## IP Allowlist

Webhook requests originate from these IPs (for firewall rules):

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

---

## Recruitment & Selection Events

### application.created
**Trigger:** Candidate applies or is assigned to a position.
**Note:** Uses AWS queue - delivery delays may exceed 1 hour.

### application.completed
**Trigger:** Application submission is completed.
**Note:** Uses AWS queue - delivery delays may exceed 1 hour.

### application.moved
**Trigger:** Candidate advances between job stages.

### application.assigned
**Trigger:** Application transferred to a different job.

### application.pre-hiring-information-filled
**Trigger:** Pre-hiring step data is completed.

### application.evaluation
**Trigger:** Application receives an evaluation.

### candidate.hired
**Trigger:** Candidate is hired (two conditions):
1. Candidate moves to final hiring stage
2. Recruiter saves hiring information

**Common use:** Triggers admission/onboarding flow.

### job.published
**Trigger:** Job listing goes live/published.

### job.status-changed
**Trigger:** Job status transitions (draft -> approved -> published -> closed, etc.).

### job.changed
**Trigger:** Any job detail modification.

### job-new-recommendation
**Trigger:** New talent recommendation for a job.

---

## Admission Events

### pre-employee.moved
**Trigger:** Pre-employee transitions between admission workflow stages.

**Payload includes:**
- `body.data.admission.status` - Current stage
- Job details, application data, candidate personal info

**Standard stages:**
- `SEND_DOCUMENTS`
- `SIGNING_CONTRACT`
- `ADMISSION_CONCLUDED`
- `OUT_PROCESS`

Custom stages have randomly-generated IDs (configured in Setup > Admissao).

### pre-employee-admission-concluded
**Trigger:** Admission process fully completed.
**Requires:** Feature flag `admission_concluded_webhook` (request via support).
**Special:** Contains document download URLs (expire in 30 seconds, extendable to 12h).

### admission-automatic-routing-process-created
**Trigger:** Automatic routing process is initiated.

### admission-automatic-routing-objection-created
**Trigger:** Objection raised in automatic routing.

### admission-automatic-routing-confirmation
**Trigger:** Automatic routing is confirmed.

---

## Testing Webhooks

### Using Pipedream

1. Log into Pipedream
2. Select **Sources** from left menu
3. Click **New+** (top-right)
4. Choose **HTTP / Webhook**
5. Select **New Requests**
6. Name endpoint and click **Create source**
7. Copy generated URL as `postbackUrl`

---

## Troubleshooting

### Webhook Not Sending

1. Confirm webhook is active (GET /webhooks with `fields=all`)
2. Verify no firewall blocks destination endpoint
3. Test delivery using Pipedream or similar service
4. Validate `clientHeaders` configuration
5. Confirm endpoint is public or whitelists Gupy IPs
6. Check SSL certificate validity

### Reactivating Inactive Webhooks

1. GET /webhooks to retrieve webhook `id`
2. PUT /webhooks/{id} with `status: "active"`
3. Include all original configuration (postbackUrl, clientHeaders, etc.)

### SSL Certificate Issues

Verify certificate validity at `https://api.gupy.io/api#/` (check padlock icon).

---

## Dynamic Token Webhook Flow

For integrations requiring token refresh, a dedicated flow exists for updating webhook authentication tokens dynamically. See `/docs/fluxo-de-atualização-do-webhook-para-tokens-dinâmicos` in the Gupy documentation.
