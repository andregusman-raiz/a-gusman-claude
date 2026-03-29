# Arquitetura do Sistema - Visão Geral

## 1. Contexto do Sistema

O Super Cantina opera como um **app embedded** dentro da plataforma Layers Education, significando que:

- Não possui autenticação própria (usa SSO do Layers)
- Não compete por atenção do usuário (UX silenciosa)
- Integra-se nativamente com notificações, contexto e identidade do Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ECOSSISTEMA LAYERS                                 │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │   Aplicativo   │  │   Portal Web   │  │  Outros Apps   │                │
│  │   Layers iOS   │  │    Layers      │  │   Embedded     │                │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘                │
│          │                   │                   │                          │
│          └───────────────────┼───────────────────┘                          │
│                              │                                              │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    SUPER CANTINA (Embedded)                            │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │ │
│  │  │ Portal          │  │ Backend API     │  │ PDV System      │        │ │
│  │  │ Responsável     │  │                 │  │                 │        │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │          CANTINA FÍSICA             │
                    │  ┌─────────────┐  ┌─────────────┐  │
                    │  │    PDV 1    │  │    PDV 2    │  │
                    │  └─────────────┘  └─────────────┘  │
                    └─────────────────────────────────────┘
```

---

## 2. Componentes Principais

### 2.1 Portal do Responsável (Frontend)

**Responsabilidade**: Interface minimalista para responsáveis

| Característica | Descrição |
|----------------|-----------|
| Framework | React 18+ / TypeScript |
| State Management | XState (state machine) |
| Integração | LayersPortal.js SDK |
| Estados UX | 3 (Normal, Attention, Action) |
| Navegação | Zero - single-state UI |

**Princípios de Design**:
- Tela única sem scroll
- Máximo 1 CTA por estado
- Zero navegação entre páginas
- Informação mínima necessária

### 2.2 Backend API

**Responsabilidade**: Lógica de negócio, persistência, integrações

| Característica | Descrição |
|----------------|-----------|
| Runtime | Node.js 20+ |
| Linguagem | TypeScript 5+ |
| Framework | Express ou Fastify |
| ORM | Prisma |
| Padrões | Clean Architecture, CQRS |

**Serviços Internos**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND API                               │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Decision        │  │ Guardian        │  │ Sync            │ │
│  │ Service         │  │ Service         │  │ Service         │ │
│  │                 │  │                 │  │                 │ │
│  │ • Avaliar compra│  │ • Dashboard     │  │ • PDV sync      │ │
│  │ • SLA < 500ms   │  │ • Regras        │  │ • Batch process │ │
│  │ • Fallback      │  │ • Ações         │  │ • Conflitos     │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│  ┌─────────────────────────────┴─────────────────────────────┐ │
│  │                    DOMAIN LAYER                            │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │  │ Student │  │  Rule   │  │Purchase │  │ Event   │      │ │
│  │  │ Entity  │  │ Entity  │  │ Entity  │  │ Entity  │      │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  INFRASTRUCTURE LAYER                      │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │  │Postgres │  │  Redis  │  │ Layers  │  │EventBus │      │ │
│  │  │  Repo   │  │  Cache  │  │ Adapter │  │         │      │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Decision Engine

**Responsabilidade**: Avaliar compras em tempo real

| Característica | Descrição |
|----------------|-----------|
| SLA | < 500ms (P95) |
| Disponibilidade | 99.9% |
| Fallback | ALLOW_SAFE para valores conservadores |
| Cache | Redis com TTL de 5 minutos |

**Algoritmo de Decisão**:

```typescript
function evaluatePurchase(context: PurchaseContext): Decision {
  // 1. Restrições alimentares (SEMPRE bloqueia)
  if (matchesDietaryRestriction(context)) {
    return BLOCK_NOTIFY_PARENT;
  }

  // 2. Limite diário
  if (exceedsDailyLimit(context)) {
    return BLOCK_SILENT;
  }

  // 3. Categoria bloqueada
  if (isBlockedCategory(context)) {
    return BLOCK_SILENT;
  }

  // 4. Restrição de horário
  if (outsideAllowedTime(context)) {
    return BLOCK_SILENT;
  }

  return ALLOW;
}
```

### 2.4 Sistema PDV (Ponto de Venda)

**Responsabilidade**: Interface da cantina, operação offline-first

| Característica | Descrição |
|----------------|-----------|
| Tecnologia | Electron ou PWA |
| Storage Local | SQLite |
| Identificação | QR Code, NFC, Nome |
| Modo Offline | Decisão local + sync queue |

**Arquitetura Offline-First**:

```
┌─────────────────────────────────────────────────────────────────┐
│                          PDV APPLICATION                         │
│                                                                  │
│  ┌─────────────────┐                    ┌─────────────────┐     │
│  │   UI Layer      │                    │   SQLite DB     │     │
│  │                 │                    │                 │     │
│  │  • Identificar  │◄──────────────────►│  • Rules cache  │     │
│  │  • Exibir       │                    │  • Sync queue   │     │
│  │  • Feedback     │                    │  • Transactions │     │
│  └────────┬────────┘                    └─────────────────┘     │
│           │                                      ▲               │
│           ▼                                      │               │
│  ┌─────────────────┐                    ┌────────┴────────┐     │
│  │ Decision Engine │                    │  Sync Manager   │     │
│  │     Local       │                    │                 │     │
│  │                 │                    │  • Queue FIFO   │     │
│  │  • Regras cache │                    │  • Retry logic  │     │
│  │  • Fallback     │                    │  • Conflict res │     │
│  └─────────────────┘                    └────────┬────────┘     │
│                                                  │               │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │  Backend API    │
                                          └─────────────────┘
