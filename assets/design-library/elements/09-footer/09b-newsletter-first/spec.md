# 09b — Newsletter-First Footer

## Quando usar
- Produto com newsletter como canal principal (media, creators, indie)
- Quando captação de email > sitemap SEO
- Blog-heavy ou conteúdo frequente

## Quando NÃO usar
- SaaS empresarial com muitos links importantes → `09a`
- Produto sem programa de newsletter
- Site legal/regulado (sitemap precisa ser extenso)

## Props principais
- Form com `email` + `submitted` via useState
- `MINI_LINKS` — 5 links essenciais
- Sem handler real (placeholder)

## Dependências
- lucide-react (Mail, ArrowRight)
- Tailwind

## Variações
- Com opt-in duplo (checkbox LGPD)
- Com categorias de newsletter (tags)
- Botão com loading state

## Anti-patterns
- Form sem feedback visual pós-submit
- Sem link para política de privacidade (LGPD)
- Mini-sitemap com menos de 3 links (vazio demais)
