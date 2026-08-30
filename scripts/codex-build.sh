#!/usr/bin/env bash
# cbuild v2 — handoff SPEC → Codex (profile build), rule: hybrid-fable-codex.md.
# Fases mecanizadas: spec-lint → worktree isolado → prompt com guardrails →
# codex exec → re-verificação local dos gates → log em ~/.codex/handoffs.jsonl.
#
# Uso:
#   codex-build.sh [--dry-run] [--no-worktree] <caminho-da-SPEC> [gates]
#   codex-build.sh docs/specs/SPEC-x.md "bun run typecheck && bun run lint && bun test"
#
# Sem [gates], infere do package.json do repo (typecheck/lint/test via bun run).
# Bypass do spec-lint: CBUILD_LINT_RELAX=1 (avisa, não bloqueia).
set -euo pipefail

DRY=0; NOWT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift ;;
    --no-worktree) NOWT=1; shift ;;
    --*) echo "❌ flag desconhecida: $1" >&2; exit 1 ;;
    *) break ;;
  esac
done

SPEC="${1:?uso: codex-build.sh [--dry-run] [--no-worktree] <spec.md> [gates]}"
[ -f "$SPEC" ] || { echo "❌ SPEC não encontrada: $SPEC" >&2; exit 1; }
SPEC_ABS="$(cd "$(dirname "$SPEC")" && pwd)/$(basename "$SPEC")"

# ── spec-lint (rule hybrid-fable-codex §Requisitos) ──────────────────────────
lint_fail=""
grep -qiE "crit[ée]rios? de aceite|acceptance criteria" "$SPEC_ABS" \
  || lint_fail="$lint_fail\n  - sem seção de critérios de aceite"
grep -qiE "escopo negativo|n[aã]o tocar|out of scope|do not touch" "$SPEC_ABS" \
  || lint_fail="$lint_fail\n  - sem escopo negativo (o que NÃO tocar)"

# Verde falso medido 2026-08-30: os greps acima varrem o FICHEIRO INTEIRO, logo uma
# SPEC com N work-streams passa se apenas UM deles tiver escopo negativo. Presença
# no ficheiro não é presença na secção. Quando houver >=2 work-streams, exigir os
# marcadores em CADA um. Abaixo de 2, mantém-se o comportamento antigo.
ws_lint="$(awk '
  /^#{2,4}[[:space:]]*(WS-|E-[0-9]|Onda[[:space:]]|Fase[[:space:]])/ {
    if (n > 0) { if (!ac[n]) falta = falta " " nome[n] ":aceite"; if (!en[n]) falta = falta " " nome[n] ":escopo-negativo" }
    n++; nome[n] = $0; sub(/^#+[[:space:]]*/, "", nome[n]); sub(/[[:space:]].*$/, "", nome[n]); next
  }
  n > 0 && tolower($0) ~ /crit[eé]rios? de aceite|acceptance criteria/ { ac[n] = 1 }
  n > 0 && tolower($0) ~ /escopo negativo|n[aã]o tocar|out of scope|do not touch/ { en[n] = 1 }
  END {
    if (n > 0) { if (!ac[n]) falta = falta " " nome[n] ":aceite"; if (!en[n]) falta = falta " " nome[n] ":escopo-negativo" }
    if (n >= 2 && falta != "") print falta
  }
' "$SPEC_ABS")"
if [ -n "$ws_lint" ]; then
  lint_fail="$lint_fail\n  - work-streams sem marcador PRÓPRIO (presença no ficheiro != na secção):$ws_lint"
fi
if grep -qiE "\bTBD\b|a definir" "$SPEC_ABS"; then
  lint_fail="$lint_fail\n  - contém 'TBD'/'a definir' (decisões não fechadas)"
fi
if [ -n "$lint_fail" ]; then
  if [ "${CBUILD_LINT_RELAX:-0}" = "1" ]; then
    printf "⚠️  spec-lint (relaxado via CBUILD_LINT_RELAX):%b\n" "$lint_fail" >&2
  else
    printf "❌ spec-lint bloqueou o handoff:%b\n   Corrija a SPEC ou use CBUILD_LINT_RELAX=1.\n" "$lint_fail" >&2
    exit 2
  fi
fi

# ── repo + gates ─────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "$SPEC_ABS")" && git rev-parse --show-toplevel 2>/dev/null || pwd)"
SPEC_REL="${SPEC_ABS#"$REPO_ROOT"/}"

GATES="${2:-}"
if [ -z "$GATES" ]; then
  if [ -f "$REPO_ROOT/package.json" ]; then
    for s in typecheck lint test; do
      if grep -q "\"$s\"" "$REPO_ROOT/package.json"; then
        GATES="${GATES:+$GATES && }bun run $s"
      fi
    done
  fi
fi
[ -n "$GATES" ] || { echo "❌ gates não inferíveis — passe-os como 2º argumento." >&2; exit 3; }

# ── worktree isolado (regra 5) ───────────────────────────────────────────────
SLUG="$(basename "$SPEC_ABS" .md | sed 's/^SPEC-//' | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-*//;s/-*$//')"
BRANCH="codex/$SLUG"
WT="$REPO_ROOT/.codex/worktrees/$SLUG"
WORKDIR="$REPO_ROOT"
if [ "$NOWT" = "0" ]; then
  [ -e "$WT" ] && { echo "❌ worktree já existe: $WT — remova ou use outro slug." >&2; exit 4; }
  WORKDIR="$WT"
fi

