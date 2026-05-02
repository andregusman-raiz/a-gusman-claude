#!/usr/bin/env bash
# playwright-persistent-login.sh
# Abre browser Playwright com profile persistente para um projeto especifico.
# Primeira run: usuario faz login manual. Runs subsequentes: ja entra logado.
#
# Modos:
#   bash playwright-persistent-login.sh <projeto> [url]
#       → profile isolado por projeto
#
#   bash playwright-persistent-login.sh --sso <projeto> [url]
#       → usa profile google-sso compartilhado, auto-clica "Sign in with Google"
#
#   bash playwright-persistent-login.sh --google
#       → abre direto google.com no profile google-sso para fazer login Google 1x
#
# Compativel com bash 3.2+ (macOS default) — sem associative arrays.

set -eo pipefail

USE_SSO=0
GOOGLE_LOGIN=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --sso)
      USE_SSO=1
      shift
      ;;
    --google)
      GOOGLE_LOGIN=1
      shift
      ;;
    -h|--help)
      cat <<EOF
Uso:
  bash playwright-persistent-login.sh <projeto> [url]       (profile isolado)
  bash playwright-persistent-login.sh --sso <projeto> [url] (Google SSO)
  bash playwright-persistent-login.sh --google              (login Google 1x)

Projetos disponiveis:
  raiz-platform           http://localhost:3000      (Supabase + Google OAuth)
  profdigital             http://localhost:3001
  automata                http://localhost:3002
  totvs-educacional       http://localhost:3003      (TOTVS Auth — sem SSO)
  sophia-educacional      http://localhost:3004
  fgts-platform           http://localhost:3005
  raiz-agent-dashboard    http://localhost:4200
  chamada-app             http://localhost:3001      (TOTVS Auth — sem SSO)
  jusraiz                 https://app.jusraiz.com
  salarios-platform       http://localhost:3000
  bi-raiz                 http://localhost:3000
  biraiz                  \$BIRAIZ_URL (default: https://biraiz.\${COMPANY_DOMAIN:-example.com})
  supabase-studio         https://supabase.com/dashboard
  vercel-dashboard        https://vercel.com/dashboard
  hubspot                 https://app.hubspot.com
  github                  https://github.com         (sem SSO Google)
  sentry                  https://sentry.io

Workflow recomendado para Google SSO:
  1. bash playwright-persistent-login.sh --google
     → Login no Google 1x, fechar browser
  2. bash playwright-persistent-login.sh --sso raiz-platform
     → Auto-clica "Sign in with Google" → autenticado
  3. bash playwright-persistent-login.sh --sso supabase-studio
     → Mesma sessao Google reusada
EOF
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

BIRAIZ_URL="${BIRAIZ_URL:-https://biraiz.${COMPANY_DOMAIN:-example.com}}"

PROJECT="${1:-}"
URL="${2:-}"

if [ "$GOOGLE_LOGIN" -eq 1 ]; then
  PROJECT="google-sso"
  if [ -z "$URL" ]; then
    URL="https://accounts.google.com"
  fi
fi

if [ -z "$PROJECT" ]; then
  echo "Erro: projeto obrigatorio. Use --help para ver opcoes." >&2
  exit 1
fi

# Map projeto -> URL default (case ao inves de associative array para bash 3.2)
get_default_url() {
  case "$1" in
    raiz-platform)         echo "http://localhost:3000" ;;
    profdigital)           echo "http://localhost:3001" ;;
    automata)              echo "http://localhost:3002" ;;
    totvs-educacional)     echo "http://localhost:3003" ;;
    sophia-educacional)    echo "http://localhost:3004" ;;
    fgts-platform)         echo "http://localhost:3005" ;;
    raiz-agent-dashboard)  echo "http://localhost:4200" ;;
    chamada-app)           echo "http://localhost:3001" ;;
    jusraiz)               echo "https://app.jusraiz.com" ;;
    salarios-platform)     echo "http://localhost:3000" ;;
    bi-raiz)               echo "http://localhost:3000" ;;
    biraiz)                echo "$BIRAIZ_URL" ;;
    supabase-studio)       echo "https://supabase.com/dashboard" ;;
    vercel-dashboard)      echo "https://vercel.com/dashboard" ;;
    hubspot)               echo "https://app.hubspot.com" ;;
    github)                echo "https://github.com" ;;
    sentry)                echo "https://sentry.io" ;;
    google-sso)            echo "https://accounts.google.com" ;;
    *)                     echo "" ;;
  esac
}

# Apps SEM Google SSO (auth proprio)
project_supports_sso() {
  case "$1" in
    totvs-educacional|chamada-app|github)
      return 1  # nao suporta
      ;;
    *)
      return 0  # suporta
      ;;
  esac
}

