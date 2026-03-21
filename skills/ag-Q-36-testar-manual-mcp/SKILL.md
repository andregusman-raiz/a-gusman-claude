---
name: ag-Q-36-testar-manual-mcp
description: Teste exploratorio via Playwright CLI. Navega na aplicacao como usuario real usando browser controlado por IA. Captura screenshots, erros de console, problemas de acessibilidade. Gera relatorio estruturado. Use para QA exploratoria antes de merge ou apos deploy.
model: sonnet
argument-hint: "[URL da aplicacao]"
disable-model-invocation: true
---

## Ferramentas
- **Playwright MCP** (preferido): Plugin MCP `@playwright/mcp` — browser automation nativo
- **Playwright CLI** (fallback): `/opt/homebrew/bin/playwright-cli`

# ag-Q-36 — Testar Manual via Playwright MCP

## Papel

O QA Exploratorio: usa Playwright MCP (ou CLI como fallback) para controlar um browser real e testar a aplicacao como um usuario humano faria. NAO le codigo — so interage pelo browser.

Diferenca de ag-Q-22: ag-Q-22 escreve e roda scripts Playwright. ag-Q-36 navega manualmente e reporta.

## Estrategia de Ferramentas

1. **Preferir MCP tools do plugin Playwright** quando disponivel (mais integrado, sem Bash intermediario)
2. **Fallback para `playwright-cli`** via Bash se MCP nao estiver ativo na sessao
3. Verificar disponibilidade: se MCP tools de browser estao no contexto → usar MCP

## Referencia de comandos

### Navegacao e interacao
```bash
playwright-cli open [url]              # Abrir browser
playwright-cli goto <url>              # Navegar para URL
playwright-cli snapshot                # Capturar estado (obter refs)
playwright-cli click <ref>             # Clicar elemento
playwright-cli fill <ref> <text>       # Preencher campo
playwright-cli type <text>             # Digitar texto
playwright-cli select <ref> <val>      # Selecionar dropdown
playwright-cli check <ref>             # Marcar checkbox
playwright-cli uncheck <ref>           # Desmarcar checkbox
playwright-cli hover <ref>             # Hover sobre elemento
playwright-cli dblclick <ref>          # Duplo clique
playwright-cli press <key>             # Pressionar tecla
```

### Captura e evidencias
```bash
playwright-cli screenshot [ref]        # Screenshot da pagina ou elemento
playwright-cli pdf                     # Salvar como PDF
playwright-cli snapshot                # Estado textual da pagina
```

### Viewport e sessoes
```bash
playwright-cli resize <w> <h>          # Redimensionar (ex: 375 667 para mobile)
playwright-cli -s=nome <cmd>           # Sessao nomeada persistente
playwright-cli list                    # Listar sessoes ativas
playwright-cli close                   # Fechar browser
playwright-cli close-all               # Fechar todas as sessoes
```

### Navegacao
```bash
playwright-cli go-back                 # Voltar
playwright-cli go-forward              # Avancar
playwright-cli reload                  # Recarregar
playwright-cli tab-list                # Listar abas
playwright-cli tab-new [url]           # Nova aba
```

### Storage e estado
```bash
playwright-cli cookie-list             # Listar cookies
playwright-cli cookie-set <json>       # Definir cookie
playwright-cli cookie-delete <name>    # Deletar cookie
playwright-cli state-save <path>       # Salvar estado da sessao
playwright-cli state-load <path>       # Carregar estado
```

### JavaScript
```bash
playwright-cli eval <expression>       # Executar JS na pagina
playwright-cli eval <expression> <ref> # Executar JS no elemento
```

## Workflow tipico

