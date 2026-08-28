#!/usr/bin/env bash
# migrate-orphan-docs.sh
# Migra .md em ~/Claude/docs/{specs,diagnosticos,plans,adr,reports}/ para o projeto correto.
#
# Estrategia:
#   1. Listar projetos conhecidos (~/Claude/GitHub/* + ~/Claude/projetos/*)
#   2. Para cada .md:
#      a. Tentar match pelo nome do arquivo (ex: raiz-platform-foo.md -> raiz-platform)
#      b. Se nao casa: grep do conteudo procurando nomes de projeto
#      c. Se ainda ambiguo: marcar para revisao manual
#   3. Modos:
#      --dry-run    (default) so mostra o plano
#      --apply      executa moves
#      --interactive pergunta arquivo a arquivo
#      --orphans-to-workspace  move nao-detectados para ~/Claude/docs/workspace/
#
# Backup: gera bundle git em /tmp antes de tocar workspace docs.

set -uo pipefail

WORKSPACE="$HOME/Claude"
DOCS_ROOT="$WORKSPACE/docs"
WORKSPACE_DEST="$DOCS_ROOT/workspace"

MODE="dry-run"
ORPHANS_POLICY="leave"  # leave | workspace
TARGETS=("specs" "diagnosticos" "plans" "adr" "reports")

usage() {
  cat <<EOF
Uso: $0 [--dry-run | --apply | --interactive] [--orphans-to-workspace]

Migra docs orfaos em ~/Claude/docs/{${TARGETS[*]// /,}}/ para projetos corretos.

Modos:
  --dry-run        (default) imprime o plano sem mover nada
  --apply          executa todos os moves automaticamente
  --interactive    pergunta arquivo a arquivo

Politica para nao-detectados:
  --orphans-to-workspace   move para ~/Claude/docs/workspace/<subdir>/
  (sem flag: deixa onde esta para revisao manual)

Exemplos:
  $0                                # ver plano
  $0 --apply                        # mover detectados, deixar orfaos onde estao
  $0 --apply --orphans-to-workspace # mover tudo
  $0 --interactive                  # confirmar cada arquivo
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)               MODE="dry-run" ;;
    --apply)                 MODE="apply" ;;
    --interactive)           MODE="interactive" ;;
    --orphans-to-workspace)  ORPHANS_POLICY="workspace" ;;
    -h|--help)               usage; exit 0 ;;
    *) echo "Flag desconhecida: $1"; usage; exit 1 ;;
  esac
  shift
done

# Blacklist: nomes muito genericos que causam falso positivo
# (qualquer .md com a palavra "claude" casaria com ~/Claude/projetos/Claude)
BLACKLIST_REGEX='^(Claude|claude|app|web|api|core|lib|src|test|tests|docs|tmp|temp|backup|old|new)$'

