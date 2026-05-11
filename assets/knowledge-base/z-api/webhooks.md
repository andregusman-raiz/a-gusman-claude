# Z-API Webhooks Reference

> Base URL: `https://api.z-api.io/instances/{YOUR_INSTANCE}/token/{YOUR_TOKEN}`

## Overview

Webhooks enable real-time communication between Z-API instances and external applications. Z-API uses webhooks to notify your system whenever events occur on the connected WhatsApp instance.

**Requirements:**
- Webhook endpoints MUST use HTTPS (HTTP not accepted)
- Endpoints must accept POST requests with JSON payloads

## Configuration

Webhooks are configured through:
1. The admin panel (instance options > "edit instance")
2. API endpoints (PUT requests)

---

## Webhook Types

### 1. Delivery Callback (On Message Send)

**Event Type:** `DeliveryCallback`

**Trigger:** Fires when a message is successfully sent through the instance.

**Configuration endpoint:** `PUT /update-webhook-delivery`

```json
{
  "value": "https://your-system-url.com/webhook-path"
}
```

**Payload:**

```json
{
  "phone": "554499999999",
  "zaapId": "A20DA9C0183A2D35A260F53F5D2B9244",
  "messageId": "A20DA9C0183A2D35A260F53F5D2B9244",
  "type": "DeliveryCallback",
  "instanceId": "instance.id"
}
```

| Field | Type | Description |
|-------|------|-------------|
| phone | string | Recipient's phone number |
| zaapId | string | Message identifier |
| messageId | string | Message identifier (same as zaapId) |
| type | string | `"DeliveryCallback"` |
| instanceId | string | Instance identifier |

---

### 2. Received Callback (On Message Received)

**Event Type:** `ReceivedCallback`

**Trigger:** Fires when a message is received on the connected WhatsApp instance.

**Configuration endpoint:** `PUT /update-webhook-received`

**Payload:**

```json
{
  "isStatusReply": false,
  "senderLid": "81896604192873@lid",
  "connectedPhone": "554499999999",
  "waitingMessage": false,
  "isEdit": false,
  "isGroup": false,
  "instanceId": "A20DA9C0183A2D35A260F53F5D2B9244",
  "messageId": "A20DA9C0183A2D35A260F53F5D2B9244",
  "phone": "5544999999999",
  "fromMe": false,
  "momment": 1632228638000,
  "status": "RECEIVED",
  "chatName": "name",
  "senderPhoto": "https://example.com/photo.jpg",
  "senderName": "name",
  "photo": "https://example.com/photo.jpg",
  "broadcast": false,
  "type": "ReceivedCallback",
  "text": {
    "message": "test",
    "description": "optional",
    "title": "optional",
    "url": "optional"
  }
}
```

#### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| type | string | `"ReceivedCallback"` |
| instanceId | string | Unique instance identifier |
| messageId | string | Message identifier |
| phone | string | Phone/group that sent the message |
| connectedPhone | string | Phone connected to the API |
| fromMe | boolean | Whether sender is the connected account |
| momment | integer | Timestamp (milliseconds) |
| status | string | `PENDING`, `SENT`, `RECEIVED`, `READ`, `PLAYED` |
| chatName | string | Name of chat or sender |
| senderName | string | Name of message sender |
| senderPhoto | string | URL of sender's profile photo |
| isGroup | boolean | Whether chat is a group |
| isNewsletter | boolean | Whether chat is a channel |
| isStatusReply | boolean | Whether message replies to status |
| isEdit | boolean | Whether message was edited |
| referenceMessageId | string | ID of replied-to message |
| participantPhone | string | Group participant's phone |
| messageExpirationSeconds | integer | Temporary message duration |

#### Message Type-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| text.message | string | Plain text content |
| image.imageUrl | string | Image URL |
| image.caption | string | Image caption |
| audio.audioUrl | string | Audio file URL |
| video.videoUrl | string | Video file URL |
| document.documentUrl | string | Document URL |
| contact.vCard | string | Contact vCard data |
| sticker.stickerUrl | string | Sticker file URL |
| location.latitude | float | Location latitude |
| location.longitude | float | Location longitude |

**Note:** Media files expire after 30 days.

---

### 3. Message Status Callback

**Event Type:** `MessageStatusCallback`

**Trigger:** Fires when message delivery status changes.

**Configuration endpoint:** `PUT /update-webhook-message-status`

**Status Values:**

| Status | Description |
|--------|-------------|
| SENT | Message delivered to server |
| RECEIVED | Message reached recipient's device |
| READ | Recipient opened/read the message |
| READ_BY_ME | You (connected number) read the message |
| PLAYED | Audio/voice message was played |

