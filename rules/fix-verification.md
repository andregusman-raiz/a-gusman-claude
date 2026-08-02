---
description: "Fix so e completo com verificacao interativa Playwright"
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.py"
---

# Fix Verification Protocol

NUNCA declarar bug fix completo sem verificacao interativa do ponto de vista do USUARIO. Build + typecheck passando NAO e suficiente.

## Protocolo (CADA fix)

1. **Reproduzir o bug** via Playwright (localhost/preview), screenshot ANTES.
2. Aplicar o fix.
3. **Repetir os passos** — bug NAO acontece, screenshot DEPOIS. Verificar que os DADOS estao corretos, nao so que "a pagina carrega".
4. **Testar interacao adjacente** (trocar filtro/tab/dropdown) — fix nao quebrou o vizinho.
5. **Tracar cadeia de dados** quando aplicavel: API → adapter → context → page → DOM (mesmo dado em cada ponto).

## Anti-patterns (NUNCA)

- Verificar PRESENCA em vez de CORRETUDE ("carrega sem crash" ≠ "mostra dados da turma certa")
- API isolada como prova de fluxo E2E (curl 200 ≠ dropdown correto)
- Build+typecheck como prova de fix
- Regex sintatica como prova semantica (`tem numeros` ≠ `numero confere com a API`)
- Testar estado inicial sem testar interacao

## Ferramenta por tipo de bug

UI/navegacao → Playwright MCP | Performance/CWV → `chrome-devtools-mcp:debug-optimize-lcp` | A11y → `chrome-devtools-mcp:a11y-debugging` | Memory leak → `chrome-devtools-mcp:memory-leak-debugging` | Network/API → `chrome-devtools-mcp` (list_network_requests) | E2E sem causa obvia → `vercel:verification` | Erro em prod → `sentry:seer`.

Enforcement: ag-corrigir-bugs e ag-4-teste-final seguem este protocolo; PRs de fix incluem screenshots antes/depois.
