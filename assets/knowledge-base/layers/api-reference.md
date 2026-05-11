# Layers Education — API Reference

> Fonte: https://developers.layers.education/
> Atualizado: 2026-03-21

## Visao Geral

Layers Education é a plataforma de ecossistema educacional usada pela Raíz Educação.
Apps são embedded no portal Layers via LayersPortal.js SDK.

## Servicos Principais

### 1. Single Sign-On (SSO)
- Sessões via Portals (URL-based + JS SDK)
- OAuth2: access tokens, user info, account info, scopes
- Login button integration + custom flow

### 2. Notificações
- Push e email com segmentação por público-alvo
- Scheduling e click actions

### 3. Portais (LayersPortal.js)
- Embed apps dentro do ecossistema Layers
- Configuração via `window.LayersPortalOptions = { appId, insidePortalOnly }`
- OAuth2 authentication integration

### 4. Data Sync (Sincronização)
- Modos: incremental e total
- Entidades: users, members, groups, components
- Import flow com error handling e status verification

### 5. API Hub
- Action request/response architecture
- Pub/sub messaging entre apps
- Data provider/consumer patterns

### 6. Pagamentos
- Sales, payables, items, kits, packages, inventory
- Delivery tracking, webhook events, retry policies
- Marketplace integration com shipping quotes

## Apps Visualizadores (integráveis)

| App | Função |
|-----|--------|
| Notas Acadêmicas | Visualização de notas por período |
| Visão Financeira | Extrato financeiro e cobranças |
| Frequência | Frequência por disciplina |
| Registros Acadêmicos | Registros com status de visualização |
| Visão de Horários | Grade de horários |
| Ficha Médica | Registros médicos por seção |
| Calendário | Eventos por categoria |
| Relatórios | Geração de documentos |
| Entrada e Saída | Log de entrada/saída |

## Public APIs

### Community Data API (`/open-api/data`)
- Users, groups, members, enrollments, components
- Seasons, tags, roles, permissions
- Related user connections, data upload/sync

### Authentication API (`/open-api/auth`)
- User authentication, account/user info retrieval
- Session validation

### App Maker API (`/open-api/appmaker`)
- Installation approval, viewing, updating, listing

### Payments API (`/open-api/payments`)
- CRUD completo: sales, items, kits, inventory, packages, deliveries

### Notifications API (`/open-api/notification`)
- Dispatch por público-alvo

## Docs Completa
https://developers.layers.education/
