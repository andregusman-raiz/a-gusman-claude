# 04h — 3D Hero Interactive

## Quando usar
- Produtos 3D/AR/VR, hardware, games
- Marca que quer mostrar "inovação" tangível
- Demo interativo que pede exploração
- Quando performance permite animação contínua

## Quando NÃO usar
- Mobile-first (mouse move não existe em touch)
- Acessibilidade crítica (movimento pode causar enjoo)
- Produto utilitário B2B
- Low-end devices (CSS 3D pode travar)

## Props principais
- `title` / `subtitle` / `primaryCta`
- Rotação controlada por state interno baseado em `onMouseMove`

## Dependências
- `react` (useState)
- `lucide-react` (ArrowRight, Box)
- CSS 3D transforms (`perspective`, `transform-style: preserve-3d`, `backface-visibility`)

## Variações (responsive, dark)
- Sempre dark (gradient cubes brilham)
- Mobile: cubo estático centralizado (sem mouse move)
- Desktop: interativo com mouse
- Pode ser trocado por Three.js / React Three Fiber

## Anti-patterns
- Rotação sem damping → jitter no mouse
- Cubo > 60% da viewport → distrai
- Esquecer `backface-visibility: hidden` → vaza faces internas
- Transition longa demais (>300ms) → parece laggy
