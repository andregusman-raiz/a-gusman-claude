# Super Cantina - Documentação Técnica

## Visão Geral do Produto

**Super Cantina** é um aplicativo de gestão de cantina escolar com UX "invisível", projetado para operar como app embedded na plataforma **Layers Education**.

### Filosofia do Produto

> "O responsável esquece que o app existe — mas confia completamente nele."

| Princípio | Implementação |
|-----------|---------------|
| Silêncio | Nenhuma notificação sem exceção real |
| Invisibilidade | Zero telas transacionais |
| Previsibilidade | Decisão sempre antecipada |
| Exceção > Rotina | Alerts só em violação |
| Uma Tela | UI single-state |

### Métricas de Sucesso

- **North Star**: % de dias sem abertura do app pelo responsável
- **SLA Decision Engine**: < 500ms (P95)
- **Interações semanais do responsável**: < 1

---

## Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Backend | Node.js 20+ / TypeScript |
| API Framework | Express ou Fastify |
| ORM | Prisma |
| Banco de Dados | PostgreSQL 15+ |
| Cache | Redis 7+ |
| Frontend | React 18+ / TypeScript |
| State Management | XState |
| PDV | Electron ou PWA |
| Storage Local | SQLite |
| Integração | Layers Portal SDK |

---

## Estrutura da Documentação

```
super-cantina-docs/
│
├── README.md                          # Este arquivo
│
├── 01-ARQUITETURA/
│   ├── visao-geral.md                 # Diagrama de contexto e componentes
│   ├── componentes-sistema.md         # Detalhamento de cada componente
│   ├── fluxos-dados.md                # Fluxos de dados críticos
│   └── integracao-layers.md           # Integração com plataforma Layers
│
├── 02-BACKEND-API/
│   ├── autenticacao.md                # SSO e validação de sessão
│   ├── decision-engine.md             # Motor de decisão (SLA < 500ms)
│   ├── guardian-api.md                # API do portal do responsável
│   ├── pdv-api.md                     # API para ponto de venda
│   └── sync-api.md                    # Sincronização offline
│
├── 03-FRONTEND/
│   ├── arquitetura.md                 # Estrutura do projeto React
│   ├── layers-portal-integration.md   # Integração LayersPortal.js
│   ├── state-machine.md               # State machine com XState
│   └── componentes-ux.md              # Componentes dos 3 estados UX
│
├── 04-PDV/
│   ├── arquitetura-offline.md         # Arquitetura offline-first
│   ├── identificacao-alunos.md        # QR Code, NFC, busca por nome
│   ├── decision-local.md              # Decision engine local
│   └── sincronizacao.md               # Protocolo de sincronização
│
├── 05-BANCO-DADOS/
│   ├── schema.md                      # Schema completo PostgreSQL
│   ├── queries-criticas.md            # Queries otimizadas
│   └── performance.md                 # Índices e otimizações
│
├── 06-SEGURANCA/
│   ├── autenticacao-sso.md            # Fluxo SSO detalhado
│   ├── rbac.md                        # Roles e permissões
│   ├── lgpd.md                        # Conformidade LGPD
│   └── criptografia.md                # Proteção de dados
│
└── 07-DEVOPS/
    ├── infraestrutura.md              # Docker, Kubernetes
    ├── deploy.md                      # CI/CD pipeline
    ├── monitoramento.md               # Prometheus, Grafana
    └── alertas-sla.md                 # Alertas e SLOs
```

---

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PLATAFORMA LAYERS                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LayersPortal.js  │  SSO API  │  Notification API  │  Context API     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│   PORTAL RESPONSÁVEL  │ │   SUPER CANTINA API   │ │        PDV            │
│   (React/TypeScript)  │ │   (Node.js/TypeScript)│ │   (Electron/PWA)      │
│                       │ │                       │ │                       │
│  • 3 Estados UX       │ │  • Decision Engine    │ │  • Offline-first      │
│  • Single Page        │ │  • Guardian API       │ │  • Cache local        │
│  • Zero navegação     │ │  • PDV API            │ │  • Sync queue         │
│                       │ │  • Sync API           │ │                       │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
              ┌──────────┐     ┌──────────┐     ┌──────────┐
              │PostgreSQL│     │  Redis   │     │ EventBus │
              │  (RDS)   │     │ (Cache)  │     │ (Eventos)│
              └──────────┘     └──────────┘     └──────────┘
