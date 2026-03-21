# n8n Public REST API Reference

> Source: OpenAPI spec from `n8n-io/n8n` repository (v1.1.1)
> Base URL: `{your-n8n-instance}/api/v1`

## Authentication

All API requests require an API key passed via header:

```
X-N8N-API-KEY: your-api-key
```

Generate API keys in: **Settings > API > Create API Key**

---

## Pagination

All list endpoints support cursor-based pagination:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max items per page (default varies) |
| `cursor` | string | Cursor from previous response for next page |

---

## 1. Workflow Endpoints

### POST /workflows
**Create a workflow**

Create a workflow in your instance.

- **Request Body**: Workflow object (JSON)
- **Response 200**: Created workflow object
- **Response 400**: Bad request
- **Response 401**: Unauthorized

### GET /workflows
**Retrieve all workflows**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `active` | boolean | No | Filter by active status |
| `tags` | string | No | Comma-separated tag names (e.g., `test,production`) |
| `name` | string | No | Filter by workflow name |
| `projectId` | string | No | Filter by project ID |
| `excludePinnedData` | boolean | No | Avoid retrieving pinned data |
| `limit` | number | No | Pagination limit |
| `cursor` | string | No | Pagination cursor |

- **Response 200**: Paginated workflow list
- **Response 401**: Unauthorized

### GET /workflows/{id}
**Retrieve a workflow**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Workflow ID |
| `excludePinnedData` | boolean (query) | No | Avoid retrieving pinned data |

- **Response 200**: Workflow object
- **Response 401**: Unauthorized
- **Response 404**: Not found

### PUT /workflows/{id}
**Update a workflow**

If the workflow is published, the updated version will be automatically re-published.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Workflow ID |

- **Request Body**: Updated workflow object (JSON)
- **Response 200**: Updated workflow object
- **Response 400/401/404**: Error

### DELETE /workflows/{id}
**Delete a workflow**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Workflow ID |

- **Response 200**: Deleted workflow object
- **Response 401/404**: Error

### GET /workflows/{id}/{versionId}
**Retrieve a specific version of a workflow**

Retrieves a specific version from workflow history.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Workflow ID |
| `versionId` | string (path) | Yes | Version ID (e.g., `abc123-def456-ghi789`) |

- **Response 200**: Workflow version object
- **Response 401/404**: Error

### POST /workflows/{id}/activate
**Publish (activate) a workflow**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Workflow ID |

Optional request body:
```json
{
  "versionId": "string",    // Specific version to activate
  "name": "string",         // Optional version name
  "description": "string"   // Optional version description
}
```

- **Response 200**: Activated workflow object
- **Response 400/401/404**: Error

### POST /workflows/{id}/deactivate
**Deactivate a workflow**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Workflow ID |

- **Response 200**: Deactivated workflow object
- **Response 401/404**: Error

### PUT /workflows/{id}/transfer
**Transfer a workflow to another project**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Workflow ID |

Request body:
```json
{
  "destinationProjectId": "string"  // Required
}
```

- **Response 200**: Success
- **Response 400/401/404**: Error

### GET /workflows/{id}/tags
**Get workflow tags**

- **Response 200**: List of tags

### PUT /workflows/{id}/tags
**Update tags of a workflow**

Request body: Array of tag IDs
```json
[{ "id": "tag-id-1" }, { "id": "tag-id-2" }]
```

- **Response 200**: Updated list of tags
- **Response 400/401/404**: Error

---

## 2. Execution Endpoints

