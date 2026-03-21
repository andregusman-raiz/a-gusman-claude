# Gupy API - Climate & Engagement (Clima e Engajamento)

> Deep documentation extracted from https://developers.gupy.io/ and https://www.pulses.com.br/

---

## Overview

The Engagement product (formerly Pulses) enables real-time team performance tracking and talent engagement measurement through continuous listening, surveys, feedback, and suggestion boxes.

**Base URL**: `https://www.pulses.com.br/api/engage/v1/`

**Note**: This product has a **different architecture** from other Gupy products, with its own authentication, pagination, and endpoint configurations.

---

## Authentication

- Bearer token in Authorization header: `Authorization: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Heat map/Scores APIs** require a **separate token** requested via support form at https://suporte.gupy.io/s/suporte/

---

## Groups API

### Hierarchy Requirements
- Build group hierarchy BEFORE loading employees
- Groups must follow vertical hierarchy without circular references
- Duplicate group names are NOT permitted
- Must remove all subgroups before deleting a parent group

**Correct**: `Group A -> Group B -> Group C -> Group D`
**WRONG**: `Group A -> Group B -> Group C -> Group A` (circular)

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /groups | All groups (alphabetical list) |
| POST | /groups | Create group |
| GET | /groups/tree | All groups (tree/hierarchy format) |
| GET | /groups/find | Find groups by name |
| GET | /groups/{idGroup} | Get group by ID |
| PUT | /groups/{idGroup} | Update group |
| DELETE | /groups/{idGroup} | Delete group |

### Create Group

**POST** `/api/engage/v1/groups/`

```json
{
  "name": "Engineering",       // Required, must be unique
  "parent_id": 123             // Optional, for hierarchy
}
```

**Response:**
```json
{
  "code": 1,
  "message": "success",
  "values": [{
    "id_group": 456,
    "name": "Engineering",
    "parent_id": 123,
    "employees": 0
  }]
}
```

### Delete Group

Must remove all child groups first. Error if subgroups exist:
```json
{
  "code": 0,
  "message": "It is not possible to delete a group with subgroups in it."
}
```

---

## Employees API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /employees | Get all employees |
| POST | /employees | Create employee |
| GET | /employees/{idPerson} | Get by id_person |
| PUT | /employees/{idPerson} | Update employee |
| DELETE | /employees/{idPerson} | Delete employee |
| POST | /employees/{idPerson}/groups/{idGroup} | Add to group |
| DELETE | /employees/{idPerson}/groups/{idGroup} | Remove from group |

### Required Identifier (at least one)
- `CPF`
- `email`
- `internal_number`

### Employee Fields

**Identification:**
- `name` - Employee name
- `social_name` - Social/preferred name
- `birth_name` - Birth name
- `email` - Email address
- `CPF` - Brazilian tax ID
- `internal_number` - Internal company ID
- `cell_phone` - Mobile phone

**Employment:**
- `position` - Job title (CAUTION: misspelled names auto-create new positions)
- `hiring_date` - Date of hire
- `scholarity` - Education level

**Organizational:**
- `groups` - Groups (semicolon-separated for multiple)
- `leaders` - Leaders (semicolon-separated for multiple; CAUTION: misspelled names auto-create)
- `unit_business` - Business unit
- `unit_geography` - Geographic unit

**Personal:**
- `sex` - Biological sex
- `gender` - Gender identity
- `birthday` - Birth date

**Configuration:**
- `language` - `pt-BR`, `en-US`, `es-ES`
- `blocked` - 0 or 1 (prevents notifications during vacation/leave)

**Custom:**
- `custom_attributes` - Object format
- `tags` - Array format

### Resignation Fields

| Field | Format | Description |
|-------|--------|-------------|
| `resignation_date` | YYYY-MM-DD | Date of termination |
| `resignation_reason` | enum | V=Voluntary, I=Involuntary, TC=Contract End, NA=Not Applicable |
| `move_subordinates` | boolean | Transfer reports to superior manager |

**IMPORTANT**: Both `resignation_date` and `resignation_reason` must be submitted together. Response history persists post-termination.

### Common Errors

| Error | Cause | Solution |
|-------|-------|---------|
| "Social Security Number already in use" | Duplicate CPF/email/internal_number | Check existing records |
| "Leader not found" | Name mismatch | Use alternative identifiers |
| "User has subordinates" | Can't delete with reports | Reassign or enable move_subordinates |
| Circular hierarchy | Subordinate assigned as superior | Fix hierarchy |
| Self-leadership | Employee set as own leader | Use different leader |

---

## Instruments API

Instruments represent survey configurations (Pulses, NPS, e-NPS, Engagement).

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /instruments | All instruments |
| GET | /instruments/{uidInstrument} | Instrument details with questions |

### Instrument Fields

**Metadata:**
- `uid_instrument` - Unique identifier
- `id_instrument` - Internal ID
- `name` - Survey name
- `type` - Survey type
- `active` - 1=active, 0=inactive
- `locked` - Response blocking status

**Configuration:**
- `max_questions` - Maximum question count
- `minimum_respondents` - Expected threshold
- `calculation_type` - Score computation method (4 types)
- `lagging` - Score lag in weeks
- `distribution_type` - Automated or Manual

**Confidentiality:**
- `0` = Identified (respondent visible)
- `1` = Confidential (fully anonymous)
- `2` = Partially identified

**Structure:**
- `groups` - Nested question groupings
- `questions[]` - Individual items with:
  - `config` - Type, scale (min/max), translations
  - `options` - Response choices
  - `required` - Mandatory flag
  - `active` - Status

**Temporal:**
- `first_answer_date`, `last_answer_date`
- `created_at`, `updated_at`
- `current_cycle` - Active cycle number

---

## Scores APIs

### Heat Map Scores

**GET** `https://www.pulses.com.br/api/engage/v1/heatmap`

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `instrument` | Yes | Instrument UID |
| `segment` | Yes | Filter category (see below) |
| `pagination` | No | Starting at 0 |

