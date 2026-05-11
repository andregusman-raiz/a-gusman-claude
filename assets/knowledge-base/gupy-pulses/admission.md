# Gupy API - Admission (Admissao)

> Deep documentation extracted from https://developers.gupy.io/

---

## Overview

The Admission API handles the onboarding process after candidates are hired, including document collection, contract signing, payroll integration, medical exams, and automatic routing.

**Base URL**: `https://admission.app.gupy.io/api/v1/`

---

## Authentication (Admission-Specific)

### Token Generation

```http
POST https://admission.app.gupy.io/api/v1/auth/token
Content-Type: application/json

{
  "clientId": "public-api-<companyId>",
  "secret": "<secret-from-setup>"
}
```

- **clientId format**: `public-api-<companyId>`
- **secret**: Obtained from **Setup > Admissao > Geracao de Tokens**
- **Token expiration**: 604800 seconds (7 days)

---

## Core Endpoints

### Pre-Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /pre-employees | Search pre-employees by filter |
| POST | /pre-employees | Create a pre-employee |
| PATCH | /pre-employees/{id}/workflow-step | Change workflow step |

### Workflow Steps

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /workflow-steps | List all workflow steps |

**Standard Workflow Stages:**
- `SEND_DOCUMENTS` - Document submission phase
- `SIGNING_CONTRACT` - Contract signing phase
- `ADMISSION_CONCLUDED` - Admission completed
- `OUT_PROCESS` - Removed from process

Custom stages have randomly-generated IDs accessible via **Setup > Admissao > Stage Definitions**.

### Custom Fields

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /custom-fields | Get custom fields with pagination |
| POST | /custom-fields | Create a new custom field |
| PATCH | /custom-fields/{id} | Update a custom field |
| DELETE | /custom-fields/{id} | Delete a custom field |

**Custom Field Tip**: Mark fields as "integrated" to lock them from deletion if mapped to payroll systems.

### Contracts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /contracts | Create a contract for digital signing |

**Contract Creation Body:**
```json
{
  "preEmployeeId": "uuid",
  "witnesses": ["witness@email.com"],
  "files": ["base64-encoded-pdf"],
  "deadline": "2024-12-31T23:59:59Z",
  "notificationMessage": "Please sign your contract",
  "remindInterval": 3,
  "signers": [
    {
      "name": "John Doe",
      "email": "john@company.com",
      "signerType": "sign"
    }
  ]
}
```

**Signer Types:**
- `sign` - Standard contract signature
- `witness` - Witness to signing
- `legal_representative` - Represents signatory
- `legal_responsible` - Bears legal responsibility

### Automatic Routing

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | /automatic-routing-process/{id} | Update routes for requested routing process |
| PATCH | /automatic-routing-objection/{id} | Update automatic routing objection |

---

## Integration Flows

### 1. Hired Person Admission (R&S -> Admission)

**Trigger**: `candidate.hired` webhook

**Flow:**
1. Configure `candidate.hired` webhook via POST /webhooks
2. Webhook fires when:
   - Candidate moves to final hiring stage
   - Recruiter saves hiring information
3. Integration agent receives webhook data
4. Process candidate data into onboarding system

**Return data options:**
- **Tags**: PUT `/jobs/{jobId}/applications/{applicationId}/tags`
- **Comments**: POST `/jobs/{jobId}/applications/{applicationId}/comments`

### 2. Payroll Integration Flow

**Trigger**: `pre-employee.moved` webhook

**Architecture**: Webhook -> Middleware Agent -> Payroll System

**Flow:**
1. Configure `pre-employee.moved` webhook
2. Filter by `body.data.admission.status` matching target stage
3. Middleware receives and transforms data (DE/PARA mapping)
4. Middleware sends to payroll system (TOTVS RM, Senior, ADP, etc.)

**Webhook Payload Data:**
- Employee personal data (CPF, name, address, documents)
- Job vacancy details (title, position code, custom fields)
- Custom admission fields
- Standard documents

**Key Note**: Vacancy info (title, position code, custom fields) comes WITH employee data, often eliminating additional API queries.

