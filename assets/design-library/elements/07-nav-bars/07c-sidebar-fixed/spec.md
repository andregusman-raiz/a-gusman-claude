# 07c — Sidebar Fixa

## Quando usar
- App logado (dashboard, admin, SaaS workspace)
- 5-10 seções principais acessíveis sempre
- Produto onde o usuário passa tempo (high-dwell)

## Quando NÃO usar
- Marketing site / landing → use top nav (`07a`, `07b`)
- Mobile (< 768px) → colapsar ou usar bottom tabs
- Fluxos lineares (onboarding, checkout)

## Props principais
- `userName`, `userEmail` — perfil no footer
- `brand` — nome/inicial
- `NAV` array interno — fácil externalizar

## Dependências
- lucide-react (Home, BarChart3, etc)
- Tailwind + dark

## Variações
- Colapsável: adicionar estado + reduzir para `w-16`
- Com group headers: separar seções com `<div>` + texto uppercase
- Multi-tenant: dropdown de workspace no topo

## Anti-patterns
- Esconder navegação crítica em submenu
- Sidebar em mobile fixa (quebra layout)
- Mais de 12 itens sem agrupamento visual
