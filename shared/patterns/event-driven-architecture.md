# Event-Driven Architecture

## Saga Pattern

### Coreografia (2-4 passos)
Cada servico reage a eventos e publica novos eventos. Sem orquestrador central.

```
OrderService          PaymentService         InventoryService
    │                      │                       │
    │─── OrderCreated ────>│                       │
    │                      │─── PaymentProcessed ─>│
    │                      │                       │─── InventoryReserved ──>
    │<─── OrderConfirmed ──│<── ReservationDone ───│
```

**Quando usar**: 2-4 passos, logica simples, times independentes.

### Orquestracao (5+ passos)
Orquestrador central coordena a sequencia.

```typescript
class OrderSagaOrchestrator {
  async execute(orderId: string): Promise<void> {
    try {
      await this.paymentService.charge(orderId);
      await this.inventoryService.reserve(orderId);
      await this.shippingService.schedule(orderId);
      await this.notificationService.notify(orderId);
    } catch (error) {
      await this.compensate(orderId, error);
    }
  }

  private async compensate(orderId: string, error: Error): Promise<void> {
    // Compensacoes na ordem inversa
    await this.shippingService.cancel(orderId).catch(log);
    await this.inventoryService.release(orderId).catch(log);
    await this.paymentService.refund(orderId).catch(log);
  }
}
```

**Quando usar**: 5+ passos, logica complexa, precisa de visibilidade do estado da saga.

### Decision Matrix
| Criterio | Coreografia | Orquestracao |
|----------|-------------|--------------|
| Passos | 2-4 | 5+ |
| Complexidade | Baixa | Alta |
| Visibilidade | Distribuida (logs) | Centralizada (saga state) |
| Acoplamento | Baixo | Medio (orquestrador conhece todos) |
| Compensacao | Cada servico gerencia | Orquestrador gerencia |

## Tipos de Eventos

| Tipo | Conteudo | Uso |
|------|----------|-----|
| Event Notification | ID + tipo | Sinalizar mudanca, consumer busca dados |
| Event-Carried State Transfer | Dados completos | Consumer nao precisa buscar |
| Event Sourcing | Fato imutavel | Reconstruir estado, auditoria |

## Message Brokers

| Broker | Modelo | Melhor Para |
|--------|--------|-------------|
| Kafka | Log distribuido | Alto throughput, replay, stream processing |
| RabbitMQ | Message queue | Routing flexivel, low latency, work queues |
| SQS | Queue serverless | AWS-native, simples, sem gerenciamento |
| Redis Streams | Log in-memory | Baixa latencia, dados efemeros |

### Kafka vs RabbitMQ vs SQS
```
Precisa de replay/stream processing? → Kafka
Precisa de routing complexo (topic, headers)? → RabbitMQ
Quer serverless sem gerenciar broker? → SQS
Quer baixa latencia + simplicidade? → Redis Streams
```

## Idempotencia do Consumer

```typescript
class IdempotentConsumer {
  constructor(private readonly processedEvents: ProcessedEventStore) {}

  async handle(event: IntegrationEvent): Promise<void> {
    // Dedup por event ID
    if (await this.processedEvents.exists(event.id)) {
      return;  // ja processado, ignorar
    }

    await this.processEvent(event);
    await this.processedEvents.markProcessed(event.id, { ttl: '7d' });
  }
}
```

## Dead Letter Queue (DLQ)
```
Consumer tenta processar → falha
  → retry 1 (backoff) → falha
  → retry 2 (backoff) → falha
  → retry 3 (backoff) → falha
  → move para DLQ

DLQ: alerta (tamanho > 0), analise manual, re-process ou descarte
```

## Garantias de Entrega

| Garantia | Descricao | Custo |
|----------|-----------|-------|
| At-most-once | Pode perder, nunca duplica | Baixo |
| At-least-once | Nunca perde, pode duplicar (precisa idempotencia) | Medio |
| Exactly-once | Nunca perde, nunca duplica | Alto (transactional outbox) |

> **Realidade**: exactly-once e praticamente um mito em sistemas distribuidos. Use at-least-once + idempotencia.

### Transactional Outbox (para at-least-once confiavel)
```
1. Salvar entidade + evento na MESMA transacao (tabela outbox)
2. Worker le tabela outbox e publica no broker
3. Worker marca evento como publicado
4. Processo de limpeza remove eventos antigos
```

## Anti-Patterns
- **Distributed Monolith**: microsservicos que DEVEM ser deployados juntos (acoplamento temporal)
- **Event Soup**: eventos demais sem schema, impossivel entender o fluxo
- **Temporal Coupling**: servico A espera resposta sincrona do servico B via eventos
- **Missing Idempotency**: consumer processa mesmo evento 2x com side effects diferentes
- **No DLQ**: mensagens com erro sao descartadas silenciosamente
