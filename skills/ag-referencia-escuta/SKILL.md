---
name: ag-referencia-escuta
description: Reference skill — sistema escuta (gravacao/transcricao local com daemon macOS)
model: sonnet
version: "1.0"
context: fork
user-invocable: false
---

# Skill: Escuta — Sistema de Transcricao Local

Referencia para acessar e consultar dados do sistema `escuta` em sessoes Claude Code.

## O que e o sistema escuta

Daemon macOS de transcricao ambiente continua:
- Captura audio do microfone INTECK continuamente via `sounddevice`
- Processa VAD (silero) + ASR (whisper-server local) em background
- Persiste segmentos transcritos no SQLite com FTS5
- Organiza em blocos (reuniao/ambiente) e escreve no vault Obsidian 25-Escuta
- Nunca persiste audio cru — apenas texto transcrito

## DB path

```
~/.local/share/escuta/escuta.db
```

Sempre abrir em modo read-only para nao competir com o daemon:
```python
import sqlite3
conn = sqlite3.connect("file:~/.local/share/escuta/escuta.db?mode=ro", uri=True)
```

## Schema (4 tabelas principais)

### segments
```sql
CREATE TABLE segments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ts_start        TEXT NOT NULL,      -- ISO8601 UTC, ex: "2026-06-12T14:30:00.123456"
    ts_end          TEXT NOT NULL,
    text            TEXT NOT NULL,      -- texto transcrito
    device          TEXT NOT NULL,      -- nome do dispositivo de audio
    event_id        TEXT,               -- FK para events (pode ser NULL)
    block_id        INTEGER,            -- FK para blocks (NULL se nao agrupado, -1 se descartado)
    no_speech_prob  REAL DEFAULT 0.0,
    avg_logprob     REAL DEFAULT 0.0,
    embedding       BLOB,               -- embedding de voz TEMPORARIO (apagado pos-clustering)
    embedding_confidence REAL,
    speaker_label   TEXT,               -- "A"/"B"/nome do speaker apos diarizacao
    speaker_id      INTEGER,            -- FK para speakers
    speaker_conf    REAL,               -- v5: confianca 0-1 da atribuicao
    speaker_source  TEXT,               -- v5: acoustic|text|fused|conflict|none|manual
    speaker_locked  INTEGER DEFAULT 0   -- v10: 1 = edicao manual; diarizacao NAO sobrescreve
);

-- FTS5 virtual table para busca full-text
CREATE VIRTUAL TABLE segments_fts USING fts5(text, content=segments, content_rowid=id);
```

### events (calendario)
```sql
CREATE TABLE events (
    id              TEXT PRIMARY KEY,   -- ID do evento do Google Calendar
    title           TEXT NOT NULL,
    ts_start        TEXT NOT NULL,
    ts_end          TEXT NOT NULL,
    attendees_json  TEXT DEFAULT '[]'   -- JSON array de emails
);
```

### blocks (grupos de segmentos)
```sql
CREATE TABLE blocks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    kind            TEXT NOT NULL,      -- "ambiente" | "reuniao"
    ts_start        TEXT NOT NULL,
    ts_end          TEXT,               -- NULL se ainda aberto
    summary_md      TEXT,               -- resumo gerado por LLM
    summary_attempts INTEGER DEFAULT 0,
    diary_written   INTEGER DEFAULT 0,  -- 1 se ja escrito no Obsidian
    meeting_type    TEXT,               -- "1on1"|"ritual"|"interna"|"externa"|"ambiente"
    note_path       TEXT,               -- path relativo da nota no vault
    sent_at         TEXT                -- ISO8601 se email enviado
);
```

### speakers (diarizacao)
```sql
CREATE TABLE speakers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    email           TEXT,
    centroid        BLOB,               -- embedding medio (float32 192-dim)
    embedding_count INTEGER DEFAULT 0,
    consent_at      TEXT,               -- obrigatorio para nao-self (LGPD)
    consent_ref     TEXT,               -- descricao da evidencia de consentimento
    is_self         INTEGER DEFAULT 0,  -- 1 para o proprio dono do sistema
    created_at      TEXT NOT NULL
);
```

