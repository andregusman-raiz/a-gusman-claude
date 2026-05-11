# n8n Webhook Node Reference

> Source: n8n official documentation and community guides
> Node: `n8n-nodes-base.webhook`

## Overview

The Webhook node creates an HTTP endpoint that triggers a workflow when called. It is a trigger node (starts workflows) and supports both test and production webhook URLs.

---

## Webhook URLs

n8n provides two types of webhook URLs:

### Test URL
- Format: `{N8N_URL}/webhook-test/{path}`
- Active only when workflow is in test/development mode
- Responds only when you click "Listen for Test Event" or "Execute Workflow"
- Use during development

### Production URL
- Format: `{N8N_URL}/webhook/{path}`
- Active only when workflow is published (activated)
- Always listening for incoming requests
- Use in production integrations

The webhook path is configurable. Default is a UUID, but you can set a custom path.

---

## Configuration Parameters

### Webhook URLs
| Parameter | Description |
|-----------|-------------|
| Path | The URL path for the webhook (e.g., `my-webhook` produces `/webhook/my-webhook`) |

### HTTP Method
Supported methods:
- **GET** - Retrieve data
- **POST** - Send data (most common for webhooks)
- **PUT** - Replace data
- **PATCH** - Partial update
- **DELETE** - Remove data
- **HEAD** - Headers only
- **OPTIONS** - CORS preflight

### Authentication

| Method | Description |
|--------|-------------|
| **None** | No authentication required (not recommended for production) |
| **Basic Auth** | Username and password sent with each request (Base64 encoded in `Authorization` header) |
| **Header Auth** | Static token in a custom header (e.g., `X-API-Key: secret-token`) |
| **JWT Auth** | Validates a signed JSON Web Token and its claims |

### Response Mode

Controls when and what the webhook returns to the caller:

| Mode | Description |
|------|-------------|
| **Immediately** | Returns immediately with `{ "message": "Workflow got started" }` and the configured response code |
| **When Last Node Finishes** | Waits for workflow to complete, returns the output of the last executed node |
| **Using 'Respond to Webhook' Node** | Full control over response using a separate Respond to Webhook node in the workflow |

### Response Options (When Last Node Finishes)

| Option | Description |
|--------|-------------|
| **First Entry JSON** | Returns JSON data of the first entry from the last node |
| **First Entry Binary** | Returns binary data of the first entry as a file download |
| **No Response Body** | Returns status code only, no body |
| **All Entries** | Returns all entries from the last node |

### Response Code

Customize the HTTP status code returned on success:
- 200 (OK) - default
- 201 (Created)
- 202 (Accepted)
- 204 (No Content)
- Custom code (any valid HTTP status)

### Response Headers

Add custom headers to the webhook response.

### Response Data

Options to configure what data is included in the response:
- Property name of JSON response
- Response content type

---

## Options

| Option | Description |
|--------|-------------|
| **Binary Property** | Name of the binary property to return |
| **Ignore Bots** | Ignore requests from known bots/crawlers |
| **IP(s) Whitelist** | Comma-separated list of allowed IP addresses |
| **No Response Body** | Do not send any response body |
| **Raw Body** | Include raw request body alongside parsed body |
| **Response Content-Type** | Override the response content type |
| **Response Data** | Send custom response data |
| **Response Headers** | Additional response headers |
| **Allowed Origins (CORS)** | Set Access-Control-Allow-Origin for cross-origin requests |

---

## Output Data

The webhook node outputs:

```json
{
  "headers": {
    "host": "example.com",
    "content-type": "application/json"
  },
  "params": {},
  "query": {
    "key": "value"
  },
  "body": {
    // POST body data
  },
  "webhookUrl": "https://your-n8n.com/webhook/path",
  "executionMode": "production"
}
```

---

## Common Patterns

### Simple POST webhook with JSON response
1. Set HTTP Method to POST
2. Set Response Mode to "When Last Node Finishes"
3. Connect processing nodes
4. Last node's output becomes the response

### Webhook with authentication
1. Set Authentication to Header Auth
2. Create credential with header name (e.g., `X-API-Key`) and value
3. Requests without valid header get 401

### Webhook with custom response via Respond to Webhook node
1. Set Response Mode to "Using 'Respond to Webhook' Node"
2. Add processing nodes
3. Add "Respond to Webhook" node where needed
4. Configure exact response body, headers, and status code

### CORS-enabled webhook (for browser calls)
1. Set Allowed Origins to `*` or specific domain
2. n8n automatically handles OPTIONS preflight requests

---

## Respond to Webhook Node

Used in conjunction with Webhook node when Response Mode is "Using 'Respond to Webhook' Node".

### Parameters

| Parameter | Description |
|-----------|-------------|
| **Respond With** | `First Entry JSON`, `First Entry Binary`, `No Data`, `Redirect`, `Text` |
| **Response Code** | HTTP status code |
| **Response Headers** | Custom headers |
| **Response Body** | Custom JSON body |

### Use Cases
- Return different responses based on conditions (use IF node)
- Send response before workflow completes
- Multiple response paths in a single workflow
- Custom error responses

---

## Environment Variables for Webhooks

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_ENDPOINT_WEBHOOK` | `webhook` | Production webhook path prefix |
| `N8N_ENDPOINT_WEBHOOK_TEST` | `webhook-test` | Test webhook path prefix |
| `N8N_ENDPOINT_WEBHOOK_WAIT` | `webhook-waiting` | Waiting webhook path prefix |
| `WEBHOOK_URL` | (auto) | Override webhook URL (useful behind proxy) |

---

## Common Issues

### Webhook not receiving requests
- Ensure workflow is **published** (activated) for production URLs
- For test URLs, ensure you clicked "Listen for Test Event"
- Check firewall rules allow incoming connections on the n8n port
- If behind a reverse proxy, set `WEBHOOK_URL` environment variable

### 404 errors
- Check the webhook path matches exactly (case-sensitive)
- Verify the HTTP method matches

### Timeout
- Default timeout is the workflow execution timeout
- For long-running workflows, use "Immediately" response mode

### Binary data not returning
- Set Response Mode to "When Last Node Finishes"
- Set Response Data to "First Entry Binary"
- Ensure the last node outputs binary data
