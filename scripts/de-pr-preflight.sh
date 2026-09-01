#!/usr/bin/env bash
# de-pr-preflight.sh — réplica local dos 8 required checks do raiz-data-engine
# (fonte: mapeamento CI→local 2026-08-25; fila de PRs do DE — QUEUE.md).
# Rodar DE DENTRO do worktree do branch, ANTES de abrir PR / pedir review.
#
# Uso: de-pr-preflight.sh [--t0] [--fast] [--with-db] [--base <branch>]
#   --t0       só tier 0 (<1min): alembic single-head + index lint + base atualizada + despertador
#   --fast     tiers 0-1 (~4min): + registry, kpi-gate, auth, colisão NNN de migration
#   --with-db  inclui migration drift Camada A (exige Postgres postgis local)
#   --base     branch alvo do PR (default: auto-detectado via `gh pr view` se já houver PR
#              aberto para o branch atual; senão aws-prd — rota AWS, decisão 2026-08-25)
#   default    tudo menos --with-db (~25-30min; smoke shards em paralelo)
#
# Saída: resumo PASS/FAIL + log em ~/Claude/docs/ai-state/de-pr-queue/preflight-logs/
# Exit: 0 = OK abrir PR (falta só juiz adversarial) | 2 = corrigir FAILs antes
set -uo pipefail

T0ONLY=0 FAST=0 WITHDB=0 BASE="aws-prd" BASE_EXPLICIT=0
while [[ $# -gt 0 ]]; do case "$1" in
  --t0) T0ONLY=1;; --fast) FAST=1;; --with-db) WITHDB=1;; --base) BASE="$2"; BASE_EXPLICIT=1; shift;;
  *) echo "arg desconhecido: $1" >&2; exit 64;; esac; shift; done

# E-89 (medido 2026-09-01): 86% dos PRs abertos hoje têm base=main, não aws-prd — o default
# hardcoded (decisão 2026-08-25, quando aws-prd era a rota dominante) agora erra na maioria
# das corridas, com 2 FAILs falsos por vez (base-atualizada, pr-overlap contra a linha errada).
# Em vez de trocar o hardcode de um valor errado por outro (o mesmo defeito, invertido, no dia
# em que a proporção virar de novo), autodetectar: se já existe PR aberto para este branch, a
# base REAL dele é o facto — não uma suposição. --base explícito continua a vencer sempre.
if [[ "$BASE_EXPLICIT" -eq 0 ]] && command -v gh >/dev/null 2>&1; then
  detected_base="$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || true)"
  if [[ -n "$detected_base" ]]; then
    BASE="$detected_base"
    echo "base autodetectada via 'gh pr view': $BASE (use --base para forçar outra)" >&2
  fi
fi

# check pr-overlap (política 2026-08-26 "1 frente = 1 PR vivo"): arquivos gerados/quentes que
# TODO PR toca e não indicam overlap real — editar aqui se a lista mudar. alembic/versions/*.py
# fica de fora por padrão no código (check próprio: alembic-nnn-collision).
PR_OVERLAP_EXCLUDE=(
  'docs/integration/openapi-snapshot.json'
  'tests/ops/test_check_alembic_production_readiness.py'
  'CLAUDE.md'
  'uv.lock'
  'poetry.lock'
)

# decision-despertador (fix 2026-08-26): a checagem SEMPRE avalia origin/$DECISION_DESPERTADOR_MAIN,
# nunca o worktree — copia local pode estar atrás da main e reportar decisão já repactuada (falso FAIL).
DECISION_DESPERTADOR_MAIN="main"

REPO=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "não é repo git" >&2; exit 65; }
cd "$REPO"
case "$(git remote get-url origin 2>/dev/null)" in *raiz-data-engine*) ;; *) echo "não é o raiz-data-engine" >&2; exit 65;; esac
# worktree sem .venv próprio: testes de migration resolvem alembic via <raiz>/.venv/bin — symlink resolve.
# Incidente 25/08: symlink escapou de `.gitignore` (`.venv/` com barra não casa symlink) e foi commitado.
# Blindagem tripla: (a) remover o link ao sair se NÓS criamos; (b) info/exclude cobre worktrees; (c) tier 0 falha se .venv estiver no índice.
MAIN_ROOT="$(dirname "$(git rev-parse --git-common-dir)")"
if [[ ! -e "$REPO/.venv" && -d "$MAIN_ROOT/.venv" ]]; then
  ln -s "$MAIN_ROOT/.venv" "$REPO/.venv"
  trap 'rm -f "$REPO/.venv"' EXIT