### GET /executions
**Retrieve all executions**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeData` | boolean | No | Include execution data in response |
| `status` | string | No | Filter by status: `canceled`, `crashed`, `error`, `new`, `running`, `success`, `unknown`, `waiting` |
| `workflowId` | string | No | Filter by workflow ID |
| `projectId` | string | No | Filter by project ID |
| `limit` | number | No | Pagination limit |
| `cursor` | string | No | Pagination cursor |

- **Response 200**: Paginated execution list
- **Response 401/404**: Error

### GET /executions/{id}
**Retrieve an execution**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Execution ID |
| `includeData` | boolean (query) | No | Include execution data |

- **Response 200**: Execution object
- **Response 401/404**: Error

### DELETE /executions/{id}
**Delete an execution**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Execution ID |

- **Response 200**: Deleted execution object
- **Response 401/404**: Error

### POST /executions/{id}/retry
**Retry an execution**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Execution ID |

Optional request body:
```json
{
  "loadWorkflow": true  // Use latest workflow version instead of saved version
}
```

- **Response 200**: Retried execution object
- **Response 401/404/409**: Error (409 = conflict, e.g., already running)

### POST /executions/{id}/stop
**Stop an execution**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Execution ID |

- **Response 200**: Stopped execution object
- **Response 401/404**: Error

### POST /executions/stop
**Stop multiple executions**

Request body:
```json
{
  "status": ["queued", "running", "waiting"],  // Required. At least one status.
  "workflowId": "2tUt1wbLX592XDdX",           // Optional
  "startedAfter": "2024-01-01T00:00:00.000Z",  // Optional
  "startedBefore": "2024-12-31T23:59:59.999Z"  // Optional
}
```

- **Response 200**: `{ "stopped": 5 }` (count of stopped executions)
- **Response 400/401**: Error

### GET /executions/{id}/tags
**Get execution annotation tags**

- **Response 200**: List of annotation tags

### PUT /executions/{id}/tags
**Update annotation tags of an execution**

Request body: Array of tag IDs

- **Response 200**: Updated list of tags
- **Response 400/401/404**: Error

---

## 3. Credential Endpoints

### GET /credentials
**List credentials**

Only available for the instance owner and admin. Credential data (secrets) is not included.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Pagination limit |
| `cursor` | string | No | Pagination cursor |

- **Response 200**: Paginated credential list
- **Response 401**: Unauthorized

### POST /credentials
**Create a credential**

Creates a credential that can be used by nodes of the specified type.

Request body:
```json
{
  "name": "My API Key",
  "type": "httpHeaderAuth",
  "data": {
    "name": "X-API-KEY",
    "value": "my-secret-key"
  }
}
```

- **Response 200**: Created credential object (without secrets)
- **Response 400/401/415**: Error

### PATCH /credentials/{id}
**Update credential by ID**

You must be the owner of the credential.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Credential ID |

Request body: Credential fields to update (all fields optional).

- **Response 200**: Updated credential object
- **Response 400/401/404**: Error

### DELETE /credentials/{id}
**Delete credential by ID**

You must be the owner of the credentials.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | Credential ID |

- **Response 200**: Deleted credential object
- **Response 401/404**: Error

### GET /credentials/schema/{credentialTypeName}
**Show credential data schema**

Returns the JSON schema for a credential type.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `credentialTypeName` | string (path) | Yes | Credential type name |

Example response for `freshdeskApi`:
```json
{
  "additionalProperties": false,
  "type": "object",
  "properties": {
    "apiKey": { "type": "string" },
    "domain": { "type": "string" }
  },
  "required": ["apiKey", "domain"]
}
```

- **Response 200**: JSON Schema object
- **Response 401/404**: Error

### PUT /credentials/{id}/transfer
**Transfer a credential to another project**

Request body:
```json
{
  "destinationProjectId": "string"  // Required
}
```

- **Response 200**: Success
- **Response 400/401/404**: Error

---

## 4. Tag Endpoints

### POST /tags
**Create a tag**

Request body:
```json
{
  "name": "production"
}
```

- **Response 201**: Created tag object
- **Response 400/401/409**: Error (409 = name conflict)

### GET /tags
**Retrieve all tags**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Pagination limit |
| `cursor` | string | No | Pagination cursor |

- **Response 200**: Paginated tag list

### GET /tags/{id}
**Retrieve a tag**

- **Response 200**: Tag object
- **Response 401/404**: Error

### PUT /tags/{id}
**Update a tag**

Request body:
```json
{
  "name": "updated-tag-name"
}
```

- **Response 200**: Updated tag object
- **Response 400/401/404/409**: Error

### DELETE /tags/{id}
**Delete a tag**

- **Response 200**: Deleted tag object
- **Response 401/403/404**: Error

---

## 5. User Endpoints

### GET /users
**Retrieve all users**

Only available for the instance owner.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeRole` | boolean | No | Include user role in response |
| `projectId` | string | No | Filter by project ID |
| `limit` | number | No | Pagination limit |
| `cursor` | string | No | Pagination cursor |

