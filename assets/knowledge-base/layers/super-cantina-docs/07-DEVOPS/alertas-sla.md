# Alertas e SLAs - Super Cantina

## Visão Geral

Este documento define os SLAs (Service Level Agreements) e alertas configurados para garantir a qualidade de serviço do Super Cantina.

---

## SLAs Definidos

| Serviço | Métrica | Target | Crítico |
|---------|---------|--------|---------|
| Decision Engine | P95 Latency | < 500ms | > 750ms |
| API Availability | Uptime | > 99.9% | < 99% |
| Sync Queue | Queue Size | < 50 | > 100 |
| Notification | Success Rate | > 99% | < 95% |
| Database | Query P95 | < 100ms | > 250ms |
| Cache | Hit Rate | > 95% | < 80% |

---

## Definição de Alertas

### AlertManager Config

```yaml
# alertmanager/alertmanager.yml

global:
  slack_api_url: 'https://hooks.slack.com/services/xxx'
  smtp_smarthost: 'smtp.sendgrid.net:587'
  smtp_from: 'alertas@supercantina.com.br'
  smtp_auth_username: 'apikey'
  smtp_auth_password: '${SENDGRID_API_KEY}'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'

  routes:
    # Alertas críticos - notificação imediata
    - match:
        severity: critical
      receiver: 'critical'
      group_wait: 10s
      repeat_interval: 1h

    # Alertas de warning
    - match:
        severity: warning
      receiver: 'warning'
      group_wait: 1m

    # Alertas de SLA
    - match:
        type: sla
      receiver: 'sla-team'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#supercantina-alerts'
        send_resolved: true

  - name: 'critical'
    slack_configs:
      - channel: '#supercantina-critical'
        send_resolved: true
    pagerduty_configs:
      - service_key: '${PAGERDUTY_KEY}'
    email_configs:
      - to: 'oncall@supercantina.com.br'

  - name: 'warning'
    slack_configs:
      - channel: '#supercantina-alerts'
        send_resolved: true

  - name: 'sla-team'
    slack_configs:
      - channel: '#supercantina-sla'
        send_resolved: true
    email_configs:
      - to: 'sla-team@supercantina.com.br'

inhibit_rules:
  # Inibir warning se critical está ativo
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

---

## Regras de Alerta

### Decision Engine

```yaml
# prometheus/rules/decision-engine.yml

