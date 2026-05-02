---
name: ag-referencia-redesign-workflow
description: Workflow de redesign de UI a partir de screenshot ou URL. Input -> captura via Chrome DevTools MCP -> análise via Claude multimodal -> output estruturado (categoria + variante do design-library + preset estético + prompt otimizado). Complementa /ag-referencia-design-presentation (86 layouts) e /ag-referencia-prompt-guide (estrutura 6-blocos). Usar quando: (a) usuario fornece URL/screenshot e quer recriar com identidade rAIz, (b) quer refresh estetico de app existente, (c) quer migrar UI de outro design system para nossas variantes.
metadata:
  filePattern:
    - "**/redesign/**"
    - "**/screenshots/**"
  priority: 80
---

# Redesign Workflow — Screenshot → Variante + Preset + Prompt

> Diferencial real vs GlowUp UI: inputar screenshot/URL e receber **mapeamento preciso** para nossa biblioteca interna (86 variantes) + **prompt pronto** para regerar.
> Complementa /ag-referencia-design-presentation (taxonomia) e /ag-referencia-prompt-guide (estrutura de prompt).

---

## Quando usar

- Cliente/stakeholder manda screenshot pedindo "quero isso no nosso app"
- Cliente manda URL concorrente pedindo redesign competitivo
- App rAIz legado precisa refresh — captura tela atual, recomenda variante moderna
- Dev não sabe qual variante escolher — dá input visual, recebe sugestão

## Quando NÃO usar

- Componente isolado (botão, input) — usar /presentation direto por navegação
- Feature com business logic complexa — UI só cobre 20% do trabalho, o resto é domínio
- Projeto sem tokens rAIz — workflow pressupõe output adaptado ao design-system da empresa

---

## Entradas aceitas

| Tipo | Como fornecer | Ferramenta de captura |
|------|----------------|----------------------|
| URL pública | "redesign https://example.com" | Chrome DevTools MCP `navigate_page` + `take_screenshot` |
| URL localhost | "redesign http://localhost:3011/x" | idem |
| Screenshot upload | colar PNG/JPG na conversa | Claude multimodal direto (sem captura) |
| Path local | "redesign ~/screenshots/app.png" | Read tool direto |
| Figma URL | "redesign figma.com/file/..." | figma-implement-design skill primeiro |

---

## Pipeline de 5 passos

### 1. Captura

Se URL: Chrome DevTools MCP
```
mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page({ url: "..." })
mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_screenshot({ fullPage: true })
```

Se screenshot/upload: já está disponível, pular captura.

Salvar em `~/Claude/docs/diagnosticos/redesign-<timestamp>/input.png` para auditoria.

### 2. Análise visual (Claude multimodal)

Enviar screenshot com prompt estruturado de classificação:

```
Analise este screenshot e classifique:

1. Categoria dominante (escolha 1-2 de):
   - 01 Auth Forms (login, signup)
   - 02 Pricing
   - 03 Features/Bento
   - 04 Hero Sections
   - 05 CTA Banners
   - 06 Stats / Social Proof
   - 07 Nav Bars
   - 08 Testimonials
   - 09 Footer
   - 10 FAQ
   - 11 Onboarding (checklist, tour)
   - 12 Blog / Content
   - 13 Contact
   - 14 States (404, loading, empty)

2. Estilo estético percebido (escolha 1):
   - raiz-default: laranja + teal, rounded-xl, shadows sutis, Inter
   - minimalist: sem sombras, mono slate, tipografia fina
   - brutalist: rounded-none, borders pretas, shadows offset duros
   - glass: backdrop-blur, semi-transparent, glow
   - dark-mono: fundo quase-preto, zinc scale, branco puro como acento
   - soft-saas: pastéis lavanda/pêssego, rounded-3xl, shadows difusas
   - neobrutalism: rounded-md, shadows offset coloridas, pastéis saturados

3. Estrutura geométrica em 1 frase (ex: "split 50/50 form+hero", "3-tier cards", "bento 4-tile").

4. Tom/voz percebido (ex: "corporate B2B", "startup playful", "editorial", "gaming").

Output JSON:
{
  "category": "04 Hero Sections",
  "subtype_hint": "04b-split-text-image OR 04c-animated-gradient",
  "style": "raiz-default",
  "structure": "split 50/50 texto+screenshot",
  "voice": "SaaS corporate B2B",
  "confidence": "high|medium|low",
  "notes": "..."
}
```

### 3. Matching com design-library

Carregar `/ag-referencia-design-presentation` e mapear `subtype_hint` → variante específica do library (01a, 02a, 04b, etc).

Priorizar:
- Exact match (hint == variant id)
- Same category + closest structure
- Se confidence=low: sugerir top 3 variantes para o usuário escolher

### 4. Prompt geration