## Comandos CLI

Todos via `uv run escuta <comando>` ou `escuta <comando>` com venv ativo.

```bash
# Status do daemon e DB
escuta status

# Pausar gravacao por N minutos ou ate horario
escuta pausar 30
escuta pausar --ate 14:30

# Retomar gravacao imediatamente
escuta retomar

# Busca FTS5 simples (retorna lista de segmentos)
escuta buscar "termo de busca" --limite 20

# Recuperar contexto denso para consumo LLM (FTS5 + blocos recentes)
escuta contexto "pergunta aqui"              # ultimos 7 dias
escuta contexto "pergunta" --dias 30         # ultimo mes
escuta contexto "pergunta" --tipo reuniao    # filtrar por tipo de bloco

# Ciclo janitor: fecha blocos, sumariza via LLM, escreve no Obsidian
escuta diario
escuta diario --dry-run   # preview sem escrever

# Sincronizar eventos do calendario
escuta agenda

# Digest semanal via claude -p
escuta digest
escuta digest --semana 2026-W24

# Gerenciar speakers para diarizacao (LGPD: exige consentimento)
escuta voz cadastrar "Nome" --sou-eu
escuta voz cadastrar "Nome" --consentimento "referencia"
escuta voz treinar "Nome" --gravar --segundos 30
escuta voz listar
escuta voz remover "Nome"

# Criar draft de email com transcricao+resumo de um bloco
escuta enviar <block_id>
escuta enviar <block_id> --para "email@exemplo.com"

# Migracao de notas antigas do formato flat para 25-Escuta/
escuta migrar-notas --dry-run

# Web UI read-only (porta 8001)
escuta web
```

## Estrutura do vault 25-Escuta

```
claude_obsidian/25-Escuta/
├── reunioes/YYYY/MM/YYYY-MM-DD HHMM <titulo-slug>.md
├── ambiente/YYYY-MM-DD.md
└── digests/YYYY-Wnn.md
```

Frontmatter de nota de reuniao:
```yaml
---
type: escuta-reuniao
meeting_type: 1on1 | ritual | interna | externa
date: YYYY-MM-DD
attendees: ["email@..."]
event_id: "id-google-calendar"
tags: [escuta, reuniao]
---
```

Estrutura da nota de reuniao:
- Resumo / Decisoes / Action Items
- `## Transcricao` dentro de callout colapsavel `> [!note]- Transcricao completa`
- Formato de linha: `**[HH:MM] NomeSpeaker:** texto`

## Queries SQL uteis

### Decisoes da semana atual
```sql
SELECT b.id, b.ts_start, b.summary_md
FROM blocks b
WHERE b.ts_start >= date('now', '-7 days')
  AND b.summary_md IS NOT NULL
  AND (b.summary_md LIKE '%decisao%' OR b.summary_md LIKE '%decidimos%' OR b.summary_md LIKE '%aprovamos%')
ORDER BY b.ts_start DESC;
```

### Falas de uma pessoa especifica (por speaker_label)
```sql
SELECT s.ts_start, s.text
FROM segments s
WHERE s.speaker_label = 'Andre'
  AND s.ts_start >= date('now', '-7 days')
ORDER BY s.ts_start DESC
LIMIT 50;
```

### Reunioes com determinado termo (FTS5)
```sql
SELECT DISTINCT b.id, b.ts_start, b.kind, b.meeting_type, b.summary_md
FROM segments_fts f
JOIN segments s ON s.id = f.rowid
JOIN blocks b ON b.id = s.block_id
WHERE segments_fts MATCH 'data engine OR INTECK'
  AND s.ts_start >= date('now', '-30 days')
ORDER BY b.ts_start DESC;
```

### Blocos recentes com resumo
```sql
SELECT id, kind, meeting_type, ts_start, ts_end,
       substr(summary_md, 1, 200) AS resumo
FROM blocks
WHERE summary_md IS NOT NULL
ORDER BY ts_start DESC
LIMIT 10;
```

