# 14b — Loading Skeleton de Dashboard

## Quando usar
- `loading.tsx` de route segment no Next.js App Router.
- Suspense boundaries em Server Components.
- Fetch inicial de dashboards, tabelas, feeds.

## Quando NAO usar
- Loading instantaneo (<200ms) — skeleton causa flash.
- Operacoes deterministas curtas (use spinner).
- Conteudo estatico com ISR ja hidratado.

## Props principais
- `className`: override — permite customizar padding.

## Dependencias
- `react`.
- Tailwind com `animate-pulse` e cores `slate-200 dark:slate-800`.
- Sem deps externas.

## Variacoes
- `shimmer` em vez de `pulse` (requer custom keyframes).
- Skeleton com shape matching o conteudo real (cards, hero, etc).
- Skeleton por secao — granular em vez de tela inteira.

## Anti-patterns
- Skeleton generico que nao parece com o conteudo final (desorientacao).
- Sem `role="status"` e `aria-live` — leitor de tela perdido.
- Skeletons com tamanhos randomicos toda vez (perde afordancia).
- Deixar skeleton > 3s (preferir mostrar erro ou empty state).
