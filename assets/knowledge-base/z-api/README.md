# Z-API — WhatsApp REST API Reference

> Fonte: https://developer.z-api.io/en/
> Atualizado: 2026-03-21

## Visao Geral

Z-API é um serviço RESTful que permite interagir com WhatsApp via API + webhooks.
Usa o mesmo canal do WhatsApp Web (não é API Oficial Meta).

- Sem limite de mensagens enviadas
- Suporta multi-device (até 4 dispositivos)
- Mensagens não são armazenadas (enviadas para fila e deletadas após envio)

## Autenticação

- **Base URL**: `https://api.z-api.io/instances/{INSTANCE_ID}/token/{INSTANCE_TOKEN}`
- **Headers**: `Client-Token: {ACCOUNT_SECURITY_TOKEN}`, `Content-Type: application/json`
- **Credenciais**: ZAPI_INSTANCE_ID, ZAPI_INSTANCE_TOKEN, ZAPI_CLIENT_TOKEN

## Endpoints Principais (usados no raiz-platform)

### Enviar Mensagem de Texto
```
POST /send-text
Body: { "phone": "5511999999999", "message": "Hello *bold*" }
Response: { "zaapId": "...", "messageId": "..." }
Optional: delayMessage (1-15s), delayTyping (1-15s), editMessageId
```

### Enviar Imagem/Documento/Audio/Video
```
POST /send-image     → { phone, image (URL), caption }
POST /send-document  → { phone, document (URL), fileName }
POST /send-audio     → { phone, audio (URL) }
POST /send-video     → { phone, video (URL), caption }
```

### Grupos
```
POST /create-group        → { groupName, phones[] }
GET  /group-metadata/{groupId}
POST /add-participant     → { groupId, phones[] }
POST /remove-participant  → { groupId, phones[] }
POST /group-invitation    → { groupId }
POST /join-group          → { invitationLink }
```

### Webhooks (receber mensagens)
```
Configurar via painel Z-API:
- on-message-received
- on-message-send
- on-message-status-changes
- on-connection-status
```

### Instância
```
GET  /status          → status da conexão
POST /start           → iniciar instância
POST /restart         → reiniciar
POST /disconnect      → desconectar
GET  /qr-code         → obter QR code para conexão
GET  /me              → dados do número conectado
```

## Docs Completa

200+ páginas em 19 categorias: Messages (39), Instance (14), Mobile (14), Groups, Contacts, Chats, Calls, Privacy, Business, Webhooks, Queue, Status, Broadcast, Newsletter, Communities, Meta AI, Partners, Integrators.

Referência completa: https://developer.z-api.io/en/
Postman Collection: https://developer.z-api.io/en/tips/postman-collection
