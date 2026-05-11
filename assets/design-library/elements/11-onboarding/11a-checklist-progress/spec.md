# 11a — Checklist de Progresso com Barra

## Quando usar
- Onboarding de SaaS com 3-7 etapas sequenciais (ou independentes).
- Fornecer sensacao de progresso visivel ("3/5 feito, 60%").
- Dashboards iniciais onde usuario precisa configurar antes de usar o produto.

## Quando NAO usar
- Fluxos lineares obrigatorios (use Stepper em vez disso).
- Mais de 10 tarefas (fragmentar em secoes ou mover para pagina dedicada).
- Tarefas que precisam ser completadas em ordem estrita (use wizard).

## Props principais
- `title`: titulo do card (default: "Primeiros passos").
- `subtitle`: descricao curta abaixo do titulo.
- `tasks`: `Task[]` — `{ id, title, description }`. Default tem 5 exemplos.
- `className`: override.

## Dependencias
- `react`, `lucide-react` (`Check`, `Circle`).
- Tailwind com `dark:` variants.

## Variacoes
- Com persistencia (connect a API/localStorage).
- Collapsible apos 100% (esconde card quando tudo feito).
- Com CTA primario no footer ("Finalizar").

## Anti-patterns
- Progress bar sem texto "X/Y" — menos informativo.
- Checkboxes puros sem affordance de clique no item inteiro.
- Ignorar `aria-valuenow` na progress bar.
