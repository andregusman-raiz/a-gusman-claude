# Background Jobs Patterns (Cross-Project)

## Principio: Vercel Stateless, N8N Stateful

Vercel route handlers tem timeout (60s padrao, 300s streaming).
Operacoes longas (email batch, PDF generation, data sync) vao para N8N.
Vercel enfileira, N8N processa.

## Arquitetura Geral

```
[Client] → [Vercel API] → [N8N Webhook] → [Processing] → [Callback/DB Update]
              │                                                    │
              └── Retorna job_id imediato ─────────────────── Client polls status
```

## N8N Webhook Pattern

### Vercel: Enfileirar Job
```typescript
// src/app/api/jobs/enqueue/route.ts
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const enqueueSchema = z.object({
  type: z.enum(['email_batch', 'pdf_generate', 'data_sync']),
  payload: z.record(z.unknown()),
  idempotencyKey: z.string().uuid(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const parsed = enqueueSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('idempotency_key', parsed.data.idempotencyKey)
    .single();

  if (existing) {
    return NextResponse.json({ jobId: existing.id, status: existing.status });
  }

  // Create job record
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      type: parsed.data.type,
      payload: parsed.data.payload,
      idempotency_key: parsed.data.idempotencyKey,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Dispatch to N8N (fire-and-forget)
  await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-Auth': process.env.N8N_WEBHOOK_SECRET!,
    },
    body: JSON.stringify({
      jobId: job.id,
      type: parsed.data.type,
      payload: parsed.data.payload,
    }),
  }).catch(err => {
    // Log but don't fail — N8N will retry via polling
    console.error('N8N dispatch failed, job will be picked up by poller', err);
  });

  return NextResponse.json({ jobId: job.id, status: 'pending' }, { status: 202 });
}
```

### Webhook Receiver (validacao)
```typescript
// src/app/api/webhooks/n8n/route.ts
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: Request) {
  const headersList = await headers();
  const signature = headersList.get('x-n8n-signature');
  const body = await req.text();

  // Validate webhook signature
  const expected = crypto
    .createHmac('sha256', process.env.N8N_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  await processWebhook(payload);

  return NextResponse.json({ received: true });
}

async function processWebhook(payload: { jobId: string; status: string; result?: unknown }) {
  const supabase = await createClient();
  await supabase
    .from('jobs')
    .update({
      status: payload.status,
      result: payload.result,
      completed_at: payload.status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', payload.jobId);
}
```

## Idempotency Pattern