fi
grep -qxE '\.venv' "$(git rev-parse --git-common-dir)/info/exclude" 2>/dev/null || echo ".venv" >> "$(git rev-parse --git-common-dir)/info/exclude"
[[ -f .venv/bin/activate ]] && source .venv/bin/activate

LOGDIR="$HOME/Claude/docs/ai-state/de-pr-queue/preflight-logs"
mkdir -p "$LOGDIR"
BR=$(git branch --show-current); TS=$(date +%Y%m%d-%H%M%S)
LOG="$LOGDIR/${TS}_${BR//\//-}.log"
declare -a RESULTS
t0=$SECONDS

run_check(){ local name="$1"; shift; local s=$SECONDS
  echo "── [$name] $*" >>"$LOG"
  if "$@" >>"$LOG" 2>&1; then RESULTS+=("PASS  $((SECONDS-s))s  $name"); return 0
  else RESULTS+=("FAIL  $((SECONDS-s))s  $name"); return 1; fi; }

summary(){ echo; echo "══ PREFLIGHT $1 ($((SECONDS-t0))s) — $BR vs $BASE ══"
  printf '%s\n' "${RESULTS[@]}"; echo "log: $LOG"
  if printf '%s\n' "${RESULTS[@]}" | grep -q '^FAIL'; then
    echo "→ NÃO abrir PR: corrigir FAILs."; exit 2
  fi; }

# extrai o prefixo NNN de "YYYYMMDD_HHMM-NNN_slug.py"; vazio se não casar a convenção
_migration_nnn() {
  local base; base=$(basename "$1")
  [[ "$base" =~ ^[0-9]{8}_[0-9]{4}-([0-9]+)_ ]] && echo "${BASH_REMATCH[1]}"
}

# timeout portátil (nem `timeout` nem `gtimeout` vêm por padrão no macOS): backgrounda,
# faz polling de 1s e mata ao estourar. Retorna 124 no timeout (convenção do GNU timeout).
_run_with_timeout() {
  local secs="$1"; shift
  "$@" & local pid=$! waited=0
  while kill -0 "$pid" 2>/dev/null && [[ $waited -lt $secs ]]; do sleep 1; waited=$((waited + 1)); done
  if kill -0 "$pid" 2>/dev/null; then kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 124; fi
  wait "$pid"
}

# cache compartilhado dos arquivos de PRs abertos — usado por alembic-nnn-collision E pr-overlap.
# Memoizado: 1 `gh pr list` + N `gh api .../files` por EXECUÇÃO do preflight, nunca 2x.
# Formato do cache: linhas "NUMERO_PR<TAB>arquivo". Sem array associativo de propósito
# (compat bash 3.2 — /usr/bin/env bash pode não ser o bash 5 do Homebrew em toda máquina).
_PR_FETCH_DONE=0   # 0=não tentado ainda; 1=tentativa concluída (sucesso ou falha)
_PR_FETCH_OK=0     # 1=gh respondeu (cache pode ficar vazio mesmo assim, se 0 PRs abertos)
_PR_FILES_CACHE=""
_PR_COUNT=0
_PR_SELF=""        # número do PR da branch atual, se houver (excluído da comparação)

