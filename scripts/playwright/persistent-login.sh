#!/usr/bin/env bash
# persistent-login.sh — abre Chromium visual com profile dedicado para você logar 1x.
#
# Cookies/sessão persistem em ~/.cache/playwright-claude/<profile>/ e são reusados
# por TODOS os scripts headless que apontarem para o mesmo profile.
#
# Uso:
#   bash ~/.claude/scripts/playwright/persistent-login.sh <profile> <url> [duracao_minutos]
#
# Exemplos:
#   bash ~/.claude/scripts/playwright/persistent-login.sh biraiz https://biraiz.raizeducacao.com.br
#   bash ~/.claude/scripts/playwright/persistent-login.sh totvs-rm https://rm.totvs.com.br/login
#   bash ~/.claude/scripts/playwright/persistent-login.sh hubspot https://app.hubspot.com 15
#
# Como funciona:
#   1. Cria/usa profile em ~/.cache/playwright-claude/<profile>/
#   2. Abre janela Chromium visual no seu Mac
#   3. Você loga manualmente (Google/MS365/usuário+senha)
#   4. Janela fica aberta até VOCÊ fechar (ou timeout configurável, default 15min)
#   5. Cookies persistidos automaticamente — próximas execuções headless reusam

set -euo pipefail

PROFILE_NAME="${1:?Uso: $0 <profile> <url> [duracao_minutos]}"
URL="${2:?Uso: $0 <profile> <url> [duracao_minutos]}"
TIMEOUT_MIN="${3:-15}"

PROFILE_DIR="$HOME/.cache/playwright-claude/${PROFILE_NAME}"
mkdir -p "$PROFILE_DIR"

# Resolve venv Python — tenta venv local, senão Python global
PYTHON=""
for candidate in \
    "${PWD}/.venv/bin/python" \
    "${HOME}/Claude/GitHub/raiz-data-engine/.venv/bin/python" \
    "/opt/homebrew/bin/python3" \
    "/usr/bin/python3"; do
    if [[ -x "$candidate" ]]; then
        if "$candidate" -c "import playwright" 2>/dev/null; then
            PYTHON="$candidate"
            break
        fi
    fi
done

if [[ -z "$PYTHON" ]]; then
    echo "ERRO: nenhum Python com playwright instalado encontrado." >&2
    echo "Instale com: pip install playwright && playwright install chromium" >&2
    exit 1
fi

echo "[+] Profile:  $PROFILE_DIR"
echo "[+] URL:      $URL"
echo "[+] Timeout:  ${TIMEOUT_MIN} minutos"
echo "[+] Python:   $PYTHON"
echo "[+] Abrindo Chromium VISUAL — janela ficará aberta para você logar"
echo "[+] Feche a janela manualmente quando terminar (cookies salvos automaticamente)"
echo ""

"$PYTHON" - <<PYEOF
from playwright.sync_api import sync_playwright
from pathlib import Path
import time, sys

PROFILE = Path("$PROFILE_DIR")
URL = "$URL"
TIMEOUT_SEC = ${TIMEOUT_MIN} * 60

with sync_playwright() as pw:
    ctx = pw.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE),
        headless=False,
        viewport={"width": 1440, "height": 900},
        args=["--no-first-run", "--no-default-browser-check"],
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto(URL)

    print(f"[+] Janela aberta. Faça login e feche quando quiser (timeout {TIMEOUT_SEC}s)", flush=True)
    last_url = ""
    elapsed = 0
    while elapsed < TIMEOUT_SEC:
        time.sleep(2)
        elapsed += 2
        try:
            current = page.url
            if current != last_url:
                print(f"  [{elapsed}s] {current[:120]}", flush=True)
                last_url = current
        except Exception:
            print(f"  [{elapsed}s] janela fechada — saindo", flush=True)
            break

    try:
        ctx.close()
    except Exception:
        pass
    print(f"[+] OK — cookies salvos em {PROFILE}", flush=True)
PYEOF

echo ""
echo "[OK] Setup completo. Use o profile assim em scripts headless:"
echo ""
echo "  from playwright.sync_api import sync_playwright"
echo "  from pathlib import Path"
echo "  with sync_playwright() as pw:"
echo "      ctx = pw.chromium.launch_persistent_context("
echo "          user_data_dir=str(Path.home() / '.cache' / 'playwright-claude' / '${PROFILE_NAME}'),"
echo "          headless=True,"
echo "      )"
