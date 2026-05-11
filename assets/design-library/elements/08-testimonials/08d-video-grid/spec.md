# 08d — Video Testimonial Grid 2x2

## Quando usar
- Seção "case study" com 4 clientes-destaque
- Quando áudio/vídeo aumenta credibilidade (enterprise sales)
- B2B com longo ciclo de decisão

## Quando NÃO usar
- Não tem vídeos reais (não crie fake thumbnails)
- Landing rápida/transacional (vídeo custa atenção)
- Mobile exclusivo (vídeo em mobile-only é pesado)

## Props principais
- `VIDEOS[]` com `{ name, role, company, duration, gradient }`
- Gradient no lugar de poster image (para demo) — em produção usar `<img src={poster}>`
- Layout: `sm:grid-cols-2` (2x2)

## Dependências
- lucide-react (Play)
- Tailwind

## Variações
- Com modal player ao clicar (useState + iframe YouTube/Vimeo)
- Com transcrição abaixo (acessibilidade)
- Logo da empresa sobre a thumbnail

## Anti-patterns
- Auto-play (irrita usuário + GDPR)
- Sem duração visível (usuário não sabe compromisso)
- Thumbnails genéricas/stock photo
