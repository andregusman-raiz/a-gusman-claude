# n8n Self-Hosting Reference

> Complete guide for self-hosting n8n: installation, configuration, environment variables

---

## Installation Methods

### Docker (Recommended)

#### Quick Start
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

#### Docker Compose (Production)
```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.example.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - N8N_EDITOR_BASE_URL=https://n8n.example.com
      - WEBHOOK_URL=https://n8n.example.com/
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      - N8N_ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  postgres_data:
```

#### Docker with Traefik (SSL)
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_data:/letsencrypt
    command:
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.email=admin@example.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.myresolver.acme.httpchallenge.entrypoint=web"

  n8n:
    image: n8nio/n8n
    restart: always
    environment:
      - N8N_HOST=n8n.example.com
      - N8N_PROTOCOL=https
      - N8N_EDITOR_BASE_URL=https://n8n.example.com
      - WEBHOOK_URL=https://n8n.example.com/
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.n8n.rule=Host(`n8n.example.com`)"
      - "traefik.http.routers.n8n.tls=true"
      - "traefik.http.routers.n8n.tls.certresolver=myresolver"
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
  traefik_data:
```

### npm

```bash
# Prerequisites: Node.js 18+
npm install n8n -g

# Start
n8n start

# Start with tunnel (development)
n8n start --tunnel
```

### npx (Quick Test)
```bash
npx n8n
```

---

## Database Configuration

### SQLite (Default)
- No configuration needed
- Data stored in `~/.n8n/database.sqlite`
- Good for small installations
- Not recommended for production with high load

### PostgreSQL (Recommended for Production)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_TYPE` | `sqlite` | Set to `postgresdb` |
| `DB_POSTGRESDB_DATABASE` | `n8n` | Database name |
| `DB_POSTGRESDB_HOST` | `localhost` | PostgreSQL host |
| `DB_POSTGRESDB_PORT` | `5432` | PostgreSQL port |
| `DB_POSTGRESDB_USER` | `postgres` | Database user |
| `DB_POSTGRESDB_PASSWORD` | (none) | Database password |
| `DB_POSTGRESDB_SCHEMA` | `public` | Schema name |
| `DB_POSTGRESDB_POOL_SIZE` | `2` | Connection pool size |
| `DB_POSTGRESDB_CONNECTION_TIMEOUT` | `20000` | Connection timeout (ms) |
| `DB_POSTGRESDB_IDLE_CONNECTION_TIMEOUT` | `30000` | Idle timeout (ms) |
| `DB_TABLE_PREFIX` | (none) | Prefix for table names |
| `DB_PING_INTERVAL_SECONDS` | `2` | Health check interval |

### PostgreSQL SSL

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_POSTGRESDB_SSL_ENABLED` | `false` | Enable SSL |
| `DB_POSTGRESDB_SSL_CA` | (none) | CA file path |
| `DB_POSTGRESDB_SSL_CERT` | (none) | Certificate file |
| `DB_POSTGRESDB_SSL_KEY` | (none) | Key file |
| `DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED` | `true` | Reject unauthorized |

### SQLite Options

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_SQLITE_POOL_SIZE` | `0` | 0=rollback journal, >0=WAL mode |
| `DB_SQLITE_VACUUM_ON_STARTUP` | `false` | VACUUM on startup |

### Database Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_LOGGING_ENABLED` | `false` | Enable DB logging |
| `DB_LOGGING_OPTIONS` | `error` | Log level |
| `DB_LOGGING_MAX_EXECUTION_TIME` | `1000` | Slow query threshold (ms) |

---

## Complete Environment Variables Reference

