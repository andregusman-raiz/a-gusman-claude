// =============================================================================
// Auth Middleware: Supabase session + role validation
// Arquivo: src/lib/security/auth-middleware.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database.types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

// TODO: Ajustar roles conforme o sistema de permissoes do projeto
type UserRole = 'superadmin' | 'core_team' | 'external_agent' | 'client';

interface AuthResult {
  userId: string;
  email: string;
  role: UserRole;
}

type AuthResponse = { success: true; user: AuthResult } | { success: false; response: NextResponse };

// -----------------------------------------------------------------------------
// Session Validation
// -----------------------------------------------------------------------------

async function getSession(): Promise<AuthResult | null> {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) return null;

  // TODO: Ajustar query de role conforme tabela de perfis
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  return {
    userId: session.user.id,
    email: session.user.email ?? '',
    role: (profile?.role as UserRole) ?? 'client',
  };
}

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

/**
 * Valida autenticacao e (opcionalmente) role.
 *
 * Uso em route handler:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAuth(request);
 *   if (!auth.success) return auth.response;
 *   const { userId, role } = auth.user;
 *   // ... handler logic
 * }
 * ```
 */
export async function requireAuth(
  _request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<AuthResponse> {
  const user = await getSession();

  // 401 — Nao autenticado
  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // 403 — Autenticado mas sem permissao
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return { success: true, user };
}

// -----------------------------------------------------------------------------
// Route Handler Wrapper (alternativa ergonomica)
// -----------------------------------------------------------------------------

type RouteHandler = (
  request: NextRequest,
  user: AuthResult
) => Promise<NextResponse>;

/**
 * Wrapper que protege um route handler com autenticacao.
 *
 * ```ts
 * export const GET = withAuth(async (request, user) => {
 *   return NextResponse.json({ userId: user.userId });
 * }, ['superadmin', 'core_team']);
 * ```
 */
export function withAuth(handler: RouteHandler, allowedRoles?: UserRole[]) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await requireAuth(request, allowedRoles);
    if (!auth.success) return auth.response;
    return handler(request, auth.user);
  };
}
