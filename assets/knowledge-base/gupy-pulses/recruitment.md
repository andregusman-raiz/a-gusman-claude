# Gupy API - Recruitment & Selection (R&S)

> Deep documentation extracted from https://developers.gupy.io/

---

## Overview

The R&S API covers job management, candidate applications, hiring workflows, organizational structure, and BI data extraction.

**Base URL**: `https://api.gupy.io/api/v1/`

---

## API Entities

| Entity | Description |
|--------|-------------|
| **Jobs** | Open positions registered in platform or via API |
| **Candidates** | Persons applying for jobs |
| **Applications** | Relationship between jobs and candidates |
| **Tags** | Metadata applied to applications |
| **Comments** | Timeline annotations (private or visible) |
| **Vacancy Codes** | Position allocation identifiers |

---

## Jobs API

### POST /jobs - Create Job

All API-created jobs start with `status: "draft"`. Requires separate endpoint call to change to approved/published.

**Required Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string (255) | Job title; special characters preserved |
| `type` | string | Hiring mode (e.g., `vacancy_type_effective`) |
| `numVacancies` | integer | Number of positions to fill |
| `roleId` | integer | From GET /roles or POST /roles |
| `departmentId` | integer | From GET /departments or POST /departments |
| `branchId` | integer | From GET /branches or POST /branches |

**Optional Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Internal system identifier |
| `publicationType` | string | Internal or external visibility |
| `templateId` | integer | Pre-built job model from HR |
| `managerEmail` | string | Must be existing Gupy user |
| `recruiterEmail` | string | Must be existing Gupy user |
| `customFields` | array | Custom field objects with `id` and `value` |

**Custom Field Types**: date, short text, numeric, boolean, time, dropdown, multi-select, file upload, conditional

**Response (201):**
```json
{
  "id": 123,
  "status": "draft",
  "name": "Software Engineer",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### GET /jobs - List Jobs

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `fields` | string | subset | `fields=id,name` or `fields=all` |
| `perPage` | integer | 10 | Max 100 |
| `page` | integer | 1 | Page number |

**Response:**
```json
{
  "results": [...],
  "totalResults": 100,
  "page": 1,
  "totalPages": 10
}
```

### GET /jobs/{id}/custom-fields - List Job Custom Fields

### GET /jobs/{id}/steps - List Job Steps

### PATCH /jobs/{id} - Update Job

### DELETE /jobs/{id} - Delete Draft Job

### PUT /jobs/close - Close Jobs

### POST /jobs/classifiers - Create Job Classifier

### GET /jobs/classifiers - List Job Classifiers

### POST /jobs/vacancies - Create Vacancy Code

### GET /jobs/vacancies - List Vacancy Codes

### DELETE /jobs/vacancies/{id} - Delete Vacancy Code

### PUT /jobs/vacancies/{id} - Update Vacancy Code

---

## Applications API

### GET /jobs/{jobId}/applications - List Applications

**Path Parameters:**
- `jobId` (required, integer): Job identifier

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | integer | - | Application ID (higher rate limits) |
| `status` | enum | - | `in_process`, `give_up`, `reproved`, `hired` |
| `currentStep.name` | string (255) | - | Current step name |
| `candidate.identificationDocument` | string (255) | - | CPF or ID number |
| `vacancyCode.code` | string (255) | - | Vacancy code after hiring |
| `perPage` | integer | 10 | Items per page |
| `page` | integer | 1 | Page number |
| `order` | string | `id asc` | Sort: id, score, createdAt |
| `fields` | string | subset | Specify fields or `all` |

**Application Object Fields:**

```
Core:
  id, score, status, source, sourceOther, createdAt, updatedAt, endedAt, tags

Candidate:
  candidate.id, candidate.name, candidate.lastName, candidate.email
  candidate.birthdate, candidate.gender
  candidate.identificationDocument
  candidate.mobileNumber, candidate.phoneNumber
  candidate.disabilities, disabilityTypes
  candidate.zipCode, candidate.number, candidate.street
  candidate.city, candidate.state, candidate.country
  candidate.areasOfInterest
  candidate.schooling, candidate.schoolingStatus
  candidate.academicQualification[] (formation, institution, course, status, dates)
  candidate.workExperience[] (role, company, activities, dates)
  candidate.languages[] (language, proficiency)

Manual Candidate:
  manualCandidate.id, name, lastName, email
  manualCandidate.mobileNumber, linkedinProfileUrl
  manualCandidate.insertionSource (candidate_active_contact, events, hunting, market_referral_consulting, employee_referral)

Hiring:
  currentStep.id, currentStep.name, currentStep.status
  job.id, job.name
  hiringType (employee_admission, readmission, reintegration, unrelated_worker_hiring, internal_transfer)
  hiringDate
  isCompanyEmployee, employeeEmail
  registrationComplete, referred, referredBy, referralStatus

Disapproval:
  disapprovalReason (26+ reasons: hired_by_another_company, insufficient_knowledge, etc.)
  disapprovalReasonNotes

Scoring:
  matching (culture alignment score)
  feedbackSent

Additional:
  additionalQuestions[] (question/answer objects)
  partnerName (99hunters, catho, linkedin, indeed, etc.)
