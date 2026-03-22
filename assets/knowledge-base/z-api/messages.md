# Z-API Messages API Reference

> Base URL: `https://api.z-api.io/instances/{YOUR_INSTANCE}/token/{YOUR_TOKEN}`

## Authentication

All endpoints require the `Client-Token` header with your Account Security Token.

| Header | Value |
|--------|-------|
| Client-Token | Your account security token |
| Content-Type | application/json |

## Common Response Format

All send endpoints return:

```json
{
  "zaapId": "3999984263738042930CD6ECDE9VDWSA",
  "messageId": "D241XXXX732339502B68"
}
```

| Field | Type | Description |
|-------|------|-------------|
| zaapId | string | Z-API message identifier |
| messageId | string | WhatsApp message identifier |

## Common Error Codes

- **405**: Incorrect HTTP method
- **415**: Missing `Content-Type: application/json` header

---

## 1. Send Text Message

**POST** `/send-text`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone (DDI DDD NUMBER, e.g., `551199999999`) |
| message | string | Yes | Text content. Supports WhatsApp formatting (`*bold*`, `_italic_`, `~strikethrough~`, `` ```monospace``` ``) |
| delayMessage | number | No | Delay before sending (1-15 seconds, default: 1-3) |
| delayTyping | number | No | Duration of "Typing..." status (1-15 seconds, default: 0) |
| editMessageId | string | No | Message ID to edit previously sent content |

### Request

```json
{
  "phone": "5511999999999",
  "message": "Welcome to *Z-API*"
}
```

### Notes
- Supports emoji (standard ASCII characters)
- Line breaks: `\n`, `\r`, `\r\n`, `%0a`

---

## 2. Send Image

**POST** `/send-image`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| image | string | Yes | Image URL or Base64-encoded (prefix with `data:image/png;base64,`) |
| caption | string | No | Image description |
| messageId | string | No | Reply to specific message |
| delayMessage | number | No | Delay 1-15 seconds |
| viewOnce | boolean | No | Send as view-once message |

### Request (via URL)

```json
{
  "phone": "5511999999999",
  "image": "https://www.z-api.io/wp-content/themes/z-api/dist/images/logo.svg",
  "caption": "Logo",
  "viewOnce": false
}
```

### Request (via Base64)

```json
{
  "phone": "5511999999999",
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "caption": "Logo",
  "viewOnce": false
}
```

### Notes
- WhatsApp enforces file size limits per Facebook documentation
- Validate Base64 by testing in browser address bar

---

## 3. Send Document

**POST** `/send-document/{extension}`

The `{extension}` path parameter specifies the file type (e.g., `pdf`, `docx`).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| document | string | Yes | File URL or Base64-encoded data |
| fileName | string | No | Document display name |
| messageId | string | No | Reply to specific message |
| delayMessage | number | No | Delay 1-15 seconds |
| editDocumentMessageId | string | No | Message ID to edit caption only |

### Request

```json
{
  "phone": "5544999999999",
  "document": "https://example.com/file.pdf",
  "fileName": "My PDF"
}
```

---

## 4. Send Audio

**POST** `/send-audio`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| audio | string | Yes | Audio file URL or Base64-encoded data |
| messageId | string | No | Reply to specific message |
| delayMessage | number | No | Delay 1-15 seconds |
| viewOnce | boolean | No | Send as view-once |
| async | boolean | No | Process in background; track via delivery webhook |
| waveform | boolean | No | Include waveform visualization |

### Request

```json
{
  "phone": "5511999999999",
  "audio": "https://example.com/audio.MP3",
  "viewOnce": false,
  "waveform": true
}
```

---

## 5. Send Video

**POST** `/send-video`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| video | string | Yes | Video URL or Base64-encoded |
| caption | string | No | Text accompanying the video |
| messageId | string | No | Reply to specific message |
| delayMessage | number | No | Delay 1-15 seconds |
| viewOnce | boolean | No | Disappears after viewing |
| async | boolean | No | Process asynchronously |

### Request

```json
{
  "phone": "5511999999999",
  "video": "https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_480_1_5MG.mp4",
  "caption": "Test",
  "viewOnce": true
}
```

---

## 6. Send Sticker

**POST** `/send-sticker`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| sticker | string | Yes | Image URL or Base64-encoded |
| messageId | string | No | Reply to specific message |
| delayMessage | number | No | Delay 1-15 seconds |
| stickerAuthor | string | No | Name of sticker creator |

