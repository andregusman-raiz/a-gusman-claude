# Grafana Cloud Quality Dashboard Setup

## Overview

Free tier: 10K metrics, 50GB logs, 50GB traces — sufficient for both rAIz projects.

## Datasources

1. **GitHub Actions** — via Prometheus exporter or API polling
2. **Sentry** — via Sentry API datasource plugin
3. **Vercel** — via Vercel API (custom datasource)
4. **Supabase** — via PostgreSQL direct connection (read replica)

## Dashboards

### 1. Application Health
- Error rate (Sentry events/hour)
- Latency p50/p95/p99 (Vercel analytics)
- Availability (health endpoint uptime)
- Active users (Supabase auth sessions)

### 2. DORA Metrics
- Deployment Frequency (GitHub Actions deploy runs/week)
- Lead Time for Changes (PR open → merge time)
- Change Failure Rate (failed deploys / total deploys)
- MTTR (incident issue open → close time)

### 3. Testing Quality
- Test pass rate (CI workflow success %)
- Mutation score trend (Stryker weekly results)
- E2E pass rate (Playwright workflow results)
- Coverage trend (from coverage reports)
- Flaky test detection (tests that flip pass/fail)

### 4. Performance (Web Vitals)
- LCP by page (< 2.5s target)
- CLS by page (< 0.1 target)
- INP by page (< 200ms target)
- TTFB by region

## Setup Steps

```bash
# 1. Sign up at grafana.com (free tier)
# 2. Create stack (select region: sa-east-1 for Brazil)
# 3. Install datasource plugins:
#    - GitHub (built-in)
#    - JSON API (for Sentry/Vercel)
#    - PostgreSQL (for Supabase)

# 4. Configure datasources with env vars:
# GRAFANA_GITHUB_TOKEN=ghp_xxx
# GRAFANA_SENTRY_TOKEN=sntrys_xxx
# GRAFANA_SUPABASE_URL=postgresql://...

# 5. Import dashboard JSONs (see below)
```

## N8N Integration

N8N pushes metrics to Grafana Cloud via Prometheus push gateway:

```
GitHub Actions → quality-digest.yml → N8N webhook → Grafana Prometheus
Sentry → Sentry webhook → N8N → Grafana Prometheus
Manual → n8n.raizeducacao.com.br → Grafana
```

## Alert Rules

| Alert | Condition | Channel |
|-------|-----------|---------|
| Error Spike | > 2x baseline in 15min | Email + Slack |
| Deploy Failed | deploy-gate failure | Email |
| P0 Bug Created | New issue with P0 label | Email + Slack |
| Performance Degraded | LCP > 4s for 30min | Email |
| MTTR Warning | Open incident > 4 hours | Email |

## Cost

Free tier covers both projects. Upgrade only if:
- > 10K active metric series
- > 50GB logs/month
- Need advanced alerting (PagerDuty, OpsGenie)