```

---

## Fluxos Principais

### 1. Fluxo de Compra (PDV)

```
Aluno → Identificação (QR/NFC) → Decision Engine → ALLOW/BLOCK → Registro
                                       │
                                       ▼
                              [Se BLOCK_NOTIFY]
                                       │
                                       ▼
                              Notification API → Push para Responsável
```

### 2. Fluxo do Responsável

```
Responsável abre app → LayersPortal.js → Validação SSO → Dashboard
                                                              │
                              ┌───────────────────────────────┼───────────────────────────────┐
                              │                               │                               │
                              ▼                               ▼                               ▼
                      Estado NORMAL                   Estado ATTENTION                Estado ACTION
                  "Hoje está tudo certo"           "Limite atingido"            "Deseja ajustar?"
                       (95% tempo)                  (Sistema resolveu)               (CTA único)
```

### 3. Fluxo Offline (PDV)

```
PDV sem conexão → Cache local de regras → Decision local → Transação registrada
                                                                    │
                                                                    ▼
                                                              [Quando online]
                                                                    │
                                                                    ▼
                                                    Sync batch → Reconciliação → Eventos
```

---

## Eventos do Sistema

| Evento | Descrição | Notifica? |
|--------|-----------|-----------|
| `purchase.allowed` | Compra aprovada | ❌ |
| `purchase.blocked.silent` | Bloqueio por limite diário | ❌ |
| `purchase.blocked.notify` | Bloqueio por restrição alimentar | ✅ |
| `limit.reached` | Limite diário atingido | ❌ |

---

## Anti-Features (Proibidas)

Estas funcionalidades **NÃO DEVEM** ser implementadas sem revisão executiva:

- ❌ Cardápio navegável
- ❌ Feed de atividades
- ❌ Chat ou mensagens
- ❌ Cashback ou gamificação
- ❌ Relatórios detalhados para pais
- ❌ Controle em tempo real
- ❌ Histórico de compras visível

---

## APIs Principais

### Decision API (PDV)

```http
POST /api/v1/pdv/evaluate
Content-Type: application/json

{
  "studentId": "uuid",
  "itemCategory": "lanche",
  "amount": 1500,
  "timestamp": "2024-01-15T10:30:00Z",
  "pdvId": "pdv-001"
}

Response: {
  "decision": "ALLOW" | "BLOCK_SILENT" | "BLOCK_NOTIFY_PARENT",
  "transactionId": "uuid",
  "metadata": {
    "dailySpent": 3500,
    "dailyLimit": 5000,
    "remainingToday": 1500
  }
}
```

### Guardian Dashboard API

```http
GET /api/v1/guardian/dashboard
Authorization: Bearer <token>

Response: {
  "state": "NORMAL" | "ATTENTION" | "ACTION_REQUIRED",
  "students": [...],
  "pendingActions": [...]
}
```

---

## SLAs e Métricas

| Métrica | Target | Crítico |
|---------|--------|---------|
| Decision Engine P95 | < 500ms | > 750ms |
| Sync Queue Size | < 50 | > 100 |
| Notification Success Rate | > 99% | < 95% |
| API Availability | > 99.9% | < 99% |

---

## Contato e Suporte

- **Developer Center Layers**: https://developers.layers.education
- **Suporte Layers**: suporte@layers.education
- **Status da Plataforma**: https://status.layers.digital

---

## Documentação Relacionada

- [Layers Portal Docs](../layers-portal-docs/README.md)
- [PRD Técnico Super Cantina](./PRD.md)