# Validacao SSO
if [ "$USE_SSO" -eq 1 ]; then
  if ! project_supports_sso "$PROJECT"; then
    echo "Erro: '$PROJECT' nao suporta Google SSO. Use modo isolado." >&2
    exit 2
  fi
  PROFILE_NAME="google-sso"
else
  PROFILE_NAME="$PROJECT"
fi

PROFILE_DIR="$HOME/.cache/playwright-claude/$PROFILE_NAME"

if [ -z "$URL" ]; then
  URL=$(get_default_url "$PROJECT")
fi

if [ -z "$URL" ]; then
  echo "Erro: projeto '$PROJECT' nao tem URL default. Passe URL explicito." >&2
  exit 2
fi

mkdir -p "$PROFILE_DIR"

# Cleanup de stale locks deixados por instancia anterior
# (Chromium recusa abrir profile com SingletonLock orfao)
for lock in SingletonLock SingletonCookie SingletonSocket; do
  if [ -L "$PROFILE_DIR/$lock" ] || [ -e "$PROFILE_DIR/$lock" ]; then
    rm -f "$PROFILE_DIR/$lock"
  fi
done

# Matar processos Chromium orfaos apontando para este profile
if pgrep -f "user-data-dir=$PROFILE_DIR" > /dev/null 2>&1; then
  echo "[persistent-login] processos Chromium orfaos detectados — limpando..."
  pkill -f "user-data-dir=$PROFILE_DIR" 2>/dev/null || true
  sleep 1
fi

if [ -d "$PROFILE_DIR/Default" ]; then
  echo "[persistent-login] reusando profile: $PROFILE_DIR"
else
  echo "[persistent-login] PRIMEIRA RUN — profile novo: $PROFILE_DIR"
fi

if [ "$USE_SSO" -eq 1 ]; then
  echo "[persistent-login] modo SSO ativo — auto-clicara 'Sign in with Google'"
fi

echo "[persistent-login] navegando para: $URL"
echo "[persistent-login] FECHE o browser ao terminar — sessao sera salva"

# Localizar Playwright
PLAYWRIGHT_PKG="$HOME/Claude/GitHub/raiz-platform/node_modules/playwright"
if [ ! -d "$PLAYWRIGHT_PKG" ]; then
  echo "Erro: playwright nao encontrado em $PLAYWRIGHT_PKG" >&2
  echo "Rode 'npm install' em ~/Claude/GitHub/raiz-platform/" >&2
  exit 3
fi

# Inline node script: launchPersistentContext + auto-click Google
node -e "
const { chromium } = require('$PLAYWRIGHT_PKG');
const USE_SSO = $USE_SSO;
const PROJECT = '$PROJECT';

const googleButtonPatterns = [
  /sign in with google/i,
  /continue with google/i,
  /log ?in with google/i,
  /entrar com google/i,
  /continuar com google/i,
];

async function tryClickGoogle(page) {
  for (const pattern of googleButtonPatterns) {
    const button = page.getByRole('button', { name: pattern }).first();
    const link = page.getByRole('link', { name: pattern }).first();
    for (const candidate of [button, link]) {
      try {
        if (await candidate.isVisible({ timeout: 1500 })) {
          await candidate.click();
          await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
          return true;
        }
      } catch {}
    }
  }
  const generic = page.locator('button:has-text(\"Google\"), a:has-text(\"Google\")').first();
  try {
    if (await generic.isVisible({ timeout: 1500 })) {
      await generic.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      return true;
    }
  } catch {}
  return false;
}

(async () => {
  const ctx = await chromium.launchPersistentContext('$PROFILE_DIR', {
    channel: 'chromium',
    headless: false,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto('$URL', { waitUntil: 'domcontentloaded', timeout: 60000 });

  if (USE_SSO && PROJECT !== 'google-sso') {
    const clicked = await tryClickGoogle(page);
    if (clicked) {
      console.log('[persistent-login] auto-clicou Google login');
    } else {
      console.log('[persistent-login] botao Google nao detectado — login manual');
    }
  }

  console.log('[persistent-login] browser aberto. Feche para salvar sessao.');

  // Aguarda fechamento detectando: (a) ctx close event, (b) ultima page fechada
  await new Promise((resolve) => {
    let closed = false;
    const finish = () => { if (!closed) { closed = true; resolve(); } };
    ctx.on('close', finish);
    ctx.on('page', (newPage) => {
      newPage.on('close', () => {
        if (ctx.pages().length === 0) finish();
      });
    });
    for (const p of ctx.pages()) {
      p.on('close', () => {
        if (ctx.pages().length === 0) finish();
      });
    }
  });

  try { await ctx.close(); } catch {}
  console.log('[persistent-login] sessao salva em: $PROFILE_DIR');
  process.exit(0);
})().catch((err) => {
  console.error('[persistent-login] ERRO:', err.message);
  process.exit(1);
});
"
