// =============================================================================
// Rate Limiter: Upstash Redis sliding window
// Arquivo: src/lib/security/rate-limiter.ts
// =============================================================================

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

// TODO: Configurar env vars UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// TODO: Ajustar limites conforme necessidade do endpoint
const rateLimiters = {
  /** API geral: 60 requests por minuto */
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'rl:api',
    analytics: true,
  }),
  /** Auth endpoints: 10 requests por minuto (brute force protection) */
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'rl:auth',
    analytics: true,
  }),
  /** Upload: 5 requests por minuto */
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'rl:upload',
    analytics: true,
  }),
};

type RateLimitType = keyof typeof rateLimiters;

// -----------------------------------------------------------------------------
// Key Extraction
// -----------------------------------------------------------------------------

function getClientKey(request: NextRequest, userId?: string): string {
  // Prefere user ID (autenticado) sobre IP (anonimo)
  if (userId) return `user:${userId}`;

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
  return `ip:${ip}`;
}

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

/**
 * Rate limit middleware para API routes.
 *
 * Uso em route handler:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const limited = await checkRateLimit(request, 'auth');
 *   if (limited) return limited;
 *   // ... handler logic
 * }
 * ```
 */
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api',
  userId?: string
): Promise<NextResponse | null> {
  const key = getClientKey(request, userId);
  const limiter = rateLimiters[type];

  const { success, limit, remaining, reset } = await limiter.limit(key);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  // Retorna null = nao limitado, handler pode continuar
  return null;
}

// -----------------------------------------------------------------------------
// Header Helper (para respostas normais)
// -----------------------------------------------------------------------------

export function rateLimitHeaders(limit: number, remaining: number, reset: number) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  };
}
