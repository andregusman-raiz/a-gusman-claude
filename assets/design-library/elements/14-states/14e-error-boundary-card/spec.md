# 14e — Card de Error Boundary

## Quando usar
- `error.tsx` de route segment no Next.js App Router.
- React Error Boundaries em componentes criticos.
- API failures no client com retry possivel.
- Estado pos-exception onde retry faz sentido.

## Quando NAO usar
- Erros de validacao de form (inline abaixo do campo).
- Loading (use `14b-loading-skeleton`).
- Empty state (use `14c` ou `11d`).
- 404 (use `14a`).

## Props principais
- `title`, `message`: copy human-readable.
- `errorDetails`: stack trace ou msg tecnica (toggle).
- `digest`: identificador do Next.js para correlacionar com logs.
- `onRetry`, `onReport`: callbacks.

## Dependencias
- `react` com `useState` para toggle.
- `lucide-react` (`AlertCircle`, `RotateCw`, `Bug`, `ChevronDown`).
- Tailwind. Palette `red-*` para estado de erro.

## Variacoes
- Com integracao Sentry (enviar evento ao clicar "Reportar").
- Sem detalhes tecnicos (producao user-facing).
- Com countdown de auto-retry.

## Anti-patterns
- Expor stack trace completo em producao (seguranca).
- Mensagem tecnica como primary ("TypeError: ..." no titulo).
- Sem botao de retry (usuario precisa dar refresh manual).
- Sem `role="alert"` (leitor de tela nao percebe).
- Copy generica ("Error") sem contexto de o que tentar.