**Payload:**

```json
{
  "status": "SENT",
  "ids": ["999999999999999999999"],
  "momment": 1632234645000,
  "phone": "5544999999999",
  "type": "MessageStatusCallback",
  "instanceId": "instance.id"
}
```

**READ_BY_ME Payload (additional fields):**

```json
{
  "status": "READ_BY_ME",
  "ids": ["999999999999999999999"],
  "momment": 1632234645000,
  "phone": "5544999999999",
  "phoneDevice": 0,
  "type": "MessageStatusCallback",
  "instanceId": "instance.id",
  "isGroup": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| status | string | Message delivery state |
| ids | array[string] | Array of message identifiers |
| momment | number | Timestamp (milliseconds) |
| phone | string | Destination phone number |
| phoneDevice | number | Device identifier (in READ_BY_ME) |
| type | string | `"MessageStatusCallback"` |
| instanceId | string | Instance identifier |
| isGroup | boolean | Group indicator (in READ_BY_ME) |

---

### 4. Disconnected Callback

**Event Type:** `DisconnectedCallback`

**Trigger:** Fires when Z-API detects communication issues between the phone and the service.

**Configuration endpoint:** `PUT /update-webhook-disconnected`

**Payload:**

```json
{
  "momment": 1580163342,
  "error": "Device has been disconnected",
  "disconnected": true,
  "type": "DisconnectedCallback",
  "instanceId": "instance.id"
}
```

| Field | Type | Description |
|-------|------|-------------|
| momment | integer | Unix timestamp of disconnection |
| error | string | Disconnection reason |
| disconnected | boolean | Connection state (always `true`) |
| type | string | `"DisconnectedCallback"` |
| instanceId | string | Instance identifier |

---

### 5. Connected Callback

**Event Type:** `ConnectedCallback`

**Trigger:** Fires when Z-API successfully connects to WhatsApp (QR code scan, restart, etc.).

**Configuration endpoint:** `PUT /update-webhook-connected`

**Payload:**

```json
{
  "type": "ConnectedCallback",
  "connected": true,
  "momment": "26151515154",
  "phone": "numero",
  "instanceId": "instance.id"
}
```

| Field | Type | Description |
|-------|------|-------------|
| type | string | `"ConnectedCallback"` |
| connected | boolean | Connection status |
| phone | string | Connected phone number |
| momment | string | Unix timestamp |
| instanceId | string | Instance identifier |

---

### 6. Chat Presence Callback

**Event Type:** `PresenceChatCallback`

**Trigger:** Fires on chat presence/status changes.

**Configuration endpoint:** `PUT /update-webhook-chat-presence`

**Status Values:**

| Status | Description |
|--------|-------------|
| UNAVAILABLE | User outside chat |
| AVAILABLE | User in chat view |
| COMPOSING | User typing |
| PAUSED | User stopped typing (beta multi-device) |
| RECORDING | User recording audio (beta multi-device) |

**Payload:**

```json
{
  "type": "PresenceChatCallback",
  "phone": "5544999999999",
  "status": "COMPOSING",
  "lastSeen": null,
  "instanceId": "instance.id"
}
```

| Field | Type | Description |
|-------|------|-------------|
| type | string | `"PresenceChatCallback"` |
| phone | string | Contact's phone number |
| status | string | Presence state |
| lastSeen | timestamp | Last active time |
| instanceId | string | Instance identifier |

---

## Update All Webhooks at Once

**PUT** `/update-every-webhooks`

Sets all webhook URLs to the same endpoint in a single call.

### Request

```json
{
  "value": "https://your-system.com/webhook",
  "notifySentByMe": true
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| value | string | Yes | Webhook endpoint URL (HTTPS required) |
| notifySentByMe | boolean | No | Enable notifications for self-sent messages |

### Response (200)

```json
{
  "value": true
}
```

---

## Webhook Configuration Endpoints Summary

| Webhook | PUT Endpoint |
|---------|-------------|
| Delivery | `/update-webhook-delivery` |
| Received | `/update-webhook-received` |
| Message Status | `/update-webhook-message-status` |
| Disconnected | `/update-webhook-disconnected` |
| Connected | `/update-webhook-connected` |
| Chat Presence | `/update-webhook-chat-presence` |
| All at once | `/update-every-webhooks` |

All configuration endpoints accept:
- Header: `Client-Token`
- Body: `{ "value": "https://your-endpoint.com" }`

---

## Additional Webhook Pages (from sidebar)

- Update notifications for sent messages (`/update-notify-sent-by-me`)

Refer to https://developer.z-api.io/en/webhooks/introduction for the full list.