groups:
  - name: decision-engine
    rules:
      # ================================
      # LATÊNCIA
      # ================================
      - alert: DecisionEngineHighLatency
        expr: |
          histogram_quantile(0.95,
            rate(decision_engine_latency_seconds_bucket[5m])
          ) > 0.5
        for: 2m
        labels:
          severity: critical
          type: sla
          sla: decision_latency
        annotations:
          summary: "Decision Engine P95 latência acima de 500ms"
          description: "P95 latência atual: {{ $value | humanizeDuration }}"
          runbook: "https://wiki.supercantina.com/runbooks/decision-latency"

      - alert: DecisionEngineWarningLatency
        expr: |
          histogram_quantile(0.95,
            rate(decision_engine_latency_seconds_bucket[5m])
          ) > 0.3
        for: 5m
        labels:
          severity: warning
          type: sla
        annotations:
          summary: "Decision Engine latência elevada"
          description: "P95 latência: {{ $value | humanizeDuration }}"

      # ================================
      # TAXA DE ERRO
      # ================================
      - alert: DecisionEngineHighErrorRate
        expr: |
          rate(decision_engine_errors_total[5m])
          / rate(decision_engine_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Taxa de erro do Decision Engine acima de 1%"
          description: "Taxa atual: {{ $value | humanizePercentage }}"

      # ================================
      # THROUGHPUT
      # ================================
      - alert: DecisionEngineLowThroughput
        expr: |
          rate(decision_engine_total[5m]) < 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Decision Engine com throughput muito baixo"
          description: "Pode indicar problema de conectividade com PDVs"
```

### Sincronização

```yaml
# prometheus/rules/sync.yml

groups:
  - name: sync
    rules:
      # ================================
      # FILA DE SYNC
      # ================================
      - alert: SyncQueueBacklog
        expr: sync_queue_size > 100
        for: 10m
        labels:
          severity: critical
          type: sla
          sla: sync_queue
        annotations:
          summary: "Fila de sincronização com mais de 100 itens"
          description: "PDV {{ $labels.pdv_id }} com {{ $value }} itens pendentes"
          runbook: "https://wiki.supercantina.com/runbooks/sync-queue"

      - alert: SyncQueueGrowing
        expr: |
          delta(sync_queue_size[10m]) > 20
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Fila de sincronização crescendo rapidamente"
          description: "PDV {{ $labels.pdv_id }} cresceu {{ $value }} itens em 10min"

      # ================================
      # PDV OFFLINE
      # ================================
      - alert: PdvOffline
        expr: |
          time() - sync_last_success_timestamp > 3600
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PDV offline há mais de 1 hora"
          description: "PDV {{ $labels.pdv_id }} sem sync por {{ $value | humanizeDuration }}"

      - alert: PdvOfflineCritical
        expr: |
          time() - sync_last_success_timestamp > 14400
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "PDV offline há mais de 4 horas"
          description: "PDV {{ $labels.pdv_id }} sem sync por {{ $value | humanizeDuration }}"
          runbook: "https://wiki.supercantina.com/runbooks/pdv-offline"

      # ================================
      # CONFLITOS
      # ================================
      - alert: HighSyncConflictRate
        expr: |
          rate(sync_conflicts_total[1h]) / rate(sync_transactions_total[1h]) > 0.05
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Taxa alta de conflitos de sincronização"
          description: "{{ $value | humanizePercentage }} das transações com conflito"
```

### API e Infraestrutura

```yaml
# prometheus/rules/infrastructure.yml

groups:
  - name: api
    rules:
      # ================================
      # DISPONIBILIDADE
      # ================================
      - alert: ApiHighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
          type: sla
          sla: availability
        annotations:
          summary: "Taxa de erro da API acima de 5%"
          description: "{{ $value | humanizePercentage }} das requisições falhando"

      - alert: ApiDown
        expr: up{job="supercantina-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API Super Cantina indisponível"
          description: "Instância {{ $labels.instance }} está down"

      # ================================
      # LATÊNCIA
      # ================================
      - alert: ApiHighLatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Latência da API elevada"
          description: "P95: {{ $value | humanizeDuration }}"

  - name: database
    rules:
      # ================================
      # DATABASE
      # ================================
      - alert: DatabaseHighConnections
        expr: |
          pg_stat_activity_count{state="active"} > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Muitas conexões ativas no PostgreSQL"
          description: "{{ $value }} conexões ativas"

      - alert: DatabaseSlowQueries
        expr: |
          histogram_quantile(0.95,
            rate(db_query_duration_seconds_bucket[5m])
          ) > 0.25
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Queries lentas no banco de dados"
          description: "P95 de queries: {{ $value | humanizeDuration }}"

      - alert: DatabaseReplicationLag
        expr: |
          pg_replication_lag_seconds > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Lag de replicação do PostgreSQL"
          description: "Lag: {{ $value | humanizeDuration }}"

  - name: cache
    rules:
      # ================================
      # REDIS
      # ================================
      - alert: RedisCacheHitRateLow
        expr: |
          sum(rate(cache_hits_total[5m]))
          / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))
          < 0.80
        for: 15m
        labels:
          severity: warning
          type: sla
        annotations:
          summary: "Cache hit rate abaixo de 80%"
          description: "Hit rate: {{ $value | humanizePercentage }}"

      - alert: RedisMemoryHigh
        expr: |
          redis_memory_used_bytes / redis_memory_max_bytes > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memória do Redis acima de 85%"
          description: "Uso: {{ $value | humanizePercentage }}"
```

### Notificações

```yaml
# prometheus/rules/notifications.yml

groups:
  - name: notifications
    rules:
      - alert: NotificationFailureRate
        expr: |
          rate(notification_failures_total[5m])
          / rate(notification_attempts_total[5m]) > 0.05
        for: 10m
        labels:
          severity: warning
          type: sla
          sla: notification_success
        annotations:
          summary: "Taxa de falha de notificações acima de 5%"
          description: "{{ $value | humanizePercentage }} das notificações falhando"

      - alert: NotificationQueueBacklog
        expr: notification_queue_size > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Fila de notificações com backlog"
          description: "{{ $value }} notificações pendentes"
