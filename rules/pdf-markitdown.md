---
description: "100% dos PDFs via markitdown antes de leitura (resumo inline no CLAUDE.md)"
paths:
  - "**/*.pdf"
  - "**/*.PDF"
---

# PDF → Markdown via markitdown (obrigatório)

> 100% dos PDFs consumidos por Claude Code passam por `microsoft/markitdown` ANTES de qualquer
> leitura textual. Read multimodal de PDF custa ~1.5-2k tokens/página (renderizado como imagem);
> o `.md` extraído custa fração disso e é cacheável/grepável.
> Enforcement: hook `pdf-read-guard.sh` (PreToolUse Read, bloqueante).

## Regra

Antes de ler conteúdo de qualquer `*.pdf`:

```bash
bash ~/Claude/.claude/scripts/pdf2md.sh <arquivo.pdf>   # gera <arquivo>.md ao lado
# depois: Read/Grep no .md gerado — NUNCA Read direto no .pdf para extrair texto
```

O script:
- Salva `<basename>.md` no mesmo diretório do PDF (ou path custom no 2º arg)
- **Cache**: se o `.md` já existe e é mais novo que o PDF, reusa sem reconverter
- Injeta header de proveniência (`<!-- gerado por markitdown de X em DATA -->`)
- Reporta chars + tokens estimados na saída

## Decisão: texto vs visual

| Necessidade | Caminho |
|---|---|
| Extrair texto, tabelas, conteúdo (relatórios, contratos, manuais, specs, KBs) | `pdf2md.sh` → Read/Grep no `.md` (**default, 100% dos casos textuais**) |
| Análise VISUAL (layout, design de slides, gráficos como imagem, review PPTX→PDF) | Converter PRIMEIRO (registro + texto barato), depois Read multimodal do PDF com `pages` — o guard libera automaticamente quando o `.md` existe |
| PDF escaneado sem camada de texto (pdf2md exit 3) | `PDF_VISUAL=1` + Read multimodal com `pages` (máx 20/request) |
| Buscar termo em N PDFs | Converter todos em loop, depois `grep` nos `.md` |

A exceção visual NÃO anula a regra: a conversão acontece sempre que possível; o Read
multimodal é um PASSO ADICIONAL para o que o texto não captura (posicionamento, cor, imagem).

## Enforcement (hook `pdf-read-guard.sh`)

- `PreToolUse(Read)` bloqueante (exit 2) quando `file_path` termina em `.pdf` e NÃO existe
  `<basename>.md` mais novo que o PDF
- Libera automaticamente quando o `.md` convertido existe (leitura visual deliberada)
- Bypass pontual: `PDF_VISUAL=1` | Bypass de sessão: `PDF_GUARD_DISABLED=1` (R3 harness-coverage)

## Outros formatos (secundário, mesmo racional)

markitdown também converte `docx`, `pptx`, `xlsx`, `html`, `epub`. Para extração PURAMENTE
textual desses formatos, preferir markitdown ao parse manual. As skills `docx`/`pptx`/`xlsx`
continuam canônicas para CRIAR/EDITAR — markitdown é só para CONSUMIR conteúdo.

## Instalação

```bash
uv tool install "markitdown[all]"   # binário em ~/.local/bin/markitdown
```

Instalado em 2026-06-07. Fallback do script: `uvx markitdown[all]`.

## Anti-patterns

- Read direto de `.pdf` para "ver o que tem dentro" → converter primeiro
- Reconverter PDF já convertido (ignorar cache) → o script já resolve
- Colar conteúdo extraído inline em prompt de subagent → passar o PATH do `.md`
- Editar o `.md` gerado manualmente → ele é artefato derivado; a fonte é o PDF
- Pular conversão "porque é só 1 página" → 1 página visual ≈ 1.5-2k tokens; o `.md` ≈ 200-400

## Composição

- `cost-optimization.md` — mesma família (redução de tokens)
- `feedback_screenshot_review_loop` (memory) — review visual de PPTX→PDF continua via Read
  multimodal; este caminho é a EXCEÇÃO visual prevista acima e não é bloqueado após conversão
- Machines ag-0..ag-14 — pointer obrigatório no SKILL.md de cada uma
