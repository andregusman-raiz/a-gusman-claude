// =============================================================================
// Hook: use{{HookName}}
// Arquivo: src/hooks/use{{HookName}}.ts
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// TODO: Importar tipos do dominio

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Use{{HookName}}Options {
  /** TODO: Parametros de configuracao */
  enabled?: boolean;
  /** Intervalo de polling em ms (0 = sem polling) */
  pollInterval?: number;
}

interface Use{{HookName}}Return<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  /** Refetch manual */
  refetch: () => Promise<void>;
  /** Resetar estado */
  reset: () => void;
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

// TODO: Ajustar tipo generico T para o dominio
export function use{{HookName}}<T = unknown>(
  id: string | null,
  options: Use{{HookName}}Options = {}
): Use{{HookName}}Return<T> {
  const { enabled = true, pollInterval = 0 } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref para evitar race conditions em fetches concorrentes
  const abortControllerRef = useRef<AbortController | null>(null);

  // TODO: Ajustar endpoint e logica de fetch
  const fetchData = useCallback(async () => {
    if (!id || !enabled) return;

    // Cancelar fetch anterior se ainda em andamento
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/{{resource}}/${id}`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (!controller.signal.aborted) {
        setData(json as T);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [id, enabled]);

  // Fetch inicial e quando dependencias mudam
  useEffect(() => {
    fetchData();
    return () => { abortControllerRef.current?.abort(); };
  }, [fetchData]);

  // Polling opcional
  useEffect(() => {
    if (pollInterval <= 0 || !enabled) return;
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval, enabled]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Memoizar retorno para evitar re-renders desnecessarios
  return useMemo(
    () => ({ data, isLoading, error, refetch: fetchData, reset }),
    [data, isLoading, error, fetchData, reset]
  );
}
