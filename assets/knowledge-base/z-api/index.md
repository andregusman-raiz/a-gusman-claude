# Z-API Documentation Index

> Official docs: https://developer.z-api.io/en/
> Base API URL: `https://api.z-api.io/instances/{INSTANCE_ID}/token/{TOKEN}/{endpoint}`

## Quick Reference

### Authentication
- Instance ID + Token embedded in URL path
- `Client-Token` header required on all requests
- IP restriction available (whitelist)
- 2FA for dashboard access

### Common Headers
```
Client-Token: YOUR_ACCOUNT_SECURITY_TOKEN
Content-Type: application/json
```

### Phone Number Format
Always DDI + DDD + NUMBER, digits only. Example: `551199999999`

### Group ID Format (post Nov 2021)
`120363019502650977-group` (alphanumeric + `-group` suffix)

---

## Local Documentation Files

| File | Contents |
|------|----------|
| [messages.md](messages.md) | 19 message endpoints (text, image, document, audio, video, sticker, contact, location, link, buttons, options list, poll, reaction, read, delete, forward, catalog, order, event response) |
| [groups.md](groups.md) | 10 group endpoints (create, fetch, update name/photo, add/remove/reject participants, leave, invitation link, accept invite) |
| [instance.md](instance.md) | 6 instance endpoints (QR code, status, restart, disconnect, rename, instance data/me) |
| [webhooks.md](webhooks.md) | 6 webhook types (delivery, received, message status, disconnected, connected, chat presence) + bulk update |
| [security.md](security.md) | 4 security features (ID/Token, Client-Token, IP restriction, 2FA) |
| [contacts.md](contacts.md) | 7 contact endpoints (get, metadata, profile picture, add, remove, block/unblock, report) |
| [business.md](business.md) | 30 business endpoints index (products, collections, labels, profile management) |
| [chats.md](chats.md) | Chats + Queue endpoints |

---

## Full Documentation Sitemap

### Sections available at developer.z-api.io/en/

1. **Quick Start** - Introduction
2. **Tips** - Blocks/bans, LID, emulators, Z-API vs Official API, button status, file expiration, Postman collection
3. **Security** - ID/Token, IP restriction, 2FA, Client-Token
4. **Instance** - ~15 endpoints (connection, QR, profile, auto-read, calls)
5. **Mobile** - ~18 endpoints (mobile-specific APIs, security codes)
6. **Messages** - ~48 endpoints (all message types, status, PIN, GIF, PIX, etc.)
7. **Privacy** - Privacy settings
8. **Contacts** - ~8 endpoints
9. **Chats** - Chat management
10. **Calls** - Call management
11. **Groups** - ~15 endpoints
12. **Communities** - Community management
13. **Meta AI** - AI integration
14. **Newsletter** - Channel/newsletter management
15. **Transmission list** - Broadcast lists
16. **Status** - WhatsApp status/stories
17. **Message queue** - Queue management
18. **WhatsApp Business** - ~30 endpoints (products, catalogs, collections, labels, profile)
19. **Webhooks** - ~8 webhook types + configuration
20. **Partners** - Partner APIs
21. **Integrators** - Integrator APIs