### Deployment

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_HOST` | `localhost` | Host name |
| `N8N_PORT` | `5678` | HTTP port |
| `N8N_LISTEN_ADDRESS` | `::` | Bind address |
| `N8N_PROTOCOL` | `http` | Protocol (http/https) |
| `N8N_SSL_KEY` | (none) | SSL key file path |
| `N8N_SSL_CERT` | (none) | SSL cert file path |
| `N8N_EDITOR_BASE_URL` | (none) | Public URL for editor |
| `N8N_PATH` | `/` | Base path |
| `N8N_DISABLE_UI` | `false` | Disable web UI |
| `N8N_PREVIEW_MODE` | `false` | Demo mode |
| `N8N_USER_FOLDER` | `user-folder` | Path for .n8n dir |
| `N8N_ENCRYPTION_KEY` | auto-generated | Encryption key for credentials |
| `N8N_GRACEFUL_SHUTDOWN_TIMEOUT` | `30` | Shutdown timeout (seconds) |
| `N8N_PROXY_HOPS` | `0` | Reverse proxy count |
| `GENERIC_TIMEZONE` | `America/New_York` | Timezone for schedules |

### Proxy

| Variable | Description |
|----------|-------------|
| `HTTP_PROXY` | Proxy for HTTP requests |
| `HTTPS_PROXY` | Proxy for HTTPS requests |
| `ALL_PROXY` | Proxy for all requests |
| `NO_PROXY` | Comma-separated bypass hosts |

### Execution

| Variable | Default | Description |
|----------|---------|-------------|
| `EXECUTIONS_MODE` | `regular` | `regular` or `queue` |
| `EXECUTIONS_TIMEOUT` | `-1` | Default timeout (seconds, -1=unlimited) |
| `EXECUTIONS_TIMEOUT_MAX` | `3600` | Max timeout users can set |
| `N8N_AI_TIMEOUT_MAX` | `3600000` | AI/LLM node timeout (ms) |
| `N8N_CONCURRENCY_PRODUCTION_LIMIT` | `-1` | Max concurrent executions |

### Execution Data

| Variable | Default | Description |
|----------|---------|-------------|
| `EXECUTIONS_DATA_SAVE_ON_ERROR` | `all` | Save on error |
| `EXECUTIONS_DATA_SAVE_ON_SUCCESS` | `all` | Save on success |
| `EXECUTIONS_DATA_SAVE_ON_PROGRESS` | `false` | Save after each node |
| `EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS` | `true` | Save manual executions |

### Execution Pruning

| Variable | Default | Description |
|----------|---------|-------------|
| `EXECUTIONS_DATA_PRUNE` | `true` | Enable auto-deletion |
| `EXECUTIONS_DATA_MAX_AGE` | `336` | Max age in hours (14 days) |
| `EXECUTIONS_DATA_PRUNE_MAX_COUNT` | `10000` | Max executions to keep |
| `EXECUTIONS_DATA_HARD_DELETE_BUFFER` | `1` | Hours before hard delete |
| `EXECUTIONS_DATA_PRUNE_HARD_DELETE_INTERVAL` | `15` | Hard delete interval (min) |
| `EXECUTIONS_DATA_PRUNE_SOFT_DELETE_INTERVAL` | `60` | Soft delete interval (min) |

### Queue Mode (Redis)

| Variable | Default | Description |
|----------|---------|-------------|
| `QUEUE_BULL_REDIS_HOST` | `localhost` | Redis host |
| `QUEUE_BULL_REDIS_PORT` | `6379` | Redis port |
| `QUEUE_BULL_REDIS_DB` | `0` | Redis database number |
| `QUEUE_BULL_REDIS_USERNAME` | (none) | Redis username |
| `QUEUE_BULL_REDIS_PASSWORD` | (none) | Redis password |
| `QUEUE_BULL_REDIS_TIMEOUT_THRESHOLD` | `10000` | Unavailability timeout (ms) |
| `QUEUE_HEALTH_CHECK_ACTIVE` | (none) | Enable /healthz on workers |

### Multi-Main (HA)

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_MULTI_MAIN_SETUP_ENABLED` | `false` | Enable HA setup |
| `N8N_MULTI_MAIN_SETUP_KEY_TTL` | `10` | Leader key TTL (seconds) |
| `N8N_MULTI_MAIN_SETUP_CHECK_INTERVAL` | `3` | Leader check interval (seconds) |