- **Response 200**: Paginated user list
- **Response 401**: Unauthorized

### POST /users
**Create multiple users**

Request body:
```json
[
  {
    "email": "user@example.com",
    "role": "global:member"
  }
]
```

Response includes invite URLs:
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "inviteAcceptUrl": "string",
    "emailSent": true
  },
  "error": "string"
}
```

- **Response 200**: Created user(s)
- **Response 401/403**: Error

### GET /users/{id}
**Get user by ID or Email**

Only available for the instance owner.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (path) | Yes | User ID or email |
| `includeRole` | boolean (query) | No | Include role |

- **Response 200**: User object
- **Response 401**: Unauthorized

### DELETE /users/{id}
**Delete a user**

- **Response 204**: Success (no content)
- **Response 401/403/404**: Error

### PATCH /users/{id}/role
**Change a user's global role**

Request body:
```json
{
  "newRoleName": "global:member"
}
```

- **Response 200**: Success
- **Response 401/403/404**: Error

---

## 6. Variable Endpoints

### POST /variables
**Create a variable**

Request body: Variable object with `key` and `value`.

- **Response 201**: Created
- **Response 400/401**: Error

### GET /variables
**Retrieve variables**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | No | Filter by project ID |
| `state` | string | No | Filter by state (e.g., `empty`) |
| `limit` | number | No | Pagination limit |
| `cursor` | string | No | Pagination cursor |

- **Response 200**: Paginated variable list
- **Response 401**: Unauthorized

### PUT /variables/{id}
**Update a variable**

- **Response 204**: Success
- **Response 400/401/403/404**: Error

### DELETE /variables/{id}
**Delete a variable**

- **Response 204**: Success
- **Response 401/404**: Error

---

## 7. Project Endpoints

### POST /projects
**Create a project**

Request body: Project object with `name`.

- **Response 201**: Created
- **Response 400/401**: Error

### GET /projects
**Retrieve projects**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Pagination limit |
| `cursor` | string | No | Pagination cursor |

- **Response 200**: Paginated project list

### PUT /projects/{projectId}
**Update a project**

- **Response 204**: Success
- **Response 400/401/403/404**: Error

### DELETE /projects/{projectId}
**Delete a project**

- **Response 204**: Success
- **Response 401/403/404**: Error

### GET /projects/{projectId}/users
**List project members**

Returns all members including their role. Requires `user:list` scope.

- **Response 200**: Paginated member list with roles

### POST /projects/{projectId}/users
**Add users to a project**

Request body:
```json
{
  "relations": [
    {
      "userId": "91765f0d-3b29-45df-adb9-35b23937eb92",
      "role": "project:viewer"
    }
  ]
}
```

- **Response 201**: Success
- **Response 401/403/404**: Error

### DELETE /projects/{projectId}/users/{userId}
**Remove a user from a project**

- **Response 204**: Success
- **Response 401/403/404**: Error

### PATCH /projects/{projectId}/users/{userId}
**Change a user's role in a project**

Request body:
```json
{
  "role": "project:viewer"
}
```

Available roles: `project:viewer`, `project:editor`, `project:admin`

- **Response 204**: Success
- **Response 401/403/404**: Error

---

## 8. Audit Endpoint

### POST /audit
**Generate a security audit**

Optional request body:
```json
{
  "additionalOptions": {
    "daysAbandonedWorkflow": 90,
    "categories": ["credentials", "database", "nodes", "filesystem", "instance"]
  }
}
```

- **Response 200**: Audit report
- **Response 401/500**: Error

---

## 9. Source Control Endpoint

### POST /source-control/pull
**Pull changes from remote repository**

Requires the Source Control feature to be licensed and connected to a repository.

Request body: Pull options object.

- **Response 200**: Import result
- **Response 400/409**: Error

---

## 10. Data Table Endpoints

### GET /data-tables
**List all data tables**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filter` | string (JSON) | No | Filter conditions, e.g. `{"name":"my-table"}` |
| `sortBy` | string | No | Sort format: `field:asc` or `field:desc` |
| `limit` | number | No | Pagination limit |
| `cursor` | string | No | Pagination cursor |

