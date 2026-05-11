# Layers Education — Knowledge Base

> Plataforma educacional — Portal de comunicação escola-família, Super Cantina (alimentação escolar), APIs de dados/pagamentos/sync.

---

## Visão Geral

| Métrica | Valor |
|---------|-------|
| Arquivos | 42 |
| Portal docs | 7 (visão geral, config, API ref, SSO, exemplos, serviços) |
| Super Cantina docs | 25 (arquitetura, backend, frontend, PDV, DB, segurança, DevOps) |
| APIs documentadas | 6 (Portal, Community Data, Auth/SSO, Payments, Notifications, Data Sync) |
| Última atualização | 2026-03-21 |

## Estrutura

```
layers/
├── portal-docs/           # Portal Layers — comunicação escola-família
│   ├── 01-VISAO-GERAL.md
│   ├── 02-CONFIGURACAO-LIB.md
│   ├── 03-REFERENCIA-API.md
│   ├── 04-AUTENTICACAO-SSO.md
│   ├── 05-EXEMPLOS-PRATICOS.md
│   ├── 06-SERVICOS-RELACIONADOS.md
│   └── README.md
├── super-cantina-docs/    # Super Cantina — alimentação escolar
│   ├── 01-ARQUITETURA/   # Visão geral + integração Layers
│   ├── 02-BACKEND-API/   # Auth, Decision Engine, Guardian, PDV, Sync
│   ├── 03-FRONTEND/      # Arquitetura, componentes UX, state machine
│   ├── 04-PDV/           # Offline, decisão local, identificação alunos, sync
│   ├── 05-DATABASE/      # Schema, migrations, backup
│   ├── 06-SEGURANCA/     # Autenticação, autorização, LGPD
│   └── 07-DEVOPS/        # CI/CD, monitoramento, deploy
├── api-reference.md       # Visão geral das APIs públicas
├── api-hub.md             # API Hub
├── auth-api.md            # SSO, OAuth2, session management
├── community-data-api.md  # /open-api/data endpoints
├── payments-api.md        # Sales, items, kits, inventory
├── notifications-api.md   # Push, email, in-app
├── data-sync.md           # Sincronização de dados
└── permissions.md         # Modelo de permissões
```

## APIs Principais

| API | Endpoint Base | Uso |
|-----|--------------|-----|
| Community Data | `/open-api/data` | Alunos, turmas, responsáveis, professores |
| Auth/SSO | `/open-api/auth` | Login, OAuth2, sessão |
| Payments | `/open-api/payments` | Vendas, itens, estoque, kits |
| Notifications | `/open-api/notifications` | Push, email, avisos |
| Data Sync | `/open-api/sync` | Sincronização bidirecional |