```

---

## Runbooks

### Decision Engine Alta Latência

```markdown
# Runbook: Decision Engine Alta Latência

## Sintomas
- Alerta: DecisionEngineHighLatency
- P95 latência > 500ms

## Impacto
- Filas nos PDVs
- Experiência degradada para operadores

## Diagnóstico

1. Verificar métricas de DB:
   ```
   histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))
   ```

2. Verificar cache hit rate:
   ```
   sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))
   ```

3. Verificar CPU/memória dos pods:
   ```
   kubectl top pods -n supercantina
   ```

## Remediação

### Se DB lento:
1. Verificar queries lentas: `pg_stat_statements`
2. Verificar índices: `EXPLAIN ANALYZE`
3. Considerar read replicas

### Se cache miss alto:
1. Verificar TTL das chaves
2. Verificar memória do Redis
3. Preaquecimento do cache se necessário

### Se recursos limitados:
1. Scale horizontal: `kubectl scale deployment supercantina-api --replicas=5`
2. Verificar HPA: `kubectl get hpa`

## Escalonamento
- Se não resolver em 15min: Chamar DBA de plantão
- Se persistir por 1h: Incidente de severidade P1
```

### PDV Offline

```markdown
# Runbook: PDV Offline

## Sintomas
- Alerta: PdvOfflineCritical
- PDV sem sync > 4 horas

## Impacto
- Transações não sincronizadas
- Regras podem estar desatualizadas
- Risco de decisões incorretas

## Diagnóstico

1. Verificar status do PDV no dashboard
2. Contatar escola para verificar conectividade
3. Verificar logs do último sync:
   ```
   kubectl logs -l app=supercantina --since=6h | grep "PDV_ID"
   ```

## Remediação

### Problema de rede:
1. Orientar escola a verificar conexão
2. Verificar se firewall está bloqueando
3. Testar conectividade: `curl https://api.supercantina.com.br/health`

### Problema no PDV:
1. Reiniciar aplicação PDV
2. Limpar cache local se necessário
3. Forçar full sync

### Problema no servidor:
1. Verificar se API está respondendo
2. Verificar certificados SSL
3. Verificar rate limiting

## Escalonamento
- Se PDV crítico (> 100 transações/dia): Prioridade alta
- Se múltiplos PDVs: Investigar problema sistêmico
```

---

## Dashboard de SLA

### Métricas Chave

```yaml
# SLA Dashboard - Queries

sla_decision_latency_compliance:
  query: |
    sum(rate(decision_engine_latency_seconds_bucket{le="0.5"}[24h]))
    / sum(rate(decision_engine_latency_seconds_count[24h])) * 100
  target: 95%

sla_api_availability:
  query: |
    (1 - sum(rate(http_requests_total{status=~"5.."}[24h]))
    / sum(rate(http_requests_total[24h]))) * 100
  target: 99.9%

sla_sync_queue_compliance:
  query: |
    sum(sync_queue_size < 50) / count(sync_queue_size) * 100
  target: 99%

sla_notification_success:
  query: |
    sum(rate(notification_success_total[24h]))
    / sum(rate(notification_attempts_total[24h])) * 100
  target: 99%
```

---

## Integração PagerDuty

```yaml
# pagerduty/services.yml

services:
  - name: SuperCantina - Decision Engine
    escalation_policy: supercantina-oncall
    alert_creation: create_alerts_and_incidents
    auto_resolve_timeout: 14400  # 4 horas

  - name: SuperCantina - API
    escalation_policy: supercantina-oncall
    alert_creation: create_alerts_and_incidents
    auto_resolve_timeout: 14400

escalation_policies:
  - name: supercantina-oncall
    rules:
      - escalation_delay: 5
        targets:
          - type: schedule
            id: supercantina-primary
      - escalation_delay: 15
        targets:
          - type: schedule
            id: supercantina-secondary
      - escalation_delay: 30
        targets:
          - type: user
            id: tech-lead
```

---

## Referências

- [Monitoramento](./monitoramento.md)
- [Infraestrutura](./infraestrutura.md)
- [Decision Engine](../02-BACKEND-API/decision-engine.md)