### Webhooks

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_ENDPOINT_WEBHOOK` | `webhook` | Production webhook path |
| `N8N_ENDPOINT_WEBHOOK_TEST` | `webhook-test` | Test webhook path |
| `N8N_ENDPOINT_WEBHOOK_WAIT` | `webhook-waiting` | Waiting webhook path |
| `WEBHOOK_URL` | (auto) | Override webhook URL |
| `N8N_DISABLE_PRODUCTION_MAIN_PROCESS` | `false` | Disable webhooks on main |

### API

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_ENDPOINT_REST` | `rest` | Internal REST API path |
| `N8N_PUBLIC_API_DISABLED` | `false` | Disable public API |
| `N8N_PUBLIC_API_ENDPOINT` | `api` | Public API path |
| `N8N_PUBLIC_API_SWAGGERUI_DISABLED` | `false` | Disable Swagger UI |

### Metrics (Prometheus)

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_METRICS` | `false` | Enable /metrics endpoint |
| `N8N_METRICS_PREFIX` | `n8n_` | Metrics prefix |
| `N8N_METRICS_INCLUDE_DEFAULT_METRICS` | `true` | System/Node.js metrics |
| `N8N_METRICS_INCLUDE_CACHE_METRICS` | `false` | Cache hit/miss metrics |
| `N8N_METRICS_INCLUDE_MESSAGE_EVENT_BUS_METRICS` | `false` | Event bus metrics |
| `N8N_METRICS_INCLUDE_WORKFLOW_ID_LABEL` | `false` | Workflow ID label |
| `N8N_METRICS_INCLUDE_NODE_TYPE_LABEL` | `false` | Node type label |
| `N8N_METRICS_INCLUDE_CREDENTIAL_TYPE_LABEL` | `false` | Credential type label |
| `N8N_METRICS_INCLUDE_API_ENDPOINTS` | `false` | API endpoint metrics |
| `N8N_METRICS_INCLUDE_API_PATH_LABEL` | `false` | API path label |
| `N8N_METRICS_INCLUDE_API_METHOD_LABEL` | `false` | HTTP method label |
| `N8N_METRICS_INCLUDE_API_STATUS_CODE_LABEL` | `false` | Status code label |
| `N8N_METRICS_INCLUDE_QUEUE_METRICS` | `false` | Queue metrics |
| `N8N_METRICS_QUEUE_METRICS_INTERVAL` | `20` | Queue metrics interval (s) |

### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_BLOCK_FILE_ACCESS_TO_N8N_FILES` | `true` | Block access to .n8n dir |
| `N8N_RESTRICT_FILE_ACCESS_TO` | (none) | Allowed directories (semicolon-sep) |
| `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS` | `false` | Enforce 0600 permissions |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | `false` | Block env access in Code |
| `N8N_GIT_NODE_DISABLE_BARE_REPOS` | `false` | Block bare repos in Git node |
| `N8N_GIT_NODE_ENABLE_HOOKS` | `false` | Allow Git hooks |
| `N8N_SECURE_COOKIE` | `true` | HTTPS-only cookies |
| `N8N_SAMESITE_COOKIE` | `lax` | Cross-site cookie policy |
| `N8N_CONTENT_SECURITY_POLICY` | `{}` | CSP headers (JSON) |
| `N8N_SECURITY_AUDIT_DAYS_ABANDONED_WORKFLOW` | `90` | Inactive workflow threshold |

### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_LOG_LEVEL` | `info` | Log level (info/warn/error/debug) |
| `N8N_LOG_OUTPUT` | `console` | Output (console/file) |
| `N8N_LOG_FORMAT` | `text` | Format (text/json) |
| `N8N_LOG_FILE_LOCATION` | `<n8n-dir>/logs/n8n.log` | Log file path |
| `N8N_LOG_FILE_COUNT_MAX` | `100` | Max log files |
| `N8N_LOG_FILE_SIZE_MAX` | `16` | Max file size (MB) |
| `CODE_ENABLE_STDOUT` | `false` | Code node stdout |
| `NO_COLOR` | (unset) | Disable ANSI colors |

### Nodes