### Contagem de segmentos por dia (ultimos 7 dias)
```sql
SELECT substr(ts_start, 1, 10) AS dia, COUNT(*) AS n_segs
FROM segments
WHERE ts_start >= date('now', '-7 days')
GROUP BY dia
ORDER BY dia DESC;
```

## Comando `contexto` — saida para consumo LLM

O comando `escuta contexto` realiza FTS5 + filtra por periodo e tipo,
formata saida densa sem chamada LLM:

```
[escuta:contexto]

## bloco 7 | reuniao | 2026-06-12T14:00
resumo: Discussao sobre data engine e integracao com INTECK
  [2026-06-12T14:05] Andre: testamos o microfone INTECK ontem
  [2026-06-12T14:06] Hugo: o setup ficou bom

## bloco 8 | ambiente | 2026-06-12T16:00
  [2026-06-12T16:01] ?: reuniao sobre INTECK agendada
```

Saida limitada a ~4k tokens (16000 chars) por chamada.

## Avisos de seguranca e privacidade

- **Dados sensiveis**: o banco contem conversas de terceiros (participantes de reunioes)
- **DB read-only**: sempre usar `?mode=ro` na connection string para nao interferir no daemon
- **Embeddings**: dados biometricos temporarios — apagados apos clustering, nao persistem
- **Speakers de terceiros**: so cadastrados com consentimento explicito (LGPD Art. 11)
- **Email**: nunca enviado automaticamente — sempre cria DRAFT para revisao humana

## Memória conversável (RAG sobre o vault) + servidor MCP

A Escuta indexa o **vault Obsidian inteiro** (transcrições 25-Escuta, daily notes,
20-Projects, 70-Knowledge, 30-Memory, docs) para busca **semântica** (por significado,
não só palavra-chave). Embeddings locais `BAAI/bge-m3` (1024-dim, MPS), guardados em
`memory_chunks` no SQLite; recuperação híbrida (cosine + FTS5 BM25, fusão RRF).

### Como consultar (CLI)
```bash
escuta indexar-memoria          # incremental por mtime (rápido; full=--full)
escuta _buscar-memoria "pergunta em linguagem natural"   # top-k com citações
```

### Servidor MCP `escuta-memoria` (preferido para conversar)
Registrado em Claude Code (`~/.claude.json`) e Claude Desktop. Comando: `escuta mcp` (stdio).
Mantém o modelo vivo e reindexa incrementalmente a cada busca (notas novas entram sem restart).
Tools expostas:

| Tool | Uso |
|---|---|
| `buscar_memoria(pergunta, k=8)` | recupera trechos relevantes por significado, com nota de origem + data |
| `ler_nota(caminho)` | conteúdo completo de uma nota (ex.: transcrição inteira de uma reunião) |
| `listar_reunioes(dias=30)` | navega reuniões transcritas |
| `contexto_recente(dias=3)` | resumos dos últimos dias |

Padrão de uso: `buscar_memoria` para achar → raciocinar sobre os trechos → `ler_nota`
se precisar do texto inteiro → responder citando a fonte (`[[nota]]` + data).
Servidor MCP recém-registrado só aparece em sessão Claude Code NOVA (ou já está no Desktop).

## Atribuição de locutor por LLM (v5) — quem-falou via texto

A diarização acústica (sherpa) falha far-field. A v5 identifica quem-falou pelo **texto**:
ao fechar um bloco de REUNIÃO (com attendees na agenda), um passo `claude -p` cruza a
transcrição + os participantes do evento (conjunto FECHADO) + perfis acumulados →
mapeia cluster→nome com confiança. Funde com o acústico (texto vence em conflito, logado).

- **Confiança honesta**: ≥0.85 nome; 0.6–0.85 "Nome?" (provável); <0.6 mantém letra. Nunca rótulo falso.
- **Auto-enrollment**: cluster atribuído com conf ≥0.85 → o áudio (em RAM) treina a voz da pessoa
  sem ela gravar 45s. O texto "ensina" o acústico; reuniões seguintes afinam.
