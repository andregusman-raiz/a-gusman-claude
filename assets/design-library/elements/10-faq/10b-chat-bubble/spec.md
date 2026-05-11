# 10b — Chat Bubble FAQ

## Quando usar
- Produto com identidade conversacional (chatbot, comunidade, AI)
- Público jovem, UX lúdica
- 4-6 Q/As que funcionam como diálogo

## Quando NÃO usar
- B2B enterprise formal
- Muitas perguntas (20+) — visual cansa
- SEO crítico (semântica menor que accordion)

## Props principais
- `QAS[]` — `{ q, a }`
- Sem interação (sempre visível)
- Q à direita, A à esquerda (convenção chat)

## Dependências
- Tailwind (rounded-2xl + rounded-[side]-sm para "tail")

## Variações
- Com timestamp em cada bubble
- Com avatar real de atendente
- Com indicador "digitando..." animado

## Anti-patterns
- Respostas muito longas (quebra a estética de chat)
- Espacejamento errado entre Q/A (confunde fluxo)
- Esquecer sr-only "Pergunta:"/"Resposta:" (acessibilidade)
