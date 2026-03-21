#!/bin/bash
# parallel-agent-guard.sh — PreToolUse(Bash): Previne conflitos de git entre agents paralelos
# BLOCKING (exit 2) se outro processo Claude ja tem lock no mesmo repo
# Lock: /tmp/claude-git-locks/[repo-hash].lock
INPUT="${CLAUDE_TOOL_INPUT:-}"
# So atua em git commit ou git push
if [[ "$INPUT" != *"git commit"* ]] && [[ "$INPUT" != *"git push"* ]]; then
  exit 0
fi

# Extrair o repo path do comando (tenta -C primeiro, depois usa git rev-parse no CWD)
REPO_PATH=""
if [[ "$INPUT" =~ git\ -C\ ([^\ ]+) ]]; then
  REPO_PATH="${BASH_REMATCH[1]}"
fi
if [[ -z "$REPO_PATH" ]]; then
  REPO_PATH=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
fi
if [[ -z "$REPO_PATH" ]]; then
  exit 0  # Nao e um repo git, deixar o proprio git falhar
fi

# Hash do repo path (para nome do lock file)
REPO_HASH=$(echo "$REPO_PATH" | shasum | cut -c1-8)
LOCK_DIR="/tmp/claude-git-locks"
LOCK_FILE="$LOCK_DIR/${REPO_HASH}.lock"

mkdir -p "$LOCK_DIR"

# Verificar se lock existente e valido (processo ainda vivo e dentro de 30s de timeout)
if [[ -f "$LOCK_FILE" ]]; then
  LOCK_PPID=$(cut -d: -f1 "$LOCK_FILE" 2>/dev/null || echo "")
  LOCK_TIME=$(cut -d: -f2 "$LOCK_FILE" 2>/dev/null || echo "0")
  NOW=$(date +%s)
  AGE=$(( NOW - LOCK_TIME ))
  # Se lock expirou (> 30s), remover
  if [[ $AGE -gt 30 ]]; then
    rm -f "$LOCK_FILE"
  # Se processo ainda vivo e lock recente, bloquear
  elif [[ -n "$LOCK_PPID" ]] && kill -0 "$LOCK_PPID" 2>/dev/null && [[ "$LOCK_PPID" != "$$" ]] && [[ "$LOCK_PPID" != "$PPID" ]]; then
    REPO_NAME=$(basename "$REPO_PATH")
    echo "BLOCKED: Agent paralelo (PID $LOCK_PPID) ja esta executando git no repo '$REPO_NAME'."
    echo "Aguarde o outro agent terminar ou remova o lock: rm $LOCK_FILE"
    exit 2
  fi
fi

# Criar lock com PPID + timestamp
echo "${PPID}:$(date +%s)" > "$LOCK_FILE"

exit 0
