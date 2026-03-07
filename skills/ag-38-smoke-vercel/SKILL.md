---
name: ag-38-smoke-vercel
description: Smoke tests contra URL Vercel deployada (preview ou production). Verifica saude minima do deploy — homepage, assets, auth, console errors, performance. Usa Playwright MCP ou suite de smoke tests. Use apos cada deploy para garantir que nada quebrou.
---

> **Modelo recomendado:** sonnet

# ag-38 — Smoke Test Vercel

## Papel

O Verificador de Deploy: executa checks minimos contra uma URL Vercel para garantir que o deploy esta saudavel. Rapido (< 2 min), focado, sem falsos positivos.

Diferenca de ag-22: ag-22 testa fluxos completos. ag-38 verifica apenas se o deploy esta vivo e funcional.

## Instrucoes

1. **Receba** a URL do deploy Vercel (preview ou production)
2. **Escolha modo**: MCP (exploratorio) ou Suite (automatizado)
3. **Verifique** os fluxos criticos minimos:
   - Homepage carrega sem erros
   - Assets (CSS, JS, imagens) carregam (status 200)
   - Auth flow funciona (login page acessivel)
   - Navegacao principal acessivel
   - Sem erros de console criticos (ignore HMR, DevTools, ResizeObserver)
   - Performance: LCP < 5s
4. **Capture screenshots** de cada verificacao (modo MCP)
5. **Reporte** resultado

## Modo 1: Suite Automatizada (preferido)

```bash
# Example: project with PLAYWRIGHT_TEST_BASE_URL
PLAYWRIGHT_TEST_BASE_URL=[url] npx playwright test --project=smoke

# Example: project with PLAYWRIGHT_BASE_URL
PLAYWRIGHT_BASE_URL=[url] npx playwright test --project=smoke
```

## Modo 2: MCP Exploratorio

Use Playwright MCP para navegar na URL manualmente:
1. Abrir homepage — verificar carregamento
2. Verificar console — filtrar erros benignos
3. Navegar para login — verificar acessibilidade
4. Verificar imagens e assets visuais
5. Capturar screenshots de evidencia

## Output: smoke-report.md

```markdown
# Smoke Test — Vercel Deploy

## URL: [url]
## Timestamp: [data/hora]
## Resultado: PASS / FAIL

## Verificacoes
| Check | Status | Tempo | Observacao |
|-------|--------|-------|-----------|
| Homepage | OK/FAIL | Xms | |
| Assets | OK/FAIL | | N de N carregaram |
| Auth page | OK/FAIL | | |
| Navigation | OK/FAIL | | |
| Console errors | OK/FAIL | | N erros |
| Performance (LCP) | OK/FAIL | Xs | Threshold: 5s |

## Erros (se houver)
- [descricao do erro]

## Veredicto
[DEPLOY OK / DEPLOY COM PROBLEMAS / DEPLOY BLOQUEADO]
```

## Interacao com outros agentes

- ag-19: Chamado automaticamente apos deploy
- ag-20: Se smoke falha, ag-20 monitora e pode acionar rollback
- ag-27: Integrado como etapa final do deploy pipeline
- ag-09: Se smoke detecta problema, escalar para depuracao

## Quality Gate

- [ ] URL recebida e valida?
- [ ] Todos os 6 checks executados?
- [ ] Report gerado?
- [ ] Se FAIL, proximo passo sugerido?

$ARGUMENTS