_fetch_open_pr_files() {
  if [[ $_PR_FETCH_DONE -eq 1 ]]; then [[ $_PR_FETCH_OK -eq 1 ]] && return 0 || return 1; fi
  _PR_FETCH_DONE=1
  if ! command -v gh >/dev/null 2>&1; then
    echo "gh indisponível — cache de PRs abertos vazio (WARN, não bloqueia)." >&2
    return 1
  fi
  local prs_raw
  if ! prs_raw=$(gh pr list --state open --limit 100 --json number,headRefName \
                   -q '.[] | "\(.number)\t\(.headRefName)"' 2>/dev/null); then
    echo "gh pr list falhou (rede/auth) — cache de PRs abertos vazio (WARN, não bloqueia)." >&2
    return 1
  fi
  _PR_FETCH_OK=1
  # o PR da PRÓPRIA branch sai do cache: senão o branch colide/sobrepõe consigo mesmo e o check
  # vira ruído que sempre dispara (reportado por claude-10 no #6335, 26/08).
  local prs="" _n _h
  while IFS=$'\t' read -r _n _h; do
    [[ -z "$_n" ]] && continue
    if [[ -n "$BR" && "$_h" == "$BR" ]]; then _PR_SELF="$_n"; continue; fi
    prs+="$_n"$'\n'
  done <<< "$prs_raw"
  [[ -n "$_PR_SELF" ]] && echo "  (PR #$_PR_SELF é o desta branch — excluído da comparação)"
  _PR_COUNT=$(printf '%s\n' "$prs" | grep -c .)
  local owner_repo; owner_repo=$(git remote get-url origin | sed -E 's#\.git$##; s#.*[:/]([^/]+/[^/]+)$#\1#')
  local pr rf
  for pr in $prs; do
    while IFS= read -r rf; do
      [[ -n "$rf" ]] && _PR_FILES_CACHE+="$pr"$'\t'"$rf"$'\n'
    done < <(gh api "repos/$owner_repo/pulls/$pr/files" --paginate --jq '.[].filename' 2>/dev/null)
  done
  return 0
}

