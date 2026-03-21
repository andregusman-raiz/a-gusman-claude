# Gupy API - Admin Global

> Deep documentation extracted from https://developers.gupy.io/

---

## Overview

The Admin Global API manages organizational structure across all Gupy products: positions, employees/collaborators, departments, and cost centers.

**Base URLs:**
- Positions: `https://api.gupy.io/os/v1/`
- Employees: `https://api.gupy.io/user-management/v1/`

---

## Positions API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /positions | List positions (filtered, paginated) |
| POST | /positions | Create position |
| POST | /positions/replicate | Create position replication |
| POST | /positions/batch | Create multiple identical positions |
| PUT | /positions/{code} | Update position by external code |
| PUT | /positions/by-employee | Replace position by employee identifier (CPF/Email) |
| DELETE | /positions/{code} | Delete position by external code |
| DELETE | /positions/by-employee/{identifier} | Delete positions by employee identifier |

### Create Position

**POST** `/os/v1/positions`

**Required Fields:**

| Field | Description |
|-------|-------------|
| `name` | Position name |
| `externalCodeRole` | Role code (must exist in database) |
| `externalCodeArea` | Department/area code (must exist in database) |

**Optional Fields:**

| Field | Description |
|-------|-------------|
| `description` | Position description |
| `externalCode` | Auto-generated if not provided; must be unique per company |
| `externalCodeParent` | Parent position code (must exist) |
| `externalCodeCostCenter` | Cost center code (must exist) |
| `externalCodeOperationUnit` | Operational unit code (must exist) |
| `employeeEmail` | Employee email |
| `employeeTaxPayerRegistry` | Employee CPF |
| `employeeInternalCompanyNumber` | Employee internal ID |

**Example:**
```bash
curl --location 'api.gupy.io/os/v1/positions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer token' \
  --data '{
    "name": "Software Engineer",
    "externalCodeRole": "DEV_SR",
    "externalCodeArea": "ENGINEERING"
  }'
```

### Business Rules

- External code must be **unique per company**
- Only **one root position** (without parent) allowed per company
- Employee **cannot be assigned to multiple active positions** simultaneously

### Error Responses

| Code | Error | Description |
|------|-------|-------------|
| 404 | Not Found | Area, Role, Cost Center, Parent Position, or Employee not found |
| 409 | Conflict | Employee already in another position; root position exists |
| 422 | Unprocessable | Position with this external code already exists |

---

## Employees/Collaborators API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /employees | List collaborators (paginated, filtered) |
| POST | /employees | Create collaborator |
| GET | /employees/{id} | Get collaborator by ID |
| DELETE | /employees/{id} | Delete collaborator |
| PATCH | /employees/by-email/{email} | Update by email |

### List Collaborators

**GET** `/user-management/v1/employees`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string (3-255) | Search by partial email |
| `taxpayerRegistry` | string (3-20) | Search by partial CPF |
| `maxPageSize` | integer | Results per page (max 100, default 100) |
| `pageToken` | string | Pagination token from `nextPageToken` |
| `fields` | string | Filter response fields |

### Field Selection Groups

**Account Fields** (prefix: none, or use `*account` for all):
- `id`, `firstName`, `lastName`, `email`, `taxpayerRegistry`
- `mobileNumber`, `createdAt`

**Attribute Fields** (prefix: `attributes.`, or use `*attributes` for all):
- `admissionDate`, `birthDate`, `biologicalSex`, `education`
- `language`, `linkedinUrl`
- `streetAddress`, `cityAddress`, `stateAddress`, `zipCodeAddress`, `neighborhoodAddress`
- `terminationDate`, `terminationReason`, `photo`

**Solution Fields** (prefix: `solutions.`, or use `*solutions` for all):
- `recruitmentAndSelection`, `admission`, `training`
- `engagement`, `performance`, `admin`

**Example:**
```bash
curl 'https://api.gupy.io/user-management/v1/employees?email=john&maxPageSize=50&fields=*account,attributes.admissionDate' \
  --header 'Authorization: Bearer token'
```

### Error Responses

| Code | Description |
|------|-------------|
| 401 | Missing or invalid authentication token |
| 403 | Token lacks required READ/WRITE permissions |

---

## Departments API (Admin Global)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /departments | List departments (filtered, paginated) |
| GET | /departments/{uuid} | Get by UUID |
| POST | /departments | Create department |
| PUT | /departments/{uuid} | Update department |
| DELETE | /departments/{code} | Delete by external code |

---

## Cost Centers API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cost-centers | List cost centers (filtered, paginated) |
| GET | /cost-centers/{uuid} | Get by UUID |
| POST | /cost-centers | Create cost center |
| PUT | /cost-centers/{uuid} | Update cost center |
| DELETE | /cost-centers/{code} | Delete by external code |

---

## User Management (via R&S API)

The R&S API also provides user management endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /user-access-profiles | List access profiles |
| POST | /users | Create user |
| GET | /users | List users |
| PUT | /users/{id} | Update user |
| DELETE | /users/{id} | Delete user |
| POST | /users/invite | Invite user |

---

## Integration Flows

### Position Management Flow

1. **Create Position**: POST /positions with role and area codes
2. **Search Positions**: GET /positions with filters
3. **Update by Code**: PUT /positions/{code}
4. **Delete by Code**: DELETE /positions/{code}

### Collaborator Management Flow

1. **List Employees**: GET /employees with email/CPF filters
2. **Create Employee**: POST /employees
3. **Update Employee**: PATCH /employees/by-email/{email}
4. **Delete Employee**: DELETE /employees/{id}
5. **Search by ID**: GET /employees/{id}

### Organizational Structure Flow

1. Create **departments** (areas)
2. Create **cost centers**
3. Create **roles** (cargos)
4. Create **branches** (filiais)
5. Create **positions** linking roles + areas
6. Assign **employees** to positions

---

## Cross-Product Impact

Admin Global entities feed into all Gupy products:

| Entity | Used By |
|--------|---------|
| Positions | R&S (job creation), Admission (payroll mapping) |
| Departments | R&S (job categorization), Engagement (group mapping) |
| Cost Centers | Admission (payroll integration), R&S (job costing) |
| Employees | All products (user management, access control) |
