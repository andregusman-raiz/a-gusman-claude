---
description: "Playwright MCP obrigatorio para localhost (resumo inline no CLAUDE.md)"
paths:
  - "**/e2e/**"
  - "**/*.spec.ts"
  - "**/playwright.config.*"
  - "tests/**"
---

# Browser Localhost — Playwright MCP Obrigatorio

## Regra Principal
Para abrir, visualizar ou interagir com qualquer URL localhost, SEMPRE usar Playwright MCP.
NUNCA abrir browser do sistema (Safari, Chrome) via `open`, `xdg-open`, ou similar.

## Divisão canonical Playwright vs Chrome DevTools MCP (ADR-0001)

| Caso | Canonical | Razão |
|---|---|---|
| Navegação, clicks, forms, fluxo usuário | **Playwright MCP** | Snapshot a11y tree + headless rápido |
| Fetch/scrape/extração DOM/JS eval para agentes IA (sem pixel) | **playwright-obscura MCP** (Obscura via CDP) | ~30MB RAM/sessão, startup instantâneo, alta concorrência |
| Screenshots de regressão visual | **Playwright MCP** | `browser_take_screenshot` |
| Performance / LCP / CWV / trace | **Chrome DevTools MCP** (`debug-optimize-lcp`, `performance_start_trace`) | DevTools reais |
| A11y audit formal (WCAG) | **Chrome DevTools MCP** (`a11y-debugging`) | Lighthouse a11y score |
| Memory leak / heap snapshot | **Chrome DevTools MCP** (`memory-leak-debugging`) | `take_memory_snapshot` |
| Network inspection detalhada | **Chrome DevTools MCP** (`list_network_requests`) | Timing completo |
| Console messages/errors | Qualquer (Playwright `browser_console_messages` OU Chrome `list_console_messages`) | Escolha conveniência |

## Obscura — opção principal para automação IA (modo híbrido)

Obscura (`h4ckf0r0day/obscura`, browser headless em Rust, build pinado em `~/.claude/tools/obscura`) é a
**opção principal para usos de IA sem exigência de pixel**: fetch de página, scraping, extração de DOM,
`--eval` de JS, automação leve de agentes em massa. Servido via MCP `playwright-obscura`
(wrapper `.claude/scripts/obscura-mcp.sh` — sobe `obscura serve --port 9222` sob demanda e conecta
`@playwright/mcp --cdp-endpoint http://127.0.0.1:9222`).

**Continua no Chromium (plugin playwright oficial)** — NÃO migrar para Obscura:
- QAT visual / regressão de pixel / design review (engine de render própria, sem paridade com Chrome)
- Login persistente (`~/.cache/playwright-claude/` não é usado pelo CDP externo)
- Media playback, extensões, e fluxos que dependem de CDP completo (gaps conhecidos: `Target.getTargets`,
  interceptação de request com overrides — issues #569/#570 upstream)

CLI direto (fora do MCP, para scripts/agents): `~/.claude/tools/obscura/target/release/obscura fetch <url> --eval "..."`.
Auditoria supply-chain 2026-08-09: veredito CAUTION — manter pinado em tag, sem feature `stealth`, re-auditar antes de bump de versão.

## Economia de tokens: snapshot > screenshot
`browser_snapshot` (a11y tree, texto) e o DEFAULT para verificar estado da pagina.
`browser_take_screenshot` custa ~1-2k tokens/imagem — usar SO quando pixel/layout importa (regressao visual, design review).

## Modo de Execucao
- SEMPRE rodar em **headless** (minimizado, sem janela visivel)
- Configurado via `--headless` no plugin Playwright MCP
- Para visualizar o estado da pagina: usar `browser_snapshot` ou `browser_take_screenshot`

## Como abrir localhost
```
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:PORTA" })
```

## Operacoes disponiveis via Playwright MCP
| Acao | Tool |
|------|------|
| Navegar | `browser_navigate` |
| Screenshot | `browser_take_screenshot` |
| Snapshot (acessibilidade) | `browser_snapshot` |
| Clicar | `browser_click` |
| Preencher form | `browser_fill_form` |
| Console errors | `browser_console_messages` |
| Network requests | `browser_network_requests` |
| Avaliar JS | `browser_evaluate` |
| Redimensionar (mobile) | `browser_resize` |
| Fechar | `browser_close` |

## Portas conhecidas
| Porta | Projeto |
|-------|---------|
| 3000 | raiz-platform |
| 3001 | chamada-app |
| 3002 | automata |
| 3003 | totvs-educacional-frontend |
| 3004 | sophia-educacional-frontend |
| 4200 | raiz-agent-dashboard |

## NUNCA
- `open http://localhost:*` (abre browser do sistema, nao controlavel)
- `xdg-open http://localhost:*`
- Sugerir ao usuario abrir manualmente no browser
- Usar playwright-cli via Bash quando MCP esta disponivel (MCP e preferido)

## Fallback
Se Playwright MCP nao estiver disponivel na sessao → usar `playwright-cli` via Bash:
```bash
/opt/homebrew/bin/playwright-cli open http://localhost:PORTA
```
