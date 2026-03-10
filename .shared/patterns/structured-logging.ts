/**
 * structured-logging.ts — Reference Implementation
 *
 * Pino-compatible structured JSON logger interface with:
 * - Secret redaction (password, token, apiKey, secret, creditCard)
 * - Correlation ID support (request-id, trace-id)
 * - Log levels: trace, debug, info, warn, error, fatal
 * - Context enrichment (service name, environment, version)
 *
 * USAGE: Copy and adapt to your project. This is a pattern reference,
 * not a package. Adjust transports and serializers to your stack.
 *
 * DEPENDENCIES (install in your project):
 *   npm install pino pino-pretty
 *   npm install -D @types/node
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  /** Identifies the microservice or app module (e.g. "auth-service", "api-gateway") */
  service: string;
  /** Deployment environment */
  env: 'development' | 'test' | 'staging' | 'production';
  /** Semantic version of the deployed build (e.g. "1.4.2") */
  version: string;
}

export interface CorrelationIds {
  /** HTTP request ID propagated via X-Request-Id header */
  requestId?: string;
  /** OpenTelemetry / distributed trace ID */
  traceId?: string;
  /** OpenTelemetry span ID */
  spanId?: string;
  /** User session identifier (non-PII — use opaque token, not email) */
  sessionId?: string;
}

export interface LogEntry extends CorrelationIds {
  level: LogLevel;
  timestamp: string;
  message: string;
  service: string;
  env: string;
  version: string;
  /** Duration in milliseconds (for request/operation timing) */
  durationMs?: number;
  /** HTTP method + path (e.g. "GET /api/users") */
  http?: { method: string; path: string; status?: number };
  /** Sanitized error data (never include raw Error.stack in production) */
  error?: { name: string; message: string; code?: string };
  /** Arbitrary structured data — must NOT contain secrets */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Secret Redaction
// ---------------------------------------------------------------------------

/**
 * Field names whose VALUES must be redacted in log output.
 * Extend this list as your domain grows.
 */
const REDACTED_FIELDS = new Set([
  'password',
  'passwd',
  'pwd',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'apiKey',
  'api_key',
  'secret',
  'clientSecret',
  'client_secret',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'authorization',
  'cookie',
  'sessionToken',
  'session_token',
  'privateKey',
  'private_key',
]);

const REDACTED_PLACEHOLDER = '[REDACTED]';

/**
 * Deep-clones an object and replaces values of sensitive fields with
 * REDACTED_PLACEHOLDER. Works recursively on nested objects and arrays.
 *
 * @example
 * redactSecrets({ user: 'alice', password: 'hunter2' })
 * // => { user: 'alice', password: '[REDACTED]' }
 */
export function redactSecrets<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Never log raw JWT tokens or bearer strings embedded in strings
    return data.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]') as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(redactSecrets) as unknown as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (REDACTED_FIELDS.has(key)) {
        result[key] = REDACTED_PLACEHOLDER;
      } else {
        result[key] = redactSecrets(value);
      }
    }
    return result as T;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Logger Factory
// ---------------------------------------------------------------------------

export interface Logger {
  trace(msg: string, data?: Record<string, unknown>): void;
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  fatal(msg: string, data?: Record<string, unknown>): void;
  /** Returns a child logger with additional bound context */
  child(bindings: Record<string, unknown>): Logger;
  /** Attach correlation IDs for the duration of a request */
  withCorrelation(ids: CorrelationIds): Logger;
}

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

function getMinLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  if (envLevel && envLevel in LEVEL_SEVERITY) return envLevel;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Creates a structured JSON logger bound to a service context.
 *
 * In production, output is newline-delimited JSON (NDJSON) compatible with
 * Pino, Datadog, GCP Cloud Logging, and AWS CloudWatch.
 *
 * In development, set LOG_PRETTY=true to get human-readable output.
 *
 * @example
 * const log = createLogger({ service: 'auth-service', env: 'production', version: '1.0.0' });
 * log.info('User logged in', { userId: '123' });
 * // => {"level":"info","timestamp":"...","message":"User logged in","userId":"123","service":"auth-service",...}
 */
