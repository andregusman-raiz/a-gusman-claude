# Z-API WhatsApp Business API Reference

> Base URL: `https://api.z-api.io/instances/{YOUR_INSTANCE}/token/{YOUR_TOKEN}`

## Authentication

All endpoints require the `Client-Token` header.

**Note:** Most business endpoints require a WhatsApp Business account.

---

## 1. Get Business Profile

**GET** `/business/profile?phone={phone}`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Business account phone (DDI DDD NUMBER, e.g., 5511999999999) |

### Response (200)

| Field | Type | Description |
|-------|------|-------------|
| description | string | Company description |
| address | string | Company address |
| email | string | Company email |
| websites | array[string] | Company websites |
| categories | array[object] | Business categories (displayName, label, id) |
| businessHours | object | Operating hours (timezone, days, mode) |
| hasCoverPhoto | boolean | Cover photo presence |

### Business Hours Structure

```json
{
  "timezone": "America/Sao_Paulo",
  "mode": "specific_hours",
  "days": [
    {
      "dayOfWeek": "MONDAY",
      "openTime": "09:00",
      "closeTime": "18:00"
    }
  ]
}
```

---

## Complete Business Endpoints List (from sidebar)

The Z-API Business section includes approximately 30 endpoints:

### Products & Catalog

| # | Endpoint | Description |
|---|----------|-------------|
| 1 | Create/edit product | Add or modify catalog products |
| 2 | Get products | Retrieve product catalogs |
| 3 | Get Products (Phone) | Access catalogs from specific business numbers |
| 4 | Get product (ID) | Fetch individual product by identifier |
| 5 | Deleting a product | Remove products |
| 6 | Catalog Configuration | Set up product catalogs |

### Collections

| # | Endpoint | Description |
|---|----------|-------------|
| 7 | Create Collection | Organize products into groups |
| 8 | List Collections | View product groupings |
| 9 | Delete Collection | Remove product groups |
| 10 | Edit Collection | Modify product groups |
| 11 | List Collection Products | View items within groups |
| 12 | Add Products to Collection | Include items in groups |
| 13 | Remove Products from Collection | Exclude items from groups |

### Labels/Tags

| # | Endpoint | Description |
|---|----------|-------------|
| 14 | Search for labels | Find existing tags/labels |
| 15 | Tags colors | Access label color options |
| 16 | Create new tag | Generate custom labels |
| 17 | Edit tag | Modify existing labels |
| 18 | Delete tag | Remove labels |
| 19 | Assigning labels to a chat | Apply tags to conversations |
| 20 | Removing labels from a chat | Detach tags from conversations |
| 21 | Assign Notes to a Chat | Add notes to chat threads |

### Profile Management

| # | Endpoint | Description |
|---|----------|-------------|
| 22 | Change Company Description | Update business profile text |
| 23 | Change Company Email | Modify contact email |
| 24 | Change Company Address | Update location information |
| 25 | Change Company Websites | Modify web links |
| 26 | Change Business Hours | Set operating hours |
| 27 | List Categories | View available business categories |
| 28 | Assign Categories | Set business category classifications |
| 29 | Get business account data | Retrieve full account information |

Refer to https://developer.z-api.io/en/business/introduction for detailed endpoint documentation.
