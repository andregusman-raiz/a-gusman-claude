#!/usr/bin/env bash
# check-session.sh — testa se profile persistente tem sessão ativa em uma URL.
#
# Uso:
#   bash ~/.claude/scripts/playwright/check-session.sh <profile> <url> [min_body_length]
#
# Exemplos:
#   bash ~/.claude/scripts/playwright/check-session.sh biraiz https://biraiz.raizeducacao.com.br
#   bash ~/.claude/scripts/playwright/check-session.sh hubspot https://app.hubspot.com 500
#
# Exit codes:
#   0 = sessão ativa (body length >= min_body_length E URL não tem 'login'/'b2c'/'oauth')
#   1 = sessão expirada/inválida (precisa rodar persistent-login.sh)

set -euo pipefail

PROFILE_NAME="${1:?Uso: $0 <profile> <url> [min_body_length]}"
URL="${2:?Uso: $0 <profile> <url> [min_body_length]}"
MIN_LEN="${3:-100}"

PROFILE_DIR="$HOME/.cache/playwright-claude/${PROFILE_NAME}"

if [[ ! -d "$PROFILE_DIR" ]]; then
    echo "ERRO: profile não existe em $PROFILE_DIR" >&2
    echo "Execute primeiro: bash ~/.claude/scripts/playwright/persistent-login.sh $PROFILE_NAME $URL" >&2
    exit 1
fi

# Find python with playwright
PYTHON=""
for c in "${PWD}/.venv/bin/python" "${HOME}/Claude/GitHub/raiz-data-engine/.venv/bin/python" "/opt/homebrew/bin/python3" "/usr/bin/python3"; do
    if [[ -x "$c" ]] && "$c" -c "import playwright" 2>/dev/null; then
        PYTHON="$c"
        break
    fi
done
[[ -z "$PYTHON" ]] && { echo "ERRO: Python+playwright não encontrado" >&2; exit 1; }

"$PYTHON" - <<PYEOF
from playwright.sync_api import sync_playwright
from pathlib import Path
import sys

PROFILE = Path("$PROFILE_DIR")
URL = "$URL"
MIN_LEN = $MIN_LEN

with sync_playwright() as pw:
    ctx = pw.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE),
        headless=True,
        viewport={"width": 1440, "height": 900},
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    try:
        page.goto(URL, wait_until="networkidle", timeout=30000)
    except Exception as e:
        print(f"[!] Erro navegando: {e}")
        ctx.close()
        sys.exit(1)

    final_url = page.url
    body = page.evaluate("document.body ? document.body.innerText : ''")
    body_len = len(body)

    # Heurísticas de "logado"
    login_indicators = ["b2clogin", "oauth", "/login", "/signin", "/auth/"]
    on_login = any(ind in final_url.lower() for ind in login_indicators)
    has_content = body_len >= MIN_LEN

    print(f"URL final:   {final_url}")
    print(f"Body length: {body_len} (min: {MIN_LEN})")
    print(f"On login:    {on_login}")

    ctx.close()

    if on_login:
        print(f"[!] SESSÃO INVÁLIDA — redirecionou para login")
        sys.exit(1)
    if not has_content:
        print(f"[!] SESSÃO INVÁLIDA — body muito curto")
        sys.exit(1)
    print(f"[OK] SESSÃO ATIVA")
    sys.exit(0)
PYEOF
