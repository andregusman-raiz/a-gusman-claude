# 11c — Modal de Video de Introducao

## Quando usar
- Primeiro acesso de usuario em SaaS complexo que se beneficia de explicacao visual.
- Release de feature major — video explica em 60-120s.
- Produtos onde demo assincrona reduz drop-off em setup.

## Quando NAO usar
- Produtos simples (email, todo list) — intro por texto basta.
- Tour interativo e viavel (prefira `11b-guided-tour-tooltip`).
- Usuario ja completou onboarding antes (persistir estado).

## Props principais
- `title`, `subtitle`: header do modal.
- `videoPosterSrc`: imagem antes do play.
- `videoSrc`: MP4 (deve ser hospedado ou Vercel Blob).
- `onStart`, `onSkip`: callbacks.

## Dependencias
- `react` com `useState`.
- `lucide-react` (`Play`, `SkipForward`, `X`).
- Tailwind com `dark:` variants.

## Variacoes
- Video auto-play ao abrir modal (requer `muted` por policy de browsers).
- Sem botao "Pular" — forcar conclusao (ruim UX, evitar).
- Transcript abaixo do video para acessibilidade.

## Anti-patterns
- Video sem poster (tela preta enquanto carrega).
- Sem `aria-modal` e `role="dialog"` (leitores de tela perdem contexto).
- Backdrop sem close on click (usuario se sente preso).
- Video > 3min no onboarding (bounce rate dispara).
