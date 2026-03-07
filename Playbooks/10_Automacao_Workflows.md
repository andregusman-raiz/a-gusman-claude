# Playbook 10: Automacao de Workflows

> Automatizar processos repetitivos com confiabilidade.

## Stack de Automacao

```
Frontend (UI) → Backend (API/Serverless) → Automacao (N8N/Cron) → Integracoes Externas
```

| Ferramenta | Quando Usar |
|------------|-------------|
| N8N | Workflows visuais, integracoes complexas |
| Cron Jobs | Tarefas periodicas simples |
| GitHub Actions | CI/CD, automacoes de repositorio |
| Webhooks | Eventos em tempo real |

## Principios

1. **Idempotencia** — executar 2x = mesmo resultado que 1x
2. **Error handling** — retry + backoff + dead letter queue
3. **Observabilidade** — logging em cada step
4. **Testabilidade** — testar cada node isoladamente

## Padrao de Workflow

```
Trigger → Validacao → Processamento → Resultado → Notificacao
   │           │            │              │
   └── Log ────┴── Log ─────┴── Log ───────┴── Log
```

## Error Handling

```
Erro detectado?
├── Transiente (rede, timeout) → Retry com exponential backoff
│   ├── 1s → 2s → 4s → Dead Letter Queue
├── Permanente (dados invalidos) → Dead Letter Queue + Alerta
└── Critico (sistema fora) → Alerta imediato + Circuit Breaker
```

## Idempotencia

```typescript
async function processOrder(orderId: string) {
  const existing = await db.query('SELECT id FROM processed_orders WHERE order_id = $1', [orderId]);
  if (existing.rows.length > 0) return { status: 'already_processed' };
  await db.query('INSERT INTO processed_orders (order_id) VALUES ($1)', [orderId]);
  // ... processar
}
```

| Operacao | Estrategia |
|----------|-----------|
| INSERT | Upsert com ON CONFLICT |
| UPDATE | Verificar versao/timestamp |
| DELETE | IF EXISTS |
| Email | Verificar se ja enviou |
| Pagamento | Transaction_id unico |
| Webhook | Deduplicar por event_id |

## Cron Jobs

### Boas Praticas
1. Logging de inicio, fim, e resultado
2. Lock para evitar execucao concorrente
3. Timeout definido
4. Alertas se falha
5. Idempotencia

| Job | Cron | Descricao |
|-----|------|-----------|
| Cleanup | `0 3 * * *` | Diario as 3h |
| Report | `0 8 * * 1` | Segunda as 8h |
| Backup | `0 */6 * * *` | A cada 6h |
| Health check | `*/5 * * * *` | A cada 5 min |
