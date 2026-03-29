# n8n Core Nodes Reference

> HTTP Request, Code, and other core nodes

---

## HTTP Request Node

Node: `n8n-nodes-base.httprequest`

### Overview

Sends HTTP/HTTPS requests to external APIs and services. The most versatile node for integrating with any REST API.

### HTTP Methods

- **GET** - Retrieve data
- **POST** - Create data
- **PUT** - Replace data
- **PATCH** - Partial update
- **DELETE** - Remove data
- **HEAD** - Headers only
- **OPTIONS** - CORS/capabilities

### Authentication Methods

| Method | Description |
|--------|-------------|
| **None** | No authentication |
| **Predefined Credential Type** | Use n8n's built-in credential types (e.g., Slack OAuth2, GitHub API) |
| **Generic Credential Type** | Configure custom authentication: |
| - Basic Auth | Username/password in Authorization header |
| - Header Auth | Custom header with token |
| - Query Auth | Token as query parameter |
| - OAuth1 | Full OAuth1 flow |
| - OAuth2 | Full OAuth2 flow (Authorization Code, Client Credentials) |
| - Digest Auth | HTTP Digest authentication |
| - Custom Auth | Custom certificate-based auth |

### Request Configuration

#### URL
- Full URL of the API endpoint
- Supports expressions: `https://api.example.com/users/{{ $json.userId }}`

#### Send Query Parameters
Add query string parameters as key-value pairs.

#### Send Headers
Add custom headers as key-value pairs. Common headers:
- `Content-Type`
- `Authorization`
- `Accept`

#### Send Body
Body content types:
| Type | Description |
|------|-------------|
| **JSON** | Send JSON body (most common) |
| **Form-Data Multipart** | For file uploads |
| **Form URL-Encoded** | Standard form submission |
| **Raw** | Raw text/XML/other |
| **n8n Binary File** | Send a binary file from previous node |

### Response Options

| Option | Description |
|--------|-------------|
| **Response Format** | `JSON` (auto-parse), `Text`, `File` (binary) |
| **Full Response** | Include status code, headers, and body (not just body) |
| **Never Error** | Don't throw on HTTP error status codes (4xx, 5xx) |
| **Ignore SSL Issues** | Skip SSL certificate validation |

### Pagination

Three pagination modes:

#### Off
No pagination (default).

#### Update a Parameter in Each Request
Use when API expects page number or offset:
- Parameters to update (e.g., `page` or `offset`)
- Pagination complete when: response is empty, or a specific condition is met
- Max pages limit

#### Response Contains Next URL
Use when API response includes URL for next page:
- Expression to extract next URL from response (e.g., `{{ $response.body.next }}`)
- Pagination complete when: next URL is empty

### Proxy Configuration
- HTTP proxy URL
- Useful for corporate networks or debugging

### SSL Certificates
- CA Certificate
- Client Certificate
- Client Key
- Passphrase

### Timeout
- Request timeout in milliseconds (default: 300000 = 5 minutes)

### Batching
- Process items in batches
- Configure batch size and interval

### Redirects
- Follow redirects (default: true)
- Max redirects (default: 21)

---

## Code Node

Node: `n8n-nodes-base.code`

### Overview

Write custom JavaScript or Python code to process data within a workflow. Two execution modes available.

### Languages

| Language | Support Level |
|----------|--------------|
| **JavaScript** | Full support with all n8n built-in methods |
| **Python** | Supported with limited built-in methods |

### Execution Modes

#### Run Once for All Items (default)
- Code executes once, receives all input items
- Access items via `$input.all()` (JS) or `_input.all()` (Python)
- Must return an array of items

```javascript
// JavaScript example
const items = $input.all();
const results = items.map(item => ({
  json: {
    name: item.json.name.toUpperCase(),
    processed: true
  }
}));
return results;
```

```python
# Python example
items = _input.all()
results = []
for item in items:
    results.append({
        "json": {
            "name": item.json["name"].upper(),
            "processed": True
        }
    })
return results
```

#### Run Once for Each Item
- Code executes once per input item
- Access current item via `$input.item` (JS) or `_input.item` (Python)
- Must return a single item

```javascript
// JavaScript example
const item = $input.item;
return {
  json: {
    ...item.json,
    processed: true
  }
};
```

### Built-in Variables (JavaScript)

| Variable | Description |
|----------|-------------|
| `$input` | Current node input data |
| `$input.all()` | All input items (array) |
| `$input.first()` | First input item |
| `$input.last()` | Last input item |
| `$input.item` | Current item (each-item mode) |
| `$json` | Shorthand for current item's JSON data |
| `$binary` | Current item's binary data |
| `$node["NodeName"]` | Access another node's data |
| `$("NodeName").all()` | All items from a specific node |
| `$("NodeName").first()` | First item from a specific node |
| `$workflow` | Workflow metadata |
| `$workflow.id` | Workflow ID |
| `$workflow.name` | Workflow name |
| `$workflow.active` | Whether workflow is active |
| `$execution` | Current execution metadata |
| `$execution.id` | Execution ID |
| `$execution.mode` | Execution mode (manual/trigger) |
| `$execution.resumeUrl` | URL to resume waiting execution |
| `$env` | Environment variables (if not blocked) |
| `$vars` | n8n variables |
| `$runIndex` | Current run index |
| `$itemIndex` | Current item index (each-item mode) |
| `$prevNode` | Previous node metadata |
| `$parameter` | Current node parameters |
| `$today` | Current date (luxon DateTime) |
| `$now` | Current date/time (luxon DateTime) |
| `$jmespath()` | JMESPath query function |
| `$if()` | Conditional expression |
| `$ifEmpty()` | Default value if empty |
| `$min()` / `$max()` | Min/max of values |

