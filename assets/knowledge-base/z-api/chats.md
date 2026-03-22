# Z-API Chats & Queue API Reference

> Base URL: `https://api.z-api.io/instances/{YOUR_INSTANCE}/token/{YOUR_TOKEN}`

## Authentication

All endpoints require the `Client-Token` header.

---

## 1. Get Chats

**GET** `/chats?page={page}&pageSize={pageSize}`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | Yes | Page number for pagination |
| pageSize | integer | Yes | Results per page |

### Response (200)

Returns an array of chat objects:

| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | Chat name (includes group/list IDs if applicable) |
| phone | string | Contact phone number |
| unread | string | Count of unread messages |
| lastMessageTime | string | Unix timestamp of last interaction |
| isMuted | string | `"0"` or `"1"` mute status |
| isMarkedSpam | boolean | Spam status |
| profileThumbnail | string | Chat photo URL (deletes after 48 hours) |
| isGroup | boolean | Group chat indicator |
| isGroupAnnouncement | boolean | Announcement group indicator |
| notes | object | Chat notes (WhatsApp Business only) |

---

## 2. Get Queue

**GET** `/queue?page={page}&pageSize={pageSize}`

Returns messages currently in the sending queue.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | Yes | Page number |
| pageSize | integer | Yes | Messages per page |

### Response (200)

```json
{
  "size": 2,
  "messages": [
    {
      "Message": "Mensagem da fila 1",
      "Phone": "5511999999999",
      "ZaapId": "39BB1684570F00E91090F6BBC7EE7646",
      "Created": 1624977905648,
      "MessageId": "7AD29EAA5EF34C301F0B"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| size | string | Number of messages in queue |
| messages | array | Queue message objects |

### Message Object

| Field | Type | Description |
|-------|------|-------------|
| Message | string | Text content |
| Phone | string | Recipient phone number |
| ZaapId | string | Z-API message identifier |
| Created | timestamp | Message creation timestamp (Unix ms) |
| MessageId | string | Message identifier |

---

## 3. Get Queue Count

**GET** `/queue/count`

Returns the total number of messages currently in the queue.
