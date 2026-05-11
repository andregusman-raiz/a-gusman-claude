# 08f — Single Featured Hero (Case Study)

## Quando usar
- 1 cliente-âncora, caso representativo (lighthouse customer)
- Quando há métricas de ROI concretas
- B2B enterprise, ciclo de vendas longo

## Quando NÃO usar
- Muitos depoimentos equivalentes → use grid (`08a`)
- Sem métricas reais (não inventar)
- Público consumer (formato muito corporativo)

## Props principais
- `name`, `role`, `company`, `initials`, `quote`
- `gradient` para bloco visual esquerdo
- `METRICS[]` interno (3 KPIs)

## Dependências
- lucide-react (Quote, TrendingUp, Clock, Users)
- Tailwind

## Variações
- Foto real em vez de iniciais + gradient
- Logo da empresa como background
- Link para case study PDF/página

## Anti-patterns
- Métricas genéricas sem referência (`+240%` de quê?)
- Quote muito longo (> 3 linhas mata impacto)
- Sem CTA para caso completo (perde follow-up)