### 3. Document Downloads Flow

**Trigger**: `pre-employee-admission-concluded` webhook

**Prerequisites:**
- Request feature flag: `admission_concluded_webhook` via support portal
- Webhook triggers only at "Admission Concluded" stage

**Document URL Expiration:**
- **Documents**: 30 seconds (extendable to 12 hours via `admission_concluded_webhook_extended_url_expiration` feature flag)
- **Contracts**: 30 minutes (NOT extendable)

### 4. Medical Exam (ASO) Integration

**Trigger**: `pre-employee.moved` webhook

**Flow:**
1. Pre-employee moves to designated stage
2. System sends candidate data: CPF, name, birthdate, ID, social name, position, gender
3. **LIMITATION**: Exam results cannot be received via API - pre-employee uploads through platform only

### 5. Contract Integration

**Trigger**: `pre-employee.moved` webhook (filter for `SIGNING_CONTRACT` status)

**Flow:**
1. Webhook fires at contract signing stage
2. Capture `identificationDocument` and `preEmployeeId`
3. Generate admission token (POST /tokens)
4. Create contract (POST /contracts) with signers, files, deadline

### 6. Equipment Provisioning

Webhook-driven flow for hardware/software assignment during onboarding.

### 7. Automatic Routing

Automated routing of pre-employees based on business rules (e.g., benefit plans, transport vouchers).

---

## Admission Webhook Events

| Event | Trigger |
|-------|---------|
| `pre-employee.moved` | Pre-employee transitions between workflow stages |
| `pre-employee-admission-concluded` | Admission process completed |
| `admission-automatic-routing-process-created` | Routing process initiated |
| `admission-automatic-routing-objection-created` | Routing objection raised |
| `admission-automatic-routing-confirmation` | Routing confirmed |

---

## Webhook Payload Structure (pre-employee.moved)

```json
{
  "id": "event-uuid",
  "companyName": "Company Name",
  "event": "pre-employee.moved",
  "date": "2024-01-01T00:00:00Z",
  "data": {
    "admission": {
      "status": "SEND_DOCUMENTS",
      "preEmployeeId": "uuid"
    },
    "job": {
      "id": 123,
      "name": "Software Engineer",
      "department": "Engineering",
      "role": "Developer",
      "branch": "HQ"
    },
    "application": {
      "score": 85.5,
      "tags": ["priority"],
      "currentStep": { "id": 1, "name": "Hiring" }
    },
    "candidate": {
      "name": "Maria Santos",
      "identificationDocument": "12345678901",
      "email": "maria@email.com",
      "birthdate": "1990-01-15",
      "address": { ... },
      "documents": { ... }
    }
  }
}
```

---

## Custom Admission Fields

### Purpose
Company-specific fields for internal control (cost center, bank info, benefits selection).

### Configuration
- Platform UI: **Setup > Admissao**
- API: POST/PATCH/DELETE /custom-fields

### Best Practices
- Use dropdown lists with code separators: `"1 - Banco do Brasil"`
- Extract codes in middleware (pre-separator portion)
- Mark fields as "integrated" to prevent accidental deletion
- Enables field maintenance without breaking DE/PARA logic

---

## Validation Requirements

- Valid CPF/PIS/RG formats
- Cost center alignment with position codes
- Mandatory field mapping per payroll system
- Support for multiple employment types:
  - Brazilian employees
  - Foreigners
  - Interns (estagiarios)
  - Apprentices (jovens aprendizes)

---

## Testing Best Practices

1. Use **production environment** with test candidates/vacancies
2. Generate valid identification documents for testing
3. Create test scenarios for each employment type
4. Use disposable email addresses
5. Always return HTTP 200 immediately (process async) to avoid timeout deactivation

---

## Supported Payroll Systems (Native Connectors)

| System | Type |
|--------|------|
| RM TOTVS | Standardized + Custom |
| Metadados | Standardized |
| Senior | Standardized |
| ADP (Standard) | Standardized |
| ADP (API) | API-based |
| Protheus | Standardized |
