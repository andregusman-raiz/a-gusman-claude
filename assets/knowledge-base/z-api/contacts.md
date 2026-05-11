# Z-API Contacts API Reference

> Base URL: `https://api.z-api.io/instances/{YOUR_INSTANCE}/token/{YOUR_TOKEN}`

## Authentication

All endpoints require the `Client-Token` header.

---

## 1. Get Contacts

**GET** `/contacts?page={page}&pageSize={pageSize}`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | Yes | Pagination offset |
| pageSize | integer | Yes | Results per page |

### Response (200)

```json
[{
  "name": "First and Last name",
  "short": "First name",
  "notify": "WhatsApp display name",
  "vname": "vCard name",
  "phone": "559999999999"
}]
```

| Field | Type | Description |
|-------|------|-------------|
| phone | string | Contact phone number |
| name | string | Full name (only if saved in contacts) |
| short | string | First name (only if saved) |
| vname | string | vCard name |
| notify | string | WhatsApp display name |

---

## 2. Get Contact Metadata

**GET** `/contacts/{phone}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Phone number (DDI DDD NUMBER, no formatting) |

### Response (200)

```json
{
  "name": "Contact's first and last name",
  "phone": "551199999999",
  "notify": "Contact's name on WhatsApp",
  "short": "Contact's name",
  "imgUrl": "Contact's photo URL",
  "about": "Contact's about status"
}
```

| Field | Type | Description |
|-------|------|-------------|
| phone | string | Contact's phone number |
| name | string | Full name (only if in contacts) |
| short | string | First name (only if in contacts) |
| vname | string | Contact name from contacts list |
| notify | string | WhatsApp profile name |
| imgUrl | string | Photo URL (WhatsApp deletes after 48 hours) |
| about | string | Profile status message |

---

## 3. Get Contact Profile Picture

**GET** `/profile-picture?phone={phone}`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Phone number (digits only) |

### Response (200)

```json
{
  "link": "URL with the contact's picture"
}
```

### Notes
- Image URL is only available for 48 hours, then deleted by WhatsApp
- For persistent storage, re-fetch regularly

---

## 4. Add Contacts

**POST** `/contacts/add`

Saves WhatsApp contacts to your device's contact list.

### Request Body

Array of contact objects:

```json
[
  {
    "firstName": "contact 1",
    "lastName": "name 2",
    "phone": "554499999999"
  },
  {
    "firstName": "contact 2",
    "lastName": "name 2",
    "phone": "554499998888"
  }
]
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| firstName | string | Yes | Contact's first name |
| phone | string | Yes | Contact's phone number |
| lastName | string | No | Contact's last name |

### Response (200)

```json
{
  "success": true,
  "errors": []
}
```

### Notes
- Requires WhatsApp account update and proper contact permissions on device

---

## 5. Remove Contacts

**DELETE** `/contacts/remove`

### Request Body

Array of phone numbers:

```json
[
  "554499999999",
  "554499998888"
]
```

### Response (200)

```json
{
  "success": true,
  "errors": []
}
```

### Notes
- Only works for accounts that have received the necessary WhatsApp update

---

## 6. Block / Unblock Contact

**POST** `/contacts/modify-blocked`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | integer | Yes | Phone number to block/unblock |
| action | string | Yes | `"block"` or `"unblock"` |

### Request

```json
{
  "phone": "5544999999999",
  "action": "block"
}
```

### Response (200)

```json
{
  "value": true
}
```

---

## 7. Report Contact

**POST** `/contacts/{phone}/report`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Phone number to report |

### Response (200)

```json
{
  "success": true
}
```

### Error Response (400)

```json
{
  "error": "Invalid phone"
}
```

---

## Additional Contact Endpoints (from sidebar)

- Number validation (WhatsApp check)
- Batch validate numbers

Refer to https://developer.z-api.io/en/contacts/get-contacts for the full navigation.
