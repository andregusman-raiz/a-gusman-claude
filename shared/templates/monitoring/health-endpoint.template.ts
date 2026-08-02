// =============================================================================
// Health Endpoint: /api/health
// Arquivo: src/app/api/health/route.ts
// =============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// TODO: Ajustar versao e nome do servico
const SERVICE_NAME = '{{PROJECT_NAME}}';
const SERVICE_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
const startTime = Date.now();

// -----------------------------------------------------------------------------
// Dependency Checks
// -----------------------------------------------------------------------------

interface CheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  message?: string;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    // TODO: Ajustar para service role key se necessario
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('_health_check').select('id').limit(1);

    // Tabela pode nao existir — query parse e suficiente para verificar conectividade
    const latencyMs = Date.now() - start;

    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      return { status: 'unhealthy', latencyMs, message: error.message };
    }

    return {
      status: latencyMs > 2000 ? 'degraded' : 'healthy',
      latencyMs,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// TODO: Adicionar checks para outros servicos (Redis, external APIs, etc.)

// -----------------------------------------------------------------------------
// Route Handler
// -----------------------------------------------------------------------------

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const checks: Record<string, CheckResult> = {};

  // Executar checks em paralelo
  const [dbResult] = await Promise.all([
    checkDatabase(),
    // TODO: Adicionar outros checks aqui
  ]);

  checks.database = dbResult;

  // Status geral: unhealthy se qualquer check falhou
  const overallStatus = Object.values(checks).some((c) => c.status === 'unhealthy')
    ? 'unhealthy'
    : Object.values(checks).some((c) => c.status === 'degraded')
      ? 'degraded'
      : 'healthy';

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  const body = {
    status: overallStatus,
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