# Listar projetos conhecidos (basename only), pulando blacklist
PROJECTS=()
for d in "$WORKSPACE"/GitHub/* "$WORKSPACE"/projetos/*; do
  [ -d "$d" ] || continue
  bn="$(basename "$d")"
  if echo "$bn" | grep -qE "$BLACKLIST_REGEX"; then
    continue
  fi
  PROJECTS+=("$bn:$d")
done

if [ ${#PROJECTS[@]} -eq 0 ]; then
  echo "Nenhum projeto encontrado em ~/Claude/GitHub ou ~/Claude/projetos. Aborta."
  exit 1
fi

# Funcao: detectar projeto para um .md
detect_project() {
  local file="$1"
  local base
  base="$(basename "$file")"
  local lower_base
  lower_base="$(echo "$base" | tr '[:upper:]' '[:lower:]')"

  # 1. Match pelo nome (mais especifico primeiro — ordenar por tamanho desc)
  local best_proj=""
  local best_len=0
  for entry in "${PROJECTS[@]}"; do
    local pname="${entry%%:*}"
    local lower_p
    lower_p="$(echo "$pname" | tr '[:upper:]' '[:lower:]')"
    if echo "$lower_base" | grep -qF "$lower_p"; then
      if [ ${#pname} -gt $best_len ]; then
        best_len=${#pname}
        best_proj="$entry"
      fi
    fi
  done

  if [ -n "$best_proj" ]; then
    echo "$best_proj|name"
    return 0
  fi

  # 2. Grep do conteudo (primeiras 200 linhas) — match SOMENTE path-like
  # (evita false positives em palavras genericas)
  local content
  content="$(head -200 "$file" 2>/dev/null | tr '[:upper:]' '[:lower:]')"
  best_proj=""
  best_len=0
  for entry in "${PROJECTS[@]}"; do
    local pname="${entry%%:*}"
    local lower_p
    lower_p="$(echo "$pname" | tr '[:upper:]' '[:lower:]')"
    # Exigir contexto path-like: GitHub/<proj>, projetos/<proj>, ou <proj>/
    if echo "$content" | grep -qE "(github/$lower_p|projetos/$lower_p|/$lower_p/|^$lower_p/)"; then
      if [ ${#pname} -gt $best_len ]; then
        best_len=${#pname}
        best_proj="$entry"
      fi
    fi
  done

  if [ -n "$best_proj" ]; then
    echo "$best_proj|content"
    return 0
  fi

  echo "|none"
  return 0
}

# Backup pre-flight
TS="$(date +%s)"
BACKUP="/tmp/docs-migration-backup-$TS.tar.gz"
echo "==> Backup pre-flight: $BACKUP"
if [ "$MODE" != "dry-run" ]; then
  tar -czf "$BACKUP" -C "$WORKSPACE" docs/ 2>/dev/null || {
    echo "AVISO: backup falhou. Continuar mesmo assim? (y/N)"
    read -r ans
    [ "$ans" = "y" ] || exit 1
  }
fi

# Stats
TOTAL=0
DETECTED=0
ORPHAN=0
MOVED=0
SKIPPED=0

echo ""
echo "==> Analisando docs em ~/Claude/docs/..."
echo "    Modo: $MODE"
echo "    Orfaos: $ORPHANS_POLICY"
echo ""

for sub in "${TARGETS[@]}"; do
  src_dir="$DOCS_ROOT/$sub"
  [ -d "$src_dir" ] || continue

  # Iterar .md (apenas no nivel direto, nao recursivo — preservar pastas internas existentes)
  while IFS= read -r -d '' file; do
    TOTAL=$((TOTAL + 1))
    rel="${file#$DOCS_ROOT/}"

    result="$(detect_project "$file")"
    proj_entry="${result%|*}"
    src_method="${result##*|}"

    if [ -z "$proj_entry" ] || [ "$src_method" = "none" ]; then
      ORPHAN=$((ORPHAN + 1))
      if [ "$ORPHANS_POLICY" = "workspace" ]; then
        dest="$WORKSPACE_DEST/$rel"
        echo "[orphan->workspace] $rel"
        if [ "$MODE" = "apply" ] || [ "$MODE" = "interactive" ]; then
          [ "$MODE" = "interactive" ] && { echo -n "  mover? (y/n/q): "; read -r a; case "$a" in q) exit 0;; n) SKIPPED=$((SKIPPED+1)); continue;; esac; }
          mkdir -p "$(dirname "$dest")"
          mv "$file" "$dest" && MOVED=$((MOVED + 1))
        fi
      else
        echo "[orphan]              $rel  (nao detectado — manter; usar --orphans-to-workspace para mover)"
        SKIPPED=$((SKIPPED + 1))
      fi
      continue
    fi

    pname="${proj_entry%%:*}"
    ppath="${proj_entry##*:}"
    DETECTED=$((DETECTED + 1))
    dest="$ppath/docs/$sub/$(basename "$file")"

    echo "[$src_method] $pname  <-  $rel"
    echo "             -> $dest"

    if [ "$MODE" = "apply" ] || [ "$MODE" = "interactive" ]; then
      if [ "$MODE" = "interactive" ]; then
        echo -n "  mover? (y/n/q): "
        read -r a
        case "$a" in
          q) echo "  abortado pelo usuario."; break 2 ;;
          n) SKIPPED=$((SKIPPED + 1)); continue ;;
        esac
      fi
      if [ -e "$dest" ]; then
        echo "  AVISO: destino ja existe — pulando (manter manual): $dest"
        SKIPPED=$((SKIPPED + 1))
        continue
      fi
      mkdir -p "$(dirname "$dest")"
      mv "$file" "$dest" && MOVED=$((MOVED + 1))
    fi
  done < <(find "$src_dir" -maxdepth 1 -type f \( -name "*.md" -o -name "*.MD" \) -print0)
done

echo ""
echo "==> Resumo"
echo "    Total analisados: $TOTAL"
echo "    Detectados:       $DETECTED"
echo "    Orfaos:           $ORPHAN"
echo "    Movidos:          $MOVED"
echo "    Pulados:          $SKIPPED"
echo ""

if [ "$MODE" = "dry-run" ]; then
  echo "Modo dry-run — nada foi alterado. Rode com --apply para executar."
fi
