# Gupy - TOTVS RM Payroll Integration (Conector de Folha)

> Deep documentation extracted from https://developers.gupy.io/

---

## Overview

Gupy Admissao provides a **standardized integration** with RM TOTVS payroll systems, enabling automated employee data migration after admission completion.

- **Timeline**: Integration activation within ~43 days
- **Cost**: No additional charges for eligible companies (Premium/Enterprise)
- **Pre-mapped fields**: All fields previously mapped to RM system

---

## Architecture

### Data Flow

```
Gupy Admissao -> [pre-employee.moved webhook] -> Middleware Agent -> RM TOTVS Webservices
```

### Components

1. **Gupy Admissao** - Source of employee data
2. **Webhook** - `pre-employee.moved` event triggers data flow
3. **Middleware Agent** - Transforms data (DE/PARA mapping) between Gupy and RM formats
4. **RM TOTVS Webservices** - Receives employee records via XML

---

## Integration Flow

### 5-Step Process

1. **Candidate Data Receipt**
   - Approved candidate info flows automatically upon hiring confirmation in Gupy
   - Triggered by `pre-employee.moved` webhook

2. **Data Organization**
   - System validates required fields
   - Supplements info with IBGE municipal codes
   - Applies company-defined fixed parameters

3. **Employee Record Creation (PFUNC)**
   - Main employee record opens in RM TOTVS
   - Generates **CHAPA** (matriculation number)
   - CHAPA can be auto-generated (increment previous) or filled in Gupy and sent

4. **Dependent Registration (PFDEPEND)**
   - Employee dependents registered:
     - Maternal dependents
     - Paternal dependents
     - Other dependents
   - Each type has its own field mapping template

5. **Results Confirmation**
   - Successful registrations confirmed
   - Errors trigger automatic email notifications with details

---

## TOTVS RM Connectivity Requirements

### Network & Protocol

- **Protocol**: Webservices standard format with **XML data exchange**
- **Transport**: HTTPS
- **Authentication**: Webservice credentials required

### Required URLs (example format)

```
https://xpto.rm.cloudtotvs.com.br:8051/wsDataServer/IwsDataServer
```

### Required Dataserver Components

| Component | Method | Purpose |
|-----------|--------|---------|
| **FopFuncData** | SaveRecord | Employee records (PFUNC) |
| **FopDependData** | SaveRecord | Dependent records (PFDEPEND) |

### WSDataServer Enablement

Clients must enable webservice functionality via **RM Host**. Official TOTVS documentation provides setup guidance.

### Cloud TOTVS - Geographic Restriction

**IMPORTANT**: Gupy servers are hosted in **Germany**. Clients using Cloud TOTVS must:

1. Navigate to **Seguranca > Produto relacionado** in Tcloud dashboard
2. Add Germany to country/IP access permissions
3. Apply settings OR submit support ticket to Cloud TOTVS

### Custom Integration Alternative

If public service exposure is prohibited, a **custom integration flow** must be contracted (additional fee).

---

## Field Mappings

### Employee Record (PFUNC)

Four standardized field mapping templates exist:
1. **Employee fields** (PFUNC)
2. **Maternal dependent fields** (PFDEPEND - maternal)
3. **Paternal dependent fields** (PFDEPEND - paternal)
4. **Other dependent fields** (PFDEPEND - other)

### Key Data Points from Gupy -> RM TOTVS

**Personal Data:**
- Name, social name
- CPF, RG, PIS
- Birth date, gender
- Address (full)
- Contact information

**Employment Data:**
- Position/role code
- Department/area code
- Branch
- Cost center
- Hiring date
- Employment type
- Salary information
- Work schedule
- Union information
- Salary range/level

**Documents:**
- ID documents (front/back)
- Proof of address
- Education certificates
- Other admission documents

---

## HR Implementation Tasks

Required actions for HR team:

1. **Configure Gupy Admissao** platform settings
2. **Export updated lists** from RM TOTVS:
   - Functions (funcoes)
   - Sections (secoes)
   - Branches (filiais)
   - Unions (sindicatos)
   - Cost centers (centros de custo)
   - Schedules (horarios)
   - Salary ranges (faixas salariais)
   - Levels (niveis)
3. **Define matriculation methodology** (CHAPA generation)
4. **Support integration testing**
5. **Resolve RM TOTVS configuration issues**

---

## Critical Attention Points

### Limitations

- **PFUNC failure blocks PFDEPEND**: If employee record creation fails, dependents won't be registered
- **Existing PPESSOA (CPF)**: Records with existing CPF in RM cause integration errors
- **Inclusion only**: Flow covers candidate INSERTION only - no modifications or deletions
- **No cadastral updates**: Automated payroll information updates NOT included
- **Customizations**: RM TOTVS may have customizations requiring technical field validation

### Validation Requirements

- Valid CPF/PIS/RG formats
- Cost center alignment with position codes
- All RM mandatory fields must be mapped
- Support for multiple employment types:
  - Brazilian employees
  - Foreigners
  - Interns (estagiarios)
  - Apprentices (jovens aprendizes)

---

## Webhook Configuration for Payroll

### Setup

```json
POST /webhooks
{
  "action": "pre-employee.moved",
  "status": "active",
  "postbackUrl": "https://your-middleware.com/totvs-webhook",
  "techOwnerName": "IT Team",
  "techOwnerEmail": "it@company.com",
  "clientHeaders": {
    "content-type": "application/json",
    "x-company-code": "001"
  }
}
```

### Stage Filtering

Filter webhook payload for target admission stage:

```javascript
// Example middleware filter
if (body.data.admission.status === "ADMISSION_CONCLUDED") {
  // Process for RM TOTVS
  transformAndSend(body.data);
}
```

**Standard stages:**
- `SEND_DOCUMENTS`
- `SIGNING_CONTRACT`
- `ADMISSION_CONCLUDED` (typical trigger for payroll)
- `OUT_PROCESS`

---

## Custom Admission Fields for Payroll

### Best Practices

- Use **dropdown lists with code separators**: `"1 - Banco do Brasil"`
- Extract codes in middleware (pre-separator portion)
- Mark fields as **"integrated"** to lock from deletion
- Enables field maintenance without breaking DE/PARA logic

### Creating via API

```http
POST /custom-fields
{
  "label": "Bank Code",
  "type": "dropdown",
  "required": true,
  "options": [
    "001 - Banco do Brasil",
    "033 - Santander",
    "104 - Caixa Economica",
    "237 - Bradesco",
    "341 - Itau"
  ]
}
```

---

## Other Supported Payroll Systems

| System | Integration Type | Notes |
|--------|-----------------|-------|
| **RM TOTVS** | Standardized + Custom | XML webservices, FopFuncData/FopDependData |
| **Protheus** | Standardized | TOTVS Protheus ERP |
| **Metadados** | Standardized | - |
| **Senior** | Standardized | - |
| **ADP Standard** | Standardized | - |
| **ADP API** | API-based | Uses ADP's REST API |

---

## Standardized vs Custom Integration

### Standardized (Included)

- Pre-mapped fields
- No additional cost
- ~43 days activation
- Standard RM TOTVS configuration
- Gupy support included

### Custom (Additional Fee)

- Specialized payroll requirements
- Custom field mappings
- Non-standard RM configurations
- Custom middleware logic
- Available through Gupy sales team

---

## Testing

1. Use **production environment** with test candidates
2. Generate valid identification documents
3. Create scenarios for each employment type
4. Use disposable email addresses
5. Verify PFUNC creation first, then PFDEPEND
6. Check error notification emails
7. Validate CHAPA generation methodology