- **Perfis** (`25-Escuta/perfis/<nome>.md`, auto-indexados no MCP): papel, tópicos, bordões,
  interlocutores. Atualizados a cada reunião (`claude -p`), consumidos no prompt de atribuição.
  CLI: `escuta perfil listar` / `escuta perfil ver "<nome>"`.
- Schema: `segments.speaker_conf` (0-1) + `speaker_source` (acoustic|text|fused|conflict).
- Escopo v1: só reuniões com evento/attendees; ambiente fica com letras.
- Chamadas internas `claude -p` usam `--strict-mcp-config` (não carregam o MCP/bge-m3).

## Chat com a memória na web UI (v6) — assinatura, sem API token

A web UI (http://127.0.0.1:8001, launchd `com.andregusman.escuta-web`) tem um painel
"Conversar com a memória" (3ª coluna) que conversa sobre TODO o vault Obsidian — transcrições
+ projetos + knowledge + memória. Usa a **assinatura Claude Code** (`claude` headless), NÃO API
token (sem `ANTHROPIC_API_KEY`; sem cobrança por token).

- Backend `POST /api/chat` (SSE) → `chat.py stream_chat` → `claude -p --output-format stream-json
  --strict-mcp-config --mcp-config <escuta-memoria> --allowedTools mcp__escuta-memoria__*
  --disallowedTools Bash Write Edit Read Glob Grep WebFetch WebSearch Task NotebookEdit
  [--resume <session_id>]`. O Claude usa o MCP escuta-memoria (buscar_memoria etc.) e responde grounded.
- **Sandbox read-only**: só os 4 MCP tools de leitura; nenhum acesso a filesystem/shell (testado:
  pedir /etc/passwd → negado). Bind 127.0.0.1. Single-flight (1 processo claude por vez).
- Continuidade multi-turno via `--resume <session_id>` (capturado do evento system/init).
- Eventos SSE: session | token (incremental) | tool ("🔍 buscando") | done | error | busy.

## Inteligência de reuniões (v7) — segmentação por assunto, ata rica, metadados, painel

- **Segmentação por assunto**: blocos AMBIENTE longos (≥30 seg ou >12min, sem evento de agenda) são divididos por TÓPICO via `claude -p` (topics.py) no janitor — cada assunto vira uma "reunião" com título. Eventos de agenda não são divididos. Conservador; rede de segurança = dividir/juntar manual.
- **Ata executiva rica** (diary._build_prompt para reunião/is_meeting): título, participantes, resumo, pauta, decisões (dono/prazo), action items, pendências, riscos, próximos passos.
- **Metadados editáveis** (DB = fonte de verdade, sobrevivem ao re-render): `blocks.meeting_name`, `participants_json` ([{name,email}]), `topic_title`, `is_meeting`. Editar na web → nota re-renderiza com o nome/participantes.
- **Web**: `PATCH /api/bloco/{id}/meta` (nome+participantes), `POST /api/bloco/{id}/split {at_segment_id}`, `POST /api/blocos/merge {ids}`, `GET /api/reunioes?dias=N`. `_rw_conn` (RW) para edição; demais read-only. Painel "Reuniões" (toggle Timeline⇄Reuniões) lista todas com ata + edição + split/merge.
- Repo: github.com/Raiz-Educacao-SA/escuta (privado); fluxo feature branch → `gh pr create` → `gh pr merge --squash`.

## Banco de Pessoas (v8) — registro que ancora a identificação

A tabela `speakers` virou o **registro canônico de Pessoa** (name único = chave): + role, org, aliases_json, last_seen, meetings_count, archived. Unifica os 3 silos: voz (centroide), perfil (`perfis/<slug>.md`), identidade.
- `pessoas.resolve_name(email, store)`: email→nome do REGISTRO (não mais só email_to_name léxico).
- `pessoas.suggest_from_calendar`: ranking dos attendees mais frequentes da agenda (semeia o registro).
- **Âncora na atribuição (o payoff)**: conjunto fechado da atribuição = `participants_json` do bloco (v7) > attendees do evento. Reunião AMBIENTE (sem agenda) com participantes setados passa a ter identificação por NOME. Role do registro injetado no prompt. `bump_person_seen` ao fechar reunião.
- **Web**: aba **Pessoas** (lista/detalhe/editar/arquivar/sugerir-da-agenda); autocomplete de participantes (datalist /api/pessoas, nome→email). Endpoints `GET/POST/PATCH /api/pessoas`, `/api/pessoas/sugerir`, `/api/pessoas/{id}/arquivar`.
- **CLI**: `escuta pessoas listar|adicionar|sugerir|editar|arquivar`. Registro de pessoa ≠ cadastro de VOZ (voz exige consent biométrico via `escuta voz`).

## Materiais de reunião (v9) — upload → absorvido no contexto

Subir materiais (PDF/DOCX/PPTX/XLSX/CSV/TXT/imagem) que viram contexto pesquisável + alimentam a ata.
- **Conversão** (materials.py): markitdown p/ docs; **visão da IA** (`claude -p` + Read sandbox, na assinatura) p/ imagens/quadro branco/PDF escaneado → transcreve/descreve. Converte → `.md` em `25-Escuta/materiais/YYYY/MM/` (frontmatter: fonte/mime/data/block_id) + original em `materiais/originais/`.
- **Absorção automática**: o .md convertido é auto-indexado (memory_index incremental) → o **chat já usa** via buscar_memoria. source_type="material".
- **Vínculo**: anexar a reunião (blocks.materials_json) → a **ata injeta** o conteúdo do material (`## Materiais de referência`, ~6k) → reflete o deck/doc; ou geral (só chat).
- **Web**: `POST /api/material` (multipart, block_id opcional) + drag-drop no detalhe da reunião + upload geral. `GET /api/dia`//api/reunioes retornam `materials`.
- **CLI**: `escuta material adicionar <arquivo> [--reuniao N]` / `listar`.
- Dep: `markitdown[all]`. Sandbox da visão espelha o do chat (Read só do arquivo).

## Editor de quem-falou (v10) — corrigir falas → participantes

Corrigir manualmente a quem cada fala pertence (a diarização far-field + atribuição por LLM erram). Fecha o human-in-the-loop.
- **Lock**: `segments.speaker_locked` + `store.lock_segment_speaker(seg_id,label,speaker_id)` (seta conf=1.0, source='manual', locked=1). O loop de `diarize_and_label_block` **pula segmentos locked** → re-diarização do janitor NUNCA desfaz a correção. Call site (`daemon.py`) passa `block_segments` fresco → o lock é visto.
- **Endpoint**: `PATCH /api/bloco/{id}/falas` body `{relabel:{"A":{name,speaker_id?}}, segments:[{seg_id,name,speaker_id?}]}`. Relabel por cluster + override por segmento; resolve speaker_id por nome; auto-adiciona o nome em participants_json; `reset_block_output` re-renderiza a nota. `GET /api/dia` retorna speaker_conf/id/locked. `GET /api/bloco/{id}/segmentos` (seam p/ editor na aba Reuniões — UI fast-follow).
- **UI (Timeline)**: botão "editar falantes" → painel com 1 select por falante distinto (opções = participants_json ∪ /api/pessoas + "Desconhecido") + Salvar; badge clicável (role=button) → select inline p/ override de 1 trecho; cadeado 🔒 nos locked, "?"+% nos conf<0.85.
- **Escopo**: correção atualiza label + nota; voz/perfil NÃO re-treinados (áudio descartado pós-fechamento). Após deploy do daemon web: `launchctl kickstart -k gui/$(id -u)/com.andregusman.escuta-web` (web.py em memória precisa restart; HTML é editable/ao vivo).

## Título automático de bloco (v11) — evento da agenda ou nome IA

Bloco não mostra mais "Ambiente"/"Reunião" genérico:
- **Reunião com evento** → título do evento do Google Calendar. Resolvido RETROATIVO: `/api/dia` busca `events.title`; `/api/reunioes` faz `LEFT JOIN events`. Vale p/ blocos existentes, custo zero.
- **Ambiente** → nome curto da IA: `topics.suggest_block_name(segments,runner?)` (claude -p, `sanitize_title`) roda no janitor ao fechar o bloco → grava `topic_title` (segue ambiente, is_meeting=0). `_topic_segment_block`: acima do limiar e ≥2 tópicos divide (v7); senão nomeia o bloco inteiro (cobre tópico único/curto).
- **Resolver**: `web._resolve_block_title` = meeting_name > topic_title > event_title > meeting_type > kind. Front usa `block.titulo`; badge = só o tipo.
- **Backfill**: `escuta nomear-blocos [--dias N] [--forcar]` nomeia ambientes existentes sem título (web na hora; nota Obsidian no próximo re-render).
- Gotcha: `segment_block_by_topic` zera o título quando ≤1 tópico → naming usa função própria. Auto-naming de bloco NOVO exige restart do capture daemon (perde audio cache em RAM → evitar mid-conversa); reunião retroativa não precisa.

## Divisão de interlocutores por texto (v11.1) — quando o acústico falha

Blocos longos não diarizam pelo acústico ("áudio incompleto" — RAM evictada antes do bloco fechar → speaker_label NULL). `interlocutors.py` infere os turnos pelo TEXTO via LLM → "Interlocutor 1/2/3", editável no editor de quem-falou (v10, renomeia p/ pessoa real).
- `divide_interlocutors(segments, runner?, window=60, overlap=6)` — janela deslizante + stitching por contexto (prev_tail mostra rótulos globais; LLM reusa). `persist_interlocutors` grava source='text_diarization', conf 0.5, NÃO-locked.
- Guards: anti-clobber (>30% rótulo acústico/manual → pula o bloco); anti-degenerado (<2 interlocutores distintos → NÃO persiste, deixa NULL).
- CLI `escuta dividir-interlocutores [--dias N] [--bloco ID] [--forcar]` (backfill). Janitor auto-fallback se diarize_and_label_block retorna labeled==0 (flag `interlocutor_text_fallback_enabled`).
- UI: badges coloridos `spk-i1..i6`; o painel "editar falantes" agrupa por Interlocutor N.
- ⚠ Best-effort e VARIÁVEL: prompt deve afirmar "é conversa, ≥2 pessoas, identifique trocas de turno" senão colapsa tudo em 1. Estimativa de nº de pessoas foi REMOVIDA (variância). Qualidade real vem do acústico (blocos novos).
- Fix relacionado: nome no form de metadados = meeting_name||topic_title||event_title (consistente com o box); resolver de título não usa meeting_type cru.

## Conciliação bloco × agenda (v12) — reunião no horário = verdade

`escuta conciliar-agenda [--dias N] [--bloco ID] [--dry-run]`: se houver evento na agenda no horário do bloco com **>1 participante**, o bloco adota o título + participantes do evento (mesmo capturado como ambiente). `reconcile.py`: `pick_meeting_event` (maior sobreposição entre eventos ≥2 participantes que cobrem **≥50% do bloco** — pula blocos-gigante multi-reunião); `reconcile_block` seta event_id + kind='reuniao' + is_meeting=1 + participants_json (attendees→nomes). `EventKitCalendarSource.fetch_range(start,end)` consulta a agenda por período.
- Resolver de título: `meeting_name > event_title > topic_title > kind` — **evento da agenda vence o palpite da IA** em bloco conciliado.
- Gotchas: EventKit `_nsdate_to_datetime` retorna UTC-aware → `astimezone()` p/ local (fetch_today mostra wall-clock UTC, enganoso); TZ só stdlib (sem dateutil); hook forward no janitor pulado (CLI retroativo é o entregável); blocos-gigante multi-reunião → split por evento é follow-up.
