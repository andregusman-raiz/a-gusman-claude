#!/usr/bin/env bash
# decisoes-render.sh — INGEST + RENDER da fila de decisões do dono.
# Contrato: docs/ai-state/terminais (reforma de pendencias, 2026-08-28, builder B).
set -euo pipefail

T="${DECISOES_DIR:-$HOME/Claude/docs/ai-state/terminais}"
DECISOES_JSON="$T/decisoes.json"
VIEW_MD="$T/DECISOES-PENDENTES.md"
ARQUIVO_MD="$T/ARQUIVO-decisoes.md"
NARR_DIR="$T/decisoes"
LOG_FILE="$T/decisoes-ingest.log"
LOCK="$T/.decisoes-render.lock"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: decisoes-render.sh [--help]

Passo 1 (INGEST): qualquer bloco `## D-nnn — titulo` presente no
DECISOES-PENDENTES.md atual (convenção antiga apendada direto, ou sob a
seção `## ENTRADA MANUAL` no fim da view) é reconciliado com
decisoes.json:

  - id JÁ CONHECIDO + `- Estado:` diferente do que está salvo → UPDATE:
    aplica o novo estado, extrai decisão/decidida_em, carimba
    atualizado_em, registra anomalia "fechada por bloco manual".
  - id JÁ CONHECIDO + efeito/recomendação com texto NOVO (não contido no
    que já está salvo) → ANEXA (nunca substitui) com prefixo
    "[manual <ts>]".
  - id JÁ CONHECIDO + bloco sem nenhuma diferença semântica (o terminal
    só releu a própria view) → no-op, silencioso.
  - id DESCONHECIDO + tem `- Estado:` parseável → entra como decisão
    NOVA com o PRÓXIMO id real (proximo_id) — o número digitado é só
    localização, nunca o id final.
  - id DESCONHECIDO sem `- Estado:` (bloco malformado, "título
    estranho") → NÃO é ingerido: preservado verbatim na view sob
    `## ENTRADA MANUAL (não ingerido — verifique)`. O render NUNCA
    apaga texto que não entendeu.

Cada ingest/update fica logado em decisoes-ingest.log
(`<ts> <id> <ação> <origem-da-linha>`) para auditoria do RESUMO.

Passo 2 (RENDER): recalcula idade/stale/duplicata a partir de
decisoes.json e reescreve DECISOES-PENDENTES.md (tmp+replace, atômico):
cabeçalho curto, "## ⭐ A decisão da vez" (1ª aberta pela rubrica de
bloco), blocos 🔴🟠🟡⚪ só com ABERTAS (≤6 linhas cada), contagens no
fim e uma seção `## ENTRADA MANUAL` vazia para apêndice futuro.

Passo 3: decisões cujo estado != aberta e ainda não constam em
ARQUIVO-decisoes.md são apendadas lá.

Idempotente: sem novidade para ingerir/atualizar, rodar 2x seguidas
produz o mesmo DECISOES-PENDENTES.md (idade/stale só mudam com o
relógio).

Lock não-bloqueante: se outra execução está em andamento, sai com aviso
(exit 0) — a próxima janela do launchd (10 min) resolve.
EOF
}

for a in "$@"; do
  case "$a" in
    --help|-h) usage; exit 0 ;;
    *) echo "arg desconhecido: $a" >&2; usage; exit 2 ;;
  esac
done

[[ -f "$DECISOES_JSON" ]] || { echo "RECUSADO: $DECISOES_JSON nao encontrado — rode a migracao primeiro" >&2; exit 1; }
mkdir -p "$NARR_DIR"
[[ -f "$VIEW_MD" ]] || : > "$VIEW_MD"
[[ -f "$ARQUIVO_MD" ]] || printf '# ARQUIVO-decisoes.md — decisões já fechadas (append-only)\n\n' > "$ARQUIVO_MD"
[[ -f "$LOG_FILE" ]] || : > "$LOG_FILE"

REGISTRY_LIB_DIR="$SCRIPT_DIR" \
DECISOES_JSON="$DECISOES_JSON" \
VIEW_MD="$VIEW_MD" \
ARQUIVO_MD="$ARQUIVO_MD" \
NARR_DIR="$NARR_DIR" \
T_DIR="$T" \
LOG_FILE="$LOG_FILE" \
LOCK_PATH="$LOCK" \
python3 <<'PYEOF'
import datetime
import fcntl
import json
import os
import re
import sys
import tempfile
import unicodedata

sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import load, mutate, RegistryLockTimeout  # noqa: E402

DECISOES_JSON = os.environ["DECISOES_JSON"]
VIEW_MD = os.environ["VIEW_MD"]
ARQUIVO_MD = os.environ["ARQUIVO_MD"]
NARR_DIR = os.environ["NARR_DIR"]
T_DIR = os.environ["T_DIR"]
LOG_FILE = os.environ["LOG_FILE"]
LOCK_PATH = os.environ["LOCK_PATH"]

