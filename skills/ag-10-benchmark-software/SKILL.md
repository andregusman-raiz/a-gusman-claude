---
name: ag-10-benchmark-software
description: Maquina de benchmark de software. Crawl SaaS plataformas — navigate all pages, screenshot, analyze with AI, generate detailed SPEC
user_invocable: true
model: opus
---

# ag-10-benchmark-software — BENCHMARK Machine

Maquina replicavel para navegar, documentar e especificar qualquer plataforma SaaS.

## Uso

```
/crawl-platform <nome> <url> [--max-pages N] [--depth N]
```

Exemplos:
```
/crawl-platform gupy https://app.gupy.io
/crawl-platform reportei https://app.reportei.com --max-pages 30
/crawl-platform qrcodefacil https://qrcodefacil.com --depth 2
```

## Algoritmo

Ao receber este comando, execute o seguinte processo EXATAMENTE:

### FASE 0: Setup

1. Parsear argumentos: `name` (1o arg), `url` (2o arg), flags opcionais
2. Defaults: `maxPages=50`, `depth=3`
3. Criar diretorio de output:
   ```
   ~/Claude/projetos/vibecoding-roadmap/docs/specs/{name}/
   ~/Claude/projetos/vibecoding-roadmap/docs/specs/{name}/screenshots/
   ~/Claude/projetos/vibecoding-roadmap/docs/specs/{name}/screens/
   ```
4. Ler config se existir: `~/Claude/projetos/vibecoding-roadmap/src/lib/crawler/configs/{name}.json`
5. Inicializar contadores: `visited=0`, `queue=[]`, `pages=[]`

### FASE 1: Login

1. Navegar para a URL fornecida:
   ```
   mcp__plugin_playwright_playwright__browser_navigate({ url: "<url>" })
   ```
2. Tirar screenshot da tela de login:
   ```
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "docs/specs/{name}/screenshots/000-login.png" })
   ```
3. Pedir ao usuario: **"Faca login na plataforma. Quando estiver logado, me avise."**
4. Aguardar resposta do usuario
5. Apos confirmacao, tirar screenshot da pagina pos-login:
   ```
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "docs/specs/{name}/screenshots/001-home.png" })
   ```

### FASE 2: Crawl (BFS)

Para cada pagina na fila (comecando pela pagina pos-login):

1. **Capturar estado da pagina:**
   ```
   mcp__plugin_playwright_playwright__browser_snapshot()
   ```
   → Salvar snapshot (accessibility tree com refs)

2. **Screenshot:**
   ```
   mcp__plugin_playwright_playwright__browser_take_screenshot({
     type: "png",
     filename: "docs/specs/{name}/screenshots/{NNN}-{slug}.png"
   })
   ```

3. **Extrair dados via JavaScript:**
   ```
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "<EXTRACT_LINKS_JS from engine.ts>"
   })
   ```
   Repetir para: EXTRACT_FORMS_JS, EXTRACT_TABLES_JS, EXTRACT_META_JS

4. **Descobrir links navegaveis:**
   - Filtrar: mesmo dominio, nao visitado, nao em ignorePaths
   - Adicionar a fila se depth < maxDepth

5. **Interagir com elementos na pagina (se habilitado):**
   - Clicar em tabs nao selecionadas → screenshot de cada tab
   - Abrir dropdowns → screenshot do estado expandido
   - NUNCA submeter formularios ou clicar em "Delete", "Remove", "Excluir"

6. **Registrar PageState** com todos os dados coletados

7. **Navegar para proximo item da fila:**
   ```
   mcp__plugin_playwright_playwright__browser_navigate({ url: "<next_url>" })
   ```
   Aguardar `waitAfterNavigate` ms

8. **Reportar progresso** a cada 5 paginas:
   "Progresso: {visited}/{total} paginas visitadas. Ultimo: {titulo}"

9. **Parar quando:** fila vazia OU visited >= maxPages

### FASE 3: Analise

Para cada PageState coletado:

1. **Ler o screenshot** correspondente (Read tool no PNG)
2. **Analisar com AI** usando o prompt de `buildAnalysisPrompt()` de engine.ts
3. **Classificar:** pageType, module, complexity
4. **Descrever:** o que o usuario ve, acoes disponiveis, dados exibidos
5. **Identificar features:** nome, descricao, inputs, outputs, fluxo
6. **Salvar analise** em `docs/specs/{name}/screens/{NNN}-{slug}.md`

### FASE 4: Geracao de SPEC

1. **sitemap.md** — Lista hierarquica de todas as paginas descobertas com tipo e modulo
2. **features.md** — Inventario completo de features por modulo
3. **flows.md** — Fluxos de usuario em formato Mermaid (usar mcp__mermaid__generate)
4. **data-model.md** — Entidades e campos inferidos dos formularios e tabelas
5. **spec-completa.md** — Documento consolidado com tudo acima + observacoes UX
6. **README.md** — Resumo executivo (3-5 paragrafos)

### FASE 5: Report

Exibir ao usuario:
- Total de paginas visitadas
- Total de screenshots
- Total de features identificadas
- Modulos descobertos
- Path do output: `docs/specs/{name}/`

---

## Regras Criticas

1. **READ-ONLY** — NUNCA submeter formularios, clicar em delete, alterar dados
2. **Respeitar maxPages** — Parar ao atingir o limite, nao ficar em loop infinito
3. **Deduplicar URLs** — Normalizar antes de adicionar a fila
4. **Ignorar externos** — Nao sair do dominio da plataforma
5. **Screenshots organizados** — Numerados sequencialmente (000, 001, 002...)
6. **Analise detalhada** — Cada campo, botao, coluna deve ser documentado
7. **Salvar progresso** — Se interrompido, os screenshots e analises parciais ficam
8. **Perguntar ao usuario** — Se encontrar paywall, 2FA, ou bloqueio, parar e perguntar

---

## Output Esperado

```
docs/specs/{name}/
├── README.md              — Resumo executivo
├── sitemap.md             — Mapa completo de paginas
├── features.md            — Inventario de features
├── screens/               — Analise detalhada de cada tela
│   ├── 001-home.md
│   ├── 002-dashboard.md
│   └── ...
├── screenshots/           — PNGs de cada tela
│   ├── 000-login.png
│   ├── 001-home.png
│   └── ...
├── flows.md               — Fluxos Mermaid
├── data-model.md          — Entidades inferidas
└── spec-completa.md       — SPEC consolidada
```

## Referencia Tecnica

- Tipos: `~/Claude/projetos/vibecoding-roadmap/src/lib/crawler/types.ts`
- Engine (JS snippets, prompts): `~/Claude/projetos/vibecoding-roadmap/src/lib/crawler/engine.ts`
- Configs: `~/Claude/projetos/vibecoding-roadmap/src/lib/crawler/configs/{name}.json`
