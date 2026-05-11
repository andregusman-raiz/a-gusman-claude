# 04g — Video Autoplay Background Hero

## Quando usar
- Marca premium, lifestyle, fashion
- Produto que precisa mostrar movimento (hardware, vehicle, animated UI)
- Landing de campanha com high-production video
- Evento / conferência

## Quando NÃO usar
- Mobile-first (video autoplay causa issues de data)
- Sites SEO-críticos sem fallback adequado
- Quando não tem vídeo de alta qualidade
- Produtos B2B utilitários

## Props principais
- `videoSrc`: URL do MP4
- `posterSrc`: imagem fallback
- `title` / `subtitle` / `primaryCta`

## Dependências
- `lucide-react` (ArrowRight)
- HTML5 `<video>` com `muted autoPlay loop playsInline`

## Variações (responsive, dark)
- Sempre dark por contraste do texto
- Mobile: ainda autoplay (iOS requer `playsInline`)
- Overlay gradient força legibilidade
- Reduced-motion: considerar pause via JS (não incluído aqui)

## Anti-patterns
- Esquecer `muted` → browsers bloqueiam autoplay
- Vídeo sem overlay → texto ilegível
- Vídeo pesado (>5MB) → péssima UX
- Sem `poster` → fundo vazio durante loading