```

---

## 3. Fluxos de Dados

### 3.1 Fluxo de Compra Online

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Aluno  │───►│   PDV   │───►│ Backend │───►│Decision │───►│ Database│
│         │    │         │    │   API   │    │ Engine  │    │         │
└─────────┘    └────┬────┘    └────┬────┘    └────┬────┘    └─────────┘
                    │              │              │
                    │              │              │
                    │         ┌────┴────┐         │
                    │         │  Redis  │◄────────┘
                    │         │  Cache  │  (regras em cache)
                    │         └─────────┘
                    │
                    ▼
              ┌─────────┐
              │ Display │
              │ ALLOW/  │
              │ BLOCK   │
              └─────────┘
```

**Tempo Total Target**: < 800ms (identificação + decisão + feedback)

### 3.2 Fluxo de Compra Offline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Aluno  │───►│   PDV   │───►│Decision │───►│ SQLite  │
│         │    │         │    │  Local  │    │  Local  │
└─────────┘    └────┬────┘    └─────────┘    └────┬────┘
                    │                             │
                    ▼                             │
              ┌─────────┐                         │
              │ Display │                         │
              │ ALLOW/  │                         │
              │ BLOCK   │                         │
              └─────────┘                         │
                                                  │
                    ┌─────────────────────────────┘
                    │
                    ▼  [Quando online]
              ┌─────────┐    ┌─────────┐    ┌─────────┐
              │  Sync   │───►│ Backend │───►│Reconcile│
              │  Queue  │    │   API   │    │         │
              └─────────┘    └─────────┘    └─────────┘
```

### 3.3 Fluxo de Notificação

```
┌─────────────────────────────────────────────────────────────────┐
│                        DECISION ENGINE                           │
│                                                                  │
│  purchase.blocked.notify ────────────────────────────────────►  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NOTIFICATION SERVICE                         │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Build Payload   │───►│ Layers Notif.   │                     │
│  │                 │    │ API             │                     │
│  │ • Target userId │    │                 │                     │
│  │ • Channel: push │    │ POST /send      │                     │
│  │ • Body          │    │                 │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
└──────────────────────────────────┼───────────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │     LAYERS PLATFORM         │
                    │                             │
                    │  ┌───────────────────────┐ │
                    │  │ Push Notification     │ │
                    │  │ → Responsável         │ │
                    │  └───────────────────────┘ │
                    └─────────────────────────────┘
