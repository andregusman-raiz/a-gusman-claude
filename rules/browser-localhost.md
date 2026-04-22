# Browser Localhost — Playwright MCP Obrigatorio

## Regra Principal
Para abrir, visualizar ou interagir com qualquer URL localhost, SEMPRE usar Playwright MCP.
NUNCA abrir browser do sistema (Safari, Chrome) via `open`, `xdg-open`, ou similar.

## Divisão canonical Playwright vs Chrome DevTools MCP (ADR-0001)

| Caso | Canonical | Razão |
|---|---|---|
| Navegação, clicks, forms, fluxo usuário | **Playwright MCP** | Snapshot a11y tree + headless rápido |
| Screenshots de regressão visual | **Playwright MCP** | `browser_take_screenshot` |
| Performance / LCP / CWV / trace | **Chrome DevTools MCP** (`debug-optimize-lcp`, `performance_start_trace`) | DevTools reais |
| A11y audit formal (WCAG) | **Chrome DevTools MCP** (`a11y-debugging`) | Lighthouse a11y score |
| Memory leak / heap snapshot | **Chrome DevTools MCP** (`memory-leak-debugging`) | `take_memory_snapshot` |
| Network inspection detalhada | **Chrome DevTools MCP** (`list_network_requests`) | Timing completo |
| Console messages/errors | Qualquer (Playwright `browser_console_messages` OU Chrome `list_console_messages`) | Escolha conveniência |

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
