// =============================================================================
// Hook: useEstadoDemo
// Arquivo: src/hooks/useEstadoDemo.ts
// =============================================================================
//
// Le o parametro `?estado=loading|vazio|erro` da URL para forcar um estado
// universal de tela (ver assets/design-library/elements/14-states/) sem
// depender de backend. Uso em pagina:
//
//   const estado = useEstadoDemo();
//   if (estado === 'loading') return <LoadingSkeleton />;
//   if (estado === 'vazio') return <EmptyStateIllustration />;
//   if (estado === 'erro') return <ErrorBoundaryCard />;
//   // ... conteudo normal da pagina
//
// QAT visual fotografa cada rota nos 3 estados via este parametro
// (ver shared/templates/ux-qat/).
//
// GATE DE AMBIENTE (CRITICO — NAO REMOVER):
// So ativa fora de producao (NODE_ENV !== "production") OU com a flag
// explicita NEXT_PUBLIC_ESTADO_DEMO=1. Motivo: em outro produto Raiz um
// parametro de QA equivalente vazou para producao e qualquer usuario
// conseguia forcar a tela de erro/loading via URL. Sem esse gate,
// `?estado=erro` em producao quebra a tela para usuario real.

'use client';

import { useEffect, useState } from 'react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type EstadoDemo = 'loading' | 'vazio' | 'erro' | null;

const ESTADOS_VALIDOS: readonly EstadoDemo[] = ['loading', 'vazio', 'erro'];

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

/**
 * Retorna 'loading' ate o efeito client-only resolver (evita mismatch de
 * hidratacao SSR/CSR), depois o estado forcado via `?estado=` ou `null`
 * quando o parametro nao esta presente OU o gate de ambiente esta fechado.
 */
export function useEstadoDemo(): EstadoDemo {
  const [estado, setEstado] = useState<EstadoDemo>('loading');

  useEffect(() => {
    const gateAberto =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_ESTADO_DEMO === '1';

    if (!gateAberto) {
      setEstado(null);
      return;
    }

    const param = new URLSearchParams(window.location.search).get('estado');
    setEstado(
      ESTADOS_VALIDOS.includes(param as EstadoDemo) ? (param as EstadoDemo) : null
    );
  }, []);

  return estado;
}
