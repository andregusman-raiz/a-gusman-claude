#!/usr/bin/env bash
# cbuild — handoff SPEC → Codex (profile build: gpt-5.5 + xhigh).
# Fluxo híbrido Fable→Codex→Claude (rule: hybrid-fable-codex.md).
#
# Uso:
#   codex-build.sh <caminho-da-SPEC> [gates]
#   codex-build.sh docs/specs/SPEC-x.md "bun run typecheck && bun run lint && bun test"
#
# Sem [gates], tenta inferir do package.json do repo (typecheck/lint/test).
set -euo pipefail

SPEC="${1:?uso: codex-build.sh <spec.md> [gates]}"
[ -f "$SPEC" ] || { echo "❌ SPEC não encontrada: $SPEC" >&2; exit 1; }

# Gate anti-handoff-fraco: SPEC precisa ter critérios de aceite.
if ! grep -qiE "crit[ée]rios? de aceite|acceptance criteria" "$SPEC"; then
  echo "❌ SPEC sem seção de critérios de aceite — handoff bloqueado (rule hybrid-fable-codex §4)." >&2
  exit 2
fi

GATES="${2:-}"
if [ -z "$GATES" ]; then
  # Infere gates do package.json na raiz do repo da SPEC (best-effort).
  REPO_ROOT="$(cd "$(dirname "$SPEC")" && git rev-parse --show-toplevel 2>/dev/null || pwd)"
  if [ -f "$REPO_ROOT/package.json" ]; then
    for s in typecheck lint test; do
      if grep -q "\"$s\"" "$REPO_ROOT/package.json"; then
        GATES="${GATES:+$GATES && }bun run $s"
      fi
    done
  fi
  GATES="${GATES:-informe os gates do repo manualmente}"
fi

PROMPT="Implemente $SPEC À RISCA.
Não altere decisões de arquitetura. Se encontrar ambiguidade ou a SPEC conflitar com o código, PARE e liste as dúvidas — não improvise.
Ao final: rode: $GATES — e reporte o resultado real (falhas incluídas)."

echo "▶ codex --profile build exec (gpt-5.5 xhigh)"
echo "▶ SPEC: $SPEC"
echo "▶ Gates: $GATES"
exec codex --profile build exec "$PROMPT"
