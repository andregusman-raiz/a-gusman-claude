# 13b — Cards de Canais de Contato

## Quando usar
- Empresa com multiplos canais especializados (support, sales, press).
- Roteamento inteligente para reduzir tempo de resposta.
- Pagina /contato que quer triagem antes do formulario.

## Quando NAO usar
- Empresa com canal unico — redundante.
- Poucos canais (<=2) — use texto simples.
- Todos os canais vao para mesma caixa (usuario percebe e perde confianca).

## Props principais
- Nenhuma (lista hard-coded no componente de exemplo; extrair para prop `channels` em uso real).

## Dependencias
- `react`.
- `lucide-react` (`LifeBuoy`, `TrendingUp`, `Newspaper`, `ArrowRight`).
- Tailwind.

## Variacoes
- Mais de 3 canais (partners, careers, investors).
- Com tempo medio de resposta por canal ("<4h", "<24h").
- Com chat ao vivo como 4o canal.

## Anti-patterns
- Cards sem diferencial visual entre si (mesma cor/icone).
- CTA generico ("Clique aqui") em todos.
- Descricoes identicas sem dar contexto de quem deve usar cada um.
- Misturar canais humanos com automacoes sem sinalizar.
