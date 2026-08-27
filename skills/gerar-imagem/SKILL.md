---
name: gerar-imagem
description: Gera ou edita imagens com IA via OpenAI gpt-image-1 (default, funcionando) ou Nano Banana/Gemini (aguarda billing). Use quando o usuário pedir para gerar, criar, desenhar ou editar imagem, ilustração, logo, ícone, mockup visual, asset gráfico, foto sintética ou variação de imagem existente.
---

# Gerar Imagem — Nano Banana (Gemini) / OpenAI (gpt-image-1)

Dois providers com a mesma interface; chaves lidas em runtime — NUNCA ecoar a chave.

| Provider | Script | Chave (runtime) | Status |
|---|---|---|---|
| OpenAI `gpt-image-1` | `~/Claude/.claude/scripts/openai-image.sh` | `OPENAI_API_KEY` env → `~/.claude/state/openai-image.env` → `~/Claude/.env` | usar como default |
| Nano Banana (Gemini) | `~/Claude/.claude/scripts/nano-banana.sh` | `NANO_BANANA_API_KEY` env → `~/.claude/state/nano-banana.env` → `~/Claude/.env` | BLOQUEADO até billing no projeto Google (free tier = 0 p/ imagem) |

## Uso

```bash
# OpenAI — geração simples / paisagem / edição
bash ~/Claude/.claude/scripts/openai-image.sh -p "prompt detalhado em inglês" -o saida.png
bash ~/Claude/.claude/scripts/openai-image.sh -p "..." -s 1536x1024 -q high -o hero.png
bash ~/Claude/.claude/scripts/openai-image.sh -p "change background to teal" -i original.png -o editada.png

# Nano Banana (quando billing ativar) — aspect ratio + modelo pro
bash ~/Claude/.claude/scripts/nano-banana.sh -p "..." -a 16:9 -m pro -o hero.png
bash ~/Claude/.claude/scripts/nano-banana.sh -p "change background to teal" -i original.png -o editada.png
```

## Regras

1. **Prompt em inglês, descritivo e narrativo** (cena, estilo, iluminação, composição) — Nano Banana
   responde melhor a descrição de cena do que a lista de keywords. Incluir estilo explícito
   ("flat vector illustration", "photorealistic", "3D render", "isometric").
2. **Modelo**: `flash` (default, ~US$0,04/img) para tudo; `-m pro` só quando precisar de texto
   renderizado dentro da imagem ou fidelidade máxima (mais caro).
3. **Destino**: asset de projeto → `<projeto>/public/` ou `<projeto>/assets/`; exploração/rascunho →
   scratchpad da sessão. Nome descritivo, nunca `image.png`.
4. **Verificação obrigatória (DoD)**: após gerar, `Read` no PNG para conferir visualmente se atende
   ao pedido. Se não atende, refinar o prompt e regenerar (máx 3 iterações, depois reportar gap).
5. **Identidade Raiz**: se o asset for para projeto Raiz, usar tokens do design system no prompt
   (laranja #F7941D, teal #5BB5A2, estilo clean/minimal, IBM Plex como referência tipográfica).
6. **Edição**: para variação/retoque de imagem existente, SEMPRE passar a original via `-i` em vez
   de tentar regenerar do zero — preserva composição e identidade.
7. Aspect ratios suportados: 1:1 (default), 16:9, 9:16, 4:3, 3:4, 21:9, 2:3, 3:2, 4:5, 5:4.

## Erros comuns

- exit 3 = chave não encontrada → pedir ao usuário para exportar `GEMINI_API_KEY` ou gravar em `~/Claude/.env`.
- exit 4 + HTTP 429 = rate limit/quota da API Gemini → avisar usuário, não retentar em loop.
- exit 5 = modelo recusou gerar (safety) → mostrar a "nota do modelo" e ajustar o prompt.