| Variable | Default | Description |
|----------|---------|-------------|
| `NODES_EXCLUDE` | `["n8n-nodes-base.executeCommand", "n8n-nodes-base.localFileTrigger"]` | Blocked node types |
| `NODES_INCLUDE` | (none) | Allowlist of node types |
| `N8N_COMMUNITY_PACKAGES_ENABLED` | `true` | Allow community nodes |
| `N8N_CUSTOM_EXTENSIONS` | (none) | Custom node directories |
| `N8N_PYTHON_ENABLED` | `true` | Python in Code node |
| `NODE_FUNCTION_ALLOW_BUILTIN` | (none) | Allowed Node.js modules |
| `NODE_FUNCTION_ALLOW_EXTERNAL` | (none) | Allowed external packages |

### Payload & Limits

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_PAYLOAD_SIZE_MAX` | `16` | Max payload (MiB) |
| `N8N_FORMDATA_FILE_SIZE_MAX` | `200` | Max form file (MiB) |

### Workflows

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKFLOWS_DEFAULT_NAME` | `My workflow` | Default workflow name |
| `N8N_WORKFLOW_CALLER_POLICY_DEFAULT_OPTION` | `workflowsFromSameOwner` | Sub-workflow policy |
| `N8N_WORKFLOW_TAGS_DISABLED` | `false` | Disable tags |
| `N8N_WORKFLOW_ACTIVATION_BATCH_SIZE` | `1` | Simultaneous activations |
| `N8N_WORKFLOW_AUTODEACTIVATION_ENABLED` | `false` | Auto-unpublish on crashes |
| `N8N_WORKFLOW_AUTODEACTIVATION_MAX_LAST_EXECUTIONS` | `3` | Crashes before unpublish |

### Binary Data Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_DEFAULT_BINARY_DATA_MODE` | `filesystem` | Storage mode (filesystem/s3) |
| `N8N_AVAILABLE_BINARY_DATA_MODES` | (none) | Available modes |

### S3 External Storage (Enterprise)

| Variable | Description |
|----------|-------------|
| `N8N_EXTERNAL_STORAGE_S3_HOST` | S3 host URL |
| `N8N_EXTERNAL_STORAGE_S3_BUCKET_NAME` | Bucket name |
| `N8N_EXTERNAL_STORAGE_S3_BUCKET_REGION` | Bucket region |
| `N8N_EXTERNAL_STORAGE_S3_ACCESS_KEY` | Access key ID |
| `N8N_EXTERNAL_STORAGE_S3_ACCESS_SECRET` | Secret access key |
| `N8N_EXTERNAL_STORAGE_S3_AUTH_AUTO_DETECT` | Auto credential detection |

### License

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_LICENSE_ACTIVATION_KEY` | (none) | License key |
| `N8N_LICENSE_AUTO_RENEW_ENABLED` | `true` | Auto-renew every 10 days |
| `N8N_LICENSE_SERVER_URL` | `https://license.n8n.io/v1` | License server |
| `N8N_HIDE_USAGE_PAGE` | `false` | Hide usage page |

### UI

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_PERSONALIZATION_ENABLED` | `true` | Personalization questions |
| `N8N_HIRING_BANNER_ENABLED` | `true` | Hiring banner |
| `N8N_PUSH_BACKEND` | `websocket` | Backend push (sse/websocket) |
| `N8N_TEMPLATES_ENABLED` | `false` | Template library |
| `N8N_ONBOARDING_FLOW_DISABLED` | `false` | Disable onboarding |

### Telemetry

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_DIAGNOSTICS_ENABLED` | `true` | Anonymous telemetry |
| `N8N_VERSION_NOTIFICATIONS_ENABLED` | `true` | Update notifications |

### Credentials

| Variable | Default | Description |
|----------|---------|-------------|
| `CREDENTIALS_OVERWRITE_DATA` | (none) | JSON credential overwrites |
| `CREDENTIALS_OVERWRITE_ENDPOINT` | (none) | API endpoint for overwrites |
| `CREDENTIALS_DEFAULT_NAME` | `My credentials` | Default credential name |

### Source Control

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_SOURCECONTROL_DEFAULT_SSH_KEY_TYPE` | `ed25519` | SSH key type |

### External Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_EXTERNAL_SECRETS_UPDATE_INTERVAL` | `300` | Check interval (seconds) |