### Built-in Variables (Python)

| Variable | Description |
|----------|-------------|
| `_input` | Current node input data |
| `_input.all()` | All input items |
| `_input.first()` | First input item |
| `_input.item` | Current item (each-item mode) |
| `_workflow` | Workflow metadata |
| `_execution` | Execution metadata |
| `_env` | Environment variables |

Note: Python has limited built-in method support compared to JavaScript.

### Available Node.js Modules

By default, the Code node can use:
- Standard JavaScript built-ins
- `luxon` (DateTime handling)
- `$helpers` for various utilities

To allow additional Node.js built-in modules:
```
NODE_FUNCTION_ALLOW_BUILTIN=crypto,fs,path
```

To allow external npm packages installed in n8n:
```
NODE_FUNCTION_ALLOW_EXTERNAL=lodash,axios
```

### Item Format

Items must follow this structure:
```javascript
{
  json: {
    // Your data here
    key: "value"
  },
  binary: {
    // Optional binary data
    data: {
      data: "base64string",
      mimeType: "image/png",
      fileName: "file.png"
    }
  }
}
```

### Common Patterns

#### Transform data
```javascript
return $input.all().map(item => ({
  json: {
    fullName: `${item.json.firstName} ${item.json.lastName}`,
    email: item.json.email.toLowerCase()
  }
}));
```

#### Filter items
```javascript
return $input.all().filter(item => item.json.status === 'active');
```

#### Aggregate data
```javascript
const items = $input.all();
const total = items.reduce((sum, item) => sum + item.json.amount, 0);
return [{ json: { total, count: items.length } }];
```

#### Create new items from arrays
```javascript
const items = $input.first();
return items.json.users.map(user => ({ json: user }));
```

#### HTTP request in Code node
```javascript
const response = await fetch('https://api.example.com/data');
const data = await response.json();
return [{ json: data }];
```

#### Error handling
```javascript
try {
  // Your logic here
  return [{ json: { success: true } }];
} catch (error) {
  if ($input.context.noItemsLeft) {
    return [];
  }
  throw error;
}
```

### Environment Variables for Code Node

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_PYTHON_ENABLED` | `true` | Enable Python in Code node |
| `NODE_FUNCTION_ALLOW_BUILTIN` | (none) | Comma-separated Node.js built-in modules to allow |
| `NODE_FUNCTION_ALLOW_EXTERNAL` | (none) | External npm packages to allow |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | `false` | Block `$env` access in Code node |
| `CODE_ENABLE_STDOUT` | `false` | Send console.log output to stdout |

---

## Other Core Nodes

### Schedule Trigger
- Triggers workflows on a schedule (cron-like)
- Supports intervals: seconds, minutes, hours, days, weeks, months
- Custom cron expressions supported

### Manual Trigger
- Triggers workflow manually from the editor
- Used for testing

### Error Trigger
- Triggers when another workflow fails
- Receives error details and failed workflow info

### Execute Workflow
- Calls another workflow as a sub-workflow
- Passes data between workflows
- Supports wait for completion or fire-and-forget

### IF / Switch
- Conditional branching
- IF: true/false branches
- Switch: multiple output branches based on value matching

### Merge
- Combine data from multiple branches
- Modes: Append, Keep Key Matches, Remove Key Matches, Merge By Index, Merge By Key, Multiplex, Choose Branch

### Set
- Set/modify item fields
- Add new fields, rename fields, remove fields
- Supports expressions

### Function / Function Item (Legacy)
- Predecessor to Code node
- Still supported but Code node is preferred

### Split In Batches
- Process items in configurable batch sizes
- Useful for rate-limited APIs

### Wait
- Pause workflow execution
- Resume on webhook call or after time period

### No Operation (NoOp)
- Does nothing, passes data through
- Useful for workflow organization

### Sticky Note
- Documentation within workflows
- No data processing

### Execute Command
- Run shell commands on the n8n server
- Disabled by default for security (`NODES_EXCLUDE`)

### Read/Write Binary File
- Read files from disk or write binary data to files
- Supports file paths on the n8n server

### Compression
- Compress/decompress files
- Supports ZIP and GZIP formats

### Crypto
- Hash, encrypt, decrypt data
- Supports MD5, SHA256, AES, etc.

### Date & Time
- Parse, format, manipulate dates
- Uses Luxon library

### XML
- Convert between JSON and XML

### HTML
- Extract data from HTML using CSS selectors
- Generate HTML from templates

### Markdown
- Convert between Markdown and HTML

### RSS Feed Read
- Parse RSS/Atom feeds
