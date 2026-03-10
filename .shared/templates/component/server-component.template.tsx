// =============================================================================
// Server Component: {{ComponentName}}
// Arquivo: src/app/{{route}}/page.tsx (ou src/components/{{ComponentName}}.tsx)
// =============================================================================

import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Database } from '@/lib/types/database.types';

// TODO: Importar componentes filhos e tipos do dominio

// -----------------------------------------------------------------------------
// Data Fetching
// -----------------------------------------------------------------------------

// TODO: Ajustar query para o dominio
async function getData(id: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data, error } = await supabase
    .from('{{table_name}}')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

// -----------------------------------------------------------------------------
// Loading Fallback
// -----------------------------------------------------------------------------

function {{ComponentName}}Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-1/3 rounded bg-muted" />
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="h-32 w-full rounded bg-muted" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Content (async)
// -----------------------------------------------------------------------------

// TODO: Ajustar props e tipo de retorno
async function {{ComponentName}}Content({ id }: { id: string }) {
  const data = await getData(id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{data.name}</h1>
      {data.description && (
        <p className="text-muted-foreground">{data.description}</p>
      )}
      {/* TODO: Renderizar campos do dominio */}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component (exported)
// -----------------------------------------------------------------------------

// TODO: Ajustar params conforme rota
interface PageProps {
  params: { id: string };
}

export default function {{ComponentName}}Page({ params }: PageProps) {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Suspense fallback={<{{ComponentName}}Skeleton />}>
        <{{ComponentName}}Content id={params.id} />
      </Suspense>
    </main>
  );
}
