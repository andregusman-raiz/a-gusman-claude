# 11b — Tour Guiado com Tooltips Sequenciais

## Quando usar
- Apresentar 3-5 features-chave de um produto na primeira sessao.
- Feature release — destacar o que ha de novo em contexto.
- Apps com UI densa onde navegacao nao e obvia.

## Quando NAO usar
- Apps simples (<=3 acoes) — tooltip redundante.
- Fluxos que requerem input do usuario em cada passo (use wizard).
- Usuarios recorrentes — incluir opt-out persistente.

## Props principais
- `steps`: `TourStep[]` — `{ id, targetLabel, title, description, placement }`.
- `placement`: "top" | "bottom" | "left" | "right" (posicao do tooltip relativo ao alvo).
- `className`: override.

## Dependencias
- `react` com `useState`.
- `lucide-react` (`ArrowRight`, `Check`, `X`).
- Tailwind com `dark:` variants.

## Variacoes
- Com progress dots em vez de "X/Y".
- Com backdrop escurecido ao redor do elemento destacado (spotlight).
- Integracao com React Portal para tooltip fora de overflow.

## Anti-patterns
- Forcar o tour sem opcao de pular.
- Tooltips sem indicador de progresso (usuario perde contexto).
- Tours com mais de 6 passos — quebrar em secoes.
- Placement fixo sem detectar viewport (tooltip cortado em mobile).
