# n8n Workflow Patterns & Examples

> Common workflow patterns, best practices, and reusable templates

---

## 1. Webhook-to-API Pattern

Receive external data via webhook, process it, and send to another API.

```
[Webhook] → [Set/Transform] → [HTTP Request] → [Respond to Webhook]
```

### Example: Receive form submission, create contact in CRM
```
Webhook (POST /form-submit)
  → Set (extract name, email)
  → HTTP Request (POST to CRM API)
  → Respond to Webhook (200 OK)
```

### Key Config:
- Webhook Response Mode: "Using Respond to Webhook Node"
- HTTP Request: POST with JSON body using expressions
- Error handling: Add Error Trigger workflow for failures

---

## 2. Polling Pattern

Periodically check an API for new data and process changes.

```
[Schedule Trigger] → [HTTP Request] → [IF (new data?)] → [Process] → [Update State]
```

### Example: Poll API every 5 minutes for new orders
```
Schedule Trigger (every 5 min)
  → HTTP Request (GET /api/orders?since=lastCheck)
  → IF (items.length > 0)
    → true: Split In Batches → Process each order
    → false: No Operation
```

### Key Config:
- Use n8n Variables or static data to track last check timestamp
- Split In Batches for rate-limited downstream APIs
- Add error handling per batch

---

## 3. ETL (Extract, Transform, Load) Pattern

Extract data from source, transform it, load into destination.

```
[Trigger] → [Extract (HTTP/DB)] → [Transform (Code/Set)] → [Load (HTTP/DB)]
```

### Example: Sync contacts between CRM and database
```
Schedule Trigger (daily)
  → HTTP Request (GET all contacts from CRM)
  → Code (transform fields, deduplicate)
  → Split In Batches (batch of 50)
    → Postgres (UPSERT into contacts table)
```

### Key Config:
- Code node for complex transformations
- Split In Batches to avoid overwhelming the database
- Use UPSERT to handle both new and existing records

---

## 4. Error Handling Pattern

Catch errors and send notifications.

```
[Main Workflow] ←error→ [Error Trigger] → [Slack/Email notification]
```

### Setup:
1. Create a separate "Error Handler" workflow
2. In the Error Handler: Error Trigger → Slack/Email
3. In main workflow Settings: set Error Workflow to the handler

### Error Trigger output contains:
```json
{
  "execution": {
    "id": "123",
    "url": "https://n8n.example.com/execution/123",
    "error": {
      "message": "Error message",
      "node": { "name": "HTTP Request", "type": "..." }
    }
  },
  "workflow": {
    "id": "456",
    "name": "My Workflow"
  }
}
```

### Alternative: Try/Catch with Error Output
Some nodes have an "Error Output" that lets you handle errors within the same workflow:
```
HTTP Request
  → success output → Continue processing
  → error output → Log error → Respond with error
```

---

## 5. Fan-Out / Fan-In Pattern

Process items in parallel branches, then merge results.

```
[Trigger] → [Split] → [Branch A] ↘
                      → [Branch B] → [Merge] → [Output]
                      → [Branch C] ↗
```

### Example: Enrich contact data from multiple sources
```
Webhook (receive contact)
  → Set (extract email)
  → Branch to:
    → HTTP Request (Clearbit API) ↘
    → HTTP Request (Hunter API)  → Merge (by key: email) → Respond
    → HTTP Request (LinkedIn API) ↗
```

### Key Config:
- Merge node in "Merge By Key" mode
- All branches must complete before merge
- Handle partial failures (some APIs may fail)

---

## 6. Retry Pattern

Retry failed operations with backoff.

```
[Trigger] → [HTTP Request (with retry)] → [Process]
```

### Built-in Retry:
- n8n nodes have built-in retry on error
- Configure in node Settings: "Retry On Fail"
- Set max retries and wait between retries

### Manual Retry with Loop:
```
Set (attempt=0, maxRetries=3)
  → Loop:
    → HTTP Request
    → IF (success OR attempt >= maxRetries)
      → true: Exit loop
      → false: Wait (exponential backoff) → Increment attempt → Loop back
```

---

## 7. Batch Processing Pattern

Process large datasets in manageable chunks.

```
[Trigger] → [Get All Data] → [Split In Batches] → [Process Batch] → [Loop back]
```

### Example: Update 10,000 records in batches of 100
```
Manual Trigger
  → Postgres (SELECT * FROM users WHERE needs_update = true)
  → Split In Batches (batch size: 100)
    → HTTP Request (POST batch to API)
    → Wait (1 second, rate limiting)
  → Set (result: "Complete")
```

### Key Config:
- Split In Batches with appropriate batch size
- Wait node between batches for rate limiting
- Track progress with execution data

---

## 8. Conditional Routing Pattern

Route items to different processing paths based on conditions.

```
[Trigger] → [Switch] → [Path A: High Priority]
                      → [Path B: Medium Priority]
                      → [Path C: Low Priority]
                      → [Fallback]
```

