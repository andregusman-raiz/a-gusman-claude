---
name: youtube-transcript
description: Extrai transcript de video do YouTube via yt-dlp (legenda manual > auto) e entrega .md cacheado para leitura. Use quando o usuario pedir para resumir/analisar/transcrever video do YouTube, "o que diz esse video", ou colar URL youtube.com/youtu.be querendo o CONTEUDO falado. NAO usar para baixar video/audio, nem para paginas web comuns (WebFetch).
---

# YouTube Transcript — yt-dlp local

Converte video YouTube em transcript `.md` denso ANTES de ler — nunca WebFetch/browser na pagina do YouTube para extrair conteudo falado (nao funciona e desperdica tokens).

> Origem: absorcao minima do gap identificado na avaliacao do Agent-Reach (2026-08-06, veredito P2/ignorar). Sem skill de terceiro no harness; so yt-dlp (ja instalado via brew).

## Uso

```bash
bash ~/Claude/.claude/scripts/yt-transcript.sh <url-ou-video-id> [sub-langs]
# sub-langs default: "pt.*,pt,en.*,en"
```

- Output: caminho do `.md` em `~/Claude/.cache/yt-transcripts/<video-id>.md` (cache — 2a chamada e instantanea).
- O `.md` traz titulo, canal, data, duracao, idioma da legenda e o transcript limpo (sem timestamps, dedupe do rolling das auto-captions).

## Fluxo canonico

1. Rodar o script; capturar o path impresso.
2. **Grep/Read parcial** no `.md` — video longo (>30min) pode passar de 500 linhas; aplicar economia de tokens padrao (Grep antes de Read, `offset`/`limit`).
3. Sintetizar a resposta; citar o path do transcript.

## Erros

| Exit | Significado | Acao |
|---|---|---|
| 2 | yt-dlp ausente | `brew install yt-dlp` |
| 3 | nao extraiu video id | conferir URL |
| 4 | video sem legenda (manual ou auto) | reportar ao usuario; fallback = baixar audio e transcrever local (sistema escuta / whisper Metal — ver memory `gotcha_transcricao_arquivo_longo_ram_safe`) |
| 1 + "HTTP Error 429" | throttle YouTube no endpoint de legendas (per-IP, agressivo) | aguardar 60-90s e re-tentar UMA vez; nao martelar. O script ja mitiga (player_client=android, sleep-subtitles 2, lista curta de langs — NUNCA wildcard `pt.*`, que casa tracks auto-traduzidos e multiplica requests) |

## Limites

- So legendas ja existentes no YouTube (manuais ou auto-geradas). Video sem legenda => fallback whisper local, nunca silencioso.
- Read-only; nao baixa video/audio.
- Playlist: rodar 1 chamada por video (o script aceita 1 id por vez).