# colisão de NNN: migrations novas LOCAIS (ausentes em origin/$BASE) vs migrations de PRs abertos remotos.
# Causa nº1 de CR de migration (BOT-REVIEW-BEST-PRACTICES item 3). Short-circuit sem migration nova: zero rede.
alembic_nnn_collision() {
  local -a local_files=() local_nnns=()
  while IFS= read -r f; do [[ -n "$f" ]] && local_files+=("$f"); done < <(
    { git diff --name-only --diff-filter=A "origin/$BASE" HEAD -- 'alembic/versions/*.py' 2>/dev/null
      git status --porcelain -- 'alembic/versions/*.py' 2>/dev/null | awk '$1 ~ /^(\?\?|A)/ {print $2}'
    } | sort -u)
  if [[ ${#local_files[@]} -eq 0 ]]; then
    echo "sem migrations novas vs origin/$BASE — short-circuit, nenhuma chamada gh."; return 0
  fi
  local f nnn
  for f in "${local_files[@]}"; do nnn=$(_migration_nnn "$f"); [[ -n "$nnn" ]] && local_nnns+=("$nnn"); done
  if [[ ${#local_nnns[@]} -eq 0 ]]; then
    echo "arquivos novos não seguem convenção NNN (YYYYMMDD_HHMM-NNN_slug.py) — pulando colisão."; return 0
  fi
  echo "migrations novas locais: ${local_files[*]} (NNN: ${local_nnns[*]})"
  if ! _fetch_open_pr_files; then
    echo "colisão remota não verificada (não bloqueia)."; return 0
  fi
  local -a conflicts=()
  local pr rf rnnn nnn
  while IFS=$'\t' read -r pr rf; do
    [[ -z "$pr" ]] && continue
    case "$rf" in alembic/versions/*.py) ;; *) continue;; esac
    rnnn=$(_migration_nnn "$rf"); [[ -z "$rnnn" ]] && continue
    for nnn in "${local_nnns[@]}"; do [[ "$rnnn" == "$nnn" ]] && conflicts+=("PR #$pr: $rf (NNN=$rnnn)"); done
  done <<< "$_PR_FILES_CACHE"
  if [[ ${#conflicts[@]} -gt 0 ]]; then
    local maxnnn next
    maxnnn=$({ for x in alembic/versions/*.py; do _migration_nnn "$x"; done 2>/dev/null
      printf '%s\n' "${local_nnns[@]}"
      printf '%s\n' "${conflicts[@]}" | grep -oE 'NNN=[0-9]+' | cut -d= -f2
    } | sort -n | tail -1)
    next=$((10#${maxnnn:-0} + 1))
    echo "COLISÃO de NNN com PR(s) aberto(s):"; printf '  - %s\n' "${conflicts[@]}"
    echo "  → renumerar migration local para NNN=$next (head+1 livre) antes de abrir PR."
    return 1
  fi
  echo "sem colisão de NNN ($_PR_COUNT PRs abertos verificados)."
}

# colisão na camada `migrations/NNN_*.sql`, onde o NNN É A IDENTIDADE do script (diferente do
# Alembic, cuja identidade é a revision id inteira e o prefixo NNN é convenção). Por isso aqui a
# colisão morde de verdade — e há DOIS alvos: a própria base (número já usado = colisão garantida)
# e os PRs abertos. Caso real 26/08: #6281 cria migrations/617_legacy_route_hits.sql com a main já
# tendo 617_access_broker_api_key_grant_principal_backfill.sql.
# LIMITE DELIBERADO: compara só contra a base DO PR, nunca cruzando main × aws-prd. Durante a
# transição (D1) as duas linhas divergem por design (26/08: main no 617, aws-prd no 615; o mesmo
# `legacy_route_hits` é 617 na aws e 619 na main) — cruzar linhas dispararia em quase todo PR e o
# check viraria ruído ignorado. Convergência entre as linhas é decisão de fila/dono, não de gate.
_sql_nnn() { local b="${1##*/}"; [[ "$b" =~ ^([0-9]{3,})_ ]] && echo "${BASH_REMATCH[1]}"; }

sql_migration_nnn_collision() {
  local -a local_files=() local_nnns=()
  while IFS= read -r f; do [[ -n "$f" ]] && local_files+=("$f"); done < <(
    { git diff --name-only --diff-filter=A "origin/$BASE" HEAD -- 'migrations/*.sql' 2>/dev/null
      git status --porcelain -- 'migrations/*.sql' 2>/dev/null | awk '$1 ~ /^(\?\?|A)/ {print $2}'
    } | sort -u)
  if [[ ${#local_files[@]} -eq 0 ]]; then
    echo "sem migrations/*.sql novas vs origin/$BASE — short-circuit, nenhuma chamada gh."; return 0
  fi
  local f nnn
  for f in "${local_files[@]}"; do nnn=$(_sql_nnn "$f"); [[ -n "$nnn" ]] && local_nnns+=("$nnn"); done
  [[ ${#local_nnns[@]} -eq 0 ]] && { echo "arquivos novos fora da convenção NNN_slug.sql — pulando."; return 0; }
  echo "migrations/*.sql novas: ${local_files[*]} (NNN: ${local_nnns[*]})"

  # (1) contra a BASE — número já existe = colisão garantida, independe de PR aberto e não usa rede.
  local -a base_conflicts=()
  local bf bnnn
  while IFS= read -r bf; do
    bnnn=$(_sql_nnn "$bf"); [[ -z "$bnnn" ]] && continue
    for nnn in "${local_nnns[@]}"; do
      [[ "$bnnn" == "$nnn" ]] && [[ ! " ${local_files[*]} " == *" $bf "* ]] && base_conflicts+=("origin/$BASE: $bf (NNN=$bnnn)")
    done
  done < <(git ls-tree --name-only "origin/$BASE" migrations/ 2>/dev/null | grep -E '^migrations/[0-9]+_.*\.sql$')

  # (2) contra PRs abertos (cache compartilhado, self já excluído).
  local -a pr_conflicts=()
  if _fetch_open_pr_files; then
    local pr rf rnnn
    while IFS=$'\t' read -r pr rf; do
      [[ -z "$pr" ]] && continue
      case "$rf" in migrations/*.sql) ;; *) continue;; esac
      rnnn=$(_sql_nnn "$rf"); [[ -z "$rnnn" ]] && continue
      for nnn in "${local_nnns[@]}"; do
        [[ "$rnnn" == "$nnn" ]] && [[ "$rf" != "$(printf '%s\n' "${local_files[@]}" | grep -Fx "$rf")" ]] \
          && pr_conflicts+=("PR #$pr: $rf (NNN=$rnnn)")
      done
    done <<< "$_PR_FILES_CACHE"
  else
    echo "  (PRs abertos não verificados — sem rede; colisão contra a base ainda vale)"
  fi

  if [[ ${#base_conflicts[@]} -gt 0 || ${#pr_conflicts[@]} -gt 0 ]]; then
    local maxnnn next
    maxnnn=$({ git ls-tree --name-only "origin/$BASE" migrations/ 2>/dev/null | while IFS= read -r x; do _sql_nnn "$x"; done
      printf '%s\n' "${local_nnns[@]}"
      printf '%s\n' "${base_conflicts[@]}" "${pr_conflicts[@]}" | grep -oE 'NNN=[0-9]+' | cut -d= -f2
    } | grep -E '^[0-9]+$' | sort -n | tail -1)
    next=$((10#${maxnnn:-0} + 1))
    echo "COLISÃO de NNN em migrations/*.sql (aqui o número É a identidade do script):"
    [[ ${#base_conflicts[@]} -gt 0 ]] && printf '  - %s\n' "${base_conflicts[@]}"
    [[ ${#pr_conflicts[@]} -gt 0 ]] && printf '  - %s\n' "${pr_conflicts[@]}"
    echo "  → renumerar para NNN=$next (livre) — quem mergeia depois renumera."
    return 1
  fi
  echo "sem colisão de NNN em migrations/*.sql."
}

# despertador de decisões: SEMPRE contra origin/$DECISION_DESPERTADOR_MAIN (nunca o worktree).
# Fix 2026-08-26 pós-incidente: copia local defasada reportou 2 decisões vencidas já
# repactuadas via PR mergeado na main de manhã — falso FAIL. O checker só sabe ler
# governance/decisions_despertador.yaml relativo ao próprio arquivo (sem flag de path),
# então materializamos a versão da origin num diretório temporário com a mesma estrutura.
decision_despertador() {
  local script="scripts/ci/check_decision_despertador.py"
  local rc

  if ! _run_with_timeout 10 git fetch origin "$DECISION_DESPERTADOR_MAIN" --quiet 2>/dev/null; then
    echo "fetch origin/$DECISION_DESPERTADOR_MAIN falhou/offline (10s) — leitura LOCAL, possivelmente defasada vs main."
    python3 "$script"; rc=$?
    [[ $rc -ne 0 ]] && echo "  ⚠ vencida(s) na cópia LOCAL, sem confirmação contra a main — WARN offline, não bloqueia."
    return 0
  fi

  local yaml_remote
  if ! yaml_remote=$(git show "origin/$DECISION_DESPERTADOR_MAIN:governance/decisions_despertador.yaml" 2>/dev/null) || [[ -z "$yaml_remote" ]]; then
    echo "governance/decisions_despertador.yaml ausente/ilegível em origin/$DECISION_DESPERTADOR_MAIN — leitura LOCAL como fallback."
    python3 "$script"; rc=$?
    [[ $rc -ne 0 ]] && echo "  ⚠ vencida(s) na cópia LOCAL, sem referência confiável na main — WARN, não bloqueia."
    return 0
  fi

  local tmpd; tmpd=$(mktemp -d "${TMPDIR:-/tmp}/de-despertador.XXXXXX")
  mkdir -p "$tmpd/scripts/ci" "$tmpd/governance"
  cp "$script" "$tmpd/scripts/ci/check_decision_despertador.py"
  printf '%s\n' "$yaml_remote" > "$tmpd/governance/decisions_despertador.yaml"
  python3 "$tmpd/scripts/ci/check_decision_despertador.py"; rc=$?
  rm -rf "$tmpd"
  if [[ $rc -ne 0 ]]; then
    echo "decisão(ões) vencida(s) na origin/$DECISION_DESPERTADOR_MAIN — FAIL real (CI vermelho repo-wide, não é defasagem local)."
    return 1
  fi
  echo "despertador OK contra origin/$DECISION_DESPERTADOR_MAIN (fonte é a main, não o checkout local)."
  return 0
}

# pr-overlap (política 2026-08-26 "1 frente = 1 PR vivo"): branch atual toca os mesmos
# arquivos de um PR já aberto → orientar a ANEXAR em vez de abrir PR novo.
_pr_overlap_is_excluded() {
  local f="$1" x
  case "$f" in alembic/versions/*.py) return 0;; esac
  for x in "${PR_OVERLAP_EXCLUDE[@]}"; do [[ "$f" == "$x" ]] && return 0; done
  return 1
}

# classificação pura (sem rede) — testável isoladamente com globais fake:
#   _POC_CHANGED (array de arquivos pós-exclusão), _POC_CACHE (string "PR\tarquivo\n"), _POC_GH_OK (0/1)
# saída: _OVERLAP_VERDICT=PASS|WARN|FAIL, _OVERLAP_MSG=detalhe
_pr_overlap_classify() {
  _OVERLAP_VERDICT="PASS"; _OVERLAP_MSG=""
  if [[ ${#_POC_CHANGED[@]} -eq 0 ]]; then
    _OVERLAP_MSG="nenhum arquivo relevante alterado — nada para cruzar."; return 0
  fi
  if [[ $_POC_GH_OK -ne 1 ]]; then
    _OVERLAP_VERDICT="WARN"
    _OVERLAP_MSG="gh indisponível/rede falhou — overlap não verificado (não bloqueia)."
    return 0
  fi
  local -a pr_nums=() pr_counts=() pr_files_list=()
  local pr rf match c i found
  while IFS=$'\t' read -r pr rf; do
    [[ -z "$pr" ]] && continue
    match=0
    for c in "${_POC_CHANGED[@]}"; do [[ "$c" == "$rf" ]] && { match=1; break; }; done
    [[ $match -eq 0 ]] && continue
    found=-1
    for ((i=0; i<${#pr_nums[@]}; i++)); do [[ "${pr_nums[$i]}" == "$pr" ]] && { found=$i; break; }; done
    if [[ $found -eq -1 ]]; then
      pr_nums+=("$pr"); pr_counts+=(1); pr_files_list+=("$rf")
    else
      pr_counts[$found]=$(( pr_counts[$found] + 1 ))
      pr_files_list[$found]="${pr_files_list[$found]}, $rf"
    fi
  done <<< "$_POC_CACHE"

  if [[ ${#pr_nums[@]} -eq 0 ]]; then
    _OVERLAP_MSG="sem overlap com PRs abertos."; return 0
  fi

  local maxcount=0 maxidx=0
  for ((i=0; i<${#pr_nums[@]}; i++)); do
    (( pr_counts[i] > maxcount )) && { maxcount=${pr_counts[i]}; maxidx=$i; }
  done

  local -a lines=()
  for ((i=0; i<${#pr_nums[@]}; i++)); do
    lines+=("PR #${pr_nums[$i]}: ${pr_counts[$i]} arquivo(s) em comum (${pr_files_list[$i]})")
  done
  local detail; detail=$(printf '%s; ' "${lines[@]}")

  if [[ $maxcount -ge 3 ]]; then
    _OVERLAP_VERDICT="FAIL"
    _OVERLAP_MSG="overlap forte (>=3 arquivos) com PR #${pr_nums[$maxidx]}: ${pr_files_list[$maxidx]}.
  → default é ANEXAR ao PR #${pr_nums[$maxidx]} (push na branch do PR + re-request review) — política '1 frente = 1 PR vivo'.
  → abrir PR novo exige exceção explícita do coordenador da fila.
  Detalhe por PR: $detail"
  else
    _OVERLAP_VERDICT="WARN"
    _OVERLAP_MSG="overlap parcial (1-2 arquivos) com PR(s) aberto(s) — considere anexar ao PR em vez de abrir outro.
  Detalhe por PR: $detail"
  fi
  return 0
}

pr_overlap() {
  local -a raw_changed=()
  while IFS= read -r f; do [[ -n "$f" ]] && raw_changed+=("$f"); done < <(git diff --name-only "origin/$BASE...HEAD" 2>/dev/null)
  if [[ ${#raw_changed[@]} -eq 0 ]]; then
    echo "branch sem diff vs origin/$BASE — short-circuit, nenhuma chamada gh."; return 0
  fi
  _POC_CHANGED=()
  local f
  for f in "${raw_changed[@]}"; do _pr_overlap_is_excluded "$f" || _POC_CHANGED+=("$f"); done
  if [[ ${#_POC_CHANGED[@]} -eq 0 ]]; then
    echo "${#raw_changed[@]} arquivo(s) alterado(s), todos gerados/quentes (excluídos) — sem overlap real a avaliar."
    return 0
  fi
  echo "arquivos alterados relevantes (pós-exclusão): ${_POC_CHANGED[*]}"
  if _fetch_open_pr_files; then _POC_GH_OK=1; else _POC_GH_OK=0; fi
  _POC_CACHE="$_PR_FILES_CACHE"
  _pr_overlap_classify
  echo "$_OVERLAP_MSG"
  [[ "$_OVERLAP_VERDICT" == "FAIL" ]] && return 1
  return 0
}

# stubs canônicos do CI (checks 3/5/8)
export RDE_PANEL_AUDIT_BACKEND=noop RDE_RATE_LIMIT_DISABLED=1
export ENABLE_EDUCACIONAL_RESUMIDO=true ENABLE_PAINEL_KPI_EXECUTIVO_RESUMIDO=true
STUB_DB="postgresql://stub:stub@stub/stub"

echo "preflight $BR vs $BASE — log: $LOG"

## TIER 0 — fail fast (<1min)
git fetch origin "$BASE" --quiet 2>/dev/null || true
run_check "alembic-single-head" bash -c '[ "$(python3 scripts/_migration_heads_static.py alembic/versions | head -1)" = "1" ]' \
  || { summary "ABORT-multihead"; exit 2; }
run_check "index-concurrency-lint" python3 scripts/ci/lint_index_concurrency.py || true
# .venv NUNCA pode estar trackeado (symlink escapa de `.venv/` no gitignore; quebra CI com os-error-17)
run_check "venv-nao-trackeado" bash -c '! git ls-files -s | grep -qE "^120000 .*\.venv$|	\.venv$"' || true
# regra da fila: branch contém o tip da base (migration com pai stale = multi-head pós-merge)
run_check "base-atualizada($BASE)" git merge-base --is-ancestor "origin/$BASE" HEAD \
  || echo "  ⚠ rebase em origin/$BASE antes de abrir PR (strict:true exige de toda forma)"
# despertador de decisões vencidas (WS12-PR21 [C7]) — vencida = "Verify generated sections are
# in sync" fica vermelho repo-wide, independente do diff (checklist item 4 BOT-REVIEW-BEST-PRACTICES)
if [[ -f scripts/ci/check_decision_despertador.py ]]; then
  run_check "decision-despertador" decision_despertador \
    || echo "  ⚠ decisão vencida no despertador (origin/$DECISION_DESPERTADOR_MAIN) → CI vermelho repo-wide; avisar coordenador, NÃO tentar corrigir no seu PR"
else
  RESULTS+=("SKIP  -  decision-despertador (script ausente nesta branch)")
fi
[[ $T0ONLY -eq 1 ]] && { summary "--t0"; exit 0; }

## TIER 1 — estáticos rápidos (~4min)
run_check "registry-csv-drift" env PYTHONPATH=. DATABASE_URL="$STUB_DB" python scripts/ci/check_registry_csv_drift.py || true
run_check "action-matrix-csv" env DATABASE_URL="$STUB_DB" pytest tests/ci/test_action_matrix_csv_integrity.py -q || true
run_check "kpi-serving-gate" env DATABASE_URL="$STUB_DB" pytest tests/governance/test_kpi_serving_gate.py -q || true
# auth roda SEM DATABASE_URL de propósito (valida 401/503 sem bypass de DB)
run_check "auth-enforcement" env -u DATABASE_URL pytest tests/test_endpoints.py::TestAuthEnforcement tests/auth/test_grant_enforcement_middleware.py -q --override-ini="xfail_strict=true" || true
# colisão de prefixo NNN de migration com PR aberto remoto — causa nº1 de CR de migration (fila DE)
run_check "alembic-nnn-collision" alembic_nnn_collision || true
run_check "sql-migration-nnn-collision" sql_migration_nnn_collision || true
# overlap de arquivos com PR já aberto — política 2026-08-25 "1 frente = 1 PR vivo"
run_check "pr-overlap" pr_overlap || true
[[ $FAST -eq 1 ]] && { summary "--fast"; exit 0; }

## TIER 2 — pesados
run_check "dbt-deps-parse" bash -c 'mkdir -p ~/.dbt && cp -n dbt/profiles.example.yml ~/.dbt/profiles.yml 2>/dev/null; cd dbt && python -m dbt.cli.main deps -q && python -m dbt.cli.main parse --no-partial-parse -q' || true
run_check "admin-front-gate" bash -c "python scripts/ci/lint_admin_templates.py && python scripts/score_admin_front.py --gate 9.0 && DATABASE_URL='$STUB_DB' pytest tests/admin --cov=raiz_data_engine/admin --cov-report=json:coverage.json --cov-fail-under=70 -q && python scripts/ci/check_per_file_coverage.py --coverage-json coverage.json --floors scripts/ci/per_file_coverage_floors.json" || true

# smoke shards A+B em paralelo (~15min wall)
IGN=()
for f in tests/_smoke_suite_ignored_files.txt tests/_smoke_suite_known_failures.txt tests/_smoke_suite_covered_elsewhere.txt; do
  # strip de comentário inline (linhas têm "node_id  # motivo") + trim — senão o deselect nunca casa
  [[ -f $f ]] && while IFS= read -r l; do l="${l%%#*}"; l="${l%"${l##*[![:space:]]}"}"; [[ -n "$l" ]] && IGN+=("--deselect=$l"); done <"$f"
done
( DATABASE_URL="$STUB_DB" pytest tests/casework tests/reports tests/api tests/middleware tests/invariants tests/migrations tests/ops tests/geo_raiz tests/health --timeout=120 -q "${IGN[@]}" >"$LOG.shardA" 2>&1; echo $? >"$LOG.shardA.rc" ) &
( DATABASE_URL="$STUB_DB" pytest tests/admin tests/auth tests/governance tests/contracts tests/dominio tests/dbt tests/services tests/quality tests/scripts tests/sync tests/observability tests/mcp tests/security tests/identity_bridge tests/event_fabric --timeout=120 -q "${IGN[@]}" >"$LOG.shardB" 2>&1; echo $? >"$LOG.shardB.rc" ) &
wait
[[ "$(cat "$LOG.shardA.rc" 2>/dev/null)" = 0 ]] && RESULTS+=("PASS  -  smoke-shard-A") || RESULTS+=("FAIL  -  smoke-shard-A (ver $LOG.shardA)")
[[ "$(cat "$LOG.shardB.rc" 2>/dev/null)" = 0 ]] && RESULTS+=("PASS  -  smoke-shard-B") || RESULTS+=("FAIL  -  smoke-shard-B (ver $LOG.shardB)")

## TIER 3 — migration drift Camada A (opt-in; precisa Postgres postgis real)
if [[ $WITHDB -eq 1 ]]; then
  run_check "migration-drift-gate" bash -c 'RDE_GATE_DATABASE_URL="postgresql://gate:gate@localhost:5432/gate?sslmode=disable" pytest tests/migrations/test_migration_drift_gate.py -q && DATABASE_URL="postgresql://gate:gate@localhost:5432/gate?sslmode=disable" ALEMBIC_BOOT_TIMEOUT=0 SNAPSHOT_STALENESS_FAIL=1 bash scripts/ci/migration-drift-gate.sh' || true
else
  RESULTS+=("SKIP  -  migration-drift-gate (--with-db; CI cobre)")
fi

summary "COMPLETO"
echo "→ checks mecânicos OK. Falta: juiz adversarial (lente do bot) via coordenador da fila."
exit 0
