# 04f — Social Proof Inline Hero

## Quando usar
- B2B consolidado com clientes relevantes
- Marca ainda em construção precisando emprestar credibilidade
- Produto com alto preço (cliente quer validar)
- Meio de funil (quem chegou aqui precisa confiança)

## Quando NÃO usar
- Startup sem clientes notáveis ainda
- Produto B2C casual
- Quando os logos seriam fracos ou desconhecidos

## Props principais
- `title` / `subtitle` / `primaryCta`
- `logos`: array de nomes (ou trocar por imagens)
- `companiesCount`: texto sobre a logo wall

## Dependências
- `lucide-react` (ArrowRight, Star)

## Variações (responsive, dark)
- Mobile: logos wrap em múltiplas linhas
- Desktop: todos em linha única
- Dark: `opacity-60` base, hover revela

## Anti-patterns
- 3 logos ou menos → parece fraco
- Logos sem trade-offs de cor (cliente vermelho ao lado de verde)
- Rating fake (Google pune SEO e usuário percebe)
- Logos grandes demais competindo com o título