# Lock nao-bloqueante para a rodada INTEIRA (INGEST+RENDER): usa fcntl direto
# (POSIX syscall via stdlib) em vez do binario `flock`, ausente por padrao no
# macOS. Ficamos com o fd aberto ate o processo terminar, entao o lock cobre
# toda a operacao — nao so um probe pontual.
_lock_fd = os.open(LOCK_PATH, os.O_CREAT | os.O_RDWR, 0o644)
try:
    fcntl.flock(_lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    print("AVISO: outra execução de decisoes-render.sh em andamento — pulando este ciclo",
          file=sys.stderr)
    sys.exit(0)

# Validação prévia do JSON — sem isso, decisoes.json vazio/corrompido derrubava
# o script com traceback cru no stderr do plist a cada 10 min (ruído puro: a
# view antiga continua válida, não há nada a regravar). Falha aqui = exit
# limpo de 1 linha, ANTES de qualquer tentativa de escrita — a view/ARQUIVO
# antigos sobrevivem intocados.
try:
    _reg_check = load(DECISOES_JSON)
    if not isinstance(_reg_check, dict) or 'decisoes' not in _reg_check or 'proximo_id' not in _reg_check:
        raise ValueError("faltam as chaves 'decisoes'/'proximo_id'")
    if not isinstance(_reg_check['decisoes'], list):
        raise ValueError("'decisoes' não é uma lista")
except RegistryLockTimeout as e:
    print(f"RECUSADO: {e}", file=sys.stderr)
    sys.exit(1)
except (json.JSONDecodeError, ValueError, OSError) as e:
    print(f"RECUSADO: {DECISOES_JSON} vazio ou inválido ({e}) — view/ARQUIVO antigos preservados, "
          f"corrija o JSON e rode de novo", file=sys.stderr)
    sys.exit(1)

NOW = datetime.datetime.now(datetime.timezone.utc)
NOW_ISO = NOW.strftime('%Y-%m-%dT%H:%M:00Z')
PISO_ABERTA_EM = datetime.datetime(2026, 8, 28, 0, 0, tzinfo=datetime.timezone.utc)
BLOCO_TITLES = {
    1: "🔴 Bloco 1 — Efeito silencioso em produção",
    2: "🟠 Bloco 2 — Prazo",
    3: "🟡 Bloco 3 — Destrava fila",
    4: "⚪ Bloco 4 — Produto / operação (sem urgência)",
}

HEADER_RE = re.compile(r'^## (D-\d+)\s+—\s+(.*)$')
ORIGEM_RE = re.compile(r'^-\s*Origem:\s*(.*)$')
EFEITO_RE = re.compile(r'^-\s*\*{0,2}Efeito de n[aã]o decidir\*{0,2}:\s*(.*)$', re.IGNORECASE)
RECO_RE = re.compile(r'^-\s*\*{0,2}Recomenda[cç][aã]o\*{0,2}:\s*(.*)$', re.IGNORECASE)
ESTADO_RE = re.compile(r'^-\s*Estado:\s*(.*)$')
PR_RE = re.compile(r'#(\d{4,6})')
ISO_DATE_RE = re.compile(r'(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})')
DDMM_RE = re.compile(r'(\d{2})/(\d{2})(?:\s+~?(\d{2}):(\d{2}))?')
ENTRADA_MANUAL_MARK = "## ENTRADA MANUAL"
# Qualquer bloco `## D-nnn` (parseavel ou nao) para de absorver corpo ao
# bater numa dessas fronteiras — sem isso, um bloco NAO ENTENDIDO na ponta
# do arquivo (sem `- Estado:`) engolia tudo ate EOF, inclusive o rodape
# gerado por ESTA MESMA rotina; ao ser preservado verbatim e reescrito, a
# proxima rodada via essa copia embutida como parte do corpo e duplicava o
# rodape a cada execucao (achado real rodando o teste (b) 2x seguidas).
BOUNDARY_RE = re.compile(r'^(# |## ⭐ A decisão da vez|## Contagens|## ENTRADA MANUAL|---\s*$)')


def strip_accents_upper(s):
    nk = unicodedata.normalize('NFKD', s)
    return ''.join(c for c in nk if not unicodedata.combining(c)).upper()


def parse_iso(s):
    if not s:
        return None
    try:
        d = datetime.datetime.fromisoformat(s.replace('Z', '+00:00'))
        if d.tzinfo is None:
            d = d.replace(tzinfo=datetime.timezone.utc)
        return d
    except Exception:
        return None


def clean(s):
    s = (s or '').strip()
    s = re.sub(r'\*{1,3}', '', s)
    return re.sub(r'\s+', ' ', s).strip(' -·—')


def classify_estado_texto(estado_txt):
    """(estado, decisao_ou_None) a partir do texto cru de '- Estado: ...'.

    Retorna (None, None) quando o texto NAO bate com nenhum estado
    reconhecido — "nao entendi" nao pode virar "aberta" por default
    (bug critico achado por revisor adversarial 2026-08-28: um Estado
    desconhecido num id JA DECIDIDO caia neste branch, o chamador via
    'aberta' != estado_atual e REABRIA a decisao apagando `decisao` em
    silencio). Quem chama isto SEMPRE tem que tratar None como "recusar
    o bloco inteiro", nunca como aberta.

    Cuidado (bug real achado e corrigido em 2026-08-28): o template da
    linha aberta e "aberta · Decidido em / decisão: —" — a palavra
    "decisão" dentro do PROPRIO rotulo contem a substring "DECISAO" e
    faria qualquer linha aberta cair como decidida se checassemos so
    por substring. Por isso decide-se primeiro pelo prefixo.
    """
    if not estado_txt:
        return None, None
    norm = strip_accents_upper(estado_txt).strip()
    if norm.startswith('ABERTA'):
        return 'aberta', None
    if 'POR ALCADA' in norm:
        return 'decidida_por_alcada', clean(estado_txt)[:600]
    if 'EXECUTADA' in norm or 'EM EXECUCAO' in norm:
        return 'decidida_executada', clean(estado_txt)[:600]
    if 'ARQUIVADA' in norm:
        return 'arquivada', clean(estado_txt)[:600]
    if 'DECIDIDA' in norm or norm.startswith('DECIS'):
        return 'decidida', clean(estado_txt)[:600]
    return None, None


def parse_date_to_iso(raw):
    if not raw:
        return None
    m = ISO_DATE_RE.search(raw)
    if m:
        y, mo, d, h, mi = m.groups()
        return f"{y}-{mo}-{d}T{h}:{mi}:00Z"
    m = DDMM_RE.search(raw)
    if m:
        dd, mm, hh, mi = m.groups()
        hh = hh or "00"
        mi = mi or "00"
        return f"2026-{mm}-{dd}T{hh}:{mi}:00Z"
    return None


def extract_fields(body_lines):
    """Extrai origem/efeito/recomendacao/estado do corpo de um bloco.

    Acha CRITICO 1c (revisor adversarial 2026-08-28): EFEITO_RE/RECO_RE
    usavam primeiro-match-vence. Um bloco com "- Recomendação:" dentro de
    "- Opções:" (texto solto) e outro "- Recomendação:" real embaixo
    gravava a opcao descartada, sem sinal nenhum. Fix: contar TODAS as
    ocorrencias de cada campo; >1 match = nao preenche (fica None) e devolve
    o motivo em `ambiguous` para o chamador registrar como anomalia — o
    valor certo so entra via decisao-ref.sh, nunca por adivinhacao.
    """
    origem = estado_txt = None
    efeito_matches = []
    reco_matches = []
    for ln in body_lines:
        if origem is None:
            m = ORIGEM_RE.match(ln)
            if m:
                origem = clean(m.group(1))
        m = EFEITO_RE.match(ln)
        if m:
            efeito_matches.append(clean(m.group(1)))
        m = RECO_RE.match(ln)
        if m:
            reco_matches.append(clean(m.group(1)))
        m = ESTADO_RE.match(ln)
        if m:
            estado_txt = m.group(1)

    ambiguous = []
    if len(efeito_matches) > 1:
        ambiguous.append(f"efeito ambiguo: {len(efeito_matches)} ocorrencias — preencher via decisao-ref.sh")
        efeito = None
    else:
        efeito = efeito_matches[0] if efeito_matches else None
    if len(reco_matches) > 1:
        ambiguous.append(f"recomendacao ambigua: {len(reco_matches)} ocorrencias — preencher via decisao-ref.sh")
        reco = None
    else:
        reco = reco_matches[0] if reco_matches else None

    return origem, efeito, reco, estado_txt, ambiguous


# Achado MENOR 1d (revisor adversarial 2026-08-28): um bloco RECUSADO/NAO-
# ENTENDIDO nao muda o JSON, mas antes gerava uma linha nova no log a CADA
# rodada (a cada 10 min, pra sempre, se ninguem corrigir o bloco). Dedup por
# assinatura (id, acao, origem) escaneando o log existente uma vez — so para
# as duas acoes que legitimamente se repetem sem mudanca de estado; NOVA/
# ATUALIZADA/COLISAO-EVITADA sempre representam uma mudanca real no JSON e
# continuam logando sempre.
_DEDUP_LOG_ACTIONS = {"RECUSADO", "NAO-ENTENDIDO"}
_logged_signatures = set()
if os.path.exists(LOG_FILE):
    with open(LOG_FILE, encoding='utf-8') as _f:
        for _raw in _f:
            _parts = _raw.rstrip('\n').split(' ', 3)
            if len(_parts) == 4 and _parts[2] in _DEDUP_LOG_ACTIONS:
                _logged_signatures.add((_parts[1], _parts[2], _parts[3]))


def log_line(acao, entry_id, origem_txt):
    origem_norm = origem_txt or 'desconhecida'
    if acao in _DEDUP_LOG_ACTIONS:
        sig = (entry_id, acao, origem_norm)
        if sig in _logged_signatures:
            return
        _logged_signatures.add(sig)
    line = f"{NOW_ISO} {entry_id} {acao} {origem_norm}\n"
    fd = os.open(LOG_FILE, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    try:
        os.write(fd, line.encode('utf-8'))
    finally:
        os.close(fd)


# ---------- PASSO 1: INGEST ----------
def parse_md_blocks(text):
    """Todo bloco `## D-nnn — titulo` do arquivo, na ordem em que aparece,
    com o texto bruto completo (header+corpo) para poder ser preservado
    verbatim se não for entendido."""
    lines = text.split('\n')
    found = []
    cur = None
    for line in lines:
        m = HEADER_RE.match(line)
        if m:
            if cur is not None:
                found.append(cur)
            cur = {
                'digited_id': m.group(1),
                'titulo': m.group(2).strip(),
                'body': [],
                'raw_lines': [line],
            }
            continue
        if cur is not None:
            if BOUNDARY_RE.match(line):
                found.append(cur)
                cur = None
                continue
            cur['body'].append(line)
            cur['raw_lines'].append(line)
    if cur is not None:
        found.append(cur)
    return found


def extra_manual_prose(text, blocks):
    """Texto solto (sem cabeçalho `## D-nnn`) dentro da seção
    `## ENTRADA MANUAL` — rede de segurança extra para não apagar prosa
    que alguém colou sem seguir nem a convenção de bloco.

    Bug real corrigido (2026-08-28): usar `str.find()` batia a substring
    "## ENTRADA MANUAL" onde quer que aparecesse — inclusive dentro da
    frase instrucional do próprio cabeçalho ("...seção `## ENTRADA
    MANUAL` no fim deste arquivo.") — e capturava o arquivo INTEIRO dali
    pra frente como "não entendido". Precisa ser uma LINHA que é
    exatamente esse título (^...$, MULTILINE), pegando a ÚLTIMA
    ocorrência (a seção real de apêndice, não a variante "(não
    ingerido...)" que o próprio render também pode ter escrito antes)."""
    matches = list(re.finditer(r'^## ENTRADA MANUAL\s*$', text, re.MULTILINE))
    if not matches:
        return None
    section = text[matches[-1].end():]
    # remove qualquer bloco `## D-nnn` já capturado (com seu corpo) do texto da seção
    for b in blocks:
        block_text = '\n'.join(b['raw_lines'])
        if block_text in section:
            section = section.replace(block_text, '')
    # remove o parágrafo instrucional estático que o próprio render escreve
    section = re.sub(
        r'>\s*Apêndice de emergência.*?id real\.', '', section, flags=re.DOTALL)
    leftover = '\n'.join(ln for ln in section.split('\n') if ln.strip() not in ('', '---'))
    return leftover.strip() or None


ingested_ids = []       # [(digited, new_id)]
updated_ids = []        # [id, ...]
unparsed_blocks = []    # [raw_text, ...]  preservados verbatim
stray_prose = None

if os.path.exists(VIEW_MD):
    with open(VIEW_MD, encoding='utf-8') as f:
        view_text_before = f.read()
else:
    view_text_before = ''

if view_text_before.strip():
    blocks = parse_md_blocks(view_text_before)
    stray_prose = extra_manual_prose(view_text_before, blocks)

    if blocks:
        def do_ingest(reg):
            by_id = {d['id']: d for d in reg['decisoes']}
            known_ids = set(by_id)
            for b in blocks:
                origem, efeito, reco, estado_txt, ambiguous = extract_fields(b['body'])
                digited = b['digited_id']

                if digited in known_ids:
                    target = by_id[digited]
                    changed = False

                    if estado_txt:
                        new_estado, new_decisao = classify_estado_texto(estado_txt)
                        estado_atual = target.get('estado')

                        if new_estado is None:
                            # Estado presente mas NAO reconhecido — "nao entendi" nunca
                            # pode virar mutacao. Recusa o BLOCO INTEIRO (nao só o
                            # campo Estado): nao mexe no JSON, preserva verbatim,
                            # loga a recusa com motivo, e pula para o proximo bloco
                            # sem aplicar efeito/recomendacao deste tambem — um bloco
                            # cujo campo principal falhou a classificacao nao e
                            # confiavel o suficiente pra aplicar so o resto.
                            unparsed_blocks.append('\n'.join(b['raw_lines']))
                            log_line("RECUSADO", digited, f"motivo=estado-desconhecido origem={origem}")
                            continue

                        if new_estado == 'aberta' and estado_atual != 'aberta':
                            # Reabertura por bloco manual e transicao ILEGAL — só
                            # decisao-decidir.sh --forcar pode reabrir (acao humana
                            # explicita). Bloco manual so FECHA ou atualiza texto de
                            # algo ja fechado; nunca reabre.
                            unparsed_blocks.append('\n'.join(b['raw_lines']))
                            log_line("RECUSADO", digited,
                                     f"motivo=transicao-ilegal-reabertura ({estado_atual}->aberta) origem={origem}")
                            continue

                        if new_estado != estado_atual:
                            assert new_decisao is not None, (
                                f"bug: {digited} mudaria para estado={new_estado} com decisao=None "
                                f"— isso apagaria a decisao anterior, recusado antes do mutate"
                            )
                            target['estado'] = new_estado
                            target['decidida_em'] = parse_date_to_iso(estado_txt) or NOW_ISO
                            target['decisao'] = new_decisao
                            target['anomalias'] = list(target.get('anomalias') or [])
                            target['anomalias'].append(
                                f"fechada por bloco manual em {NOW_ISO} (convenção antiga)"
                            )
                            changed = True
                        # new_estado == estado_atual -> sem mudanca de estado, so
                        # segue pra checagem de efeito/recomendacao abaixo.

                    # 2026-08-31T13:49:42Z (COMANDO): o `not in` falhava SEMPRE porque clean() altera o texto lido do .md, e o .md
                    # e renderizado a partir deste mesmo campo -> cada render anexava prev+' [manual]'+prev = DOBRAVA.
                    # D-093.recomendacao chegou a 2,83 GB (21 dobras). Regra nova: igual (normalizado) -> nada;
                    # o novo CONTEM o antigo -> SUBSTITUI (md e a versao estendida); o antigo contem o novo -> nada
                    # (md e vista truncada); so texto genuinamente diferente e anexado com marcador.
                    def _merge_manual(campo, novo):
                        import re as _re
                        _n=lambda s: _re.sub(r'\s+',' ',(s or '')).strip()
                        antigo=target.get(campo) or ''
                        # o valor lido do .md ja passou por clean() (apaga '*', apara ' -·—'); comparar o guardado
                        # SEM o mesmo clean() faz um '*' literal (ex.: railway.cron*.toml) parecer edicao manual para sempre.
                        na,nn=_n(clean(antigo)),_n(clean(novo))
                        if not nn or na==nn or nn in na: return False
                        # 2026-08-31 13:5xZ: a VISTA (.md) e derivada deste campo; quando ela carrega um valor gigante
                        # (residuo de dobras anteriores), 'novo contem antigo' e verdadeiro e o store ENGOLE a vista.
                        # Nenhuma edicao manual tem 16 KB — acima disso e loop: nao aceitar, registar anomalia.
                        if len(novo) > 16384:
                            target['anomalias'] = list(target.get('anomalias') or [])
                            msg = f"override manual de {campo} IGNORADO em {NOW_ISO}: {len(novo)} bytes (>16 KB) — provavel residuo de dobra na vista"
                            if msg not in target['anomalias']: target['anomalias'].append(msg)
                            return True
                        target[campo] = novo if na in nn else ((antigo + ' ' if antigo else '') + f"[manual {NOW_ISO}] {novo}")
                        return True
                    if efeito and _merge_manual('efeito', efeito):
                        changed = True
                    if reco and _merge_manual('recomendacao', reco):
                        changed = True

                    if ambiguous:
                        target['anomalias'] = list(target.get('anomalias') or [])
                        novas = [msg for msg in ambiguous if msg not in target['anomalias']]
                        if novas:
                            target['anomalias'].extend(novas)
                            changed = True
                            log_line("AMBIGUO", digited, f"{'; '.join(novas)} origem={origem}")

                    if changed:
                        target['atualizado_em'] = NOW_ISO
                        updated_ids.append(digited)
                        log_line("ATUALIZADA", digited, origem)
                    # bloco identico ao que já estava salvo -> no-op silencioso
                    continue

                # id desconhecido
                if not estado_txt:
                    # bloco malformado — nao inventa entrada nova, preserva verbatim
                    unparsed_blocks.append('\n'.join(b['raw_lines']))
                    log_line("NAO-ENTENDIDO", digited, origem)
                    continue

                new_estado, new_decisao = classify_estado_texto(estado_txt)
                if new_estado is None:
                    # Estado presente mas nao reconhecido — mesma regra do id
                    # conhecido: nunca adivinha 'aberta' por default, preserva.
                    unparsed_blocks.append('\n'.join(b['raw_lines']))
                    log_line("RECUSADO", digited, f"motivo=estado-desconhecido origem={origem}")
                    continue

                # CRITICO 1a (revisor adversarial 2026-08-28): cunhar direto
                # com `reg['proximo_id']` nao protege contra colisao — se
                # proximo_id <= maior id existente (corrupcao/edicao manual
                # do JSON), nasce um id DUPLICADO em silencio: `by_id` faz o
                # segundo pisar o primeiro, a view mostra o id 2x e
                # decisao-decidir.sh fica ambiguo sobre qual decisao fecha.
                # Fix: recalcular o proximo id livre a partir do MAIOR id
                # realmente existente em reg['decisoes'] (nao so confiar no
                # contador); se divergir do contador salvo, corrige o
                # contador e registra a anomalia — nunca cunha por cima.
                existing_nums = [int(d['id'].split('-')[1]) for d in reg['decisoes'] if d['id'].startswith('D-')]
                max_existing = max(existing_nums) if existing_nums else 0
                old_proximo = reg['proximo_id']
                next_free = max(max_existing, old_proximo - 1) + 1
                proximo_corrigido = next_free != old_proximo
                if proximo_corrigido:
                    reg['proximo_id'] = next_free

                new_id = f"D-{reg['proximo_id']:03d}"
                prs = sorted({int(x) for x in PR_RE.findall('\n'.join(b['body']))})
                anomalias_novas = [
                    f"ingerido via decisoes-render.sh (ENTRADA MANUAL/convenção antiga); "
                    f"id digitado no .md era '{digited}', sem bloco → foi para bloco 4"
                ] + ambiguous
                if proximo_corrigido:
                    anomalias_novas.append(
                        f"proximo_id corrigido de {old_proximo} para {next_free} (colisao evitada)"
                    )
                entry = {
                    "id": new_id,
                    "titulo": b['titulo'],
                    "origem": origem,
                    "aberta_em": NOW_ISO,
                    "aberta_em_estimada": False,
                    "bloco": 4,
                    "estado": new_estado,
                    "decidida_em": (parse_date_to_iso(estado_txt) or NOW_ISO) if new_estado != 'aberta' else None,
                    "decisao": new_decisao,
                    "efeito": efeito,
                    "recomendacao": reco,
                    "supersede": [],
                    "refs": {"pr": prs, "papel": []},
                    "narrativa": None,
                    "atualizado_em": NOW_ISO,
                    "anomalias": anomalias_novas,
                }
                reg['decisoes'].append(entry)
                by_id[new_id] = entry
                known_ids.add(new_id)
                reg['proximo_id'] += 1
                ingested_ids.append((digited, new_id))
                log_line("NOVA", new_id, origem)
                if proximo_corrigido:
                    log_line("COLISAO-EVITADA", new_id, f"proximo_id {old_proximo}->{next_free}")

        mutate(DECISOES_JSON, do_ingest)

if stray_prose:
    unparsed_blocks.append(
        "> Texto solto encontrado sob `## ENTRADA MANUAL` sem seguir o formato "
        "`## D-nnn — título` — não ingerido, preservado abaixo:\n\n" + stray_prose
    )
    log_line("NAO-ENTENDIDO", "(sem-id)", "texto solto em ENTRADA MANUAL")

# ---------- PASSO 2: RENDER ----------
reg = load(DECISOES_JSON)
decisoes = reg['decisoes']
by_id = {d['id']: d for d in decisoes}


def idnum(d):
    return int(d['id'].split('-')[1])


def aberta_em_effective(d):
    dt = parse_iso(d.get('aberta_em'))
    if dt is not None:
        return dt
    return PISO_ABERTA_EM


def idade_horas(d):
    return max(0, round((NOW - aberta_em_effective(d)).total_seconds() / 3600))


def is_stale(d):
    dt = parse_iso(d.get('atualizado_em')) or aberta_em_effective(d)
    return (NOW - dt).total_seconds() / 3600 > 24


# ids colapsados: aberta cujo id aparece no supersede de OUTRA entrada que também está aberta
collapsed_under = {}  # old_id -> new_id
for d in decisoes:
    if d['estado'] != 'aberta':
        continue
    for old_id in d.get('supersede') or []:
        if old_id in by_id and by_id[old_id]['estado'] == 'aberta':
            collapsed_under[old_id] = d['id']

# duplicata por PR compartilhado
pr_to_ids = {}
for d in decisoes:
    for pr in (d.get('refs') or {}).get('pr') or []:
        pr_to_ids.setdefault(pr, []).append(d['id'])

def duplicata_hint(d):
    for pr in (d.get('refs') or {}).get('pr') or []:
        others = [i for i in pr_to_ids.get(pr, []) if i != d['id']]
        if others:
            return others[0], pr
    return None


abertas = [d for d in decisoes if d['estado'] == 'aberta' and d['id'] not in collapsed_under]

# ALTO 1b (revisor adversarial 2026-08-28): `por_bloco.setdefault(bloco, [])`
# com um `bloco` fora de {1,2,3,4} criava uma chave NOVA no dict (ex.: 99).
# A decisao ficava dentro de `abertas` (contada em "Abertas: N") mas o loop
# de render so varre (1,2,3,4) — a decisao nunca aparecia em bloco nenhum:
# sumia da view em silencio, so sobrevivendo na contagem. Fix: bloco
# invalido/ausente cai no bloco 4 (destino seguro, igual ao default de
# decisao-nova.sh) com marcador visivel `⚠ bloco inválido (<valor>)`.
por_bloco = {1: [], 2: [], 3: [], 4: []}
bloco_invalido_map = {}  # id -> valor original invalido (para o marcador na view)
for d in abertas:
    b = d.get('bloco')
    if b not in (1, 2, 3, 4):
        bloco_invalido_map[d['id']] = b
        b = 4
    por_bloco[b].append(d)

for b in por_bloco:
    por_bloco[b].sort(key=lambda d: (aberta_em_effective(d), idnum(d)))

lines = []
lines.append("# DECISOES-PENDENTES.md — fila única de decisões do dono")
lines.append("")
lines.append("> GERADO por `decisoes-render.sh` (launchd, a cada 10 min) — não editar à mão.")
lines.append("> Criar decisão nova: `decisao-nova.sh \"<titulo>\" --efeito \"...\" [--recomendacao \"...\"] "
             "[--bloco N] [--pr N] [--papel X]`.")
lines.append("> Decidir: `decisao-decidir.sh D-nnn \"<decisão>\" [--executada|--alcada N] [--arquivar]`.")
lines.append("> Fonte de verdade: `decisoes.json`. Decididas vão para `ARQUIVO-decisoes.md`. Narrativa longa "
             "em `decisoes/D-nnn.md`.")
lines.append("> Apêndice manual (rede de segurança, será ingerido e ganha id real): seção "
             "`## ENTRADA MANUAL` no fim deste arquivo.")
lines.append("")


def render_entry_lines(d, prefix="##"):
    out = []
    out.append(f"{prefix} {d['id']} — {d['titulo']}")
    origem = d.get('origem') or '—'
    idade = idade_horas(d)
    idade_txt = f"{idade}h" + (" (aberta_em estimado)" if d.get('aberta_em_estimada') else "")
    out.append(f"- Origem: {origem} · idade: {idade_txt}")
    if is_stale(d):
        out.append("- ⏳ stale (sem atualização há mais de 24h)")
    if d['id'] in bloco_invalido_map:
        out.append(f"- ⚠ bloco inválido ({bloco_invalido_map[d['id']]}) — renderizado em bloco 4, corrija com decisao-ref.sh")
    dup = duplicata_hint(d)
    if dup:
        out.append(f"- 🔁 duplicata? (mesmo PR que {dup[0]}, #{dup[1]})")
    if d.get('efeito'):
        out.append(f"- Efeito de não decidir: {d['efeito']}")
    if d.get('recomendacao'):
        out.append(f"- Recomendação: {d['recomendacao']}")
    refs = d.get('refs') or {}
    prs = refs.get('pr') or []
    if prs:
        out.append(f"- PRs: {', '.join('#' + str(p) for p in prs)}")
    if d.get('narrativa'):
        out.append(f"- Narrativa completa: {d['narrativa']}")
    for old_id in d.get('supersede') or []:
        if old_id in collapsed_under and collapsed_under[old_id] == d['id']:
            out.append(f"  ↳ substitui {old_id}")
    out.append(f"- Decidir: `decisao-decidir.sh {d['id']} \"<decisão>\"`")
    return out


# ⭐ A decisão da vez
decisao_da_vez = None
for b in (1, 2, 3, 4):
    if por_bloco[b]:
        decisao_da_vez = por_bloco[b][0]
        break

lines.append("## ⭐ A decisão da vez")
lines.append("")
if decisao_da_vez:
    lines.extend(render_entry_lines(decisao_da_vez, prefix="###"))
else:
    lines.append("_nenhuma decisão aberta no momento._")
lines.append("")
lines.append("---")
lines.append("")

for b in (1, 2, 3, 4):
    lines.append(f"# {BLOCO_TITLES[b]}")
    lines.append("")
    if not por_bloco[b]:
        lines.append("_nenhuma aberta neste bloco._")
        lines.append("")
        continue
    for d in por_bloco[b]:
        lines.extend(render_entry_lines(d))
        lines.append("")
    lines.append("---")
    lines.append("")

total_abertas = len(abertas)
total_decididas = sum(1 for d in decisoes if d['estado'] != 'aberta')
total_stale = sum(1 for d in abertas if is_stale(d))
# 1b: a view NUNCA pode mentir em silencio — se a soma dos blocos nao bater
# com o total de abertas (bug de contagem futuro, nao so o de hoje), a
# propria view denuncia em vez de so divergir caladamente.
soma_blocos = sum(len(por_bloco[b]) for b in (1, 2, 3, 4))
inconsistente = soma_blocos != total_abertas
lines.append("## Contagens")
lines.append(f"- Abertas: {total_abertas} (bloco1={len(por_bloco[1])}, bloco2={len(por_bloco[2])}, "
             f"bloco3={len(por_bloco[3])}, bloco4={len(por_bloco[4])})")
if inconsistente:
    lines.append(f"- ⚠ INCONSISTÊNCIA: soma dos blocos ({soma_blocos}) ≠ abertas ({total_abertas}) — bug no render, investigar")
if bloco_invalido_map:
    lines.append(f"- ⚠ Bloco inválido corrigido para 4 nesta rodada: {len(bloco_invalido_map)} "
                 f"({', '.join(f'{i}(bloco={v})' for i, v in bloco_invalido_map.items())})")
lines.append(f"- Stale (>24h sem atualização): {total_stale}")
lines.append(f"- Decididas (arquivadas): {total_decididas}")
if collapsed_under:
    lines.append(f"- Colapsadas por supersede: {len(collapsed_under)} "
                 f"({', '.join(f'{o}→{n}' for o, n in collapsed_under.items())})")
if ingested_ids:
    lines.append(f"- Ingeridas nesta rodada: {len(ingested_ids)} "
                 f"({', '.join(f'{d}→{n}' for d, n in ingested_ids)})")
if updated_ids:
    lines.append(f"- Atualizadas por bloco manual nesta rodada: {len(updated_ids)} ({', '.join(updated_ids)})")
lines.append("")

if unparsed_blocks:
    lines.append("## ENTRADA MANUAL (não ingerido — verifique)")
    lines.append("")
    lines.append("> O render encontrou bloco(s) que não conseguiu entender (sem `- Estado:` "
                 "reconhecível, ou prosa fora do formato `## D-nnn — título`). NADA foi apagado — "
                 "o texto original está preservado abaixo verbatim. Corrija o formato e a próxima "
                 "rodada ingere, ou apague manualmente se não for mais válido.")
    lines.append("")
    for raw in unparsed_blocks:
        lines.append(raw.rstrip())
        lines.append("")
    lines.append("---")
    lines.append("")

lines.append("## ENTRADA MANUAL")
lines.append("")
lines.append("> Apêndice de emergência (preferir `decisao-nova.sh`). Formato: `## D-nnn — título` + os "
             "campos de sempre (Origem/Efeito/Recomendação/Estado). O id digitado é ignorado — a próxima "
             "rodada do decisoes-render.sh ingere e atribui o id real.")
lines.append("")

new_view = '\n'.join(lines).rstrip() + '\n'

tmpfd, tmp = tempfile.mkstemp(dir=T_DIR, prefix='.decisoes-view-', suffix='.tmp')
try:
    with os.fdopen(tmpfd, 'w', encoding='utf-8') as f:
        f.write(new_view)
    os.chmod(tmp, 0o644)
    os.replace(tmp, VIEW_MD)
except BaseException:
    try:
        os.unlink(tmp)
    except OSError:
        pass
    raise

# ---------- PASSO 3: ARQUIVO-decisoes.md ----------
with open(ARQUIVO_MD, encoding='utf-8') as f:
    arquivo_text = f.read()
already = set(re.findall(r'^## (D-\d+)', arquivo_text, re.MULTILINE))

decididas = [d for d in decisoes if d['estado'] != 'aberta' and d['id'] not in already]
decididas.sort(key=lambda d: (d.get('decidida_em') or '9999', idnum(d)))

if decididas:
    chunks = []
    for d in decididas:
        chunks.append(f"## {d['id']} — {d['titulo']}\n")
        chunks.append(f"- Origem: {d.get('origem') or '—'}\n")
        chunks.append(f"- Estado: {d['estado']}\n")
        chunks.append(f"- Decidida em: {d.get('decidida_em') or '(não extraído — ver narrativa)'}\n")
        chunks.append(f"- Decisão: {d.get('decisao') or '—'}\n")
        if d.get('narrativa'):
            chunks.append(f"- Narrativa completa: {d['narrativa']}\n")
        chunks.append('\n')
    block = ''.join(chunks).encode('utf-8')
    fd = os.open(ARQUIVO_MD, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    try:
        os.write(fd, block)
    finally:
        os.close(fd)

print(f"OK: render concluído — {total_abertas} abertas, {total_decididas} decididas, "
      f"{len(ingested_ids)} ingeridas, {len(updated_ids)} atualizadas por bloco manual, "
      f"{len(unparsed_blocks)} não entendidas, {len(decididas)} novas no ARQUIVO.")
PYEOF
