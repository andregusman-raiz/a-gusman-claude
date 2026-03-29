# n8n — Workflow Automation API Reference

> Fonte: https://docs.n8n.io/api/
> Atualizado: 2026-03-21
> Instância Raíz: https://n8n.raizeducacao.com.br

## Visao Geral

n8n é a plataforma de automação de workflows usada pela Raíz Educação.
A API pública permite gerenciar workflows, execuções e credenciais programaticamente.

## Autenticação

- **Header**: `X-N8N-API-KEY: {N8N_API_KEY}`
- **Base URL**: `{N8N_INSTANCE_URL}/api/v1`

## Endpoints Principais

### Workflows
```
GET    /workflows              → listar workflows
POST   /workflows              → criar workflow
GET    /workflows/{id}         → detalhes do workflow
PUT    /workflows/{id}         → atualizar workflow
DELETE /workflows/{id}         → deletar workflow
POST   /workflows/{id}/activate    → ativar
POST   /workflows/{id}/deactivate  → desativar
```

### Executions
```
GET    /executions              → listar execuções
GET    /executions/{id}         → detalhes da execução
DELETE /executions/{id}         → deletar execução
```

### Credentials
```
GET    /credentials             → listar credenciais
POST   /credentials             → criar credencial
DELETE /credentials/{id}        → deletar credencial
GET    /credentials/schema/{type} → schema do tipo de credencial
```

### Webhook Triggers
```
POST   {N8N_INSTANCE_URL}/webhook/{webhook-path}      → trigger production
POST   {N8N_INSTANCE_URL}/webhook-test/{webhook-path}  → trigger test
```

## Uso no Raíz Platform

- **WhatsApp via n8n**: workflows que orquestram envio de mensagens Z-API
- **Alertas automáticos**: monitoramento de processos (TOTVS, Zeev)
- **Integrações cross-system**: Zeev→TOTVS, HubSpot→TOTVS, etc.
- **Flight search**: workflow para busca de voos (inativo)

## Docs Completa

- API Reference: https://docs.n8n.io/api/api-reference/
- API Playground: disponível na instância self-hosted
- OpenAPI 3.0 spec: disponível via `/api/v1/openapi.json`
