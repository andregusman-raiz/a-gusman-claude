#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
APP_DIR="$(cd "$SCRIPT_DIR/../assets/app" && pwd -P)"
PROJECT_PATH=""
PORT="3006"
MODE="serve"

usage() {
  echo "Uso: markdown-viewer.sh [--project PATH] [--port N] [--check|--init]"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --project)
      [ "$#" -ge 2 ] || { usage >&2; exit 2; }
      PROJECT_PATH="$2"
      shift 2
      ;;
    --port)
      [ "$#" -ge 2 ] || { usage >&2; exit 2; }
      PORT="$2"
      shift 2
      ;;
    --check)
      MODE="check"
      shift
      ;;
    --init)
      MODE="init"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Argumento desconhecido: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
  echo "Porta inválida: $PORT" >&2
  exit 2
fi

if [ -z "$PROJECT_PATH" ]; then
  PROJECT_PATH="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
fi
PROJECT_ROOT="$(cd "$PROJECT_PATH" 2>/dev/null && pwd -P)" || {
  echo "Projeto não encontrado: $PROJECT_PATH" >&2
  exit 2
}

cd "$APP_DIR"
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm ci --silent
fi

if [ "$MODE" = "init" ]; then
  npm run --silent init:project -- "$PROJECT_ROOT"
  exit 0
fi

if [ ! -f "$PROJECT_ROOT/.markdown-viewer.json" ]; then
  echo "Manifesto ausente: $PROJECT_ROOT/.markdown-viewer.json" >&2
  echo "Inicialize com: $0 --project '$PROJECT_ROOT' --init" >&2
  exit 1
fi

if [ "$MODE" = "check" ]; then
  npm run --silent check:project -- "$PROJECT_ROOT"
  exit 0
fi

export MARKDOWN_VIEWER_PROJECT_ROOT="$PROJECT_ROOT"
exec npm run dev -- --hostname 127.0.0.1 --port "$PORT"
