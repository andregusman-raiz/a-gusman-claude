# 09c — Footer com Status Indicator

## Quando usar
- SaaS/API com status page pública
- Produto crítico (infraestrutura, dev tools, pagamentos)
- Quando transparência operacional é vantagem competitiva

## Quando NÃO usar
- Sem status page real (não fake o sinal)
- Produto não-crítico (gera ansiedade desnecessária)
- Landing pré-MVP

## Props principais
- `status: "operational" | "degraded" | "outage"` — em produção, fetch da status page
- Cor semântica: green/amber/red
- Pulse animation via `animate-ping`

## Dependências
- Tailwind (animate-ping built-in)
- Sem lucide icons (só dot)

## Variações
- Auto-fetch status via useEffect + API
- Com timestamp da última verificação
- Link direto para incident em andamento

## Anti-patterns
- Status hardcoded "operational" mesmo em incidente real
- Sem aria-label descritivo (leitor de tela)
- Dot pequeno demais (< 8px)
