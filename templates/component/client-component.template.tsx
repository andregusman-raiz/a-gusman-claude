// =============================================================================
// Client Component: {{ComponentName}}
// Arquivo: src/components/{{ComponentName}}.tsx
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';

// TODO: Importar tipos e servicos do dominio

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface {{ComponentName}}Props {
  /** TODO: Definir props obrigatorias */
  id: string;
  /** Callback quando acao for concluida */
  onComplete?: (result: unknown) => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function {{ComponentName}}({ id, onComplete }: {{ComponentName}}Props) {
  const [data, setData] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Ajustar fetch para o endpoint correto
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/{{resource}}/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  // TODO: Implementar handlers de acao
  const handleAction = useCallback(async () => {
    try {
      setError(null);
      // TODO: Chamar API ou server action
      onComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na acao');
    }
  }, [data, onComplete]);

  // --- Loading State --------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // --- Error State ----------------------------------------------------------

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // --- Render ---------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* TODO: Renderizar dados do dominio */}
      <pre className="rounded bg-muted p-4 text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
      <button
        onClick={handleAction}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {/* TODO: Label do botao */}
        Confirmar
      </button>
    </div>
  );
}
