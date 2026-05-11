# Z-API Groups API Reference

> Base URL: `https://api.z-api.io/instances/{YOUR_INSTANCE}/token/{YOUR_TOKEN}`

## Authentication

All endpoints require the `Client-Token` header with your Account Security Token.

---

## 1. Create Group

**POST** `/create-group`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| autoInvite | boolean | Yes | Send group invitation link privately to members who couldn't be added |
| groupName | string | Yes | Name of group to create |
| phones | array[string] | Yes | Phone numbers to add |

### Request

```json
{
  "autoInvite": true,
  "groupName": "Z-API group",
  "phones": ["5544999999999", "5544888888888"]
}
```

### Response (200)

```json
{
  "phone": "120363019502650977-group",
  "invitationLink": "https://chat.whatsapp.com/GONwbGGDkLe8BifUWwLgct"
}
```

### Notes
- At least one contact is required to create a group
- Image cannot be added during creation; use `update-group-photo` afterward
- `autoInvite` sends private invitations to members who couldn't be added directly

---

## 2. Fetch Groups

**GET** `/groups?page={page}&pageSize={pageSize}`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | Yes | Page number for pagination |
| pageSize | integer | Yes | Number of groups per page |

### Response (200)

```json
[{
  "isGroup": true,
  "name": "Test Group",
  "phone": "120263358412332916-group",
  "unread": "0",
  "lastMessageTime": "1730918668000",
  "isMuted": "0",
  "isMarkedSpam": "false",
  "archived": "false",
  "pinned": "false",
  "muteEndTime": null
}]
```

| Attribute | Type | Description |
|-----------|------|-------------|
| isGroup | boolean | Indicates if entry is a group |
| name | string | Group name |
| phone | string | Group identifier |
| unread | string | Unread message count |
| lastMessageTime | string | Last interaction timestamp (Unix) |
| isMuted | string | Mute status (0 or 1) |
| isMarkedSpam | boolean | Spam classification |
| archived | boolean | Archive status |
| pinned | boolean | Pin status |
| muteEndTime | string | Notification reactivation timestamp |

---

## 3. Update Group Name

**POST** `/update-group-name`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | string | Yes | Group identifier |
| groupName | string | Yes | New group name |

### Request

```json
{
  "groupId": "120363019502650977-group",
  "groupName": "Changed the name of My group in Z-API"
}
```

### Response (200)

```json
{
  "value": true
}
```

---

## 4. Update Group Photo

**POST** `/update-group-photo`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | string | Yes | Group identifier |
| groupPhoto | string | Yes | Image URL or Base64-encoded data |

### Request

```json
{
  "groupId": "120363019502650977-group",
  "groupPhoto": "https://www.z-api.io/wp-content/themes/z-api/dist/images/logo.svg"
}
```

### Response (200)

```json
{
  "value": true
}
```

---

## 5. Add Participants

**POST** `/add-participant`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| autoInvite | boolean | Yes | Send private invitations for members not added directly |
| groupId | string | Yes | Group identifier |
| phones | array[string] | Yes | Phone numbers to add |

### Request

```json
{
  "autoInvite": true,
  "groupId": "120363019502650977-group",
  "phones": ["5544999999999", "5544888888888"]
}
```

### Response (200)

```json
{
  "value": true
}
```

### Notes
- WhatsApp validates if phone numbers have saved contacts
- `autoInvite` sends private invitations to participants not successfully added

---

## 6. Remove Participants

**POST** `/remove-participant`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | string | Yes | Group identifier |
| phones | array[string] | Yes | Phone numbers to remove |

### Request

```json
{
  "groupId": "120363019502650977-group",
  "phones": ["5544999999999", "5544888888888"]
}
```

### Response (200)

```json
{
  "value": true
}
```

---

## 7. Reject Participant

**POST** `/reject-participant`

Rejects participant entry into the group.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | string | Yes | Group identifier |
| phones | array[string] | Yes | Phone numbers to reject |

### Request

```json
{
  "groupId": "120363019502650977-group",
  "phones": ["5544999999999", "5544888888888"]
}
```

### Response (200)

```json
{
  "value": true
}
```

---

## 8. Leave Group

**POST** `/leave-group`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | string | Yes | Group identifier |

### Request

```json
{
  "groupId": "120363019502650977-group"
}
```

### Response (200)

```json
{
  "value": true
}
```

---

## 9. Get Invitation Link

**GET** `/group-invitation-link/{groupId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | string | Yes | Group identifier |

### Response (200)

```json
{
  "phone": "120363019502650977-group",
  "invitationLink": "https://chat.whatsapp.com/C1adgkdEGki7554BWDdMkd"
}
```

---

## 10. Accept Group Invite

**GET** `/accept-invite-group?url={INVITATION_URL}`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The group invitation link URL |

### Example

```
GET /accept-invite-group?url=https://chat.whatsapp.com/bh8XyNrIUj84YZoy5xcaa112
```

### Response (200)

```json
{
  "success": true
}
```

---

## Group ID Format

WhatsApp modified group ID formatting on November 4, 2021.

- **Legacy format**: `5511999999999-1623281429` (phone-timestamp)
- **Current format**: `120363019502650977-group` (alphanumeric-group)

Always use the current format for new integrations.

---

## Additional Group Endpoints (from sidebar)

- Approve Participants
- Mentioning members
- Promote/Remove admin
- Group metadata
- Group settings
- Redefine invitation link

Refer to https://developer.z-api.io/en/group/create-group for the full navigation.