- **Response 200**: Paginated data table list

### POST /data-tables
**Create a new data table**

Request body:
```json
{
  "name": "customers",
  "columns": [
    { "name": "email", "type": "string" },
    { "name": "status", "type": "string" },
    { "name": "age", "type": "number" }
  ]
}
```

- **Response 201**: Created data table
- **Response 400/401/409**: Error

### GET /data-tables/{dataTableId}
**Get a data table**

- **Response 200**: Data table object
- **Response 401/404**: Error

### PATCH /data-tables/{dataTableId}
**Update a data table**

Request body:
```json
{
  "name": "updated-customers"
}
```

- **Response 200**: Updated data table
- **Response 400/401/404/409**: Error

### DELETE /data-tables/{dataTableId}
**Delete a data table**

Deletes the table and all its rows.

- **Response 204**: Success
- **Response 401/404**: Error

### GET /data-tables/{dataTableId}/rows
**Retrieve rows from a data table**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filter` | string (JSON) | No | Filter conditions (see below) |
| `sortBy` | string | No | `columnName:asc` or `columnName:desc` |
| `search` | string | No | Search text across all string columns |
| `limit` | number | No | Pagination limit |
| `cursor` | string | No | Pagination cursor |

Filter format:
```json
{
  "type": "and",
  "filters": [
    { "columnName": "status", "condition": "eq", "value": "active" }
  ]
}
```

- **Response 200**: Paginated row list

### POST /data-tables/{dataTableId}/rows
**Insert rows into a data table**

Request body:
```json
{
  "data": [
    { "name": "John Doe", "email": "john@example.com", "age": 30 },
    { "name": "Jane Smith", "email": "jane@example.com", "age": 25 }
  ],
  "returnType": "all"  // "count" | "id" | "all"
}
```

Response varies by `returnType`:
- `count`: `{ "count": 2 }`
- `id`: `[1, 2]`
- `all`: Array of full row objects

### PATCH /data-tables/{dataTableId}/rows/update
**Update rows matching filter**

Request body:
```json
{
  "filter": {
    "type": "and",
    "filters": [
      { "columnName": "status", "condition": "eq", "value": "pending" }
    ]
  },
  "data": {
    "status": "completed",
    "updatedBy": "admin"
  },
  "returnData": false,
  "dryRun": false
}
```

- **Response 200**: `true` (when returnData=false) or array of updated rows

### POST /data-tables/{dataTableId}/rows/upsert
**Upsert a row**

Update existing or insert new if no match found.

Request body:
```json
{
  "filter": {
    "type": "and",
    "filters": [
      { "columnName": "email", "condition": "eq", "value": "user@example.com" }
    ]
  },
  "data": {
    "email": "user@example.com",
    "name": "Updated Name",
    "status": "active"
  },
  "returnData": true,
  "dryRun": false
}
```

### DELETE /data-tables/{dataTableId}/rows/delete
**Delete rows matching filter**

Filter is required to prevent accidental deletion of all data.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filter` | string (JSON, query) | Yes | Filter conditions |
| `returnData` | boolean (query) | No | Return deleted rows (default: false) |
| `dryRun` | boolean (query) | No | Preview without deleting (default: false) |

---

## 11. Discover Endpoint

### GET /discover
**Discover available API capabilities**

Returns a filtered capability map based on the caller's API key scopes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `include` | string | No | `schemas` to inline request body schemas |
| `resource` | string | No | Filter to specific resource (e.g., `workflow`) |
| `operation` | string | No | Filter by operation (e.g., `read`, `create`, `list`) |

Response:
```json
{
  "data": {
    "scopes": ["workflow:read", "workflow:create"],
    "resources": {
      "workflow": {
        "operations": ["read", "create", "list"],
        "endpoints": [
          {
            "method": "GET",
            "path": "/workflows",
            "operationId": "getWorkflows",
            "requestSchema": {}
          }
        ]
      }
    },
    "filters": {
      "resource": {
        "description": "...",
        "values": ["workflow", "credential", "execution"]
      }
    },
    "specUrl": "/api/v1/openapi.yml"
  }
}
```

---

## Error Response Format

All error responses follow this structure:

