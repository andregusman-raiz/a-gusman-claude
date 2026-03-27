# SENTINEL Security Dimensions — 6D Rubric

## S1-SHIELD (Security Configuration) — 20%

| Check | PASS | FAIL |
|-------|------|------|
| HSTS header with max-age >= 31536000 | Present | Missing or low max-age |
| X-Content-Type-Options: nosniff | Present | Missing |
| X-Frame-Options: DENY or SAMEORIGIN | Present | Missing |
| Content-Security-Policy | Defined | Missing |
| Permissions-Policy | Defined | Missing |
| Referrer-Policy | strict-origin-when-cross-origin | Missing |
| Cookies HttpOnly | All session cookies | Any session cookie without |
| Cookies Secure | All session cookies | Any without Secure flag |
| Cookies SameSite | Strict or Lax | None or missing |
| CORS not wildcard on auth APIs | Specific origins | Origin: * on auth endpoint |
| HTTPS redirect | HTTP 301/302 to HTTPS | No redirect |
| TLS 1.2+ | Yes | TLS 1.0 or 1.1 |
| /.env returns 404 | 404 | 200 or content |
| /.git returns 404 | 404 | 200 or content |
| Source maps not in prod | 404 on .map files | Accessible |

## S2-GATES (Authentication & Authorization) — 20%

### DEFENSIVE checks
| Check | PASS | FAIL |
|-------|------|------|
| Protected route without auth | Redirects to login | Shows content |
| API without Bearer token | 401/403 | 200 with data |
| Token has expiry | Finite TTL | No expiry |
| Post-logout token rejected | 401 | Still valid |
| User accessing admin route | 403 | 200 |
| Cross-org data access | 403 | Shows other org data |

### OFFENSIVE checks (local/staging only)
| Check | PASS | FAIL |
|-------|------|------|
| Tampered JWT rejected | 401 | Accepted |
| IDOR blocked | 403 | Returns other user data |
| Path traversal blocked | 404/403 | Accesses restricted path |
| Brute force rate-limited | 429 after N attempts | No limit |
| Parameter injection ignored | Server ignores extra fields | Accepts role escalation |

## S3-WALLS (Injection & Validation) — 20%

### DEFENSIVE checks
| Check | PASS | FAIL |
|-------|------|------|
| No template literals in SQL | ORM/prepared only | Raw SQL with interpolation |
| Input validation present | Zod/Joi on API routes | No validation |
| Output sanitization | React default escaping | Unsafe HTML rendering |
| No eval/Function with input | Not found | Found |

### OFFENSIVE checks (local/staging only)
| Check | PASS | FAIL |
|-------|------|------|
| XSS payload escaped | Not rendered raw | Rendered in DOM |
| SQL injection blocked | Normal response | Error/data leak |
| Command injection blocked | Normal response | Command executed |
| Path traversal blocked | 404/400 | File contents returned |

## S4-VAULT (Secrets & Exposure) — 15%

| Check | PASS | FAIL |
|-------|------|------|
| No secrets in git history | trufflehog clean | Verified secrets found |
| No hardcoded secrets in code | Grep clean | Secrets outside .env |
| .env not in git | Not tracked | Tracked |
| .env.example has no real values | Placeholders only | Real values |
| No source maps in prod | 404 | Accessible |
| Error responses no stack traces | Generic message | Stack trace exposed |
| Dependency audit clean | 0 critical | Critical vulns found |

## S5-STRESS (Load Testing) — 15%

| Scenario | VUs | Duration | Pass Criteria |
|----------|-----|----------|--------------|
| Smoke | 5 | 30s | p95 < 1s, errors < 1% |
| Load | 50 | 2min | p95 < 2s, errors < 5% |
| Stress | 100 | 2min | p95 < 5s, errors < 10% |
| Spike | 200 burst | 30s | No crash, recovery < 30s |
| Endurance | 30 | 5min | No memory leak, stable p95 |

## S6-GUARD (LGPD Compliance) — 10%

| Check | PASS | FAIL |
|-------|------|------|
| No PII in plaintext logs | Clean | CPF/email/phone found |
| Audit trail table exists | Present | Missing |
| CRUD generates audit records | Records created | No records |
| Data export endpoint exists | Available | Missing |
| Data deletion endpoint exists | Available | Missing |
| Cascade delete works | Related data removed | Orphaned data |
| Privacy policy accessible | Public page | Missing or broken |
| Cookie consent (if 3rd party) | Banner present | Missing |

## Score Calculation

```
SSS = S1*0.20 + S2*0.20 + S3*0.20 + S4*0.15 + S5*0.15 + S6*0.10
```

Each dimension: checks_passed / total_checks * 100