### Request

```json
{
  "phone": "5511999999999",
  "sticker": "https://www.z-api.io/wp-content/themes/z-api/dist/images/logo.svg",
  "stickerAuthor": "Z-API"
}
```

---

## 7. Send Contact

**POST** `/send-contact`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| contactName | string | Yes | Name of shared contact |
| contactPhone | string | Yes | Phone of shared contact |
| messageId | string | No | Reply to specific message |
| delayMessage | number | No | Delay 1-15 seconds |
| contactBusinessDescription | string | No | Short contact description |

### Request

```json
{
  "phone": "5511999999999",
  "contactName": "Z-API Contato",
  "contactPhone": "554498398733"
}
```

---

## 8. Send Location

**POST** `/send-location`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| title | string | Yes | Location title |
| address | string | Yes | Full address (street, number, neighborhood, city, state, zip) |
| latitude | string | Yes | Latitude coordinate |
| longitude | string | Yes | Longitude coordinate |
| messageId | string | No | Reply to specific message |
| delayMessage | number | No | Delay 1-15 seconds |

### Request

```json
{
  "phone": "5511999998888",
  "title": "Google Brasil",
  "address": "Av. Brg. Faria Lima, 3477 - Itaim Bibi, Sao Paulo - SP, 04538-133",
  "latitude": "-23.0696347",
  "longitude": "-50.4357913"
}
```

---

## 9. Send Link

**POST** `/send-link`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| message | string | Yes | Text with link URL at the end |
| image | string | Yes | Preview image URL |
| linkUrl | string | Yes | URL to share |
| title | string | Yes | Link title |
| linkDescription | string | Yes | Link description |
| messageId | string | No | Reply to specific message |
| delayMessage | number | No | Delay 1-15 seconds |

### Request

```json
{
  "phone": "5511999998888",
  "message": "Text with link at end: https://z-api.io",
  "image": "https://firebasestorage.googleapis.com/v0/b/zaap-messenger-web.appspot.com/o/logo.png?alt=media",
  "linkUrl": "https://z-api.io",
  "title": "Z-API",
  "linkDescription": "Integracao com o whatsapp"
}
```

### Notes
- Links are only clickable if the recipient has your number saved or initiated conversation with you.

---

## 10. Send Button List

**POST** `/send-button-list`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| message | string | Yes | Message text |
| buttonList | object | Yes | Container for buttons |
| buttonList.buttons | array | Yes | Array of button objects |
| buttons[].label | string | Yes | Button display text |
| buttons[].id | string | No | Button identifier |
| delayMessage | number | No | Delay 1-15 seconds |

### Request

```json
{
  "phone": "5511999999999",
  "message": "Z-API e Bom?",
  "buttonList": {
    "buttons": [
      {"id": "1", "label": "Otimo"},
      {"id": "2", "label": "Excelente"}
    ]
  }
}
```

---

## 11. Send Option List

**POST** `/send-option-list`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| message | string | Yes | Message text |
| optionList | object | Yes | List configuration |
| optionList.title | string | Yes | List title |
| optionList.buttonLabel | string | Yes | Button text to open list |
| optionList.options | array | Yes | Array of option objects |
| options[].id | string | Yes | Option identifier |
| options[].title | string | Yes | Option title |
| options[].description | string | Yes | Option description |
| delayMessage | number | No | Delay 1-15 seconds |

### Request

```json
{
  "phone": "5511999999999",
  "message": "Selecione a melhor opcao:",
  "optionList": {
    "title": "Opcoes disponiveis",
    "buttonLabel": "Abrir lista de opcoes",
    "options": [
      {
        "id": "1",
        "title": "Z-API",
        "description": "Z-API Asas para sua imaginacao"
      },
      {
        "id": "2",
        "title": "Outros",
        "description": "Nao funcionam"
      }
    ]
  }
}
```

### Notes
- Option lists no longer work in groups (WhatsApp discontinued the feature for group chats).

---

## 12. Send Poll

**POST** `/send-poll`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| message | string | Yes | Poll question text |
| poll | array | Yes | Array of `{ name: string }` options |
| pollMaxOptions | number | No | Maximum votes per person |
| delayMessage | number | No | Delay 1-15 seconds |

### Request (Multiple Choice)

```json
{
  "phone": "5511999999999",
  "message": "What is the best API for WhatsApp?",
  "poll": [
    {"name": "Z-API"},
    {"name": "Others"}
  ]
}
```

