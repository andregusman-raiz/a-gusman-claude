#!/usr/bin/env bash
# Setup do MCP raiz-data-engine no Codex CLI — UNIVERSAL, para divulgar a qualquer pessoa.
# Idempotente. Roda em qualquer host com `codex` instalado.
#
# IMPORTANTE: o acesso NÃO é definido por este comando — é definido pelo PERFIL da pessoa
# no DE (login Google SSO). O DE emite o token com os scopes do perfil do email logado
# (oauth_user.py: base_scopes = profile.scopes - FORBIDDEN). Sem perfil → só read:knowledge
# (catálogo, zero dados). Por isso NÃO fixamos --scopes: o mesmo comando serve a todos os perfis.
#
# Caso A (máquina com browser): add + login OAuth nativo (authorization_code+PKCE).
#   Token cifrado no store local do Codex (Keychain no macOS), com refresh automático.
#   É POR-MÁQUINA: rode 1x em cada host.
#
# Caso B (headless/sem browser): use a env var RAIZ_DE_TOKEN (ver --bearer no fim).
#   Requer um access_token obtido em outro host — device flow está bloqueado no DCR público.
set -euo pipefail

NAME="raiz-data-engine"
URL="https://raiz-data-engine-production.up.railway.app/mcp"

mode="${1:-login}"

if [[ "$mode" == "--bearer" ]]; then
  # Caso B: servidor lê o bearer token de uma env var (headless-friendly, portável).
  codex mcp remove "$NAME" >/dev/null 2>&1 || true
  codex mcp add "$NAME" --url "$URL" --bearer-token-env-var RAIZ_DE_TOKEN
  echo "OK: '$NAME' configurado para ler bearer de \$RAIZ_DE_TOKEN."
  echo "Exporte RAIZ_DE_TOKEN=<access_token> antes de rodar o Codex."
  exit 0
fi

# Caso A: OAuth nativo do Codex.
if codex mcp get "$NAME" >/dev/null 2>&1; then
  echo "Servidor '$NAME' já existe na config."
else
  codex mcp add "$NAME" --url "$URL"
  echo "Servidor '$NAME' adicionado."
fi

echo "Iniciando login OAuth (abre o browser para consent)..."
# Sem --scopes: o DE concede o nível do perfil da pessoa logada (universal p/ qualquer perfil).
codex mcp login "$NAME"
echo "Pronto. Teste:  codex exec --dangerously-bypass-approvals-and-sandbox \\"
echo "  \"chame raiz-data-engine.kpi_value com kpi_id=C01 e responda value_formatted\""
