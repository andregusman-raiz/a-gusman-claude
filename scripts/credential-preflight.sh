#!/bin/bash
# credential-preflight.sh — Valida credenciais antes de test suites
# Usage: bash credential-preflight.sh [project-root]
# Exit: 0=OK, 1=WARN, 2=FAIL

PROJECT="${1:-.}"
ERRORS=0; WARNINGS=0

# Encontrar .env
ENV=""
for f in "$PROJECT/.env.local" "$PROJECT/.env"; do
  [ -f "$f" ] && ENV="$f" && break
done

if [ -z "$ENV" ]; then
  echo "PREFLIGHT WARN: Nenhum .env encontrado em $PROJECT"
  exit 1
fi

# Supabase
SUPA_URL=$(grep -E '^(NEXT_PUBLIC_)?SUPABASE_URL=' "$ENV" 2>/dev/null | head -1 | cut -d= -f2-)
SUPA_KEY=$(grep -E '^(NEXT_PUBLIC_)?SUPABASE_ANON_KEY=' "$ENV" 2>/dev/null | head -1 | cut -d= -f2-)
if [ -n "$SUPA_URL" ] && [ -n "$SUPA_KEY" ]; then
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $SUPA_KEY" "$SUPA_URL/rest/v1/" --max-time 5 2>/dev/null)
  case "$HTTP" in
    200|30*) echo "OK: Supabase ($HTTP)" ;;
    401|403) echo "FAIL: Supabase key invalida ($HTTP)"; ERRORS=$((ERRORS+1)) ;;
    000)     echo "FAIL: Supabase unreachable"; ERRORS=$((ERRORS+1)) ;;
    *)       echo "OK: Supabase ($HTTP)" ;;
  esac
fi

# OpenAI (se presente)
AI_KEY=$(grep -E '^OPENAI_API_KEY=' "$ENV" 2>/dev/null | head -1 | cut -d= -f2-)
if [ -n "$AI_KEY" ]; then
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $AI_KEY" "https://api.openai.com/v1/models" --max-time 5 2>/dev/null)
  case "$HTTP" in
    200) echo "OK: OpenAI" ;;
    401|403) echo "FAIL: OpenAI key expirada ($HTTP)"; ERRORS=$((ERRORS+1)) ;;
    *)   echo "WARN: OpenAI ($HTTP)"; WARNINGS=$((WARNINGS+1)) ;;
  esac
fi

# Anthropic (se presente)
ANTH_KEY=$(grep -E '^ANTHROPIC_API_KEY=' "$ENV" 2>/dev/null | head -1 | cut -d= -f2-)
if [ -n "$ANTH_KEY" ]; then
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: $ANTH_KEY" -H "anthropic-version: 2023-06-01" "https://api.anthropic.com/v1/messages" --max-time 5 2>/dev/null)
  case "$HTTP" in
    200|400) echo "OK: Anthropic" ;; # 400 = missing body, but key is valid
    401|403) echo "FAIL: Anthropic key expirada ($HTTP)"; ERRORS=$((ERRORS+1)) ;;
  esac
fi

# Resumo
echo "---"
echo "Preflight: $ERRORS erros, $WARNINGS avisos"
[ "$ERRORS" -gt 0 ] && echo "ACAO: Rotacionar credenciais antes de rodar testes." && exit 2
[ "$WARNINGS" -gt 0 ] && exit 1
exit 0