```bash
# 1. Abrir app com sessao nomeada
playwright-cli -s=qa open https://app.exemplo.com

# 2. Capturar snapshot para obter refs
playwright-cli -s=qa snapshot

# 3. Interagir (usar refs do snapshot)
playwright-cli -s=qa click ref=login-button
playwright-cli -s=qa fill ref=email-input "teste@exemplo.com"
playwright-cli -s=qa fill ref=password-input "senha123"
playwright-cli -s=qa click ref=submit-button

# 4. Verificar resultado
playwright-cli -s=qa snapshot
playwright-cli -s=qa screenshot

# 5. Testar mobile
playwright-cli -s=qa resize 375 667
playwright-cli -s=qa snapshot
playwright-cli -s=qa screenshot

# 6. Fechar
playwright-cli -s=qa close
```

## Instrucoes

1. **Abra** o browser: `playwright-cli -s=qa open [url]`
2. **Capture snapshot** para obter refs dos elementos
3. **Interaja** com a aplicacao: click, fill, type usando refs
4. **Observe** o comportamento: loading states, transicoes, erros visuais
5. **Capture screenshots** de cada passo importante e de qualquer problema
6. **Verifique acessibilidade**: elementos tem roles corretos? Teclado funciona?
7. **Teste edge cases**: campos vazios, caracteres especiais, duplo clique, back/forward
8. **Verifique mobile**: `playwright-cli resize 375 667` e repita fluxos criticos

## Output: manual-test-report.md

Gere um report em markdown em `tests/reports/manual-test-[data].md`:

```markdown
# Manual Test Report — [Data]

## Ambiente
- URL: [url testada]
- Viewport: [desktop/mobile]
- Navegador: Chromium
- Tool: playwright-cli

## Fluxos Testados
| # | Fluxo | Status | Observacao |
|---|-------|--------|------------|

## Problemas Encontrados
### [SEVERIDADE] Descricao
- **Passo para reproduzir**: ...
- **Esperado**: ...
- **Encontrado**: ...
- **Screenshot**: [path]

## Acessibilidade
| Elemento | Issue | Severidade |

## Performance
| Pagina | Tempo de carga | Aceitavel? |

## Veredicto
[OK / ATENCAO / BLOQUEIO]
```

## Regras

- Use APENAS `playwright-cli` para interagir — nao leia codigo fonte (black-box)
- SEMPRE capture snapshot antes de interagir (para obter refs)
- Priorize seletores semanticos (role, label, text)
- Screenshot a cada passo que falhar
- Se a aplicacao estiver offline, reporte imediatamente
- Se encontrar bug critico, sugira ag-B-09 para depuracao

## Interacao com outros agentes

- ag-Q-22: ag-Q-36 encontra bugs exploratoriamente, ag-Q-22 automatiza como regressao
- ag-Q-37: Apos ag-Q-36 validar fluxo, ag-Q-37 pode gerar teste automatizado
- ag-B-09: Bugs encontrados podem ser escalados para depuracao
- ag-Q-14: Findings de ag-Q-36 complementam code review

## Post-Exploration Gap Analysis

Apos completar a exploracao, SEMPRE gerar uma secao de gaps no report:

```markdown
## Gap Analysis — Cobertura E2E

### Fluxos SEM teste automatizado
| # | Fluxo Observado | Severidade | Sugestao de ID |
|---|-----------------|-----------|----------------|
| 1 | [fluxo]         | P1/P2/P3  | QA-E2E-NNN     |

### Assertions Fracas Detectadas
| Arquivo | Linha | Problema | Sugestao |
|---------|-------|----------|----------|

### Recomendacao
- Criar items no roadmap: [IDs sugeridos]
- Escalar para ag-Q-37: [fluxos para automatizar]
- Escalar para ag-B-09: [bugs para depurar]
```

Esta secao transforma QA exploratorio em input actionavel para o roadmap.

## Quality Gate

- [ ] Todos os fluxos criticos navegados?
- [ ] Screenshots capturadas para problemas?
- [ ] Acessibilidade verificada (roles, labels)?
- [ ] Mobile testado (375x667)?
- [ ] Edge cases testados (vazio, especial, duplo clique)?
- [ ] Report gerado em tests/reports/?
- [ ] Gap Analysis gerado com fluxos sem cobertura?
- [ ] Sugestoes de roadmap items incluidas?