### Example: Route support tickets by priority
```
Webhook (new ticket)
  → Switch (on: priority field)
    → "high": Slack (alert channel) + Jira (create P1)
    → "medium": Email (support team) + Jira (create P2)
    → "low": Jira (create P3)
    → fallback: Log to database
```

### IF vs Switch:
- **IF**: Two paths (true/false)
- **Switch**: Multiple paths based on value matching or rules

---

## 9. Data Deduplication Pattern

Prevent processing duplicate items.

```
[Trigger] → [Code (check seen IDs)] → [IF (new?)] → [Process] → [Store ID]
```

### Using n8n Database:
```
Webhook (receive event)
  → Postgres (SELECT id WHERE external_id = event.id)
  → IF (no rows returned)
    → true: Process event → Postgres (INSERT external_id)
    → false: Respond (already processed)
```

### Using Redis:
```
Webhook
  → Code:
    const key = `processed:${$json.eventId}`;
    const exists = await $helpers.redis.get(key);
    if (exists) return []; // Skip
    await $helpers.redis.set(key, '1', 'EX', 86400); // 24h TTL
    return [$input.item];
  → Process event
```

---

## 10. Scheduled Report Pattern

Generate and send periodic reports.

```
[Schedule] → [Query Data] → [Aggregate] → [Format] → [Send]
```

### Example: Daily sales report via email
```
Schedule Trigger (every day at 8:00 AM)
  → Postgres (SELECT sales from today)
  → Code (calculate totals, averages, top products)
  → HTML (generate report template)
  → Email Send (to: managers@company.com)
```

---

## 11. Webhook Proxy Pattern

Receive webhook from Service A, transform, forward to Service B.

```
[Webhook] → [Transform] → [HTTP Request to Service B] → [Respond]
```

### Example: GitHub webhook to Slack
```
Webhook (POST /github-events)
  → Switch (on: headers.x-github-event)
    → "push": Code (format push message) → Slack
    → "pull_request": Code (format PR message) → Slack
    → "issues": Code (format issue message) → Slack
  → Respond to Webhook (200)
```

---

## 12. Sub-Workflow Pattern

Break complex workflows into reusable sub-workflows.

```
[Main Workflow] → [Execute Workflow (sub)] → [Continue]
```

### Benefits:
- Reusable logic across workflows
- Easier testing and debugging
- Cleaner workflow canvas
- Independent error handling

### Config:
- Execute Workflow node: select the sub-workflow
- Pass data via "Workflow Input"
- Sub-workflow uses "Execute Workflow Trigger" as trigger
- Control: wait for completion or fire-and-forget

### Security:
- `N8N_WORKFLOW_CALLER_POLICY_DEFAULT_OPTION` controls which workflows can call others:
  - `workflowsFromSameOwner` (default)
  - `workflowsFromAList`
  - `any`
  - `none`

---

## 13. Human-in-the-Loop Pattern

Pause workflow, wait for human approval, then continue.

```
[Trigger] → [Process] → [Wait] → [Human Action] → [Continue]
```

### Using Wait Node:
```
Webhook (new request)
  → Process request
  → Slack (send approval message with buttons)
  → Wait (for webhook resume)
  → IF (approved?)
    → true: Execute action
    → false: Send rejection notice
```

### Key: The Wait node provides a `$execution.resumeUrl` that can be called to continue the workflow.

---

## 14. API Gateway Pattern

n8n as a lightweight API gateway.

```
[Webhook GET /users] → [Auth Check] → [Database Query] → [Respond]
[Webhook POST /users] → [Auth Check] → [Validate] → [Database Insert] → [Respond]
```

### Example:
```
Webhook (GET /api/products, Header Auth)
  → Postgres (SELECT * FROM products)
  → Code (format response, pagination)
  → Respond to Webhook (200, JSON)
```

---

## 15. Event-Driven Pattern

React to events from external systems.

```
[Trigger Node] → [Filter] → [Process] → [Notify]
```

### Common Trigger Nodes:
- Webhook (HTTP events)
- Email Trigger (IMAP - new emails)
- Schedule Trigger (time-based)
- Postgres Trigger (database changes)
- Redis Trigger (pub/sub)
- MQTT Trigger (IoT)
- Kafka Trigger (streaming)

---

## Best Practices

### Error Handling
1. Always set an Error Workflow for production workflows
2. Use "Continue On Fail" for non-critical operations
3. Add logging nodes for debugging
4. Use Sentry or similar for error tracking

### Performance
1. Use Split In Batches for large datasets
2. Add Wait nodes for rate-limited APIs
3. Use queue mode for high-throughput scenarios
4. Minimize data passed between nodes (use Set to trim)

### Security
1. Always use authentication on webhooks in production
2. Validate input data before processing
3. Use environment variables for secrets
4. Restrict file and env access in Code nodes

### Organization
1. Use Sticky Notes to document workflow sections
2. Name nodes descriptively
3. Use tags to categorize workflows
4. Break complex workflows into sub-workflows
5. Version control with Source Control feature

### Testing
1. Use test webhook URLs during development
2. Pin test data on nodes for consistent testing
3. Test error paths explicitly
4. Use Manual Trigger for testing sub-workflows