### Jobs Table
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_jobs.sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  idempotency_key UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead')),
  result JSONB,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_status ON jobs (status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_jobs_idempotency ON jobs (idempotency_key);
CREATE INDEX idx_jobs_type_status ON jobs (type, status);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON jobs
  FOR ALL USING (auth.role() = 'service_role');
```

### Idempotency Key no Client
```typescript
// Client gera key ANTES do request
import { v4 as uuidv4 } from 'uuid';

const idempotencyKey = uuidv4();

// Safe to retry — same key = same result
await fetch('/api/jobs/enqueue', {
  method: 'POST',
  body: JSON.stringify({
    type: 'email_batch',
    payload: { templateId: 'welcome', userIds: [...] },
    idempotencyKey,
  }),
});
```

## Retry com Exponential Backoff

### Implementacao
```typescript
// src/lib/retry.ts
interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
}

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  jitter: true,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY, ...options };

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === opts.maxAttempts) throw error;

      // Non-retryable errors
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500 && status !== 429) throw error;
      }

      const delay = Math.min(
        opts.baseDelayMs * 2 ** (attempt - 1),
        opts.maxDelayMs
      );
      const actualDelay = opts.jitter
        ? delay * (0.5 + Math.random() * 0.5)
        : delay;

      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }

  throw new Error('Unreachable');
}
```

### Uso
```typescript
const data = await withRetry(
  () => fetchExternalAPI('/data'),
  { maxAttempts: 3, baseDelayMs: 2000 }
);
```

## Dead Letter Queue

### Mover job para DLQ apos max_attempts
```typescript
// src/lib/jobs/processor.ts
async function processJob(jobId: string) {
  const supabase = await createClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job || job.status === 'completed' || job.status === 'dead') return;

  if (job.attempts >= job.max_attempts) {
    await supabase
      .from('jobs')
      .update({ status: 'dead', last_error: 'Max attempts exceeded' })
      .eq('id', jobId);

    // Notify — dead letter needs human attention
    await notifySlack(`Dead letter: job ${jobId} (${job.type}) failed after ${job.max_attempts} attempts`);
    return;
  }

  await supabase
    .from('jobs')
    .update({
      status: 'processing',
      attempts: job.attempts + 1,
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  try {
    const result = await executeJob(job);
    await supabase
      .from('jobs')
      .update({ status: 'completed', result, completed_at: new Date().toISOString() })
      .eq('id', jobId);
  } catch (error) {
    const nextRetry = new Date(Date.now() + 1000 * 2 ** job.attempts).toISOString();
    await supabase
      .from('jobs')
      .update({
        status: 'pending',
        last_error: String(error),
        next_retry_at: nextRetry,
      })
      .eq('id', jobId);
  }
}
```

## Cron Jobs in Vercel

### vercel.json Config
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/retry-failed-jobs",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Cron Route Handler
```typescript
// src/app/api/cron/retry-failed-jobs/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Find retryable jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('status', 'pending')
    .lt('next_retry_at', new Date().toISOString())
    .lt('attempts', supabase.raw('max_attempts'))
    .limit(10);

  if (!jobs?.length) {
    return NextResponse.json({ processed: 0 });
  }

  // Process each (within 60s timeout)
  let processed = 0;
  for (const job of jobs) {
    await processJob(job.id);
    processed++;
  }

  return NextResponse.json({ processed });
}
```

## Long-Running Tasks (Enqueue-Poll-Notify)

### Client Pattern
```typescript
// src/hooks/useJob.ts
export function useJob(jobId: string | null) {
  const [status, setStatus] = useState<JobStatus>('pending');
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();

      setStatus(data.status);
      if (data.status === 'completed') {
        setResult(data.result);
        clearInterval(interval);
      }
      if (data.status === 'dead' || data.status === 'failed') {
        clearInterval(interval);
      }
    }, 2000); // Poll every 2s

    return () => clearInterval(interval);
  }, [jobId]);

  return { status, result };
}

// Uso no componente
function ExportButton() {
  const [jobId, setJobId] = useState<string | null>(null);
  const { status, result } = useJob(jobId);

  const handleExport = async () => {
    const res = await fetch('/api/jobs/enqueue', {
      method: 'POST',
      body: JSON.stringify({
        type: 'data_export',
        payload: { format: 'csv' },
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    const { jobId } = await res.json();
    setJobId(jobId);
  };

  return (
    <div>
      <button onClick={handleExport} disabled={status === 'processing'}>
        {status === 'processing' ? 'Exportando...' : 'Exportar'}
      </button>
      {status === 'completed' && <a href={result.downloadUrl}>Download</a>}
      {status === 'dead' && <p>Falha na exportacao. Tente novamente.</p>}
    </div>
  );
}
```

## NUNCA

- Processar job sincrono se > 10s — enfileirar
- Retry sem backoff — sobrecarrega servico
- Retry erro 4xx (exceto 429) — input invalido nao muda com retry
- Ignorar jobs `dead` — precisam atencao humana
- Cron sem autenticacao — qualquer um pode triggar
- `setInterval` no server — Vercel e stateless, nao persiste

## SEMPRE

- Idempotency key em operacoes que mudam estado
- Webhook signature validation (HMAC)
- Job timeout — marcar como failed se nao completar em X min
- Logar jobId em todos os logs relacionados (correlacao)
- Retry count visivel no dashboard/admin

## Checklist

- [ ] Jobs table com idempotency_key unique
- [ ] Webhook signature validation implementada
- [ ] Retry com exponential backoff (nao linear)
- [ ] Dead letter handling com notificacao
- [ ] Cron routes com CRON_SECRET validation
- [ ] Client polling com cleanup no unmount
- [ ] Monitoramento: jobs stuck em 'processing' > 10min