### Request (Single Choice)

```json
{
  "phone": "5511999999999",
  "message": "What is the best API for WhatsApp?",
  "pollMaxOptions": 1,
  "poll": [
    {"name": "Z-API"},
    {"name": "Others"}
  ]
}
```

---

## 13. Send Reaction

**POST** `/send-reaction`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Chat recipient or group ID |
| reaction | string | Yes | Emoji character |
| messageId | string | Yes | ID of message to react to |
| delayMessage | number | No | Delay 1-15 seconds |

### Request

```json
{
  "phone": "5511999999999",
  "reaction": "heart_emoji",
  "messageId": "message-id-to-react-to"
}
```

---

## 14. Read Message

**POST** `/read-message`

Marks a message as read.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| messageId | string | Yes | Message identifier to mark as read |

### Request

```json
{
  "phone": "5511999998888",
  "messageId": "3999984263738042930CD6ECDE9VDWSA"
}
```

### Response

**204 No Content** - Success (empty body)

---

## 15. Delete Message

**DELETE** `/messages`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messageId | string | Yes | Message identifier |
| phone | string | Yes | Recipient phone number |
| owner | boolean | Yes | `true` if you sent it, `false` for incoming |

### Request

```
DELETE /messages?messageId=123&phone=5511999998888&owner=true
```

### Response

**204 No Content** - Success

---

## 16. Forward Message

**POST** `/forward-message`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Destination phone number |
| messageId | string | Yes | ID of message to forward |
| messagePhone | string | Yes | Phone of chat containing original message |
| delayMessage | number | No | Delay 1-15 seconds |

### Request

```json
{
  "phone": "5511999999999",
  "messageId": "3999984263738042930CD6ECDE9VDWSA",
  "messagePhone": "5511888888888"
}
```

### Notes
- Webhook must be configured for forwarding to function.

---

## 17. Send Catalog

**POST** `/send-catalog`

WhatsApp Business accounts only.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| catalogPhone | string | Yes | Business account phone owning the catalog |
| translation | string | No | Language (`EN` or `PT`) |
| message | string | No | Text accompanying catalog card |
| title | string | No | Catalog card title |
| catalogDescription | string | No | Catalog card description |

### Request

```json
{
  "phone": "5511999999999",
  "catalogPhone": "5511999999999",
  "translation": "EN",
  "message": "Access this link to view our catalog on WhatsApp:",
  "title": "See the product catalog on WhatsApp.",
  "catalogDescription": "Learn more about this company's products and services."
}
```

---

## 18. Send Order

**POST** `/send-order`

WhatsApp Business accounts only. Mirrors "Accept order" / "Send billing" functionality.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| order | object | Yes | Order details |
| order.currency | string | Yes | Currency code (e.g., `BRL`) |
| order.products | array | Yes | Array of product objects |
| order.products[].name | string | Yes | Product name |
| order.products[].value | number | Yes | Product price |
| order.products[].quantity | number | Yes | Item quantity |
| order.products[].productId | string | No | Catalog product identifier |
| order.discount | number | No | Discount amount |
| order.tax | number | No | Tax amount |
| order.shipping | number | No | Shipping cost |
| pix | object | No | PIX key configuration |
| card | object | No | Card payment enablement |

### Request

```json
{
  "phone": "554499999999",
  "order": {
    "currency": "BRL",
    "products": [{
      "name": "Product Name",
      "value": 150,
      "quantity": 1
    }]
  }
}
```

---

## 19. Send Event Response

**POST** `/send-event-response`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Recipient/group ID |
| eventResponse | string | Yes | `GOING` or `NOT_GOING` |
| eventMessageId | string | Yes | Original event message ID |

### Request

```json
{
  "phone": "120363019502650977-group",
  "eventMessageId": "D2D612289D9E8F62307D72409A8D9DC3",
  "eventResponse": "GOING"
}
```

### Notes
- Cannot respond to events you created (your response is always set as `GOING`).

---

## Additional Message Endpoints (from sidebar, ~48 total)

The Z-API messages section includes approximately 48 endpoints. Beyond the ones documented above, the sidebar lists:

- Send PIX message
- Send status/stories
- Send newsletter messages
- Send product messages
- Get message by ID
- Pin/unpin messages
- Star messages
- Send GIF
- Send event
- And others

Refer to https://developer.z-api.io/en/message/introduction for the full list.
