---
description: "Quando ACIONAR chrome-devtools-mcp proativamente (perf/a11y/memory/network) — gatilhos por sintoma, sem o usuario nomear a ferramenta"
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.ts"
  - "**/*.css"
  - "src/app/**"
  - "app/**"
  - "components/**"
  - "pages/**"
---

# Chrome DevTools MCP — Ativacao Proativa

> O MCP `chrome-devtools-mcp` ja esta ATIVO (1 dos 12 plugins). Esta rule define
> QUANDO liga-lo **sem o usuario pedir** — diagnostico de pixel/perf/memoria/rede
> numa pagina REAL. Roteamento canonico (reativo) fica em `plugin-routing.md`.

## Principio de fronteira (decisivo)

- **Playwright MCP** = automacao de FLUXO: navegar, clicar, preencher, login, screenshot de jornada, E2E/QAT. **Default para browser localhost.**
- **chrome-devtools-mcp** = DIAGNOSTICO de baixo nivel: por que esta lento, por que vaza memoria, a11y, waterfall de rede, runtime/console na pagina real.

Regra de 1 linha: *fluxo → Playwright; "por que esta assim?" (perf/a11y/memory/network) → chrome-devtools*.

## Gatilhos — ACIONAR automaticamente quando

| Sinal do usuario / observacao | Sub-rota do MCP |
|---|---|
| "ta lento", "demora pra carregar", "trava ao abrir", LCP/CLS/INP ruim, Lighthouse perf baixo, jank/scroll travado | `chrome-devtools-mcp:debug-optimize-lcp` (trace + Core Web Vitals + long tasks) |
| "trava depois de um tempo", aba comendo RAM, suspeita de leak, listener/timer acumulando | `chrome-devtools-mcp:memory-leak-debugging` (heap snapshots + retained objects) |
| "acessibilidade", leitor de tela, contraste, ARIA, ordem de foco, navegacao por teclado | `chrome-devtools-mcp:a11y-debugging` (arvore de a11y) |
| request travado/lento, waterfall, headers, debug de runtime/console numa pagina ja rodando | `chrome-devtools-mcp:chrome-devtools` (network + runtime) |

## Pre-condicoes antes de acionar

1. **Precisa de URL viva** (localhost ou publica). Se for localhost e o dev server nao esta up → subir antes (porta canonica em `ports-projects.md`).
2. **Nao acionar para automacao de fluxo** — isso e Playwright. Acionar so para medir/inspecionar.
3. **Mediu, agora aja** — apos o diagnostico, traduzir o achado em fix de codigo (ex: LCP ruim → `next/image priority`, `preload`, code-split). O MCP mede; o fix e codigo.

## Onde isto ja esta embutido (nao re-acionar manualmente)

- `ag-otimizar-codigo` → ja chama `debug-optimize-lcp` para render perf/LCP.
- `ag-11-ux-ui` + `ag-referencia-redesign-workflow` → ja usam o MCP para captura/DOM/CSS de URL.
- `ag-avaliar-observabilidade` → dimensao METRICS (Web Vitals/Lighthouse) usa o MCP.

## NUNCA

- Usar chrome-devtools-mcp para logar/clicar/preencher fluxo (e Playwright).
- Acionar sem URL rodando (vai falhar — subir dev server antes).
- Medir e parar — diagnostico sem fix proposto e teatro.