```json
{
  "code": 404,
  "message": "The requested resource was not found"
}
```

Common HTTP status codes:
- **400**: Bad Request - invalid input
- **401**: Unauthorized - missing or invalid API key
- **403**: Forbidden - insufficient permissions
- **404**: Not Found - resource does not exist
- **409**: Conflict - resource already exists or state conflict
- **415**: Unsupported Media Type
- **500**: Internal Server Error

---

## Endpoint Summary Table

| Method | Path | Description | Tag |
|--------|------|-------------|-----|
| POST | /workflows | Create workflow | Workflow |
| GET | /workflows | List workflows | Workflow |
| GET | /workflows/{id} | Get workflow | Workflow |
| PUT | /workflows/{id} | Update workflow | Workflow |
| DELETE | /workflows/{id} | Delete workflow | Workflow |
| GET | /workflows/{id}/{versionId} | Get workflow version | Workflow |
| POST | /workflows/{id}/activate | Publish workflow | Workflow |
| POST | /workflows/{id}/deactivate | Deactivate workflow | Workflow |
| PUT | /workflows/{id}/transfer | Transfer workflow | Workflow |
| GET | /workflows/{id}/tags | Get workflow tags | Workflow |
| PUT | /workflows/{id}/tags | Update workflow tags | Workflow |
| GET | /executions | List executions | Execution |
| GET | /executions/{id} | Get execution | Execution |
| DELETE | /executions/{id} | Delete execution | Execution |
| POST | /executions/{id}/retry | Retry execution | Execution |
| POST | /executions/{id}/stop | Stop execution | Execution |
| POST | /executions/stop | Stop multiple executions | Execution |
| GET | /executions/{id}/tags | Get execution tags | Execution |
| PUT | /executions/{id}/tags | Update execution tags | Execution |
| GET | /credentials | List credentials | Credential |
| POST | /credentials | Create credential | Credential |
| PATCH | /credentials/{id} | Update credential | Credential |
| DELETE | /credentials/{id} | Delete credential | Credential |
| GET | /credentials/schema/{type} | Get credential schema | Credential |
| PUT | /credentials/{id}/transfer | Transfer credential | Credential |
| POST | /tags | Create tag | Tags |
| GET | /tags | List tags | Tags |
| GET | /tags/{id} | Get tag | Tags |
| PUT | /tags/{id} | Update tag | Tags |
| DELETE | /tags/{id} | Delete tag | Tags |
| GET | /users | List users | User |
| POST | /users | Create users | User |
| GET | /users/{id} | Get user | User |
| DELETE | /users/{id} | Delete user | User |
| PATCH | /users/{id}/role | Change user role | User |
| POST | /variables | Create variable | Variables |
| GET | /variables | List variables | Variables |
| PUT | /variables/{id} | Update variable | Variables |
| DELETE | /variables/{id} | Delete variable | Variables |
| POST | /projects | Create project | Projects |
| GET | /projects | List projects | Projects |
| PUT | /projects/{projectId} | Update project | Projects |
| DELETE | /projects/{projectId} | Delete project | Projects |
| GET | /projects/{projectId}/users | List project members | Projects |
| POST | /projects/{projectId}/users | Add users to project | Projects |
| DELETE | /projects/{projectId}/users/{userId} | Remove user from project | Projects |
| PATCH | /projects/{projectId}/users/{userId} | Change user role in project | Projects |
| POST | /audit | Generate security audit | Audit |
| POST | /source-control/pull | Pull from remote | SourceControl |
| GET | /data-tables | List data tables | DataTable |
| POST | /data-tables | Create data table | DataTable |
| GET | /data-tables/{id} | Get data table | DataTable |
| PATCH | /data-tables/{id} | Update data table | DataTable |
| DELETE | /data-tables/{id} | Delete data table | DataTable |
| GET | /data-tables/{id}/rows | Get rows | DataTable |
| POST | /data-tables/{id}/rows | Insert rows | DataTable |
| PATCH | /data-tables/{id}/rows/update | Update rows | DataTable |
| POST | /data-tables/{id}/rows/upsert | Upsert row | DataTable |
| DELETE | /data-tables/{id}/rows/delete | Delete rows | DataTable |
| GET | /discover | Discover API capabilities | Discover |
