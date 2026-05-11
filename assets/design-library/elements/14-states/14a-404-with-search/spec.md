# 14a — 404 com Busca + Links Uteis

## Quando usar
- Rota `not-found.tsx` do Next.js (App Router).
- Sites com estrutura complexa onde URL quebrada e comum.
- Quando SEO e afetado por 404s (ajudar a reduzir bounce).

## Quando NAO usar
- Apps internos onde usuarios sabem navegar manualmente.
- 404 de API (preferir JSON response estruturada).

## Props principais
- `onSearch`: callback `(query: string) => void`.
- `className`: override.

## Dependencias
- `react` com `useState`.
- `lucide-react` (`Search`, `Home`, `BookOpen`, `MessageCircle`, `FileText`, `Compass`, `Mail`).
- Tailwind.

## Variacoes
- Com ilustracao SVG grande no topo.
- Com "Paginas mais visitadas" (dinamico).
- Mensagem em tom humoristico vs serio (adaptar brand).
- Auto-redirect apos N segundos.

## Anti-patterns
- 404 sem busca nem links (beco sem saida).
- Stack trace tecnico exposto.
- Sem `role="alert"` em pagina de erro.
- Codigo de erro escondido (usuario quer saber o que aconteceu).