**Valid Segments:**
`birthday`, `groups`, `hiring_date`, `leaders`, `position`, `scholarity`, `sex`, `unit_business`, `unit_geography`

**Example:**
```bash
curl 'https://www.pulses.com.br/api/engage/v1/heatmap?segment=leaders&instrument=c0c0302e-d142-11e8-8052-42010a9e003a&pagination=0'
```

**Response Fields:**
- `title` - Segment name
- `score` - Numeric value
- `color` - Hex color (#33820B for high)
- `respondents` - Unique response count
- `answer_rate_general` - Overall participation %
- `answer_rate_days15/30` - Recent period rates
- `answer_rate_months3/6/12` - Extended period rates

**Instrument-Specific Returns:**

| Instrument | Returns |
|------------|---------|
| Pulses | Dimensional breakdowns with factor/question-level scoring |
| NPS | Detractors, Passives, Promoters with percentages |
| Engagement | Disengaged, Neutral, Engaged, Highly Engaged distribution |
| e-NPS | NPS scoring + respondent categorization |

**Update frequency**: ~3 days when new responses exist

### Cross-Referenced Scores

**POST** `https://www.pulses.com.br/app/engage/ws/web/score/crossing/export`

**Required Parameters:**
- `instrument` - Instrument UID
- `endDate` - Week's final day (Saturday), YYYY-MM-DD
- `crossings` - Array of dimensions (max 3 per request)

**Available Crossing Dimensions:**
`position`, `sex`, `scholarity`, `unit_business`, `unit_geography`, `hiring_date`, `birthday`, `group`, `leader`

**Optional Segment Filters:**
- Position, sex, education level
- Business/geographic units
- Hiring tenure brackets: 0-1mo, 1-3mo, 3-6mo, 6-12mo, 1-2yr, 2-3yr, 3-5yr, 5-10yr, 10+yr
- Age brackets: 0-19, 20-29, 30-39, 40-49, 50-59, 60+
- Group IDs, leader IDs

**Note**: Only applies to structured instruments. NPS model questions return no results.

### Partially Anonymous / Identified Scores

**GET** `https://www.pulses.com.br/api/engage/v1/score/confidential`

**Parameters:**
- `instrument` (required) - UID
- `start_date` (required)
- `end_date` (required)

Returns individual answer data with respondent demographics for partially anonymous and identified instruments.

### Aggregated Scores

**GET** `https://www.pulses.com.br/api/engage/v1/scores/{uid_instrument}`

**Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `uid_instrument` | Yes | - | Instrument UID |
| `endDate` | No | Current date | End date (YYYY-MM-DD) |
| `leaderHierarchyDepth` | No | "direct" | "direct" or "full" |
| `idLeader` | No | - | Filter by leader |
| `groupHierarchyDepth` | No | "direct" | "direct" or "full" |
| `idGroup` | No | - | Filter by group |

**Response:**
```json
{
  "instrument": {
    "uid": "uid_instrument",
    "name": "Engagement Survey",
    "laggingWeeks": 2
  },
  "overallScore": 78.5,
  "lagging": [
    {
      "score": 80.2,
      "respondentCount": 150,
      "startDate": "2024-01-01",
      "endDate": "2024-01-14",
      "reportable": true,
      "reason": null
    }
  ]
}
```

---

## Feedbacks API

**POST** `https://www.pulses.com.br/api/engage/v1/feedbacks`

**Required Parameters:**

| Parameter | Format | Description |
|-----------|--------|-------------|
| `instrument` | string | Instrument UID |
| `startDate` | YYYY-MM-DD | Filter start |
| `endDate` | YYYY-MM-DD | Filter end |

**Optional Filters:**
`leaders`, `groups`, `positions`, `genders`, `sexes` (F/M), `unitBusinesses`, `unitGeographies`, `tags`, `scholarities`

**Response Fields:**
- Recebido em (receipt date)
- Dimensao (dimension name)
- Pergunta do Fator (factor question)
- Pergunta do Feedback (feedback question)
- Nota (score)
- Feedback (text)
- Enviado por (sender)
- Lido (read status)
- Resposta (latest response)
- Respondido por (responder)
- Respondido em (response date)
- Atribuido ao Lider (assigned leader)
- GRUPO (groups, comma-separated)

**LIMITATION**: Feedbacks NOT available for NPS, e-NPS, and engagement instruments.

---

## Suggestion Box API

### Basic Query

**GET** `https://www.pulses.com.br/api/engage/v1/suggestions/`

**Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `from_date` | Yes | - | Start date (YYYY-MM-DD) |
| `to_date` | Yes | - | End date (YYYY-MM-DD) |
| `page` | No | 1 | Page number |
| `offset` | No | 1 | First suggestion to display |
| `limit` | No | 5000 | Per page |

**Response Fields:**
- `suggestion` - Text content
- `readed` - 0=unread, 1=read
- `date_received` - Submission timestamp
- `id_client` - Internal client ID
- `name` - Submitter name (null for anonymous)
- `description` - Associated dimension (multilingual JSON)

### Public Suggestion Box with Filters

**POST** `https://www.pulses.com.br/api/engage/v1/suggestions/search`

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `startDate` | No | Period start |
| `endDate` | No | Period end (default: current date) |
| `offset` | No | Pagination start |
| `limit` | No | Max per page (default: 15) |
| `unread` | No | Filter read status (true/false) |
| `leaders` | No | Filter by manager IDs |
| `groups` | No | Filter by department IDs |
| `positions` | No | Filter by job titles |
| `genders` | No | Filter by gender |
| `sexes` | No | Filter by sex (F/M) |
| `unitBusinesses` | No | Filter by business unit |
| `unitGeographies` | No | Filter by geography |
| `tags` | No | Filter by tags |
| `scholarities` | No | Filter by education level |

---

## Response Codes

- `code: 1` = Success
- `code: 0` = Error (check message field)

---

## Integration Workflow Summary

1. **Build group hierarchy** first (POST /groups with parent_id)
2. **Load employees** with group assignments (POST /employees)
3. **Configure instruments** via platform UI
4. **Query scores** via heat map, cross-referenced, or aggregated endpoints
5. **Monitor feedbacks** via feedbacks endpoint
6. **Read suggestions** via suggestion box endpoint