# ── prompt canônico + guardrails anti-destrutivos ────────────────────────────
PROMPT="Implemente a SPEC $SPEC_REL À RISCA.
Não altere decisões de arquitetura. Se encontrar ambiguidade ou a SPEC conflitar com o código, PARE e liste as dúvidas — não improvise.
GUARDRAILS BLOQUEADORES:
- NUNCA delete/mova arquivos fora deste worktree ($WORKDIR).
- NUNCA toque banco, infra, secrets ou serviços externos (nem 'para testar').
- NUNCA git push --force, reset --hard em branch compartilhada, ou rm -rf.
- Ação irreversível ou fora do escopo da SPEC → PARE e pergunte.
Trabalhe apenas na branch $BRANCH deste worktree; commits em conventional commits EN.
Ao final: rode: $GATES — e reporte o resultado real (falhas incluídas)."

echo "▶ SPEC:     $SPEC_REL  (repo: $REPO_ROOT)"
echo "▶ Worktree: $([ "$NOWT" = "1" ] && echo "DESATIVADO (--no-worktree)" || echo "$WT ($BRANCH)")"
echo "▶ Gates:    $GATES"
if [ "$DRY" = "1" ]; then
  printf "▶ DRY-RUN — prompt que seria enviado:\n---\n%s\n---\n" "$PROMPT"
  exit 0
fi

if [ "$NOWT" = "0" ]; then
  # 30/08 (Codex-juiz, achado P8): antes de abrir worktree, correr o critério RED/aceite contra o head ATUAL —
  # se já passa, o build é no-op (caso medido hoje: R4b/R4c/R4d já estavam no main; 3 greps evitavam o ciclo inteiro).
  if [[ -n "${CBUILD_RED_COMMAND:-}" ]] && (cd "$REPO_ROOT" && bash -c "$CBUILD_RED_COMMAND" >/dev/null 2>&1); then
    printf 'ALREADY_SATISFIED: CBUILD_RED_COMMAND passa no head atual (%s) — nada a construir.\n' "$(git -C "$REPO_ROOT" rev-parse --short HEAD)" >&2
    exit 20
  fi
  git -C "$REPO_ROOT" worktree add "$WT" -b "$BRANCH"
  # SPEC recém-escrita/editada pode não estar commitada — sincroniza no worktree
  if ! cmp -s "$SPEC_ABS" "$WT/$SPEC_REL" 2>/dev/null; then
    mkdir -p "$WT/$(dirname "$SPEC_REL")"
    cp "$SPEC_ABS" "$WT/$SPEC_REL"
    echo "▶ SPEC divergia do commit — versão do working tree copiada para o worktree."
  fi
fi

# ── build ────────────────────────────────────────────────────────────────────
# `--` obrigatório (codex-cli >=0.145): sem ele o exec ignora o prompt posicional,
# lê stdin vazio e sai 0 sem fazer NADA — "success vazio" (gotcha 2026-07-23).
echo "▶ codex --profile build exec (em $WORKDIR)"
CODEX_EXIT=0
( cd "$WORKDIR" && codex --profile build exec -- "$PROMPT" ) || CODEX_EXIT=$?

# Guard anti-success-vazio: exec "ok" sem NENHUMA mudança no worktree = falha.
if [ "$CODEX_EXIT" = "0" ] && [ "$NOWT" != "1" ]; then
  CHANGED=$(git -C "$WORKDIR" status --porcelain | grep -cv "^?? docs/specs/" || true)
  AHEAD=$(git -C "$WORKDIR" rev-list --count "@{u}..HEAD" 2>/dev/null || git -C "$WORKDIR" rev-list --count "$(git -C "$REPO_ROOT" rev-parse HEAD)..HEAD" 2>/dev/null || echo 0)
  if [ "${CHANGED:-0}" = "0" ] && [ "${AHEAD:-0}" = "0" ]; then
    echo "❌ codex exec saiu 0 mas NÃO produziu nenhuma mudança (success vazio) — abortando." >&2
    CODEX_EXIT=97
  fi
fi

# ── re-verificação local dos gates (regra 3: não confiar no 'passou') ────────
GATES_EXIT=0
echo "▶ Re-rodando gates localmente (não confio no reporte do Codex)…"
( cd "$WORKDIR" && bash -c "$GATES" ) || GATES_EXIT=$?
[ "$GATES_EXIT" = "0" ] && echo "✅ gates locais: PASS" || echo "❌ gates locais: FAIL (exit $GATES_EXIT)"

# ── log auditável ────────────────────────────────────────────────────────────
printf '{"ts":"%s","spec":"%s","repo":"%s","branch":"%s","worktree":"%s","gates":"%s","codex_exit":%d,"gates_exit":%d}\n' \
  "$(date -u +%FT%TZ)" "$SPEC_REL" "$REPO_ROOT" "$BRANCH" "$([ "$NOWT" = "1" ] && echo "-" || echo "$WT")" \
  "$(printf '%s' "$GATES" | sed 's/"/\\"/g')" "$CODEX_EXIT" "$GATES_EXIT" >> "$HOME/.codex/handoffs.jsonl"

echo ""
echo "▶ Próximos passos (rule hybrid-fable-codex, fases 3-4):"
echo "  REVIEW:   no Claude Code → revisar diff de $BRANCH (pr-review-toolkit:code-reviewer)"
echo "  SIMPLIFY: passe de minimalidade antes do merge (obrigatório)"
[ "$CODEX_EXIT" = "0" ] && [ "$GATES_EXIT" = "0" ]
