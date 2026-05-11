# 03c — Alternating Rows

## Quando usar
3-5 features que merecem detalhe visual + texto. Permite storytelling progressivo conforme scroll.

## Quando NÃO usar
Landing muito curta (>3 rows deixam tudo longo). Mais de 6 features — preferir 03a icon grid.

## Props principais
- `rows?: Row[]` — (icon, eyebrow, title, description, bullets)
- `title?: string`, `subtitle?: string` — headline

## Dependências
- react, lucide-react (Check, Zap, BarChart3, Users, Shield — extensível)
- shadcn/ui components: Badge (usamos inline)

## Variações
- Alternância via index mod 2 + flex order trick em mobile/desktop
- Placeholder visual: aspect-video com icon gigante (substituir por screenshot)
- Eyebrow badge com icon pequeno

## Anti-patterns
- Não alternar apenas texto — visual precisa trocar de lado também
- Descrições muito longas (>4 linhas) quebram balance
- Evitar imagens soltas sem context — incluir label/caption
