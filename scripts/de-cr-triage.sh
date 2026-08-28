#!/usr/bin/env bash
# de-cr-triage.sh — triagem automática de CHANGES_REQUESTED do bot raiz-pr-bot-aws
# em um PR do raiz-data-engine. Classifica cada review em MECÂNICO /
# SUBSTANTIVO-ARQUIVO / SUBSTANTIVO-INFERÊNCIA e aponta a ação do playbook
# (fonte: ~/Claude/docs/ai-state/de-pr-queue/BOT-REVIEW-BEST-PRACTICES.md,
# seção "(iii) Playbook de resposta por tipo de CR").
#
# Uso: de-cr-triage.sh <pr-number> [--repo owner/repo]
#   --repo   default: descoberto via `gh repo view` no clone local do DE;
#            fallback hardcoded Raiz-Educacao-SA/raiz-data-engine.
#
# Read-only: só chamadas `gh pr view` (leitura). Não comenta, não dismissa,
# não faz merge. Exit 0 = triagem rodou (independente do resultado);
# exit 1 = falha de ambiente (gh ausente, rede, PR inexistente); 64 = uso.
set -uo pipefail

DEFAULT_REPO_ROOT="/Users/andregusmandeoliveira/Claude/GitHub/raiz-data-engine"
BOT="raiz-pr-bot-aws"

usage() { echo "uso: de-cr-triage.sh <pr-number> [--repo owner/repo]" >&2; exit 64; }

PR="" REPO=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="${2:-}"; [[ -n "$REPO" ]] || usage; shift 2;;
    -h|--help) usage;;
    *) if [[ -z "$PR" ]]; then PR="$1"; shift; else usage; fi;;
  esac
done
[[ -n "$PR" ]] || usage
[[ "$PR" =~ ^[0-9]+$ ]] || { echo "erro: <pr-number> deve ser numérico, recebido '$PR'" >&2; exit 64; }

command -v gh >/dev/null 2>&1 || { echo "erro: gh (GitHub CLI) não encontrado no PATH — instale/autentique antes de rodar." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "erro: jq não encontrado no PATH." >&2; exit 1; }

if [[ -z "$REPO" ]]; then
  if [[ -d "$DEFAULT_REPO_ROOT" ]]; then
    REPO=$(cd "$DEFAULT_REPO_ROOT" && gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
  fi
  REPO="${REPO:-Raiz-Educacao-SA/raiz-data-engine}"
fi

RAW_JSON=$(gh pr view "$PR" --repo "$REPO" --json reviews,url,title 2>&1)
RC=$?
if [[ $RC -ne 0 ]]; then
  echo "erro: falha ao consultar PR #$PR em $REPO via gh (rede, auth ou PR inexistente)." >&2
  echo "detalhe: $RAW_JSON" >&2
  exit 1
fi

REVIEWS_JSON=$(jq -c --arg bot "$BOT" '
  [.reviews[]? | select((.author.login // "") == $bot and .state == "CHANGES_REQUESTED")]
  | sort_by(.submittedAt)
' <<<"$RAW_JSON" 2>/dev/null)
if [[ -z "$REVIEWS_JSON" || "$REVIEWS_JSON" == "null" ]]; then
  echo "erro: não consegui parsear reviews do PR #$PR (jq falhou ou payload inesperado do gh)." >&2
  exit 1
fi

COUNT=$(jq 'length' <<<"$REVIEWS_JSON")
TITLE=$(jq -r '.title' <<<"$RAW_JSON")
URL=$(jq -r '.url' <<<"$RAW_JSON")

echo "PR #$PR — $TITLE"
echo "$URL"
echo "CHANGES_REQUESTED de $BOT: $COUNT"
echo

if [[ "$COUNT" -eq 0 ]]; then
  echo "(nenhum CR de $BOT encontrado neste PR)"
  echo
  echo "⛔ NUNCA dismissar review do bot por conta própria — dismissal só via coordenador com autorização do dono (QUEUE.md regra 0.6)."
  exit 0
fi

# Padrões de classificação (playbook (iii) do BOT-REVIEW-BEST-PRACTICES.md)
GATE_PATTERN='Smoke suite|smoke shard|Alembic single-head|migration drift|Verify generated sections|Admin front gate|SDK gate|Generator unit tests|Registry vs|lint-imports|conflito de merge|não pôde ser atualizada|branch behind'
FILELINE_PATTERN='[A-Za-z0-9_./-]+\.(py|sql|ya?ml|yml|md|ts):[0-9]+'
PATH_PATTERN='(^|[^A-Za-z0-9_])(app|alembic|scripts|tests)/[A-Za-z0-9_./-]+'

MECANICO=0 SUBST_ARQ=0 SUBST_INF=0 SUBST_CYCLES=0 i=0

printf '%-3s %-12s %-24s %s\n' "#" "DATA" "CLASSE" "AÇÃO (playbook)"
printf '%-3s %-12s %-24s %s\n' "---" "------------" "------------------------" "----------------------------------------"

while IFS=$'\t' read -r submitted body; do
  i=$((i + 1))
  has_gate=0 has_fileline=0
  grep -qiE "$GATE_PATTERN" <<<"$body" && has_gate=1
  { grep -qE "$FILELINE_PATTERN" <<<"$body" || grep -qE "$PATH_PATTERN" <<<"$body"; } && has_fileline=1

  if [[ $has_gate -eq 1 && $has_fileline -eq 0 ]]; then
    CLASS="MECÂNICO"
    ACAO="curar causa raiz (billing/despertador/flake/update-branch) + re-solicitar; NUNCA patchar código"
    MECANICO=$((MECANICO + 1))
  elif [[ $has_fileline -eq 1 ]]; then
    CLASS="SUBSTANTIVO-ARQUIVO"
    ACAO="calibração 5/5 real (regra 0.5) -> corrigir DIRETO, sem contestar"
    SUBST_ARQ=$((SUBST_ARQ + 1))
    SUBST_CYCLES=$((SUBST_CYCLES + 1))
  else
    CLASS="SUBSTANTIVO-INFERÊNCIA"
    ACAO="calibração 2/2 ERRADA (regra 0.5) -> ler código antes de obedecer; contestar c/ evidência se refutável"
    SUBST_INF=$((SUBST_INF + 1))
    SUBST_CYCLES=$((SUBST_CYCLES + 1))
  fi

  DATESHORT=$(cut -c1-10 <<<"$submitted")
  printf '%-3s %-12s %-24s %s\n' "$i" "$DATESHORT" "$CLASS" "$ACAO"
done < <(jq -r '.[] | [.submittedAt, ((.body // "") | gsub("\r\n|\n|\t"; " "))] | @tsv' <<<"$REVIEWS_JSON")

echo
echo "Resumo: MECÂNICO=$MECANICO  SUBSTANTIVO-ARQUIVO=$SUBST_ARQ  SUBSTANTIVO-INFERÊNCIA=$SUBST_INF  (ciclos substantivos=$SUBST_CYCLES)"

if [[ "$SUBST_CYCLES" -ge 3 ]]; then
  echo
  echo "⚠️⚠️⚠️ REGRA DOS 3 CICLOS: $SUBST_CYCLES ciclos substantivos sem convergir neste PR."
  echo "    Não insistir em mais um patch incremental — voltar para SPEC/redesign"
  echo "    (mesmo padrão de #6306 e #6301). Ver BOT-REVIEW-BEST-PRACTICES.md seção (iii)."
fi

echo
echo "⛔ NUNCA dismissar review do bot por conta própria — dismissal só via coordenador com autorização do dono (QUEUE.md regra 0.6)."