export function createLogger(context: LogContext): Logger {
  const minLevelNum = LEVEL_SEVERITY[getMinLevel()];
  const isPretty = process.env.LOG_PRETTY === 'true' && process.env.NODE_ENV !== 'production';

  function write(
    level: LogLevel,
    msg: string,
    data: Record<string, unknown> = {},
    bindings: Record<string, unknown> = {},
    correlation: CorrelationIds = {},
  ): void {
    if (LEVEL_SEVERITY[level] < minLevelNum) return;

    const sanitizedData = redactSecrets(data);
    const sanitizedBindings = redactSecrets(bindings);

    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message: msg,
      service: context.service,
      env: context.env,
      version: context.version,
      ...correlation,
      ...sanitizedBindings,
      ...sanitizedData,
    };

    if (isPretty) {
      const levelLabels: Record<LogLevel, string> = {
        trace: 'TRACE',
        debug: 'DEBUG',
        info: 'INFO ',
        warn: 'WARN ',
        error: 'ERROR',
        fatal: 'FATAL',
      };
      const extras = { ...sanitizedBindings, ...sanitizedData };
      const extrasStr = Object.keys(extras).length > 0 ? ` ${JSON.stringify(extras)}` : '';
      // eslint-disable-next-line no-console
      console.log(`[${entry.timestamp}] ${levelLabels[level]} [${context.service}] ${msg}${extrasStr}`);
    } else {
      // NDJSON — one JSON object per line, Pino-compatible
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry));
    }
  }

  function makeLogger(
    bindings: Record<string, unknown> = {},
    correlation: CorrelationIds = {},
  ): Logger {
    return {
      trace: (msg, data) => write('trace', msg, data, bindings, correlation),
      debug: (msg, data) => write('debug', msg, data, bindings, correlation),
      info: (msg, data) => write('info', msg, data, bindings, correlation),
      warn: (msg, data) => write('warn', msg, data, bindings, correlation),
      error: (msg, data) => write('error', msg, data, bindings, correlation),
      fatal: (msg, data) => write('fatal', msg, data, bindings, correlation),
      child: (childBindings) => makeLogger({ ...bindings, ...childBindings }, correlation),
      withCorrelation: (ids) => makeLogger(bindings, { ...correlation, ...ids }),
    };
  }

  return makeLogger();
}

// ---------------------------------------------------------------------------
// Singleton (optional — for simple single-service use)
// ---------------------------------------------------------------------------

let _defaultLogger: Logger | null = null;

/**
 * Returns (and lazily creates) a singleton logger.
 * Reads SERVICE_NAME, NODE_ENV, and npm_package_version from the environment.
 *
 * For apps with multiple logical services, prefer createLogger() directly.
 */
export function getLogger(): Logger {
  if (!_defaultLogger) {
    _defaultLogger = createLogger({
      service: process.env.SERVICE_NAME ?? process.env.npm_package_name ?? 'app',
      env: (process.env.NODE_ENV as LogContext['env']) ?? 'development',
      version: process.env.npm_package_version ?? '0.0.0',
    });
  }
  return _defaultLogger;
}

// ---------------------------------------------------------------------------
// Request middleware helper (Next.js / Express / Hono)
// ---------------------------------------------------------------------------

/**
 * Extracts correlation IDs from an HTTP request object.
 * Works with standard Headers API (Next.js App Router, Fetch API).
 *
 * @example — Next.js Route Handler
 * export async function GET(request: Request) {
 *   const log = getLogger().withCorrelation(extractCorrelation(request.headers));
 *   log.info('GET /api/users');
 * }
 */
export function extractCorrelation(headers: Headers | Record<string, string | undefined>): CorrelationIds {
  const get = (key: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(key) ?? undefined;
    return (headers as Record<string, string | undefined>)[key];
  };

  return {
    requestId: get('x-request-id') ?? get('x-correlation-id'),
    traceId: get('x-trace-id') ?? get('traceparent')?.split('-')[1],
    spanId: get('x-span-id'),
  };
}

// ---------------------------------------------------------------------------
// Usage Examples (remove before copying to production)
// ---------------------------------------------------------------------------

// --- Basic usage ---
// const log = createLogger({ service: 'user-service', env: 'production', version: '1.2.3' });
// log.info('Server started', { port: 3000 });
// log.warn('Rate limit approaching', { userId: 'u_abc123', remaining: 5 });
// log.error('Database query failed', { error: { name: 'PgError', message: 'connection refused', code: 'ECONNREFUSED' } });

// --- Secret redaction ---
// log.info('Login attempt', { email: 'alice@example.com', password: 'hunter2' });
// => { ..., email: "alice@example.com", password: "[REDACTED]" }

// --- Child logger (adds permanent bindings) ---
// const requestLog = log.child({ requestId: req.headers['x-request-id'], userId: session.userId });
// requestLog.info('Processing order', { orderId: 'o_xyz' });

// --- withCorrelation (request-scoped IDs) ---
// const log = getLogger().withCorrelation(extractCorrelation(request.headers));
// log.info('Request received');
