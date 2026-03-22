// =============================================================================
// CSRF Protection: Double-Submit Cookie Pattern
// Arquivo: src/lib/security/csrf.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes, timingSafeEqual } from 'crypto';

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

// TODO: Ajustar nome do cookie e tempo de expiracao
const CSRF_COOKIE_NAME = '__csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32; // bytes
const TOKEN_MAX_AGE = 60 * 60; // 1 hora em segundos

// -----------------------------------------------------------------------------
// Token Management
// -----------------------------------------------------------------------------

/** Gera um token CSRF aleatorio e seta o cookie */
export function generateCsrfToken(): string {
  const token = randomBytes(TOKEN_LENGTH).toString('hex');
  return token;
}

/** Seta o cookie CSRF na response */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
  return response;
}

/** Retorna o token do cookie para incluir em forms/headers do client */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null;
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

/** Valida token CSRF usando timing-safe comparison */
function tokensMatch(cookieToken: string, headerToken: string): boolean {
  if (cookieToken.length !== headerToken.length) return false;

  const a = Buffer.from(cookieToken, 'utf-8');
  const b = Buffer.from(headerToken, 'utf-8');

  return timingSafeEqual(a, b);
}

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

/**
 * CSRF validation middleware para API routes mutativas (POST, PUT, DELETE, PATCH).
 *
 * Uso em route handler:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const csrfError = validateCsrf(request);
 *   if (csrfError) return csrfError;
 *   // ... handler logic
 * }
 * ```
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  // Apenas metodos mutativos precisam de CSRF
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return null;

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { status: 403 }
    );
  }

  if (!tokensMatch(cookieToken, headerToken)) {
    return NextResponse.json(
      { error: 'CSRF token mismatch' },
      { status: 403 }
    );
  }

  return null; // Valido
}

// -----------------------------------------------------------------------------
// Client Helper (incluir em forms)
// -----------------------------------------------------------------------------

/**
 * React hook helper — retorna headers com CSRF para fetch().
 *
 * ```ts
 * const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
 * fetch('/api/resource', {
 *   method: 'POST',
 *   headers: { 'x-csrf-token': csrfToken ?? '' },
 * });
 * ```
 */
