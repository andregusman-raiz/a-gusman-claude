# N8N Quality Dashboard Workflows

## Base URL
`https://n8n.raizeducacao.com.br`

## Workflow 1: Quality Digest Receiver

**Trigger**: Webhook `/webhook/quality-digest`
**Source**: `quality-digest.yml` from both projects
**Actions**:
1. Receive metrics JSON payload
2. Store in Google Sheets (quality-metrics spreadsheet)
3. Calculate weekly trends (compare with previous week)
4. If quality score dropped > 10 points → send alert email
5. Update Grafana dashboard (if configured)

### Webhook Payload
```json
{
  "project": "andregusman-raiz/rAIz_AI",
  "timestamp": "2026-03-08T11:00:00Z",
  "metrics": {
    "test_pass_rate": 95,
    "test_total_runs": 42,
    "bugs_p0": 0,
    "bugs_p1": 2,
    "bugs_total": 7,
    "deploy_count_7d": 5,
    "prs_merged_7d": 12,
    "prs_open": 3
  }
}
```

### N8N Flow
```
Webhook → Set Node (validate) → Google Sheets (append) → IF (score drop?)
  → Yes: Gmail (alert to andre.gusman@raizeducacao.com.br)
  → No: Continue
→ HTTP Request (push to Grafana Prometheus gateway, optional)
```

## Workflow 2: Sentry Error Pipeline

**Trigger**: Webhook `/webhook/sentry-errors`
**Source**: Sentry Alert Rule (webhook integration)
**Actions**:
1. Receive Sentry alert payload
2. Parse: error message, affected users count, release
3. Classify severity:
   - > 100 users affected in 15min → P0
   - > 10 users → P1
   - < 10 users → P2
4. Auto-create GitHub Issue for P0/P1
5. Send email notification

### Sentry Alert Rule Config
```
Condition: Event frequency > 10 in 15 minutes
Action: Send webhook to n8n.raizeducacao.com.br/webhook/sentry-errors
```

### N8N Flow
```
Webhook → Code Node (classify severity) → Switch (P0/P1/P2)
  → P0: HTTP Request (gh api create issue) + Gmail (urgent alert)
  → P1: HTTP Request (gh api create issue) + Gmail (alert)
  → P2: Google Sheets (log for review)
```

## Workflow 3: DORA Metrics Aggregator

**Trigger**: Cron (Monday 10am BRT) + Webhook `/webhook/dora-metrics`
**Source**: `dora-metrics.yml` output or manual trigger
**Actions**:
1. Pull DORA data from GitHub Actions API
2. Calculate 4 DORA metrics
3. Classify as ELITE/HIGH/MEDIUM/LOW
4. Store in Google Sheets
5. Generate weekly report email
6. Push to Grafana (if configured)

### DORA Classification
```
Deployment Frequency:
  ELITE: multiple per day | HIGH: daily-weekly | MEDIUM: weekly-monthly | LOW: monthly+

Lead Time:
  ELITE: < 1 hour | HIGH: < 1 day | MEDIUM: < 1 week | LOW: > 1 week

Change Failure Rate:
  ELITE: < 5% | HIGH: < 15% | MEDIUM: < 30% | LOW: > 30%

MTTR:
  ELITE: < 1 hour | HIGH: < 1 day | MEDIUM: < 1 week | LOW: > 1 week
```

## Workflow 4: Rollback Notification

**Trigger**: Webhook `/webhook/rollback`
**Source**: `auto-rollback.yml` workflow
**Actions**:
1. Receive rollback event
2. Send urgent email with reason, affected deployment, rollback status
3. Create GitHub Issue with `incident` label
4. Log to Google Sheets for MTTR tracking

## Setup Checklist

- [ ] Create webhooks in N8N:
  - [ ] `/webhook/quality-digest`
  - [ ] `/webhook/sentry-errors`
  - [ ] `/webhook/dora-metrics`
  - [ ] `/webhook/rollback`
- [ ] Configure Sentry Alert Rules to call N8N webhook
- [ ] Add `N8N_WEBHOOK_QUALITY_DIGEST` secret to both repos
- [ ] Add `N8N_WEBHOOK_ROLLBACK` secret to both repos
- [ ] Create Google Sheet "Quality Metrics" with columns: project, date, metric, value
- [ ] Test each workflow manually with workflow_dispatch
