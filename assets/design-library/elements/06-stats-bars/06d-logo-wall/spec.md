# 06d — Logo Wall

## Quando usar
- Social proof pesado (B2B)
- Depois de hero, antes de features
- Quando você tem 8-12 logos relevantes
- Tirar foco de "startup desconhecida"

## Quando NÃO usar
- Menos de 6 logos (parece fraco)
- Logos concorrentes (incomoda visualmente)
- Quando só tem logos não reconhecíveis
- Produto B2C (raramente agrega)

## Props principais
- `title`: eyebrow pequeno acima
- `logos`: array de strings (ou trocar por `<img>`)

## Dependências
- Nenhuma além de Tailwind

## Variações (responsive, dark)
- Mobile: 2 colunas
- Desktop: 6 colunas (`lg:grid-cols-6`)
- Grayscale base + hover colorido (per-item)

## Anti-patterns
- Logos com alturas visualmente diferentes (desalinha)
- Sem `aria-label` ao trocar por imagem
- Logos muito pequenos (ilegíveis)
- Background colorido atrás dos logos
