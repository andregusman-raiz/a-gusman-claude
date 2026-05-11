# 04c — Animated Gradient Hero

## Quando usar
- Produto criativo, AI, fintech, entretenimento
- Marca que quer parecer "moderna" e "premium"
- Página de lançamento ou evento
- Quando não há screenshot mas precisa de impacto visual

## Quando NÃO usar
- Produtos enterprise sérios (parece frívolo)
- Sites com conteúdo denso abaixo (compete por atenção)
- Acessibilidade crítica (respeita `prefers-reduced-motion`)
- Perf-sensitive em devices low-end

## Props principais
- `title` / `subtitle` / `primaryCta`

## Dependências
- `lucide-react` (ArrowRight)
- CSS animations (`<style jsx>` com @keyframes)

## Variações (responsive, dark)
- Sempre em dark (slate-950 base) — gradient brilha em fundo escuro
- Mobile: blobs ficam menores proporcionalmente
- `prefers-reduced-motion`: animação desativada

## Anti-patterns
- Blobs com opacidade alta → polui a leitura do título
- Gradient em fundo claro → perde impacto
- Animação > 20s → parece parada
- Esquecer de `pointer-events-none` nos blobs (bloqueia clicks)
