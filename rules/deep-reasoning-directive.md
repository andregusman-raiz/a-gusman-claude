---
description: "Protocolo 5 passos para skills opus / diagnostico profundo"
paths:
  - ".claude/skills/**"
---

# Deep Reasoning Directive

> Equivalente ao `reasoning_effort=xhigh` do Codex. Carregada por skills `model: opus`
> e tarefas que envolvem diagnostico profundo, arquitetura, ou planejamento multi-fase.

## Quando aplicar

Sempre que: diagnostico de bug nao trivial, design de SPEC/arquitetura, planejamento
de pipeline multi-PR, debate de trade-offs (mesa-redonda), escrita ou critica de skill,
auditoria arquitetural. Ou seja: **toda invocacao das 7 skills Opus** + qualquer prompt
que mencione "investigar profundo", "audit", "diagnostico".

## Protocolo de 5 passos (obrigatorio antes de propor solucao/diagnostico/plano)

1. **Exhaust** — listar 3+ hipoteses/alternativas/causas concorrentes. NAO parar na primeira plausivel.
2. **Verify** — para cada hipotese, buscar evidencia concreta via Read/Bash/grep/LSP. Nao especular sobre comportamento de codigo nao lido. Razao read:edit alvo >= 2:1.
3. **Falsify** — tentar quebrar cada hipotese antes de aceita-la. "Por que isso pode estar errado? Que dado refutaria?"
4. **Connect** — tracar cadeia causal completa: sintoma → mecanismo → causa raiz → fix proposto. Se nao consegue articular a cadeia, ainda nao entendeu.
5. **Report** — declarar confianca explicita ("alta/media/baixa baseada em X"). Se < 80%, propor mais investigacao em vez de chutar. NUNCA confundir "passou nos testes" com "esta correto".

## Anti-patterns proibidos

- Aceitar primeira hipotese plausivel sem listar concorrentes
- Pular Read do arquivo antes de Edit/diagnostico
- Declarar root cause sem evidencia em pelo menos 2 pontos da cadeia
- Reescrever symptoma em vez de fix de causa raiz
- "Passou nos testes" como prova de correcao (testes podem cobrir parcial)
- Plan sem listar trade-offs explicitos
- SPEC sem listar edge cases (5+ minimo)

## Prova de profundidade (output minimo)

Se a skill produz diagnostico/SPEC/plano, o output DEVE incluir:

- **Hipoteses consideradas**: lista com pelo menos 3
- **Evidencia citada**: paths + linhas para cada claim factual
- **Cadeia causal**: sintoma → causa → fix (ou: problema → solucao → impacto)
- **Trade-offs**: o que se ganha vs perde com a decisao
- **Confianca + lacunas**: o que ainda nao sabe; o que falta investigar

Outputs sem esses 5 elementos = trabalho raso = pedir refazer.

## Composicao com outras rules

- Herda Definition of Done do CLAUDE.md root (rodar check antes de declarar done)
- Compatível com `--draft` (modo rascunho pode skipar Verify aprofundada)
- Em conflito com pressa do usuario: priorizar protocolo, sinalizar custo de tempo, perguntar se aceita rascunho mais curto.

## Por que isso existe

Codex CLI tem dial `model_reasoning_effort = xhigh` que aloca mais compute para analise.
Claude Code nao tem dial equivalente — o modelo aloca raciocinio por heuristica interna.
Esta rule e o substituto: forca o protocolo de raciocinio profundo via instrucao no
prompt das skills criticas.
