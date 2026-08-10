#!/usr/bin/env bash
# obscura-mcp.sh — Playwright MCP sobre Obscura (browser headless Rust, CDP externo)
# Sobe `obscura serve` na porta local se ainda nao estiver rodando e executa
# @playwright/mcp apontando para o endpoint CDP do Obscura.
#
# Rota hibrida (auditoria supply-chain 2026-08-09, veredito CAUTION):
#   - Obscura  = fetch/scrape/extracao DOM/automacao leve de agentes IA (rapido, ~30MB RAM)
#   - Chromium = QAT visual, screenshot calibrado, login persistente (plugin playwright oficial)
# Detalhes: .claude/rules/browser-localhost.md (secao Obscura).
#
# Ajustes via env: OBSCURA_BIN, OBSCURA_PORT.

set -euo pipefail

OBSCURA_BIN="${OBSCURA_BIN:-$HOME/.claude/tools/obscura/target/release/obscura}"
OBSCURA_PORT="${OBSCURA_PORT:-9222}"
ENDPOINT="http://127.0.0.1:${OBSCURA_PORT}"
LOG="$HOME/.claude/tools/obscura-serve.log"

if [[ ! -x "$OBSCURA_BIN" ]]; then
  echo "obscura-mcp: binario nao encontrado em $OBSCURA_BIN (build: cargo build --release em ~/.claude/tools/obscura)" >&2
  exit 1
fi

SERVE_ARGS=(serve --port "$OBSCURA_PORT")
# SSRF protection do Obscura bloqueia loopback/RFC1918 por default (seguro para scrape).
# Para permitir localhost (dev servers), exportar OBSCURA_ALLOW_PRIVATE=1 — mas QAT
# visual/localhost continua canonico no plugin playwright (Chromium).
if [[ "${OBSCURA_ALLOW_PRIVATE:-0}" == "1" ]]; then
  SERVE_ARGS+=(--allow-private-network)
fi

if ! curl -sf --max-time 2 "${ENDPOINT}/json/version" >/dev/null 2>&1; then
  nohup "$OBSCURA_BIN" "${SERVE_ARGS[@]}" >>"$LOG" 2>&1 &
  for _ in $(seq 1 25); do
    curl -sf --max-time 1 "${ENDPOINT}/json/version" >/dev/null 2>&1 && break
    sleep 0.2
  done
fi

if ! curl -sf --max-time 2 "${ENDPOINT}/json/version" >/dev/null 2>&1; then
  echo "obscura-mcp: obscura serve nao respondeu em ${ENDPOINT} (ver $LOG)" >&2
  exit 1
fi

exec npx -y @playwright/mcp@latest --cdp-endpoint "$ENDPOINT" "$@"
