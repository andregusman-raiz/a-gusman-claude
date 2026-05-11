# Z-API Instance Management API Reference

> Base URL: `https://api.z-api.io/instances/{YOUR_INSTANCE}/token/{YOUR_TOKEN}`

## Overview

An instance is a connection with a phone number that has a WhatsApp account. It is responsible for sending and receiving messages. Users can create multiple instances to manage several WhatsApp numbers through a single account.

Key facts:
- Instances are virtual machines within AWS Brasil infrastructure
- Instances are NOT permanently tied to phone numbers (disconnect one, connect another)
- Z-API is built on WhatsApp Web, exposing methods through RESTful APIs
- Each new instance triggers FlyBots for Stack Z-API deployment in AWS Brasil

## Authentication

All endpoints require the `Client-Token` header.

---

## 1. Get QR Code

### QR Code Bytes

**GET** `/qr-code`

Returns QR code in byte format for rendering in compatible components.

### QR Code Image

**GET** `/qr-code/image`

Returns Base64-encoded image format.

### Phone Code Authentication

**GET** `/phone-code/{phone}`

Returns a code enabling phone number connection without QR scanning.

### Important Notes
- WhatsApp invalidates QR codes every 20 seconds
- Implementation should poll every 10-20 seconds for fresh codes
- After 3 unsuccessful attempts, pause and request user interaction
- Cannot reconnect if instance is already active

---

## 2. Instance Status

**GET** `/status`

### Response (200)

| Attribute | Type | Description |
|-----------|------|-------------|
| connected | boolean | Whether number is actively connected to Z-API |
| smartphoneConnected | boolean | Whether phone has internet connectivity |
| error | string | Error details when issues occur |

### Possible Error Messages

- `"You are already connected."`
- `"You need to restore the session."`
- `"You are not connected."`

### Recommendations
- Configure webhooks for real-time status notifications
- Disable battery optimization on connected devices (including emulators)

---

## 3. Restart Instance

**GET** `/restart`

Resets the instance (like CTRL+ALT+DEL for the connection).

### Response (200)

```json
{
  "value": true
}
```

### Notes
- Does NOT require reading QR code again after restart

---

## 4. Disconnect

**GET** `/disconnect`

Severs the connection between your WhatsApp number and Z-API.

### Notes
- After disconnection, all API methods become unavailable
- Webhook notifications stop
- Reconnection requires scanning a QR code again

---

## 5. Rename Instance

**PUT** `/update-name`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| value | string | Yes | New display name for the instance |

### Request

```json
{
  "value": "novo nome"
}
```

### Response (200)

```json
{
  "value": true
}
```

---

## 6. Instance Data (Me)

**GET** `/me`

Returns comprehensive configuration and operational data about the instance.

### Response (200)

| Attribute | Type | Description |
|-----------|------|-------------|
| id | string | Unique instance identifier |
| token | string | Authentication token |
| name | string | Display name |
| due | number | Expiration timestamp (Unix) |
| connected | boolean | Connection status |
| paymentStatus | string | Subscription payment state |
| created | Date | Instance creation timestamp |
| connectedCallbackUrl | string | Webhook URL for connection events |
| deliveryCallbackUrl | string | Webhook URL for delivery confirmations |
| disconnectedCallbackUrl | string | Webhook URL for disconnection events |
| messageStatusCallbackUrl | string | Webhook URL for message status updates |
| presenceChatCallbackUrl | string | Webhook URL for chat presence |
| receivedCallbackUrl | string | Webhook URL for incoming messages |
| receiveCallbackSentByMe | boolean | Include self-sent messages in webhooks |
| callRejectAuto | boolean | Auto-reject incoming calls |
| callRejectMessage | string | Message sent during auto-rejected calls |
| autoReadMessage | boolean | Auto-mark messages as read |
| initialDataCallbackUrl | string | Webhook URL for post-connection data |

---

## Additional Instance Endpoints (from sidebar)

The sidebar lists 14 instance-related endpoints:

1. Introduction
2. Auto-reading
3. Auto-reading status
4. Update profile picture
5. Update profile name
6. Update profile description
7. Rejecting calls
8. Call message
9. Get QRCode
10. Restarting instance
11. Disconnect
12. Instance status
13. Cell phone data
14. Renaming the instance
15. Instance data (me)

Refer to https://developer.z-api.io/en/instance/introduction for the full list.
