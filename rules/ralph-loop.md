---
description: "Protocolo de refinamento iterativo para convergencia de qualidade"
paths:
  - "docs/**/*"
  - "specs/**/*"
  - "**/*.spec.*"
  - "**/*.test.*"
---

# Protocolo Ralph Loop

## Ciclo CREATE → EVALUATE → REFINE (max 3 iteracoes)
1. **CREATE**: Produza primeira versao
2. **EVALUATE**: Avalie contra criterios definidos
3. **REFINE**: Melhore baseado na avaliacao

## Regras
- **Track best, not latest** — se v3 piorou vs v2, use v2
- **Promessa de completude** — declare O QUE entrega, COMO avalia, QUANDO esta pronto
- **Verification-first** — reproduza o problema ANTES de corrigir. Meca ANTES de otimizar