```

---

## 4. Camadas da Aplicação

### 4.1 Clean Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERFACES                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ HTTP Controllers│  │ WebSocket       │  │ Event Handlers  │ │
│  │                 │  │ Gateway         │  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼─────────────────────┼─────────────────────┼─────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Use Cases       │  │ Commands        │  │ Queries         │ │
│  │                 │  │ (Write)         │  │ (Read)          │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼─────────────────────┼─────────────────────┼─────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DOMAIN                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Entities        │  │ Value Objects   │  │ Domain Events   │ │
│  │                 │  │                 │  │                 │ │
│  │ • Student       │  │ • Money         │  │ • PurchaseAllow │ │
│  │ • Guardian      │  │ • TimeSlot      │  │ • PurchaseBlock │ │
│  │ • Purchase      │  │ • Category      │  │ • LimitReached  │ │
│  │ • Rule          │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ PostgreSQL      │  │ Redis           │  │ Layers API      │ │
│  │ Repository      │  │ Cache           │  │ Adapter         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Stack Tecnológico Detalhado

### Backend

| Componente | Tecnologia | Versão | Justificativa |
|------------|------------|--------|---------------|
| Runtime | Node.js | 20 LTS | Ecosistema JS, performance |
| Linguagem | TypeScript | 5.x | Type safety, DX |
| Framework | Fastify | 4.x | Performance superior ao Express |
| ORM | Prisma | 5.x | Type-safe queries, migrations |
| Validação | Zod | 3.x | Schema validation |
| Testes | Vitest | 1.x | Velocidade, compatibilidade TS |

### Frontend

| Componente | Tecnologia | Versão | Justificativa |
|------------|------------|--------|---------------|
| Framework | React | 18.x | Ecosistema, LayersPortal.js |
| Linguagem | TypeScript | 5.x | Type safety |
| State | XState | 5.x | State machine formal |
| Build | Vite | 5.x | Performance, DX |
| Estilo | Tailwind CSS | 3.x | Utility-first |

### Infraestrutura

| Componente | Tecnologia | Versão | Justificativa |
|------------|------------|--------|---------------|
| Banco | PostgreSQL | 15.x | ACID, JSON support |
| Cache | Redis | 7.x | Performance, pub/sub |
| Container | Docker | 24.x | Portabilidade |
| Orquestração | Kubernetes | 1.28+ | Escalabilidade |
| Observabilidade | Prometheus + Grafana | - | Métricas, alertas |

---

## 6. Decisões Arquiteturais (ADRs)

### ADR-001: Offline-First no PDV

**Contexto**: A cantina não pode parar por falha de rede.

**Decisão**: Implementar arquitetura offline-first com SQLite local.

**Consequências**:
- (+) Operação contínua sem internet
- (+) Latência reduzida para operações locais
- (-) Complexidade de sincronização
- (-) Possíveis conflitos de dados

### ADR-002: State Machine para UX

**Contexto**: PRD exige apenas 3 estados UX bem definidos.

**Decisão**: Usar XState para modelar estados formalmente.

**Consequências**:
- (+) Transições de estado determinísticas
- (+) Fácil visualização e debug
- (+) Prevenção de estados inválidos
- (-) Curva de aprendizado

### ADR-003: CQRS Light

**Contexto**: Leituras (dashboard) têm requisitos diferentes de escritas (decisões).

**Decisão**: Separar commands e queries, sem Event Sourcing completo.

**Consequências**:
- (+) Otimização independente de leitura/escrita
- (+) Queries podem usar agregados otimizados
- (-) Consistência eventual em alguns casos

---

## 7. Requisitos Não-Funcionais

| Requisito | Target | Crítico |
|-----------|--------|---------|
| Latência Decision Engine | P95 < 500ms | P99 < 1s |
| Disponibilidade API | 99.9% | 99% |
| Throughput PDV | 100 req/s | 50 req/s |
| Tempo de sync offline | < 30s | < 60s |
| Tempo de identificação | < 2s | < 5s |

---

## Próximos Documentos

1. [Componentes do Sistema](./componentes-sistema.md)
2. [Fluxos de Dados](./fluxos-dados.md)
3. [Integração com Layers](./integracao-layers.md)