### Log Streaming (Enterprise)

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_EVENTBUS_CHECKUNSENTINTERVAL` | `0` | Check unsent interval (ms) |
| `N8N_EVENTBUS_LOGWRITER_KEEPLOGCOUNT` | `3` | Event log files to keep |
| `N8N_EVENTBUS_LOGWRITER_MAXFILESIZEINKB` | `10240` | Max event log size (KB) |

---

## Scaling & High Availability

### Queue Mode Architecture
```
                    +------------------+
                    |  Load Balancer   |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------v---------+         +--------v---------+
     |  Main Instance   |         |  Main Instance   |
     |  (webhooks, UI)  |         |  (webhooks, UI)  |
     +--------+---------+         +--------+---------+
              |                             |
              +--------------+--------------+
                             |
                    +--------v---------+
                    |      Redis       |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v-----+  +----v-------+  +---v--------+
     |   Worker 1   |  |  Worker 2  |  |  Worker 3  |
     +--------------+  +------------+  +------------+
              |              |              |
              +--------------+--------------+
                             |
                    +--------v---------+
                    |   PostgreSQL     |
                    +------------------+
```

### Setup Steps
1. Set `EXECUTIONS_MODE=queue` on all instances
2. Configure Redis connection on all instances
3. Use PostgreSQL (not SQLite) for shared database
4. Main instances handle webhooks and UI
5. Workers process workflow executions
6. Use load balancer for main instances

### Worker Command
```bash
# Start as worker
n8n worker

# Docker
docker run n8nio/n8n n8n worker
```

---

## Reverse Proxy Configuration

### Nginx
```nginx
server {
    listen 80;
    server_name n8n.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name n8n.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeout settings
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### Caddy
```
n8n.example.com {
    reverse_proxy localhost:5678 {
        flush_interval -1
    }
}
```

---

## Data Persistence

### Critical Data in `.n8n` Directory
- `database.sqlite` - Workflows, credentials, executions (if SQLite)
- `config` - Instance configuration
- `encryption key` - Used to encrypt credentials (if lost, credentials become unrecoverable)

### Backup Strategy
1. Always backup `N8N_ENCRYPTION_KEY` separately
2. For SQLite: backup `~/.n8n/database.sqlite`
3. For PostgreSQL: use `pg_dump`
4. Backup binary data directory if using filesystem mode

### Docker Volume Mount
```bash
# Named volume (recommended)
-v n8n_data:/home/node/.n8n

# Host directory
-v /path/on/host:/home/node/.n8n
```

---

## Security Best Practices

1. **Always use HTTPS** in production (`N8N_PROTOCOL=https` or reverse proxy)
2. **Set `N8N_ENCRYPTION_KEY`** explicitly and backup it
3. **Use PostgreSQL** for production
4. **Set `N8N_SECURE_COOKIE=true`** (requires HTTPS)
5. **Restrict file access** with `N8N_RESTRICT_FILE_ACCESS_TO`
6. **Block env access** with `N8N_BLOCK_ENV_ACCESS_IN_NODE=true`
7. **Use `_FILE` suffix** for sensitive env vars (Docker secrets)
8. **Set `N8N_PROXY_HOPS`** correctly when behind reverse proxy
9. **Disable unused features**: `N8N_DISABLE_UI`, `NODES_EXCLUDE`
10. **Run security audit** via API: `POST /api/v1/audit`

---

## Sensitive Variables with _FILE Suffix

Append `_FILE` to load values from files instead of environment:

```yaml
environment:
  - DB_POSTGRESDB_PASSWORD_FILE=/run/secrets/db_password
  - N8N_ENCRYPTION_KEY_FILE=/run/secrets/encryption_key
```

This works with Docker secrets:
```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt
  encryption_key:
    file: ./secrets/encryption_key.txt
```

---

## Configuration Methods

1. **Environment Variables** (recommended for Docker)
2. **Configuration File** (`~/.n8n/config`)
3. **CLI Flags** (limited options)

Priority: CLI flags > Environment Variables > Config File > Defaults