Usar `/ag-referencia-prompt-guide` template 6-blocos, preencher com:
- **Bloco 1 (Contexto)**: inferir do tom/voz detectado
- **Bloco 2 (Layout)**: structure detectada
- **Bloco 3 (Estilo)**: preset + tokens rAIz
- **Bloco 4 (Referências)**: variant id + screenshot original anexo
- **Bloco 5 (Constraints)**: stack rAIz padrão
- **Bloco 6 (Entregável)**: 1 TSX self-contained

### 5. Output estruturado

```markdown
## Redesign recomendado

**Input:** <URL ou path>
**Captura:** `~/Claude/docs/diagnosticos/redesign-<timestamp>/input.png`

### Classificação
- Categoria: **04 Hero Sections**
- Variante sugerida: **04b-split-text-image** (alternativas: 04c, 04e)
- Preset estético: **raiz-default**
- Confidence: high

### Preview da variante sugerida
http://localhost:3011/presentation/hero/04b-split-text-image

### Prompt pronto para colar

<código do prompt estruturado>

### Próximos passos
1. Abrir URL de preview para confirmação visual
2. Se não bateu → trocar preset ou variante na lista de alternativas
3. Colar o prompt em Cursor/Lovable/v0 + screenshot original
4. Commit do arquivo gerado em `app/(seu-path)/page.tsx`
```

---

## Chamadas concretas

### Via CLI direto (via Skill)

```
/ag-referencia-redesign-workflow https://stripe.com/pricing
```

(esta skill carrega instruções; a execução acontece em sessão ativa Claude Code com os MCPs necessários)

### Via machine builder

```
/ag-1-construir redesign https://example.com
```

ag-1-construir invoca este workflow, gera output estruturado, e opcionalmente cria o arquivo TSX final no projeto alvo.

### Via página /presentation/redesign (futuro)

App catalog expõe upload/URL input que roda o pipeline via Server Action + Claude API. Retorna cards com recomendações interativas.

---

## Anti-patterns

### Confiar cegamente na classificação

Modelo pode confundir estruturas similares (bento 4-tile vs icon grid 3x3). Sempre mostrar **alternativas** quando confidence != high.

### Ignorar tom/voz

Pricing "startup playful" (pastéis, emoji) vs "enterprise B2B" (linhas limpas, sem imagens humanas) mapeiam para variantes visuais diferentes. Voice guide a escolha de preset.

### Screenshot parcial

Se usuário só manda hero, não tentar recomendar a "landing completa". Escopar ao que foi mostrado.

### Stack mismatch

Se screenshot vem de site com MUI/Chakra/Bootstrap e projeto alvo é shadcn+Tailwind, o prompt deve **traduzir** intenção visual, não replicar código-fonte original. Não prometer "1:1 pixel perfect" quando o stack muda.

---

## Integração com outras skills

| Skill | Quando |
|-------|--------|
| `/ag-referencia-design-presentation` | Sempre — fornece mapa das 86 variantes |
| `/ag-referencia-prompt-guide` | Sempre — fornece template do bloco final |
| `/ag-11-ux-ui` | Se quiser gerar variação custom não existente no library |
| `figma-implement-design` | Se input é Figma URL |
| `chrome-devtools-mcp:chrome-devtools` | Para capturar URL |
| `claude-api` | Se implementar pipeline server-side via página `/presentation/redesign` |

---

## Formato de output padrão (para machines consumirem)

```json
{
  "input": {
    "type": "url|screenshot|figma",
    "source": "...",
    "capturedAt": "~/Claude/docs/diagnosticos/redesign-2026-04-24-1234/input.png"
  },
  "classification": {
    "category": "04 Hero Sections",
    "suggestedVariant": "04b-split-text-image",
    "alternatives": ["04c-animated-gradient", "04e-product-screenshot-below"],
    "preset": "raiz-default",
    "structure": "split 50/50 texto+screenshot",
    "voice": "SaaS corporate B2B",
    "confidence": "high"
  },
  "previewUrl": "http://localhost:3011/presentation/hero/04b-split-text-image",
  "prompt": "<string longa do prompt 6-blocos>",
  "nextSteps": ["...", "..."]
}
```

---

## Observações de implementação

### Via Chrome DevTools MCP

Usar `performance_start_trace` opcional se for redesign que exige análise de perf (LCP/CLS), não apenas visual.

### Via Claude API (quando builda página /presentation/redesign)

- Upload direto do screenshot como base64
- Modelo: Claude Opus para análise visual de alta fidelidade, Sonnet para casos simples
- Prompt caching em partes estáticas (lista de categorias e presets)
- Streaming opcional para UX melhor

### Custo

- 1 analysis ≈ 2-5k tokens (screenshot + prompt + resposta)
- Cache estático (categorias + presets) reutilizado entre calls
- 100 redesigns/dia ≈ $0.50-1.00 em API calls

---

## Limitações conhecidas

- Screenshots muito grandes (>2000×3000) podem ser downsampled pelo Claude — perda de detalhe de tipografia fina
- Sites com heavy animações só capturam um frame estático
- PDFs/PowerPoints: pedir conversão manual para PNG primeiro
- Figma: preferir `figma-implement-design` skill antes, só usar este workflow como fallback
