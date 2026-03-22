# Gupy API - Training (Educacao Corporativa & Learning Pathways)

> Deep documentation extracted from https://developers.gupy.io/

---

## Overview

The Training product covers two main areas:
1. **Corporate Education (Educacao Corporativa)** - User and group management for training platform
2. **Learning Pathways (Trilhas)** - Learning paths, content tracking, and employee progress

Both have **different architecture** from other Gupy products, with separate authentication, rate-limiting, and pagination.

---

## Corporate Education API

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users | List users |
| POST | /users | Create/Update users |
| GET | /users/{id} | User details |
| DELETE | /users/{id} | Delete user |

### Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /groups | List groups |
| POST | /groups | Create group |
| GET | /groups/{id} | Group details |
| PUT | /groups/{id} | Update group |
| DELETE | /groups/{id} | Delete group |
| GET | /groups/{id}/members | List group members |
| POST | /groups/{id}/members | Add member to group |
| GET | /groups/{id}/members/{memberId} | Member details |
| DELETE | /groups/{id}/members/{memberId} | Remove member |
| GET | /users/{userId}/groups | List user's groups |

---

## Learning Pathways API

### Authentication

```http
POST /tokens
```

Creates a token in the Gupy company central (central de empresas).

### Pathways (Trilhas)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /pathways | List company pathways |
| GET | /pathways/{id} | Specific pathway details |
| GET | /pathways/{id}/groups | Groups in a pathway |
| GET | /pathways/{id}/employees | Pathway participants |
| GET | /pathways/{id}/contents | Pathway contents |

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /employees | List company employees |
| GET | /employees/{id}/groups | Employee's groups |
| GET | /employees/{id}/pathways | Employee's pathways |
| GET | /employees/{id}/pathway-details | Detailed pathway progress |

### Contents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /contents | List all pathway contents |
| GET | /contents/{id} | Specific content details |
| GET | /contents/{id}/employees | Employees who accessed content |

---

## Integration Flows

### User Integration Flow

CRUD operations for managing platform users:
1. Create users via POST /users
2. Query existing users via GET /users
3. Update user data via POST /users (same endpoint, upsert behavior)
4. Remove users via DELETE /users/{id}

### Group Integration Flow

CRUD operations for managing groups:
1. Create organizational groups via POST /groups
2. Add members to groups via POST /groups/{id}/members
3. Query group membership via GET /groups/{id}/members
4. Remove members via DELETE /groups/{id}/members/{memberId}

---

## Key Differences from Other Gupy APIs

| Aspect | Training API | Other APIs |
|--------|-------------|------------|
| Architecture | Separate system | Unified |
| Authentication | Product-specific tokens | Standard Bearer |
| Rate limiting | Product-specific rules | 900/min/IP |
| Pagination | Product-specific | page/perPage |
| Base URL | Different per product | api.gupy.io |

---

## Use Cases

1. **Onboarding Training**: Auto-enroll new hires in mandatory pathways
2. **Compliance Tracking**: Monitor content completion rates
3. **Group-Based Learning**: Assign pathways to organizational groups
4. **Progress Reporting**: Extract employee pathway progress for BI
5. **Gamification**: Platform supports microlearning and gamification techniques
