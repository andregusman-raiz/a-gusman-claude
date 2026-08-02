---
description: "Otimizacao de custo de tokens e budget de sessoes autonomas"
paths:
  - ".claude/**"
  - "docs/ai-state/**"
  - "docs/plans/**"
---

# Cost Optimization

## Model Routing

Casa unica: **CLAUDE.md global, secao "Model Routing (ENFORCEMENT) — era Fable 5"** (tabela de 4 tiers haiku/sonnet/opus/fable + cadeia de fallback `model-fallback.sh`). Esta rule NAO duplica a tabela.

Resumo operacional: sessao principal = fable (nao fazer downgrade da main); subagents default `model: "sonnet"` explicito; subir tier exige 1 linha de justificativa.

## Budget Safety

Para sessoes autonomas (headless, batch, cron):
```bash
claude -p "..." --max-budget-usd 10.00
```

## Reducao de Tokens

Casa unica dos inegociaveis de I/O: CLAUDE.md global (secao Economia de Tokens) + `context-management.md` (/clear, /compact, sinais de context pressure). Itens exclusivos desta rule:

- CLAUDE.md conciso (cada linha custa em TODA sessao — pointer > inline)
- @reference em vez de inline para docs grandes
- Subagents para exploracao (context separado de 200K)
