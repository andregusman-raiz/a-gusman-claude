# 09a — Multi-Column Sitemap Footer

## Quando usar
- SaaS estabelecido com múltiplas áreas
- Quando SEO precisa de links importantes no footer
- Produto com recursos, legal, empresa, docs

## Quando NÃO usar
- Landing mínima/beta → `09d-minimal-copyright`
- Foco em newsletter → `09b-newsletter-first`
- Site pequeno (< 5 páginas relevantes)

## Props principais
- `COLUMNS[]` — 4 colunas padrão
- `SOCIALS[]` — icons lucide
- `brand` — nome + logo

## Dependências
- lucide-react (Twitter, Github, Linkedin, Youtube)
- Tailwind

## Variações
- 3 colunas em vez de 4 (se sobrar espaço)
- Com newsletter na coluna do brand
- Com seletor de idioma no bottom

## Anti-patterns
- 20+ links por coluna (poluição)
- Sem copyright atualizado (ano hardcoded)
- Social icons sem aria-label
