# 07f — Mobile Bottom Tabs

## Quando usar
- App mobile (Instagram/X-style)
- 4-5 seções primárias, acesso constante
- PWA ou web-app focado em mobile

## Quando NÃO usar
- Desktop (esconder via `md:hidden`)
- Mais de 5 tabs (use drawer)
- Marketing site mobile (não tem "app logado")

## Props principais
- `TABS` array — `{ id, label, icon, badge?, primary? }`
- `primary: true` renderiza FAB central (criar, compor)
- Estado `active` via useState

## Dependências
- lucide-react
- Tailwind + `pb-safe` (safe area iOS — adicionar plugin ou custom class)

## Variações
- Sem FAB central (5 tabs simétricas)
- Com labels ocultos (só ícones)
- Sheet modal quando tab clicada (iOS-style)

## Anti-patterns
- Tabs > 5 (sobrecarga mobile)
- Tabs sem ícone (só label, quebra padrão mobile)
- Esquecer safe-area (notch iOS sobrepõe)