```

**Application Sources:**
`google`, `facebook`, `linkedin`, `indeed`, and others

### POST /jobs/{jobId}/applications - Create Application

**Required:** Either `candidateId` OR `manualCandidate` (mutually exclusive)

**Body:**
```json
{
  "candidateId": 12345,
  "notes": "Strong technical background"
}
```

OR with manual candidate:
```json
{
  "manualCandidate": {
    "name": "Maria",
    "lastName": "Santos",
    "email": "maria.santos@example.com",
    "mobileNumber": "+5511912345678",
    "insertionSource": "candidate_active_contact"
  },
  "notes": "Referred by manager"
}
```

**Manual Candidate Fields:**

| Field | Required | Max Length |
|-------|----------|-----------|
| `name` | Yes | 255 |
| `lastName` | Yes | 255 |
| `email` | Yes | 255 |
| `insertionSource` | Yes | enum |
| `mobileNumber` | No | 255 |
| `documentNumber` | No | 255 |
| `isBrazilian` | No | boolean |
| `linkedinProfileUrl` | No | 255 |

### PATCH /jobs/{jobId}/applications - Move Application

### POST /jobs/{jobId}/applications/invite - Invite Candidate

### PUT /jobs/{jobId}/applications/{id}/tags - Add Tags

### DELETE /jobs/{jobId}/applications/{id}/tags/{tagId} - Delete Tag

### GET /jobs/{jobId}/applications/tags - List Application Tags

### DELETE /jobs/{jobId}/applications/tags/{tagValue} - Delete Tag by Value

### PATCH /jobs/{jobId}/applications/hiring-information - Update Hiring Info

### GET /jobs/{jobId}/applications/hiring-information - Find Hiring Info

### GET /jobs/{jobId}/applications/{id}/rating-criteria - Get Rating Criteria

### POST /jobs/{jobId}/applications/{id}/comments - Create Timeline Comment

### GET /jobs/{jobId}/applications/{id}/comments - List Timeline Comments

### POST /jobs/{jobId}/applications/{id}/messages - Send Email to Candidate

---

## Organizational Structure APIs

### Roles (Cargos)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /roles | List roles |
| POST | /roles | Create role (name, code, similarity classification) |
| PUT | /roles/{id} | Update role |

### Departments (Areas)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /departments | List departments |
| POST | /departments | Create department |
| PUT | /departments/{id} | Update department |

### Branches (Filiais)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /branches | List branches |
| POST | /branches | Create branch (code, name, organizational path) |
| PUT | /branches/{id} | Update branch |
| DELETE | /branches/{id} | Delete branch |

### Career Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /career-pages | List career pages |

---

## Users API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /user-access-profiles | List user access profiles |
| POST | /users | Create user |
| GET | /users | List users |
| PUT | /users/{id} | Update user |
| DELETE | /users/{id} | Delete user |
| POST | /users/invite | Invite user |

---

## Employees API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /employees | Create list of company employees |
| GET | /employees | List company employees |
| PUT | /employees/{id} | Update employee |
| DELETE | /employees/{id} | Delete employee |

---

## Post-Hiring APIs

### Dismissals

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /dismissals | Create dismissal |
| GET | /dismissals | List dismissals |
| PUT | /dismissals/{id} | Update dismissal |

### Performance Evaluations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /performance-evaluations | Create evaluation |
| GET | /performance-evaluations | List evaluations |
| PUT | /performance-evaluations/{id} | Update evaluation |

---

## Talent Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /talent-recommendations/approve | Approve recommendation |
| POST | /talent-recommendations/reject | Reject recommendation |

---

## Email Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /email-templates | List email templates |

---

## Custom Fields

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /companies/custom-fields | List custom fields for job creation |
| GET | /templates/custom-fields | List template custom-fields |
| GET | /templates | List job templates |

---

## Job Creation Flow (Integration Guide)

### Prerequisites
1. Roles, departments, and branches must be pre-configured
2. Bearer Token authentication required

### Step-by-Step

1. **Get/Create Role** - `GET /roles?code=XXX` -> if empty, `POST /roles`
2. **Get/Create Department** - `GET /departments?code=XXX` -> if empty, `POST /departments`
3. **Get/Create Branch** - `GET /branches?code=XXX` -> if empty, `POST /branches`
4. **Validate Users** - `GET /users` to confirm manager/recruiter emails exist
5. **Get Custom Fields** - `GET /companies/custom-fields` for field IDs
6. **Create Job** - `POST /jobs` with all collected IDs
7. **Change Status** - Separate endpoint to approve/publish (jobs start as draft)

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Empty response on GET | Resource doesn't exist | Create via POST first |
| 400 on managerEmail | Email not registered | Verify via GET /users |
| Custom field error | Wrong type or deleted field | Recheck field IDs |

---

## BI Data Extraction Flow

Use the applications listing endpoint with appropriate filters and `fields=all` parameter to extract comprehensive data for Business Intelligence purposes. Key flows:

- **Job data**: GET /jobs with date filters
- **Application data**: GET /applications with status filters
- **Diversity data**: Specific diversity fields available via dedicated flow
- **Hiring metrics**: Filter by hired status and date ranges

---

## Integration Flow Models

| Flow | Description | Key Endpoints |
|------|-------------|---------------|
| Job Creation | External system -> Gupy jobs | POST /jobs, GET /roles, GET /departments |
| Candidate Capture | External platform -> applications | POST /applications |
| Quick Apply | Simplified application | POST /applications (reduced fields) |
| Internal Recruitment | Employee -> candidate | POST /applications with employee data |
| Candidate Validation | Verify internal eligibility | GET /employees + business rules |
| External Exam | Send/receive exam results | Webhooks + external platform |
| Equipment Provisioning | Hardware assignment flow | Webhook-driven |
| Messaging Integration | External messaging service | API + webhook integration |
| Careers Page | Custom external careers page | GET /jobs, GET /career-pages |
